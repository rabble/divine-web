// ABOUTME: Hook for searching NIP-71 video events (kinds 21, 22, 34236) with content, hashtag, and author filters
// ABOUTME: Supports debounced queries, case-insensitive search, NIP-50 full-text search, and multiple search modes

import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { VIDEO_KINDS, type ParsedVideoData } from '@/types/video';
import { parseVideoEvent, getVineId, getThumbnailUrl, getOriginalVineTimestamp, getLoopCount, getProofModeData, getOriginalLikeCount, getOriginalRepostCount, getOriginalCommentCount, getOriginPlatform, isVineMigrated } from '@/lib/videoParser';
import type { NIP50Filter, SortMode } from '@/types/nostr';

interface UseSearchVideosOptions {
  query: string;
  searchType?: 'content' | 'author' | 'auto';
  sortMode?: SortMode;
  limit?: number;
}

/**
 * Validates that a NIP-71 video event (kinds 21, 22, or 34236) has required fields
 */
function validateVideoEvent(event: NostrEvent): boolean {
  if (!VIDEO_KINDS.includes(event.kind)) return false;

  // Must have d tag for addressability
  const vineId = getVineId(event);
  if (!vineId) return false;

  return true;
}

/**
 * Parse video events into standardized format
 */
function parseVideoResults(events: NostrEvent[]): ParsedVideoData[] {
  const parsedVideos: ParsedVideoData[] = [];

  for (const event of events) {
    if (!validateVideoEvent(event)) continue;

    const videoEvent = parseVideoEvent(event);
    if (!videoEvent) continue;

    const vineId = getVineId(event);
    if (!vineId) continue;

    parsedVideos.push({
      id: event.id,
      pubkey: event.pubkey,
      kind: event.kind as 21 | 22 | 34236,
      createdAt: event.created_at,
      originalVineTimestamp: getOriginalVineTimestamp(event),
      content: event.content,
      videoUrl: videoEvent.videoMetadata!.url,
      fallbackVideoUrls: videoEvent.videoMetadata?.fallbackUrls,
      hlsUrl: videoEvent.videoMetadata?.hlsUrl,
      thumbnailUrl: getThumbnailUrl(videoEvent),
      title: videoEvent.title,
      duration: videoEvent.videoMetadata?.duration,
      hashtags: videoEvent.hashtags || [],
      vineId,
      loopCount: getLoopCount(event),
      likeCount: getOriginalLikeCount(event),
      repostCount: getOriginalRepostCount(event),
      commentCount: getOriginalCommentCount(event),
      proofMode: getProofModeData(event),
      origin: getOriginPlatform(event),
      isVineMigrated: isVineMigrated(event),
      reposts: [] // Search results don't include repost data
    });
  }

  return parsedVideos.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Determine search type and prepare query
 */
function parseSearchQuery(query: string, searchType: 'content' | 'author' | 'auto') {
  const trimmedQuery = query.trim();

  if (searchType === 'author') {
    return { type: 'author', value: trimmedQuery };
  }

  if (searchType === 'content') {
    if (trimmedQuery.startsWith('#')) {
      return { type: 'hashtag', value: trimmedQuery.slice(1).toLowerCase() };
    }
    return { type: 'content', value: trimmedQuery };
  }

  // Auto detection
  if (trimmedQuery.startsWith('#')) {
    return { type: 'hashtag', value: trimmedQuery.slice(1).toLowerCase() };
  }

  return { type: 'content', value: trimmedQuery };
}

/**
 * Search videos by content, hashtags, or author
 * Uses NIP-50 full-text search with optional sort modes
 */
export function useSearchVideos(options: UseSearchVideosOptions) {
  const { nostr } = useNostr();
  const { query, searchType = 'auto', sortMode = 'hot', limit = 50 } = options;

  // Debounce the query - disable in test environment
  const isTest = process.env.NODE_ENV === 'test';
  const debounceDelay = isTest ? 0 : 300;

  const debouncedQuery = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return new Promise<string>((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => resolve(query), debounceDelay);
    });
  }, [query, debounceDelay]);

  return useQuery({
    queryKey: ['search-videos', query, searchType, sortMode, limit],
    queryFn: async (context) => {
      // Wait for debounced query
      const actualQuery = await debouncedQuery;

      if (!actualQuery.trim()) {
        return [];
      }

      const signal = AbortSignal.any([
        context.signal,
        AbortSignal.timeout(8000)
      ]);

      const searchParams = parseSearchQuery(actualQuery, searchType);

      if (searchParams.type === 'hashtag') {
        // Search by hashtag with NIP-50 sorting
        const filter: NIP50Filter = {
          kinds: VIDEO_KINDS,
          '#t': [searchParams.value],
          search: `sort:${sortMode}`,
          limit,
        };
        const events = await nostr.query([filter], { signal });

        return parseVideoResults(events);
      }

      if (searchParams.type === 'author') {
        // First search for users matching the query
        const userEvents = await nostr.query([{
          kinds: [0],
          search: searchParams.value,
          limit: 20,
        }], { signal });

        // Extract pubkeys of matching users
        const matchingPubkeys = userEvents
          .filter(event => {
            try {
              const metadata = JSON.parse(event.content);
              const searchValue = searchParams.value.toLowerCase();
              return (
                metadata.name?.toLowerCase().includes(searchValue) ||
                metadata.display_name?.toLowerCase().includes(searchValue) ||
                metadata.nip05?.toLowerCase().includes(searchValue) ||
                metadata.about?.toLowerCase().includes(searchValue)
              );
            } catch {
              return false;
            }
          })
          .map(event => event.pubkey);

        if (matchingPubkeys.length === 0) {
          return [];
        }

        // Search for videos by these authors
        const videoEvents = await nostr.query([{
          kinds: VIDEO_KINDS,
          authors: matchingPubkeys,
          limit,
        }], { signal });

        return parseVideoResults(videoEvents);
      }

      // Content search - use NIP-50 full-text search with sort mode
      const filter: NIP50Filter = {
        kinds: VIDEO_KINDS,
        search: `sort:${sortMode} ${searchParams.value}`,
        limit,
      };

      let events: NostrEvent[];

      try {
        // Use NIP-50 search with combined sort and content query
        events = await nostr.query([filter], { signal });
      } catch {
        // Fallback: get recent videos and filter client-side if relay doesn't support NIP-50
        console.warn('NIP-50 search not supported, falling back to client-side filtering');
        events = await nostr.query([{
          kinds: VIDEO_KINDS,
          limit: Math.min(limit * 5, 500),
        }], { signal });

        // Client-side filtering
        const searchValue = searchParams.value.toLowerCase();
        events = events.filter(event =>
          event.content.toLowerCase().includes(searchValue)
        );
      }

      return parseVideoResults(events);
    },
    enabled: !!query.trim(),
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
}
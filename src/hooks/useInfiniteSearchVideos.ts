// ABOUTME: Infinite scroll search hook for video events
// ABOUTME: Supports NIP-50 full-text search with cursor-based pagination

import { useInfiniteQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useNIP50Support } from '@/hooks/useRelayCapabilities';
import { useMemo } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { VIDEO_KINDS, type ParsedVideoData } from '@/types/video';
import type { NIP50Filter, SortMode } from '@/types/nostr';
import { parseVideoEvent, getVineId, getThumbnailUrl, getOriginalVineTimestamp, getLoopCount, getProofModeData, getOriginalLikeCount, getOriginalRepostCount, getOriginalCommentCount, getOriginPlatform, isVineMigrated } from '@/lib/videoParser';
import { debugLog } from '@/lib/debug';

interface UseInfiniteSearchVideosOptions {
  query: string;
  searchType?: 'content' | 'author' | 'auto';
  sortMode?: SortMode | 'relevance';
  pageSize?: number;
}

interface VideoPage {
  videos: ParsedVideoData[];
  nextCursor: number | undefined;
}

/**
 * Validates that a video event (kind 34236) has required fields
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
function parseVideoEvents(events: NostrEvent[]): ParsedVideoData[] {
  const parsedVideos: ParsedVideoData[] = [];

  for (const event of events) {
    if (!validateVideoEvent(event)) continue;

    const videoEvent = parseVideoEvent(event);
    if (!videoEvent) continue;

    const vineId = getVineId(event);
    if (!vineId && event.kind === 34236) continue;

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
      reposts: []
    });
  }

  return parsedVideos;
}

/**
 * Parse search query to determine type
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
 * Infinite scroll search hook
 * Uses NIP-50 full-text search with cursor-based pagination
 */
export function useInfiniteSearchVideos({
  query,
  searchType = 'auto',
  sortMode = 'relevance',
  pageSize = 20
}: UseInfiniteSearchVideosOptions) {
  const { nostr } = useNostr();
  const supportsNIP50 = useNIP50Support();

  // Debounce query
  const isTest = process.env.NODE_ENV === 'test';
  const debounceDelay = isTest ? 0 : 300;

  const debouncedQuery = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return new Promise<string>((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => resolve(query), debounceDelay);
    });
  }, [query, debounceDelay]);

  return useInfiniteQuery<VideoPage, Error>({
    queryKey: ['infinite-search-videos', query, searchType, sortMode, pageSize],
    queryFn: async ({ pageParam, signal }) => {
      // Wait for debounced query
      const actualQuery = await debouncedQuery;

      if (!actualQuery.trim()) {
        return { videos: [], nextCursor: undefined };
      }

      const cursor = pageParam as number | undefined;
      const searchParams = parseSearchQuery(actualQuery, searchType);

      const abortSignal = AbortSignal.any([
        signal,
        AbortSignal.timeout(8000)
      ]);

      let filter: NIP50Filter;

      if (searchParams.type === 'hashtag') {
        // Hashtag search with NIP-50 sorting (if supported)
        filter = {
          kinds: VIDEO_KINDS,
          '#t': [searchParams.value],
          limit: pageSize
        };

        // Add sort mode for NIP-50 relays (only if not relevance)
        if (supportsNIP50 && sortMode !== 'relevance') {
          filter.search = `sort:${sortMode}`;
        }

        if (cursor) {
          filter.until = cursor;
        }

        const events = await nostr.query([filter], { signal: abortSignal });
        const videos = parseVideoEvents(events);

        return {
          videos,
          nextCursor: videos.length > 0 ? videos[videos.length - 1].createdAt - 1 : undefined
        };
      }

      if (searchParams.type === 'author') {
        // Author search - find matching users first, then their videos
        const userFilter: NIP50Filter = {
          kinds: [0],
          search: searchParams.value,
          limit: 20
        };

        const userEvents = await nostr.query([userFilter], { signal: abortSignal });

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
          return { videos: [], nextCursor: undefined };
        }

        filter = {
          kinds: VIDEO_KINDS,
          authors: matchingPubkeys,
          limit: pageSize
        };

        if (cursor) {
          filter.until = cursor;
        }

        const videoEvents = await nostr.query([filter], { signal: abortSignal });
        const videos = parseVideoEvents(videoEvents);

        return {
          videos,
          nextCursor: videos.length > 0 ? videos[videos.length - 1].createdAt - 1 : undefined
        };
      }

      // Content search with NIP-50 full-text (if supported)
      filter = {
        kinds: VIDEO_KINDS,
        limit: pageSize
      };

      if (cursor) {
        filter.until = cursor;
      }

      // Use NIP-50 search if supported, otherwise fallback to client-side
      if (supportsNIP50) {
        // For relevance (default), just use the search term
        // For other sort modes, prepend the sort directive
        if (sortMode === 'relevance') {
          filter.search = searchParams.value;
        } else {
          filter.search = `sort:${sortMode} ${searchParams.value}`;
        }

        try {
          const events = await nostr.query([filter], { signal: abortSignal });
          const videos = parseVideoEvents(events);

          return {
            videos,
            nextCursor: videos.length > 0 ? videos[videos.length - 1].createdAt - 1 : undefined
          };
        } catch (error) {
          debugLog('[useInfiniteSearchVideos] NIP-50 query failed:', error);
          // Fall through to client-side fallback
        }
      }

      // Fallback for relays without NIP-50 or if NIP-50 query failed
      debugLog('[useInfiniteSearchVideos] Using client-side search fallback');

      const fallbackFilter = {
        kinds: VIDEO_KINDS,
        limit: pageSize
      };

      if (cursor) {
        (fallbackFilter as typeof fallbackFilter & { until: number }).until = cursor;
      }

      const events = await nostr.query([fallbackFilter], { signal: abortSignal });

      // Client-side filtering
      const searchValue = searchParams.value.toLowerCase();
      const filtered = events.filter(event =>
        event.content.toLowerCase().includes(searchValue)
      );

      const videos = parseVideoEvents(filtered);

      return {
        videos,
        nextCursor: videos.length > 0 ? videos[videos.length - 1].createdAt - 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
    enabled: !!query.trim() && !!nostr,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
}

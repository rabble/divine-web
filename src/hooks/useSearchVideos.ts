// ABOUTME: Hook for searching Kind 34236 (NIP-71) video events with content, hashtag, and author filters
// ABOUTME: Supports debounced queries, case-insensitive search, and multiple search modes

import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { VIDEO_KIND, type ParsedVideoData } from '@/types/video';
import { parseVideoEvent, getVineId, getThumbnailUrl, getOriginalVineTimestamp, getLoopCount, getProofModeData } from '@/lib/videoParser';

interface UseSearchVideosOptions {
  query: string;
  searchType?: 'content' | 'author' | 'auto';
  limit?: number;
}

/**
 * Validates that a Kind 34236 (NIP-71) event has required fields
 */
function validateVideoEvent(event: NostrEvent): boolean {
  if (event.kind !== VIDEO_KIND) return false;
  
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
      createdAt: event.created_at,
      originalVineTimestamp: getOriginalVineTimestamp(event),
      content: event.content,
      videoUrl: videoEvent.videoMetadata!.url,
      fallbackVideoUrls: videoEvent.videoMetadata?.fallbackUrls,
      thumbnailUrl: getThumbnailUrl(videoEvent),
      title: videoEvent.title,
      duration: videoEvent.videoMetadata?.duration,
      hashtags: videoEvent.hashtags || [],
      isRepost: false,
      vineId,
      loopCount: getLoopCount(event),
      proofMode: getProofModeData(event)
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
 */
export function useSearchVideos(options: UseSearchVideosOptions) {
  const { nostr } = useNostr();
  const { query, searchType = 'auto', limit = 50 } = options;
  
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
    queryKey: ['search-videos', query, searchType, limit],
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
        // Search by hashtag
        const events = await nostr.query([{
          kinds: [VIDEO_KIND],
          '#t': [searchParams.value],
          limit,
        }], { signal });
        
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
          kinds: [VIDEO_KIND],
          authors: matchingPubkeys,
          limit,
        }], { signal });
        
        return parseVideoResults(videoEvents);
      }
      
      // Content search - use search filter if available, fallback to client-side filtering
      let events: NostrEvent[];
      
      try {
        // Try relay-level search first
        events = await nostr.query([{
          kinds: [VIDEO_KIND],
          search: searchParams.value,
          limit,
        }], { signal });
      } catch {
        // Fallback: get recent videos and filter client-side
        events = await nostr.query([{
          kinds: [VIDEO_KIND],
          limit: Math.min(limit * 5, 500), // Get more to filter from
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
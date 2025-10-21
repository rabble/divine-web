// ABOUTME: Hook for searching hashtags across video events with usage counts and autocomplete
// ABOUTME: Aggregates hashtag data from recent videos and provides filtered suggestions

import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { VIDEO_KIND } from '@/types/video';

interface UseSearchHashtagsOptions {
  query: string;
  limit?: number;
  daysBack?: number; // How many days back to search for hashtags
}

interface HashtagResult {
  tag: string;
  count: number;
}

/**
 * Extract hashtags from video events and count usage
 */
function extractHashtagCounts(events: NostrEvent[]): Map<string, number> {
  const hashtagCounts = new Map<string, number>();

  events.forEach(event => {
    // Extract 't' tags (hashtags)
    const hashtags = event.tags
      .filter(tag => tag[0] === 't' && tag[1])
      .map(tag => tag[1]);

    hashtags.forEach(hashtag => {
      const count = hashtagCounts.get(hashtag) || 0;
      hashtagCounts.set(hashtag, count + 1);
    });
  });

  return hashtagCounts;
}

/**
 * Filter hashtags by search query
 */
function filterHashtagsByQuery(hashtags: HashtagResult[], query: string): HashtagResult[] {
  if (!query.trim()) {
    return hashtags;
  }
  
  const searchValue = query.toLowerCase();
  
  return hashtags.filter(hashtag =>
    hashtag.tag.toLowerCase().includes(searchValue)
  );
}

/**
 * Search hashtags across video events with usage counts
 */
export function useSearchHashtags(options: UseSearchHashtagsOptions) {
  const { nostr } = useNostr();
  const { query, limit = 20, daysBack = 7 } = options;
  
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
    queryKey: ['search-hashtags', query, limit, daysBack],
    queryFn: async (context) => {
      // Wait for debounced query
      const actualQuery = await debouncedQuery;
      
      const signal = AbortSignal.any([
        context.signal,
        AbortSignal.timeout(10000)
      ]);
      
      // Get recent videos to extract hashtags from
      const since = Math.floor(Date.now() / 1000) - (daysBack * 24 * 60 * 60);
      
      const events = await nostr.query([{
        kinds: [VIDEO_KIND],
        since,
        limit: 100, // Reduced for performance while maintaining decent hashtag coverage
      }], { signal });
      
      // Extract and count hashtags
      const hashtagCounts = extractHashtagCounts(events);

      // Convert to array and sort by usage count
      const allHashtags: HashtagResult[] = Array.from(hashtagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => {
          // Sort by count descending, then alphabetically
          if (a.count !== b.count) {
            return b.count - a.count;
          }
          return a.tag.localeCompare(b.tag);
        });
      
      // Filter by search query
      const filteredHashtags = filterHashtagsByQuery(allHashtags, actualQuery);
      
      // Apply limit
      return filteredHashtags.slice(0, limit);
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
}
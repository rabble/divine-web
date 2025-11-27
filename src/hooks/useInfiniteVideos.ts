// ABOUTME: Infinite scroll hook for video feeds with cursor-based pagination
// ABOUTME: Uses NIP-50 search for sorting and supports all feed types

import { useInfiniteQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useFollowList } from '@/hooks/useFollowList';
import { useAppContext } from '@/hooks/useAppContext';
import { useNIP50Support } from '@/hooks/useRelayCapabilities';
import { VIDEO_KINDS, type ParsedVideoData } from '@/types/video';
import type { NIP50Filter, SortMode } from '@/types/nostr';
import { parseVideoEvents } from '@/lib/videoParser';
import { debugLog } from '@/lib/debug';
import { performanceMonitor } from '@/lib/performanceMonitoring';

interface UseInfiniteVideosOptions {
  feedType: 'discovery' | 'home' | 'trending' | 'hashtag' | 'profile' | 'recent';
  hashtag?: string;
  pubkey?: string;
  pageSize?: number;
  sortMode?: SortMode;
  enabled?: boolean;
}

interface VideoPage {
  videos: ParsedVideoData[];
  nextCursor: number | undefined;
}

/**
 * Infinite scroll hook for video feeds
 * Uses cursor-based pagination with NIP-50 search
 */
export function useInfiniteVideos({
  feedType,
  hashtag,
  pubkey,
  pageSize = 20,
  sortMode,
  enabled = true
}: UseInfiniteVideosOptions) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { data: followList, isLoading: isLoadingFollows } = useFollowList();
  const { config } = useAppContext();
  const supportsNIP50 = useNIP50Support();

  // Auto-determine sort mode ONLY for trending/discovery feeds
  // Home feed should always be chronological unless explicitly sorted
  let requestedSortMode = sortMode;
  if (!sortMode && feedType === 'trending') {
    requestedSortMode = 'hot';
  }

  // Only use sort mode if relay supports NIP-50 AND a sort mode is requested
  const effectiveSortMode = (supportsNIP50 && requestedSortMode) ? requestedSortMode : undefined;

  if (!supportsNIP50 && requestedSortMode) {
    debugLog(`[useInfiniteVideos] Relay doesn't support NIP-50, will use chronological order instead of sort:${requestedSortMode}`);
  }

  return useInfiniteQuery<VideoPage, Error>({
    queryKey: ['infinite-videos', feedType, hashtag, pubkey, effectiveSortMode, pageSize],
    queryFn: async ({ pageParam, signal }) => {
      const totalStart = performance.now();
      const cursor = pageParam as number | undefined;

      // Build filter based on feed type
      const filter: NIP50Filter = {
        kinds: VIDEO_KINDS,
        limit: pageSize
      };

      // Add cursor for pagination
      if (cursor) {
        filter.until = cursor;
      }

      // Filter for Classic (archived Vines) when top sort is selected
      if (effectiveSortMode === 'top') {
        filter['#platform'] = ['vine'];
        debugLog('[useInfiniteVideos] 🎬 Classic mode: filtering for archived Vines only');
      }

      // Configure based on feed type
      switch (feedType) {
        case 'hashtag':
          if (!hashtag) throw new Error('Hashtag required for hashtag feed');
          filter['#t'] = [hashtag.toLowerCase()];
          // Only add search if relay supports NIP-50
          if (effectiveSortMode) {
            filter.search = `sort:${effectiveSortMode}`;
          }
          break;

        case 'profile':
          if (!pubkey) throw new Error('Pubkey required for profile feed');
          filter.authors = [pubkey];
          break;

        case 'home':
          if (!user?.pubkey) {
            debugLog('[useInfiniteVideos] No user logged in for home feed');
            return { videos: [], nextCursor: undefined };
          }
          if (isLoadingFollows) {
            debugLog('[useInfiniteVideos] Still loading follow list, waiting...');
            return { videos: [], nextCursor: undefined };
          }
          if (!followList || followList.length === 0) {
            debugLog('[useInfiniteVideos] User has no follows, returning empty feed');
            return { videos: [], nextCursor: undefined };
          }
          debugLog(`[useInfiniteVideos] Home feed: user ${user.pubkey} following ${followList.length} accounts`);
          debugLog(`[useInfiniteVideos] First 5 follows:`, followList.slice(0, 5));
          filter.authors = followList;
          // Only add search if relay supports NIP-50
          if (effectiveSortMode) {
            filter.search = `sort:${effectiveSortMode}`;
          }
          break;

        case 'trending':
          // Only add search if relay supports NIP-50
          if (effectiveSortMode) {
            debugLog(`[useInfiniteVideos] 🔥 Trending feed with sort mode: ${effectiveSortMode}`);
            filter.search = `sort:${effectiveSortMode}`;
          } else {
            debugLog('[useInfiniteVideos] ⚠️ Trending feed WITHOUT sort mode (relay may not support NIP-50)');
          }
          break;

        case 'discovery':
          // Only add search if relay supports NIP-50 and a sort mode is provided
          if (effectiveSortMode) {
            debugLog(`[useInfiniteVideos] 🔍 Discovery feed with sort mode: ${effectiveSortMode}`);
            filter.search = `sort:${effectiveSortMode}`;
          } else {
            debugLog('[useInfiniteVideos] ⚠️ Discovery feed in chronological order (no sort mode)');
          }
          break;

        case 'recent':
          // Explicitly request chronological order (no sort parameter)
          // NIP-50 relays should return events in reverse chronological order by default
          // when no search/sort is specified
          debugLog('[useInfiniteVideos] 🕐 Recent feed - requesting chronological order (no sort)');
          break;
      }

      debugLog(`[useInfiniteVideos] 📡 Fetching ${feedType} feed, cursor: ${cursor || 'none'}, sort: ${effectiveSortMode || 'none'}, filter:`, filter);

      // Fetch events with performance tracking
      const queryStart = performance.now();
      const events = await nostr.query([filter], {
        signal: AbortSignal.any([
          signal,
          AbortSignal.timeout(10000)
        ])
      });
      const queryTime = performance.now() - queryStart;

      // Record query performance
      performanceMonitor.recordQuery({
        relayUrl: config.relayUrl,
        queryType: `infinite-${feedType}`,
        duration: queryTime,
        eventCount: events.length,
        filters: JSON.stringify(filter)
      });

      debugLog(`[useInfiniteVideos] Got ${events.length} events for ${feedType} in ${queryTime.toFixed(0)}ms`);

      // Log the first few events to see what we're getting
      if (events.length > 0) {
        debugLog(`[useInfiniteVideos] First 3 events timestamps:`,
          events.slice(0, 3).map(e => ({
            created_at: e.created_at,
            date: new Date(e.created_at * 1000).toISOString(),
            id: e.id.substring(0, 8)
          }))
        );
      }

      // Parse and filter
      const parseStart = performance.now();
      let videos = parseVideoEvents(events);

      // Sort Classic Vines by loop count (original Vine popularity metric)
      // NIP-50's 'top' sort uses Nostr engagement, not original Vine loops
      if (effectiveSortMode === 'top' && feedType === 'trending') {
        videos = videos.sort((a, b) => {
          const aLoops = a.loopCount || 0;
          const bLoops = b.loopCount || 0;
          return bLoops - aLoops; // Descending order (most loops first)
        });
        debugLog(`[useInfiniteVideos] 🔄 Sorted ${videos.length} Classic Vines by loop count`);
      }

      const parseTime = performance.now() - parseStart;

      const totalTime = performance.now() - totalStart;

      // Record feed load timing for this page
      performanceMonitor.recordFeedLoad({
        feedType,
        queryTime,
        parseTime,
        totalTime,
        videoCount: videos.length,
        sortMode: effectiveSortMode,
      });

      // Determine next cursor
      const nextCursor = videos.length > 0
        ? videos[videos.length - 1].createdAt - 1
        : undefined;

      return {
        videos,
        nextCursor
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
    enabled: enabled && !!nostr && (feedType !== 'home' || (!!user?.pubkey && !isLoadingFollows)),
    staleTime: 60000, // 1 minute
    gcTime: 600000, // 10 minutes
  });
}

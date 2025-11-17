// ABOUTME: Infinite scroll hook for video feeds with cursor-based pagination
// ABOUTME: Uses NIP-50 search for sorting and supports all feed types

import { useInfiniteQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useFollowList } from '@/hooks/useFollowList';
import { useAppContext } from '@/hooks/useAppContext';
import { useNIP50Support } from '@/hooks/useRelayCapabilities';
import type { NostrEvent } from '@nostrify/nostrify';
import { VIDEO_KINDS, type ParsedVideoData } from '@/types/video';
import type { NIP50Filter, SortMode } from '@/types/nostr';
import { parseVideoEvent, getVineId, getThumbnailUrl, getOriginalVineTimestamp, getLoopCount, getProofModeData, getOriginalLikeCount, getOriginalRepostCount, getOriginalCommentCount, getOriginPlatform, isVineMigrated } from '@/lib/videoParser';
import { deletionService } from '@/lib/deletionService';
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
 * Validates that a video event (kind 34236) has required fields
 */
function validateVideoEvent(event: NostrEvent): boolean {
  if (!VIDEO_KINDS.includes(event.kind)) return false;

  // Must have d tag for addressability
  const vineId = getVineId(event);
  if (!vineId) {
    debugLog('[validateVideoEvent] Kind 34236 event missing required d tag:', event.id);
    return false;
  }

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

  // Auto-determine sort mode if not specified
  const requestedSortMode = sortMode || (feedType === 'trending' ? 'hot' : 'top');

  // Only use sort mode if relay supports NIP-50
  const effectiveSortMode = supportsNIP50 ? requestedSortMode : undefined;

  if (!supportsNIP50 && requestedSortMode) {
    debugLog(`[useInfiniteVideos] Relay doesn't support NIP-50, will use client-side sorting fallback`);
  }

  return useInfiniteQuery<VideoPage, Error>({
    queryKey: ['infinite-videos', feedType, hashtag, pubkey, effectiveSortMode, pageSize],
    queryFn: async ({ pageParam, signal }) => {
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
          // Only add search if relay supports NIP-50
          if (effectiveSortMode) {
            // Use the requested sort mode, defaulting to 'top' for discovery
            const discoverySort = sortMode || 'top';
            debugLog(`[useInfiniteVideos] 🔍 Discovery feed with sort mode: ${discoverySort}`);
            filter.search = `sort:${discoverySort}`;
          } else {
            debugLog('[useInfiniteVideos] ⚠️ Discovery feed WITHOUT sort mode (relay may not support NIP-50)');
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
      let videos = parseVideoEvents(events);

      // Filter deleted videos if configured
      if (!config.showDeletedVideos) {
        const beforeFilter = videos.length;
        videos = videos.filter(video => !deletionService.isDeleted(video.id));
        const deletedCount = beforeFilter - videos.length;
        if (deletedCount > 0) {
          debugLog(`[useInfiniteVideos] Filtered ${deletedCount} deleted videos`);
        }
      }

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

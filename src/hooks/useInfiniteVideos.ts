// ABOUTME: Infinite scroll hook for video feeds with cursor-based pagination
// ABOUTME: Uses NIP-50 search for sorting and supports all feed types

import { useInfiniteQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useFollowList } from '@/hooks/useFollowList';
import { useAppContext } from '@/hooks/useAppContext';
import type { NostrEvent } from '@nostrify/nostrify';
import { VIDEO_KINDS, type ParsedVideoData } from '@/types/video';
import type { NIP50Filter, SortMode } from '@/types/nostr';
import { parseVideoEvent, getVineId, getThumbnailUrl, getOriginalVineTimestamp, getLoopCount, getProofModeData, getOriginalLikeCount, getOriginalRepostCount, getOriginalCommentCount, getOriginPlatform, isVineMigrated } from '@/lib/videoParser';
import { deletionService } from '@/lib/deletionService';
import { debugLog } from '@/lib/debug';

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
 * Validates that a NIP-71 video event has required fields
 */
function validateVideoEvent(event: NostrEvent): boolean {
  if (!VIDEO_KINDS.includes(event.kind)) return false;

  if (event.kind === 34236) {
    const vineId = getVineId(event);
    if (!vineId) {
      debugLog('[validateVideoEvent] Kind 34236 event missing required d tag:', event.id);
      return false;
    }
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
  const user = useCurrentUser();
  const { followList } = useFollowList();
  const { config } = useAppContext();

  // Auto-determine sort mode if not specified
  const effectiveSortMode = sortMode || (feedType === 'trending' ? 'hot' : 'top');

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
          filter.search = `sort:${effectiveSortMode}`;
          break;

        case 'profile':
          if (!pubkey) throw new Error('Pubkey required for profile feed');
          filter.authors = [pubkey];
          break;

        case 'home':
          if (!user?.pubkey) throw new Error('User must be logged in for home feed');
          if (!followList || followList.length === 0) {
            debugLog('[useInfiniteVideos] User has no follows, returning empty feed');
            return { videos: [], nextCursor: undefined };
          }
          filter.authors = followList;
          filter.search = `sort:${effectiveSortMode}`;
          break;

        case 'trending':
          filter.search = 'sort:hot';
          break;

        case 'discovery':
          filter.search = 'sort:top';
          break;

        case 'recent':
          // No search parameter - chronological by created_at
          break;
      }

      debugLog(`[useInfiniteVideos] Fetching ${feedType} feed, cursor: ${cursor || 'none'}`);

      // Fetch events
      const events = await nostr.query([filter], { 
        signal: AbortSignal.any([
          signal,
          AbortSignal.timeout(10000)
        ]) 
      });

      debugLog(`[useInfiniteVideos] Got ${events.length} events`);

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
    enabled: enabled && !!nostr && (feedType !== 'home' || !!user?.pubkey),
    staleTime: 60000, // 1 minute
    gcTime: 600000, // 10 minutes
  });
}

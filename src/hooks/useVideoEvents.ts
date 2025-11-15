// ABOUTME: Hook for querying and managing video events from Nostr relays
// ABOUTME: Handles NIP-71 videos (kinds 21, 22, 34236) and Kind 6 reposts with proper parsing

import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { VIDEO_KINDS, REPOST_KIND, type ParsedVideoData } from '@/types/video';
import { parseVideoEvent, getVineId, getThumbnailUrl, getLoopCount, getOriginalVineTimestamp, getProofModeData, getOriginalLikeCount, getOriginalRepostCount, getOriginalCommentCount } from '@/lib/videoParser';
import { debugLog, debugError, verboseLog } from '@/lib/debug';

interface UseVideoEventsOptions {
  filter?: Partial<NostrFilter>;
  feedType?: 'discovery' | 'home' | 'trending' | 'hashtag' | 'profile' | 'recent';
  hashtag?: string;
  pubkey?: string;
  limit?: number;
  until?: number; // For pagination - get videos before this timestamp
}

/**
 * Validates that a NIP-71 video event (kinds 21, 22, or 34236) has required fields
 */
function validateVideoEvent(event: NostrEvent): boolean {
  if (!VIDEO_KINDS.includes(event.kind)) return false;

  // Kind 34236 (addressable/replaceable event) MUST have d tag per NIP-33
  // Kinds 21 and 22 are regular events and don't require d tag
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
 * Fetch user's follow list (Kind 3 event)
 */
async function fetchFollowList(
  nostr: { query: (filters: NostrFilter[], options: { signal: AbortSignal }) => Promise<NostrEvent[]> },
  pubkey: string,
  signal: AbortSignal
): Promise<string[]> {
  try {
    const followEvents = await nostr.query([{
      kinds: [3],
      authors: [pubkey],
      limit: 1
    }], { signal });

    if (followEvents.length === 0) return [];

    // Extract followed pubkeys from 'p' tags
    const follows = followEvents[0].tags
      .filter(tag => tag[0] === 'p' && tag[1])
      .map(tag => tag[1]);

    return follows;
  } catch {
    return [];
  }
}

/**
 * Get reaction counts for videos to determine trending
 */
async function getReactionCounts(
  nostr: { query: (filters: NostrFilter[], options: { signal: AbortSignal }) => Promise<NostrEvent[]> },
  videoIds: string[],
  since: number,
  signal: AbortSignal
): Promise<Record<string, number>> {
  if (videoIds.length === 0) return {};

  try {
    // Query for reactions (kind 7) and reposts (kind 6) to these videos
    const reactions = await nostr.query([{
      kinds: [6, 7], // Reposts and reactions
      '#e': videoIds,
      since, // Only count recent reactions
      limit: 100 // Optimized for performance
    }], { signal });

    // Count reactions per video
    const counts: Record<string, number> = {};
    reactions.forEach(reaction => {
      reaction.tags.forEach(tag => {
        if (tag[0] === 'e' && tag[1]) {
          counts[tag[1]] = (counts[tag[1]] || 0) + 1;
        }
      });
    });

    return counts;
  } catch {
    return {};
  }
}

/**
 * Parse video events and handle reposts
 */
async function parseVideoEvents(
  events: NostrEvent[],
  nostr: { query: (filters: NostrFilter[], options: { signal: AbortSignal }) => Promise<NostrEvent[]> },
  sortChronologically = false
): Promise<ParsedVideoData[]> {
  const parsedVideos: ParsedVideoData[] = [];

  // Separate videos and reposts
  const videoEvents = events.filter(e => VIDEO_KINDS.includes(e.kind));
  const repostEvents = events.filter(e => e.kind === REPOST_KIND);

  debugLog(`[useVideoEvents] Processing ${videoEvents.length} videos and ${repostEvents.length} reposts`);

  let validVideos = 0;
  let invalidVideos = 0;

  // Process direct video events
  for (const event of videoEvents) {
    if (!validateVideoEvent(event)) {
      invalidVideos++;
      continue;
    }

    const videoEvent = parseVideoEvent(event);
    if (!videoEvent) {
      invalidVideos++;
      continue;
    }

    // Get vineId - for kind 34236 use d tag, for 21/22 use event id as fallback
    const vineId = getVineId(event) || event.id;

    const videoUrl = videoEvent.videoMetadata?.url;
    if (!videoUrl) {
      debugError(`[useVideoEvents] No video URL in metadata for event ${event.id}:`, videoEvent.videoMetadata);
      invalidVideos++;
      continue;
    }

    validVideos++;

    parsedVideos.push({
      id: event.id,
      pubkey: event.pubkey,
      kind: event.kind as 21 | 22 | 34236,
      createdAt: event.created_at,
      originalVineTimestamp: getOriginalVineTimestamp(event),
      content: event.content,
      videoUrl,
      fallbackVideoUrls: videoEvent.videoMetadata?.fallbackUrls,
      hlsUrl: videoEvent.videoMetadata?.hlsUrl,
      thumbnailUrl: getThumbnailUrl(videoEvent),
      title: videoEvent.title,
      duration: videoEvent.videoMetadata?.duration,
      hashtags: videoEvent.hashtags || [],
      isRepost: false,
      vineId,
      loopCount: getLoopCount(event),
      likeCount: getOriginalLikeCount(event),
      repostCount: getOriginalRepostCount(event),
      commentCount: getOriginalCommentCount(event),
      proofMode: getProofModeData(event)
    });
  }

  debugLog(`[useVideoEvents] Parsed ${validVideos} valid videos, ${invalidVideos} invalid`);

  // Process reposts
  let repostsFetched = 0;
  let repostsSkipped = 0;
  for (const repost of repostEvents) {
    // Extract 'a' tag for addressable event reference
    const aTag = repost.tags.find(tag => tag[0] === 'a');
    if (!aTag?.[1]) {
      repostsSkipped++;
      continue;
    }

    // Parse addressable coordinate
    const [kind, pubkey, dTag] = aTag[1].split(':');
    const kindNum = parseInt(kind, 10);
    if (!VIDEO_KINDS.includes(kindNum) || !pubkey || !dTag) {
      repostsSkipped++;
      continue;
    }

    // Fetch original video if not in current batch
    let originalVideo = videoEvents.find(e =>
      e.pubkey === pubkey && getVineId(e) === dTag
    );

    if (!originalVideo) {
      // Fetch from relay
      try {
        const signal = AbortSignal.timeout(2000);
        const events = await nostr.query([{
          kinds: VIDEO_KINDS,
          authors: [pubkey],
          '#d': [dTag],
          limit: 1
        }], { signal });

        originalVideo = events[0];
        repostsFetched++;
      } catch {
        repostsSkipped++;
        continue;
      }
    }

    if (!originalVideo || !validateVideoEvent(originalVideo)) {
      repostsSkipped++;
      continue;
    }

    const videoEvent = parseVideoEvent(originalVideo);
    if (!videoEvent) {
      repostsSkipped++;
      continue;
    }

    // Get vineId - for kind 34236 use d tag, for 21/22 use event id as fallback
    const vineId = getVineId(originalVideo) || originalVideo.id;

    const videoUrl = videoEvent.videoMetadata?.url;
    if (!videoUrl) {
      debugError(`[useVideoEvents] No video URL in repost metadata for event ${originalVideo.id}:`, videoEvent.videoMetadata);
      repostsSkipped++;
      continue;
    }

    parsedVideos.push({
      id: repost.id,
      pubkey: originalVideo.pubkey,
      kind: originalVideo.kind as 21 | 22 | 34236,
      createdAt: originalVideo.created_at,
      originalVineTimestamp: getOriginalVineTimestamp(originalVideo),
      content: originalVideo.content,
      videoUrl,
      fallbackVideoUrls: videoEvent.videoMetadata?.fallbackUrls,
      hlsUrl: videoEvent.videoMetadata?.hlsUrl,
      thumbnailUrl: getThumbnailUrl(videoEvent),
      title: videoEvent.title,
      duration: videoEvent.videoMetadata?.duration,
      hashtags: videoEvent.hashtags || [],
      isRepost: true,
      reposterPubkey: repost.pubkey,
      repostedAt: repost.created_at,
      vineId,
      loopCount: getLoopCount(originalVideo),
      likeCount: getOriginalLikeCount(originalVideo),
      repostCount: getOriginalRepostCount(originalVideo),
      commentCount: getOriginalCommentCount(originalVideo),
      proofMode: getProofModeData(originalVideo)
    });
  }

  debugLog(`[useVideoEvents] Processed reposts: ${repostsFetched} fetched, ${repostsSkipped} skipped`);

  // Sort videos based on mode
  if (sortChronologically) {
    // Sort by time only (most recent first) for chronological feeds
    return parsedVideos.sort((a, b) => {
      const timeA = a.isRepost && a.repostedAt ? a.repostedAt : a.createdAt;
      const timeB = b.isRepost && b.repostedAt ? b.repostedAt : b.createdAt;
      return timeB - timeA;
    });
  } else {
    // Sort by loop count (highest first), then by created_at for ties
    return parsedVideos.sort((a, b) => {
      // First sort by loop count
      const loopDiff = (b.loopCount || 0) - (a.loopCount || 0);
      if (loopDiff !== 0) return loopDiff;

      // Then by time for ties
      const timeA = a.isRepost && a.repostedAt ? a.repostedAt : a.createdAt;
      const timeB = b.isRepost && b.repostedAt ? b.repostedAt : b.createdAt;
      return timeB - timeA;
    });
  }
}

/**
 * Hook to fetch video events
 */
export function useVideoEvents(options: UseVideoEventsOptions = {}) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { filter, feedType = 'discovery', hashtag, pubkey, limit = 50, until } = options;

  return useQuery({
    queryKey: ['video-events', feedType, hashtag, pubkey, limit, until, user?.pubkey, filter],
    queryFn: async (context) => {
      const startTime = performance.now();
      verboseLog(`[useVideoEvents] ========== Starting query for ${feedType} feed ==========`);
      verboseLog(`[useVideoEvents] Options:`, { feedType, hashtag, pubkey, limit, until });

      const signal = AbortSignal.any([
        context.signal,
        AbortSignal.timeout(10000) // Increased timeout for larger queries
      ]);

      // Build base filter
      const baseFilter: NostrFilter = {
        kinds: VIDEO_KINDS,
        limit: Math.min(limit, 50),
        ...filter
      };

      // If filtering by specific IDs, ensure we query them directly
      const isDirectIdLookup = filter?.ids && filter.ids.length > 0;
      if (isDirectIdLookup) {
        // For direct ID lookups, remove limit restriction
        baseFilter.limit = filter.ids.length;
        debugLog('[useVideoEvents] Direct ID lookup mode:', filter.ids);
      }

      // Add relay-native sorting for feeds that should sort by popularity
      // But NOT for direct ID lookups - those should just fetch the specific event
      const shouldSortByPopularity = ['trending', 'hashtag', 'home', 'discovery'].includes(feedType) && !isDirectIdLookup;
      if (shouldSortByPopularity) {
        (baseFilter as NostrFilter & { sort?: { field: string; dir: string } }).sort = { field: 'loop_count', dir: 'desc' };
      }

      // Add pagination
      if (until) {
        baseFilter.until = until;
      }

      // For 'recent' feed, only get videos from the last 30 days
      // This excludes old migrated Vine videos with ancient created_at timestamps
      if (feedType === 'recent' && !until) {
        const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
        baseFilter.since = thirtyDaysAgo;
      }

      // Handle different feed types
      if (feedType === 'hashtag' && hashtag) {
        baseFilter['#t'] = [hashtag.toLowerCase()];
        baseFilter.limit = limit;
      } else if (feedType === 'profile' && pubkey) {
        baseFilter.authors = [pubkey];
      } else if (feedType === 'home' && user?.pubkey) {
        // Fetch user's follow list and filter by followed authors
        const follows = await fetchFollowList(nostr, user.pubkey, signal);
        if (follows.length > 0) {
          baseFilter.authors = follows;
        } else {
          // If no follows, return empty array
          return [];
        }
      } else if (feedType === 'trending') {
        baseFilter.limit = limit;
      }

      let events: NostrEvent[] = [];
      let repostEvents: NostrEvent[] = [];

      try {
        // Query videos first
        const queryStartTime = performance.now();
        console.log('[useVideoEvents] Sending query with filter:', JSON.stringify(baseFilter, null, 2));
        verboseLog('[useVideoEvents] Calling nostr.query...');
        events = await nostr.query([baseFilter], { signal });
        console.log(`[useVideoEvents] Video query took ${(performance.now() - queryStartTime).toFixed(0)}ms, got ${events.length} events`);
        if (events.length > 0) {
          console.log('[useVideoEvents] First event:', events[0]);
        }

        // Log if we got zero events for debugging
        if (events.length === 0) {
          console.warn('[useVideoEvents] WARNING: Query returned 0 events');
          console.log('[useVideoEvents] Filter used:', JSON.stringify(baseFilter));
          console.log('[useVideoEvents] feedType:', feedType);
          console.log('[useVideoEvents] isDirectIdLookup:', isDirectIdLookup);
          console.log('[useVideoEvents] This could indicate a relay issue or no matching content');
        }

        // Only query reposts if we don't have enough videos and NOT doing a direct ID lookup
        if (events.length < limit && feedType !== 'profile' && !isDirectIdLookup) {
          const repostFilter = { ...baseFilter, kinds: [REPOST_KIND], limit: 15 }; // Optimized for performance
          const repostStartTime = performance.now();
          repostEvents = await nostr.query([repostFilter], { signal });
          debugLog(`[useVideoEvents] Repost query took ${(performance.now() - repostStartTime).toFixed(0)}ms, got ${repostEvents.length} events`);
          events = [...events, ...repostEvents];
        } else if (isDirectIdLookup) {
          debugLog('[useVideoEvents] Skipping repost query for direct ID lookup');
        }
      } catch (err) {
        debugError('[useVideoEvents] Query error:', err);
        debugError('[useVideoEvents] Filter that caused error:', JSON.stringify(baseFilter));
        debugError('[useVideoEvents] This likely indicates a relay connectivity issue');
        throw err;
      }

      const parseStartTime = performance.now();
      // Use chronological sorting for 'recent' feedType
      const sortChronologically = feedType === 'recent';
      let parsed = await parseVideoEvents(events, nostr, sortChronologically);
      const parseTime = performance.now() - parseStartTime;
      debugLog(`[useVideoEvents] Parse took ${parseTime.toFixed(0)}ms`);

      // Fallback: some events only include hashtags in content, not 't' tags
      if (feedType === 'hashtag' && hashtag) {
        const target = hashtag.toLowerCase();
        if (parsed.length === 0) {
          try {
            const fallbackEvents = await nostr.query([
              { kinds: [...VIDEO_KINDS, REPOST_KIND], limit: Math.min(limit * 3, 100) }  // Optimized for performance
            ], { signal });
            const fallbackParsed = await parseVideoEvents(fallbackEvents, nostr, false);
            parsed = fallbackParsed.filter(v => {
              const inTags = (v.hashtags || []).some(t => t.toLowerCase() === target);
              const inContent = (` ${v.content} `).toLowerCase().includes(`#${target}`);
              return inTags || inContent;
            }).slice(0, limit);
          } catch {
            // ignore fallback errors; we'll return whatever we have
          }
        }
      }


      // Handle sorting for different feed types
      if ((feedType === 'trending' || feedType === 'hashtag' || feedType === 'home') && parsed.length > 0) {
        // Don't filter by time - count ALL reactions, not just recent ones
        // This is important for sites with low activity or archived content
        const since = 0; // Count all reactions from the beginning of time
        const videoIds = parsed.map(v => v.id);
        const reactionCounts = await getReactionCounts(nostr, videoIds, since, signal);

        // Sort by total engagement: original loop count + reaction count
        parsed = parsed
          .map(video => ({
            ...video,
            reactionCount: reactionCounts[video.id] || 0,
            totalEngagement: (video.loopCount || 0) + (reactionCounts[video.id] || 0)
          }))
          .sort((a, b) => {
            // First sort by total engagement (loop count + reactions)
            if (a.totalEngagement !== b.totalEngagement) {
              return b.totalEngagement - a.totalEngagement;
            }
            // Then by time for ties
            const timeA = a.isRepost && a.repostedAt ? a.repostedAt : a.createdAt;
            const timeB = b.isRepost && b.repostedAt ? b.repostedAt : b.createdAt;
            return timeB - timeA;
          })
          .slice(0, limit); // Limit to requested amount
      }

      const totalTime = performance.now() - startTime;
      debugLog(`[useVideoEvents] Total query time: ${totalTime.toFixed(0)}ms, returning ${parsed.length} videos`);

      // Emit performance metrics
      if (typeof window !== 'undefined') {
        const metrics = {
          queryTime: Math.round(totalTime),
          parseTime: Math.round(parseTime),
          totalEvents: events.length,
          validVideos: parsed.length,
        };
        debugLog('[useVideoEvents] Emitting metrics:', metrics);
        window.dispatchEvent(new CustomEvent('performance-metric', {
          detail: metrics
        }));
      }

      return parsed;
    },
    staleTime: 60000, // 1 minute - increase to reduce re-queries
    gcTime: 600000, // 10 minutes - keep data longer
    enabled: feedType !== 'home' || !!user?.pubkey, // Only run home feed if user is logged in
  });
}

// ABOUTME: Enhanced video events hook with detailed performance logging
// ABOUTME: Tracks timing at each stage of the video loading pipeline

import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { VIDEO_KIND, REPOST_KIND, type ParsedVideoData } from '@/types/video';
import { parseVideoEvent, getVineId, getThumbnailUrl, getLoopCount } from '@/lib/videoParser';

interface UseVideoEventsOptions {
  filter?: Partial<NostrFilter>;
  feedType?: 'discovery' | 'home' | 'trending' | 'hashtag' | 'profile';
  hashtag?: string;
  pubkey?: string;
  limit?: number;
  until?: number;
}

// Performance tracking
const performanceLog = {
  queryStart: 0,
  queryEnd: 0,
  parseStart: 0,
  parseEnd: 0,
  totalEvents: 0,
  validEvents: 0,
  repostsFetched: 0,
  errors: [] as string[],
};

/**
 * Validates that a Kind 32222 event has required fields
 */
function validateVideoEvent(event: NostrEvent): boolean {
  if (event.kind !== VIDEO_KIND) return false;
  
  const vineId = getVineId(event);
  if (!vineId) {
    console.warn(`[VideoEvents] Event ${event.id} missing d tag`);
    return false;
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
  const startTime = performance.now();
  try {
    console.log(`[VideoEvents] Fetching follow list for ${pubkey}`);
    const followEvents = await nostr.query([{
      kinds: [3],
      authors: [pubkey],
      limit: 1
    }], { signal });

    if (followEvents.length === 0) {
      console.log(`[VideoEvents] No follows found for ${pubkey}`);
      return [];
    }

    const follows = followEvents[0].tags
      .filter(tag => tag[0] === 'p' && tag[1])
      .map(tag => tag[1]);

    console.log(`[VideoEvents] Found ${follows.length} follows in ${(performance.now() - startTime).toFixed(2)}ms`);
    return follows;
  } catch (error) {
    console.error(`[VideoEvents] Error fetching follows:`, error);
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

  const startTime = performance.now();
  try {
    console.log(`[VideoEvents] Fetching reaction counts for ${videoIds.length} videos`);
    const reactions = await nostr.query([{
      kinds: [6, 7],
      '#e': videoIds,
      since,
      limit: 1000
    }], { signal });

    const counts: Record<string, number> = {};
    reactions.forEach(reaction => {
      reaction.tags.forEach(tag => {
        if (tag[0] === 'e' && tag[1]) {
          counts[tag[1]] = (counts[tag[1]] || 0) + 1;
        }
      });
    });

    console.log(`[VideoEvents] Got reaction counts in ${(performance.now() - startTime).toFixed(2)}ms`);
    return counts;
  } catch (error) {
    console.error(`[VideoEvents] Error fetching reactions:`, error);
    return {};
  }
}

/**
 * Parse video events and handle reposts with logging
 */
async function parseVideoEvents(
  events: NostrEvent[], 
  nostr: { query: (filters: NostrFilter[], options: { signal: AbortSignal }) => Promise<NostrEvent[]> }
): Promise<ParsedVideoData[]> {
  const startTime = performance.now();
  console.log(`[VideoEvents] Parsing ${events.length} events`);
  
  const parsedVideos: ParsedVideoData[] = [];
  
  // Separate videos and reposts
  const videoEvents = events.filter(e => e.kind === VIDEO_KIND);
  const repostEvents = events.filter(e => e.kind === REPOST_KIND);
  
  console.log(`[VideoEvents] Found ${videoEvents.length} videos, ${repostEvents.length} reposts`);
  
  // Process direct video events
  let validVideos = 0;
  let invalidVideos = 0;
  
  for (const event of videoEvents) {
    if (!validateVideoEvent(event)) {
      invalidVideos++;
      continue;
    }
    
    const videoEvent = parseVideoEvent(event);
    if (!videoEvent) {
      console.warn(`[VideoEvents] Failed to parse event ${event.id}`);
      invalidVideos++;
      continue;
    }
    
    const vineId = getVineId(event);
    if (!vineId) {
      invalidVideos++;
      continue;
    }
    
    validVideos++;
    parsedVideos.push({
      id: event.id,
      pubkey: event.pubkey,
      createdAt: event.created_at,
      content: event.content,
      videoUrl: videoEvent.videoMetadata!.url,
      thumbnailUrl: getThumbnailUrl(videoEvent),
      title: videoEvent.title,
      duration: videoEvent.videoMetadata?.duration,
      hashtags: videoEvent.hashtags || [],
      isRepost: false,
      vineId,
      loopCount: getLoopCount(event)
    });
  }
  
  console.log(`[VideoEvents] Parsed ${validVideos} valid videos, ${invalidVideos} invalid`);
  
  // Process reposts
  let repostsFetched = 0;
  let repostsSkipped = 0;
  
  for (const repost of repostEvents) {
    const aTag = repost.tags.find(tag => tag[0] === 'a');
    if (!aTag?.[1]) {
      repostsSkipped++;
      continue;
    }
    
    const [kind, pubkey, dTag] = aTag[1].split(':');
    if (kind !== String(VIDEO_KIND) || !pubkey || !dTag) {
      repostsSkipped++;
      continue;
    }
    
    let originalVideo = videoEvents.find(e => 
      e.pubkey === pubkey && getVineId(e) === dTag
    );
    
    if (!originalVideo) {
      // Fetch from relay
      try {
        const fetchStart = performance.now();
        const signal = AbortSignal.timeout(2000);
        const events = await nostr.query([{
          kinds: [VIDEO_KIND],
          authors: [pubkey],
          '#d': [dTag],
          limit: 1
        }], { signal });
        
        originalVideo = events[0];
        repostsFetched++;
        console.log(`[VideoEvents] Fetched reposted video in ${(performance.now() - fetchStart).toFixed(2)}ms`);
      } catch (error) {
        console.warn(`[VideoEvents] Failed to fetch reposted video:`, error);
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
    
    const vineId = getVineId(originalVideo);
    if (!vineId) {
      repostsSkipped++;
      continue;
    }
    
    parsedVideos.push({
      id: repost.id,
      pubkey: originalVideo.pubkey,
      createdAt: originalVideo.created_at,
      content: originalVideo.content,
      videoUrl: videoEvent.videoMetadata!.url,
      thumbnailUrl: getThumbnailUrl(videoEvent),
      title: videoEvent.title,
      duration: videoEvent.videoMetadata?.duration,
      hashtags: videoEvent.hashtags || [],
      isRepost: true,
      reposterPubkey: repost.pubkey,
      repostedAt: repost.created_at,
      vineId,
      loopCount: getLoopCount(originalVideo)
    });
  }
  
  console.log(`[VideoEvents] Processed reposts: ${repostsFetched} fetched, ${repostsSkipped} skipped`);
  
  // Sort by loop count
  const sortStart = performance.now();
  const sorted = parsedVideos.sort((a, b) => {
    const loopDiff = (b.loopCount || 0) - (a.loopCount || 0);
    if (loopDiff !== 0) return loopDiff;
    
    const timeA = a.isRepost && a.repostedAt ? a.repostedAt : a.createdAt;
    const timeB = b.isRepost && b.repostedAt ? b.repostedAt : b.createdAt;
    return timeB - timeA;
  });
  
  console.log(`[VideoEvents] Sorted ${sorted.length} videos in ${(performance.now() - sortStart).toFixed(2)}ms`);
  console.log(`[VideoEvents] Total parsing time: ${(performance.now() - startTime).toFixed(2)}ms`);
  
  return sorted;
}

/**
 * Enhanced hook to fetch video events with detailed logging
 */
export function useVideoEventsWithLogging(options: UseVideoEventsOptions = {}) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { filter, feedType = 'discovery', hashtag, pubkey, limit = 50, until } = options;
  
  return useQuery({
    queryKey: ['video-events-logged', feedType, hashtag, pubkey, limit, until, user?.pubkey, filter],
    queryFn: async (context) => {
      const queryStart = performance.now();
      console.log(`[VideoEvents] ========== Starting query for ${feedType} feed ==========`);
      console.log(`[VideoEvents] Options:`, { feedType, hashtag, pubkey, limit, until });
      
      const signal = AbortSignal.any([
        context.signal,
        AbortSignal.timeout(10000)
      ]);
      
      // Build base filter
      const baseFilter: NostrFilter = {
        kinds: [VIDEO_KIND, REPOST_KIND],
        limit: 200,
        ...filter
      };

      if (until) {
        baseFilter.until = until;
      }
      
      // Handle different feed types
      if (feedType === 'hashtag' && hashtag) {
        baseFilter['#t'] = [hashtag.toLowerCase()];
        console.log(`[VideoEvents] Filtering by hashtag: ${hashtag}`);
      } else if (feedType === 'profile' && pubkey) {
        baseFilter.authors = [pubkey];
        console.log(`[VideoEvents] Filtering by author: ${pubkey}`);
      } else if (feedType === 'home' && user?.pubkey) {
        const follows = await fetchFollowList(nostr, user.pubkey, signal);
        if (follows.length > 0) {
          baseFilter.authors = follows;
          console.log(`[VideoEvents] Filtering by ${follows.length} followed authors`);
        } else {
          console.log(`[VideoEvents] No follows found, returning empty`);
          return [];
        }
      } else if (feedType === 'trending') {
        baseFilter.limit = Math.min(limit * 3, 150);
        console.log(`[VideoEvents] Getting trending videos (limit: ${baseFilter.limit})`);
      }
      
      let events: NostrEvent[] = [];
      const relayQueryStart = performance.now();
      
      try {
        console.log(`[VideoEvents] Querying relay with filter:`, baseFilter);
        events = await nostr.query([baseFilter], { signal });
        console.log(`[VideoEvents] Relay returned ${events.length} events in ${(performance.now() - relayQueryStart).toFixed(2)}ms`);
      } catch (err) {
        const errorTime = performance.now() - relayQueryStart;
        console.error(`[VideoEvents] Query failed after ${errorTime.toFixed(2)}ms:`, err);
        throw err;
      }
      
      let parsed = await parseVideoEvents(events, nostr);

      // Hashtag fallback
      if (feedType === 'hashtag' && hashtag && parsed.length === 0) {
        console.log(`[VideoEvents] No results for hashtag, trying fallback search`);
        const target = hashtag.toLowerCase();
        
        try {
          const fallbackStart = performance.now();
          const fallbackEvents = await nostr.query([
            { kinds: [VIDEO_KIND, REPOST_KIND], limit: Math.min(limit * 5, 200) }
          ], { signal });
          
          console.log(`[VideoEvents] Fallback query returned ${fallbackEvents.length} events in ${(performance.now() - fallbackStart).toFixed(2)}ms`);
          
          const fallbackParsed = await parseVideoEvents(fallbackEvents, nostr);
          parsed = fallbackParsed.filter(v => {
            const inTags = (v.hashtags || []).some(t => t.toLowerCase() === target);
            const inContent = (` ${v.content} `).toLowerCase().includes(`#${target}`);
            return inTags || inContent;
          }).slice(0, limit);
          
          console.log(`[VideoEvents] Fallback found ${parsed.length} matching videos`);
        } catch (error) {
          console.error(`[VideoEvents] Fallback query failed:`, error);
        }
      }
      
      // Handle trending algorithm
      if (feedType === 'trending' && parsed.length > 0) {
        console.log(`[VideoEvents] Calculating trending scores`);
        const since24h = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
        const videoIds = parsed.map(v => v.id);
        const reactionCounts = await getReactionCounts(nostr, videoIds, since24h, signal);
        
        parsed = parsed
          .map(video => ({
            ...video,
            reactionCount: reactionCounts[video.id] || 0
          }))
          .sort((a, b) => {
            if (a.reactionCount !== b.reactionCount) {
              return b.reactionCount - a.reactionCount;
            }
            const timeA = a.isRepost && a.repostedAt ? a.repostedAt : a.createdAt;
            const timeB = b.isRepost && b.repostedAt ? b.repostedAt : b.createdAt;
            return timeB - timeA;
          })
          .slice(0, limit);
          
        console.log(`[VideoEvents] Top trending video has ${parsed[0]?.reactionCount || 0} reactions`);
      }
      
      const totalTime = performance.now() - queryStart;
      console.log(`[VideoEvents] ========== Query complete ==========`);
      console.log(`[VideoEvents] Total time: ${totalTime.toFixed(2)}ms`);
      console.log(`[VideoEvents] Final count: ${parsed.length} videos`);
      console.log(`[VideoEvents] Video URLs:`, parsed.slice(0, 3).map(v => v.videoUrl));
      
      return parsed;
    },
    staleTime: 30000,
    gcTime: 300000,
    enabled: feedType !== 'home' || !!user?.pubkey,
  });
}
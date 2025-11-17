// ABOUTME: Hook for fetching profile statistics including video count, views, followers, and joined date
// ABOUTME: Aggregates data from video events, social interactions, and contact lists
// ABOUTME: Queries multiple relays with higher limits for accurate follower counts

import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { ProfileStats } from '@/components/ProfileHeader';
import { VIDEO_KINDS } from '@/types/video';
import { debugLog } from '@/lib/debug';

/**
 * Fetch comprehensive profile statistics for a user
 * Includes video count, total views, follower/following counts, and joined date
 */
export function useProfileStats(pubkey: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['profile-stats', pubkey],
    queryFn: async (context) => {
      if (!pubkey) throw new Error('No pubkey provided');

      const signal = AbortSignal.any([context.signal, AbortSignal.timeout(10000)]);

      try {
        // Optimized: Single batched query for all profile data
        // Combine multiple filters into one WebSocket request
        const allEvents = await nostr.query([
          // 1. User's videos (kind 34236)
          {
            kinds: VIDEO_KINDS,
            authors: [pubkey],
            limit: 500,
          },
          // 2. User's own contact list (people they follow)
          {
            kinds: [3],
            authors: [pubkey],
            limit: 1,
          }
        ], { signal });

        // Separate events by type
        const videoEvents = allEvents.filter(e => VIDEO_KINDS.includes(e.kind));
        const userContactList = allEvents.filter(e => e.kind === 3 && e.pubkey === pubkey);

        // Calculate video count
        const videosCount = videoEvents.length;

        // Get video IDs for social metrics calculation
        const videoIds = videoEvents.map(event => event.id);

        // Fetch social interactions for all videos
        let totalViews = 0;
        if (videoIds.length > 0) {
          const socialInteractions = await nostr.query([{
            kinds: [6, 7, 9735], // reposts, reactions, zap receipts
            '#e': videoIds, // Events referencing user's videos
            limit: 2000, // Large limit to capture all interactions
          }], { signal });

          // Calculate total views (likes + reposts + zaps as proxy for engagement)
          totalViews = socialInteractions.filter(event => {
            return (
              event.kind === 7 && (event.content === '+' || event.content === '❤️' || event.content === '👍') ||
              event.kind === 6 ||
              event.kind === 9735
            );
          }).length;
        }

        // Query follower count with much higher limit across multiple relays
        // The reqRouter will automatically send this to profile relays
        debugLog(`[useProfileStats] Querying followers for ${pubkey}`);

        const followerEvents = await nostr.query([{
          kinds: [3],
          '#p': [pubkey],
          limit: 10000, // Increased from 500 to capture more followers
        }], { signal });

        // Calculate follower count (unique pubkeys following this user)
        const followerPubkeys = new Set(followerEvents.map(event => event.pubkey));
        const followersCount = followerPubkeys.size;

        debugLog(`[useProfileStats] Found ${followerEvents.length} follower events, ${followersCount} unique followers`);

        // Calculate following count (people this user follows)
        const latestContactList = userContactList
          .sort((a, b) => b.created_at - a.created_at)[0];

        const followingCount = latestContactList
          ? latestContactList.tags.filter(tag => tag[0] === 'p').length
          : 0;

        // Calculate joined date (earliest video or contact list)
        let joinedDate: Date | null = null;
        const allUserEvents = [...videoEvents, ...userContactList];
        if (allUserEvents.length > 0) {
          const earliestTimestamp = Math.min(...allUserEvents.map(event => event.created_at));
          joinedDate = new Date(earliestTimestamp * 1000);
        }

        const stats: ProfileStats = {
          videosCount,
          totalViews,
          joinedDate,
          followersCount,
          followingCount,
        };

        return stats;
      } catch (error) {
        console.error('Failed to fetch profile stats:', error);
        // Return default stats on error
        return {
          videosCount: 0,
          totalViews: 0,
          joinedDate: null,
          followersCount: 0,
          followingCount: 0,
        } as ProfileStats;
      }
    },
    enabled: !!pubkey,
    staleTime: 60000, // Consider data stale after 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
    retry: 2,
  });
}
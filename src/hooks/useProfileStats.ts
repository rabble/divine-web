// ABOUTME: Hook for fetching profile statistics including video count, views, followers, and joined date
// ABOUTME: Aggregates data from video events, social interactions, and contact lists

import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { ProfileStats } from '@/components/ProfileHeader';

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
      
      const signal = AbortSignal.any([context.signal, AbortSignal.timeout(5000)]);

      try {
        // Batch query for all profile-related data
        const [videoEvents, followerEvents, userContactList] = await Promise.all([
          // 1. User's videos (kind 32222)
          nostr.query([{
            kinds: [32222], // Video events
            authors: [pubkey],
            limit: 500, // Get all videos to count accurately
          }], { signal }),

          // 2. People who follow this user (kind 3 contact lists mentioning this pubkey)
          nostr.query([{
            kinds: [3], // Contact lists
            '#p': [pubkey], // Tag referencing this user
            limit: 500, // Get followers
          }], { signal }),

          // 3. User's own contact list (people they follow)
          nostr.query([{
            kinds: [3], // Contact lists
            authors: [pubkey],
            limit: 1, // Only need the latest
          }], { signal }),

          // 4. Social interactions for view calculation (reactions/reposts on user's videos)
          // We'll do this in a second step after getting video IDs
          Promise.resolve([]) as Promise<never[]>
        ]);

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

        // Calculate follower count (unique pubkeys following this user)
        const followerPubkeys = new Set(followerEvents.map(event => event.pubkey));
        const followersCount = followerPubkeys.size;

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
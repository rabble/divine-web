// ABOUTME: Hook for fetching video social interaction metrics (likes, reposts, views)
// ABOUTME: Provides efficient batched queries to minimize relay requests

import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';

export interface VideoSocialMetrics {
  likeCount: number;
  repostCount: number;
  viewCount: number;
}

/**
 * Fetch social interaction metrics for a video event
 * Uses batched queries to efficiently fetch likes, reposts, and views
 */
export function useVideoSocialMetrics(videoId: string, _videoPubkey?: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['video-social-metrics', videoId],
    queryFn: async (context) => {
      const signal = AbortSignal.any([context.signal, AbortSignal.timeout(3000)]);

      try {
        // Batch query for all social interactions related to this video
        // Using a single query with multiple kinds for efficiency
        const events = await nostr.query([
          {
            kinds: [6, 7, 9735], // reposts, reactions, zap receipts
            '#e': [videoId], // events that reference this video
            limit: 500, // generous limit to capture all interactions
          }
        ], { signal });

        let likeCount = 0;
        let repostCount = 0;
        let viewCount = 0;

        // Process each event type
        for (const event of events) {
          switch (event.kind) {
            case 7: // Reaction events (likes)
              // Check if it's a positive reaction (like)
              if (event.content === '+' || event.content === '❤️' || event.content === '👍') {
                likeCount++;
              }
              break;
            
            case 6: // Repost events
              repostCount++;
              break;
            
            case 9735: // Zap receipts (using as view indicator)
              // For now, count zap receipts as views
              // In a more sophisticated implementation, we might have dedicated view events
              viewCount++;
              break;
          }
        }

        // For view count, we could also implement a custom approach
        // For now, we'll use zap receipts as a proxy, but this could be enhanced
        // with dedicated kind 34236 view events or other mechanisms

        const metrics: VideoSocialMetrics = {
          likeCount,
          repostCount,
          viewCount,
        };

        return metrics;
      } catch (error) {
        console.error('Failed to fetch video social metrics:', error);
        // Return default values on error
        return {
          likeCount: 0,
          repostCount: 0,
          viewCount: 0,
        } as VideoSocialMetrics;
      }
    },
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
    retry: 2,
  });
}

/**
 * Check if the current user has liked a specific video and get the event IDs for deletion
 */
export function useVideoUserInteractions(videoId: string, userPubkey?: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['video-user-interactions', videoId, userPubkey],
    queryFn: async (context) => {
      if (!userPubkey) {
        return { hasLiked: false, hasReposted: false, likeEventId: null, repostEventId: null };
      }

      const signal = AbortSignal.any([context.signal, AbortSignal.timeout(2000)]);

      try {
        // Query for user's interactions with this video
        const events = await nostr.query([
          {
            kinds: [6, 7], // reposts, reactions
            authors: [userPubkey],
            '#e': [videoId],
            limit: 10,
          }
        ], { signal });

        let hasLiked = false;
        let hasReposted = false;
        let likeEventId: string | null = null;
        let repostEventId: string | null = null;

        // Filter out deleted events by checking for delete events (kind 5)
        const deleteEvents = await nostr.query([
          {
            kinds: [5], // Delete events (NIP-09)
            authors: [userPubkey],
            '#e': events.map(e => e.id), // Check if any of our events are deleted
            limit: 20,
          }
        ], { signal });

        const deletedEventIds = new Set();
        deleteEvents.forEach(deleteEvent => {
          deleteEvent.tags.forEach(tag => {
            if (tag[0] === 'e' && tag[1]) {
              deletedEventIds.add(tag[1]);
            }
          });
        });

        // Process events, ignoring deleted ones
        for (const event of events) {
          if (deletedEventIds.has(event.id)) continue; // Skip deleted events

          if (event.kind === 7 && (event.content === '+' || event.content === '❤️' || event.content === '👍')) {
            hasLiked = true;
            likeEventId = event.id;
          }
          if (event.kind === 6) {
            hasReposted = true;
            repostEventId = event.id;
          }
        }

        return { hasLiked, hasReposted, likeEventId, repostEventId };
      } catch (error) {
        console.error('Failed to fetch user video interactions:', error);
        return { hasLiked: false, hasReposted: false, likeEventId: null, repostEventId: null };
      }
    },
    enabled: !!userPubkey,
    staleTime: 30000, // Consider data stale after 30 seconds (faster refresh for interactive features)
    gcTime: 300000, // Keep in cache for 5 minutes
  });
}
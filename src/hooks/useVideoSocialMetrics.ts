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
        // with dedicated kind 32222 view events or other mechanisms

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
 * Check if the current user has liked a specific video
 */
export function useVideoUserInteractions(videoId: string, userPubkey?: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['video-user-interactions', videoId, userPubkey],
    queryFn: async (context) => {
      if (!userPubkey) {
        return { hasLiked: false, hasReposted: false };
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

        for (const event of events) {
          if (event.kind === 7 && (event.content === '+' || event.content === '❤️' || event.content === '👍')) {
            hasLiked = true;
          }
          if (event.kind === 6) {
            hasReposted = true;
          }
        }

        return { hasLiked, hasReposted };
      } catch (error) {
        console.error('Failed to fetch user video interactions:', error);
        return { hasLiked: false, hasReposted: false };
      }
    },
    enabled: !!userPubkey,
    staleTime: 60000, // Consider data stale after 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
  });
}
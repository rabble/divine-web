// ABOUTME: Hook for fetching video social interaction metrics (likes, reposts, views)
// ABOUTME: Provides efficient batched queries to minimize relay requests

import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';

export interface VideoSocialMetrics {
  likeCount: number;
  repostCount: number;
  viewCount: number;
  commentCount: number;
}

/**
 * Fetch social interaction metrics for a video event
 * Uses batched queries to efficiently fetch likes, reposts, and views
 *
 * @param videoId - The video event ID
 * @param videoPubkey - The video author's pubkey (required for addressable events)
 * @param vineId - The video's vineId (d tag) for addressable events
 */
export function useVideoSocialMetrics(videoId: string, videoPubkey: string, vineId: string | null) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['video-social-metrics', videoId, videoPubkey, vineId],
    queryFn: async (context) => {
      const signal = AbortSignal.any([context.signal, AbortSignal.timeout(3000)]);

      try {
        // For kind 34236 (addressable videos), we need to query by both #e and #a tags
        // - #e tag: Used by likes (kind 7) and zap receipts (kind 9735)
        // - #a tag: Used by comments (kind 1111), and generic reposts (kind 16) for addressable events
        const filters = [
          {
            kinds: [7, 9735], // reactions, zap receipts
            '#e': [videoId], // Standard event references
            limit: 500,
          }
        ];

        // Add addressable event filter for comments and generic reposts
        const addressableId = `34236:${videoPubkey}:${vineId ?? ''}`;
        filters.push({
          kinds: [1111, 16], // NIP-22 comments, generic reposts
          '#a': [addressableId], // Addressable event references
          limit: 500,
        } as any); // Type assertion needed for dynamic tag filter properties

        const events = await nostr.query(filters, { signal });

        let likeCount = 0;
        let repostCount = 0;
        let viewCount = 0;
        let commentCount = 0;

        // Process each event type
        for (const event of events) {
          switch (event.kind) {
            case 7: // Reaction events (likes)
              // Check if it's a positive reaction (like)
              if (event.content === '+' || event.content === '❤️' || event.content === '👍') {
                likeCount++;
              }
              break;

            case 16: // Generic repost events
              repostCount++;
              break;

            case 1: // Text note comments
            case 1111: // NIP-22 comments
              commentCount++;
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
          commentCount,
        };

        return metrics;
      } catch (error) {
        console.error('Failed to fetch video social metrics:', error);
        // Return default values on error
        return {
          likeCount: 0,
          repostCount: 0,
          viewCount: 0,
          commentCount: 0,
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
export function useVideoUserInteractions(videoId: string, videoPubkey: string, vineId: string | null, userPubkey?: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['video-user-interactions', videoId, userPubkey],
    queryFn: async (context) => {
      if (!userPubkey) {
        return { hasLiked: false, hasReposted: false, likeEventId: null, repostEventId: null };
      }

      const signal = AbortSignal.any([context.signal, AbortSignal.timeout(2000)]);

      try {
        const addressableId = `34236:${videoPubkey}:${vineId ?? ''}`;
        // Query for user's interactions with this video
        const events = await nostr.query([ 
          {
            kinds: [7], // reactions
            authors: [userPubkey],
            '#e': [videoId],
            limit: 10,
          },
          {
            kinds: [16], // generic reposts
            authors: [userPubkey],
            '#a': [addressableId],
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
          if (event.kind === 16) {
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
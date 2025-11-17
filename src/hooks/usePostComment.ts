import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { NKinds, type NostrEvent } from '@nostrify/nostrify';
import type { VideoSocialMetrics } from '@/hooks/useVideoSocialMetrics';

interface PostCommentParams {
  root: NostrEvent | URL; // The root event to comment on
  reply?: NostrEvent | URL; // Optional reply to another comment
  content: string;
}

interface CommentsQueryData {
  allComments: NostrEvent[];
  topLevelComments: NostrEvent[];
  getDescendants: (commentId: string) => NostrEvent[];
  getDirectReplies: (commentId: string) => NostrEvent[];
}

/** Post a Kind 1 (text note) comment on an event - compatible with Android app. */
export function usePostComment() {
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async ({ root, reply, content }: PostCommentParams) => {
      const tags: string[][] = [];

      // Android app uses Kind 1 (text notes) with e/p tags
      // Root event - always tag the video being commented on
      if (!(root instanceof URL)) {
        tags.push(['e', root.id, '', 'root']);
        tags.push(['p', root.pubkey]);
      }

      // If replying to a comment, add reply tags
      if (reply && !(reply instanceof URL)) {
        tags.push(['e', reply.id, '', 'reply']);
        tags.push(['p', reply.pubkey]);
      }

      console.log('[usePostComment] Publishing comment with tags:', tags);

      const event = await publishEvent({
        kind: 1, // Use Kind 1 (text note) like the Android app
        content,
        tags,
      });

      console.log('[usePostComment] Comment published successfully:', event.id);

      return event;
    },
    onMutate: async ({ root, content, reply }) => {
      const videoId = root instanceof URL ? root.toString() : root.id;
      const metricsQueryKey = ['video-social-metrics', videoId];

      console.log('[usePostComment] onMutate: Starting optimistic update for video:', videoId);

      // Cancel all comment queries for this video (regardless of limit)
      await queryClient.cancelQueries({
        predicate: (query) => {
          return query.queryKey[0] === 'comments' && query.queryKey[1] === videoId;
        }
      });

      // Snapshot previous metrics
      const previousMetrics = queryClient.getQueryData(metricsQueryKey);

      // Optimistically update comment count
      queryClient.setQueryData(metricsQueryKey, (old: VideoSocialMetrics | undefined) => ({
        ...old,
        commentCount: (old?.commentCount || 0) + 1,
      }));

      // Optimistically add comment to all matching comment queries
      if (user) {
        // Build the same tags that will be used in the actual comment
        const commentTags: string[][] = [];
        if (!(root instanceof URL)) {
          commentTags.push(['e', root.id, '', 'root']);
          commentTags.push(['p', root.pubkey]);
        }
        if (reply && !(reply instanceof URL)) {
          commentTags.push(['e', reply.id, '', 'reply']);
          commentTags.push(['p', reply.pubkey]);
        }

        const optimisticComment: NostrEvent = {
          id: `temp-${Date.now()}`,
          pubkey: user.pubkey,
          created_at: Math.floor(Date.now() / 1000),
          kind: 1, // Kind 1 (text note) to match Android app
          content,
          tags: commentTags,
          sig: '',
        };

        // Update all comment queries for this video
        queryClient.setQueriesData(
          {
            predicate: (query) => {
              return query.queryKey[0] === 'comments' && query.queryKey[1] === videoId;
            }
          },
          (old: CommentsQueryData | undefined) => {
            console.log('[usePostComment] Updating cache with optimistic comment. Current cache:', old);

            // useComments returns an object with { allComments, topLevelComments, getDescendants, getDirectReplies }
            // We need to preserve this structure
            if (old && typeof old === 'object' && 'topLevelComments' in old) {
              // If this is a reply, add to allComments but not topLevelComments
              if (reply) {
                const updated = {
                  ...old,
                  allComments: [optimisticComment, ...old.allComments],
                };
                console.log('[usePostComment] Added reply to cache. New cache:', updated);
                return updated;
              }
              // If this is a top-level comment, add to both
              const updated = {
                ...old,
                allComments: [optimisticComment, ...old.allComments],
                topLevelComments: [optimisticComment, ...old.topLevelComments],
              };
              console.log('[usePostComment] Added top-level comment to cache. New cache:', updated);
              return updated;
            }
            // If the cache structure is unexpected, don't update it
            // This prevents corrupting the cache
            console.log('[usePostComment] Cache structure unexpected, not updating');
            return old;
          }
        );
      }

      return { previousMetrics, videoId };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context) {
        // Rollback metrics
        queryClient.setQueryData(['video-social-metrics', context.videoId], context.previousMetrics);
        // Refetch comments to get the correct state
        queryClient.invalidateQueries({
          predicate: (query) => {
            return query.queryKey[0] === 'comments' && query.queryKey[1] === context.videoId;
          }
        });
      }
    },
    onSuccess: async (newComment, { root }) => {
      // After successfully publishing, refetch comments to sync with server
      const videoId = root instanceof URL ? root.toString() : root.id;

      console.log('[usePostComment] Successfully published comment, refetching comments for video:', videoId);

      // Invalidate and refetch all comment queries for this video
      await queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey[0] === 'comments' && query.queryKey[1] === videoId;
        },
      });

      // Force refetch by resetting the queries
      await queryClient.refetchQueries({
        predicate: (query) => {
          return query.queryKey[0] === 'comments' && query.queryKey[1] === videoId;
        },
      });

      // Also update metrics
      queryClient.invalidateQueries({
        queryKey: ['video-social-metrics', videoId]
      });
    },
  });
}
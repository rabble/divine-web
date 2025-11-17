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

      const event = await publishEvent({
        kind: 1, // Use Kind 1 (text note) like the Android app
        content,
        tags,
      });

      return event;
    },
    onMutate: async ({ root, content, reply }) => {
      const videoId = root instanceof URL ? root.toString() : root.id;
      const metricsQueryKey = ['video-social-metrics', videoId];

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
            // useComments returns an object with { allComments, topLevelComments, getDescendants, getDirectReplies }
            // We need to preserve this structure
            if (old && typeof old === 'object' && 'topLevelComments' in old) {
              // If this is a reply, add to allComments but not topLevelComments
              if (reply) {
                return {
                  ...old,
                  allComments: [optimisticComment, ...old.allComments],
                };
              }
              // If this is a top-level comment, add to both
              return {
                ...old,
                allComments: [optimisticComment, ...old.allComments],
                topLevelComments: [optimisticComment, ...old.topLevelComments],
              };
            }
            // If the cache structure is unexpected, don't update it
            // This prevents corrupting the cache
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
    onSettled: (_, __, { root }) => {
      // Refetch to sync with server
      const videoId = root instanceof URL ? root.toString() : root.id;

      // Invalidate all comment queries for this video (regardless of limit parameter)
      // and force a refetch by using refetchType: 'active'
      queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey[0] === 'comments' && query.queryKey[1] === videoId;
        },
        refetchType: 'active'
      });

      queryClient.invalidateQueries({
        queryKey: ['video-social-metrics', videoId]
      });
    },
  });
}
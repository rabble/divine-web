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
        kind: 1111, // NIP-22 comment kind
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
          kind: 1111, // NIP-22 comment kind
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
              // If this is a reply to another comment, add to allComments only
              if (reply) {
                const updated = {
                  ...old,
                  allComments: [optimisticComment, ...old.allComments],
                  topLevelComments: old.topLevelComments, // Keep topLevelComments unchanged
                };
                console.log('[usePostComment] Added reply to allComments only (not top-level)');
                return updated;
              }
              // If this is a top-level comment on the video, add to both
              const updated = {
                ...old,
                allComments: [optimisticComment, ...old.allComments],
                topLevelComments: [optimisticComment, ...old.topLevelComments],
              };
              console.log('[usePostComment] Added top-level comment to both arrays');
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
      // After successfully publishing, manually add the real comment to the cache
      const videoId = root instanceof URL ? root.toString() : root.id;

      console.log('[usePostComment] Successfully published comment, updating cache with real event:', newComment.id);

      // Update all comment queries with the real published event
      queryClient.setQueriesData(
        {
          predicate: (query) => {
            return query.queryKey[0] === 'comments' && query.queryKey[1] === videoId;
          }
        },
        (old: CommentsQueryData | undefined) => {
          if (old && typeof old === 'object' && 'topLevelComments' in old) {
            console.log('[usePostComment] Replacing optimistic comment with real event');

            // Remove optimistic comment(s) (they start with 'temp-')
            const allCommentsWithoutTemp = old.allComments.filter(c => !c.id.startsWith('temp-'));
            const topLevelWithoutTemp = old.topLevelComments.filter(c => !c.id.startsWith('temp-'));

            // Check if this is a reply to another comment (not just to the root video)
            // A reply will have an 'e' tag with marker 'reply'
            const hasReplyMarker = newComment.tags.some(tag => tag[0] === 'e' && tag[3] === 'reply');

            console.log('[usePostComment] Comment tags:', newComment.tags);
            console.log('[usePostComment] Has reply marker:', hasReplyMarker);

            if (hasReplyMarker) {
              // This is a reply to another comment, add to allComments only
              console.log('[usePostComment] Adding as threaded reply (not top-level)');
              return {
                ...old,
                allComments: [newComment, ...allCommentsWithoutTemp],
                topLevelComments: topLevelWithoutTemp,
              };
            } else {
              // This is a top-level comment on the video, add to both
              console.log('[usePostComment] Adding as top-level comment');
              return {
                ...old,
                allComments: [newComment, ...allCommentsWithoutTemp],
                topLevelComments: [newComment, ...topLevelWithoutTemp],
              };
            }
          }
          return old;
        }
      );

      // Also update metrics
      queryClient.invalidateQueries({
        queryKey: ['video-social-metrics', videoId]
      });
    },
  });
}
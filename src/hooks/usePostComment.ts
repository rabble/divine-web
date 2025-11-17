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

      // Root event - always tag the video being commented on using 'a' tag for addressable events
      if (!(root instanceof URL)) {
        // Build 'a' tag for addressable event: "kind:pubkey:d-identifier"
        const dTag = root.tags.find(tag => tag[0] === 'd')?.[1];
        if (dTag) {
          tags.push(['a', `${root.kind}:${root.pubkey}:${dTag}`, '', 'root']);
          tags.push(['k', root.kind.toString()]);
        }
        tags.push(['p', root.pubkey]);
      }

      // If replying to a comment, add reply tags using 'e' tag
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
          // Build 'a' tag for addressable event
          const dTag = root.tags.find(tag => tag[0] === 'd')?.[1];
          if (dTag) {
            commentTags.push(['a', `${root.kind}:${root.pubkey}:${dTag}`, '', 'root']);
            commentTags.push(['k', root.kind.toString()]);
          }
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
              // Helper to get tag marker
              const getTagMarker = (event: NostrEvent, tagName: string, value: string): string | undefined => {
                const tag = event.tags.find(([name, val]) => name === tagName && val === value);
                return tag?.[3];
              };

              // Determine new arrays
              const newAllComments = [optimisticComment, ...old.allComments];
              const newTopLevelComments = reply
                ? old.topLevelComments // Keep topLevelComments unchanged for replies
                : [optimisticComment, ...old.topLevelComments];

              // Recreate getDirectReplies function with the new allComments array
              const getDirectReplies = (commentId: string) => {
                const directReplies = newAllComments.filter(comment => {
                  const marker = getTagMarker(comment, 'e', commentId);
                  return marker === 'reply';
                });
                // Sort direct replies by creation time (oldest first for threaded display)
                return directReplies.sort((a, b) => a.created_at - b.created_at);
              };

              // Recreate getDescendants function
              const getDescendants = (parentId: string): NostrEvent[] => {
                const directReplies = newAllComments.filter(comment => {
                  const marker = getTagMarker(comment, 'e', parentId);
                  return marker === 'reply';
                });

                const allDescendants = [...directReplies];

                // Recursively get descendants of each direct reply
                for (const reply of directReplies) {
                  allDescendants.push(...getDescendants(reply.id));
                }

                return allDescendants.sort((a, b) => a.created_at - b.created_at);
              };

              const updated = {
                allComments: newAllComments,
                topLevelComments: newTopLevelComments,
                getDirectReplies,
                getDescendants,
              };

              console.log('[usePostComment] Added', reply ? 'threaded reply' : 'top-level comment', 'to cache');
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

            // Helper to get tag marker
            const getTagMarker = (event: NostrEvent, tagName: string, value: string): string | undefined => {
              const tag = event.tags.find(([name, val]) => name === tagName && val === value);
              return tag?.[3];
            };

            // Determine new arrays
            const newAllComments = [newComment, ...allCommentsWithoutTemp];
            const newTopLevelComments = hasReplyMarker
              ? topLevelWithoutTemp // Keep topLevelComments unchanged for replies
              : [newComment, ...topLevelWithoutTemp];

            // Recreate getDirectReplies function with the new allComments array
            const getDirectReplies = (commentId: string) => {
              const directReplies = newAllComments.filter(comment => {
                const marker = getTagMarker(comment, 'e', commentId);
                return marker === 'reply';
              });
              // Sort direct replies by creation time (oldest first for threaded display)
              return directReplies.sort((a, b) => a.created_at - b.created_at);
            };

            // Recreate getDescendants function
            const getDescendants = (parentId: string): NostrEvent[] => {
              const directReplies = newAllComments.filter(comment => {
                const marker = getTagMarker(comment, 'e', parentId);
                return marker === 'reply';
              });

              const allDescendants = [...directReplies];

              // Recursively get descendants of each direct reply
              for (const reply of directReplies) {
                allDescendants.push(...getDescendants(reply.id));
              }

              return allDescendants.sort((a, b) => a.created_at - b.created_at);
            };

            console.log('[usePostComment] Adding as', hasReplyMarker ? 'threaded reply' : 'top-level comment');

            return {
              allComments: newAllComments,
              topLevelComments: newTopLevelComments,
              getDirectReplies,
              getDescendants,
            };
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
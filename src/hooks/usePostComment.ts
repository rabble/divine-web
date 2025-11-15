import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { NKinds, type NostrEvent } from '@nostrify/nostrify';

interface PostCommentParams {
  root: NostrEvent | URL; // The root event to comment on
  reply?: NostrEvent | URL; // Optional reply to another comment
  content: string;
}

/** Post a NIP-22 (kind 1111) comment on an event. */
export function usePostComment() {
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async ({ root, reply, content }: PostCommentParams) => {
      const tags: string[][] = [];

      // d-tag identifiers
      const dRoot = root instanceof URL ? '' : root.tags.find(([name]) => name === 'd')?.[1] ?? '';
      const dReply = reply instanceof URL ? '' : reply?.tags.find(([name]) => name === 'd')?.[1] ?? '';

      // Root event tags
      if (root instanceof URL) {
        tags.push(['I', root.toString()]);
      } else if (NKinds.addressable(root.kind)) {
        tags.push(['A', `${root.kind}:${root.pubkey}:${dRoot}`]);
      } else if (NKinds.replaceable(root.kind)) {
        tags.push(['A', `${root.kind}:${root.pubkey}:`]);
      } else {
        tags.push(['E', root.id]);
      }
      if (root instanceof URL) {
        tags.push(['K', root.hostname]);
      } else {
        tags.push(['K', root.kind.toString()]);
        tags.push(['P', root.pubkey]);
      }

      // Reply event tags
      if (reply) {
        if (reply instanceof URL) {
          tags.push(['i', reply.toString()]);
        } else if (NKinds.addressable(reply.kind)) {
          tags.push(['a', `${reply.kind}:${reply.pubkey}:${dReply}`]);
        } else if (NKinds.replaceable(reply.kind)) {
          tags.push(['a', `${reply.kind}:${reply.pubkey}:`]);
        } else {
          tags.push(['e', reply.id]);
        }
        if (reply instanceof URL) {
          tags.push(['k', reply.hostname]);
        } else {
          tags.push(['k', reply.kind.toString()]);
          tags.push(['p', reply.pubkey]);
        }
      } else {
        // If this is a top-level comment, use the root event's tags
        if (root instanceof URL) {
          tags.push(['i', root.toString()]);
        } else if (NKinds.addressable(root.kind)) {
          tags.push(['a', `${root.kind}:${root.pubkey}:${dRoot}`]);
        } else if (NKinds.replaceable(root.kind)) {
          tags.push(['a', `${root.kind}:${root.pubkey}:`]);
        } else {
          tags.push(['e', root.id]);
        }
        if (root instanceof URL) {
          tags.push(['k', root.hostname]);
        } else {
          tags.push(['k', root.kind.toString()]);
          tags.push(['p', root.pubkey]);
        }
      }

      const event = await publishEvent({
        kind: 1111,
        content,
        tags,
      });

      return event;
    },
    onMutate: async ({ root, content }) => {
      const videoId = root instanceof URL ? root.toString() : root.id;
      const commentsQueryKey = ['comments', videoId];
      const metricsQueryKey = ['video-social-metrics', videoId];

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: commentsQueryKey });

      // Snapshot previous value
      const previousComments = queryClient.getQueryData(commentsQueryKey);
      const previousMetrics = queryClient.getQueryData(metricsQueryKey);

      // Optimistically update comment count
      queryClient.setQueryData(metricsQueryKey, (old: any) => ({
        ...old,
        commentCount: (old?.commentCount || 0) + 1,
      }));

      // Optimistically add comment to list (if comments are loaded)
      if (user && previousComments) {
        const optimisticComment: NostrEvent = {
          id: `temp-${Date.now()}`,
          pubkey: user.pubkey,
          created_at: Math.floor(Date.now() / 1000),
          kind: 1111,
          content,
          tags: [],
          sig: '',
        };

        queryClient.setQueryData(commentsQueryKey, (old: any) => {
          if (Array.isArray(old)) {
            return [optimisticComment, ...old];
          }
          return [optimisticComment];
        });
      }

      return { previousComments, previousMetrics, videoId };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context) {
        queryClient.setQueryData(['comments', context.videoId], context.previousComments);
        queryClient.setQueryData(['video-social-metrics', context.videoId], context.previousMetrics);
      }
    },
    onSettled: (_, __, { root }) => {
      // Refetch to sync with server
      const videoId = root instanceof URL ? root.toString() : root.id;
      queryClient.invalidateQueries({
        queryKey: ['comments', videoId]
      });
      queryClient.invalidateQueries({
        queryKey: ['video-social-metrics', videoId]
      });
    },
  });
}
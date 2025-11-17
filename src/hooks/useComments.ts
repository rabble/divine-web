import { NKinds, NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

export function useComments(root: NostrEvent | URL, limit?: number) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['comments', root instanceof URL ? root.toString() : root.id, limit],
    // Keep comments cached for 5 minutes to prevent unnecessary refetches
    staleTime: 5 * 60 * 1000,
    // Keep in cache for 10 minutes
    gcTime: 10 * 60 * 1000,
    // Don't refetch when window regains focus
    refetchOnWindowFocus: false,
    // Don't refetch when component mounts if data is already cached and fresh
    refetchOnMount: 'stale',
    queryFn: async (c) => {
      if (root instanceof URL) {
        return {
          allComments: [],
          topLevelComments: [],
          getDescendants: () => [],
          getDirectReplies: () => [],
        };
      }

      // For kind 34236 addressable events, build the 'a' tag coordinate
      const dTag = root.tags.find(tag => tag[0] === 'd')?.[1];
      const aTag = dTag ? `${root.kind}:${root.pubkey}:${dTag}` : null;

      if (!aTag) {
        console.error('[useComments] No d tag found for addressable event:', root.id);
        return {
          allComments: [],
          topLevelComments: [],
          getDescendants: () => [],
          getDirectReplies: () => [],
        };
      }

      // Query for Kind 1111 (NIP-22 comments)
      // Comments reference addressable events using 'a' tag with format "kind:pubkey:d-identifier"
      const filter: NostrFilter = {
        kinds: [1111],
        '#a': [aTag]
      };

      if (typeof limit === 'number') {
        filter.limit = limit;
      }

      // Query for comments that reference this event
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);
      console.log('[useComments] Fetching comments with filter:', filter);
      const events = await nostr.query([filter], { signal });
      console.log('[useComments] Found', events.length, 'comment events');

      // Helper function to get tag marker (4th element)
      const getTagMarker = (event: NostrEvent, tagName: string, value: string): string | undefined => {
        const tag = event.tags.find(([name, val]) => name === tagName && val === value);
        return tag?.[3];
      };

      // Filter top-level comments
      // Top-level comments have an 'a' tag with marker 'root' pointing to the video
      // AND no 'e' tag with marker 'reply' (which would make it a threaded reply to another comment)
      const topLevelComments = events.filter(comment => {
        const hasRootMarker = getTagMarker(comment, 'a', aTag) === 'root';
        // Check if there's ANY 'e' tag with marker 'reply' (regardless of which comment it's replying to)
        const hasReplyMarker = comment.tags.some(tag => tag[0] === 'e' && tag[3] === 'reply');
        // Only top-level if it has root marker but NO reply marker
        return hasRootMarker && !hasReplyMarker;
      });

      console.log('[useComments] Filtered to', topLevelComments.length, 'top-level comments (with a tag marker=root)');

      // Helper function to get all descendants of a comment
      const getDescendants = (parentId: string): NostrEvent[] => {
        // Find comments with an 'e' tag with marker 'reply' pointing to this comment
        const directReplies = events.filter(comment => {
          const marker = getTagMarker(comment, 'e', parentId);
          return marker === 'reply';
        });

        const allDescendants = [...directReplies];

        // Recursively get descendants of each direct reply
        for (const reply of directReplies) {
          allDescendants.push(...getDescendants(reply.id));
        }

        return allDescendants;
      };

      // Create a map of comment ID to its descendants
      const commentDescendants = new Map<string, NostrEvent[]>();
      for (const comment of events) {
        commentDescendants.set(comment.id, getDescendants(comment.id));
      }

      // Sort top-level comments by creation time (newest first)
      const sortedTopLevel = topLevelComments.sort((a, b) => b.created_at - a.created_at);

      return {
        allComments: events,
        topLevelComments: sortedTopLevel,
        getDescendants: (commentId: string) => {
          const descendants = commentDescendants.get(commentId) || [];
          // Sort descendants by creation time (oldest first for threaded display)
          return descendants.sort((a, b) => a.created_at - b.created_at);
        },
        getDirectReplies: (commentId: string) => {
          const directReplies = events.filter(comment => {
            const marker = getTagMarker(comment, 'e', commentId);
            return marker === 'reply';
          });
          // Sort direct replies by creation time (oldest first for threaded display)
          return directReplies.sort((a, b) => a.created_at - b.created_at);
        }
      };
    },
    enabled: !!root,
  });
}
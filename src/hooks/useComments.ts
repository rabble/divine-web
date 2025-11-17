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
      // Query for Kind 1111 (NIP-22 comments)
      // Comments always reference the root event by its ID using the 'e' tag,
      // even for addressable events like Kind 34236
      const filter: NostrFilter = {
        kinds: [1111],
        '#e': root instanceof URL ? [] : [root.id]
      };

      if (typeof limit === 'number') {
        filter.limit = limit;
      }

      // Query for comments that reference this event
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);
      console.log('[useComments] Fetching comments with filter:', filter);
      const events = await nostr.query([filter], { signal });
      console.log('[useComments] Found', events.length, 'comment events');

      // Helper function to get tag value
      const getTagValue = (event: NostrEvent, tagName: string): string | undefined => {
        const tag = event.tags.find(([name]) => name === tagName);
        return tag?.[1];
      };

      // Helper function to get tag marker (4th element)
      const getTagMarker = (event: NostrEvent, tagName: string, value: string): string | undefined => {
        const tag = event.tags.find(([name, val]) => name === tagName && val === value);
        return tag?.[3];
      };

      // Filter top-level comments
      // Top-level comments have an 'e' tag with marker 'root' pointing to the video
      // Replies have an 'e' tag with marker 'reply' pointing to another comment
      const rootId = root instanceof URL ? '' : root.id;
      const topLevelComments = events.filter(comment => {
        const marker = getTagMarker(comment, 'e', rootId);
        return marker === 'root';
      });

      console.log('[useComments] Filtered to', topLevelComments.length, 'top-level comments (with marker=root)');

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
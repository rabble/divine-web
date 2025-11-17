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
    // Don't refetch when component mounts if data is already cached
    refetchOnMount: false,
    queryFn: async (c) => {
      // Query for both Kind 1 (regular notes) and Kind 1111 (NIP-22 comments)
      // This ensures compatibility with both the Android app (uses Kind 1) and NIP-22 clients
      const filter: NostrFilter = { kinds: [1, 1111] };

      // Build the filter based on root type
      // Comments use lowercase tags (e, a, i) to reference their root
      if (root instanceof URL) {
        filter['#i'] = [root.toString()];
      } else if (NKinds.addressable(root.kind)) {
        const d = root.tags.find(([name]) => name === 'd')?.[1] ?? '';
        const aTag = `${root.kind}:${root.pubkey}:${d}`;
        filter['#a'] = [aTag];
        console.log('[useComments] Querying addressable event comments:', { kind: root.kind, aTag, filter });
      } else if (NKinds.replaceable(root.kind)) {
        const aTag = `${root.kind}:${root.pubkey}:`;
        filter['#a'] = [aTag];
        console.log('[useComments] Querying replaceable event comments:', { kind: root.kind, aTag, filter });
      } else {
        filter['#e'] = [root.id];
        console.log('[useComments] Querying regular event comments:', { eventId: root.id, filter });
      }

      if (typeof limit === 'number') {
        filter.limit = limit;
      }

      // Query for all kind 1111 comments that reference this event
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]); // Increased timeout
      console.log('[useComments] Fetching comments with filter:', filter);
      const events = await nostr.query([filter], { signal });
      console.log('[useComments] Found', events.length, 'comment events');

      // Helper function to get tag value
      const getTagValue = (event: NostrEvent, tagName: string): string | undefined => {
        const tag = event.tags.find(([name]) => name === tagName);
        return tag?.[1];
      };

      // Filter top-level comments (those with lowercase tag matching the root)
      const topLevelComments = events.filter(comment => {
        let isTopLevel = false;
        if (root instanceof URL) {
          isTopLevel = getTagValue(comment, 'i') === root.toString();
        } else if (NKinds.addressable(root.kind)) {
          const d = getTagValue(root, 'd') ?? '';
          const expectedATag = `${root.kind}:${root.pubkey}:${d}`;
          const commentATag = getTagValue(comment, 'a');
          isTopLevel = commentATag === expectedATag;
          if (!isTopLevel) {
            console.log('[useComments] Comment a-tag mismatch:', { commentId: comment.id, commentATag, expectedATag });
          }
        } else if (NKinds.replaceable(root.kind)) {
          const expectedATag = `${root.kind}:${root.pubkey}:`;
          isTopLevel = getTagValue(comment, 'a') === expectedATag;
        } else {
          isTopLevel = getTagValue(comment, 'e') === root.id;
        }
        return isTopLevel;
      });

      console.log('[useComments] Filtered to', topLevelComments.length, 'top-level comments');

      // Helper function to get all descendants of a comment
      const getDescendants = (parentId: string): NostrEvent[] => {
        const directReplies = events.filter(comment => {
          const eTag = getTagValue(comment, 'e');
          return eTag === parentId;
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
            const eTag = getTagValue(comment, 'e');
            return eTag === commentId;
          });
          // Sort direct replies by creation time (oldest first for threaded display)
          return directReplies.sort((a, b) => a.created_at - b.created_at);
        }
      };
    },
    enabled: !!root,
  });
}
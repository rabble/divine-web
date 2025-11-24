import { NKinds, NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

export function useComments(root: NostrEvent | URL, limit?: number) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['nostr', 'comments', root instanceof URL ? root.toString() : root.id, limit],
    queryFn: async (c) => {
      const filter: NostrFilter = { kinds: [1111] };

      if (root instanceof URL) {
        filter['#I'] = [root.toString()];
      } else if (NKinds.addressable(root.kind)) {
        const d = root.tags.find(([name]) => name === 'd')?.[1] ?? '';
        filter['#A'] = [`${root.kind}:${root.pubkey}:${d}`];
      } else if (NKinds.replaceable(root.kind)) {
        filter['#A'] = [`${root.kind}:${root.pubkey}:`];
      } else {
        filter['#E'] = [root.id];
      }

      if (typeof limit === 'number') {
        filter.limit = limit;
      }

      // Query for all kind 1111 comments that reference this addressable event regardless of depth
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const events = await nostr.query([filter], { signal });

      // Helper function to get tag value
      const getTagValue = (event: NostrEvent, tagName: string): string | undefined => {
        const tag = event.tags.find(([name]) => name === tagName);
        return tag?.[1];
      };

      // Filter top-level comments (those with lowercase tag matching the root)
      const topLevelComments = events.filter(comment => {
        if (root instanceof URL) {
          return getTagValue(comment, 'i') === root.toString();
        } else if (NKinds.addressable(root.kind)) {
          const d = getTagValue(root, 'd') ?? '';
          return getTagValue(comment, 'a') === `${root.kind}:${root.pubkey}:${d}`;
        } else if (NKinds.replaceable(root.kind)) {
          return getTagValue(comment, 'a') === `${root.kind}:${root.pubkey}:`;
        } else {
          return getTagValue(comment, 'e') === root.id;
        }
      });

      // Sort top-level comments by creation time (newest first)
      const sortedTopLevel = topLevelComments.sort((a, b) => b.created_at - a.created_at);

      return {
        allComments: events,
        topLevelComments: sortedTopLevel,
      };
    },
    enabled: !!root,
  });
}

/**
 * Get direct replies to a comment
 */
export function getDirectReplies(allComments: NostrEvent[], commentId: string): NostrEvent[] {
  const getTagValue = (event: NostrEvent, tagName: string): string | undefined => {
    const tag = event.tags.find(([name]) => name === tagName);
    return tag?.[1];
  };
  
  const directReplies = allComments.filter(comment => {
    const eTag = getTagValue(comment, 'e');
    return eTag === commentId;
  });
  
  // Sort by creation time (oldest first for threaded display)
  return directReplies.sort((a, b) => a.created_at - b.created_at);
}

/**
 * Get all descendants of a comment recursively
 */
export function getDescendants(allComments: NostrEvent[], commentId: string): NostrEvent[] {
  const directReplies = getDirectReplies(allComments, commentId);
  const allDescendants = [...directReplies];
  
  // Recursively get descendants of each direct reply
  for (const reply of directReplies) {
    allDescendants.push(...getDescendants(allComments, reply.id));
  }
  
  // Sort by creation time (oldest first for threaded display)
  return allDescendants.sort((a, b) => a.created_at - b.created_at);
}
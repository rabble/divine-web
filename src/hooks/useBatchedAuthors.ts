// ABOUTME: Hook for efficiently fetching multiple author profiles in a single query
// ABOUTME: Reduces relay subscriptions by batching profile requests instead of individual queries

import { type NostrEvent, type NostrMetadata, NSchema as n } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * Fetch multiple author profiles in a single query and populate the cache
 * This dramatically reduces the number of relay subscriptions compared to individual useAuthor calls
 */
export function useBatchedAuthors(pubkeys: string[]) {
  const { nostr } = useNostr();
  const queryClient = useQueryClient();

  // Get unique pubkeys
  const uniquePubkeys = Array.from(new Set(pubkeys.filter(Boolean)));

  const query = useQuery({
    queryKey: ['batched-authors', uniquePubkeys.sort().join(',')],
    queryFn: async ({ signal }) => {
      if (uniquePubkeys.length === 0) {
        return {};
      }

      // Single query for all authors
      const events = await nostr.query(
        [{ kinds: [0], authors: uniquePubkeys, limit: uniquePubkeys.length }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(3000)]) },
      );

      // Parse metadata and create a map
      const authorsMap: Record<string, { event: NostrEvent; metadata?: NostrMetadata }> = {};

      for (const event of events) {
        try {
          const metadata = n.json().pipe(n.metadata()).parse(event.content);
          authorsMap[event.pubkey] = { event, metadata };
        } catch {
          authorsMap[event.pubkey] = { event };
        }
      }

      return authorsMap;
    },
    staleTime: 60000, // Cache for 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
    enabled: uniquePubkeys.length > 0,
  });

  // Populate individual author cache entries so useAuthor hooks can use them
  useEffect(() => {
    if (query.data) {
      Object.entries(query.data).forEach(([pubkey, authorData]) => {
        queryClient.setQueryData(['author', pubkey], authorData);
      });
    }
  }, [query.data, queryClient]);

  return query;
}

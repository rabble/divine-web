import { type NostrEvent, type NostrMetadata, NSchema as n } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

export function useAuthor(pubkey: string | undefined) {
  const { nostr } = useNostr();

  return useQuery<{ event?: NostrEvent; metadata?: NostrMetadata }>({
    queryKey: ['author', pubkey ?? ''],
    queryFn: async ({ signal }) => {
      if (!pubkey) {
        return {};
      }

      const [event] = await nostr.query(
        [{ kinds: [0], authors: [pubkey!], limit: 1 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) },
      );

      if (!event) {
        // Return empty object instead of throwing error
        // This allows components to use fallback display names
        return {};
      }

      // Republish the profile to the main relay in the background
      // This ensures profiles are cached on relay.divine.video even if they came from profile relays
      nostr.event(event).catch(() => {
        // Silently ignore republish errors - this is best-effort caching
      });

      try {
        const metadata = n.json().pipe(n.metadata()).parse(event.content);
        return { metadata, event };
      } catch {
        return { event };
      }
    },
    retry: 1, // Reduce retries since many profiles don't exist
    staleTime: 300000, // Cache for 5 minutes
    gcTime: 1800000, // Keep in cache for 30 minutes
  });
}

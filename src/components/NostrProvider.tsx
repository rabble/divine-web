import React, { useEffect, useRef } from 'react';
import { NostrEvent, NPool, NRelay1 } from '@nostrify/nostrify';
import { NostrContext } from '@nostrify/react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/hooks/useAppContext';
import { debugLog, verboseLog } from '@/lib/debug';
import { createCachedNostr } from '@/lib/cachedNostr';

interface NostrProviderProps {
  children: React.ReactNode;
}

const NostrProvider: React.FC<NostrProviderProps> = (props) => {
  const { children } = props;
  const { config, presetRelays } = useAppContext();

  const queryClient = useQueryClient();

  // Create NPool instance only once
  const pool = useRef<NPool | undefined>(undefined);
  const cachedPool = useRef<any | undefined>(undefined);

  // Use refs so the pool always has the latest data
  const relayUrl = useRef<string>(config.relayUrl);

  // Update refs when config changes
  useEffect(() => {
    relayUrl.current = config.relayUrl;
    queryClient.resetQueries();
  }, [config.relayUrl, queryClient]);

  // Initialize NPool only once
  if (!pool.current) {
    debugLog('[NostrProvider] Creating NPool instance');
    pool.current = new NPool({
      open(url: string) {
        verboseLog('[NostrProvider] Opening relay connection to:', url);
        const relay = new NRelay1(url, {
          idleTimeout: false, // Disable idle timeout to prevent premature connection closure
          log: (log) => verboseLog(`[NRelay1:${log.ns}]`, log),
        });
        verboseLog('[NostrProvider] NRelay1 instance created, readyState:', relay.socket?.readyState);
        return relay;
      },
      reqRouter(filters) {
        debugLog('[NostrProvider] ========== reqRouter called ==========');
        debugLog('[NostrProvider] Filters:', filters);

        // Check if this is a bunker-related query (NIP-46 kind 24133)
        const isBunkerQuery = filters.some(f => f.kinds?.includes(24133));

        if (isBunkerQuery) {
          // For bunker queries, return undefined to let the caller specify the relay
          // This allows NLogin.fromBunker() to use the relay from the bunker URL
          debugLog('[NostrProvider] Bunker query detected - allowing caller to specify relay');
          return undefined;
        }

        // For all queries, route to the app's selected relay
        debugLog('[NostrProvider] Routing to relay:', relayUrl.current);
        const result = new Map([[relayUrl.current, filters]]);
        debugLog('[NostrProvider] Router result:', Array.from(result.entries()));
        return result;
      },
      eventRouter(_event: NostrEvent) {
        // Publish to the selected relay
        const allRelays = new Set<string>([relayUrl.current]);

        // Also publish to the preset relays, capped to 5
        for (const { url } of (presetRelays ?? [])) {
          allRelays.add(url);

          if (allRelays.size >= 5) {
            break;
          }
        }

        return [...allRelays];
      },
    });

    // Wrap with caching layer
    cachedPool.current = createCachedNostr(pool.current);
    debugLog('[NostrProvider] Wrapped NPool with caching layer');

    // Pre-establish WebSocket connection synchronously
    // This ensures the connection starts BEFORE any child components query
    debugLog('[NostrProvider] Pre-warming connection to:', relayUrl.current);
    pool.current.relay(relayUrl.current);
    debugLog('[NostrProvider] Connection initiated');
  }

  return (
    <NostrContext.Provider value={{ nostr: cachedPool.current || pool.current }}>
      {children}
    </NostrContext.Provider>
  );
};

export default NostrProvider;
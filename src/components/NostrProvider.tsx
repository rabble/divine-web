import React, { useEffect, useRef } from 'react';
import { NostrEvent, NostrFilter, NPool, NRelay1 } from '@nostrify/nostrify';
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
  const cachedPool = useRef<NPool | undefined>(undefined);

  // Use refs so the pool always has the latest data
  const relayUrl = useRef<string>(config.relayUrl);

  // Update refs when config changes and close old relay connections
  useEffect(() => {
    const oldRelayUrl = relayUrl.current;
    relayUrl.current = config.relayUrl;

    // If relay URL changed, close old connection and reset queries
    if (oldRelayUrl !== config.relayUrl && pool.current) {
      debugLog('[NostrProvider] Relay changed from', oldRelayUrl, 'to', config.relayUrl);

      // Close the old relay connection
      const oldRelay = pool.current.relays.get(oldRelayUrl);
      if (oldRelay) {
        debugLog('[NostrProvider] Closing old relay connection:', oldRelayUrl);
        oldRelay.close();
        // Note: Can't delete from ReadonlyMap, but closing the connection is sufficient
      }

      // Pre-warm the new relay connection
      debugLog('[NostrProvider] Opening new relay connection:', config.relayUrl);
      pool.current.relay(config.relayUrl);

      // Reset all queries to fetch fresh data from new relay
      queryClient.resetQueries();
    }
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
      reqRouter(filters): ReadonlyMap<string, NostrFilter[]> {
        debugLog('[NostrProvider] ========== reqRouter called ==========');
        debugLog('[NostrProvider] Filters:', filters);

        const result = new Map<string, NostrFilter[]>();

        // Separate filters by kind for kind-specific relay routing
        const profileRelayFilters: NostrFilter[] = []; // Kind 0 (profiles) and Kind 3 (contact lists)
        const otherFilters: NostrFilter[] = [];

        for (const filter of filters) {
          if (filter.kinds?.includes(0) || filter.kinds?.includes(3)) {
            // Kind 0 (profile metadata) and Kind 3 (contact lists) - route to profile relays
            profileRelayFilters.push(filter);
          } else {
            // All other kinds - route to main relay
            otherFilters.push(filter);
          }
        }

        // Route kind 0 and kind 3 queries to profile-specific relays for better availability
        if (profileRelayFilters.length > 0) {
          const profileRelays = [
            'wss://purplepag.es',
            'wss://relay.nos.social',
            'wss://relay.damus.io',
            'wss://nos.lol',
          ];

          debugLog(`[NostrProvider] Routing ${profileRelayFilters.length} profile/contact filters to ${profileRelays.length} relays`);

          for (const relay of profileRelays) {
            result.set(relay, profileRelayFilters);
          }
        }

        // Route other queries to the selected relay only
        if (otherFilters.length > 0) {
          result.set(relayUrl.current, otherFilters);
        }

        debugLog('[NostrProvider] Router result:', Array.from(result.entries()));
        return result as ReadonlyMap<string, NostrFilter[]>;
      },
      eventRouter(event: NostrEvent) {
        // Publish to the selected relay
        const allRelays = new Set<string>([relayUrl.current]);

        // For contact lists (kind 3), publish to multiple relays for better availability
        if (event.kind === 3) {
          // Add common relays where contact lists should be stored
          allRelays.add('wss://purplepag.es');
          allRelays.add('wss://relay.nos.social');
          allRelays.add('wss://relay.damus.io');
          allRelays.add('wss://nos.lol');
        }

        // For list events (kind 30000, 30001, 30005), publish to multiple relays for better discoverability
        const LIST_KINDS = [30000, 30001, 30005];
        if (LIST_KINDS.includes(event.kind)) {
          // Add common relays where lists should be stored
          allRelays.add('wss://relay.nostr.band');
          allRelays.add('wss://relay.damus.io');
          allRelays.add('wss://nos.lol');
        }

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
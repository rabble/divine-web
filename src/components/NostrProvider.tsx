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
        const profileFilters: NostrFilter[] = [];
        const videoFilters: NostrFilter[] = [];
        const listFilters: NostrFilter[] = [];
        const otherFilters: NostrFilter[] = [];

        // Video kinds from NIP-71
        const VIDEO_KINDS = [21, 22, 34236];
        // List kinds from NIP-51
        const LIST_KINDS = [30000, 30001, 30005]; // Video sets (30005) and other list types

        for (const filter of filters) {
          if (filter.kinds?.includes(0)) {
            // Kind 0 (profile metadata) - route to profile relays
            profileFilters.push(filter);
          } else if (filter.kinds?.some(k => VIDEO_KINDS.includes(k))) {
            // Video kinds - route to video relays with fallbacks
            videoFilters.push(filter);
          } else if (filter.kinds?.some(k => LIST_KINDS.includes(k))) {
            // List kinds - route to multiple relays for better discovery
            listFilters.push(filter);
          } else {
            // All other kinds - route to main relay
            otherFilters.push(filter);
          }
        }

        // Route kind 0 queries to profile-specific relays
        if (profileFilters.length > 0) {
          result.set('wss://purplepag.es', profileFilters);
          result.set('wss://relay.nos.social', profileFilters);
        }

        // Route video queries to multiple relays for redundancy
        if (videoFilters.length > 0) {
          // Primary relay first
          result.set(relayUrl.current, videoFilters);

          // Add fallback relays for video content
          // This ensures videos still load if primary relay is down
          const fallbackRelays = [
            'wss://relay3.openvine.co',
            'wss://relay.nostr.band',
            'wss://relay.damus.io',
            'wss://nos.lol',
            'wss://relay.primal.net',
          ];

          for (const fallbackRelay of fallbackRelays) {
            if (fallbackRelay !== relayUrl.current) {
              result.set(fallbackRelay, videoFilters);
            }
          }
        }

        // Route list queries to multiple relays for better discovery
        // Lists can be created on any relay, so we query multiple relays
        if (listFilters.length > 0) {
          // Primary relay first
          result.set(relayUrl.current, listFilters);

          // Add common relays where lists might be stored
          const listRelays = [
            'wss://relay3.openvine.co',
            'wss://relay.nostr.band',
            'wss://relay.damus.io',
            'wss://nos.lol',
            'wss://relay.primal.net',
            'wss://purplepag.es',
          ];

          for (const listRelay of listRelays) {
            if (listRelay !== relayUrl.current) {
              result.set(listRelay, listFilters);
            }
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

        // For list events (kind 30005), publish to multiple relays for better discoverability
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
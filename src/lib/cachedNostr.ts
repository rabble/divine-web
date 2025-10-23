// ABOUTME: Cache-aware Nostr client wrapper that checks cache before querying relays
// ABOUTME: Automatically caches query results and published events

import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { eventCache } from './eventCache';
import { debugLog } from './debug';

/**
 * Wrap a Nostr client with caching layer
 * Preserves all original methods while adding caching to query and event
 */
export function createCachedNostr(baseNostr: any): any {
  const wrapper = Object.create(baseNostr);

  // Store reference to original methods
  const originalQuery = baseNostr.query.bind(baseNostr);
  const originalEvent = baseNostr.event.bind(baseNostr);

  // Override query method with caching
  wrapper.query = async function(filters: NostrFilter[], opts?: { signal?: AbortSignal }): Promise<NostrEvent[]> {
    const startTime = performance.now();

    // Check if this is a query for user's own events (should be cached)
    const shouldCache = filters.some(f =>
      (f.kinds && [0, 3].includes(f.kinds[0])) || // Profile and contacts
      (f.authors && f.authors.length === 1) // Single author queries
    );

    if (shouldCache) {
      // Try cache first
      const cacheStart = performance.now();
      const cachedResults = await eventCache.query(filters);
      const cacheTime = performance.now() - cacheStart;

      if (cachedResults.length > 0) {
        debugLog(`[CachedNostr] Cache hit: ${cachedResults.length} events in ${cacheTime.toFixed(1)}ms`);

        // For replaceable events (kind 0, 3), if we have results, return them
        // They're the most recent anyway
        const hasReplaceableKinds = filters.some(f =>
          f.kinds && f.kinds.some(k => k === 0 || k === 3 || (k >= 10000 && k < 20000))
        );

        if (hasReplaceableKinds) {
          return cachedResults;
        }

        // For regular events, still query relay but return cached results immediately
        // Then update in background
        queryAndCacheInBackground(originalQuery, filters, opts);
        return cachedResults;
      }
    }

    // Query from relays
    const relayStart = performance.now();
    const relayResults = await originalQuery(filters, opts);
    const relayTime = performance.now() - relayStart;

    debugLog(`[CachedNostr] Relay query: ${relayResults.length} events in ${relayTime.toFixed(1)}ms`);

    // Cache results if appropriate
    if (shouldCache && relayResults.length > 0) {
      await cacheResults(relayResults);
    }

    const totalTime = performance.now() - startTime;
    debugLog(`[CachedNostr] Total query time: ${totalTime.toFixed(1)}ms`);

    return relayResults;
  };

  // Override event method to cache published events
  wrapper.event = async function(event: NostrEvent, opts?: { signal?: AbortSignal }): Promise<any> {
    // Publish to relay
    const result = await originalEvent(event, opts);

    // Cache the event
    await eventCache.event(event);
    debugLog('[CachedNostr] Published and cached event:', event.id);

    return result;
  };

  return wrapper;
}

/**
 * Background query to update cache
 */
async function queryAndCacheInBackground(
  queryFn: (filters: NostrFilter[], opts?: { signal?: AbortSignal }) => Promise<NostrEvent[]>,
  filters: NostrFilter[],
  opts?: { signal?: AbortSignal }
): Promise<void> {
  try {
    const results = await queryFn(filters, opts);
    await cacheResults(results);
    debugLog(`[CachedNostr] Background cache update: ${results.length} events`);
  } catch (err) {
    debugLog('[CachedNostr] Background cache update failed:', err);
  }
}

/**
 * Cache multiple events
 */
async function cacheResults(events: NostrEvent[]): Promise<void> {
  for (const event of events) {
    await eventCache.event(event);
  }
}

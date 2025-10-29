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
  // TEMPORARY: Bypass cache to debug relay connection issue
  debugLog('[CachedNostr] BYPASSING CACHE - using base nostr directly');
  return baseNostr;
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

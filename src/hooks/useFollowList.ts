// ABOUTME: Hook for getting the current user's follow list (kind 3 contact list)
// ABOUTME: Returns array of followed pubkeys with proper caching and error handling
// ABOUTME: Uses localStorage + IndexedDB cache for instant initial load

import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { followListCache } from '@/lib/followListCache';
import { debugLog, debugError } from '@/lib/debug';
import { useEffect, useRef } from 'react';

/**
 * Get the current user's follow list (people they follow)
 * Returns an array of pubkeys
 *
 * Uses multi-layer caching strategy:
 * 1. Check localStorage for instant load (< 100ms)
 * 2. Show cached data immediately if fresh (< 5 minutes old)
 * 3. Background refresh from relay to ensure up-to-date data
 * 4. Fallback to IndexedDB if localStorage was cleared
 */
export function useFollowList() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const hasAttemptedIndexedDBLoad = useRef(false);

  // Attempt to load from IndexedDB on mount if localStorage is empty
  useEffect(() => {
    if (!user?.pubkey || hasAttemptedIndexedDBLoad.current) return;

    const loadFromIndexedDB = async () => {
      const localCache = followListCache.getCached(user.pubkey);
      if (localCache) return; // Already have data in localStorage

      debugLog('[useFollowList] No localStorage cache, attempting IndexedDB load');
      const indexedDBCache = await followListCache.loadFromIndexedDB(user.pubkey);

      if (indexedDBCache) {
        debugLog(`[useFollowList] Restored from IndexedDB: ${indexedDBCache.follows.length} follows`);
      }
    };

    hasAttemptedIndexedDBLoad.current = true;
    loadFromIndexedDB();
  }, [user?.pubkey]);

  return useQuery<string[]>({
    queryKey: ['follow-list', user?.pubkey],

    queryFn: async (context) => {
      if (!user?.pubkey) {
        return [];
      }

      const signal = AbortSignal.any([context.signal, AbortSignal.timeout(5000)]);

      try {
        debugLog(`[useFollowList] ========== FETCHING FOLLOW LIST ==========`);
        debugLog(`[useFollowList] User pubkey: ${user.pubkey}`);

        const queryFilter = {
          kinds: [3],
          authors: [user.pubkey],
          limit: 1,
        };
        debugLog(`[useFollowList] Query filter:`, queryFilter);

        const contactListEvents = await nostr.query([queryFilter], { signal });

        debugLog(`[useFollowList] Received ${contactListEvents.length} kind 3 events`);

        if (contactListEvents.length === 0) {
          debugLog(`[useFollowList] ⚠️ WARNING: No contact list found for user ${user.pubkey}`);
          debugLog(`[useFollowList] This means either:`);
          debugLog(`[useFollowList]   1. User has never followed anyone`);
          debugLog(`[useFollowList]   2. Contact list not on any connected relay`);
          debugLog(`[useFollowList]   3. Query failed to reach relays`);

          // Return cached data if available, even if relay has nothing
          const cached = followListCache.getCached(user.pubkey);
          if (cached) {
            debugLog(`[useFollowList] Returning cached data since relay returned nothing`);
            return cached.follows;
          }

          return [];
        }

        // Get the most recent contact list event
        const contactList = contactListEvents
          .sort((a, b) => b.created_at - a.created_at)[0];

        debugLog(`[useFollowList] Contact list event ID: ${contactList.id}`);
        debugLog(`[useFollowList] Contact list created at: ${new Date(contactList.created_at * 1000).toISOString()}`);
        debugLog(`[useFollowList] Contact list has ${contactList.tags.length} total tags`);

        // Check if this is newer than our cached version
        const isNewer = !followListCache.isNewerThan(user.pubkey, contactList.created_at);
        if (!isNewer) {
          debugLog(`[useFollowList] Relay data is older than cache, keeping cached version`);
          const cached = followListCache.getCached(user.pubkey);
          return cached?.follows || [];
        }

        // Extract followed pubkeys from 'p' tags
        const pTags = contactList.tags.filter(tag => tag[0] === 'p');
        debugLog(`[useFollowList] Found ${pTags.length} 'p' tags`);

        const follows = pTags
          .filter(tag => tag[1]) // Must have pubkey value
          .map(tag => tag[1]);

        debugLog(`[useFollowList] ✅ Extracted ${follows.length} valid followed pubkeys`);

        if (follows.length > 0) {
          debugLog(`[useFollowList] Sample follows (first 5):`);
          follows.slice(0, 5).forEach((pk, i) => {
            debugLog(`[useFollowList]   ${i + 1}. ${pk}`);
          });
          if (follows.length > 5) {
            debugLog(`[useFollowList]   ... and ${follows.length - 5} more`);
          }
        }

        // Cache the fresh data
        followListCache.setCached({
          pubkey: user.pubkey,
          follows,
          timestamp: Date.now(),
          eventId: contactList.id,
          createdAt: contactList.created_at,
        });

        return follows;
      } catch (error) {
        debugError(`[useFollowList] Error fetching follow list:`, error);

        // Return cached data on error if available
        const cached = followListCache.getCached(user.pubkey);
        if (cached) {
          debugLog(`[useFollowList] Returning cached data due to error`);
          return cached.follows;
        }

        return [];
      }
    },

    // Use cached data as initialData for instant UI rendering
    initialData: () => {
      if (!user?.pubkey) return undefined;

      const cached = followListCache.getCached(user.pubkey);
      if (cached) {
        const isFresh = followListCache.isFresh(user.pubkey);
        debugLog(`[useFollowList] Using cached follow list as initialData (${cached.follows.length} follows, fresh: ${isFresh})`);
        return cached.follows;
      }

      return undefined;
    },

    // Provide timestamp of cached data so React Query knows when to refetch
    initialDataUpdatedAt: () => {
      if (!user?.pubkey) return undefined;
      const cached = followListCache.getCached(user.pubkey);
      return cached?.timestamp;
    },

    enabled: !!user?.pubkey,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes (increased from 1 minute)
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes (increased from 5 minutes)
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: 'always', // Always check for updates, but show cached data first
  });
}

/**
 * Invalidate the follow list cache for the current user
 * Call this after follow/unfollow actions
 */
export function invalidateFollowListCache(pubkey: string) {
  followListCache.invalidate(pubkey);
  debugLog(`[useFollowList] Cache invalidated for ${pubkey}`);
}

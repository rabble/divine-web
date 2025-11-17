// ABOUTME: Preloads user's events into cache when they log in
// ABOUTME: Runs inside NostrProvider context to avoid circular dependencies
// ABOUTME: Also preloads follow list from IndexedDB for faster initial load

import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { eventCache } from '@/lib/eventCache';
import { followListCache } from '@/lib/followListCache';
import { debugLog } from '@/lib/debug';

export function EventCachePreloader() {
  const { user } = useCurrentUser();

  useEffect(() => {
    if (user?.pubkey) {
      debugLog('[EventCachePreloader] Preloading caches for user:', user.pubkey);

      // Preload event cache (profiles, contacts, posts)
      eventCache.preloadUserEvents(user.pubkey).catch(err => {
        console.error('[EventCachePreloader] Failed to preload user events:', err);
      });

      // Preload follow list from IndexedDB to localStorage if needed
      const cachedFollowList = followListCache.getCached(user.pubkey);
      if (!cachedFollowList) {
        debugLog('[EventCachePreloader] No follow list in localStorage, loading from IndexedDB');
        followListCache.loadFromIndexedDB(user.pubkey).catch(err => {
          console.error('[EventCachePreloader] Failed to load follow list from IndexedDB:', err);
        });
      } else {
        debugLog('[EventCachePreloader] Follow list already in localStorage:', cachedFollowList.follows.length, 'follows');
      }
    }
  }, [user?.pubkey]);

  return null; // This component doesn't render anything
}

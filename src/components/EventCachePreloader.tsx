// ABOUTME: Preloads user's events into cache when they log in
// ABOUTME: Runs inside NostrProvider context to avoid circular dependencies

import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { eventCache } from '@/lib/eventCache';
import { debugLog } from '@/lib/debug';

export function EventCachePreloader() {
  const { user } = useCurrentUser();

  useEffect(() => {
    if (user?.pubkey) {
      debugLog('[EventCachePreloader] Preloading events for user:', user.pubkey);
      eventCache.preloadUserEvents(user.pubkey).catch(err => {
        console.error('[EventCachePreloader] Failed to preload user events:', err);
      });
    }
  }, [user?.pubkey]);

  return null; // This component doesn't render anything
}

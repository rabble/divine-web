// ABOUTME: Hook for getting the current user's follow list (kind 3 contact list)
// ABOUTME: Returns array of followed pubkeys with proper caching and error handling

import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { debugLog, debugError } from '@/lib/debug';

/**
 * Get the current user's follow list (people they follow)
 * Returns an array of pubkeys
 */
export function useFollowList() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

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
          return [];
        }

        // Get the most recent contact list event
        const contactList = contactListEvents
          .sort((a, b) => b.created_at - a.created_at)[0];

        debugLog(`[useFollowList] Contact list event ID: ${contactList.id}`);
        debugLog(`[useFollowList] Contact list created at: ${new Date(contactList.created_at * 1000).toISOString()}`);
        debugLog(`[useFollowList] Contact list has ${contactList.tags.length} total tags`);

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

        return follows;
      } catch (error) {
        debugError(`[useFollowList] Error fetching follow list:`, error);
        return [];
      }
    },
    enabled: !!user?.pubkey,
    staleTime: 60000, // Consider data stale after 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // Always refetch on mount to ensure fresh data
  });
}

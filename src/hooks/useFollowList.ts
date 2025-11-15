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
        debugLog(`[useFollowList] Fetching follow list for user: ${user.pubkey}`);
        
        const contactListEvents = await nostr.query([{
          kinds: [3],
          authors: [user.pubkey],
          limit: 1,
        }], { signal });

        debugLog(`[useFollowList] Received ${contactListEvents.length} kind 3 events`);

        if (contactListEvents.length === 0) {
          debugLog(`[useFollowList] No contact list found for user`);
          return [];
        }

        // Get the most recent contact list event
        const contactList = contactListEvents
          .sort((a, b) => b.created_at - a.created_at)[0];

        debugLog(`[useFollowList] Contact list has ${contactList.tags.length} total tags`);

        // Extract followed pubkeys from 'p' tags
        const follows = contactList.tags
          .filter(tag => tag[0] === 'p' && tag[1])
          .map(tag => tag[1]);

        debugLog(`[useFollowList] Extracted ${follows.length} followed pubkeys`);
        
        if (follows.length > 0) {
          debugLog(`[useFollowList] Following: ${follows.slice(0, 5).join(', ')}${follows.length > 5 ? '...' : ''}`);
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

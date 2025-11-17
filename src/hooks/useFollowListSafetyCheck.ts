// ABOUTME: Safety check to prevent accidental follow list overwrites
// ABOUTME: Warns users from other clients if they have no follow list on divine

import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { debugLog } from '@/lib/debug';

interface SafetyCheckResult {
  needsWarning: boolean;
  hasExistingFollowList: boolean;
  hasExistingProfile: boolean;
  isDivineClient: boolean;
  clientTag?: string;
}

/**
 * Check if user needs a follow list safety warning
 * 
 * Warning shown when:
 * - User has NO follow list on divine (empty or missing Kind 3)
 * - User's Kind 0 profile does NOT contain a "client" tag from divine
 * 
 * This prevents users from other clients accidentally wiping their follow list
 * when they first follow someone on divine.
 */
export function useFollowListSafetyCheck(pubkey: string | undefined, enabled: boolean = true) {
  const { nostr } = useNostr();

  return useQuery<SafetyCheckResult>({
    queryKey: ['follow-list-safety-check', pubkey],
    queryFn: async (context) => {
      if (!pubkey) {
        return {
          needsWarning: false,
          hasExistingFollowList: false,
          hasExistingProfile: false,
          isDivineClient: false,
        };
      }

      const signal = AbortSignal.any([context.signal, AbortSignal.timeout(5000)]);

      try {
        debugLog('[SafetyCheck] Checking follow list safety for', pubkey);

        // Query for user's Kind 0 profile and Kind 3 contact list
        const events = await nostr.query([
          {
            kinds: [0, 3],
            authors: [pubkey],
            limit: 2,
          }
        ], { signal });

        const profileEvent = events.find(e => e.kind === 0);
        const contactListEvent = events.find(e => e.kind === 3);

        debugLog('[SafetyCheck] Profile event:', !!profileEvent);
        debugLog('[SafetyCheck] Contact list event:', !!contactListEvent);

        // Check if user has existing profile
        const hasExistingProfile = !!profileEvent;

        // Check if profile has divine client tag
        let isDivineClient = false;
        let clientTag: string | undefined;

        if (profileEvent) {
          try {
            const metadata = JSON.parse(profileEvent.content);
            
            // Check for client tag in metadata
            // Divine clients should tag their profiles with "client": "divine" or similar
            clientTag = metadata.client;
            
            // List of divine client identifiers
            const divineClientNames = [
              'divine',
              'divine.video',
              'divineweb',
              'divine web',
              'openvine',
            ];

            isDivineClient = divineClientNames.some(name => 
              clientTag?.toLowerCase().includes(name)
            );

            debugLog('[SafetyCheck] Client tag:', clientTag);
            debugLog('[SafetyCheck] Is divine client:', isDivineClient);
          } catch (err) {
            debugLog('[SafetyCheck] Failed to parse profile metadata:', err);
          }
        }

        // Check if user has existing follow list with contacts
        const hasExistingFollowList = contactListEvent 
          ? contactListEvent.tags.filter(tag => tag[0] === 'p').length > 0
          : false;

        debugLog('[SafetyCheck] Has existing follow list:', hasExistingFollowList);

        // User needs warning if:
        // 1. They have no follow list (or empty follow list) on divine
        // 2. AND their profile is NOT from a divine client
        const needsWarning = !hasExistingFollowList && !isDivineClient && hasExistingProfile;

        debugLog('[SafetyCheck] Needs warning:', needsWarning);

        return {
          needsWarning,
          hasExistingFollowList,
          hasExistingProfile,
          isDivineClient,
          clientTag,
        };
      } catch (error) {
        console.error('[SafetyCheck] Error checking follow list safety:', error);
        
        // On error, don't show warning (fail open)
        return {
          needsWarning: false,
          hasExistingFollowList: false,
          hasExistingProfile: false,
          isDivineClient: false,
        };
      }
    },
    enabled: enabled && !!pubkey,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

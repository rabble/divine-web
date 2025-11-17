import { useNostr } from '@nostrify/react';
import { NLogin, useNostrLogin } from '@nostrify/react/login';
import { followListCache } from '@/lib/followListCache';
import { debugLog } from '@/lib/debug';

// NOTE: This file should not be edited except for adding new login methods.

export function useLoginActions() {
  const { nostr } = useNostr();
  const { logins, addLogin, removeLogin } = useNostrLogin();

  return {
    // Login with a Nostr secret key
    nsec(nsec: string): void {
      const login = NLogin.fromNsec(nsec);
      addLogin(login);
    },
    // Login with a NIP-46 "bunker://" URI
    async bunker(uri: string): Promise<void> {
      const login = await NLogin.fromBunker(uri, nostr);
      addLogin(login);
    },
    // Login with a NIP-07 browser extension
    async extension(): Promise<void> {
      const login = await NLogin.fromExtension();
      addLogin(login);
    },
    // Log out the current user
    async logout(): Promise<void> {
      const login = logins[0];
      if (login) {
        // Clear user-specific caches on logout for privacy
        try {
          // Get user pubkey before removing login
          const user = login.type === 'nsec'
            ? (await import('@nostrify/nostrify')).NSecSigner.fromNsec(login.data.nsec).getPublicKey()
            : undefined;

          if (user) {
            debugLog('[useLoginActions] Clearing caches for user on logout:', user);
            followListCache.invalidate(user);
          } else {
            // If we can't determine pubkey, clear all follow list caches
            debugLog('[useLoginActions] Clearing all follow list caches on logout');
            await followListCache.clearAll();
          }
        } catch (error) {
          console.warn('[useLoginActions] Failed to clear caches on logout:', error);
        }

        removeLogin(login.id);
      }
    }
  };
}

// ABOUTME: Component that injects window.nostr using JWT-based Keycast signing
// ABOUTME: Alternative to bunker-based signing for simpler HTTP-based authentication

import { useEffect } from 'react';
import { useKeycastSession } from '@/hooks/useKeycastSession';
import { useWindowNostrJWT } from '@/hooks/useWindowNostrJWT';

export interface KeycastJWTWindowNostrProps {
  /** Whether to show console logs (default: false) */
  verbose?: boolean;
}

/**
 * Component that automatically injects window.nostr when user has a valid JWT token
 *
 * This provides window.nostr compatibility for existing Nostr libraries without
 * requiring a bunker connection. Signing happens via direct HTTP requests to
 * Keycast API with JWT Bearer authentication.
 *
 * Place this component in your app root (App.tsx) to enable JWT-based signing:
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <NostrLoginProvider>
 *       <KeycastJWTWindowNostr />
 *       <YourAppContent />
 *     </NostrLoginProvider>
 *   );
 * }
 * ```
 */
export function KeycastJWTWindowNostr(
  props: KeycastJWTWindowNostrProps = {}
): null {
  const { verbose = false } = props;
  const { getValidToken } = useKeycastSession();
  const token = getValidToken();

  const { signer, isInitializing, error, isInjected } = useWindowNostrJWT({
    token,
    autoInject: true,
  });

  // Log status changes if verbose
  useEffect(() => {
    if (!verbose) return;

    if (isInitializing) {
      console.log('[KeycastJWTWindowNostr] Initializing JWT signer...');
    } else if (error) {
      console.error('[KeycastJWTWindowNostr] Error:', error.message);
    } else if (isInjected) {
      console.log('[KeycastJWTWindowNostr] ✅ window.nostr injected successfully!');
    } else if (!token) {
      console.log('[KeycastJWTWindowNostr] No JWT token available');
    }
  }, [isInitializing, error, isInjected, token, verbose]);

  // Log when signer becomes available
  useEffect(() => {
    if (verbose && signer) {
      signer.getPublicKey().then((pubkey) => {
        console.log('[KeycastJWTWindowNostr] Signed in as:', pubkey);
      });
    }
  }, [signer, verbose]);

  return null; // This component doesn't render anything
}

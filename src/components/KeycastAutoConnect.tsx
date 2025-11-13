// ABOUTME: Automatically reconnects Keycast bunker on page load if user has a session
// ABOUTME: Ensures bunker signing works after page refresh

import { useEffect, useRef } from 'react';
import { useNostrLogin } from '@nostrify/react/login';
import { useLoginActions } from '@/hooks/useLoginActions';
import { useKeycastSession } from '@/hooks/useKeycastSession';
import { getBunkerUrl } from '@/lib/keycast';
import { toast } from '@/hooks/useToast';

export function KeycastAutoConnect() {
  const { logins } = useNostrLogin();
  const login = useLoginActions();
  const { getSavedBunkerUrl, getValidToken, clearSession, saveBunkerUrl } = useKeycastSession();
  const hasConnected = useRef(false);

  useEffect(() => {
    // Only run once on mount
    if (hasConnected.current) return;

    // Check if we already have a bunker login
    if (logins.length > 0) {
      console.log('[KeycastAutoConnect] Already have login, skipping auto-connect');
      hasConnected.current = true;
      return;
    }

    // Try to get saved bunker URL first (long-lived credential)
    const savedBunkerUrl = getSavedBunkerUrl();
    const token = getValidToken();

    if (!savedBunkerUrl && !token) {
      console.log('[KeycastAutoConnect] No saved bunker URL or session found');
      return;
    }

    console.log('[KeycastAutoConnect] Found saved credentials, auto-connecting bunker...');
    hasConnected.current = true;

    // Show reconnecting toast
    toast({
      title: 'Reconnecting',
      description: 'Restoring your signing connection...',
    });

    // Try saved bunker URL first, fall back to fetching new one with JWT
    const bunkerUrlPromise = savedBunkerUrl
      ? Promise.resolve(savedBunkerUrl)
      : token
      ? getBunkerUrl(token)
      : Promise.reject(new Error('No credentials available'));

    bunkerUrlPromise
      .then((bunkerUrl) => {
        console.log('[KeycastAutoConnect] Got bunker URL, connecting...');

        // If we fetched a new bunker URL (not using saved one), save it
        if (!savedBunkerUrl && bunkerUrl) {
          console.log('[KeycastAutoConnect] Saving newly fetched bunker URL');
          saveBunkerUrl(bunkerUrl);
        }

        const bunkerStart = Date.now();

        return login.bunker(bunkerUrl).then(() => {
          const bunkerTime = Date.now() - bunkerStart;
          console.log(`[KeycastAutoConnect] ✅ Auto-reconnected in ${bunkerTime}ms!`);

          toast({
            title: 'Connected!',
            description: 'Your signing service is ready.',
          });

          // Reload to update UI
          setTimeout(() => window.location.reload(), 500);
        });
      })
      .catch((err) => {
        console.error('[KeycastAutoConnect] Auto-connect failed:', err);

        // If using saved bunker URL failed, try fetching a new one with JWT
        if (savedBunkerUrl && token) {
          console.log('[KeycastAutoConnect] Saved bunker URL failed, trying to fetch new one with JWT...');
          getBunkerUrl(token)
            .then((freshBunkerUrl) => {
              console.log('[KeycastAutoConnect] Got fresh bunker URL, saving and retrying...');
              saveBunkerUrl(freshBunkerUrl);
              return login.bunker(freshBunkerUrl);
            })
            .then(() => {
              console.log('[KeycastAutoConnect] ✅ Reconnected with fresh bunker URL!');
              toast({
                title: 'Connected!',
                description: 'Your signing service is ready.',
              });
              setTimeout(() => window.location.reload(), 500);
            })
            .catch((retryErr) => {
              console.error('[KeycastAutoConnect] Retry with fresh bunker URL also failed:', retryErr);
              handleFinalFailure(retryErr);
            });
        } else {
          handleFinalFailure(err);
        }
      });

    function handleFinalFailure(err: Error) {
      // If bunker URL fetch fails with 401, session is expired
      if (err.message?.includes('401') || err.message?.includes('Authentication')) {
        console.warn('[KeycastAutoConnect] Session expired, clearing...');

        toast({
          title: 'Session Expired',
          description: 'Please log in again.',
          variant: 'destructive',
        });

        clearSession();
        setTimeout(() => window.location.reload(), 1000);
      } else {
        // Don't show a big error for reconnection failures - users can still browse
        // If they try to sign something, they'll get an appropriate error then
        console.warn('[KeycastAutoConnect] Reconnection failed, but user can still browse');
      }
    }
  }, [logins, login, getSavedBunkerUrl, getValidToken, clearSession, saveBunkerUrl]);

  return null; // This component doesn't render anything
}

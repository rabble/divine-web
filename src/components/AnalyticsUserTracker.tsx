// ABOUTME: Component that tracks user identity for analytics
// ABOUTME: Updates Firebase Analytics user ID when user logs in/out

import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { setAnalyticsUserId, trackUserAction } from '@/lib/analytics';

export function AnalyticsUserTracker() {
  const { user } = useCurrentUser();

  useEffect(() => {
    if (user) {
      // Set user ID for analytics
      setAnalyticsUserId(user.pubkey);

      // Track login event
      trackUserAction('login', {
        login_method: 'nostr',
      });
    } else {
      // Clear user ID when logged out
      setAnalyticsUserId(null);
    }
  }, [user]);

  return null; // This component doesn't render anything
}

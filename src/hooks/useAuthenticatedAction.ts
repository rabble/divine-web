import { useCallback } from 'react';
import { useCurrentUser } from './useCurrentUser';
import { useLoginDialog } from '@/contexts/LoginDialogContext';

/**
 * Hook that returns a function to check if user is authenticated.
 * If not authenticated, opens the login dialog.
 *
 * @returns A function that returns true if authenticated, false otherwise (and opens login dialog)
 */
export function useRequireAuth(): () => boolean {
  const { user } = useCurrentUser();
  const { openLoginDialog } = useLoginDialog();

  return useCallback(() => {
    console.log('[useRequireAuth] Checking authentication, user:', user ? 'exists' : 'null');
    if (!user) {
      console.log('[useRequireAuth] User not authenticated, opening login dialog');
      openLoginDialog();
      return false;
    }
    console.log('[useRequireAuth] User authenticated');
    return true;
  }, [user, openLoginDialog]);
}

/**
 * @deprecated Use useRequireAuth instead
 */
export function useAuthenticatedAction() {
  return useRequireAuth();
}
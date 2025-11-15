import { useCallback } from 'react';
import { useCurrentUser } from './useCurrentUser';
import { useLoginDialog } from '@/contexts/LoginDialogContext';

/**
 * Hook that wraps an action to check if user is authenticated first.
 * If not authenticated, opens the login dialog instead of executing the action.
 *
 * @param action The action to execute when authenticated
 * @returns A wrapped function that checks auth first
 */
export function useAuthenticatedAction<T extends (...args: any[]) => any>(
  action: T
): T {
  const { user } = useCurrentUser();
  const { openLoginDialog } = useLoginDialog();

  const wrappedAction = useCallback((...args: Parameters<T>) => {
    console.log('[useAuthenticatedAction] Checking authentication, user:', user ? 'exists' : 'null');
    if (!user) {
      console.log('[useAuthenticatedAction] User not authenticated, opening login dialog');
      openLoginDialog();
      return;
    }

    console.log('[useAuthenticatedAction] User authenticated, executing action');
    return action(...args);
  }, [user, action, openLoginDialog]) as T;

  return wrappedAction;
}
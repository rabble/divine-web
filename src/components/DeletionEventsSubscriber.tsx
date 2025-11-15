// ABOUTME: Component to subscribe to deletion events globally
// ABOUTME: Must be rendered within NostrProvider to access useNostr

import { useDeletionEvents } from '@/hooks/useDeletionEvents';

/**
 * Global subscriber for NIP-09 deletion events
 * This component doesn't render anything, it just subscribes to deletion events
 */
export function DeletionEventsSubscriber() {
  // Subscribe to deletion events
  useDeletionEvents();

  // This component doesn't render anything
  return null;
}

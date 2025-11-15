// ABOUTME: Hook for subscribing to NIP-09 deletion events (Kind 5)
// ABOUTME: Processes deletion events and updates the deletion service

import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrFilter } from '@nostrify/nostrify';
import { deletionService } from '@/lib/deletionService';
import { debugLog } from '@/lib/debug';

/**
 * Subscribe to deletion events (Kind 5) from the last 30 days
 * Updates the deletion service when new deletion events are received
 */
export function useDeletionEvents() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['deletion-events'],
    queryFn: async ({ signal }) => {
      const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);

      const filter: NostrFilter = {
        kinds: [5], // NIP-09 deletion events
        since: thirtyDaysAgo,
        limit: 1000, // Fetch up to 1000 recent deletion events
      };

      debugLog('[useDeletionEvents] Querying deletion events since', new Date(thirtyDaysAgo * 1000));

      try {
        const events = await nostr.query([filter], { signal });
        
        debugLog(`[useDeletionEvents] Received ${events.length} deletion events`);

        // Process each deletion event
        events.forEach(event => {
          deletionService.processDeletionEvent(event);
        });

        // Return event count for cache
        return {
          count: events.length,
          deletedEventCount: deletionService.getDeletedEventCount(),
          lastUpdated: Date.now(),
        };
      } catch (error) {
        if (signal?.aborted) {
          debugLog('[useDeletionEvents] Query aborted');
          throw error;
        }
        throw error;
      }
    },
    // Refetch every 5 minutes to catch new deletion events
    refetchInterval: 5 * 60 * 1000,
    // Keep data in cache for 10 minutes
    staleTime: 10 * 60 * 1000,
    // Retry on failure
    retry: 3,
  });
}

/**
 * Check if a specific event has been deleted
 */
export function useIsDeleted(eventId?: string): boolean {
  // Subscribe to deletion events to keep service up to date
  useDeletionEvents();

  if (!eventId) return false;
  return deletionService.isDeleted(eventId);
}

/**
 * Get deletion info for an event
 */
export function useDeletionInfo(eventId?: string) {
  // Subscribe to deletion events to keep service up to date
  useDeletionEvents();

  if (!eventId) return null;
  return deletionService.getDeletionInfo(eventId);
}

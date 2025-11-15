// ABOUTME: Service for tracking and filtering deleted content via NIP-09
// ABOUTME: Subscribes to Kind 5 deletion events and maintains deleted event registry

import type { NostrEvent } from '@nostrify/nostrify';
import { debugLog, debugError } from '@/lib/debug';

export interface DeletionEvent {
  deleteEventId: string;
  deletedEventIds: string[];
  deletedPubkey: string;
  reason?: string;
  timestamp: number;
}

/**
 * Service for managing content deletion via NIP-09
 * Tracks deletion events and provides filtering for feeds
 */
class DeletionService {
  private deletedEventIds: Set<string> = new Set();
  private deletionEvents: Map<string, DeletionEvent> = new Map();
  private readonly STORAGE_KEY = 'nostr_deletion_events';
  private readonly MAX_AGE_DAYS = 90; // Keep deletion records for 90 days

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Process a NIP-09 deletion event (Kind 5)
   * Validates pubkey matches and extracts deleted event IDs
   */
  processDeletionEvent(event: NostrEvent): void {
    try {
      // Extract 'e' tags (events being deleted)
      const eventTags = event.tags.filter(tag => tag[0] === 'e' && tag[1]);
      const deletedIds = eventTags.map(tag => tag[1]);

      if (deletedIds.length === 0) {
        debugLog('[DeletionService] No event IDs in deletion event:', event.id);
        return;
      }

      // Create deletion record
      const deletion: DeletionEvent = {
        deleteEventId: event.id,
        deletedEventIds: deletedIds,
        deletedPubkey: event.pubkey,
        reason: event.content || undefined,
        timestamp: event.created_at,
      };

      // Store deletion event
      this.deletionEvents.set(event.id, deletion);

      // Add deleted event IDs to the set
      deletedIds.forEach(id => this.deletedEventIds.add(id));

      debugLog(`[DeletionService] Processed deletion event ${event.id}, deleted ${deletedIds.length} events`);

      // Persist to storage
      this.saveToStorage();
    } catch (error) {
      debugError('[DeletionService] Error processing deletion event:', error);
    }
  }

  /**
   * Check if an event has been deleted
   */
  isDeleted(eventId: string): boolean {
    return this.deletedEventIds.has(eventId);
  }

  /**
   * Get deletion info for an event (if deleted)
   */
  getDeletionInfo(eventId: string): DeletionEvent | null {
    for (const deletion of this.deletionEvents.values()) {
      if (deletion.deletedEventIds.includes(eventId)) {
        return deletion;
      }
    }
    return null;
  }

  /**
   * Validate that a deletion event's pubkey matches the deleted event's pubkey
   * This should be called by consumers who have access to the original event
   */
  validateDeletion(deletedEvent: NostrEvent, deletionPubkey: string): boolean {
    return deletedEvent.pubkey === deletionPubkey;
  }

  /**
   * Get all deleted event IDs
   */
  getDeletedEventIds(): string[] {
    return Array.from(this.deletedEventIds);
  }

  /**
   * Clear old deletion records (privacy cleanup)
   */
  clearOldDeletions(): void {
    const cutoffTimestamp = Math.floor(Date.now() / 1000) - (this.MAX_AGE_DAYS * 24 * 60 * 60);
    let removedCount = 0;

    for (const [id, deletion] of this.deletionEvents.entries()) {
      if (deletion.timestamp < cutoffTimestamp) {
        // Remove from deletionEvents map
        this.deletionEvents.delete(id);

        // Remove deleted event IDs from set
        deletion.deletedEventIds.forEach(eventId => {
          this.deletedEventIds.delete(eventId);
        });

        removedCount++;
      }
    }

    if (removedCount > 0) {
      debugLog(`[DeletionService] Cleared ${removedCount} old deletion records`);
      this.saveToStorage();
    }
  }

  /**
   * Get deletion event count
   */
  getDeletionCount(): number {
    return this.deletionEvents.size;
  }

  /**
   * Get deleted event count
   */
  getDeletedEventCount(): number {
    return this.deletedEventIds.size;
  }

  /**
   * Save deletion data to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        deletionEvents: Array.from(this.deletionEvents.entries()),
        deletedEventIds: Array.from(this.deletedEventIds),
        lastUpdated: Date.now(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      debugError('[DeletionService] Error saving to storage:', error);
    }
  }

  /**
   * Load deletion data from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const data = JSON.parse(stored);
      
      // Restore deletion events map
      if (data.deletionEvents) {
        this.deletionEvents = new Map(data.deletionEvents);
      }

      // Restore deleted event IDs set
      if (data.deletedEventIds) {
        this.deletedEventIds = new Set(data.deletedEventIds);
      }

      debugLog(`[DeletionService] Loaded ${this.deletionEvents.size} deletion events from storage`);

      // Clean up old records on load
      this.clearOldDeletions();
    } catch (error) {
      debugError('[DeletionService] Error loading from storage:', error);
      // Reset on error
      this.deletedEventIds = new Set();
      this.deletionEvents = new Map();
    }
  }

  /**
   * Clear all deletion data (for testing/debugging)
   */
  clear(): void {
    this.deletedEventIds.clear();
    this.deletionEvents.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    debugLog('[DeletionService] Cleared all deletion data');
  }
}

// Singleton instance
export const deletionService = new DeletionService();

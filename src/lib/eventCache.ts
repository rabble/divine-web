// ABOUTME: Persistent event cache using IndexedDB and in-memory NCache
// ABOUTME: Automatically caches user's own events and frequently accessed events

import type { NostrEvent, NostrFilter, NStore } from '@nostrify/nostrify';
import { NCache } from '@nostrify/nostrify';
import { NSet } from '@nostrify/nostrify';

const DB_NAME = 'nostr_events';
const DB_VERSION = 1;
const STORE_NAME = 'events';

/**
 * IndexedDB-backed persistent event store
 */
class IndexedDBStore implements NStore {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.init();
  }

  private async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create events object store with indexes for efficient querying
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

          // Indexes for common query patterns
          store.createIndex('pubkey', 'pubkey', { unique: false });
          store.createIndex('kind', 'kind', { unique: false });
          store.createIndex('created_at', 'created_at', { unique: false });
          store.createIndex('pubkey_kind', ['pubkey', 'kind'], { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    await this.initPromise;
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }
    return this.db;
  }

  async event(event: NostrEvent): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(event);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async query(filters: NostrFilter[]): Promise<NostrEvent[]> {
    const db = await this.ensureDB();
    const allEvents: NostrEvent[] = [];

    for (const filter of filters) {
      const events = await this.queryFilter(db, filter);
      allEvents.push(...events);
    }

    // Remove duplicates by id
    const uniqueEvents = Array.from(
      new Map(allEvents.map(e => [e.id, e])).values()
    );

    // Sort events by created_at descending (newest first)
    return uniqueEvents.sort((a, b) => b.created_at - a.created_at);
  }

  private async queryFilter(db: IDBDatabase, filter: NostrFilter): Promise<NostrEvent[]> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const events: NostrEvent[] = [];

      // Use indexes when possible for better performance
      let request: IDBRequest;

      if (filter.authors && filter.authors.length === 1 && filter.kinds && filter.kinds.length === 1) {
        // Use compound index for pubkey + kind
        const index = store.index('pubkey_kind');
        request = index.openCursor(IDBKeyRange.only([filter.authors[0], filter.kinds[0]]));
      } else if (filter.authors && filter.authors.length === 1) {
        // Use pubkey index
        const index = store.index('pubkey');
        request = index.openCursor(IDBKeyRange.only(filter.authors[0]));
      } else if (filter.kinds && filter.kinds.length === 1) {
        // Use kind index
        const index = store.index('kind');
        request = index.openCursor(IDBKeyRange.only(filter.kinds[0]));
      } else {
        // Full table scan for complex queries
        request = store.openCursor();
      }

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const evt = cursor.value as NostrEvent;
          if (this.matchesFilter(evt, filter)) {
            events.push(evt);
          }
          cursor.continue();
        } else {
          // Apply limit
          const limited = filter.limit ? events.slice(0, filter.limit) : events;
          resolve(limited);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  private matchesFilter(event: NostrEvent, filter: NostrFilter): boolean {
    // Check IDs
    if (filter.ids && !filter.ids.includes(event.id)) {
      return false;
    }

    // Check authors
    if (filter.authors && !filter.authors.includes(event.pubkey)) {
      return false;
    }

    // Check kinds
    if (filter.kinds && !filter.kinds.includes(event.kind)) {
      return false;
    }

    // Check since
    if (filter.since && event.created_at < filter.since) {
      return false;
    }

    // Check until
    if (filter.until && event.created_at > filter.until) {
      return false;
    }

    // Check tags
    for (const [tagName, tagValues] of Object.entries(filter)) {
      if (tagName.startsWith('#')) {
        const tag = tagName.slice(1);
        const eventTagValues = event.tags
          .filter(t => t[0] === tag)
          .map(t => t[1]);

        const hasMatch = (tagValues as string[]).some(v => eventTagValues.includes(v));
        if (!hasMatch) {
          return false;
        }
      }
    }

    return true;
  }

  async remove(filters: NostrFilter[]): Promise<void> {
    const db = await this.ensureDB();
    const eventsToRemove = await this.query(filters);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      eventsToRemove.forEach(event => {
        store.delete(event.id);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async count(filters: NostrFilter[]): Promise<{ count: number }> {
    const events = await this.query(filters);
    return { count: events.length };
  }

  /**
   * Clear all events from IndexedDB (useful for testing or reset)
   */
  async clear(): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

/**
 * Hybrid cache combining in-memory NCache with persistent IndexedDB
 */
export class HybridEventCache implements NStore {
  private memoryCache: NCache;
  private persistentStore: IndexedDBStore;

  constructor(maxMemoryEvents = 1000) {
    this.memoryCache = new NCache({ max: maxMemoryEvents });
    this.persistentStore = new IndexedDBStore();
  }

  async event(event: NostrEvent): Promise<void> {
    // Add to both caches
    this.memoryCache.add(event);
    await this.persistentStore.event(event);
  }

  async query(filters: NostrFilter[]): Promise<NostrEvent[]> {
    // Try memory cache first
    const memoryResults = await this.memoryCache.query(filters);

    // If we got enough results from memory, return them
    const limit = filters[0]?.limit || Infinity;
    if (memoryResults.length >= limit) {
      return memoryResults;
    }

    // Fall back to IndexedDB for more results
    const persistentResults = await this.persistentStore.query(filters);

    // Populate memory cache with results from IndexedDB
    for (const event of persistentResults) {
      this.memoryCache.add(event);
    }

    return persistentResults;
  }

  async remove(filters: NostrFilter[]): Promise<void> {
    // Remove from both caches
    await this.memoryCache.remove(filters);
    await this.persistentStore.remove(filters);
  }

  async count(filters: NostrFilter[]): Promise<{ count: number }> {
    // Use persistent store for accurate count
    return this.persistentStore.count(filters);
  }

  /**
   * Preload commonly needed events into memory cache
   */
  async preloadUserEvents(pubkey: string): Promise<void> {
    console.log('[HybridEventCache] Preloading events for user:', pubkey);

    // Load user's profile (kind 0)
    const profileEvents = await this.persistentStore.query([
      { kinds: [0], authors: [pubkey], limit: 1 }
    ]);

    // Load user's contacts (kind 3)
    const contactEvents = await this.persistentStore.query([
      { kinds: [3], authors: [pubkey], limit: 1 }
    ]);

    // Load user's recent posts (kind 1)
    const postEvents = await this.persistentStore.query([
      { kinds: [1], authors: [pubkey], limit: 50 }
    ]);

    // Add to memory cache
    [...profileEvents, ...contactEvents, ...postEvents].forEach(event => {
      this.memoryCache.add(event);
    });

    console.log('[HybridEventCache] Preloaded',
      profileEvents.length + contactEvents.length + postEvents.length,
      'events into memory'
    );
  }

  /**
   * Clear all cached events
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    await this.persistentStore.clear();
  }
}

// Export singleton instance
export const eventCache = new HybridEventCache(1000);

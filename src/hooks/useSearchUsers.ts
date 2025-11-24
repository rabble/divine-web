// ABOUTME: Hook for searching Kind 0 user metadata events by name, display_name, nip05, and about
// ABOUTME: Supports debounced queries, case-insensitive search, and deduplication by pubkey

import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { NostrEvent, NostrMetadata, NostrFilter } from '@nostrify/nostrify';
// Search will prefer the app's primary relay. If it doesn't support NIP-50,
// we fall back to fetching recent metadata and client-side filtering.

interface UseSearchUsersOptions {
  query: string;
  limit?: number;
}

interface SearchUserResult {
  pubkey: string;
  metadata?: NostrMetadata;
}

/**
 * Parse and validate user metadata
 */
function parseUserMetadata(event: NostrEvent): SearchUserResult | null {
  try {
    const metadata = JSON.parse(event.content) as NostrMetadata;
    return {
      pubkey: event.pubkey,
      metadata,
    };
  } catch {
    return null;
  }
}

/**
 * Deduplicate users by pubkey, keeping the most recent metadata
 */
function deduplicateUsers(users: SearchUserResult[], events: NostrEvent[]): SearchUserResult[] {
  const userMap = new Map<string, { user: SearchUserResult; timestamp: number }>();

  users.forEach((user, index) => {
    const event = events[index];
    const existing = userMap.get(user.pubkey);

    if (!existing || event.created_at > existing.timestamp) {
      userMap.set(user.pubkey, {
        user,
        timestamp: event.created_at,
      });
    }
  });

  return Array.from(userMap.values()).map(({ user }) => user);
}

/**
 * Check if user metadata matches search query
 */
function userMatchesQuery(user: SearchUserResult, query: string): boolean {
  if (!user.metadata) return false;

  const searchValue = query.toLowerCase();
  const metadata = user.metadata;

  return (
    metadata.name?.toLowerCase().includes(searchValue) ||
    metadata.display_name?.toLowerCase().includes(searchValue) ||
    metadata.nip05?.toLowerCase().includes(searchValue) ||
    metadata.about?.toLowerCase().includes(searchValue) ||
    false
  );
}

/**
 * Search users by name, display_name, nip05, and about fields
 */
export function useSearchUsers(options: UseSearchUsersOptions) {
  const { nostr } = useNostr();
  const { query, limit = 50 } = options;

  // Debounce the query - disable in test environment
  const isTest = process.env.NODE_ENV === 'test';
  const debounceDelay = isTest ? 0 : 300;

  const debouncedQuery = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return new Promise<string>((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => resolve(query), debounceDelay);
    });
  }, [query, debounceDelay]);

  return useQuery({
    queryKey: ['search-users', query, limit],
    queryFn: async (context) => {
      // Wait for debounced query
      const actualQuery = await debouncedQuery;

      if (!actualQuery.trim()) {
        return [];
      }

      const signal = AbortSignal.any([
        context.signal,
        AbortSignal.timeout(8000)
      ]);

      let events: NostrEvent[] = [];

      // Attempt NIP-50 search on the app's active relays first.
      try {
        events = await nostr.query([
          {
            kinds: [0],
            search: actualQuery,
            limit: Math.min(limit * 2, 200),
          },
        ], { signal });

        // If relay doesn't support NIP-50 or returns empty, fall back below.
        if (!Array.isArray(events) || events.length === 0) {
          throw new Error('No search results; falling back to client filter');
        }
      } catch {
        // Fallback: query recent metadata and filter client-side
        events = await nostr.query([
          {
            kinds: [0],
            limit: Math.min(limit * 10, 1000),
          },
        ], { signal });
      }

      // Parse user metadata
      const users = events
        .map(parseUserMetadata)
        .filter((user): user is SearchUserResult => user !== null);

      // Deduplicate by pubkey (keep most recent)
      const deduplicatedUsers = deduplicateUsers(users, events);

      // Filter by search query if relay search wasn't used
      let filteredUsers = deduplicatedUsers;
      if (events.length > limit * 2) {
        // We got a lot of results, likely from fallback, so filter client-side
        filteredUsers = deduplicatedUsers.filter(user =>
          userMatchesQuery(user, actualQuery)
        );
      }

      // Sort by relevance (exact name matches first, then partial matches)
      const searchValue = actualQuery.toLowerCase();
      filteredUsers.sort((a, b) => {
        const aName = a.metadata?.name?.toLowerCase() || '';
        const bName = b.metadata?.name?.toLowerCase() || '';
        const aDisplayName = a.metadata?.display_name?.toLowerCase() || '';
        const bDisplayName = b.metadata?.display_name?.toLowerCase() || '';

        // Exact name matches first
        if (aName === searchValue && bName !== searchValue) return -1;
        if (bName === searchValue && aName !== searchValue) return 1;

        // Exact display name matches second
        if (aDisplayName === searchValue && bDisplayName !== searchValue) return -1;
        if (bDisplayName === searchValue && aDisplayName !== searchValue) return 1;

        // Name starts with search value
        if (aName.startsWith(searchValue) && !bName.startsWith(searchValue)) return -1;
        if (bName.startsWith(searchValue) && !aName.startsWith(searchValue)) return 1;

        // Display name starts with search value
        if (aDisplayName.startsWith(searchValue) && !bDisplayName.startsWith(searchValue)) return -1;
        if (bDisplayName.startsWith(searchValue) && !aDisplayName.startsWith(searchValue)) return 1;

        // Alphabetical by name
        return aName.localeCompare(bName);
      });

      return filteredUsers.slice(0, limit);
    },
    enabled: !!query.trim(),
    staleTime: 60000, // 1 minute - user data changes less frequently
    gcTime: 300000, // 5 minutes
  });
}

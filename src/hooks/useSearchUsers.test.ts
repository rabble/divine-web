// ABOUTME: Tests for user search functionality
// ABOUTME: Tests searching kind 0 user metadata events by name, display_name, nip05, and about

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { useSearchUsers } from './useSearchUsers';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';

// Mock useNostr
vi.mock('@nostrify/react', () => ({
  useNostr: vi.fn(),
}));

const mockNostr = {
  query: vi.fn(),
};

describe('useSearchUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useNostr as any).mockReturnValue({ nostr: mockNostr });
  });

  it('should search users by name', async () => {
    const mockUsers: NostrEvent[] = [
      {
        id: 'user1',
        pubkey: 'pubkey1',
        created_at: 1234567890,
        kind: 0,
        content: JSON.stringify({
          name: 'johndoe',
          display_name: 'John Doe',
          about: 'Video creator and dancer',
          picture: 'https://example.com/avatar1.jpg',
        }),
        tags: [],
        sig: 'sig1',
      },
      {
        id: 'user2',
        pubkey: 'pubkey2',
        created_at: 1234567891,
        kind: 0,
        content: JSON.stringify({
          name: 'janedoe',
          display_name: 'Jane Doe', 
          about: 'Artist and filmmaker',
          picture: 'https://example.com/avatar2.jpg',
        }),
        tags: [],
        sig: 'sig2',
      },
    ];

    mockNostr.query.mockResolvedValue(mockUsers);

    const { result } = renderHook(
      () => useSearchUsers({ query: 'john' }),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockNostr.query).toHaveBeenCalledWith(
      [
        {
          kinds: [0],
          search: 'john',
          limit: 50,
        },
      ],
      { signal: expect.any(AbortSignal) }
    );

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].metadata?.name).toBe('johndoe');
  });

  it('should search users by display_name', async () => {
    const mockUsers: NostrEvent[] = [
      {
        id: 'user1',
        pubkey: 'pubkey1',
        created_at: 1234567890,
        kind: 0,
        content: JSON.stringify({
          name: 'crypto_artist',
          display_name: 'The Amazing Artist',
          about: 'Creating digital art',
        }),
        tags: [],
        sig: 'sig1',
      },
    ];

    mockNostr.query.mockResolvedValue(mockUsers);

    const { result } = renderHook(
      () => useSearchUsers({ query: 'amazing' }),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].metadata?.display_name).toBe('The Amazing Artist');
  });

  it('should search users by nip05 identifier', async () => {
    const mockUsers: NostrEvent[] = [
      {
        id: 'user1',
        pubkey: 'pubkey1',
        created_at: 1234567890,
        kind: 0,
        content: JSON.stringify({
          name: 'bob',
          nip05: 'bob@example.com',
          about: 'Developer',
        }),
        tags: [],
        sig: 'sig1',
      },
    ];

    mockNostr.query.mockResolvedValue(mockUsers);

    const { result } = renderHook(
      () => useSearchUsers({ query: 'example.com' }),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].metadata?.nip05).toBe('bob@example.com');
  });

  it('should search users by about field', async () => {
    const mockUsers: NostrEvent[] = [
      {
        id: 'user1',
        pubkey: 'pubkey1',
        created_at: 1234567890,
        kind: 0,
        content: JSON.stringify({
          name: 'skater_pro',
          about: 'Professional skateboard instructor and video creator',
        }),
        tags: [],
        sig: 'sig1',
      },
    ];

    mockNostr.query.mockResolvedValue(mockUsers);

    const { result } = renderHook(
      () => useSearchUsers({ query: 'skateboard instructor' }),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].metadata?.about).toContain('skateboard instructor');
  });

  it('should handle empty search query', async () => {
    const { result } = renderHook(
      () => useSearchUsers({ query: '' }),
      { wrapper: TestApp }
    );

    expect(result.current.data).toEqual([]);
    expect(mockNostr.query).not.toHaveBeenCalled();
  });

  it('should debounce search queries', async () => {
    const { result, rerender } = renderHook(
      ({ query }) => useSearchUsers({ query }),
      {
        wrapper: TestApp,
        initialProps: { query: 'j' },
      }
    );

    // Change query rapidly
    rerender({ query: 'jo' });
    rerender({ query: 'joh' });
    rerender({ query: 'john' });

    // Should not call immediately due to debouncing
    expect(mockNostr.query).not.toHaveBeenCalled();

    // Wait for debounce delay
    await waitFor(
      () => {
        expect(mockNostr.query).toHaveBeenCalledTimes(1);
      },
      { timeout: 1000 }
    );

    expect(mockNostr.query).toHaveBeenCalledWith(
      [
        {
          kinds: [0],
          search: 'john',
          limit: 50,
        },
      ],
      { signal: expect.any(AbortSignal) }
    );
  });

  it('should handle case-insensitive search', async () => {
    const mockUsers: NostrEvent[] = [
      {
        id: 'user1',
        pubkey: 'pubkey1',
        created_at: 1234567890,
        kind: 0,
        content: JSON.stringify({
          name: 'JOHNDOE',
          display_name: 'John Doe',
        }),
        tags: [],
        sig: 'sig1',
      },
    ];

    mockNostr.query.mockResolvedValue(mockUsers);

    const { result } = renderHook(
      () => useSearchUsers({ query: 'johndoe' }),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(1);
  });

  it('should filter out users with invalid JSON in content', async () => {
    const mockEvents: NostrEvent[] = [
      // Valid user
      {
        id: 'user1',
        pubkey: 'pubkey1',
        created_at: 1234567890,
        kind: 0,
        content: JSON.stringify({
          name: 'validuser',
        }),
        tags: [],
        sig: 'sig1',
      },
      // Invalid JSON
      {
        id: 'user2',
        pubkey: 'pubkey2',
        created_at: 1234567891,
        kind: 0,
        content: 'invalid json content',
        tags: [],
        sig: 'sig2',
      },
    ];

    mockNostr.query.mockResolvedValue(mockEvents);

    const { result } = renderHook(
      () => useSearchUsers({ query: 'user' }),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should only return valid users
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].pubkey).toBe('pubkey1');
  });

  it('should return most recent metadata per user', async () => {
    const mockUsers: NostrEvent[] = [
      // Older metadata
      {
        id: 'user1_old',
        pubkey: 'pubkey1',
        created_at: 1234567890,
        kind: 0,
        content: JSON.stringify({
          name: 'oldname',
        }),
        tags: [],
        sig: 'sig1',
      },
      // Newer metadata for same user
      {
        id: 'user1_new',
        pubkey: 'pubkey1',
        created_at: 1234567900,
        kind: 0,
        content: JSON.stringify({
          name: 'newname',
        }),
        tags: [],
        sig: 'sig2',
      },
    ];

    mockNostr.query.mockResolvedValue(mockUsers);

    const { result } = renderHook(
      () => useSearchUsers({ query: 'name' }),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should only return the most recent metadata
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].metadata?.name).toBe('newname');
  });

  it('should support custom limit parameter', async () => {
    const mockUsers: NostrEvent[] = [];
    mockNostr.query.mockResolvedValue(mockUsers);

    renderHook(
      () => useSearchUsers({ query: 'test', limit: 25 }),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(mockNostr.query).toHaveBeenCalledWith(
        [
          {
            kinds: [0],
            search: 'test',
            limit: 25,
          },
        ],
        { signal: expect.any(AbortSignal) }
      );
    });
  });

  it('should handle special characters in search query', async () => {
    const mockUsers: NostrEvent[] = [
      {
        id: 'user1',
        pubkey: 'pubkey1',
        created_at: 1234567890,
        kind: 0,
        content: JSON.stringify({
          name: 'user@domain.com',
          nip05: 'user@domain.com',
        }),
        tags: [],
        sig: 'sig1',
      },
    ];

    mockNostr.query.mockResolvedValue(mockUsers);

    const { result } = renderHook(
      () => useSearchUsers({ query: '@domain.com' }),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(1);
  });
});
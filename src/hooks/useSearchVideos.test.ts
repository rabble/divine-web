// ABOUTME: Tests for video search functionality
// ABOUTME: Tests searching kind 32222 video events by content, hashtags, and author

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { useSearchVideos } from './useSearchVideos';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';

// Mock useNostr
vi.mock('@nostrify/react', () => ({
  useNostr: vi.fn(),
}));

const mockNostr = {
  query: vi.fn(),
};

describe('useSearchVideos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useNostr as any).mockReturnValue({ nostr: mockNostr });
  });

  it('should search videos by content text', async () => {
    const mockVideos: NostrEvent[] = [
      {
        id: 'video1',
        pubkey: 'user1',
        created_at: 1234567890,
        kind: 32222,
        content: 'Amazing dance moves in this video',
        tags: [
          ['d', 'video1'],
          ['url', 'https://example.com/video1.mp4'],
          ['m', 'video/mp4'],
          ['t', 'dance'],
        ],
        sig: 'sig1',
      },
      {
        id: 'video2',
        pubkey: 'user2',
        created_at: 1234567891,
        kind: 32222,
        content: 'Cool skateboard tricks compilation',
        tags: [
          ['d', 'video2'],
          ['url', 'https://example.com/video2.mp4'],
          ['m', 'video/mp4'],
          ['t', 'skateboard'],
        ],
        sig: 'sig2',
      },
    ];

    mockNostr.query.mockResolvedValue(mockVideos);

    const { result } = renderHook(
      () => useSearchVideos({ query: 'dance' }),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockNostr.query).toHaveBeenCalledWith(
      [
        {
          kinds: [32222],
          search: 'dance',
          limit: 50,
        },
      ],
      { signal: expect.any(AbortSignal) }
    );

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].content).toContain('dance');
  });

  it('should search videos by hashtag', async () => {
    const mockVideos: NostrEvent[] = [
      {
        id: 'video1',
        pubkey: 'user1',
        created_at: 1234567890,
        kind: 32222,
        content: 'Check out this amazing trick',
        tags: [
          ['d', 'video1'],
          ['url', 'https://example.com/video1.mp4'],
          ['m', 'video/mp4'],
          ['t', 'skateboard'],
          ['t', 'tricks'],
        ],
        sig: 'sig1',
      },
    ];

    mockNostr.query.mockResolvedValue(mockVideos);

    const { result } = renderHook(
      () => useSearchVideos({ query: '#skateboard' }),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockNostr.query).toHaveBeenCalledWith(
      [
        {
          kinds: [32222],
          '#t': ['skateboard'],
          limit: 50,
        },
      ],
      { signal: expect.any(AbortSignal) }
    );

    expect(result.current.data).toHaveLength(1);
  });

  it('should search videos by author name', async () => {
    // First query for user metadata
    const mockUserMetadata: NostrEvent[] = [
      {
        id: 'metadata1',
        pubkey: 'user1',
        created_at: 1234567890,
        kind: 0,
        content: JSON.stringify({
          name: 'johndoe',
          display_name: 'John Doe',
          about: 'Video creator',
        }),
        tags: [],
        sig: 'sig1',
      },
    ];

    // Then query for videos by that user
    const mockVideos: NostrEvent[] = [
      {
        id: 'video1',
        pubkey: 'user1',
        created_at: 1234567890,
        kind: 32222,
        content: 'My latest video',
        tags: [
          ['d', 'video1'],
          ['url', 'https://example.com/video1.mp4'],
          ['m', 'video/mp4'],
        ],
        sig: 'sig1',
      },
    ];

    mockNostr.query
      .mockResolvedValueOnce(mockUserMetadata) // First call for user search
      .mockResolvedValueOnce(mockVideos); // Second call for video search

    const { result } = renderHook(
      () => useSearchVideos({ query: 'johndoe', searchType: 'author' }),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should first search for users
    expect(mockNostr.query).toHaveBeenNthCalledWith(
      1,
      [
        {
          kinds: [0],
          search: 'johndoe',
          limit: 20,
        },
      ],
      { signal: expect.any(AbortSignal) }
    );

    // Then search for videos by found users
    expect(mockNostr.query).toHaveBeenNthCalledWith(
      2,
      [
        {
          kinds: [32222],
          authors: ['user1'],
          limit: 50,
        },
      ],
      { signal: expect.any(AbortSignal) }
    );

    expect(result.current.data).toHaveLength(1);
  });

  it('should handle empty search query', async () => {
    const { result } = renderHook(
      () => useSearchVideos({ query: '' }),
      { wrapper: TestApp }
    );

    expect(result.current.data).toEqual([]);
    expect(mockNostr.query).not.toHaveBeenCalled();
  });

  it('should debounce search queries', async () => {
    const { result, rerender } = renderHook(
      ({ query }) => useSearchVideos({ query }),
      {
        wrapper: TestApp,
        initialProps: { query: 'a' },
      }
    );

    // Change query rapidly
    rerender({ query: 'ab' });
    rerender({ query: 'abc' });
    rerender({ query: 'abcd' });

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
          kinds: [32222],
          search: 'abcd',
          limit: 50,
        },
      ],
      { signal: expect.any(AbortSignal) }
    );
  });

  it('should handle case-insensitive search', async () => {
    const mockVideos: NostrEvent[] = [
      {
        id: 'video1',
        pubkey: 'user1',
        created_at: 1234567890,
        kind: 32222,
        content: 'AMAZING DANCE MOVES',
        tags: [
          ['d', 'video1'],
          ['url', 'https://example.com/video1.mp4'],
          ['m', 'video/mp4'],
        ],
        sig: 'sig1',
      },
    ];

    mockNostr.query.mockResolvedValue(mockVideos);

    const { result } = renderHook(
      () => useSearchVideos({ query: 'amazing dance' }),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(1);
  });

  it('should validate video events and filter invalid ones', async () => {
    const mockEvents: NostrEvent[] = [
      // Valid video
      {
        id: 'video1',
        pubkey: 'user1',
        created_at: 1234567890,
        kind: 32222,
        content: 'Valid video',
        tags: [
          ['d', 'video1'],
          ['url', 'https://example.com/video1.mp4'],
          ['m', 'video/mp4'],
        ],
        sig: 'sig1',
      },
      // Invalid - missing d tag
      {
        id: 'video2',
        pubkey: 'user2',
        created_at: 1234567891,
        kind: 32222,
        content: 'Invalid video',
        tags: [
          ['url', 'https://example.com/video2.mp4'],
          ['m', 'video/mp4'],
        ],
        sig: 'sig2',
      },
    ];

    mockNostr.query.mockResolvedValue(mockEvents);

    const { result } = renderHook(
      () => useSearchVideos({ query: 'video' }),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should only return valid videos
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].id).toBe('video1');
  });

  it('should support custom limit parameter', async () => {
    const mockVideos: NostrEvent[] = [];
    mockNostr.query.mockResolvedValue(mockVideos);

    renderHook(
      () => useSearchVideos({ query: 'test', limit: 25 }),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(mockNostr.query).toHaveBeenCalledWith(
        [
          {
            kinds: [32222],
            search: 'test',
            limit: 25,
          },
        ],
        { signal: expect.any(AbortSignal) }
      );
    });
  });
});
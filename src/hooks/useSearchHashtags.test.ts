// ABOUTME: Tests for hashtag search functionality  
// ABOUTME: Tests searching hashtags across video events and providing autocomplete suggestions

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { useSearchHashtags } from './useSearchHashtags';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';

// Mock useNostr
vi.mock('@nostrify/react', () => ({
  useNostr: vi.fn(),
}));

const mockNostr = {
  query: vi.fn(),
};

describe('useSearchHashtags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useNostr as any).mockReturnValue({ nostr: mockNostr });
  });

  it('should search hashtags and return usage counts', async () => {
    const mockVideos: NostrEvent[] = [
      {
        id: 'video1',
        pubkey: 'user1',
        created_at: 1234567890,
        kind: 32222,
        content: 'Amazing dance video',
        tags: [
          ['d', 'video1'],
          ['t', 'dance'],
          ['t', 'music'],
          ['t', 'entertainment'],
        ],
        sig: 'sig1',
      },
      {
        id: 'video2',
        pubkey: 'user2',
        created_at: 1234567891,
        kind: 32222,
        content: 'Another dance video',
        tags: [
          ['d', 'video2'],
          ['t', 'dance'],
          ['t', 'performance'],
        ],
        sig: 'sig2',
      },
      {
        id: 'video3',
        pubkey: 'user3',
        created_at: 1234567892,
        kind: 32222,
        content: 'Skateboard tricks',
        tags: [
          ['d', 'video3'],
          ['t', 'skateboard'],
          ['t', 'sports'],
        ],
        sig: 'sig3',
      },
    ];

    mockNostr.query.mockResolvedValue(mockVideos);

    const { result } = renderHook(
      () => useSearchHashtags({ query: 'da' }),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockNostr.query).toHaveBeenCalledWith(
      [
        {
          kinds: [32222],
          limit: 1000,
          since: expect.any(Number), // Recent hashtags
        },
      ],
      { signal: expect.any(AbortSignal) }
    );

    const hashtags = result.current.data;
    expect(hashtags).toHaveLength(1);
    expect(hashtags?.[0]).toEqual({
      tag: 'dance',
      count: 2,
    });
  });

  it('should return hashtags sorted by usage count descending', async () => {
    const mockVideos: NostrEvent[] = [
      {
        id: 'video1',
        pubkey: 'user1',
        created_at: 1234567890,
        kind: 32222,
        content: 'Video 1',
        tags: [
          ['d', 'video1'],
          ['t', 'rare'], // Used once
          ['t', 'common'], // Used three times total
        ],
        sig: 'sig1',
      },
      {
        id: 'video2',
        pubkey: 'user2',
        created_at: 1234567891,
        kind: 32222,
        content: 'Video 2',
        tags: [
          ['d', 'video2'],
          ['t', 'common'],
          ['t', 'popular'], // Used twice
        ],
        sig: 'sig2',
      },
      {
        id: 'video3',
        pubkey: 'user3',
        created_at: 1234567892,
        kind: 32222,
        content: 'Video 3',
        tags: [
          ['d', 'video3'],
          ['t', 'common'],
          ['t', 'popular'],
        ],
        sig: 'sig3',
      },
    ];

    mockNostr.query.mockResolvedValue(mockVideos);

    const { result } = renderHook(
      () => useSearchHashtags({ query: '' }), // Empty query returns all
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const hashtags = result.current.data;
    expect(hashtags).toHaveLength(3);
    
    // Should be sorted by count descending
    expect(hashtags?.[0]).toEqual({ tag: 'common', count: 3 });
    expect(hashtags?.[1]).toEqual({ tag: 'popular', count: 2 });
    expect(hashtags?.[2]).toEqual({ tag: 'rare', count: 1 });
  });

  it('should filter hashtags by partial match', async () => {
    const mockVideos: NostrEvent[] = [
      {
        id: 'video1',
        pubkey: 'user1',
        created_at: 1234567890,
        kind: 32222,
        content: 'Video 1',
        tags: [
          ['d', 'video1'],
          ['t', 'skateboard'],
          ['t', 'skate'],
          ['t', 'dance'],
          ['t', 'music'],
        ],
        sig: 'sig1',
      },
    ];

    mockNostr.query.mockResolvedValue(mockVideos);

    const { result } = renderHook(
      () => useSearchHashtags({ query: 'skat' }),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const hashtags = result.current.data;
    expect(hashtags).toHaveLength(2);
    expect(hashtags?.map(h => h.tag)).toContain('skateboard');
    expect(hashtags?.map(h => h.tag)).toContain('skate');
    expect(hashtags?.map(h => h.tag)).not.toContain('dance');
  });

  it('should handle case-insensitive matching', async () => {
    const mockVideos: NostrEvent[] = [
      {
        id: 'video1',
        pubkey: 'user1',
        created_at: 1234567890,
        kind: 32222,
        content: 'Video 1',
        tags: [
          ['d', 'video1'],
          ['t', 'DANCE'],
          ['t', 'Music'],
          ['t', 'entertainment'],
        ],
        sig: 'sig1',
      },
    ];

    mockNostr.query.mockResolvedValue(mockVideos);

    const { result } = renderHook(
      () => useSearchHashtags({ query: 'dan' }),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const hashtags = result.current.data;
    expect(hashtags).toHaveLength(1);
    expect(hashtags?.[0].tag).toBe('DANCE');
  });

  it('should debounce search queries', async () => {
    const { result, rerender } = renderHook(
      ({ query }) => useSearchHashtags({ query }),
      {
        wrapper: TestApp,
        initialProps: { query: 'd' },
      }
    );

    // Change query rapidly
    rerender({ query: 'da' });
    rerender({ query: 'dan' });
    rerender({ query: 'danc' });

    // Should not call immediately due to debouncing
    expect(mockNostr.query).not.toHaveBeenCalled();

    // Wait for debounce delay
    await waitFor(
      () => {
        expect(mockNostr.query).toHaveBeenCalledTimes(1);
      },
      { timeout: 1000 }
    );
  });

  it('should limit results to specified count', async () => {
    const mockVideos: NostrEvent[] = [
      {
        id: 'video1',
        pubkey: 'user1',
        created_at: 1234567890,
        kind: 32222,
        content: 'Video 1',
        tags: [
          ['d', 'video1'],
          ['t', 'tag1'],
          ['t', 'tag2'],
          ['t', 'tag3'],
          ['t', 'tag4'],
          ['t', 'tag5'],
        ],
        sig: 'sig1',
      },
    ];

    mockNostr.query.mockResolvedValue(mockVideos);

    const { result } = renderHook(
      () => useSearchHashtags({ query: 'tag', limit: 3 }),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const hashtags = result.current.data;
    expect(hashtags).toHaveLength(3);
  });

  it('should only include recent hashtags by default', async () => {
    const oldTimestamp = Math.floor(Date.now() / 1000) - (8 * 24 * 60 * 60); // 8 days ago
    const recentTimestamp = Math.floor(Date.now() / 1000) - (1 * 24 * 60 * 60); // 1 day ago

    // Mock will be called with since parameter
    mockNostr.query.mockResolvedValue([]);

    renderHook(
      () => useSearchHashtags({ query: 'test' }),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(mockNostr.query).toHaveBeenCalledWith(
        [
          {
            kinds: [32222],
            limit: 1000,
            since: expect.any(Number),
          },
        ],
        { signal: expect.any(AbortSignal) }
      );
    });

    // Verify since parameter is within last 7 days
    const calledSince = mockNostr.query.mock.calls[0][0][0].since;
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
    expect(calledSince).toBeGreaterThanOrEqual(sevenDaysAgo - 60); // Allow 1 minute variance
  });

  it('should handle empty hashtag query gracefully', async () => {
    const mockVideos: NostrEvent[] = [
      {
        id: 'video1',
        pubkey: 'user1',
        created_at: 1234567890,
        kind: 32222,
        content: 'Video 1',
        tags: [
          ['d', 'video1'],
          ['t', 'dance'],
        ],
        sig: 'sig1',
      },
    ];

    mockNostr.query.mockResolvedValue(mockVideos);

    const { result } = renderHook(
      () => useSearchHashtags({ query: '' }),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should return all hashtags when query is empty
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].tag).toBe('dance');
  });

  it('should ignore non-hashtag tags', async () => {
    const mockVideos: NostrEvent[] = [
      {
        id: 'video1',
        pubkey: 'user1',
        created_at: 1234567890,
        kind: 32222,
        content: 'Video 1',
        tags: [
          ['d', 'video1'],
          ['url', 'https://example.com/video.mp4'],
          ['m', 'video/mp4'],
          ['title', 'My Video'],
          ['t', 'dance'], // Only this should be counted
          ['p', 'somepubkey'],
        ],
        sig: 'sig1',
      },
    ];

    mockNostr.query.mockResolvedValue(mockVideos);

    const { result } = renderHook(
      () => useSearchHashtags({ query: '' }),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should only return hashtags (t tags)
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].tag).toBe('dance');
  });
});
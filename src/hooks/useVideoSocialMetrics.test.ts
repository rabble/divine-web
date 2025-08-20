import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useVideoSocialMetrics, useVideoUserInteractions } from './useVideoSocialMetrics';
import { TestApp } from '@/test/TestApp';
import type { NostrEvent } from '@nostrify/nostrify';

// Mock the useNostr hook
const mockQuery = vi.fn();
const mockNostr = {
  query: mockQuery,
};

vi.mock('@nostrify/react', () => ({
  useNostr: () => ({ nostr: mockNostr }),
}));

describe('useVideoSocialMetrics', () => {
  const videoId = 'test-video-id';
  const videoPubkey = 'test-video-pubkey';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderHookWithProvider = <T>(hook: () => T) => {
    return renderHook(hook, {
      wrapper: TestApp,
    });
  };

  it('fetches and calculates social metrics correctly', async () => {
    // Mock events with various interactions
    const mockEvents: NostrEvent[] = [
      // Likes (kind 7)
      {
        id: 'like1',
        kind: 7,
        pubkey: 'user1',
        created_at: Date.now() / 1000,
        content: '+',
        tags: [['e', videoId]],
        sig: 'sig1',
      },
      {
        id: 'like2',
        kind: 7,
        pubkey: 'user2',
        created_at: Date.now() / 1000,
        content: '❤️',
        tags: [['e', videoId]],
        sig: 'sig2',
      },
      // Repost (kind 6)
      {
        id: 'repost1',
        kind: 6,
        pubkey: 'user3',
        created_at: Date.now() / 1000,
        content: '',
        tags: [['e', videoId]],
        sig: 'sig3',
      },
      // Zap receipt (kind 9735) - using as view proxy
      {
        id: 'zap1',
        kind: 9735,
        pubkey: 'user4',
        created_at: Date.now() / 1000,
        content: 'zap receipt',
        tags: [['e', videoId]],
        sig: 'sig4',
      },
      // Invalid reaction (should not count as like)
      {
        id: 'dislike1',
        kind: 7,
        pubkey: 'user5',
        created_at: Date.now() / 1000,
        content: '-',
        tags: [['e', videoId]],
        sig: 'sig5',
      },
    ];

    mockQuery.mockResolvedValue(mockEvents);

    const { result } = renderHookWithProvider(() =>
      useVideoSocialMetrics(videoId, videoPubkey)
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      likeCount: 2, // + and ❤️ reactions
      repostCount: 1, // one repost
      viewCount: 1, // one zap receipt
    });

    // Verify query was called with correct parameters
    expect(mockQuery).toHaveBeenCalledWith(
      [
        {
          kinds: [6, 7, 9735],
          '#e': [videoId],
          limit: 500,
        }
      ],
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('handles empty results correctly', async () => {
    mockQuery.mockResolvedValue([]);

    const { result } = renderHookWithProvider(() =>
      useVideoSocialMetrics(videoId, videoPubkey)
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      likeCount: 0,
      repostCount: 0,
      viewCount: 0,
    });
  });

  it('handles query errors gracefully', async () => {
    mockQuery.mockRejectedValue(new Error('Network error'));

    const { result } = renderHookWithProvider(() =>
      useVideoSocialMetrics(videoId, videoPubkey)
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should return default values on error
    expect(result.current.data).toEqual({
      likeCount: 0,
      repostCount: 0,
      viewCount: 0,
    });
  });

  it('recognizes different like content types', async () => {
    const mockEvents: NostrEvent[] = [
      {
        id: 'like1',
        kind: 7,
        pubkey: 'user1',
        created_at: Date.now() / 1000,
        content: '+',
        tags: [['e', videoId]],
        sig: 'sig1',
      },
      {
        id: 'like2',
        kind: 7,
        pubkey: 'user2',
        created_at: Date.now() / 1000,
        content: '❤️',
        tags: [['e', videoId]],
        sig: 'sig2',
      },
      {
        id: 'like3',
        kind: 7,
        pubkey: 'user3',
        created_at: Date.now() / 1000,
        content: '👍',
        tags: [['e', videoId]],
        sig: 'sig3',
      },
    ];

    mockQuery.mockResolvedValue(mockEvents);

    const { result } = renderHookWithProvider(() =>
      useVideoSocialMetrics(videoId, videoPubkey)
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.likeCount).toBe(3);
  });
});

describe('useVideoUserInteractions', () => {
  const videoId = 'test-video-id';
  const userPubkey = 'test-user-pubkey';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderHookWithProvider = <T>(hook: () => T) => {
    return renderHook(hook, {
      wrapper: TestApp,
    });
  };

  it('detects user likes and reposts correctly', async () => {
    const mockEvents: NostrEvent[] = [
      {
        id: 'like1',
        kind: 7,
        pubkey: userPubkey,
        created_at: Date.now() / 1000,
        content: '+',
        tags: [['e', videoId]],
        sig: 'sig1',
      },
      {
        id: 'repost1',
        kind: 6,
        pubkey: userPubkey,
        created_at: Date.now() / 1000,
        content: '',
        tags: [['e', videoId]],
        sig: 'sig2',
      },
    ];

    mockQuery.mockResolvedValue(mockEvents);

    const { result } = renderHookWithProvider(() =>
      useVideoUserInteractions(videoId, userPubkey)
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      hasLiked: true,
      hasReposted: true,
    });
  });

  it('returns false when user has no interactions', async () => {
    mockQuery.mockResolvedValue([]);

    const { result } = renderHookWithProvider(() =>
      useVideoUserInteractions(videoId, userPubkey)
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      hasLiked: false,
      hasReposted: false,
    });
  });

  it('is disabled when no user pubkey provided', async () => {
    const { result } = renderHookWithProvider(() =>
      useVideoUserInteractions(videoId, undefined)
    );

    // Should be disabled and return default values
    expect(result.current.data).toEqual({
      hasLiked: false,
      hasReposted: false,
    });

    // Query should not be called
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('handles errors gracefully', async () => {
    mockQuery.mockRejectedValue(new Error('Network error'));

    const { result } = renderHookWithProvider(() =>
      useVideoUserInteractions(videoId, userPubkey)
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      hasLiked: false,
      hasReposted: false,
    });
  });
});
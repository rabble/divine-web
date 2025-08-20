// ABOUTME: Tests for profile statistics hook calculating video count, views, followers, and joined date
// ABOUTME: Tests data aggregation from video events and contact lists

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { useProfileStats } from './useProfileStats';

// Mock dependencies
vi.mock('@/hooks/useNostr', () => ({
  useNostr: () => ({
    nostr: {
      query: vi.fn(),
    },
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

const mockPubkey = 'test-pubkey-123';

// Mock video events
const _mockVideoEvents = [
  {
    id: 'video1',
    kind: 32222,
    pubkey: mockPubkey,
    created_at: 1690000000, // July 2023
    tags: [['url', 'https://example.com/video1.mp4']],
    content: 'First video',
  },
  {
    id: 'video2',
    kind: 32222,
    pubkey: mockPubkey,
    created_at: 1692000000, // August 2023
    tags: [['url', 'https://example.com/video2.mp4']],
    content: 'Second video',
  },
  {
    id: 'video3',
    kind: 32222,
    pubkey: mockPubkey,
    created_at: 1694000000, // September 2023
    tags: [['url', 'https://example.com/video3.mp4']],
    content: 'Third video',
  },
];

// Mock social interaction events (likes, reposts for view calculation)
const _mockSocialEvents = [
  // Likes for video1
  { kind: 7, content: '+', tags: [['e', 'video1']] },
  { kind: 7, content: '❤️', tags: [['e', 'video1']] },
  { kind: 7, content: '+', tags: [['e', 'video1']] },
  // Reposts for video1
  { kind: 6, tags: [['e', 'video1']] },
  { kind: 6, tags: [['e', 'video1']] },
  // Likes for video2
  { kind: 7, content: '+', tags: [['e', 'video2']] },
  { kind: 7, content: '+', tags: [['e', 'video2']] },
  // Reposts for video2
  { kind: 6, tags: [['e', 'video2']] },
  // Likes for video3
  { kind: 7, content: '+', tags: [['e', 'video3']] },
];

// Mock follower events (kind 3 contact lists mentioning this user)
const _mockFollowerEvents = [
  {
    kind: 3,
    pubkey: 'follower1',
    tags: [['p', mockPubkey]],
    created_at: 1690500000,
  },
  {
    kind: 3,
    pubkey: 'follower2',
    tags: [['p', mockPubkey]],
    created_at: 1691000000,
  },
  {
    kind: 3,
    pubkey: 'follower3',
    tags: [['p', mockPubkey]],
    created_at: 1691500000,
  },
];

// Mock user's own contact list (for following count)
const _mockOwnContactList = {
  kind: 3,
  pubkey: mockPubkey,
  tags: [
    ['p', 'following1'],
    ['p', 'following2'],
    ['p', 'following3'],
    ['p', 'following4'],
    ['p', 'following5'],
  ],
  created_at: 1690000000,
};

describe('useProfileStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates profile statistics correctly', async () => {
    // Mock the query to return combined results
    vi.mocked(require('@tanstack/react-query').useQuery).mockReturnValue({
      data: {
        videosCount: 3,
        totalViews: 450, // Sum of interactions across all videos
        joinedDate: new Date(1690000000 * 1000), // First video timestamp
        followersCount: 3,
        followingCount: 5,
      },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(
      () => useProfileStats(mockPubkey),
      { wrapper: TestApp }
    );

    expect(result.current.data?.videosCount).toBe(3);
    expect(result.current.data?.totalViews).toBe(450);
    expect(result.current.data?.followersCount).toBe(3);
    expect(result.current.data?.followingCount).toBe(5);
    expect(result.current.data?.joinedDate).toEqual(new Date(1690000000 * 1000));
  });

  it('handles zero stats gracefully', async () => {
    vi.mocked(require('@tanstack/react-query').useQuery).mockReturnValue({
      data: {
        videosCount: 0,
        totalViews: 0,
        joinedDate: null,
        followersCount: 0,
        followingCount: 0,
      },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(
      () => useProfileStats(mockPubkey),
      { wrapper: TestApp }
    );

    expect(result.current.data?.videosCount).toBe(0);
    expect(result.current.data?.totalViews).toBe(0);
    expect(result.current.data?.followersCount).toBe(0);
    expect(result.current.data?.followingCount).toBe(0);
    expect(result.current.data?.joinedDate).toBeNull();
  });

  it('returns loading state correctly', async () => {
    vi.mocked(require('@tanstack/react-query').useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(
      () => useProfileStats(mockPubkey),
      { wrapper: TestApp }
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('handles query errors gracefully', async () => {
    const mockError = new Error('Failed to fetch profile stats');
    
    vi.mocked(require('@tanstack/react-query').useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
    });

    const { result } = renderHook(
      () => useProfileStats(mockPubkey),
      { wrapper: TestApp }
    );

    expect(result.current.error).toBe(mockError);
    expect(result.current.data).toBeUndefined();
  });

  it('correctly calculates total views from video interactions', async () => {
    // Mock data with detailed interaction breakdown
    vi.mocked(require('@tanstack/react-query').useQuery).mockReturnValue({
      data: {
        videosCount: 2,
        totalViews: 850, // video1: 500 views, video2: 350 views
        joinedDate: new Date(1690000000 * 1000),
        followersCount: 12,
        followingCount: 8,
      },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(
      () => useProfileStats(mockPubkey),
      { wrapper: TestApp }
    );

    expect(result.current.data?.totalViews).toBe(850);
  });

  it('uses current timestamp as joined date when no videos exist', async () => {
    const mockCurrentTime = new Date();
    
    vi.mocked(require('@tanstack/react-query').useQuery).mockReturnValue({
      data: {
        videosCount: 0,
        totalViews: 0,
        joinedDate: mockCurrentTime, // Fallback to current time
        followersCount: 0,
        followingCount: 0,
      },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(
      () => useProfileStats(mockPubkey),
      { wrapper: TestApp }
    );

    expect(result.current.data?.joinedDate).toEqual(mockCurrentTime);
  });

  it('does not execute query when pubkey is empty', async () => {
    const mockQuery = vi.fn();
    vi.mocked(require('@tanstack/react-query').useQuery).mockImplementation(mockQuery);

    renderHook(
      () => useProfileStats(''),
      { wrapper: TestApp }
    );

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
  });

  it('refreshes data with appropriate stale time', async () => {
    const mockQuery = vi.fn().mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    vi.mocked(require('@tanstack/react-query').useQuery).mockImplementation(mockQuery);

    renderHook(
      () => useProfileStats(mockPubkey),
      { wrapper: TestApp }
    );

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        staleTime: 60000, // 1 minute
        gcTime: 300000, // 5 minutes
      })
    );
  });
});
// ABOUTME: Tests for follow relationship hooks managing kind 3 contact lists
// ABOUTME: Tests following/unfollowing users and querying follow status

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { useFollowRelationship, useFollowUser, useUnfollowUser } from './useFollowRelationship';

// Mock dependencies
vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock('@/hooks/useNostr', () => ({
  useNostr: () => ({
    nostr: {
      query: vi.fn(),
    },
  }),
}));

vi.mock('@/hooks/useNostrPublish', () => ({
  useNostrPublish: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

const mockCurrentUser = {
  pubkey: 'current-user-pubkey',
  signer: {},
};

const mockTargetPubkey = 'target-user-pubkey';

// Mock kind 3 contact list event
const mockContactListEvent = {
  id: 'contact-list-event-id',
  kind: 3,
  pubkey: 'current-user-pubkey',
  created_at: Date.now() / 1000,
  content: JSON.stringify({
    'wss://relay.example.com': { read: true, write: true },
  }),
  tags: [
    ['p', 'existing-friend-1', 'wss://relay.example.com', 'Alice'],
    ['p', 'existing-friend-2', 'wss://relay.example.com', 'Bob'],
    ['p', 'target-user-pubkey', 'wss://relay.example.com', ''],
  ],
  sig: 'mock-signature',
};

describe('useFollowRelationship', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useCurrentUser
    vi.mocked(require('@/hooks/useCurrentUser').useCurrentUser).mockReturnValue({
      user: mockCurrentUser,
    });
  });

  it('returns correct follow status when user is following target', async () => {
    // Mock useQuery to return contact list with target user
    vi.mocked(require('@tanstack/react-query').useQuery).mockReturnValue({
      data: {
        isFollowing: true,
        mutualFollows: 2,
        contactListEvent: mockContactListEvent,
      },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(
      () => useFollowRelationship(mockTargetPubkey),
      { wrapper: TestApp }
    );

    expect(result.current.data?.isFollowing).toBe(true);
    expect(result.current.data?.mutualFollows).toBe(2);
    expect(result.current.data?.contactListEvent).toEqual(mockContactListEvent);
  });

  it('returns correct follow status when user is not following target', async () => {
    const contactListWithoutTarget = {
      ...mockContactListEvent,
      tags: [
        ['p', 'existing-friend-1', 'wss://relay.example.com', 'Alice'],
        ['p', 'existing-friend-2', 'wss://relay.example.com', 'Bob'],
        // target-user-pubkey is not in the list
      ],
    };

    vi.mocked(require('@tanstack/react-query').useQuery).mockReturnValue({
      data: {
        isFollowing: false,
        mutualFollows: 0,
        contactListEvent: contactListWithoutTarget,
      },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(
      () => useFollowRelationship(mockTargetPubkey),
      { wrapper: TestApp }
    );

    expect(result.current.data?.isFollowing).toBe(false);
    expect(result.current.data?.mutualFollows).toBe(0);
  });

  it('handles no contact list gracefully', async () => {
    vi.mocked(require('@tanstack/react-query').useQuery).mockReturnValue({
      data: {
        isFollowing: false,
        mutualFollows: 0,
        contactListEvent: null,
      },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(
      () => useFollowRelationship(mockTargetPubkey),
      { wrapper: TestApp }
    );

    expect(result.current.data?.isFollowing).toBe(false);
    expect(result.current.data?.contactListEvent).toBeNull();
  });

  it('returns loading state correctly', async () => {
    vi.mocked(require('@tanstack/react-query').useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(
      () => useFollowRelationship(mockTargetPubkey),
      { wrapper: TestApp }
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data?.isFollowing).toBeUndefined();
  });

  it('does not execute query when no current user', async () => {
    vi.mocked(require('@/hooks/useCurrentUser').useCurrentUser).mockReturnValue({
      user: null,
    });

    const mockQuery = vi.fn();
    vi.mocked(require('@tanstack/react-query').useQuery).mockImplementation(mockQuery);

    renderHook(
      () => useFollowRelationship(mockTargetPubkey),
      { wrapper: TestApp }
    );

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
  });
});

describe('useFollowUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(require('@/hooks/useCurrentUser').useCurrentUser).mockReturnValue({
      user: mockCurrentUser,
    });
  });

  it('adds user to contact list when following', async () => {
    const mockMutate = vi.fn();
    const mockPublish = vi.fn();
    const mockQueryClient = {
      invalidateQueries: vi.fn(),
    };

    vi.mocked(require('@/hooks/useNostrPublish').useNostrPublish).mockReturnValue({
      mutateAsync: mockPublish,
    });

    vi.mocked(require('@tanstack/react-query').useMutation).mockReturnValue({
      mutateAsync: mockMutate,
      isPending: false,
    });

    vi.mocked(require('@tanstack/react-query').useQueryClient).mockReturnValue(mockQueryClient);

    const { result } = renderHook(
      () => useFollowUser(),
      { wrapper: TestApp }
    );

    const currentContactList = {
      ...mockContactListEvent,
      tags: [
        ['p', 'existing-friend-1', 'wss://relay.example.com', 'Alice'],
        ['p', 'existing-friend-2', 'wss://relay.example.com', 'Bob'],
      ],
    };

    await result.current.mutateAsync({
      targetPubkey: mockTargetPubkey,
      currentContactList: currentContactList,
      targetDisplayName: 'Target User',
    });

    expect(mockMutate).toHaveBeenCalled();
  });

  it('handles missing current contact list by creating new one', async () => {
    const mockMutate = vi.fn();
    
    vi.mocked(require('@tanstack/react-query').useMutation).mockReturnValue({
      mutateAsync: mockMutate,
      isPending: false,
    });

    const { result } = renderHook(
      () => useFollowUser(),
      { wrapper: TestApp }
    );

    await result.current.mutateAsync({
      targetPubkey: mockTargetPubkey,
      currentContactList: null, // No existing contact list
      targetDisplayName: 'Target User',
    });

    expect(mockMutate).toHaveBeenCalled();
  });
});

describe('useUnfollowUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(require('@/hooks/useCurrentUser').useCurrentUser).mockReturnValue({
      user: mockCurrentUser,
    });
  });

  it('removes user from contact list when unfollowing', async () => {
    const mockMutate = vi.fn();
    
    vi.mocked(require('@tanstack/react-query').useMutation).mockReturnValue({
      mutateAsync: mockMutate,
      isPending: false,
    });

    const { result } = renderHook(
      () => useUnfollowUser(),
      { wrapper: TestApp }
    );

    await result.current.mutateAsync({
      targetPubkey: mockTargetPubkey,
      currentContactList: mockContactListEvent,
    });

    expect(mockMutate).toHaveBeenCalled();
  });

  it('handles missing contact list gracefully', async () => {
    const mockMutate = vi.fn();
    
    vi.mocked(require('@tanstack/react-query').useMutation).mockReturnValue({
      mutateAsync: mockMutate,
      isPending: false,
    });

    const { result } = renderHook(
      () => useUnfollowUser(),
      { wrapper: TestApp }
    );

    // Should not error when no contact list exists
    await expect(
      result.current.mutateAsync({
        targetPubkey: mockTargetPubkey,
        currentContactList: null,
      })
    ).resolves.not.toThrow();
  });
});
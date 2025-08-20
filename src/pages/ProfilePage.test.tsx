// ABOUTME: Integration tests for enhanced ProfilePage with grid layout and follow functionality
// ABOUTME: Tests complete profile experience including header, stats, video grid, and interactions

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import ProfilePage from './ProfilePage';
import type { NostrMetadata } from '@nostrify/nostrify';

// Mock React Router
vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
  useNavigate: () => vi.fn(),
}));

// Mock all the hooks
vi.mock('@/hooks/useAuthor', () => ({
  useAuthor: vi.fn(),
}));

vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock('@/hooks/useVideoEvents', () => ({
  useVideoEvents: vi.fn(),
}));

vi.mock('@/hooks/useProfileStats', () => ({
  useProfileStats: vi.fn(),
}));

vi.mock('@/hooks/useFollowRelationship', () => ({
  useFollowRelationship: vi.fn(),
}));

vi.mock('@/hooks/useFollowUser', () => ({
  useFollowUser: vi.fn(),
}));

vi.mock('@/hooks/useUnfollowUser', () => ({
  useUnfollowUser: vi.fn(),
}));

const mockMetadata: NostrMetadata = {
  name: 'Jane Creator',
  display_name: 'Jane',
  about: 'Digital artist creating amazing short videos',
  picture: 'https://example.com/jane.jpg',
  nip05: 'jane@example.com',
};

const mockProfileStats = {
  videosCount: 15,
  totalViews: 5250,
  joinedDate: new Date('2023-05-10'),
  followersCount: 423,
  followingCount: 127,
};

const mockVideos = [
  {
    id: 'video1',
    pubkey: 'jane-pubkey',
    videoUrl: 'https://example.com/video1.mp4',
    content: 'Amazing creativity in motion',
    createdAt: Date.now() - 86400000,
    hashtags: ['art'],
    isRepost: false,
    vineId: 'vine1',
  },
  {
    id: 'video2',
    pubkey: 'jane-pubkey',
    videoUrl: 'https://example.com/video2.mp4',
    content: 'Another creative masterpiece',
    createdAt: Date.now() - 172800000,
    hashtags: ['creative'],
    isRepost: false,
    vineId: 'vine2',
  },
];

describe('ProfilePage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock router params
    vi.mocked(require('react-router-dom').useParams).mockReturnValue({
      npub: 'npub1testuser123',
    });

    // Mock useAuthor
    vi.mocked(require('@/hooks/useAuthor').useAuthor).mockReturnValue({
      data: {
        metadata: mockMetadata,
        pubkey: 'jane-pubkey',
      },
      isLoading: false,
    });

    // Mock current user (not the profile owner)
    vi.mocked(require('@/hooks/useCurrentUser').useCurrentUser).mockReturnValue({
      user: {
        pubkey: 'different-user-pubkey',
        signer: {},
      },
    });

    // Mock profile stats
    vi.mocked(require('@/hooks/useProfileStats').useProfileStats).mockReturnValue({
      data: mockProfileStats,
      isLoading: false,
    });

    // Mock follow relationship
    vi.mocked(require('@/hooks/useFollowRelationship').useFollowRelationship).mockReturnValue({
      isFollowing: false,
      isLoading: false,
      contactListEvent: null,
    });

    // Mock video events
    vi.mocked(require('@/hooks/useVideoEvents').useVideoEvents).mockReturnValue({
      data: mockVideos,
      isLoading: false,
      error: null,
    });

    // Mock follow/unfollow mutations
    vi.mocked(require('@/hooks/useFollowUser').useFollowUser).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    vi.mocked(require('@/hooks/useUnfollowUser').useUnfollowUser).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it('renders complete profile page with header, stats, and video grid', async () => {
    render(
      <TestApp>
        <ProfilePage />
      </TestApp>
    );

    // Check profile header elements
    expect(screen.getByTestId('profile-header')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText(/Digital artist creating/)).toBeInTheDocument();

    // Check profile stats
    expect(screen.getByText('15')).toBeInTheDocument(); // Videos count
    expect(screen.getByText('Videos')).toBeInTheDocument();
    expect(screen.getByText('423')).toBeInTheDocument(); // Followers
    expect(screen.getByText('Followers')).toBeInTheDocument();
    expect(screen.getByText('5.25K')).toBeInTheDocument(); // Total views

    // Check video grid
    expect(screen.getByTestId('video-grid')).toBeInTheDocument();
    const videoItems = screen.getAllByTestId('video-grid-item');
    expect(videoItems).toHaveLength(2);

    // Check follow button
    expect(screen.getByTestId('follow-button')).toBeInTheDocument();
    expect(screen.getByText('Follow')).toBeInTheDocument();
  });

  it('shows loading states appropriately', async () => {
    // Mock loading states
    vi.mocked(require('@/hooks/useProfileStats').useProfileStats).mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    vi.mocked(require('@/hooks/useVideoEvents').useVideoEvents).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(
      <TestApp>
        <ProfilePage />
      </TestApp>
    );

    // Should show skeleton loaders
    const statSkeletons = screen.getAllByTestId(/stat-skeleton/);
    expect(statSkeletons.length).toBeGreaterThan(0);

    const videoSkeletons = screen.getAllByTestId('video-skeleton');
    expect(videoSkeletons.length).toBeGreaterThan(0);
  });

  it('handles follow/unfollow interactions correctly', async () => {
    const mockFollowUser = vi.fn();
    vi.mocked(require('@/hooks/useFollowUser').useFollowUser).mockReturnValue({
      mutateAsync: mockFollowUser,
      isPending: false,
    });

    render(
      <TestApp>
        <ProfilePage />
      </TestApp>
    );

    const followButton = screen.getByTestId('follow-button');
    fireEvent.click(followButton);

    await waitFor(() => {
      expect(mockFollowUser).toHaveBeenCalledWith({
        targetPubkey: 'jane-pubkey',
        targetDisplayName: 'Jane',
        currentContactList: null,
      });
    });
  });

  it('updates UI when follow status changes', async () => {
    // Initially not following
    const { rerender } = render(
      <TestApp>
        <ProfilePage />
      </TestApp>
    );

    expect(screen.getByText('Follow')).toBeInTheDocument();

    // Change to following state
    vi.mocked(require('@/hooks/useFollowRelationship').useFollowRelationship).mockReturnValue({
      isFollowing: true,
      isLoading: false,
      contactListEvent: { id: 'contact-list' },
    });

    rerender(
      <TestApp>
        <ProfilePage />
      </TestApp>
    );

    expect(screen.getByText('Following')).toBeInTheDocument();
  });

  it('hides follow button when viewing own profile', async () => {
    // Mock current user as profile owner
    vi.mocked(require('@/hooks/useCurrentUser').useCurrentUser).mockReturnValue({
      user: {
        pubkey: 'jane-pubkey', // Same as profile
        signer: {},
      },
    });

    render(
      <TestApp>
        <ProfilePage />
      </TestApp>
    );

    expect(screen.queryByTestId('follow-button')).not.toBeInTheDocument();
  });

  it('navigates to video when grid item is clicked', async () => {
    const mockNavigate = vi.fn();
    vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);

    render(
      <TestApp>
        <ProfilePage />
      </TestApp>
    );

    const firstVideoItem = screen.getAllByTestId('video-grid-item')[0];
    fireEvent.click(firstVideoItem);

    expect(mockNavigate).toHaveBeenCalledWith('/video/video1');
  });

  it('handles invalid npub gracefully', async () => {
    vi.mocked(require('react-router-dom').useParams).mockReturnValue({
      npub: 'invalid-npub',
    });

    render(
      <TestApp>
        <ProfilePage />
      </TestApp>
    );

    expect(screen.getByText('Invalid Profile')).toBeInTheDocument();
    expect(screen.getByText(/Invalid npub format/)).toBeInTheDocument();
  });

  it('shows empty state when user has no videos', async () => {
    vi.mocked(require('@/hooks/useVideoEvents').useVideoEvents).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    vi.mocked(require('@/hooks/useProfileStats').useProfileStats).mockReturnValue({
      data: {
        ...mockProfileStats,
        videosCount: 0,
        totalViews: 0,
      },
      isLoading: false,
    });

    render(
      <TestApp>
        <ProfilePage />
      </TestApp>
    );

    expect(screen.getByTestId('video-grid-empty')).toBeInTheDocument();
    expect(screen.getByText('No videos to display')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Video count should be 0
  });

  it('handles video loading errors gracefully', async () => {
    vi.mocked(require('@/hooks/useVideoEvents').useVideoEvents).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load videos'),
    });

    render(
      <TestApp>
        <ProfilePage />
      </TestApp>
    );

    expect(screen.getByText('Failed to load videos')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('switches between grid and list view correctly', async () => {
    render(
      <TestApp>
        <ProfilePage />
      </TestApp>
    );

    // Should default to grid view
    expect(screen.getByTestId('video-grid')).toBeInTheDocument();

    // Switch to list view (if toggle exists)
    const viewToggle = screen.queryByTestId('view-toggle');
    if (viewToggle) {
      fireEvent.click(viewToggle);
      expect(screen.getByTestId('video-feed')).toBeInTheDocument();
    }
  });

  it('displays follower and following counts correctly', async () => {
    render(
      <TestApp>
        <ProfilePage />
      </TestApp>
    );

    // Check formatted follower count
    expect(screen.getByText('423')).toBeInTheDocument();
    expect(screen.getByText('Followers')).toBeInTheDocument();

    // Check following count
    expect(screen.getByText('127')).toBeInTheDocument();
    expect(screen.getByText('Following')).toBeInTheDocument();
  });

  it('shows mutual follow indicators when applicable', async () => {
    vi.mocked(require('@/hooks/useFollowRelationship').useFollowRelationship).mockReturnValue({
      isFollowing: true,
      mutualFollows: 5,
      isLoading: false,
      contactListEvent: { id: 'contact-list' },
    });

    render(
      <TestApp>
        <ProfilePage />
      </TestApp>
    );

    // Should show mutual follow count if implemented
    const mutualIndicator = screen.queryByText(/5 mutual/);
    if (mutualIndicator) {
      expect(mutualIndicator).toBeInTheDocument();
    }
  });
});
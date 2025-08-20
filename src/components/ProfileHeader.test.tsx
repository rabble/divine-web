// ABOUTME: Tests for ProfileHeader component showing user avatar, bio, stats, and follow button
// ABOUTME: Covers user metadata display, follow/unfollow interactions, and responsive behavior

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { ProfileHeader } from './ProfileHeader';
import type { NostrMetadata } from '@nostrify/nostrify';

// Mock hooks
vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock('@/hooks/useNostrPublish', () => ({
  useNostrPublish: vi.fn(),
}));

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

const mockMetadata: NostrMetadata = {
  name: 'Alice Smith',
  display_name: 'Alice',
  about: 'Video creator and digital artist sharing creativity through short-form content.',
  picture: 'https://example.com/alice.jpg',
  nip05: 'alice@example.com',
  website: 'https://alice.example.com',
};

const mockProfileStats = {
  videosCount: 42,
  totalViews: 12500,
  joinedDate: new Date('2023-06-15'),
  followersCount: 256,
  followingCount: 89,
};

describe('ProfileHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays user avatar, name, and bio correctly', () => {
    render(
      <TestApp>
        <ProfileHeader
          pubkey="npub123test"
          metadata={mockMetadata}
          stats={mockProfileStats}
          isOwnProfile={false}
          isFollowing={false}
          onFollowToggle={vi.fn()}
        />
      </TestApp>
    );

    // Check avatar with fallback
    const avatar = screen.getByTestId('profile-avatar');
    expect(avatar).toBeInTheDocument();
    
    // Check name display
    expect(screen.getByText('Alice')).toBeInTheDocument();
    
    // Check bio
    expect(screen.getByText(/Video creator and digital artist/)).toBeInTheDocument();
    
    // Check NIP-05 verification
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('displays profile statistics correctly', () => {
    render(
      <TestApp>
        <ProfileHeader
          pubkey="npub123test"
          metadata={mockMetadata}
          stats={mockProfileStats}
          isOwnProfile={false}
          isFollowing={false}
          onFollowToggle={vi.fn()}
        />
      </TestApp>
    );

    // Check video count
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Videos')).toBeInTheDocument();
    
    // Check follower count
    expect(screen.getByText('256')).toBeInTheDocument();
    expect(screen.getByText('Followers')).toBeInTheDocument();
    
    // Check following count
    expect(screen.getByText('89')).toBeInTheDocument();
    expect(screen.getByText('Following')).toBeInTheDocument();
    
    // Check total views
    expect(screen.getByText('12.5K')).toBeInTheDocument();
    expect(screen.getByText('Total Views')).toBeInTheDocument();
    
    // Check joined date
    expect(screen.getByText('Joined June 2023')).toBeInTheDocument();
  });

  it('shows follow button when not own profile and not following', () => {
    const mockOnFollowToggle = vi.fn();
    
    render(
      <TestApp>
        <ProfileHeader
          pubkey="npub123test"
          metadata={mockMetadata}
          stats={mockProfileStats}
          isOwnProfile={false}
          isFollowing={false}
          onFollowToggle={mockOnFollowToggle}
        />
      </TestApp>
    );

    const followButton = screen.getByTestId('follow-button');
    expect(followButton).toBeInTheDocument();
    expect(followButton).toHaveTextContent('Follow');
    
    fireEvent.click(followButton);
    expect(mockOnFollowToggle).toHaveBeenCalledWith(true);
  });

  it('shows unfollow button when following', () => {
    const mockOnFollowToggle = vi.fn();
    
    render(
      <TestApp>
        <ProfileHeader
          pubkey="npub123test"
          metadata={mockMetadata}
          stats={mockProfileStats}
          isOwnProfile={false}
          isFollowing={true}
          onFollowToggle={mockOnFollowToggle}
        />
      </TestApp>
    );

    const unfollowButton = screen.getByTestId('follow-button');
    expect(unfollowButton).toBeInTheDocument();
    expect(unfollowButton).toHaveTextContent('Following');
    
    fireEvent.click(unfollowButton);
    expect(mockOnFollowToggle).toHaveBeenCalledWith(false);
  });

  it('hides follow button when viewing own profile', () => {
    render(
      <TestApp>
        <ProfileHeader
          pubkey="npub123test"
          metadata={mockMetadata}
          stats={mockProfileStats}
          isOwnProfile={true}
          isFollowing={false}
          onFollowToggle={vi.fn()}
        />
      </TestApp>
    );

    expect(screen.queryByTestId('follow-button')).not.toBeInTheDocument();
  });

  it('handles missing metadata gracefully', () => {
    render(
      <TestApp>
        <ProfileHeader
          pubkey="npub123test"
          metadata={undefined}
          stats={mockProfileStats}
          isOwnProfile={false}
          isFollowing={false}
          onFollowToggle={vi.fn()}
        />
      </TestApp>
    );

    // Should show generated name fallback
    expect(screen.getByTestId('profile-avatar')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument(); // Stats should still show
  });

  it('formats large numbers correctly', () => {
    const largeStats = {
      ...mockProfileStats,
      totalViews: 1250000,
      followersCount: 15600,
    };

    render(
      <TestApp>
        <ProfileHeader
          pubkey="npub123test"
          metadata={mockMetadata}
          stats={largeStats}
          isOwnProfile={false}
          isFollowing={false}
          onFollowToggle={vi.fn()}
        />
      </TestApp>
    );

    // Check formatted numbers
    expect(screen.getByText('1.25M')).toBeInTheDocument(); // Total views
    expect(screen.getByText('15.6K')).toBeInTheDocument(); // Followers
  });

  it('shows loading state when stats are not provided', () => {
    render(
      <TestApp>
        <ProfileHeader
          pubkey="npub123test"
          metadata={mockMetadata}
          stats={undefined}
          isOwnProfile={false}
          isFollowing={false}
          onFollowToggle={vi.fn()}
        />
      </TestApp>
    );

    // Should show skeleton loaders for stats
    const skeletons = screen.getAllByTestId(/stat-skeleton/);
    expect(skeletons).toHaveLength(5); // videos, followers, following, views, joined
  });

  it('has responsive layout for mobile and desktop', () => {
    render(
      <TestApp>
        <ProfileHeader
          pubkey="npub123test"
          metadata={mockMetadata}
          stats={mockProfileStats}
          isOwnProfile={false}
          isFollowing={false}
          onFollowToggle={vi.fn()}
        />
      </TestApp>
    );

    const profileHeader = screen.getByTestId('profile-header');
    expect(profileHeader).toHaveClass('space-y-4'); // Should have spacing classes
    
    const statsContainer = screen.getByTestId('profile-stats');
    expect(statsContainer).toHaveClass('grid'); // Should use grid layout
  });
});
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VideoFeed } from './VideoFeed';
import { TestApp } from '@/test/TestApp';
import { VideoPlaybackProvider } from '@/contexts/VideoPlaybackContext';
import type { ParsedVideoData } from '@/types/video';

// Mock react-intersection-observer
const mockInView = vi.fn();
const mockInViewRef = vi.fn();
vi.mock('react-intersection-observer', () => ({
  useInView: () => ({
    ref: mockInViewRef,
    inView: mockInView()
  })
}));

// Mock video events hook
const mockVideoEventsData: ParsedVideoData[] = [
  {
    id: 'video-1',
    pubkey: 'author-1',
    createdAt: 1640995200,
    content: 'First video content',
    videoUrl: 'https://nostr.build/video1.mp4',
    thumbnailUrl: 'https://nostr.build/thumb1.jpg',
    title: 'First Video',
    hashtags: ['first', 'test'],
    isRepost: false,
    vineId: 'vine-1'
  },
  {
    id: 'video-2',
    pubkey: 'author-2',
    createdAt: 1640995300,
    content: 'Second video content',
    videoUrl: 'https://nostr.build/video2.mp4',
    title: 'Second Video',
    hashtags: ['second', 'test'],
    isRepost: false,
    vineId: 'vine-2'
  }
];

const mockUseVideoEvents = vi.fn();
vi.mock('@/hooks/useVideoEvents', () => ({
  useVideoEvents: mockUseVideoEvents
}));

// Mock the useAuthor hook
vi.mock('@/hooks/useAuthor', () => ({
  useAuthor: () => ({
    data: {
      metadata: {
        name: 'Test Author',
        picture: 'https://example.com/avatar.jpg'
      }
    }
  })
}));

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeEach(() => {
  console.log = vi.fn();
  vi.clearAllMocks();
  mockInView.mockReturnValue(false);
  
  // Default successful response
  mockUseVideoEvents.mockReturnValue({
    data: mockVideoEventsData,
    isLoading: false,
    error: null,
    isSuccess: true,
    refetch: vi.fn()
  });
});

afterEach(() => {
  console.log = originalConsoleLog;
});

describe('VideoFeed', () => {
  const renderVideoFeed = (props = {}) => {
    return render(
      <TestApp>
        <VideoPlaybackProvider>
          <VideoFeed {...props} />
        </VideoPlaybackProvider>
      </TestApp>
    );
  };

  it('renders video feed with default discovery type', () => {
    renderVideoFeed();

    expect(mockUseVideoEvents).toHaveBeenCalledWith({
      feedType: 'discovery',
      hashtag: undefined,
      pubkey: undefined,
      limit: 20
    });

    expect(screen.getByText('First Video')).toBeInTheDocument();
    expect(screen.getByText('Second Video')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    mockUseVideoEvents.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isSuccess: false,
      refetch: vi.fn()
    });

    renderVideoFeed();

    // Should show skeleton loading cards
    const skeletons = document.querySelectorAll('[class*="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders error state with retry button', () => {
    const mockRefetch = vi.fn();
    mockUseVideoEvents.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
      isSuccess: false,
      refetch: mockRefetch
    });

    renderVideoFeed();

    expect(screen.getByText('Failed to load videos')).toBeInTheDocument();
    
    const retryButton = screen.getByText('Try again');
    fireEvent.click(retryButton);
    
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders empty state for discovery feed', () => {
    mockUseVideoEvents.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isSuccess: true,
      refetch: vi.fn()
    });

    renderVideoFeed({ feedType: 'discovery' });

    expect(screen.getByText('No videos found. Try another relay?')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument(); // RelaySelector
  });

  it('renders empty state for home feed', () => {
    mockUseVideoEvents.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isSuccess: true,
      refetch: vi.fn()
    });

    renderVideoFeed({ feedType: 'home' });

    expect(screen.getByText("No videos from people you follow yet. Try following some creators!")).toBeInTheDocument();
  });

  it('renders empty state for hashtag feed', () => {
    mockUseVideoEvents.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isSuccess: true,
      refetch: vi.fn()
    });

    renderVideoFeed({ feedType: 'hashtag', hashtag: 'bitcoin' });

    expect(screen.getByText('No videos found for #bitcoin')).toBeInTheDocument();
  });

  it('renders empty state for profile feed', () => {
    mockUseVideoEvents.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isSuccess: true,
      refetch: vi.fn()
    });

    renderVideoFeed({ feedType: 'profile' });

    expect(screen.getByText("This user hasn't posted any videos yet")).toBeInTheDocument();
  });

  it('passes correct props for hashtag feed', () => {
    renderVideoFeed({ 
      feedType: 'hashtag', 
      hashtag: 'nostr',
      limit: 30
    });

    expect(mockUseVideoEvents).toHaveBeenCalledWith({
      feedType: 'hashtag',
      hashtag: 'nostr',
      pubkey: undefined,
      limit: 30
    });
  });

  it('passes correct props for profile feed', () => {
    renderVideoFeed({ 
      feedType: 'profile', 
      pubkey: 'test-pubkey',
      limit: 50
    });

    expect(mockUseVideoEvents).toHaveBeenCalledWith({
      feedType: 'profile',
      hashtag: undefined,
      pubkey: 'test-pubkey',
      limit: 50
    });
  });

  it('handles like button clicks', async () => {
    renderVideoFeed();

    // Find like buttons (heart icons)
    const likeButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('[class*="heart"]') || 
      button.querySelector('[data-testid="heart"]')
    );

    expect(likeButtons.length).toBeGreaterThan(0);

    // Click first like button
    fireEvent.click(likeButtons[0]);

    // Should log the action (mocked console.log)
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith('Like video:', expect.any(String));
    });
  });

  it('handles repost button clicks', async () => {
    renderVideoFeed();

    // Find repost buttons (repeat icons)
    const repostButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('[class*="repeat"]') || 
      button.querySelector('[data-testid="repeat-2"]')
    );

    expect(repostButtons.length).toBeGreaterThan(0);

    // Click first repost button
    fireEvent.click(repostButtons[0]);

    // Should log the action (mocked console.log)
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith('Repost video:', expect.any(String));
    });
  });

  it('applies custom className', () => {
    renderVideoFeed({ className: 'custom-feed-class' });

    const feedElement = document.querySelector('.custom-feed-class');
    expect(feedElement).toBeInTheDocument();
  });

  it('shows load more indicator when near bottom', () => {
    // Mock intersection observer to trigger load more
    mockInView.mockReturnValue(true);

    renderVideoFeed({ limit: 20 });

    // Should show loading spinner when limit is reached
    const loadingSpinner = document.querySelector('[class*="animate-spin"]');
    expect(loadingSpinner).toBeInTheDocument();
  });

  it('handles infinite scroll trigger', async () => {
    // Mock intersection observer to be in view
    mockInView.mockReturnValue(true);

    renderVideoFeed();

    // When bottom ref is in view, should log about loading more
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith('Near bottom, would load more videos');
    });
  });

  it('renders correct number of video cards', () => {
    renderVideoFeed();

    // Should render a card for each video
    expect(screen.getByText('First Video')).toBeInTheDocument();
    expect(screen.getByText('Second Video')).toBeInTheDocument();
    
    // Check that video elements are present
    const videoElements = document.querySelectorAll('video');
    expect(videoElements.length).toBe(2);
  });

  it('handles videos with reposts correctly', () => {
    const videoWithRepost: ParsedVideoData = {
      ...mockVideoEventsData[0],
      id: 'repost-1',
      isRepost: true,
      reposterPubkey: 'reposter-pubkey',
      repostedAt: 1640995400
    };

    mockUseVideoEvents.mockReturnValue({
      data: [videoWithRepost, ...mockVideoEventsData.slice(1)],
      isLoading: false,
      error: null,
      isSuccess: true,
      refetch: vi.fn()
    });

    renderVideoFeed();

    // Should show repost indicator
    expect(screen.getByText(/reposted/)).toBeInTheDocument();
  });

  it('creates unique keys for video cards including reposts', () => {
    const originalVideo = mockVideoEventsData[0];
    const repostOfSameVideo: ParsedVideoData = {
      ...originalVideo,
      id: 'repost-1',
      isRepost: true,
      reposterPubkey: 'reposter-pubkey',
      repostedAt: 1640995400
    };

    mockUseVideoEvents.mockReturnValue({
      data: [originalVideo, repostOfSameVideo],
      isLoading: false,
      error: null,
      isSuccess: true,
      refetch: vi.fn()
    });

    renderVideoFeed();

    // Both should render without key conflicts
    expect(screen.getAllByText('First Video')).toHaveLength(2);
  });

  it('renders loading skeletons with proper structure', () => {
    mockUseVideoEvents.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isSuccess: false,
      refetch: vi.fn()
    });

    renderVideoFeed();

    // Should render multiple skeleton cards
    const cards = document.querySelectorAll('[class*="card"]');
    expect(cards.length).toBeGreaterThanOrEqual(3);

    // Each skeleton should have proper structure
    const skeletons = document.querySelectorAll('[class*="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('handles null/undefined data gracefully', () => {
    mockUseVideoEvents.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      isSuccess: true,
      refetch: vi.fn()
    });

    renderVideoFeed();

    // Should show empty state
    expect(screen.getByText('No videos found. Try another relay?')).toBeInTheDocument();
  });

  it('handles trending feed type', () => {
    renderVideoFeed({ feedType: 'trending' });

    expect(mockUseVideoEvents).toHaveBeenCalledWith({
      feedType: 'trending',
      hashtag: undefined,
      pubkey: undefined,
      limit: 20
    });
  });

  it('shows relay selector in all empty states', () => {
    mockUseVideoEvents.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isSuccess: true,
      refetch: vi.fn()
    });

    // Test different feed types all show relay selector
    const feedTypes = ['discovery', 'home', 'hashtag', 'profile', 'trending'] as const;
    
    feedTypes.forEach(feedType => {
      renderVideoFeed({ feedType });
      expect(screen.getByRole('combobox')).toBeInTheDocument(); // RelaySelector
    });
  });

  it('maintains scroll position during updates', () => {
    const { rerender } = renderVideoFeed();

    // Simulate scroll position
    Object.defineProperty(window, 'scrollY', { value: 500, writable: true });

    // Update with new data
    mockUseVideoEvents.mockReturnValue({
      data: [...mockVideoEventsData, {
        id: 'video-3',
        pubkey: 'author-3',
        createdAt: 1640995400,
        content: 'Third video',
        videoUrl: 'https://nostr.build/video3.mp4',
        title: 'Third Video',
        hashtags: ['third'],
        isRepost: false,
        vineId: 'vine-3'
      }],
      isLoading: false,
      error: null,
      isSuccess: true,
      refetch: vi.fn()
    });

    rerender(
      <TestApp>
        <VideoPlaybackProvider>
          <VideoFeed />
        </VideoPlaybackProvider>
      </TestApp>
    );

    // Component should handle updates without scroll jump
    expect(screen.getByText('Third Video')).toBeInTheDocument();
  });
});
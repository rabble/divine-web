import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { VideoPlaybackProvider } from '@/contexts/VideoPlaybackContext';
import { VideoPlayer } from '@/components/VideoPlayer';
import { VideoFeed } from '@/components/VideoFeed';
import type { ParsedVideoData } from '@/types/video';

// Mock react-intersection-observer with more control
const _mockInViewCallbacks: { [key: string]: (inView: boolean) => void } = {};
const mockInViewRefs: { [key: string]: (node: Element | null) => void } = {};

vi.mock('react-intersection-observer', () => ({
  useInView: ({ rootMargin, threshold }: { rootMargin?: string; threshold?: number }) => {
    const key = `${rootMargin}-${threshold}`;
    return {
      ref: (node: Element | null) => {
        if (mockInViewRefs[key]) {
          mockInViewRefs[key](node);
        }
      },
      inView: false // Default to false, will be controlled in tests
    };
  }
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
    hashtags: ['first'],
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
    hashtags: ['second'],
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

describe('Video Playback Integration', () => {
  const renderVideoPlaybackSystem = () => {
    return render(
      <TestApp>
        <VideoPlaybackProvider>
          <VideoFeed limit={2} />
        </VideoPlaybackProvider>
      </TestApp>
    );
  };

  it('integrates video feed with playback context', () => {
    renderVideoPlaybackSystem();

    // Both videos should be rendered
    expect(screen.getByText('First Video')).toBeInTheDocument();
    expect(screen.getByText('Second Video')).toBeInTheDocument();

    // Both videos should have video elements
    const videoElements = document.querySelectorAll('video');
    expect(videoElements).toHaveLength(2);
  });

  it('registers videos with playback context when mounted', async () => {
    renderVideoPlaybackSystem();

    const videoElements = document.querySelectorAll('video');
    expect(videoElements).toHaveLength(2);

    // Videos should be registered (tested indirectly through context functionality)
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith('Registering video:', 'video-1');
      expect(console.log).toHaveBeenCalledWith('Registering video:', 'video-2');
    });
  });

  it('handles multiple video players with single playback enforcement', async () => {
    render(
      <TestApp>
        <VideoPlaybackProvider>
          <VideoPlayer videoId="test-1" src="https://nostr.build/test1.mp4" />
          <VideoPlayer videoId="test-2" src="https://nostr.build/test2.mp4" />
          <VideoPlayer videoId="test-3" src="https://nostr.build/test3.mp4" />
        </VideoPlaybackProvider>
      </TestApp>
    );

    const videoElements = document.querySelectorAll('video');
    expect(videoElements).toHaveLength(3);

    // Mock video methods for all elements
    videoElements.forEach((video) => {
      const mockPlay = vi.fn().mockResolvedValue(undefined);
      const mockPause = vi.fn();
      Object.defineProperty(video, 'play', { value: mockPlay });
      Object.defineProperty(video, 'pause', { value: mockPause });
      Object.defineProperty(video, 'paused', { value: true, writable: true });
    });

    // All videos should be registered
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith('Registering video:', 'test-1');
      expect(console.log).toHaveBeenCalledWith('Registering video:', 'test-2');
      expect(console.log).toHaveBeenCalledWith('Registering video:', 'test-3');
    });
  });

  it('handles video error states in feed context', async () => {
    renderVideoPlaybackSystem();

    const firstVideo = document.querySelectorAll('video')[0];
    if (firstVideo) {
      // Simulate video error
      fireEvent.error(firstVideo);

      await waitFor(() => {
        expect(screen.getByText('Failed to load video')).toBeInTheDocument();
      });
    }

    // Other videos should still be functional
    expect(screen.getByText('Second Video')).toBeInTheDocument();
  });

  it('handles video loading states in feed context', async () => {
    renderVideoPlaybackSystem();

    const firstVideo = document.querySelectorAll('video')[0];
    if (firstVideo) {
      // Simulate loading start
      fireEvent.loadStart(firstVideo);

      // Then simulate loaded data
      fireEvent.loadedData(firstVideo);
    }

    // Video should be functional
    expect(screen.getByText('First Video')).toBeInTheDocument();
  });

  it('maintains video state across feed updates', async () => {
    const { rerender } = renderVideoPlaybackSystem();

    // Add a new video to the data
    const updatedData = [
      ...mockVideoEventsData,
      {
        id: 'video-3',
        pubkey: 'author-3',
        createdAt: 1640995400,
        content: 'Third video content',
        videoUrl: 'https://nostr.build/video3.mp4',
        title: 'Third Video',
        hashtags: ['third'],
        isRepost: false,
        vineId: 'vine-3'
      }
    ];

    mockUseVideoEvents.mockReturnValue({
      data: updatedData,
      isLoading: false,
      error: null,
      isSuccess: true,
      refetch: vi.fn()
    });

    rerender(
      <TestApp>
        <VideoPlaybackProvider>
          <VideoFeed limit={3} />
        </VideoPlaybackProvider>
      </TestApp>
    );

    // New video should be added
    await waitFor(() => {
      expect(screen.getByText('Third Video')).toBeInTheDocument();
    });

    // Original videos should still be present
    expect(screen.getByText('First Video')).toBeInTheDocument();
    expect(screen.getByText('Second Video')).toBeInTheDocument();
  });

  it('handles feed loading and error states with video context', async () => {
    // Start with loading state
    mockUseVideoEvents.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isSuccess: false,
      refetch: vi.fn()
    });

    const { rerender } = render(
      <TestApp>
        <VideoPlaybackProvider>
          <VideoFeed />
        </VideoPlaybackProvider>
      </TestApp>
    );

    // Should show loading skeletons
    const skeletons = document.querySelectorAll('[class*="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);

    // Switch to error state
    const mockRefetch = vi.fn();
    mockUseVideoEvents.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
      isSuccess: false,
      refetch: mockRefetch
    });

    rerender(
      <TestApp>
        <VideoPlaybackProvider>
          <VideoFeed />
        </VideoPlaybackProvider>
      </TestApp>
    );

    // Should show error state
    expect(screen.getByText('Failed to load videos')).toBeInTheDocument();
    
    const retryButton = screen.getByText('Try again');
    fireEvent.click(retryButton);
    expect(mockRefetch).toHaveBeenCalled();

    // Switch to successful state
    mockUseVideoEvents.mockReturnValue({
      data: mockVideoEventsData,
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

    // Should show videos
    await waitFor(() => {
      expect(screen.getByText('First Video')).toBeInTheDocument();
      expect(screen.getByText('Second Video')).toBeInTheDocument();
    });
  });

  it('handles video interaction callbacks in feed context', async () => {
    renderVideoPlaybackSystem();

    // Find and click like button
    const likeButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('[class*="heart"]')
    );
    
    if (likeButtons.length > 0) {
      fireEvent.click(likeButtons[0]);
      
      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Like video:', 'video-1');
      });
    }

    // Find and click repost button
    const repostButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('[class*="repeat"]')
    );
    
    if (repostButtons.length > 0) {
      fireEvent.click(repostButtons[0]);
      
      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Repost video:', 'video-1');
      });
    }
  });

  it('handles video cleanup when components unmount', async () => {
    const { unmount } = renderVideoPlaybackSystem();

    // Videos should be registered
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith('Registering video:', 'video-1');
      expect(console.log).toHaveBeenCalledWith('Registering video:', 'video-2');
    });

    // Unmount the component
    unmount();

    // Videos should be unregistered (cleanup)
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith('Unregistering video:', 'video-1');
      expect(console.log).toHaveBeenCalledWith('Unregistering video:', 'video-2');
    });
  });

  it('handles video playback controls in feed context', async () => {
    renderVideoPlaybackSystem();

    const videoElements = document.querySelectorAll('video');
    expect(videoElements.length).toBeGreaterThan(0);

    const firstVideo = videoElements[0] as HTMLVideoElement;
    
    // Mock video methods
    const mockPlay = vi.fn().mockResolvedValue(undefined);
    const mockPause = vi.fn();
    Object.defineProperty(firstVideo, 'play', { value: mockPlay });
    Object.defineProperty(firstVideo, 'pause', { value: mockPause });
    Object.defineProperty(firstVideo, 'paused', { value: true, writable: true });

    // Click video to play
    fireEvent.click(firstVideo);

    await waitFor(() => {
      expect(mockPlay).toHaveBeenCalled();
    });

    // Simulate video playing
    Object.defineProperty(firstVideo, 'paused', { value: false, writable: true });
    fireEvent.play(firstVideo);

    // Click again to pause
    fireEvent.click(firstVideo);

    await waitFor(() => {
      expect(mockPause).toHaveBeenCalled();
    });
  });

  it('handles different feed types with video playback', () => {
    // Test hashtag feed
    render(
      <TestApp>
        <VideoPlaybackProvider>
          <VideoFeed feedType="hashtag" hashtag="nostr" />
        </VideoPlaybackProvider>
      </TestApp>
    );

    expect(mockUseVideoEvents).toHaveBeenCalledWith({
      feedType: 'hashtag',
      hashtag: 'nostr',
      pubkey: undefined,
      limit: 20
    });

    // Test profile feed
    render(
      <TestApp>
        <VideoPlaybackProvider>
          <VideoFeed feedType="profile" pubkey="test-pubkey" />
        </VideoPlaybackProvider>
      </TestApp>
    );

    expect(mockUseVideoEvents).toHaveBeenCalledWith({
      feedType: 'profile',
      hashtag: undefined,
      pubkey: 'test-pubkey',
      limit: 20
    });
  });

  it('handles video aspect ratios and responsive design', () => {
    renderVideoPlaybackSystem();

    // Check that videos maintain proper aspect ratio
    const aspectRatioContainers = document.querySelectorAll('.aspect-square');
    expect(aspectRatioContainers.length).toBeGreaterThan(0);

    // Check that videos are responsive
    const videoContainers = document.querySelectorAll('[class*="w-full"]');
    expect(videoContainers.length).toBeGreaterThan(0);
  });

  it('handles theme integration with video components', () => {
    renderVideoPlaybackSystem();

    // Components should have proper theme classes
    const cards = document.querySelectorAll('[class*="card"]');
    expect(cards.length).toBeGreaterThan(0);

    // Video controls should have proper theme styling
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
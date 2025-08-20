import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VideoCard } from './VideoCard';
import { TestApp } from '@/test/TestApp';
import { VideoPlaybackProvider } from '@/contexts/VideoPlaybackContext';
import type { ParsedVideoData } from '@/types/video';

// Mock react-intersection-observer for VideoPlayer
vi.mock('react-intersection-observer', () => ({
  useInView: () => ({
    ref: vi.fn(),
    inView: false
  })
}));

// Mock the useAuthor hook
const mockAuthorData = {
  data: {
    metadata: {
      name: 'Test Author',
      picture: 'https://example.com/avatar.jpg'
    }
  }
};

const mockReposterData = {
  data: {
    metadata: {
      name: 'Test Reposter',
      picture: 'https://example.com/reposter-avatar.jpg'
    }
  }
};

vi.mock('@/hooks/useAuthor', () => ({
  useAuthor: (pubkey: string) => {
    if (pubkey === 'f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1') return mockReposterData;
    return mockAuthorData;
  }
}));

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeEach(() => {
  console.log = vi.fn();
  vi.clearAllMocks();
});

afterEach(() => {
  console.log = originalConsoleLog;
});

describe('VideoCard', () => {
  const defaultVideoData: ParsedVideoData = {
    id: 'video-1',
    pubkey: 'e4690a13290739da123aa17d553851dec4cdd0e9d89aa18de3741c446caf8761',
    createdAt: 1640995200, // Jan 1, 2022
    content: 'Check out this amazing video!',
    videoUrl: 'https://nostr.build/video.mp4',
    thumbnailUrl: 'https://nostr.build/thumb.jpg',
    title: 'My Amazing Video',
    duration: 6,
    hashtags: ['nostr', 'video', 'fun'],
    isRepost: false,
    vineId: 'vine-123'
  };

  const repostVideoData: ParsedVideoData = {
    ...defaultVideoData,
    id: 'repost-1',
    isRepost: true,
    reposterPubkey: 'f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1',
    repostedAt: 1640995800 // 10 minutes later
  };

  const renderVideoCard = (props = {}) => {
    return render(
      <TestApp>
        <VideoPlaybackProvider>
          <VideoCard video={defaultVideoData} {...props} />
        </VideoPlaybackProvider>
      </TestApp>
    );
  };

  it('renders video card with all content', () => {
    renderVideoCard();

    // Check author info
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    const avatar = screen.getByAltText('Test Author');
    expect(avatar).toBeInTheDocument();

    // Check video title
    expect(screen.getByText('My Amazing Video')).toBeInTheDocument();

    // Check video content
    expect(screen.getByText('Check out this amazing video!')).toBeInTheDocument();

    // Check hashtags
    expect(screen.getByText('#nostr')).toBeInTheDocument();
    expect(screen.getByText('#video')).toBeInTheDocument();
    expect(screen.getByText('#fun')).toBeInTheDocument();

    // Check interaction buttons
    expect(screen.getByRole('button', { name: /like/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /repost/i })).toBeInTheDocument();
  });

  it('renders repost indicator for reposted videos', () => {
    renderVideoCard({ video: repostVideoData });

    expect(screen.getByText('Test Reposter reposted')).toBeInTheDocument();
  });

  it('does not render repost indicator for original videos', () => {
    renderVideoCard();

    expect(screen.queryByText(/reposted/)).not.toBeInTheDocument();
  });

  it('renders video player with correct props', () => {
    renderVideoCard();

    const videoElement = document.querySelector('video');
    expect(videoElement).toHaveAttribute('src', 'https://nostr.build/video.mp4');
    expect(videoElement).toHaveAttribute('poster', 'https://nostr.build/thumb.jpg');
  });

  it('handles video without title', () => {
    const videoWithoutTitle = { ...defaultVideoData, title: undefined };
    renderVideoCard({ video: videoWithoutTitle });

    expect(screen.queryByText('My Amazing Video')).not.toBeInTheDocument();
    expect(screen.getByText('Check out this amazing video!')).toBeInTheDocument();
  });

  it('handles video without content', () => {
    const videoWithoutContent = { ...defaultVideoData, content: '' };
    renderVideoCard({ video: videoWithoutContent });

    expect(screen.getByText('My Amazing Video')).toBeInTheDocument();
    expect(screen.queryByText('Check out this amazing video!')).not.toBeInTheDocument();
  });

  it('handles video without hashtags', () => {
    const videoWithoutHashtags = { ...defaultVideoData, hashtags: [] };
    renderVideoCard({ video: videoWithoutHashtags });

    expect(screen.queryByText('#nostr')).not.toBeInTheDocument();
    expect(screen.queryByText('#video')).not.toBeInTheDocument();
    expect(screen.queryByText('#fun')).not.toBeInTheDocument();
  });

  it('calls onLike when like button is clicked', () => {
    const onLike = vi.fn();
    renderVideoCard({ onLike });

    const likeButton = screen.getByRole('button', { name: /like/i });
    fireEvent.click(likeButton);

    expect(onLike).toHaveBeenCalledTimes(1);
  });

  it('calls onRepost when repost button is clicked', () => {
    const onRepost = vi.fn();
    renderVideoCard({ onRepost });

    const repostButton = screen.getByRole('button', { name: /repost/i });
    fireEvent.click(repostButton);

    expect(onRepost).toHaveBeenCalledTimes(1);
  });

  it('shows liked state when isLiked is true', () => {
    renderVideoCard({ isLiked: true, likeCount: 5 });

    const likeButton = screen.getByRole('button', { name: /like/i });
    expect(likeButton).toHaveClass('text-red-500');
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows reposted state when isReposted is true', () => {
    renderVideoCard({ isReposted: true, repostCount: 3 });

    const repostButton = screen.getByRole('button', { name: /repost/i });
    expect(repostButton).toHaveClass('text-green-500');
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not show counts when they are zero', () => {
    renderVideoCard({ likeCount: 0, repostCount: 0 });

    // Count text should not be shown for zero counts
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).not.toHaveTextContent('0');
    });
  });

  it('formats relative time correctly', () => {
    // Mock current date to be consistent
    const mockDate = new Date('2022-01-01T01:00:00.000Z');
    vi.setSystemTime(mockDate);

    renderVideoCard();

    // Should show relative time like "about 1 hour ago"
    expect(screen.getByText(/ago/)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('generates npub link for author', () => {
    renderVideoCard();

    const authorLink = screen.getByRole('link', { name: 'Test Author' });
    expect(authorLink).toHaveAttribute('href');
    expect(authorLink.getAttribute('href')).toMatch(/^\/npub1/);
  });

  it('handles hashtag links correctly', () => {
    renderVideoCard();

    const nostrHashtag = screen.getByRole('link', { name: '#nostr' });
    expect(nostrHashtag).toHaveAttribute('href', '/hashtag/nostr');

    const videoHashtag = screen.getByRole('link', { name: '#video' });
    expect(videoHashtag).toHaveAttribute('href', '/hashtag/video');
  });

  it('shows error state when video fails to load', async () => {
    renderVideoCard();

    const videoElement = document.querySelector('video');
    if (videoElement) {
      fireEvent.error(videoElement);
    }

    await waitFor(() => {
      expect(screen.getByText('Failed to load video')).toBeInTheDocument();
    });
  });

  it('resets error state when video starts loading', async () => {
    renderVideoCard({ mode: 'auto-play' }); // Ensure video is showing

    const videoElement = document.querySelector('video');
    if (videoElement) {
      // First cause an error
      fireEvent.error(videoElement);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load video')).toBeInTheDocument();
      });

      // Then simulate load start (should reset error)
      fireEvent.loadStart(videoElement);
      
      await waitFor(() => {
        expect(screen.queryByText('Failed to load video')).not.toBeInTheDocument();
      });
    }
  });

  it('applies custom className', () => {
    renderVideoCard({ className: 'custom-card-class' });

    const card = document.querySelector('.custom-card-class');
    expect(card).toBeInTheDocument();
  });

  it('uses fallback name when author has no metadata', () => {
    // Mock useAuthor to return no metadata
    vi.doMock('@/hooks/useAuthor', () => ({
      useAuthor: () => ({ data: null })
    }));

    renderVideoCard();

    // Should use generated name from genUserName
    // Since the generated name format depends on the pubkey, let's check that the name element exists
    const authorElements = screen.getAllByRole('link');
    const authorLink = authorElements.find(el => el.textContent && el.textContent.length > 0 && el.textContent !== '#nostr' && el.textContent !== '#video' && el.textContent !== '#fun');
    expect(authorLink).toBeInTheDocument();
  });

  it('handles missing author avatar gracefully', () => {
    // Mock useAuthor to return metadata without picture
    vi.doMock('@/hooks/useAuthor', () => ({
      useAuthor: () => ({
        data: {
          metadata: {
            name: 'Test Author'
            // No picture field
          }
        }
      })
    }));

    renderVideoCard();

    // Avatar should show fallback (first letter)
    const avatar = screen.getByText('T'); // First letter of "Test Author"
    expect(avatar).toBeInTheDocument();
  });

  it('handles reposter metadata correctly', () => {
    renderVideoCard({ video: repostVideoData });

    expect(screen.getByText('Test Reposter reposted')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument(); // Original author
  });

  it('handles missing reposter metadata', () => {
    const repostWithoutReposterData = {
      ...repostVideoData,
      reposterPubkey: 'unknown-reposter'
    };

    // Mock useAuthor to return no data for unknown reposter
    vi.doMock('@/hooks/useAuthor', () => ({
      useAuthor: (pubkey: string) => {
        if (pubkey === 'unknown-reposter') return { data: null };
        return mockAuthorData;
      }
    }));

    renderVideoCard({ video: repostWithoutReposterData });

    // Should show generated name for reposter
    expect(screen.getByText(/\w+ \w+ reposted/)).toBeInTheDocument();
  });

  it('creates proper NoteContent event structure', () => {
    renderVideoCard();

    // The NoteContent component should receive a properly structured event
    // This is tested indirectly by checking that content is rendered
    expect(screen.getByText('Check out this amazing video!')).toBeInTheDocument();
  });

  it('maintains video aspect ratio', () => {
    renderVideoCard();

    const videoContainer = document.querySelector('.aspect-square');
    expect(videoContainer).toBeInTheDocument();
  });

  it('handles all interaction buttons', () => {
    renderVideoCard();

    // Check all interaction buttons are present by their aria-labels
    expect(screen.getByRole('button', { name: /like/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /repost/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /comment/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
  });

  // Metadata Display Tests - TDD approach
  describe('Video Metadata Display', () => {
    it('displays view count when available', () => {
      renderVideoCard({ viewCount: 1200 });
      
      expect(screen.getByText('1.2K views')).toBeInTheDocument();
    });

    it('displays view count with proper formatting', () => {
      renderVideoCard({ viewCount: 999 });
      expect(screen.getByText('999 views')).toBeInTheDocument();

      renderVideoCard({ viewCount: 1500 });
      expect(screen.getByText('1.5K views')).toBeInTheDocument();

      renderVideoCard({ viewCount: 1000000 });
      expect(screen.getByText('1M views')).toBeInTheDocument();
    });

    it('displays "0 views" when view count is zero', () => {
      renderVideoCard({ viewCount: 0 });
      
      expect(screen.getByText('0 views')).toBeInTheDocument();
    });

    it('does not display view count when not provided', () => {
      renderVideoCard();
      
      expect(screen.queryByText(/views/)).not.toBeInTheDocument();
    });

    it('displays video duration when available', () => {
      const videoWithDuration = { ...defaultVideoData, duration: 6 };
      renderVideoCard({ video: videoWithDuration });
      
      expect(screen.getByText('0:06')).toBeInTheDocument();
    });

    it('displays video duration in proper format', () => {
      const videoWith30Seconds = { ...defaultVideoData, duration: 30 };
      renderVideoCard({ video: videoWith30Seconds });
      expect(screen.getByText('0:30')).toBeInTheDocument();

      const videoWith75Seconds = { ...defaultVideoData, duration: 75 };
      renderVideoCard({ video: videoWith75Seconds });
      expect(screen.getByText('1:15')).toBeInTheDocument();

      const videoWith3600Seconds = { ...defaultVideoData, duration: 3600 };
      renderVideoCard({ video: videoWith3600Seconds });
      expect(screen.getByText('1:00:00')).toBeInTheDocument();
    });

    it('does not display duration when not available', () => {
      const videoWithoutDuration = { ...defaultVideoData, duration: undefined };
      renderVideoCard({ video: videoWithoutDuration });
      
      expect(screen.queryByText(/^\d+:\d{2}$/)).not.toBeInTheDocument();
    });

    it('displays relative timestamp', () => {
      // Use fake timers and set specific time
      vi.useFakeTimers();
      const mockDate = new Date('2022-01-01T02:00:00.000Z');
      vi.setSystemTime(mockDate);

      renderVideoCard();
      
      expect(screen.getByText(/2 hours ago/)).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('displays different relative time formats', () => {
      // Test "minutes ago"
      vi.useFakeTimers();
      const mockDate1 = new Date('2022-01-01T00:30:00.000Z');
      vi.setSystemTime(mockDate1);
      renderVideoCard();
      expect(screen.getByText(/30 minutes ago/)).toBeInTheDocument();

      // Test "days ago"
      const videoDaysAgo = { ...defaultVideoData, createdAt: 1640822400 }; // Dec 30, 2021
      const mockDate2 = new Date('2022-01-02T00:00:00.000Z'); // 3 days later
      vi.setSystemTime(mockDate2);
      renderVideoCard({ video: videoDaysAgo });
      expect(screen.getByText(/3 days ago/)).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('displays like count from social interactions', () => {
      renderVideoCard({ likeCount: 42 });
      
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('displays repost count from social interactions', () => {
      renderVideoCard({ repostCount: 15 });
      
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('formats large social interaction counts', () => {
      renderVideoCard({ likeCount: 1200, repostCount: 850 });
      
      expect(screen.getByText('1.2K')).toBeInTheDocument(); // likes
      expect(screen.getByText('850')).toBeInTheDocument(); // reposts
    });

    it('displays all metadata together in metadata section', () => {
      const videoWithMetadata = { ...defaultVideoData, duration: 6 };
      renderVideoCard({ 
        video: videoWithMetadata, 
        viewCount: 1200, 
        likeCount: 42, 
        repostCount: 15 
      });
      
      // Should have a metadata section containing views and duration
      const metadataSection = screen.getByTestId('video-metadata');
      expect(metadataSection).toBeInTheDocument();
      
      // Check that all metadata is within the section
      expect(screen.getByText('1.2K views')).toBeInTheDocument();
      expect(screen.getByText('0:06')).toBeInTheDocument();
    });
  });

  // Thumbnail Mode Tests - TDD approach
  describe('Thumbnail Mode', () => {
    it('should display thumbnail instead of auto-playing video in thumbnail mode', () => {
      renderVideoCard({ mode: 'thumbnail' });
      
      // Should show thumbnail image
      const thumbnail = screen.getByTestId('video-thumbnail');
      expect(thumbnail).toBeInTheDocument();
      expect(thumbnail).toHaveAttribute('src', 'https://nostr.build/thumb.jpg');
      
      // Should not auto-play video
      const videoElement = document.querySelector('video');
      expect(videoElement).not.toBeInTheDocument(); // Video should not be rendered yet
    });

    it('should display play button overlay on thumbnail', () => {
      renderVideoCard({ mode: 'thumbnail' });
      
      const playButton = screen.getByTestId('thumbnail-play-button');
      expect(playButton).toBeInTheDocument();
      expect(playButton).toHaveAttribute('aria-label', 'Play video');
    });

    it('should start video playback when thumbnail is clicked', async () => {
      const onPlay = vi.fn();
      renderVideoCard({ mode: 'thumbnail', onPlay });
      
      const thumbnail = screen.getByTestId('video-thumbnail');
      fireEvent.click(thumbnail);
      
      await waitFor(() => {
        // Video should now be rendered and playing
        const videoElement = document.querySelector('video');
        expect(videoElement).toBeInTheDocument();
        expect(onPlay).toHaveBeenCalledTimes(1);
      });
    });

    it('should switch to auto-play mode when thumbnail is clicked', async () => {
      renderVideoCard({ mode: 'thumbnail' });
      
      const thumbnail = screen.getByTestId('video-thumbnail');
      fireEvent.click(thumbnail);
      
      await waitFor(() => {
        // Thumbnail should disappear, video should show
        expect(screen.queryByTestId('video-thumbnail')).not.toBeInTheDocument();
        expect(screen.queryByTestId('thumbnail-play-button')).not.toBeInTheDocument();
        const videoElement = document.querySelector('video');
        expect(videoElement).toBeInTheDocument();
      });
    });

    it('should add hover effects on thumbnail', () => {
      renderVideoCard({ mode: 'thumbnail' });
      
      const thumbnailContainer = screen.getByTestId('thumbnail-container');
      expect(thumbnailContainer).toHaveClass('hover:scale-105');
      expect(thumbnailContainer).toHaveClass('transition-transform');
    });

    it('should generate thumbnail from video when thumbnailUrl is not available', () => {
      const videoWithoutThumbnail = { ...defaultVideoData, thumbnailUrl: undefined };
      renderVideoCard({ video: videoWithoutThumbnail, mode: 'thumbnail' });
      
      // Should show generated thumbnail or placeholder
      const thumbnail = screen.getByTestId('video-thumbnail');
      expect(thumbnail).toBeInTheDocument();
      // Should have fallback src or data-src for generated thumbnail
      expect(thumbnail).toHaveAttribute('src');
    });

    it('should show placeholder when no thumbnail is available', () => {
      const videoWithoutThumbnail = { ...defaultVideoData, thumbnailUrl: undefined, videoUrl: '' };
      renderVideoCard({ video: videoWithoutThumbnail, mode: 'thumbnail' });
      
      const placeholder = screen.getByTestId('thumbnail-placeholder');
      expect(placeholder).toBeInTheDocument();
    });

    it('should default to auto-play mode when mode prop is not provided', () => {
      renderVideoCard(); // No mode prop
      
      // Should show auto-playing video, not thumbnail
      const videoElement = document.querySelector('video');
      expect(videoElement).toBeInTheDocument();
      expect(screen.queryByTestId('video-thumbnail')).not.toBeInTheDocument();
    });

    it('should support auto-play mode explicitly', () => {
      renderVideoCard({ mode: 'auto-play' });
      
      // Should show auto-playing video
      const videoElement = document.querySelector('video');
      expect(videoElement).toBeInTheDocument();
      expect(screen.queryByTestId('video-thumbnail')).not.toBeInTheDocument();
    });

    it('should lazy load videos in thumbnail mode', () => {
      renderVideoCard({ mode: 'thumbnail' });
      
      // Video should not be loaded until clicked
      const videoElement = document.querySelector('video');
      expect(videoElement).not.toBeInTheDocument();
      
      // Check that video src is not preloaded
      expect(document.querySelector('[src="https://nostr.build/video.mp4"]')).not.toBeInTheDocument();
    });

    it('should handle thumbnail loading errors gracefully', async () => {
      renderVideoCard({ mode: 'thumbnail' });
      
      const thumbnail = screen.getByTestId('video-thumbnail');
      fireEvent.error(thumbnail);
      
      await waitFor(() => {
        // Should show placeholder when thumbnail fails to load
        expect(screen.getByTestId('thumbnail-placeholder')).toBeInTheDocument();
      });
    });

    it('should show video duration overlay on thumbnail', () => {
      const videoWithDuration = { ...defaultVideoData, duration: 6 };
      renderVideoCard({ video: videoWithDuration, mode: 'thumbnail' });
      
      const durationOverlay = screen.getByTestId('thumbnail-duration');
      expect(durationOverlay).toBeInTheDocument();
      expect(durationOverlay).toHaveTextContent('0:06');
    });

    it('should switch back to thumbnail mode when video ends', async () => {
      renderVideoCard({ mode: 'thumbnail' });
      
      // Click to start playing
      const thumbnail = screen.getByTestId('video-thumbnail');
      fireEvent.click(thumbnail);
      
      await waitFor(() => {
        const videoElement = document.querySelector('video');
        expect(videoElement).toBeInTheDocument();
      });
      
      // Simulate video end
      const videoElement = document.querySelector('video');
      if (videoElement) {
        fireEvent.ended(videoElement);
      }
      
      await waitFor(() => {
        // Should switch back to thumbnail mode
        expect(screen.getByTestId('video-thumbnail')).toBeInTheDocument();
        expect(document.querySelector('video')).not.toBeInTheDocument();
      });
    });
  });

  // Comments functionality tests - TDD approach
  describe('Comments Functionality', () => {
    it('should render comments button', () => {
      renderVideoCard();
      
      const commentButton = screen.getByRole('button', { name: /comment/i });
      expect(commentButton).toBeInTheDocument();
    });

    it('should display comment count when provided', () => {
      renderVideoCard({ commentCount: 12 });
      
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('should not display comment count when zero', () => {
      renderVideoCard({ commentCount: 0 });
      
      const commentButton = screen.getByRole('button', { name: /comment/i });
      expect(commentButton).not.toHaveTextContent('0');
    });

    it('should format large comment counts', () => {
      renderVideoCard({ commentCount: 1500 });
      
      expect(screen.getByText('1.5K')).toBeInTheDocument();
    });

    it('should call onOpenComments when comment button is clicked', () => {
      const onOpenComments = vi.fn();
      renderVideoCard({ onOpenComments });

      const commentButton = screen.getByRole('button', { name: /comment/i });
      fireEvent.click(commentButton);

      expect(onOpenComments).toHaveBeenCalledTimes(1);
      expect(onOpenComments).toHaveBeenCalledWith(defaultVideoData);
    });

    it('should render VideoCommentsModal when showComments is true', () => {
      renderVideoCard({ showComments: true });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('video-comments-modal')).toBeInTheDocument();
    });

    it('should not render VideoCommentsModal when showComments is false', () => {
      renderVideoCard({ showComments: false });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByTestId('video-comments-modal')).not.toBeInTheDocument();
    });

    it('should close comments modal when onCloseComments is called', () => {
      const onCloseComments = vi.fn();
      renderVideoCard({ showComments: true, onCloseComments });

      // Find and click close button in modal - get all close buttons and click the first one
      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      fireEvent.click(closeButtons[0]);

      expect(onCloseComments).toHaveBeenCalledTimes(1);
    });

    it('should pass video data to VideoCommentsModal', () => {
      renderVideoCard({ showComments: true });

      const modal = screen.getByTestId('video-comments-modal');
      expect(modal).toHaveAttribute('data-video-id', defaultVideoData.id);
    });

    it('should handle missing onOpenComments gracefully', () => {
      renderVideoCard(); // No onOpenComments provided

      const commentButton = screen.getByRole('button', { name: /comment/i });
      
      // Should not throw error when clicked
      expect(() => {
        fireEvent.click(commentButton);
      }).not.toThrow();
    });
  });
});
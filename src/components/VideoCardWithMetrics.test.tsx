import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VideoCardWithMetrics } from './VideoCardWithMetrics';
import { TestApp } from '@/test/TestApp';
import { VideoPlaybackProvider } from '@/contexts/VideoPlaybackContext';
import type { ParsedVideoData } from '@/types/video';

// Mock the hooks
vi.mock('@/hooks/useVideoSocialMetrics', () => ({
  useVideoSocialMetrics: () => ({
    data: { likeCount: 42, repostCount: 15, viewCount: 1200 },
    isLoading: false,
    isError: false,
  }),
  useVideoUserInteractions: () => ({
    data: { hasLiked: false, hasReposted: false },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    user: {
      pubkey: 'current-user-pubkey',
      signer: {},
    },
  }),
}));

vi.mock('@/hooks/useNostrPublish', () => ({
  useNostrPublish: () => ({
    mutate: vi.fn(),
  }),
}));

// Mock other dependencies
vi.mock('react-intersection-observer', () => ({
  useInView: () => ({
    ref: vi.fn(),
    inView: false
  })
}));

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

const originalConsoleLog = console.log;
beforeEach(() => {
  console.log = vi.fn();
  vi.clearAllMocks();
});

afterEach(() => {
  console.log = originalConsoleLog;
});

describe('VideoCardWithMetrics', () => {
  const defaultVideoData: ParsedVideoData = {
    id: 'video-1',
    pubkey: 'e4690a13290739da123aa17d553851dec4cdd0e9d89aa18de3741c446caf8761',
    createdAt: 1640995200,
    content: 'Check out this amazing video!',
    videoUrl: 'https://nostr.build/video.mp4',
    thumbnailUrl: 'https://nostr.build/thumb.jpg',
    title: 'My Amazing Video',
    duration: 6,
    hashtags: ['nostr', 'video', 'fun'],
    isRepost: false,
    vineId: 'vine-123'
  };

  const renderVideoCardWithMetrics = (props = {}) => {
    return render(
      <TestApp>
        <VideoPlaybackProvider>
          <VideoCardWithMetrics video={defaultVideoData} {...props} />
        </VideoPlaybackProvider>
      </TestApp>
    );
  };

  it('renders video card with social metrics', async () => {
    renderVideoCardWithMetrics();

    // Check that the video content is displayed
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText('My Amazing Video')).toBeInTheDocument();

    // Check that social metrics are displayed
    await waitFor(() => {
      expect(screen.getByText('1.2K views')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument(); // like count
      expect(screen.getByText('15')).toBeInTheDocument(); // repost count
    });
  });

  it('displays video duration from metadata', () => {
    renderVideoCardWithMetrics();

    expect(screen.getByText('0:06')).toBeInTheDocument();
  });

  it('handles interaction button clicks', () => {
    const mockMutate = vi.fn();
    vi.doMock('@/hooks/useNostrPublish', () => ({
      useNostrPublish: () => ({
        mutate: mockMutate,
      }),
    }));

    renderVideoCardWithMetrics();

    // Find and click the like button
    const likeButton = screen.getByRole('button', { name: /42/i });
    fireEvent.click(likeButton);

    // Should call createEvent for like
    expect(mockMutate).toHaveBeenCalledWith({
      kind: 7,
      content: '+',
      tags: [
        ['e', 'video-1'],
        ['p', 'e4690a13290739da123aa17d553851dec4cdd0e9d89aa18de3741c446caf8761'],
      ],
    });
  });

  it('shows metadata section with view count and duration', () => {
    renderVideoCardWithMetrics();

    const metadataSection = screen.getByTestId('video-metadata');
    expect(metadataSection).toBeInTheDocument();
    
    // Both view count and duration should be in the metadata section
    expect(screen.getByText('1.2K views')).toBeInTheDocument();
    expect(screen.getByText('0:06')).toBeInTheDocument();
  });

  it('handles missing user gracefully', () => {
    // Mock no current user
    vi.doMock('@/hooks/useCurrentUser', () => ({
      useCurrentUser: () => ({ user: null }),
    }));

    renderVideoCardWithMetrics();

    // Should still render the video card
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText('My Amazing Video')).toBeInTheDocument();
  });

  it('shows user interaction states correctly', () => {
    // Mock user has liked the video
    vi.doMock('@/hooks/useVideoSocialMetrics', () => ({
      useVideoSocialMetrics: () => ({
        data: { likeCount: 42, repostCount: 15, viewCount: 1200 },
      }),
      useVideoUserInteractions: () => ({
        data: { hasLiked: true, hasReposted: false },
      }),
    }));

    renderVideoCardWithMetrics();

    // The like button should show the liked state
    const likeButton = screen.getByRole('button', { name: /42/i });
    expect(likeButton).toHaveClass('text-red-500');
  });
});
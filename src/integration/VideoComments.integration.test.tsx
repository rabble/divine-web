// ABOUTME: Integration tests for video comments functionality with NIP-22 and Kind 32222
// ABOUTME: Tests the complete flow from video events to comments display and interaction

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { VideoCard } from '@/components/VideoCard';
import { VideoCommentsModal } from '@/components/VideoCommentsModal';
import type { ParsedVideoData } from '@/types/video';
import type { NostrEvent } from '@nostrify/nostrify';

// Mock useComments hook for video events
const mockVideoComments = [
  {
    id: 'comment-1',
    pubkey: 'f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1',
    created_at: 1640995800,
    kind: 1111, // NIP-22 comment kind
    content: 'Great video! Love the content.',
    tags: [
      ['e', 'video-1', '', 'root'], // References video event
      ['p', 'e4690a13290739da123aa17d553851dec4cdd0e9d89aa18de3741c446caf8761'], // Mentions video author
    ],
    sig: 'signature-1',
  },
  {
    id: 'comment-2',
    pubkey: 'a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2',
    created_at: 1640996000,
    kind: 1111,
    content: 'Thanks for sharing this!',
    tags: [
      ['e', 'video-1', '', 'root'],
      ['p', 'e4690a13290739da123aa17d553851dec4cdd0e9d89aa18de3741c446caf8761'],
    ],
    sig: 'signature-2',
  },
];

const mockVideoEvent: NostrEvent = {
  id: 'video-1',
  pubkey: 'e4690a13290739da123aa17d553851dec4cdd0e9d89aa18de3741c446caf8761',
  created_at: 1640995200,
  kind: 32222, // OpenVine video kind
  content: 'Check out this amazing video!',
  tags: [
    ['url', 'https://nostr.build/video.mp4'],
    ['title', 'My Amazing Video'],
    ['t', 'video'],
    ['t', 'nostr'],
  ],
  sig: 'video-signature',
};

const mockParsedVideo: ParsedVideoData = {
  id: 'video-1',
  pubkey: 'e4690a13290739da123aa17d553851dec4cdd0e9d89aa18de3741c446caf8761',
  createdAt: 1640995200,
  content: 'Check out this amazing video!',
  videoUrl: 'https://nostr.build/video.mp4',
  title: 'My Amazing Video',
  hashtags: ['video', 'nostr'],
  isRepost: false,
  vineId: 'vine-123',
  duration: 6,
};

// Mock useComments hook
vi.mock('@/hooks/useComments', () => ({
  useComments: vi.fn((root: NostrEvent | URL) => {
    if (typeof root === 'object' && 'id' in root && root.id === 'video-1') {
      return {
        data: {
          allComments: mockVideoComments,
          topLevelComments: mockVideoComments,
          getDescendants: (commentId: string) => [],
          getDirectReplies: (commentId: string) => [],
        },
        isLoading: false,
        error: null,
      };
    }
    return {
      data: { 
        allComments: [],
        topLevelComments: [], 
        getDescendants: (commentId: string) => [],
        getDirectReplies: (commentId: string) => [],
      },
      isLoading: false,
      error: null,
    };
  }),
}));

// Mock useAuthor hook for comment authors
vi.mock('@/hooks/useAuthor', () => ({
  useAuthor: (pubkey: string) => {
    const authorData = {
      'e4690a13290739da123aa17d553851dec4cdd0e9d89aa18de3741c446caf8761': { name: 'Video Creator', picture: 'https://example.com/creator.jpg' },
      'f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1': { name: 'Commenter One', picture: 'https://example.com/commenter1.jpg' },
      'a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2': { name: 'Commenter Two', picture: 'https://example.com/commenter2.jpg' },
    };

    return {
      data: {
        metadata: authorData[pubkey as keyof typeof authorData] || { name: 'Anonymous' },
      },
    };
  },
}));

// Mock VideoPlayer to avoid video loading
vi.mock('@/components/VideoPlayer', () => ({
  VideoPlayer: ({ videoId }: any) => (
    <div data-testid="video-player">Mock Video Player: {videoId}</div>
  ),
}));

describe('Video Comments Integration', () => {
  it('should create proper NostrEvent from ParsedVideoData for comments', () => {
    render(
      <TestApp>
        <VideoCommentsModal
          video={mockParsedVideo}
          open={true}
          onOpenChange={() => {}}
        />
      </TestApp>
    );

    // The CommentsSection should receive a proper NostrEvent derived from video data
    // This tests the conversion from ParsedVideoData to NostrEvent for comments
    expect(screen.getByTestId('comments-section')).toBeInTheDocument();
  });

  it('should load comments for video events using NIP-22', async () => {
    render(
      <TestApp>
        <VideoCommentsModal
          video={mockParsedVideo}
          open={true}
          onOpenChange={() => {}}
        />
      </TestApp>
    );

    // Wait for comments to load
    await waitFor(() => {
      expect(screen.getByText('Great video! Love the content.')).toBeInTheDocument();
      expect(screen.getByText('Thanks for sharing this!')).toBeInTheDocument();
    });
  });

  it('should display comment authors with proper metadata', async () => {
    render(
      <TestApp>
        <VideoCommentsModal
          video={mockParsedVideo}
          open={true}
          onOpenChange={() => {}}
        />
      </TestApp>
    );

    // Wait for comments to load
    await waitFor(() => {
      expect(screen.getByText('Commenter One')).toBeInTheDocument();
      expect(screen.getByText('Commenter Two')).toBeInTheDocument();
    });
  });

  it('should show comment count in VideoCard when comments exist', () => {
    render(
      <TestApp>
        <VideoCard
          video={mockParsedVideo}
          commentCount={mockVideoComments.length}
        />
      </TestApp>
    );

    expect(screen.getByText('2')).toBeInTheDocument(); // 2 comments
  });

  it('should open comments modal when comment button is clicked in VideoCard', async () => {
    const onOpenComments = vi.fn();
    
    render(
      <TestApp>
        <VideoCard
          video={mockParsedVideo}
          onOpenComments={onOpenComments}
        />
      </TestApp>
    );

    const commentButton = screen.getByRole('button', { name: /comment/i });
    fireEvent.click(commentButton);

    expect(onOpenComments).toHaveBeenCalledWith(mockParsedVideo);
  });

  it('should handle video events without comments gracefully', () => {
    const videoWithoutComments = { ...mockParsedVideo, id: 'video-no-comments' };

    render(
      <TestApp>
        <VideoCommentsModal
          video={videoWithoutComments}
          open={true}
          onOpenChange={() => {}}
        />
      </TestApp>
    );

    // Should show empty state instead of crashing
    expect(screen.getByText(/no comments yet/i)).toBeInTheDocument();
  });

  it('should properly format video event as root for NIP-22 comments', () => {
    render(
      <TestApp>
        <VideoCommentsModal
          video={mockParsedVideo}
          open={true}
          onOpenChange={() => {}}
        />
      </TestApp>
    );

    // The video should be converted to a proper NostrEvent for comments
    // This should include correct kind (32222), pubkey, and content
    const commentsSection = screen.getByTestId('comments-section');
    expect(commentsSection).toHaveAttribute('data-root-kind', '32222');
    expect(commentsSection).toHaveAttribute('data-root-id', 'video-1');
  });

  it('should handle comment threading for video events', async () => {
    // Mock comments with replies
    const commentsWithReplies = [
      ...mockVideoComments,
      {
        id: 'reply-1',
        pubkey: 'commenter-1-pubkey',
        created_at: 1640996200,
        kind: 1111,
        content: 'Reply to the first comment',
        tags: [
          ['e', 'video-1', '', 'root'], // Root video
          ['e', 'comment-1', '', 'reply'], // Reply to comment-1
          ['p', 'commenter-1-pubkey'],
        ],
        sig: 'reply-signature',
      },
    ];

    vi.mocked(vi.fn()).mockImplementation(() => ({
      data: {
        topLevelComments: mockVideoComments,
        replies: { 'comment-1': [commentsWithReplies[2]] },
        totalCount: 3,
      },
      isLoading: false,
      error: null,
    }));

    render(
      <TestApp>
        <VideoCommentsModal
          video={mockParsedVideo}
          open={true}
          onOpenChange={() => {}}
        />
      </TestApp>
    );

    await waitFor(() => {
      expect(screen.getByText('Reply to the first comment')).toBeInTheDocument();
    });
  });

  it('should validate video event structure for comments compatibility', () => {
    // Test that ParsedVideoData contains all necessary fields for NostrEvent conversion
    expect(mockParsedVideo).toHaveProperty('id');
    expect(mockParsedVideo).toHaveProperty('pubkey');
    expect(mockParsedVideo).toHaveProperty('createdAt');
    expect(mockParsedVideo).toHaveProperty('content');

    // Ensure we can construct a valid NostrEvent from ParsedVideoData
    const videoEvent: NostrEvent = {
      id: mockParsedVideo.id,
      pubkey: mockParsedVideo.pubkey,
      created_at: mockParsedVideo.createdAt,
      kind: 32222, // OpenVine video kind
      content: mockParsedVideo.content,
      tags: [
        ['url', mockParsedVideo.videoUrl],
        ...(mockParsedVideo.title ? [['title', mockParsedVideo.title]] : []),
        ...mockParsedVideo.hashtags.map(tag => ['t', tag]),
      ],
      sig: '', // Would be provided by actual event
    };

    expect(videoEvent.kind).toBe(32222);
    expect(videoEvent.id).toBe(mockParsedVideo.id);
  });

  it('should handle comment loading states', () => {
    // Mock loading state
    vi.mocked(vi.fn()).mockImplementation(() => ({
      data: null,
      isLoading: true,
      error: null,
    }));

    render(
      <TestApp>
        <VideoCommentsModal
          video={mockParsedVideo}
          open={true}
          onOpenChange={() => {}}
          isLoadingComments={true}
        />
      </TestApp>
    );

    expect(screen.getByText(/loading comments/i)).toBeInTheDocument();
  });

  it('should handle comment loading errors', () => {
    // Mock error state
    vi.mocked(vi.fn()).mockImplementation(() => ({
      data: null,
      isLoading: false,
      error: new Error('Failed to load comments'),
    }));

    render(
      <TestApp>
        <VideoCommentsModal
          video={mockParsedVideo}
          open={true}
          onOpenChange={() => {}}
        />
      </TestApp>
    );

    expect(screen.getByText(/failed to load comments/i)).toBeInTheDocument();
  });
});
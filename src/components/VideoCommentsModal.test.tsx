// ABOUTME: Test suite for VideoCommentsModal component
// ABOUTME: Tests modal display, responsive layout, video playback, and comments integration

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { VideoCommentsModal } from './VideoCommentsModal';
import type { ParsedVideoData } from '@/types/video';

// Mock the video player to avoid actual video loading in tests
vi.mock('./VideoPlayer', () => ({
  VideoPlayer: ({ videoId, src, poster, className, onLoadStart, onError }: any) => (
    <div 
      data-testid="video-player"
      className={className}
      onClick={() => onLoadStart?.()}
    >
      Mock Video Player: {videoId}
    </div>
  ),
}));

// Mock CommentsSection to isolate modal functionality
vi.mock('./comments/CommentsSection', () => ({
  CommentsSection: ({ root, title, limit }: any) => (
    <div data-testid="comments-section">
      Mock Comments Section - Root: {typeof root === 'object' ? root.id : root}
    </div>
  ),
}));

const mockVideo: ParsedVideoData = {
  id: 'test-video-id',
  pubkey: 'test-pubkey',
  createdAt: 1234567890,
  content: 'Test video description',
  videoUrl: 'https://example.com/video.mp4',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  title: 'Test Video Title',
  duration: 6000, // 6 seconds
  hashtags: ['test', 'video'],
  isRepost: false,
  vineId: 'test-vine-id',
};

describe('VideoCommentsModal', () => {
  it('should render modal when open prop is true', () => {
    render(
      <TestApp>
        <VideoCommentsModal
          video={mockVideo}
          open={true}
          onOpenChange={() => {}}
        />
      </TestApp>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('video-player')).toBeInTheDocument();
    expect(screen.getByTestId('comments-section')).toBeInTheDocument();
  });

  it('should not render modal when open prop is false', () => {
    render(
      <TestApp>
        <VideoCommentsModal
          video={mockVideo}
          open={false}
          onOpenChange={() => {}}
        />
      </TestApp>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should call onOpenChange when modal is closed', async () => {
    const mockOnOpenChange = vi.fn();
    
    render(
      <TestApp>
        <VideoCommentsModal
          video={mockVideo}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      </TestApp>
    );

    // Click the close button (X) - get all close buttons and click the first one
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    fireEvent.click(closeButtons[0]);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('should display video title in modal header', () => {
    render(
      <TestApp>
        <VideoCommentsModal
          video={mockVideo}
          open={true}
          onOpenChange={() => {}}
        />
      </TestApp>
    );

    expect(screen.getByText('Test Video Title')).toBeInTheDocument();
  });

  it('should pass video event as root to CommentsSection', () => {
    render(
      <TestApp>
        <VideoCommentsModal
          video={mockVideo}
          open={true}
          onOpenChange={() => {}}
        />
      </TestApp>
    );

    const commentsSection = screen.getByTestId('comments-section');
    expect(commentsSection).toHaveTextContent('Root: test-video-id');
  });

  it('should use desktop layout on large screens', () => {
    // Mock window.innerWidth for desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    render(
      <TestApp>
        <VideoCommentsModal
          video={mockVideo}
          open={true}
          onOpenChange={() => {}}
        />
      </TestApp>
    );

    const modalContent = screen.getByTestId('modal-content');
    expect(modalContent).toHaveClass('lg:flex-row'); // Side by side on desktop
  });

  it('should use mobile layout on small screens', () => {
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 480,
    });

    render(
      <TestApp>
        <VideoCommentsModal
          video={mockVideo}
          open={true}
          onOpenChange={() => {}}
        />
      </TestApp>
    );

    const modalContent = screen.getByTestId('modal-content');
    expect(modalContent).toHaveClass('flex-col'); // Stacked on mobile
  });

  it('should display loading state for comments', () => {
    render(
      <TestApp>
        <VideoCommentsModal
          video={mockVideo}
          open={true}
          onOpenChange={() => {}}
          isLoadingComments={true}
        />
      </TestApp>
    );

    expect(screen.getByText(/loading comments/i)).toBeInTheDocument();
  });

  it('should handle video with no title gracefully', () => {
    const videoWithoutTitle = { ...mockVideo, title: undefined };
    
    render(
      <TestApp>
        <VideoCommentsModal
          video={videoWithoutTitle}
          open={true}
          onOpenChange={() => {}}
        />
      </TestApp>
    );

    // Should still render but without title
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText('Test Video Title')).not.toBeInTheDocument();
  });
});
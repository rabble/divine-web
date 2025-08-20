// ABOUTME: Tests for VideoGrid component displaying videos in responsive grid layout
// ABOUTME: Tests thumbnail display, click interactions, and responsive behavior

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { VideoGrid } from './VideoGrid';
import type { ParsedVideoData } from '@/types/video';

// Mock React Router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

const mockVideos: ParsedVideoData[] = [
  {
    id: 'video1',
    pubkey: 'author1',
    videoUrl: 'https://example.com/video1.mp4',
    content: 'First video content',
    createdAt: Date.now() - 86400000, // 1 day ago
    hashtags: ['funny'],
    isRepost: false,
    vineId: 'vine1',
  },
  {
    id: 'video2',
    pubkey: 'author2',
    videoUrl: 'https://example.com/video2.mp4',
    content: 'Second video with longer description that should be truncated',
    createdAt: Date.now() - 172800000, // 2 days ago
    hashtags: ['creative'],
    isRepost: false,
    vineId: 'vine2',
  },
  {
    id: 'video3',
    pubkey: 'author3',
    videoUrl: 'https://example.com/video3.mp4',
    content: 'Third video',
    createdAt: Date.now() - 259200000, // 3 days ago
    hashtags: [],
    isRepost: false,
    vineId: 'vine3',
  },
];

describe('VideoGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders videos in a responsive grid layout', () => {
    render(
      <TestApp>
        <VideoGrid videos={mockVideos} />
      </TestApp>
    );

    const grid = screen.getByTestId('video-grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('grid');
    
    // Should have responsive grid classes
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    
    // Should show all videos
    const videoItems = screen.getAllByTestId('video-grid-item');
    expect(videoItems).toHaveLength(3);
  });

  it('displays video thumbnails with overlay information', () => {
    render(
      <TestApp>
        <VideoGrid videos={mockVideos} />
      </TestApp>
    );

    // Check first video item
    const firstVideo = screen.getAllByTestId('video-grid-item')[0];
    expect(firstVideo).toBeInTheDocument();
    
    // Should have video thumbnail
    const thumbnail = screen.getByTestId('video-thumbnail-video1');
    expect(thumbnail).toBeInTheDocument();
    expect(thumbnail).toHaveAttribute('src', 'https://example.com/video1.mp4');
    
    // Should show play overlay
    const playOverlay = screen.getByTestId('play-overlay-video1');
    expect(playOverlay).toBeInTheDocument();
  });

  it('shows video metadata on hover or focus', () => {
    render(
      <TestApp>
        <VideoGrid videos={mockVideos} />
      </TestApp>
    );

    const firstVideoItem = screen.getAllByTestId('video-grid-item')[0];
    
    // Hover over video item
    fireEvent.mouseEnter(firstVideoItem);
    
    // Should show metadata overlay
    const metadataOverlay = screen.getByTestId('metadata-overlay-video1');
    expect(metadataOverlay).toBeInTheDocument();
    expect(metadataOverlay).toHaveTextContent('First video content');
  });

  it('navigates to video page when clicked', () => {
    const mockNavigate = vi.fn();
    vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);

    render(
      <TestApp>
        <VideoGrid videos={mockVideos} />
      </TestApp>
    );

    const firstVideoItem = screen.getAllByTestId('video-grid-item')[0];
    fireEvent.click(firstVideoItem);
    
    expect(mockNavigate).toHaveBeenCalledWith('/video/video1');
  });

  it('shows play count overlay when provided', () => {
    const videosWithViews = mockVideos.map((video, index) => ({
      ...video,
      views: (index + 1) * 100, // 100, 200, 300 views
    }));

    render(
      <TestApp>
        <VideoGrid videos={videosWithViews} />
      </TestApp>
    );

    // Check play count displays
    expect(screen.getByText('100 views')).toBeInTheDocument();
    expect(screen.getByText('200 views')).toBeInTheDocument();
    expect(screen.getByText('300 views')).toBeInTheDocument();
  });

  it('handles videos without thumbnails gracefully', () => {
    const videosWithoutThumbnails = mockVideos.map(video => ({
      ...video,
      videoUrl: '', // No video URL
    }));

    render(
      <TestApp>
        <VideoGrid videos={videosWithoutThumbnails} />
      </TestApp>
    );

    // Should show placeholder thumbnails
    const placeholders = screen.getAllByTestId(/video-placeholder/);
    expect(placeholders).toHaveLength(3);
  });

  it('displays empty state when no videos provided', () => {
    render(
      <TestApp>
        <VideoGrid videos={[]} />
      </TestApp>
    );

    const emptyState = screen.getByTestId('video-grid-empty');
    expect(emptyState).toBeInTheDocument();
    expect(emptyState).toHaveTextContent('No videos to display');
  });

  it('shows loading skeleton when loading prop is true', () => {
    render(
      <TestApp>
        <VideoGrid videos={[]} loading={true} />
      </TestApp>
    );

    const skeletons = screen.getAllByTestId('video-skeleton');
    expect(skeletons).toHaveLength(6); // Should show 6 skeleton items
  });

  it('truncates long video descriptions', () => {
    render(
      <TestApp>
        <VideoGrid videos={mockVideos} />
      </TestApp>
    );

    // Hover over second video (has long description)
    const secondVideoItem = screen.getAllByTestId('video-grid-item')[1];
    fireEvent.mouseEnter(secondVideoItem);
    
    const metadataOverlay = screen.getByTestId('metadata-overlay-video2');
    // Should truncate long description
    expect(metadataOverlay).toHaveTextContent(/Second video with longer/);
  });

  it('handles keyboard navigation', () => {
    const mockNavigate = vi.fn();
    vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);

    render(
      <TestApp>
        <VideoGrid videos={mockVideos} />
      </TestApp>
    );

    const firstVideoItem = screen.getAllByTestId('video-grid-item')[0];
    
    // Focus and press Enter
    firstVideoItem.focus();
    fireEvent.keyDown(firstVideoItem, { key: 'Enter' });
    
    expect(mockNavigate).toHaveBeenCalledWith('/video/video1');
  });

  it('displays video duration when available', () => {
    const videosWithDuration = mockVideos.map(video => ({
      ...video,
      duration: 6, // 6 seconds
    }));

    render(
      <TestApp>
        <VideoGrid videos={videosWithDuration} />
      </TestApp>
    );

    // Should show duration badges
    const durationBadges = screen.getAllByText('0:06');
    expect(durationBadges).toHaveLength(3);
  });

  it('applies custom className when provided', () => {
    render(
      <TestApp>
        <VideoGrid videos={mockVideos} className="custom-grid-class" />
      </TestApp>
    );

    const grid = screen.getByTestId('video-grid');
    expect(grid).toHaveClass('custom-grid-class');
  });
});
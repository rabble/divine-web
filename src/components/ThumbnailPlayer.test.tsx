import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThumbnailPlayer } from './ThumbnailPlayer';

describe('ThumbnailPlayer', () => {
  const defaultProps = {
    videoId: 'video-1',
    src: 'https://example.com/video.mp4',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    duration: 6,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders thumbnail image when thumbnailUrl is provided', () => {
    render(<ThumbnailPlayer {...defaultProps} />);

    const thumbnail = screen.getByTestId('video-thumbnail');
    expect(thumbnail).toBeInTheDocument();
    expect(thumbnail).toHaveAttribute('src', 'https://example.com/thumb.jpg');
    expect(thumbnail).toHaveAttribute('alt', 'Video thumbnail');
  });

  it('displays play button overlay', () => {
    render(<ThumbnailPlayer {...defaultProps} />);

    const playButton = screen.getByTestId('thumbnail-play-button');
    expect(playButton).toBeInTheDocument();
    expect(playButton).toHaveAttribute('aria-label', 'Play video');
  });

  it('displays duration overlay when duration is provided', () => {
    render(<ThumbnailPlayer {...defaultProps} duration={6} />);

    const durationOverlay = screen.getByTestId('thumbnail-duration');
    expect(durationOverlay).toBeInTheDocument();
    expect(durationOverlay).toHaveTextContent('0:06');
  });

  it('does not display duration overlay when duration is not provided', () => {
    render(<ThumbnailPlayer {...defaultProps} duration={undefined} />);

    expect(screen.queryByTestId('thumbnail-duration')).not.toBeInTheDocument();
  });

  it('calls onClick when thumbnail is clicked', () => {
    const onClick = vi.fn();
    render(<ThumbnailPlayer {...defaultProps} onClick={onClick} />);

    const container = screen.getByTestId('thumbnail-container');
    fireEvent.click(container);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows placeholder when thumbnail fails to load', async () => {
    render(<ThumbnailPlayer {...defaultProps} />);

    const thumbnail = screen.getByTestId('video-thumbnail');
    fireEvent.error(thumbnail);

    await waitFor(() => {
      expect(screen.getByTestId('thumbnail-placeholder')).toBeInTheDocument();
      expect(screen.getByText('Video Preview')).toBeInTheDocument();
    });
  });

  it('shows placeholder when no thumbnailUrl is provided', () => {
    render(<ThumbnailPlayer {...defaultProps} thumbnailUrl={undefined} />);

    // Should generate thumbnail from video URL
    const thumbnail = screen.getByTestId('video-thumbnail');
    expect(thumbnail).toBeInTheDocument();
    expect(thumbnail).toHaveAttribute('src', 'https://example.com/video.mp4#t=0.1');
  });

  it('calls onError when thumbnail fails to load', () => {
    const onError = vi.fn();
    render(<ThumbnailPlayer {...defaultProps} onError={onError} />);

    const thumbnail = screen.getByTestId('video-thumbnail');
    fireEvent.error(thumbnail);

    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('applies hover effects with correct classes', () => {
    render(<ThumbnailPlayer {...defaultProps} />);

    const container = screen.getByTestId('thumbnail-container');
    expect(container).toHaveClass('hover:scale-105');
    expect(container).toHaveClass('transition-transform');
    expect(container).toHaveClass('duration-200');
  });

  it('applies custom className', () => {
    render(<ThumbnailPlayer {...defaultProps} className="custom-class" />);

    const container = screen.getByTestId('thumbnail-container');
    expect(container).toHaveClass('custom-class');
  });

  it('formats duration correctly', () => {
    render(<ThumbnailPlayer {...defaultProps} duration={75} />);

    const durationOverlay = screen.getByTestId('thumbnail-duration');
    expect(durationOverlay).toHaveTextContent('1:15');
  });

  it('shows loading state initially', () => {
    render(<ThumbnailPlayer {...defaultProps} />);

    // Loading overlay should be present initially
    const loadingOverlay = document.querySelector('.animate-pulse');
    expect(loadingOverlay).toBeInTheDocument();
  });

  it('removes loading state when thumbnail loads', async () => {
    render(<ThumbnailPlayer {...defaultProps} />);

    const thumbnail = screen.getByTestId('video-thumbnail');
    fireEvent.load(thumbnail);

    await waitFor(() => {
      const loadingOverlay = document.querySelector('.animate-pulse');
      expect(loadingOverlay).not.toBeInTheDocument();
    });
  });
});
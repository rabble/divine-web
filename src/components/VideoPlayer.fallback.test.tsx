import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VideoPlayer } from './VideoPlayer';
import { TestApp } from '@/test/TestApp';
import { VideoPlaybackProvider } from '@/contexts/VideoPlaybackContext';

// Mock react-intersection-observer
const mockInView = vi.fn();
const mockInViewRef = vi.fn();
vi.mock('react-intersection-observer', () => ({
  useInView: () => ({
    ref: mockInViewRef,
    inView: mockInView(),
    entry: { intersectionRatio: 0.5 }
  })
}));

// Mock useIsMobile hook
vi.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => false
}));

// Mock console to reduce noise
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
beforeEach(() => {
  console.log = vi.fn();
  console.error = vi.fn();
  vi.clearAllMocks();
  mockInView.mockReturnValue(true);
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('VideoPlayer Fallback URL Tests', () => {
  const defaultProps = {
    videoId: 'test-video-1',
    src: 'https://primary-cdn.com/video.mp4',
    poster: 'https://nostr.build/poster.jpg'
  };

  const renderVideoPlayer = (props = {}) => {
    return render(
      <TestApp>
        <VideoPlaybackProvider>
          <VideoPlayer {...defaultProps} {...props} />
        </VideoPlaybackProvider>
      </TestApp>
    );
  };

  describe('Fallback URL Initialization', () => {
    it('should initialize with primary URL when no fallbacks provided', () => {
      renderVideoPlayer();
      
      const videoElement = document.querySelector('video');
      expect(videoElement).toHaveAttribute('src', 'https://primary-cdn.com/video.mp4');
    });

    it('should initialize with primary URL when fallbacks are provided', () => {
      renderVideoPlayer({
        fallbackUrls: [
          'https://fallback1-cdn.com/video.mp4',
          'https://fallback2-cdn.com/video.m3u8'
        ]
      });
      
      const videoElement = document.querySelector('video');
      expect(videoElement).toHaveAttribute('src', 'https://primary-cdn.com/video.mp4');
    });

    it('should handle empty fallback array', () => {
      renderVideoPlayer({
        fallbackUrls: []
      });
      
      const videoElement = document.querySelector('video');
      expect(videoElement).toHaveAttribute('src', 'https://primary-cdn.com/video.mp4');
    });
  });

  describe('Fallback URL on Error', () => {
    it('should try first fallback URL when primary fails', async () => {
      const onError = vi.fn();
      renderVideoPlayer({
        fallbackUrls: [
          'https://fallback1-cdn.com/video.mp4',
          'https://fallback2-cdn.com/video.m3u8'
        ],
        onError
      });
      
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      expect(videoElement).toHaveAttribute('src', 'https://primary-cdn.com/video.mp4');
      
      // Simulate primary URL failure
      fireEvent.error(videoElement);
      
      await waitFor(() => {
        expect(videoElement).toHaveAttribute('src', 'https://fallback1-cdn.com/video.mp4');
      });
      
      // onError should not be called yet (we have fallbacks)
      expect(onError).not.toHaveBeenCalled();
    });

    it('should try second fallback URL when first fallback fails', async () => {
      const onError = vi.fn();
      renderVideoPlayer({
        fallbackUrls: [
          'https://fallback1-cdn.com/video.mp4',
          'https://fallback2-cdn.com/video.m3u8'
        ],
        onError
      });
      
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      
      // Simulate primary URL failure
      fireEvent.error(videoElement);
      
      await waitFor(() => {
        expect(videoElement).toHaveAttribute('src', 'https://fallback1-cdn.com/video.mp4');
      });
      
      // Simulate first fallback failure
      fireEvent.error(videoElement);
      
      await waitFor(() => {
        expect(videoElement).toHaveAttribute('src', 'https://fallback2-cdn.com/video.m3u8');
      });
      
      // onError should not be called yet (we still have one fallback)
      expect(onError).not.toHaveBeenCalled();
    });

    it('should call onError callback when all URLs fail', async () => {
      const onError = vi.fn();
      renderVideoPlayer({
        fallbackUrls: [
          'https://fallback1-cdn.com/video.mp4'
        ],
        onError
      });
      
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      
      // Simulate primary URL failure
      fireEvent.error(videoElement);
      
      await waitFor(() => {
        expect(videoElement).toHaveAttribute('src', 'https://fallback1-cdn.com/video.mp4');
      });
      
      // Simulate fallback failure (last URL)
      fireEvent.error(videoElement);
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
        expect(screen.getByText('Failed to load video')).toBeInTheDocument();
      });
    });

    it('should show error state when no fallbacks and primary fails', async () => {
      const onError = vi.fn();
      renderVideoPlayer({ onError });
      
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      
      // Simulate primary URL failure with no fallbacks
      fireEvent.error(videoElement);
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
        expect(screen.getByText('Failed to load video')).toBeInTheDocument();
      });
    });
  });

  describe('Different URL Formats', () => {
    it('should handle MP4 fallback URLs', async () => {
      renderVideoPlayer({
        src: 'https://broken-cdn.com/video.mp4',
        fallbackUrls: [
          'https://working-cdn.com/video.mp4'
        ]
      });
      
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      fireEvent.error(videoElement);
      
      await waitFor(() => {
        expect(videoElement).toHaveAttribute('src', 'https://working-cdn.com/video.mp4');
      });
    });

    it('should handle HLS (.m3u8) fallback URLs', async () => {
      renderVideoPlayer({
        src: 'https://broken-cdn.com/video.mp4',
        fallbackUrls: [
          'https://streaming-cdn.com/video.m3u8'
        ]
      });
      
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      fireEvent.error(videoElement);
      
      await waitFor(() => {
        // In current implementation, HLS URLs are set directly (browser will try to play natively)
        expect(videoElement).toHaveAttribute('src', 'https://streaming-cdn.com/video.m3u8');
      });
    });

    it('should handle mixed format fallback URLs', async () => {
      renderVideoPlayer({
        src: 'https://broken-cdn.com/video.mp4',
        fallbackUrls: [
          'https://fallback1-cdn.com/video.m3u8',
          'https://fallback2-cdn.com/video.mp4',
          'https://fallback3-cdn.com/video.webm'
        ]
      });
      
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      
      // Fail primary
      fireEvent.error(videoElement);
      
      // First fallback is HLS, will be set directly in current implementation
      await waitFor(() => {
        expect(videoElement).toHaveAttribute('src', 'https://fallback1-cdn.com/video.m3u8');
      });
      
      // Fail HLS
      fireEvent.error(videoElement);
      
      // Second fallback is MP4
      await waitFor(() => {
        expect(videoElement).toHaveAttribute('src', 'https://fallback2-cdn.com/video.mp4');
      });
    });

    it('should handle GIF URLs as primary with fallbacks', () => {
      renderVideoPlayer({
        src: 'https://media.giphy.com/broken.gif',
        fallbackUrls: [
          'https://media.giphy.com/working.gif'
        ]
      });
      
      // GIFs use img element instead of video
      const imgElement = screen.getByRole('img');
      expect(imgElement).toHaveAttribute('src', 'https://media.giphy.com/broken.gif');
      
      // Simulate GIF load error
      fireEvent.error(imgElement);
      
      // For GIFs, we should see error state (no fallback for img elements yet)
      expect(screen.getByText('Failed to load GIF')).toBeInTheDocument();
    });
  });

  describe('Loading State Management', () => {
    it('should show loading state when switching to fallback URL', async () => {
      renderVideoPlayer({
        fallbackUrls: ['https://fallback-cdn.com/video.mp4']
      });
      
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      
      // Initially should show loading - look for Skeleton component
      const initialSkeleton = document.querySelector('[class*="animate-pulse"]') || 
                              document.querySelector('.w-full.h-full');
      expect(initialSkeleton).toBeInTheDocument();
      
      // Simulate load complete
      fireEvent.loadedData(videoElement);
      
      await waitFor(() => {
        const skeleton = document.querySelector('[class*="animate-pulse"]');
        expect(skeleton).not.toBeInTheDocument();
      });
      
      // Simulate error to trigger fallback
      fireEvent.error(videoElement);
      
      // Should show loading again while trying fallback
      await waitFor(() => {
        const skeleton = document.querySelector('[class*="animate-pulse"]') || 
                        document.querySelector('.w-full.h-full');
        expect(skeleton).toBeInTheDocument();
      });
    });

    it('should reset error state when trying fallback URL', async () => {
      renderVideoPlayer({
        fallbackUrls: ['https://fallback-cdn.com/video.mp4']
      });
      
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      
      // Simulate primary URL failure
      fireEvent.error(videoElement);
      
      // Error should not be shown yet (trying fallback)
      expect(screen.queryByText('Failed to load video')).not.toBeInTheDocument();
      
      // Loading should be shown instead - look for Skeleton or loading indicator
      const loadingIndicator = document.querySelector('[class*="animate-pulse"]') || 
                               document.querySelector('.w-full.h-full');
      expect(loadingIndicator).toBeInTheDocument();
    });
  });

  describe('Callback Behavior', () => {
    it('should call onLoadStart for each URL attempt', async () => {
      const onLoadStart = vi.fn();
      renderVideoPlayer({
        fallbackUrls: ['https://fallback-cdn.com/video.mp4'],
        onLoadStart
      });
      
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      
      // Initial load start
      fireEvent.loadStart(videoElement);
      expect(onLoadStart).toHaveBeenCalledTimes(1);
      
      // Error triggers fallback
      fireEvent.error(videoElement);
      
      await waitFor(() => {
        expect(videoElement).toHaveAttribute('src', 'https://fallback-cdn.com/video.mp4');
      });
      
      // Fallback load start
      fireEvent.loadStart(videoElement);
      expect(onLoadStart).toHaveBeenCalledTimes(2);
    });

    it('should call onLoadedData only for successful load', async () => {
      const onLoadedData = vi.fn();
      renderVideoPlayer({
        fallbackUrls: ['https://fallback-cdn.com/video.mp4'],
        onLoadedData
      });
      
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      
      // Primary fails
      fireEvent.error(videoElement);
      
      await waitFor(() => {
        expect(videoElement).toHaveAttribute('src', 'https://fallback-cdn.com/video.mp4');
      });
      
      // Fallback succeeds
      fireEvent.loadedData(videoElement);
      
      expect(onLoadedData).toHaveBeenCalledTimes(1);
    });

    it('should only call onError once when all URLs fail', async () => {
      const onError = vi.fn();
      renderVideoPlayer({
        fallbackUrls: [
          'https://fallback1-cdn.com/video.mp4',
          'https://fallback2-cdn.com/video.mp4'
        ],
        onError
      });
      
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      
      // Primary fails
      fireEvent.error(videoElement);
      expect(onError).not.toHaveBeenCalled();
      
      // First fallback fails
      await waitFor(() => {
        expect(videoElement).toHaveAttribute('src', 'https://fallback1-cdn.com/video.mp4');
      });
      fireEvent.error(videoElement);
      expect(onError).not.toHaveBeenCalled();
      
      // Second fallback fails (last one)
      await waitFor(() => {
        expect(videoElement).toHaveAttribute('src', 'https://fallback2-cdn.com/video.mp4');
      });
      fireEvent.error(videoElement);
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Console Logging', () => {
    it('should log fallback URL attempts', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      renderVideoPlayer({
        fallbackUrls: ['https://fallback-cdn.com/video.mp4']
      });
      
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      
      // Trigger error to attempt fallback
      fireEvent.error(videoElement);
      
      await waitFor(() => {
        // Should log the error with URL - exact format from implementation
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('[VideoPlayer test-video-1] Error loading video from URL index 0: https://primary-cdn.com/video.mp4')
        );
        
        // Should log the fallback attempt
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('[VideoPlayer test-video-1] Trying fallback URL 1/1')
        );
      });
    });

    it('should log when all URLs fail', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      renderVideoPlayer({
        fallbackUrls: []
      });
      
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      
      // Trigger error with no fallbacks
      fireEvent.error(videoElement);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('[VideoPlayer test-video-1] All URLs failed, no more fallbacks')
        );
      });
    });
  });
});
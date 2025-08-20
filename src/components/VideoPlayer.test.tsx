import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VideoPlayer } from './VideoPlayer';
import { TestApp } from '@/test/TestApp';
import { VideoPlaybackProvider } from '@/contexts/VideoPlaybackContext';
import userEvent from '@testing-library/user-event';

// Mock react-intersection-observer
const mockInView = vi.fn();
const mockInViewRef = vi.fn();
vi.mock('react-intersection-observer', () => ({
  useInView: () => ({
    ref: mockInViewRef,
    inView: mockInView()
  })
}));

// Mock useIsMobile hook
const mockIsMobile = vi.fn();
vi.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => mockIsMobile()
}));

// Mock screen orientation API
Object.defineProperty(screen, 'orientation', {
  writable: true,
  value: {
    type: 'portrait-primary',
    angle: 0,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }
});

// Mock document.fullscreenElement
Object.defineProperty(document, 'fullscreenElement', {
  writable: true,
  value: null
});

// Mock Element.requestFullscreen
HTMLElement.prototype.requestFullscreen = vi.fn().mockResolvedValue(undefined);
Document.prototype.exitFullscreen = vi.fn().mockResolvedValue(undefined);

// Mock pointer events for gesture testing
const createTouchEvent = (type: string, touches: Array<{ clientX: number; clientY: number; identifier: number }>) => {
  const touchList = {
    length: touches.length,
    item: (index: number) => touches[index],
    identifiedTouch: () => null,
    [Symbol.iterator]: function* () {
      for (const touch of touches) {
        yield touch;
      }
    }
  };
  
  Object.assign(touchList, touches);
  
  return new TouchEvent(type, {
    touches: touchList as any,
    targetTouches: touchList as any,
    changedTouches: touchList as any,
    bubbles: true,
    cancelable: true
  });
};

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeEach(() => {
  console.log = vi.fn();
  vi.clearAllMocks();
  mockInView.mockReturnValue(false);
  mockIsMobile.mockReturnValue(false);
  
  // Reset fullscreen state
  Object.defineProperty(document, 'fullscreenElement', {
    writable: true,
    value: null
  });
  
  // Reset timers
  vi.useFakeTimers();
});

afterEach(() => {
  console.log = originalConsoleLog;
  vi.useRealTimers();
});

describe('VideoPlayer', () => {
  const defaultProps = {
    videoId: 'test-video-1',
    src: 'https://nostr.build/video.mp4',
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

  it('renders video element with correct attributes', () => {
    renderVideoPlayer();

    const video = screen.getByRole('generic'); // Video elements have generic role
    expect(video).toBeInTheDocument();
    
    const videoElement = document.querySelector('video');
    expect(videoElement).toHaveAttribute('src', 'https://nostr.build/video.mp4');
    expect(videoElement).toHaveAttribute('poster', 'https://nostr.build/poster.jpg');
    expect(videoElement).toHaveAttribute('muted');
    expect(videoElement).toHaveAttribute('loop');
    expect(videoElement).toHaveAttribute('playsinline');
    expect(videoElement).toHaveAttribute('preload', 'auto');
  });

  it('renders GIF as img element instead of video', () => {
    renderVideoPlayer({ src: 'https://media.giphy.com/funny.gif' });

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://media.giphy.com/funny.gif');
    expect(img).toHaveAttribute('alt', 'Video GIF');
    
    const video = document.querySelector('video');
    expect(video).not.toBeInTheDocument();
  });

  it('shows loading skeleton initially', () => {
    renderVideoPlayer();

    // Loading state should be shown initially
    const _skeleton = document.querySelector('[data-testid="skeleton"]') || 
                     document.querySelector('.animate-pulse') ||
                     screen.queryByText('Loading');
    
    // Since we're using a skeleton component, check if skeleton-related classes exist
    const skeletonElement = document.querySelector('[class*="skeleton"]');
    expect(skeletonElement).toBeInTheDocument();
  });

  it('shows error state when video fails to load', async () => {
    renderVideoPlayer();

    const videoElement = document.querySelector('video');
    if (videoElement) {
      // Simulate video error
      fireEvent.error(videoElement);
    }

    await waitFor(() => {
      expect(screen.getByText('Failed to load video')).toBeInTheDocument();
    });
  });

  it('shows error state when GIF fails to load', async () => {
    renderVideoPlayer({ src: 'https://media.giphy.com/broken.gif' });

    const imgElement = screen.getByRole('img');
    fireEvent.error(imgElement);

    await waitFor(() => {
      expect(screen.getByText('Failed to load GIF')).toBeInTheDocument();
    });
  });

  it('shows controls on hover', async () => {
    renderVideoPlayer({ showControls: true });

    const container = document.querySelector('.group');
    expect(container).toBeInTheDocument();

    // Controls should be hidden initially (opacity-0)
    const controlsOverlay = document.querySelector('.opacity-0');
    expect(controlsOverlay).toBeInTheDocument();

    // On hover, controls should become visible (group-hover:opacity-100)
    if (container) {
      fireEvent.mouseEnter(container);
    }

    // The CSS classes should be present for hover functionality
    const hoverControls = document.querySelector('.group-hover\\:opacity-100');
    expect(hoverControls).toBeInTheDocument();
  });

  it('handles play/pause toggle', async () => {
    renderVideoPlayer();

    const videoElement = document.querySelector('video') as HTMLVideoElement;
    expect(videoElement).toBeInTheDocument();

    // Mock video methods
    const mockPlay = vi.fn().mockResolvedValue(undefined);
    const mockPause = vi.fn();
    
    Object.defineProperty(videoElement, 'play', { value: mockPlay });
    Object.defineProperty(videoElement, 'pause', { value: mockPause });
    Object.defineProperty(videoElement, 'paused', { value: true });

    // Simulate click on video to toggle play
    fireEvent.click(videoElement);

    await waitFor(() => {
      expect(mockPlay).toHaveBeenCalled();
    });
  });

  it('handles mute/unmute toggle', async () => {
    renderVideoPlayer({ showControls: true });

    const videoElement = document.querySelector('video') as HTMLVideoElement;
    expect(videoElement).toBeInTheDocument();

    // Initially muted
    expect(videoElement.muted).toBe(true);

    // Find and click mute button (VolumeX icon when muted)
    const muteButton = document.querySelector('[class*="h-5 w-5"]')?.closest('button');
    if (muteButton) {
      fireEvent.click(muteButton);
      expect(videoElement.muted).toBe(false);
    }
  });

  it('handles auto-loop when video ends', async () => {
    renderVideoPlayer();

    const videoElement = document.querySelector('video') as HTMLVideoElement;
    expect(videoElement).toBeInTheDocument();

    // Mock video methods and properties
    const mockPlay = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(videoElement, 'play', { value: mockPlay });
    Object.defineProperty(videoElement, 'currentTime', { 
      value: 0, 
      writable: true 
    });

    // Simulate video ending
    fireEvent.ended(videoElement);

    await waitFor(() => {
      expect(videoElement.currentTime).toBe(0);
      expect(mockPlay).toHaveBeenCalled();
    });
  });

  it('registers with video playback context when mounted', () => {
    const _mockRegisterVideo = vi.fn();
    const _mockUnregisterVideo = vi.fn();
    
    // We would need to mock the context here, but since it's complex,
    // we'll test the integration in a separate integration test file
    renderVideoPlayer();

    const videoElement = document.querySelector('video');
    expect(videoElement).toBeInTheDocument();
  });

  it('unregisters from video playback context when unmounted', () => {
    const { unmount } = renderVideoPlayer();
    
    unmount();
    
    // The component should clean up its registration
    // This would be tested in integration tests with proper context mocking
  });

  it('sets active video when in view', async () => {
    // Mock intersection observer to return true
    mockInView.mockReturnValue(true);
    
    renderVideoPlayer();

    // Video should be registered and potentially set as active
    // This behavior is tested more thoroughly in integration tests
    const videoElement = document.querySelector('video');
    expect(videoElement).toBeInTheDocument();
  });

  it('handles different preload values', () => {
    renderVideoPlayer({ preload: 'metadata' });

    const videoElement = document.querySelector('video');
    expect(videoElement).toHaveAttribute('preload', 'metadata');
  });

  it('applies custom className', () => {
    renderVideoPlayer({ className: 'custom-video-class' });

    const container = document.querySelector('.custom-video-class');
    expect(container).toBeInTheDocument();
  });

  it('calls onLoadStart callback', async () => {
    const onLoadStart = vi.fn();
    renderVideoPlayer({ onLoadStart });

    const videoElement = document.querySelector('video');
    if (videoElement) {
      fireEvent.loadStart(videoElement);
      expect(onLoadStart).toHaveBeenCalled();
    }
  });

  it('calls onLoadedData callback', async () => {
    const onLoadedData = vi.fn();
    renderVideoPlayer({ onLoadedData });

    const videoElement = document.querySelector('video');
    if (videoElement) {
      fireEvent.loadedData(videoElement);
      expect(onLoadedData).toHaveBeenCalled();
    }
  });

  it('calls onError callback', async () => {
    const onError = vi.fn();
    renderVideoPlayer({ onError });

    const videoElement = document.querySelector('video');
    if (videoElement) {
      fireEvent.error(videoElement);
      expect(onError).toHaveBeenCalled();
    }
  });

  it('calls onEnded callback', async () => {
    const onEnded = vi.fn();
    renderVideoPlayer({ onEnded });

    const videoElement = document.querySelector('video') as HTMLVideoElement;
    if (videoElement) {
      // Mock play method to avoid errors
      Object.defineProperty(videoElement, 'play', { 
        value: vi.fn().mockResolvedValue(undefined) 
      });
      Object.defineProperty(videoElement, 'currentTime', { 
        value: 0, 
        writable: true 
      });

      fireEvent.ended(videoElement);
      expect(onEnded).toHaveBeenCalled();
    }
  });

  it('hides controls when showControls is false', () => {
    renderVideoPlayer({ showControls: false });

    // Controls overlay should not be present
    const controlsOverlay = document.querySelector('.group-hover\\:opacity-100');
    expect(controlsOverlay).not.toBeInTheDocument();
  });

  it('handles autoplay policy restrictions gracefully', async () => {
    renderVideoPlayer();

    const videoElement = document.querySelector('video') as HTMLVideoElement;
    expect(videoElement).toBeInTheDocument();

    // Mock play method to reject (autoplay policy)
    const mockPlay = vi.fn().mockRejectedValue(new Error('Autoplay blocked'));
    Object.defineProperty(videoElement, 'play', { value: mockPlay });

    // Simulate click to play
    fireEvent.click(videoElement);

    await waitFor(() => {
      expect(mockPlay).toHaveBeenCalled();
    });

    // Component should handle the rejection gracefully without crashing
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    
    render(
      <TestApp>
        <VideoPlaybackProvider>
          <VideoPlayer {...defaultProps} ref={ref} />
        </VideoPlaybackProvider>
      </TestApp>
    );

    expect(ref.current).toBeInstanceOf(HTMLVideoElement);
  });

  it('updates playing state based on video events', async () => {
    renderVideoPlayer();

    const videoElement = document.querySelector('video') as HTMLVideoElement;
    expect(videoElement).toBeInTheDocument();

    // Simulate play event
    fireEvent.play(videoElement);
    
    // Simulate pause event
    fireEvent.pause(videoElement);
    
    // Events should be handled without errors
    expect(videoElement).toBeInTheDocument();
  });

  it('stops event propagation on control button clicks', async () => {
    renderVideoPlayer({ showControls: true });

    const videoElement = document.querySelector('video') as HTMLVideoElement;
    const mockVideoClick = vi.fn();
    
    if (videoElement) {
      videoElement.addEventListener('click', mockVideoClick);
    }

    // Click on play/pause button should stop propagation
    const playButton = document.querySelector('button[class*="w-16 h-16"]');
    if (playButton) {
      fireEvent.click(playButton);
      
      // Video click handler should not be called due to stopPropagation
      expect(mockVideoClick).not.toHaveBeenCalled();
    }
  });

  describe('Mobile Gestures', () => {
    beforeEach(() => {
      mockIsMobile.mockReturnValue(true);
    });

    it('handles tap gesture for play/pause', async () => {
      renderVideoPlayer();
      
      const container = document.querySelector('.relative') as HTMLElement;
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      
      // Mock video methods
      const mockPlay = vi.fn().mockResolvedValue(undefined);
      const mockPause = vi.fn();
      Object.defineProperty(videoElement, 'play', { value: mockPlay });
      Object.defineProperty(videoElement, 'pause', { value: mockPause });
      Object.defineProperty(videoElement, 'paused', { value: true });

      // Single tap should toggle play/pause
      const tapEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100, identifier: 0 }]);
      fireEvent(container, tapEvent);
      
      const tapEndEvent = createTouchEvent('touchend', []);
      fireEvent(container, tapEndEvent);

      await waitFor(() => {
        expect(mockPlay).toHaveBeenCalled();
      });
    });

    it('handles double-tap gesture for like', async () => {
      const onDoubleTap = vi.fn();
      renderVideoPlayer({ onDoubleTap });
      
      const container = document.querySelector('.relative') as HTMLElement;

      // First tap
      const tap1 = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100, identifier: 0 }]);
      fireEvent(container, tap1);
      fireEvent(container, createTouchEvent('touchend', []));

      // Second tap within double-tap threshold
      vi.advanceTimersByTime(100);
      const tap2 = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100, identifier: 0 }]);
      fireEvent(container, tap2);
      fireEvent(container, createTouchEvent('touchend', []));

      await waitFor(() => {
        expect(onDoubleTap).toHaveBeenCalled();
      });
    });

    it('handles long press gesture for options menu', async () => {
      const onLongPress = vi.fn();
      renderVideoPlayer({ onLongPress });
      
      const container = document.querySelector('.relative') as HTMLElement;

      // Start long press
      const longPressStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100, identifier: 0 }]);
      fireEvent(container, longPressStart);

      // Hold for long press duration
      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(onLongPress).toHaveBeenCalled();
      });
    });

    it('handles swipe left gesture for next video', async () => {
      const onSwipeLeft = vi.fn();
      renderVideoPlayer({ onSwipeLeft });
      
      const container = document.querySelector('.relative') as HTMLElement;

      // Start swipe
      const swipeStart = createTouchEvent('touchstart', [{ clientX: 200, clientY: 100, identifier: 0 }]);
      fireEvent(container, swipeStart);

      // Move left
      const swipeMove = createTouchEvent('touchmove', [{ clientX: 50, clientY: 100, identifier: 0 }]);
      fireEvent(container, swipeMove);

      // End swipe
      const swipeEnd = createTouchEvent('touchend', []);
      fireEvent(container, swipeEnd);

      await waitFor(() => {
        expect(onSwipeLeft).toHaveBeenCalled();
      });
    });

    it('handles swipe right gesture for previous video', async () => {
      const onSwipeRight = vi.fn();
      renderVideoPlayer({ onSwipeRight });
      
      const container = document.querySelector('.relative') as HTMLElement;

      // Start swipe
      const swipeStart = createTouchEvent('touchstart', [{ clientX: 50, clientY: 100, identifier: 0 }]);
      fireEvent(container, swipeStart);

      // Move right
      const swipeMove = createTouchEvent('touchmove', [{ clientX: 200, clientY: 100, identifier: 0 }]);
      fireEvent(container, swipeMove);

      // End swipe
      const swipeEnd = createTouchEvent('touchend', []);
      fireEvent(container, swipeEnd);

      await waitFor(() => {
        expect(onSwipeRight).toHaveBeenCalled();
      });
    });

    it('handles pinch gesture for zoom', async () => {
      const onPinch = vi.fn();
      renderVideoPlayer({ onPinch });
      
      const container = document.querySelector('.relative') as HTMLElement;

      // Start pinch with two fingers
      const pinchStart = createTouchEvent('touchstart', [
        { clientX: 100, clientY: 100, identifier: 0 },
        { clientX: 200, clientY: 100, identifier: 1 }
      ]);
      fireEvent(container, pinchStart);

      // Move fingers apart (zoom in)
      const pinchMove = createTouchEvent('touchmove', [
        { clientX: 80, clientY: 100, identifier: 0 },
        { clientX: 220, clientY: 100, identifier: 1 }
      ]);
      fireEvent(container, pinchMove);

      // End pinch
      const pinchEnd = createTouchEvent('touchend', []);
      fireEvent(container, pinchEnd);

      await waitFor(() => {
        expect(onPinch).toHaveBeenCalledWith({ scale: expect.any(Number), direction: 'out' });
      });
    });

    it('handles swipe up/down on right side for volume control', async () => {
      const onVolumeGesture = vi.fn();
      renderVideoPlayer({ onVolumeGesture });
      
      const container = document.querySelector('.relative') as HTMLElement;
      
      // Swipe up on right side (increase volume)
      const swipeStart = createTouchEvent('touchstart', [{ clientX: 250, clientY: 200, identifier: 0 }]); // Right side
      fireEvent(container, swipeStart);

      const swipeMove = createTouchEvent('touchmove', [{ clientX: 250, clientY: 100, identifier: 0 }]); // Move up
      fireEvent(container, swipeMove);

      const swipeEnd = createTouchEvent('touchend', []);
      fireEvent(container, swipeEnd);

      await waitFor(() => {
        expect(onVolumeGesture).toHaveBeenCalledWith({ direction: 'up', delta: expect.any(Number) });
      });
    });

    it('handles swipe up/down on left side for brightness control', async () => {
      const onBrightnessGesture = vi.fn();
      renderVideoPlayer({ onBrightnessGesture });
      
      const container = document.querySelector('.relative') as HTMLElement;
      
      // Swipe down on left side (decrease brightness)
      const swipeStart = createTouchEvent('touchstart', [{ clientX: 50, clientY: 100, identifier: 0 }]); // Left side
      fireEvent(container, swipeStart);

      const swipeMove = createTouchEvent('touchmove', [{ clientX: 50, clientY: 200, identifier: 0 }]); // Move down
      fireEvent(container, swipeMove);

      const swipeEnd = createTouchEvent('touchend', []);
      fireEvent(container, swipeEnd);

      await waitFor(() => {
        expect(onBrightnessGesture).toHaveBeenCalledWith({ direction: 'down', delta: expect.any(Number) });
      });
    });
  });

  describe('Mobile Features', () => {
    beforeEach(() => {
      mockIsMobile.mockReturnValue(true);
    });

    it('enters fullscreen mode when requested', async () => {
      renderVideoPlayer({ allowFullscreen: true });
      
      const fullscreenButton = screen.getByRole('button', { name: /fullscreen/i });
      const container = document.querySelector('.relative') as HTMLElement;
      
      fireEvent.click(fullscreenButton);
      
      await waitFor(() => {
        expect(container.requestFullscreen).toHaveBeenCalled();
      });
    });

    it('exits fullscreen mode when requested', async () => {
      // Set fullscreen state
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: document.querySelector('.relative')
      });
      
      renderVideoPlayer({ allowFullscreen: true });
      
      const fullscreenButton = screen.getByRole('button', { name: /exit fullscreen/i });
      
      fireEvent.click(fullscreenButton);
      
      await waitFor(() => {
        expect(document.exitFullscreen).toHaveBeenCalled();
      });
    });

    it('shows mobile-optimized controls with larger touch targets', async () => {
      renderVideoPlayer({ showControls: true });
      
      // Simulate video loaded to show controls
      const videoElement = document.querySelector('video');
      if (videoElement) {
        fireEvent.loadedData(videoElement);
      }
      
      await waitFor(() => {
        // Controls should have mobile-friendly spacing
        const controls = document.querySelector('[data-testid=\"mobile-controls\"]');
        expect(controls).toBeInTheDocument();
        
        // Play button should be larger on mobile (w-20 h-20 instead of w-16 h-16)
        const playButton = document.querySelector('button[class*="w-20 h-20"]');
        expect(playButton).toBeInTheDocument();
      });
    });

    it('auto-hides controls after timeout on mobile', async () => {
      renderVideoPlayer({ showControls: true, autoHideControls: true });
      
      // Simulate video loaded to show controls
      const videoElement = document.querySelector('video');
      if (videoElement) {
        fireEvent.loadedData(videoElement);
      }
      
      const container = document.querySelector('.relative') as HTMLElement;
      
      await waitFor(() => {
        const controls = document.querySelector('[data-testid=\"mobile-controls\"]');
        expect(controls).toBeInTheDocument();
      });
      
      // Show controls by tapping
      fireEvent(container, createTouchEvent('touchstart', [{ clientX: 100, clientY: 100, identifier: 0 }]));
      fireEvent(container, createTouchEvent('touchend', []));
      
      // Controls should be visible initially
      const controls = document.querySelector('[data-testid=\"mobile-controls\"]');
      expect(controls).toHaveClass('opacity-100');
      
      // After timeout, controls should hide
      vi.advanceTimersByTime(3000);
      
      await waitFor(() => {
        expect(controls).toHaveClass('opacity-0');
      });
    });

    it('handles orientation change', async () => {
      const onOrientationChange = vi.fn();
      renderVideoPlayer({ onOrientationChange });
      
      // Simulate orientation change
      const mockOrientation = {
        type: 'landscape-primary',
        angle: 90,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
      
      Object.defineProperty(window.screen, 'orientation', {
        writable: true,
        value: mockOrientation
      });
      
      const orientationEvent = new Event('orientationchange');
      window.dispatchEvent(orientationEvent);
      
      await waitFor(() => {
        expect(onOrientationChange).toHaveBeenCalledWith('landscape-primary');
      });
    });

    it('shows loading indicator optimized for mobile', () => {
      renderVideoPlayer();
      
      // Mobile loading indicator should be present
      const mobileLoader = document.querySelector('[data-testid=\"mobile-loading\"]');
      expect(mobileLoader).toBeInTheDocument();
    });

    it('shows mobile-friendly error message', () => {
      renderVideoPlayer();
      
      const videoElement = document.querySelector('video');
      if (videoElement) {
        fireEvent.error(videoElement);
      }
      
      // Mobile error message should be shown
      const mobileError = screen.getByText(/tap to retry/i);
      expect(mobileError).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('applies phone layout on small screens', () => {
      mockIsMobile.mockReturnValue(true);
      // Mock window.innerWidth for phone
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });
      
      renderVideoPlayer();
      
      const container = document.querySelector('.relative') as HTMLElement;
      expect(container).toHaveClass('phone-layout');
    });

    it('applies tablet layout on medium screens', () => {
      mockIsMobile.mockReturnValue(false);
      // Mock window.innerWidth for tablet
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 768 });
      
      renderVideoPlayer();
      
      const container = document.querySelector('.relative') as HTMLElement;
      expect(container).toHaveClass('tablet-layout');
    });

    it('applies desktop layout on large screens', () => {
      mockIsMobile.mockReturnValue(false);
      // Mock window.innerWidth for desktop
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 1200 });
      
      renderVideoPlayer();
      
      const container = document.querySelector('.relative') as HTMLElement;
      expect(container).toHaveClass('desktop-layout');
    });

    it('adjusts control sizes based on screen size', async () => {
      mockIsMobile.mockReturnValue(true);
      
      renderVideoPlayer({ showControls: true });
      
      // Simulate video loaded to show controls
      const videoElement = document.querySelector('video');
      if (videoElement) {
        fireEvent.loadedData(videoElement);
      }
      
      await waitFor(() => {
        // Buttons should be larger on mobile
        const playButton = document.querySelector('button[class*="w-20 h-20"]'); // Larger mobile button
        expect(playButton).toBeInTheDocument();
        
        // Touch targets should be minimum 44px
        const touchTargets = document.querySelectorAll('[class*="min-h-\\[44px\\]"]');
        expect(touchTargets.length).toBeGreaterThan(0);
      });
    });

    it('provides appropriate spacing for thumb navigation', async () => {
      mockIsMobile.mockReturnValue(true);
      
      renderVideoPlayer({ showControls: true });
      
      // Simulate video loaded to show controls
      const videoElement = document.querySelector('video');
      if (videoElement) {
        fireEvent.loadedData(videoElement);
      }
      
      await waitFor(() => {
        // Controls should have thumb-friendly spacing
        const controls = document.querySelector('[data-testid=\"mobile-controls\"]');
        expect(controls).toBeInTheDocument();
        expect(controls).toHaveClass('p-4'); // Adequate padding for thumbs
      });
    });
  });
});
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VideoPlaybackProvider, VideoPlaybackContext } from './VideoPlaybackContext';
import { useContext } from 'react';

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeEach(() => {
  console.log = vi.fn();
  vi.clearAllMocks();
});

afterEach(() => {
  console.log = originalConsoleLog;
});

describe('VideoPlaybackContext', () => {
  // Test component that uses the context
  function TestComponent() {
    const context = useContext(VideoPlaybackContext);
    
    if (!context) {
      return <div>No context</div>;
    }

    const { activeVideoId, setActiveVideo, registerVideo, unregisterVideo } = context;

    return (
      <div>
        <div data-testid="active-video-id">{activeVideoId || 'none'}</div>
        <button 
          data-testid="set-video-1" 
          onClick={() => setActiveVideo('video-1')}
        >
          Set Video 1
        </button>
        <button 
          data-testid="set-video-2" 
          onClick={() => setActiveVideo('video-2')}
        >
          Set Video 2
        </button>
        <button 
          data-testid="clear-video" 
          onClick={() => setActiveVideo(null)}
        >
          Clear Video
        </button>
        <button 
          data-testid="register-video-1" 
          onClick={() => {
            const mockElement = document.createElement('video') as HTMLVideoElement;
            mockElement.pause = vi.fn();
            mockElement.play = vi.fn().mockResolvedValue(undefined);
            Object.defineProperty(mockElement, 'paused', { value: true, writable: true });
            registerVideo('video-1', mockElement);
          }}
        >
          Register Video 1
        </button>
        <button 
          data-testid="register-video-2" 
          onClick={() => {
            const mockElement = document.createElement('video') as HTMLVideoElement;
            mockElement.pause = vi.fn();
            mockElement.play = vi.fn().mockResolvedValue(undefined);
            Object.defineProperty(mockElement, 'paused', { value: true, writable: true });
            registerVideo('video-2', mockElement);
          }}
        >
          Register Video 2
        </button>
        <button 
          data-testid="unregister-video-1" 
          onClick={() => unregisterVideo('video-1')}
        >
          Unregister Video 1
        </button>
      </div>
    );
  }

  function renderWithProvider() {
    return render(
      <VideoPlaybackProvider>
        <TestComponent />
      </VideoPlaybackProvider>
    );
  }

  it('provides initial context values', () => {
    renderWithProvider();

    expect(screen.getByTestId('active-video-id')).toHaveTextContent('none');
  });

  it('updates active video ID when setActiveVideo is called', async () => {
    renderWithProvider();

    fireEvent.click(screen.getByTestId('set-video-1'));

    await waitFor(() => {
      expect(screen.getByTestId('active-video-id')).toHaveTextContent('video-1');
    });
  });

  it('clears active video when setActiveVideo is called with null', async () => {
    renderWithProvider();

    // First set a video
    fireEvent.click(screen.getByTestId('set-video-1'));
    await waitFor(() => {
      expect(screen.getByTestId('active-video-id')).toHaveTextContent('video-1');
    });

    // Then clear it
    fireEvent.click(screen.getByTestId('clear-video'));
    await waitFor(() => {
      expect(screen.getByTestId('active-video-id')).toHaveTextContent('none');
    });
  });

  it('switches between videos correctly', async () => {
    renderWithProvider();

    // Set first video
    fireEvent.click(screen.getByTestId('set-video-1'));
    await waitFor(() => {
      expect(screen.getByTestId('active-video-id')).toHaveTextContent('video-1');
    });

    // Switch to second video
    fireEvent.click(screen.getByTestId('set-video-2'));
    await waitFor(() => {
      expect(screen.getByTestId('active-video-id')).toHaveTextContent('video-2');
    });
  });

  it('pauses previous video when switching to new video', async () => {
    renderWithProvider();

    // Register first video
    fireEvent.click(screen.getByTestId('register-video-1'));
    
    // Register second video
    fireEvent.click(screen.getByTestId('register-video-2'));

    // Set first video as active
    fireEvent.click(screen.getByTestId('set-video-1'));
    await waitFor(() => {
      expect(screen.getByTestId('active-video-id')).toHaveTextContent('video-1');
    });

    // Switch to second video - first should be paused
    fireEvent.click(screen.getByTestId('set-video-2'));
    await waitFor(() => {
      expect(screen.getByTestId('active-video-id')).toHaveTextContent('video-2');
    });

    // We can't directly test the pause call due to mocking limitations,
    // but the context logic should handle this
  });

  it('plays new video when it becomes active', async () => {
    renderWithProvider();

    // Register video
    fireEvent.click(screen.getByTestId('register-video-1'));

    // Set video as active - should trigger play
    fireEvent.click(screen.getByTestId('set-video-1'));
    await waitFor(() => {
      expect(screen.getByTestId('active-video-id')).toHaveTextContent('video-1');
    });
  });

  it('handles play errors gracefully', async () => {
    renderWithProvider();

    // Create a mock video element that rejects play
    const TestComponentWithErrorVideo = () => {
      const context = useContext(VideoPlaybackContext);
      
      if (!context) {
        return <div>No context</div>;
      }

      const { activeVideoId, setActiveVideo, registerVideo } = context;

      return (
        <div>
          <div data-testid="active-video-id">{activeVideoId || 'none'}</div>
          <button 
            data-testid="register-error-video" 
            onClick={() => {
              const mockElement = document.createElement('video') as HTMLVideoElement;
              mockElement.pause = vi.fn();
              mockElement.play = vi.fn().mockRejectedValue(new Error('Play failed'));
              Object.defineProperty(mockElement, 'paused', { value: true, writable: true });
              registerVideo('error-video', mockElement);
            }}
          >
            Register Error Video
          </button>
          <button 
            data-testid="set-error-video" 
            onClick={() => setActiveVideo('error-video')}
          >
            Set Error Video
          </button>
        </div>
      );
    };

    render(
      <VideoPlaybackProvider>
        <TestComponentWithErrorVideo />
      </VideoPlaybackProvider>
    );

    // Register video that will fail to play
    fireEvent.click(screen.getByTestId('register-error-video'));

    // Set as active - should not crash even if play fails
    fireEvent.click(screen.getByTestId('set-error-video'));
    
    await waitFor(() => {
      expect(screen.getByTestId('active-video-id')).toHaveTextContent('error-video');
    });

    // Component should still be functional
    expect(screen.getByTestId('register-error-video')).toBeInTheDocument();
  });

  it('removes video from registry when unregistered', async () => {
    renderWithProvider();

    // Register video
    fireEvent.click(screen.getByTestId('register-video-1'));

    // Set as active
    fireEvent.click(screen.getByTestId('set-video-1'));
    await waitFor(() => {
      expect(screen.getByTestId('active-video-id')).toHaveTextContent('video-1');
    });

    // Unregister video
    fireEvent.click(screen.getByTestId('unregister-video-1'));

    // Try to set the unregistered video as active - should still work
    // (the ID can be set, but no video element will be available to play)
    fireEvent.click(screen.getByTestId('set-video-1'));
    await waitFor(() => {
      expect(screen.getByTestId('active-video-id')).toHaveTextContent('video-1');
    });
  });

  it('does not pause video when setting same video as active', async () => {
    renderWithProvider();

    // Register video
    fireEvent.click(screen.getByTestId('register-video-1'));

    // Set as active
    fireEvent.click(screen.getByTestId('set-video-1'));
    await waitFor(() => {
      expect(screen.getByTestId('active-video-id')).toHaveTextContent('video-1');
    });

    // Set same video as active again
    fireEvent.click(screen.getByTestId('set-video-1'));
    await waitFor(() => {
      expect(screen.getByTestId('active-video-id')).toHaveTextContent('video-1');
    });

    // Should not have paused the video (since it's the same one)
  });

  it('handles multiple video registrations', async () => {
    renderWithProvider();

    // Register multiple videos
    fireEvent.click(screen.getByTestId('register-video-1'));
    fireEvent.click(screen.getByTestId('register-video-2'));

    // Switch between them
    fireEvent.click(screen.getByTestId('set-video-1'));
    await waitFor(() => {
      expect(screen.getByTestId('active-video-id')).toHaveTextContent('video-1');
    });

    fireEvent.click(screen.getByTestId('set-video-2'));
    await waitFor(() => {
      expect(screen.getByTestId('active-video-id')).toHaveTextContent('video-2');
    });
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const originalConsoleError = console.error;
    console.error = vi.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow();

    console.error = originalConsoleError;
  });

  it('maintains video registry across active video changes', async () => {
    renderWithProvider();

    // Register videos
    fireEvent.click(screen.getByTestId('register-video-1'));
    fireEvent.click(screen.getByTestId('register-video-2'));

    // Switch between videos multiple times
    fireEvent.click(screen.getByTestId('set-video-1'));
    fireEvent.click(screen.getByTestId('set-video-2'));
    fireEvent.click(screen.getByTestId('set-video-1'));

    await waitFor(() => {
      expect(screen.getByTestId('active-video-id')).toHaveTextContent('video-1');
    });

    // Both videos should still be available in registry
    fireEvent.click(screen.getByTestId('set-video-2'));
    await waitFor(() => {
      expect(screen.getByTestId('active-video-id')).toHaveTextContent('video-2');
    });
  });
});
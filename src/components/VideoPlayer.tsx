// ABOUTME: Auto-looping video player component for 6-second videos
// ABOUTME: Supports MP4 and GIF formats with preloading and seamless playback

import { useRef, useEffect, useState, forwardRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from 'react-intersection-observer';
import { useVideoPlayback } from '@/hooks/useVideoPlayback';
import { useIsMobile } from '@/hooks/useIsMobile';

interface VideoPlayerProps {
  videoId: string;
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  onLoadStart?: () => void;
  onLoadedData?: () => void;
  onEnded?: () => void;
  onError?: () => void;
  showControls?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  // Mobile-specific props
  allowFullscreen?: boolean;
  autoHideControls?: boolean;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onPinch?: (data: { scale: number; direction: 'in' | 'out' }) => void;
  onVolumeGesture?: (data: { direction: 'up' | 'down'; delta: number }) => void;
  onBrightnessGesture?: (data: { direction: 'up' | 'down'; delta: number }) => void;
  onOrientationChange?: (orientation: string) => void;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  touches: number;
  identifier: number;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  (
    {
      videoId,
      src,
      poster,
      className,
      autoPlay: _autoPlay = true,
      muted: _muted = true,
      onLoadStart,
      onLoadedData,
      onEnded,
      onError,
      showControls = true,
      preload = 'none', // Changed to 'none' for better performance
      // Mobile-specific props
      allowFullscreen = false,
      autoHideControls = false,
      onDoubleTap,
      onLongPress,
      onSwipeLeft,
      onSwipeRight,
      onPinch,
      onVolumeGesture,
      onBrightnessGesture,
      onOrientationChange,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    
    // Mobile-specific state
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [touchState, setTouchState] = useState<TouchState | null>(null);
    const [lastTapTime, setLastTapTime] = useState(0);
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
    const [controlsTimer, setControlsTimer] = useState<NodeJS.Timeout | null>(null);
    
    const { activeVideoId, setActiveVideo, registerVideo, unregisterVideo, globalMuted, setGlobalMuted } = useVideoPlayback();
    const isActive = activeVideoId === videoId;
    
    // Get responsive layout class
    const getLayoutClass = useCallback(() => {
      if (typeof window === 'undefined') return 'desktop-layout';
      
      const width = window.innerWidth;
      if (width < 480) return 'phone-layout';
      if (width < 1024) return 'tablet-layout'; // Changed from 768 to 1024
      return 'desktop-layout';
    }, []);
    
    const [layoutClass, setLayoutClass] = useState(getLayoutClass);
    
    const isMobile = useIsMobile();

    // Use intersection observer to detect when video is in viewport
    const { ref: inViewRef, inView } = useInView({
      threshold: 0.3, // Video must be 30% visible to start loading
      rootMargin: '100px', // Start loading slightly before visible
      triggerOnce: false, // Allow re-triggering when scrolling
    });

    // Combine refs
    const setRefs = useCallback(
      (node: HTMLVideoElement | null) => {
        console.log(`[VideoPlayer ${videoId}] setRefs called with node:`, node ? 'HTMLVideoElement' : 'null');
        
        // Set video ref
        videoRef.current = node;
        
        // Set intersection observer ref
        inViewRef(node);
        
        // Set forwarded ref
        if (ref) {
          if (typeof ref === 'function') {
            ref(node);
          } else if ('current' in ref) {
            (ref as React.MutableRefObject<HTMLVideoElement | null>).current = node;
          }
        }

        // Register/unregister video with context
        if (node) {
          console.log(`[VideoPlayer ${videoId}] Registering video element`);
          registerVideo(videoId, node);
        } else {
          console.log(`[VideoPlayer ${videoId}] Unregistering video element`);
          unregisterVideo(videoId);
        }
      },
      [ref, inViewRef, videoId, registerVideo, unregisterVideo]
    );
    
    // Set container ref
    const setContainerRef = useCallback((node: HTMLDivElement | null) => {
      containerRef.current = node;
    }, []);

    // Handle visibility changes - optimized for performance
    useEffect(() => {
      // Only log significant state changes
      if (inView !== (activeVideoId === videoId)) {
        console.log(`[VideoPlayer ${videoId}] Visibility changed - inView: ${inView}, isActive: ${isActive}`);
      }
      
      // Make active when in view (don't wait for loading to complete)
      if (inView && !hasError) {
        setActiveVideo(videoId);
      } else if (!inView && isActive) {
        setActiveVideo(null);
      }
    }, [inView, videoId, isActive, setActiveVideo, hasError, activeVideoId]);

    // Update playing state based on active status and control video playback
    useEffect(() => {
      console.log(`[VideoPlayer ${videoId}] Active status changed: ${isActive}`);
      setIsPlaying(isActive);
      
      // Actually control the video element
      if (videoRef.current && !isLoading && !hasError) {
        if (isActive) {
          console.log(`[VideoPlayer ${videoId}] Starting playback`);
          videoRef.current.play().catch((error) => {
            console.error(`[VideoPlayer ${videoId}] Failed to start playback:`, error);
          });
        } else {
          console.log(`[VideoPlayer ${videoId}] Stopping playback`);
          videoRef.current.pause();
        }
      }
    }, [isActive, videoId, isLoading, hasError]);

    // Sync video muted state with global muted state
    useEffect(() => {
      if (videoRef.current) {
        console.log(`[VideoPlayer ${videoId}] Syncing muted state to: ${globalMuted}`);
        videoRef.current.muted = globalMuted;
      }
    }, [globalMuted, videoId]);

    // Handle play/pause
    const togglePlay = () => {
      console.log(`[VideoPlayer ${videoId}] togglePlay called, isPlaying: ${isPlaying}`);
      if (!videoRef.current) {
        console.log(`[VideoPlayer ${videoId}] No video ref available`);
        return;
      }

      if (isPlaying) {
        console.log(`[VideoPlayer ${videoId}] Pausing video`);
        videoRef.current.pause();
      } else {
        console.log(`[VideoPlayer ${videoId}] Attempting to play video`);
        videoRef.current.play().catch((error) => {
          console.error(`[VideoPlayer ${videoId}] Play failed:`, error);
          setIsPlaying(false);
        });
      }
      setIsPlaying(!isPlaying);
    };

    // Handle mute/unmute
    const toggleMute = () => {
      console.log(`[VideoPlayer ${videoId}] toggleMute called, globalMuted: ${globalMuted}`);
      if (!videoRef.current) return;
      
      // Toggle global mute state
      const newMutedState = !globalMuted;
      setGlobalMuted(newMutedState);
      
      // Apply to all registered videos
      console.log(`[VideoPlayer ${videoId}] Setting global muted state to: ${newMutedState}`);
    };

    // Mobile control functions
    const resetControlsTimeout = useCallback(() => {
      if (!isMobile || !autoHideControls) return;
      
      // Clear existing timer
      if (controlsTimer) {
        clearTimeout(controlsTimer);
      }
      
      // Show controls immediately
      setControlsVisible(true);
      
      // Set new timer to hide controls after 3 seconds
      const newTimer = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
      
      setControlsTimer(newTimer);
    }, [isMobile, autoHideControls, controlsTimer]);

    const toggleFullscreen = useCallback(async () => {
      if (!containerRef.current || !allowFullscreen) return;
      
      try {
        if (!document.fullscreenElement) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        } else {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      } catch (error) {
        console.error('Fullscreen toggle failed:', error);
      }
    }, [allowFullscreen]);

    // Touch gesture handlers
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
      if (!isMobile) return;
      
      resetControlsTimeout();
      
      const touch = e.touches[0];
      const currentTime = Date.now();
      
      // Clear any existing long press timer
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
      
      // Set up touch state
      setTouchState({
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: currentTime,
        touches: e.touches.length,
        identifier: touch.identifier,
      });
      
      // Start long press timer
      const timer = setTimeout(() => {
        onLongPress?.();
      }, 500);
      setLongPressTimer(timer);
      
    }, [isMobile, resetControlsTimeout, longPressTimer, onLongPress]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
      if (!isMobile || !touchState) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchState.startX;
      const deltaY = touch.clientY - touchState.startY;
      
      // Clear long press timer on movement
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      
      // Handle pinch gesture
      if (e.touches.length === 2 && touchState.touches === 1) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) + 
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        
        // Calculate scale direction (simplified)
        const direction = distance > 100 ? 'out' : 'in';
        onPinch?.({ scale: distance / 100, direction });
      }
      
      // Handle volume/brightness gestures (vertical swipes)
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 30) {
        const containerWidth = containerRef.current?.clientWidth || 300;
        const isRightSide = touchState.startX > containerWidth / 2;
        const direction = deltaY > 0 ? 'down' : 'up';
        
        if (isRightSide) {
          onVolumeGesture?.({ direction, delta: Math.abs(deltaY) });
        } else {
          onBrightnessGesture?.({ direction, delta: Math.abs(deltaY) });
        }
      }
    }, [isMobile, touchState, longPressTimer, onPinch, onVolumeGesture, onBrightnessGesture]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
      if (!isMobile || !touchState) return;
      
      // Clear long press timer
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      
      const currentTime = Date.now();
      const duration = currentTime - touchState.startTime;
      const deltaX = (e.changedTouches[0]?.clientX || touchState.startX) - touchState.startX;
      const deltaY = (e.changedTouches[0]?.clientY || touchState.startY) - touchState.startY;
      
      // Handle tap gesture
      if (duration < 300 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        const timeSinceLastTap = currentTime - lastTapTime;
        
        if (timeSinceLastTap < 300) {
          // Double tap
          onDoubleTap?.();
        } else {
          // Single tap - toggle play/pause
          togglePlay();
        }
        setLastTapTime(currentTime);
      }
      
      // Handle swipe gestures
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }
      
      setTouchState(null);
    }, [isMobile, touchState, longPressTimer, lastTapTime, togglePlay, onDoubleTap, onSwipeLeft, onSwipeRight]);

    // Track load timing
    const loadStartTime = useRef<number | null>(null);
    
    // Handle video events
    const handleLoadStart = () => {
      loadStartTime.current = performance.now();
      console.log(`[VideoPlayer ${videoId}] Load started at ${loadStartTime.current.toFixed(2)}ms`);
      setIsLoading(true);
      setHasError(false);
      onLoadStart?.();
    };

    const handleLoadedData = () => {
      const loadEndTime = performance.now();
      const loadDuration = loadStartTime.current ? loadEndTime - loadStartTime.current : 0;
      console.log(`[VideoPlayer ${videoId}] Data loaded after ${loadDuration.toFixed(2)}ms`);
      console.log(`[VideoPlayer ${videoId}] Video URL: ${src}`);
      if (videoRef.current) {
        console.log(`[VideoPlayer ${videoId}] Video dimensions: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
        console.log(`[VideoPlayer ${videoId}] Video duration: ${videoRef.current.duration}s`);
      }
      
      // Emit first video load metric (only once)
      if (loadDuration > 0 && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('performance-metric', {
          detail: {
            firstVideoLoad: Math.round(loadDuration),
          }
        }));
      }
      
      setIsLoading(false);
      onLoadedData?.();
    };

    const handleError = () => {
      console.error(`[VideoPlayer ${videoId}] Error loading video`);
      setIsLoading(false);
      setHasError(true);
      onError?.();
    };

    const handleEnded = () => {
      console.log(`[VideoPlayer ${videoId}] Video ended, auto-looping`);
      onEnded?.();
      // Auto-loop by replaying
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch((error) => {
          console.error(`[VideoPlayer ${videoId}] Failed to loop video:`, error);
          setIsPlaying(false);
        });
      }
    };

    // Handle play/pause state changes
    const handlePlay = () => {
      console.log(`[VideoPlayer ${videoId}] Play event fired`);
      setIsPlaying(true);
    };
    const handlePause = () => {
      console.log(`[VideoPlayer ${videoId}] Pause event fired`);
      setIsPlaying(false);
    };

    // Handle orientation changes
    useEffect(() => {
      if (!isMobile || !onOrientationChange) return;
      
      const handleOrientationChange = () => {
        const orientation = screen.orientation?.type || 'portrait-primary';
        onOrientationChange(orientation);
      };
      
      window.addEventListener('orientationchange', handleOrientationChange);
      
      return () => {
        window.removeEventListener('orientationchange', handleOrientationChange);
      };
    }, [isMobile, onOrientationChange]);

    // Handle fullscreen changes
    useEffect(() => {
      if (!allowFullscreen) return;
      
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };
      
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      
      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }, [allowFullscreen]);

    // Cleanup on unmount
    useEffect(() => {
      console.log(`[VideoPlayer ${videoId}] Component mounting`);
      return () => {
        console.log(`[VideoPlayer ${videoId}] Component unmounting`);
        unregisterVideo(videoId);
        
        // Clean up timers
        if (controlsTimer) clearTimeout(controlsTimer);
        if (longPressTimer) clearTimeout(longPressTimer);
      };
    }, [videoId, unregisterVideo, controlsTimer, longPressTimer]);

    // Handle GIF format (use img tag)
    if (src.toLowerCase().endsWith('.gif')) {
      return (
        <div className={cn('relative overflow-hidden bg-black', className)}>
          <img
            src={src}
            alt="Video GIF"
            className="w-full h-full object-contain"
            onLoad={() => setIsLoading(false)}
            onError={() => setHasError(true)}
          />
          {isLoading && (
            <Skeleton className="absolute inset-0" />
          )}
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              Failed to load GIF
            </div>
          )}
        </div>
      );
    }

    return (
      <div 
        ref={setContainerRef}
        className={cn(
          'relative overflow-hidden bg-black group',
          layoutClass,
          className
        )}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        <video
          ref={setRefs}
          src={src}
          poster={poster}
          muted={globalMuted}
          autoPlay={isActive && inView} // Only autoplay when active AND in view
          loop
          playsInline
          // Preload when in view (not just when active)
          preload={inView ? 'metadata' : 'none'}
          crossOrigin="anonymous"
          disableRemotePlayback
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain"
          onLoadStart={handleLoadStart}
          onLoadedData={handleLoadedData}
          onError={handleError}
          onEnded={handleEnded}
          onPlay={handlePlay}
          onPause={handlePause}
          onClick={!isMobile ? togglePlay : undefined}
        />

        {/* Loading state */}
        {isLoading && (
          <div 
            className="absolute inset-0 flex items-center justify-center"
            data-testid={isMobile ? "mobile-loading" : undefined}
          >
            <Skeleton className="w-full h-full" />
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div>Failed to load video</div>
              {isMobile && (
                <div className="text-sm mt-2">Tap to retry</div>
              )}
            </div>
          </div>
        )}

        {/* Controls overlay */}
        {showControls && !isLoading && !hasError && (
          <div 
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-opacity",
              isMobile 
                ? (controlsVisible ? "opacity-100" : "opacity-0")
                : "opacity-0 group-hover:opacity-100",
              isMobile && "p-4"
            )}
            data-testid={isMobile ? "mobile-controls" : undefined}
          >
            {/* Play/Pause button */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full bg-black/50 hover:bg-black/70 text-white",
                isMobile ? "w-20 h-20 mobile" : "w-16 h-16"
              )}
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
            >
              {isPlaying ? (
                <Pause className={isMobile ? "h-10 w-10" : "h-8 w-8"} />
              ) : (
                <Play className={cn(isMobile ? "h-10 w-10 ml-1" : "h-8 w-8 ml-1")} />
              )}
            </Button>

            {/* Mute button */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute bottom-4 right-4 rounded-full bg-black/50 hover:bg-black/70 text-white min-h-[44px]",
                isMobile ? "w-12 h-12" : "w-10 h-10"
              )}
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
            >
              {globalMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>

            {/* Fullscreen button - mobile only */}
            {isMobile && allowFullscreen && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white min-h-[44px]"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize className="h-5 w-5" />
                ) : (
                  <Maximize className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

// Add CSS for responsive layouts
const styles = `
  .phone-layout {
    @apply max-w-full;
  }
  
  .tablet-layout {
    @apply max-w-2xl;
  }
  
  .desktop-layout {
    @apply max-w-4xl;
  }
  
  .mobile-controls.p-4 {
    padding: 1rem;
  }
  
  .min-h-\\[44px\\] {
    min-height: 44px;
  }
`;

// Inject styles if not already injected
if (typeof document !== 'undefined' && !document.getElementById('video-player-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'video-player-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

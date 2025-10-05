// ABOUTME: Auto-looping video player component for 6-second videos
// ABOUTME: Supports MP4 and GIF formats with preloading and seamless playback

import { useRef, useEffect, useState, forwardRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from 'react-intersection-observer';
import { useVideoPlayback } from '@/hooks/useVideoPlayback';
import { useIsMobile } from '@/hooks/useIsMobile';
import { debugLog, debugError } from '@/lib/debug';

interface VideoPlayerProps {
  videoId: string;
  src: string;
  fallbackUrls?: string[];
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
      fallbackUrls,
      poster,
      className,
      autoPlay: _autoPlay = true,
      muted: _muted = true,
      onLoadStart,
      onLoadedData,
      onEnded,
      onError,
      showControls = true,
      preload: _preload = 'none', // Changed to 'none' for better performance
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
    const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
    const [allUrls, setAllUrls] = useState<string[]>([]);
    
    // Mobile-specific state
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [touchState, setTouchState] = useState<TouchState | null>(null);
    const [lastTapTime, setLastTapTime] = useState(0);
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
    const [controlsTimer, setControlsTimer] = useState<NodeJS.Timeout | null>(null);
    
    const { activeVideoId, registerVideo, unregisterVideo, updateVideoVisibility, globalMuted, setGlobalMuted } = useVideoPlayback();
    const isActive = activeVideoId === videoId;

    // Get responsive layout class
    const getLayoutClass = useCallback(() => {
      if (typeof window === 'undefined') return 'desktop-layout';

      const width = window.innerWidth;
      if (width < 480) return 'phone-layout';
      if (width < 1024) return 'tablet-layout'; // Changed from 768 to 1024
      return 'desktop-layout';
    }, []);

    const [layoutClass] = useState(getLayoutClass);
    
    const isMobile = useIsMobile();

    // Use intersection observer to detect when video is in viewport
    // Use multiple thresholds to get more granular visibility updates
    const { ref: inViewRef, inView, entry } = useInView({
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0], // Multiple thresholds for granular tracking
      rootMargin: '0px', // No margin, we want exact visibility
      triggerOnce: false, // Allow re-triggering when scrolling
    });

    // Combine refs - minimize dependencies for stability
    const setRefs = useCallback(
      (node: HTMLVideoElement | null) => {
        debugLog(`[VideoPlayer ${videoId}] setRefs called with node:`, node ? 'HTMLVideoElement' : 'null');
        
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
          debugLog(`[VideoPlayer ${videoId}] Registering video element`);
          registerVideo(videoId, node);
        } else {
          debugLog(`[VideoPlayer ${videoId}] Unregistering video element`);
          unregisterVideo(videoId);
        }
      },
      [videoId, registerVideo, unregisterVideo, inViewRef, ref] // Reordered for clarity, same deps
    );
    
    // Set container ref
    const setContainerRef = useCallback((node: HTMLDivElement | null) => {
      containerRef.current = node;
    }, []);

    // Handle visibility changes - report visibility ratio to context
    useEffect(() => {
      if (entry && !hasError) {
        const visibilityRatio = entry.intersectionRatio;
        debugLog(`[VideoPlayer ${videoId}] Visibility: ${(visibilityRatio * 100).toFixed(1)}%`);
        updateVideoVisibility(videoId, visibilityRatio);
      } else if (!entry || !inView) {
        // Not visible at all
        updateVideoVisibility(videoId, 0);
      }
    }, [entry, inView, videoId, hasError, updateVideoVisibility]);

    // Update playing state based on active status and control video playback
    useEffect(() => {
      debugLog(`[VideoPlayer ${videoId}] Active status changed: ${isActive}`);
      setIsPlaying(isActive);
      
      // Actually control the video element
      if (videoRef.current && !isLoading && !hasError) {
        if (isActive) {
          debugLog(`[VideoPlayer ${videoId}] Starting playback`);
          // Ensure video is not already playing before calling play()
          if (videoRef.current.paused) {
            videoRef.current.play().catch((error) => {
              debugError(`[VideoPlayer ${videoId}] Failed to start playback:`, error);
            });
          }
        } else {
          debugLog(`[VideoPlayer ${videoId}] Stopping playback`);
          // Force pause to ensure only one video plays
          videoRef.current.pause();
          // Reset to beginning for cleaner experience when scrolling back
          videoRef.current.currentTime = 0;
        }
      }
    }, [isActive, videoId, isLoading, hasError]);

    // Sync video muted state with global muted state
    useEffect(() => {
      if (videoRef.current) {
        debugLog(`[VideoPlayer ${videoId}] Syncing muted state to: ${globalMuted}`);
        videoRef.current.muted = globalMuted;
      }
    }, [globalMuted, videoId]);

    // Handle play/pause
    const togglePlay = useCallback(() => {
      debugLog(`[VideoPlayer ${videoId}] togglePlay called, isPlaying: ${isPlaying}`);
      if (!videoRef.current) {
        debugLog(`[VideoPlayer ${videoId}] No video ref available`);
        return;
      }

      if (isPlaying) {
        debugLog(`[VideoPlayer ${videoId}] Pausing video`);
        videoRef.current.pause();
      } else {
        debugLog(`[VideoPlayer ${videoId}] Attempting to play video`);
        videoRef.current.play().catch((error) => {
          debugError(`[VideoPlayer ${videoId}] Play failed:`, error);
          setIsPlaying(false);
        });
      }
      setIsPlaying(!isPlaying);
    }, [videoId, isPlaying]);

    // Handle mute/unmute
    const toggleMute = (e?: React.MouseEvent) => {
      e?.stopPropagation(); // Prevent event from bubbling to video click handler
      debugLog(`[VideoPlayer ${videoId}] toggleMute called, globalMuted: ${globalMuted}`);
      if (!videoRef.current) return;

      // Toggle global mute state
      const newMutedState = !globalMuted;
      setGlobalMuted(newMutedState);

      // Apply to all registered videos
      debugLog(`[VideoPlayer ${videoId}] Setting global muted state to: ${newMutedState}`);
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
        debugError('Fullscreen toggle failed:', error);
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
      debugLog(`[VideoPlayer ${videoId}] Load started at ${loadStartTime.current.toFixed(2)}ms`);
      setIsLoading(true);
      setHasError(false);
      onLoadStart?.();
    };

    const handleLoadedData = () => {
      const loadEndTime = performance.now();
      const loadDuration = loadStartTime.current ? loadEndTime - loadStartTime.current : 0;
      debugLog(`[VideoPlayer ${videoId}] Data loaded after ${loadDuration.toFixed(2)}ms`);
      debugLog(`[VideoPlayer ${videoId}] Video URL: ${src}`);
      if (videoRef.current) {
        debugLog(`[VideoPlayer ${videoId}] Video dimensions: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
        debugLog(`[VideoPlayer ${videoId}] Video duration: ${videoRef.current.duration}s`);
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

    const handleError = useCallback(() => {
      debugError(`[VideoPlayer ${videoId}] Error loading video from URL index ${currentUrlIndex}: ${allUrls[currentUrlIndex]}`);
      
      // Try next fallback URL if available
      if (currentUrlIndex < allUrls.length - 1) {
        debugLog(`[VideoPlayer ${videoId}] Trying fallback URL ${currentUrlIndex + 1}/${allUrls.length - 1}`);
        setCurrentUrlIndex(currentUrlIndex + 1);
        setIsLoading(true);
        setHasError(false);
      } else {
        debugError(`[VideoPlayer ${videoId}] All URLs failed, no more fallbacks`);
        setIsLoading(false);
        setHasError(true);
        onError?.();
      }
    }, [videoId, currentUrlIndex, allUrls, onError]);

    const handleEnded = () => {
      debugLog(`[VideoPlayer ${videoId}] Video ended, auto-looping`);
      onEnded?.();
      // Auto-loop by replaying
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch((error) => {
          debugError(`[VideoPlayer ${videoId}] Failed to loop video:`, error);
          setIsPlaying(false);
        });
      }
    };

    // Handle play/pause state changes
    const handlePlay = () => {
      debugLog(`[VideoPlayer ${videoId}] Play event fired`);
      setIsPlaying(true);
    };
    const handlePause = () => {
      debugLog(`[VideoPlayer ${videoId}] Pause event fired`);
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

    // Initialize URLs array
    useEffect(() => {
      debugLog(`[VideoPlayer ${videoId}] Initializing URLs - src: ${src}, fallbackUrls: ${JSON.stringify(fallbackUrls)}`);
      
      const urls: string[] = [];
      if (src) {
        urls.push(src);
      }
      if (fallbackUrls && fallbackUrls.length > 0) {
        urls.push(...fallbackUrls);
      }
      
      if (urls.length === 0) {
        debugError(`[VideoPlayer ${videoId}] No valid URLs provided!`);
        setHasError(true);
        return;
      }
      
      setAllUrls(urls);
      setCurrentUrlIndex(0);
      debugLog(`[VideoPlayer ${videoId}] Initialized with ${urls.length} URLs (primary: ${!!src}, fallbacks: ${fallbackUrls?.length || 0})`);
    }, [src, fallbackUrls, videoId]);

    // Set video source - with fallback support
    useEffect(() => {
      const video = videoRef.current;
      const currentUrl = allUrls[currentUrlIndex];
      
      debugLog(`[VideoPlayer ${videoId}] Setting video source - URL ${currentUrlIndex}/${allUrls.length - 1}: ${currentUrl}`);
      
      if (!video || !currentUrl) {
        debugLog(`[VideoPlayer ${videoId}] Skipping source setup - video: ${!!video}, url: ${!!currentUrl}`);
        return;
      }
      
      // For now, just use direct playback for all URLs
      // MP4 files will play directly, HLS might work natively on some browsers
      debugLog(`[VideoPlayer ${videoId}] Setting video source directly: ${currentUrl}`);
      video.src = currentUrl;
      
      // Set loading state
      setIsLoading(true);
      setHasError(false);
      
    }, [currentUrlIndex, allUrls, videoId]); // React to URL index changes

    // Cleanup on unmount
    useEffect(() => {
      debugLog(`[VideoPlayer ${videoId}] Component mounting`);
      return () => {
        debugLog(`[VideoPlayer ${videoId}] Component unmounting`);
        
        // Ensure video is paused before unmounting
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
        
        // Clear visibility and unregister
        updateVideoVisibility(videoId, 0);
        unregisterVideo(videoId);
        
        // Clean up timers
        if (controlsTimer) clearTimeout(controlsTimer);
        if (longPressTimer) clearTimeout(longPressTimer);
      };
    }, [videoId, unregisterVideo, updateVideoVisibility, controlsTimer, longPressTimer]);

    // Handle GIF format (use img tag)
    const currentUrl = allUrls[currentUrlIndex] || src;
    if (currentUrl.toLowerCase().endsWith('.gif')) {
      return (
        <div className={cn('relative overflow-hidden bg-black', className)}>
          <img
            src={currentUrl}
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
          // Don't set src directly if it's an HLS stream - HLS.js will handle it
          src={currentUrl.toLowerCase().includes('.m3u8') ? undefined : currentUrl}
          poster={poster}
          muted={globalMuted}
          autoPlay={false} // Never autoplay, we control playback programmatically
          loop
          playsInline
          // Preload metadata for videos in view for faster playback
          preload={inView ? 'auto' : 'none'}
          crossOrigin="anonymous"
          disableRemotePlayback
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

        {/* Controls overlay - only mute and fullscreen buttons */}
        {showControls && !isLoading && !hasError && (
          <>
            {/* Mute button */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute bottom-4 right-4 rounded-full bg-black/50 hover:bg-black/70 text-white min-h-[44px] transition-opacity",
                isMobile 
                  ? (controlsVisible ? "opacity-100 w-12 h-12" : "opacity-0 w-12 h-12")
                  : "opacity-0 group-hover:opacity-100 w-10 h-10"
              )}
              onClick={toggleMute}
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
                className={cn(
                  "absolute bottom-4 left-4 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white min-h-[44px] transition-opacity",
                  controlsVisible ? "opacity-100" : "opacity-0"
                )}
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
          </>
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

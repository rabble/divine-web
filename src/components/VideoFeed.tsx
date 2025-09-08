// ABOUTME: Video feed component for displaying scrollable lists of videos
// ABOUTME: Supports different feed types (discovery, home, trending, hashtag, profile)

import { useEffect, useState, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import { VideoCard } from '@/components/VideoCard';
import { useVideoEvents } from '@/hooks/useVideoEvents';
import { RelaySelector } from '@/components/RelaySelector';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ParsedVideoData } from '@/types/video';
import { debugLog, debugWarn } from '@/lib/debug';

interface VideoFeedProps {
  feedType?: 'discovery' | 'home' | 'trending' | 'hashtag' | 'profile';
  hashtag?: string;
  pubkey?: string;
  limit?: number;
  className?: string;
  'data-testid'?: string;
  'data-hashtag-testid'?: string;
  'data-profile-testid'?: string;
}

export function VideoFeed({
  feedType = 'discovery',
  hashtag,
  pubkey,
  limit = 20, // Initial batch size
  className,
  'data-testid': testId,
  'data-hashtag-testid': hashtagTestId,
  'data-profile-testid': profileTestId,
}: VideoFeedProps) {
  const [allVideos, setAllVideos] = useState<ParsedVideoData[]>([]);
  const [lastTimestamp, setLastTimestamp] = useState<number | undefined>();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 5 }); // Start with first 5 videos visible for better performance

  const { data: videos, isLoading, error, refetch } = useVideoEvents({
    feedType,
    hashtag,
    pubkey,
    limit,
    until: lastTimestamp,
  });

  // Update allVideos when new data comes in
  useEffect(() => {
    if (videos && videos.length > 0) {
      if (!lastTimestamp) {
        // First load
        setAllVideos(videos);
      } else {
        // Append new videos, avoiding duplicates
        setAllVideos(prev => {
          const existingIds = new Set(prev.map(v => v.id));
          const newVideos = videos.filter(v => !existingIds.has(v.id));
          return [...prev, ...newVideos];
        });
      }
      setIsLoadingMore(false);
    }
  }, [videos, lastTimestamp]);

  // Log video data when it changes
  useEffect(() => {
    debugLog(`[VideoFeed] Feed type: ${feedType}, Videos loaded:`, allVideos?.length || 0);
    if (allVideos && allVideos.length > 0) {
      debugLog('[VideoFeed] First few videos:', allVideos.slice(0, 3).map(v => ({
        id: v.id,
        videoUrl: v.videoUrl,
        thumbnailUrl: v.thumbnailUrl,
        isRepost: v.isRepost,
        hasUrl: !!v.videoUrl
      })));
      
      // Check if any videos are missing URLs
      const missingUrls = allVideos.filter(v => !v.videoUrl);
      if (missingUrls.length > 0) {
        debugWarn(`[VideoFeed] ${missingUrls.length} videos missing URLs`);
      }
    }
  }, [allVideos, feedType]);

  const { ref: bottomRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  // Load more videos when approaching bottom
  useEffect(() => {
    if (inView && allVideos && allVideos.length > 0 && !isLoading && !isLoadingMore) {
      const oldestVideo = allVideos[allVideos.length - 1];
      const oldestTimestamp = oldestVideo.isRepost && oldestVideo.repostedAt 
        ? oldestVideo.repostedAt 
        : oldestVideo.createdAt;
      
      debugLog('Near bottom, loading more videos before timestamp:', oldestTimestamp);
      setIsLoadingMore(true);
      setLastTimestamp(oldestTimestamp);
    }
  }, [inView, allVideos, isLoading, isLoadingMore]);

  // Update visible range based on scroll
  const handleScroll = useCallback(() => {
    if (typeof window === 'undefined' || allVideos.length === 0) return;
    
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const cardHeight = 600; // Approximate height of a video card
    
    // Calculate visible range with buffer
    const visibleStart = Math.floor(scrollY / cardHeight);
    const visibleEnd = Math.ceil((scrollY + windowHeight) / cardHeight);
    
    // Add buffer of 1 video above and below for smoother scrolling
    const startIndex = Math.max(0, visibleStart - 1);
    const endIndex = Math.min(allVideos.length, visibleEnd + 1);
    
    debugLog(`[VideoFeed] Scroll position: ${scrollY}, visible range: ${startIndex}-${endIndex}`);
    setVisibleRange({ start: startIndex, end: endIndex });
    
    // Emit visible videos metric
    window.dispatchEvent(new CustomEvent('performance-metric', {
      detail: {
        visibleVideos: endIndex - startIndex,
      }
    }));
  }, [allVideos.length]);

  useEffect(() => {
    // Set initial visible range when videos load
    if (allVideos.length > 0 && visibleRange.end === 5) {
      debugLog(`[VideoFeed] Initial videos loaded: ${allVideos.length}`);
      handleScroll(); // Calculate initial visible range
    }
  }, [allVideos, handleScroll, visibleRange.end]);
  
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Loading state
  if (isLoading && !lastTimestamp) {
    return (
      <div 
        className={className}
        data-testid={testId}
        data-hashtag-testid={hashtagTestId}
        data-profile-testid={profileTestId}
      >
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="overflow-hidden" data-testid="video-skeleton">
              <div className="flex items-center gap-3 p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="aspect-square w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        className={className}
        data-testid={testId}
        data-hashtag-testid={hashtagTestId}
        data-profile-testid={profileTestId}
      >
        <Card className="border-destructive">
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">Failed to load videos</p>
            <button
              onClick={() => refetch()}
              className="text-primary hover:underline"
            >
              Try again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (!allVideos || allVideos.length === 0) {
    return (
      <div 
        className={className}
        data-testid={testId}
        data-hashtag-testid={hashtagTestId}
        data-profile-testid={profileTestId}
      >
        <Card className="border-dashed">
          <CardContent className="py-12 px-8 text-center">
            <div className="max-w-sm mx-auto space-y-6">
              <p className="text-muted-foreground">
                {feedType === 'home' 
                  ? "No videos from people you follow yet. Try following some creators!"
                  : feedType === 'hashtag'
                  ? `No videos found for #${hashtag}`
                  : feedType === 'profile'
                  ? "This user hasn't posted any videos yet"
                  : "No videos found. Try another relay?"}
              </p>
              <RelaySelector className="w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle interactions
  const handleLike = (video: ParsedVideoData) => {
    debugLog('Like video:', video.id);
    // TODO: Implement like functionality
  };

  const handleRepost = (video: ParsedVideoData) => {
    debugLog('Repost video:', video.id);
    // TODO: Implement repost functionality
  };

  // Only create VideoCard components for videos in the visible range
  // Note: We compute visibility inline when mapping to avoid unused variable lint warnings

  return (
    <div 
      className={className}
      data-testid={testId}
      data-hashtag-testid={hashtagTestId}
      data-profile-testid={profileTestId}
    >
      <div className="grid gap-6">
        {allVideos.map((video, index) => {
          // Only render videos in the visible range
          if (index >= visibleRange.start && index <= visibleRange.end) {
            return (
              <VideoCard
                key={`${video.id}-${video.isRepost ? 'repost' : 'original'}`}
                video={video}
                onLike={() => handleLike(video)}
                onRepost={() => handleRepost(video)}
                data-testid="video-card"
              />
            );
          }
          
          // Return placeholder div to maintain scroll position
          return (
            <div 
              key={`${video.id}-${video.isRepost ? 'repost' : 'original'}`} 
              style={{ height: '600px' }}
              aria-hidden="true"
            />
          );
        })}
      </div>

      {/* Load more trigger */}
      <div ref={bottomRef} className="h-10 flex items-center justify-center">
        {(isLoadingMore || (allVideos.length >= limit && allVideos.length > 0)) && (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  );
}

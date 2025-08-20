// ABOUTME: Enhanced video feed component with detailed performance logging
// ABOUTME: Tracks video loading times and identifies bottlenecks

import { useEffect, useState, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import { VideoCard } from '@/components/VideoCard';
import { useVideoEventsWithLogging } from '@/hooks/useVideoEventsWithLogging';
import { RelaySelector } from '@/components/RelaySelector';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { ParsedVideoData } from '@/types/video';

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

// Performance metrics display component
function PerformanceMetrics({ metrics }: { metrics: any }) {
  if (!metrics) return null;
  
  return (
    <Card className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
      <h3 className="font-bold mb-2">Performance Metrics</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>Query Time: {metrics.queryTime}ms</div>
        <div>Parse Time: {metrics.parseTime}ms</div>
        <div>Total Events: {metrics.totalEvents}</div>
        <div>Valid Videos: {metrics.validVideos}</div>
        <div>Render Start: {metrics.renderStart}ms</div>
        <div>First Video: {metrics.firstVideoTime}ms</div>
      </div>
    </Card>
  );
}

export function VideoFeedWithLogging({
  feedType = 'discovery',
  hashtag,
  pubkey,
  limit = 20,
  className,
  'data-testid': testId,
  'data-hashtag-testid': hashtagTestId,
  'data-profile-testid': profileTestId,
}: VideoFeedProps) {
  const [allVideos, setAllVideos] = useState<ParsedVideoData[]>([]);
  const [lastTimestamp, setLastTimestamp] = useState<number | undefined>();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(true);
  
  // Track component mount time
  const componentMountTime = useRef(performance.now());
  const firstVideoLoadTime = useRef<number | null>(null);
  const renderStartTime = useRef<number | null>(null);

  const { data: videos, isLoading, error, refetch } = useVideoEventsWithLogging({
    feedType,
    hashtag,
    pubkey,
    limit,
    until: lastTimestamp,
  });

  // Track when videos are received
  useEffect(() => {
    if (videos && videos.length > 0 && !renderStartTime.current) {
      renderStartTime.current = performance.now();
      const timeSinceMount = renderStartTime.current - componentMountTime.current;
      console.log(`[VideoFeed] First videos received after ${timeSinceMount.toFixed(2)}ms`);
    }
  }, [videos]);

  // Update allVideos when new data comes in
  useEffect(() => {
    if (videos && videos.length > 0) {
      const startUpdate = performance.now();
      
      if (!lastTimestamp) {
        // Initial load
        setAllVideos(videos);
        console.log(`[VideoFeed] Set ${videos.length} initial videos in ${(performance.now() - startUpdate).toFixed(2)}ms`);
      } else {
        // Pagination - append new videos
        setAllVideos(prev => {
          // Filter out duplicates
          const existingIds = new Set(prev.map(v => v.id));
          const newVideos = videos.filter(v => !existingIds.has(v.id));
          console.log(`[VideoFeed] Adding ${newVideos.length} new videos (filtered from ${videos.length}) in ${(performance.now() - startUpdate).toFixed(2)}ms`);
          return [...prev, ...newVideos];
        });
      }
      setIsLoadingMore(false);
    }
  }, [videos, lastTimestamp]);

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  // Load more when scrolling to bottom
  useEffect(() => {
    if (inView && !isLoading && !isLoadingMore && allVideos.length > 0 && allVideos.length >= limit) {
      console.log(`[VideoFeed] Loading more videos (current: ${allVideos.length})`);
      setIsLoadingMore(true);
      const oldestVideo = allVideos[allVideos.length - 1];
      const oldestTimestamp = oldestVideo.isRepost && oldestVideo.repostedAt 
        ? oldestVideo.repostedAt 
        : oldestVideo.createdAt;
      setLastTimestamp(oldestTimestamp - 1);
    }
  }, [inView, isLoading, isLoadingMore, allVideos, limit]);

  // Track first video load
  const handleFirstVideoLoad = () => {
    if (!firstVideoLoadTime.current) {
      firstVideoLoadTime.current = performance.now();
      const timeSinceMount = firstVideoLoadTime.current - componentMountTime.current;
      console.log(`[VideoFeed] First video loaded after ${timeSinceMount.toFixed(2)}ms`);
      
      // Update metrics
      setPerformanceMetrics({
        queryTime: renderStartTime.current ? (renderStartTime.current - componentMountTime.current).toFixed(0) : 'N/A',
        parseTime: 'See console',
        totalEvents: videos?.length || 0,
        validVideos: allVideos.length,
        renderStart: renderStartTime.current ? (renderStartTime.current - componentMountTime.current).toFixed(0) : 'N/A',
        firstVideoTime: timeSinceMount.toFixed(0),
      });
    }
  };

  // Loading state
  if (isLoading && !lastTimestamp) {
    console.log(`[VideoFeed] Showing loading skeleton`);
    return (
      <div className={className} data-testid={`${feedType}-feed-loading`}>
        {showDebug && <PerformanceMetrics metrics={performanceMetrics} />}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="aspect-square w-full rounded" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    console.error(`[VideoFeed] Error state:`, error);
    return (
      <div className={className}>
        <Card className="border-destructive/50">
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">Failed to load videos</p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (!isLoading && allVideos.length === 0) {
    console.log(`[VideoFeed] No videos found`);
    return (
      <div className={className}>
        <Card className="border-dashed">
          <CardContent className="py-12 px-8 text-center">
            <div className="max-w-sm mx-auto space-y-6">
              <p className="text-muted-foreground">
                {feedType === 'home' 
                  ? 'No videos from people you follow yet. Try following some creators!'
                  : feedType === 'hashtag' && hashtag
                  ? `No videos found for #${hashtag}`
                  : feedType === 'profile'
                  ? 'This user hasn\'t posted any videos yet'
                  : 'No videos found. Try another relay?'}
              </p>
              <RelaySelector className="w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get appropriate test ID
  const getTestId = () => {
    if (testId) return testId;
    if (feedType === 'hashtag' && hashtagTestId) return hashtagTestId;
    if (feedType === 'profile' && profileTestId) return profileTestId;
    return `${feedType}-feed`;
  };

  console.log(`[VideoFeed] Rendering ${allVideos.length} videos`);

  return (
    <div className={className} data-testid={getTestId()}>
      {/* Debug toggle button */}
      <div className="mb-4 text-right">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDebug(!showDebug)}
        >
          {showDebug ? 'Hide' : 'Show'} Debug Info
        </Button>
      </div>
      
      {/* Performance metrics */}
      {showDebug && <PerformanceMetrics metrics={performanceMetrics} />}
      
      {/* Video list */}
      <div className="space-y-4">
        {allVideos.map((video, index) => (
          <VideoCard 
            key={video.id} 
            video={video}
            onLoadedData={index === 0 ? handleFirstVideoLoad : undefined}
          />
        ))}
      </div>

      {/* Load more trigger */}
      {allVideos.length >= limit && (
        <div ref={loadMoreRef} className="py-8 text-center">
          {isLoadingMore && (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading more videos...</span>
            </div>
          )}
        </div>
      )}

      {/* End of feed message */}
      {allVideos.length > 0 && allVideos.length < limit && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          You've reached the end of the feed
        </div>
      )}
    </div>
  );
}
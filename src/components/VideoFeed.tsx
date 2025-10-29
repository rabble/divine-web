// ABOUTME: Video feed component for displaying scrollable lists of videos
// ABOUTME: Supports different feed types (discovery, home, trending, hashtag, profile)

import { useEffect, useState, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import { VideoCard } from '@/components/VideoCard';
import { AddToListDialog } from '@/components/AddToListDialog';
import { useVideoEvents } from '@/hooks/useVideoEvents';
import { useVideoSocialMetrics, useVideoUserInteractions } from '@/hooks/useVideoSocialMetrics';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useRepostVideo } from '@/hooks/usePublishVideo';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/useToast';
import type { ParsedVideoData } from '@/types/video';
// import type { VideoNavigationContext } from '@/hooks/useVideoNavigation';
import { debugLog, debugWarn } from '@/lib/debug';

interface VideoFeedProps {
  feedType?: 'discovery' | 'home' | 'trending' | 'hashtag' | 'profile' | 'recent';
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
  // Removed visibleRange state - no longer using virtual scrolling
  const [showCommentsForVideo, setShowCommentsForVideo] = useState<string | null>(null);
  const [showListDialog, setShowListDialog] = useState<{ videoId: string; videoPubkey: string } | null>(null);

  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const { mutateAsync: repostVideo, isPending: isReposting } = useRepostVideo();

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

  // Removed virtual scrolling completely - now renders all videos for better UX
  useEffect(() => {
    // Log when videos are loaded and emit performance metric
    if (allVideos.length > 0) {
      debugLog(`[VideoFeed] Videos loaded: ${allVideos.length}`);

      // Emit performance metric
      window.dispatchEvent(new CustomEvent('performance-metric', {
        detail: {
          visibleVideos: allVideos.length,
        }
      }));
    }
  }, [allVideos.length]);

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
                  : feedType === 'recent'
                  ? "No recent videos found."
                  : "No videos found."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle interactions
  const handleLike = async (video: ParsedVideoData) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to like videos',
        variant: 'destructive',
      });
      return;
    }

    debugLog('Like video:', video.id);
    try {
      await publishEvent({
        kind: 7, // Reaction event
        content: '+', // Positive reaction
        tags: [
          ['e', video.id], // Reference to the video event
          ['p', video.pubkey], // Reference to the video author
        ],
      });

      toast({
        title: 'Liked!',
        description: 'Your reaction has been published',
      });

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['video-user-interactions', video.id] });
      queryClient.invalidateQueries({ queryKey: ['video-social-metrics', video.id] });
    } catch (error) {
      console.error('Failed to like video:', error);
      toast({
        title: 'Error',
        description: 'Failed to like video',
        variant: 'destructive',
      });
    }
  };

  const handleRepost = async (video: ParsedVideoData) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to repost videos',
        variant: 'destructive',
      });
      return;
    }

    if (!video.vineId) {
      toast({
        title: 'Error',
        description: 'Cannot repost this video',
        variant: 'destructive',
      });
      return;
    }

    if (isReposting) return; // Prevent multiple simultaneous reposts

    debugLog('Repost video:', video.id, 'vineId:', video.vineId);
    try {
      await repostVideo({
        originalPubkey: video.pubkey,
        vineId: video.vineId,
      });

      toast({
        title: 'Reposted!',
        description: 'Video has been reposted to your feed',
      });

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['video-user-interactions', video.id] });
      queryClient.invalidateQueries({ queryKey: ['video-social-metrics', video.id] });
    } catch (error) {
      console.error('Failed to repost video:', error);
      toast({
        title: 'Error',
        description: 'Failed to repost video',
        variant: 'destructive',
      });
    }
  };

  const handleUnlike = async (likeEventId: string) => {
    if (!user) return;

    debugLog('Unlike video, deleting event:', likeEventId);
    try {
      await publishEvent({
        kind: 5, // Delete event (NIP-09)
        content: 'Unliked', // Optional reason
        tags: [
          ['e', likeEventId], // Reference to the event being deleted
        ],
      });

      toast({
        title: 'Unliked!',
        description: 'Your like has been removed',
      });

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['video-user-interactions'] });
      queryClient.invalidateQueries({ queryKey: ['video-social-metrics'] });
    } catch (error) {
      console.error('Failed to unlike video:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove like',
        variant: 'destructive',
      });
    }
  };

  const handleUnrepost = async (repostEventId: string) => {
    if (!user) return;

    debugLog('Un-repost video, deleting event:', repostEventId);
    try {
      await publishEvent({
        kind: 5, // Delete event (NIP-09)
        content: 'Un-reposted', // Optional reason
        tags: [
          ['e', repostEventId], // Reference to the event being deleted
        ],
      });

      toast({
        title: 'Un-reposted!',
        description: 'Your repost has been removed',
      });

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['video-user-interactions'] });
      queryClient.invalidateQueries({ queryKey: ['video-social-metrics'] });
    } catch (error) {
      console.error('Failed to un-repost video:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove repost',
        variant: 'destructive',
      });
    }
  };

  const handleOpenComments = (video: ParsedVideoData) => {
    setShowCommentsForVideo(video.id);
  };

  const handleCloseComments = () => {
    setShowCommentsForVideo(null);
  };

  // Note: handleAddToList is not currently used as VideoListBadges handles its own dialog
  // const handleAddToList = (video: ParsedVideoData) => {
  //   if (!user) {
  //     toast({
  //       title: 'Login Required',
  //       description: 'Please log in to add videos to lists',
  //       variant: 'destructive',
  //     });
  //     return;
  //   }

  //   if (!video.vineId) {
  //     toast({
  //       title: 'Error',
  //       description: 'Cannot add this video to a list',
  //       variant: 'destructive',
  //     });
  //     return;
  //   }

  //   setShowListDialog({ videoId: video.vineId, videoPubkey: video.pubkey });
  // };

  // Helper component to provide social metrics data for each video
  function VideoCardWithMetrics({ video, index }: { video: ParsedVideoData; index: number }) {
    const { data: socialMetrics } = useVideoSocialMetrics(video.id, video.pubkey);
    const { data: userInteractions } = useVideoUserInteractions(video.id, user?.pubkey);

    const handleVideoLike = async () => {
      if (userInteractions?.hasLiked) {
        // Unlike - delete the like event
        if (userInteractions.likeEventId) {
          await handleUnlike(userInteractions.likeEventId);
        }
      } else {
        // Like the video
        await handleLike(video);
      }
    };

    const handleVideoRepost = async () => {
      if (userInteractions?.hasReposted) {
        // Un-repost - delete the repost event
        if (userInteractions.repostEventId) {
          await handleUnrepost(userInteractions.repostEventId);
        }
      } else {
        // Repost the video
        await handleRepost(video);
      }
    };

    return (
      <VideoCard
        key={`${video.id}-${video.isRepost ? 'repost' : 'original'}`}
        video={video}
        onLike={handleVideoLike}
        onRepost={handleVideoRepost}
        onOpenComments={() => handleOpenComments(video)}
        onCloseComments={handleCloseComments}
        isLiked={userInteractions?.hasLiked || false}
        isReposted={userInteractions?.hasReposted || false}
        likeCount={video.likeCount ?? socialMetrics?.likeCount ?? 0}
        repostCount={video.repostCount ?? socialMetrics?.repostCount ?? 0}
        commentCount={video.commentCount ?? socialMetrics?.commentCount ?? 0}
        viewCount={socialMetrics?.viewCount || video.loopCount}
        showComments={showCommentsForVideo === video.id}
        navigationContext={{
          source: feedType,
          hashtag,
          pubkey,
        }}
        videoIndex={index}
        data-testid="video-card"
      />
    );
  }

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
        {allVideos.map((video, index) => (
          <VideoCardWithMetrics
            key={`${video.id}-${video.isRepost ? 'repost' : 'original'}`}
            video={video}
            index={index}
          />
        ))}
      </div>

      {/* Load more trigger */}
      <div ref={bottomRef} className="h-10 flex items-center justify-center">
        {isLoadingMore && (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Add to List Dialog */}
      {showListDialog && (
        <AddToListDialog
          videoId={showListDialog.videoId}
          videoPubkey={showListDialog.videoPubkey}
          open={true}
          onClose={() => setShowListDialog(null)}
        />
      )}
    </div>
  );
}

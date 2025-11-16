// ABOUTME: Video feed component for displaying scrollable lists of videos
// ABOUTME: Supports different feed types (discovery, home, trending, hashtag, profile)

import { useEffect, useState, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { Video } from 'lucide-react';
import { VideoCard } from '@/components/VideoCard';
import { AddToListDialog } from '@/components/AddToListDialog';
import { useVideoEvents } from '@/hooks/useVideoEvents';
import { useBatchedAuthors } from '@/hooks/useBatchedAuthors';
import { useVideoSocialMetrics, useVideoUserInteractions } from '@/hooks/useVideoSocialMetrics';
import { useOptimisticLike } from '@/hooks/useOptimisticLike';
import { useOptimisticRepost } from '@/hooks/useOptimisticRepost';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useContentModeration } from '@/hooks/useModeration';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';
import { useLoginDialog } from '@/contexts/LoginDialogContext';
import type { ParsedVideoData } from '@/types/video';
// import type { VideoNavigationContext } from '@/hooks/useVideoNavigation';
import { debugLog, debugWarn } from '@/lib/debug';
import { isReposted, getLatestRepostTime } from '@/lib/videoParser';

interface VideoFeedProps {
  feedType?: 'discovery' | 'home' | 'trending' | 'hashtag' | 'profile' | 'recent';
  hashtag?: string;
  pubkey?: string;
  limit?: number;
  className?: string;
  verifiedOnly?: boolean; // Filter to show only ProofMode verified videos
  mode?: 'auto-play' | 'thumbnail'; // Display mode for video cards
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
  verifiedOnly = false,
  mode = 'auto-play',
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
  const { toggleLike } = useOptimisticLike();
  const { toggleRepost } = useOptimisticRepost();
  const { checkContent } = useContentModeration();
  const { openLoginDialog } = useLoginDialog();

  const { data: videos, isLoading, error, refetch } = useVideoEvents({
    feedType,
    hashtag,
    pubkey,
    limit,
    until: lastTimestamp,
  });

  // Filter videos based on mute list and verification status
  const filteredVideos = useMemo(() => {
    if (!allVideos || allVideos.length === 0) return [];

    return allVideos.filter(video => {
      // Check moderation filters
      const moderationResult = checkContent({
        pubkey: video.pubkey,
        eventId: video.id,
        hashtags: video.hashtags,
        text: video.content
      });

      // Filter out muted content
      if (moderationResult.shouldFilter) {
        return false;
      }

      // Filter for verified-only if enabled
      if (verifiedOnly) {
        return video.proofMode &&
               (video.proofMode.level === 'verified_mobile' ||
                video.proofMode.level === 'verified_web');
      }

      return true;
    });
  }, [allVideos, checkContent, verifiedOnly]);

  // Collect all unique pubkeys for batched author fetching
  const authorPubkeys = useMemo(() => {
    if (!filteredVideos || filteredVideos.length === 0) return [];
    const pubkeys = new Set<string>();
    filteredVideos.forEach(video => {
      pubkeys.add(video.pubkey);
      // Add all reposters' pubkeys
      if (video.reposts) {
        video.reposts.forEach(repost => pubkeys.add(repost.reposterPubkey));
      }
    });
    return Array.from(pubkeys);
  }, [filteredVideos]);

  // Prefetch all authors in a single query
  useBatchedAuthors(authorPubkeys);

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
    const filtered = filteredVideos.length;
    const total = allVideos?.length || 0;
    debugLog(`[VideoFeed] Feed type: ${feedType}, Videos: ${filtered} shown / ${total} total (${total - filtered} filtered)`);
    if (filteredVideos && filteredVideos.length > 0) {
      debugLog('[VideoFeed] First few videos:', filteredVideos.slice(0, 3).map(v => ({
        id: v.id,
        videoUrl: v.videoUrl,
        thumbnailUrl: v.thumbnailUrl,
        isRepost: isReposted(v),
        hasUrl: !!v.videoUrl
      })));

      // Check if any videos are missing URLs
      const missingUrls = filteredVideos.filter(v => !v.videoUrl);
      if (missingUrls.length > 0) {
        debugWarn(`[VideoFeed] ${missingUrls.length} videos missing URLs`);
      }
    }
  }, [filteredVideos, allVideos, feedType]);

  const { ref: bottomRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  // Load more videos when approaching bottom
  useEffect(() => {
    if (inView && allVideos && allVideos.length > 0 && !isLoading && !isLoadingMore) {
      const oldestVideo = allVideos[allVideos.length - 1];
      const oldestTimestamp = getLatestRepostTime(oldestVideo);

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
                <div className="h-10 w-10 rounded-full bg-muted/50 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-muted/50 rounded animate-pulse" />
                </div>
              </div>
              <div className="aspect-square w-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" />
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="h-4 w-full bg-muted/50 rounded animate-pulse" />
                <div className="h-4 w-4/5 bg-muted/50 rounded animate-pulse" />
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

  // Empty state (check filteredVideos instead of allVideos)
  if (!filteredVideos || filteredVideos.length === 0) {
    // Check if we have videos but they're all filtered
    const allFiltered = allVideos && allVideos.length > 0 && filteredVideos.length === 0;

    return (
      <div
        className={className}
        data-testid={testId}
        data-hashtag-testid={hashtagTestId}
        data-profile-testid={profileTestId}
      >
        <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
          <CardContent className="py-16 px-8 text-center">
            <div className="max-w-md mx-auto space-y-6">
              {/* Show reclining Divine image for discovery/trending feeds when no videos */}
              {(feedType === 'discovery' || feedType === 'trending') && !allFiltered ? (
                <>
                  <div className="mx-auto -mx-8 -mt-16">
                    <img
                      src="/divine_reclining.jpg"
                      alt="Divine reclining"
                      className="w-full rounded-t-lg shadow-lg"
                    />
                  </div>
                  <div className="space-y-2 mt-6">
                    <p className="text-lg font-medium text-foreground">
                      Divine needs a rest
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Check back soon for new videos
                    </p>
                    <p className="text-xs text-muted-foreground/60 italic mt-4">
                      Photo by Marcus Leatherdale
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Video className="h-8 w-8 text-primary/60" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-foreground">
                      {allFiltered
                        ? "All videos filtered"
                        : feedType === 'home'
                        ? "Your feed is empty"
                        : feedType === 'hashtag'
                        ? `No videos with #${hashtag}`
                        : feedType === 'profile'
                        ? "No videos yet"
                        : feedType === 'recent'
                        ? "No recent videos"
                        : "No videos found"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {allFiltered
                        ? "All videos from this feed match your mute filters. Adjust your moderation settings to see content."
                        : feedType === 'home'
                        ? "Follow some creators to see their videos here!"
                        : feedType === 'hashtag'
                        ? "Be the first to post with this hashtag!"
                        : feedType === 'profile'
                        ? "Check back later for new content"
                        : "Check back soon for new videos"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      // Check authentication first, show login dialog if not authenticated
      if (!user) {
        openLoginDialog();
        return;
      }

      debugLog('Toggle like for video:', video.id);
      await toggleLike({
        videoId: video.id,
        videoPubkey: video.pubkey,
        userPubkey: user.pubkey,
        isCurrentlyLiked: userInteractions?.hasLiked || false,
        currentLikeEventId: userInteractions?.likeEventId || null,
      });
    };

    const handleVideoRepost = async () => {
      // Check authentication first, show login dialog if not authenticated
      if (!user) {
        openLoginDialog();
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

      debugLog('Toggle repost for video:', video.id);
      await toggleRepost({
        videoId: video.id,
        videoPubkey: video.pubkey,
        vineId: video.vineId,
        userPubkey: user.pubkey,
        isCurrentlyReposted: userInteractions?.hasReposted || false,
        currentRepostEventId: userInteractions?.repostEventId || null,
      });
    };

    return (
      <VideoCard
        key={video.id}
        video={video}
        mode={mode}
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
      {filteredVideos.map((video, index) => (
        <VideoCardWithMetrics
          key={video.id}
          video={video}
          index={index}
        />
      ))}

      {/* Load more trigger */}
      <div ref={bottomRef} className="h-16 flex items-center justify-center">
        {isLoadingMore && (
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-2 border-transparent border-t-primary rounded-full animate-spin" />
            </div>
            <span className="text-sm text-muted-foreground">Loading more...</span>
          </div>
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

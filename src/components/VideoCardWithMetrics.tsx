// ABOUTME: Enhanced VideoCard component that fetches and displays social metrics
// ABOUTME: Wrapper around VideoCard with optimistic updates for likes and reposts

import { VideoCard } from './VideoCard';
import { useVideoSocialMetrics, useVideoUserInteractions } from '@/hooks/useVideoSocialMetrics';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useOptimisticLike } from '@/hooks/useOptimisticLike';
import { useOptimisticRepost } from '@/hooks/useOptimisticRepost';
import { useLoginDialog } from '@/contexts/LoginDialogContext';
import { useToast } from '@/hooks/useToast';
import { debugLog } from '@/lib/debug';
import type { ParsedVideoData } from '@/types/video';
import type { VideoNavigationContext } from '@/hooks/useVideoNavigation';

interface VideoCardWithMetricsProps {
  video: ParsedVideoData;
  index?: number;
  className?: string;
  mode?: 'thumbnail' | 'auto-play';
  onOpenComments?: (video: ParsedVideoData) => void;
  onCloseComments?: () => void;
  onPlay?: () => void;
  onLoadedData?: () => void;
  showComments?: boolean;
  navigationContext?: VideoNavigationContext;
}

export function VideoCardWithMetrics({
  video,
  index,
  className,
  mode = 'auto-play',
  onOpenComments,
  onCloseComments,
  onPlay,
  onLoadedData,
  showComments = false,
  navigationContext,
}: VideoCardWithMetricsProps) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const { toggleLike } = useOptimisticLike();
  const { toggleRepost } = useOptimisticRepost();
  const { openLoginDialog } = useLoginDialog();

  // Fetch social metrics for this video
  const { data: socialMetrics } = useVideoSocialMetrics(video.id, video.pubkey);

  // Fetch user's interaction status with this video
  const { data: userInteractions } = useVideoUserInteractions(video.id, user?.pubkey);

  const handleVideoLike = async () => {
    // Check authentication first, show login dialog if not authenticated
    if (!user) {
      openLoginDialog();
      return;
    }

    debugLog('[VideoCardWithMetrics] Toggle like for video:', video.id);
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

    debugLog('[VideoCardWithMetrics] Toggle repost for video:', video.id);
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
      video={video}
      className={className}
      mode={mode}
      onLike={handleVideoLike}
      onRepost={handleVideoRepost}
      onOpenComments={onOpenComments}
      onCloseComments={onCloseComments}
      onPlay={onPlay}
      onLoadedData={onLoadedData}
      isLiked={userInteractions?.hasLiked || false}
      isReposted={userInteractions?.hasReposted || false}
      likeCount={video.likeCount ?? socialMetrics?.likeCount ?? 0}
      repostCount={video.repostCount ?? socialMetrics?.repostCount ?? 0}
      commentCount={video.commentCount ?? socialMetrics?.commentCount ?? 0}
      viewCount={socialMetrics?.viewCount || video.loopCount}
      showComments={showComments}
      navigationContext={navigationContext}
      videoIndex={index}
    />
  );
}
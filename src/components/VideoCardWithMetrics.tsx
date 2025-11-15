// ABOUTME: Enhanced VideoCard component that fetches and displays social metrics
// ABOUTME: Wrapper around VideoCard that provides real-time likes, reposts, and view counts

import { VideoCard } from './VideoCard';
import { useVideoSocialMetrics, useVideoUserInteractions } from '@/hooks/useVideoSocialMetrics';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useAuthenticatedAction } from '@/hooks/useAuthenticatedAction';
import type { ParsedVideoData } from '@/types/video';

interface VideoCardWithMetricsProps {
  video: ParsedVideoData;
  className?: string;
}

export function VideoCardWithMetrics({ video, className }: VideoCardWithMetricsProps) {
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();

  // Fetch social metrics for this video
  const socialMetrics = useVideoSocialMetrics(video.id, video.pubkey);

  // Fetch user's interaction status with this video
  const userInteractions = useVideoUserInteractions(video.id, user?.pubkey);

  // Wrap the actions with authentication check
  const handleLike = useAuthenticatedAction(() => {
    console.log('[VideoCardWithMetrics] Like action authenticated, creating event');
    // Create a reaction event (kind 7) for this video
    createEvent({
      kind: 7,
      content: '+',
      tags: [
        ['e', video.id],
        ['p', video.pubkey],
      ],
    });
  });

  const handleRepost = useAuthenticatedAction(() => {
    console.log('[VideoCardWithMetrics] Repost action authenticated, creating event');
    // Create a repost event (kind 6) for this video
    createEvent({
      kind: 6,
      content: '',
      tags: [
        ['e', video.id],
        ['p', video.pubkey],
      ],
    });
  });

  return (
    <VideoCard
      video={video}
      className={className}
      viewCount={socialMetrics.data?.viewCount}
      likeCount={video.likeCount ?? socialMetrics.data?.likeCount ?? 0}
      repostCount={video.repostCount ?? socialMetrics.data?.repostCount ?? 0}
      commentCount={video.commentCount ?? socialMetrics.data?.commentCount ?? 0}
      isLiked={userInteractions.data?.hasLiked || false}
      isReposted={userInteractions.data?.hasReposted || false}
      onLike={handleLike}
      onRepost={handleRepost}
    />
  );
}
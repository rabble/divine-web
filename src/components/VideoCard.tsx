// ABOUTME: Video card component for displaying individual videos in feeds
// ABOUTME: Shows video player, metadata, author info, and social interactions

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Repeat2, MessageCircle, Share, Eye } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VideoPlayer } from '@/components/VideoPlayer';
import { VideoCommentsModal } from '@/components/VideoCommentsModal';
import { ThumbnailPlayer } from '@/components/ThumbnailPlayer';
import { NoteContent } from '@/components/NoteContent';
import { VideoListBadges } from '@/components/VideoListBadges';
import { ProofModeBadge } from '@/components/ProofModeBadge';
import { VineBadge } from '@/components/VineBadge';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { enhanceAuthorData } from '@/lib/generateProfile';
import { formatDistanceToNow } from 'date-fns';
import type { ParsedVideoData } from '@/types/video';
import type { NostrMetadata } from '@nostrify/nostrify';
import { cn } from '@/lib/utils';
import { formatViewCount, formatDuration, formatCount } from '@/lib/formatUtils';
import { getSafeProfileImage } from '@/lib/imageUtils';
import { buildVideoNavigationUrl, type VideoNavigationContext } from '@/hooks/useVideoNavigation';

interface VideoCardProps {
  video: ParsedVideoData;
  className?: string;
  mode?: 'thumbnail' | 'auto-play';
  onLike?: () => void;
  onRepost?: () => void;
  onOpenComments?: (video: ParsedVideoData) => void;
  onCloseComments?: () => void;
  onPlay?: () => void;
  onLoadedData?: () => void;
  isLiked?: boolean;
  isReposted?: boolean;
  likeCount?: number;
  repostCount?: number;
  commentCount?: number;
  viewCount?: number;
  showComments?: boolean;
  // Navigation context for maintaining feed position
  navigationContext?: VideoNavigationContext;
  videoIndex?: number;
}

export function VideoCard({
  video,
  className,
  mode = 'auto-play',
  onLike,
  onRepost,
  onOpenComments,
  onCloseComments,
  onPlay,
  onLoadedData,
  isLiked = false,
  isReposted = false,
  likeCount = 0,
  repostCount = 0,
  commentCount = 0,
  viewCount: _viewCount,
  showComments = false,
  navigationContext,
  videoIndex,
}: VideoCardProps) {
  const authorData = useAuthor(video.pubkey);
  const reposterData = useAuthor(video.reposterPubkey || '');
  const shouldShowReposter = video.isRepost && video.reposterPubkey;
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(mode === 'auto-play');

  // Enhance author data with generated profiles
  const author = enhanceAuthorData(authorData.data, video.pubkey);
  const reposter = shouldShowReposter && video.reposterPubkey 
    ? enhanceAuthorData(reposterData.data, video.reposterPubkey)
    : null;

  const metadata: NostrMetadata = author.metadata;
  const reposterMetadata: NostrMetadata | undefined = reposter?.metadata;

  const displayName = metadata.display_name || metadata.name || genUserName(video.pubkey);
  const profileImage = getSafeProfileImage(metadata.picture);
  const npub = nip19.npubEncode(video.pubkey);
  // Just use npub for now, we'll deal with NIP-05 later
  const profileUrl = `/${npub}`;

  const reposterName = reposterMetadata?.name || (video.reposterPubkey ? genUserName(video.reposterPubkey) : '');

  // Format time - use original Vine timestamp if available, otherwise use created_at
  const timestamp = video.originalVineTimestamp || video.createdAt;
  
  const date = new Date(timestamp * 1000);
  const now = new Date();
  
  // Check if this is a migrated Vine (has vine_id)
  const isMigratedVine = !!video.vineId;
  
  // Calculate timeAgo - always show actual date/time, badge will indicate if it's original Vine
  const yearsDiff = now.getFullYear() - date.getFullYear();

  let timeAgo: string;
  // If more than 1 year old, show the actual date
  if (yearsDiff > 1 || (yearsDiff === 1 && now.getTime() < new Date(date).setFullYear(date.getFullYear() + 1))) {
    // Format as "Jan 15, 2021" for old dates
    timeAgo = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } else {
    // Use relative time for recent videos
    timeAgo = formatDistanceToNow(date, { addSuffix: true });
  }

  const handleCommentsClick = () => {
    onOpenComments?.(video);
  };

  const handleCloseCommentsModal = (open: boolean) => {
    if (!open) {
      onCloseComments?.();
    }
  };

  const handleThumbnailClick = () => {
    setIsPlaying(true);
    onPlay?.();
  };

  const handleVideoEnd = () => {
    if (mode === 'thumbnail') {
      setIsPlaying(false);
    }
  };

  return (
    <>
      {/* Comments Modal */}
      <VideoCommentsModal
        video={video}
        open={showComments}
        onOpenChange={handleCloseCommentsModal}
      />
    <Card className={cn('overflow-hidden', className)}>
      {/* Repost indicator */}
      {video.isRepost && (
        <div className="flex items-center gap-2 px-4 pt-3 text-sm text-muted-foreground">
          <Repeat2 className="h-4 w-4" />
          <span>{reposterName} reposted</span>
        </div>
      )}

      {/* Author info */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <Link to={profileUrl}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={profileImage} alt={displayName} />
            <AvatarFallback>{displayName[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link to={profileUrl} className="font-semibold hover:underline truncate">
              {displayName}
            </Link>
            {/* ProofMode badge */}
            {video.proofMode && video.proofMode.level !== 'unverified' && (
              <ProofModeBadge level={video.proofMode.level} />
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {/* Original Vine badge with timestamp, or just timestamp */}
            {isMigratedVine && <VineBadge />}
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>

      {/* Video content */}
      <CardContent className="p-0">
        {/* Video player or thumbnail */}
        <div className="relative aspect-square bg-black">
          {!isPlaying ? (
            <ThumbnailPlayer
              videoId={video.id}
              src={video.videoUrl}
              thumbnailUrl={video.thumbnailUrl}
              duration={video.duration}
              className="w-full h-full"
              onClick={handleThumbnailClick}
              onError={() => setVideoError(true)}
            />
          ) : !videoError ? (
            <VideoPlayer
              videoId={video.id}
              src={video.videoUrl}
              fallbackUrls={video.fallbackVideoUrls}
              poster={video.thumbnailUrl}
              className="w-full h-full"
              onLoadStart={() => setVideoError(false)}
              onError={() => setVideoError(true)}
              onEnded={handleVideoEnd}
              onLoadedData={onLoadedData}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Failed to load video</p>
            </div>
          )}
        </div>

        {/* Video metadata */}
        <div className="px-4 py-2" data-testid="video-metadata">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {video.loopCount && video.loopCount > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {formatViewCount(video.loopCount)}
              </span>
            )}
            {video.duration && (
              <span>{formatDuration(video.duration)}</span>
            )}
          </div>
        </div>

        {/* Title and description */}
        <div className="p-4 space-y-2">
          {video.title && (
            <h3 className="font-semibold text-lg">{video.title}</h3>
          )}
          
          {/* Only show content if it's different from the title */}
          {video.content && video.content.trim() !== video.title?.trim() && (
            <div className="whitespace-pre-wrap break-words">
              <NoteContent 
                event={{ 
                  id: video.id, 
                  pubkey: video.pubkey, 
                  created_at: video.createdAt,
                  kind: 1,
                  content: video.content,
                  tags: [],
                  sig: ''
                }} 
                className="text-sm" 
              />
            </div>
          )}

          {/* Hashtags */}
          {video.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {video.hashtags.map((tag) => (
                <Link
                  key={tag}
                  to={`/hashtag/${tag}`}
                  className="text-sm text-primary hover:underline"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* List badges */}
          {video.vineId && (
            <VideoListBadges
              videoId={video.vineId}
              videoPubkey={video.pubkey}
              compact={true}
              showAddButton={true}
              className="pt-2"
            />
          )}
        </div>

        {/* Interaction buttons */}
        <div className="flex items-center gap-1 px-4 pb-4">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'gap-2',
              isLiked && 'text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30'
            )}
            onClick={onLike}
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            <Heart className={cn('h-4 w-4', isLiked && 'fill-current')} />
            {likeCount > 0 && <span className="text-xs">{formatCount(likeCount)}</span>}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'gap-2',
              isReposted && 'text-green-500 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30'
            )}
            onClick={onRepost}
            aria-label={isReposted ? "Remove repost" : "Repost"}
          >
            <Repeat2 className={cn('h-4 w-4', isReposted && 'fill-current')} />
            {repostCount > 0 && <span className="text-xs">{formatCount(repostCount)}</span>}
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2" 
            onClick={handleCommentsClick}
            aria-label="Comment"
          >
            <MessageCircle className="h-4 w-4" />
            {commentCount > 0 && <span className="text-xs">{formatCount(commentCount)}</span>}
          </Button>

          <Button variant="ghost" size="sm" className="gap-2" aria-label="Share">
            <Share className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
    </>
  );
}

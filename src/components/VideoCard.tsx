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
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { enhanceAuthorData } from '@/lib/generateProfile';
import { formatDistanceToNow } from 'date-fns';
import type { ParsedVideoData } from '@/types/video';
import type { NostrMetadata } from '@nostrify/nostrify';
import { cn } from '@/lib/utils';
import { formatViewCount, formatDuration, formatCount } from '@/lib/formatUtils';
import { getSafeProfileImage } from '@/lib/imageUtils';

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
  viewCount,
  showComments = false,
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

  // Format time
  const timeAgo = formatDistanceToNow(new Date(video.createdAt * 1000), { addSuffix: true });

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
        <div className="flex-1">
          <Link to={profileUrl} className="font-semibold hover:underline">
            {displayName}
          </Link>
          <p className="text-sm text-muted-foreground">{timeAgo}</p>
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
            {video.loopCount && (
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
          
          {video.content && (
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
            className={cn('gap-2', isLiked && 'text-red-500')}
            onClick={onLike}
            aria-label="Like"
          >
            <Heart className={cn('h-4 w-4', isLiked && 'fill-current')} />
            {likeCount > 0 && <span className="text-xs">{formatCount(likeCount)}</span>}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn('gap-2', isReposted && 'text-green-500')}
            onClick={onRepost}
            aria-label="Repost"
          >
            <Repeat2 className="h-4 w-4" />
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

          {/* Spacer */}
          <div className="ml-auto" />

          {/* View link to dedicated page */}
          <Link
            to={`/video/${video.id}`}
            className="text-xs text-primary hover:underline flex items-center gap-1"
            aria-label="View video page"
          >
            <Eye className="h-3 w-3" /> View
          </Link>
        </div>
      </CardContent>
    </Card>
    </>
  );
}

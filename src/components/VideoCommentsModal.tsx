// ABOUTME: Modal component for displaying video and comments side by side
// ABOUTME: Responsive layout - desktop side-by-side, mobile stacked, uses CommentsSection for NIP-22 comments

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/VideoPlayer';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { cn } from '@/lib/utils';
import type { ParsedVideoData } from '@/types/video';
import { VIDEO_KIND } from '@/types/video';
import type { NostrEvent } from '@nostrify/nostrify';

interface VideoCommentsModalProps {
  video: ParsedVideoData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoadingComments?: boolean;
  className?: string;
}

export function VideoCommentsModal({
  video,
  open,
  onOpenChange,
  isLoadingComments = false,
  className,
}: VideoCommentsModalProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size for responsive layout
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Convert ParsedVideoData to NostrEvent for comments
  const videoEvent: NostrEvent = {
    id: video.id,
    pubkey: video.pubkey,
    created_at: video.createdAt,
    kind: VIDEO_KIND, // NIP-71 addressable short video kind
    content: video.content,
    tags: [
      ['url', video.videoUrl],
      ...(video.title ? [['title', video.title]] : []),
      ...video.hashtags.map(tag => ['t', tag]),
      ...(video.thumbnailUrl ? [['thumb', video.thumbnailUrl]] : []),
      ...(video.duration ? [['duration', video.duration.toString()]] : []),
    ],
    sig: '', // Signature would be provided by actual event
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          'max-w-7xl max-h-[90vh] p-0 gap-0',
          className
        )}
        data-testid="video-comments-modal"
        data-video-id={video.id}
      >
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {video.title || 'Video'}
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div 
          className={cn(
            'flex overflow-hidden',
            isMobile ? 'flex-col' : 'lg:flex-row',
            'min-h-0' // Important for proper scrolling
          )}
          data-testid="modal-content"
        >
          {/* Video Section */}
          <div className={cn(
            'bg-black flex items-center justify-center',
            isMobile ? 'w-full aspect-square' : 'w-1/2 h-[600px]'
          )}>
            <VideoPlayer
              videoId={video.id}
              src={video.videoUrl}
              hlsUrl={video.hlsUrl}
              poster={video.thumbnailUrl}
              className="w-full h-full object-contain"
              autoPlay={false} // Don't autoplay in modal
              muted={false} // Allow sound in modal
            />
          </div>

          {/* Comments Section */}
          <div className={cn(
            'flex flex-col',
            isMobile ? 'w-full flex-1' : 'w-1/2 h-[600px]'
          )}>
            {isLoadingComments ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading comments...</p>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden">
                <CommentsSection
                  root={videoEvent}
                  title="Comments"
                  emptyStateMessage="No comments yet"
                  emptyStateSubtitle="Be the first to comment on this video!"
                  className="h-full border-0 rounded-none"
                  data-testid="comments-section"
                  data-root-kind={VIDEO_KIND.toString()}
                  data-root-id={video.id}
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
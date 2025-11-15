// ABOUTME: Modal component for displaying comments only (no video replay)
// ABOUTME: Uses CommentsSection for NIP-22 comments

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { cn } from '@/lib/utils';
import type { ParsedVideoData } from '@/types/video';
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
  // Convert ParsedVideoData to NostrEvent for comments
  const videoEvent: NostrEvent = {
    id: video.id,
    pubkey: video.pubkey,
    created_at: video.createdAt,
    kind: video.kind, // NIP-71 video kind (21, 22, or 34236)
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
          'max-w-2xl w-full max-h-[90vh] p-0 gap-0',
          className
        )}
        data-testid="video-comments-modal"
        data-video-id={video.id}
      >
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            {video.title || 'Comments'}
          </DialogTitle>
        </DialogHeader>

        {/* Just Comments - No Video */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {isLoadingComments ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading comments...</p>
            </div>
          ) : (
            <CommentsSection
              root={videoEvent}
              title="Comments"
              emptyStateMessage="No comments yet"
              emptyStateSubtitle="Be the first to comment on this video!"
              className="border-0 rounded-none"
              data-testid="comments-section"
              data-root-kind={video.kind.toString()}
              data-root-id={video.id}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
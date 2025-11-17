// ABOUTME: Modal component for displaying comments only (no video replay)
// ABOUTME: Uses CommentsSection for NIP-22 comments

import { useMemo } from 'react';
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
  // Memoize the video event to prevent unnecessary re-renders and query refetches
  // This ensures the same object reference is used across renders
  // Use only stable primitive values as dependencies, not arrays
  const videoEvent: NostrEvent = useMemo(() => {
    const tags: string[][] = [
      ['url', video.videoUrl],
      ...(video.title ? [['title', video.title]] : []),
      ...video.hashtags.map(tag => ['t', tag]),
      ...(video.thumbnailUrl ? [['thumb', video.thumbnailUrl]] : []),
      ...(video.duration ? [['duration', video.duration.toString()]] : []),
    ];

    // For addressable events (kind 34236), include the 'd' tag which is required
    // Comments will reference this via the 'a' tag: `34236:pubkey:vineId`
    if (video.kind === 34236 && video.vineId) {
      tags.push(['d', video.vineId]);
    }

    return {
      id: video.id,
      pubkey: video.pubkey,
      created_at: video.createdAt,
      kind: video.kind, // Video kind (34236)
      content: video.content,
      tags,
      sig: '', // Signature would be provided by actual event
    };
  }, [video.id]); // Only depend on video.id which is stable and unique

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
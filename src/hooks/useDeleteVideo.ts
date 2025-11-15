// ABOUTME: Hook for deleting videos using NIP-09 deletion events
// ABOUTME: Creates Kind 5 events to request deletion of user's own content

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { deletionService } from '@/lib/deletionService';
import { debugLog, debugError } from '@/lib/debug';
import type { ParsedVideoData } from '@/types/video';

interface DeleteVideoParams {
  video: ParsedVideoData;
  reason?: string;
}

/**
 * Hook for deleting a video using NIP-09
 * Only the video author can delete their own content
 */
export function useDeleteVideo() {
  const { publishEvent } = useNostrPublish();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ video, reason }: DeleteVideoParams) => {
      // Verify user owns the video
      if (!user?.pubkey) {
        throw new Error('Not logged in');
      }

      if (user.pubkey !== video.pubkey) {
        throw new Error('You can only delete your own videos');
      }

      debugLog('[useDeleteVideo] Deleting video:', video.id);

      // Create NIP-09 deletion event
      const deletionEvent = await publishEvent({
        kind: 5, // NIP-09 deletion event
        content: reason || 'Video deleted by author',
        tags: [
          ['e', video.id], // Event being deleted
          ['k', String(video.kind)], // Kind of event being deleted
          ...(video.vineId ? [['a', `${video.kind}:${video.pubkey}:${video.vineId}`]] : []), // Addressable event reference if available
        ],
      });

      if (!deletionEvent) {
        throw new Error('Failed to create deletion event');
      }

      debugLog('[useDeleteVideo] Deletion event published:', deletionEvent.id);

      // Process the deletion event immediately in local service
      deletionService.processDeletionEvent(deletionEvent);

      return {
        deleteEventId: deletionEvent.id,
        deletedVideoId: video.id,
      };
    },
    onSuccess: (data, variables) => {
      // Show success toast
      toast({
        title: 'Video Deleted',
        description: 'Your delete request has been sent to relays. The video will be hidden from feeds.',
      });

      // Invalidate all video queries to refresh feeds
      queryClient.invalidateQueries({ queryKey: ['video-events'] });
      queryClient.invalidateQueries({ queryKey: ['video'] });
      queryClient.invalidateQueries({ queryKey: ['profile-videos'] });
      queryClient.invalidateQueries({ queryKey: ['hashtag-videos'] });
      queryClient.invalidateQueries({ queryKey: ['trending-videos'] });
      queryClient.invalidateQueries({ queryKey: ['discovery-videos'] });

      debugLog('[useDeleteVideo] Video deleted successfully:', data.deletedVideoId);
    },
    onError: (error: Error) => {
      debugError('[useDeleteVideo] Error deleting video:', error);
      
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete video. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for checking if user can delete a video
 */
export function useCanDeleteVideo(video?: ParsedVideoData): boolean {
  const { user } = useCurrentUser();

  if (!user?.pubkey || !video) return false;
  
  // User can only delete their own videos
  return user.pubkey === video.pubkey;
}

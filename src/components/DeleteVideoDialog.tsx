// ABOUTME: Dialog for confirming video deletion with NIP-09 explanation
// ABOUTME: Warns users about relay behavior and deletion permanence

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import type { ParsedVideoData } from '@/types/video';

interface DeleteVideoDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  video: ParsedVideoData;
  isDeleting?: boolean;
}

export function DeleteVideoDialog({
  open,
  onClose,
  onConfirm,
  video,
  isDeleting = false,
}: DeleteVideoDialogProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined);
    setReason(''); // Reset for next time
  };

  const handleCancel = () => {
    setReason(''); // Reset
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Video?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 text-left">
            <p>
              Are you sure you want to delete this video?
            </p>

            <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
              <p className="font-semibold">How deletion works:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>A delete request will be sent to all relays</li>
                <li>Most relays will stop sharing your video</li>
                <li>Some relays may still retain the content</li>
                <li>The video will be hidden from feeds in this app</li>
              </ul>
            </div>

            {video.title && (
              <p className="text-sm">
                <span className="font-semibold">Video:</span> {video.title}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="delete-reason" className="text-sm">
                Reason for deletion (optional)
              </Label>
              <Textarea
                id="delete-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Published by accident, incorrect content, etc."
                className="resize-none"
                rows={3}
                disabled={isDeleting}
              />
              <p className="text-xs text-muted-foreground">
                This reason will be visible to relay operators
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete Video'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

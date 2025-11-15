// ABOUTME: Component to indicate when a video has been deleted via NIP-09
// ABOUTME: Shows deletion reason and timestamp instead of video content

import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import type { DeletionEvent } from '@/lib/deletionService';

interface DeletedVideoIndicatorProps {
  deletionInfo: DeletionEvent;
  className?: string;
}

export function DeletedVideoIndicator({ deletionInfo, className }: DeletedVideoIndicatorProps) {
  const timeAgo = formatDistanceToNow(new Date(deletionInfo.timestamp * 1000), { addSuffix: true });

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
          <div className="rounded-full bg-muted p-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Content Deleted</h3>
            <p className="text-sm text-muted-foreground">
              This video was deleted by its author {timeAgo}
            </p>
          </div>

          {deletionInfo.reason && (
            <div className="bg-muted/50 rounded-lg p-3 max-w-md">
              <p className="text-xs text-muted-foreground font-semibold mb-1">
                Deletion Reason:
              </p>
              <p className="text-sm">
                {deletionInfo.reason}
              </p>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              The author requested deletion via NIP-09.
            </p>
            <p>
              Some relays may still have the content.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

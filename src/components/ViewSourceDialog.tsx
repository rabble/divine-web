// ABOUTME: Dialog for viewing raw Nostr event JSON source
// ABOUTME: Shows formatted event data for debugging and transparency

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Code, Copy, Check, AlertCircle } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';
import type { ParsedVideoData } from '@/types/video';

interface ViewSourceDialogProps {
  open: boolean;
  onClose: () => void;
  event?: NostrEvent;
  video?: ParsedVideoData;
  title?: string;
}

// Helper function to reconstruct a basic NostrEvent from ParsedVideoData
function reconstructEvent(video: ParsedVideoData): Partial<NostrEvent> {
  return {
    id: video.id,
    pubkey: video.pubkey,
    created_at: video.createdAt,
    kind: video.kind,
    content: video.content,
    tags: [
      // Reconstruct basic tags that we know about
      ...(video.hashtags.map(tag => ['t', tag])),
      ...(video.title ? [['title', video.title]] : []),
      ...(video.videoUrl ? [['url', video.videoUrl]] : []),
      ...(video.thumbnailUrl ? [['thumb', video.thumbnailUrl]] : []),
      ...(video.duration ? [['duration', video.duration.toString()]] : []),
    ],
    // Note: sig field is not available in parsed data
  };
}

export function ViewSourceDialog({
  open,
  onClose,
  event,
  video,
  title = 'Event Source',
}: ViewSourceDialogProps) {
  const [copied, setCopied] = useState(false);

  // Use provided event, or originalEvent from video data, or reconstruct from video data
  const displayEvent = event || video?.originalEvent || (video ? reconstructEvent(video) : null);
  const isReconstructed = !event && !video?.originalEvent && !!video;

  if (!displayEvent) {
    return null;
  }

  const eventJson = JSON.stringify(displayEvent, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(eventJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Raw Nostr event JSON (NIP-01 format)
          </DialogDescription>
        </DialogHeader>

        {isReconstructed && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-900 dark:text-yellow-200">
              <strong>Note:</strong> This is a reconstructed representation from parsed data. The original event signature and some tags may not be included.
            </p>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <pre className="bg-muted/50 rounded-lg p-4 text-xs overflow-x-auto">
            <code className="font-mono text-foreground">{eventJson}</code>
          </pre>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            Event ID: <code className="bg-muted px-1 py-0.5 rounded">{displayEvent.id}</code>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy JSON
                </>
              )}
            </Button>
            <Button variant="default" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

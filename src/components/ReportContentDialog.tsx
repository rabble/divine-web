// ABOUTME: Dialog for reporting content violations (NIP-56)
// ABOUTME: Allows users to report videos, users, or other content

import { useState } from 'react';
import { useReportContent } from '@/hooks/useModeration';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Flag } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { ContentFilterReason, REPORT_REASON_LABELS } from '@/types/moderation';

interface ReportContentDialogProps {
  open: boolean;
  onClose: () => void;
  eventId?: string;
  pubkey?: string;
  contentType?: 'video' | 'user' | 'comment';
}

export function ReportContentDialog({
  open,
  onClose,
  eventId,
  pubkey,
  contentType = 'video'
}: ReportContentDialogProps) {
  const { toast } = useToast();
  const reportContent = useReportContent();

  const [reason, setReason] = useState<ContentFilterReason>(ContentFilterReason.SPAM);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!eventId && !pubkey) {
      toast({
        title: 'Error',
        description: 'No content specified for reporting',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await reportContent.mutateAsync({
        eventId,
        pubkey,
        reason,
        details: details.trim() || undefined
      });

      toast({
        title: 'Report submitted',
        description: 'Thank you for helping keep the community safe',
      });

      // Reset and close
      setReason(ContentFilterReason.SPAM);
      setDetails('');
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDialogTitle = () => {
    switch (contentType) {
      case 'user':
        return 'Report User';
      case 'comment':
        return 'Report Comment';
      default:
        return 'Report Video';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!isSubmitting && !newOpen) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            Help us understand what's wrong with this {contentType}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Why are you reporting this {contentType}?</Label>
            <RadioGroup value={reason} onValueChange={(value) => setReason(value as ContentFilterReason)}>
              <div className="space-y-2">
                {Object.entries(REPORT_REASON_LABELS).map(([value, label]) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={value} id={value} />
                    <Label htmlFor={value} className="font-normal cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Additional details (optional)</Label>
            <Textarea
              id="details"
              placeholder="Provide any additional context that might be helpful..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="bg-muted p-3 rounded-md text-sm">
            <p className="text-muted-foreground">
              Reports are published as NIP-56 events and may be reviewed by community moderators.
              Your report will be anonymous and linked to your Nostr identity.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Flag className="h-4 w-4 mr-2" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

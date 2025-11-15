// ABOUTME: Dialog for editing user profile with form fields for metadata
// ABOUTME: Wraps EditProfileForm in a responsive dialog with close handling

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EditProfileForm } from '@/components/EditProfileForm';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
  const handleSuccess = () => {
    // Close the dialog after successful profile update
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information. Changes will be published to the Nostr network.
          </DialogDescription>
        </DialogHeader>
        <EditProfileForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}

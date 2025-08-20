// ABOUTME: Dialog component for creating new video lists
// ABOUTME: Allows users to create lists with name, description, and optional cover image

import { useState } from 'react';
import { useCreateVideoList } from '@/hooks/useVideoLists';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, List } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface CreateListDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateListDialog({ open, onClose }: CreateListDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const createList = useCreateVideoList();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a list name',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create lists',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const listId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      await createList.mutateAsync({
        id: listId,
        name,
        description: description || undefined,
        image: imageUrl || undefined,
        videoCoordinates: [] // Start with empty list
      });

      toast({
        title: 'List created',
        description: `"${name}" has been created successfully`,
      });

      // Navigate to the new list
      navigate(`/list/${user.pubkey}/${listId}`);
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create list. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => !isCreating && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New List</DialogTitle>
          <DialogDescription>
            Create a collection of your favorite videos to share with others
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">List Name *</Label>
            <Input
              id="name"
              placeholder="My Favorite Vines"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="A collection of hilarious and creative videos..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Cover Image URL</Label>
            <Input
              id="image"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={isCreating}
            />
            {imageUrl && (
              <div className="mt-2 rounded overflow-hidden border">
                <img
                  src={imageUrl}
                  alt="Cover preview"
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || isCreating}
              className="flex-1"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <List className="h-4 w-4 mr-2" />
                  Create List
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
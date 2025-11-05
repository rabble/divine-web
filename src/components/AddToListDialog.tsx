// ABOUTME: Dialog component for adding videos to lists
// ABOUTME: Allows users to select existing lists or create new ones

import { useState } from 'react';
import { useVideoLists, useAddVideoToList, useCreateVideoList } from '@/hooks/useVideoLists';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useQueryClient } from '@tanstack/react-query';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, List, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { VIDEO_KIND } from '@/types/video';

interface AddToListDialogProps {
  videoId: string;
  videoPubkey: string;
  open: boolean;
  onClose: () => void;
}

export function AddToListDialog({
  videoId,
  videoPubkey,
  open,
  onClose
}: AddToListDialogProps) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userLists, isLoading: listsLoading } = useVideoLists(user?.pubkey);
  const addToList = useAddVideoToList();
  const createList = useCreateVideoList();

  const [selectedLists, setSelectedLists] = useState<Set<string>>(new Set());
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const videoCoordinate = `${VIDEO_KIND}:${videoPubkey}:${videoId}`;

  const handleAddToLists = async () => {
    if (selectedLists.size === 0) return;

    try {
      const promises = Array.from(selectedLists).map(listId =>
        addToList.mutateAsync({
          listId,
          videoCoordinate
        })
      );

      await Promise.all(promises);

      toast({
        title: 'Added to lists',
        description: `Video added to ${selectedLists.size} list${selectedLists.size !== 1 ? 's' : ''}`,
      });

      // Invalidate queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['videos-in-lists', videoId] });
      queryClient.invalidateQueries({ queryKey: ['video-lists'] });

      onClose();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to add video to lists',
        variant: 'destructive',
      });
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newListName.trim()) return;

    setIsCreating(true);
    try {
      const listId = newListName.toLowerCase().replace(/\s+/g, '-');
      
      await createList.mutateAsync({
        id: listId,
        name: newListName,
        description: newListDescription || undefined,
        videoCoordinates: [videoCoordinate]
      });

      toast({
        title: 'List created',
        description: `"${newListName}" created and video added`,
      });

      // Invalidate queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['videos-in-lists', videoId] });
      queryClient.invalidateQueries({ queryKey: ['video-lists'] });

      onClose();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create list',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={(newOpen) => {
        if (!newOpen) {
          onClose();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to List</DialogTitle>
            <DialogDescription>
              Please log in to add videos to lists
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to List</DialogTitle>
          <DialogDescription>
            Add this video to your lists or create a new one
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="existing" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Your Lists</TabsTrigger>
            <TabsTrigger value="new">Create New</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4">
            {listsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : userLists && userLists.length > 0 ? (
              <>
                <ScrollArea className="h-64 w-full rounded-md border p-4">
                  <div className="space-y-2">
                    {userLists.map((list) => {
                      const isInList = list.videoCoordinates.includes(videoCoordinate);
                      return (
                        <div
                          key={list.id}
                          className="flex items-center space-x-2 p-2 rounded hover:bg-accent"
                        >
                          <Checkbox
                            id={list.id}
                            checked={isInList || selectedLists.has(list.id)}
                            disabled={isInList}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedLists(new Set([...selectedLists, list.id]));
                              } else {
                                const newSet = new Set(selectedLists);
                                newSet.delete(list.id);
                                setSelectedLists(newSet);
                              }
                            }}
                          />
                          <Label
                            htmlFor={list.id}
                            className="flex-1 cursor-pointer flex items-center gap-2"
                          >
                            <List className="h-4 w-4" />
                            <span>{list.name}</span>
                            {isInList && (
                              <Check className="h-3 w-3 text-green-600 ml-auto" />
                            )}
                          </Label>
                          <span className="text-xs text-muted-foreground">
                            {list.videoCoordinates.length} videos
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                <Button
                  onClick={handleAddToLists}
                  disabled={selectedLists.size === 0 || addToList.isPending}
                  className="w-full"
                >
                  {addToList.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Add to {selectedLists.size} List{selectedLists.size !== 1 ? 's' : ''}
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <List className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  You don't have any lists yet
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    const tabsList = document.querySelector('[value="new"]') as HTMLElement;
                    tabsList?.click();
                  }}
                >
                  Create your first list
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="list-name">List Name</Label>
              <Input
                id="list-name"
                placeholder="My Favorite Vines"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="list-description">Description (optional)</Label>
              <Textarea
                id="list-description"
                placeholder="A collection of my favorite videos..."
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={handleCreateAndAdd}
              disabled={!newListName.trim() || isCreating}
              className="w-full"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create List & Add Video
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
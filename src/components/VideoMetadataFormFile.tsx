// ABOUTME: Form for adding metadata to uploaded video files
// ABOUTME: Handles video preview and publishing for file uploads

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Hash, Loader2 } from 'lucide-react';
import { useUploadFile } from '@/hooks/useUploadFile';
import { usePublishVideo } from '@/hooks/usePublishVideo';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/useToast';

interface VideoMetadataFormFileProps {
  file: File;
  previewUrl: string;
  duration: number;
  onCancel: () => void;
  onPublished: () => void;
}

export function VideoMetadataFormFile({
  file,
  previewUrl,
  duration,
  onCancel,
  onPublished,
}: VideoMetadataFormFileProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const { mutateAsync: publishVideo, isPending: isPublishing } = usePublishVideo();

  const isProcessing = isUploading || isPublishing;

  // Set up video preview
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = previewUrl;
      videoRef.current.loop = true;
      videoRef.current.play().catch(console.error);
    }
  }, [previewUrl]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Add hashtag
  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '').toLowerCase();
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
      setHashtagInput('');
    }
  };

  // Remove hashtag
  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag));
  };

  // Handle hashtag input key press
  const handleHashtagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault();
      addHashtag();
    }
  };

  // Publish video
  const handlePublish = async () => {
    if (!title.trim()) {
      toast({
        title: 'Title Required',
        description: 'Please add a title for your video',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploadProgress(0);

      // Step 1: Upload video to Blossom
      setUploadProgress(10);
      const tags = await uploadFile(file);
      setUploadProgress(80);

      // Extract URL from tags
      const urlTag = tags.find((tag: string[]) => tag[0] === 'url');
      if (!urlTag || !urlTag[1]) {
        throw new Error('Upload succeeded but no URL returned');
      }

      const videoUrl = urlTag[1];

      // Step 2: Publish to Nostr
      await publishVideo({
        content: description,
        videoUrl,
        title: title.trim(),
        duration: Math.round(duration), // Already in seconds
        hashtags,
        kind: 34236, // Legacy short video kind for backward compatibility
      });
      setUploadProgress(100);

      toast({
        title: 'Video Published!',
        description: 'Your vine has been published successfully',
      });

      onPublished();
    } catch (error) {
      console.error('Failed to publish video:', error);
      toast({
        title: 'Publishing Failed',
        description: error instanceof Error ? error.message : 'Failed to publish video',
        variant: 'destructive',
      });
      setUploadProgress(0);
    }
  };

  const currentProgress = isUploading 
    ? uploadProgress // Upload progress
    : isPublishing 
    ? 80 + (20) // Publishing is the final 20%
    : 0;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Video Preview */}
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls
        />
      </div>

      {/* Metadata Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            placeholder="Give your vine a title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            disabled={isProcessing}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {title.length}/100 characters
          </p>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Add a description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            disabled={isProcessing}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {description.length}/500 characters
          </p>
        </div>

        <div>
          <Label htmlFor="hashtags">Hashtags</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Hash className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="hashtags"
                placeholder="Add hashtags (press Enter)"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={handleHashtagKeyPress}
                onBlur={addHashtag}
                className="pl-8"
                disabled={isProcessing}
              />
            </div>
            <Button
              onClick={addHashtag}
              variant="outline"
              size="sm"
              disabled={!hashtagInput.trim() || isProcessing}
            >
              Add
            </Button>
          </div>

          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {hashtags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  #{tag}
                  <button
                    onClick={() => removeHashtag(tag)}
                    className="ml-1 hover:text-destructive"
                    disabled={isProcessing}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">File:</span>
            <span className="font-medium truncate ml-2">{file.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-medium">{duration.toFixed(1)}s</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Size:</span>
            <span className="font-medium">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        </div>

        {/* Upload Progress */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {isUploading ? 'Uploading video...' : 'Publishing to Nostr...'}
              </span>
              <span className="font-medium">{Math.round(currentProgress)}%</span>
            </div>
            <Progress value={currentProgress} className="h-2" />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="border-t p-4 space-y-2">
        <Button
          onClick={handlePublish}
          className="w-full"
          disabled={isProcessing || !title.trim()}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isUploading ? 'Uploading...' : 'Publishing...'}
            </>
          ) : (
            'Publish Vine'
          )}
        </Button>

        <Button
          onClick={onCancel}
          variant="outline"
          className="w-full"
          disabled={isProcessing}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

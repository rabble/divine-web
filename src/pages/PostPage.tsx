// ABOUTME: Post creation page for uploading videos and publishing to Nostr
// ABOUTME: Allows users to upload video files, add metadata, and publish to the network

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { X, Hash, Loader2, Upload, Video } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useVideoUpload } from '@/hooks/useVideoUpload';
import { usePublishVideo } from '@/hooks/usePublishVideo';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

type PostStep = 'upload' | 'metadata';

interface VideoSegment {
  blob: Blob;
  blobUrl: string;
}

export function PostPage() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const [step, setStep] = useState<PostStep>('upload');
  const [videoSegments, setVideoSegments] = useState<VideoSegment[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);

  const { uploadVideo, uploadProgress, isUploading } = useVideoUpload();
  const { mutateAsync: publishVideo, isPending: isPublishing } = usePublishVideo();

  const isProcessing = isUploading || isPublishing;

  // Detect desktop
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Set up video preview
  useEffect(() => {
    if (videoPreviewRef.current && videoSegments.length > 0) {
      videoPreviewRef.current.src = videoSegments[0].blobUrl;
      videoPreviewRef.current.loop = true;
      videoPreviewRef.current.play().catch(console.error);
    }
  }, [videoSegments]);

  // Require login
  if (!user) {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4">
        <div className="text-center space-y-4">
          <Video className="h-16 w-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Login Required</h1>
          <p className="text-muted-foreground">
            You need to be logged in to create posts
          </p>
          <Button onClick={() => navigate('/')}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload an MP4, WebM, or GIF file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Please upload a file smaller than 50MB',
        variant: 'destructive',
      });
      return;
    }

    // Create blob URL for preview
    const blobUrl = URL.createObjectURL(file);
    setVideoSegments([{ blob: file, blobUrl }]);
    setStep('metadata');
  };

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

  // Handle publish
  const handlePublish = async () => {
    if (!title.trim()) {
      toast({
        title: 'Title Required',
        description: 'Please add a title for your video',
        variant: 'destructive',
      });
      return;
    }

    if (videoSegments.length === 0) {
      toast({
        title: 'No Video',
        description: 'Please upload a video',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Step 1: Upload video to Blossom
      const uploadResult = await uploadVideo({
        segments: videoSegments,
        filename: `post-${Date.now()}.${videoSegments[0].blob.type.includes('gif') ? 'gif' : 'mp4'}`,
      });

      // Step 2: Publish to Nostr (using kind 34236 - addressable short video)
      await publishVideo({
        content: description,
        videoUrl: uploadResult.url,
        title,
        duration: uploadResult.duration / 1000, // Convert ms to seconds
        hashtags,
        kind: 34236, // Use kind 34236 for addressable short videos (NIP-71)
      });

      toast({
        title: 'Success!',
        description: 'Your post has been published',
      });

      // Clean up and navigate
      videoSegments.forEach(segment => {
        URL.revokeObjectURL(segment.blobUrl);
      });
      navigate('/');
    } catch (error) {
      console.error('Failed to publish post:', error);
      toast({
        title: 'Publishing Failed',
        description: error instanceof Error ? error.message : 'Failed to publish your post',
        variant: 'destructive',
      });
    }
  };

  // Handle cancel
  const handleCancel = () => {
    videoSegments.forEach(segment => {
      URL.revokeObjectURL(segment.blobUrl);
    });
    setVideoSegments([]);
    setTitle('');
    setDescription('');
    setHashtags([]);
    setHashtagInput('');
    setStep('upload');
    navigate(-1);
  };

  // Upload step
  if (step === 'upload') {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold">Create a Post</h1>
          <p className="text-muted-foreground">
            Upload a video to share with the network
          </p>

          <div className="space-y-3 pt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-16 text-lg"
              size="lg"
            >
              <Upload className="mr-2 h-5 w-5" />
              Select Video File
            </Button>
          </div>

          <div className="pt-6">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Metadata step
  if (step === 'metadata' && videoSegments.length > 0) {
    return (
      <div className={cn(
        "container mx-auto px-4",
        isDesktop ? "py-8 max-w-4xl" : "pt-4 pb-24"
      )}>
        <div className={cn(
          isDesktop ? "grid grid-cols-2 gap-8" : "space-y-6"
        )}>
          {/* Video Preview */}
          <div className={cn(
            "relative rounded-lg overflow-hidden bg-black",
            isDesktop ? "aspect-[9/16] max-h-[80vh]" : "aspect-[9/16] max-h-[60vh]"
          )}>
            <video
              ref={videoPreviewRef}
              className="w-full h-full object-contain"
              controls
              playsInline
            />
          </div>

          {/* Metadata Form */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">Add Details</h1>
              <p className="text-sm text-muted-foreground">
                Add a title, description, and hashtags to your post
              </p>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Give your video a title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                disabled={isProcessing}
              />
              <p className="text-xs text-muted-foreground">
                {title.length}/100 characters
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add a description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={500}
                disabled={isProcessing}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/500 characters
              </p>
            </div>

            {/* Hashtags */}
            <div className="space-y-2">
              <Label htmlFor="hashtags">Hashtags</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="hashtags"
                    placeholder="Add hashtag and press Enter"
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyDown={handleHashtagKeyPress}
                    onBlur={addHashtag}
                    className="pl-9"
                    disabled={isProcessing}
                  />
                </div>
                <Button
                  type="button"
                  onClick={addHashtag}
                  variant="outline"
                  disabled={isProcessing || !hashtagInput.trim()}
                >
                  Add
                </Button>
              </div>
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {hashtags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="pl-3 pr-1 py-1"
                    >
                      #{tag}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHashtag(tag)}
                        disabled={isProcessing}
                        className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {isUploading ? 'Uploading...' : 'Publishing...'}
                  </span>
                  <span className="font-medium">
                    {Math.round(uploadProgress * 100)}%
                  </span>
                </div>
                <Progress value={uploadProgress * 100} />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isProcessing || !title.trim()}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUploading ? 'Uploading...' : 'Publishing...'}
                  </>
                ) : (
                  'Publish'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default PostPage;

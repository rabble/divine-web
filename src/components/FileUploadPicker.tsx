// ABOUTME: File picker component for uploading pre-recorded videos
// ABOUTME: Validates video files and provides preview before upload

import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploadPickerProps {
  onFileSelected: (file: File, previewUrl: string, duration: number) => void;
  onCancel: () => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_DURATION = 6; // 6 seconds
const ACCEPTED_FORMATS = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const ACCEPTED_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi'];

export function FileUploadPicker({ onFileSelected, onCancel }: FileUploadPickerProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Validate video file
  const validateVideo = useCallback(async (file: File): Promise<{ isValid: boolean; duration: number; error?: string }> => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        duration: 0,
        error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
      };
    }

    // Check file type
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      return {
        isValid: false,
        duration: 0,
        error: 'Invalid file format. Please upload MP4, WebM, MOV, or AVI files.',
      };
    }

    // Check video duration
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;

        if (duration > MAX_DURATION) {
          resolve({
            isValid: false,
            duration,
            error: `Video duration (${duration.toFixed(1)}s) exceeds ${MAX_DURATION}s limit`,
          });
        } else {
          resolve({
            isValid: true,
            duration,
          });
        }
      };

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        resolve({
          isValid: false,
          duration: 0,
          error: 'Failed to load video file. File may be corrupted.',
        });
      };

      video.src = URL.createObjectURL(file);
    });
  }, []);

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsValidating(true);
    setValidationError(null);

    try {
      const validation = await validateVideo(file);

      if (!validation.isValid) {
        setValidationError(validation.error || 'Invalid video file');
        toast({
          title: 'Invalid Video',
          description: validation.error,
          variant: 'destructive',
        });
        setIsValidating(false);
        return;
      }

      // Create preview URL
      const url = URL.createObjectURL(file);

      setSelectedFile(file);
      setPreviewUrl(url);
      setVideoDuration(validation.duration);
      setValidationError(null);

      // Attach to video element for preview
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.load();
      }
    } catch (error) {
      console.error('File validation error:', error);
      setValidationError('An error occurred while validating the video');
      toast({
        title: 'Validation Error',
        description: 'Failed to validate video file',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Handle continue with selected file
  const handleContinue = () => {
    if (selectedFile && previewUrl) {
      onFileSelected(selectedFile, previewUrl, videoDuration);
    }
  };

  // Handle cancel/clear
  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setVideoDuration(0);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle drag and drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];

      // Simulate file input change event
      const event = {
        target: {
          files: [file],
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await handleFileSelect(event);
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    return `${seconds.toFixed(1)}s`;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Upload Video</h2>
        <Button
          onClick={onCancel}
          variant="ghost"
          size="icon"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selectedFile ? (
          // Upload zone
          <div className="max-w-2xl mx-auto space-y-6">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/10'
                  : 'border-primary/30 hover:border-primary/60 hover:bg-primary/5'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className={`h-16 w-16 mx-auto mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              <h3 className="text-lg font-semibold mb-2">
                {isDragging ? 'Drop video here' : 'Choose a video to upload'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Click to browse or drag and drop
              </p>
              <Button variant="outline" type="button">
                Select Video File
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Requirements */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Video Requirements:</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Maximum duration: {MAX_DURATION} seconds
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Maximum file size: {MAX_FILE_SIZE / 1024 / 1024}MB
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Accepted formats: MP4, WebM, MOV, AVI
                </li>
              </ul>
            </div>

            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {isValidating && (
              <Alert>
                <AlertDescription>Validating video file...</AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          // Preview zone
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                controls
                loop
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">File:</span>
                <span className="font-medium">{selectedFile.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Size:</span>
                <span className="font-medium">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{formatDuration(videoDuration)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Format:</span>
                <span className="font-medium">{selectedFile.type}</span>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                Your video meets all requirements and is ready to upload.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t p-4 space-y-2">
        {selectedFile ? (
          <>
            <Button
              onClick={handleContinue}
              className="w-full"
            >
              Continue to Add Details
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              className="w-full"
            >
              Choose Different Video
            </Button>
          </>
        ) : (
          <Button
            onClick={onCancel}
            variant="outline"
            className="w-full"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

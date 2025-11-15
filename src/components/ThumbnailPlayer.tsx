// ABOUTME: Thumbnail display component for video previews in feeds
// ABOUTME: Shows poster image with play button overlay and click-to-play functionality

import { useState } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/formatUtils';

interface ThumbnailPlayerProps {
  videoId: string;
  src: string;
  thumbnailUrl?: string;
  duration?: number;
  className?: string;
  onClick?: () => void;
  onError?: () => void;
}

export function ThumbnailPlayer({
  videoId: _videoId,
  src,
  thumbnailUrl,
  duration,
  className,
  onClick,
  onError,
}: ThumbnailPlayerProps) {
  const [thumbnailError, setThumbnailError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleThumbnailError = () => {
    setThumbnailError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleThumbnailLoad = () => {
    setIsLoading(false);
  };

  const handleClick = () => {
    onClick?.();
  };

  // Generate thumbnail from video if no thumbnail URL provided
  const effectiveThumbnailUrl = thumbnailUrl || generateThumbnailFromVideo(src);

  return (
    <div
      className={cn(
        'relative aspect-square bg-black cursor-pointer group overflow-hidden',
        'hover:scale-105 transition-transform duration-200',
        className
      )}
      data-testid="thumbnail-container"
      onClick={handleClick}
    >
      {/* Thumbnail image */}
      {!thumbnailError && effectiveThumbnailUrl ? (
        <img
          src={effectiveThumbnailUrl}
          alt="Video thumbnail"
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
          data-testid="video-thumbnail"
          onLoad={handleThumbnailLoad}
          onError={handleThumbnailError}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400"
          data-testid="thumbnail-placeholder"
        >
          <div className="text-center">
            <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Video Preview</p>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && !thumbnailError && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse" />
      )}

      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Button
          variant="ghost"
          size="icon"
          className="w-16 h-16 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm"
          data-testid="thumbnail-play-button"
          aria-label="Play video"
        >
          <Play className="h-8 w-8 ml-1" />
        </Button>
      </div>

      {/* Duration overlay */}
      {duration && (
        <div
          className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm"
          data-testid="thumbnail-duration"
        >
          {formatDuration(duration)}
        </div>
      )}
    </div>
  );
}

// Simple thumbnail generation utility
// Uses video URL fragment to hint browsers to load a frame at 0.1 seconds
// This provides basic thumbnail support when explicit thumbnails are unavailable
function generateThumbnailFromVideo(videoUrl: string): string | null {
  if (!videoUrl) return null;
  return `${videoUrl}#t=0.1`; // Browser hint to load frame at 0.1 seconds
}
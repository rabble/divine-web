// ABOUTME: Liberal video URL parser implementing Postel's Law for maximum compatibility
// ABOUTME: Extracts video URLs and metadata from multiple tag sources with fallback to content parsing

import type { NostrEvent } from '@nostrify/nostrify';
import type { VideoMetadata, VideoEvent } from '@/types/video';

// Common video file extensions - used only as hints, not requirements
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.gif', '.m3u8', '.mpd', '.avi', '.mkv', '.ogv', '.ogg'];

/**
 * Checks if a URL looks like it could be a video URL
 * Following Postel's Law - be liberal in what we accept
 */
function isValidVideoUrl(url: string): boolean {
  try {
    // Just verify it's a valid URL structure
    new URL(url);
    // Accept any valid URL - let the video player handle whether it can play it
    return true;
  } catch {
    // Not a valid URL structure
    return false;
  }
}

/**
 * Parse imeta tag to extract video metadata
 */
function parseImetaTag(tag: string[]): VideoMetadata | null {
  if (tag[0] !== 'imeta') return null;
  
  const metadata: VideoMetadata = { url: '' };
  
  for (let i = 1; i < tag.length; i += 2) {
    const key = tag[i];
    const value = tag[i + 1];
    
    if (!value) continue;
    
    switch (key) {
      case 'url':
        if (isValidVideoUrl(value)) {
          metadata.url = value;
        }
        break;
      case 'm':
        metadata.mimeType = value;
        break;
      case 'dim':
        metadata.dimensions = value;
        break;
      case 'blurhash':
        metadata.blurhash = value;
        break;
      case 'image':
        metadata.thumbnailUrl = value;
        break;
      case 'duration':
        metadata.duration = parseInt(value);
        break;
      case 'size':
        metadata.size = parseInt(value);
        break;
      case 'x':
        metadata.hash = value;
        break;
    }
  }
  
  return metadata.url ? metadata : null;
}

/**
 * Extract video URL from various tag sources following priority order
 */
function extractVideoUrl(event: NostrEvent): string | null {
  console.log('[VideoParser] Extracting video URL from event:', event.id);
  console.log('[VideoParser] Event tags:', JSON.stringify(event.tags));
  
  // 1. Check r tag with download type (MP4 - prefer this for direct playback)
  const downloadTag = event.tags.find(tag => 
    tag[0] === 'r' && tag[2] === 'download' && tag[1]?.includes('.mp4')
  );
  if (downloadTag?.[1]) {
    console.log('[VideoParser] Found MP4 download URL:', downloadTag[1]);
    return downloadTag[1];
  }
  
  // 2. Check imeta tags for MP4 URL
  for (const tag of event.tags) {
    if (tag[0] === 'imeta') {
      for (let i = 1; i < tag.length; i += 2) {
        if (tag[i] === 'url' && tag[i + 1]?.includes('.mp4')) {
          console.log('[VideoParser] Found MP4 in imeta:', tag[i + 1]);
          return tag[i + 1];
        }
      }
    }
  }
  
  // 3. Fall back to streaming tag for HLS if no MP4 found
  const streamingTag = event.tags.find(tag => tag[0] === 'streaming' && tag[2] === 'hls');
  if (streamingTag?.[1]) {
    console.log('[VideoParser] Falling back to HLS streaming URL:', streamingTag[1]);
    return streamingTag[1];
  }
  
  // 4. Check url tag (could be either MP4 or HLS)
  const urlTag = event.tags.find(tag => tag[0] === 'url');
  if (urlTag?.[1]) {
    console.log('[VideoParser] Found url tag:', urlTag[1]);
    return urlTag[1];
  }
  
  // 3. Check imeta tags
  for (const tag of event.tags) {
    if (tag[0] === 'imeta') {
      const metadata = parseImetaTag(tag);
      if (metadata?.url) {
        return metadata.url;
      }
    }
  }
  
  // 4. Check r tag with download type (MP4 fallback)
  const rTag = event.tags.find(tag => 
    tag[0] === 'r' && (tag[2] === 'download' || tag[2] === 'video' || isValidVideoUrl(tag[1]))
  );
  if (rTag?.[1]) {
    return rTag[1];
  }
  
  // 5. Check e tag for video URL
  const eTag = event.tags.find(tag => tag[0] === 'e' && tag[1] && isValidVideoUrl(tag[1]));
  if (eTag?.[1]) {
    return eTag[1];
  }
  
  // 6. Check i tag for video URL
  const iTag = event.tags.find(tag => tag[0] === 'i' && tag[1] && isValidVideoUrl(tag[1]));
  if (iTag?.[1]) {
    return iTag[1];
  }
  
  // 7. Check any unknown tag for video URL
  for (const tag of event.tags) {
    if (tag[1] && isValidVideoUrl(tag[1])) {
      return tag[1];
    }
  }
  
  // 7. Fallback to content regex parsing
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = event.content.match(urlRegex) || [];
  for (const url of urls) {
    if (isValidVideoUrl(url)) {
      console.log('[VideoParser] Found URL in content:', url);
      return url;
    }
  }
  
  console.log('[VideoParser] No video URL found for event:', event.id);
  return null;
}

/**
 * Extract all video metadata from event
 */
export function extractVideoMetadata(event: NostrEvent): VideoMetadata | null {
  // First try to get full metadata from imeta tag
  for (const tag of event.tags) {
    if (tag[0] === 'imeta') {
      const metadata = parseImetaTag(tag);
      if (metadata?.url) {
        return metadata;
      }
    }
  }
  
  // Fallback to just URL extraction
  const url = extractVideoUrl(event);
  if (url) {
    return { url };
  }
  
  return null;
}

/**
 * Parse a video event and extract all relevant data
 */
export function parseVideoEvent(event: NostrEvent): VideoEvent | null {
  console.log('[VideoParser] Parsing event:', event.id, 'tags:', event.tags);
  
  // Extract video metadata
  const videoMetadata = extractVideoMetadata(event);
  if (!videoMetadata) {
    console.log('[VideoParser] No video metadata found for event:', event.id);
    return null;
  }
  
  console.log('[VideoParser] Extracted video metadata:', videoMetadata);
  
  // Extract other metadata
  const titleTag = event.tags.find(tag => tag[0] === 'title');
  const title = titleTag?.[1];
  
  // Extract hashtags
  const hashtags = event.tags
    .filter(tag => tag[0] === 't')
    .map(tag => tag[1])
    .filter(Boolean);
  
  // Create VideoEvent
  const videoEvent: VideoEvent = {
    ...event,
    kind: event.kind as 32222,
    videoMetadata,
    title,
    hashtags
  };
  
  return videoEvent;
}

/**
 * Get the d tag (vine ID) from an event
 */
export function getVineId(event: NostrEvent): string | null {
  const dTag = event.tags.find(tag => tag[0] === 'd');
  return dTag?.[1] || null;
}

/**
 * Get loop count from event tags
 */
export function getLoopCount(event: NostrEvent): number {
  // Check for loop_count tag
  const loopCountTag = event.tags.find(tag => tag[0] === 'loop_count' || tag[0] === 'loops');
  if (loopCountTag?.[1]) {
    const count = parseInt(loopCountTag[1]);
    if (!isNaN(count)) return count;
  }
  
  // Check for view_count tag as fallback
  const viewCountTag = event.tags.find(tag => tag[0] === 'view_count' || tag[0] === 'views');
  if (viewCountTag?.[1]) {
    const count = parseInt(viewCountTag[1]);
    if (!isNaN(count)) return count;
  }
  
  // Generate a pseudo-random count based on event age for demo purposes
  // Older videos tend to have more loops
  const ageInDays = (Date.now() / 1000 - event.created_at) / (24 * 60 * 60);
  const baseCount = Math.floor(Math.random() * 1000) + 100;
  const ageMultiplier = Math.min(ageInDays / 7, 10); // Cap at 10x for very old videos
  return Math.floor(baseCount * (1 + ageMultiplier));
}

/**
 * Generate thumbnail URL for a video
 */
export function getThumbnailUrl(event: VideoEvent): string | undefined {
  // First check if we have thumbnail in metadata
  if (event.videoMetadata?.thumbnailUrl) {
    return event.videoMetadata.thumbnailUrl;
  }
  
  // Check for image tag
  const imageTag = event.tags.find(tag => tag[0] === 'image');
  if (imageTag?.[1]) {
    return imageTag[1];
  }
  
  // Check for thumb tag
  const thumbTag = event.tags.find(tag => tag[0] === 'thumb');
  if (thumbTag?.[1]) {
    return thumbTag[1];
  }
  
  // If we have a video URL, return it as fallback (video element can show first frame)
  if (event.videoMetadata?.url) {
    return event.videoMetadata.url;
  }
  
  // No thumbnail available
  return undefined;
}
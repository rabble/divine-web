// ABOUTME: Liberal video URL parser implementing Postel's Law for maximum compatibility
// ABOUTME: Extracts video URLs and metadata from multiple tag sources with fallback to content parsing

import type { NostrEvent } from '@nostrify/nostrify';
import type { VideoMetadata, VideoEvent } from '@/types/video';

// Video hosting whitelist for validation
const VIDEO_HOSTS = [
  'openvine.co',
  'nostr.build',
  'void.cat',
  'nostrcheck.me',
  'nostrage.com',
  'satellite.earth',
  'primal.net',
  'snort.social',
  'nostrfiles.dev',
  'nostrimg.com',
  'cdn.jb55.com',
  'media.nostr.band',
  'i.imgur.com',
  'media.tenor.com',
  'media.giphy.com'
];

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.gif', '.m3u8'];

/**
 * Checks if a URL is a valid video URL
 */
function isValidVideoUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();
    
    // Check if host is whitelisted
    const isWhitelistedHost = VIDEO_HOSTS.some(host => 
      hostname.includes(host) || hostname.endsWith(`.${host}`)
    );
    
    // Check if has video extension
    const hasVideoExtension = VIDEO_EXTENSIONS.some(ext => 
      pathname.endsWith(ext)
    );
    
    // Check if URL contains video-related paths
    const hasVideoPath = pathname.includes('/video') || 
                        pathname.includes('/mp4') || 
                        pathname.includes('/gif');
    
    return isWhitelistedHost || hasVideoExtension || hasVideoPath;
  } catch {
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
  // 1. Check imeta tags first (highest priority)
  for (const tag of event.tags) {
    if (tag[0] === 'imeta') {
      const metadata = parseImetaTag(tag);
      if (metadata?.url) {
        return metadata.url;
      }
    }
  }
  
  // 2. Check url tag
  const urlTag = event.tags.find(tag => tag[0] === 'url');
  if (urlTag?.[1] && isValidVideoUrl(urlTag[1])) {
    return urlTag[1];
  }
  
  // 3. Check r tag with video type annotation
  const rTag = event.tags.find(tag => 
    tag[0] === 'r' && (tag[2] === 'video' || isValidVideoUrl(tag[1]))
  );
  if (rTag?.[1]) {
    return rTag[1];
  }
  
  // 4. Check e tag for video URL
  const eTag = event.tags.find(tag => tag[0] === 'e' && tag[1] && isValidVideoUrl(tag[1]));
  if (eTag?.[1]) {
    return eTag[1];
  }
  
  // 5. Check i tag for video URL
  const iTag = event.tags.find(tag => tag[0] === 'i' && tag[1] && isValidVideoUrl(tag[1]));
  if (iTag?.[1]) {
    return iTag[1];
  }
  
  // 6. Check any unknown tag for video URL
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
      return url;
    }
  }
  
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
  // Extract video metadata
  const videoMetadata = extractVideoMetadata(event);
  if (!videoMetadata) {
    return null;
  }
  
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
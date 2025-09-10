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
 * imeta tags can be formatted as:
 * 1. Space-separated pairs in a single string: ["imeta", "url https://... m video/mp4 ..."]
 * 2. Alternating key-value pairs: ["imeta", "url", "https://...", "m", "video/mp4", ...]
 */
function parseImetaTag(tag: string[]): VideoMetadata | null {
  if (tag[0] !== 'imeta') return null;
  
  const metadata: VideoMetadata = { url: '' };
  
  // Check if it's a single string with space-separated pairs (common format)
  if (tag.length === 2 && typeof tag[1] === 'string') {
    const pairs = tag[1].split(' ');
    for (let i = 0; i < pairs.length; i += 2) {
      const key = pairs[i];
      const value = pairs[i + 1];
      
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
  } else {
    // Handle alternating key-value pairs format
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
  }
  
  return metadata.url ? metadata : null;
}

/**
 * Convert Divine CDN HLS URL to MP4 URL
 * Example: https://cdn.divine.video/xyz/manifest/video.m3u8 -> https://cdn.divine.video/xyz/downloads/default.mp4
 */
function convertHlsToMp4(hlsUrl: string): string | null {
  // Skip if already an MP4 URL
  if (hlsUrl.includes('.mp4')) {
    return null;
  }
  
  if (hlsUrl.includes('cdn.divine.video') && hlsUrl.includes('/manifest/video.m3u8')) {
    const mp4Url = hlsUrl.replace('/manifest/video.m3u8', '/downloads/default.mp4');
    console.log('[VideoParser] Converted HLS to MP4:', hlsUrl, '->', mp4Url);
    return mp4Url;
  }
  return null;
}

/**
 * Extract video URL from various tag sources following priority order
 */
function extractVideoUrl(event: NostrEvent): string | null {
  console.log('[VideoParser] Extracting video URL from event:', event.id);
  console.log('[VideoParser] Event tags:', JSON.stringify(event.tags));
  
  // 1. FIRST CHECK imeta tags - Divine videos ALWAYS have the MP4 URL here
  for (const tag of event.tags) {
    if (tag[0] === 'imeta') {
      const metadata = parseImetaTag(tag);
      if (metadata?.url) {
        console.log('[VideoParser] Found URL in imeta:', metadata.url);
        // Divine videos have the MP4 in imeta url field
        if (metadata.url.includes('.mp4') || metadata.url.includes('/downloads/')) {
          console.log('[VideoParser] Found MP4 in imeta, using it!');
          return metadata.url;
        }
      }
    }
  }
  
  // 2. Check r tag for video URL (fallback if no imeta)
  const rTag = event.tags.find(tag => tag[0] === 'r');
  if (rTag?.[1]) {
    console.log('[VideoParser] Found URL in r tag:', rTag[1]);
    // If it's clearly an MP4, return it immediately
    if (rTag[1].includes('.mp4') || rTag[1].includes('/mp4/')) {
      console.log('[VideoParser] It\'s an MP4, using it');
      return rTag[1];
    }
    // Try to convert HLS to MP4 for Divine CDN
    const mp4Url = convertHlsToMp4(rTag[1]);
    if (mp4Url) {
      return mp4Url;
    }
  }
  
  // 3. Check url tag (could be either MP4 or HLS)
  const urlTag = event.tags.find(tag => tag[0] === 'url');
  if (urlTag?.[1]) {
    console.log('[VideoParser] Found url tag:', urlTag[1]);
    // Try to convert HLS to MP4 for Divine CDN
    const mp4Url = convertHlsToMp4(urlTag[1]);
    if (mp4Url) {
      return mp4Url;
    }
    return urlTag[1];
  }
  
  // 4. Check streaming tag for HLS and convert to MP4
  const streamingTag = event.tags.find(tag => tag[0] === 'streaming' && tag[2] === 'hls');
  if (streamingTag?.[1]) {
    console.log('[VideoParser] Found HLS streaming URL:', streamingTag[1]);
    // Try to convert HLS to MP4 for Divine CDN
    const mp4Url = convertHlsToMp4(streamingTag[1]);
    if (mp4Url) {
      return mp4Url;
    }
    return streamingTag[1];
  }
  
  // 5. Fall back to r tag if we saved it earlier
  if (rTag?.[1]) {
    console.log('[VideoParser] Using r tag as fallback:', rTag[1]);
    return rTag[1];
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
  
  // Check e tag for video URL
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
 * Extract all available video URLs from event tags
 */
function extractAllVideoUrls(event: NostrEvent): string[] {
  const urls: string[] = [];
  console.log('[extractAllVideoUrls] Starting extraction for event:', event.id);
  
  // 1. All r tags (prefer MP4s, skip DASH/MPD)
  const rTags = event.tags.filter(tag => tag[0] === 'r' && tag[1]);
  for (const rTag of rTags) {
    if (rTag[1] && !urls.includes(rTag[1])) {
      console.log('[extractAllVideoUrls] Found r tag URL:', rTag[1]);
      
      // Skip DASH/MPD files - they don't work in browsers
      if (rTag[1].includes('.mpd') || rTag[2] === 'dash') {
        console.log('[extractAllVideoUrls] Skipping DASH/MPD URL (not supported in browsers)');
        continue;
      }
      
      // Put MP4s first
      if (rTag[1].includes('.mp4') || rTag[1].includes('/mp4/')) {
        urls.unshift(rTag[1]);
      } else {
        // Try to convert HLS to MP4 for Divine CDN
        const mp4Url = convertHlsToMp4(rTag[1]);
        if (mp4Url && !urls.includes(mp4Url)) {
          urls.unshift(mp4Url); // MP4 goes first
        }
        // Only add HLS as fallback, not DASH
        if (rTag[1].includes('.m3u8') || rTag[2] === 'hls') {
          urls.push(rTag[1]);
        }
      }
    }
  }
  
  // 2. HLS streaming URL
  const streamingTag = event.tags.find(tag => tag[0] === 'streaming' && tag[2] === 'hls');
  if (streamingTag?.[1] && !urls.includes(streamingTag[1])) {
    console.log('[extractAllVideoUrls] Found HLS streaming:', streamingTag[1]);
    // Try to convert HLS to MP4 for Divine CDN
    const mp4Url = convertHlsToMp4(streamingTag[1]);
    if (mp4Url && !urls.includes(mp4Url)) {
      urls.unshift(mp4Url); // MP4 goes first
    }
    urls.push(streamingTag[1]);
  }
  
  // 3. URL tag
  const urlTag = event.tags.find(tag => tag[0] === 'url');
  if (urlTag?.[1] && !urls.includes(urlTag[1])) {
    urls.push(urlTag[1]);
  }
  
  // 4. Check imeta tags for URLs and fallbacks
  for (const tag of event.tags) {
    if (tag[0] === 'imeta') {
      // Handle space-separated format
      if (tag.length === 2 && typeof tag[1] === 'string') {
        const pairs = tag[1].split(' ');
        for (let i = 0; i < pairs.length; i += 2) {
          const key = pairs[i];
          const value = pairs[i + 1];
          
          if (!value) continue;
          
          // Add main URL if not already included
          if (key === 'url' && isValidVideoUrl(value) && !urls.includes(value)) {
            urls.push(value);
          }
          // Add fallback URLs (skip DASH/MPD)
          if (key === 'fallback' && isValidVideoUrl(value) && !urls.includes(value)) {
            // Skip DASH/MPD files - they don't work in browsers
            if (!value.includes('.mpd')) {
              urls.push(value);
            }
          }
        }
      } else {
        // Handle alternating key-value pairs format
        for (let i = 1; i < tag.length; i += 2) {
          const key = tag[i];
          const value = tag[i + 1];
          
          if (!value) continue;
          
          // Add main URL if not already included
          if (key === 'url' && isValidVideoUrl(value) && !urls.includes(value)) {
            urls.push(value);
          }
          // Add fallback URLs (skip DASH/MPD)
          if (key === 'fallback' && isValidVideoUrl(value) && !urls.includes(value)) {
            // Skip DASH/MPD files - they don't work in browsers
            if (!value.includes('.mpd')) {
              urls.push(value);
            }
          }
        }
      }
    }
  }
  
  console.log(`[VideoParser] Found ${urls.length} video URLs for event ${event.id}:`, urls);
  return urls;
}

/**
 * Extract all video metadata from event
 */
export function extractVideoMetadata(event: NostrEvent): VideoMetadata | null {
  console.log('[extractVideoMetadata] Starting extraction for event:', event.id);
  
  // ALWAYS use extractVideoUrl to get the primary URL (it prioritizes MP4)
  const primaryUrl = extractVideoUrl(event);
  console.log('[extractVideoMetadata] Primary URL from extractVideoUrl:', primaryUrl);
  
  if (!primaryUrl) {
    console.log('[extractVideoMetadata] No primary URL found');
    return null;
  }
  
  // Get all available URLs for fallbacks
  const allUrls = extractAllVideoUrls(event);
  console.log('[extractVideoMetadata] All URLs found:', allUrls);
  
  // Try to get additional metadata from imeta tag (but NOT the URL)
  let metadata: VideoMetadata = { url: primaryUrl };
  for (const tag of event.tags) {
    if (tag[0] === 'imeta') {
      const imetaData = parseImetaTag(tag);
      console.log('[extractVideoMetadata] Parsed imeta tag for metadata:', imetaData);
      if (imetaData) {
        // Copy over metadata fields EXCEPT the URL (we use our extracted MP4 URL)
        metadata.mimeType = imetaData.mimeType || metadata.mimeType;
        metadata.dimensions = imetaData.dimensions || metadata.dimensions;
        metadata.blurhash = imetaData.blurhash || metadata.blurhash;
        metadata.thumbnailUrl = imetaData.thumbnailUrl || metadata.thumbnailUrl;
        metadata.duration = imetaData.duration || metadata.duration;
        metadata.size = imetaData.size || metadata.size;
        metadata.hash = imetaData.hash || metadata.hash;
      }
    }
  }
  
  // Add fallback URLs (excluding the primary URL and DASH/MPD)
  const fallbackUrls = allUrls.filter(u => u !== primaryUrl && !u.includes('.mpd'));
  if (fallbackUrls.length > 0) {
    metadata.fallbackUrls = fallbackUrls;
  }
  
  console.log('[extractVideoMetadata] Returning metadata with MP4 URL:', metadata);
  return metadata;
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
  
  console.log('[VideoParser] Extracted video metadata:', JSON.stringify(videoMetadata));
  
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
 * Get original Vine timestamp from event tags
 */
export function getOriginalVineTimestamp(event: NostrEvent): number | undefined {
  // Check for published_at tag (NIP-31 timestamp) - this is the original Vine creation time
  const publishedAtTag = event.tags.find(tag => tag[0] === 'published_at');
  if (publishedAtTag?.[1]) {
    const timestamp = parseInt(publishedAtTag[1]);
    if (!isNaN(timestamp)) {
      // Debug log for Vine events
      const vineIdTag = event.tags.find(tag => tag[0] === 'vine_id');
      if (vineIdTag) {
        console.log(`[getOriginalVineTimestamp] Vine ${vineIdTag[1]}: published_at=${timestamp} (${new Date(timestamp * 1000).toISOString()})`);
      }
      return timestamp;
    }
  }
  
  // Check for vine_created_at tag (fallback)
  const vineCreatedAtTag = event.tags.find(tag => tag[0] === 'vine_created_at' || tag[0] === 'original_created_at');
  if (vineCreatedAtTag?.[1]) {
    const timestamp = parseInt(vineCreatedAtTag[1]);
    if (!isNaN(timestamp)) return timestamp;
  }
  
  // Debug: log if no timestamp found for Vine
  const vineIdTag = event.tags.find(tag => tag[0] === 'vine_id');
  if (vineIdTag) {
    console.log(`[getOriginalVineTimestamp] Vine ${vineIdTag[1]}: No published_at tag found`);
  }
  
  return undefined;
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

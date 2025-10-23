// ABOUTME: Liberal video URL parser implementing Postel's Law for maximum compatibility
// ABOUTME: Extracts video URLs and metadata from multiple tag sources with fallback to content parsing

import type { NostrEvent } from '@nostrify/nostrify';
import type { VideoMetadata, VideoEvent, ProofModeData, ProofModeLevel } from '@/types/video';

// Common video file extensions - used only as hints, not requirements
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.gif', '.m3u8', '.mpd', '.avi', '.mkv', '.ogv', '.ogg'];

/**
 * Checks if a URL looks like it could be a video URL
 * Following Postel's Law - be liberal in what we accept
 */
function isValidVideoUrl(url: string): boolean {
  try {
    // Just verify it's a valid URL structure
    const parsedUrl = new URL(url);

    // Block vine.co URLs - they're CORS-blocked and the site is dead
    if (parsedUrl.hostname === 'vine.co' || parsedUrl.hostname.endsWith('.vine.co')) {
      return false;
    }

    // Accept any other valid URL - let the video player handle whether it can play it
    return true;
  } catch {
    // Not a valid URL structure
    return false;
  }
}

/**
 * Parse imeta tag to extract video metadata
 * Supports two formats:
 * Format 1: ["imeta", "url https://...", "m video/mp4"] - space-separated key-value
 * Format 2: ["imeta", "url", "https://...", "m", "video/mp4"] - separate elements
 */
function parseImetaTag(tag: string[]): VideoMetadata | null {
  if (tag[0] !== 'imeta') return null;

  const metadata: VideoMetadata = { url: '' };

  // Detect format: if tag[1] contains a space, it's Format 1
  const isFormat1 = tag[1] && tag[1].includes(' ');

  if (isFormat1) {
    // Format 1: "key value" pairs with space separation
    for (let i = 1; i < tag.length; i++) {
      const element = tag[i];
      if (!element || typeof element !== 'string') continue;

      const spaceIndex = element.indexOf(' ');
      if (spaceIndex === -1) continue;

      const key = element.substring(0, spaceIndex);
      const value = element.substring(spaceIndex + 1);

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
        case 'hls':
          metadata.hlsUrl = value;
          break;
      }
    }
  } else {
    // Format 2: separate elements for keys and values
    for (let i = 1; i < tag.length; i += 2) {
      const key = tag[i];
      const value = tag[i + 1];

      if (!key || !value || typeof key !== 'string' || typeof value !== 'string') continue;

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
        case 'hls':
          metadata.hlsUrl = value;
          break;
      }
    }
  }

  return metadata.url ? metadata : null;
}

/**
 * Convert Divine CDN HLS URL to MP4 URL (only for specific Divine CDN URLs)
 * Example: https://cdn.divine.video/xyz/manifest/video.m3u8 -> https://cdn.divine.video/xyz/downloads/default.mp4
 */
function convertHlsToMp4(hlsUrl: string): string | null {
  // Only convert Divine CDN URLs to avoid breaking other services
  if (hlsUrl.includes('cdn.divine.video') && hlsUrl.includes('/manifest/video.m3u8')) {
    return hlsUrl.replace('/manifest/video.m3u8', '/downloads/default.mp4');
  }
  return null;
}

/**
 * Extract video URL from NIP-71 compliant event following spec priority
 */
function extractVideoUrl(event: NostrEvent): string | null {
  // NIP-71: Primary video URL should be in `imeta` tag with url field
  for (const tag of event.tags) {
    if (tag[0] === 'imeta') {
      const metadata = parseImetaTag(tag);
      if (metadata?.url && isValidVideoUrl(metadata.url)) {
        return metadata.url;
      }
    }
  }

  // Fallback 1: Check 'url' tag (basic video URL)
  const urlTag = event.tags.find(tag => tag[0] === 'url' && tag[1] && isValidVideoUrl(tag[1]));
  if (urlTag?.[1]) {
    return urlTag[1];
  }

  // Fallback 2: Check 'r' tag for video reference
  const rTags = event.tags.filter(tag => tag[0] === 'r' && tag[1] && isValidVideoUrl(tag[1]));
  for (const rTag of rTags) {
    // Prioritize MP4 URLs over streaming formats
    if (rTag[1].includes('.mp4')) {
      return rTag[1];
    }
  }

  // Return first valid r tag if no MP4 found
  if (rTags.length > 0) {
    return rTags[0][1];
  }

  // Last resort: Parse URLs from content
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
 * Extract limited fallback video URLs from event tags (NIP-71 compliant)
 */
function extractAllVideoUrls(event: NostrEvent): string[] {
  const urls: string[] = [];

  // 1. All URLs from imeta tags (both MP4 and HLS)
  for (const tag of event.tags) {
    if (tag[0] === 'imeta') {
      const metadata = parseImetaTag(tag);
      if (metadata?.url && isValidVideoUrl(metadata.url) && !urls.includes(metadata.url)) {
        // Prioritize MP4 URLs over HLS
        if (metadata.url.includes('.mp4')) {
          urls.unshift(metadata.url);
        } else {
          urls.push(metadata.url);
        }
      }
    }
  }

  // 2. Only include MP4 r tags as fallbacks (skip streaming formats that cause issues)
  const rTags = event.tags.filter(tag => tag[0] === 'r' && tag[1] && isValidVideoUrl(tag[1]));
  for (const rTag of rTags) {
    if (rTag[1].includes('.mp4') && !urls.includes(rTag[1])) {
      urls.push(rTag[1]);
    }
  }

  // 3. URL tag as final fallback
  const urlTag = event.tags.find(tag => tag[0] === 'url' && tag[1] && isValidVideoUrl(tag[1]));
  if (urlTag?.[1] && !urls.includes(urlTag[1])) {
    urls.push(urlTag[1]);
  }

  // Limit to max 3 URLs to prevent cascade failures
  return urls.slice(0, 3);
}

/**
 * Extract video metadata from NIP-71 compliant event
 */
export function extractVideoMetadata(event: NostrEvent): VideoMetadata | null {
  const primaryUrl = extractVideoUrl(event);
  if (!primaryUrl) {
    return null;
  }

  let metadata: VideoMetadata = { url: primaryUrl };

  // Extract additional metadata from imeta tag
  for (const tag of event.tags) {
    if (tag[0] === 'imeta') {
      const imetaData = parseImetaTag(tag);
      if (imetaData) {
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

  // Extract HLS manifest URL (.m3u8) from all available sources
  const allUrls = extractAllVideoUrls(event);
  for (const url of allUrls) {
    if (url.includes('.m3u8') && !metadata.hlsUrl) {
      metadata.hlsUrl = url;
      break;
    }
  }

  // Add limited fallback URLs to prevent cascade failures
  const fallbackUrls = allUrls.filter(u => u !== primaryUrl && u !== metadata.hlsUrl);
  if (fallbackUrls.length > 0) {
    metadata.fallbackUrls = fallbackUrls;
  }

  return metadata;
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
    kind: event.kind as 34236, // NIP-71 Addressable Short Videos
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
      return timestamp;
    }
  }

  // Check for vine_created_at tag (fallback)
  const vineCreatedAtTag = event.tags.find(tag => tag[0] === 'vine_created_at' || tag[0] === 'original_created_at');
  if (vineCreatedAtTag?.[1]) {
    const timestamp = parseInt(vineCreatedAtTag[1]);
    if (!isNaN(timestamp)) return timestamp;
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

  // Return 0 for videos without explicit view counts
  return 0;
}

/**
 * Get original Vine like count from event tags
 */
export function getOriginalLikeCount(event: NostrEvent): number | undefined {
  const likesTag = event.tags.find(tag => tag[0] === 'likes');
  if (likesTag?.[1]) {
    const count = parseInt(likesTag[1]);
    if (!isNaN(count)) return count;
  }
  return undefined;
}

/**
 * Get original Vine repost count from event tags
 */
export function getOriginalRepostCount(event: NostrEvent): number | undefined {
  const repostsTag = event.tags.find(tag => tag[0] === 'reposts' || tag[0] === 'revines');
  if (repostsTag?.[1]) {
    const count = parseInt(repostsTag[1]);
    if (!isNaN(count)) return count;
  }
  return undefined;
}

/**
 * Get original Vine comment count from event tags
 */
export function getOriginalCommentCount(event: NostrEvent): number | undefined {
  const commentsTag = event.tags.find(tag => tag[0] === 'comments');
  if (commentsTag?.[1]) {
    const count = parseInt(commentsTag[1]);
    if (!isNaN(count)) return count;
  }
  return undefined;
}

/**
 * Extract ProofMode verification data from event tags
 */
export function getProofModeData(event: NostrEvent): ProofModeData | undefined {
  const versionTag = event.tags.find(tag => tag[0] === 'proof-version');
  const levelTag = event.tags.find(tag => tag[0] === 'verification-level');

  // If no ProofMode tags found, return undefined
  if (!versionTag && !levelTag) {
    return undefined;
  }

  // Parse verification level
  let level: ProofModeLevel = 'unverified';
  if (levelTag?.[1]) {
    const tagLevel = levelTag[1];
    if (tagLevel === 'verified_mobile' || tagLevel === 'verified_web' ||
        tagLevel === 'basic_proof' || tagLevel === 'unverified') {
      level = tagLevel;
    }
  }

  // Extract other proof data
  const manifestTag = event.tags.find(tag => tag[0] === 'proof-manifest');
  const attestationTag = event.tags.find(tag => tag[0] === 'device-attestation');
  const pubkeyTag = event.tags.find(tag => tag[0] === 'pgp-pubkey');
  const fingerprintTag = event.tags.find(tag => tag[0] === 'pgp-fingerprint');

  return {
    level,
    version: versionTag?.[1],
    manifest: manifestTag?.[1],
    deviceAttestation: attestationTag?.[1],
    pgpPubkey: pubkeyTag?.[1],
    pgpFingerprint: fingerprintTag?.[1],
  };
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

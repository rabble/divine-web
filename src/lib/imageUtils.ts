// ABOUTME: Utility functions for handling and sanitizing image URLs
// ABOUTME: Filters out broken/expired CDN URLs and provides fallbacks

/**
 * Check if an image URL is from a broken/expired CDN
 */
function isBrokenCDN(url: string): boolean {
  if (!url) return false;
  
  // List of known broken CDNs
  const brokenCDNs = [
    'v.cdn.vine.co', // Vine CDN - SSL cert expired
    'vine.co/r/avatars', // Old Vine avatar URLs
  ];
  
  return brokenCDNs.some(cdn => url.includes(cdn));
}

/**
 * Sanitize an image URL by filtering out broken CDNs
 * Returns undefined if the URL is from a broken CDN
 */
export function sanitizeImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  
  // Check if URL is from a broken CDN
  if (isBrokenCDN(url)) {
    return undefined; // Return undefined to trigger fallback
  }
  
  // Additional validation - ensure it's a valid URL
  try {
    new URL(url);
    return url;
  } catch {
    return undefined;
  }
}

/**
 * Get a safe profile image URL with fallback
 */
export function getSafeProfileImage(imageUrl: string | undefined): string | undefined {
  return sanitizeImageUrl(imageUrl);
}

/**
 * Get a safe thumbnail URL with fallback
 */
export function getSafeThumbnailUrl(thumbnailUrl: string | undefined): string | undefined {
  return sanitizeImageUrl(thumbnailUrl);
}
// ABOUTME: Hashtag parsing, formatting and utility functions for video events
// ABOUTME: Handles extraction of hashtags from content and tags, normalization and formatting

import type { ParsedVideoData } from '@/types/video';

/**
 * Parse all hashtags from a video (content + tags), normalized and deduplicated
 */
export function parseHashtags(video: ParsedVideoData): string[] {
  const contentHashtags = extractHashtagsFromContent(video.content);
  const tagHashtags = extractHashtagsFromTags(video.hashtags);
  
  // Combine and deduplicate
  const allHashtags = [...contentHashtags, ...tagHashtags];
  const uniqueHashtags = Array.from(new Set(allHashtags));
  
  return uniqueHashtags;
}

/**
 * Format hashtag with # prefix, avoiding double prefixes
 */
export function formatHashtag(hashtag: string): string {
  if (!hashtag) return '#';
  
  // Remove any existing # prefixes
  const cleaned = hashtag.replace(/^#+/, '');
  
  // Add single # prefix
  return `#${cleaned}`;
}

/**
 * Normalize hashtag by removing # prefix, lowercasing, and trimming
 */
export function normalizeHashtag(hashtag: string): string {
  return hashtag
    .trim()
    .replace(/^#+/, '') // Remove # prefixes
    .toLowerCase();
}

/**
 * Extract hashtags from text content using regex
 */
export function extractHashtagsFromContent(content: string): string[] {
  if (!content) return [];
  
  // Match hashtags: # followed by letters, numbers, underscores
  // Must contain at least one letter (not just numbers)
  const hashtagRegex = /#([a-zA-Z_][a-zA-Z0-9_]*)/g;
  const matches = Array.from(content.matchAll(hashtagRegex));
  
  // Extract the hashtag part (without #) and normalize
  const hashtags = matches
    .map(match => normalizeHashtag(match[1]))
    .filter(tag => tag.length > 0);
  
  // Deduplicate
  return Array.from(new Set(hashtags));
}

/**
 * Extract and normalize hashtags from tags array
 */
export function extractHashtagsFromTags(tags: string[]): string[] {
  if (!tags || tags.length === 0) return [];
  
  return tags
    .map(tag => normalizeHashtag(tag))
    .filter(tag => tag.length > 0);
}
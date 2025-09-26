// ABOUTME: Core video event types and interfaces for OpenVine/Divine Web
// ABOUTME: Defines the structure of Kind 34236 (NIP-71) video events and related metadata

import type { NostrEvent } from '@nostrify/nostrify';

export const VIDEO_KIND = 34236; // NIP-71 Addressable Short Videos
export const REPOST_KIND = 6;

export interface VideoMetadata {
  url: string;
  fallbackUrls?: string[];  // Alternative URLs to try if primary fails
  mimeType?: string;
  dimensions?: string;
  blurhash?: string;
  thumbnailUrl?: string;
  duration?: number;
  size?: number;
  hash?: string;
}

export interface VideoEvent extends NostrEvent {
  kind: typeof VIDEO_KIND;
  videoMetadata?: VideoMetadata;
  title?: string;
  hashtags?: string[];
  isRepost?: boolean;
  reposterPubkey?: string;
  repostedAt?: number;
  originalEvent?: NostrEvent;
}

export interface RepostEvent extends NostrEvent {
  kind: typeof REPOST_KIND;
  referencedEventAddress?: string;
  referencedAuthor?: string;
}

export interface ParsedVideoData {
  id: string;
  pubkey: string;
  createdAt: number;
  originalVineTimestamp?: number; // Original Vine posting time if available
  content: string;
  videoUrl: string;
  fallbackVideoUrls?: string[];  // Alternative URLs to try if primary fails
  thumbnailUrl?: string;
  title?: string;
  duration?: number;
  hashtags: string[];
  isRepost: boolean;
  reposterPubkey?: string;
  repostedAt?: number;
  vineId: string;
  loopCount?: number;
  likeCount?: number;
  repostCount?: number;
}
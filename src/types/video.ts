// ABOUTME: Core video event types and interfaces for OpenVine/Divine Web
// ABOUTME: Defines the structure of NIP-71 video events (kinds 21, 22) and related metadata

import type { NostrEvent } from '@nostrify/nostrify';

// NIP-71 Video Event Kinds
export const HORIZONTAL_VIDEO_KIND = 21; // NIP-71 Normal (horizontal) videos
export const SHORT_VIDEO_KIND = 22; // NIP-71 Short (vertical) videos
export const LEGACY_VIDEO_KIND = 34236; // Legacy kind for backward compatibility

// Array of all supported video kinds
export const VIDEO_KINDS = [HORIZONTAL_VIDEO_KIND, SHORT_VIDEO_KIND, LEGACY_VIDEO_KIND];

export const REPOST_KIND = 6;

// Deprecated: Use VIDEO_KINDS array instead
export const VIDEO_KIND = SHORT_VIDEO_KIND;

export interface VideoMetadata {
  url: string;
  fallbackUrls?: string[];  // Alternative URLs to try if primary fails
  hlsUrl?: string;  // HLS manifest URL (.m3u8) for adaptive bitrate streaming
  mimeType?: string;
  dimensions?: string;
  blurhash?: string;
  thumbnailUrl?: string;
  duration?: number;
  size?: number;
  hash?: string;
}

export interface VideoEvent extends NostrEvent {
  kind: typeof HORIZONTAL_VIDEO_KIND | typeof SHORT_VIDEO_KIND | typeof LEGACY_VIDEO_KIND;
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

export type ProofModeLevel = 'verified_mobile' | 'verified_web' | 'basic_proof' | 'unverified';

export interface ProofModeData {
  level: ProofModeLevel;
  version?: string;
  manifest?: string;
  deviceAttestation?: string;
  pgpPubkey?: string;
  pgpFingerprint?: string;
}

export interface ParsedVideoData {
  id: string;
  pubkey: string;
  kind: typeof HORIZONTAL_VIDEO_KIND | typeof SHORT_VIDEO_KIND | typeof LEGACY_VIDEO_KIND; // NIP-71 video kind
  createdAt: number;
  originalVineTimestamp?: number; // Original Vine posting time if available
  content: string;
  videoUrl: string;
  fallbackVideoUrls?: string[];  // Alternative URLs to try if primary fails
  hlsUrl?: string;  // HLS manifest URL (.m3u8) for adaptive bitrate streaming
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
  commentCount?: number;
  proofMode?: ProofModeData; // ProofMode verification data
}
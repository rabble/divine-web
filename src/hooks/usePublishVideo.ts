// ABOUTME: Hook for publishing NIP-71 video events (kinds 21, 22) to Nostr
// ABOUTME: Handles video metadata creation and event signing with proper tags

import { useMutation } from '@tanstack/react-query';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { SHORT_VIDEO_KIND, HORIZONTAL_VIDEO_KIND, LEGACY_VIDEO_KIND } from '@/types/video';
import type { VideoMetadata } from '@/types/video';

interface PublishVideoOptions {
  content: string;
  videoUrl: string;
  thumbnailUrl?: string;
  title?: string;
  duration?: number;
  dimensions?: string;
  hashtags?: string[];
  vineId?: string; // Optional, will generate if not provided
  kind?: typeof SHORT_VIDEO_KIND | typeof HORIZONTAL_VIDEO_KIND | typeof LEGACY_VIDEO_KIND; // Kind 22 (short/vertical), 21 (horizontal), or 34236 (legacy) - defaults to 22
}

/**
 * Generate a unique vine ID if not provided
 */
function generateVineId(): string {
  return `vine-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Build imeta tag from video metadata
 */
function buildImetaTag(metadata: VideoMetadata): string[] {
  const tag = ['imeta'];

  if (metadata.url) {
    tag.push('url', metadata.url);
  }
  if (metadata.mimeType) {
    tag.push('m', metadata.mimeType);
  }
  if (metadata.dimensions) {
    tag.push('dim', metadata.dimensions);
  }
  if (metadata.blurhash) {
    tag.push('blurhash', metadata.blurhash);
  }
  if (metadata.thumbnailUrl) {
    tag.push('image', metadata.thumbnailUrl);
  }
  if (metadata.duration !== undefined) {
    tag.push('duration', String(metadata.duration));
  }
  if (metadata.size !== undefined) {
    tag.push('size', String(metadata.size));
  }
  if (metadata.hash) {
    tag.push('x', metadata.hash);
  }

  return tag;
}

/**
 * Hook to publish video events
 */
export function usePublishVideo() {
  const { mutateAsync: publishEvent } = useNostrPublish();

  return useMutation({
    mutationFn: async (options: PublishVideoOptions) => {
      const {
        content,
        videoUrl,
        thumbnailUrl,
        title,
        duration = 6,
        dimensions = '480x480',
        hashtags = [],
        vineId = generateVineId(),
        kind = SHORT_VIDEO_KIND // Default to short vertical videos (kind 22)
      } = options;

      // Build tags according to NIP-71
      const tags: string[][] = [
        ['d', vineId], // Required for addressability
        ['title', title || 'Untitled'], // Required by NIP-71
        ['published_at', String(Math.floor(Date.now() / 1000))] // Required by NIP-71
      ];

      // Add video metadata (required imeta tag)
      const videoMetadata: VideoMetadata = {
        url: videoUrl,
        mimeType: videoUrl.endsWith('.gif') ? 'image/gif' : 'video/mp4',
        dimensions,
        duration,
        thumbnailUrl
      };

      tags.push(buildImetaTag(videoMetadata));

      // Add optional NIP-71 metadata
      if (duration !== undefined) {
        tags.push(['duration', String(duration)]);
      }

      // Add hashtags
      for (const hashtag of hashtags) {
        tags.push(['t', hashtag.replace(/^#/, '')]); // Remove # if present
      }

      // Add alt text for accessibility
      if (content) {
        tags.push(['alt', content]);
      }

      // Add client tag for attribution
      tags.push(['client', 'divine-web']);

      // Publish the event
      const event = await publishEvent({
        kind,
        content,
        tags
      });

      return event;
    }
  });
}

/**
 * Hook to publish a repost of a video
 */
export function useRepostVideo() {
  const { mutateAsync: publishEvent } = useNostrPublish();

  return useMutation({
    mutationFn: async ({
      originalPubkey,
      vineId,
      kind = SHORT_VIDEO_KIND
    }: {
      originalPubkey: string;
      vineId: string;
      kind?: typeof SHORT_VIDEO_KIND | typeof HORIZONTAL_VIDEO_KIND;
    }) => {
      const tags: string[][] = [
        ['a', `${kind}:${originalPubkey}:${vineId}`],
        ['p', originalPubkey],
        ['client', 'divine-web']
      ];

      const event = await publishEvent({
        kind: 6, // Repost kind
        content: '',
        tags
      });

      return event;
    }
  });
}
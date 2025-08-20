import { describe, it, expect } from 'vitest';
import { extractVideoMetadata, parseVideoEvent, getVineId, getThumbnailUrl } from './videoParser';
import { VIDEO_KIND } from '@/types/video';
import type { NostrEvent } from '@nostrify/nostrify';

describe('videoParser', () => {
  describe('extractVideoMetadata', () => {
    it('extracts video URL from imeta tag with full metadata', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [
          [
            'imeta',
            'url',
            'https://nostr.build/p/video123.mp4',
            'm',
            'video/mp4',
            'dim',
            '480x480',
            'duration',
            '6',
            'size',
            '1024000',
            'blurhash',
            'LJRVOl_4oJ',
            'image',
            'https://nostr.build/p/thumb123.jpg',
            'x',
            'abc123hash'
          ]
        ],
        content: '',
        sig: 'test-sig'
      };

      const metadata = extractVideoMetadata(event);
      
      expect(metadata).toEqual({
        url: 'https://nostr.build/p/video123.mp4',
        mimeType: 'video/mp4',
        dimensions: '480x480',
        duration: 6,
        size: 1024000,
        blurhash: 'LJRVOl_4oJ',
        thumbnailUrl: 'https://nostr.build/p/thumb123.jpg',
        hash: 'abc123hash'
      });
    });

    it('extracts video URL from url tag as fallback', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [
          ['url', 'https://void.cat/d/video456.webm']
        ],
        content: '',
        sig: 'test-sig'
      };

      const metadata = extractVideoMetadata(event);
      
      expect(metadata).toEqual({
        url: 'https://void.cat/d/video456.webm'
      });
    });

    it('extracts video URL from r tag with video annotation', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [
          ['r', 'https://nostrage.com/videos/abc.mp4', 'video']
        ],
        content: '',
        sig: 'test-sig'
      };

      const metadata = extractVideoMetadata(event);
      
      expect(metadata).toEqual({
        url: 'https://nostrage.com/videos/abc.mp4'
      });
    });

    it('extracts video URL from e tag', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [
          ['e', 'https://nostrcheck.me/media/video.mp4']
        ],
        content: '',
        sig: 'test-sig'
      };

      const metadata = extractVideoMetadata(event);
      
      expect(metadata).toEqual({
        url: 'https://nostrcheck.me/media/video.mp4'
      });
    });

    it('extracts video URL from i tag', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [
          ['i', 'https://satellite.earth/video/test.webm']
        ],
        content: '',
        sig: 'test-sig'
      };

      const metadata = extractVideoMetadata(event);
      
      expect(metadata).toEqual({
        url: 'https://satellite.earth/video/test.webm'
      });
    });

    it('extracts video URL from unknown tag', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [
          ['custom-tag', 'https://primal.net/uploads/video.gif']
        ],
        content: '',
        sig: 'test-sig'
      };

      const metadata = extractVideoMetadata(event);
      
      expect(metadata).toEqual({
        url: 'https://primal.net/uploads/video.gif'
      });
    });

    it('extracts video URL from content as last resort', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [],
        content: 'Check out this video: https://i.imgur.com/funny.gif Amazing!',
        sig: 'test-sig'
      };

      const metadata = extractVideoMetadata(event);
      
      expect(metadata).toEqual({
        url: 'https://i.imgur.com/funny.gif'
      });
    });

    it('handles GIF format URLs', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [
          ['url', 'https://media.giphy.com/media/abc123/giphy.gif']
        ],
        content: '',
        sig: 'test-sig'
      };

      const metadata = extractVideoMetadata(event);
      
      expect(metadata).toEqual({
        url: 'https://media.giphy.com/media/abc123/giphy.gif'
      });
    });

    it('validates video URLs against whitelist', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [
          ['url', 'https://malicious-site.com/notavideo.txt']
        ],
        content: '',
        sig: 'test-sig'
      };

      const metadata = extractVideoMetadata(event);
      
      expect(metadata).toBeNull();
    });

    it('returns null when no valid video URL found', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [
          ['title', 'My Video'],
          ['description', 'A test video']
        ],
        content: 'Just some text content without URLs',
        sig: 'test-sig'
      };

      const metadata = extractVideoMetadata(event);
      
      expect(metadata).toBeNull();
    });

    it('handles malformed imeta tags gracefully', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [
          ['imeta', 'url'], // Missing value
          ['imeta', 'url', 'invalid-url'], // Invalid URL
          ['imeta'] // Empty imeta tag
        ],
        content: '',
        sig: 'test-sig'
      };

      const metadata = extractVideoMetadata(event);
      
      expect(metadata).toBeNull();
    });

    it('prioritizes imeta over other tags', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [
          ['url', 'https://nostr.build/backup.mp4'],
          ['imeta', 'url', 'https://nostr.build/primary.mp4'],
          ['r', 'https://nostr.build/tertiary.mp4']
        ],
        content: '',
        sig: 'test-sig'
      };

      const metadata = extractVideoMetadata(event);
      
      expect(metadata?.url).toBe('https://nostr.build/primary.mp4');
    });

    it('handles URLs with video paths but not whitelisted domains', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [
          ['url', 'https://example.com/video/test.mp4']
        ],
        content: '',
        sig: 'test-sig'
      };

      const metadata = extractVideoMetadata(event);
      
      expect(metadata?.url).toBe('https://example.com/video/test.mp4');
    });

    it('handles URLs with video extensions but not whitelisted domains', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [
          ['url', 'https://random-site.com/file.webm']
        ],
        content: '',
        sig: 'test-sig'
      };

      const metadata = extractVideoMetadata(event);
      
      expect(metadata?.url).toBe('https://random-site.com/file.webm');
    });
  });

  describe('parseVideoEvent', () => {
    it('parses complete video event with all metadata', () => {
      const event: NostrEvent = {
        id: 'video-event-id',
        pubkey: 'author-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [
          ['d', 'vine-123'],
          ['imeta', 'url', 'https://nostr.build/video.mp4', 'duration', '6'],
          ['title', 'My Cool Video'],
          ['t', 'nostr'],
          ['t', 'video'],
          ['t', 'fun']
        ],
        content: 'Check out this amazing video!',
        sig: 'test-sig'
      };

      const videoEvent = parseVideoEvent(event);
      
      expect(videoEvent).toEqual({
        ...event,
        kind: VIDEO_KIND,
        videoMetadata: {
          url: 'https://nostr.build/video.mp4',
          duration: 6
        },
        title: 'My Cool Video',
        hashtags: ['nostr', 'video', 'fun']
      });
    });

    it('parses video event without optional fields', () => {
      const event: NostrEvent = {
        id: 'video-event-id',
        pubkey: 'author-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [
          ['d', 'vine-456'],
          ['url', 'https://void.cat/video.webm']
        ],
        content: '',
        sig: 'test-sig'
      };

      const videoEvent = parseVideoEvent(event);
      
      expect(videoEvent).toEqual({
        ...event,
        kind: VIDEO_KIND,
        videoMetadata: {
          url: 'https://void.cat/video.webm'
        },
        title: undefined,
        hashtags: []
      });
    });

    it('returns null when no valid video URL found', () => {
      const event: NostrEvent = {
        id: 'not-video-event',
        pubkey: 'author-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [
          ['d', 'vine-789'],
          ['title', 'No Video Here']
        ],
        content: 'Just text content',
        sig: 'test-sig'
      };

      const videoEvent = parseVideoEvent(event);
      
      expect(videoEvent).toBeNull();
    });

    it('filters out empty hashtags', () => {
      const event: NostrEvent = {
        id: 'video-event-id',
        pubkey: 'author-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [
          ['d', 'vine-999'],
          ['url', 'https://nostr.build/video.mp4'],
          ['t', 'valid'],
          ['t', ''], // Empty hashtag
          ['t', 'another-valid']
        ],
        content: '',
        sig: 'test-sig'
      };

      const videoEvent = parseVideoEvent(event);
      
      expect(videoEvent?.hashtags).toEqual(['valid', 'another-valid']);
    });
  });

  describe('getVineId', () => {
    it('extracts vine ID from d tag', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [
          ['d', 'my-vine-id-123']
        ],
        content: '',
        sig: 'test-sig'
      };

      const vineId = getVineId(event);
      
      expect(vineId).toBe('my-vine-id-123');
    });

    it('returns null when no d tag found', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [
          ['title', 'Some Video']
        ],
        content: '',
        sig: 'test-sig'
      };

      const vineId = getVineId(event);
      
      expect(vineId).toBeNull();
    });

    it('returns null when d tag is empty', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [
          ['d', '']
        ],
        content: '',
        sig: 'test-sig'
      };

      const vineId = getVineId(event);
      
      expect(vineId).toBeNull();
    });
  });

  describe('getThumbnailUrl', () => {
    it('returns thumbnail URL from video metadata', () => {
      const videoEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: 32222 as const,
        tags: [],
        content: '',
        sig: 'test-sig',
        videoMetadata: {
          url: 'https://nostr.build/video.mp4',
          thumbnailUrl: 'https://nostr.build/thumb.jpg'
        }
      };

      const thumbnailUrl = getThumbnailUrl(videoEvent);
      
      expect(thumbnailUrl).toBe('https://nostr.build/thumb.jpg');
    });

    it('returns thumbnail URL from image tag when metadata not available', () => {
      const videoEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: 32222 as const,
        tags: [
          ['image', 'https://nostr.build/image-tag-thumb.jpg']
        ],
        content: '',
        sig: 'test-sig',
        videoMetadata: {
          url: 'https://nostr.build/video.mp4'
        }
      };

      const thumbnailUrl = getThumbnailUrl(videoEvent);
      
      expect(thumbnailUrl).toBe('https://nostr.build/image-tag-thumb.jpg');
    });

    it('returns OpenVine API fallback when no thumbnail available', () => {
      const videoEvent = {
        id: 'event-123',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: 32222 as const,
        tags: [],
        content: '',
        sig: 'test-sig',
        videoMetadata: {
          url: 'https://nostr.build/video.mp4'
        }
      };

      const thumbnailUrl = getThumbnailUrl(videoEvent);
      
      expect(thumbnailUrl).toBe('https://api.openvine.co/thumbnails/event-123?size=medium');
    });

    it('prioritizes metadata thumbnail over image tag', () => {
      const videoEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: 32222 as const,
        tags: [
          ['image', 'https://nostr.build/fallback-thumb.jpg']
        ],
        content: '',
        sig: 'test-sig',
        videoMetadata: {
          url: 'https://nostr.build/video.mp4',
          thumbnailUrl: 'https://nostr.build/primary-thumb.jpg'
        }
      };

      const thumbnailUrl = getThumbnailUrl(videoEvent);
      
      expect(thumbnailUrl).toBe('https://nostr.build/primary-thumb.jpg');
    });
  });

  describe('URL validation edge cases', () => {
    it('handles URLs with subdomains of whitelisted hosts', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [
          ['url', 'https://cdn.nostr.build/video.mp4']
        ],
        content: '',
        sig: 'test-sig'
      };

      const metadata = extractVideoMetadata(event);
      
      expect(metadata?.url).toBe('https://cdn.nostr.build/video.mp4');
    });

    it('handles m3u8 video streams', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [
          ['url', 'https://example.com/stream.m3u8']
        ],
        content: '',
        sig: 'test-sig'
      };

      const metadata = extractVideoMetadata(event);
      
      expect(metadata?.url).toBe('https://example.com/stream.m3u8');
    });

    it('handles .mov video files', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [
          ['url', 'https://example.com/video.mov']
        ],
        content: '',
        sig: 'test-sig'
      };

      const metadata = extractVideoMetadata(event);
      
      expect(metadata?.url).toBe('https://example.com/video.mov');
    });

    it('rejects invalid URLs gracefully', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [
          ['url', 'not-a-valid-url']
        ],
        content: '',
        sig: 'test-sig'
      };

      const metadata = extractVideoMetadata(event);
      
      expect(metadata).toBeNull();
    });

    it('handles multiple URLs in content and picks first valid one', () => {
      const event: NostrEvent = {
        id: 'test-id',
        pubkey: 'test-pubkey',
        created_at: 1234567890,
        kind: VIDEO_KIND,
        tags: [],
        content: 'Check out https://malicious.com/bad.txt and also https://nostr.build/good.mp4',
        sig: 'test-sig'
      };

      const metadata = extractVideoMetadata(event);
      
      expect(metadata?.url).toBe('https://nostr.build/good.mp4');
    });
  });
});
import { describe, it, expect } from 'vitest';
import { 
  parseHashtags, 
  formatHashtag, 
  normalizeHashtag,
  extractHashtagsFromContent,
  extractHashtagsFromTags
} from './hashtag';
import type { ParsedVideoData } from '@/types/video';

describe('hashtag utilities', () => {
  describe('parseHashtags', () => {
    it('should extract hashtags from video content', () => {
      const video: ParsedVideoData = {
        id: 'test-1',
        pubkey: 'test-pubkey',
        createdAt: 1640995200,
        content: 'This is a video about #bitcoin and #nostr development',
        videoUrl: 'https://example.com/video.mp4',
        hashtags: [],
        isRepost: false,
        vineId: 'vine-1'
      };

      const result = parseHashtags(video);
      expect(result).toEqual(['bitcoin', 'nostr']);
    });

    it('should combine hashtags from content and tags array', () => {
      const video: ParsedVideoData = {
        id: 'test-1',
        pubkey: 'test-pubkey',
        createdAt: 1640995200,
        content: 'Video about #bitcoin',
        videoUrl: 'https://example.com/video.mp4',
        hashtags: ['nostr', 'development'],
        isRepost: false,
        vineId: 'vine-1'
      };

      const result = parseHashtags(video);
      expect(result).toEqual(['bitcoin', 'nostr', 'development']);
    });

    it('should deduplicate hashtags', () => {
      const video: ParsedVideoData = {
        id: 'test-1',
        pubkey: 'test-pubkey',
        createdAt: 1640995200,
        content: 'Video about #bitcoin and #nostr',
        videoUrl: 'https://example.com/video.mp4',
        hashtags: ['bitcoin', 'development'],
        isRepost: false,
        vineId: 'vine-1'
      };

      const result = parseHashtags(video);
      expect(result).toEqual(['bitcoin', 'nostr', 'development']);
    });

    it('should handle empty content and tags', () => {
      const video: ParsedVideoData = {
        id: 'test-1',
        pubkey: 'test-pubkey',
        createdAt: 1640995200,
        content: '',
        videoUrl: 'https://example.com/video.mp4',
        hashtags: [],
        isRepost: false,
        vineId: 'vine-1'
      };

      const result = parseHashtags(video);
      expect(result).toEqual([]);
    });
  });

  describe('formatHashtag', () => {
    it('should add # prefix if missing', () => {
      expect(formatHashtag('bitcoin')).toBe('#bitcoin');
      expect(formatHashtag('#bitcoin')).toBe('#bitcoin');
    });

    it('should not add double # prefix', () => {
      expect(formatHashtag('##bitcoin')).toBe('#bitcoin');
    });

    it('should handle empty strings', () => {
      expect(formatHashtag('')).toBe('#');
    });

    it('should preserve case', () => {
      expect(formatHashtag('Bitcoin')).toBe('#Bitcoin');
    });
  });

  describe('normalizeHashtag', () => {
    it('should remove # prefix and convert to lowercase', () => {
      expect(normalizeHashtag('#Bitcoin')).toBe('bitcoin');
      expect(normalizeHashtag('NOSTR')).toBe('nostr');
    });

    it('should trim whitespace', () => {
      expect(normalizeHashtag(' bitcoin ')).toBe('bitcoin');
      expect(normalizeHashtag(' #bitcoin ')).toBe('bitcoin');
    });

    it('should handle empty strings', () => {
      expect(normalizeHashtag('')).toBe('');
      expect(normalizeHashtag('#')).toBe('');
    });
  });

  describe('extractHashtagsFromContent', () => {
    it('should extract hashtags from text content', () => {
      const content = 'Check out this #bitcoin video about #nostr development!';
      expect(extractHashtagsFromContent(content)).toEqual(['bitcoin', 'nostr']);
    });

    it('should handle hashtags at different positions', () => {
      const content = '#first at start, middle #second, and #third at end';
      expect(extractHashtagsFromContent(content)).toEqual(['first', 'second', 'third']);
    });

    it('should handle hashtags with numbers and underscores', () => {
      const content = 'Tags: #web3 #nostr_dev #bitcoin21';
      expect(extractHashtagsFromContent(content)).toEqual(['web3', 'nostr_dev', 'bitcoin21']);
    });

    it('should not extract hashtags with only numbers', () => {
      const content = 'Numbers like #123 should not be hashtags';
      expect(extractHashtagsFromContent(content)).toEqual([]);
    });

    it('should handle empty content', () => {
      expect(extractHashtagsFromContent('')).toEqual([]);
    });

    it('should deduplicate hashtags in content', () => {
      const content = '#bitcoin is great, #bitcoin rocks, #bitcoin forever';
      expect(extractHashtagsFromContent(content)).toEqual(['bitcoin']);
    });
  });

  describe('extractHashtagsFromTags', () => {
    it('should return hashtags array as is', () => {
      const tags = ['bitcoin', 'nostr', 'development'];
      expect(extractHashtagsFromTags(tags)).toEqual(['bitcoin', 'nostr', 'development']);
    });

    it('should normalize hashtags from tags', () => {
      const tags = ['#bitcoin', 'NOSTR', ' development '];
      expect(extractHashtagsFromTags(tags)).toEqual(['bitcoin', 'nostr', 'development']);
    });

    it('should handle empty array', () => {
      expect(extractHashtagsFromTags([])).toEqual([]);
    });

    it('should filter out empty hashtags', () => {
      const tags = ['bitcoin', '', '  ', '#', 'nostr'];
      expect(extractHashtagsFromTags(tags)).toEqual(['bitcoin', 'nostr']);
    });
  });
});
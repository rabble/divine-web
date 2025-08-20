import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useVideoEvents } from './useVideoEvents';
import { TestApp } from '@/test/TestApp';
import { VIDEO_KIND, REPOST_KIND } from '@/types/video';
import type { NostrEvent } from '@nostrify/nostrify';

// Mock the useNostr hook
const mockQuery = vi.fn();
vi.mock('@nostrify/react', () => ({
  useNostr: () => ({ nostr: { query: mockQuery } })
}));

describe('useVideoEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createVideoEvent = (id: string, vineId: string, videoUrl: string): NostrEvent => ({
    id,
    pubkey: 'test-pubkey',
    created_at: 1234567890,
    kind: VIDEO_KIND,
    tags: [
      ['d', vineId],
      ['imeta', 'url', videoUrl],
      ['title', 'Test Video'],
      ['t', 'test']
    ],
    content: 'Test video content',
    sig: 'test-sig'
  });

  const createRepostEvent = (id: string, originalPubkey: string, originalVineId: string): NostrEvent => ({
    id,
    pubkey: 'reposter-pubkey',
    created_at: 1234567900,
    kind: REPOST_KIND,
    tags: [
      ['a', `${VIDEO_KIND}:${originalPubkey}:${originalVineId}`],
      ['p', originalPubkey]
    ],
    content: '',
    sig: 'repost-sig'
  });

  it('fetches and parses video events successfully', async () => {
    const videoEvent = createVideoEvent('video-1', 'vine-1', 'https://nostr.build/video1.mp4');
    mockQuery.mockResolvedValue([videoEvent]);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestApp>{children}</TestApp>
    );

    const { result } = renderHook(() => useVideoEvents(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0]).toEqual({
      id: 'video-1',
      pubkey: 'test-pubkey',
      createdAt: 1234567890,
      content: 'Test video content',
      videoUrl: 'https://nostr.build/video1.mp4',
      thumbnailUrl: 'https://api.openvine.co/thumbnails/video-1?size=medium',
      title: 'Test Video',
      duration: undefined,
      hashtags: ['test'],
      isRepost: false,
      vineId: 'vine-1'
    });
  });

  it('filters out invalid video events', async () => {
    const validEvent = createVideoEvent('video-1', 'vine-1', 'https://nostr.build/video1.mp4');
    const invalidEventNoD = {
      ...createVideoEvent('video-2', 'vine-2', 'https://nostr.build/video2.mp4'),
      tags: [['imeta', 'url', 'https://nostr.build/video2.mp4']]
    };
    const invalidEventNoVideo = {
      ...createVideoEvent('video-3', 'vine-3', ''),
      tags: [['d', 'vine-3']]
    };

    mockQuery.mockResolvedValue([validEvent, invalidEventNoD, invalidEventNoVideo]);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestApp>{children}</TestApp>
    );

    const { result } = renderHook(() => useVideoEvents(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].id).toBe('video-1');
  });

  it('handles reposts correctly', async () => {
    const originalVideo = createVideoEvent('original-video', 'vine-original', 'https://nostr.build/original.mp4');
    const repostEvent = createRepostEvent('repost-1', 'test-pubkey', 'vine-original');

    mockQuery.mockResolvedValue([originalVideo, repostEvent]);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestApp>{children}</TestApp>
    );

    const { result } = renderHook(() => useVideoEvents(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    
    const originalParsed = result.current.data!.find(v => !v.isRepost);
    expect(originalParsed).toBeDefined();
    expect(originalParsed!.isRepost).toBe(false);
    
    const repostParsed = result.current.data!.find(v => v.isRepost);
    expect(repostParsed).toBeDefined();
    expect(repostParsed!.isRepost).toBe(true);
    expect(repostParsed!.reposterPubkey).toBe('reposter-pubkey');
    expect(repostParsed!.repostedAt).toBe(1234567900);
    expect(repostParsed!.pubkey).toBe('test-pubkey');
    expect(repostParsed!.id).toBe('repost-1');
  });

  it('applies hashtag filter correctly', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestApp>{children}</TestApp>
    );

    renderHook(() => useVideoEvents({ 
      feedType: 'hashtag', 
      hashtag: 'nostr' 
    }), { wrapper });

    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledWith([{
        kinds: [VIDEO_KIND, REPOST_KIND],
        limit: 50,
        '#t': ['nostr']
      }], { signal: expect.any(AbortSignal) });
    });
  });

  it('applies profile filter correctly', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestApp>{children}</TestApp>
    );

    renderHook(() => useVideoEvents({ 
      feedType: 'profile', 
      pubkey: 'test-author-pubkey' 
    }), { wrapper });

    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledWith([{
        kinds: [VIDEO_KIND, REPOST_KIND],
        limit: 50,
        authors: ['test-author-pubkey']
      }], { signal: expect.any(AbortSignal) });
    });
  });

  it('handles empty results correctly', async () => {
    mockQuery.mockResolvedValue([]);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestApp>{children}</TestApp>
    );

    const { result } = renderHook(() => useVideoEvents(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePublishVideo, useRepostVideo } from './usePublishVideo';
import { TestApp } from '@/test/TestApp';
import { VIDEO_KIND } from '@/types/video';

// Mock the useNostrPublish hook
const mockPublishEvent = vi.fn();
vi.mock('./useNostrPublish', () => ({
  useNostrPublish: () => ({ mutateAsync: mockPublishEvent })
}));

describe('usePublishVideo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('publishes video event with required fields', async () => {
    const mockEvent = { id: 'published-event-id', pubkey: 'test-pubkey' };
    mockPublishEvent.mockResolvedValue(mockEvent);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestApp>{children}</TestApp>
    );

    const { result } = renderHook(() => usePublishVideo(), { wrapper });

    const publishOptions = {
      content: 'My awesome video!',
      videoUrl: 'https://nostr.build/video.mp4',
      title: 'Test Video'
    };

    await result.current.mutateAsync(publishOptions);

    expect(mockPublishEvent).toHaveBeenCalledWith({
      kind: VIDEO_KIND,
      content: 'My awesome video!',
      tags: expect.arrayContaining([
        ['d', expect.any(String)],
        ['client', 'openvine'],
        expect.arrayContaining(['imeta', 'url', 'https://nostr.build/video.mp4']),
        ['title', 'Test Video'],
        ['published_at', expect.any(String)],
        ['duration', '6'],
        ['alt', 'My awesome video!']
      ])
    });
  });

  it('generates vine ID when not provided', async () => {
    const mockEvent = { id: 'published-event-id' };
    mockPublishEvent.mockResolvedValue(mockEvent);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestApp>{children}</TestApp>
    );

    const { result } = renderHook(() => usePublishVideo(), { wrapper });

    await result.current.mutateAsync({
      content: 'Test content',
      videoUrl: 'https://nostr.build/video.mp4'
    });

    const publishCall = mockPublishEvent.mock.calls[0][0];
    const dTag = publishCall.tags.find((tag: string[]) => tag[0] === 'd');
    
    expect(dTag).toBeDefined();
    expect(dTag[1]).toContain('vine-');
  });

  it('uses custom vine ID when provided', async () => {
    const mockEvent = { id: 'published-event-id' };
    mockPublishEvent.mockResolvedValue(mockEvent);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestApp>{children}</TestApp>
    );

    const { result } = renderHook(() => usePublishVideo(), { wrapper });

    await result.current.mutateAsync({
      content: 'Test content',
      videoUrl: 'https://nostr.build/video.mp4',
      vineId: 'custom-vine-123'
    });

    const publishCall = mockPublishEvent.mock.calls[0][0];
    const dTag = publishCall.tags.find((tag: string[]) => tag[0] === 'd');
    
    expect(dTag[1]).toBe('custom-vine-123');
  });

  it('handles GIF format correctly', async () => {
    const mockEvent = { id: 'published-event-id' };
    mockPublishEvent.mockResolvedValue(mockEvent);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestApp>{children}</TestApp>
    );

    const { result } = renderHook(() => usePublishVideo(), { wrapper });

    await result.current.mutateAsync({
      content: 'Funny GIF!',
      videoUrl: 'https://media.giphy.com/funny.gif'
    });

    const publishCall = mockPublishEvent.mock.calls[0][0];
    const imetaTag = publishCall.tags.find((tag: string[]) => tag[0] === 'imeta');
    
    expect(imetaTag).toContain('m');
    expect(imetaTag).toContain('image/gif');
  });

  it('adds hashtags correctly', async () => {
    const mockEvent = { id: 'published-event-id' };
    mockPublishEvent.mockResolvedValue(mockEvent);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestApp>{children}</TestApp>
    );

    const { result } = renderHook(() => usePublishVideo(), { wrapper });

    await result.current.mutateAsync({
      content: 'Video with hashtags',
      videoUrl: 'https://nostr.build/video.mp4',
      hashtags: ['nostr', '#bitcoin', 'video']
    });

    const publishCall = mockPublishEvent.mock.calls[0][0];
    const tTags = publishCall.tags.filter((tag: string[]) => tag[0] === 't');
    
    expect(tTags).toHaveLength(3);
    expect(tTags[0]).toEqual(['t', 'nostr']);
    expect(tTags[1]).toEqual(['t', 'bitcoin']);
    expect(tTags[2]).toEqual(['t', 'video']);
  });
});

describe('useRepostVideo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('publishes repost event with correct format', async () => {
    const mockEvent = { id: 'repost-event-id', pubkey: 'reposter-pubkey' };
    mockPublishEvent.mockResolvedValue(mockEvent);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestApp>{children}</TestApp>
    );

    const { result } = renderHook(() => useRepostVideo(), { wrapper });

    await result.current.mutateAsync({
      originalPubkey: 'original-author-pubkey',
      vineId: 'original-vine-id'
    });

    expect(mockPublishEvent).toHaveBeenCalledWith({
      kind: 6,
      content: '',
      tags: [
        ['a', `${VIDEO_KIND}:original-author-pubkey:original-vine-id`],
        ['p', 'original-author-pubkey'],
        ['client', 'openvine']
      ]
    });
  });
});
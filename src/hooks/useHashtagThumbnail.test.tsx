import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHashtagThumbnail } from './useHashtagThumbnail';

vi.mock('@nostrify/react', () => {
  const nostr = { query: vi.fn() };
  return {
    useNostr: () => ({ nostr }),
    __nostrMock: nostr,
  };
});

// Helpers to craft minimal events
function makeEvent(overrides: Partial<any> = {}) {
  return {
    id: 'id1',
    pubkey: 'pub',
    created_at: Math.floor(Date.now() / 1000),
    kind: 32222,
    content: '',
    tags: [],
    sig: '',
    ...overrides,
  };
}

describe('useHashtagThumbnail', () => {
  const createWrapper = () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };

  it('lowercases tag filter and returns image from imeta', async () => {
    const { __nostrMock } = await import('@nostrify/react');
    const queryMock = __nostrMock as any;

    const event = makeEvent({
      tags: [
        ['d', 'vine-id-1'],
        ['t', 'SINGING'],
        ['imeta', 'url', 'https://example.com/video.mp4', 'image', 'https://example.com/thumb.jpg'],
      ],
    });

    queryMock.query = vi.fn(async (filters: any[]) => {
      // First call includes '#t' filter
      const f = filters[0];
      expect(f['#t']).toEqual(['singing']);
      return [event];
    });

    const { result } = renderHook(() => useHashtagThumbnail('SINGING'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe('https://example.com/thumb.jpg');
  });

  it('falls back to video url when no image/thumbnail', async () => {
    const { __nostrMock } = await import('@nostrify/react');
    const queryMock = __nostrMock as any;

    const event = makeEvent({
      tags: [
        ['d', 'vine-id-1'],
        ['t', 'cover'],
        ['imeta', 'url', 'https://example.com/video2.mp4'],
      ],
    });

    queryMock.query = vi.fn(async () => [event]);

    const { result } = renderHook(() => useHashtagThumbnail('cover'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe('https://example.com/video2.mp4');
  });

  it('broad-search fallback matches hashtag in content', async () => {
    const { __nostrMock } = await import('@nostrify/react');
    const queryMock = __nostrMock as any;

    const firstCall = vi.fn(async () => []); // No results for tag filter

    const broadEvent = makeEvent({
      content: 'Great song #singing today',
      tags: [
        ['d', 'vine-id-2'],
        ['imeta', 'url', 'https://example.com/video3.mp4', 'image', 'https://example.com/thumb3.jpg'],
      ],
    });

    const secondCall = vi.fn(async () => [broadEvent]);

    let callIndex = 0;
    queryMock.query = vi.fn(async (filters: any[]) => {
      callIndex++;
      return callIndex === 1 ? firstCall(filters) : secondCall(filters);
    });

    const { result } = renderHook(() => useHashtagThumbnail('SINGING'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe('https://example.com/thumb3.jpg');
    expect(firstCall).toHaveBeenCalledOnce();
    expect(secondCall).toHaveBeenCalledOnce();
  });
});


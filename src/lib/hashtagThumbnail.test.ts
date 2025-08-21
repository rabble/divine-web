import { describe, it, expect, vi } from 'vitest';
import { resolveHashtagThumbnail } from './hashtagThumbnail';

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

describe('resolveHashtagThumbnail', () => {
  const makeSignal = () => AbortSignal.timeout(2000);

  it('lowercases tag filter and returns image from imeta', async () => {
    const event = makeEvent({
      tags: [
        ['d', 'vine-id-1'],
        ['t', 'SINGING'],
        ['imeta', 'url', 'https://example.com/video.mp4', 'image', 'https://example.com/thumb.jpg'],
      ],
    });

    const nostr = {
      query: vi.fn(async (filters: any[]) => {
        const f = filters[0];
        expect(f['#t']).toEqual(['singing']);
        return [event];
      }),
    };

    const result = await resolveHashtagThumbnail(nostr as any, 'SINGING', makeSignal());
    expect(result).toBe('https://example.com/thumb.jpg');
  });

  it('falls back to video url when no image/thumbnail', async () => {
    const event = makeEvent({
      tags: [
        ['d', 'vine-id-1'],
        ['t', 'cover'],
        ['imeta', 'url', 'https://example.com/video2.mp4'],
      ],
    });

    const nostr = {
      query: vi.fn(async () => [event]),
    };

    const result = await resolveHashtagThumbnail(nostr as any, 'cover', makeSignal());
    expect(result).toBe('https://example.com/video2.mp4');
  });

  it('broad-search fallback matches hashtag in content', async () => {
    const firstCall = vi.fn(async () => []);
    const broadEvent = makeEvent({
      content: 'Great song #singing today',
      tags: [
        ['d', 'vine-id-2'],
        ['imeta', 'url', 'https://example.com/video3.mp4', 'image', 'https://example.com/thumb3.jpg'],
      ],
    });
    const secondCall = vi.fn(async () => [broadEvent]);

    let callIndex = 0;
    const nostr = {
      query: vi.fn(async (filters: any[]) => {
        callIndex++;
        return callIndex === 1 ? firstCall(filters) : secondCall(filters);
      }),
    };

    const result = await resolveHashtagThumbnail(nostr as any, 'SINGING', makeSignal());
    expect(result).toBe('https://example.com/thumb3.jpg');
    expect(firstCall).toHaveBeenCalledOnce();
    expect(secondCall).toHaveBeenCalledOnce();
  });
});


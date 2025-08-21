import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { VIDEO_KIND } from '@/types/video';
import { parseVideoEvent, getThumbnailUrl } from '@/lib/videoParser';
import { debugLog } from '@/lib/debug';

interface NostrClientLike {
  query: (filters: NostrFilter[], options: { signal: AbortSignal }) => Promise<NostrEvent[]>;
}

export async function resolveHashtagThumbnail(
  nostr: NostrClientLike,
  hashtag: string,
  signal: AbortSignal
): Promise<string | undefined> {
  const filter: NostrFilter & { ['#t']?: string[] } = {
    kinds: [VIDEO_KIND],
    limit: 5,
    ['#t']: [hashtag.toLowerCase()],
  } as any;

  debugLog('[resolveHashtagThumbnail] Querying for hashtag:', hashtag, 'with filter:', filter);
  let events = await nostr.query([filter], { signal });
  debugLog('[resolveHashtagThumbnail] Got', events.length, 'events for hashtag:', hashtag);

  const tryParseForThumbnail = (evs: NostrEvent[]) => {
    for (const e of evs) {
      const parsed = parseVideoEvent(e);
      if (!parsed) continue;
      const thumb = getThumbnailUrl(parsed);
      if (thumb) return thumb;
      if (parsed.videoMetadata?.url) return parsed.videoMetadata.url;
    }
    return undefined as string | undefined;
  };

  let thumb = tryParseForThumbnail(events);
  if (thumb) return thumb;

  // Fallback: broader query, then filter by content hashtag match
  try {
    const broadFilter: NostrFilter = { kinds: [VIDEO_KIND], limit: 30 } as any;
    const broadEvents = await nostr.query([broadFilter], { signal });
    const lower = hashtag.toLowerCase();
    const matched = broadEvents.filter((e) => (` ${e.content} `).toLowerCase().includes(`#${lower}`));
    thumb = tryParseForThumbnail(matched);
    if (thumb) return thumb;
  } catch {
    // Ignore fallback errors
  }

  return undefined;
}


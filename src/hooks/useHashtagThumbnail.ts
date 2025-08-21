import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { resolveHashtagThumbnail } from '@/lib/hashtagThumbnail';

export function useHashtagThumbnail(hashtag: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['hashtag-thumbnail', hashtag],
    queryFn: async (context) => {
      const signal = AbortSignal.any([
        context.signal,
        AbortSignal.timeout(8000),
      ]);

      return resolveHashtagThumbnail(nostr as any, hashtag, signal);
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

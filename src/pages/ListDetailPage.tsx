// ABOUTME: Page component for viewing individual video lists
// ABOUTME: Shows list details, videos in the list, and allows editing for list owners

import { useParams, useNavigate } from 'react-router-dom';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { VideoGrid } from '@/components/VideoGrid';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, List, Video, Clock, Edit, Share2 } from 'lucide-react';
import { genUserName } from '@/lib/genUserName';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/useToast';
import { getSafeProfileImage } from '@/lib/imageUtils';
import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { VIDEO_KINDS, type ParsedVideoData } from '@/types/video';
import { parseVideoEvent, getVineId, getThumbnailUrl, getOriginalVineTimestamp, getLoopCount, getProofModeData, getOriginalLikeCount, getOriginalRepostCount, getOriginalCommentCount } from '@/lib/videoParser';

interface VideoList {
  id: string;
  name: string;
  description?: string;
  image?: string;
  pubkey: string;
  createdAt: number;
  videoCoordinates: string[];
}

function parseVideoList(event: NostrEvent): VideoList | null {
  const dTag = event.tags.find(tag => tag[0] === 'd')?.[1];
  if (!dTag) return null;

  const title = event.tags.find(tag => tag[0] === 'title')?.[1] || dTag;
  const description = event.tags.find(tag => tag[0] === 'description')?.[1];
  const image = event.tags.find(tag => tag[0] === 'image')?.[1];
  
  const videoCoordinates = event.tags
    .filter(tag => {
      if (tag[0] !== 'a' || !tag[1]) return false;
      // Check if the coordinate starts with any of the supported video kinds
      return VIDEO_KINDS.some(kind => tag[1].startsWith(`${kind}:`));
    })
    .map(tag => tag[1]);

  return {
    id: dTag,
    name: title,
    description,
    image,
    pubkey: event.pubkey,
    createdAt: event.created_at,
    videoCoordinates
  };
}

async function fetchListVideos(
  nostr: { query: (filters: NostrFilter[], options: { signal: AbortSignal }) => Promise<NostrEvent[]> },
  coordinates: string[],
  signal: AbortSignal
): Promise<ParsedVideoData[]> {
  if (coordinates.length === 0) return [];

  // Parse coordinates to extract pubkeys and d-tags
  const filters: NostrFilter[] = [];
  const coordinateMap = new Map<string, { pubkey: string; dTag: string }>();

  coordinates.forEach(coord => {
    const [kind, pubkey, dTag] = coord.split(':');
    const kindNum = parseInt(kind, 10);
    if (VIDEO_KINDS.includes(kindNum) && pubkey && dTag) {
      coordinateMap.set(`${pubkey}:${dTag}`, { pubkey, dTag });
    }
  });

  // Group by pubkey for efficient querying
  const pubkeyGroups = new Map<string, string[]>();
  coordinateMap.forEach(({ pubkey, dTag }) => {
    if (!pubkeyGroups.has(pubkey)) {
      pubkeyGroups.set(pubkey, []);
    }
    pubkeyGroups.get(pubkey)!.push(dTag);
  });

  // Create filters for each pubkey group
  pubkeyGroups.forEach((dTags, pubkey) => {
    filters.push({
      kinds: VIDEO_KINDS,
      authors: [pubkey],
      '#d': dTags,
      limit: dTags.length
    });
  });

  if (filters.length === 0) return [];

  const events = await nostr.query(filters, { signal });
  
  // Parse and order videos according to list order
  const videoMap = new Map<string, ParsedVideoData>();
  
  events.forEach(event => {
    const vineId = getVineId(event);
    if (!vineId) return;
    
    const videoEvent = parseVideoEvent(event);
    if (!videoEvent?.videoMetadata?.url) return;
    
    const key = `${event.pubkey}:${vineId}`;
    videoMap.set(key, {
      id: event.id,
      pubkey: event.pubkey,
      kind: event.kind as 21 | 22 | 34236,
      createdAt: event.created_at,
      originalVineTimestamp: getOriginalVineTimestamp(event),
      content: event.content,
      videoUrl: videoEvent.videoMetadata.url,
      fallbackVideoUrls: videoEvent.videoMetadata?.fallbackUrls,
      hlsUrl: videoEvent.videoMetadata?.hlsUrl,
      thumbnailUrl: getThumbnailUrl(videoEvent),
      title: videoEvent.title,
      duration: videoEvent.videoMetadata?.duration,
      hashtags: videoEvent.hashtags || [],
      isRepost: false,
      vineId,
      loopCount: getLoopCount(event),
      likeCount: getOriginalLikeCount(event),
      repostCount: getOriginalRepostCount(event),
      commentCount: getOriginalCommentCount(event),
      proofMode: getProofModeData(event)
    });
  });

  // Return videos in the order they appear in the list
  const orderedVideos: ParsedVideoData[] = [];
  coordinates.forEach(coord => {
    const [_, pubkey, dTag] = coord.split(':');
    const key = `${pubkey}:${dTag}`;
    const video = videoMap.get(key);
    if (video) {
      orderedVideos.push(video);
    }
  });

  return orderedVideos;
}

export default function ListDetailPage() {
  const { pubkey, listId } = useParams<{ pubkey: string; listId: string }>();
  const navigate = useNavigate();
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  
  const isOwner = user?.pubkey === pubkey;

  // Fetch list details
  const { data: list, isLoading: listLoading } = useQuery({
    queryKey: ['list-detail', pubkey, listId],
    queryFn: async (context) => {
      if (!pubkey || !listId) throw new Error('Invalid list parameters');
      
      const signal = AbortSignal.any([
        context.signal,
        AbortSignal.timeout(5000)
      ]);

      const events = await nostr.query([{
        kinds: [30005],
        authors: [pubkey],
        '#d': [listId],
        limit: 1
      }], { signal });

      if (events.length === 0) {
        throw new Error('List not found');
      }

      return parseVideoList(events[0]);
    },
    enabled: !!pubkey && !!listId
  });

  // Fetch videos in the list
  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ['list-videos', pubkey, listId, list?.videoCoordinates],
    queryFn: async (context) => {
      if (!list) return [];
      
      const signal = AbortSignal.any([
        context.signal,
        AbortSignal.timeout(10000)
      ]);

      return fetchListVideos(nostr, list.videoCoordinates, signal);
    },
    enabled: !!list
  });

  // Fetch author info
  const author = useAuthor(pubkey || '');
  const authorMetadata = author.data?.metadata;
  const authorName = authorMetadata?.name || genUserName(pubkey || '');

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: list?.name || 'Video List',
          text: list?.description || 'Check out this video list',
          url
        });
      } catch {
        // User cancelled or error
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied',
        description: 'List link copied to clipboard',
      });
    }
  };

  if (listLoading) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-32" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <List className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">List not found</p>
            <p className="text-muted-foreground mb-4">
              This list may have been deleted or doesn't exist
            </p>
            <Button onClick={() => navigate('/lists')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse Lists
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/lists')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Lists
        </Button>

        {/* List Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <List className="h-6 w-6" />
                  {list.name}
                </CardTitle>
                {list.description && (
                  <CardDescription className="mt-2">
                    {list.description}
                  </CardDescription>
                )}
              </div>
              {list.image && (
                <img
                  src={list.image}
                  alt={list.name}
                  className="w-24 h-24 rounded object-cover ml-4"
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Author and stats */}
              <div className="space-y-2">
                <a
                  href={`/profile/${pubkey}`}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getSafeProfileImage(authorMetadata?.picture)} />
                    <AvatarFallback>{authorName[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{authorName}</p>
                    <p className="text-xs text-muted-foreground">List creator</p>
                  </div>
                </a>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Video className="h-4 w-4" />
                    <span>{list.videoCoordinates.length} videos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDistanceToNow(list.createdAt * 1000, { addSuffix: true })}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {isOwner && (
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit List
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Videos Grid */}
        {videosLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded" />
            ))}
          </div>
        ) : videos && videos.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">Videos in this list</h2>
            <VideoGrid
              videos={videos}
              navigationContext={{
                source: 'profile', // Lists are profile-related
                pubkey: list.pubkey,
              }}
            />
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                This list doesn't have any videos yet
              </p>
              {isOwner && (
                <p className="text-sm text-muted-foreground mt-2">
                  Browse videos and add them to your list
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
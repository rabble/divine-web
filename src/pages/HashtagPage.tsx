// ABOUTME: Enhanced hashtag feed page with video count, view toggles, and related hashtags
// ABOUTME: Filters videos by hashtag parameter from URL and shows hashtag statistics

import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Grid3X3, List, Hash } from 'lucide-react';
import { VideoFeed } from '@/components/VideoFeed';
import { useVideoEvents } from '@/hooks/useVideoEvents';
import { parseHashtags, formatHashtag } from '@/lib/hashtag';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type ViewMode = 'feed' | 'grid';

export function HashtagPage() {
  const { tag } = useParams<{ tag: string }>();
  const normalizedTag = (tag || '').toLowerCase();
  const [viewMode, setViewMode] = useState<ViewMode>('feed');

  console.log('[HashtagPage] Loading hashtag page for tag:', tag);

  // Get videos for this hashtag to calculate stats
  const { data: videos, isLoading: videosLoading } = useVideoEvents({
    feedType: 'hashtag',
    hashtag: normalizedTag,
    limit: 50 // Reduced limit for performance - stats will be approximate
  });

  // Get sample videos to find related hashtags
  const { data: allVideos } = useVideoEvents({
    feedType: 'discovery',
    limit: 100 // Reduced limit for performance - related hashtags will be based on sample
  });

  // Calculate related hashtags
  const relatedHashtags = useMemo(() => {
    if (!normalizedTag || !allVideos || allVideos.length === 0) return [];

    const hashtagCounts = new Map<string, number>();

    // Find videos that contain the current hashtag
    const relevantVideos = allVideos.filter(video => {
      const videoHashtags = parseHashtags(video);
      return videoHashtags.includes(normalizedTag);
    });

    // Count co-occurring hashtags (excluding current hashtag)
    relevantVideos.forEach(video => {
      const hashtags = parseHashtags(video);
      hashtags.forEach(hashtag => {
        if (hashtag.toLowerCase() !== normalizedTag) {
          hashtagCounts.set(hashtag, (hashtagCounts.get(hashtag) || 0) + 1);
        }
      });
    });

    // Convert to array, sort by frequency, and limit to 5
    return Array.from(hashtagCounts.entries())
      .map(([hashtag, count]) => ({ hashtag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [tag, allVideos]);

  if (!normalizedTag || normalizedTag.trim() === '') {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-xl font-semibold mb-4">Invalid Hashtag</h2>
              <p className="text-muted-foreground">
                No hashtag specified in the URL
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const videoCount = videos?.length || 0;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center gap-4">
          <Link
            to="/hashtags"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            ← Back to Discovery
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">#{tag}</h1>
              <p className="text-muted-foreground">Videos tagged with #{tag}</p>
            </div>
            <div className="text-right">
              {videosLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <div className="text-sm text-muted-foreground">
                  {videoCount} {videoCount === 1 ? 'video' : 'videos'}
                </div>
              )}
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center bg-muted rounded-lg p-1"
              role="group"
              aria-label="View mode selection"
            >
              <Button
                variant={viewMode === 'feed' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('feed')}
                className="text-xs"
                role="button"
                aria-pressed={viewMode === 'feed'}
              >
                <List className="h-4 w-4 mr-1" />
                Feed
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="text-xs"
                role="button"
                aria-pressed={viewMode === 'grid'}
              >
                <Grid3X3 className="h-4 w-4 mr-1" />
                Grid
              </Button>
            </div>
          </div>
        </div>

        {/* Related Hashtags */}
        {relatedHashtags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Related Hashtags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {relatedHashtags.map((item) => (
                  <Link
                    key={item.hashtag}
                    to={`/hashtag/${item.hashtag}`}
                  >
                    <Badge
                      variant="secondary"
                      className="hover:bg-accent cursor-pointer transition-colors"
                    >
                      {formatHashtag(item.hashtag)}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({item.count})
                      </span>
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {videoCount === 0 && !videosLoading && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No related hashtags</p>
            </CardContent>
          </Card>
        )}

        {/* Video Feed */}
        <VideoFeed 
          feedType="hashtag"
          hashtag={normalizedTag}
          data-testid="video-feed-hashtag"
          data-hashtag-testid={`feed-hashtag-${normalizedTag}`}
          className={cn(
            "space-y-6",
            viewMode === 'grid' && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 space-y-0"
          )}
        />
      </div>
    </div>
  );
}

export default HashtagPage;

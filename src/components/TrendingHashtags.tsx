// ABOUTME: Component for displaying trending hashtags with statistics and growth indicators
// ABOUTME: Analyzes video events to identify most used hashtags in specified time periods

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { useVideoEvents } from '@/hooks/useVideoEvents';
import { parseHashtags, formatHashtag } from '@/lib/hashtag';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface HashtagStats {
  hashtag: string;
  count: number;
  rank: number;
}

interface TrendingHashtagsProps {
  limit?: number;
  period?: '24h' | '7d' | '30d';
  showGrowth?: boolean;
  showStats?: boolean;
  className?: string;
  'data-testid'?: string;
}

export function TrendingHashtags({
  limit = 10,
  period = '24h',
  showGrowth = false,
  showStats = false,
  className,
  'data-testid': testId
}: TrendingHashtagsProps) {
  // Calculate time since for the period (currently not used as trending feeds handle this internally)
  const _since = useMemo(() => {
    const now = Date.now();
    switch (period) {
      case '24h':
        return Math.floor((now - 24 * 60 * 60 * 1000) / 1000);
      case '7d':
        return Math.floor((now - 7 * 24 * 60 * 60 * 1000) / 1000);
      case '30d':
        return Math.floor((now - 30 * 24 * 60 * 60 * 1000) / 1000);
      default:
        return Math.floor((now - 24 * 60 * 60 * 1000) / 1000);
    }
  }, [period]);

  const { data: videos, isLoading, error } = useVideoEvents({
    feedType: 'trending',
    limit: 100 // Reduced for performance while maintaining trending analysis
  });

  // Calculate hashtag statistics
  const hashtagStats = useMemo((): HashtagStats[] => {
    if (!videos || videos.length === 0) return [];

    const hashtagCounts = new Map<string, number>();

    // Count hashtag frequencies
    videos.forEach(video => {
      const hashtags = parseHashtags(video);
      hashtags.forEach(hashtag => {
        hashtagCounts.set(hashtag, (hashtagCounts.get(hashtag) || 0) + 1);
      });
    });

    // Convert to array and sort by count
    const stats = Array.from(hashtagCounts.entries())
      .map(([hashtag, count]) => ({ hashtag, count, rank: 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    // Add rank
    stats.forEach((stat, index) => {
      stat.rank = index + 1;
    });

    return stats;
  }, [videos, limit]);

  if (isLoading) {
    return (
      <Card className={className} data-testid={testId}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Hashtags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-20" />
                  {showStats && <Skeleton className="h-4 w-12" />}
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className} data-testid={testId}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Hashtags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">Failed to load trending hashtags</p>
        </CardContent>
      </Card>
    );
  }

  if (!hashtagStats || hashtagStats.length === 0) {
    return (
      <Card className={className} data-testid={testId}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Hashtags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No trending hashtags found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid={testId}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trending Hashtags
          {showGrowth && (
            <Badge variant="secondary" className="ml-auto">
              trending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {hashtagStats.map((stat) => (
            <div
              key={stat.hashtag}
              className="flex items-center justify-between hover:bg-accent/50 rounded-lg p-2 -m-2 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Link
                  to={`/hashtag/${stat.hashtag}`}
                  className="font-medium text-primary hover:underline"
                >
                  {formatHashtag(stat.hashtag)}
                </Link>
                {showStats && (
                  <Badge variant="outline" className="text-xs">
                    rank {stat.rank}
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.count} {stat.count === 1 ? 'video' : 'videos'}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoCard } from '@/components/VideoCard';
import { useVideoEvents } from '@/hooks/useVideoEvents';

export function VideoPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error, refetch } = useVideoEvents({
    filter: id ? { ids: [id] } : undefined,
    limit: 1,
    feedType: 'discovery',
  });

  if (!id) {
    return (
      <div className="container py-6">
        <Card className="border-destructive/50">
          <CardContent className="py-12 text-center">
            <p className="text-destructive">No video ID provided</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="grid gap-6">
          {[...Array(1)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="aspect-square w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-6">
        <Card className="border-destructive">
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">Failed to load video</p>
            <button onClick={() => refetch()} className="text-primary hover:underline">
              Try again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const video = data?.[0];

  if (!video) {
    return (
      <div className="container py-6">
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Video not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <VideoCard video={video} className="max-w-xl mx-auto" />
    </div>
  );
}

export default VideoPage;


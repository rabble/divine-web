// ABOUTME: Test page for debugging video playback with direct URLs
// ABOUTME: Used to verify if video URLs from Divine Video CDN are working

import { VideoPlayer } from '@/components/VideoPlayer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function TestVideoPage() {
  // Test URLs from the actual events
  const testVideos = [
    {
      id: 'test1',
      url: 'https://cdn.divine.video/ab92ecb0ab8c7e1eca94e516067bc132/manifest/video.m3u8',
      title: 'HLS Stream Test',
      type: 'HLS'
    },
    {
      id: 'test2', 
      url: 'https://cdn.divine.video/ab92ecb0ab8c7e1eca94e516067bc132/downloads/default.mp4',
      title: 'MP4 Download Test',
      type: 'MP4'
    },
    {
      id: 'test3',
      url: 'https://cdn.divine.video/f42d37110ebca5abc63427c2485b7e0c/manifest/video.m3u8',
      title: 'Another HLS Test',
      type: 'HLS'
    }
  ];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Video Player Test Page</h1>
      
      <div className="grid gap-6">
        {testVideos.map((video) => (
          <Card key={video.id}>
            <CardHeader>
              <CardTitle>{video.title} ({video.type})</CardTitle>
              <p className="text-sm text-muted-foreground break-all">{video.url}</p>
            </CardHeader>
            <CardContent>
              <div className="aspect-square max-w-md mx-auto bg-black">
                <VideoPlayer
                  videoId={video.id}
                  src={video.url}
                  className="w-full h-full"
                  onLoadStart={() => console.log(`[Test] ${video.title}: Load started`)}
                  onLoadedData={() => console.log(`[Test] ${video.title}: Data loaded successfully`)}
                  onError={() => console.log(`[Test] ${video.title}: Error loading video`)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="font-semibold mb-2">Debug Info:</h2>
        <p>Open browser console to see loading events</p>
        <p>Check Network tab for actual requests</p>
      </div>
    </div>
  );
}
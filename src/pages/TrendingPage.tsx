// ABOUTME: Trending feed page showing popular videos
// ABOUTME: Uses algorithm to determine trending content based on reactions/reposts

import { VideoFeed } from '@/components/VideoFeed';

export function TrendingPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Trending</h1>
          <p className="text-muted-foreground">Popular videos right now</p>
        </header>
        
        <VideoFeed 
          feedType="trending" 
          data-testid="video-feed-trending"
          className="space-y-6"
        />
      </div>
    </div>
  );
}

export default TrendingPage;
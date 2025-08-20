// ABOUTME: Discovery feed page showing all public videos
// ABOUTME: Default feed type for browsing all available content

import { VideoFeed } from '@/components/VideoFeed';
import { RelayDebugInfo } from '@/components/RelayDebugInfo';

export function DiscoveryPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Discovery</h1>
          <p className="text-muted-foreground">Explore all public videos</p>
        </header>
        
        <div className="mb-8">
          <RelayDebugInfo />
        </div>
        
        <VideoFeed 
          feedType="discovery" 
          data-testid="video-feed-discovery"
          className="space-y-6"
        />
      </div>
    </div>
  );
}

export default DiscoveryPage;
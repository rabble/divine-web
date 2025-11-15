// ABOUTME: Discovery feed page showing all public videos with tabs for Trending and New Videos
// ABOUTME: Default view shows trending videos sorted by engagement

import { useState } from 'react';
import { VideoFeed } from '@/components/VideoFeed';
import { VerifiedOnlyToggle } from '@/components/VerifiedOnlyToggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Clock } from 'lucide-react';

export function DiscoveryPage() {
  const [activeTab, setActiveTab] = useState('trending');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <header className="mb-6">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold">Discovery</h1>
              <p className="text-muted-foreground">Explore videos from archives and new content</p>
            </div>
            <VerifiedOnlyToggle
              enabled={verifiedOnly}
              onToggle={setVerifiedOnly}
            />
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full">
            <TabsTrigger value="trending" className="flex-1">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="new-videos" className="flex-1">
              <Clock className="h-4 w-4 mr-2" />
              New Videos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="space-y-6">
            <VideoFeed
              feedType="trending"
              verifiedOnly={verifiedOnly}
              data-testid="video-feed-trending"
              className="space-y-6"
            />
          </TabsContent>

          <TabsContent value="new-videos" className="space-y-6">
            <VideoFeed
              feedType="recent"
              verifiedOnly={verifiedOnly}
              data-testid="video-feed-new-videos"
              className="space-y-6"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default DiscoveryPage;
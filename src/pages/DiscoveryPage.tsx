// ABOUTME: Discovery feed page showing all public videos with tabs for Top Vines and New Videos
// ABOUTME: Default view shows top original Vines sorted by engagement

import { useState } from 'react';
import { VideoFeed } from '@/components/VideoFeed';
import { RelayDebugInfo } from '@/components/RelayDebugInfo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Clock } from 'lucide-react';

export function DiscoveryPage() {
  const [activeTab, setActiveTab] = useState('top-vines');

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Discovery</h1>
          <p className="text-muted-foreground">Explore videos from the Vine archives</p>
        </header>

        <div className="mb-8">
          <RelayDebugInfo />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full">
            <TabsTrigger value="top-vines" className="flex-1">
              <TrendingUp className="h-4 w-4 mr-2" />
              Top Vines
            </TabsTrigger>
            <TabsTrigger value="new-videos" className="flex-1">
              <Clock className="h-4 w-4 mr-2" />
              New Videos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="top-vines" className="space-y-6">
            <VideoFeed
              feedType="trending"
              data-testid="video-feed-top-vines"
              className="space-y-6"
            />
          </TabsContent>

          <TabsContent value="new-videos" className="space-y-6">
            <VideoFeed
              feedType="recent"
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
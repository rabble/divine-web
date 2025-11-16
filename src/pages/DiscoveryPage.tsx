// ABOUTME: Discovery feed page showing all public videos with tabs for Trending, New Videos, and Hashtags
// ABOUTME: Default view shows trending videos sorted by engagement

import { useState, useEffect } from 'react';
import { VideoFeed } from '@/components/VideoFeed';
import { VerifiedOnlyToggle } from '@/components/VerifiedOnlyToggle';
import { RelaySelector } from '@/components/RelaySelector';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAppContext } from '@/hooks/useAppContext';
import { HashtagExplorer } from '@/components/HashtagExplorer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Clock, Hash } from 'lucide-react';

export function DiscoveryPage() {
  const [activeTab, setActiveTab] = useState('trending');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const { user } = useCurrentUser();
  const { config, updateConfig } = useAppContext();

  // Force relay to OpenVine for logged-out users (while relay.divine.video is down)
  useEffect(() => {
    if (!user && config.relayUrl !== 'wss://relay3.openvine.co') {
      updateConfig((current) => ({
        ...current,
        relayUrl: 'wss://relay3.openvine.co',
      }));
    }
  }, [user, config.relayUrl, updateConfig]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className={activeTab === 'hashtags' ? 'max-w-6xl mx-auto' : 'max-w-2xl mx-auto'}>
        <header className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Discover</h1>
              <p className="text-muted-foreground">Explore videos from the network</p>
            </div>
            {activeTab !== 'hashtags' && (
              <VerifiedOnlyToggle
                enabled={verifiedOnly}
                onToggle={setVerifiedOnly}
              />
            )}
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Relay:</span>
              <RelaySelector className="flex-1" />
            </div>
          )}
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full">
            <TabsTrigger value="trending" className="flex-1 gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="new-videos" className="flex-1 gap-2">
              <Clock className="h-4 w-4" />
              New Videos
            </TabsTrigger>
            <TabsTrigger value="hashtags" className="flex-1 gap-2">
              <Hash className="h-4 w-4" />
              Hashtags
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="mt-0 space-y-6">
            <VideoFeed
              feedType="trending"
              verifiedOnly={verifiedOnly}
              data-testid="video-feed-trending"
              className="space-y-6"
            />
          </TabsContent>

          <TabsContent value="new-videos" className="mt-0 space-y-6">
            <VideoFeed
              feedType="recent"
              verifiedOnly={verifiedOnly}
              data-testid="video-feed-new-videos"
              className="space-y-6"
            />
          </TabsContent>

          <TabsContent value="hashtags" className="mt-0 space-y-6">
            <HashtagExplorer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default DiscoveryPage;
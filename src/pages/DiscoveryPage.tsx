// ABOUTME: Discovery feed page showing all public videos with tabs for Hot, Top, Rising, New, and Hashtags
// ABOUTME: Each tab uses different NIP-50 sort modes for unique content discovery

import { useState } from 'react';
import { VideoFeed } from '@/components/VideoFeed';
import { VerifiedOnlyToggle } from '@/components/VerifiedOnlyToggle';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { HashtagExplorer } from '@/components/HashtagExplorer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Clock, Hash, Flame, Zap } from 'lucide-react';

export function DiscoveryPage() {
  const [activeTab, setActiveTab] = useState('hot');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const { user } = useCurrentUser();

  // Note: We no longer force relay changes here as it causes navigation delays
  // The default relay (relay.divine.video) is already configured in App.tsx
  // and supports NIP-50 search required for discovery features

  return (
    <div className="container mx-auto px-4 py-6">
      <div className={activeTab === 'hashtags' ? 'max-w-6xl mx-auto' : 'max-w-2xl mx-auto'}>
        <header className="mb-6 space-y-4">
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
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full grid grid-cols-5 gap-1">
            <TabsTrigger value="hot" className="gap-1.5 sm:gap-2">
              <Flame className="h-4 w-4" />
              <span className="hidden sm:inline">Hot</span>
            </TabsTrigger>
            <TabsTrigger value="top" className="gap-1.5 sm:gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Top</span>
            </TabsTrigger>
            <TabsTrigger value="rising" className="gap-1.5 sm:gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Rising</span>
            </TabsTrigger>
            <TabsTrigger value="new" className="gap-1.5 sm:gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">New</span>
            </TabsTrigger>
            <TabsTrigger value="hashtags" className="gap-1.5 sm:gap-2">
              <Hash className="h-4 w-4" />
              <span className="hidden sm:inline">Tags</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hot" className="mt-0 space-y-6">
            <VideoFeed
              feedType="trending"
              sortMode="hot"
              verifiedOnly={verifiedOnly}
              data-testid="video-feed-hot"
              className="space-y-6"
              key="hot"
            />
          </TabsContent>

          <TabsContent value="top" className="mt-0 space-y-6">
            <VideoFeed
              feedType="trending"
              sortMode="top"
              verifiedOnly={verifiedOnly}
              data-testid="video-feed-top"
              className="space-y-6"
              key="top"
            />
          </TabsContent>

          <TabsContent value="rising" className="mt-0 space-y-6">
            <VideoFeed
              feedType="trending"
              sortMode="rising"
              verifiedOnly={verifiedOnly}
              data-testid="video-feed-rising"
              className="space-y-6"
              key="rising"
            />
          </TabsContent>

          <TabsContent value="new" className="mt-0 space-y-6">
            <VideoFeed
              feedType="recent"
              verifiedOnly={verifiedOnly}
              data-testid="video-feed-new"
              className="space-y-6"
              key="recent"
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
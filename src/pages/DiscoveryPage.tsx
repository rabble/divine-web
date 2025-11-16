// ABOUTME: Discovery feed page showing all public videos with tabs for Trending, New Videos, and Hashtags
// ABOUTME: Supports NIP-50 sort modes with user-selectable options

import { useState, useEffect } from 'react';
import { VideoFeed } from '@/components/VideoFeed';
import { VerifiedOnlyToggle } from '@/components/VerifiedOnlyToggle';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAppContext } from '@/hooks/useAppContext';
import { HashtagExplorer } from '@/components/HashtagExplorer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Clock, Hash, Flame, Zap, Scale } from 'lucide-react';
import type { SortMode } from '@/types/nostr';

const SORT_MODES = [
  { value: 'hot' as SortMode, label: 'Hot', icon: Flame },
  { value: 'top' as SortMode, label: 'Top', icon: TrendingUp },
  { value: 'rising' as SortMode, label: 'Rising', icon: Zap },
  { value: 'controversial' as SortMode, label: 'Controversial', icon: Scale },
];

export function DiscoveryPage() {
  const [activeTab, setActiveTab] = useState('trending');
  const [sortMode, setSortMode] = useState<SortMode>('hot');
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

          {/* Sort selector for trending tab */}
          {activeTab === 'trending' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort:</span>
              <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_MODES.map(mode => (
                    <SelectItem key={mode.value} value={mode.value}>
                      <div className="flex items-center gap-2">
                        <mode.icon className="h-4 w-4" />
                        {mode.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              sortMode={sortMode}
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
import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { VideoFeed } from '@/components/VideoFeed';
import { LandingPage } from '@/components/LandingPage';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Compass, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LoginArea } from '@/components/auth/LoginArea';
import { VerifiedOnlyToggle } from '@/components/VerifiedOnlyToggle';

const Index = () => {
  const { user } = useCurrentUser();

  useSeoMeta({
    title: 'diVine Web - Short-form Looping Videos on Nostr',
    description: 'Watch and share 6-second looping videos on the decentralized Nostr network.',
  });

  // When logged in, default to Home feed. When not logged in, default to Explore
  const [activeTab, setActiveTab] = useState(user ? 'home' : 'explore');
  const [exploreSubTab, setExploreSubTab] = useState('trending');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Show landing page if not logged in
  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main content */}
      <main className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Main tabs: Home / Explore */}
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
            <TabsTrigger value="home" className="gap-2">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </TabsTrigger>
            <TabsTrigger value="explore" className="gap-2">
              <Compass className="h-4 w-4" />
              <span>Explore</span>
            </TabsTrigger>
          </TabsList>

          {/* Home Feed Tab - Shows videos from people you follow */}
          <TabsContent value="home" className="mt-0">
            <div className="max-w-2xl mx-auto">
              <header className="mb-6">
                <h1 className="text-2xl font-bold">Home</h1>
                <p className="text-muted-foreground">Videos from people you follow</p>
              </header>

              <VideoFeed
                feedType="home"
                data-testid="video-feed-home"
                className="space-y-6"
              />
            </div>
          </TabsContent>

          {/* Explore Tab - Shows all public videos with sub-tabs */}
          <TabsContent value="explore" className="mt-0">
            <div className="max-w-2xl mx-auto">
              <header className="mb-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h1 className="text-2xl font-bold">Explore</h1>
                    <p className="text-muted-foreground">Discover videos from the network</p>
                  </div>
                  <VerifiedOnlyToggle
                    enabled={verifiedOnly}
                    onToggle={setVerifiedOnly}
                  />
                </div>
              </header>

              {/* Explore sub-tabs: Trending / New Videos */}
              <Tabs value={exploreSubTab} onValueChange={setExploreSubTab} className="w-full">
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="trending" className="flex-1 gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Trending
                  </TabsTrigger>
                  <TabsTrigger value="new-videos" className="flex-1 gap-2">
                    <Clock className="h-4 w-4" />
                    New Videos
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="trending" className="mt-0">
                  <VideoFeed
                    feedType="trending"
                    verifiedOnly={verifiedOnly}
                    data-testid="video-feed-trending"
                    className="space-y-6"
                  />
                </TabsContent>

                <TabsContent value="new-videos" className="mt-0">
                  <VideoFeed
                    feedType="recent"
                    verifiedOnly={verifiedOnly}
                    data-testid="video-feed-new-videos"
                    className="space-y-6"
                  />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;

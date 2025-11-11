import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { VideoFeed } from '@/components/VideoFeed';
import { LandingPage } from '@/components/LandingPage';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, TrendingUp } from 'lucide-react';

const Index = () => {
  const { user } = useCurrentUser();

  useSeoMeta({
    title: 'Divine Web - Short-form Looping Videos on Nostr',
    description: 'Watch and share 6-second looping videos on the decentralized Nostr network.',
  });

  const [activeTab, setActiveTab] = useState('trending');

  // Show landing page if not logged in
  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main content */}
      <main className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
            <TabsTrigger value="trending" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Trending</span>
            </TabsTrigger>
            <TabsTrigger value="new-videos" className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">New Videos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="mt-0">
            <VideoFeed feedType="trending" className="max-w-2xl mx-auto" />
          </TabsContent>

          <TabsContent value="new-videos" className="mt-0">
            <VideoFeed feedType="recent" className="max-w-2xl mx-auto" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;

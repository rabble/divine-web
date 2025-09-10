import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useNavigate } from 'react-router-dom';
import { VideoFeed } from '@/components/VideoFeed';
import { LoginArea } from '@/components/auth/LoginArea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Sparkles, Users, TrendingUp, Search, Hash, List } from 'lucide-react';

const Index = () => {
  useSeoMeta({
    title: 'Divine Web - Short-form Looping Videos on Nostr',
    description: 'Watch and share 6-second looping videos on the decentralized Nostr network.',
  });

  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('discovery');

  return (
    <div className="min-h-screen bg-background">
      {/* Main content */}
      <main className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-6">
            <TabsTrigger value="discovery" className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Discovery</span>
            </TabsTrigger>
            <TabsTrigger value="following" disabled={!user} className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Following</span>
            </TabsTrigger>
            <TabsTrigger value="trending" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Trending</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discovery" className="mt-0">
            <VideoFeed feedType="discovery" className="max-w-2xl mx-auto" />
          </TabsContent>

          <TabsContent value="following" className="mt-0">
            {user ? (
              <VideoFeed feedType="home" className="max-w-2xl mx-auto" />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Sign in to see videos from people you follow
                </p>
                <LoginArea className="inline-flex" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="trending" className="mt-0">
            <VideoFeed feedType="trending" className="max-w-2xl mx-auto" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;

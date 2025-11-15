import { useSeoMeta } from '@unhead/react';
import { VideoFeed } from '@/components/VideoFeed';
import { LandingPage } from '@/components/LandingPage';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const Index = () => {
  const { user } = useCurrentUser();

  useSeoMeta({
    title: 'diVine Web - Short-form Looping Videos on Nostr',
    description: 'Watch and share 6-second looping videos on the decentralized Nostr network.',
  });

  // Show landing page if not logged in
  if (!user) {
    return <LandingPage />;
  }

  // When logged in, show home feed (videos from people you follow)
  return (
    <div className="min-h-screen bg-background">
      <main className="container py-6">
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
      </main>
    </div>
  );
};

export default Index;

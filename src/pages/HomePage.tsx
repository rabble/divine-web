// ABOUTME: Home feed page showing videos from people you follow
// ABOUTME: Requires user to be logged in and have a follow list

import { VideoFeed } from '@/components/VideoFeed';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LoginArea } from '@/components/auth/LoginArea';
import { Card, CardContent } from '@/components/ui/card';

export function HomePage() {
  const { user } = useCurrentUser();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-xl font-semibold mb-4">Welcome to Your Home Feed</h2>
              <p className="text-muted-foreground mb-6">
                Sign in to see videos from people you follow
              </p>
              <LoginArea className="max-w-60 mx-auto" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
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
    </div>
  );
}

export default HomePage;
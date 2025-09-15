// ABOUTME: Landing page component shown to logged-out users
// ABOUTME: Displays the Divine Video brand message and login prompt

import { LoginArea } from "@/components/auth/LoginArea";
import { Card, CardContent } from "@/components/ui/card";

export function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="pt-8 pb-8 px-8 text-center space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Divine Video
            </h1>
            <p className="text-xl text-muted-foreground font-medium">
              Bringing back Vine using Nostr
            </p>
            <p className="text-lg italic text-muted-foreground">
              Do it for the Vine
            </p>
          </div>
          
          <div className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Log in with Nostr to continue
            </p>
            <LoginArea className="w-full justify-center" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
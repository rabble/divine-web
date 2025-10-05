// ABOUTME: Landing page component shown to logged-out users
// ABOUTME: Displays the Divine Video brand message and login prompt

import { LoginArea } from "@/components/auth/LoginArea";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Shield, Users } from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-4">
      <div className="max-w-2xl w-full space-y-6">
        <Card className="w-full">
          <CardContent className="pt-8 pb-8 px-8 text-center space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Divine Video
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground font-medium">
                Social Media By Humans, For Humans
              </p>
              <p className="text-lg italic text-muted-foreground">
                Do it for the Vine
              </p>
            </div>

            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground">
                Bringing back the authentic creativity of Vine in an age of AI-generated content.
                Built on Nostr. Verified with ProofMode. Preserved forever.
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

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-white/50 dark:bg-black/20 backdrop-blur">
            <CardContent className="pt-6 pb-6 text-center">
              <Heart className="h-8 w-8 mx-auto mb-3 text-red-500" />
              <h3 className="font-semibold mb-2">Authentic</h3>
              <p className="text-xs text-muted-foreground">
                Real moments from real humans, not AI
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-black/20 backdrop-blur">
            <CardContent className="pt-6 pb-6 text-center">
              <Shield className="h-8 w-8 mx-auto mb-3 text-green-500" />
              <h3 className="font-semibold mb-2">Verified</h3>
              <p className="text-xs text-muted-foreground">
                ProofMode cryptographically proves authenticity
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-black/20 backdrop-blur">
            <CardContent className="pt-6 pb-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-3 text-blue-500" />
              <h3 className="font-semibold mb-2">Decentralized</h3>
              <p className="text-xs text-muted-foreground">
                Built on Nostr. Your content, your control
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button
            variant="ghost"
            className="text-sm text-muted-foreground hover:text-primary"
            onClick={() => window.location.href = '/authenticity'}
          >
            Learn more about our mission →
          </Button>
        </div>
      </div>
    </div>
  );
}
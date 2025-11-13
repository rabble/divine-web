// ABOUTME: Support and contact information page for Divine Web
// ABOUTME: Displays email contact and GitHub issues link for user support

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Github, MessageCircle } from 'lucide-react';

export function Support() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Support</h1>
          <p className="text-muted-foreground">
            Need help? We're here to assist you.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Support
            </CardTitle>
            <CardDescription>
              Send us an email and we'll get back to you as soon as possible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="mailto:rabble@rabblelabs.com"
              className="text-primary hover:underline font-medium"
            >
              rabble@rabblelabs.com
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              GitHub Issues
            </CardTitle>
            <CardDescription>
              Report bugs, request features, or browse existing issues on our GitHub repository.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="https://github.com/rabble/nostrvine/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              github.com/rabble/nostrvine/issues
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Community
            </CardTitle>
            <CardDescription>
              Join our community discussions and connect with other Divine users on Nostr.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Divine is built on Nostr, a decentralized social protocol. Find us on your favorite Nostr client!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ABOUTME: Open source page showing project repositories and contribution info
// ABOUTME: Includes platform availability and technology stack details

import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Github, 
  Globe, 
  Smartphone, 
  Monitor, 
  ExternalLink,
  Code2,
  Users,
  Heart,
  Zap
} from 'lucide-react';

export function OpenSourcePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Open Source Project</h1>
      
      <div className="space-y-8">
        {/* Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-primary" />
              Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground">
              Divine Web is a decentralized, open-source alternative to Vine, built on the Nostr protocol. 
              The project aims to restore and celebrate creative video moments while providing a 
              community-driven platform.
            </p>
          </CardContent>
        </Card>

        {/* Platforms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Platforms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <span>Web App</span>
                </div>
                <Badge className="bg-green-500">Available</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Monitor className="h-5 w-5 text-gray-500" />
                  <span>macOS</span>
                </div>
                <Badge className="bg-green-500">Available</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-blue-500" />
                  <span>iOS</span>
                </div>
                <Badge className="bg-yellow-500">Beta</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-green-500" />
                  <span>Android</span>
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Monitor className="h-5 w-5 text-blue-600" />
                  <span>Windows</span>
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Monitor className="h-5 w-5 text-orange-500" />
                  <span>Linux</span>
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium mb-2">Join Beta Testing!</p>
              <div className="flex gap-2">
                <Button asChild size="sm">
                  <a
                    href="https://testflight.apple.com/join/phQERxAb"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    iOS TestFlight
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a
                    href="https://play.google.com/apps/test/co.openvine.app/61"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    Android Beta
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technologies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Technologies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Badge variant="outline" className="justify-center py-2">
                Nostr Protocol
              </Badge>
              <Badge variant="outline" className="justify-center py-2">
                Flutter
              </Badge>
              <Badge variant="outline" className="justify-center py-2">
                Cloudflare Workers
              </Badge>
              <Badge variant="outline" className="justify-center py-2">
                R2 Storage
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Community & Contribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Community & Contribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-4">
                Join our open-source community and help build the future of decentralized video sharing!
              </p>
              <Button asChild>
                <a 
                  href="https://github.com/rabble/nostrvine" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <Github className="h-4 w-4" />
                  View on GitHub
                </a>
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Developed by <span className="font-semibold">Rabble Labs</span>
            </div>
          </CardContent>
        </Card>

        {/* Open Source Principles */}
        <Card>
          <CardHeader>
            <CardTitle>Key Open Source Principles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <h4 className="font-semibold flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full" />
                  Transparency
                </h4>
                <p className="text-sm text-muted-foreground pl-4">
                  All code is open and auditable
                </p>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-semibold flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full" />
                  Community-driven
                </h4>
                <p className="text-sm text-muted-foreground pl-4">
                  Built by and for the community
                </p>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-semibold flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full" />
                  Innovation
                </h4>
                <p className="text-sm text-muted-foreground pl-4">
                  Pushing boundaries of decentralized social
                </p>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-semibold flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full" />
                  Platform freedom
                </h4>
                <p className="text-sm text-muted-foreground pl-4">
                  No vendor lock-in or corporate control
                </p>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-semibold flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full" />
                  User privacy
                </h4>
                <p className="text-sm text-muted-foreground pl-4">
                  Your data, your control
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Special Recognition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Special Recognition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Gratitude to ArchiveTeam for preserving over 900 million Vines during 
              Twitter's platform shutdown. Their dedication to digital preservation 
              ensures these creative moments live on.
            </p>
          </CardContent>
        </Card>

        {/* Motto */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-8 text-center">
            <blockquote className="text-xl font-semibold italic">
              "Liberating Vine, one loop at a time"
            </blockquote>
          </CardContent>
        </Card>

        {/* Links */}
        <div className="flex flex-wrap gap-4 justify-center pt-8 border-t">
          <Link to="/about" className="text-primary hover:underline">
            About
          </Link>
          <Link to="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          <Link to="/" className="text-primary hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OpenSourcePage;
// ABOUTME: About page explaining the OpenVine/Divine Web project
// ABOUTME: Contains project history, mission, and creator information

import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Github, Heart, Archive } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">About Divine Web</h1>
      
      <div className="space-y-8">
        {/* The Story */}
        <Card>
          <CardHeader>
            <CardTitle>The Story Behind Divine Web</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-lg">
              In an era of AI-generated content, Divine Web seeks to recapture the authentic creativity 
              of the original Vine platform.
            </p>
          </CardContent>
        </Card>

        {/* Remember Vine */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Remember Vine?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Between 2013 and 2017, Vine was a cultural phenomenon that allowed creators to share 
              six-second videos capturing pure, unfiltered moments of creativity.
            </p>
          </CardContent>
        </Card>

        {/* Why Bring It Back */}
        <Card>
          <CardHeader>
            <CardTitle>Why Bring It Back?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The creator was inspired by podcast interviews and the loss of digital content when 
              Twitter shut down Vine in 2017. The goal is to create a platform that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Preserves digital creative legacy</li>
              <li>Prevents content loss due to corporate decisions</li>
              <li>Empowers creators through decentralized technology</li>
            </ul>
          </CardContent>
        </Card>

        {/* Digital Rights */}
        <Card>
          <CardHeader>
            <CardTitle>Fighting for Digital Rights</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Divine Web upholds key digital rights:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-primary rounded-full" />
                <span>Content ownership</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-primary rounded-full" />
                <span>Data portability</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-primary rounded-full" />
                <span>Privacy control</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-primary rounded-full" />
                <span>Algorithmic transparency</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-primary rounded-full" />
                <span>Content permanence</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Features */}
        <Card>
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold">Nostr Protocol</h4>
                <p className="text-sm text-muted-foreground">
                  Decentralized and censorship-resistant
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Direct Recording</h4>
                <p className="text-sm text-muted-foreground">
                  Authentic moments without AI filters
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Open Source</h4>
                <p className="text-sm text-muted-foreground">
                  Community-built and maintained
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Creator */}
        <Card>
          <CardHeader>
            <CardTitle>Created by Rabble</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Inspired by the simplicity of original Vine and projects like Neocities, 
              Divine Web aims to resurrect spontaneous, creative video sharing.
            </p>
          </CardContent>
        </Card>

        {/* Vine Archive */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Vine Archive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              In collaboration with ArchiveTeam, Divine Web has preserved many classic Vine videos, 
              with a commitment to restore creator ownership when possible.
            </p>
            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
              "Do it for the Vine!" — Every creator, circa 2015
            </blockquote>
          </CardContent>
        </Card>

        {/* TestFlight Link */}
        <Card>
          <CardHeader>
            <CardTitle>Get the iOS App</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Join the iOS beta and start creating 6-second loops on your iPhone!
            </p>
            <Button asChild>
              <a 
                href="https://testflight.apple.com/join/phQERxAb" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                Join iOS TestFlight
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Links */}
        <div className="flex flex-wrap gap-4 justify-center pt-8">
          <Button variant="outline" asChild>
            <Link to="/privacy">Privacy Policy</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/open-source">Open Source</Link>
          </Button>
          <Button variant="outline" asChild>
            <a 
              href="https://github.com/rabble/nostrvine" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
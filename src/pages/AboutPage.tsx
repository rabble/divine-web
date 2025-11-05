// ABOUTME: About page explaining the OpenVine/Divine Web project
// ABOUTME: Contains project history, mission, and creator information

import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Github, Heart, Archive, Shield } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">About Divine</h1>
      
      <div className="space-y-8">
        {/* The Story */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>The Story Behind Divine</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p className="text-lg">
              In an era of AI-generated content, Divine seeks to recapture the authentic creativity
              of the original Vine platform.
            </p>
            <div className="not-prose">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/authenticity">
                  <Heart className="h-5 w-5 mr-2" />
                  Our Mission: Social Media By Humans, For Humans
                </Link>
              </Button>
            </div>
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
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Between 2013 and 2017, Vine was a cultural phenomenon that allowed creators to share
              six-second videos capturing pure, unfiltered moments of creativity.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg border">
              <p className="text-muted-foreground">
                <strong>Note:</strong> Divine has no affiliation with X (formerly Twitter) or the original Vine platform.
                We're an independent project that preserves archived Vine content and enables new creations using
                completely open-source technology and the decentralized Nostr protocol.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Why Bring It Back */}
        <Card>
          <CardHeader>
            <CardTitle>Why Bring It Back?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The idea for Divine came during interviews for the{" "}
              <a href="https://revolution.social" rel="noopener noreferrer" className="text-primary hover:underline">
                Revolution.Social podcast
              </a>. When interviewing{" "}
              <a href="https://revolution.social/episodes/yoel-roth-on-banning-trump-battling-bots-amp-the-d/" rel="noopener noreferrer" className="text-primary hover:underline">
                Yoel Roth
              </a>{" "}
              and{" "}
              <a href="https://revolution.social/episodes/taylor-lorenz-on-moral-panics-tech-villains-amp-pr/" rel="noopener noreferrer" className="text-primary hover:underline">
                Taylor Lorenz
              </a>, both talked passionately about how much they missed Vine and the unique creative culture it fostered.
            </p>
            <p className="text-muted-foreground">
              That's when the thought hit: how hard could it be to revive Vine? With today's decentralized technologies,
              we could bring back that spontaneous creativity—but this time, make it impossible for any corporation to
              shut down again.
            </p>
            <p className="text-muted-foreground">
              The goal is to create a platform that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Preserves digital creative legacy</li>
              <li>Prevents content loss due to corporate decisions</li>
              <li>Empowers creators through decentralized technology</li>
            </ul>
          </CardContent>
        </Card>

        {/* Vine Archive */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Where Did We Get the Vines?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              When Twitter shut down Vine in 2017, millions of creative videos were at risk of being lost forever.
              Fortunately, the volunteer archivists at{" "}
              <a href="https://wiki.archiveteam.org/index.php/Vine" rel="noopener noreferrer" className="text-primary hover:underline">
                ArchiveTeam
              </a>{" "}
              sprang into action to preserve these cultural artifacts before they disappeared.
            </p>
            <p className="text-muted-foreground">
              We recovered the Vine videos from ArchiveTeam's preservation work, giving these authentic
              pre-AI era videos a new home. Divine is committed to restoring creator ownership and
              attribution when possible, honoring the original creators who made Vine special.
            </p>
            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
              "Do it for the Vine!" — Every creator, circa 2015
            </blockquote>
          </CardContent>
        </Card>

        {/* Digital Rights */}
        <Card>
          <CardHeader>
            <CardTitle>Fighting for Digital Rights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground mb-4">Divine upholds key digital rights:</p>
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
            <p className="text-sm text-muted-foreground">
              Part of a broader movement for digital rights and user ownership. Learn more at{" "}
              <a href="https://rights.social" rel="noopener noreferrer" className="text-primary hover:underline">
                Rights.Social
              </a>.
            </p>
          </CardContent>
        </Card>

        {/* Key Features */}
        <Card>
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Nostr Protocol</h4>
                <p className="text-sm text-muted-foreground">
                  Decentralized and censorship-resistant. Built on{" "}
                  <a href="https://nostr.org" rel="noopener noreferrer" className="text-primary hover:underline">
                    Nostr
                  </a>, a protocol that makes it impossible for any single entity to control or censor your content.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Composable Moderation</h4>
                <p className="text-sm text-muted-foreground">
                  Like Bluesky's moderation, you choose who your moderators are. Create your own
                  moderation lists or subscribe to ones you trust.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Blossom Media Servers</h4>
                <p className="text-sm text-muted-foreground">
                  Multiple media servers mean you can host your own content, choose who hosts it,
                  or use community servers. Your videos aren't locked to one provider.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Algorithmic Choice</h4>
                <p className="text-sm text-muted-foreground">
                  Using Nostr custom algorithms and DVMs (Data Vending Machines), you can choose
                  your algorithm or even create new ones for others to use.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Direct Recording</h4>
                <p className="text-sm text-muted-foreground">
                  Authentic moments without AI filters
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Open Source</h4>
                <p className="text-sm text-muted-foreground">
                  Community-built and maintained. Check out our{" "}
                  <a href="https://github.com/rabble/nostrvine" rel="noopener noreferrer" className="text-primary hover:underline">
                    Flutter app on GitHub
                  </a>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ProofMode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Cryptographic Authenticity with ProofMode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              In an era where AI can generate realistic fake videos, Divine uses ProofMode to help you
              distinguish real camera captures from AI-generated content.
            </p>
            <p className="text-muted-foreground">
              ProofMode adds cryptographic proofs to videos, including device hardware attestation,
              OpenPGP signatures, and content hashes. This raises the bar for authenticity and helps
              restore trust in video content.
            </p>
            <p className="text-sm text-muted-foreground">
              <Link to="/proofmode" className="text-primary hover:underline">
                Learn more about ProofMode
              </Link>.
            </p>
          </CardContent>
        </Card>

        {/* Creator */}
        <Card>
          <CardHeader>
            <CardTitle>Created by Rabble</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Inspired by the simplicity of original Vine and projects like{" "}
              <a href="https://neocities.org" rel="noopener noreferrer" className="text-primary hover:underline">
                Neocities
              </a>,
              Divine aims to resurrect spontaneous, creative video sharing.
            </p>
            <p className="text-muted-foreground">
              Rabble is building decentralized social media technologies and fighting for digital rights.
            </p>
            <p className="text-sm text-muted-foreground">
              Learn more at{" "}
              <a href="https://rabblelabs.com" rel="noopener noreferrer" className="text-primary hover:underline">
                RabbleLabs.com
              </a>{" "}
              or read about the history of social media at{" "}
              <a href="https://revolution.social" rel="noopener noreferrer" className="text-primary hover:underline">
                Revolution.Social
              </a>.
            </p>
          </CardContent>
        </Card>

        {/* TestFlight Link */}
        <Card>
          <CardHeader>
            <CardTitle>Get the Mobile App</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Join our beta programs and start creating 6-second loops on your phone!
            </p>
            <div className="flex gap-3">
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
              <Button asChild variant="outline">
                <a
                  href="https://play.google.com/apps/test/co.openvine.app/61"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Join Android Beta
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <div className="flex flex-wrap gap-4 justify-center pt-8">
          <Button variant="outline" asChild>
            <Link to="/authenticity">Our Mission</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/proofmode">ProofMode</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/privacy">Privacy Policy</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dmca">Copyright & DMCA</Link>
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
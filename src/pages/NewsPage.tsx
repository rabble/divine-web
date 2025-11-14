// ABOUTME: News page displaying press releases and media coverage about Divine
// ABOUTME: Links to press releases and articles about the platform

import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, FileText } from 'lucide-react';

export function NewsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Divine News & Press</h1>
          <p className="text-muted-foreground">
            Press releases, media coverage, and announcements about Divine
          </p>
        </div>

        <div className="space-y-6">
          {/* Press Release */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-2xl">
                    <Link
                      to="/news/vine-revisited"
                      className="hover:text-primary transition-colors"
                    >
                      Vine Revisited - A Return to the Halcyon Days of the Internet
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    November 13, 2024 • Press Release
                  </CardDescription>
                </div>
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                With a grant funded by Jack Dorsey, Rabble has created Divine - an open source revival of Vine videos and its six-second video creation capabilities.
              </p>
              <Link
                to="/news/vine-revisited"
                className="text-primary hover:underline font-medium"
              >
                Read full press release →
              </Link>
            </CardContent>
          </Card>

          {/* Media Coverage */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Media Coverage</h2>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>
                        <a
                          href="https://techcrunch.com/2025/11/12/jack-dorsey-funds-divine-a-vine-reboot-that-includes-vines-video-archive/"
                          className="hover:text-primary transition-colors"
                        >
                          Jack Dorsey funds Divine, a Vine reboot that includes Vine's video archive
                        </a>
                      </CardTitle>
                      <CardDescription>
                        November 12, 2024 • TechCrunch
                      </CardDescription>
                    </div>
                    <ExternalLink className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Jack Dorsey, the co-founder of Twitter, is backing Divine, an open-source app that is reminiscent of Vine, the short-form video app that Twitter shut down in 2017.
                  </p>
                  <a
                    href="https://techcrunch.com/2025/11/12/jack-dorsey-funds-divine-a-vine-reboot-that-includes-vines-video-archive/"
                    className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    Read on TechCrunch
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewsPage;

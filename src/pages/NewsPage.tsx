// ABOUTME: News page displaying press releases and media coverage about Divine
// ABOUTME: Links to press releases and articles about the platform

import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText, Mail } from 'lucide-react';

const NEWS_OUTLETS = [
  {
    name: 'TechCrunch',
    logo: '/logos/techcrunch.png',
    url: 'https://techcrunch.com/2025/11/12/jack-dorsey-funds-divine-a-vine-reboot-that-includes-vines-video-archive/',
  },
  {
    name: 'Yahoo',
    logo: '/logos/yahoo.png',
    url: 'https://www.yahoo.com/news/article/what-to-know-about-jack-dorseys-new-vine-revival-divine-215918687.html',
  },
  {
    name: 'Business Insider',
    logo: '/logos/businessinsider.png',
    url: 'https://www.businessinsider.com/vine-reboot-divine-jack-dorsey-andotherstuff-2025-11',
  },
  {
    name: 'Newsweek',
    logo: '/logos/newsweek.png',
    url: 'https://www.newsweek.com/divine-everything-we-know-about-vines-reboot-11048434',
  },
];

export function NewsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">diVine News & Press</h1>
          <p className="text-muted-foreground mb-4">
            Press releases, media coverage, and announcements about diVine
          </p>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link to="/media-resources" className="inline-flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Media Resources
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/support" className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Press Contact
              </Link>
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Seen In Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-center">As seen in</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
              {NEWS_OUTLETS.map((outlet) => (
                <a
                  key={outlet.name}
                  href={outlet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all duration-200"
                  aria-label={`Read about Divine on ${outlet.name}`}
                >
                  <img
                    src={outlet.logo}
                    alt={outlet.name}
                    className={
                      outlet.name === 'Newsweek' || outlet.name === 'TechCrunch'
                        ? 'h-20 w-auto object-contain'
                        : 'h-16 w-auto object-contain'
                    }
                  />
                </a>
              ))}
            </div>
          </div>

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
                    November 13, 2025 • Press Release
                  </CardDescription>
                </div>
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                With a grant funded by Jack Dorsey, Rabble has created diVine - an open source revival of Vine videos and its six-second video creation capabilities.
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
                          href="https://www.cnn.com/2025/11/14/business/video/divine-jack-dorsey-cli-hrzn"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors"
                        >
                          Divine: Jack Dorsey's Vine revival
                        </a>
                      </CardTitle>
                      <CardDescription>
                        November 14, 2025 • CNN
                      </CardDescription>
                    </div>
                    <ExternalLink className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Jack Dorsey's latest venture brings back the beloved short-form video platform Vine as diVine.
                  </p>
                  <a
                    href="https://www.cnn.com/2025/11/14/business/video/divine-jack-dorsey-cli-hrzn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    Watch on CNN
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>
                        <a
                          href="https://www.yahoo.com/news/article/what-to-know-about-jack-dorseys-new-vine-revival-divine-215918687.html"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors"
                        >
                          What to know about Jack Dorsey's new Vine revival, Divine
                        </a>
                      </CardTitle>
                      <CardDescription>
                        November 2025 • Yahoo News
                      </CardDescription>
                    </div>
                    <ExternalLink className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Jack Dorsey has introduced diVine, an open-source revival of the short-form video platform Vine.
                  </p>
                  <a
                    href="https://www.yahoo.com/news/article/what-to-know-about-jack-dorseys-new-vine-revival-divine-215918687.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    Read on Yahoo News
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>
                        <a
                          href="https://www.businessinsider.com/vine-reboot-divine-jack-dorsey-andotherstuff-2025-11"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors"
                        >
                          Vine reboot diVine Jack Dorsey andotherstuff
                        </a>
                      </CardTitle>
                      <CardDescription>
                        November 2025 • Business Insider
                      </CardDescription>
                    </div>
                    <ExternalLink className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Jack Dorsey's andotherstuff is bringing back Vine as diVine, an open-source platform for short-form video.
                  </p>
                  <a
                    href="https://www.businessinsider.com/vine-reboot-divine-jack-dorsey-andotherstuff-2025-11"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    Read on Business Insider
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>
                        <a
                          href="https://www.newsweek.com/divine-everything-we-know-about-vines-reboot-11048434"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors"
                        >
                          diVine: Everything We Know About Vine's Reboot
                        </a>
                      </CardTitle>
                      <CardDescription>
                        November 2025 • Newsweek
                      </CardDescription>
                    </div>
                    <ExternalLink className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Everything you need to know about diVine, the spiritual successor to Vine backed by Jack Dorsey.
                  </p>
                  <a
                    href="https://www.newsweek.com/divine-everything-we-know-about-vines-reboot-11048434"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    Read on Newsweek
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>
                        <a
                          href="https://techcrunch.com/2025/11/12/jack-dorsey-funds-divine-a-vine-reboot-that-includes-vines-video-archive/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors"
                        >
                          Jack Dorsey funds diVine, a Vine reboot that includes Vine's video archive
                        </a>
                      </CardTitle>
                      <CardDescription>
                        November 12, 2025 • TechCrunch
                      </CardDescription>
                    </div>
                    <ExternalLink className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Jack Dorsey, the co-founder of Twitter, is backing diVine, an open-source app that is reminiscent of Vine, the short-form video app that Twitter shut down in 2017.
                  </p>
                  <a
                    href="https://techcrunch.com/2025/11/12/jack-dorsey-funds-divine-a-vine-reboot-that-includes-vines-video-archive/"
                    target="_blank"
                    rel="noopener noreferrer"
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

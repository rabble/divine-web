// ABOUTME: Apple Podcasts embed component for displaying podcast episodes
// ABOUTME: Creates a nice embedded player similar to Slack's podcast embeds

import { ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ApplePodcastEmbedProps {
  episodeUrl: string;
  title?: string;
  description?: string;
  showName?: string;
  duration?: string;
  className?: string;
}

export function ApplePodcastEmbed({
  episodeUrl,
  title = "Vine Revisited and The Fight Against AI Slop",
  description = "Behind the scenes of the diVine launch",
  showName = "Revolution.Social",
  duration = "21 min",
  className = "",
}: ApplePodcastEmbedProps) {
  // Extract episode ID from Apple Podcasts URL
  const episodeId = episodeUrl.match(/i=(\d+)/)?.[1];
  const embedUrl = episodeId 
    ? `https://embed.podcasts.apple.com/us/podcast/${episodeId}`
    : episodeUrl;

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="flex flex-col">
          {/* Header with metadata */}
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <svg 
                    className="h-5 w-5 text-[#F94C57] flex-shrink-0" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
                  </svg>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Podcast Episode
                  </span>
                </div>
                <h3 className="font-semibold text-base mb-1 line-clamp-2">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {showName} • {duration}
                </p>
                {description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {description}
                  </p>
                )}
              </div>
              <a
                href={episodeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-primary hover:text-primary/80 transition-colors"
                aria-label="Open in Apple Podcasts"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Apple Podcasts embed iframe */}
          <div className="relative w-full bg-background">
            <iframe
              src={embedUrl}
              height="175"
              frameBorder="0"
              sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
              allow="autoplay *; encrypted-media *; clipboard-write"
              className="w-full rounded-b-lg"
              title={title}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ApplePodcastEmbed;

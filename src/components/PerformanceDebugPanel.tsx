// ABOUTME: Performance debugging panel for monitoring video loading times
// ABOUTME: Displays real-time metrics for query times, video loading, and render performance

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useVideoPlayback } from '@/hooks/useVideoPlayback';

interface PerformanceMetrics {
  queryTime?: number;
  parseTime?: number;
  totalEvents?: number;
  validVideos?: number;
  renderStart?: number;
  firstVideoLoad?: number;
  visibleVideos?: number;
  cachedVideos?: number;
}

export function PerformanceDebugPanel() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const { activeVideoId, globalMuted } = useVideoPlayback();

  useEffect(() => {
    // Listen for performance events
    const handlePerformanceEvent = (event: CustomEvent) => {
      setMetrics(prev => ({ ...prev, ...event.detail }));
    };

    window.addEventListener('performance-metric' as any, handlePerformanceEvent);
    
    // Track render performance relative to page load
    const renderStart = Math.round(performance.now() / 1000); // Convert to seconds
    setMetrics(prev => ({ ...prev, renderStart }));

    return () => {
      window.removeEventListener('performance-metric' as any, handlePerformanceEvent);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Debug Panel</CardTitle>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setIsVisible(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        {!isMinimized && (
          <CardContent className="space-y-1 text-xs">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div className="text-muted-foreground">Query Time:</div>
              <div className="font-mono">{metrics.queryTime ? `${metrics.queryTime}ms` : '-'}</div>
              
              <div className="text-muted-foreground">Parse Time:</div>
              <div className="font-mono">{metrics.parseTime ? `${metrics.parseTime}ms` : '-'}</div>
              
              <div className="text-muted-foreground">Total Events:</div>
              <div className="font-mono">{metrics.totalEvents ?? '-'}</div>
              
              <div className="text-muted-foreground">Valid Videos:</div>
              <div className="font-mono">{metrics.validVideos ?? '-'}</div>
              
              <div className="text-muted-foreground">Visible:</div>
              <div className="font-mono">{metrics.visibleVideos ?? '-'}</div>
              
              <div className="text-muted-foreground">Cached:</div>
              <div className="font-mono">{metrics.cachedVideos ?? '-'}</div>
              
              <div className="text-muted-foreground">Page Age:</div>
              <div className="font-mono">{metrics.renderStart ? `${metrics.renderStart}s` : '-'}</div>
              
              <div className="text-muted-foreground">First Video:</div>
              <div className="font-mono">{metrics.firstVideoLoad ? `${metrics.firstVideoLoad.toFixed(0)}ms` : '-'}</div>
            </div>
            
            {/* Video Playback Info */}
            <div className="border-t pt-2 mt-2">
              <div className="font-semibold text-xs mb-1">Playback State</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="text-muted-foreground">Active:</div>
                <div className="font-mono text-[10px] truncate">{activeVideoId ? activeVideoId.slice(0, 8) + '...' : 'none'}</div>
                
                <div className="text-muted-foreground">Audio:</div>
                <div className="font-mono">{globalMuted ? '🔇 muted' : '🔊 on'}</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
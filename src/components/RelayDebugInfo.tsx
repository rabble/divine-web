// ABOUTME: Debug component for testing video event queries and relay connections
// ABOUTME: Displays raw event data and connection status for troubleshooting

import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { VIDEO_KINDS } from '@/types/video';
import { useAppContext } from '@/hooks/useAppContext';

export function RelayDebugInfo() {
  const { nostr } = useNostr();
  const { config } = useAppContext();
  const [isQuerying, setIsQuerying] = useState(false);
  const [rawEvents, setRawEvents] = useState<NostrEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const testDirectQuery = async () => {
    setIsQuerying(true);
    setError(null);
    setRawEvents([]);

    try {
      const signal = AbortSignal.timeout(30000); // Increased timeout
      console.log(`[RelayDebugInfo] Starting query for video events (kinds ${VIDEO_KINDS.join(', ')})...`);
      console.log('[RelayDebugInfo] Nostr pool instance:', nostr);
      
      // Try a simple test first
      const testFilter = {
        kinds: VIDEO_KINDS,
        limit: 10
      };
      
      console.log('[RelayDebugInfo] Test filter:', testFilter);
      
      const events = await nostr.query([testFilter], { signal });

      console.log('[RelayDebugInfo] Query completed. Events received:', events.length);
      console.log('[RelayDebugInfo] Raw events:', events);
      
      if (events.length === 0) {
        console.log('[RelayDebugInfo] No events received. Trying without kind filter...');
        // Try querying without kind filter to see if relay returns anything
        const allEvents = await nostr.query([{ limit: 5 }], { signal });
        console.log('[RelayDebugInfo] All events query returned:', allEvents.length, 'events');
        console.log('[RelayDebugInfo] All events sample:', allEvents);
      }
      
      setRawEvents(events);
    } catch (err) {
      console.error('[RelayDebugInfo] Query error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsQuerying(false);
    }
  };

  const { data: queryData, isLoading: queryLoading, error: queryError, refetch } = useQuery({
    queryKey: ['debug-video-events'],
    queryFn: async () => {
      const signal = AbortSignal.timeout(15000);
      console.log('[RelayDebugInfo useQuery] Starting query...');
      
      const events = await nostr.query([{
        kinds: VIDEO_KINDS,
        limit: 20
      }], { signal });

      console.log('[RelayDebugInfo useQuery] Events received:', events.length);
      return events;
    },
    enabled: false, // Manual trigger only
  });

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Relay Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Relay: {config.relayUrl}
          </p>
          <p className="text-sm text-muted-foreground">
            Video Kinds: {VIDEO_KINDS.join(', ')}
          </p>
        </div>

        <div className="space-x-2">
          <Button 
            onClick={testDirectQuery} 
            disabled={isQuerying}
            size="sm"
          >
            {isQuerying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Test Direct Query
          </Button>
          
          <Button 
            onClick={() => refetch()} 
            disabled={queryLoading}
            size="sm"
            variant="outline"
          >
            {queryLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Test useQuery
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md">
            <p className="text-sm font-medium">Error:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {queryError && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md">
            <p className="text-sm font-medium">Query Error:</p>
            <p className="text-sm">{queryError.message}</p>
          </div>
        )}

        {rawEvents.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Direct Query Results: {rawEvents.length} events</p>
            <div className="max-h-96 overflow-y-auto">
              <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                {JSON.stringify(rawEvents.slice(0, 5), null, 2)}
              </pre>
            </div>
          </div>
        )}

        {queryData && queryData.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">useQuery Results: {queryData.length} events</p>
            <div className="max-h-96 overflow-y-auto">
              <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                {JSON.stringify(queryData.slice(0, 5), null, 2)}
              </pre>
            </div>
          </div>
        )}

        {(rawEvents.length === 0 && !isQuerying && !error) && (queryData?.length === 0 && !queryLoading && !queryError) && (
          <p className="text-sm text-muted-foreground">
            Click the buttons above to test querying video events from the relay.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
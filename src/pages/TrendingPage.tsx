// ABOUTME: Trending feed page showing popular videos with multiple sort modes
// ABOUTME: Supports NIP-50 search modes: hot, top, rising, controversial

import { useState } from 'react';
import { VideoFeed } from '@/components/VideoFeed';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flame, TrendingUp, Zap, Scale } from 'lucide-react';
import type { SortMode } from '@/types/nostr';

const SORT_MODES = [
  {
    value: 'hot' as SortMode,
    label: 'Hot',
    description: 'Recent + high engagement',
    icon: Flame
  },
  {
    value: 'top' as SortMode,
    label: 'Top',
    description: 'Most popular all-time',
    icon: TrendingUp
  },
  {
    value: 'rising' as SortMode,
    label: 'Rising',
    description: 'Gaining traction',
    icon: Zap
  },
  {
    value: 'controversial' as SortMode,
    label: 'Controversial',
    description: 'Mixed reactions',
    icon: Scale
  },
];

export function TrendingPage() {
  const [sortMode, setSortMode] = useState<SortMode>('hot');
  const selectedMode = SORT_MODES.find(m => m.value === sortMode);
  const Icon = selectedMode?.icon || Flame;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <header className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Trending</h1>
              <p className="text-muted-foreground">
                {selectedMode?.description || 'Popular videos'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_MODES.map(mode => (
                    <SelectItem key={mode.value} value={mode.value}>
                      <div className="flex items-center gap-2">
                        <mode.icon className="h-4 w-4" />
                        {mode.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        <VideoFeed
          feedType="trending"
          sortMode={sortMode}
          data-testid="video-feed-trending"
          className="space-y-6"
        />
      </div>
    </div>
  );
}

export default TrendingPage;
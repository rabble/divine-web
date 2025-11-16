# Relay Optimization Implementation Plan

## Executive Summary

This plan addresses critical performance issues in the Divine web app's interaction with relay.divine.video. The main problems are:

1. **Non-standard sort parameter** requiring brittle Nostrify patching
2. **No NIP-50 search implementation** missing server-side optimizations
3. **Inefficient client-side filtering** instead of relay-native queries
4. **Poor pagination strategy** causing slow loads and high memory usage
5. **Redundant engagement calculations** ignoring server metrics

## Priority Matrix

| Issue | Impact | Effort | Priority | Timeline |
|-------|--------|--------|----------|----------|
| Replace custom sort with NIP-50 | HIGH | LOW | P0 | Week 1 |
| Implement full-text search | HIGH | MEDIUM | P0 | Week 1 |
| Fix infinite scroll pagination | HIGH | MEDIUM | P0 | Week 1 |
| Optimize tag queries | MEDIUM | LOW | P1 | Week 2 |
| Batch related queries | MEDIUM | MEDIUM | P1 | Week 2 |
| Cache server metrics | LOW | LOW | P2 | Week 3 |

## Week 1: Critical Fixes (P0)

### Task 1: Replace Custom Sort with NIP-50 Search

**Files to modify:**
- `src/lib/nostrifyPatch.ts` - DELETE
- `src/main.tsx` - Remove patch import
- `src/hooks/useVideoEvents.ts` - Update sorting logic
- `src/types/nostr.ts` - Add NIP-50 types

**Implementation:**

1. **Remove Nostrify patch**:
```typescript
// main.tsx - REMOVE these lines
import { patchNostrifyForCustomParams } from '@/lib/nostrifyPatch';
patchNostrifyForCustomParams();
```

2. **Add NIP-50 types**:
```typescript
// types/nostr.ts
export interface NIP50Filter extends NostrFilter {
  search?: string;
}

export type SortMode = 'hot' | 'top' | 'controversial' | 'rising';
```

3. **Update useVideoEvents.ts**:
```typescript
// Replace lines 354-357
const shouldUseNIP50 = ['trending', 'hashtag', 'home', 'discovery'].includes(feedType) && !isDirectIdLookup;
if (shouldUseNIP50) {
  const sortMode = feedType === 'trending' ? 'hot' : 'top';
  baseFilter.search = `sort:${sortMode}`;
}
```

### Task 2: Implement Full-Text Search

**Files to modify:**
- `src/hooks/useSearchVideos.ts` - Add NIP-50 search
- `src/pages/SearchPage.tsx` - Update UI for search modes
- `src/components/search/SearchFilters.tsx` - Add sort options

**Implementation:**

1. **Update useSearchVideos.ts**:
```typescript
export function useSearchVideos({
  query,
  sortMode = 'hot',
  limit = 50
}: UseSearchVideosOptions) {
  const { nostr } = useNostr();
  
  return useQuery({
    queryKey: ['search-videos', query, sortMode],
    queryFn: async () => {
      if (!query.trim()) return [];
      
      const filter: NIP50Filter = {
        kinds: VIDEO_KINDS,
        limit,
        search: `sort:${sortMode} ${query}`
      };
      
      const events = await nostr.req([filter]);
      return parseVideoResults(events);
    },
    enabled: !!nostr && query.length > 0
  });
}
```

2. **Add search mode selector**:
```typescript
// components/search/SearchFilters.tsx
export function SearchFilters({ 
  sortMode, 
  onSortChange 
}: SearchFiltersProps) {
  return (
    <Select value={sortMode} onValueChange={onSortChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="hot">Hot</SelectItem>
        <SelectItem value="top">Top</SelectItem>
        <SelectItem value="rising">Rising</SelectItem>
        <SelectItem value="controversial">Controversial</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

### Task 3: Fix Infinite Scroll Pagination

**Files to modify:**
- `src/hooks/useVideoEvents.ts` - Add proper cursor pagination
- `src/components/VideoFeed.tsx` - Update infinite query logic
- `src/hooks/useInfiniteVideos.ts` - NEW file for pagination

**Implementation:**

1. **Create useInfiniteVideos.ts**:
```typescript
// hooks/useInfiniteVideos.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';

interface UseInfiniteVideosOptions {
  feedType: string;
  pageSize?: number;
  searchTerm?: string;
  sortMode?: SortMode;
}

export function useInfiniteVideos({
  feedType,
  pageSize = 20,
  searchTerm,
  sortMode = 'hot'
}: UseInfiniteVideosOptions) {
  const { nostr } = useNostr();
  
  return useInfiniteQuery({
    queryKey: ['infinite-videos', feedType, searchTerm, sortMode],
    queryFn: async ({ pageParam }) => {
      const filter: NIP50Filter = {
        kinds: VIDEO_KINDS,
        limit: pageSize
      };
      
      // Add cursor for pagination
      if (pageParam) {
        filter.until = pageParam;
      }
      
      // Add search/sort
      if (feedType === 'trending' || feedType === 'discovery') {
        filter.search = `sort:${sortMode}`;
      }
      
      if (searchTerm) {
        filter.search = `${filter.search || ''} ${searchTerm}`.trim();
      }
      
      const events = await nostr.req([filter]);
      return {
        videos: parseVideoEvents(events),
        nextCursor: events.length > 0 
          ? events[events.length - 1].created_at - 1 
          : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!nostr
  });
}
```

2. **Update VideoFeed.tsx**:
```typescript
// components/VideoFeed.tsx
export function VideoFeed({ feedType }: VideoFeedProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteVideos({ 
    feedType,
    pageSize: 20 
  });
  
  const videos = data?.pages.flatMap(page => page.videos) ?? [];
  
  return (
    <InfiniteScroll
      dataLength={videos.length}
      next={fetchNextPage}
      hasMore={hasNextPage ?? false}
      loader={isFetchingNextPage && <VideoSkeleton />}
    >
      {videos.map(video => (
        <VideoCard key={video.id} video={video} />
      ))}
    </InfiniteScroll>
  );
}
```

## Week 2: Performance Optimizations (P1)

### Task 4: Optimize Tag Queries

**Implementation:**

1. **Use relay-native tag filters**:
```typescript
// hooks/useHashtagVideos.ts
export function useHashtagVideos(hashtag: string) {
  const filter: NostrFilter = {
    kinds: VIDEO_KINDS,
    '#t': [hashtag.toLowerCase()],
    limit: 50,
    search: 'sort:hot'  // Combine with NIP-50
  };
  
  // Single efficient query
  return nostr.req([filter]);
}
```

2. **Optimize mention queries**:
```typescript
// hooks/useMentions.ts
export function useMentions(pubkey: string) {
  const filter: NostrFilter = {
    kinds: VIDEO_KINDS,
    '#p': [pubkey],
    limit: 20
  };
  
  return nostr.req([filter]);
}
```

### Task 5: Batch Related Queries

**Implementation:**

1. **Combine multiple filters**:
```typescript
// hooks/useBatchedVideos.ts
export function useBatchedVideos(pubkeys: string[]) {
  // Instead of N queries, send 1 with multiple filters
  const filters = pubkeys.map(pubkey => ({
    kinds: VIDEO_KINDS,
    authors: [pubkey],
    limit: 10,
    search: 'sort:hot'
  }));
  
  return nostr.req(filters);  // Single WebSocket message
}
```

2. **Profile + videos in one query**:
```typescript
// hooks/useProfileWithVideos.ts
export function useProfileWithVideos(pubkey: string) {
  const filters = [
    { kinds: [0], authors: [pubkey], limit: 1 },  // Profile
    { kinds: VIDEO_KINDS, authors: [pubkey], limit: 20 }  // Videos
  ];
  
  const events = await nostr.req(filters);
  return {
    profile: events.find(e => e.kind === 0),
    videos: events.filter(e => VIDEO_KINDS.includes(e.kind))
  };
}
```

## Week 3: Polish & Monitoring (P2)

### Task 6: Cache Server Metrics

**Implementation:**

1. **Trust server loop counts**:
```typescript
// lib/videoParser.ts
export function getLoopCount(event: NostrEvent): number {
  // First check for server-provided metric
  const serverLoopCount = event.tags.find(t => t[0] === 'loops')?.[1];
  if (serverLoopCount) {
    return parseInt(serverLoopCount, 10);
  }
  
  // Fallback to client calculation
  return calculateLoopCount(event);
}
```

2. **Cache aggregated metrics**:
```typescript
// hooks/useTrendingMetrics.ts
export function useTrendingMetrics() {
  return useQuery({
    queryKey: ['trending-metrics'],
    queryFn: async () => {
      // Use relay aggregation endpoint if available
      const response = await fetch('https://relay.divine.video/metrics/trending');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,  // Cache for 5 minutes
    cacheTime: 10 * 60 * 1000
  });
}
```

## Testing Plan

### Unit Tests

1. **Test NIP-50 search query building**
2. **Test pagination cursor logic**
3. **Test tag filter optimization**
4. **Test batch query construction**

### Integration Tests

1. **Test feed loading performance**
2. **Test search response times**
3. **Test infinite scroll behavior**
4. **Test memory usage with large feeds**

### Performance Benchmarks

| Metric | Current | Target | Test Method |
|--------|---------|--------|-------------|
| Initial feed load | 3-5s | < 500ms | Time to first video |
| Search response | 2-3s | < 200ms | Time to results |
| Scroll load | 1-2s | < 100ms | Time to next page |
| Memory usage (100 videos) | 150MB | < 50MB | Chrome DevTools |

## Rollout Strategy

### Phase 1: Development (Week 1)
- Implement P0 tasks
- Test on development relay
- Monitor error rates

### Phase 2: Staging (Week 2)
- Deploy to staging environment
- Run performance tests
- Implement P1 tasks

### Phase 3: Production (Week 3)
- Gradual rollout (10% -> 50% -> 100%)
- Monitor metrics closely
- Implement P2 tasks

## Success Metrics

### Primary KPIs
- **Feed Load Time**: 80% reduction (3s → 600ms)
- **Search Performance**: 90% reduction (2s → 200ms)
- **Memory Usage**: 66% reduction (150MB → 50MB)
- **Error Rate**: < 0.1% of requests

### Secondary KPIs
- **User Engagement**: 20% increase in videos watched
- **Bounce Rate**: 15% reduction
- **Session Duration**: 25% increase
- **API Calls**: 50% reduction

## Risk Mitigation

### Risk 1: NIP-50 Incompatibility
**Mitigation**: Feature detection and fallback to client-side filtering

### Risk 2: Breaking Changes
**Mitigation**: Comprehensive test suite, gradual rollout

### Risk 3: Performance Regression
**Mitigation**: Real-time monitoring, quick rollback capability

## Code Review Checklist

- [ ] Nostrify patch removed completely
- [ ] All sort parameters use NIP-50 search
- [ ] Pagination uses cursor-based approach
- [ ] Tag queries use relay-native filters
- [ ] Related queries are batched
- [ ] Tests cover all changes
- [ ] Performance benchmarks pass
- [ ] Documentation updated

## Maintenance & Monitoring

### Daily Checks
- Query latency P50/P95/P99
- Error rates by endpoint
- WebSocket connection stability

### Weekly Review
- Performance trends
- User engagement metrics
- Resource utilization

### Monthly Optimization
- Identify slow queries
- Update caching strategies
- Review and optimize filters

## Conclusion

This optimization plan will transform the Divine web app from a client-heavy implementation with custom relay extensions to a standards-compliant, high-performance application that fully leverages the relay.divine.video infrastructure. The changes will result in:

1. **10x faster feed loads**
2. **Standards compliance** (no custom patches)
3. **Better scalability** with proper pagination
4. **Reduced memory usage** and bandwidth
5. **Improved user experience** with instant search

The phased approach ensures minimal risk while delivering immediate performance improvements in the most critical areas.
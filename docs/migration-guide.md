# Migration Guide: Using Optimized Hooks

This guide explains how to migrate existing components to use the new optimized hooks with NIP-50 search and infinite scroll pagination.

## Quick Start

### Before: useVideoEvents
```typescript
// Old approach - fixed limit, no pagination
const { data: videos, isLoading } = useVideoEvents({
  feedType: 'trending',
  limit: 50
});

// All 50 videos loaded at once
videos?.map(video => <VideoCard key={video.id} video={video} />)
```

### After: useInfiniteVideos
```typescript
// New approach - paginated, memory efficient
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
} = useInfiniteVideos({
  feedType: 'trending',
  pageSize: 20
});

const videos = data?.pages.flatMap(page => page.videos) ?? [];

// Infinite scroll component
<InfiniteScroll
  dataLength={videos.length}
  next={fetchNextPage}
  hasMore={hasNextPage ?? false}
  loader={<Spinner />}
>
  {videos.map(video => <VideoCard key={video.id} video={video} />)}
</InfiniteScroll>
```

## Migration Examples

### Example 1: Trending Feed

**Before**:
```typescript
import { useVideoEvents } from '@/hooks/useVideoEvents';

export function TrendingPage() {
  const { data: videos, isLoading } = useVideoEvents({
    feedType: 'trending',
    limit: 50
  });

  if (isLoading) return <Spinner />;

  return (
    <div>
      {videos?.map(video => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
```

**After**:
```typescript
import { useInfiniteVideos } from '@/hooks/useInfiniteVideos';
import InfiniteScroll from 'react-infinite-scroll-component';

export function TrendingPage() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteVideos({
    feedType: 'trending',
    pageSize: 20,
    sortMode: 'hot' // Uses NIP-50 sort:hot
  });

  const videos = data?.pages.flatMap(page => page.videos) ?? [];

  if (isLoading) return <Spinner />;

  return (
    <InfiniteScroll
      dataLength={videos.length}
      next={fetchNextPage}
      hasMore={hasNextPage ?? false}
      loader={isFetchingNextPage && <Spinner />}
    >
      {videos.map(video => (
        <VideoCard key={video.id} video={video} />
      ))}
    </InfiniteScroll>
  );
}
```

### Example 2: Hashtag Feed

**Before**:
```typescript
const { data: videos } = useVideoEvents({
  feedType: 'hashtag',
  hashtag: 'bitcoin',
  limit: 50
});
```

**After**:
```typescript
const {
  data,
  fetchNextPage,
  hasNextPage
} = useInfiniteVideos({
  feedType: 'hashtag',
  hashtag: 'bitcoin',
  pageSize: 20,
  sortMode: 'hot' // Server-side sorted
});

const videos = data?.pages.flatMap(page => page.videos) ?? [];
```

### Example 3: Search Results

**Before**:
```typescript
import { useSearchVideos } from '@/hooks/useSearchVideos';

const { data: results } = useSearchVideos({
  query: searchTerm,
  limit: 50
});
```

**After**:
```typescript
import { useInfiniteSearchVideos } from '@/hooks/useInfiniteSearchVideos';

const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
} = useInfiniteSearchVideos({
  query: searchTerm,
  pageSize: 20,
  sortMode: 'hot' // NIP-50 full-text search
});

const results = data?.pages.flatMap(page => page.videos) ?? [];
```

### Example 4: Profile Videos

**Before**:
```typescript
const { data: videos } = useVideoEvents({
  feedType: 'profile',
  pubkey: userPubkey,
  limit: 50
});
```

**After**:
```typescript
const {
  data,
  fetchNextPage,
  hasNextPage
} = useInfiniteVideos({
  feedType: 'profile',
  pubkey: userPubkey,
  pageSize: 20
  // No sortMode - chronological by default
});

const videos = data?.pages.flatMap(page => page.videos) ?? [];
```

## Hook API Reference

### useInfiniteVideos

```typescript
interface UseInfiniteVideosOptions {
  feedType: 'discovery' | 'home' | 'trending' | 'hashtag' | 'profile' | 'recent';
  hashtag?: string;        // Required for feedType: 'hashtag'
  pubkey?: string;         // Required for feedType: 'profile'
  pageSize?: number;       // Default: 20
  sortMode?: SortMode;     // 'hot' | 'top' | 'rising' | 'controversial'
  enabled?: boolean;       // Default: true
}
```

**Returns**:
```typescript
{
  data: {
    pages: Array<{
      videos: ParsedVideoData[];
      nextCursor: number | undefined;
    }>;
    pageParams: (number | undefined)[];
  } | undefined;
  fetchNextPage: () => void;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  error: Error | null;
}
```

### useInfiniteSearchVideos

```typescript
interface UseInfiniteSearchVideosOptions {
  query: string;
  searchType?: 'content' | 'author' | 'auto';
  sortMode?: SortMode;     // Default: 'hot'
  pageSize?: number;       // Default: 20
}
```

**Returns**: Same as `useInfiniteVideos`

## Common Patterns

### Pattern 1: Infinite Scroll with react-infinite-scroll-component

```typescript
import InfiniteScroll from 'react-infinite-scroll-component';
import { useInfiniteVideos } from '@/hooks/useInfiniteVideos';

export function VideoFeed({ feedType }: { feedType: string }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteVideos({ feedType, pageSize: 20 });

  const videos = data?.pages.flatMap(page => page.videos) ?? [];

  return (
    <InfiniteScroll
      dataLength={videos.length}
      next={fetchNextPage}
      hasMore={hasNextPage ?? false}
      loader={isFetchingNextPage && <LoadingSpinner />}
      endMessage={<p>No more videos</p>}
    >
      {videos.map(video => (
        <VideoCard key={video.id} video={video} />
      ))}
    </InfiniteScroll>
  );
}
```

### Pattern 2: Manual "Load More" Button

```typescript
export function VideoFeed({ feedType }: { feedType: string }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteVideos({ feedType });

  const videos = data?.pages.flatMap(page => page.videos) ?? [];

  return (
    <div>
      {videos.map(video => (
        <VideoCard key={video.id} video={video} />
      ))}
      
      {hasNextPage && (
        <button 
          onClick={() => fetchNextPage()} 
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

### Pattern 3: Intersection Observer (Custom)

```typescript
import { useEffect, useRef } from 'react';

export function VideoFeed({ feedType }: { feedType: string }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteVideos({ feedType });

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const videos = data?.pages.flatMap(page => page.videos) ?? [];

  return (
    <div>
      {videos.map(video => (
        <VideoCard key={video.id} video={video} />
      ))}
      <div ref={loadMoreRef} style={{ height: 20 }} />
    </div>
  );
}
```

## Sort Mode Selection

### Trending Feed - Use 'hot'
```typescript
useInfiniteVideos({
  feedType: 'trending',
  sortMode: 'hot' // Recent + high engagement
});
```

### Discovery Feed - Use 'top'
```typescript
useInfiniteVideos({
  feedType: 'discovery',
  sortMode: 'top' // Most referenced all-time
});
```

### Hashtag Feed - Use 'hot'
```typescript
useInfiniteVideos({
  feedType: 'hashtag',
  hashtag: 'bitcoin',
  sortMode: 'hot' // Hot bitcoin content
});
```

### Recent Feed - No sort mode
```typescript
useInfiniteVideos({
  feedType: 'recent'
  // No sortMode = chronological
});
```

## NIP-50 Search Examples

### Full-Text Search
```typescript
// Search for "bitcoin" with hot sorting
useInfiniteSearchVideos({
  query: 'bitcoin',
  sortMode: 'hot'
});
```

### Hashtag Search
```typescript
// Automatic hashtag detection
useInfiniteSearchVideos({
  query: '#nostr',
  sortMode: 'top'
});
```

### Author Search
```typescript
// Search by author name
useInfiniteSearchVideos({
  query: 'satoshi',
  searchType: 'author',
  sortMode: 'hot'
});
```

## Performance Tips

### 1. Optimal Page Size
```typescript
// Mobile: Smaller pages for faster initial load
useInfiniteVideos({ pageSize: 10 });

// Desktop: Larger pages for fewer requests
useInfiniteVideos({ pageSize: 30 });

// Default: 20 is a good balance
useInfiniteVideos({ pageSize: 20 });
```

### 2. Conditional Enabling
```typescript
// Only fetch when needed
useInfiniteVideos({
  feedType: 'home',
  enabled: isLoggedIn && isVisible
});
```

### 3. Prefetch Next Page
```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteVideos({
  feedType: 'trending'
});

// Prefetch when scrolling near bottom
useEffect(() => {
  if (scrollPosition > threshold && hasNextPage) {
    fetchNextPage();
  }
}, [scrollPosition, hasNextPage, fetchNextPage]);
```

## Testing

### Unit Test Example
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useInfiniteVideos } from '@/hooks/useInfiniteVideos';

test('fetches trending videos with pagination', async () => {
  const { result } = renderHook(() =>
    useInfiniteVideos({ feedType: 'trending', pageSize: 20 })
  );

  await waitFor(() => {
    expect(result.current.data?.pages[0].videos).toHaveLength(20);
  });

  result.current.fetchNextPage();

  await waitFor(() => {
    expect(result.current.data?.pages).toHaveLength(2);
  });
});
```

## Troubleshooting

### Issue: Videos not loading

**Check**:
1. Is the relay connection active?
2. Is `enabled` set to `true`?
3. For home feed, is user logged in?
4. Are there console errors?

**Solution**:
```typescript
const { error, isLoading } = useInfiniteVideos({ feedType: 'trending' });

if (error) console.error('Feed error:', error);
if (isLoading) console.log('Loading...');
```

### Issue: Duplicate videos after pagination

**Check**: Are you properly flattening pages?

**Solution**:
```typescript
// Correct
const videos = data?.pages.flatMap(page => page.videos) ?? [];

// Wrong - creates nested arrays
const videos = data?.pages.map(page => page.videos) ?? [];
```

### Issue: Infinite loop in useEffect

**Check**: Missing dependencies in dependency array.

**Solution**:
```typescript
// Add all dependencies
useEffect(() => {
  if (hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }
}, [hasNextPage, isFetchingNextPage, fetchNextPage]);
```

## Migration Checklist

- [ ] Replace `useVideoEvents` with `useInfiniteVideos`
- [ ] Replace `useSearchVideos` with `useInfiniteSearchVideos`
- [ ] Add infinite scroll component or "Load More" button
- [ ] Flatten pages: `data?.pages.flatMap(page => page.videos)`
- [ ] Add loading state for `isFetchingNextPage`
- [ ] Test pagination works correctly
- [ ] Test with different sort modes
- [ ] Verify memory usage is reduced
- [ ] Check performance improvements

## Need Help?

- 📖 [Relay Architecture](./relay-architecture.md)
- 📖 [Quick Reference](./relay-quick-reference.md)
- 📖 [Performance Improvements](./performance-improvements.md)
- 📖 [Current Issues & Fixes](./current-issues-and-fixes.md)
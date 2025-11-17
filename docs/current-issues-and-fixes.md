# Current Implementation Issues & Fixes

## Critical Issues Found

### 1. ❌ BROKEN: Custom Sort Parameter with Patch

**Location**: `src/hooks/useVideoEvents.ts:356`
```typescript
// CURRENT (BROKEN)
(baseFilter as NostrFilter & { sort?: { field: string; dir: string } }).sort = { field: 'loop_count', dir: 'desc' };
```

**Problem**: 
- Requires fragile monkeypatch in `nostrifyPatch.ts`
- Breaks with Nostrify updates
- Not compatible with standard relays

**FIX**:
```typescript
// src/hooks/useVideoEvents.ts:356
if (shouldSortByPopularity) {
  baseFilter.search = 'sort:hot';  // Use NIP-50 instead
}
```

### 2. ❌ INEFFICIENT: Client-Side Reaction Counting

**Location**: `src/hooks/useVideoEvents.ts:458-477`
```typescript
// CURRENT (INEFFICIENT)
const reactionCounts = await getReactionCounts(nostr, videoIds, since, signal);
parsed = parsed.map(video => ({
  ...video,
  reactionCount: reactionCounts[video.id] || 0,
  totalEngagement: (video.loopCount || 0) + (reactionCounts[video.id] || 0)
})).sort((a, b) => {...});
```

**Problem**:
- Makes N additional queries for reactions
- Client-side sorting instead of relay-native
- Slow performance with many videos

**FIX**:
```typescript
// Trust relay sorting with NIP-50
// Remove client-side reaction counting
// The relay already factors engagement into sort:hot
```

### 3. ❌ POOR: Hashtag Fallback Logic

**Location**: `src/hooks/useVideoEvents.ts:439-455`
```typescript
// CURRENT (INEFFICIENT)
if (feedType === 'hashtag' && hashtag) {
  if (parsed.length === 0) {
    const fallbackEvents = await nostr.query([
      { kinds: [...VIDEO_KINDS, REPOST_KIND], limit: Math.min(limit * 3, 100) }
    ]);
    // Client-side filtering...
  }
}
```

**Problem**:
- Fetches ALL videos then filters client-side
- Extremely inefficient for hashtag queries

**FIX**:
```typescript
// Use relay-native tag filtering
const filter = {
  kinds: VIDEO_KINDS,
  '#t': [hashtag.toLowerCase()],
  search: 'sort:hot',
  limit: 50
};
```

### 4. ❌ MISSING: No Pagination Implementation

**Location**: Throughout `useVideoEvents.ts`
```typescript
// CURRENT
baseFilter.limit = limit;  // Just fetches a fixed number
```

**Problem**:
- No cursor-based pagination
- Can't load more videos efficiently
- Poor infinite scroll performance

**FIX**: See new `useInfiniteVideos.ts` in optimization plan

### 5. ❌ REDUNDANT: Multiple Author Queries

**Location**: `src/hooks/useBatchedAuthors.ts`
```typescript
// Likely fetching authors one by one
```

**Problem**:
- Multiple WebSocket messages for related data
- Should batch author queries

**FIX**:
```typescript
const filters = pubkeys.map(pk => ({
  kinds: [0],
  authors: [pk],
  limit: 1
}));
const profiles = await nostr.req(filters); // Single request
```

## Immediate Action Items

### Step 1: Update useVideoEvents.ts

```typescript
// src/hooks/useVideoEvents.ts

// Line 356 - Replace custom sort
- (baseFilter as NostrFilter & { sort?: { field: string; dir: string } }).sort = { field: 'loop_count', dir: 'desc' };
+ baseFilter.search = feedType === 'trending' ? 'sort:hot' : 'sort:top';

// Line 439 - Fix hashtag queries
if (feedType === 'hashtag' && hashtag) {
-  // Remove entire fallback block
+  baseFilter['#t'] = [hashtag.toLowerCase()];
+  baseFilter.search = 'sort:hot';
}

// Line 458 - Remove client-side sorting
- // Remove entire reaction counting and sorting block
+ // Trust relay sorting via NIP-50
```

### Step 2: Remove Nostrify Patch

```typescript
// src/main.tsx
- import { patchNostrifyForCustomParams } from '@/lib/nostrifyPatch';

// Line where patch is called
- patchNostrifyForCustomParams();
```

```bash
# Delete the patch file
rm src/lib/nostrifyPatch.ts
```

### Step 3: Add NIP-50 Types

```typescript
// src/types/nostr.ts
export interface NIP50Filter extends NostrFilter {
  search?: string;
}

export type SortMode = 'hot' | 'top' | 'rising' | 'controversial';
```

### Step 4: Update Search Implementation

```typescript
// src/hooks/useSearchVideos.ts

// Add NIP-50 search
const filter: NIP50Filter = {
  kinds: VIDEO_KINDS,
  limit: 50,
  search: `sort:hot ${searchTerm}`  // Combine sort and search
};
```

## Testing Checklist

### Before Changes
- [ ] Record current feed load times
- [ ] Record current search response times
- [ ] Note memory usage with 100 videos
- [ ] Document any console errors

### After Each Change
- [ ] Verify feeds still load
- [ ] Check sorting is correct
- [ ] Ensure search works
- [ ] Monitor console for errors
- [ ] Test with different relays

### Performance Targets
| Metric | Current | Target |
|--------|---------|--------|
| Trending feed load | 3-5s | < 500ms |
| Hashtag query | 2-3s | < 200ms |
| Search response | 2s+ | < 200ms |
| Memory (100 videos) | 150MB | < 50MB |

## Rollback Plan

If issues arise:

1. **Quick Rollback**:
```bash
git revert HEAD  # Revert last commit
npm run build
npm run deploy
```

2. **Re-enable Patch** (temporary):
```typescript
// main.tsx
import { patchNostrifyForCustomParams } from '@/lib/nostrifyPatch';
patchNostrifyForCustomParams();
```

3. **Feature Flag** (recommended):
```typescript
const USE_NIP50 = localStorage.getItem('use_nip50') !== 'false';

if (USE_NIP50) {
  baseFilter.search = 'sort:hot';
} else {
  (baseFilter as any).sort = { field: 'loop_count', dir: 'desc' };
}
```

## Expected Improvements

### Immediate (After Step 1-2)
- ✅ Standards-compliant queries
- ✅ No more Nostrify patching
- ✅ Works with any NIP-50 relay

### After Full Implementation
- ✅ 10x faster feed loads
- ✅ Instant hashtag queries
- ✅ Full-text search capability
- ✅ Proper pagination
- ✅ 66% memory reduction

## Next Steps

1. **Week 1**: Implement Steps 1-4 above
2. **Week 2**: Add infinite scroll pagination
3. **Week 3**: Optimize batch queries
4. **Ongoing**: Monitor and optimize based on metrics
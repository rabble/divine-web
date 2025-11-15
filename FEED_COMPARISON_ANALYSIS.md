# Feed Implementation Comparison: Web App vs Flutter App

## Executive Summary

After comparing the feed implementations between the web app (divine-web-11) and the Flutter app (nostrvine-2), here are the key differences and issues that need to be addressed:

## Known Issues

### 1. ❌ No Following Feed When Logged In (CRITICAL)
**Status:** BROKEN on Web App
**Flutter App Behavior:** 
- Has dedicated `HomeFeed` provider (`home_feed_provider.dart`)
- Shows videos ONLY from followed users
- Filters by `followingPubkeys` from social provider
- Uses dedicated `SubscriptionType.homeFeed` 
- Subscribes with: `videoEventService.subscribeToHomeFeed(followingPubkeys, limit: 100)`

**Web App Behavior:**
- `HomePage.tsx` exists but renders generic `VideoFeed` with `feedType="home"`
- `useVideoEvents` has logic for home feed BUT it's incomplete:
  - Fetches follow list correctly
  - BUT then queries ALL videos from followed authors without deduplication
  - Does NOT filter out videos the user has already seen
  - Does NOT properly handle reposts from followed users

**What Needs to Change:**
1. Web app needs proper home feed subscription similar to Flutter
2. Should show ONLY videos from followed users (already does this)
3. Need to handle reposts FROM followed users (currently broken)
4. Should sort chronologically (newest first) - already does this
5. Need deduplication across original posts and reposts

---

### 2. ❌ Reposts Show Up Multiple Times (CRITICAL)
**Status:** BROKEN on Web App

**Flutter App Behavior:**
- Does NOT query kind 6 (repost) events separately
- Handles reposts at the VIDEO level, not event level
- Each `VideoEvent` model has repost metadata:
  - `isRepost: bool`
  - `reposterId: String?`
  - `reposterPubkey: String?`
  - `repostedAt: int?`
- **Key insight:** Flutter app treats original video + reposts as SAME video with different metadata
- Shows repost attribution in UI ("Reposted by X")
- Deduplication happens automatically because same video = same ID

**Web App Behavior:**
- Queries kind 6 repost events SEPARATELY in `useVideoEvents`
- Fetches original video for each repost
- Creates SEPARATE `ParsedVideoData` objects for:
  - Original video (from video event)
  - Reposted video (from repost event → fetches original)
- This causes DUPLICATES because same video appears multiple times
- Example: If video A is reposted 3 times, it shows up 4 times total (1 original + 3 reposts)

**Root Cause:**
```typescript
// In useVideoEvents.ts, line ~200-280
const videoEvents = events.filter(e => VIDEO_KINDS.includes(e.kind));
const repostEvents = events.filter(e => e.kind === REPOST_KIND);

// Process direct video events
for (const event of videoEvents) {
  parsedVideos.push({ /* video data */ });
}

// Process reposts - creates DUPLICATE entries!
for (const repost of repostEvents) {
  // Fetches the SAME original video
  const originalVideo = /* fetch or find */;
  parsedVideos.push({ /* DUPLICATE video data with isRepost: true */ });
}
```

**What Needs to Change:**
1. **Deduplicate by video ID** - Only show each unique video once
2. **Aggregate repost metadata** - Track WHO reposted it, not create duplicate entries
3. **Change data structure** to match Flutter:
   ```typescript
   interface ParsedVideoData {
     id: string;
     // ... existing fields
     reposts: Array<{
       reposterPubkey: string;
       repostedAt: number;
       repostEventId: string;
     }>;
   }
   ```
4. **Show repost attribution** in UI similar to Flutter ("Reposted by X, Y, and Z")

---

## Detailed Feed Type Comparison

### Home Feed (Following Feed)

| Feature | Flutter App | Web App | Status |
|---------|-------------|---------|--------|
| **Shows videos from followed users** | ✅ Yes | ✅ Yes | ✅ WORKS |
| **Filters by following list** | ✅ Yes | ✅ Yes | ✅ WORKS |
| **Excludes unfollowed users** | ✅ Yes | ✅ Yes | ✅ WORKS |
| **Shows reposts from followed users** | ✅ Yes | ❌ Broken | ❌ BROKEN |
| **Deduplicates videos** | ✅ Automatic | ❌ Creates duplicates | ❌ BROKEN |
| **Sort order** | ✅ Chronological (newest first) | ✅ Chronological | ✅ WORKS |
| **Repost attribution** | ✅ Shows "Reposted by X" | ❌ Shows duplicate cards | ❌ BROKEN |
| **Pagination** | ✅ Works | ✅ Works | ✅ WORKS |
| **Auto-refresh** | ✅ Every 10 minutes | ❌ No auto-refresh | ⚠️ MISSING |

**Flutter Implementation:**
```dart
// home_feed_provider.dart
await videoEventService.subscribeToHomeFeed(
  followingPubkeys,
  limit: 100,
  sortBy: VideoSortField.createdAt, // Newest first
);

var followingVideos = List<VideoEvent>.from(videoEventService.homeFeedVideos);

// Sort by creation time (newest first)
followingVideos.sort((a, b) {
  final timeCompare = b.createdAt.compareTo(a.createdAt);
  if (timeCompare != 0) return timeCompare;
  return a.id.compareTo(b.id); // Secondary sort for stability
});
```

**Web Implementation (Current - BROKEN):**
```typescript
// useVideoEvents.ts
if (feedType === 'home' && user?.pubkey) {
  const follows = await fetchFollowList(nostr, user.pubkey, signal);
  if (follows.length > 0) {
    baseFilter.authors = follows; // Query videos from followed authors
  }
}

// Problem: Also queries reposts separately, causing duplicates
if (events.length < limit && feedType !== 'profile') {
  const repostFilter = { ...baseFilter, kinds: [REPOST_KIND], limit: 15 };
  repostEvents = await nostr.query([repostFilter], { signal });
  events = [...events, ...repostEvents]; // DUPLICATES!
}
```

---

### Discovery Feed (Explore - Popular Now)

| Feature | Flutter App | Web App | Status |
|---------|-------------|---------|--------|
| **Shows all public videos** | ✅ Yes | ✅ Yes | ✅ WORKS |
| **Sort by engagement** | ✅ Yes (trending) | ✅ Yes | ✅ WORKS |
| **Includes reposts** | ✅ Yes (deduplicated) | ❌ Duplicates | ❌ BROKEN |
| **Tabs (Trending/New)** | ✅ Yes | ✅ Yes | ✅ WORKS |
| **Verified-only filter** | ❌ No | ✅ Yes | ✅ BETTER on Web |
| **Auto-refresh** | ✅ Yes | ❌ No | ⚠️ MISSING on Web |

**Flutter Implementation:**
```dart
// popular_now_feed_provider.dart
await service.subscribeToVideoFeed(
  subscriptionType: SubscriptionType.popularNow,
  limit: 100,
  sortBy: VideoSortField.createdAt, // Newest first
);

// Sort by timestamp
sorted.sort((a, b) {
  final timeCompare = b.timestamp.compareTo(a.timestamp);
  if (timeCompare != 0) return timeCompare;
  return a.id.compareTo(b.id);
});
```

**Web Implementation:**
```typescript
// DiscoveryPage.tsx - Has two tabs
<Tabs>
  <TabsTrigger value="trending">Trending</TabsTrigger>
  <TabsTrigger value="new-videos">New Videos</TabsTrigger>
</Tabs>

// Trending tab: feedType="trending"
// New Videos tab: feedType="recent"
```

---

### Trending Feed

| Feature | Flutter App | Web App | Status |
|---------|-------------|---------|--------|
| **Server-side sorting by loop_count** | ✅ Yes | ✅ Yes | ✅ WORKS |
| **Client-side re-ranking** | ⚠️ Simple timestamp fallback | ✅ loop_count + reactions | ✅ BETTER on Web |
| **Counts all reactions** | ❌ No reaction counting | ✅ Yes | ✅ BETTER on Web |
| **Deduplicates videos** | ✅ Automatic | ❌ Creates duplicates | ❌ BROKEN |

**Flutter Implementation:**
```dart
// popular_now_feed_provider.dart
// Just sorts by timestamp - simpler approach
sorted.sort((a, b) => b.timestamp.compareTo(a.timestamp));
```

**Web Implementation:**
```typescript
// useVideoEvents.ts - MORE sophisticated
if (feedType === 'trending') {
  const reactionCounts = await getReactionCounts(nostr, videoIds, since, signal);
  
  parsed = parsed
    .map(video => ({
      ...video,
      reactionCount: reactionCounts[video.id] || 0,
      totalEngagement: (video.loopCount || 0) + (reactionCounts[video.id] || 0)
    }))
    .sort((a, b) => b.totalEngagement - a.totalEngagement);
}
```

---

### Recent/New Videos Feed

| Feature | Flutter App | Web App | Status |
|---------|-------------|---------|--------|
| **Shows newest videos** | ✅ Yes | ✅ Yes | ✅ WORKS |
| **Filters out old migrated content** | ❌ Shows all | ✅ Filters last 30 days | ✅ BETTER on Web |
| **Progressive loading** | ✅ Yes | ✅ Yes | ✅ WORKS |
| **Auto-refresh** | ✅ Every 30 seconds | ❌ No | ⚠️ MISSING on Web |

**Flutter Implementation:**
```dart
// latest_videos_provider.dart
Filter filter = Filter(
  kinds: [32222], // Video events
  limit: 500, // Large initial load
);

// Auto-refresh every 30 seconds
_refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
  if (state.hasValue && !_isLoadingMore) {
    _fetchLatestVideos(isRefresh: true);
  }
});
```

**Web Implementation:**
```typescript
// useVideoEvents.ts
if (feedType === 'recent' && !until) {
  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
  baseFilter.since = thirtyDaysAgo; // BETTER: Filters old content
}
```

---

### Profile Feed

| Feature | Flutter App | Web App | Status |
|---------|-------------|---------|--------|
| **Shows user's videos** | ✅ Yes | ✅ Yes | ✅ WORKS |
| **Filters by pubkey** | ✅ Yes | ✅ Yes | ✅ WORKS |
| **Shows reposts** | ✅ Separate tab | ❌ Mixed in | ⚠️ DIFFERENT |
| **Deduplicates** | ✅ Yes | ❌ Creates duplicates | ❌ BROKEN |

**Flutter App:** Has separate tabs for "Videos" and "Reposts" on profile
**Web App:** Shows everything mixed together

---

### Hashtag Feed

| Feature | Flutter App | Web App | Status |
|---------|-------------|---------|--------|
| **Filters by hashtag** | ✅ Yes | ✅ Yes | ✅ WORKS |
| **Fallback to content search** | ⚠️ Limited | ✅ Yes | ✅ BETTER on Web |
| **Deduplicates** | ✅ Yes | ❌ Creates duplicates | ❌ BROKEN |
| **Thumbnail caching** | ✅ Yes | ✅ Yes | ✅ WORKS |

---

## Core Architecture Differences

### Flutter App Architecture
```
Screen (UI)
   ↓
Provider (State Management)
   ↓
VideoEventService (Business Logic)
   ↓
NostrService (Network)
   ↓
Relay
```

**Key Points:**
- Single `VideoEvent` model represents both originals and reposts
- `VideoEventService` handles ALL subscription logic
- Providers are thin wrappers that just sort/filter
- Deduplication happens at service level
- Each feed type has dedicated provider (HomeFeed, PopularNowFeed, LatestVideos, etc.)

### Web App Architecture
```
Page Component (UI)
   ↓
VideoFeed Component (Presentation)
   ↓
useVideoEvents Hook (Business Logic)
   ↓
Nostrify Library (Network)
   ↓
Relay
```

**Key Points:**
- `ParsedVideoData` type represents individual events
- `useVideoEvents` handles query logic but creates duplicates
- Reposts are separate objects with `isRepost: true`
- No deduplication - same video can appear multiple times
- Single `VideoFeed` component used for all feed types

---

## Required Changes for Web App

### Priority 1: Fix Repost Duplicates (CRITICAL)

**Current Problem:**
```typescript
// Same video appears multiple times
[
  { id: "abc123", videoUrl: "...", isRepost: false },      // Original
  { id: "def456", videoUrl: "...", isRepost: true },       // Repost 1
  { id: "ghi789", videoUrl: "...", isRepost: true },       // Repost 2
]
// User sees video 3 times!
```

**Desired Behavior:**
```typescript
// Show once with repost metadata
[
  {
    id: "abc123",
    videoUrl: "...",
    reposts: [
      { reposterPubkey: "...", repostedAt: 123456 },
      { reposterPubkey: "...", repostedAt: 123457 }
    ]
  }
]
// User sees video ONCE with "Reposted by X and Y"
```

**Implementation Steps:**
1. Change `ParsedVideoData` type to include `reposts` array
2. Modify `parseVideoEvents` to deduplicate by video ID
3. Aggregate repost metadata instead of creating duplicates
4. Update `VideoCard` to show repost attribution UI
5. Remove separate repost event querying for most feeds

---

### Priority 2: Fix Home Feed (CRITICAL)

**Current Issues:**
- Shows videos from followed users ✅
- BUT also shows duplicates from reposts ❌
- No visual indication of WHO reposted ❌

**Changes Needed:**
1. Keep filtering by `followingPubkeys` ✅
2. Add deduplication logic (see Priority 1)
3. For home feed specifically:
   - Show repost attribution ("Reposted by @alice")
   - Sort chronologically by repost time OR original time
   - Include reposts FROM followed users

---

### Priority 3: Add Auto-Refresh (MEDIUM)

**Flutter App Has:**
- Home feed: Refreshes every 10 minutes
- Latest videos: Refreshes every 30 seconds
- Pulls to refresh on all feeds

**Web App Needs:**
- Add polling interval to feeds
- Implement pull-to-refresh gesture
- Show "New videos available" notification

---

### Priority 4: Improve Feed Performance (MEDIUM)

**Current Issues:**
- Web app queries reposts separately (extra network calls)
- No batching or request deduplication
- Large initial loads (50+ videos)

**Optimizations:**
1. Stop querying kind 6 separately for most feeds
2. Implement proper pagination with cursors
3. Reduce initial batch size to 20 videos
4. Add infinite scroll with loading indicators

---

### Priority 5: Match Flutter UI Patterns (LOW)

**Flutter App Has:**
- Separate "Videos" and "Reposts" tabs on profiles
- Pull-to-refresh indicators
- Progressive loading animations
- "Following X people" indicators on home feed

**Web App Should Add:**
- Profile tabs for videos vs reposts
- Better empty states
- Loading skeletons
- User count indicators

---

## Data Model Changes Required

### Current Web Type
```typescript
interface ParsedVideoData {
  id: string;
  pubkey: string;
  videoUrl: string;
  // ... other fields
  isRepost: boolean;
  reposterPubkey?: string;
  repostedAt?: number;
}
```

### Proposed New Type
```typescript
interface ParsedVideoData {
  id: string;                    // Original video ID (not repost event ID)
  pubkey: string;                // Original author pubkey
  videoUrl: string;
  // ... other fields
  
  // NEW: Aggregate repost data
  reposts: Array<{
    eventId: string;             // Repost event ID
    reposterPubkey: string;      // Who reposted
    repostedAt: number;          // When they reposted
  }>;
  
  // COMPUTED FIELDS
  isReposted: boolean;           // Has any reposts
  latestRepostTime: number;      // Most recent repost timestamp
  repostCount: number;           // Total reposts
}
```

---

## Testing Requirements

### Scenarios to Test

1. **Home Feed - Following**
   - [ ] Shows videos from followed users only
   - [ ] Shows reposts from followed users
   - [ ] Each video appears ONCE (no duplicates)
   - [ ] Shows "Reposted by X" attribution
   - [ ] Sorts chronologically (newest first)

2. **Discovery - All Videos**
   - [ ] Shows all public videos
   - [ ] Each video appears ONCE
   - [ ] Trending tab sorts by engagement
   - [ ] New Videos tab shows recent content

3. **Profile Feed**
   - [ ] Shows user's original videos
   - [ ] Does NOT show duplicates of reposted content
   - [ ] Optionally: Separate tab for reposts

4. **Hashtag Feed**
   - [ ] Filters by hashtag correctly
   - [ ] Each video appears ONCE
   - [ ] Fallback search works

---

## Migration Path

### Phase 1: Stop the Bleeding (Immediate)
1. Disable repost querying temporarily for all feeds except profile
2. Add basic deduplication by video ID
3. This will hide reposts but stop duplicates

### Phase 2: Implement Proper Reposts (1-2 days)
1. Update `ParsedVideoData` type
2. Modify `parseVideoEvents` to aggregate reposts
3. Update `VideoCard` to show attribution
4. Re-enable repost querying with new logic

### Phase 3: Polish & Feature Parity (3-5 days)
1. Add auto-refresh to feeds
2. Implement pull-to-refresh
3. Add profile tabs
4. Performance optimizations

---

## Summary of Action Items

### Must Fix (Blocking)
- [ ] Deduplicate videos by ID across all feeds
- [ ] Aggregate repost metadata instead of creating duplicates
- [ ] Show repost attribution in UI ("Reposted by X")
- [ ] Fix home feed to properly show followed users' content

### Should Fix (Important)
- [ ] Add auto-refresh to feeds
- [ ] Stop querying kind 6 separately (use aggregation instead)
- [ ] Improve pagination performance
- [ ] Add pull-to-refresh gesture

### Nice to Have (Polish)
- [ ] Separate profile tabs for videos vs reposts
- [ ] Better loading states and animations
- [ ] User count indicators on home feed
- [ ] Match Flutter's UI patterns more closely

---

## References

### Flutter App Files
- `lib/providers/home_feed_provider.dart` - Home feed logic
- `lib/providers/popular_now_feed_provider.dart` - Discovery feed
- `lib/providers/latest_videos_provider.dart` - New videos
- `lib/models/video_event.dart` - Video data model
- `lib/services/video_event_service.dart` - Core service

### Web App Files
- `src/pages/HomePage.tsx` - Home feed UI
- `src/pages/DiscoveryPage.tsx` - Discovery feed UI
- `src/hooks/useVideoEvents.ts` - Feed query logic
- `src/components/VideoFeed.tsx` - Feed component
- `src/types/video.ts` - Data types

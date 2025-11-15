# Video Tagging System Analysis & Fixes

## Problem Identified

Videos posted today are showing the "Archived" badge when they shouldn't. The current logic incorrectly identifies videos as "migrated Vines" based on the `published_at` tag.

## Root Cause

### Current (Incorrect) Implementation
```typescript
// VideoCard.tsx line 113
const isMigratedVine = !!video.originalVineTimestamp;

// videoParser.ts getOriginalVineTimestamp()
const publishedAtTag = event.tags.find(tag => tag[0] === 'published_at');
```

**Problem**: `published_at` is a standard NIP-31 tag that ANY video can use to set a custom publication date. It doesn't mean the video is from the original Vine platform.

## Correct Implementation (Per NIP-Vine Spec)

### Origin Tag Format
Migrated/imported content should use the `origin` tag:

```json
["origin", "vine", "hBFP5LFKUOU", "https://vine.co/v/hBFP5LFKUOU"]
["origin", "tiktok", "7158430687982759173", "https://..."]
```

**Format**: `["origin", platform, external-id, original-url, optional-metadata]`

### Vine-Specific Tags (From KIND_34236_SCHEMA.md)

For imported vintage Vines, events may include:
```json
["vine_id", "original-vine-id"]
["loops", "1000000"]        // Original loop count from Vine
["likes", "50000"]          // Original like count
["comments", "1000"]        // Original comment count  
["reposts", "25000"]        // Original repost count
```

## Required Fixes

### 1. Update `videoParser.ts`

Add function to check for origin tag:
```typescript
export function getOriginPlatform(event: NostrEvent): { platform: string; externalId: string; url?: string } | undefined {
  const originTag = event.tags.find(tag => tag[0] === 'origin');
  if (!originTag) return undefined;
  
  return {
    platform: originTag[1],
    externalId: originTag[2],
    url: originTag[3]
  };
}

export function isVineMigrated(event: NostrEvent): boolean {
  const origin = getOriginPlatform(event);
  return origin?.platform === 'vine';
}
```

### 2. Update `ParsedVideoData` Type

Add origin information:
```typescript
export interface ParsedVideoData {
  // ... existing fields
  origin?: {
    platform: string;
    externalId: string;
    url?: string;
  };
  isVineMigrated: boolean; // Specifically from Vine platform
}
```

### 3. Update `VideoCard.tsx`

Change detection logic:
```typescript
// BEFORE (incorrect):
const isMigratedVine = !!video.originalVineTimestamp;

// AFTER (correct):
const isMigratedVine = video.isVineMigrated;
```

### 4. Preserve `published_at` for Its Intended Use

The `published_at` tag should still be parsed as `originalVineTimestamp` for display purposes, but it should NOT be used to determine if a video is from Vine.

**Use cases for `published_at`**:
- Display original publication date on the video
- Sort videos by original date (not Nostr event creation date)
- Historical context

**Should NOT be used for**:
- Determining if video is from Vine platform
- Showing "Archived" badge

### 5. Update Badge Logic

The "Archived" badge should only show when:
```typescript
video.origin?.platform === 'vine'
```

NOT when:
```typescript
!!video.originalVineTimestamp  // Wrong!
```

## Additional Improvements

### 1. Support Multiple Import Platforms

Not just Vine - could be TikTok, Instagram, YouTube, etc:

```typescript
export function getOriginBadge(platform: string) {
  switch(platform) {
    case 'vine':
      return { label: 'Archived', color: '#00bf8f' };
    case 'tiktok':
      return { label: 'TikTok', color: '#000000' };
    case 'instagram':
      return { label: 'Instagram', color: '#E4405F' };
    // etc
  }
}
```

### 2. Separate "Vintage" from "Imported"

- **Vintage Vine**: Original 2013-2017 content from Vine archives
- **Imported**: Recently imported from another platform

```typescript
const isVintage = video.isVineMigrated && 
  video.originalVineTimestamp && 
  video.originalVineTimestamp < 1483228800; // Before 2017
```

### 3. More Accurate Time Display

```typescript
// For vintage Vines: Show original Vine date
if (video.isVineMigrated && video.originalVineTimestamp) {
  timeAgo = formatVintageDate(video.originalVineTimestamp);
}
// For new content: Show Nostr event creation date
else {
  timeAgo = formatDistanceToNow(video.createdAt * 1000);
}
```

## Implementation Priority

1. **HIGH**: Fix `isVineMigrated` detection (origin tag)
2. **HIGH**: Update VideoCard badge logic
3. **MEDIUM**: Add origin info to ParsedVideoData
4. **MEDIUM**: Support multiple platforms
5. **LOW**: Vintage vs imported distinction

## Testing Checklist

- [ ] New videos posted today don't show "Archived" badge
- [ ] Actual Vine archive videos DO show "Archived" badge
- [ ] Videos with `published_at` but no `origin` tag are treated as new
- [ ] Videos with `origin: vine` tag show Vine badge
- [ ] Timestamp displays correctly for both new and vintage content

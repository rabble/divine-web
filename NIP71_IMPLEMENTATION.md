# NIP-71 Implementation Guide

## Overview

This document describes how diVine Web implements [NIP-71 Video Events](https://github.com/nostr-protocol/nips/pull/2072) for publishing and consuming short-form video content on Nostr.

## Supported Event Kinds

Based on NIP-71 PR #2072, the app supports the following video event kinds:

| Kind | Type | Description | Addressable | `d` tag Required |
|------|------|-------------|-------------|------------------|
| 21 | Normal Video | Horizontal/landscape videos | No | No |
| 22 | Short Video | Vertical/portrait videos | No | No |
| 34235 | Addressable Normal Video | Horizontal/landscape videos (updatable) | Yes | **Yes** |
| 34236 | Addressable Short Video | Vertical/portrait videos (updatable) | Yes | **Yes** |

### Primary Kind Used

**diVine Web uses kind 34236** (Addressable Short Videos) as the default for new posts.

## Why Addressable Events?

Addressable events (kinds 34235, 34236) provide several advantages over regular events:

1. **Metadata Corrections**: Fix typos, descriptions, or tags without republishing the entire video
2. **URL Migration**: Update video URLs when hosting changes without losing social proof
3. **Legacy Platform Migration**: Preserve original content IDs from platforms like Vine, TikTok
4. **Content Updates**: Replace video file while maintaining engagement metrics

## Event Structure

### Required Tags (All Kinds)

```typescript
{
  kind: 34236, // or 21, 22, 34235
  content: "Video description",
  tags: [
    // Required for ALL video events
    ['title', 'Video Title'],
    ['published_at', '1731672000'],
    
    // Required: imeta tag with video file metadata
    ['imeta',
      'url https://blossom.divine.video/abc123.mp4',
      'm video/mp4',
      'dim 480x480',
      'duration 6',
      'blurhash eVF$^OI:${M{%LRjWBoLoLaeR*',
      'image https://blossom.divine.video/thumb.jpg',
      'x 3093509d1e0bc604ff60cb9286f4cd7c781553bc8991937befaacfdc28ec5cdc'
    ]
  ]
}
```

### Additional Required Tags for Addressable Events

For kinds **34235** and **34236** only:

```typescript
tags: [
  ['d', 'unique-identifier'], // REQUIRED for addressable events
  // ... other tags
]
```

The `d` tag value:
- Must be unique per author
- Used to create the addressable reference: `34236:<pubkey>:<d-value>`
- Should be generated consistently (we use `vine-{timestamp}-{random}`)

### Optional Tags

```typescript
tags: [
  // Hashtags
  ['t', 'nostr'],
  ['t', 'video'],
  
  // Participants
  ['p', '<pubkey>', '<relay>'],
  
  // References
  ['r', 'https://example.com/related-content'],
  
  // Content warning
  ['content-warning', 'reason'],
  
  // Alt text for accessibility
  ['alt', 'Video description for screen readers'],
  
  // Client attribution
  ['client', 'divine-web'],
  
  // Origin tracking (for imported content)
  ['origin', 'vine', 'original-id', 'https://vine.co/v/...', 'metadata']
]
```

## Implementation Details

### Publishing Videos

Located in `src/hooks/usePublishVideo.ts`:

```typescript
import { ADDRESSABLE_SHORT_VIDEO_KIND } from '@/types/video';

// Default to kind 34236 for new posts
await publishVideo({
  content: description,
  videoUrl: uploadResult.url,
  title: title,
  duration: duration,
  hashtags: hashtags,
  kind: ADDRESSABLE_SHORT_VIDEO_KIND, // 34236
});
```

### Querying Videos

Located in `src/hooks/useVideoEvents.ts`:

```typescript
import { VIDEO_KINDS } from '@/types/video';
// VIDEO_KINDS = [21, 22, 34235, 34236]

const filter = {
  kinds: VIDEO_KINDS,
  limit: 50
};
```

### Validation

All addressable events (34235, 34236) are validated to ensure they have a `d` tag:

```typescript
function validateVideoEvent(event: NostrEvent): boolean {
  if (!VIDEO_KINDS.includes(event.kind)) return false;

  // Addressable events MUST have d tag
  if (event.kind === 34235 || event.kind === 34236) {
    const vineId = getVineId(event);
    if (!vineId) {
      console.error(`Kind ${event.kind} missing required d tag`);
      return false;
    }
  }

  return true;
}
```

### Referencing Videos

Regular events (21, 22) use event ID:
```typescript
['e', '<event-id>', '<relay>']
```

Addressable events (34235, 34236) use addressable reference:
```typescript
['a', '34236:<pubkey>:<d-tag>', '<relay>']
```

## Video Metadata (imeta tag)

The `imeta` tag follows [NIP-92](https://github.com/nostr-protocol/nips/blob/master/92.md) and contains:

| Field | Description | Required |
|-------|-------------|----------|
| `url` | Primary video URL | **Yes** |
| `m` | MIME type (video/mp4, image/gif) | **Yes** |
| `dim` | Dimensions (WxH, e.g., "480x480") | Recommended |
| `duration` | Duration in seconds | Recommended |
| `blurhash` | Blurhash for placeholder | Recommended |
| `image` | Thumbnail URL | Recommended |
| `x` | SHA-256 hash of file | Optional |
| `size` | File size in bytes | Optional |

Example imeta tag:
```typescript
['imeta',
  'url https://blossom.divine.video/video.mp4',
  'm video/mp4',
  'dim 480x480',
  'duration 6',
  'blurhash eVF$^OI:${M{%LRjWBoLoLaeR*',
  'image https://blossom.divine.video/thumb.jpg',
  'x abc123...',
  'size 1234567'
]
```

## Blossom Upload

Videos are uploaded to Blossom server before publishing events:

```typescript
const uploader = new BlossomUploader({
  servers: ['https://blossom.divine.video/'],
  signer: user.signer,
});

const tags = await uploader.upload(file);
// Returns imeta-compatible tags
```

## Migration from Legacy Events

The codebase maintains backward compatibility:

```typescript
// Old constant (deprecated but still works)
export const LEGACY_VIDEO_KIND = 34236;

// New constants (preferred)
export const ADDRESSABLE_SHORT_VIDEO_KIND = 34236;
export const ADDRESSABLE_NORMAL_VIDEO_KIND = 34235;
```

All existing code using `LEGACY_VIDEO_KIND` will continue to work as it's aliased to `ADDRESSABLE_SHORT_VIDEO_KIND`.

## Testing Checklist

- [ ] New videos published with kind 34236
- [ ] Videos have required `d` tag
- [ ] Videos have required `title` tag
- [ ] Videos have required `published_at` tag
- [ ] Videos have required `imeta` tag with video URL
- [ ] Can query videos with kinds filter: [21, 22, 34235, 34236]
- [ ] Can reference addressable videos using `a` tag
- [ ] Can update addressable video metadata
- [ ] Validation rejects kind 34235/34236 without `d` tag
- [ ] Regular events (21, 22) don't require `d` tag

## Future Enhancements

### Content Updates
Addressable events enable updating video content without losing social proof:

```typescript
// Update video URL (e.g., after re-encoding or hosting migration)
await publishVideo({
  vineId: existingVineId, // Same d tag value
  videoUrl: newVideoUrl,  // New URL
  title: existingTitle,
  // ... other metadata
  kind: 34236
});
```

### Origin Tracking
Track videos imported from legacy platforms:

```typescript
tags: [
  ['origin', 'vine', 'hvmIBFr3W2a', 'https://vine.co/v/hvmIBFr3W2a', '{"loops":12345}']
]
```

### Platform Migration
Preserve social proof when migrating from centralized platforms by using consistent `d` tag values that match original platform IDs.

## References

- [NIP-71 PR #2072](https://github.com/nostr-protocol/nips/pull/2072) - Addressable Video Events
- [NIP-33](https://github.com/nostr-protocol/nips/blob/master/33.md) - Parameterized Replaceable Events
- [NIP-92](https://github.com/nostr-protocol/nips/blob/master/92.md) - Media Attachments (imeta)
- [NIP-94](https://github.com/nostr-protocol/nips/blob/master/94.md) - File Metadata

## Related Files

- `src/types/video.ts` - Video event type definitions
- `src/hooks/usePublishVideo.ts` - Publishing video events
- `src/hooks/useVideoEvents.ts` - Querying and validating video events
- `src/lib/videoParser.ts` - Parsing video event tags
- `src/pages/PostPage.tsx` - Post creation UI

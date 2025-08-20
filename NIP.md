# NIP-32222: Addressable Short Looping Videos

## Abstract

This NIP defines an addressable event kind for short-form looping video content, optimized for 6-second loops similar to classic Vine videos.

## Video Event Structure

### Kind 32222 - Addressable Short Looping Videos

The event kind `32222` is used for addressable/replaceable short-form video content. Being in the 30000-39999 range makes these events addressable, allowing for updates and preventing duplicates.

#### Required Fields

```json
{
  "kind": 32222,
  "content": "Video description/caption text",
  "tags": [
    ["d", "unique-vine-id"],           // REQUIRED: Unique identifier for addressability
    ["imeta", "url", "https://videos.host/video.mp4", "m", "video/mp4", "dim", "480x480", "blurhash", "eNH_0EI:${M{%LRjWBaeoLofR*", "image", "https://videos.host/thumb.jpg"],
    ["client", "openvine"]             // OpenVine attribution
  ]
}
```

#### Optional Tags

- `title`: Video title
- `published_at`: Unix timestamp (stringified) of first publication
- `duration`: Video duration in seconds (typically "6" for classic vines)
- `alt`: Accessibility description
- `t`: Hashtags for categorization
- `loops`: Original loop count from classic Vine imports
- `likes`: Original like count from classic Vine imports
- `h`: Group/community identification

### Video URL Parsing

Implementations should use liberal URL parsing following Postel's Law, checking these sources in order:

1. `imeta` tag with url key-value pair
2. `url` tag value
3. `r` tag with type annotation
4. `e` tag if contains valid video URL
5. `i` tag if contains valid video URL
6. Any unknown tag containing valid video URL
7. Content text regex parsing (fallback)

### Media Metadata (imeta tag)

The `imeta` tag structure follows NIP-92 with these properties:

```
["imeta", 
  "url", "video_url",           // Primary video URL
  "m", "video/mp4",             // MIME type
  "dim", "480x480",             // Dimensions
  "blurhash", "hash",           // Blur hash for placeholder
  "image", "thumb_url",         // Thumbnail URL
  "duration", "6",              // Duration in seconds
  "x", "sha256_hash",           // File hash
  "size", "12345"               // File size in bytes
]
```

Multiple `imeta` tags may be used to specify different video variants (resolutions, formats).

### Reposts (Kind 6)

Reposts of Kind 32222 videos use standard Kind 6 events:

```json
{
  "kind": 6,
  "content": "",
  "tags": [
    ["a", "32222:original_pubkey:d-tag-value"],
    ["p", "original_author_pubkey"]
  ]
}
```

### Why Kind 32222?

- **Addressable Range (30000-39999)**: Allows videos to be updated/replaced using the same `d` tag
- **Specific to Short-Form Video**: Differentiates from other video kinds (21, 22, 71)
- **Community Namespace**: The 32xxx range appears to be used for community-specific content types

## Client Behavior

1. **Auto-loop Playback**: Videos should automatically loop seamlessly
2. **Preloading**: Clients should preload the next video in feeds
3. **Thumbnail Display**: Show thumbnail until user interaction
4. **Attribution**: Always include `["client", "openvine"]` tag

## Compatibility

This specification is designed to be compatible with the existing OpenVine Flutter application and ecosystem while allowing for future extensibility.
# diVine Web

OpenVine-compatible Nostr client for short-form looping videos. Built with React 18.x, TailwindCSS 3.x, Vite, shadcn/ui, and Nostrify.

## Features

- **6-second looping videos** (Kind 34236 - NIP-71)
- **MP4 and GIF support** with auto-loop playback
- **Blurhash placeholders** for smooth progressive loading
- **Social features**: Likes, reposts, follows, hashtag discovery
- **Feed types**: Home (following), Discovery, Trending, Hashtag, Profile
- **Primary relay**: wss://relay.divine.video

## Custom Relay Extension

**relay.divine.video implements a custom `sort` extension** to enable server-side sorting by loop count.

### Sort Parameter

This is NOT part of the standard Nostr protocol. The sort parameter allows queries like:

```typescript
{
  kinds: [34236],
  limit: 50,
  sort: {
    field: 'loop_count',
    dir: 'desc'
  }
}
```

**How it works:**
1. Relay returns top 50 videos by loop count (server-side)
2. Client re-ranks by `loopCount + reactionCount` (client-side)

This two-tier ranking system ensures highly-looped videos surface, not just recent ones.

**Feed types using sort:**
- Trending
- Discovery
- Home (following feed)
- Hashtag

**Standard Nostr relays** will ignore the `sort` parameter and return chronological results.

## Development

Built with MKStack template - a starter for Nostr client applications.
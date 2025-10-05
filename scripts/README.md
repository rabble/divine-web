# Scripts

## Precalculate Hashtag Thumbnails

This script queries the Nostr relay to find representative thumbnail images for popular hashtags and caches them for faster loading.

### Prerequisites

Install `nak` CLI tool:
```bash
go install github.com/fiatjaf/nak@latest
```

Or download from: https://github.com/fiatjaf/nak

### Usage

Run the full precalculation (top 100 hashtags by default):
```bash
npm run precalculate-thumbnails
```

Limit to specific number of hashtags:
```bash
LIMIT=50 npm run precalculate-thumbnails
```

Process all 1000 hashtags:
```bash
LIMIT=1000 npm run precalculate-thumbnails
```

### Output

The script creates `public/hashtag-thumbnails.json` with a mapping of hashtags to thumbnail URLs:
```json
{
  "vine": "https://...",
  "funny": "https://...",
  ...
}
```

The script saves progress every 10 hashtags, so it can be interrupted and resumed safely.

### How It Works

1. Loads hashtags from `public/top_1000_hashtags.json`
2. For each hashtag, uses `nak` to query the relay for videos with that hashtag
3. Parses video events to find thumbnail URLs (from `thumb`, `image`, or `url` tags)
4. Caches the first valid thumbnail found
5. Saves results to `public/hashtag-thumbnails.json`

The client-side code (`src/lib/hashtagThumbnail.ts`) checks this cache first before making live queries to the relay.

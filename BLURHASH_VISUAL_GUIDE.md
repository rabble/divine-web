# Blurhash Visual Guide

## Before & After Comparison

### ❌ BEFORE (Without Blurhash)

```
┌─────────────────────────────┐
│                             │
│                             │
│         ████████            │  ← Black rectangle
│         ████████            │
│         ████████            │
│                             │
│       Loading...            │  ← Generic spinner
│                             │
└─────────────────────────────┘

User sees: Nothing meaningful, just black + spinner
User thinks: "Is this loading? What content is this?"
```

### ✅ AFTER (With Blurhash)

```
┌─────────────────────────────┐
│ ░░▒▒▓▓████▓▓▒▒░░            │
│ ░░▒▒▓▓████▓▓▒▒░░            │  ← Colorful blurred preview
│ ░░▒▒▓▓████▓▓▒▒░░            │     (purple gradient for
│ ░░▒▒▓▓████▓▓▒▒░░            │      Divine branding)
│ ░░▒▒▓▓████▓▓▒▒░░            │
│                             │
│       Loading...            │  ← Spinner over blurhash
│                             │
└─────────────────────────────┘

User sees: Meaningful placeholder with visual hint
User thinks: "Ah, content is loading! I can see something already!"
```

## Loading Sequence Animation

```
Step 1: Instant (0ms)
┌─────────────────────────────┐
│ ░░▒▒▓▓████▓▓▒▒░░            │  Blurhash appears instantly
│ ░░▒▒▓▓████▓▓▒▒░░            │  (decoded from event tags)
│ ░░▒▒▓▓████▓▓▒▒░░            │
│ ░░▒▒▓▓████▓▓▒▒░░            │
└─────────────────────────────┘
        ↓

Step 2: Loading (~100-500ms)
┌─────────────────────────────┐
│ ░░▒▒▓▓████▓▓▒▒░░            │  Spinner appears over blurhash
│ ░░▒▒▓▓████▓▓▒▒░░            │  while video fetches
│ ░░▒▒  ⟳   ▓▓▒▒░░            │
│ ░░▒▒▓▓████▓▓▒▒░░            │
└─────────────────────────────┘
        ↓

Step 3: Fade Transition (300ms)
┌─────────────────────────────┐
│ ░░▒▒▓▓████▓▓▒▒░░            │  Video fades in (opacity: 0 → 1)
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓            │  Blurhash fades out (opacity: 1 → 0)
│ ██████████████████          │  Smooth crossfade
│ ██████████████████          │
└─────────────────────────────┘
        ↓

Step 4: Playing
┌─────────────────────────────┐
│ ████████████████████████    │  Video fully visible
│ ████████████████████████    │  Blurhash hidden
│ ████████████████████████    │  Smooth playback
│ ████████████████████████    │
└─────────────────────────────┘
```

## Color Examples

### Divine Branding (Default)
```
Blurhash: L6Pj0^jE.AyE_3t7t7R**0o#DgR4

Visual representation:
┌─────────────────┐
│ ░░░░▒▒▒▒▒▓▓▓▓▓  │  Purple gradient
│ ░░░▒▒▒▒▒▒▓▓▓▓▓  │  (Divine brand colors)
│ ░░▒▒▒▒▒▒▒▓▓▓▓▓  │
│ ░▒▒▒▒▒▒▒▒▓▓▓▓▓  │
└─────────────────┘
```

### Comedy Content
```
Blurhash: L8Q9Kx4n00M{~qD%_3t7D%WBRjof

Visual representation:
┌─────────────────┐
│ ▓▓▓▓▓▒▒▒░░░░░░  │  Warm yellow/orange
│ ▓▓▓▓▓▒▒▒▒░░░░░  │  (energetic, fun)
│ ▓▓▓▓▒▒▒▒▒░░░░░  │
│ ▓▓▓▒▒▒▒▒▒░░░░░  │
└─────────────────┘
```

### Nature Content
```
Blurhash: L8F5?xYk^6#M@-5c,1J5@[or[Q6.

Visual representation:
┌─────────────────┐
│ ░░░▒▒▓▓██▓▓▒▒░  │  Green tones
│ ░░▒▒▒▓▓██▓▓▒▒░  │  (natural, organic)
│ ░▒▒▒▒▓▓██▓▓▒▒░  │
│ ▒▒▒▒▒▓▓██▓▓▒▒░  │
└─────────────────┘
```

## Technical Flow Diagram

```
Event Received from Relay
         │
         ├─► Parse tags
         │       │
         │       ├─► Extract blurhash
         │       │   "L6Pj0^jE.AyE_3t7t7R**0o#DgR4"
         │       │
         │       └─► Store in ParsedVideoData
         │
         ↓
VideoCard Component
         │
         └─► Pass blurhash to VideoPlayer
                     │
                     ├─► Validate blurhash
                     │   (starts with 'L', 6+ chars)
                     │
                     ├─► Decode with blurhash.decode()
                     │   (5-20ms, 32x32 pixels)
                     │
                     ├─► Render to canvas
                     │   (upscaled to full size via CSS)
                     │
                     └─► Display Results:
                         │
                         ├─► Blurhash: opacity 1
                         │   Video: opacity 0
                         │   (Loading state)
                         │
                         └─► Blurhash: opacity 0
                             Video: opacity 1
                             (Loaded state)
                             300ms transition
```

## CSS Transitions

```css
/* Blurhash element */
.blurhash-placeholder {
  transition: opacity 300ms ease-in-out;
  opacity: 1; /* While loading */
}

.blurhash-placeholder.loaded {
  opacity: 0; /* When video ready */
}

/* Video element */
video {
  transition: opacity 300ms ease-in-out;
  opacity: 0; /* While loading */
}

video.loaded {
  opacity: 1; /* When video ready */
}
```

## Performance Visualization

```
Timeline of Video Load with Blurhash:

0ms     ┃ Blurhash decoded and displayed (instant)
        ┃ ░░▒▒▓▓████▓▓▒▒░░
        ┃
10ms    ┃ Video fetch begins
        ┃ [──────────────>]
        ┃
200ms   ┃ First bytes received
        ┃ [████──────────>]
        ┃
500ms   ┃ Video buffered and ready
        ┃ [██████████████]
        ┃
500ms   ┃ Begin fade transition
        ┃ Blurhash: 100% → 0%
        ┃ Video:    0% → 100%
        ┃
800ms   ┃ Transition complete, video playing
        ┃ ████████████████
        ┃

Total perceived load time: INSTANT
(Blurhash shows immediately, then smooth transition)

Without blurhash:
0-500ms: User sees black rectangle
With blurhash:
0-500ms: User sees meaningful preview
```

## Mobile vs Desktop Comparison

### Mobile (Small Screen)
```
┌─────────────┐
│ ░▒▓████▓▒░  │  Blurhash still clear
│ ░▒▓████▓▒░  │  at smaller resolution
│ ░▒▓████▓▒░  │  (32x32 canvas scales well)
│ ░▒▓████▓▒░  │
│             │
│   Loading   │
└─────────────┘
```

### Desktop (Large Screen)
```
┌──────────────────────────────┐
│ ░░░░▒▒▒▒▓▓▓▓████▓▓▓▓▒▒▒▒░░░░ │  Blurhash scales smoothly
│ ░░░░▒▒▒▒▓▓▓▓████▓▓▓▓▒▒▒▒░░░░ │  (CSS handles upscaling)
│ ░░░░▒▒▒▒▓▓▓▓████▓▓▓▓▒▒▒▒░░░░ │  No pixelation visible
│ ░░░░▒▒▒▒▓▓▓▓████▓▓▓▓▒▒▒▒░░░░ │  due to intentional blur
│                              │
│         Loading...           │
└──────────────────────────────┘
```

## Error States

### Invalid Blurhash
```
Input: "INVALID123" (doesn't start with 'L')

┌─────────────────────────────┐
│                             │  Transparent fallback
│                             │  (black background visible)
│       Loading...            │
│                             │
└─────────────────────────────┘
```

### No Blurhash
```
Input: undefined

┌─────────────────────────────┐
│                             │  Black background
│                             │  (default video behavior)
│       Loading...            │
│                             │
└─────────────────────────────┘
```

### Decode Error
```
Input: "L6Pj0^" (too short)

┌─────────────────────────────┐
│                             │  Transparent fallback
│                             │  (catches decode errors)
│       Loading...            │
│                             │
└─────────────────────────────┘
```

## User Experience Metrics

### Perceived Load Time
```
Without Blurhash:
┌────────────────┐
│ Black screen   │ 0-500ms   ← Feels slow
│ Loading...     │
└────────────────┘

With Blurhash:
┌────────────────┐
│ Blurred preview│ 0ms       ← Instant feedback!
│ Loading...     │ 0-500ms   ← Feels fast
└────────────────┘
```

### Professional Polish
```
Before: ★★☆☆☆ (2/5 stars)
- Looks unfinished
- Generic loading state
- No visual feedback

After: ★★★★★ (5/5 stars)
- Industry-standard UX
- Smooth transitions
- Professional appearance
```

## Comparison to Other Platforms

### Twitter/X
- ✅ Uses blurhash for images
- ✅ Smooth fade transitions
- ✅ Professional feel

### Mastodon
- ✅ Uses blurhash extensively
- ✅ Shows blurred previews
- ✅ Standard feature

### Instagram
- ✅ Similar blur placeholder
- ✅ Smooth loading
- ✅ Expected by users

### diVine Web (Now!)
- ✅ Uses blurhash like the pros
- ✅ Matches industry standards
- ✅ Professional user experience

## Conclusion

Blurhash transforms the loading experience from:
```
❌ Black → Sudden appearance
```

To:
```
✅ Blurred preview → Smooth fade → Sharp video
```

This small change has a **huge impact** on perceived performance and professional polish!

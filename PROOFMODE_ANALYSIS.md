# ProofMode Verification Analysis & Implementation Plan

## Executive Summary

The web app's ProofMode verification filtering is currently not working because **the tag names used to extract ProofMode data don't match the tag names that the Flutter app publishes**. This causes the web app to never find any verified videos, even though they exist on the relays.

## Current Tag Name Mismatch

### Flutter App (Publisher) Tags:
```dart
// From video_event_publisher.dart lines 386-408
tags.add(['verification', verificationLevel]);          // ← verification
tags.add(['proofmode', proofTag]);                      // ← proofmode  
tags.add(['device_attestation', deviceTag]);            // ← device_attestation
tags.add(['pgp_fingerprint', pgpTag]);                  // ← pgp_fingerprint
```

### Web App (Consumer) Tags:
```typescript
// From videoParser.ts lines 442-467
const levelTag = event.tags.find(tag => tag[0] === 'proof-verification-level');  // ❌ WRONG
const manifestTag = event.tags.find(tag => tag[0] === 'proof-manifest');         // ❌ WRONG
const attestationTag = event.tags.find(tag => tag[0] === 'proof-device-attestation'); // ❌ WRONG
const fingerprintTag = event.tags.find(tag => tag[0] === 'proof-pgp-fingerprint');   // ❌ WRONG
```

**Result**: Web app never finds ProofMode data → `getProofModeData()` returns `undefined` → verified filter shows no videos

## Verification Level Logic Comparison

### Flutter App (NativeProofData.verificationLevel)
```dart
String get verificationLevel {
  if (hasMobileAttestation && pgpSignature != null) {
    return 'verified_mobile';   // ✅ Device attestation + signature
  }
  if (pgpSignature != null) {
    return 'verified_web';       // ✅ Signature only (no hardware)
  }
  if (sensorDataCsv != null) {
    return 'basic_proof';        // ✅ Has sensor data
  }
  return 'unverified';
}
```

### Web App (proofMode.ts - determineVerificationLevel)
```typescript
function determineVerificationLevel(proofData?: ProofModeData): ProofModeLevel {
  if (!proofData) return 'unverified';
  
  const hasManifest = !!proofData.manifest && !!proofData.manifestData;
  const hasAttestation = !!proofData.deviceAttestation;
  const hasSignature = !!proofData.pgpFingerprint;

  // Highest level: Hardware attestation + manifest + signature
  if (hasAttestation && hasManifest && hasSignature) {
    return 'verified_mobile';    // ✅ Matches Flutter
  }

  // Medium level: Manifest + signature (no hardware)
  if (hasManifest && hasSignature) {
    return 'verified_web';        // ✅ Matches Flutter
  }

  // Basic: Has some proof data
  if (hasManifest || hasSignature || hasAttestation) {
    return 'basic_proof';         // ✅ Matches Flutter
  }

  return 'unverified';
}
```

**Analysis**: The verification level logic is consistent and correct. The issue is purely the tag name mismatch.

## Badge Display Comparison

### Flutter App Badges
From `proofmode_badge.dart`:

| Level | Label | Colors | Icon |
|-------|-------|--------|------|
| `verified_mobile` | "Fully Verified" | Green (#28A745) | `Icons.verified` |
| `verified_web` | "Verified" | Blue (#17A2B8) | `Icons.shield_outlined` |
| `basic_proof` | "Basic Proof" | Yellow (#FFC107) | `Icons.info_outline` |
| `unverified` | "Unverified" | Red (#F5C6CB) | `Icons.shield_outlined` |

**Additional Badges:**
- `OriginalContentBadge`: Cyan badge for non-repost, non-Vine content
- `OriginalVineBadge`: Teal badge for recovered vintage Vines (removed per user request)

### Web App Badges
From `ProofModeBadge.tsx`:

| Level | Label | Colors | Icon |
|-------|-------|--------|------|
| `verified_mobile` | "Verified" | Green (#16a34a) | `ShieldCheck` |
| `verified_web` | "Verified" | Blue (#2563eb) | `Shield` |
| `basic_proof` | "Signed" | Yellow (#ca8a04) | `ShieldAlert` |
| `unverified` | (not displayed) | - | - |

**Key Differences:**
1. ❌ Flutter shows "Fully Verified" for mobile, Web shows just "Verified"
2. ❌ Flutter shows "Verified" for web, Web shows "Verified" (same label)
3. ❌ Flutter shows "Basic Proof", Web shows "Signed"
4. ✅ Both hide unverified badge
5. ❌ Web app missing "Original Content" badge (VineBadge equivalent)
6. ❌ Web app missing vintage Vine badge

## Badge Placement Comparison

### Flutter App
From `proofmode_badge_row.dart` and usage in video widgets:

```dart
ProofModeBadgeRow(
  video: video,
  size: BadgeSize.small,
  spacing: 8.0,
  mainAxisAlignment: MainAxisAlignment.start,
)
```

**Display Logic:**
- Shows ProofMode badge if `video.hasProofMode` is true
- Shows Original Content badge if `video.shouldShowOriginalBadge` is true
  - `shouldShowOriginalBadge = isOriginalContent && !isOriginalVine && !hasProofMode`
- Badges appear in a horizontal row with 8px spacing
- Used in: video tiles, detail views, feed items

### Web App
From `VideoCard.tsx` and usage:

```tsx
{videoData.proofMode && (
  <ProofModeBadge
    level={videoData.proofMode.level}
    proofData={videoData.proofMode}
    showDetails={true}
  />
)}
```

**Display Logic:**
- Only shows ProofMode badge, no original content badge
- Badge appears as a clickable popover with detailed info
- Used in: VideoCard component only

**Key Differences:**
1. ❌ Web app missing "Original Content" badge entirely
2. ❌ Web app doesn't show badge row (multiple badges together)
3. ✅ Web app has nice popover with detailed proof info (Flutter doesn't)

## Verified Filter Implementation

### Flutter App
The Flutter app doesn't appear to have a "Verified Only" toggle in the main feed. Verification badges are **display-only indicators**, not filters.

### Web App
From `DiscoveryPage.tsx` and `VideoFeed.tsx`:

```tsx
// DiscoveryPage.tsx
const [verifiedOnly, setVerifiedOnly] = useState(false);

<VerifiedOnlyToggle
  enabled={verifiedOnly}
  onToggle={setVerifiedOnly}
/>

<VideoFeed
  feedType="trending"
  verifiedOnly={verifiedOnly}
/>
```

```typescript
// VideoFeed.tsx - filteredVideos
if (verifiedOnly) {
  return video.proofMode &&
         (video.proofMode.level === 'verified_mobile' ||
          video.proofMode.level === 'verified_web');  // ✅ Logic is correct
}
```

**Analysis**: The filtering logic is correct, but it never finds videos because `video.proofMode` is always undefined due to tag name mismatch.

## Implementation Plan

### Phase 1: Fix Tag Names (Critical - Must Fix First)

**File:** `src/lib/videoParser.ts` - `getProofModeData()` function

```typescript
// BEFORE (lines 442-467)
const levelTag = event.tags.find(tag => tag[0] === 'proof-verification-level');
const manifestTag = event.tags.find(tag => tag[0] === 'proof-manifest');
const attestationTag = event.tags.find(tag => tag[0] === 'proof-device-attestation');
const fingerprintTag = event.tags.find(tag => tag[0] === 'proof-pgp-fingerprint');

// AFTER (match Flutter app exactly)
const levelTag = event.tags.find(tag => tag[0] === 'verification');
const manifestTag = event.tags.find(tag => tag[0] === 'proofmode');
const attestationTag = event.tags.find(tag => tag[0] === 'device_attestation');
const fingerprintTag = event.tags.find(tag => tag[0] === 'pgp_fingerprint');
```

**Expected Result:** Verified filter will immediately start working.

### Phase 2: Align Badge Labels with Flutter

**File:** `src/components/ProofModeBadge.tsx` - `getProofModeConfig()` function

```typescript
case 'verified_mobile':
  return {
    icon: ShieldCheck,
    label: 'Fully Verified',  // Changed from 'Verified'
    // ... rest unchanged
  };

case 'verified_web':
  return {
    icon: Shield,
    label: 'Verified',  // Keep as is (already correct)
    // ... rest unchanged
  };

case 'basic_proof':
  return {
    icon: ShieldAlert,
    label: 'Basic Proof',  // Changed from 'Signed'
    // ... rest unchanged
  };
```

### Phase 3: Add Original Content Badge

**New File:** `src/components/OriginalContentBadge.tsx`

Create a badge component matching Flutter's `OriginalContentBadge`:
- Cyan/teal color scheme
- "Original" label
- CheckCircle icon
- Display logic: `!video.isReposted && !video.isVineMigrated && !video.proofMode`

**Update:** `src/components/VideoCard.tsx`

Add badge row similar to Flutter's `ProofModeBadgeRow`:
```tsx
<div className="flex gap-2 items-center">
  {videoData.proofMode && (
    <ProofModeBadge
      level={videoData.proofMode.level}
      proofData={videoData.proofMode}
      showDetails={true}
    />
  )}
  
  {!videoData.reposts?.length && !videoData.isVineMigrated && !videoData.proofMode && (
    <OriginalContentBadge />
  )}
</div>
```

### Phase 4: Add VineBadge Component (Optional)

**New File:** `src/components/VineBadge.tsx`

- Already exists! Just need to use it properly
- Show for videos where `videoData.isVineMigrated === true`
- Matches Flutter's vintage Vine badge styling

### Phase 5: Update Badge Sizes and Styling

Align badge dimensions with Flutter app's three size variants:
- Small: 10px font, 12px icon
- Medium: 11px font, 14px icon  
- Large: 12px font, 16px icon

## Testing Checklist

- [ ] Verified videos show up when "Verified" toggle is enabled
- [ ] Badge labels match Flutter app ("Fully Verified", "Verified", "Basic Proof")
- [ ] Original Content badge appears for non-repost, non-Vine, non-ProofMode videos
- [ ] Vine badge appears for vintage imported Vines
- [ ] Badge row displays multiple badges with proper spacing
- [ ] Badge colors match Flutter app styling
- [ ] Popover details work on verified badges
- [ ] Filter performance is acceptable (no lag)

## Success Metrics

1. **Functional Parity**: Web app shows same badges as Flutter app for same video
2. **Filter Works**: Verified toggle successfully filters videos
3. **Visual Consistency**: Badge styling matches Flutter app's design language
4. **Performance**: No noticeable performance degradation with badge rendering

## Notes

- The web app's popover detail view for ProofMode is actually better UX than Flutter (which doesn't have it)
- Consider backporting the popover feature to Flutter app
- The Original Content badge was a good addition in Flutter - helps users identify fresh content
- Current web implementation only shows badges in VideoCard, Flutter shows them everywhere (tiles, details, etc.)

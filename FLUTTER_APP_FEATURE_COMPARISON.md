# Flutter App Feature Comparison & Implementation Guide

This document compares the nostrvine-1 Flutter app with the current divine-web-3 web application and provides implementation details for missing features.

## Event Kinds & Protocol Support

### Current Web Support
- **Kind 34236**: Addressable short looping videos ✅
- **Kind 0**: User profiles ✅
- **Kind 3**: Contact lists (follows) ✅
- **Kind 6**: Reposts ✅
- **Kind 7**: Reactions (likes) ✅
- **Kind 1**: Comments ✅

### Flutter App Additional Support
- **Kind 5**: Deletion Events (NIP-09) - For unlike functionality ❌
- **Kind 10001**: Mute Lists (NIP-51) ❌
- **Kind 10002**: Relay Lists (NIP-65) ❌
- **Kind 30001**: Categorized People Lists (NIP-51) ❌
- **Kind 30005**: Curated Video Lists/Playlists (NIP-51) ❌
- **Kind 30008**: Profile Badges (NIP-58) ❌
- **Kind 32222**: Alternative addressable video format (legacy support) ❌
- **Kind 1063**: File Metadata (NIP-94) - For Blossom storage ❌
- **Kind 1984**: Content Reporting (NIP-56) ❌
- **Kind 1985**: Content Labels/Moderation (NIP-32) ❌
- **Kind 14**: Gift Wrapped DMs (NIP-17) - For bug reports and private messages ❌

## Missing Features from Web App

### 1. **Curated Lists / Playlists** ⭐ HIGH PRIORITY

**What it does:** Users can create public or private playlists of videos, with collaborative editing support.

**Implementation:**
- **Event Kind**: 30005 (NIP-51 Video Set)
- **Tags Structure**:
  ```json
  {
    "kind": 30005,
    "content": "{\"name\":\"My Favorites\",\"description\":\"My favorite vines\"}",
    "tags": [
      ["d", "unique-list-id"],
      ["title", "My Favorites"],
      ["image", "https://thumbnail-url.jpg"],
      ["a", "34236:author-pubkey:video-d-tag", "relay-hint"],
      ["a", "34236:author-pubkey:video-d-tag-2", "relay-hint"],
      ["t", "comedy"],
      ["t", "funny"],
      ["play-order", "chronological"],
      ["collaborative", "true"],
      ["collaborator", "pubkey-1"],
      ["collaborator", "pubkey-2"]
    ]
  }
  ```

**Flutter Implementation Details:**
- Service: `CuratedListService` (mobile/lib/services/curated_list_service.dart)
- Features:
  - Create/edit/delete lists
  - Add/remove videos from lists
  - Playlist ordering options (chronological, reverse, manual, shuffle)
  - Collaborative lists with allowed collaborators
  - Public/private visibility control
  - List discovery by tags
  - Featured thumbnail selection

**Web Implementation Needed:**
- Create `useVideoLists` hook (already exists but may need enhancements)
- Add `CreateListDialog` component (already exists)
- Add `AddToListDialog` component (already exists)
- Add `ListsPage` to display all user lists (already exists)
- Add `ListDetailPage` to show list contents (already exists)
- Add list management to video share menu

### 2. **Content Moderation System** ⭐ HIGH PRIORITY

**What it does:** User-controlled, stackable moderation with content reporting, blocking, muting, and label-based filtering.

**Implementation:**
- **Event Kinds**: 
  - Kind 1984 (NIP-56) - Content Reports
  - Kind 1985 (NIP-32) - Content Labels
  - Kind 10001 (NIP-51) - Mute Lists

**Report Structure (Kind 1984):**
```json
{
  "kind": 1984,
  "content": "Spam content",
  "tags": [
    ["p", "reported-user-pubkey", "impersonation"],
    ["e", "event-id", "illegal"],
    ["L", "social.nos.ontology"],
    ["l", "NS-spam", "social.nos.ontology"]
  ]
}
```

**Mute List Structure (Kind 10001):**
```json
{
  "kind": 10001,
  "tags": [
    ["p", "muted-pubkey", "reason"],
    ["t", "muted-hashtag"],
    ["word", "blocked-word"]
  ]
}
```

**Flutter Implementation Details:**
- Services:
  - `ContentReportingService` - File reports
  - `ContentModerationService` - Process labels and moderation actions
  - `MuteService` - Manage mutes
  - `ContentBlocklistService` - Block users/content
- Features:
  - Report content with categories (spam, illegal, impersonation, etc.)
  - Mute users, hashtags, keywords
  - Subscribe to community moderators/labelers
  - Stack multiple moderation sources
  - Age-restricted content filtering
  - NSFW content warnings

**Web Implementation Needed:**
- Create content reporting UI in video share menu
- Add mute/block functionality to user profiles
- Create moderation settings page
- Implement label-based content filtering
- Add moderation provider subscription system

### 3. **ProofMode Verification** ⭐ HIGH PRIORITY

**What it does:** Cryptographic verification that videos are authentic and unedited, with device attestation for mobile uploads.

**Implementation:**
- **Tags in Kind 34236 event**:
  ```json
  {
    "tags": [
      ["proof-verification-level", "verified_mobile"],
      ["proof-manifest", "{\"sessionId\":\"abc\",\"frameHashes\":[...]}"],
      ["proof-device-attestation", "ATTESTATION_TOKEN"],
      ["proof-pgp-fingerprint", "FINGERPRINT"]
    ]
  }
  ```

**Verification Levels:**
- `verified_mobile` - Device attestation + manifest + PGP signature
- `verified_web` - Manifest + PGP signature (no hardware)
- `basic_proof` - Some proof data present
- `unverified` - No ProofMode data

**Flutter Implementation Details:**
- Service: `NativeProofmodeService`
- Features:
  - Frame-by-frame hash capture during recording
  - Device hardware attestation (iOS/Android)
  - PGP signature generation
  - Session manifest creation
  - Verification badge display

**Web Implementation Needed:**
- Add ProofMode badge component (already exists: `ProofModeBadge.tsx`)
- Parse and validate ProofMode tags from events
- Display verification level in video UI
- Create ProofMode info page (already exists: `ProofModePage.tsx`)
- Web camera recording: capture frame hashes + PGP signature
- Implement `verified_web` level for browser uploads

### 4. **Multi-Account Support** ⭐ MEDIUM PRIORITY

**What it does:** Switch between multiple Nostr identities within the app without logging out.

**Implementation:**
- **Storage**: LocalStorage or IndexedDB
- **Data Structure**:
  ```typescript
  interface Account {
    npub: string;
    pubkey: string;
    loginMethod: 'extension' | 'keycast' | 'bunker' | 'nsecbunker';
    profile?: {
      name?: string;
      picture?: string;
      nip05?: string;
    };
  }
  ```

**Flutter Implementation Details:**
- Service: `IdentityManagerService`
- Features:
  - Store multiple accounts locally
  - Quick account switcher UI
  - Account-specific settings
  - Per-account cache/data isolation

**Web Implementation Needed:**
- Create `AccountSwitcher` component (already exists)
- Store multiple account credentials securely
- Add account switcher to header/settings
- Clear/reload data on account switch
- Update `useLoggedInAccounts` hook (already exists)

### 5. **Draft Management** ⭐ MEDIUM PRIORITY

**What it does:** Save unfinished videos as drafts with metadata before publishing.

**Implementation:**
- **Storage**: IndexedDB or LocalStorage
- **Data Structure**:
  ```typescript
  interface VideoDraft {
    id: string;
    videoBlob?: Blob;
    videoUrl?: string;
    title?: string;
    description?: string;
    hashtags?: string[];
    thumbnail?: string;
    createdAt: number;
    updatedAt: number;
  }
  ```

**Flutter Implementation Details:**
- Service: `DraftStorageService`
- Features:
  - Auto-save drafts during recording/editing
  - List all saved drafts
  - Resume editing drafts
  - Delete drafts
  - Draft expiration/cleanup

**Web Implementation Needed:**
- Create IndexedDB schema for drafts
- Add draft save/load logic to upload flow
- Create drafts management page
- Add "Resume Draft" button in upload UI
- Implement auto-save timer

### 6. **Advanced Video Recording** ⭐ MEDIUM PRIORITY

**What it does:** Segmented recording with pause/resume, multiple takes, and clip concatenation.

**Implementation:**
- **Browser APIs**: MediaRecorder, MediaStream
- **Recording Modes**:
  - Single continuous take
  - Segmented recording (press-and-hold)
  - Multi-clip stitching

**Flutter Implementation Details:**
- Service: `VineRecordingController`
- Features:
  - Press-and-hold recording interface
  - Visual progress indicator (6.3s max)
  - Pause/resume recording segments
  - Delete last segment
  - Concatenate segments into final video
  - Real-time preview

**Web Implementation Needed:**
- Enhance `CameraRecorder` component
- Implement segment management (record/pause/delete)
- Add visual progress bar with segment indicators
- Implement client-side video concatenation (FFmpeg.wasm)
- Add countdown timer before recording
- Touch/mouse hold-to-record interaction

### 7. **Deep Linking / NIP-19 Support** ⭐ MEDIUM PRIORITY

**What it does:** Open app directly to specific content via URLs (nostr:nevent, nostr:nprofile, nostr:note, etc.)

**Implementation:**
- **NIP-19 Formats**:
  - `nevent1...` - Video events
  - `nprofile1...` - User profiles
  - `naddr1...` - Addressable events (kind 34236)
  - `note1...` - Note IDs

**Flutter Implementation Details:**
- Service: `DeepLinkService`
- Routes:
  - `openvine://event/{nevent}` → Open video
  - `openvine://profile/{nprofile}` → Open profile
  - `https://divine.video/v/{naddr}` → Web deep link

**Web Implementation Needed:**
- Already has `NIP19Page` component ✅
- Enhance router to handle all NIP-19 formats
- Decode naddr/nevent and navigate to content
- Add deep link sharing in share menu
- Support web+nostr:// protocol handler

### 8. **Offline Support & Sync** ⭐ LOW PRIORITY

**What it does:** Queue uploads and interactions when offline, sync when connection restored.

**Implementation:**
- **Service Worker**: Background sync API
- **IndexedDB**: Queue storage
- **Queue Types**:
  - Video uploads
  - Likes/reposts
  - Comments
  - Follows

**Flutter Implementation Details:**
- Services:
  - `OfflineVideoService` - Queue offline uploads
  - `UploadManager` - Retry failed uploads
  - `ConnectionStatusService` - Monitor connectivity
- Features:
  - Automatic retry on reconnection
  - User feedback on queue status
  - Manual retry controls

**Web Implementation Needed:**
- Implement Service Worker with background sync
- Create IndexedDB queue for pending actions
- Add retry logic on reconnection
- Display upload queue status
- Offline indicator in UI

### 9. **Notifications System** ⭐ LOW PRIORITY

**What it does:** Real-time activity notifications (likes, follows, comments, reposts).

**Implementation:**
- **Query Events**:
  - Kind 7: Reactions to user's videos
  - Kind 6: Reposts of user's videos
  - Kind 3: New followers
  - Kind 1: Comments on user's videos

**Flutter Implementation Details:**
- Service: `NotificationService`
- Features:
  - Real-time event subscriptions
  - Notification aggregation (group similar events)
  - Mark as read/unread
  - Notification badge count
  - Clickable notifications → navigate to content

**Web Implementation Needed:**
- Create notifications page/component
- Subscribe to activity events for current user
- Implement notification badge in header
- Add notification preferences in settings
- Group/aggregate similar notifications

### 10. **Search Functionality** ⭐ MEDIUM PRIORITY

**What it does:** Search for videos by hashtags, users by name/npub, and full-text content search.

**Implementation:**
- **Search Types**:
  - Hashtag search (already exists)
  - User search by name/nip05
  - Video search by title/description
  - Full-text search (if relay supports)

**Flutter Implementation Details:**
- Services:
  - `HashtagService` - Hashtag indexing and search
  - `UserProfileService` - User search
  - `VideoEventService` - Video metadata search
- Features:
  - Auto-complete suggestions
  - Search history
  - Trending searches
  - Filter by verification level, duration, etc.

**Web Implementation Needed:**
- Already has `SearchPage` ✅
- Enhance with auto-complete
- Add search history persistence
- Implement filters (verified only, duration, etc.)
- Add trending searches section

### 11. **Analytics & Metrics** ⭐ LOW PRIORITY

**What it does:** Track video views, loops, engagement metrics, and trending algorithms.

**Implementation:**
- **API Endpoints** (already exists):
  - `POST /analytics/view` - Track view
  - `GET /analytics/trending/vines` - Get trending videos
  - `GET /analytics/video/{eventId}/stats` - Get stats
  - `GET /analytics/hashtag/{hashtag}/trending` - Hashtag trends

**Flutter Implementation Details:**
- Services:
  - `AnalyticsService` - Track events
  - `AnalyticsApiService` - API communication
  - `FeedPerformanceTracker` - Feed metrics
- Tracked Metrics:
  - Video views (play start)
  - Loop counts (video replay)
  - Engagement rate (likes/views)
  - Watch time
  - Scroll velocity

**Web Implementation Needed:**
- Implement `AnalyticsService` class
- Track video view events on play
- Track loop counts
- Send metrics to analytics API
- Display metrics on video detail page
- Add analytics dashboard in profile

### 12. **Blossom File Storage** ⭐ LOW PRIORITY

**What it does:** Alternative decentralized file storage protocol (Blossom) for videos.

**Implementation:**
- **Event Kind**: 1063 (NIP-94 File Metadata)
- **Blossom Upload Flow**:
  1. Calculate SHA-256 hash of video
  2. Sign NIP-98 auth header
  3. PUT to Blossom server
  4. Receive signed receipt
  5. Publish Kind 1063 event

**Flutter Implementation Details:**
- Services:
  - `BlossomAuthService` - NIP-98 signatures
  - `BlossomUploadService` - Upload to Blossom servers
- Features:
  - Multi-server upload (redundancy)
  - Server discovery
  - Upload progress tracking
  - CDN URL resolution

**Web Implementation Needed:**
- Create Blossom client library
- Implement NIP-98 auth signing
- Add Blossom server selection in settings
- Support Blossom URLs in video player
- Add Blossom upload option in upload flow

### 13. **NIP-05 Verification** ⭐ MEDIUM PRIORITY

**What it does:** Display verified internet identifiers (name@domain.com) for users.

**Implementation:**
- **Kind 0 Profile Field**: `nip05: "name@domain.com"`
- **Verification Endpoint**: `GET https://domain.com/.well-known/nostr.json?name=name`
- **Response Format**:
  ```json
  {
    "names": {
      "name": "pubkey-in-hex"
    }
  }
  ```

**Flutter Implementation Details:**
- Service: `Nip05Service`
- Features:
  - Verify NIP-05 identifiers
  - Cache verification results
  - Display verification badge
  - Auto-verify on profile load

**Web Implementation Needed:**
- Create NIP-05 verification service
- Fetch and cache verification results
- Display verification badge on profiles
- Add NIP-05 field in profile editor
- Show verification status in search results

### 14. **Video Editor** ⭐ LOW PRIORITY

**What it does:** Basic video editing before publishing (trim, filters, text overlay).

**Implementation:**
- **Browser APIs**: Canvas API, Web Audio API
- **Edit Operations**:
  - Trim start/end
  - Apply filters (brightness, contrast, saturation)
  - Add text overlays
  - Adjust audio levels

**Flutter Implementation Details:**
- Service: `VideoProcessingService`
- Features:
  - Timeline-based trimming
  - Filter presets
  - Text overlay with positioning
  - Preview before publish

**Web Implementation Needed:**
- Create video editor component
- Implement Canvas-based video processing
  - Load video to canvas
  - Apply CSS filters
  - Render text overlays
  - Export edited video
- Add editor to upload flow
- Create filter preset library

### 15. **Wallet Integration (NWC/Zaps)** ⭐ LOW PRIORITY

**What it does:** Send/receive Bitcoin Lightning tips (zaps) on videos.

**Implementation:**
- **Protocol**: NIP-57 (Lightning Zaps)
- **Nostr Wallet Connect**: NIP-47
- **Flow**:
  1. Parse `lud16` from profile (Kind 0)
  2. Fetch LNURL from lightning address
  3. Request invoice
  4. Pay via NWC
  5. Publish Kind 9735 zap receipt

**Flutter Implementation Details:**
- Services:
  - NWC connection management
  - Lightning address resolution
  - Zap request/receipt handling
- Features:
  - Quick zap buttons (presets)
  - Zap leaderboard
  - Zap notifications

**Web Implementation Needed:**
- Already has `NWCContext` and `WalletModal` ✅
- Already has `ZapButton` and `ZapDialog` ✅
- Enhance zap UI in video player
- Add zap animations
- Display zap counts on videos
- Create zap leaderboard

### 16. **Hashtag Discovery** ⭐ MEDIUM PRIORITY

**What it does:** Browse trending hashtags, hashtag feeds, and hashtag autocomplete.

**Implementation:**
- **Tags**: Parse `t` tags from Kind 34236 events
- **Trending Algorithm**:
  - Count hashtag occurrences in recent events
  - Weight by video engagement
  - Time decay factor

**Flutter Implementation Details:**
- Services:
  - `HashtagService` - Index and search hashtags
  - `TopHashtagsService` - Trending hashtags
- Features:
  - Trending hashtags feed
  - Hashtag autocomplete
  - Hashtag video counts
  - Related hashtags

**Web Implementation Needed:**
- Already has `HashtagPage` and `HashtagDiscoveryPage` ✅
- Already has `TrendingHashtags` component ✅
- Add hashtag autocomplete in video metadata form
- Show hashtag video counts
- Add related hashtags section

### 17. **Activity Feed** ⭐ MEDIUM PRIORITY

**What it does:** Unified feed showing all user interactions (likes, follows, comments, reposts).

**Implementation:**
- **Subscribe to Events**:
  - Kind 7 where `e` tag references user's videos
  - Kind 6 where `e` tag references user's videos
  - Kind 1 where `e` tag references user's videos
  - Kind 3 where `p` tag is current user
- **Aggregation**: Group similar events (e.g., "5 people liked your video")

**Flutter Implementation Details:**
- Screen: `ActivityScreen`
- Service: `NotificationService`
- Features:
  - Real-time activity updates
  - Grouped notifications
  - Clickable to navigate to source
  - Mark all as read
  - Filter by activity type

**Web Implementation Needed:**
- Create activity feed page
- Subscribe to relevant events for current user
- Implement notification aggregation
- Add activity badge in header
- Create activity item components
- Add mark as read functionality

### 18. **P2P Video Sync** ⭐ VERY LOW PRIORITY

**What it does:** Peer-to-peer video sharing via WebRTC for offline/local networks.

**Implementation:**
- **Protocol**: WebRTC Data Channels
- **Discovery**: NIP-46 (Nostr Remote Signing) for peer discovery
- **Use Cases**:
  - Offline festivals/events
  - Mesh networks
  - Reduced bandwidth usage

**Flutter Implementation Details:**
- Services:
  - `P2PDiscoveryService` - Find nearby peers
  - `P2PVideoSyncService` - Transfer videos
- Features:
  - Auto-discover nearby peers
  - Share videos directly
  - Offline mesh sync

**Web Implementation Needed:**
- Implement WebRTC peer discovery
- Create P2P video transfer protocol
- Add P2P settings page
- Display peer status indicator
- Build P2P sync queue

### 19. **Content Warning & NSFW** ⭐ MEDIUM PRIORITY

**What it does:** Mark and filter sensitive content with warnings.

**Implementation:**
- **Tags in Kind 34236**:
  ```json
  {
    "tags": [
      ["content-warning", "violence"],
      ["content-warning", "nudity"],
      ["L", "content-warning"],
      ["l", "NSFW", "content-warning"]
    ]
  }
  ```

**Flutter Implementation Details:**
- Service: `ContentModerationService`
- Features:
  - Blur NSFW thumbnails
  - Require tap to view
  - Age gate for restricted content
  - User preferences for content filtering

**Web Implementation Needed:**
- Parse `content-warning` tags
- Add blur overlay to sensitive content
- Add "Show Content" button
- Store user preferences for auto-show/hide
- Add content warning option in upload form

### 20. **Geo-Blocking** ⭐ VERY LOW PRIORITY

**What it does:** Restrict content access based on geographic location (compliance).

**Implementation:**
- **Cloudflare Worker**: Check request country code
- **Blocked Regions**: Return 451 status
- **Event Tagging**: Optional `geo` tag for content

**Flutter Implementation Details:**
- Service: `GeoBlockingService`
- Features:
  - Detect user location
  - Show geo-block message
  - Suggest VPN usage

**Web Implementation Needed:**
- Already exists in geo-blocker worker ✅
- Add geo-block error handling in API client
- Display user-friendly geo-block message
- Add VPN/proxy suggestions

## Implementation Priority Summary

### 🔥 High Priority (Core UX Improvements)
1. Curated Lists / Playlists
2. Content Moderation System
3. ProofMode Verification

### ⚡ Medium Priority (Important Features)
4. Multi-Account Support
5. Draft Management
6. Advanced Video Recording
7. Deep Linking / NIP-19
8. Search Functionality
9. NIP-05 Verification
10. Hashtag Discovery
11. Activity Feed
12. Content Warning & NSFW

### 💤 Low Priority (Nice to Have)
13. Offline Support & Sync
14. Notifications System
15. Analytics & Metrics
16. Blossom File Storage
17. Video Editor
18. Wallet Integration (already partially implemented)

### 🚫 Very Low Priority (Advanced/Niche)
19. P2P Video Sync
20. Geo-Blocking (already implemented in backend)

## Technical Architecture Notes

### State Management
- **Flutter**: Riverpod for reactive state
- **Web**: React Context + Custom Hooks

### Storage
- **Flutter**: Hive (local NoSQL), SharedPreferences (simple key-value)
- **Web**: IndexedDB (complex data), LocalStorage (simple data)

### Event Caching
- **Flutter**: In-memory cache + Hive persistence
- **Web**: EventCache service with Map-based storage

### API Communication
- **Flutter**: Dio HTTP client
- **Web**: Fetch API with custom wrappers

### Relay Management
- **Flutter**: WebSocket with automatic reconnection
- **Web**: Nostrify relay pool

## Next Steps

1. **Review Current Web Implementation**: Check existing components/hooks
2. **Prioritize Features**: Focus on High/Medium priority items first
3. **Implement NIP-51 Lists**: Start with curated video lists
4. **Add Content Moderation**: Implement reporting and muting
5. **Enhance ProofMode**: Parse and display verification badges
6. **Multi-Account Support**: Add account switcher
7. **Drafts System**: Implement IndexedDB-based draft storage

## References

- [NIP-01: Basic Protocol](https://github.com/nostr-protocol/nips/blob/master/01.md)
- [NIP-09: Event Deletion](https://github.com/nostr-protocol/nips/blob/master/09.md)
- [NIP-17: Private Direct Messages](https://github.com/nostr-protocol/nips/blob/master/17.md)
- [NIP-32: Labeling](https://github.com/nostr-protocol/nips/blob/master/32.md)
- [NIP-51: Lists](https://github.com/nostr-protocol/nips/blob/master/51.md)
- [NIP-56: Reporting](https://github.com/nostr-protocol/nips/blob/master/56.md)
- [NIP-57: Lightning Zaps](https://github.com/nostr-protocol/nips/blob/master/57.md)
- [NIP-65: Relay List Metadata](https://github.com/nostr-protocol/nips/blob/master/65.md)
- [NIP-71: Video Events](https://github.com/nostr-protocol/nips/blob/master/71.md)
- [NIP-92: Media Attachments](https://github.com/nostr-protocol/nips/blob/master/92.md)
- [NIP-94: File Metadata](https://github.com/nostr-protocol/nips/blob/master/94.md)
- [NIP-98: HTTP Auth](https://github.com/nostr-protocol/nips/blob/master/98.md)

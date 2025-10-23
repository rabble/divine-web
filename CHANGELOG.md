# Changelog

All notable changes to Divine Web will be documented in this file.

## [Unreleased]

### Added
- **Keycast authentication integration** - Alternative login method using Keycast for NIP-46 remote signing
- Keycast login form and signup dialog components
- `useKeycastSession` hook for managing Keycast authentication sessions
- Service worker unregistration page for cleaning up old service workers
- Identity integration guide documentation (IDENTITY_INTEGRATION_GUIDE.md)
- Nostrify NIP-46 analysis documentation (NOSTRIFY_NIP46_ANALYSIS.md)
- Test scripts for video relay debugging and validation
- Conditional debug logging that only outputs on localhost
- Debug utility functions (debugLog, debugError, debugWarn) in `/lib/debug.ts`
- iOS TestFlight link in header dropdown menu
- About page with Divine Web project information
- Privacy policy page explaining data collection and user rights
- Open Source page with platform availability and contribution info
- Landing page for logged-out users with "Divine Video - Bringing back Vine using Nostr" message
- Authentication gating - all routes now require Nostr login
- Video navigation with swipe/click zones for next/previous video in feeds
- Full social interaction support for all pages (like, repost, comment, add to list)
- Enhanced visual feedback for social interactions with colored backgrounds and filled icons
- Context-aware video navigation that remembers source (hashtag/profile feeds)
- Hashtag thumbnail precalculation system with URL validation
- Downloaded 181 hashtag thumbnails locally for reliable loading
- Local thumbnail serving from `/public/thumbnails/` to avoid CDN issues

### Changed
- All console.log statements replaced with conditional debug logging
- Debug information and performance panel now only visible on localhost
- Updated branding from "OpenVine" to "Divine Web" throughout the application
- Header navigation includes dropdown menu with links to About, Privacy, and Open Source pages
- App now requires Nostr authentication to access any content
- Removed "New to Nostr?" sign-up option from login interface
- Migrated from Kind 32222 to Kind 34236 for NIP-71 compliance (addressable video events)
- Social interaction buttons now show stronger visual feedback (colored backgrounds when active)
- Navigation hints updated from confusing "arrow keys" text to clear "previous" and "next" labels

### Fixed
- **Fixed imeta tag parsing** - Parser now handles both space-separated format (`["imeta", "url https://..."]`) and separate element format (`["imeta", "url", "https://..."]`) to support different event publishers
- **Blocked vine.co URLs** - Videos will never attempt to load from vine.co domains which are CORS-blocked and no longer functional
- **Fixed video card spacing** - Added proper gap between video cards in feed to match skeleton loading state
- **Improved Keycast signup flow** - Bunker connection now runs in background to prevent UI blocking during account creation
- **MAJOR**: Fixed videos disappearing and going white when scrolling by removing broken virtual scrolling
- Video performance issues - reduced load time from 20+ seconds to ~3 seconds
- Fixed preload logic to load videos when in viewport
- Removed duplicate debug panels (merged VideoDebugInfo into PerformanceDebugPanel)
- Improved video scrolling behavior to always play the most visible video instead of any partially visible video
- Ensured only one video plays at a time with proper pause/reset when scrolling
- Fixed video timestamps to show original Vine posting time when available instead of repost time
- **Fixed old Vine videos showing incorrect dates** - Now properly displays original Vine publish dates (2016) from `published_at` tag instead of Nostr import timestamp (2025) in search results and list pages
- **Fixed original Vine stats not displaying** - Now extracts and displays original likes, reposts, and comments counts from Vine archive tags instead of only showing live Nostr reactions
- Implemented video fallback URLs to automatically try alternative CDN URLs when primary URL fails (404 errors)
- Fixed React hooks rules violation in VideoPage.tsx (moved all hooks before conditional returns)
- Fixed social interaction buttons not working on individual video pages (VideoPage.tsx)
- Added missing query invalidation for list updates - list badges now update immediately
- Fixed broken UX with intrusive floating navigation buttons
- Fixed hashtag thumbnail loading issues - HTTP 500 errors from CDN under concurrent load resolved by serving locally
- **Fixed hashtag feeds not showing most popular videos** - Now sorts by total engagement (loop count + all-time reactions) instead of chronological order
- **Fixed home feed sorting** - Now uses popularity algorithm (loop count + all-time reactions) to show most popular videos first
- **Fixed unmute button pausing video on mobile** - Touch events now properly handled to prevent pause when tapping unmute
- **Fixed hashtag grid layout not working** - Removed hardcoded single-column wrapper that prevented grid toggle from working
- **Fixed infinite loading spinner on hashtag pages** - Spinner no longer appears constantly when 20+ videos are loaded
- Changed reaction counting from 24-hour window to all-time for better ranking on low-activity sites

### Performance
- Optimized video feed to use virtualization (only renders visible videos)
- Lazy loading of video metadata with intersection observer
- Reduced initial query size for better performance
- Videos preload metadata when scrolled into view
- Reduced initial query limit from 200 to 30 for faster load times
- Optimized initial render to show 3 videos instead of 5
- Changed video preload strategy to 'auto' for visible videos
- Reduced repost query limits for better performance
- Increased hashtag query limit to 500 videos to enable accurate popularity ranking while maintaining reasonable performance

## [0.1.0] - Initial Release
- Basic Divine Web functionality
- Video feed with 6-second looping videos
- Nostr protocol integration
- Support for multiple feed types (discovery, home, trending, hashtag, profile)
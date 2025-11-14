# Changelog

All notable changes to Divine Web will be documented in this file.

## [Unreleased]

### Added
- **MailerLite signup on About page** - Added email signup form to About page for users to receive updates about app store releases
- **Divine 404 page** - Campy, glamorous 404 error page featuring Divine with gradient background, playful messaging ("This Page is Divine...ly Missing!"), and fun call-to-action button
- **News page** - Added /news page with press releases and media coverage about Divine
- **Press release page** - Full "Vine Revisited" press release from Web Summit Lisbon announcement (November 13, 2024)
- **TechCrunch article link** - Direct link to TechCrunch coverage on news page
- **iOS beta test announcement** - Added prominent notice about 10,000 signups in hours and pending App Store approval, with link to TechCrunch article
- **Public browsing without login** - Users can now browse videos, profiles, hashtags, trending, and discovery feeds without creating an account
- **Landing page improvements** - Added Divine elevator pitch, "Start Exploring" CTA button, clickable carousel, simplified calls-to-action
- **Search available to logged-out users** - Search functionality now accessible to everyone, not just logged-in users
- **macOS app download link** - Direct download link for native macOS app added to Open Source page
- **Footer navigation on landing page** - All footer links (About, FAQ, Made by Humans, Our Mission, ProofMode, Open Source, EULA/T&C, Privacy, Safety) now accessible to logged-out users on the landing page, split into two rows for better visual balance
- **Cloudflare Pages Function for SPA routing** - Proper server-side routing that returns 200 status codes for all valid routes, fixing SEO issues where bots (like Google) were getting 404 responses
- **Terms of Service (EULA) page** - Comprehensive legal document for App Store compliance at /terms
  - Zero tolerance policy for objectionable content and abusive users
  - Clear prohibition of CSAM, illegal content, harassment, hate speech, violence, and spam
  - User reporting mechanism with 24-hour response commitment
  - Content filtering methods (CSAM hash-matching via Cloudflare/BunnyCDN, AI analysis)
  - User blocking and muting tools
  - Consequences for violations: immediate content removal, permanent ban, law enforcement reporting
  - Linked in footer navigation and header dropdown menu as "EULA/T&C"
- **Content Moderation and Safety section in Privacy Policy**
  - Zero tolerance policy documentation
  - Content filtering methods explained
  - User reporting mechanism with 24-hour response commitment
  - User blocking tools detailed
  - Enforcement actions outlined
- **Enhanced Safety Standards page**
  - Prominent 24-hour response commitment (in red text)
  - Clear statement about removing offending content AND ejecting users
  - Detailed response procedures for CSAM reports
- **Comprehensive FAQ page enhancements** - Added extensive FAQ content covering all aspects of Divine
- FAQ section about Lists feature - explains how users can curate and organize video collections (democratizing what was previously only available to Vine employees)
- "Where is the x, y, or z Vine?" FAQ explaining archive limitations and lost content
- Request for community contributions of old Vine collections (with or without metadata)
- Information about millions of archived comments and user avatars awaiting restoration
- Cryptocurrency clarification FAQ explicitly stating Divine is NOT blockchain/crypto/Web3
- Link to Safety Standards page from moderation FAQ
- Android beta test link throughout application (parallel to iOS TestFlight)
- FAQ link added to footer navigation
- **ProofMode navigation links** - Added ProofMode icon button to main header navigation and authenticity/ProofMode links to footer for better discoverability
- **Human-Made content certification** - Badge system inspired by no-ai-icon.com to certify human-created videos
- NoAIBadge component with brain icon to indicate human-created content
- Automatic badge for all migrated Vine videos (2013-2017, pre-AI video generation)
- User-claimed certification via "human-created" hashtag tag
- /human-created page explaining certification criteria and linking to no-ai-icon.com
- **Firebase Analytics integration** - Added comprehensive error tracking and analytics
- Analytics utility module with event tracking, error reporting, and performance metrics
- Global error handlers for unhandled errors and promise rejections
- Helper functions for tracking video interactions, user actions, and page views
- **Relay-native sorting** - Implemented server-side sorting via custom Nostrify monkeypatch
- Monkeypatch for preserving custom filter parameters (like `sort`) when querying Nostr relays
- Server-side sorting by `loop_count` for trending, hashtag, home, and discovery feeds
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
- **Reduced video loading flash** - Replaced bright skeleton loaders with subtle dark backgrounds and minimal spinners to eliminate intense flashing during video load
- **Links open in same tab** - Removed `target="_blank"` from links for normal navigation behavior
- **Simplified landing page** - Removed three demo cards (Authentic, Verified, Decentralized) for cleaner design
- **Landing page redesign** - Removed header when logged out, added elevator pitch without directly mentioning Vine, made screenshot carousel clickable
- **Header navigation updated** - Divine logo now links to /discovery, Hashtags and Search visible to all users
- **Open Source page revised** - Updated to focus on beta testing, corrected archive numbers (hundreds of thousands vs 900 million), removed Windows and Linux mentions
- **Reduced reconnection error prominence** - Removed alarming "Reconnection Failed" and "Reconnection Slow" toasts; users can browse without seeing connection errors
- **Routing updates** - Made discovery, trending, hashtags, profiles, videos, and search accessible without login; only home feed, lists, and list details require login
- **Expanded FAQ moderation section** - Added zero tolerance policy, content filtering methods, user blocking tools, and 24-hour response commitment
- **Enhanced FAQ reporting section** - Added prominent 24-hour response commitment and immediate response process for CSAM reports
- **Updated branding to "Divine"** - Changed all instances of "OpenVine" to "Divine" throughout application for consistent brand styling
- **Updated contact email** - Changed from rabble@openvine.co to support@divine.video in Terms of Service and Privacy Policy
- **Improved profile caching** - Increased useAuthor timeout from 1.5s to 5s, useBatchedAuthors timeout from 3s to 10s, cache staleTime from 1min to 5min, and gcTime from 5min to 30min for more reliable username display
- **Updated navigation visibility for public access** - Lists now only visible to logged-in users; Hashtags and Search visible to all users
- Cryptocurrency FAQ moved to bottom of Technical Questions section and reframed to emphasize Divine is NOT a crypto/blockchain project
- FAQ page subtitle updated to "Divine"
- Removed GitHub link from footer navigation (replaced with FAQ link)
- Hidden wallet settings link in account switcher dropdown (feature temporarily disabled)
- All console.log statements replaced with conditional debug logging
- Debug information and performance panel now only visible on localhost
- Updated branding from "OpenVine" to "Divine Web" throughout the application
- Header navigation includes dropdown menu with links to About, Privacy, and Open Source pages
- App now requires Nostr authentication to access any content
- Removed "New to Nostr?" sign-up option from login interface
- Migrated from Kind 32222 to Kind 34236 for NIP-71 compliance (addressable video events)
- Social interaction buttons now show stronger visual feedback (colored backgrounds when active)
- Navigation hints updated from confusing "arrow keys" text to clear "previous" and "next" labels

### Removed
- **PerformanceDebugPanel** - Removed debug panel from main app that was showing on localhost
- **RelayDebugInfo component** - Removed relay debugging UI from Discovery page

### Fixed
- **Fixed SEO 404 errors for search engine bots** - Implemented Cloudflare Pages Function to return proper 200 status codes for all SPA routes instead of 404s, fixing indexing issues with Google and other search engines
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

### Removed
- **Removed "Made by Humans" badge from video cards** - NoAIBadge component no longer displayed on individual video cards (badge still available on /human-created page)

### Performance
- **Relay-native sorting reduces client CPU usage** - Server-side sorting by loop_count offloads processing from browser to relay for trending/hashtag/home/discovery feeds
- **Batched author profile fetching** - Reduced relay subscriptions by 18-36x per feed load by fetching all author profiles in a single query instead of individual requests
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
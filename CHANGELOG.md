# Changelog

All notable changes to Divine Web will be documented in this file.

## [Unreleased]

### Added
- Conditional debug logging that only outputs on localhost
- Debug utility functions (debugLog, debugError, debugWarn) in `/lib/debug.ts`
- iOS TestFlight link in header dropdown menu
- About page with Divine Web project information
- Privacy policy page explaining data collection and user rights
- Open Source page with platform availability and contribution info

### Changed
- All console.log statements replaced with conditional debug logging
- Debug information and performance panel now only visible on localhost
- Updated branding from "OpenVine" to "Divine Web" throughout the application
- Header navigation includes dropdown menu with links to About, Privacy, and Open Source pages

### Fixed
- Video performance issues - reduced load time from 20+ seconds to ~3 seconds
- Implemented proper video virtualization to only render visible videos
- Fixed preload logic to load videos when in viewport
- Removed duplicate debug panels (merged VideoDebugInfo into PerformanceDebugPanel)
- Improved video scrolling behavior to always play the most visible video instead of any partially visible video
- Ensured only one video plays at a time with proper pause/reset when scrolling

### Performance
- Optimized video feed to use virtualization (only renders visible videos)
- Lazy loading of video metadata with intersection observer
- Reduced initial query size for better performance
- Videos preload metadata when scrolled into view

## [0.1.0] - Initial Release
- Basic Divine Web functionality
- Video feed with 6-second looping videos
- Nostr protocol integration
- Support for multiple feed types (discovery, home, trending, hashtag, profile)
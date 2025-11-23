# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
- Discovery routing: Add `/discovery/:tab` routes (hot, top, rising, new, hashtags) and default `/discovery` → `/discovery/new`. Sync tab state with URL.
- Performance metrics: Instrument recent feed with query/parse/total timings and first-render metric; expose logs via `window.performanceMonitor`.
- Modal/feed stability: Prevent layout/scroll jumps by reserving scrollbar gutter and disabling overflow anchoring on feed containers.
  - CSS: `html { scrollbar-gutter: stable both-edges; }`.
  - CSS: `.feed-root { overflow-anchor: none; }` and apply to `VideoFeed` wrappers.
- Comments UX: Optimistically increment comment count on post from comments modal.
  - `CommentsSection` → `onCommentPosted` callback.
  - `VideoCommentsModal` forwards callback.
  - `VideoCard` maintains `localCommentCount` and updates immediately.
- Add-to-List dialog: Surface discovery by showing public lists that already include the video (lazy-loaded, up to 6 with links).
- UI bugfix: Convert `Badge` to `forwardRef` to resolve React ref warning with Radix slots.
- Meta/security cleanup: Remove invalid `<meta http-equiv="X-Frame-Options">`; add `mobile-web-app-capable` meta. Server headers should set X-Frame-Options/CSP.
- Docs: Add `AGENTS.md` contributor guide.

## [Previous]
- Initial project setup and ongoing work (see git history).

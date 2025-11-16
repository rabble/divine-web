# Navigation Update - Final Implementation

## Overview

Restructured the web app's navigation to match the Flutter app's structure with a clean, simple Home/Discover flow.

## Final Navigation Structure

### Main Pages

**1. Home Page (`/`)**
- **When logged out:** Landing page
- **When logged in:** Home feed showing videos from people you follow
- **Header:** "Home" / "Videos from people you follow"
- **Feed type:** `home` (following feed with auto-refresh every 10 min)

**2. Discover Page (`/discovery`)**
- **Available to:** Everyone (logged in or not)
- **Header:** "Discover" / "Explore videos from the network"
- **Has tabs:**
  - Trending: Popular videos sorted by engagement
  - New Videos: Recent videos from last 30 days
- **Features:** Verified-only toggle filter
- **Feed types:** `trending` and `recent`

### Navigation Components

**Top Header (Desktop & Mobile)**
```
┌─────────────────────────────────────────┐
│ diVine  [Home] [Discover] [Search] [•••]│
└─────────────────────────────────────────┘
```
- **Logo:** Links to `/`
- **Home:** Links to `/` (home feed)
- **Discover:** Links to `/discovery` (trending/new)
- **Search:** Links to `/search`
- **More menu (•••):** Info, settings, legal links

**Bottom Nav (Mobile Only)**
```
┌───────┬──────────┬────────┬─────────┐
│ Home  │ Discover │ Search │ Profile │
└───────┴──────────┴────────┴─────────┘
```
- 4 main navigation items
- Clean, uncluttered design
- Matches Flutter app's bottom nav

## User Flows

### Logged Out User
1. Lands on landing page at `/`
2. Can click "Discover" to browse public videos
3. Can search for content
4. Prompted to log in for Home feed

### Logged In User
1. Lands on Home feed at `/` showing followed users' videos
2. Can navigate to Discover to explore all public videos
3. Can use Search to find specific content
4. Can access Profile, Lists, Settings via menus

## Feed Types & Behavior

| Page | Feed Type | Description | Auto-Refresh |
|------|-----------|-------------|--------------|
| Home (`/`) | `home` | Videos from followed users | Every 10 min |
| Discover - Trending (`/discovery`) | `trending` | Popular videos by engagement | Manual only |
| Discover - New (`/discovery`) | `recent` | Videos from last 30 days | Every 30 sec |
| Profile | `profile` | User's videos | Manual only |
| Hashtag | `hashtag` | Videos with specific tag | Manual only |

## Key Improvements

### ✅ Simplification
- **Removed:** Redundant Home/Discover tabs on index page
- **Result:** Cleaner UI, less confusion
- Navigation buttons in header/bottom nav are sufficient

### ✅ Clarity
- **Home** = Videos from people you follow
- **Discover** = All public videos
- Clear, obvious distinction

### ✅ Consistency
- Matches Flutter app's navigation structure
- Same feed types and behavior
- Familiar user experience across platforms

## Before vs After

### Before
```
/ (Index)
├─ Tab: Home → Home feed
└─ Tab: Explore
   ├─ Sub-tab: Trending
   └─ Sub-tab: New Videos
```
**Problem:** Redundant tabs when nav has Home/Discover buttons

### After
```
/ (Index) → Home feed directly

/discovery → Discover page
├─ Tab: Trending
└─ Tab: New Videos
```
**Benefit:** One click to each destination, no redundancy

## Routes Overview

### Public Routes (Always Accessible)
- `/` - Home (landing page if not logged in)
- `/discovery` - Discover page with tabs
- `/trending` - Legacy trending page
- `/hashtags` - Hashtag discovery
- `/hashtag/:tag` - Specific hashtag feed
- `/search` - Search page
- `/profile/:npub` - User profiles
- `/video/:id` - Individual videos
- Info pages: `/about`, `/privacy`, `/terms`, etc.

### Protected Routes (Require Login)
- `/` - Home feed (when logged in)
- `/lists` - User's curated lists
- `/settings/moderation` - Moderation settings

## Technical Details

### Auto-Refresh Implementation
```typescript
// Home feed: Refresh every 10 minutes
useEffect(() => {
  if (feedType === 'home') {
    intervalId = setInterval(() => {
      queryResult.refetch();
    }, 10 * 60 * 1000);
  }
}, [feedType]);
```

### Feed Deduplication
- All feeds use Map-based deduplication by `vineId`
- Reposts aggregated as metadata on original video
- Each video appears exactly once
- Shows "X and N others reposted" attribution

### Manual Refresh
- All feeds have refresh button
- Shows loading state during refresh
- Resets pagination to get latest content

## Related Commits

1. **2955219** - Implement feed deduplication and repost aggregation
2. **c4b8c0b** - Add auto-refresh to feeds
3. **dd93346** - Restructure main navigation to match Flutter app
4. **85830f1** - Remove redundant tabs on Index page

## Conclusion

The web app now has a clean, simple navigation structure that:
- ✅ Matches the Flutter app
- ✅ Eliminates redundancy
- ✅ Makes the Home feed prominent and easy to find
- ✅ Provides clear distinction between Home (following) and Discover (all)
- ✅ Works great on both desktop and mobile

No more confusion about "where is the home feed?" - it's right on the main page! 🎉

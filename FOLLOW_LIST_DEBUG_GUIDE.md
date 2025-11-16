# Follow List Debug Guide

## How to Check if Your Follow List is Working

### Step 1: Open Browser Console
Press F12 or right-click > Inspect > Console tab

### Step 2: Look for Follow List Debug Messages

When you visit the home feed, you should see messages like this:

```
[useFollowList] ========== FETCHING FOLLOW LIST ==========
[useFollowList] User pubkey: 932614571afcbad4d17a191ee281e39eebbb41b93fac8fd87829622aeb112f4d
[useFollowList] Query filter: {kinds: [3], authors: [...], limit: 1}
[NostrProvider] Routing 1 profile/contact filters to 4 relays
[useFollowList] Received 1 kind 3 events
[useFollowList] Contact list event ID: abc123...
[useFollowList] Contact list created at: 2025-11-15T10:30:00.000Z
[useFollowList] Contact list has 47 total tags
[useFollowList] Found 45 'p' tags
[useFollowList] ✅ Extracted 45 valid followed pubkeys
[useFollowList] Sample follows (first 5):
[useFollowList]   1. e33fe65f1fde44c6dc17eeb38fdad0fceaf1cae8722084332ed1e32496291d42
[useFollowList]   2. 82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2
[useFollowList]   3. 3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d
[useFollowList]   4. 50d94fc2d8580c682b071a542f8b1e31a200b0508bab95a33bef0855df281d63
[useFollowList]   5. 91c9a5e1a9744114c6fe2d61ae4de82629eaaa0fb52f48288093c7e7e036f832
[useFollowList]   ... and 40 more
```

### Step 3: Check Video Query

After the follow list is fetched, you should see:

```
[useVideoEvents] Using follow list from cache/hook
[useVideoEvents] Follow list: 45 follows
[useVideoEvents] Following: e33fe65f..., 82341f88..., 3bf0c63f..., 50d94fc2..., 91c9a5e1...
[useVideoEvents] Sending query with filter: {
  "kinds": [21, 22, 34236],
  "authors": ["e33fe65f...", "82341f88...", ...],
  "limit": 50,
  "sort": {"field": "loop_count", "dir": "desc"}
}
```

### Step 4: Interpret Results

#### ✅ Success Case
```
[useFollowList] ✅ Extracted 45 valid followed pubkeys
[useVideoEvents] Follow list: 45 follows
[useVideoEvents] Video query took 234ms, got 12 events
```
**Meaning:** Your follow list was found and videos were retrieved!

#### ⚠️ No Follow List Found
```
[useFollowList] Received 0 kind 3 events
[useFollowList] ⚠️ WARNING: No contact list found for user
```
**Meaning:** Your contact list isn't on any of the queried relays.

**Possible causes:**
1. **You haven't followed anyone yet** - Go to Discover and follow some creators!
2. **Contact list is on a different relay** - Your kind 3 might be on a relay we're not querying
3. **You're using a different account** - Make sure you're logged in with the right Nostr account

#### ❌ No Follows in Contact List
```
[useFollowList] Received 1 kind 3 events
[useFollowList] Found 0 'p' tags
[useFollowList] ✅ Extracted 0 valid followed pubkeys
```
**Meaning:** Your contact list exists but has no follows.

**Solution:** Go follow some people!

## Relays Being Queried

Kind 3 contact lists are now queried from **4 relays** (same as kind 0 profiles):
1. `wss://purplepag.es` - Profile aggregator
2. `wss://relay.nos.social` - Popular general relay
3. `wss://relay.damus.io` - Damus relay (very popular)
4. `wss://relay.ditto.pub` - Ditto relay (user's NIP-05 relay)

This matches how profiles are fetched and gives the best chance of finding your contact list.

## How to Manually Check Your Follow List

### Using a Nostr Client

1. Open any Nostr client (Damus, Amethyst, Primal, etc.)
2. Go to your profile
3. Check who you're following
4. If you see people there, your kind 3 event exists somewhere

### Using nak CLI (Advanced)

```bash
# Query for your kind 3 event
nak req -k 3 --author <your-npub> wss://purplepag.es wss://relay.nos.social

# Example:
nak req -k 3 --author npub1jvnpg4c6ljadf5t6ry0w9q0rnm4mksde87kglkrc993z46c39axsgq89sc wss://purplepag.es
```

This will show you if your contact list exists and which relay has it.

## Troubleshooting Steps

### If Your Home Feed is Empty:

1. **Check Console Logs** - Look for the debug messages above
2. **Verify You Have Follows** - Check in another Nostr client
3. **Try Following Someone** - Follow a user from the Discover page
4. **Wait 1 Minute** - The follow list cache refreshes every minute
5. **Hard Refresh** - Press Ctrl+Shift+R (Cmd+Shift+R on Mac)

### If Logs Show No Contact List:

1. **Use Another Nostr Client** - Follow someone in Damus/Amethyst/Primal
2. **Check Relay Settings** - Make sure your client is publishing to common relays
3. **Wait for Propagation** - It can take a few seconds for events to spread
4. **Check Account** - Make sure you're logged in with the same npub

### If You See "Extracted 0 valid followed pubkeys":

Your contact list exists but has no 'p' tags. This means:
- You need to follow some people!
- Go to Discover > Trending and follow creators you like

## Expected Behavior

When everything is working:

1. **Login** → useFollowList fetches your kind 3 from 4 relays
2. **Navigate to Home** → useVideoEvents uses cached follow list
3. **Query Videos** → Filters by authors in your follow list
4. **Show Videos** → Deduplicated feed of videos from people you follow
5. **Auto-Refresh** → Every 10 minutes, refetches to get new videos

## Common Issues

### "I followed someone but they're not in my home feed"

**Check:**
1. Did the follow succeed? Check console for publish errors
2. Wait 1 minute for cache to refresh (or hard refresh page)
3. Does the creator have any videos? Check their profile

### "My home feed shows videos from people I don't follow"

**This shouldn't happen!** If it does:
1. Check console logs for the follow list
2. Verify the pubkeys in the logs
3. File a bug report with console logs

### "Home feed is empty but I'm following people"

**Causes:**
1. People you follow haven't posted any videos yet
2. Their videos are on a different relay (unlikely with our multi-relay query)
3. Follow list not found on any of the 4 relays we query

**Solution:**
- Check if those people have videos in their profile
- Try following more active creators from Discover

## Technical Details

### Query Flow

```
User visits Home page (/)
    ↓
useFollowList hook called
    ↓
Queries kind 3 from 4 relays:
  - purplepag.es
  - relay.nos.social
  - relay.damus.io
  - nos.lol
    ↓
Returns first contact list found
    ↓
Extracts 'p' tags (followed pubkeys)
    ↓
Caches result for 1 minute
    ↓
useVideoEvents uses cached list
    ↓
Queries videos from followed authors
    ↓
Renders home feed
```

### Cache Behavior

- **Stale time:** 1 minute (refetches after this)
- **GC time:** 5 minutes (keeps in memory)
- **Refetch on focus:** Yes (when you return to tab)
- **Refetch on mount:** Yes (always fresh on page load)

This ensures your follow list is always up-to-date!

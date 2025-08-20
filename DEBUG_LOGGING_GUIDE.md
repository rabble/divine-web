# Video Loading Performance Debug Guide

## Overview
Comprehensive logging has been added to track video loading performance and identify bottlenecks in the Divine Web application.

## Performance Metrics Display
A yellow performance metrics box shows at the top of the video feed (toggle with "Show/Hide Debug Info" button):
- **Query Time**: Time from component mount to receiving relay data
- **Parse Time**: Time to parse and validate events (shown in console)
- **Total Events**: Raw events from relay
- **Valid Videos**: Successfully parsed videos
- **Render Start**: Time to first render
- **First Video**: Time until first video loads

## Key Console Logs

### 1. VideoFeedWithLogging Component
```
[VideoFeed] Component mounted
[VideoFeed] First videos received after Xms
[VideoFeed] Set X initial videos in Xms
[VideoFeed] First video loaded after Xms
[VideoFeed] Rendering X videos
```

### 2. useVideoEventsWithLogging Hook
```
[VideoEvents] ========== Starting query for {feedType} feed ==========
[VideoEvents] Options: {feedType, hashtag, pubkey, limit, until}
[VideoEvents] Querying relay with filter: {...}
[VideoEvents] Relay returned X events in Xms
[VideoEvents] Parsing X events
[VideoEvents] Found X videos, X reposts
[VideoEvents] Parsed X valid videos, X invalid
[VideoEvents] Total parsing time: Xms
[VideoEvents] ========== Query complete ==========
[VideoEvents] Total time: Xms
[VideoEvents] Final count: X videos
[VideoEvents] Video URLs: [...]
```

### 3. VideoPlayer Component (Enhanced)
```
[VideoPlayer {id}] Load started at Xms
[VideoPlayer {id}] Data loaded after Xms
[VideoPlayer {id}] Video URL: https://...
[VideoPlayer {id}] Video dimensions: WxH
[VideoPlayer {id}] Video duration: Xs
[VideoPlayer {id}] Component mounting/unmounting
[VideoPlayer {id}] Play/Pause events
[VideoPlayer {id}] Error loading video
```

### 4. VideoPlaybackContext
```
Registering video: {id}
Unregistering video: {id}
setActiveVideo called with: {id}
Playing new video: {id}, element exists: {bool}
Failed to play video {id}: {error}
```

## Performance Analysis Guide

### Step 1: Enable Logging
1. Open browser DevTools (F12)
2. Go to Console tab
3. Click "Show Debug Info" button on the page
4. Refresh the page to see full load cycle

### Step 2: Identify Bottlenecks

#### Relay Performance Issues
Look for these patterns:
```
[VideoEvents] Relay returned X events in >2000ms
```
**Solution**: Try different relay using relay selector

#### Parsing Performance Issues
```
[VideoEvents] Total parsing time: >500ms
```
**Solution**: Check for invalid events or complex parsing logic

#### Video Loading Issues
```
[VideoPlayer {id}] Data loaded after >3000ms
```
**Solution**: Check video hosting, file sizes, CDN availability

### Step 3: Network Analysis
1. Open Network tab in DevTools
2. Filter by "Media" or ".mp4"
3. Check for:
   - Response times (should be <2s)
   - File sizes (6-second videos should be <5MB)
   - Failed requests (status 4xx/5xx)
   - CORS errors

## Performance Benchmarks

### Good Performance
- **Relay response**: <1500ms
- **Event parsing**: <200ms for 20 videos  
- **First video visible**: <2000ms from mount
- **Individual video load**: <2000ms
- **Total feed load**: <3000ms

### Poor Performance
- **Relay response**: >3000ms → Try different relay
- **Event parsing**: >1000ms → Check for data issues
- **First video visible**: >5000ms → Network/hosting issue
- **Individual video load**: >5000ms → File too large or slow host

## Common Issues and Solutions

### Issue: Videos Load Sequentially
**Symptoms**: Videos appear one by one slowly
**Debug**: Check if multiple `[VideoPlayer]` load logs happen sequentially
**Solution**: Browser may be limiting parallel connections

### Issue: Large Video Files
**Symptoms**: Individual videos take >5s to load
**Debug**: Check `[VideoPlayer {id}] Video dimensions` - should be ≤1080p
**Solution**: Videos need optimization/compression

### Issue: CORS Errors
**Symptoms**: Videos fail with errors in console
**Debug**: Look for CORS errors in Network tab
**Solution**: Video host needs proper CORS headers

### Issue: Relay Timeout
**Symptoms**: No videos load, timeout errors
**Debug**: `[VideoEvents] Query failed after Xms`
**Solution**: Switch to faster relay

## Data Collection for Bug Reports

When reporting performance issues, collect:

1. **Console Logs**:
   - Clear console (Ctrl+L)
   - Refresh page
   - Wait for videos to load
   - Copy all `[Video*]` logs

2. **Performance Metrics**:
   - Screenshot the yellow metrics box
   - Note all timing values

3. **Environment**:
   - Browser and version
   - Network speed (fast.com)
   - Current relay URL
   - Time of day/timezone

4. **Network Data**:
   - HAR file export from Network tab
   - Screenshots of failed requests

## Optimization Opportunities

Based on debug data, consider:

### Client-Side
- **Preloading**: Add `preload="metadata"` for upcoming videos
- **Lazy Loading**: Only load videos in viewport
- **Connection Pooling**: Reuse connections for same-host videos

### Server-Side  
- **CDN**: Use CDN for global distribution
- **Compression**: Ensure proper video encoding (H.264, <2Mbps)
- **Caching**: Set proper cache headers
- **CORS**: Configure CORS for cross-origin playback

### Relay-Side
- **Relay Selection**: Choose geographically closer relays
- **Query Optimization**: Reduce query complexity
- **Pagination**: Smaller page sizes for faster initial load

## Removing Debug Features

For production deployment:
1. Set `showDebug` default to `false` in VideoFeedWithLogging
2. Remove console.log statements (search for `console.log`)
3. Remove VideoDebugInfo component from Index.tsx
4. Consider keeping metrics collection for monitoring
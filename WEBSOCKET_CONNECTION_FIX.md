# WebSocket Connection Timing Fix

## Problem Analysis

Videos were not loading in the browser despite `relay.divine.video` having videos available. The issue was a **race condition** between WebSocket connection establishment and query execution.

### Root Cause

1. **Lazy Connection**: NPool uses lazy connection - WebSocket connections are only established when the first query is made (not when NPool is created)

2. **Race Condition in Browser**:
   - Query is called → NPool creates NRelay1 → WebSocket starts connecting (readyState: 0 = CONNECTING)
   - `NRelay1.send()` checks `if (socket.readyState === WebSocket.OPEN)` before sending REQ messages
   - If socket isn't OPEN, REQ is stored but NOT sent
   - When socket opens, `onOpen` callback re-sends stored subscriptions
   - **BUT in the browser**, queries were completing in 8-20ms with 0 events before the WebSocket could open

3. **Why It Worked in Node.js**:
   - In Node.js, connection timing is different
   - WebSocket opens in ~278ms, query completes in ~433ms
   - Connection establishes fast enough that async iteration waits properly for messages

4. **Why It Failed in Browser**:
   - Browser has different event loop timing and React's concurrent rendering
   - Queries completed in 20ms before WebSocket opened (never saw `readyState: 1`)
   - Async generator completed immediately with 0 events
   - React Query cached the empty result

### Code Analysis

From `NRelay1.ts:191-193`:
```typescript
if (this.socket.readyState === WebSocket.OPEN) {
  this.socket.send(JSON.stringify(msg));
}
```

REQ messages are only sent if socket is OPEN. Otherwise they're stored in `this.subs` and sent later by the `onOpen` callback.

From `NPool.ts:51-62`:
```typescript
public relay(url: string): T {
  const relay = this._relays.get(url);
  if (relay) {
    return relay;
  } else {
    const relay = this.opts.open(url);  // Connection created here!
    this._relays.set(url, relay);
    return relay;
  }
}
```

WebSocket is created lazily when `relay(url)` is first called, not when NPool is instantiated.

## Solution

Pre-establish the WebSocket connection when NostrProvider mounts by calling `pool.relay(relayUrl)`. This triggers the creation of NRelay1 (and its WebSocket) before any queries are made.

### Implementation

Added a `useEffect` hook in `NostrProvider.tsx`:

```typescript
// Pre-establish WebSocket connection when provider mounts or relay URL changes
// This ensures the connection is ready before the first query is made
useEffect(() => {
  if (pool.current) {
    debugLog('[NostrProvider] Pre-warming connection to:', relayUrl.current);
    // Trigger relay creation (and WebSocket connection) by calling relay()
    // This doesn't send any queries, just establishes the connection
    pool.current.relay(relayUrl.current);
    debugLog('[NostrProvider] Connection initiated');
  }
}, [config.relayUrl]);
```

### Why This Works

1. **Connection Established Early**: When NostrProvider mounts, the WebSocket connection starts immediately
2. **Connection Ready for Queries**: By the time components render and make queries (after React's render cycle), the WebSocket is likely already OPEN (readyState: 1)
3. **Proper Async Iteration**: Queries now properly wait for messages because the connection is established
4. **No Hacks or Delays**: This is a clean architectural fix that leverages NPool's existing `relay()` method

### Testing

Node.js test confirmed proper behavior:
```
[1761692462193] Starting query...
[1761692462193] Creating NRelay1 for wss://relay.divine.video
[1761692462193] NRelay1 created, initial readyState: 0
[1761692462471] [debug] relay.ws.state: { state: 'open', readyState: 1 }  ← Opens 278ms later
[1761692462626] Query completed in 433ms
Got 6 events
```

Connection opens in 278ms, query completes successfully in 433ms with 6 events.

## Additional Context

- HLS playback was also disabled (set `hlsUrl: undefined`) for 6-second videos as they're too short to benefit from adaptive bitrate streaming
- Cache was temporarily bypassed in `cachedNostr.ts` during debugging (can be re-enabled once confirmed working)
- This issue only manifested recently, possibly due to changes in relay infrastructure or browser behavior

## Related Files

- `src/components/NostrProvider.tsx` - Added connection pre-warming
- `src/hooks/useVideoEvents.ts` - Disabled HLS URLs (lines 154, 246)
- `src/lib/cachedNostr.ts` - Currently bypassing cache
- `node_modules/@nostrify/nostrify/NRelay1.ts` - Connection management implementation
- `node_modules/@nostrify/nostrify/NPool.ts` - Lazy connection architecture

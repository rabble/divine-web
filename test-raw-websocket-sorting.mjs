// Raw WebSocket test - bypasses all libraries to test relay sorting directly
import WebSocket from 'ws';

console.log('=== RAW WEBSOCKET TEST: Direct Relay Sorting ===\n');

const ws = new WebSocket('wss://relay.divine.video');
const subId = 'test-' + Math.random().toString(36).substr(2, 9);
const events = [];

ws.on('open', () => {
  console.log('✅ WebSocket connected\n');

  // Send REQ with sort parameter - NO library filtering!
  const req = [
    'REQ',
    subId,
    {
      kinds: [34236],
      limit: 10,
      sort: { field: 'loop_count', dir: 'desc' }
    }
  ];

  console.log('Sending RAW REQ:', JSON.stringify(req, null, 2));
  ws.send(JSON.stringify(req));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());

  if (message[0] === 'EVENT' && message[1] === subId) {
    events.push(message[2]);
  }

  if (message[0] === 'EOSE' && message[1] === subId) {
    console.log(`\n✅ Got ${events.length} events\n`);

    // Extract loop counts
    const results = events.map((e, i) => {
      const loopTag = e.tags.find(t => t[0] === 'loop_count' || t[0] === 'loops');
      const loopCount = loopTag ? parseInt(loopTag[1]) : 0;
      return { index: i + 1, loopCount };
    });

    console.log('Results order:');
    results.forEach(r => {
      console.log(`   ${r.index}. ${r.loopCount.toLocaleString()} loops`);
    });

    // Verify sorting
    console.log('\n📊 Test Result:');
    const isSorted = results.every((item, i) => {
      if (i === 0) return true;
      return item.loopCount <= results[i - 1].loopCount;
    });

    if (isSorted) {
      console.log('   ✅ PASS - Results ARE sorted by loop count descending');
      console.log('   🎉 RELAY SORTING WORKS!');
    } else {
      console.log('   ❌ FAIL - Results are NOT sorted');
      console.log('   Relay does not support sorting');
    }

    ws.close();
    process.exit(isSorted ? 0 : 1);
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('❌ Timeout - no EOSE received');
  ws.close();
  process.exit(1);
}, 10000);

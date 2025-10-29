import { NPool, NRelay1 } from '@nostrify/nostrify';

console.log('=== TESTING SORT PARAMETER THROUGH NPOOL ===\n');

// Create NPool with same config as app
const pool = new NPool({
  open(url) {
    return new NRelay1(url, { idleTimeout: false });
  },
  reqRouter(filters) {
    // Route to relay.divine.video
    return new Map([['wss://relay.divine.video', filters]]);
  },
  eventRouter() {
    return ['wss://relay.divine.video'];
  },
});

try {
  console.log('1. Testing sort via NPool (like the app does)...');
  const events = await pool.query([{
    kinds: [34236],
    sort: { field: 'loop_count', dir: 'desc' },
    limit: 5
  }], { signal: AbortSignal.timeout(5000) });

  console.log(`✅ Got ${events.length} events via NPool`);
  events.forEach((e, i) => {
    const loopTag = e.tags.find(t => t[0] === 'loop_count');
    const d = e.tags.find(t => t[0] === 'd')?.[1]?.slice(0, 16);
    console.log(`   ${i + 1}. ${d}... - loop_count: ${loopTag?.[1] || 'none'}`);
  });

  console.log('\n2. Checking if sort parameter is preserved...');
  // The issue might be that NPool strips unknown filter properties
  console.log('   Filter passed to pool.query:', JSON.stringify({
    kinds: [34236],
    sort: { field: 'loop_count', dir: 'desc' },
    limit: 5
  }, null, 2));

} catch (error) {
  console.error('❌ Error:', error.message);
}

pool.close();

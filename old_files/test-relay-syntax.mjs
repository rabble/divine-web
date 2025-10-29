import { NRelay1 } from '@nostrify/nostrify';

console.log('=== TESTING RELAY PARAMETER SYNTAX ===\n');

const relay = new NRelay1('wss://relay.divine.video', { idleTimeout: false });

try {
  // First confirm relay has data
  console.log('1. Baseline query (no custom params)...');
  const baseline = await relay.query([{
    kinds: [34236],
    limit: 3
  }], { signal: AbortSignal.timeout(5000) });
  console.log(`✅ Got ${baseline.length} events`);
  if (baseline.length > 0) {
    const loopTag = baseline[0].tags.find(t => t[0] === 'loop_count');
    console.log(`   First event loop_count: ${loopTag?.[1] || 'none'}`);
  }

  // Test different sort syntax options
  console.log('\n2. Testing with REQ-level sorting (may not work via NRelay1)...');

  // The docs might be describing HTTP API or raw WebSocket REQ syntax
  // Let's check the actual WebSocket messages being sent

  console.log('\n3. Testing plain object with sort field...');
  const test1 = await relay.query([{
    kinds: [34236],
    limit: 3,
    sort: ['loop_count', 'desc']
  }], { signal: AbortSignal.timeout(5000) });
  console.log(`   Result: ${test1.length} events`);

  console.log('\n4. Testing with stringified sort...');
  const test2 = await relay.query([{
    kinds: [34236],
    limit: 3,
    sort: 'loop_count:desc'
  }], { signal: AbortSignal.timeout(5000) });
  console.log(`   Result: ${test2.length} events`);

} catch (error) {
  console.error('❌ Error:', error.message);
}

relay.close();

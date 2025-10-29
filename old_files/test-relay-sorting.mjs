import { NRelay1 } from '@nostrify/nostrify';

console.log('=== TESTING RELAY.DIVINE.VIDEO CUSTOM SORTING ===\n');

const relay = new NRelay1('wss://relay.divine.video', { idleTimeout: false });

try {
  console.log('1. Testing sort by loop_count (descending)...');
  const loopSorted = await relay.query([{
    kinds: [34236],
    limit: 5,
    sort: 'loop_count',
    direction: 'desc'
  }], { signal: AbortSignal.timeout(5000) });

  console.log(`✅ Got ${loopSorted.length} events sorted by loop_count`);
  loopSorted.forEach((e, i) => {
    const loopTag = e.tags.find(t => t[0] === 'loop_count');
    console.log(`   ${i + 1}. Loop count: ${loopTag?.[1] || 'none'}`);
  });

  console.log('\n2. Testing sort by created_at (descending)...');
  const timeSorted = await relay.query([{
    kinds: [34236],
    limit: 5,
    sort: 'created_at',
    direction: 'desc'
  }], { signal: AbortSignal.timeout(5000) });

  console.log(`✅ Got ${timeSorted.length} events sorted by time`);
  timeSorted.forEach((e, i) => {
    const date = new Date(e.created_at * 1000);
    console.log(`   ${i + 1}. Created: ${date.toISOString()}`);
  });

  console.log('\n3. Testing hashtag filter with sorting...');
  const hashtagSorted = await relay.query([{
    kinds: [34236],
    '#t': ['vine'],
    limit: 5,
    sort: 'loop_count',
    direction: 'desc'
  }], { signal: AbortSignal.timeout(5000) });

  console.log(`✅ Got ${hashtagSorted.length} #vine events sorted by loop_count`);

  console.log('\n4. Testing integer range filter (loop_count >= 100)...');
  const filtered = await relay.query([{
    kinds: [34236],
    'int#loop_count': { gte: 100 },
    limit: 5,
    sort: 'loop_count',
    direction: 'desc'
  }], { signal: AbortSignal.timeout(5000) });

  console.log(`✅ Got ${filtered.length} events with loop_count >= 100`);

} catch (error) {
  console.error('❌ Error:', error.message);
}

relay.close();

import { NRelay1 } from '@nostrify/nostrify';

console.log('=== TESTING CORRECT DIVINE RELAY SYNTAX ===\n');

const relay = new NRelay1('wss://relay.divine.video', { idleTimeout: false });

try {
  console.log('1. Sort by loop_count (descending)...');
  const loopSorted = await relay.query([{
    kinds: [34236],
    sort: { field: 'loop_count', dir: 'desc' },
    limit: 5
  }], { signal: AbortSignal.timeout(5000) });

  console.log(`✅ Got ${loopSorted.length} events sorted by loop_count`);
  loopSorted.forEach((e, i) => {
    const loopTag = e.tags.find(t => t[0] === 'loop_count');
    const d = e.tags.find(t => t[0] === 'd')?.[1]?.slice(0, 16);
    console.log(`   ${i + 1}. ${d}... - loop_count: ${loopTag?.[1] || 'none'}`);
  });

  console.log('\n2. Sort by created_at (newest first)...');
  const timeSorted = await relay.query([{
    kinds: [34236],
    sort: { field: 'created_at', dir: 'desc' },
    limit: 5
  }], { signal: AbortSignal.timeout(5000) });

  console.log(`✅ Got ${timeSorted.length} events sorted by time`);
  timeSorted.forEach((e, i) => {
    const date = new Date(e.created_at * 1000);
    console.log(`   ${i + 1}. ${date.toISOString()}`);
  });

  console.log('\n3. Filter by hashtag #vine, sorted by loop_count...');
  const hashtagSorted = await relay.query([{
    kinds: [34236],
    '#t': ['vine'],
    sort: { field: 'loop_count', dir: 'desc' },
    limit: 5
  }], { signal: AbortSignal.timeout(5000) });

  console.log(`✅ Got ${hashtagSorted.length} #vine events`);

  console.log('\n4. Filter by minimum likes (int#likes >= 10)...');
  const likeFiltered = await relay.query([{
    kinds: [34236],
    'int#likes': { gte: 10 },
    sort: { field: 'likes', dir: 'desc' },
    limit: 5
  }], { signal: AbortSignal.timeout(5000) });

  console.log(`✅ Got ${likeFiltered.length} events with >= 10 likes`);

} catch (error) {
  console.error('❌ Error:', error.message);
}

relay.close();

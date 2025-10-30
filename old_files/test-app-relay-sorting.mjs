import { NRelay1 } from '@nostrify/nostrify';

console.log('=== TESTING APP RELAY SORTING ===\n');
console.log('This mimics what the divine-web app will do with relay-native sorting.\n');

const relay = new NRelay1('wss://relay.divine.video', { idleTimeout: false });

try {
  // This is the filter the app now uses for trending/hashtag/home/discovery feeds
  const filter = {
    kinds: [34236],
    sort: { field: 'loop_count', dir: 'desc' },
    limit: 10
  };

  console.log('Query filter:', JSON.stringify(filter, null, 2));
  console.log('\nQuerying relay...\n');

  const events = await relay.query([filter], { signal: AbortSignal.timeout(5000) });

  console.log(`✅ Got ${events.length} events from relay\n`);

  // Parse loop counts (without any client-side re-sorting)
  const results = events.map((e, i) => {
    const loopTag = e.tags.find(t => t[0] === 'loop_count' || t[0] === 'loops');
    const loopCount = loopTag ? parseInt(loopTag[1]) : 0;
    const d = e.tags.find(t => t[0] === 'd')?.[1]?.slice(0, 12);
    return { index: i + 1, d, loopCount };
  });

  console.log('Results as received from relay (should be sorted):');
  results.forEach(r => {
    console.log(`   ${r.index}. ${r.d} - ${r.loopCount.toLocaleString()} loops`);
  });

  // Verify sorting
  console.log('\n📊 Verification:');
  const isSorted = results.every((item, i) => {
    if (i === 0) return true;
    return item.loopCount <= results[i - 1].loopCount;
  });

  if (isSorted) {
    console.log('   ✅ CORRECTLY SORTED - Relay is sorting by loop count descending');
  } else {
    console.log('   ❌ NOT SORTED - Relay returned unsorted results');
  }

  const max = results[0]?.loopCount || 0;
  const min = results[results.length - 1]?.loopCount || 0;
  console.log(`   Range: ${max.toLocaleString()} loops (highest) → ${min.toLocaleString()} loops (lowest)`);

} catch (error) {
  console.error('❌ Error:', error.message);
}

relay.close();

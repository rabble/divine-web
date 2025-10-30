import { NRelay1 } from '@nostrify/nostrify';

console.log('=== VERIFYING CLIENT-SIDE SORTING ===\n');

const relay = new NRelay1('wss://relay.divine.video', { idleTimeout: false });

try {
  // Get events WITHOUT sort parameter (like the app does now)
  const events = await relay.query([{
    kinds: [34236],
    limit: 20
  }], { signal: AbortSignal.timeout(5000) });

  console.log(`✅ Got ${events.length} events from relay (unsorted)\n`);

  // Parse loop counts from tags (like our app does)
  const parsed = events.map(e => {
    const loopTag = e.tags.find(t => t[0] === 'loop_count' || t[0] === 'loops');
    const loopCount = loopTag ? parseInt(loopTag[1]) : 0;
    const d = e.tags.find(t => t[0] === 'd')?.[1]?.slice(0, 12);
    return { d, loopCount, created_at: e.created_at };
  });

  // Sort by loop count descending (like our app does)
  parsed.sort((a, b) => {
    const loopDiff = b.loopCount - a.loopCount;
    if (loopDiff !== 0) return loopDiff;
    return b.created_at - a.created_at;
  });

  console.log('Client-side sorted results (top 10 by loop count):');
  parsed.slice(0, 10).forEach((item, i) => {
    console.log(`   ${i + 1}. ${item.d} - ${item.loopCount.toLocaleString()} loops`);
  });

  // Verify sorting is correct
  console.log('\n📊 Verification:');
  const isSorted = parsed.every((item, i) => {
    if (i === 0) return true;
    return item.loopCount <= parsed[i - 1].loopCount;
  });

  if (isSorted) {
    console.log('   ✅ CORRECTLY SORTED - Loop counts are in descending order');
  } else {
    console.log('   ❌ NOT SORTED - Loop counts are NOT in descending order');
  }

  // Show the range
  const max = parsed[0]?.loopCount || 0;
  const min = parsed[parsed.length - 1]?.loopCount || 0;
  console.log(`   Range: ${max.toLocaleString()} loops (highest) → ${min.toLocaleString()} loops (lowest)`);

} catch (error) {
  console.error('❌ Error:', error.message);
}

relay.close();

// TDD Test: Verify monkeypatch allows NRelay1 to use relay-native sorting
import { NRelay1 } from '@nostrify/nostrify';
import { patchNostrifyForCustomParams } from './src/lib/nostrifyPatch.ts';

console.log('=== TDD TEST: Monkeypatched NRelay1 with Sort Support ===\n');

// Apply the monkeypatch BEFORE creating any NRelay1 instances
patchNostrifyForCustomParams();

const relay = new NRelay1('wss://relay.divine.video', { idleTimeout: false });

try {
  console.log('Test: Query with sort parameter should return sorted results\n');

  const filter = {
    kinds: [34236],
    sort: { field: 'loop_count', dir: 'desc' },
    limit: 10
  };

  console.log('Sending filter:', JSON.stringify(filter, null, 2));

  const events = await relay.query([filter], { signal: AbortSignal.timeout(5000) });

  console.log(`\nReceived ${events.length} events\n`);

  // Parse loop counts
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
    console.log('   ✅ PASS - Results are sorted by loop count descending');
    console.log('   The monkeypatch preserved the sort parameter!');
    console.log('   Relay-native sorting is working!');
    process.exit(0);
  } else {
    console.log('   ❌ FAIL - Results are NOT sorted');
    console.log('   The monkeypatch did not work as expected');
    console.log(`   Expected: Descending order`);
    console.log(`   Got: ${results[0].loopCount} → ... → ${results[results.length - 1].loopCount}`);
    process.exit(1);
  }

} catch (error) {
  console.error('❌ ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
} finally {
  relay.close();
}

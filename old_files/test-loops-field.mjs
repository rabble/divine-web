import { NRelay1 } from '@nostrify/nostrify';

console.log('=== TESTING DIFFERENT SORT FIELD NAMES ===\n');

const relay = new NRelay1('wss://relay.divine.video', { idleTimeout: false });

try {
  console.log('1. Sorting by "loop_count" field...');
  const loopCount = await relay.query([{
    kinds: [34236],
    sort: { field: 'loop_count', dir: 'desc' },
    limit: 5
  }], { signal: AbortSignal.timeout(5000) });

  console.log(`✅ Got ${loopCount.length} events`);
  loopCount.forEach((e, i) => {
    const loops = e.tags.find(t => t[0] === 'loops')?.[1];
    const d = e.tags.find(t => t[0] === 'd')?.[1]?.slice(0, 10);
    console.log(`   ${i + 1}. ${d} - loops: ${loops || 'none'}`);
  });

  console.log('\n2. Sorting by "loops" field...');
  const loops = await relay.query([{
    kinds: [34236],
    sort: { field: 'loops', dir: 'desc' },
    limit: 5
  }], { signal: AbortSignal.timeout(5000) });

  console.log(`✅ Got ${loops.length} events`);
  loops.forEach((e, i) => {
    const loopVal = e.tags.find(t => t[0] === 'loops')?.[1];
    const d = e.tags.find(t => t[0] === 'd')?.[1]?.slice(0, 10);
    console.log(`   ${i + 1}. ${d} - loops: ${loopVal || 'none'}`);
  });

  console.log('\n3. Checking if sorted correctly (should be descending by loops)...');
  const loopsValues = loops.map(e => parseInt(e.tags.find(t => t[0] === 'loops')?.[1] || '0'));
  const isSorted = loopsValues.every((val, i) => i === 0 || val <= loopsValues[i - 1]);
  console.log(`   Loop values: ${loopsValues.join(', ')}`);
  console.log(`   Is sorted descending? ${isSorted ? '✅ YES' : '❌ NO'}`);

} catch (error) {
  console.error('❌ Error:', error.message);
}

relay.close();

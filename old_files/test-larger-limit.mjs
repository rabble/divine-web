import { NRelay1 } from '@nostrify/nostrify';

const relay = new NRelay1('wss://relay.divine.video', { idleTimeout: false });

console.log('Testing with larger limit (200) to find high-loop videos...\n');

try {
  const events = await relay.query([
    { kinds: [34236], limit: 200 }
  ], { signal: AbortSignal.timeout(10000) });

  console.log(`✅ Fetched ${events.length} events`);
  
  // Extract loop counts
  const loopCounts = events.map(e => {
    const loopTag = e.tags.find(t => t[0] === 'loop_count');
    return loopTag ? parseInt(loopTag[1]) : 0;
  }).sort((a, b) => b - a);

  console.log('\nLoop count distribution:');
  console.log('  Top 10:', loopCounts.slice(0, 10));
  console.log('  Highest:', Math.max(...loopCounts).toLocaleString());
  console.log('  Videos with >10k loops:', loopCounts.filter(c => c > 10000).length);
  console.log('  Videos with >100k loops:', loopCounts.filter(c => c > 100000).length);
  console.log('  Videos with >1M loops:', loopCounts.filter(c => c > 1000000).length);

} catch (error) {
  console.error('Error:', error.message);
}

relay.close();

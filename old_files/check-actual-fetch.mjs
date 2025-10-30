import { NRelay1 } from '@nostrify/nostrify';

const relay = new NRelay1('wss://relay.divine.video', { idleTimeout: false });

console.log('Checking what videos are actually being fetched with app settings...\n');

try {
  // Simulate app query - limit 30 like the app does
  const events = await relay.query([
    { kinds: [34236], limit: 30 }
  ], { signal: AbortSignal.timeout(5000) });

  console.log(`Got ${events.length} events\n`);
  
  // Extract loop counts
  const loopCounts = events.map(e => {
    const loopTag = e.tags.find(t => t[0] === 'loop_count');
    return loopTag ? parseInt(loopTag[1]) : 0;
  }).sort((a, b) => b - a);

  console.log('Loop counts in fetched videos:');
  console.log('Top 10:', loopCounts.slice(0, 10));
  console.log('Highest:', Math.max(...loopCounts));
  console.log('Lowest:', Math.min(...loopCounts));
  console.log('Average:', Math.round(loopCounts.reduce((a, b) => a + b, 0) / loopCounts.length));

} catch (error) {
  console.error('Error:', error.message);
}

relay.close();

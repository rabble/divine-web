import { NRelay1 } from '@nostrify/nostrify';

const relay = new NRelay1('wss://relay.divine.video');

console.log('📤 Querying for ANY video (kind 34236)...');

try {
  const events = await relay.query([{
    kinds: [34236],
    limit: 5
  }]);
  console.log(`📦 Got ${events.length} videos`);
  if (events.length > 0) {
    console.log('✅ Sample video IDs:');
    events.forEach((e, i) => {
      const dTag = e.tags.find(t => t[0] === 'd')?.[1] || 'none';
      console.log(`   ${i+1}. ${e.id.substring(0, 16)}... (d: ${dTag})`);
    });
  } else {
    console.log('❌ No videos found in relay');
  }
} catch (err) {
  console.error('❌ Error:', err.message);
}

relay.close();

import { NRelay1 } from '@nostrify/nostrify';

const relay = new NRelay1('wss://relay3.openvine.co');

// Test querying by ID
const videoId = '452334c45fe0e9f5f3eaa7541cfd7b6f8b5332b24466164d7d23eb1a89a59b06';
const filter = {
  kinds: [34236],
  ids: [videoId],
  limit: 1
};

console.log('📤 Querying relay for video ID:', videoId.substring(0, 16) + '...');

try {
  const events = await relay.query([filter]);
  console.log(`📦 Got ${events.length} events`);
  if (events.length > 0) {
    console.log('✅ Event found!');
    console.log('   ID:', events[0].id.substring(0, 16) + '...');
    console.log('   Kind:', events[0].kind);
    console.log('   D tag:', events[0].tags.find(t => t[0] === 'd')?.[1]);
  } else {
    console.log('❌ No events returned - video might not exist in relay');
  }
} catch (err) {
  console.error('❌ Query error:', err.message);
}

relay.close();

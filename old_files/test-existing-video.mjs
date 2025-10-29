import { NRelay1 } from '@nostrify/nostrify';

const relay = new NRelay1('wss://relay.divine.video');

// Use a video ID we KNOW exists
const videoId = '6bd77a06b1005407f9762365d6dadf180c92a87cabc656fe8a19502929cfe5bd';

console.log('📤 Testing with video ID that exists:', videoId.substring(0, 16) + '...');

const filter = {
  kinds: [34236],
  ids: [videoId],
  limit: 1
};

try {
  const events = await relay.query([filter]);
  console.log(`📦 Got ${events.length} events`);
  if (events.length > 0) {
    console.log('✅ Video found!');
    console.log('   Event ID:', events[0].id);
    console.log('   D tag:', events[0].tags.find(t => t[0] === 'd')?.[1]);
    console.log('\n🌐 Test this URL in the browser:');
    console.log('   https://divine.video/video/' + events[0].id);
  }
} catch (err) {
  console.error('❌ Error:', err.message);
}

relay.close();

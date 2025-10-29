import { NRelay1 } from '@nostrify/nostrify';

const relay = new NRelay1('wss://relay.divine.video');

// Test querying by d tag instead of id
const dTag = '452334c45fe0e9f5f3eaa7541cfd7b6f8b5332b24466164d7d23eb1a89a59b06';

console.log('📤 Querying by d tag:', dTag.substring(0, 16) + '...');

const filter = {
  kinds: [34236],
  '#d': [dTag],
  limit: 1
};

console.log('Filter:', filter);

try {
  const events = await relay.query([filter]);
  console.log(`📦 Got ${events.length} events`);
  if (events.length > 0) {
    console.log('✅ Event found!');
    console.log('   Event ID:', events[0].id.substring(0, 16) + '...');
    console.log('   Author:', events[0].pubkey.substring(0, 16) + '...');
    console.log('   D tag:', events[0].tags.find(t => t[0] === 'd')?.[1]);
    console.log('   Content preview:', events[0].content.substring(0, 50));
  } else {
    console.log('❌ No events found with that d tag');
  }
} catch (err) {
  console.error('❌ Error:', err.message);
}

relay.close();

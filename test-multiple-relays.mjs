import { NRelay1 } from '@nostrify/nostrify';

const videoId = '452334c45fe0e9f5f3eaa7541cfd7b6f8b5332b24466164d7d23eb1a89a59b06';

const relays = [
  'wss://relay3.openvine.co',
  'wss://relay.openvine.com',
  'wss://relay1.openvine.co',
  'wss://relay2.openvine.co',
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
];

console.log(`🔍 Searching for video across ${relays.length} relays...\n`);

for (const relayUrl of relays) {
  console.log(`📡 Trying ${relayUrl}...`);

  try {
    const relay = new NRelay1(relayUrl);

    // Try both: by ID and by d tag
    const byId = await relay.query([{
      kinds: [34236],
      ids: [videoId],
      limit: 1
    }]);

    const byDTag = await relay.query([{
      kinds: [34236],
      '#d': [videoId],
      limit: 1
    }]);

    if (byId.length > 0) {
      console.log(`   ✅ FOUND by ID!`);
      console.log(`      Event ID: ${byId[0].id.substring(0, 16)}...`);
      console.log(`      D tag: ${byId[0].tags.find(t => t[0] === 'd')?.[1] || 'none'}\n`);
      relay.close();
      break;
    } else if (byDTag.length > 0) {
      console.log(`   ✅ FOUND by D TAG!`);
      console.log(`      Event ID: ${byDTag[0].id.substring(0, 16)}...`);
      console.log(`      D tag: ${byDTag[0].tags.find(t => t[0] === 'd')?.[1] || 'none'}\n`);
      relay.close();
      break;
    } else {
      console.log(`   ❌ Not found`);
    }

    relay.close();
  } catch (err) {
    console.log(`   ⚠️  Error: ${err.message}`);
  }
}

console.log('\n🏁 Search complete');

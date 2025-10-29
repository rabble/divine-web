import { NRelay1 } from '@nostrify/nostrify';

const relay = new NRelay1('wss://relay.divine.video');

const searchValue = '452334c45fe0e9f5f3eaa7541cfd7b6f8b5332b24466164d7d23eb1a89a59b06';

console.log('📤 Fetching all recent videos to check their tags...\n');

try {
  const events = await relay.query([{
    kinds: [34236],
    limit: 100
  }]);

  console.log(`📦 Got ${events.length} videos, searching for ID in tags...\n`);

  let found = false;

  for (const event of events) {
    // Check all tags for the search value
    for (const tag of event.tags) {
      if (tag.includes(searchValue)) {
        found = true;
        console.log('✅ FOUND! Video contains this ID in tags:');
        console.log('   Event ID:', event.id);
        console.log('   Tag that matched:', tag);
        console.log('   All tags:', JSON.stringify(event.tags, null, 2));
        console.log('   Content preview:', event.content.substring(0, 100));
        break;
      }
    }

    // Also check if it matches the event ID itself
    if (event.id === searchValue) {
      found = true;
      console.log('✅ FOUND! This IS the event ID:');
      console.log('   Event ID:', event.id);
      console.log('   D tag:', event.tags.find(t => t[0] === 'd')?.[1]);
      console.log('   All tags:', JSON.stringify(event.tags, null, 2));
    }

    if (found) break;
  }

  if (!found) {
    console.log('❌ Video ID not found in any tags of the 100 most recent videos');
    console.log('\nSample of what we DID find:');
    const sample = events[0];
    console.log('Event ID:', sample.id);
    console.log('D tag:', sample.tags.find(t => t[0] === 'd')?.[1]);
    console.log('All tags:', JSON.stringify(sample.tags, null, 2));
  }

} catch (err) {
  console.error('❌ Error:', err.message);
}

relay.close();

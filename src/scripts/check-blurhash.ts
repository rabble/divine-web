// Script to fetch video events and check for blurhash data
import { NRelay1 } from '@nostrify/nostrify';

async function fetchVideos() {
  const relay = new NRelay1('wss://relay.divine.video');
  
  try {
    await relay.connect();
    console.log('✅ Connected to relay.divine.video\n');
    
    // Fetch recent video events (kind 34236)
    const events = [];
    for await (const msg of relay.req([
      { kinds: [34236], limit: 20 }
    ])) {
      if (msg[0] === 'EVENT') {
        events.push(msg[2]);
      }
      if (msg[0] === 'EOSE') {
        break;
      }
    }
    
    console.log(`\n📊 Fetched ${events.length} video events\n`);
    console.log('='.repeat(80));
    
    // Analyze each event for blurhash
    let withBlurhash = 0;
    let withoutBlurhash = 0;
    const blurhashExamples: any[] = [];
    
    events.forEach((event: any, idx: number) => {
      console.log(`\n🎬 Video ${idx + 1}/${events.length}`);
      console.log(`ID: ${event.id}`);
      console.log(`Created: ${new Date(event.created_at * 1000).toISOString()}`);
      
      // Find blurhash in tags
      let hasBlurhash = false;
      let blurhashValue: string | null = null;
      
      // Check for blurhash in imeta tags
      const imetaTags = event.tags.filter((t: any) => t[0] === 'imeta');
      imetaTags.forEach((tag: any) => {
        tag.forEach((item: any) => {
          if (typeof item === 'string' && item.startsWith('blurhash ')) {
            blurhashValue = item.substring(9); // Remove 'blurhash ' prefix
            hasBlurhash = true;
          }
        });
      });
      
      // Check for standalone blurhash tag
      const blurhashTag = event.tags.find((t: any) => t[0] === 'blurhash');
      if (blurhashTag && blurhashTag[1]) {
        blurhashValue = blurhashTag[1];
        hasBlurhash = true;
      }
      
      if (hasBlurhash) {
        withBlurhash++;
        console.log(`✅ HAS BLURHASH: ${blurhashValue}`);
        if (blurhashExamples.length < 5) {
          blurhashExamples.push({ eventId: event.id, blurhash: blurhashValue });
        }
      } else {
        withoutBlurhash++;
        console.log(`❌ NO BLURHASH`);
      }
      
      // Show all tags for first 3 events
      if (idx < 3) {
        console.log('\nAll tags:');
        event.tags.forEach((tag: any) => {
          console.log(`  ${JSON.stringify(tag)}`);
        });
      }
      
      console.log('-'.repeat(80));
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n📈 SUMMARY:`);
    console.log(`   Total events: ${events.length}`);
    console.log(`   With blurhash: ${withBlurhash} (${((withBlurhash/events.length)*100).toFixed(1)}%)`);
    console.log(`   Without blurhash: ${withoutBlurhash} (${((withoutBlurhash/events.length)*100).toFixed(1)}%)`);
    
    if (blurhashExamples.length > 0) {
      console.log(`\n📝 Example blurhashes found:`);
      blurhashExamples.forEach((ex, i) => {
        console.log(`   ${i + 1}. ${ex.blurhash}`);
        console.log(`      Event: ${ex.eventId}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    relay.close();
  }
}

fetchVideos();

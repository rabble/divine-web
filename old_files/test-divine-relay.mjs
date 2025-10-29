import { NRelay1 } from '@nostrify/nostrify';

const relay = new NRelay1('wss://relay.divine.video', {
  idleTimeout: false,
  log: (log) => console.log(`[${log.level}] ${log.ns}:`, log),
});

console.log('Querying wss://relay.divine.video for kind 34236 events...\n');

try {
  const events = await relay.query([{ kinds: [34236], limit: 10 }], {
    signal: AbortSignal.timeout(5000)
  });

  console.log(`\n✅ Got ${events.length} events`);
  if (events.length > 0) {
    console.log('\nFirst event:');
    console.log('- ID:', events[0].id);
    console.log('- Kind:', events[0].kind);
    console.log('- Content:', events[0].content.substring(0, 100));
    console.log('- Tags:', events[0].tags.length);
  }
} catch (error) {
  console.error('\n❌ Error:', error.message);
}

relay.close();

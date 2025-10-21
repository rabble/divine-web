import { NRelay1 } from '@nostrify/nostrify';

console.log('Testing NRelay1 connection to wss://relay3.openvine.co\n');

const relay = new NRelay1('wss://relay3.openvine.co', {
  idleTimeout: false,
  log: (log) => {
    console.log(`[${log.level}] ${log.ns}:`, log);
  },
});

console.log('Created relay instance, sending query...\n');

try {
  const events = await relay.query([{ kinds: [34236], limit: 10 }], {
    signal: AbortSignal.timeout(10000),
  });

  console.log(`\n✅ Query succeeded! Got ${events.length} events`);
  if (events.length > 0) {
    console.log('First event:', events[0]);
  }
} catch (error) {
  console.error('\n❌ Query failed:', error.message);
  console.error('Full error:', error);
}

await relay.close();
console.log('\nRelay closed');
process.exit(0);

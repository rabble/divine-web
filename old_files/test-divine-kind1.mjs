import { NRelay1 } from '@nostrify/nostrify';

const relay = new NRelay1('wss://relay.divine.video', {
  idleTimeout: false,
  log: (log) => {
    if (log.ns === 'relay.ws.message') {
      console.log('📥 RECEIVED MESSAGE:', log.data);
    }
  },
});

console.log('Testing relay.divine.video with kind 1 (text notes)...\n');

try {
  const events = await relay.query([{ kinds: [1], limit: 5 }], {
    signal: AbortSignal.timeout(5000)
  });
  console.log(`✅ Got ${events.length} kind 1 events`);
} catch (error) {
  console.error(`❌ Timeout - relay not responding to queries`);
}

relay.close();

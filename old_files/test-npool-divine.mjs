import { NPool, NRelay1 } from '@nostrify/nostrify';

const pool = new NPool({
  open(url) {
    console.log(`Opening connection to: ${url}`);
    return new NRelay1(url, {
      idleTimeout: false,
      log: (log) => {
        if (log.ns === 'relay.ws.message') {
          console.log(`📥 ${url}: ${log.data[0]}`);
        }
      },
    });
  },
  reqRouter(filters) {
    console.log('reqRouter called with filters:', JSON.stringify(filters, null, 2));
    return new Map([['wss://relay.divine.video', filters]]);
  },
  eventRouter() {
    return ['wss://relay.divine.video'];
  },
});

console.log('Testing NPool with relay.divine.video...\n');

try {
  const events = await pool.query([{ kinds: [34236], limit: 20 }], {
    signal: AbortSignal.timeout(15000)
  });
  
  console.log(`\n✅ Got ${events.length} events`);
  if (events.length > 0) {
    console.log('First event ID:', events[0].id);
    console.log('First event content:', events[0].content.substring(0, 80));
  }
} catch (error) {
  console.error(`\n❌ Error: ${error.message}`);
}

pool.close();

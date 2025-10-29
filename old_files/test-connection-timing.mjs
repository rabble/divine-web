import { NRelay1, NPool } from '@nostrify/nostrify';

console.log('=== Testing NPool Connection Timing ===\n');

const pool = new NPool({
  open(url) {
    const timestamp = Date.now();
    console.log(`[${timestamp}] Creating NRelay1 for ${url}`);
    const relay = new NRelay1(url, {
      idleTimeout: false,
      log: (log) => {
        const logTime = Date.now();
        console.log(`[${logTime}] [${log.level}] ${log.ns}:`, {
          state: log.state,
          readyState: log.readyState
        });
      },
    });
    console.log(`[${timestamp}] NRelay1 created, initial readyState: ${relay.socket?.readyState}`);
    return relay;
  },
  reqRouter(filters) {
    return new Map([['wss://relay.divine.video', filters]]);
  },
  eventRouter() {
    return ['wss://relay.divine.video'];
  },
});

const startTime = Date.now();
console.log(`[${startTime}] Starting query...\n`);

try {
  const events = await pool.query([{ kinds: [34236], limit: 10 }], {
    signal: AbortSignal.timeout(5000)
  });

  const endTime = Date.now();
  console.log(`\n[${endTime}] Query completed in ${endTime - startTime}ms`);
  console.log(`Got ${events.length} events`);

  if (events.length > 0) {
    console.log('First event ID:', events[0].id);
  }
} catch (error) {
  const endTime = Date.now();
  console.log(`\n[${endTime}] Query failed after ${endTime - startTime}ms`);
  console.error('Error:', error.message);
}

pool.close();

import { NRelay1 } from '@nostrify/nostrify';

const relay = new NRelay1('wss://relay.divine.video', { idleTimeout: false });

console.log('Fetching specific event to inspect schema...\n');

try {
  const events = await relay.query([
    { ids: ['d4fe40a7ef37b06932b89c907fb7ba472c10bbf28997ebb2b93f6b3add40715d'] }
  ], { signal: AbortSignal.timeout(5000) });

  if (events.length > 0) {
    const event = events[0];
    console.log('Event structure:');
    console.log(JSON.stringify(event, null, 2));
  } else {
    console.log('No event found');
  }
} catch (error) {
  console.error('Error:', error.message);
}

relay.close();

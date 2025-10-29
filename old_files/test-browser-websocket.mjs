import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

console.log('=== Testing WebSocket Behavior in Browser ===\n');

// Collect all WebSocket activity
const wsActivity = [];

page.on('websocket', ws => {
  console.log(`\n🔌 WebSocket Created: ${ws.url()}`);

  ws.on('framesent', frame => {
    const msg = frame.payload;
    wsActivity.push({ type: 'SENT', msg, time: Date.now() });
    console.log(`📤 SENT (${msg.length} chars):`, msg.substring(0, 200));
  });

  ws.on('framereceived', frame => {
    const msg = frame.payload;
    wsActivity.push({ type: 'RECEIVED', msg, time: Date.now() });
    console.log(`📥 RECEIVED (${msg.length} chars):`, msg.substring(0, 200));
  });

  ws.on('close', () => {
    console.log(`❌ WebSocket CLOSED`);
  });
});

// Monitor console for query completion
const queryLogs = [];
page.on('console', msg => {
  const text = msg.text();
  if (text.includes('useVideoEvents') && text.includes('got')) {
    queryLogs.push({ text, time: Date.now() });
    console.log(`\n🔍 ${text}`);
  }
});

// Inject login and load page
await page.goto('http://localhost:8080/');
await page.evaluate(() => {
  const testPubkey = 'e2ccf7cf20403f3f2a4a55b328f0de3be38558a7d5f33632fdaaefc726c1c8eb';
  window.nostr = {
    async getPublicKey() { return testPubkey; },
    async signEvent(event) {
      return { ...event, pubkey: testPubkey, id: 'fake', sig: 'fake'.repeat(16) };
    },
  };
  localStorage.setItem('nostr:login', JSON.stringify([{
    id: testPubkey,
    pubkey: testPubkey,
    type: 'extension',
  }]));
});

await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(15000);

console.log('\n\n=== ANALYSIS ===');
console.log(`Total WebSocket messages sent: ${wsActivity.filter(a => a.type === 'SENT').length}`);
console.log(`Total WebSocket messages received: ${wsActivity.filter(a => a.type === 'RECEIVED').length}`);
console.log(`Total queries logged: ${queryLogs.length}`);

if (wsActivity.length > 0) {
  const firstSent = wsActivity.find(a => a.type === 'SENT');
  const firstReceived = wsActivity.find(a => a.type === 'RECEIVED');
  const firstQuery = queryLogs[0];

  if (firstSent && firstQuery) {
    console.log(`\nTime from first REQ to query completion: ${firstQuery.time - firstSent.time}ms`);
  }

  if (!firstReceived) {
    console.log('\n⚠️  NO EVENTS RECEIVED FROM WEBSOCKET!');
  }
}

await browser.close();

import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

console.log('Opening page and monitoring WebSocket connections...\n');

// Monitor WebSocket frames
page.on('websocket', ws => {
  console.log(`\n🔌 WebSocket: ${ws.url()}`);

  ws.on('framesent', frame => {
    console.log(`📤 SENT: ${frame.payload.substring(0, 200)}`);
  });

  ws.on('framereceived', frame => {
    console.log(`📥 RECEIVED: ${frame.payload.substring(0, 200)}`);
  });

  ws.on('close', () => {
    console.log(`❌ WebSocket CLOSED: ${ws.url()}`);
  });
});

// Inject login
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
await page.waitForTimeout(10000);

await browser.close();

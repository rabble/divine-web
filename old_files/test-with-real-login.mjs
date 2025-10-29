import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

// Collect console logs
const logs = [];
page.on('console', msg => {
  const text = msg.text();
  logs.push(text);
  console.log(`[${msg.type()}] ${text}`);
});
page.on('pageerror', error => console.error(`[PAGE ERROR] ${error.message}`));

try {
  console.log('Loading app with injected login state...\n');

  await page.goto('http://localhost:8080/');

  // Inject login state into localStorage BEFORE the app loads
  await page.evaluate(() => {
    const testPubkey = 'e2ccf7cf20403f3f2a4a55b328f0de3be38558a7d5f33632fdaaefc726c1c8eb';

    // Inject window.nostr
    window.nostr = {
      async getPublicKey() {
        return testPubkey;
      },
      async signEvent(event) {
        return {
          ...event,
          pubkey: testPubkey,
          id: 'fake-id',
          sig: 'fake-signature-1234567890123456789012345678901234567890123456789012345678901234',
        };
      },
    };

    // Inject login state that NostrLoginProvider expects
    const loginState = [{
      id: testPubkey,
      pubkey: testPubkey,
      type: 'extension', // NIP-07 browser extension type
    }];

    localStorage.setItem('nostr:login', JSON.stringify(loginState));
    console.log('[TEST] Injected login state and window.nostr');
  });

  // Reload to pick up the localStorage changes
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(8000);

  // Check results
  const videoEventsLogs = logs.filter(l => l.includes('useVideoEvents'));
  const reqRouterLogs = logs.filter(l => l.includes('reqRouter'));

  console.log('\n===== useVideoEvents LOGS =====');
  if (videoEventsLogs.length > 0) {
    videoEventsLogs.forEach(l => console.log(l));
  } else {
    console.log('NO useVideoEvents LOGS');
  }

  console.log('\n===== reqRouter LOGS =====');
  if (reqRouterLogs.length > 0) {
    reqRouterLogs.forEach(l => console.log(l));
  } else {
    console.log('NO reqRouter LOGS');
  }
  console.log('===========================\n');

} catch (error) {
  console.error(`\n❌ Test failed: ${error.message}`);
} finally {
  await browser.close();
}

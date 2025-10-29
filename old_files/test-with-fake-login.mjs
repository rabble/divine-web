import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

// Collect console logs
page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', error => console.error(`[PAGE ERROR] ${error.message}`));

try {
  console.log('Loading app and injecting fake window.nostr...\n');

  await page.goto('http://localhost:8080/', {
    waitUntil: 'domcontentloaded',
  });

  // Inject a fake window.nostr object BEFORE the app fully loads
  await page.evaluate(() => {
    const testPubkey = 'test-pubkey-12345678901234567890123456789012';

    window.nostr = {
      async getPublicKey() {
        return testPubkey;
      },
      async signEvent(event) {
        return {
          ...event,
          pubkey: testPubkey,
          sig: 'fake-signature-1234567890123456789012345678901234567890123456789012345678901234',
        };
      },
    };

    console.log('[TEST] Injected fake window.nostr');
  });

  // Wait for page to fully load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  // Check if videos are loading
  const result = await page.evaluate(() => {
    return {
      hasVideoFeed: !!document.querySelector('[data-testid="video-card"]'),
      bodyText: document.body.innerText.substring(0, 300),
    };
  });

  console.log('\n===== RESULT =====');
  console.log('Has video cards:', result.hasVideoFeed);
  console.log('Body text:', result.bodyText);
  console.log('==================\n');

} catch (error) {
  console.error(`\n❌ Test failed: ${error.message}`);
} finally {
  await browser.close();
}

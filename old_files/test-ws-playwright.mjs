import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

// Collect all console logs
page.on('console', msg => {
  console.log(`[${msg.type()}] ${msg.text()}`);
});

// Track errors
page.on('pageerror', error => {
  console.error(`[PAGE ERROR] ${error.message}`);
});

try {
  console.log('Loading WebSocket test page...\n');
  await page.goto('http://localhost:8080/test-websocket-browser.html', {
    waitUntil: 'load',
    timeout: 10000
  });

  // Wait for WebSocket connection to complete (success or failure)
  console.log('\nWaiting 5 seconds for WebSocket test...\n');
  await page.waitForTimeout(5000);

  // Get the output div content
  const output = await page.textContent('#output');
  console.log('\n===== PAGE OUTPUT =====');
  console.log(output);
  console.log('=====================\n');

} catch (error) {
  console.error(`\n❌ Test failed: ${error.message}`);
} finally {
  await browser.close();
}

import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

// Collect ALL console logs
const logs = [];
page.on('console', msg => {
  const text = msg.text();
  logs.push(text);
  console.log(`[${msg.type()}] ${text}`);
});

page.on('pageerror', error => {
  console.error(`[PAGE ERROR] ${error.message}`);
});

try {
  console.log('Loading app...\n');
  await page.goto('http://localhost:8080/', {
    waitUntil: 'networkidle',
    timeout: 10000
  });

  console.log('\nWaiting 5 seconds...\n');
  await page.waitForTimeout(5000);

  // Filter for NRelay1 logs
  const nrelayLogs = logs.filter(l => l.includes('[NRelay1:'));

  console.log('\n===== NRelay1 LOGS =====');
  if (nrelayLogs.length > 0) {
    nrelayLogs.forEach(l => console.log(l));
  } else {
    console.log('NO NRelay1 LOGS FOUND');
  }
  console.log('========================\n');

  // Show query-related logs
  const queryLogs = logs.filter(l =>
    l.includes('useVideoEvents') ||
    l.includes('CachedNostr') ||
    l.includes('NostrProvider')
  );

  console.log('\n===== QUERY LOGS =====');
  queryLogs.forEach(l => console.log(l));
  console.log('======================\n');

} catch (error) {
  console.error(`\n❌ Test failed: ${error.message}`);
} finally {
  await browser.close();
}

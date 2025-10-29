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

  console.log('\nWaiting 3 seconds...\n');
  await page.waitForTimeout(3000);

  // Check if VideoFeed component is in the DOM
  const videoFeedExists = await page.evaluate(() => {
    const feed = document.querySelector('[data-testid="discovery-video-feed"]');
    return {
      exists: !!feed,
      html: feed ? feed.innerHTML.substring(0, 200) : null
    };
  });

  console.log('\n===== VIDEOFEED CHECK =====');
  console.log('VideoFeed exists:', videoFeedExists.exists);
  console.log('VideoFeed HTML:', videoFeedExists.html);
  console.log('===========================\n');

  // Check for useVideoEvents logs
  const videoEventsLogs = logs.filter(l => l.includes('useVideoEvents'));
  console.log('\n===== useVideoEvents LOGS =====');
  if (videoEventsLogs.length > 0) {
    videoEventsLogs.forEach(l => console.log(l));
  } else {
    console.log('NO useVideoEvents LOGS FOUND');
  }
  console.log('===============================\n');

} catch (error) {
  console.error(`\n❌ Test failed: ${error.message}`);
} finally {
  await browser.close();
}

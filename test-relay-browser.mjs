import { chromium } from 'playwright';

(async () => {
  console.log('Testing relay connection in browser at http://localhost:8080/\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect all console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    console.log(`[${msg.type()}] ${text}`);
  });

  // Track errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
    console.error(`[PAGE ERROR] ${error.message}`);
  });

  try {
    console.log('Loading http://localhost:8080/ ...\n');
    await page.goto('http://localhost:8080/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for the feed to load or timeout
    console.log('\nWaiting 8 seconds for videos to load...\n');
    await page.waitForTimeout(8000);

    // Check debug panel
    const debugPanelVisible = await page.isVisible('text=Debug Panel');
    console.log(`Debug Panel visible: ${debugPanelVisible}`);

    if (debugPanelVisible) {
      const totalEvents = await page.textContent('text=Total Events:').then(t => t?.split(':')[1]?.trim());
      const validVideos = await page.textContent('text=Valid Videos:').then(t => t?.split(':')[1]?.trim());

      console.log(`Total Events: ${totalEvents}`);
      console.log(`Valid Videos: ${validVideos}`);

      if (validVideos && parseInt(validVideos) > 0) {
        console.log('\n✅ TEST PASSED: Videos loaded successfully!');
        await browser.close();
        process.exit(0);
      }
    }

    // Check for error messages
    const noVideosFound = await page.isVisible('text=No videos found');
    if (noVideosFound) {
      console.log('\n❌ TEST FAILED: "No videos found" message displayed');

      // Check if there are any relevant logs
      const nostrLogs = logs.filter(l =>
        l.includes('NostrProvider') ||
        l.includes('useVideoEvents') ||
        l.includes('NRelay1')
      );

      if (nostrLogs.length > 0) {
        console.log('\nRelevant logs:');
        nostrLogs.slice(-10).forEach(l => console.log(`  ${l}`));
      }

      await browser.close();
      process.exit(1);
    }

    console.log('\n⚠️  TEST INCONCLUSIVE: Could not determine state');
    await browser.close();
    process.exit(1);

  } catch (error) {
    console.error(`\n❌ Test failed with exception: ${error.message}`);
    await browser.close();
    process.exit(1);
  }
})();

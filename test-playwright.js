const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
  });

  // Log network requests for video files
  page.on('request', request => {
    const url = request.url();
    if (url.includes('.m3u8') || url.includes('.mp4') || url.includes('.ts') || url.includes('divine')) {
      console.log(`[Network Request] ${request.method()} ${url}`);
    }
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('.m3u8') || url.includes('.mp4') || url.includes('.ts') || url.includes('divine')) {
      console.log(`[Network Response] ${response.status()} ${url}`);
    }
  });

  // Log page errors
  page.on('pageerror', error => {
    console.log(`[Page Error] ${error.message}`);
  });

  console.log('Opening http://localhost:5173/debug-video ...');
  await page.goto('http://localhost:5173/debug-video', { waitUntil: 'networkidle' });

  // Wait for videos to load
  await page.waitForTimeout(3000);

  // Check if any video elements exist
  const videoElements = await page.$$('video');
  console.log(`Found ${videoElements.length} video elements on page`);

  // Get video URLs from the debug page
  const videoUrls = await page.evaluate(() => {
    const urls = [];
    document.querySelectorAll('code').forEach(code => {
      const text = code.textContent;
      if (text && (text.includes('.m3u8') || text.includes('.mp4'))) {
        urls.push(text);
      }
    });
    return urls;
  });

  console.log('\nVideo URLs found on page:');
  videoUrls.forEach(url => console.log(`  - ${url}`));

  // Try clicking the first "Test This URL" button
  const testButton = await page.$('button:has-text("Test This URL")');
  if (testButton) {
    console.log('\nClicking first "Test This URL" button...');
    await testButton.click();
    await page.waitForTimeout(5000);

    // Check video state after clicking
    const videoState = await page.evaluate(() => {
      const video = document.querySelector('video');
      if (!video) return null;
      return {
        src: video.src,
        currentSrc: video.currentSrc,
        readyState: video.readyState,
        networkState: video.networkState,
        error: video.error ? video.error.message : null,
        paused: video.paused,
        duration: video.duration,
        buffered: video.buffered.length > 0 ? {
          start: video.buffered.start(0),
          end: video.buffered.end(0)
        } : null
      };
    });
    
    console.log('\nVideo element state:');
    console.log(JSON.stringify(videoState, null, 2));
  }

  // Keep browser open for manual inspection
  console.log('\nBrowser will stay open for inspection. Press Ctrl+C to close.');
  
  // Keep the script running
  await new Promise(() => {});
})();
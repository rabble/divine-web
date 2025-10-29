import { chromium } from 'playwright';

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

console.log('Opening http://localhost:8080/debug-video ...');
await page.goto('http://localhost:8080/debug-video', { waitUntil: 'networkidle' });

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
    if (text && (text.includes('.m3u8') || text.includes('.mp4') || text.includes('divine'))) {
      urls.push(text);
    }
  });
  return urls;
});

console.log('\nVideo URLs found on page:');
videoUrls.forEach(url => console.log(`  - ${url}`));

// Check if there are no videos
const noVideosMessage = await page.$('text=No videos found');
if (noVideosMessage) {
  console.log('\n⚠️  No videos found in the feed. The relay might not have video content.');
  console.log('Checking relay connection...');
  
  // Get current relay from localStorage
  const relayUrl = await page.evaluate(() => {
    return localStorage.getItem('divine-web:relay-url');
  });
  console.log(`Current relay: ${relayUrl || 'wss://relay.nostr.band (default)'}`);
}

// Try clicking the first "Test This URL" button if it exists
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

// Let's also check the main feed page
console.log('\n\nChecking main feed at http://localhost:8080/ ...');
await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

const mainPageVideos = await page.$$('video');
console.log(`Found ${mainPageVideos.length} video elements on main page`);

// Check for video cards
const videoCards = await page.$$('[data-testid="video-metadata"]');
console.log(`Found ${videoCards.length} video cards on main page`);

console.log('\nBrowser will stay open for inspection. Press Ctrl+C to close.');

// Keep the script running
await new Promise(() => {});
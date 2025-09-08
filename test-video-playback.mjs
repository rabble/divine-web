import { chromium } from 'playwright';

const browser = await chromium.launch({ 
  headless: false,
  devtools: false 
});
const context = await browser.newContext();
const page = await context.newPage();

// Enable console logging
page.on('console', msg => {
  if (msg.text().includes('[VideoPlayer]') || msg.text().includes('HLS')) {
    console.log(`[Console] ${msg.text()}`);
  }
});

console.log('Opening debug page...');
await page.goto('http://localhost:8080/debug-video', { waitUntil: 'networkidle' });

// Wait for content to load
await page.waitForTimeout(2000);

// Check if we have video URLs
const videoUrls = await page.evaluate(() => {
  const urls = [];
  document.querySelectorAll('code').forEach(code => {
    const text = code.textContent;
    if (text && text.includes('divine.video')) {
      urls.push(text);
    }
  });
  return urls;
});

if (videoUrls.length > 0) {
  console.log(`\nFound ${videoUrls.length} video URLs:`);
  videoUrls.forEach((url, i) => {
    console.log(`${i + 1}. ${url}`);
  });

  // Click the first "Test This URL" button
  const testButton = await page.$('button:has-text("Test This URL")');
  if (testButton) {
    console.log('\nClicking "Test This URL" button...');
    await testButton.click();
    
    // Wait for video to load
    await page.waitForTimeout(3000);
    
    // Check video element state
    const videoState = await page.evaluate(() => {
      const video = document.querySelector('video');
      if (!video) return { error: 'No video element found' };
      
      return {
        src: video.src,
        currentSrc: video.currentSrc,
        readyState: video.readyState,
        readyStateText: ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'][video.readyState],
        networkState: video.networkState,
        networkStateText: ['NETWORK_EMPTY', 'NETWORK_IDLE', 'NETWORK_LOADING', 'NETWORK_NO_SOURCE'][video.networkState],
        error: video.error ? { code: video.error.code, message: video.error.message } : null,
        paused: video.paused,
        duration: video.duration,
        currentTime: video.currentTime,
        buffered: video.buffered.length > 0 ? {
          length: video.buffered.length,
          start: video.buffered.start(0),
          end: video.buffered.end(0)
        } : null
      };
    });
    
    console.log('\nVideo element state:');
    console.log(JSON.stringify(videoState, null, 2));
    
    // Try to play the video
    if (videoState.paused && !videoState.error) {
      console.log('\nAttempting to play video...');
      const playResult = await page.evaluate(async () => {
        const video = document.querySelector('video');
        if (!video) return { error: 'No video element' };
        
        try {
          await video.play();
          return { playing: true, currentTime: video.currentTime };
        } catch (err) {
          return { error: err.message };
        }
      });
      
      console.log('Play result:', playResult);
      
      // Wait and check again
      await page.waitForTimeout(2000);
      
      const afterPlayState = await page.evaluate(() => {
        const video = document.querySelector('video');
        if (!video) return null;
        return {
          paused: video.paused,
          currentTime: video.currentTime,
          buffered: video.buffered.length
        };
      });
      
      console.log('After play state:', afterPlayState);
    }
  }
} else {
  console.log('No video URLs found. Checking main page...');
  
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  const mainPageVideos = await page.$$('video');
  console.log(`Found ${mainPageVideos.length} video elements on main page`);
}

// Take a screenshot
await page.screenshot({ path: 'video-test.png' });
console.log('\nScreenshot saved as video-test.png');

console.log('\nTest complete. Browser will close in 5 seconds...');
await page.waitForTimeout(5000);

await browser.close();
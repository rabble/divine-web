import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

// Collect console logs
page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', error => console.error(`[PAGE ERROR] ${error.message}`));

try {
  console.log('Loading app...\n');
  await page.goto('http://localhost:8080/', {
    waitUntil: 'networkidle',
    timeout: 10000
  });

  await page.waitForTimeout(2000);

  // Get the entire page body text and HTML structure
  const pageInfo = await page.evaluate(() => {
    return {
      title: document.title,
      bodyText: document.body.innerText.substring(0, 500),
      mainHTML: document.querySelector('main')?.innerHTML?.substring(0, 800) || 'No main element',
      allTestIds: Array.from(document.querySelectorAll('[data-testid]')).map(el => el.getAttribute('data-testid'))
    };
  });

  console.log('\n===== PAGE INFO =====');
  console.log('Title:', pageInfo.title);
  console.log('\nBody Text:', pageInfo.bodyText);
  console.log('\nMain HTML:', pageInfo.mainHTML);
  console.log('\nAll test IDs:', pageInfo.allTestIds);
  console.log('=====================\n');

} catch (error) {
  console.error(`\n❌ Test failed: ${error.message}`);
} finally {
  await browser.close();
}

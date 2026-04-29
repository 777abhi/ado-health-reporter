const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8080/dashboard/index.html');
  await page.waitForTimeout(1000); // Wait for charts to render
  await page.screenshot({ path: 'dashboard.png' });
  await browser.close();
})();

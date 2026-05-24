const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1300, height: 1050 });
  await page.goto('http://localhost:8080/dashboard/index.html');
  await page.waitForTimeout(3500); // Wait for Chart.js animations to complete
  await page.screenshot({ path: 'dashboard.png' });
  
  // Also copy to docs/dashboard.png
  fs.copyFileSync('dashboard.png', 'docs/dashboard.png');
  console.log("Screenshot successfully updated at dashboard.png and docs/dashboard.png");
  
  await browser.close();
})();

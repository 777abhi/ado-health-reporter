const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log("Launching headless browser...");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Capture page logs for debugging
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER PAGE ERROR:', err.message));

  await page.setViewportSize({ width: 1300, height: 1050 });
  
  console.log("Navigating to dashboard with disabled animations...");
  await page.goto('http://localhost:8080/dashboard/index.html?animate=false', { 
    waitUntil: 'networkidle' 
  });
  
  // Extra wait to guarantee PapaParse has finished parsing and DOM has updated
  await page.waitForTimeout(2000); 
  
  console.log("Capturing screenshot...");
  await page.screenshot({ path: 'dashboard.png' });
  
  // Also copy to docs/dashboard.png
  fs.copyFileSync('dashboard.png', 'docs/dashboard.png');
  console.log("Screenshot successfully updated at dashboard.png and docs/dashboard.png");
  
  await browser.close();
})();

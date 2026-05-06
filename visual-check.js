// Reusable visual + health check.
// - Desktop: 1440 × 1000  →  screenshots/visual-check-desktop.png
// - Mobile:  390 × 844    →  screenshots/visual-check-mobile.png
// - Captures console errors/warnings + failed/4xx requests for both viewports.
// Run with:  npm run visual-check  (requires the dev server on port 5173)

const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:5173/';

(async () => {
  const browser = await chromium.launch();
  const consoleMessages = { desktop: [], mobile: [] };
  const requestFailures = { desktop: [], mobile: [] };

  // ---- Desktop ----
  const desktopCtx = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
  });
  const desktopPage = await desktopCtx.newPage();
  desktopPage.on('console', m => {
    if (m.type() === 'error' || m.type() === 'warning') consoleMessages.desktop.push(`[${m.type()}] ${m.text()}`);
  });
  desktopPage.on('requestfailed', r => requestFailures.desktop.push(`${r.method()} ${r.url()} - ${r.failure().errorText}`));
  desktopPage.on('response', r => { if (r.status() >= 400) requestFailures.desktop.push(`${r.status()} ${r.url()}`); });

  await desktopPage.goto(TARGET_URL, { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(2000);
  await desktopPage.screenshot({ path: 'screenshots/visual-check-desktop.png', fullPage: true });

  // ---- Mobile ----
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileCtx.newPage();
  mobilePage.on('console', m => {
    if (m.type() === 'error' || m.type() === 'warning') consoleMessages.mobile.push(`[${m.type()}] ${m.text()}`);
  });
  mobilePage.on('requestfailed', r => requestFailures.mobile.push(`${r.method()} ${r.url()} - ${r.failure().errorText}`));
  mobilePage.on('response', r => { if (r.status() >= 400) requestFailures.mobile.push(`${r.status()} ${r.url()}`); });

  await mobilePage.goto(TARGET_URL, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(2000);
  await mobilePage.screenshot({ path: 'screenshots/visual-check-mobile.png', fullPage: true });

  await browser.close();

  console.log('--- DESKTOP console errors/warnings ---');
  console.log(consoleMessages.desktop.length === 0 ? '  (none)' : consoleMessages.desktop.map(m => '  ' + m).join('\n'));
  console.log('--- DESKTOP failed/4xx requests ---');
  console.log(requestFailures.desktop.length === 0 ? '  (none)' : requestFailures.desktop.map(m => '  ' + m).join('\n'));
  console.log('--- MOBILE console errors/warnings ---');
  console.log(consoleMessages.mobile.length === 0 ? '  (none)' : consoleMessages.mobile.map(m => '  ' + m).join('\n'));
  console.log('--- MOBILE failed/4xx requests ---');
  console.log(requestFailures.mobile.length === 0 ? '  (none)' : requestFailures.mobile.map(m => '  ' + m).join('\n'));
})();

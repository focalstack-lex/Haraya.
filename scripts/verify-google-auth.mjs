import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('reports/ui-verification/2026-09-29-google-auth');
fs.mkdirSync(outDir, { recursive: true });

async function verify() {
  const browser = await chromium.launch();
  const consoleErrors = [];
  const pageErrors = [];

  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  // Set welcomed flag and tour done flag to bypass first-time onboarding sheets
  await page.addInitScript(() => {
    localStorage.setItem('haraya_welcomed', 'true');
    localStorage.setItem('haraya_tour_done', 'true');
  });

  // Navigate to login tab
  await page.goto('http://localhost:5173/#/tab/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Check 375px signin
  const googleBtn = page.getByRole('button', { name: 'Continue with Google' });
  const googleVisible = await googleBtn.isVisible();
  console.log('375px Sign in: Google button visible =', googleVisible);

  await page.screenshot({ path: path.join(outDir, '01-signin-375.png') });

  // Switch to Create account tab
  const createAccountTab = page.getByRole('tab', { name: 'Create account' });
  await createAccountTab.click();
  await page.waitForTimeout(300);

  const googleVisibleSignup = await googleBtn.isVisible();
  console.log('375px Create account: Google button visible =', googleVisibleSignup);
  await page.screenshot({ path: path.join(outDir, '02-signup-375.png') });

  // Switch to 320px viewport
  await page.setViewportSize({ width: 320, height: 640 });
  await page.waitForTimeout(300);

  const overflow320 = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log('320px overflow detected =', overflow320);
  await page.screenshot({ path: path.join(outDir, '03-signup-320.png') });

  const signinTab = page.getByRole('tab', { name: 'Sign in' });
  await signinTab.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, '04-signin-320.png') });

  // Desktop viewport
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, '05-signin-desktop.png') });

  await browser.close();

  const report = {
    timestamp: new Date().toISOString(),
    googleButtonVisibleSignIn: googleVisible,
    googleButtonVisibleSignUp: googleVisibleSignup,
    horizontalOverflow320: overflow320,
    consoleErrors,
    pageErrors,
  };

  fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(report, null, 2));
  console.log('UI Verification Report generated:', report);
}

verify().catch((err) => {
  console.error('UI Verification failed:', err);
  process.exit(1);
});

/**
 * Captures the phone screens the video shows, from the running app, into public/screens/.
 *
 * Every screen is the real app driven through its own buttons: a 390x844 phone at 3x, Manila time pinned to a
 * weekday afternoon (the default mood card, spots open), and an emulated GPS position in Digos. Signed out, so
 * visits stay in this throwaway browser and nothing is written to the database.
 *
 * Shown in the video: discover, map, spot, mood-picks, mood-picks-list, navigate.
 * References the rebuilt UI was checked against (not shown): checkin, focus-banner, passport-stamps.
 *
 * Needs the dev server (npm run dev in the app, or the haraya-capture launch config on port 5175) and the root
 * Playwright install. Run: npm run capture   (HARAYA_URL overrides the address)
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const BASE = process.env.HARAYA_URL ?? 'http://localhost:5175';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'screens');
const CLOCK = new Date('2026-10-01T15:30:00+08:00');
const GREEN_COFFEE = 'curated-green-coffee-digos';
/** About 30 m from Green Coffee: inside the 120 m check-in radius. */
const AT_GREEN_COFFEE = { latitude: 6.75505, longitude: 125.35571 };
/** A short walk from Green Coffee, near Rizal Avenue. */
const WALK_START = { latitude: 6.7512, longitude: 125.3521 };

mkdirSync(OUT, { recursive: true });

const settle = async (page, ms = 900) => {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForFunction(() => [...document.images].every((image) => image.complete), undefined, { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(ms);
};

const shot = async (page, name) => {
  await page.screenshot({ path: join(OUT, `${name}.jpg`), type: 'jpeg', quality: 90 });
  console.log(`capture: ${name}.jpg`);
};

const open = async (browser, geolocation) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    locale: 'en-PH',
    timezoneId: 'Asia/Manila',
    geolocation,
    permissions: ['geolocation'],
    colorScheme: 'light',
  });
  // First-run sheets would cover the screen: the welcome sheet, the guided tour and the install offer
  await context.addInitScript(() => {
    for (const key of ['haraya_welcomed', 'haraya_tour_done', 'haraya_install_offered']) localStorage.setItem(key, 'true');
  });
  await context.clock.install({ time: CLOCK });
  const page = await context.newPage();
  page.on('pageerror', (error) => console.error(`capture: page error: ${error.message}`));
  return { context, page };
};

const browser = await chromium.launch();
try {
  // Discover, then the mood finder before and after a mood, with distances from a spot a short walk away
  {
    const { context, page } = await open(browser, WALK_START);
    await page.goto(`${BASE}/#/tab/feed`);
    await page.getByText('10 spots').waitFor();
    await settle(page);
    await shot(page, 'discover');

    await page.getByRole('button', { name: /^(Pick a mood|Find a late spot)$/ }).click();
    await page.getByText('How are you feeling?').first().waitFor();
    // Distances need the location; the button is absent when the finder already has it
    const turnOn = page.getByRole('button', { name: /^Turn on location$/ });
    if (await turnOn.isVisible()) await turnOn.click();
    await settle(page);

    await page.getByRole('button', { name: 'Focused', exact: true }).click();
    await page.getByText('Your picks').waitFor();
    await settle(page);
    await shot(page, 'mood-picks');
    await page.getByText('Your picks').scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      const heading = [...document.querySelectorAll('h2, h3, p')].find((node) => node.textContent?.trim() === 'Your picks');
      heading?.scrollIntoView({ block: 'start' });
    });
    await settle(page, 600);
    await shot(page, 'mood-picks-list');
    await context.close();
  }

  // The map, then the in-app walking route to Green Coffee
  {
    const { context, page } = await open(browser, WALK_START);
    await page.goto(`${BASE}/#/tab/map`);
    await settle(page, 4500);
    await shot(page, 'map');

    await page.goto(`${BASE}/#/cafe/${GREEN_COFFEE}`);
    await page.getByRole('button', { name: /^Directions$/ }).click();
    await page.getByText('Navigate in Haraya').click();
    // Aya's route overlay holds for a moment, then the street route draws
    await settle(page, 5000);
    await shot(page, 'navigate');
    await context.close();
  }

  // At Green Coffee: the spot sheet, check in, a focus session, then the saved visit in the Passport
  {
    const { context, page } = await open(browser, AT_GREEN_COFFEE);
    await page.goto(`${BASE}/#/cafe/${GREEN_COFFEE}`);
    await page.getByRole('button', { name: /^Check in$/ }).waitFor();
    await settle(page);
    await shot(page, 'spot');

    await page.getByRole('button', { name: /^Check in$/ }).click();
    await page.getByText('Start Focus Session').waitFor();
    await settle(page, 1200);
    await shot(page, 'checkin');

    await page.getByText('Start Focus Session').click();
    await page.getByText('Deep focus').waitFor();
    await page.clock.fastForward('01:24:36');
    await settle(page, 1500);
    await shot(page, 'focus-banner');

    await page.getByRole('button', { name: 'Finish', exact: true }).click();
    await page.getByText('Save to Passport').click();
    await page.getByText(/Saved to your passport/).waitFor();

    await page.goto(`${BASE}/#/tab/passport`);
    await page.getByRole('tab', { name: /^Passport \(\d+\)$/ }).click();
    await settle(page, 900);
    await shot(page, 'passport-stamps');
    await context.close();
  }
} finally {
  await browser.close();
}

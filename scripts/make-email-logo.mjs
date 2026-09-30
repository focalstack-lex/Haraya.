/**
 * Builds public/brand/haraya-email-logo.png: the wordmark on its own linen tile with rounded corners.
 *
 * Email apps in dark mode (Gmail on phones) repaint an email's background dark but leave images alone, so the
 * transparent dark-brown wordmark all but disappears. A logo that carries its own light tile stays readable in
 * both modes; in light mode the tile matches the email's linen background and is not noticed.
 *
 *   node scripts/make-email-logo.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(import.meta.dirname, '..');
const wordmark = readFileSync(resolve(root, 'public/brand/haraya-wordmark.png')).toString('base64');
const out = resolve(root, 'public/brand/haraya-email-logo.png');

// 176 x 104 CSS px at 2x: shown at that size in the email, sharp on phone screens
const html = `<!doctype html><html><body style="margin:0;background:transparent">
<div id="tile" style="width:176px;height:104px;border-radius:18px;background:#FAF5EB;display:flex;align-items:center;justify-content:center">
  <img src="data:image/png;base64,${wordmark}" style="height:72px;width:auto;display:block" alt="">
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 200, height: 130 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'load' });
await page.locator('#tile').screenshot({ path: out, omitBackground: true });
await browser.close();
console.log('written', out);

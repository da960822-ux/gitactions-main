import { chromium } from 'file:///opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';

const url = process.env.LANDING_URL || 'http://127.0.0.1:5191/';
const out = '/mnt/data';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const results = [];
try {
  for (const language of ['ko', 'es']) {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    await context.addInitScript(value => localStorage.setItem('dos-language', value), language);
    const page = await context.newPage();
    page.on('pageerror', error => results.push({ language, error: error.message }));
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.locator('.landing').waitFor({ state: 'visible' });
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.moment-notes').waitFor({ state: 'visible' });
    await page.locator('.moment-notes').evaluate(el => el.scrollIntoView({ block: 'center' }));
    await page.locator('#papi-letter .moment-fold-button').waitFor({ state: 'visible' });
    const notes = await page.locator('.moment-note').count();
    if (notes !== 3) throw new Error(`Expected three how-to notes, found ${notes}`);
    await page.locator('#papi-letter').evaluate(el => el.scrollIntoView({ block: 'center' }));
    await page.waitForFunction(() => document.querySelectorAll('#moment-letter-copy p').length >= 4, null, { timeout: 6000 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(300);
    const details = await page.evaluate(() => ({
      language: document.documentElement.lang,
      width: innerWidth,
      height: innerHeight,
      cardCount: document.querySelectorAll('.game-rail-card').length,
      cardBottom: Math.max(...[...document.querySelectorAll('.game-rail-card')].map(el => el.getBoundingClientRect().bottom)),
      pageHeight: document.documentElement.scrollHeight,
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    const file = path.join(out, `landing-motion-upgrade-${language}.png`);
    await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
    results.push({ ...details, file });
    await context.close();
  }
} finally {
  await browser.close();
}
await fs.writeFile(path.join(out, 'landing-motion-upgrade-screens.json'), JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { launchChromium } from './playwright-browser.mjs';

// Built-app smoke check: uses UI only, without importing Vite source modules.
const base = process.env.QUALITY_PREVIEW_URL || 'http://127.0.0.1:5194';
const output = 'output/playwright/game-quality/build';
await fs.mkdir(output, { recursive: true });
const browser = await launchChromium();
const reports = [], errors = [];
try {
  for (const game of ['domino', 'jaipur', 'splendor']) {
    for (const language of ['ko', 'es']) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await context.addInitScript(value => localStorage.setItem('dos-language', value), language);
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(new URL(`/play?game=${game}`, base).href);
      await page.locator('#nickname').fill('Built game review');
      await page.locator('.lobby-actions > button').click();
      await page.waitForURL('**/room/**');
      await page.locator('.demo-banner select').selectOption('p2');
      await page.locator('.room-game-card').filter({ hasText: ({ domino: /도미노|Dominó/, jaipur: /자이푸르|Jaipur/, splendor: /스플렌더|Splendor/ })[game] }).click();
      await page.locator('.demo-banner select').selectOption('p1');
      await page.locator('#game-board').waitFor();
      const board = page.locator(game === 'domino' ? '.domino-premium' : game === 'splendor' ? '.sp-splendor' : '[data-jaipur-zone="market"]');
      await board.waitFor();
      const guide = page.locator('#game-guide');
      assert.equal(await guide.locator('.quick-guide-image').count(), 3);
      assert.equal(await guide.locator('.guide-details').evaluate(node => node.open), false);
      await page.waitForFunction(() => [...document.querySelectorAll('#game-board img, #game-guide img')].every(image => image.complete && image.naturalWidth > 0));
      const svgImages = await page.evaluate(async () => {
        const paths = [...new Set([...document.querySelectorAll('#game-board svg image, #game-guide svg image')].map(image => image.getAttribute('href')).filter(Boolean))];
        return Promise.all(paths.map(async path => ({ path, status: (await fetch(path)).status })));
      });
      assert(svgImages.every(image => image.status === 200));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await guide.screenshot({ path: `${output}/${game}-${language}-guide.png` });
      await guide.locator('summary').click();
      assert.equal(await guide.locator('.guide-details').evaluate(node => node.open), true);
      await guide.locator('summary').click();
      assert.equal(await guide.locator('.guide-details').evaluate(node => node.open), false);
      reports.push({ game, language, loadedFromBuiltApp: true, svgImages, illustratedSteps: 3, detailedRulesToggle: true, horizontalOverflow: false });
      await context.close();
    }
  }
  assert.deepEqual(errors, []);
  await fs.writeFile(`${output}/report.json`, JSON.stringify({ reports, errors }, null, 2));
  console.log(JSON.stringify({ reports, errors }, null, 2));
} finally { await browser.close(); }

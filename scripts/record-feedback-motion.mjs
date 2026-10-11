import { chromium } from 'file:///opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';

const url = process.env.LANDING_URL || 'http://127.0.0.1:5191/';
const out = path.resolve('output/playwright/landing-motion-upgrade/native-video');
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const errors = [];
const host = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await host.addInitScript(() => localStorage.setItem('dos-language', 'ko'));
const hostPage = await host.newPage();
try {
  await hostPage.goto(`${new URL(url).origin}/feedback`, { waitUntil: 'domcontentloaded' });
  await hostPage.locator('.feedback-setup .primary-action').waitFor({ state: 'visible', timeout: 8000 });
  await hostPage.locator('.feedback-setup .primary-action').click();
  await hostPage.locator('.feedback-access-note').waitFor({ state: 'visible', timeout: 8000 });
  const space = await hostPage.evaluate(() => new URL(location.href).searchParams.get('space'));
  if (!space) throw new Error('feedback_space_missing');

  const writer = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: out, size: { width: 1440, height: 900 } } });
  await writer.addInitScript(() => localStorage.setItem('dos-language', 'ko'));
  const page = await writer.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${new URL(url).origin}/feedback?space=${encodeURIComponent(space)}`, { waitUntil: 'domcontentloaded' });
  await page.locator('.feedback-compose').waitFor({ state: 'visible', timeout: 10000 });
  await page.screenshot({ path: path.join(out, 'feedback-composer-before.png'), fullPage: true });
  await page.locator('#feedback-title').focus();
  await page.waitForTimeout(450);
  await page.locator('#feedback-title').fill('A small note for Lisbeth');
  await page.locator('#feedback-body').focus();
  await page.waitForTimeout(450);
  await page.locator('#feedback-body').fill('Let’s save a little idea for our next game night.');
  await page.locator('.feedback-submit').hover();
  await page.waitForTimeout(900);
  await page.locator('.feedback-submit').click();
  await page.locator('.feedback-entry').filter({ hasText: 'A small note for Lisbeth' }).waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(900);
  const evidence = { composerShown: true, submittedEntryCount: await page.locator('.feedback-entry').count(), titleVisible: await page.locator('.feedback-entry').filter({ hasText: 'A small note for Lisbeth' }).count() === 1, errors };
  await page.screenshot({ path: path.join(out, 'feedback-composer-after.png'), fullPage: true });
  const video = page.video();
  await writer.close();
  await fs.copyFile(await video.path(), path.join(out, 'landing-motion-upgrade-feedback.webm'));
  await fs.writeFile(path.join(out, 'feedback-composer-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
  if (!evidence.titleVisible || errors.length) throw new Error(`feedback_composer_check_failed:${JSON.stringify(evidence)}`);
  console.log(JSON.stringify(evidence));
} finally {
  await host.close();
  await browser.close();
}

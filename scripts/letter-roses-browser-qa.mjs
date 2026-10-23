import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const out = resolve(`output/playwright/letter-roses-${Date.now()}`); await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: out, size: { width: 1920, height: 1080 } } });
const page = await context.newPage(); const report = { url: process.env.LETTER_QA_URL || 'http://localhost:5284/#papi-letter', errors: [], consoleErrors: [], failedRequests: [], responses: [] };
page.on('pageerror', error => report.errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
page.on('response', response => { if (response.url().includes('letter-roses')) report.responses.push({ url: response.url(), status: response.status() }); });
const wait = ms => new Promise(done => setTimeout(done, ms));
try {
  await page.goto('http://localhost:5285/scripts/shared-events-browser-harness.html', { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.locator('#hero-title').waitFor({ state: 'visible', timeout: 60_000 });
  report.restoration = { url: page.url(), hero: await page.locator('#hero-title').textContent(), sharedPanels: await page.locator('.shared-events').count() };
  assert.equal(new URL(report.restoration.url).pathname, '/'); assert.equal(report.restoration.sharedPanels, 0);
  await wait(2_000); await page.screenshot({ path: resolve(out, 'public-preview-restored.png') });
  console.log('PASS public QA pathname redirects to restored landing; Hero is visible and invite UI is absent');
  await page.goto(report.url, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForFunction(() => Number(document.querySelector('.post-hero-preview')?.dataset.opening) > 0.99, undefined, { timeout: 90_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#papi-letter').evaluate(element => { scrollTo({ top: scrollY + element.getBoundingClientRect().top + element.clientHeight / 2 - innerHeight / 2, behavior: 'instant' }); });
  await wait(3_000);
  report.reading = await page.evaluate(() => ({ opening: document.querySelector('.post-hero-preview').dataset.opening, progress: document.querySelector('.post-hero-preview').dataset.progress, scroll: scrollY, section: document.querySelector('#papi-letter').className, article: (() => { const rect = document.querySelector('.letter-paper').getBoundingClientRect(); return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }; })(), roses: [...document.querySelectorAll('.reading-roses')].map(element => { const rect = element.getBoundingClientRect(); const css = getComputedStyle(element); const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2); return { class: element.className, x: rect.x, y: rect.y, width: rect.width, height: rect.height, display: css.display, background: css.backgroundImage, visibility: css.visibility, opacity: css.opacity, zIndex: css.zIndex, topElement: hit?.className ?? null }; }) }));
  await page.screenshot({ path: resolve(out, 'reading.png') });
  const rose = page.locator('.reading-roses-left');
  if (await rose.count()) {
    const r = await rose.boundingBox(); if (r) await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
    await wait(2_000); report.hint = await page.locator('.rose-meaning').textContent();
    await page.screenshot({ path: resolve(out, 'hint.png') });
  }
  const close = page.locator('.letter-section-label button');
  await close.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await wait(250); const closeBox = await close.boundingBox(); await page.mouse.click(closeBox.x + closeBox.width / 2, closeBox.y + closeBox.height / 2);
  await page.waitForFunction(() => Number(document.querySelector('.post-hero-preview').dataset.opening) < 0.01, undefined, { timeout: 20_000 });
  await wait(1_000); await page.screenshot({ path: resolve(out, 'closed.png') });
  await page.locator('.ending').evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await wait(3_000); await page.screenshot({ path: resolve(out, 'ending.png') });
  report.passed = true;
} catch (error) { report.passed = false; report.failure = error.stack; console.error(error.stack); process.exitCode = 1; }
finally { await context.close(); await browser.close(); await writeFile(resolve(out, 'report.json'), JSON.stringify(report, null, 2)); console.log(`Letter QA report: ${out}/report.json`); }

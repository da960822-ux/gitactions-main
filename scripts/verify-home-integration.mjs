import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { launchChromium } from './playwright-browser.mjs';

const base = process.env.HOME_UI_URL || 'http://127.0.0.1:5233';
const out = process.env.HOME_QA_OUTPUT || 'output/home-integration';
await fs.mkdir(out, { recursive: true });
const browser = await launchChromium();
const checks = [], errors = [], bad = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) bad.push({ status: response.status(), url: response.url() }); });
await page.goto(base);
await page.locator('.rd-raster-scene[data-ready="true"]').waitFor({ timeout: 90000 });
await page.waitForFunction(() => Number(document.querySelector('.rd-raster-scene').dataset.curveReveal) === 1);
await page.evaluate(() => document.fonts.ready);
const sparks = page.locator('.rd-hero-sparks');
await page.mouse.move(105, 380);
await page.waitForTimeout(80);
assert.equal(await sparks.getAttribute('data-particle-count'), '4');
await page.waitForTimeout(850);
assert.equal(await sparks.getAttribute('data-particle-count'), '0');
await page.mouse.move(720, 470);
await page.waitForTimeout(50);
assert.equal(await sparks.getAttribute('data-particle-count'), '0');
checks.push('Peripheral burst animates and expires; no particles over the central portrait');
let maximum = 0;
for (let i = 0; i < 12; i++) {
  await page.mouse.move(i % 2 ? 110 : 1300, 420);
  maximum = Math.max(maximum, Number(await sparks.getAttribute('data-particle-count')));
  await page.waitForTimeout(90);
}
assert.ok(maximum > 0 && maximum <= 8);
await page.waitForTimeout(850);
await page.locator('.rd-hero-floor button[aria-pressed]').click();
await page.mouse.move(120, 420);
await page.waitForTimeout(80);
assert.equal(await sparks.getAttribute('data-particle-count'), '0');
assert.equal(await page.locator('.rd-hero-floor button[aria-pressed]').getAttribute('aria-pressed'), 'false');
await page.locator('.rd-hero-floor button[aria-pressed]').click();
await page.locator('#gift-games').scrollIntoViewIfNeeded();
await page.waitForFunction(() => document.querySelector('.rd-hero').dataset.decorVisible === 'false');
assert.equal(await page.locator('.rd-star-twinkle').first().evaluate(node => getComputedStyle(node).animationPlayState), 'paused');
checks.push('Particle cap, user motion pause, and offscreen twinkle pause');
await context.close();

const reduced = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
await reduced.addInitScript(() => {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type.includes('webgl') ? null : original.call(this, type, ...args); };
});
const fallback = await reduced.newPage();
fallback.on('pageerror', error => errors.push(error.message));
fallback.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) bad.push({ status: response.status(), url: response.url() }); });
await fallback.goto(base);
await fallback.locator('.rd-raster-scene[data-ready="true"]').waitFor();
await fallback.mouse.move(120, 420);
assert.equal(await fallback.locator('.rd-hero-sparks').getAttribute('data-particle-count'), '0');
assert.equal(await fallback.locator('.rd-star-twinkle').first().evaluate(node => getComputedStyle(node).animationName), 'none');
await fallback.screenshot({ path: path.join(out, 'reduced-home.png') });
await fallback.getByRole('button', { name: '준비한 게임', exact: true }).click();
await fallback.locator('.rd-gallery-fallback').waitFor({ timeout: 90000 });
const ids = ['davinci', 'catchmind', 'domino', 'jaipur', 'splendor', 'minhwatu', 'marble', 'rhythm'];
for (let index = 0; index < ids.length; index++) {
  await fallback.locator('.rd-game-choices button').nth(index).click();
  await fallback.waitForFunction(id => document.querySelector('.rd-gallery-fallback')?.src.endsWith(`/${id}.png`) && document.querySelector('.rd-gallery-fallback').complete && document.querySelector('.rd-gallery-fallback').naturalWidth > 0, ids[index]);
  assert.equal(await fallback.locator('.rd-game-start').getAttribute('href'), `/play?game=${ids[index]}`);
}
await fallback.screenshot({ path: path.join(out, 'no-webgl-exhibition.png') });
checks.push('Reduced motion suppresses new particles and twinkles; all eight selected game links and PNG fallbacks work without WebGL');
await reduced.close();

for (const route of ['/play?game=domino', '/feedback', '/room/home-qa-unknown']) {
  const direct = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const response = await direct.goto(base + route);
  assert.equal(response.status(), 200);
  await direct.waitForFunction(() => document.body.innerText.trim().length > 70);
  await direct.close();
}
checks.push('Production SPA direct play, feedback, and room routes resolve to nonempty UI');
assert.deepEqual(errors, []); assert.deepEqual(bad, []);
await fs.writeFile(path.join(out, 'home-effects-qa.json'), JSON.stringify({ pass: true, base, viewport: [1440, 900], maximumParticles: maximum, checks, errors, bad, note: 'Chromium uses software rendering. These are UI compatibility and cleanup assertions, not hardware FPS or production connection evidence.' }, null, 2));
await browser.close();
console.log(`PASS ${checks.length} home UI/effects groups`);

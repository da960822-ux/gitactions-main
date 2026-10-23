import assert from 'node:assert/strict';
import { launchChromium } from './playwright-browser.mjs';

const origin = new URL(process.env.LANDING_URL || 'http://127.0.0.1:5191/').origin;
const games = ['davinci', 'catchmind', 'domino', 'jaipur', 'splendor', 'minhwatu', 'marble', 'rhythm'];
const checks = [], errors = [], failedRequests = [];
const browser = await launchChromium();

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', hasTouch: false });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith(`${origin}/`) && response.status() >= 400) failedRequests.push({ url: response.url(), status: response.status() });
  });
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.locator('.landing').waitFor();
  const choices = page.locator('.rd-game-choices button');
  assert.deepEqual(await choices.evaluateAll(buttons => buttons.map(button => button.dataset.game)), games);
  await page.locator('.landing-language button').filter({ hasText: 'ES' }).click();
  for (const game of games) {
    await page.locator(`.rd-game-choices button[data-game="${game}"]`).click();
    assert.equal(await page.locator('.rd-game-start').getAttribute('href'), `/play?game=${game}`);
  }
  await page.locator('.rd-game-start').click();
  await page.locator('.lobby-picks').waitFor();
  assert.equal(new URL(page.url()).pathname, '/play');
  assert.equal(await page.locator('html').getAttribute('lang'), 'es-DO');
  checks.push('All eight gallery choices link to the real game lobby and preserve Spanish');

  for (const language of ['ko', 'es']) {
    for (const game of games) {
      await page.goto(`${origin}/play?game=${game}`, { waitUntil: 'domcontentloaded' });
      await page.locator('.lobby-picks').waitFor();
      await page.locator('.language-switch button').nth(language === 'ko' ? 0 : 1).click();
      assert.match(await page.locator('.pick-item[aria-pressed="true"] .game-thumbnail').getAttribute('class'), new RegExp(`art-${game}`));
      await page.locator('#nickname').fill('Game launch check');
      await page.locator('.lobby-actions > button').click();
      await page.waitForURL('**/room/**');
      await page.locator('.demo-banner select').selectOption('p2');
      await page.locator('.room-game-card').nth(games.indexOf(game)).click();
      await page.locator('.demo-banner select').selectOption('p1');
      await page.locator('#game-board').waitFor();
      await page.waitForFunction(() => [...document.querySelectorAll('#game-board img')].every(image => image.complete && image.naturalWidth > 0));
      assert.equal(await page.locator('html').getAttribute('lang'), language === 'ko' ? 'ko' : 'es-DO');
      if (game === 'rhythm') {
        await page.locator('.rhythm-game-mount > *').waitFor({ state: 'attached', timeout: 30000 });
        await page.locator('.rhythm-status-dot.is-ready').waitFor({ timeout: 30000 });
        assert.equal((await page.request.get(`${origin}/rhythm/Music14.swf`)).status(), 200);
        assert.equal((await page.request.get(`${origin}/rhythm/Music_RES.swf`)).status(), 200);
      }
      // A fresh document has no in-memory demo room; the deep link must still load its real join screen.
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('.join-card').waitFor();
      checks.push(`${game}/${language}: selected lobby → two-seat agreement → board → direct room reload`);
    }
  }
  await page.goto(`${origin}/feedback`, { waitUntil: 'domcontentloaded' });
  await page.locator('.feedback-route').waitFor();
  checks.push('Direct feedback route loads');
  assert.deepEqual(errors, []);
  assert.deepEqual(failedRequests, []);
  await context.close();
} finally {
  await browser.close();
  console.log(JSON.stringify({ checks, errors, failedRequests }, null, 2));
}

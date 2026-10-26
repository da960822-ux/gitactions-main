import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { launchChromium } from './playwright-browser.mjs';

const out = path.resolve(process.env.PLAYWRIGHT_ARTIFACT_DIR || 'output/playwright/minhwatu-one-click');
await fs.mkdir(out, { recursive: true });
const browser = await launchChromium();
const checks = [];
const errors = [];
async function open(mobile = false) {
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, isMobile: mobile, hasTouch: mobile });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.LANDING_URL || 'http://127.0.0.1:5192/__minhwatu_one_click__');
  await page.evaluate(async () => {
    const [{ fourMinhwatuEngine: engine }, { MinhwatuTeamTable }, React, ReactDOM] = await Promise.all([
      import('/src/games/fourMinhwatu.ts'), import('/src/app/MinhwatuTeamTable.tsx'),
      import('/node_modules/.vite/deps/react.js'), import('/node_modules/.vite/deps/react-dom_client.js'),
    ]);
    document.querySelector('#root')?.setAttribute('hidden', '');
    const host = document.createElement('main'); host.style.cssText = 'width:100%;padding:8px;box-sizing:border-box'; document.body.append(host);
    const root = (ReactDOM.default ?? ReactDOM).createRoot(host);
    const R = React.default ?? React;
    let state, calls = [], failNext = false, holdNext = false, release;
    const render = () => root.render(R.createElement(MinhwatuTeamTable, {
      view: engine.getPlayerView(state, 'p1'), language: 'ko', nickname: '나', roomId: 'qa-minhwatu', runAction: action => {
        calls.push(action);
        if (failNext) { failNext = false; return Promise.resolve(false); }
        if (holdNext) { holdNext = false; return new Promise(resolve => { release = () => { state = engine.applyAction(state, 'p1', action); render(); resolve(true); }; }); }
        state = engine.applyAction(state, 'p1', action); render(); return Promise.resolve(true);
      },
    }));
    window.__teamQa = {
      mount(ambiguous = false) {
        for (let seed = 1; seed < 300; seed++) {
          const candidate = engine.createInitialState(seed), actions = engine.getPlayerView(candidate, 'p1').actions;
          const count = actions.filter(option => option.action.type === 'play' && option.action.payload?.index === 0).length;
          if ((count > 1) === ambiguous) { state = candidate; calls = []; render(); return; }
        }
        throw new Error('No fixture');
      },
      fail() { failNext = true; }, hold() { holdNext = true; }, release() { release?.(); release = undefined; },
      opponent() { state = { ...state, turn: 'p2' }; render(); },
      calls() { return calls; }, hand() { return state.hands.p1.length; }, phase() { return state.phase; },
      actions() { return engine.getPlayerView(state, 'p1').actions; },
    };
    window.__teamQa.mount();
  });
  await page.locator('.mh4-hand-card').first().waitFor();
  return { context, page };
}
try {
  const { context, page } = await open();
  try {
    await page.screenshot({ path: path.join(out, 'team-before.png') });
    await page.evaluate(() => window.__teamQa.hold());
    await page.locator('.mh4-hand-card').first().click();
    await page.waitForFunction(() => window.__teamQa.calls().length === 1);
    assert.equal(await page.locator('.mh4-hand-card').first().isDisabled(), true);
    await page.locator('.mh4-hand-card').first().dispatchEvent('click');
    assert.equal(await page.evaluate(() => window.__teamQa.calls().length), 1);
    checks.push('Four-player first click submits once and disables repeat input while pending');
    await page.evaluate(() => window.__teamQa.release());
    await page.waitForFunction(() => window.__teamQa.hand() === 4);
    assert.equal(await page.locator('.mh4-confirm').count(), 0);
    await page.screenshot({ path: path.join(out, 'team-after.png') });
    checks.push('Four-player hand shrinks after one click with no confirm control');
    await page.evaluate(() => window.__teamQa.mount(true));
    await page.locator('.mh4-hand-card').first().click();
    await page.locator('.mh4-field-card.is-target').first().waitFor();
    assert.equal(await page.evaluate(() => window.__teamQa.calls().length), 0);
    assert.equal(await page.locator('.mh4-field-card.is-target').count(), 2);
    await page.screenshot({ path: path.join(out, 'team-ambiguous.png') });
    await page.locator('.mh4-field-card.is-target').first().focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__teamQa.calls().length === 1);
    checks.push('Ambiguous hand click waits for one board target; Enter submits its legal choice');
    await page.evaluate(() => window.__teamQa.mount());
    await page.locator('.mh4-hand-card').first().focus();
    await page.keyboard.press('Space');
    await page.waitForFunction(() => window.__teamQa.calls().length === 1);
    checks.push('Space activates an unambiguous hand card with one submission');
    await page.evaluate(() => { window.__teamQa.mount(); window.__teamQa.opponent(); });
    assert.equal(await page.locator('.mh4-hand-card').first().isDisabled(), true);
    await page.locator('.mh4-hand-card').first().dispatchEvent('click');
    assert.equal(await page.evaluate(() => window.__teamQa.calls().length), 0);
    checks.push('Opponent turn disables hand cards and ignores synthetic clicks');
  } finally { await context.close(); }
  const mobile = await open(true);
  try {
    const mobileIndex = await mobile.page.evaluate(() => {
      const actions = window.__teamQa.actions();
      return [...document.querySelectorAll('.mh4-hand-card')].findIndex((button, index) => {
        const rect = button.getBoundingClientRect();
        return rect.x >= 0 && rect.right <= innerWidth && actions.filter(option => option.action.type === 'play' && option.action.payload?.index === index).length === 1;
      });
    });
    assert.ok(mobileIndex >= 0);
    await mobile.page.evaluate(() => window.__teamQa.fail());
    await mobile.page.locator('.mh4-hand-card').nth(mobileIndex).tap({ timeout: 5000 });
    await mobile.page.getByRole('alert').waitFor();
    assert.equal(await mobile.page.evaluate(() => window.__teamQa.hand()), 5);
    await mobile.page.locator('.mh4-hand-card').nth(mobileIndex).tap();
    await mobile.page.waitForFunction(() => window.__teamQa.hand() === 4);
    checks.push('Mobile tap reports rejected action and allows the next tap to retry');
    await mobile.page.screenshot({ path: path.join(out, 'team-mobile.png') });
  } finally { await mobile.context.close(); }
} catch (error) { errors.push(error.stack || String(error)); }
finally { await browser.close(); }
const report = { checks, errors, screenshots: ['team-before.png', 'team-after.png', 'team-ambiguous.png', 'team-mobile.png'] };
await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
if (errors.length) process.exitCode = 1;

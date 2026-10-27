import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { launchChromium } from './playwright-browser.mjs';

const baseUrl = process.env.JAIPUR_URL || 'http://127.0.0.1:5191';
const output = path.resolve(process.env.JAIPUR_QA_OUTPUT || 'output/playwright/jaipur-layout-motion');
await fs.mkdir(output, { recursive: true });
const browser = await launchChromium();
const report = { checks: [], screenshots: [], errors: [] };

async function mount(page) {
  await page.goto(baseUrl);
  await page.evaluate(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { JaipurBoard } = await import('/src/app/JaipurBoard.tsx');
    const { jaipurEngine: engine } = await import('/src/games/jaipur.ts');
    document.querySelector('#root')?.remove();
    document.body.style.cssText = 'margin:0;background:#e7d8bf';
    const host = document.createElement('div');
    host.style.cssText = 'width:100%;padding:8px;box-sizing:border-box';
    document.body.append(host);
    const fixture = () => {
      const state = engine.createInitialState(36);
      state.market = ['camel', 'spice', 'silver', 'diamond', 'gold'];
      state.hands.p1 = ['spice', 'spice', 'spice', 'silver', 'silver', 'cloth', 'leather'];
      state.cardIds.market = state.market.map((_, index) => `market-${index}`);
      state.cardIds.hands.p1 = state.hands.p1.map((_, index) => `hand-${index}`);
      state.active = 'p1';
      state.events = Array.from({ length: 6 }, (_, index) => ({ sequence: index + 1, round: 1, type: 'take-single', actor: index % 2 ? 'p2' : 'p1', cards: [{ good: 'spice' }], title: { ko: `${index + 1}번째 거래`, es: `Transacción ${index + 1}` } }));
      return state;
    };
    function Harness() {
      const [state, setState] = React.useState(fixture);
      window.jaipurQA = { reset: () => setState(fixture()), calls: () => window.jaipurQACalls };
      return React.createElement(JaipurBoard, { view: engine.getPlayerView(state, 'p1'), language: 'ko', playerId: 'p1', runAction: async action => {
        window.jaipurQACalls++;
        await new Promise(resolve => setTimeout(resolve, 80));
        if (engine.validateAction(state, 'p1', action)) return false;
        setState(engine.applyAction(state, 'p1', action));
        return true;
      } });
    }
    window.jaipurQACalls = 0;
    createRoot(host).render(React.createElement(Harness));
  });
  await page.locator('.jp-market-card').first().waitFor();
}

const rects = page => page.evaluate(() => {
  const get = selector => { const r = document.querySelector(selector)?.getBoundingClientRect(); return r && { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
  return { board: get('.jaipur-board'), score: get('.jp-scorebar'), history: get('.jp-history-drawer'), historyContent: get('.jp-history-content'), market: get('.jp-market'), hand: get('.jp-hand-cards'), tokens: get('.jp-pile-grid'), controls: get('.jp-market-footer'), art: get('.jp-market-card .jaipur-art'), artFit: document.querySelector('.jp-market-card .jaipur-art')?.getAttribute('preserveAspectRatio'), marketCount: document.querySelectorAll('.jp-market-card').length, handCount: document.querySelectorAll('.jp-hand-card').length, scrollWidth: document.documentElement.scrollWidth };
});
const intersects = (a, b) => a && b && a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;

try {
  for (const [width, height] of [[1280, 800], [1847, 872]]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    await mount(page);
    const closed = await rects(page);
    assert.equal(closed.marketCount, 5);
    assert.equal(closed.handCount, 7);
    assert.equal(closed.artFit, 'xMidYMid meet');
    assert.equal(closed.scrollWidth, width);
    assert(closed.board.bottom <= height, `Closed board exceeds ${height}px viewport`);
    await page.locator('.jp-history-drawer summary').click();
    const opened = await rects(page);
    assert(opened.historyContent.height <= 123);
    for (const key of ['score', 'market', 'hand', 'tokens', 'controls']) assert(!intersects(opened.historyContent, opened[key]), `History overlaps ${key} at ${width}`);
    assert(opened.history.bottom <= opened.market.y);
    assert(opened.board.bottom <= height, `Open board exceeds ${height}px viewport`);
    const screenshot = path.join(output, `${width}x${height}-history.png`);
    await page.screenshot({ path: screenshot, animations: 'disabled' });
    report.screenshots.push(screenshot);
    if (width === 1280) {
      await page.locator('.jp-market-card.is-camel').click();
      const selectedAnimation = await page.locator('.jp-market-card.is-camel').evaluate(card => getComputedStyle(card, '::after').animationName);
      assert.equal(selectedAnimation, 'none', 'Reduced motion must remove the selection pop');
      await page.locator('.jp-take-controls .jp-primary-action').click();
      await page.waitForFunction(() => document.querySelector('.jp-score-seat.is-turn')?.dataset.jaipurPlayerId === 'p2');
      assert.equal(await page.locator('.jaipur-flight').count(), 0, 'Reduced motion must skip card flights');
      report.checks.push({ action: 'reduced motion selection/take', animationName: selectedAnimation, flights: 0 });
      await page.evaluate(() => window.jaipurQA.reset());
      await page.waitForFunction(() => document.querySelector('.jp-score-seat.is-turn')?.dataset.jaipurPlayerId === 'p1');
    }
    await page.locator('.jp-history-drawer summary').click();
    await page.locator('.jp-mode-tabs button').nth(1).click();
    await page.locator('.jp-market-card.is-spice').click();
    await page.locator('.jp-market-card.is-silver').click();
    await page.locator('.jp-hand-card.is-spice').first().click();
    await page.locator('.jp-hand-card.is-silver').first().click();
    const exchange = await rects(page);
    assert(exchange.board.bottom <= height, `Exchange controls exceed ${height}px viewport (${exchange.board.bottom}px)`);
    const exchangeShot = path.join(output, `${width}x${height}-exchange.png`);
    await page.screenshot({ path: exchangeShot, animations: 'disabled' });
    report.screenshots.push(exchangeShot);
    await page.locator('.jp-exchange-controls .jp-cancel-action').click();
    await page.locator('.jp-mode-tabs button').nth(2).click();
    await page.locator('.jp-hand-card.is-spice').first().click();
    await page.getByRole('button', { name: '판매 수량 늘리기' }).click({ clickCount: 2 });
    const sale = await rects(page);
    assert(sale.board.bottom <= height, `Sale controls exceed ${height}px viewport (${sale.board.bottom}px)`);
    const saleShot = path.join(output, `${width}x${height}-sale-preview.png`);
    await page.screenshot({ path: saleShot, animations: 'disabled' });
    report.screenshots.push(saleShot);
    report.checks.push({ viewport: `${width}x${height}`, closed, opened, exchange, sale });
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  await mount(page);
  const reset = async () => { await page.evaluate(() => window.jaipurQA.reset()); await page.locator('.jp-score-seat.is-turn').waitFor(); };
  await page.locator('.jp-market-card.is-camel').click();
  assert.equal(await page.locator('.jp-market-card.is-camel').getAttribute('aria-pressed'), 'true');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.jp-market-card.is-camel').getAttribute('aria-pressed'), 'false');
  await page.locator('.jp-market-card.is-camel').click();
  await page.evaluate(() => { const button = document.querySelector('.jp-take-controls .jp-primary-action'); button.click(); button.click(); });
  await page.waitForFunction(() => document.querySelector('.jp-score-seat.is-turn')?.dataset.jaipurPlayerId === 'p2');
  assert.equal(await page.evaluate(() => window.jaipurQA.calls()), 1);
  await page.locator('.jaipur-flight').first().waitFor({ state: 'visible', timeout: 1000 });
  assert.equal(await page.locator('.jaipur-motion-layer').evaluate(layer => getComputedStyle(layer).pointerEvents), 'none');
  report.checks.push({ action: 'selection/cancel/take', committedCalls: 1 });

  await reset();
  await page.locator('.jp-mode-tabs button').nth(1).click();
  await page.locator('.jp-market-card.is-spice').click();
  await page.locator('.jp-market-card.is-silver').click();
  await page.locator('.jp-hand-card.is-spice').first().click();
  await page.locator('.jp-hand-card.is-silver').first().click();
  assert.equal(await page.locator('.jp-exchange-controls .jp-primary-action').isDisabled(), false);
  await page.evaluate(() => { const button = document.querySelector('.jp-exchange-controls .jp-primary-action'); button.click(); button.click(); });
  await page.waitForFunction(() => document.querySelector('.jp-score-seat.is-turn')?.dataset.jaipurPlayerId === 'p2');
  assert.equal(await page.evaluate(() => window.jaipurQA.calls()), 2);
  await page.locator('.jaipur-flight--card').first().waitFor({ state: 'visible', timeout: 1000 });
  report.checks.push({ action: 'exchange', committedCalls: 1 });

  await reset();
  await page.locator('.jp-mode-tabs button').nth(2).click();
  await page.locator('.jp-hand-card.is-spice').first().click();
  await page.getByRole('button', { name: '판매 수량 늘리기' }).click({ clickCount: 2 });
  assert.equal(await page.locator('.jp-sale-stepper output').innerText(), '3');
  await page.evaluate(() => { const button = document.querySelector('.jp-sale-stepper .jp-primary-action'); button.click(); button.click(); });
  await page.waitForFunction(() => document.querySelector('.jp-score-seat.is-turn')?.dataset.jaipurPlayerId === 'p2');
  assert.equal(await page.evaluate(() => window.jaipurQA.calls()), 3);
  assert(Number(await page.locator('.jp-score-seat.is-you .game-value-number').first().innerText()) > 0);
  assert(Number(await page.locator('.jp-pile.is-spice .game-value-number').first().innerText()) < 7);
  assert.equal(await page.locator('.jp-score-seat.is-you .game-value-delta').count(), 1);
  assert.equal(await page.locator('.jp-pile.is-spice .game-value-delta').count(), 1);
  assert((await page.locator('.jaipur-event-note').count()) <= 1, 'One action may present at most one notice');
  const saleShot = path.join(output, 'sale-complete.png');
  await page.screenshot({ path: saleShot, fullPage: true });
  report.screenshots.push(saleShot);
  report.checks.push({ action: 'sale/tokens/score', committedCalls: 1 });
  await context.close();
  assert.deepEqual(report.errors, []);
  const reportPath = path.join(output, 'report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ reportPath, screenshots: report.screenshots, checks: report.checks.map(check => check.action || check.viewport) }));
} finally {
  await browser.close();
}

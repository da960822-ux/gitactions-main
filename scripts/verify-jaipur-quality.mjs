import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { launchChromium } from './playwright-browser.mjs';

const baseUrl = process.env.JAIPUR_URL || 'http://127.0.0.1:5191';
const output = path.resolve(process.env.PLAYWRIGHT_ARTIFACT_DIR || 'output/playwright/jaipur-quality');
const targetedMobile = process.env.JAIPUR_TARGETED_MOBILE === '1';
await fs.mkdir(output, { recursive: true });

const browser = await launchChromium();
const report = { baseUrl, viewport: '1440x900', browser: 'Chromium', checks: [], errors: [], screenshots: [] };
const check = (name, pass, details = undefined) => report.checks.push({ name, pass: Boolean(pass), ...(details === undefined ? {} : { details }) });

async function createDemoRoom(page, language) {
  await page.goto(`${baseUrl}/play`);
  if (language === 'es') await page.locator('.language-switch button').nth(1).click();
  await page.locator('.pick-item').filter({ hasText: language === 'ko' ? '자이푸르' : 'Jaipur' }).click();
  await page.locator('.lobby-actions > button').first().click();
  const seat = page.locator('.demo-banner select');
  await seat.waitFor();
  await seat.selectOption('p1');
  await page.locator('.jaipur-board').waitFor();
  await page.locator('.jp-market-card').first().waitFor();
  return seat;
}

async function currentBoardBounds(page) {
  return page.locator('.jaipur-board').evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, height: rect.height };
  });
}

async function takeOneTurn(page, seatSelect) {
  const turn = await page.locator('.jp-score-seat.is-turn').getAttribute('data-jaipur-player-id');
  assert(turn === 'p1' || turn === 'p2', 'A current Jaipur turn must be shown');
  await seatSelect.selectOption(turn);
  const singleCards = page.locator('.jp-market-card:not(.is-camel):not(:disabled)');
  const validIndices = await singleCards.evaluateAll(elements => elements.flatMap((element, index) => {
    const prompt = element.querySelector('.jp-card-prompt')?.textContent?.trim() || '';
    return prompt === '가져올 수 없음' || prompt === 'No disponible' ? [] : [index];
  }));
  if (validIndices.length) {
    await singleCards.nth(validIndices[0]).click();
  } else if (await page.locator('.jp-market-card.is-camel:not(:disabled)').count()) {
    await page.locator('.jp-market-card.is-camel:not(:disabled)').first().click();
  } else if (!(await page.locator('.jp-mode-tabs button').nth(1).isDisabled())) {
    await page.locator('.jp-mode-tabs button').nth(1).click();
    await page.locator('.jp-market-card:not(.is-camel):not(:disabled)').nth(0).click();
    await page.locator('.jp-market-card:not(.is-camel):not(:disabled)').nth(1).click();
    await page.locator('.jp-hand-card:not(.is-camel):not(:disabled)').nth(0).click();
    await page.locator('.jp-hand-card:not(.is-camel):not(:disabled)').nth(1).click();
  } else {
    throw new Error(`No single-card, camel, or exchange action is available for ${turn}`);
  }
  const confirm = page.locator('.jp-action-tray .jp-primary-action');
  await confirm.waitFor({ state: 'visible' });
  assert.equal(await confirm.isDisabled(), false, 'A staged legal take must have an enabled confirmation');
  await confirm.click();
  await page.waitForFunction(previous => document.querySelector('.jp-score-seat.is-turn')?.getAttribute('data-jaipur-player-id') !== previous, turn);
  return turn;
}

async function reachSevenCards(page, seatSelect, targetSeat) {
  let turns = 0;
  const handCount = async () => {
    await seatSelect.selectOption(targetSeat);
    return page.locator(`.jp-hand-cards[data-jaipur-player-id="${targetSeat}"] .jp-goods-card`).count();
  };
  while (await handCount() < 7 && turns < 18) {
    await takeOneTurn(page, seatSelect);
    turns++;
  }
  assert.equal(await handCount(), 7, `${targetSeat} should reach the seven-card hand limit`);
  return turns;
}

async function testKo(page) {
  const seatSelect = await createDemoRoom(page, 'ko');
  const candidates = page.locator('.jp-market-card:not(.is-camel):not(:disabled)');
  const validIndices = await candidates.evaluateAll(elements => elements.flatMap((element, index) => {
    const prompt = element.querySelector('.jp-card-prompt')?.textContent?.trim() || '';
    return prompt === '가져올 수 없음' || prompt === 'No disponible' ? [] : [index];
  }));
  assert(validIndices.length > 0, 'The initial market should contain a legal single take');
  const firstLegalCard = candidates.nth(validIndices[0]);
  await firstLegalCard.click();
  assert.equal(await firstLegalCard.getAttribute('aria-pressed'), 'true', 'The market card should stage before confirmation');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelector('.jp-market-card:not(.is-camel):not(:disabled)')?.getAttribute('aria-pressed') === 'false');
  check('Escape cancels staged take selection', true);

  const turns = await reachSevenCards(page, seatSelect, 'p1');
  await seatSelect.selectOption('p1');
  const closedBounds = await currentBoardBounds(page);
  const handCount = await page.locator('.jp-hand-cards[data-jaipur-player-id="p1"] .jp-goods-card').count();
  assert.equal(handCount, 7);
  assert(closedBounds.bottom <= 900, `Seven-card KO board should fit the 900px viewport (${closedBounds.bottom}px)`);
  check('KO Room seven-card hand fits 1440x900', true, { handCount, turns, bounds: closedBounds });

  const drawer = page.locator('.jp-history-drawer');
  assert.equal(await drawer.count(), 1, 'A transaction should reveal the activity drawer');
  await drawer.locator('summary').click();
  const openBounds = await currentBoardBounds(page);
  const drawerSeparation = await page.locator('.jaipur-board').evaluate(board => {
    const history = board.querySelector('.jp-history-content').getBoundingClientRect();
    const zones = ['.jp-scorebar', '.jp-market', '.jp-market-footer', '.jp-hand-cards', '.jp-pile-grid'];
    return zones.every(selector => { const rect = board.querySelector(selector).getBoundingClientRect(); return history.bottom <= rect.top || history.top >= rect.bottom || history.right <= rect.left || history.left >= rect.right; });
  });
  assert(drawerSeparation, 'Opening recent activity must not cover the score or game controls');
  check('Activity drawer has a separate row from scores and controls', true, { closedBounds, openBounds });
  const screenshot = path.join(output, 'room-ko-seven-cards.png');
  await page.screenshot({ path: screenshot, fullPage: true, animations: 'disabled' });
  report.screenshots.push(screenshot);
}

async function testSpanish(page) {
  const seatSelect = await createDemoRoom(page, 'es');
  await seatSelect.selectOption('p1');
  await takeOneTurn(page, seatSelect);
  await seatSelect.selectOption('p2');
  await page.locator('.jp-hand-cards').waitFor();
  assert.equal(await page.locator('.jp-score-seat.is-turn').getAttribute('data-jaipur-player-id'), 'p2');
  const beforeSpanishTurn = await page.locator('.jp-hand-cards[data-jaipur-player-id="p2"] .jp-goods-card').count();
  await takeOneTurn(page, seatSelect);
  const afterSpanishTurn = await page.locator('.jp-hand-cards[data-jaipur-player-id="p2"] .jp-goods-card').count();
  assert.equal(afterSpanishTurn, beforeSpanishTurn + 1, 'The Spanish p2 transaction should add one market card');
  assert.equal(await page.locator('.jp-score-seat.is-turn').getAttribute('data-jaipur-player-id'), 'p1');
  check('Spanish transaction adds a card and passes to p1', true, { beforeSpanishTurn, afterSpanishTurn });
  const turns = await reachSevenCards(page, seatSelect, 'p2');
  await seatSelect.selectOption('p2');
  const bounds = await currentBoardBounds(page);
  const handCount = await page.locator('.jp-hand-cards[data-jaipur-player-id="p2"] .jp-goods-card').count();
  assert.equal(handCount, 7);
  assert(bounds.bottom <= 900, `Seven-card ES board should fit the 900px viewport (${bounds.bottom}px)`);
  check('ES Room reaches a seven-card hand and fits 1440x900', true, { handCount, turns, bounds });

  const screenshot = path.join(output, 'room-es-seven-cards.png');
  await page.screenshot({ path: screenshot, fullPage: true, animations: 'disabled' });
  report.screenshots.push(screenshot);
}

// Local source-module engine fixture, not Supabase/Realtime or a full match.
// Requires the Vite dev server (default localhost:5191); JAIPUR_URL may override it.
async function testMobileSale(language) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  try {
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    await page.goto(baseUrl);
    await page.evaluate(async lang => {
      const { createElement: h, useState } = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const { JaipurBoard } = await import('/src/app/JaipurBoard.tsx');
      const { jaipurEngine: engine } = await import('/src/games/jaipur.ts');
      document.querySelector('#root').remove();
      const host = document.createElement('div');
      host.style.cssText = 'max-width:1240px;margin:229px auto 0;padding:0 16px';
      document.body.append(host);
      function Harness() {
        const [state, setState] = useState(() => {
          const initial = engine.createInitialState(36);
          initial.hands.p1 = ['gold', 'gold', ...Array(5).fill('leather')];
          initial.cardIds.hands.p1 = initial.hands.p1.map((_, index) => `mobile-sale-${index}`);
          return initial;
        });
        return h(JaipurBoard, { view: engine.getPlayerView(state, 'p1'), language: lang, playerId: 'p1', desktopDisplay: false, runAction: async action => {
          const error = engine.validateAction(state, 'p1', action);
          if (error) throw Error(error);
          setState(engine.applyAction(state, 'p1', action));
          return true;
        } });
      }
      createRoot(host).render(h(Harness));
    }, language);
    await page.locator('.jp-hand-card').first().waitFor();
    await page.locator('.jp-mode-tabs button').nth(2).tap();
    await page.locator('.jp-hand-card.is-leather').last().tap();
    const increase = page.getByRole('button', { name: language === 'ko' ? '판매 수량 늘리기' : 'Aumentar cantidad', exact: true });
    // No force: a cancel button intercepting this tap is the regression being checked.
    await increase.tap();
    assert.equal(await page.locator('.jp-sale-stepper output').innerText(), '2');
    await page.locator('.jp-sale-stepper .jp-cancel-action').tap();
    assert.equal(await page.locator('.jp-hand-card.is-selected').count(), 0);
    await page.locator('.jp-mode-tabs button').nth(2).tap();
    await page.locator('.jp-hand-card.is-leather').last().tap();
    for (let count = 1; count < 5; count++) await increase.tap();
    assert.equal(await page.locator('.jp-sale-stepper output').innerText(), '5');
    const details = await page.locator('.jp-sale-stepper').evaluate(element => ({
      trayHeight: element.closest('.jp-action-tray').getBoundingClientRect().height,
      controls: [...element.querySelectorAll('button')].map(button => {
        const rect = button.getBoundingClientRect();
        return { name: button.getAttribute('aria-label') || button.innerText, width: rect.width, height: rect.height };
      }),
      documentWidth: document.documentElement.scrollWidth,
      cancelLabelFits: (() => {
        const cancel = element.querySelector('.jp-cancel-action'), rect = cancel.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(cancel);
        const label = range.getBoundingClientRect();
        return label.left >= rect.left && label.right <= rect.right && label.top >= rect.top && label.bottom <= rect.bottom;
      })(),
    }));
    assert(details.controls.every(control => control.width >= 44 && control.height >= 44), 'Sale controls must retain 44px targets');
    assert(details.trayHeight < 200, `Compact mobile sale tray must stay below 200px (${details.trayHeight}px)`);
    assert.equal(details.documentWidth, 390);
    assert(details.cancelLabelFits, 'Localized cancel text must fit its visible button');
    check(`${language} mobile sale + tap, cancel and 44px targets`, true, details);
    const screenshot = path.join(output, `mobile-${language}-sale-five.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    report.screenshots.push(screenshot);
  } finally {
    await context.close();
  }
}

const contexts = await Promise.all([browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', locale: 'ko-KR' }), browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', locale: 'es-DO' })]);
const pages = await Promise.all(contexts.map(context => context.newPage()));
for (const page of pages) page.on('pageerror', error => report.errors.push(error.message));

try {
  if (!targetedMobile) {
    await testKo(pages[0]);
    await testSpanish(pages[1]);
  }
  await testMobileSale('ko');
  await testMobileSale('es');
  assert.deepEqual(report.errors, [], 'Browser should report no uncaught JavaScript errors');
  check('No uncaught browser errors', true);
  const reportPath = path.join(output, 'report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ summary: report.checks, errors: report.errors, screenshots: report.screenshots, reportPath }, null, 2));
} finally {
  await browser.close();
}

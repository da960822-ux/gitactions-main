import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { launchChromium } from './playwright-browser.mjs';

const baseUrl = process.env.JAIPUR_URL || 'http://127.0.0.1:5191';
const output = path.resolve(process.env.PLAYWRIGHT_ARTIFACT_DIR || 'output/playwright/jaipur-quality');
await fs.mkdir(output, { recursive: true });

const browser = await launchChromium();
const report = { baseUrl, viewport: '1440x900', browser: 'Chromium', checks: [], errors: [], screenshots: [] };
const check = (name, pass, details = undefined) => report.checks.push({ name, pass: Boolean(pass), ...(details === undefined ? {} : { details }) });

async function createDemoRoom(page, firstSeat, language) {
  await page.goto(`${baseUrl}/play`);
  await page.locator('#nickname').fill('Jaipur quality check');
  await page.locator('.lobby-actions > button').click();
  const seat = page.locator('.demo-banner select');
  await seat.waitFor();
  const choose = async player => {
    const label = player === 'p1' ? '자이푸르' : 'Jaipur';
    await page.locator('.room-game-card').filter({ hasText: label }).click();
  };
  await seat.selectOption(firstSeat);
  await choose(firstSeat);
  await page.locator('.pending-choice').waitFor();
  const other = firstSeat === 'p1' ? 'p2' : 'p1';
  await seat.selectOption(other);
  await choose(other);
  await page.locator('.jaipur-board').waitFor();
  await page.waitForFunction(expected => document.querySelector('.jaipur-board')?.innerText.includes(expected), language === 'ko' ? '시장' : 'Mercado');
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
  const seatSelect = await createDemoRoom(page, 'p2', 'ko');
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
  assert(Math.abs(openBounds.height - closedBounds.height) < 1, 'Opening recent activity should preserve board height');
  check('Activity drawer opens without changing board height', true, { closedBounds, openBounds });
  const screenshot = path.join(output, 'room-ko-seven-cards.png');
  await page.screenshot({ path: screenshot, fullPage: true, animations: 'disabled' });
  report.screenshots.push(screenshot);
}

async function testSpanish(page) {
  const seatSelect = await createDemoRoom(page, 'p1', 'es');
  await seatSelect.selectOption('p1');
  await takeOneTurn(page, seatSelect);
  await seatSelect.selectOption('p2');
  await page.waitForFunction(() => document.querySelector('.jaipur-board')?.innerText.includes('Tu mano'));
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

const contexts = await Promise.all([browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', locale: 'ko-KR' }), browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', locale: 'es-DO' })]);
const pages = await Promise.all(contexts.map(context => context.newPage()));
for (const page of pages) page.on('pageerror', error => report.errors.push(error.message));

try {
  await testKo(pages[0]);
  await testSpanish(pages[1]);
  assert.deepEqual(report.errors, [], 'Browser should report no uncaught JavaScript errors');
  check('No uncaught browser errors', true);
  const reportPath = path.join(output, 'report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ summary: report.checks, errors: report.errors, screenshots: report.screenshots, reportPath }, null, 2));
} finally {
  await browser.close();
}

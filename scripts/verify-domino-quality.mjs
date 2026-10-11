import fs from 'node:fs/promises';
import path from 'node:path';
import { launchChromium } from './playwright-browser.mjs';

const baseUrl = process.env.DOMINO_URL || 'http://127.0.0.1:5191/';
const output = path.resolve(process.env.PLAYWRIGHT_ARTIFACT_DIR || 'output/playwright/domino-quality');
const browser = await launchChromium();
const report = {
  baseUrl,
  browser: 'Chromium',
  viewport: { width: 1152, height: 720, note: '125% desktop zoom equivalent' },
  checks: [],
  errors: [],
  screenshots: [],
};
const check = (name, pass, details = undefined) => report.checks.push({ name, pass: Boolean(pass), ...(details === undefined ? {} : { details }) });
const page = await browser.newPage({ viewport: { width: 1152, height: 720 }, deviceScaleFactor: 1 });
page.on('pageerror', error => report.errors.push(error.message));
page.on('dialog', dialog => void dialog.dismiss());

async function waitRoom() {
  await page.waitForSelector('.domino-premium', { timeout: 20_000 });
}

async function setSeat(seat) {
  const selector = page.locator('select[aria-label="내 데모 좌석"], select[aria-label="Mi asiento de demo"]');
  if (await selector.count()) {
    await selector.selectOption(seat);
    await page.waitForTimeout(80);
  }
}

async function configurePartners() {
  const launcher = page.locator('.dp-settings-launcher');
  if (!(await launcher.count())) return;
  await launcher.click();
  await page.waitForSelector('.dp-setup-dialog');
  const selects = page.locator('.dp-config-grid select');
  await selects.nth(0).selectOption('partners');
  await selects.nth(2).selectOption('200');
  await page.locator('.dp-primary').click();
  await page.waitForFunction(() => document.querySelector('.dp-setup-dialog') === null);
}

async function waitForHumanTurn() {
  await page.waitForFunction(() => {
    const result = document.querySelector('.dp-round-result');
    const turn = document.querySelector('[data-domino-seat][aria-current="step"]')?.getAttribute('data-domino-seat');
    return Boolean(result) || turn === 'p1' || turn === 'p2';
  }, null, { timeout: 15_000 });
  const result = await page.locator('.dp-round-result').count();
  if (result) return null;
  return await page.locator('[data-domino-seat][aria-current="step"]').getAttribute('data-domino-seat');
}

async function playOneHumanTurn() {
  const turn = await waitForHumanTurn();
  if (!turn) return false;
  await setSeat(turn);
  await page.waitForFunction(seat => document.querySelector('.domino-premium')?.getAttribute('data-mode') === 'partners'
    && document.querySelector('[data-domino-seat][aria-current="step"]')?.getAttribute('data-domino-seat') === seat, turn, { timeout: 5000 });

  const openingButton = page.locator('.dp-start-target');
  if (await page.locator('.dp-chain [data-sequence]').count() === 0) {
    if (!(await openingButton.count())) await page.locator('.dp-hand-tile:not(:disabled)').first().click();
    await openingButton.waitFor({ state: 'visible' });
    await openingButton.click();
    return true;
  }
  if (await openingButton.count()) {
    const handTile = page.locator('.dp-hand-tile:not(:disabled)').first();
    await handTile.click();
    await openingButton.waitFor({ state: 'visible' });
    await openingButton.click();
    return true;
  }

  const enabledHand = page.locator('.dp-hand-tile:not(:disabled)');
  if (!(await enabledHand.count())) {
    const pass = page.locator('.dp-pass:not(:disabled)');
    if (await pass.count()) await pass.click();
    else throw new Error(`No legal play or pass control for active seat ${turn}`);
    return true;
  }

  await enabledHand.first().click();
  const endpoint = page.locator('.dp-end-target:not(:disabled)').first();
  await endpoint.waitFor({ state: 'visible' });
  await endpoint.click();
  return true;
}

try {
  const origin = new URL(baseUrl);
  await page.goto(new URL('/play?game=domino', origin).href, { waitUntil: 'domcontentloaded' });
  await page.locator('#nickname').fill('Quality check');
  await page.getByRole('button', { name: /도미노 방 만들기|Crear partida: Dominó/ }).click();
  await page.waitForURL(/\/room\//, { timeout: 15_000 });

  // Match the demo game choice from both local seats.
  await page.waitForSelector('.demo-banner select');
  await page.getByRole('button', { name: /도미노|Dominó/ }).first().click();
  await setSeat('p2');
  await page.getByRole('button', { name: /도미노|Dominó/ }).first().click();
  await setSeat('p1');
  await waitRoom();
  await configurePartners();
  await page.waitForFunction(() => document.querySelector('.domino-premium')?.getAttribute('data-mode') === 'partners');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(50);

  const initialMetrics = await page.evaluate(() => {
    const rect = selector => {
      const value = document.querySelector(selector)?.getBoundingClientRect();
      return value && { top: Math.round(value.top), bottom: Math.round(value.bottom), left: Math.round(value.left), right: Math.round(value.right) };
    };
    const table = document.querySelector('.dp-table')?.getBoundingClientRect();
    const board = document.querySelector('.domino-premium')?.getBoundingClientRect();
    return {
      viewport: { width: innerWidth, height: innerHeight },
      table: table && { top: Math.round(table.top), bottom: Math.round(table.bottom), left: Math.round(table.left), right: Math.round(table.right) },
      board: board && { left: Math.round(board.left), right: Math.round(board.right) },
      roomMain: rect('.room-main'),
      roomHeading: rect('.room-heading'),
      hand: rect('.dp-hand'),
      documentWidth: document.documentElement.scrollWidth,
      visibleHandButtons: [...document.querySelectorAll('.dp-hand-tile')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0; }).length,
    };
  });
  check('1152×720 desktop-zoom-equivalent table stays within viewport width', initialMetrics.table?.left >= 0 && initialMetrics.table?.right <= 1152, initialMetrics);
  check('1152×720 desktop-zoom-equivalent table has no horizontal clipping', initialMetrics.documentWidth <= 1152 && initialMetrics.table?.right <= 1152, initialMetrics);
  await fs.mkdir(output, { recursive: true });
  const topScreenshot = path.join(output, 'domino-desktop-1152x720-top.png');
  await page.screenshot({ path: topScreenshot, animations: 'disabled' });
  report.screenshots.push(topScreenshot);
  await page.locator('.dp-hand').scrollIntoViewIfNeeded();
  const handVisibleAfterScroll = await page.evaluate(() => {
    const hand = document.querySelector('.dp-hand')?.getBoundingClientRect();
    return Boolean(hand && hand.height > 0 && hand.top < innerHeight && hand.bottom > 0);
  });
  check('hand controls are reachable by vertical scroll at 1152×720', handVisibleAfterScroll, await page.evaluate(() => ({ scrollY, viewport: { width: innerWidth, height: innerHeight }, hand: (() => { const r = document.querySelector('.dp-hand')?.getBoundingClientRect(); return r && { top: Math.round(r.top), bottom: Math.round(r.bottom) }; })() })));
  const startScreenshot = path.join(output, 'domino-desktop-1152x720-table.png');
  await page.screenshot({ path: startScreenshot, animations: 'disabled' });
  report.screenshots.push(startScreenshot);

  // Wait through passes/bot turns until a human has a legal end to confirm.
  let duplicateMetrics = null;
  for (let step = 0; step < 30 && !duplicateMetrics; step++) {
    const turn = await waitForHumanTurn();
    if (!turn) break;
    await setSeat(turn);
    const opening = page.locator('.dp-start-target');
    if (await page.locator('.dp-chain [data-sequence]').count() === 0) {
      if (!(await opening.count())) await page.locator('.dp-hand-tile:not(:disabled)').first().click();
      await opening.waitFor({ state: 'visible' });
      await opening.click();
      continue;
    }
    if (await opening.count()) {
      await page.locator('.dp-hand-tile:not(:disabled)').first().click();
      await opening.click();
      continue;
    }
    const playable = page.locator('.dp-hand-tile:not(:disabled)');
    if (!(await playable.count())) {
      await page.locator('.dp-pass:not(:disabled)').click();
      continue;
    }
    await playable.first().click();
    await page.keyboard.press('Escape');
    const selectedAfterEscape = await page.locator('.dp-hand-tile.is-selected').count();
    check('Escape cancels selected tile after scrolling to hand', selectedAfterEscape === 0, { selectedAfterEscape });
    await playable.first().click();
    const end = page.locator('.dp-end-target:not(:disabled)').first();
    await end.waitFor({ state: 'visible' });
    await end.focus();
    const before = await page.locator('.dp-chain [data-sequence]').count();
    const actorSelector = `.dp-chain [data-domino-actor="${turn}"]`;
    const actorBefore = await page.locator(actorSelector).count();
    await page.keyboard.down('Enter');
    await page.waitForTimeout(35);
    await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    await page.waitForFunction(({ selector, previous }) => document.querySelectorAll(selector).length > previous, { selector: actorSelector, previous: actorBefore }, { timeout: 5000 });
    const after = await page.locator('.dp-chain [data-sequence]').count();
    const actorAfter = await page.locator(actorSelector).count();
    duplicateMetrics = { actor: turn, before, after, actorBefore, actorAfter, selectedAfterEscape };
  }
  check('repeated Enter keydown produces one human play', duplicateMetrics?.actorAfter === duplicateMetrics?.actorBefore + 1, duplicateMetrics);

  // Exercise a narrow resize and return to the target desktop-equivalent viewport.
  await page.setViewportSize({ width: 1024, height: 640 });
  await page.waitForTimeout(100);
  const resized = await page.evaluate(() => {
    const table = document.querySelector('.dp-table')?.getBoundingClientRect();
    return { viewport: { width: innerWidth, height: innerHeight }, table: table && { left: Math.round(table.left), right: Math.round(table.right), top: Math.round(table.top), bottom: Math.round(table.bottom) }, scrollWidth: document.documentElement.scrollWidth };
  });
  check('resize to 1024×640 keeps table inside viewport width', resized.table?.left >= 0 && resized.table?.right <= 1024 && resized.scrollWidth <= 1024, resized);
  const resizeScreenshot = path.join(output, 'domino-resize-1024x640.png');
  await page.screenshot({ path: resizeScreenshot, animations: 'disabled' });
  report.screenshots.push(resizeScreenshot);
  await page.setViewportSize({ width: 1152, height: 720 });

  let humanTurns = 0;
  for (let step = 0; step < 100; step++) {
    if (await page.locator('.dp-round-result').count()) break;
    const didPlay = await playOneHumanTurn();
    if (didPlay) humanTurns++;
    await page.waitForTimeout(25);
  }
  await page.waitForSelector('.dp-round-result', { timeout: 15_000 });
  const roundResult = await page.locator('.dp-round-result').innerText();
  const resultMetrics = await page.evaluate(() => ({
    round: document.querySelector('.dp-round-chip b')?.textContent ?? '',
    publicChainTiles: document.querySelectorAll('.dp-chain [data-sequence]').length,
    revealedSeatCount: document.querySelectorAll('[data-domino-revealed-seat]').length,
    revealedPublicTileCount: [...document.querySelectorAll('[data-domino-revealed-seat]')].reduce((total, rack) => total + rack.querySelectorAll('[data-domino-a][data-domino-b]').length, 0),
    pageErrors: [],
  }));
  check('actual demo round reaches settlement', true, roundResult.slice(0, 180));
  check('all revealed public hands are rendered at round end', resultMetrics.revealedSeatCount === 4 && resultMetrics.publicChainTiles + resultMetrics.revealedPublicTileCount === 28, resultMetrics);
  report.round = { humanTurns, resultMetrics };
  const resultScreenshot = path.join(output, 'domino-round-result-1152x720.png');
  await page.screenshot({ path: resultScreenshot, fullPage: true, animations: 'disabled' });
  report.screenshots.push(resultScreenshot);

  await setSeat('p1');
  await page.locator('.dp-round-result .dp-primary').click();
  await page.waitForFunction(() => Number(document.querySelector('.dp-round-chip b')?.textContent) === 2, null, { timeout: 10_000 });
  const nextRoundMetrics = await page.evaluate(() => ({
    round: document.querySelector('.dp-round-chip b')?.textContent ?? '',
    scores: [...document.querySelectorAll('.dp-score-number')].map(el => el.textContent?.trim()),
    tableWidth: Math.round(document.querySelector('.dp-table')?.getBoundingClientRect().width ?? 0),
  }));
  check('accumulated-score next round remains interactive after resize', nextRoundMetrics.round === '2' && nextRoundMetrics.tableWidth > 0, nextRoundMetrics);
  const nextRoundScreenshot = path.join(output, 'domino-next-round-1152x720.png');
  await page.screenshot({ path: nextRoundScreenshot, animations: 'disabled' });
  report.screenshots.push(nextRoundScreenshot);
} catch (error) {
  report.errors.push(String(error?.stack ?? error));
} finally {
  await browser.close();
}

report.summary = {
  total: report.checks.length,
  passed: report.checks.filter(item => item.pass).length,
  failed: report.checks.filter(item => !item.pass).length,
};
await fs.mkdir(output, { recursive: true });
await fs.writeFile(path.join(output, 'domino-quality.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ summary: report.summary, failed: report.checks.filter(item => !item.pass), errors: report.errors, screenshots: report.screenshots }, null, 2));
if (report.errors.length || report.summary.failed) process.exitCode = 1;

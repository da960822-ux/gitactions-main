// UI-only play against the local SQL/RLS/authority fixture. No game-state writes or API moves.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { launchChromium } from './playwright-browser.mjs';

const game = process.argv[2] || process.env.CAPTURE_GAME || 'domino';
const baseUrl = process.env.LIVE_PLAY_URL || 'http://127.0.0.1:5192';
// Match the exact URL used by Vite's UI, including any HMR timestamp. A bare import
// can instantiate a second, empty client and cannot refresh the UI's real snapshot.
const transformedPlayApp = await (await fetch(`${baseUrl}/src/app/PlayApp.tsx`)).text();
const clientModuleUrl = transformedPlayApp.match(/import\("([^"\n]*\/core\/client\.ts[^"\n]*)"\)/)?.[1];
assert.ok(clientModuleUrl, 'The running Vite app must expose its actual client module URL for authorized read refreshes.');
const originalOutput = path.resolve('docs/screenshots/live-play-2026-10-11');
// Permanent documentation captures are opt-in. Ordinary runs get a fresh ignored
// directory so a developer cannot accidentally replace delivered evidence.
const output = path.resolve(process.env.LIVE_PLAY_ARTIFACT_DIR || path.join('output/playwright/live-captures', String(Date.now()), game));
assert.notEqual(output, originalOutput, 'The delivered original photos and JSON must never be overwritten.');
const fixesRoot = path.join(originalOutput, 'after-fixes');
const afterFixes = output === fixesRoot || output.startsWith(`${fixesRoot}${path.sep}`);
const diagnoseEsPiles = process.argv.includes('--diagnose-jaipur-es-piles');
if (diagnoseEsPiles) assert.equal(game, 'jaipur');
assert.ok(['domino', 'jaipur', 'splendor'].includes(game), 'Only Domino, Jaipur and Splendor are in scope.');
// The Splendor branch is prepared without starting a browser or room. Use this flag
// only after the coordinator has explicitly approved the next actual game.
if (game === 'splendor') assert.ok(process.argv.includes('--start-authorized'), 'Wait for the explicit Splendor start instruction.');
const gameNames = { domino: ['도미노', 'Dominó'], jaipur: ['자이푸르', 'Jaipur'], splendor: ['스플렌더', 'Splendor'] }[game];
await fs.mkdir(output, { recursive: true });
for (const language of ['ko', 'es']) assert.equal(await fs.access(path.join(output, `${game}-${language}.png`)).then(() => true, () => false), false, 'Preserve an existing successful capture; use a new artifact directory for another run.');
const browser = await launchChromium();
const contexts = await Promise.all([browser.newContext({ viewport: { width: 1440, height: 900 } }), browser.newContext({ viewport: { width: 1440, height: 900 } })]);
const pages = await Promise.all(contexts.map(context => context.newPage()));
const strategies = { domino: 'Own hand and public ends only; prioritize heavy doubles and shedding pips while keeping own remaining connections.', jaipur: 'Own hand and public market/token tops only; collect matching groups, improve the hand through favorable exchanges, sell precious goods in pairs and ordinary goods in bonus groups, make room before the seven-card limit.', splendor: 'Own tokens, discounts and own reservations plus public face-up cards and nobles only; develop affordable permanent discounts, then target prestige cards, choose useful gem combinations, return surplus above ten, reserve a near-affordable public prestige card when gold helps complete it.' };
const report = { game, baseUrl, viewport: { width: 1440, height: 900 }, independentContexts: 2, strategy: strategies[game], attempts: [], errors: [], screenshots: [], limits: ['Local PGlite SQL/RLS/authority fixture, not deployed Supabase or physical devices.', 'The fixture has no Realtime; reconnectRoom explicitly refreshes read snapshots after UI actions.', 'Screenshots intentionally show the requesting player’s own hand; no opponent private hand is used to choose moves.'] };
report.uiChecks = [];
report.trace = [];
for (const [index, page] of pages.entries()) {
  page.setDefaultTimeout(10_000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('response', async response => {
    const endpoint = new URL(response.url()).pathname;
    if (!['/rest/v1/rpc/room_snapshot', '/functions/v1/action'].includes(endpoint)) return;
    const body = await response.json().catch(() => null);
    report.trace.push({ page: index + 1, endpoint, status: response.status(), version: body?.room?.version ?? body?.version, seat: body?.seat, game: body?.room?.game_id, pending: body?.room?.pending_game, members: body?.members?.map(member => member.seat), empty: body === null, error: response.ok() ? undefined : body?.message });
  });
}

// This is the only non-UI operation: the explicitly authorized read-only fixture refresh.
async function refresh(page) {
  await page.evaluate(async moduleUrl => { await (await import(moduleUrl)).client.reconnectRoom(); }, clientModuleUrl);
}
async function readPublic(page) {
  return page.evaluate(async moduleUrl => {
    const snapshot = (await import(moduleUrl)).client.getSnapshot();
    const view = snapshot.view;
    const board = view?.board;
    return { room: snapshot.roomId, error: snapshot.error, pending: snapshot.pendingGame, version: snapshot.version, player: snapshot.playerId, mode: snapshot.mode, game: snapshot.gameId, phase: view?.phase, turn: view?.turn, chain: board?.tiles, ends: board?.ends, counts: board?.counts, publicJaipur: snapshot.gameId === 'jaipur' ? { market: board?.marketCards, deckCount: board?.deckCount, round: board?.round, tokens: board?.tokens, piles: board?.piles, herds: board?.herdCounts, wins: board?.roundsWon, bonusCounts: board?.bonusTileCounts } : undefined, publicSplendor: snapshot.gameId === 'splendor' ? { bank: board?.bank, market: board?.market, score: board?.score, bonuses: board?.ownedBonuses, nobles: board?.nobles, ownedNobles: board?.ownedNobles, turns: board?.turns } : undefined, language: document.documentElement.lang, leakedPrivateMap: !!view?.hands || !!view?.seed || !!view?.deck || !!board?.reservedOpponent || !!board?.opponentReserved || !!board?.revealedHands && view?.phase === 'play' };
  }, clientModuleUrl);
}

async function captureEvidence(page, language, state) {
  const file = path.join(output, `${game}-${language}-${state}.png`);
  await page.locator('#game-board').screenshot({ path: file, animations: 'disabled', scale: 'css' });
  report.screenshots.push({ language, state, path: file, element: '#game-board' });
}

async function checkJaipurBonusLabels(page, language, state) {
  const rows = await page.locator('.jp-bonus-stack > span > b').evaluateAll(nodes => nodes.map(node => {
    const rect = node.getBoundingClientRect(), style = getComputedStyle(node);
    return { text: node.textContent.trim(), display: style.display, visibility: style.visibility, width: rect.width, height: rect.height, visible: style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0 };
  }));
  report.uiChecks.push({ type: 'bonus-group-labels', language, state, rows });
  assert.deepEqual(rows.map(row => row.text), ['3', '4', '5+']);
  assert.ok(rows.every(row => row.visible), 'Every sale bonus group must show its 3/4/5+ label.');
}

async function checkJaipurPiles(page, language, state) {
  const rows = await page.evaluate(() => [...document.querySelectorAll('.jp-pile')].map(pile => {
    const cell = pile.getBoundingClientRect(), label = pile.querySelector('.jp-pile-next-label'), value = pile.querySelector('.jp-pile-next-value');
    const visible = node => !!node && getComputedStyle(node).display !== 'none' && node.getBoundingClientRect().width > 0;
    const inside = node => { if (!node) return null; const rect = node.getBoundingClientRect(); return rect.left >= cell.left - .5 && rect.right <= cell.right + .5 && rect.top >= cell.top - .5 && rect.bottom <= cell.bottom + .5; };
    const range = document.createRange(); range.selectNodeContents(label); const text = range.getBoundingClientRect();
    const coin = value?.querySelector('svg'), amount = value?.querySelector('b');
    const rawRect = node => { if (!node) return null; const rect = node.getBoundingClientRect(); return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height }; };
    return { good: pile.querySelector('.jp-pile-name')?.textContent, label: label.textContent, value: amount?.textContent, cellRect: rawRect(pile), labelRect: rawRect(label), valueRect: rawRect(value), coinRect: rawRect(coin), amountRect: rawRect(amount), labelFont: getComputedStyle(label).fontSize, labelVisible: visible(label), valueVisible: visible(value), labelInsideCell: inside(label), labelTextInsideCell: text.left >= cell.left - .5 && text.right <= cell.right + .5, valueInsideCell: inside(value), coinValueGap: coin && amount ? amount.getBoundingClientRect().left - coin.getBoundingClientRect().right : null };
  }));
  report.uiChecks.push({ type: 'token-cell-content', language, state, rows });
  if (diagnoseEsPiles) await captureEvidence(page, language, 'mobile-pile-diagnostic');
  assert.equal(rows.length, 6);
  for (const row of rows.filter(row => row.value !== undefined)) {
    assert.equal(row.valueVisible, true, 'The next token value must remain visible.');
    assert.equal(row.valueInsideCell, true, 'Coin and token value must fit in their own cell.');
    assert.ok(row.coinValueGap >= 1, 'Coin and token value require a visible gap.');
    if (state === 'mobile') {
      assert.equal(row.labelVisible, true); assert.equal(row.labelInsideCell, true); assert.equal(row.labelTextInsideCell, true);
      assert.equal(row.label, language === 'ko' ? '다음' : 'Siguiente:');
    }
  }
}

async function checkJaipurSale(page, language) {
  if (diagnoseEsPiles && language !== 'es') return;
  if (!afterFixes || report.uiChecks.some(check => check.type === 'sale-tray' && check.language === language)) return;
  const metrics = await page.evaluate(() => {
    const tray = document.querySelector('.jp-sale-controls'), cards = document.querySelector('.jp-hand-cards'), hand = document.querySelector('.jp-player-hand');
    const trayRect = tray.getBoundingClientRect(), cardsRect = cards.getBoundingClientRect();
    return { trayInsideOwnHand: hand.contains(tray), gapBelowHand: trayRect.top - cardsRect.bottom, horizontalOverflow: document.documentElement.scrollWidth > innerWidth };
  });
  assert.equal(metrics.trayInsideOwnHand, true);
  assert.ok(metrics.gapBelowHand >= -1 && metrics.gapBelowHand <= 24, 'The sale confirmation must sit beside the selected own goods.');
  assert.equal(metrics.horizontalOverflow, false);
  report.uiChecks.push({ type: 'sale-tray', language, ...metrics });
  await captureEvidence(page, language, 'sale');
  const before = await readPublic(page), desktopViewport = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  const mobileMetrics = await page.evaluate(() => ({ horizontalOverflow: document.documentElement.scrollWidth > innerWidth, selectedSaleCount: document.querySelector('.jp-sale-stepper output')?.textContent, saleTrayInsideOwnHand: !!document.querySelector('.jp-player-hand > .jp-sale-controls') }));
  assert.equal(mobileMetrics.horizontalOverflow, false);
  assert.equal(mobileMetrics.saleTrayInsideOwnHand, true);
  await checkJaipurPiles(page, language, 'mobile');
  await checkJaipurBonusLabels(page, language, 'mobile-sale');
  if (diagnoseEsPiles) { const complete = new Error('Read-only mobile pile diagnosis finished.'); complete.name = 'DiagnosisComplete'; throw complete; }
  const mobileFile = path.join(output, `jaipur-mobile-${language}.png`);
  await page.locator('#game-board').screenshot({ path: mobileFile, animations: 'disabled', scale: 'css' });
  report.screenshots.push({ language, state: 'mobile-sale', path: mobileFile, viewport: { width: 390, height: 844 }, element: '#game-board' });
  await page.setViewportSize(desktopViewport);
  await page.waitForTimeout(150);
  assert.equal((await readPublic(page)).version, before.version, 'Responsive sale inspection must not submit an action.');
  report.uiChecks.push({ type: 'mobile-sale', language, ...mobileMetrics, versionUnchanged: true });
}

async function checkJaipurBonusRefresh(page, language) {
  if (!afterFixes || report.uiChecks.some(check => check.type === 'old-bonus-refresh' && check.language === language)) return;
  const freshNotice = page.locator('.jaipur-event-note.is-bonus');
  const wasVisible = await freshNotice.isVisible();
  if (!wasVisible) return;
  await captureEvidence(page, language, 'bonus');
  const desktopViewport = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(120);
  const mobileNotice = await page.evaluate(() => {
    const board = document.querySelector('.jaipur-board'), notice = document.querySelector('.jaipur-event-note.is-bonus'), pill = document.querySelector('.jp-round-pill');
    const root = board.getBoundingClientRect(), rect = notice?.getBoundingClientRect(), round = pill.getBoundingClientRect();
    return { viewportWidth: innerWidth, columns: getComputedStyle(board).gridTemplateColumns, freshBonusVisible: !!rect && rect.width > 0, noticeInsideBoard: !!rect && rect.left >= root.left - .5 && rect.right <= root.right + .5, roundOverlapped: !!rect && Math.min(rect.right, round.right) > Math.max(rect.left, round.left) && Math.min(rect.bottom, round.bottom) > Math.max(rect.top, round.top), horizontalOverflow: document.documentElement.scrollWidth > innerWidth };
  });
  assert.equal(mobileNotice.viewportWidth, 390); assert.equal(mobileNotice.columns.trim().split(/\s+/).length, 1);
  assert.equal(mobileNotice.freshBonusVisible, true); assert.equal(mobileNotice.noticeInsideBoard, true); assert.equal(mobileNotice.roundOverlapped, false); assert.equal(mobileNotice.horizontalOverflow, false);
  await captureEvidence(page, language, 'mobile-bonus');
  report.uiChecks.push({ type: 'fresh-mobile-bonus', language, ...mobileNotice });
  await page.setViewportSize(desktopViewport);
  await page.waitForTimeout(120);
  await refresh(page);
  await page.waitForTimeout(150);
  const oldNotices = await page.locator('.jaipur-event-note.is-bonus').count(), flights = await page.locator('.jaipur-flight').count();
  assert.equal(oldNotices, 0, 'Snapshot resync must not re-present the old bonus notice.');
  assert.equal(flights, 0);
  report.uiChecks.push({ type: 'old-bonus-refresh', language, freshBonusWasVisible: true, oldNoticesAfterRefresh: oldNotices, flightsAfterRefresh: flights });
}

async function checkFinalUI(page, language) {
  if (!afterFixes) return;
  const metrics = await page.evaluate(gameId => {
    const visible = node => { const rect = node.getBoundingClientRect(); return getComputedStyle(node).display !== 'none' && rect.width > 0 && rect.height > 0; };
    const result = { horizontalOverflow: document.documentElement.scrollWidth > innerWidth };
    if (gameId === 'jaipur') {
      const pill = document.querySelector('.jp-round-pill'), rect = pill.getBoundingClientRect();
      return { ...result, roundPillVisible: visible(pill), roundLabel: pill.textContent, overlappedByNotice: [...document.querySelectorAll('.jaipur-event-note')].some(node => { const other = node.getBoundingClientRect(); return Math.min(rect.right, other.right) > Math.max(rect.left, other.left) && Math.min(rect.bottom, other.bottom) > Math.max(rect.top, other.top); }), oldBonusNotices: document.querySelectorAll('.jaipur-event-note.is-bonus').length };
    }
    if (gameId === 'splendor') {
      const chips = [...document.querySelectorAll('.sp-card-cost-chip')];
      const cards = [...document.querySelectorAll('.sp-market .sp-card')], icons = chips.map(node => node.querySelector('.sp-gem-icon'));
      return { ...result, publicCardCount: cards.length, visiblePublicCards: cards.filter(visible).length, visibleCostChips: chips.filter(visible).length, costChipMinimumFont: Math.min(...chips.map(node => Number.parseFloat(getComputedStyle(node.querySelector('b')).fontSize))), costIconMinimumWidth: Math.min(...icons.map(node => node.getBoundingClientRect().width)), costIconMinimumHeight: Math.min(...icons.map(node => node.getBoundingClientRect().height)), bankPhase: document.querySelector('.sp-bank-guidance')?.dataset.phase, bankGuidance: document.querySelector('.sp-bank-guidance')?.textContent, buyableCards: document.querySelectorAll('.sp-market .sp-card.is-buyable').length };
    }
    return result;
  }, game);
  assert.equal(metrics.horizontalOverflow, false);
  if (game === 'jaipur') { assert.equal(metrics.roundPillVisible, true); assert.equal(metrics.overlappedByNotice, false); assert.equal(metrics.oldBonusNotices, 0); await checkJaipurPiles(page, language, 'desktop'); await checkJaipurBonusLabels(page, language, 'desktop-final'); }
  if (game === 'splendor') {
    assert.equal(metrics.publicCardCount, 12); assert.equal(metrics.visiblePublicCards, 12); assert.ok(metrics.visibleCostChips >= 12); assert.ok(metrics.costChipMinimumFont >= 13); assert.ok(metrics.costIconMinimumWidth >= 15); assert.ok(metrics.costIconMinimumHeight >= 15);
    const own = await readPublic(page);
    if (own.turn !== own.player) { assert.equal(metrics.bankPhase, 'other-turn'); assert.match(metrics.bankGuidance, language === 'ko' ? /내 차례/ : /tu turno/); }
  }
  report.uiChecks.push({ type: 'final-board', language, ...metrics });
}
async function enterRoom(attempt) {
  await pages[0].goto(`${baseUrl}/play`);
  await pages[1].goto(`${baseUrl}/play`);
  await pages[0].getByRole('button', { name: '한국어', exact: true }).click();
  await pages[1].getByRole('button', { name: /Español/ }).click();
  await pages[0].locator('#nickname').fill(`${gameNames[0]} 플레이어 1`);
  await pages[1].locator('#nickname').fill(`Jugador de ${gameNames[1]} 2`);
  await pages[0].getByRole('button', { name: /새 방 만들기/ }).click();
  await pages[0].waitForURL(/\/room\//);
  const invitation = pages[0].url();
  await pages[1].getByRole('textbox', { name: 'Enlace de invitación o ID de sala' }).fill(invitation);
  await pages[1].getByRole('button', { name: /Entrar/ }).click();
  await pages[1].waitForURL(/\/room\//);
  assert.equal((await readPublic(pages[0])).player, 'p1');
  assert.equal((await readPublic(pages[1])).player, 'p2');
  assert.equal((await readPublic(pages[0])).room, (await readPublic(pages[1])).room);
  await refresh(pages[0]);
  await pages[0].locator('.room-game-card').filter({ hasText: gameNames[0] }).click();
  await pages[0].waitForFunction(async ({ moduleUrl, gameId }) => (await import(moduleUrl)).client.getSnapshot().pendingGame === gameId, { moduleUrl: clientModuleUrl, gameId: game });
  await refresh(pages[1]);
  await pages[1].locator('.room-game-card').filter({ hasText: gameNames[1] }).click();
  await pages[1].waitForFunction(async ({ moduleUrl, gameId }) => (await import(moduleUrl)).client.getSnapshot().gameId === gameId, { moduleUrl: clientModuleUrl, gameId: game });
  await refresh(pages[0]);
  await Promise.all(pages.map(page => page.waitForSelector({ domino: '.domino-premium', jaipur: '.jaipur-board', splendor: '.sp-splendor' }[game])));
  const snapshots = await Promise.all(pages.map(readPublic));
  assert.equal(snapshots[0].player, 'p1');
  assert.equal(snapshots[1].player, 'p2');
  assert.equal(snapshots[0].mode, 'online');
  assert.equal(snapshots[1].mode, 'online');
  assert.equal(snapshots[0].language, 'ko');
  assert.equal(snapshots[1].language, 'es-DO');
  report.attempts.push({ attempt, roomCreatedAndJoinedThroughUI: true, bothConsentedThroughUI: true, played: { p1: 0, p2: 0 }, passes: { p1: 0, p2: 0 }, moves: [] });
}

async function chooseDominoMove(page) {
  return page.evaluate(() => {
    const own = [...document.querySelectorAll('.dp-hand-tile')].map(node => ({ index: Number(node.dataset.dominoIndex), a: Number(node.dataset.dominoA), b: Number(node.dataset.dominoB), playable: !node.disabled }));
    const ends = [...document.querySelectorAll('.dp-open-ends b')].map(node => Number(node.textContent));
    const candidates = own.filter(tile => tile.playable).flatMap(tile => {
      if (!ends.length) return [{ index: tile.index, side: 'opening', priority: 100 }];
      return ['left', 'right'].flatMap((side, sideIndex) => {
        const match = ends[sideIndex];
        if (tile.a !== match && tile.b !== match) return [];
        const newEnd = tile.a === match ? tile.b : tile.a;
        const nextEnds = side === 'left' ? [newEnd, ends[1]] : [ends[0], newEnd];
        const others = own.filter(other => other.index !== tile.index);
        const connections = others.filter(other => nextEnds.some(end => other.a === end || other.b === end)).length;
        return [{ index: tile.index, side, priority: (tile.a + tile.b) * 3 + (tile.a === tile.b ? 7 : 0) + connections * 4 }];
      });
    });
    candidates.sort((a, b) => b.priority - a.priority || b.index - a.index || a.side.localeCompare(b.side));
    return candidates[0] ?? null;
  });
}

async function chooseJaipurMove(page, needsExchange) {
  return page.evaluate(needsExchange => {
    const cards = selector => [...document.querySelectorAll(selector)].map(node => ({ id: node.dataset.jaipurCardId, good: node.querySelector('[data-good]')?.dataset.good }));
    const hand = cards('.jp-hand-card'), market = cards('.jp-market-card');
    const goods = ['diamond', 'gold', 'silver', 'cloth', 'spice', 'leather'];
    const piles = Object.fromEntries(goods.map(good => {
      const node = document.querySelector(`.jp-pile.is-${good}`);
      return [good, { count: Number(node?.querySelector('.jp-pile-count strong')?.textContent), top: Number.parseInt(node?.querySelector('.jp-pile-next b')?.textContent ?? '0') }];
    }));
    const minimum = good => ['diamond', 'gold', 'silver'].includes(good) ? 2 : 1;
    const potential = cards => goods.reduce((value, good) => {
      const count = cards.filter(card => card.good === good).length;
      return value + count * (piles[good].top || 1) + count * (count - 1) * 2 + (count >= minimum(good) ? count * 4 : 0);
    }, 0);
    const baseline = potential(hand), choices = [];
    const combos = (items, size) => {
      const result = [];
      const walk = (from, current) => { if (current.length === size) { result.push(current); return; } for (let i = from; i < items.length; i++) walk(i + 1, [...current, items[i]]); };
      walk(0, []); return result;
    };
    for (const good of goods) {
      const matching = hand.filter(card => card.good === good), count = matching.length;
      if (count < minimum(good) || !piles[good].count) continue;
      choices.push({ type: 'sell', good, count, handId: matching[0].id, priority: piles[good].top * Math.min(count, piles[good].count) + (count >= 5 ? 9 : count === 4 ? 5 : count === 3 ? 2 : 0) + (minimum(good) === 2 ? 8 : 0) + (hand.length >= 6 ? 12 : 0) - (count === 1 ? 5 : 0) });
    }
    if (hand.length < 7) for (const card of market.filter(card => card.good !== 'camel')) {
      const count = hand.filter(own => own.good === card.good).length;
      choices.push({ type: 'single', marketId: card.id, priority: piles[card.good].top + count * 5 + (minimum(card.good) === 2 && count === 1 ? 6 : 0) });
    }
    const camels = market.filter(card => card.good === 'camel');
    if (camels.length) choices.push({ type: 'camels', marketId: camels[0].id, priority: 4 + camels.length * 2 });
    const exchangeable = market.filter(card => card.good !== 'camel');
    for (let count = 2; count <= Math.min(3, hand.length, exchangeable.length); count++) {
      for (const give of combos(hand, count)) for (const take of combos(exchangeable, count)) {
        const next = [...hand.filter(card => !give.includes(card)), ...take];
        const gain = potential(next) - baseline;
        if (gain < 2) continue; // Never churn equivalent exchanges just to satisfy a counter.
        choices.push({ type: 'exchange', handIds: give.map(card => card.id), marketIds: take.map(card => card.id), count, priority: gain + (needsExchange ? 3 : 0) });
      }
    }
    choices.sort((a, b) => b.priority - a.priority || a.type.localeCompare(b.type));
    return choices[0] ?? null;
  }, needsExchange);
}

async function playJaipur() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    await enterRoom(attempt);
    const current = report.attempts.at(-1);
    current.actions = { p1: 0, p2: 0 };
    current.sales = { p1: 0, p2: 0 };
    current.exchanges = { p1: 0, p2: 0 };
    for (let turn = 0; turn < 48; turn++) {
      const snapshots = await Promise.all(pages.map(readPublic));
      assert.equal(snapshots[0].version, snapshots[1].version);
      assert.deepEqual(snapshots[0].publicJaipur, snapshots[1].publicJaipur);
      assert.equal(snapshots[0].leakedPrivateMap || snapshots[1].leakedPrivateMap, false);
      const board = snapshots[0].publicJaipur;
      if (snapshots[0].phase === 'finished' || board.round !== 1) { current.shortRound = true; break; }
      const handCounts = await Promise.all(pages.map(page => page.locator('.jp-hand-card').count()));
      if (current.actions.p1 >= 11 && current.actions.p2 >= 11 && current.sales.p1 && current.sales.p2 && current.exchanges.p1 + current.exchanges.p2 > 0 && handCounts.every(count => count >= 2)) {
        report.final = { version: snapshots[0].version, phase: 'in-progress', round: board.round, turn: snapshots[0].turn, deckCount: board.deckCount, scores: board.tokens, herdCounts: board.herds, handCounts: { p1: handCounts[0], p2: handCounts[1] }, actions: current.actions, sales: current.sales, exchanges: current.exchanges, bothVersionsAndPublicBoardsMatch: true, privateMapAbsent: true };
        return;
      }
      const index = snapshots[0].turn === 'p1' ? 0 : 1, player = index ? 'p2' : 'p1', page = pages[index];
      const move = await chooseJaipurMove(page, current.exchanges.p1 + current.exchanges.p2 === 0);
      assert.ok(move, 'A strategic UI move must exist in this unfinished round.');
      const tabs = page.locator('.jp-mode-tabs button');
      if (move.type === 'sell') {
        await tabs.nth(2).click();
        await page.locator(`.jp-hand-card[data-jaipur-card-id="${move.handId}"]`).click();
        const initial = await page.locator('.jp-sale-stepper output').textContent();
        for (let count = Number(initial); count < move.count; count++) await page.locator('.jp-sale-stepper button').filter({ hasText: '+' }).click();
        await checkJaipurSale(page, index ? 'es' : 'ko');
      } else if (move.type === 'exchange') {
        await tabs.nth(1).click();
        for (const id of move.handIds) await page.locator(`.jp-hand-card[data-jaipur-card-id="${id}"]`).click();
        for (const id of move.marketIds) await page.locator(`.jp-market-card[data-jaipur-card-id="${id}"]`).click();
      } else {
        await tabs.nth(0).click();
        await page.locator(`.jp-market-card[data-jaipur-card-id="${move.marketId}"]`).click();
      }
      await page.locator('.jp-primary-action:not(:disabled)').click();
      await page.waitForFunction(async ({ previous, moduleUrl }) => (await import(moduleUrl)).client.getSnapshot().version > previous, { previous: snapshots[index].version, moduleUrl: clientModuleUrl });
      await page.waitForTimeout(950);
      if (move.type === 'sell' && move.count >= 3) await checkJaipurBonusRefresh(page, index ? 'es' : 'ko');
      await refresh(pages[1 - index]);
      current.actions[player]++;
      if (move.type === 'sell') current.sales[player]++;
      if (move.type === 'exchange') current.exchanges[player]++;
      const after = await readPublic(page);
      current.moves.push({ player, type: move.type, count: move.count, version: after.version, round: after.publicJaipur.round, scores: after.publicJaipur.tokens, deckCount: after.publicJaipur.deckCount });
    }
  }
  throw new Error('No unfinished first round with eight actions per player, sales and a favorable exchange after three UI-created rounds.');
}

async function chooseSplendorMove(page) {
  return page.evaluate(async moduleUrl => {
    const view = (await import(moduleUrl)).client.getSnapshot().view;
    const own = view.ownHand, board = view.board;
    // This page's own reservation faces are allowed; never read any opponent face.
    const colors = ['white', 'blue', 'green', 'red', 'black'], all = [...colors, 'gold'];
    const cards = [...Object.values(board.market).flat().map(card => ({ ...card, source: 'market' })), ...own.reserved.map(card => ({ ...card, source: 'reserved' }))];
    const developed = colors.reduce((total, gem) => total + own.bonuses[gem], 0);
    const assess = card => {
      const due = Object.fromEntries(colors.map(gem => [gem, Math.max(0, card.cost[gem] - own.bonuses[gem])]));
      const shortage = Object.fromEntries(colors.map(gem => [gem, Math.max(0, due[gem] - own.tokens[gem])]));
      const missing = Math.max(0, colors.reduce((total, gem) => total + shortage[gem], 0) - own.tokens.gold);
      const blocked = colors.filter(gem => shortage[gem] > 0 && board.bank[gem] === 0).length;
      const discountUse = Object.values(board.market).flat().filter(other => other.cost[card.bonus] > own.bonuses[card.bonus]).length / 6;
      const nobleUse = Object.values(board.nobles).filter(noble => (noble.requirement[card.bonus] || 0) > own.bonuses[card.bonus]).length;
      const value = 5 + card.points * (developed >= 2 ? 8 : 4) + discountUse + nobleUse + (card.source === 'reserved' ? 2 : 0);
      return { ...card, due, shortage, missing, value, utility: value / (missing + 1) - blocked * 1.5 };
    };
    const ranked = cards.map(assess).sort((a, b) => b.utility - a.utility || b.points - a.points || a.id.localeCompare(b.id));
    const affordable = ranked.filter(card => card.missing === 0).sort((a, b) => b.value - a.value || a.id.localeCompare(b.id));
    if (affordable.length) { const card = affordable[0]; return { type: 'buy', id: card.id, source: card.source, tier: card.tier, points: card.points, goldRequired: colors.reduce((total, gem) => total + card.shortage[gem], 0) }; }
    const target = ranked[0];
    if (!target) return null;
    const returnPlan = gains => {
      const next = Object.fromEntries(all.map(gem => [gem, own.tokens[gem] + (gains[gem] || 0)])), returns = {};
      let excess = Math.max(0, all.reduce((total, gem) => total + next[gem], 0) - 10);
      while (excess > 0) {
        const gem = all.filter(gem => next[gem] > 0).sort((a, b) => {
          const surplus = gem => gem === 'gold' ? -50 : next[gem] - target.due[gem];
          return surplus(b) - surplus(a) || next[b] - next[a] || a.localeCompare(b);
        })[0];
        next[gem]--; returns[gem] = (returns[gem] || 0) + 1; excess--;
      }
      return { next, returns };
    };
    if (target.source === 'market' && target.points >= 1 && target.missing <= 2 && own.reserved.length < 3 && board.bank.gold > 0) {
      return { type: 'reserve', id: target.id, source: 'market', tier: target.tier, returns: returnPlan({ gold: 1 }).returns };
    }
    const available = colors.filter(gem => board.bank[gem] > 0), needed = Math.min(3, available.length), plans = [];
    const progress = next => {
      const missing = Math.max(0, colors.reduce((total, gem) => total + Math.max(0, target.due[gem] - next[gem]), 0) - next.gold);
      const secondary = ranked.slice(0, 4).reduce((value, card) => value + colors.reduce((total, gem) => total + Math.min(card.due[gem], next[gem]), 0), 0) / 20;
      return (target.missing - missing) * 10 + secondary;
    };
    const combinations = (from, gems) => {
      if (gems.length === needed) {
        const { next, returns } = returnPlan(Object.fromEntries(gems.map(gem => [gem, 1])));
        plans.push({ type: 'take', gems, returns, priority: progress(next) }); return;
      }
      for (let i = from; i < available.length; i++) combinations(i + 1, [...gems, available[i]]);
    };
    if (needed) combinations(0, []);
    for (const gem of colors.filter(gem => board.bank[gem] >= 4)) {
      const { next, returns } = returnPlan({ [gem]: 2 });
      plans.push({ type: 'takeTwo', gem, returns, priority: progress(next) });
    }
    plans.sort((a, b) => b.priority - a.priority || a.type.localeCompare(b.type));
    if (plans.length) return plans[0];
    if (own.reserved.length < 3 && target.source === 'market') return { type: 'reserve', id: target.id, source: 'market', tier: target.tier, returns: returnPlan({ gold: board.bank.gold > 0 ? 1 : 0 }).returns };
    return null;
  }, clientModuleUrl);
}

async function playSplendor() {
  await enterRoom(1);
  const current = report.attempts.at(-1);
  current.actions = { p1: 0, p2: 0 }; current.purchases = { p1: 0, p2: 0 }; current.reservations = { p1: 0, p2: 0 }; current.returnedTokens = { p1: 0, p2: 0 }; current.returnStepperClicks = { p1: 0, p2: 0 }; current.goldSpent = { p1: 0, p2: 0 };
  for (let turn = 0; turn <= 40; turn++) {
    const snapshots = await Promise.all(pages.map(readPublic));
    assert.equal(snapshots[0].version, snapshots[1].version);
    assert.deepEqual(snapshots[0].publicSplendor, snapshots[1].publicSplendor);
    assert.equal(snapshots[0].leakedPrivateMap || snapshots[1].leakedPrivateMap, false);
    assert.notEqual(snapshots[0].phase, 'finished');
    for (const [seatIndex, seatPage] of pages.entries()) {
      if (snapshots[seatIndex].turn === snapshots[seatIndex].player || snapshots[seatIndex].phase === 'chooseNoble') continue;
      const language = seatIndex ? 'es' : 'ko', guidance = seatPage.locator('.sp-bank-guidance');
      assert.equal(await guidance.getAttribute('data-phase'), 'other-turn');
      const text = await guidance.textContent(); assert.match(text, seatIndex ? /tu turno/ : /내 차례/);
      if (!report.uiChecks.some(check => check.type === 'rival-bank-guidance' && check.language === language)) report.uiChecks.push({ type: 'rival-bank-guidance', language, text, phase: 'other-turn' });
    }
    const board = snapshots[0].publicSplendor;
    const cardCounts = Object.fromEntries(['p1', 'p2'].map(seat => [seat, Object.values(board.bonuses[seat]).reduce((total, count) => total + count, 0)]));
    if (current.actions.p1 >= 12 && current.actions.p2 >= 12 && cardCounts.p1 >= 2 && cardCounts.p2 >= 2 && board.score.p1 > 0 && board.score.p2 > 0 && snapshots[0].phase !== 'chooseNoble') {
      const ownCounts = await Promise.all(pages.map(page => page.evaluate(async moduleUrl => {
        const own = (await import(moduleUrl)).client.getSnapshot().view.ownHand;
        return { tokenCount: Object.values(own.tokens).reduce((total, count) => total + Number(count), 0), reservedCount: own.reserved.length };
      }, clientModuleUrl)));
      report.final = { version: snapshots[0].version, phase: 'in-progress', turn: snapshots[0].turn, scores: board.score, cardCounts, discounts: board.bonuses, actions: current.actions, purchases: current.purchases, reservations: current.reservations, returnedTokens: current.returnedTokens, returnStepperClicks: current.returnStepperClicks, goldSpent: current.goldSpent, ownCounts: { p1: ownCounts[0], p2: ownCounts[1] }, bothVersionsAndPublicBoardsMatch: true, privateMapAbsent: true };
      return;
    }
    assert.ok(turn < 40, 'The developed unfinished capture must be reached within forty UI actions.');
    const index = snapshots[0].turn === 'p1' ? 0 : 1, player = index ? 'p2' : 'p1', page = pages[index];
    let purchase = null;
    if (snapshots[index].phase === 'chooseNoble') await page.locator('.sp-noble.is-selectable:not(:disabled)').last().click();
    else {
      const move = await chooseSplendorMove(page);
      assert.ok(move, 'A strategic Splendor UI move must exist.');
      if (move.type === 'buy' || move.type === 'reserve') {
        if (afterFixes && move.type === 'buy' && move.source === 'market') {
          const card = page.locator(`.sp-market .sp-card[data-card-id="${move.id}"]`);
          assert.match(await card.getAttribute('class'), /is-buyable/);
          assert.equal(await card.getAttribute('data-cost-deficit'), '0');
          assert.match(await card.getAttribute('aria-label'), index ? /Disponible para compra/ : /구매 가능/);
          if (!report.uiChecks.some(check => check.type === 'buyable-market-card' && check.language === (index ? 'es' : 'ko'))) report.uiChecks.push({ type: 'buyable-market-card', language: index ? 'es' : 'ko', stateLabel: await card.getAttribute('aria-label'), visualHighlight: true });
        }
        await page.locator(`[data-sp-zone="market"] [data-card-id="${move.id}"],.sp-reserved-card[data-card-id="${move.id}"]`).click();
        if (move.type === 'buy') purchase = { goldBefore: await page.evaluate(async moduleUrl => (await import(moduleUrl)).client.getSnapshot().view.ownHand.tokens.gold, clientModuleUrl), goldRequired: move.goldRequired };
        if (afterFixes && move.type === 'buy' && move.source === 'reserved') {
          const panel = page.locator('.sp-action-panel'), preview = await panel.locator('.sp-reserve-preview').textContent(), language = index ? 'es' : 'ko';
          assert.equal(await panel.getAttribute('data-source-zone'), 'reserved');
          assert.match(preview, index ? /Compra la carta que ya reservaste/ : /이미 예약한 카드 · 구매/);
          assert.doesNotMatch(preview, /\+1\s*(?:oro|금)|금\s*\+1/);
          assert.equal(await panel.locator('.sp-action-buttons button').count(), 1);
          assert.equal(await panel.locator('.sp-payment-preview').isVisible(), true);
          if (!report.uiChecks.some(check => check.type === 'own-reservation-purchase' && check.language === language)) {
            report.uiChecks.push({ type: 'own-reservation-purchase', language, preview, actionCount: 1, paymentVisible: true });
            await captureEvidence(page, language, 'reserved-purchase');
          }
        }
        if (move.type === 'reserve') {
          const select = page.locator('.sp-action-panel .sp-return-select select');
          if (await select.count()) {
            const names = { white: ['흰색', 'Blanca'], blue: ['파랑', 'Azul'], green: ['초록', 'Verde'], red: ['빨강', 'Roja'], black: ['검정', 'Negra'], gold: ['황금', 'Comodín'] };
            const options = await select.locator('option').evaluateAll(options => options.map(option => ({ value: option.value, text: option.textContent })));
            const option = options.find(option => Object.entries(names).every(([gem, labels]) => {
              const pattern = new RegExp(`(\\d+)\\s+(?:${labels.join('|')})(?:\\s|$| ·)`);
              return Number(option.text.match(pattern)?.[1] || 0) === Number(move.returns[gem] || 0);
            }));
            assert.ok(option, 'The planned reservation return must exist in the real UI.');
            await select.selectOption(option.value);
          }
        }
        await page.locator('.sp-action-buttons button').filter({ hasText: move.type === 'buy' ? /구매 확정|Confirmar compra/ : /예약 확정|Confirmar reserva/ }).click();
        if (move.type === 'buy') current.purchases[player]++; else current.reservations[player]++;
      } else {
        if (move.type === 'takeTwo') await page.locator(`.sp-gem-option:has(.sp-gem-pile.sp-color-${move.gem}) .sp-double-take`).click();
        else for (const gem of move.gems) await page.locator(`button.sp-gem-pile.sp-color-${gem}`).click();
        for (const gem of ['white', 'blue', 'green', 'red', 'black', 'gold']) {
          const stepper = page.locator(`.sp-return-stepper[data-gem="${gem}"]`);
          if (!await stepper.count()) continue;
          let value = Number(await stepper.locator('span b').textContent()), desired = Number(move.returns[gem] || 0);
          while (value > desired) { await stepper.locator('button').nth(1).click(); value--; current.returnStepperClicks[player]++; }
          while (value < desired) { await stepper.locator('button').nth(0).click(); value++; current.returnStepperClicks[player]++; }
        }
        await page.locator('.sp-token-confirm > button:not(:disabled)').click();
      }
      const returned = Object.values(move.returns || {}).reduce((total, count) => total + count, 0);
      current.returnedTokens[player] += returned;
      current.moves.push({ player, type: move.type, points: move.points, returned });
    }
    await page.waitForFunction(async ({ previous, moduleUrl }) => (await import(moduleUrl)).client.getSnapshot().version > previous, { previous: snapshots[index].version, moduleUrl: clientModuleUrl });
    await page.waitForTimeout(950);
    if (purchase) {
      await refresh(page);
      assert.equal((await readPublic(page)).version, snapshots[index].version + 1, 'The explicit read refresh must contain the committed purchase version before checking payment.');
      const goldAfter = await page.evaluate(async moduleUrl => (await import(moduleUrl)).client.getSnapshot().view.ownHand.tokens.gold, clientModuleUrl);
      const spent = purchase.goldBefore - goldAfter;
      assert.equal(spent, purchase.goldRequired, 'Confirmed purchase must spend exactly the gold needed after color tokens and discounts.');
      current.goldSpent[player] += spent;
      if (spent > 0) report.uiChecks.push({ type: 'gold-substitution', language: index ? 'es' : 'ko', goldSpent: spent, requiredAfterDiscountsAndColors: purchase.goldRequired });
    }
    await refresh(pages[1 - index]);
    current.actions[player]++;
  }
}

try {
  if (game === 'jaipur') await playJaipur();
  else if (game === 'splendor') await playSplendor();
  else {
  let captured = false;
  for (let attempt = 1; attempt <= 5 && !captured; attempt++) {
    await enterRoom(attempt);
    const current = report.attempts.at(-1);
    for (let turn = 0; turn < 28; turn++) {
      const snapshots = await Promise.all(pages.map(readPublic));
      assert.equal(snapshots[0].version, snapshots[1].version);
      assert.deepEqual(snapshots[0].chain, snapshots[1].chain);
      assert.deepEqual(snapshots[0].ends, snapshots[1].ends);
      assert.equal(snapshots[0].leakedPrivateMap, false);
      assert.equal(snapshots[1].leakedPrivateMap, false);
      if (snapshots[0].phase !== 'play') { current.shortRound = true; break; }
      if (snapshots[0].chain.length >= 9 && current.played.p1 >= 4 && current.played.p2 >= 4) { captured = true; break; }
      const index = snapshots[0].turn === 'p1' ? 0 : 1;
      const page = pages[index], player = index === 0 ? 'p1' : 'p2';
      const before = snapshots[index];
      const move = await chooseDominoMove(page);
      if (!move) {
        await page.locator('.dp-pass:not(:disabled)').click();
        current.passes[player]++;
      } else {
        await page.locator(`.dp-hand-tile[data-domino-index="${move.index}"]`).click();
        if (move.side === 'opening') await page.locator('.dp-start-target').click();
        else await page.locator(`.dp-end-target[data-domino-side="${move.side}"]:not(:disabled)`).click();
        current.played[player]++;
      }
      await page.waitForFunction(async ({ previous, moduleUrl }) => (await import(moduleUrl)).client.getSnapshot().version > previous, { previous: before.version, moduleUrl: clientModuleUrl });
      await page.waitForTimeout(700);
      await refresh(pages[1 - index]);
      const after = await readPublic(page);
      current.moves.push({ player, type: move ? 'place' : 'pass', side: move?.side, version: after.version, publicTileCount: after.chain.length });
    }
  }
  assert.equal(captured, true, 'No unfinished board with 9+ tiles and 4+ placements from each player after five UI-created rounds.');
  await Promise.all(pages.map(refresh));
  await pages[0].waitForTimeout(900);
  const ending = await Promise.all(pages.map(readPublic));
  assert.equal(ending[0].version, ending[1].version);
  assert.deepEqual(ending[0].chain, ending[1].chain);
  assert.deepEqual(ending[0].ends, ending[1].ends);
  assert.equal(ending[0].phase, 'play');
  const handHashes = await Promise.all(pages.map(async page => {
    const ownHand = await page.evaluate(() => [...document.querySelectorAll('.dp-hand-tile')].map(node => [Number(node.dataset.dominoA), Number(node.dataset.dominoB)].sort((a, b) => a - b).join('|')).sort());
    return createHash('sha256').update(JSON.stringify(ownHand)).digest('hex');
  }));
  assert.notEqual(handHashes[0], handHashes[1]);
  report.final = { version: ending[0].version, phase: ending[0].phase, publicTileCount: ending[0].chain.length, ends: ending[0].ends, turn: ending[0].turn, counts: ending[0].counts, bothVersionsAndPublicBoardsMatch: true, distinctOwnHands: true, privateMapAbsent: true, placements: report.attempts.at(-1).played, passes: report.attempts.at(-1).passes };
  }
  await Promise.all(pages.map(refresh));
  await pages[0].waitForTimeout(950);
  if (game === 'jaipur') {
    const hashes = await Promise.all(pages.map(async page => createHash('sha256').update(JSON.stringify(await page.locator('.jp-hand-card').evaluateAll(cards => cards.map(card => card.dataset.jaipurCardId).sort()))).digest('hex')));
    assert.notEqual(hashes[0], hashes[1]);
    report.final.distinctOwnHands = true;
  }
  for (const [index, language] of ['ko', 'es'].entries()) {
    const board = pages[index].locator('#game-board');
    await checkFinalUI(pages[index], language);
    await board.scrollIntoViewIfNeeded();
    await pages[index].waitForTimeout(150);
    const file = path.join(output, `${game}-${language}.png`);
    await board.screenshot({ path: file, animations: 'disabled', scale: 'css' });
    report.screenshots.push({ language, path: file, element: '#game-board', bounds: await board.boundingBox() });
    if (game === 'jaipur' && afterFixes) {
      const before = await readPublic(pages[index]);
      await pages[index].setViewportSize({ width: 390, height: 844 });
      await pages[index].waitForTimeout(150);
      await checkJaipurPiles(pages[index], language, 'mobile');
      await checkJaipurBonusLabels(pages[index], language, 'mobile-final');
      assert.equal(await pages[index].evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await captureEvidence(pages[index], language, 'mobile-final');
      assert.equal((await readPublic(pages[index])).version, before.version);
      await pages[index].setViewportSize({ width: 1440, height: 900 });
    }
  }
} catch (error) {
  if (error.name === 'DiagnosisComplete') report.diagnosisComplete = true;
  else report.errors.push(error.stack ?? String(error));
  report.diagnostics = await Promise.all(pages.map(async page => ({ public: await readPublic(page), notices: await page.locator('.inline-error,.action-notice,.pending-choice').allTextContents() })));
  if (error.name !== 'DiagnosisComplete') process.exitCode = 1;
} finally {
  await fs.writeFile(path.join(output, `${game}-play.json`), JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(JSON.stringify(report, null, 2));

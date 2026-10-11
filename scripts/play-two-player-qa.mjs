// Actual UI play in two isolated contexts. The SQL fixture has no Realtime;
// reconnectRoom/getSnapshot below are read-only refreshes, never game actions.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { launchChromium } from './playwright-browser.mjs';

const gameId = process.env.TWO_PLAYER_GAME || 'domino';
assert(['domino', 'jaipur', 'splendor'].includes(gameId), 'Run only a game root has authorized in sequence');
const boardSelector = gameId === 'domino' ? '.domino-premium' : gameId === 'jaipur' ? '.jaipur-board' : '.sp-splendor';
const baseUrl = process.env.TWO_PLAYER_QA_URL || 'http://127.0.0.1:5192';
const out = path.resolve(process.env.PLAYWRIGHT_ARTIFACT_DIR || `output/playwright/live-two-player-qa/${gameId}/run-${Date.now()}`);
await fs.mkdir(out, { recursive: true });
const browser = await launchChromium();
const contexts = await Promise.all(['ko', 'es'].map(() => browser.newContext({ viewport: { width: 1440, height: 900 } })));
const pages = await Promise.all(contexts.map(context => context.newPage()));
const report = { game: gameId, baseUrl, method: 'Two independent contexts; UI-only room/create/join/consent/play; explicit read-only refresh; no Realtime', checks: [], moves: [], errors: [], observations: [], screenshots: [] };
const check = (name, pass, details) => { report.checks.push({ name, pass: Boolean(pass), details }); assert(pass, name); };
const save = () => fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
for (const page of pages) page.on('pageerror', error => report.errors.push(error.message));
async function snapshot(page, refresh = false) {
  return page.evaluate(async shouldRefresh => {
    const moduleUrl = performance.getEntriesByType('resource').find(entry => /\/src\/core\/client\.ts(?:\?|$)/.test(entry.name))?.name;
    if (!moduleUrl) throw Error('The UI client module has not loaded');
    const { client } = await import(moduleUrl);
    if (shouldRefresh) await client.reconnectRoom();
    const s = client.getSnapshot();
    return { roomId: s.roomId, playerId: s.playerId, version: s.version, syncEpoch: s.syncEpoch, gameId: s.gameId, pendingGame: s.pendingGame, players: s.players.length, phase: s.view?.phase, turn: s.view?.turn, round: s.view?.round ?? s.view?.board?.round, board: s.view?.board ? Object.fromEntries(Object.entries(s.view.board).filter(([key]) => key !== 'reservedOpponentCount')) : undefined, result: s.view?.result };
  }, refresh);
}
async function both() {
  let values;
  for (let attempt = 0; attempt < 5; attempt++) {
    values = await Promise.all(pages.map(page => snapshot(page, true)));
    if (values[0].version === values[1].version && JSON.stringify(values[0].board) === JSON.stringify(values[1].board)) break;
    report.observations.push({ refreshRace: values.map(({ playerId, version, phase }) => ({ playerId, version, phase })) });
    await pages[0].waitForTimeout(50);
  }
  report.latestPublicStates = values;
  check('Both public boards and versions agree', values[0].version === values[1].version && JSON.stringify(values[0].board) === JSON.stringify(values[1].board), { version: values[0].version, tiles: values[0].board?.tiles?.length });
  return values;
}
async function capture(label) {
  for (let i = 0; i < pages.length; i++) {
    const file = path.join(out, `${label}-p${i + 1}.png`);
    await pages[i].screenshot({ path: file, fullPage: true });
    report.screenshots.push(file);
  }
}
async function privacy(phase) {
  for (let i = 0; i < pages.length; i++) {
    const data = await pages[i].evaluate(() => ({
      own: document.querySelectorAll('.dp-hand .dp-hand-tile').length,
      opponentTiles: document.querySelectorAll('.dp-seat:not(.is-you) [data-domino-a]').length,
      revealed: document.querySelectorAll('[data-domino-revealed-seat]').length,
      width: document.documentElement.scrollWidth,
      board: document.querySelector('.domino-premium')?.getBoundingClientRect().toJSON(),
    }));
    check(`p${i + 1} opponent values hidden during play`, phase !== 'play' || (data.opponentTiles === 0 && data.revealed === 0), data);
  }
}

async function playJaipur() {
  const fixes = process.env.QA_JAIPUR_FIXES === '1';
  const cancelledSeats = new Set();
  const noticeSeats = new Set();
  const goods = ['diamond', 'gold', 'silver', 'cloth', 'spice', 'leather'];
  const flags = { exchange: false, saleCancel: false, duplicate: false, cap: false, metal: false, camel: false, bonusSale: false };
  const narrowSeats = new Set();
  const minSale = good => ['diamond', 'gold', 'silver'].includes(good) ? 2 : 1;
  const handOf = page => page.locator('.jp-hand-card').evaluateAll(elements => elements.map((element, index) => ({ index, id: element.dataset.jaipurCardId, good: [...element.classList].find(name => /^is-(diamond|gold|silver|cloth|spice|leather)$/.test(name))?.slice(3) })));
  const marketOf = page => page.locator('.jp-market-card').evaluateAll(elements => elements.map((element, index) => ({ index, id: element.dataset.jaipurCardId, good: [...element.classList].find(name => /^is-(diamond|gold|silver|cloth|spice|leather|camel)$/.test(name))?.slice(3) })));
  const checkLayout = async (page, seat, width) => {
    const layout = await page.evaluate(() => {
      const board = document.querySelector('.jaipur-board');
      const piles = [...document.querySelectorAll('.jp-pile-next-value')].map(value => {
        const cell = value.closest('.jp-pile').getBoundingClientRect(), label = value.previousElementSibling.getBoundingClientRect(), rect = value.getBoundingClientRect();
        return { text: value.textContent, cell: cell.toJSON(), label: label.toJSON(), value: rect.toJSON(), children: [...value.children].map(element => element.getBoundingClientRect().toJSON()), valueVisible: rect.width > 0 && rect.height > 0, labelVisible: label.width > 0 && label.height > 0, inside: [value.previousElementSibling, value, ...value.children].every(element => { const r = element.getBoundingClientRect(); return r.width === 0 || r.left >= cell.left - 1 && r.right <= cell.right + 1 && r.top >= cell.top - 1 && r.bottom <= cell.bottom + 1; }) };
      });
      return { width: document.documentElement.scrollWidth, columns: getComputedStyle(board).gridTemplateColumns, pileNextDisplay: getComputedStyle(document.querySelector('.jp-pile-next')).display, pileNextWhiteSpace: getComputedStyle(document.querySelector('.jp-pile-next')).whiteSpace, piles };
    });
    check(`p${seat} ${width}px next-token values visible inside each cell`, layout.width === width && layout.piles.length > 0 && layout.piles.every(pile => pile.valueVisible && pile.inside && (width !== 390 || pile.labelVisible)), layout);
    if (width === 390) check(`p${seat} mobile board remains a single column`, layout.columns.trim().split(/\s+/).length === 1, layout.columns);
  };
  if (fixes) for (let i = 0; i < pages.length; i++) {
    await checkLayout(pages[i], i + 1, 1440);
    await pages[i].setViewportSize({ width: 390, height: 844 });
    await checkLayout(pages[i], i + 1, 390);
  }
  for (let step = 0; step < (fixes ? 36 : 90); step++) {
    const [state] = await both();
    if (state.result || (!fixes && state.round > 1 && report.moves.some(move => move.round > 1)) || (fixes && report.moves.length >= 16 && narrowSeats.size === 2 && noticeSeats.size === 2 && flags.exchange)) break;
    const playerIndex = state.turn === 'p1' ? 0 : 1;
    const page = pages[playerIndex];
    const hand = await handOf(page), market = await marketOf(page);
    const counts = Object.fromEntries(goods.map(good => [good, hand.filter(card => card.good === good).length]));
    for (let i = 0; i < pages.length; i++) {
      const own = await handOf(pages[i]);
      const exposed = await pages[i].evaluate(() => ({ zones: [...document.querySelectorAll('[data-jaipur-zone="hand"]')].map(element => element.dataset.jaipurPlayerId), rivalGood: document.querySelectorAll('.jp-opponent-row [data-jaipur-card-id]').length, visibleBonusValues: [...document.querySelectorAll('.jp-bonus-stack')].map(element => element.textContent) }));
      check(`p${i + 1} only own hand zone and no opponent card IDs`, exposed.zones.length === 1 && exposed.zones[0] === `p${i + 1}` && exposed.rivalGood === 0, { count: own.length, ...exposed });
      check(`p${i + 1} hidden future bonus and lower goods token values absent`, state.board.bonusTiles === undefined && goods.every(good => state.board.piles[good].slice(1).every(value => value === null)));
    }
    const modes = page.locator('.jp-mode-tabs button');
    const confirm = () => page.locator('.jp-action-tray .jp-primary-action');
    const selectGroup = async good => { await modes.nth(2).click(); await page.locator(`.jp-hand-card.is-${good}`).first().click(); };
    if (!flags.metal) {
      const lone = goods.find(good => minSale(good) === 2 && counts[good] === 1 && state.board.piles[good].length);
      if (lone) {
        await selectGroup(lone);
        check('Single precious good cannot confirm sale', await confirm().isDisabled(), await page.locator('.jp-sale-stepper').innerText());
        if (fixes) {
          const selected = await page.locator('.jp-hand-card.is-selected').getAttribute('data-jaipur-card-id');
          const rect = await confirm().boundingBox();
          await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height / 2);
          check('Blocked invalid sale preserves selection and version', (await snapshot(page)).version === state.version && await page.locator('.jp-hand-card.is-selected').getAttribute('data-jaipur-card-id') === selected);
        }
        await page.keyboard.press('Escape');
        flags.metal = true;
      }
    }
    if (hand.length === 7 && !flags.cap) {
      await modes.nth(0).click();
      const single = market.find(card => card.good !== 'camel');
      if (single) {
        await page.locator(`.jp-market-card[data-jaipur-card-id="${single.id}"]`).click();
        check('Hand7 prevents further single-good acquisition', await confirm().isDisabled(), await page.locator('.jp-take-controls').innerText());
        await page.keyboard.press('Escape');
        flags.cap = true;
      }
    }
    const desirability = good => (counts[good] * 3 + Number(state.board.piles[good][0] ?? 0)) * (state.board.piles[good].length ? 1 : 0.1);
    const takes = market.filter(card => card.good !== 'camel').sort((a, b) => desirability(b.good) - desirability(a.good));
    const sales = goods.filter(good => counts[good] >= minSale(good) && state.board.piles[good].length).sort((a, b) => (counts[b] >= 3 ? 15 : 0) + counts[b] + Number(state.board.piles[b][0] ?? 0) - ((counts[a] >= 3 ? 15 : 0) + counts[a] + Number(state.board.piles[a][0] ?? 0)));
    const camels = market.filter(card => card.good === 'camel');
    let exchange;
    for (let a = 0; a < takes.length; a++) for (let b = a + 1; b < takes.length; b++) {
      const received = [takes[a], takes[b]];
      const given = hand.slice().sort((x, y) => (received.some(card => card.good === x.good) ? 100 : desirability(x.good)) - (received.some(card => card.good === y.good) ? 100 : desirability(y.good))).slice(0, 2);
      if (given.length < 2) continue;
      const gain = received.reduce((sum, card) => sum + desirability(card.good), 0) - given.reduce((sum, card) => sum + desirability(card.good), 0);
      if (gain > 1 && (!exchange || gain > exchange.gain)) exchange = { received, given, gain };
    }
    let action;
    if (!flags.camel && camels.length >= 2) action = { type: 'camels', count: camels.length, reason: 'Acquire a large herd for public camel-majority race and refresh the market' };
    else if (exchange && !flags.exchange) action = { type: 'exchange', ...exchange, reason: `Trade two lower-value holdings for concentrated goods, public utility gain ${exchange.gain}` };
    else if (sales.length && ((counts[sales[0]] >= 3 && (flags.cap || hand.length < 6)) || hand.length === 7 || state.board.deckCount < 8 || !takes.length)) action = { type: 'sell', good: sales[0], count: counts[sales[0]], reason: 'Cash a concentrated group with bonus eligibility, or free a full hand before acquiring again' };
    else if (takes.length && hand.length < 7) action = { type: 'take', card: takes[0], reason: `Collect ${takes[0].good}: own group ${counts[takes[0].good]}, public top token ${state.board.piles[takes[0].good][0]}` };
    else if (camels.length) action = { type: 'camels', count: camels.length, reason: 'Refresh market while retaining hand capacity and increase herd majority' };
    else if (sales.length) action = { type: 'sell', good: sales[0], count: counts[sales[0]], reason: 'Available public pile pays now; free hand space' };
    else if (exchange) action = { type: 'exchange', ...exchange, reason: 'Improve holdings when a single take is unavailable' };
    else break;
    if (action.type === 'sell') {
      const mobileFlow = fixes && !narrowSeats.has(playerIndex) && action.count > minSale(action.good);
      if (mobileFlow) await page.setViewportSize({ width: 390, height: 844 });
      await selectGroup(action.good);
      const increase = page.getByRole('button', { name: playerIndex === 0 ? '판매 수량 늘리기' : 'Aumentar cantidad', exact: true });
      const decrease = page.getByRole('button', { name: playerIndex === 0 ? '판매 수량 줄이기' : 'Reducir cantidad', exact: true });
      for (let amount = minSale(action.good); amount < action.count; amount++) await increase.click();
      if ((!fixes && !flags.saleCancel) || (mobileFlow && !cancelledSeats.has(playerIndex))) {
        if (action.count > minSale(action.good)) { await decrease.click(); check('Sale quantity decrement changes count', await page.locator('.jp-sale-stepper output').innerText() === String(action.count - 1)); await increase.click(); }
        await page.locator('.jp-sale-stepper .jp-cancel-action').click();
        check('Sale cancel preserves hand and clears selected group', await page.locator('.jp-hand-card.is-selected').count() === 0 && (await handOf(page)).length === hand.length);
        await selectGroup(action.good);
        for (let amount = minSale(action.good); amount < action.count; amount++) await increase.click();
        flags.saleCancel = true;
        cancelledSeats.add(playerIndex);
      }
      if ((!fixes && !narrowSeats.has(playerIndex)) || mobileFlow) {
        await page.setViewportSize({ width: 390, height: 844 });
        const layout = await page.evaluate(() => {
          const box = selector => { const rect = document.querySelector(selector).getBoundingClientRect(); return { top: rect.top + scrollY, bottom: rect.bottom + scrollY, width: rect.width, height: rect.height }; };
          const selected = box('.jp-hand-card.is-selected'), tray = box('.jp-sale-controls');
          return { documentWidth: document.documentElement.scrollWidth, tray, selected, saleTrays: document.querySelectorAll('.jp-sale-controls').length, saleInHand: Boolean(document.querySelector('.jp-sale-controls').closest('.jp-player-hand')), distanceHandToTray: selected.top - tray.top, selectedToConfirm: selected.top - (document.querySelector('.jp-primary-action').getBoundingClientRect().top + scrollY), text: document.querySelector('.jp-sale-controls').innerText, controls: [...document.querySelectorAll('.jp-sale-stepper button')].map(button => ({ name: button.innerText || button.getAttribute('aria-label'), width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })) };
        });
        report.observations.push({ mobileSale: `p${playerIndex + 1}`, ...layout });
        check('390px sale has no document horizontal overflow and 44px targets', layout.documentWidth === 390 && layout.controls.every(control => control.width >= 44 && control.height >= 44), layout);
        if (fixes) check('Only sale tray lives next to the selected own hand', layout.saleTrays === 1 && layout.saleInHand && layout.tray.top >= layout.selected.bottom, layout);
        const file = path.join(out, `mobile-sale-p${playerIndex + 1}.png`); await page.screenshot({ path: file, fullPage: true }); report.screenshots.push(file);
        if (!fixes) await page.setViewportSize({ width: 1440, height: 900 });
        narrowSeats.add(playerIndex);
      }
      flags.bonusSale ||= action.count >= 3;
    } else if (action.type === 'exchange') {
      await modes.nth(1).click();
      for (const card of action.given) await page.locator(`.jp-hand-card[data-jaipur-card-id="${card.id}"]`).click();
      await page.locator(`.jp-market-card[data-jaipur-card-id="${action.received[0].id}"]`).click();
      check('Exchange2↔1 explains mismatch and blocks confirm', await confirm().isDisabled() && /맞지|coincidir/.test(await page.locator('.jp-exchange-controls').innerText()));
      await page.locator('.jp-exchange-controls .jp-cancel-action').click();
      check('Exchange cancel clears both sides', await page.locator('.jp-hand-card.is-selected,.jp-market-card.is-selected').count() === 0);
      await modes.nth(1).click();
      for (const card of action.given) await page.locator(`.jp-hand-card[data-jaipur-card-id="${card.id}"]`).click();
      for (const card of action.received) await page.locator(`.jp-market-card[data-jaipur-card-id="${card.id}"]`).click();
      flags.exchange = true;
    } else {
      await modes.nth(0).click();
      const card = action.type === 'camels' ? camels[0] : action.card;
      await page.locator(`.jp-market-card[data-jaipur-card-id="${card.id}"]`).click();
      if (action.type === 'camels') { check('Camel acquisition selects all market camels', await page.locator('.jp-market-card.is-selected').count() === camels.length); flags.camel = true; }
    }
    if (fixes && action.type !== 'sell') check('Take/exchange retains one market-local confirm tray', await page.locator('.jp-action-tray').count() === 1 && await confirm().evaluate(element => Boolean(element.closest('.jp-market-section'))));
    check('Strategy action has enabled native confirmation', !(await confirm().isDisabled()), action);
    if (!flags.duplicate) { await confirm().dblclick(); flags.duplicate = true; }
    else { await confirm().focus(); await page.keyboard.press(step % 2 ? 'Space' : 'Enter'); }
    report.moves.push({ step: step + 1, player: state.turn, round: state.round, ...action, versionBefore: state.version });
    for (let attempt = 0; attempt < 40 && (await snapshot(page)).version <= state.version; attempt++) await page.waitForTimeout(50);
    check('Jaipur UI request commits', (await snapshot(page)).version > state.version);
    if (fixes && action.type === 'sell' && action.count >= 3 && !noticeSeats.has(playerIndex)) {
      // reconnectRoom changes syncEpoch and remounts the board, so observe the
      // active client's fresh event before doing the fixture's peer refresh.
      await page.locator('.jaipur-event-note.is-bonus').waitFor({ timeout: 10000 });
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
        const layout = await page.evaluate(() => {
          const pill = document.querySelector('.jp-round-pill').getBoundingClientRect(), note = document.querySelector('.jaipur-event-note')?.getBoundingClientRect();
          return { pill: pill.toJSON(), note: note?.toJSON(), overlap: note ? Math.max(0, Math.min(pill.right, note.right) - Math.max(pill.left, note.left)) * Math.max(0, Math.min(pill.bottom, note.bottom) - Math.max(pill.top, note.top)) : null, text: document.querySelector('.jaipur-event-note')?.textContent };
        });
        check(`p${playerIndex + 1} ${width}px earned bonus notice does not cover round pill`, layout.note && layout.overlap === 0, layout);
        report.observations.push({ bonusNoticeLayout: `p${playerIndex + 1}-${width}`, ...layout });
        const file = path.join(out, `bonus-notice-${width}-p${playerIndex + 1}.png`); await page.screenshot({ path: file, fullPage: true }); report.screenshots.push(file);
      }
      await page.locator('.jaipur-event-note').waitFor({ state: 'hidden', timeout: 5000 });
      check(`p${playerIndex + 1} fresh bonus notice expires before any read refresh`, await page.locator('.jaipur-event-note').count() === 0);
      await page.setViewportSize({ width: 390, height: 844 });
      noticeSeats.add(playerIndex);
    }
    const [after] = await both();
    check('One Jaipur commit per native confirmation including double click', after.version === state.version + 1);
    check('Jaipur turn changes or automatically enters the next round', after.turn !== state.turn || after.round > state.round || Boolean(after.result));
    if (action.type === 'exchange' && after.round === state.round) check('Exchange preserves own hand count', (await handOf(page)).length === hand.length);
    if (action.type === 'sell' && after.round === state.round) check('Sale removes selected count only', (await handOf(page)).length === hand.length - action.count);
    if (fixes && action.type === 'sell' && action.count >= 3) {
      for (let i = 0; i < pages.length; i++) {
        check(`p${i + 1} read refresh of old bonus state does not replay notice`, await pages[i].locator('.jaipur-event-note').count() === 0 && (await snapshot(pages[i])).version === after.version);
      }
    }
    if (step === 8) await capture('midgame');
    await save();
  }
  const final = await both();
  report.final = final.map(({ board, ...value }) => ({ ...value, deckCount: board.deckCount, roundSummary: board.roundSummary, roundsWon: board.roundsWon }));
  report.observations.push({ reached: flags, mobileSeats: [...narrowSeats], settlementKO: await pages[0].locator('.jp-history-drawer').innerText(), settlementES: await pages[1].locator('.jp-history-drawer').innerText() });
  if (!fixes) check('One Jaipur round completed and next round entered', final[0].round > 1);
  if (fixes) report.observations.push({ fixScope: 'At least16 strategy actions, stop once both mobile sale flows and fresh notices plus exchange reached; bounded36 actions; no full match requirement', mobileSaleSeats: [...narrowSeats], mobileCancelSeats: [...cancelledSeats], freshNoticeSeats: [...noticeSeats], exchangeReached: flags.exchange });
  await capture(fixes ? 'after-fixes-midgame' : 'next-round');
}
async function playSplendor() {
  const fixes = process.env.QA_REPLAY_ON_FINISH === '1';
  const reservedPreviewSeats = new Set();
  const colors = ['white', 'blue', 'green', 'red', 'black'];
  const all = [...colors, 'gold'];
  const flags = { duplicate: false, cancel: false, focus: false, reserve: false, gold: false, discount: false, returns: false, reserveLimit: false, nobleChoice: false, nobleVisit: false, finalTurn: false };
  const reservesBySeat = { p1: 0, p2: 0 };
  const ownHand = page => page.evaluate(async () => {
    const url = performance.getEntriesByType('resource').find(entry => /\/src\/core\/client\.ts(?:\?|$)/.test(entry.name)).name;
    const { client } = await import(url);
    return client.getSnapshot().view.ownHand;
  });
  if (fixes) for (let i = 0; i < pages.length; i++) {
    const cards = await pages[i].locator('.sp-card[data-source-zone="market"]').evaluateAll(elements => elements.map(card => {
      const rect = card.getBoundingClientRect();
      const chips = [...card.querySelectorAll('.sp-card-cost-chip')].map(chip => { const r = chip.getBoundingClientRect(); return { text: chip.textContent, fontSize: parseFloat(getComputedStyle(chip.querySelector('b')).fontSize), visible: r.width > 0 && r.height > 0, inside: r.left >= rect.left - 1 && r.right <= rect.right + 1 && r.top >= rect.top - 1 && r.bottom <= rect.bottom + 1 }; });
      return { id: card.dataset.cardId, chips, noCost: Boolean(card.querySelector('.sp-card-no-cost')) };
    }));
    check(`p${i + 1} all12 public cards have readable contained cost chips`, cards.length === 12 && cards.every(card => card.noCost || card.chips.length > 0 && card.chips.every(chip => chip.visible && chip.inside && chip.fontSize >= 13)), cards);
  }
  for (let step = 0; step < 100; step++) {
    const [state] = await both();
    if (state.result) break;
    const pi = state.turn === 'p1' ? 0 : 1, page = pages[pi], hand = await ownHand(page);
    const bank = state.board.bank, bonuses = hand.bonuses, tokens = hand.tokens;
    const handTotal = all.reduce((sum, gem) => sum + tokens[gem], 0);
    for (let i = 0; i < pages.length; i++) {
      const visible = await pages[i].locator('.sp-reserved [data-source-zone="reserved"]').evaluateAll(elements => elements.map(element => element.dataset.viewer));
      check(`p${i + 1} reserved DOM belongs only to own viewer`, visible.every(viewer => viewer === `p${i + 1}`), visible);
      check('No hidden decks or opponent reserve array in public board', state.board.decks === undefined && state.board.reserved === undefined && state.board.tokens === undefined);
      if (fixes && (i !== pi || state.phase === 'chooseNoble')) {
        const expectedPhase = state.phase === 'chooseNoble' ? i === pi ? 'noble-choice' : 'rival-noble-choice' : 'other-turn';
        const bankGuide = pages[i].locator('.sp-bank-guidance');
        check(`p${i + 1} bank guidance matches ${expectedPhase}`, await bankGuide.getAttribute('data-phase') === expectedPhase && !/Elige 3|서로 다른.*3개/.test(await bankGuide.innerText()), await bankGuide.innerText());
        if (state.phase === 'chooseNoble') report.observations.push({ nobleChoiceGuidance: `p${i + 1}`, phase: await bankGuide.getAttribute('data-phase'), bank: await bankGuide.innerText(), status: await pages[i].locator('.sp-turn-guide').innerText() });
      }
    }
    const cards = [1, 2, 3].flatMap(tier => state.board.market[tier].map(card => ({ ...card, source: 'market' }))).concat(hand.reserved.map(card => ({ ...card, source: 'reserved' })));
    const development = colors.reduce((sum, gem) => sum + bonuses[gem], 0);
    const evaluateCard = card => {
      const due = Object.fromEntries(colors.map(gem => [gem, Math.max(0, card.cost[gem] - bonuses[gem])]));
      const need = Object.fromEntries(colors.map(gem => [gem, Math.max(0, due[gem] - tokens[gem])]));
      const gold = colors.reduce((sum, gem) => sum + need[gem], 0);
      const missing = Math.max(0, gold - tokens.gold);
      const payable = colors.reduce((sum, gem) => sum + due[gem], 0);
      const scarce = colors.some(gem => need[gem] > 0 && bank[gem] === 0);
      const nobleValue = Math.max(0, ...Object.values(state.board.nobles).map(noble => {
        const before = colors.reduce((sum, gem) => sum + Math.max(0, (noble.requirement[gem] || 0) - bonuses[gem]), 0);
        return noble.requirement[card.bonus] > bonuses[card.bonus] ? (before <= 2 ? 4 : 1) : 0;
      }));
      const value = card.points * 6 + (development < 7 ? 4 : 2) + nobleValue + (card.source === 'reserved' ? 0.5 : 0);
      const feasible = payable <= 10 && colors.every(gem => due[gem] <= 4 + tokens.gold);
      return { ...card, due, need, gold, missing, payable, scarce, value, utility: value / (1 + Math.ceil(missing / 3)) };
    };
    const evaluated = cards.map(evaluateCard);
    const affordable = evaluated.filter(card => card.missing === 0).sort((a, b) => (b.value / (1 + b.payable / 5)) - (a.value / (1 + a.payable / 5)));
    const targets = evaluated.filter(card => card.missing > 0 && card.payable <= 10 && colors.every(gem => card.due[gem] <= 4 + tokens.gold + (bank.gold > 0 && hand.reserved.length < 3 ? 1 : 0))).sort((a, b) => b.utility - a.utility || a.missing - b.missing);
    let target = targets.find(card => !card.scarce) || targets[0] || evaluated.sort((a, b) => a.missing - b.missing)[0];
    let action, control;
    if (state.phase === 'chooseNoble') {
      const options = await page.locator('.sp-noble.is-selectable').evaluateAll(elements => elements.map(element => element.dataset.spNobleId));
      const id = options.slice().sort((a, b) => state.board.nobles[b].points - state.board.nobles[a].points || a.localeCompare(b))[0];
      action = { type: 'noble', id, reason: 'Choose a currently qualifying public noble with greatest prestige' };
      control = page.locator(`.sp-noble[data-sp-noble-id="${id}"]`);
      flags.nobleChoice = true;
    } else if (affordable.length) {
      target = affordable[0];
      action = { type: 'buy', id: target.id, source: target.source, points: target.points, reason: `Buy public/own card: prestige ${target.points}, discounted total ${target.payable}, gold substitution ${target.gold}` };
    } else if (target?.source === 'market' && hand.reserved.length < 3 && bank.gold > 0 && reservesBySeat[state.turn] === 0 && target.missing <= 3 && (target.points > 0 || target.scarce)) {
      action = { type: 'reserve', id: target.id, source: 'market', points: target.points, reason: `Secure near-term development/prestige target and gain gold against ${target.missing} missing tokens` };
    } else {
      const available = colors.filter(gem => bank[gem] > 0);
      const ranked = available.slice().sort((a, b) => (target?.need[b] || 0) - (target?.need[a] || 0) || bonuses[a] - bonuses[b] || bank[b] - bank[a]);
      const primary = ranked[0];
      const double = primary && bank[primary] >= 4 && target?.need[primary] >= 2 && colors.filter(gem => target.need[gem] > 0).length === 1;
      action = { type: double ? 'takeTwo' : 'take', gems: double ? [primary, primary] : ranked.slice(0, Math.min(3, available.length)), target: target?.id, reason: `Gather toward visible target ${target?.id}; outstanding colored needs ${JSON.stringify(target?.need)}` };
    }
    if (action.type === 'buy' || action.type === 'reserve') {
      const card = page.locator(`[data-source-zone="${target.source}"][data-card-id="${target.id}"]`).first();
      await card.focus(); await page.keyboard.press('Enter');
      await page.locator('.sp-action-panel').waitFor();
      await page.waitForTimeout(30);
      if (!flags.focus) { check('Keyboard card selection focuses its action panel', await page.locator('.sp-action-panel').evaluate(element => document.activeElement === element)); flags.focus = true; }
      if (!flags.cancel) {
        await page.keyboard.press('Escape'); await page.waitForTimeout(30);
        check('Escape closes payment panel and returns card focus', await page.locator('.sp-action-panel').count() === 0 && await card.evaluate(element => document.activeElement === element));
        await page.keyboard.press('Enter'); await page.locator('.sp-action-panel').waitFor();
        await page.locator('.sp-action-cancel').click(); await page.waitForTimeout(30);
        check('Explicit cancel closes selected-card panel', await page.locator('.sp-action-panel').count() === 0);
        await card.focus(); await page.keyboard.press('Enter'); await page.locator('.sp-action-panel').waitFor();
        flags.cancel = true;
      }
      const payment = await page.locator('.sp-payment-preview').innerText();
      if (fixes && target.source === 'reserved') {
        const text = await page.locator('.sp-reserve-preview').innerText();
        check('Own reserved purchase preview gives no new reserve gold', text === (pi ? 'Compra la carta que ya reservaste.' : '이미 예약한 카드 · 구매') && await page.locator('.sp-action-buttons .sp-button-quiet').count() === 0, text);
        if (!reservedPreviewSeats.has(pi)) {
          const file = path.join(out, `own-reserved-buy-p${pi + 1}.png`); await page.screenshot({ path: file, fullPage: true }); report.screenshots.push(file);
          reservedPreviewSeats.add(pi);
        }
      }
      if (action.type === 'buy') {
        flags.gold ||= target.gold > 0;
        flags.discount ||= colors.some(gem => bonuses[gem] > 0 && target.cost[gem] > 0);
        report.observations.push({ payment: { player: state.turn, version: state.version, id: target.id, source: target.source, text: payment, expectedGold: target.gold, costs: target.cost, discounts: bonuses, ownTokens: tokens } });
        control = page.locator('.sp-button-buy');
      } else {
        control = page.locator('.sp-action-buttons .sp-button-quiet');
        const select = page.locator('.sp-return-select select');
        if (await select.count()) {
          // Reserve's existing return-plan select is the UI contract. Favor
          // preserving gold by choosing a plan whose visible text excludes it.
          const goldName = pi ? 'oro' : '금';
          const options = await select.locator('option').evaluateAll(elements => elements.map(element => ({ value: element.value, text: element.textContent })));
          const best = options.find(option => !option.text.toLowerCase().includes(goldName)) || options[0];
          await select.selectOption(best.value);
        }
        flags.reserve = true; reservesBySeat[state.turn]++;
      }
    } else if (action.type === 'take' || action.type === 'takeTwo') {
      if (!action.gems.length) break;
      if (action.type === 'takeTwo') {
        const group = page.locator('.sp-gem-option').filter({ has: page.locator(`.sp-gem-pile.sp-color-${action.gems[0]}`) });
        await group.locator('.sp-double-take').click();
      } else for (const gem of action.gems) await page.locator(`button.sp-gem-pile.sp-color-${gem}`).click();
      const required = Math.max(0, handTotal + action.gems.length - 10);
      if (required) {
        await page.locator('.sp-return-tray').waitFor();
        for (const gem of all) {
          const row = page.locator(`.sp-return-stepper[data-gem="${gem}"]`);
          for (let count = 0; count < 10 && !(await row.locator('button').nth(1).isDisabled()); count++) await row.locator('button').nth(1).click();
        }
        const gained = Object.fromEntries(all.map(gem => [gem, action.gems.filter(value => value === gem).length]));
        const returns = {};
        for (let count = 0; count < required; count++) {
          const order = all.filter(gem => tokens[gem] + gained[gem] - (returns[gem] || 0) > 0).sort((a, b) => {
            const surplus = gem => tokens[gem] + gained[gem] - (returns[gem] || 0) - (gem === 'gold' ? 20 : target?.due[gem] || 0);
            return surplus(b) - surplus(a);
          });
          const gem = order[0]; returns[gem] = (returns[gem] || 0) + 1;
          await page.locator(`.sp-return-stepper[data-gem="${gem}"] button`).first().click();
        }
        action.returns = returns; flags.returns = true;
        report.observations.push({ returnPlan: { player: state.turn, before: handTotal, picked: action.gems.length, returns, text: await page.locator('.sp-token-confirm').innerText() } });
      }
      control = page.locator('.sp-token-confirm .sp-button-primary');
    }
    check('Chosen strategic Splendor action has enabled UI confirmation', !(await control.isDisabled()), { type: action.type, id: action.id });
    if (!flags.duplicate) { await control.dblclick(); flags.duplicate = true; }
    else { await control.focus(); await page.keyboard.press(step % 2 ? 'Space' : 'Enter'); }
    report.moves.push({ step: step + 1, player: state.turn, ...action, versionBefore: state.version });
    for (let attempt = 0; attempt < 40 && (await snapshot(page)).version <= state.version; attempt++) await page.waitForTimeout(50);
    check('Splendor UI action settles', (await snapshot(page)).version > state.version);
    const [after] = await both();
    check('One Splendor commit per native confirmation including duplicate', after.version === state.version + 1);
    const ownAfter = await ownHand(page);
    check('Own tokens remain within cap10', all.reduce((sum, gem) => sum + ownAfter.tokens[gem], 0) <= 10);
    if (action.type === 'buy') {
      check('Purchase adds exactly one permanent bonus', colors.reduce((sum, gem) => sum + ownAfter.bonuses[gem], 0) === development + 1);
      const expected = { ...tokens };
      for (const gem of colors) expected[gem] -= Math.min(Math.max(0, target.cost[gem] - bonuses[gem]), tokens[gem]);
      expected.gold -= target.gold;
      check('Actual payment matches own discounts and gold calculation', all.every(gem => expected[gem] === ownAfter.tokens[gem]), { goldSpent: target.gold });
    }
    flags.nobleVisit ||= after.board.ownedNobles[state.turn] > state.board.ownedNobles[state.turn];
    if (Math.max(...Object.values(after.board.score)) >= 15 && !after.result) {
      flags.finalTurn = true;
      check('15points leaves final-turn guidance until equal turns finish', await pages[0].locator('.sp-final-turn').count() === 1 && await pages[1].locator('.sp-final-turn').count() === 1, { score: after.board.score, turns: after.board.turns });
      await capture('final-turn');
    }
    if (step === 19) await capture('midgame');
    await save();
  }
  const ending = await both();
  report.final = ending.map(({ board, ...value }) => ({ ...value, score: board.score, turns: board.turns, cardCounts: Object.fromEntries(Object.entries(board.ownedBonuses).map(([seat, bonuses]) => [seat, Object.values(bonuses).reduce((sum, count) => sum + count, 0)])) }));
  report.observations.push({ reached: flags, ownReservedPreviewSeats: [...reservedPreviewSeats], boundedActions: 100, sameGameSwitcher: await pages[0].getByRole('button', { name: '게임 선택: 스플렌더', exact: true }).count(), ownCollectionKO: await pages[0].locator('.sp-bonus-row').innerText(), ownCollectionES: await pages[1].locator('.sp-bonus-row').innerText() });
  if (ending[0].result) {
    check('Splendor result waits for equal player turn counts', ending[0].board.turns.p1 === ending[0].board.turns.p2);
    check('Both result panels render correct seat-relative winner', await pages[0].locator('.tg-result').count() === 1 && await pages[1].locator('.tg-result').count() === 1);
    report.observations.push({ resultKO: await pages[0].locator('.tg-result').innerText(), resultES: await pages[1].locator('.tg-result').innerText() });
  }
  await capture(ending[0].result ? 'finished' : 'bounded-midgame');
}

// Opt in only after root freezes the coordinated fixes. Requests/consent use
// the visible replay buttons; refreshes below still never write game actions.
async function verifyFinishedReplay() {
  for (const page of pages) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator(boardSelector).waitFor();
  }
  const [before] = await both();
  check('Replay regression starts from a finished match', before.phase === 'finished' && Boolean(before.result));
  if (gameId === 'splendor') {
    for (let i = 0; i < pages.length; i++) {
      await pages[i].locator('.sp-turn-guide').waitFor();
      const text = await pages[i].locator('.sp-turn-guide').innerText();
      check(`p${i + 1} finished Splendor guidance announces completion`, i ? /termin|finaliz|acab/i.test(text) && !/Turno de la otra persona/.test(text) : /끝|종료/.test(text) && !/상대 차례예요/.test(text), text);
      const winner = before.result.winner;
      check(`p${i + 1} finished guidance reflects own result`, winner === 'draw' ? /무승부|empate/.test(text) : winner === `p${i + 1}` ? i ? /ganaste/.test(text) : /· 이겼어요/.test(text) : i ? /ganó la otra persona/.test(text) : /상대가 이겼어요/.test(text), text);
      check(`p${i + 1} finished bank guidance refuses further takes`, await pages[i].locator('.sp-bank-guidance').getAttribute('data-phase') === 'finished' && !/Elige 3/.test(await pages[i].locator('.sp-bank-guidance').innerText()));
    }
  } else if (gameId === 'domino' && before.result.winner !== 'draw') {
    const losingIndex = before.result.winner === 'p1' ? 1 : 0;
    const heading = await pages[losingIndex].locator('.domino-event-heading strong').innerText();
    check('Losing Domino headline uses the neutral result title', heading === (losingIndex ? 'Resultado del partido' : '경기 결과'), heading);
    const badge = await pages[losingIndex].locator('.domino-event-winner').innerText();
    check('Losing Domino winner badge names the rival team', badge === (losingIndex ? 'Ganó el equipo rival' : '상대 팀 승리'), badge);
  }
  const replaySelector = `.same-game-replay-button[data-game-id="${gameId}"]`;
  for (let i = 0; i < pages.length; i++) check(`p${i + 1} replay name and ready state match the contract`, await pages[i].locator(replaySelector).innerText() === (i ? 'Jugar otra vez' : '같은 게임 다시 하기') && await pages[i].locator(replaySelector).getAttribute('data-replay-state') === 'ready');
  await pages[0].locator(replaySelector).click();
  for (let attempt = 0; attempt < 40 && (await snapshot(pages[0])).pendingGame !== gameId; attempt++) await pages[0].waitForTimeout(50);
  const requested = await both();
  check('One replay request preserves the finished result for both seats', requested.every(state => state.pendingGame === gameId && state.phase === 'finished' && JSON.stringify(state.result) === JSON.stringify(before.result)), requested.map(({ playerId, version, pendingGame, phase }) => ({ playerId, version, pendingGame, phase })));
  check('Pending replay preserves the previous public game board', requested.every(state => JSON.stringify(state.board) === JSON.stringify(before.board)));
  check('The other player can approve the pending replay', await pages[1].locator(replaySelector).isEnabled());
  await capture('replay-awaiting-consent');
  await pages[1].locator(replaySelector).click();
  for (let attempt = 0; attempt < 40 && (await snapshot(pages[1])).result; attempt++) await pages[1].waitForTimeout(50);
  const fresh = await both();
  check('Other player consent creates a newer fresh same-game state', fresh.every(state => state.gameId === gameId && !state.result && !state.pendingGame && state.version > before.version));
  if (gameId === 'domino') {
    check('Replayed Domino has empty public chain and seven tiles per seat', fresh[0].board.tiles.length === 0 && fresh[0].board.counts.p1 === 7 && fresh[0].board.counts.p2 === 7);
    await privacy('play');
    for (const page of pages) check('Old Domino result and win effects are gone', await page.locator('.dp-round-result').count() === 0 && await page.locator('.domino-event-stage--win').count() === 0);
  } else {
    check('Replayed Splendor resets points, bonuses and turns', Object.values(fresh[0].board.score).every(value => value === 0) && Object.values(fresh[0].board.turns).every(value => value === 0) && Object.values(fresh[0].board.ownedBonuses).every(bonuses => Object.values(bonuses).every(value => value === 0)));
    for (const page of pages) {
      const own = await page.evaluate(async () => {
        const url = performance.getEntriesByType('resource').find(entry => /\/src\/core\/client\.ts(?:\?|$)/.test(entry.name)).name;
        const { client } = await import(url);
        return client.getSnapshot().view.ownHand;
      });
      check('Own Splendor tokens, reserves and previous result are cleared', Object.values(own.tokens).every(value => value === 0) && own.reserved.length === 0 && await page.locator('.sp-reserved-card').count() === 0 && await page.locator('.tg-result').count() === 0);
    }
  }
  report.replay = { beforeVersion: before.version, requestVersion: requested[0].version, freshVersion: fresh[0].version, game: gameId, twoPlayerConsent: true };
  await capture('replayed');
}
try {
  for (let i = 0; i < pages.length; i++) {
    await pages[i].goto(`${baseUrl}/play`);
    await pages[i].getByRole('button', { name: i === 0 ? '한국어' : 'Español · RD', exact: true }).click();
    await pages[i].locator('#nickname').fill(i === 0 ? '독립 QA 민수' : 'QA independiente Ana');
  }
  await pages[0].locator('.lobby-actions > button').click();
  await pages[0].waitForURL('**/room/**');
  report.roomId = decodeURIComponent(new URL(pages[0].url()).pathname.split('/').at(-1));
  await pages[1].locator('.code-input').fill(pages[0].url());
  await pages[1].locator('.code-input').press('Enter');
  await pages[1].waitForURL('**/room/**');
  for (let i = 0; i < pages.length; i++) await pages[i].waitForFunction(async player => { const url = performance.getEntriesByType('resource').find(entry => /\/src\/core\/client\.ts(?:\?|$)/.test(entry.name))?.name; if (!url) return false; const { client } = await import(url); return client.getSnapshot().playerId === player; }, `p${i + 1}`);
  report.seatsBeforeRefresh = await Promise.all(pages.map(page => snapshot(page)));
  await both();
  report.seatsAfterRefresh = await Promise.all(pages.map(page => snapshot(page)));
  check('Different contexts own separate seats', report.seatsAfterRefresh[0].playerId === 'p1' && report.seatsAfterRefresh[1].playerId === 'p2', report.seatsAfterRefresh.map(({ playerId, players, gameId, roomId }) => ({ playerId, players, gameId, roomId })));
  await pages[0].locator('.room-game-card').filter({ hasText: gameId === 'domino' ? '도미노' : gameId === 'jaipur' ? '자이푸르' : '스플렌더' }).click();
  await snapshot(pages[1], true);
  await pages[1].locator('.room-game-card').filter({ hasText: gameId === 'domino' ? 'Dominó' : gameId === 'jaipur' ? 'Jaipur' : 'Splendor' }).focus();
  await pages[1].keyboard.press('Enter');
  await pages[1].locator(boardSelector).waitFor();
  await both();
  await pages[0].locator(boardSelector).waitFor();
  await capture('initial');
  if (gameId === 'domino') {
  let duplicateDone = false, wrongEndDone = false, escapeDone = false;
  for (let step = 0; step < 40; step++) {
    const [publicState] = await both();
    if (publicState.phase !== 'play') break;
    await privacy(publicState.phase);
    const index = publicState.turn === 'p1' ? 0 : 1;
    const page = pages[index];
    const hand = await page.locator('.dp-hand-tile').evaluateAll(elements => elements.map(element => ({ index: Number(element.dataset.dominoIndex), a: Number(element.dataset.dominoA), b: Number(element.dataset.dominoB), enabled: !element.disabled })));
    const ends = publicState.board.ends;
    // Use only this player's hand and public ends: shed pips while keeping
    // connected numbers for future turns. No legal-action enumeration.
    const candidates = hand.filter(tile => tile.enabled).flatMap(tile => {
      const sides = !ends ? ['left'] : ['left', 'right'].filter(side => tile.a === ends[side] || tile.b === ends[side]);
      return sides.map(side => {
        const outer = !ends ? tile.a : tile.a === ends[side] ? tile.b : tile.a;
        const support = hand.filter(other => other.index !== tile.index && (other.a === outer || other.b === outer)).length;
        return { ...tile, side, outer, support, utility: tile.a + tile.b + support * 2 + (tile.a === tile.b ? 1 : 0) };
      });
    }).sort((a, b) => b.utility - a.utility || b.support - a.support || b.a - a.a || a.side.localeCompare(b.side));
    if (!candidates.length) {
      await page.locator('.dp-pass').click();
      report.moves.push({ step: step + 1, player: publicState.turn, type: 'pass', reason: 'No enabled matching tile in this player’s hand', versionBefore: publicState.version });
    } else {
      const move = candidates[0];
      const tile = page.locator(`.dp-hand-tile[data-domino-index="${move.index}"]`);
      await tile.focus();
      await page.keyboard.press('Enter');
      if (!escapeDone) {
        await page.keyboard.press('Escape');
        check('Escape cancels selection and restores tile focus', await page.locator('.dp-hand-tile.is-selected').count() === 0 && await tile.evaluate(element => document.activeElement === element));
        await page.keyboard.press('Enter');
        escapeDone = true;
      }
      const endpoint = !ends ? page.locator('.dp-start-target') : page.locator(`.dp-end-target[data-domino-side="${move.side}"]`);
      if (ends && !wrongEndDone) {
        const wrong = page.locator('.dp-end-target:disabled').first();
        if (await wrong.count()) {
          const rect = await wrong.boundingBox();
          await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height / 2);
          check('Wrong endpoint is disabled and cannot advance version', (await snapshot(page)).version === publicState.version && await page.locator('.dp-hand-tile.is-selected').count() === 1, await wrong.getAttribute('aria-label'));
          wrongEndDone = true;
        }
      }
      if (ends && !duplicateDone) {
        await endpoint.dblclick();
        duplicateDone = true;
      } else {
        await endpoint.focus();
        await page.keyboard.press(step % 2 ? 'Space' : 'Enter');
      }
      report.moves.push({ step: step + 1, player: publicState.turn, type: 'play', tile: [move.a, move.b], side: move.side, reason: `shed ${move.a + move.b} pips; keep ${move.support} tiles connected to outer ${move.outer}`, versionBefore: publicState.version, keyboard: !duplicateDone || step > 1 });
    }
    for (let attempt = 0; attempt < 40 && (await snapshot(page)).version <= publicState.version; attempt++) await page.waitForTimeout(50);
    check('The UI request settles before comparing peers', (await snapshot(page)).version > publicState.version);
    const after = await both();
    check('One commit per UI move including duplicate clicks', after[0].version === publicState.version + 1, { before: publicState.version, after: after[0].version });
    check('Turn changes or round finishes', after[0].phase !== 'play' || after[0].turn !== publicState.turn);
    if (step === 6) await capture('midgame');
    await save();
  }
  const final = await both();
  report.final = final.map(({ board, ...value }) => ({ ...value, tileCount: board.tiles.length, counts: board.counts, result: value.result }));
  check('Default single round finishes through UI play', final[0].phase === 'finished' && Boolean(final[0].result));
  check('Both result panels appear in their languages', await pages[0].locator('.dp-round-result').count() === 1 && await pages[1].locator('.dp-round-result').count() === 1);
  await capture('finished');
  report.observations.push({ resultKO: await pages[0].locator('.dp-round-result').innerText(), resultES: await pages[1].locator('.dp-round-result').innerText(), restartControls: await pages[0].locator('button').allTextContents(), sameGameSwitcher: await pages[0].getByRole('button', { name: '게임 선택: 도미노', exact: true }).count(), wrongEndDone, duplicateDone });
  for (const page of pages) {
    await page.setViewportSize({ width: 390, height: 844 });
    report.observations.push({ narrowReadOnly: await page.locator('body').innerText(), documentWidth: await page.evaluate(() => document.documentElement.scrollWidth) });
  }
  } else if (gameId === 'jaipur') await playJaipur();
  else await playSplendor();
  if (process.env.QA_REPLAY_ON_FINISH === '1' && gameId !== 'jaipur') await verifyFinishedReplay();
  check('No uncaught browser errors', report.errors.length === 0, report.errors);
} catch (error) {
  report.failure = { message: error.message, stack: error.stack };
  await capture('interrupted');
  throw error;
} finally {
  await save();
  await browser.close();
  console.log(JSON.stringify({ actions: report.moves.length, checks: report.checks.length, errors: report.errors, final: report.final, failure: report.failure, out }));
}

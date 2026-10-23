// UI-only Domino bot smoke test against the local SQL/RLS/authority fixture.
// Create/join, game consent, configuration and every human move use visible controls.
// reconnectRoom/getSnapshot are read-only fixture refreshes; no state or actions are injected.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { launchChromium } from './playwright-browser.mjs';

const baseUrl = process.env.DOMINO_AI_QA_URL || 'http://127.0.0.1:5192';
const output = path.resolve(process.env.DOMINO_AI_ARTIFACT_DIR || `output/playwright/domino-ai/${Date.now()}`);
const configurationOnly = process.argv.includes('--configuration-only');
const scenarios = ['humans-vs-bots', 'partners'];
const configurationAttemptLimits = (process.argv.find(value => value.startsWith('--configuration-attempts='))?.split('=')[1] ?? '4,4').split(',').map(Number);
assert(configurationAttemptLimits.length === 2 && configurationAttemptLimits.every(value => Number.isInteger(value) && value >= 1 && value <= 4), 'Configuration attempt limits must be two integers between 1 and 4.');
const report = {
  game: 'domino', baseUrl, modes: scenarios,
  configurationOnly,
  configurationAttemptLimits,
  method: 'Two isolated KO / ES-DO browser contexts; UI-only room, consent, configuration and actions; exact-client read-only refresh; no game-state injection or sendAction calls.',
  checks: [], moves: [], errors: [], scenarios: [],
};
const check = (name, condition, details) => {
  report.checks.push({ name, pass: Boolean(condition), details });
  assert(condition, name);
};
const save = () => fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));

await fs.mkdir(output, { recursive: true });
const transformedPlayApp = await (await fetch(`${baseUrl}/src/app/PlayApp.tsx`)).text();
const clientModuleUrl = transformedPlayApp.match(/import\("([^"\n]*\/core\/client\.ts[^"\n]*)"\)/)?.[1];
assert.ok(clientModuleUrl, 'The running Vite app must expose its exact client module URL for authorized read-only refreshes.');
const browser = await launchChromium();
const contexts = await Promise.all(['ko', 'es'].map(() => browser.newContext({ viewport: { width: 1440, height: 900 } })));
const pages = await Promise.all(contexts.map(context => context.newPage()));
for (const page of pages) {
  page.setDefaultTimeout(10_000);
  page.on('pageerror', error => report.errors.push(error.message));
}

async function readSnapshot(page, refresh = false) {
  return page.evaluate(async ({ moduleUrl, refreshSnapshot }) => {
    const client = (await import(moduleUrl)).client;
    if (refreshSnapshot) await client.reconnectRoom();
    const snapshot = client.getSnapshot();
    const view = snapshot.view;
    const board = view?.board;
    return {
      roomId: snapshot.roomId, playerId: snapshot.playerId, mode: snapshot.mode,
      gameId: snapshot.gameId, version: snapshot.version, pendingGame: snapshot.pendingGame,
      language: document.documentElement.lang, dominoMode: view?.mode, phase: view?.phase, turn: view?.turn,
      status: view?.status, round: view?.round, settings: view?.settings,
      hand: view?.hand, actions: view?.actions,
      board: board ? Object.fromEntries(Object.entries(board).filter(([key]) => key !== 'reservedOpponentCount')) : null,
      result: view?.result,
    };
  }, { moduleUrl: clientModuleUrl, refreshSnapshot: refresh });
}

async function synchronizedSnapshots() {
  let states;
  for (let attempt = 0; attempt < 8; attempt++) {
    states = await Promise.all(pages.map(page => readSnapshot(page, true)));
    if (states[0].version === states[1].version && JSON.stringify(states[0].board) === JSON.stringify(states[1].board)) break;
    await pages[0].waitForTimeout(60);
  }
  check('Both independent viewers see the same latest public Domino board',
    states[0].version === states[1].version && JSON.stringify(states[0].board) === JSON.stringify(states[1].board),
    states.map(({ playerId, version, phase, turn, round }) => ({ playerId, version, phase, turn, round })));
  check('Snapshot contains only the Domino player view, not raw engine secrets',
    states.every(state => state.hand && state.board && !('seed' in state.board) && !('hands' in state.board) && !('stock' in state.board)),
    states.map(state => Object.keys(state.board ?? {})));
  return states;
}

async function checkPrivacy(states, label) {
  const phase = states[0].phase;
  for (let i = 0; i < pages.length; i++) {
    if (phase === 'play') await pages[i].waitForFunction(count => document.querySelectorAll('.dp-hand .dp-hand-tile').length === count, states[i].hand.length);
    const visible = await pages[i].evaluate(() => ({
      ownFaces: document.querySelectorAll('.dp-hand .dp-hand-tile[data-domino-a][data-domino-b]').length,
      opponentSeatFaces: document.querySelectorAll('.dp-seat:not(.is-you) [data-domino-a][data-domino-b]').length,
      revealedHands: document.querySelectorAll('.dp-revealed-hand [data-domino-a][data-domino-b]').length,
      renderedOwnCount: document.querySelectorAll('.dp-hand .dp-hand-tile').length,
      documentLanguage: document.documentElement.lang,
    }));
    check(`${label}: viewer ${i + 1} sees only their hand during active play`,
      phase !== 'play' || (visible.ownFaces === states[i].hand.length && visible.opponentSeatFaces === 0 && visible.revealedHands === 0),
      { ...visible, privateHandCount: states[i].hand.length, phase });
    if (phase === 'play') check(`${label}: viewer ${i + 1} hand DOM matches their private view`, visible.renderedOwnCount === states[i].hand.length, visible);
  }
}

async function enterDominoRoom(scenario) {
  await Promise.all(pages.map(page => page.goto(`${baseUrl}/play`)));
  await pages[0].getByRole('button', { name: '한국어', exact: true }).click();
  await pages[1].getByRole('button', { name: 'Español · RD', exact: true }).click();
  await pages[0].locator('#nickname').fill(`도미노 QA ${scenario}`);
  await pages[1].locator('#nickname').fill(`QA dominó ${scenario}`);
  await pages[0].locator('.lobby-actions > button').click();
  await pages[0].waitForURL('**/play?room=*');
  const invitation = pages[0].url();
  await pages[1].locator('.code-input').fill(invitation);
  await pages[1].locator('.code-input').press('Enter');
  await pages[1].waitForURL('**/play?room=*');
  let states = await Promise.all(pages.map(page => readSnapshot(page, true)));
  check(`${scenario}: two contexts joined distinct seats in one room`,
    states[0].playerId === 'p1' && states[1].playerId === 'p2' && states[0].roomId === states[1].roomId,
    states.map(({ playerId, roomId, mode }) => ({ playerId, roomId, mode })));
  check(`${scenario}: language contexts remain KO and Dominican Spanish`, states[0].language === 'ko' && states[1].language === 'es-DO', states.map(state => state.language));

  await pages[0].locator('.room-game-card').filter({ hasText: '도미노' }).click();
  await pages[0].waitForFunction(async moduleUrl => (await import(moduleUrl)).client.getSnapshot().pendingGame === 'domino', clientModuleUrl);
  await readSnapshot(pages[1], true);
  await pages[1].locator('.room-game-card').filter({ hasText: 'Dominó' }).click();
  await pages[1].waitForFunction(async moduleUrl => (await import(moduleUrl)).client.getSnapshot().gameId === 'domino', clientModuleUrl);
  await readSnapshot(pages[0], true);
  await Promise.all(pages.map(page => page.locator('.domino-premium').waitFor()));
  states = await synchronizedSnapshots();
  check(`${scenario}: both players consented to Domino through the room UI`, states.every(state => state.gameId === 'domino' && state.mode === 'online'));
  return states;
}

async function applyHardConfiguration(scenario) {
  const settingsButton = pages[0].locator('.dp-settings-launcher');
  await settingsButton.click();
  const selects = pages[0].locator('.dp-setup-dialog .dp-config-grid select');
  await selects.nth(0).selectOption(scenario);
  await selects.nth(1).selectOption('hard');
  await selects.nth(2).selectOption('200');
  await pages[0].locator('.dp-setup-dialog .dp-primary').click();
  await pages[0].locator('.dp-setup-dialog').waitFor({ state: 'detached' });
  const states = await synchronizedSnapshots();
  const expectedSeats = scenario === 'partners' ? ['p1', 'p2', 'b1', 'b2'] : ['p1', 'b1', 'p2', 'b2'];
  check(`${scenario}: UI configuration persisted exact mode and hard bot difficulty`,
    states.every(state => state.dominoMode === scenario && state.settings?.difficulty === 'hard' && state.board?.settings?.difficulty === 'hard' && state.board?.seats?.join(',') === expectedSeats.join(',')),
    states.map(state => ({ settings: state.settings, boardSettings: state.board?.settings, seats: state.board?.seats, turn: state.turn, tiles: state.board?.tiles?.length })));
  const launcher = pages[0].locator('.dp-settings-launcher');
  if (await launcher.count()) {
    await launcher.click();
    const saved = pages[0].locator('.dp-setup-dialog .dp-config-grid select');
    const values = { mode: await saved.nth(0).inputValue(), difficulty: await saved.nth(1).inputValue(), target: await saved.nth(2).inputValue() };
    check(`${scenario}: reopened settings UI retains selected mode, hard difficulty and one-round target`,
      values.mode === scenario && values.difficulty === 'hard' && values.target === '0', values);
    if (configurationOnly) await pages[0].screenshot({ path: path.join(output, `${scenario}-reopened-settings-ko.png`), fullPage: true });
    const close = pages[0].locator('.dp-setup-dialog .dp-modal-close');
    // The dialog may be absent after capture; saved-value assertions already ran.
    if (await close.isVisible()) await close.click();
  } else {
    await pages[0].locator('.dp-settings-readout summary').click();
    const readout = await pages[0].locator('.dp-settings-readout').innerText();
    check(`${scenario}: hard difficulty remains visible after the opening tile`, /도전/.test(readout), readout);
  }
  return states;
}

async function chooseMove(page, state) {
  const hand = await page.locator('.dp-hand-tile').evaluateAll(elements => elements.map(element => ({
    index: Number(element.dataset.dominoIndex), a: Number(element.dataset.dominoA), b: Number(element.dataset.dominoB), playable: !element.disabled,
  })));
  const ends = state.board.ends;
  const candidates = hand.filter(tile => tile.playable).flatMap(tile => {
    const sides = !ends ? ['opening'] : ['left', 'right'].filter(side => tile.a === ends[side] || tile.b === ends[side]);
    return sides.map(side => {
      const outer = !ends ? tile.a : tile.a === ends[side] ? tile.b : tile.a;
      const support = hand.filter(other => other.index !== tile.index && (other.a === outer || other.b === outer)).length;
      return { ...tile, side, outer, support, utility: tile.a + tile.b + support * 2 + (tile.a === tile.b ? 1 : 0) };
    });
  }).sort((a, b) => b.utility - a.utility || b.support - a.support || b.a - a.a || a.side.localeCompare(b.side));
  return candidates[0] ?? null;
}

async function playScenario(scenario) {
  await enterDominoRoom(scenario);
  let states = await applyHardConfiguration(scenario);
  const record = { mode: scenario, roomId: states[0].roomId, humanMoves: 0, botActionsObserved: 0, rounds: [], checks: [] };
  report.scenarios.push(record);
  let totalMoves = 0;
  for (let step = 0; step < 160; step++) {
    states = await synchronizedSnapshots();
    const state = states[0];
    await checkPrivacy(states, `${scenario} step ${step}`);
    if (state.phase === 'round-over' || state.phase === 'finished') {
      record.rounds.push({ round: state.round, phase: state.phase, tiles: state.board.tiles.length, result: state.result, roundResult: state.board.roundResult });
      break;
    }
    check(`${scenario}: expected public play phase`, state.phase === 'play', { phase: state.phase, status: state.status });
    if (state.turn !== 'p1' && state.turn !== 'p2') {
      // Bots normally run within the preceding UI action. This read-only poll covers fixture latency only.
      await pages[0].waitForTimeout(80);
      continue;
    }
    const index = state.turn === 'p1' ? 0 : 1;
    const page = pages[index];
    const before = state;
    const move = await chooseMove(page, before);
    if (!move) {
      const pass = page.locator('.dp-pass');
      check(`${scenario}: no playable own tile is represented by the visible pass control`, await pass.count() === 1 && await pass.isEnabled(), { player: state.turn, ends: state.board.ends });
      await pass.click();
      report.moves.push({ mode: scenario, round: state.round, step: record.humanMoves + 1, player: state.turn, type: 'pass', versionBefore: state.version });
    } else {
      const tile = page.locator(`.dp-hand-tile[data-domino-index="${move.index}"]`);
      await tile.focus();
      await page.keyboard.press('Enter');
      const endpoint = move.side === 'opening' ? page.locator('.dp-start-target') : page.locator(`.dp-end-target[data-domino-side="${move.side}"]`);
      check(`${scenario}: own-hand/public-ends strategy targets an enabled visible endpoint`, await endpoint.count() === 1 && await endpoint.isEnabled(), { tile: [move.a, move.b], side: move.side, ends: state.board.ends });
      await endpoint.focus();
      await page.keyboard.press(record.humanMoves % 2 ? 'Space' : 'Enter');
      report.moves.push({ mode: scenario, round: state.round, step: record.humanMoves + 1, player: state.turn, type: 'play', tile: [move.a, move.b], side: move.side, ownHandSupport: move.support, versionBefore: state.version });
    }
    record.humanMoves++;
    totalMoves++;
    for (let attempt = 0; attempt < 60; attempt++) {
      const refreshed = await readSnapshot(page, true);
      if (refreshed.version > before.version) break;
      await page.waitForTimeout(50);
    }
    const after = await synchronizedSnapshots();
    check(`${scenario}: each human UI action commits exactly one authority version`, after[0].version === before.version + 1, { before: before.version, after: after[0].version });
    check(`${scenario}: bot automation resolves to a human turn or round end`, after[0].phase !== 'play' || ['p1', 'p2'].includes(after[0].turn), { turn: after[0].turn, phase: after[0].phase, status: after[0].status, publicTiles: after[0].board.tiles.length });
    check(`${scenario}: board/counts agree with visible public board`, await Promise.all(pages.map(async (viewer, viewerIndex) => {
      const dom = await viewer.evaluate(() => ({ tiles: document.querySelectorAll('.dp-felt .dp-chain [data-sequence]').length, ownTiles: document.querySelectorAll('.dp-hand-tile').length }));
      return dom.tiles === after[viewerIndex].board.tiles.length && dom.ownTiles === after[viewerIndex].hand.length;
    })).then(results => results.every(Boolean)), after.map(state => ({ version: state.version, tiles: state.board.tiles.length, counts: state.board.counts })));
    const lastSequence = Math.max(0, ...before.board.actionLog.map(event => Number(event.sequence) || 0));
    record.botActionsObserved += after[0].board.actionLog.filter(event => event.sequence > lastSequence && /^b[12]$/.test(event.actor ?? '') && ['play', 'pass'].includes(event.type)).length;
    if (totalMoves === 10) {
      for (let i = 0; i < pages.length; i++) {
        const file = path.join(output, `${scenario}-${i === 0 ? 'ko' : 'es'}-midgame.png`);
        await pages[i].screenshot({ path: file, fullPage: true });
        record.checks.push({ type: 'midgame-screenshot', language: i === 0 ? 'ko' : 'es-DO', path: file });
      }
    }
    await save();
  }
  states = await synchronizedSnapshots();
  check(`${scenario}: reached ten human moves or a natural finished game with bot progress`, record.humanMoves >= 10 || (states[0].phase === 'finished' && record.botActionsObserved > 0), { humanMoves: record.humanMoves, botActionsObserved: record.botActionsObserved, phase: states[0].phase, roundPhase: states[0].board.roundResult ? 'round-over' : undefined });
  check(`${scenario}: hard bots made visible automatic public actions`, record.botActionsObserved > 0, { botActionsObserved: record.botActionsObserved, humanMoves: record.humanMoves });
  check(`${scenario}: hard difficulty remains visible in the final public view`, states.every(state => state.settings?.difficulty === 'hard'), states.map(state => state.settings));
  check(`${scenario}: no browser page errors`, report.errors.length === 0, report.errors);
  record.final = states.map(({ playerId, version, phase, turn, round, settings, board, result }) => ({ playerId, version, phase, turn, round, settings, tileCount: board?.tiles?.length, counts: board?.counts, result }));
  for (let i = 0; i < pages.length; i++) {
    const file = path.join(output, `${scenario}-${i === 0 ? 'ko' : 'es'}-final.png`);
    await pages[i].screenshot({ path: file, fullPage: true });
    record.checks.push({ type: 'final-screenshot', language: i === 0 ? 'ko' : 'es-DO', path: file });
  }
  await save();
}

async function checkConfigurationReopen(scenario) {
  const record = { mode: scenario, configurationOnly: true, attempts: [], reopened: false };
  report.scenarios.push(record);
  const maximumAttempts = configurationAttemptLimits[scenarios.indexOf(scenario)];
  for (let attempt = 1; attempt <= maximumAttempts; attempt++) {
    await enterDominoRoom(scenario);
    const priorChecks = report.checks.length;
    const states = await applyHardConfiguration(scenario);
    const reopened = report.checks.slice(priorChecks).some(item => item.name.includes('reopened settings UI'));
    const state = states[0];
    record.attempts.push({ attempt, roomId: state.roomId, turn: state.turn, phase: state.phase,
      tiles: state.board.tiles.length, openingPlacedBy: state.board.tiles[0]?.by ?? null, reopened,
      reason: reopened ? 'Human opening leaves the setup launcher available.' : 'A bot naturally placed the opening tile; only the saved readout remains.' });
    record.reopened = reopened;
    await pages[0].locator('.room-close-link').click();
    await pages[0].locator('.close-actions .button-danger').click();
    await pages[0].waitForURL('**/play');
    record.attempts.at(-1).closedViaUI = true;
    await save();
    if (reopened) break;
  }
  record.outcome = record.reopened ? 'verified' : `not-reached-in-${maximumAttempts}-natural-deals`;
  await save();
}

try {
  for (const scenario of scenarios) {
    if (configurationOnly) await checkConfigurationReopen(scenario);
    else await playScenario(scenario);
  }
  check('Both requested Domino bot modes were exercised', report.scenarios.map(result => result.mode).join(',') === scenarios.join(','), report.scenarios.map(result => result.mode));
  check('No uncaught browser errors across both modes', report.errors.length === 0, report.errors);
} catch (error) {
  report.failure = { message: error.message, stack: error.stack };
  await save();
  throw error;
} finally {
  await Promise.all(contexts.map(context => context.close()));
  await browser.close();
  await save();
}

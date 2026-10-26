import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const folder = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const base = process.env.MARBLE_URL ?? 'http://127.0.0.1:5176/play?game=marble';

async function capture(mode, scenario, width = 1280, height = 800) {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base);
  const setup = await page.evaluate(async ({ mode, scenario }) => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const ReactDOM = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const engine = mode === '2p' ? (await import('/src/games/marble.ts')).marbleEngine : (await import('/src/games/fourMarble.ts')).fourMarbleEngine;
    const Screen = (await import(mode === '2p' ? '/src/app/MarbleBoard.tsx' : '/src/app/MarbleTeamBoard.tsx')).default;
    const initial = engine.createInitialState(71);
    const levels = [[1, 0, 'p1'], [3, 1, 'p1'], [4, 2, mode === '2p' ? 'p2' : 'p4'], [5, 3, 'p1']];
    if (scenario === 'levels') for (const [tile, houses, owner] of levels) initial.properties[tile] = { owner, houses };
    if (scenario === 'purchase') { initial.positions.p1 = 1; initial.pendingTile = 1; initial.phase = 'decision'; }
    if (scenario === 'build') { initial.positions.p1 = 1; initial.properties[1] = { owner: 'p1', houses: 1 }; initial.phase = 'main'; initial.pendingTile = 1; }
    if (scenario === 'debt-sale') {
      initial.phase = 'debt'; initial.money.p1 = 0; initial.debt.p1 = 330;
      initial.properties[1] = { owner: 'p1', houses: 1 }; initial.properties[3] = { owner: 'p1', houses: 0 };
      initial.pendingPayment = mode === '2p' ? { amount: 120, creditor: 'bank', reason: { ko: '도시세', es: 'Impuesto' }, type: 'tax', tile: 5, resumePhase: 'main', resumeActive: 'p1' } : { amount: 120, creditor: 'p4', resumeActive: 'p1' };
    }
    if (scenario === 'rent' || scenario === 'rent-pass' || scenario === 'takeover') {
      const board = engine.getPlayerView(initial, 'p1');
      const tile = mode === '2p' ? board.board.tiles[4] : board.publicBoard[4];
      initial.positions.p1 = 4;
      initial.properties[4] = { owner: mode === '2p' ? 'p2' : 'p4', houses: 1 };
      initial.pendingTile = 4;
      if (scenario === 'takeover') { initial.phase = 'main'; initial.takeoverTile = 4; }
      else {
        initial.phase = 'rent-decision';
        initial.pendingRent = { amount: tile.rent * 2, creditor: mode === '2p' ? 'p2' : 'p4', playerId: 'p1', tile: 4 };
        if (scenario === 'rent-pass') initial.rentPasses.p1 = 1;
      }
    }
    window.__marbleEngine = engine;
    window.__marbleState = initial;
    function Live() {
      const [state, setState] = React.useState(initial);
      const view = engine.getPlayerView(state, 'p1');
      return React.createElement(Screen, { view, language: 'ko', playerId: 'p1', nickname: '플레이어', runAction: async action => {
        const next = engine.applyAction(window.__marbleState, 'p1', action);
        window.__marbleState = next;
        setState(next);
        return true;
      }, onReplay: () => {}, onExit: () => {} });
    }
    document.body.innerHTML = '<div id="fixture"></div>';
    ReactDOM.createRoot(document.querySelector('#fixture')).render(React.createElement(Live));
    const view = engine.getPlayerView(initial, 'p1');
    return { cells: mode === '2p' ? view.board.tiles.length : view.publicBoard.length, actions: view.actions.map(item => item.action) };
  }, { mode, scenario });
  await page.locator('.mp-board-grid--40').waitFor();
  await page.waitForTimeout(170);
  const file = `${mode}-${scenario}-${width}x${height}.png`;
  await fs.mkdir(folder, { recursive: true });
  await page.screenshot({ path: path.join(folder, file) });
  const board = await page.locator('.mp-board-grid--40').boundingBox();
  console.log(file, JSON.stringify({ setup, board, errors }));
  if (setup.cells !== 40 || errors.length) throw Error(`Invalid ${file}: ${errors.join(', ')}`);
  if (scenario === 'levels') {
    await page.locator('.mp-tile').nth(4).locator('.mp-tile-select').click();
    await page.screenshot({ path: path.join(folder, `${mode}-apartment-selected-${width}x${height}.png`) });
  }
  if (scenario === 'debt-sale') {
    const sale=page.locator('.marble-property-sale');
    await sale.locator('select').selectOption('3');
    await sale.locator('button').click();
    await page.waitForTimeout(120);
    const after=await page.evaluate(()=>({first:window.__marbleState.properties[1]?.owner,second:window.__marbleState.properties[3]?.owner,cash:window.__marbleState.money.p1}));
    if(after.first!=='p1'||after.second)throw Error(`${file}: wrong city sold ${JSON.stringify(after)}`);
    console.log('selected sale',file,JSON.stringify(after));
    await page.screenshot({path:path.join(folder,`${mode}-debt-sale-resolved-${width}x${height}.png`)});
  }
  if (['purchase', 'build', 'rent', 'rent-pass', 'takeover'].includes(scenario)) {
    const action = scenario === 'rent-pass' ? page.locator('.mp-center-stage .mp-action-secondary,.mp-center-stage .mt-stage-skip').last() : page.locator('#mp-action-primary,#mt-action-primary').first();
    if (!await action.isVisible() || await action.isDisabled()) throw Error(`${file}: primary action unavailable`);
    const before = await page.evaluate(() => ({ cash: window.__marbleState.money.p1, houses: window.__marbleState.properties[1]?.houses ?? 0, rent: window.__marbleState.pendingRent?.amount ?? 0, passes: window.__marbleState.rentPasses.p1 }));
    await action.click();
    await page.waitForTimeout(200);
    const after = await page.evaluate(scenario => ({ cash: window.__marbleState.money.p1, owner: window.__marbleState.properties[scenario === 'takeover' ? 4 : 1]?.owner, houses: window.__marbleState.properties[1]?.houses ?? 0, event: window.__marbleState.actionLog?.at(-1)?.type, passes: window.__marbleState.rentPasses.p1 }), scenario);
    if (scenario === 'purchase' && (after.cash !== before.cash - 100 || after.owner !== 'p1')) throw Error(`${file}: purchase mismatch`);
    if (scenario === 'build' && (after.cash !== before.cash - 60 || after.houses !== before.houses + 1)) throw Error(`${file}: build mismatch`);
    if (scenario === 'rent' && after.cash !== before.cash - before.rent) throw Error(`${file}: rent mismatch`);
    if (scenario === 'rent-pass' && (after.cash !== before.cash || after.passes !== 0)) throw Error(`${file}: rent pass mismatch`);
    if (scenario === 'takeover' && (after.cash >= before.cash || after.owner !== 'p1')) throw Error(`${file}: takeover mismatch`);
    console.log('resolved', file, JSON.stringify({ before, after }));
    await page.screenshot({ path: path.join(folder, `${mode}-${scenario}-resolved-${width}x${height}.png`) });
  }
  await page.close();
}

try {
  for (const mode of ['2p', '4p']) for (const scenario of ['stage', 'levels', 'purchase', 'build', 'rent', 'rent-pass', 'takeover', 'debt-sale']) {
    if (!process.env.MARBLE_CAPTURE_FILTER || `${mode}-${scenario}`.includes(process.env.MARBLE_CAPTURE_FILTER)) await capture(mode, scenario);
  }
  if (!process.env.MARBLE_CAPTURE_FILTER) for (const mode of ['2p', '4p']) await capture(mode, 'stage', 1440, 900);
} finally { await browser.close(); }

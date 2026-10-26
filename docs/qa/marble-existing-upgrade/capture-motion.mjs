import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';

const folder = path.dirname(fileURLToPath(import.meta.url));
const run = promisify(execFile);
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
try {
  for (const mode of ['2p', '4p']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'no-preference' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.MARBLE_URL ?? 'http://127.0.0.1:5176/play?game=marble');
    const initial = await page.evaluate(async mode => {
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const ReactDOM = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const engine = mode === '2p' ? (await import('/src/games/marble.ts')).marbleEngine : (await import('/src/games/fourMarble.ts')).fourMarbleEngine;
      const Screen = (await import(mode === '2p' ? '/src/app/MarbleBoard.tsx' : '/src/app/MarbleTeamBoard.tsx')).default;
      let seed = 0;
      for (let candidate = 1; candidate < 300; candidate++) {
        const state = engine.createInitialState(candidate);
        const next = engine.applyAction(state, 'p1', { type: 'roll' });
        if (next.phase === 'decision' && next.pendingTile != null) { seed = candidate; break; }
      }
      if (!seed) throw Error('No purchasable opening roll in seed search');
      const state = engine.createInitialState(seed);
      window.__marbleEngine = engine;
      window.__marbleState = state;
      function Live() {
        const [match, setMatch] = React.useState(state);
        const view = engine.getPlayerView(match, 'p1');
        return React.createElement(Screen, { view, language: 'ko', playerId: 'p1', nickname: '플레이어', runAction: async action => {
          const next = engine.applyAction(window.__marbleState, 'p1', action);
          window.__marbleState = next;
          setMatch(next);
          return true;
        }, onReplay: () => {}, onExit: () => {} });
      }
      document.body.innerHTML = '<div id="fixture"></div>';
      ReactDOM.createRoot(document.querySelector('#fixture')).render(React.createElement(Live));
      return { seed, boardSize: mode === '2p' ? engine.getPlayerView(state, 'p1').board.tiles.length : engine.getPlayerView(state, 'p1').publicBoard.length };
    }, mode);
    await page.locator('.mp-board-grid--40').waitFor();
    const frameDir = await fs.mkdtemp(path.join(tmpdir(), `marble-existing-motion-${mode}-`));
    const cdp = await page.context().newCDPSession(page);
    const encoded = [];
    let videoFrames = 0;
    cdp.on('Page.screencastFrame', packet => {
      encoded.push(fs.writeFile(path.join(frameDir, `video-${String(videoFrames++).padStart(3, '0')}.jpg`), Buffer.from(packet.data, 'base64')));
      void cdp.send('Page.screencastFrameAck', { sessionId: packet.sessionId });
    });
    await page.evaluate(() => {
      window.__marbleMotionTrace = [];
      const board = document.querySelector('.mp-board-grid--40');
      const sample = () => {
        const tile = board.querySelector('.mp-tile.is-moving');
        const pawn = tile?.querySelector('.mp-pawn-marker.is-moving-pawn');
        if (tile) window.__marbleMotionTrace.push({ cell: tile.querySelector('.mp-pawns')?.getAttribute('data-cell-number'), pawn: !!pawn, visible: !!pawn && getComputedStyle(pawn).visibility !== 'hidden' && Number(getComputedStyle(pawn).opacity) > 0 });
      };
      new MutationObserver(sample).observe(board, { subtree: true, attributes: true, attributeFilter: ['class'] });
    });
    const trace = [];
    let frame = 0;
    const shot = async label => {
      const data = await page.evaluate(() => ({ phase: window.__marbleState.phase, position: window.__marbleState.positions.p1, cash: window.__marbleState.money.p1, houses: window.__marbleState.properties[window.__marbleState.positions.p1]?.houses ?? 0, movingCell: document.querySelector('.mp-tile.is-moving')?.querySelector('.mp-pawns')?.getAttribute('data-cell-number') ?? null, movingPawn: !!document.querySelector('.mp-tile.is-moving .mp-pawn-marker.is-moving-pawn'), status: document.querySelector('.mp-center-stage h2')?.textContent ?? '' }));
      trace.push({ frame, label, ...data });
      await page.screenshot({ path: path.join(frameDir, `${String(frame).padStart(3, '0')}.png`), animations: 'allow' });
      frame++;
    };
    await shot('before-roll');
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 84, maxWidth: 1280, maxHeight: 800, everyNthFrame: 1 });
    await page.locator('#mp-action-primary,#mt-action-primary').first().click();
    for (let i = 0; i < 43; i++) { await shot('roll-move'); await page.waitForTimeout(50); }
    const rolled = await page.evaluate(() => ({ phase: window.__marbleState.phase, position: window.__marbleState.positions.p1, cash: window.__marbleState.money.p1 }));
    if (rolled.phase !== 'decision') throw Error(`${mode}: expected purchase decision, got ${rolled.phase}`);
    await page.locator('#mp-action-primary,#mt-action-primary').first().click();
    for (let i = 0; i < 9; i++) { await shot('purchase'); await page.waitForTimeout(55); }
    const hasBuild = await page.evaluate(() => window.__marbleEngine.getPlayerView(window.__marbleState, 'p1').actions.some(item => item.action.type === 'build'));
    if (hasBuild) {
      const build = page.locator('#mp-action-primary,#mt-action-primary').first();
      if (await build.isVisible() && /건설/.test(await build.textContent())) {
        await build.click();
        for (let i = 0; i < 11; i++) { await shot('build'); await page.waitForTimeout(55); }
      }
    }
    const final = await page.evaluate(() => ({ phase: window.__marbleState.phase, position: window.__marbleState.positions.p1, cash: window.__marbleState.money.p1, property: window.__marbleState.properties[window.__marbleState.positions.p1] }));
    await page.waitForTimeout(160);
    await cdp.send('Page.stopScreencast');
    await Promise.all(encoded);
    if (videoFrames < 30) throw Error(`${mode}: too few frames (${videoFrames})`);
    await fs.copyFile(path.join(frameDir, 'video-000.jpg'), path.join(folder, `live-${mode}-turn-first.jpg`));
    await fs.copyFile(path.join(frameDir, `video-${String(videoFrames - 1).padStart(3, '0')}.jpg`), path.join(folder, `live-${mode}-turn-last.jpg`));
    const observed = await page.evaluate(() => window.__marbleMotionTrace);
    await fs.writeFile(path.join(folder, `live-${mode}-turn-trace.json`), JSON.stringify({ initial, rolled, final, errors, trace, observed, videoFrames }, null, 2));
    await run('/usr/bin/ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '12', '-i', path.join(frameDir, 'video-%03d.jpg'), '-frames:v', String(videoFrames), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '27', path.join(folder, `live-${mode}-turn-1280x800.mp4`)]);
    await fs.rm(frameDir, { recursive: true, force: true });
    const movingCells = [...new Set(observed.filter(item => item.pawn && item.visible).map(item => item.cell).filter(Boolean))];
    if (errors.length || movingCells.length < 2 || final.cash >= rolled.cash) throw Error(`${mode}: failed live sequence ${JSON.stringify({errors,rolled,final,movingCells})}`);
    console.log(mode, JSON.stringify({ seed: initial.seed, rolled, final, movingCells, frames: videoFrames, errors }));
    await page.close();
  }
} finally { await browser.close(); }

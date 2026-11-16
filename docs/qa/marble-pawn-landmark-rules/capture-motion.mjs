import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const folder = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const observations = [];
try {
  for (const mode of ['2p', '4p']) for (const scenario of ['roll', 'build', 'landmark']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(process.env.MARBLE_URL ?? 'http://127.0.0.1:5176/play?game=marble');
    await page.evaluate(async ({ mode, scenario }) => {
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const ReactDOM = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const engine = mode === '2p' ? (await import('/src/games/marble.ts')).marbleEngine : (await import('/src/games/fourMarble.ts')).fourMarbleEngine;
      const Screen = (await import(mode === '2p' ? '/src/app/MarbleBoard.tsx' : '/src/app/MarbleTeamBoard.tsx')).default;
      const state = engine.createInitialState(71);
      if (scenario === 'build') {
        state.properties[1] = { owner: 'p1', houses: 1 };
        state.positions.p1 = 1;
        state.phase = 'main';
        state.pendingTile = 1;
        state.buildSite = 1;
      }
      if (scenario === 'landmark') {
        state.properties[4] = { owner: 'p1', houses: 2 };
        state.properties[5] = { owner: 'p1', houses: 2 };
        state.phase = 'main';
        state.pendingTile = 0;
        state.buildSite = 'start';
        state.landmarkOptions = [4, 5];
      }
      function Live() {
        const [current, setCurrent] = React.useState(state);
        window.__marbleState = current;
        return React.createElement(Screen, { view: engine.getPlayerView(current, 'p1'), language: 'ko', playerId: 'p1', nickname: '플레이어',
          runAction: async action => { setCurrent(previous => engine.applyAction(previous, 'p1', action)); return true; }, onReplay: () => {}, onExit: () => {} });
      }
      document.body.innerHTML = '<div id="fixture"></div>';
      ReactDOM.createRoot(document.querySelector('#fixture')).render(React.createElement(Live));
    }, { mode, scenario });
    await page.locator('.mp-board-grid--40').waitFor();
    const before = await page.evaluate(() => ({ cash: window.__marbleState.money.p1, position: window.__marbleState.positions.p1 }));
    if (scenario === 'landmark') await page.locator('.mp-stage-build-choice select').selectOption('5');
    await page.locator(mode === '2p' ? '#mp-action-primary' : '#mt-action-primary').click();
    const frames = [];
    for (let time = 0; time <= 1500; time += 100) {
      await page.waitForTimeout(time ? 100 : 0);
      frames.push(await page.evaluate(() => ({
        cash: window.__marbleState.money.p1, position: window.__marbleState.positions.p1,
        level4: window.__marbleState.properties[4]?.houses, level5: window.__marbleState.properties[5]?.houses,
        buildSite: window.__marbleState.buildSite,
        dice: !!document.querySelector('.is-rolling'), traveler: !!document.querySelector('.mp-pawn-marker.is-moving-pawn'),
        event: !!document.querySelector('.mp-event-theater'), flight: !!document.querySelector('.mp-money-flight'),
        building: [...document.querySelectorAll('.mp-tile.is-growing .mp-property-tile-art')].some(node => getComputedStyle(node).animationName !== 'none'),
      })));
      if (time === 100) await page.screenshot({ path: path.join(folder, `${mode}-${scenario}-motion-1280x800.png`) });
    }
    const after = frames.at(-1);
    if (scenario === 'landmark' && (after.level4 !== 2 || after.level5 !== 3 || after.buildSite !== null)) throw Error(`${mode} landmark selection did not apply once`);
    observations.push({ mode, scenario, before, after, motion: {
      diceFrames: frames.filter(frame => frame.dice).length, travelerFrames: frames.filter(frame => frame.traveler).length,
      eventFrames: frames.filter(frame => frame.event).length, flightFrames: frames.filter(frame => frame.flight).length,
      buildingFrames: frames.filter(frame => frame.building).length,
    } });
    await page.close();
  }
} finally { await browser.close(); }
await fs.writeFile(path.join(folder, 'motion.json'), JSON.stringify(observations, null, 2) + '\n');
console.log(JSON.stringify(observations, null, 2));

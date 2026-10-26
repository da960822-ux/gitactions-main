import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const folder = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ executablePath:'/usr/bin/chromium', headless:true, args:['--no-sandbox'] });
const base = process.env.MARBLE_URL ?? 'http://127.0.0.1:5176/play?game=marble';

async function capture(mode, scenario, width, height) {
  const page = await browser.newPage({ viewport:{width,height}, reducedMotion:'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base);
  const cells = await page.evaluate(async ({mode,scenario}) => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const ReactDOM = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const engine = mode === '2p' ? (await import('/src/games/marble.ts')).marbleEngine : (await import('/src/games/fourMarble.ts')).fourMarbleEngine;
    const Screen = (await import(mode === '2p' ? '/src/app/MarbleBoard.tsx' : '/src/app/MarbleTeamBoard.tsx')).default;
    const state = engine.createInitialState(71);
    if (scenario === 'levels') {
      const levels = [[1,0,'p1'],[3,1,'p1'],[4,2,mode === '2p' ? 'p2' : 'p4'],[5,3,'p1'],[16,2,mode === '2p' ? 'p2' : 'p3'],[33,1,mode === '2p' ? 'p2' : 'p4']];
      for (const [tile,houses,owner] of levels) state.properties[tile] = {owner,houses};
    }
    function Live() {
      const [current,setCurrent] = React.useState(state);
      return React.createElement(Screen, {
        view:engine.getPlayerView(current,'p1'), language:'ko', playerId:'p1', nickname:'플레이어',
        runAction:async action => { setCurrent(previous => engine.applyAction(previous,'p1',action)); return true; },
        onReplay:()=>{}, onExit:()=>{},
      });
    }
    document.body.innerHTML = '<div id="fixture"></div>';
    ReactDOM.createRoot(document.querySelector('#fixture')).render(React.createElement(Live));
    const view = engine.getPlayerView(state,'p1');
    return mode === '2p' ? view.board.tiles.length : view.publicBoard.length;
  }, {mode,scenario});
  await page.locator('.mp-board-grid--40').waitFor();
  await page.waitForTimeout(170);
  const filename = `${mode}-${scenario}-${width}x${height}.png`;
  await page.screenshot({path:path.join(folder,filename)});
  const board = await page.locator('.mp-board-grid--40').boundingBox();
  const sideArt = scenario === 'levels' ? await page.locator('.mp-tile--west.mp-kind-property[data-marble-owner]:not([data-marble-owner="bank"]) .mp-property-tile-art').first().boundingBox() : null;
  console.log(filename, JSON.stringify({cells,board,sideArt,errors}));
  if (cells !== 40 || errors.length || !board || board.width < width * .94 || board.y + board.height > height) throw Error(`Invalid board: ${filename}`);
  if (scenario === 'levels') {
    if (!sideArt || sideArt.height < 24) throw Error(`Side building too small: ${filename}`);
    await page.locator('.mp-tile').nth(4).locator('.mp-tile-select').click();
    await page.screenshot({path:path.join(folder,`${mode}-apartment-selected-${width}x${height}.png`)});
  }
  await page.close();
}

try {
  for (const mode of ['2p','4p']) for (const scenario of ['stage','levels']) for (const [width,height] of [[1280,800],[1440,900]]) {
    if (!process.env.MARBLE_CAPTURE_FILTER || `${mode}-${scenario}`.includes(process.env.MARBLE_CAPTURE_FILTER)) await capture(mode,scenario,width,height);
  }
} finally { await browser.close(); }

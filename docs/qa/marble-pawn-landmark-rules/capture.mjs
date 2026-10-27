import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const folder = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const base = process.env.MARBLE_URL ?? 'http://127.0.0.1:5176/play?game=marble';
const report=[];
try {
  for(const mode of ['2p','4p']) for(const scenario of ['start','built','landmark']) for(const [width,height] of [[1280,800],[1440,900],[1847,872]]) {
    const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base);
    await page.evaluate(async ({mode,scenario})=>{
      const React=(await import('/node_modules/.vite/deps/react.js')).default;
      const ReactDOM=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const engine=mode==='2p'?(await import('/src/games/marble.ts')).marbleEngine:(await import('/src/games/fourMarble.ts')).fourMarbleEngine;
      const Screen=(await import(mode==='2p'?'/src/app/MarbleBoard.tsx':'/src/app/MarbleTeamBoard.tsx')).default;
      const state=engine.createInitialState(71);
      if(scenario==='built'){
        for(const [tile,owner,houses] of [[1,'p1',2],[3,'p1',1],[4,'p2',2],[5,'p1',3],[16,mode==='2p'?'p2':'p3',2]]) state.properties[tile]={owner,houses};
        state.positions.p1=1;state.positions.p2=4;
        if(mode==='4p'){state.positions.p3=1;state.positions.p4=5;}
        state.phase='main';state.pendingTile=1;state.buildSite=1;state.landmarkOptions=[];
      }
      if(scenario==='landmark'){
        state.properties[4]={owner:'p1',houses:2};state.properties[5]={owner:'p1',houses:2};
        state.phase='main';state.pendingTile=0;state.buildSite='start';state.landmarkOptions=[4,5];
      }
      function Live(){const [current,setCurrent]=React.useState(state);return React.createElement(Screen,{
        view:engine.getPlayerView(current,'p1'),language:'ko',playerId:'p1',nickname:'플레이어',
        runAction:async action=>{setCurrent(previous=>engine.applyAction(previous,'p1',action));return true;},onReplay:()=>{},onExit:()=>{},
      });}
      document.body.innerHTML='<div id="fixture"></div>';
      ReactDOM.createRoot(document.querySelector('#fixture')).render(React.createElement(Live));
    },{mode,scenario});
    await page.locator('.mp-board-grid--40').waitFor();await page.waitForTimeout(250);
    const filename=`${mode}-${scenario}-${width}x${height}.png`;
    await page.screenshot({path:path.join(folder,filename)});
    const geometry=await page.evaluate(()=>{
      const rect=element=>{const r=element.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};};
      const board=document.querySelector('.mp-board-grid--40');
      const pawns=[...document.querySelectorAll('.mp-board-grid--40 .mp-pawn-marker')].map(element=>({seat:element.dataset.marblePawnSeat,rect:rect(element)}));
      const tile=document.querySelector('.mp-tile.has-player');
      const stage=document.querySelector('.mp-center-stage');
      return {board:rect(board),pawnCount:pawns.length,pawns,occupiedTile:tile&&rect(tile),stage:stage&&rect(stage),bodyHeight:document.body.scrollHeight};
    });
    const entry={filename,...geometry,errors};report.push(entry);
    if(errors.length||geometry.pawnCount!==(mode==='2p'?2:4)||geometry.pawns.some(pawn=>pawn.rect.height<35)) throw Error(`Invalid capture: ${filename} ${JSON.stringify(geometry)} ${errors.join(',')}`);
    if(scenario==='built'){
      await page.locator('.mp-tile').nth(4).locator('.mp-tile-select').click();
      await page.screenshot({path:path.join(folder,`${mode}-built-selected-${width}x${height}.png`)});
      entry.selectedPanel=await page.evaluate(mode=>{
        const element=document.querySelector(mode==='2p'?'.mp-city-detail[open]':'.mt-city-sheet[open]');
        if(!element)return null;
        const r=element.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};
      },mode);
      if(!entry.selectedPanel||entry.selectedPanel.y<0||entry.selectedPanel.y+entry.selectedPanel.height>height)throw Error(`Selected panel outside viewport: ${filename}`);
    }
    await page.close();
  }
} finally { await browser.close(); }
await fs.writeFile(path.join(folder,'geometry.json'),JSON.stringify(report,null,2)+'\n');
console.log(report.map(item=>`${item.filename}: ${item.pawnCount} pawns, board ${item.board.width}x${item.board.height}, first pawn ${item.pawns[0].rect.width}x${item.pawns[0].rect.height}, page height ${item.bodyHeight}`).join('\n'));

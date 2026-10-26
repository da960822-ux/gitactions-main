import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const folder=path.dirname(fileURLToPath(import.meta.url));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const base=process.env.MARBLE_URL??'http://127.0.0.1:5176/play?game=marble';
async function scene(mode,scenario,reducedMotion='no-preference') {
 const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(base);
 await page.evaluate(async({mode,scenario})=>{
  const React=(await import('/node_modules/.vite/deps/react.js')).default;
  const ReactDOM=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;
  const engine=mode==='2p'?(await import('/src/games/marble.ts')).marbleEngine:(await import('/src/games/fourMarble.ts')).fourMarbleEngine;
  const Screen=(await import(mode==='2p'?'/src/app/MarbleBoard.tsx':'/src/app/MarbleTeamBoard.tsx')).default;
  const initial=engine.createInitialState(71);
  if(scenario==='build'){initial.positions.p1=1;initial.properties[1]={owner:'p1',houses:1};initial.pendingTile=1;initial.phase='main';}
  if(scenario==='rent'){const tile=mode==='2p'?engine.getPlayerView(initial,'p1').board.tiles[4]:engine.getPlayerView(initial,'p1').publicBoard[4];initial.positions.p1=4;initial.properties[4]={owner:mode==='2p'?'p2':'p4',houses:1};initial.pendingTile=4;initial.phase='rent-decision';initial.pendingRent={amount:tile.rent*2,creditor:mode==='2p'?'p2':'p4',playerId:'p1',tile:4};}
  window.__marbleState=initial;window.__marbleEngine=engine;
  function Live(){const[state,setState]=React.useState(initial);const[,rerender]=React.useState(0);window.__marbleRerender=()=>rerender(n=>n+1);return React.createElement(Screen,{view:engine.getPlayerView(state,'p1'),language:'ko',playerId:'p1',nickname:'플레이어',runAction:async action=>{const next=engine.applyAction(window.__marbleState,'p1',action);window.__marbleState=next;setState(next);return true;},onReplay:()=>{},onExit:()=>{}});}
  document.body.innerHTML='<div id="fixture"></div>';ReactDOM.createRoot(document.querySelector('#fixture')).render(React.createElement(Live));
 },{mode,scenario});
 await page.locator('.mp-board-grid--40').waitFor();
 await page.locator('#mp-action-primary,#mt-action-primary').first().click();
 await page.waitForTimeout(115);
 const early=await page.evaluate(()=>({flight:document.querySelectorAll('.mp-money-flight').length,sequence:document.querySelector('.mp-money-flight')?.getAttribute('data-money-sequence'),growth:document.querySelectorAll('.mp-tile.is-growing').length,old:document.querySelectorAll('.mp-growth-previous').length,buildingAnimation:getComputedStyle(document.querySelector('.mp-tile.is-growing .mp-property-tile-art')??document.body).animationName,from:document.querySelector('.mp-money-token')?.getBoundingClientRect().toJSON(),sender:getComputedStyle(document.querySelector('.mp-money-endpoint--send')??document.body).color}));
 const prefix=`effect-${mode}-${scenario}${reducedMotion==='reduce'?'-reduced':''}`;
 await page.screenshot({path:path.join(folder,`${prefix}-115ms.png`),animations:'allow'});
 if(scenario==='build')await page.locator('.mp-tile.is-growing').first().screenshot({path:path.join(folder,`${prefix}-tile-115ms.png`),animations:'allow'});
 await page.waitForTimeout(225);
 await page.screenshot({path:path.join(folder,`${prefix}-340ms.png`),animations:'allow'});
 await page.waitForTimeout(750);
 await page.evaluate(()=>window.__marbleRerender());await page.waitForTimeout(70);
 const settled=await page.evaluate(()=>({flight:document.querySelectorAll('.mp-money-flight').length,growth:document.querySelectorAll('.mp-tile.is-growing').length,cash:window.__marbleState.money.p1,property:window.__marbleState.properties[1]}));
 if(errors.length||settled.flight||(!reducedMotion.includes('reduce')&&!early.flight)||scenario==='build'&&(!early.growth||settled.property?.houses!==2))throw Error(`${prefix}: ${JSON.stringify({errors,early,settled})}`);
 if(scenario==='build'&&reducedMotion==='no-preference'&&early.buildingAnimation!=='mp-owner-building-rise')throw Error(`${prefix}: building never rose (${early.buildingAnimation})`);
 if(scenario==='build'&&reducedMotion==='reduce'&&early.buildingAnimation!=='none')throw Error(`${prefix}: reduced motion still animated building`);
 if(reducedMotion==='reduce'&&early.flight)throw Error(`${prefix}: reduced motion moved money`);
 console.log(prefix,JSON.stringify({early:{flight:early.flight,sequence:early.sequence,growth:early.growth,old:early.old,buildingAnimation:early.buildingAnimation},settled,errors}));
 await page.close();
}
try{for(const mode of ['2p','4p'])for(const scenario of ['build','rent'])await scene(mode,scenario);await scene('2p','build','reduce');}finally{await browser.close();}

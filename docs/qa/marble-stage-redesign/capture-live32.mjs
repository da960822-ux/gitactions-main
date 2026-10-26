import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const output=path.dirname(fileURLToPath(import.meta.url));
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const base=process.env.MARBLE_URL??'http://127.0.0.1:5174/play?game=marble';
async function scene(mode,scenario,language,width,height,{motion=false}={}) {
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:motion?'no-preference':'reduce'});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base);
 const state=await page.evaluate(async ({mode,scenario,language})=>{
  const React=(await import('/node_modules/.vite/deps/react.js')).default;
  const ReactDOM=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;
  const engine=mode==='2p'?(await import('/src/games/marble.ts')).marbleEngine:(await import('/src/games/fourMarble.ts')).fourMarbleEngine;
  const Screen=(await import(mode==='2p'?'/src/app/MarbleBoard.tsx':'/src/app/MarbleTeamBoard.tsx')).default;
  const snapshot=engine.createInitialState(71);
  if(scenario==='purchase'||scenario==='shortfall'||scenario==='tourism') {snapshot.positions.p1=scenario==='tourism'?4:31;snapshot.pendingTile=scenario==='tourism'?4:31;snapshot.phase='decision';if(scenario==='shortfall')snapshot.money.p1=400000;}
  if(scenario==='build') {snapshot.properties[1]={owner:'p1',houses:0,buildings:{}};snapshot.positions.p1=1;snapshot.phase='main';snapshot.pendingTile=1;snapshot.buildArrivalTile=1;snapshot.completedLaps.p1=2;}
  if(scenario==='levels') {
   for(const [index,buildings] of [[1,{}],[3,{villa:true}],[5,{building:true}],[6,{hotel:true}],[7,{villa:true,building:true,hotel:true,landmark:true}]])snapshot.properties[index]={owner:index===5?'p2':'p1',houses:Object.keys(buildings).filter(name=>name!=='landmark').length,buildings};
  }
  if(scenario==='olympics'||scenario==='olympics-empty'){
   snapshot.positions.p1=16;snapshot.pendingTile=16;snapshot.phase='olympic-decision';
   if(scenario==='olympics'){
    snapshot.properties[1]={owner:'p1',houses:0,buildings:{}};
    snapshot.properties[4]={owner:'p1',houses:0,buildings:{}};
   }
  }
  if(scenario==='rent'||scenario==='rent-pass') {
   const {classicMarbleCityToll}=await import('/src/games/marble-reference-profile.ts');
   const amount=classicMarbleCityToll('뉴욕',{villa:true});
   snapshot.properties[29]={owner:mode==='2p'?'p2':'p4',houses:1,buildings:{villa:true}};
   snapshot.positions.p1=29;snapshot.pendingTile=29;snapshot.takeoverTile=29;snapshot.phase='rent-decision';
   snapshot.pendingRent=mode==='2p'?{amount,creditor:'p2',playerId:'p1',tile:29,reason:{ko:'뉴욕 통행료',es:'Alquiler de Nueva York'}}:{amount,creditor:'p4'};
   if(scenario==='rent-pass')snapshot.rentPasses.p1=1;
  }
  window.__marbleEngine=engine;
  window.__marbleState=snapshot;
  function Live(){const [match,setMatch]=React.useState(snapshot);const view=engine.getPlayerView(match,'p1');return React.createElement(Screen,{view,language,playerId:'p1',nickname:language==='ko'?'플레이어':'Jugador',runAction:async action=>{const next=engine.applyAction(match,'p1',action);window.__marbleState=next;setMatch(next);return true;},onReplay:()=>{},onExit:()=>{},onSelectGame:()=>{}});}
  document.body.innerHTML='<div id="fixture"></div>';
  ReactDOM.createRoot(document.querySelector('#fixture')).render(React.createElement(Live));
  const view=engine.getPlayerView(snapshot,'p1');
  return {tiles:mode==='2p'?view.board.tiles.length:view.publicBoard.length,phase:view.phase,actions:view.actions.map(option=>option.action)};
 },{mode,scenario,language});
 await page.locator('.mp-board-grid--32').waitFor();
 await page.waitForTimeout(120);
 const file=`live32-${mode}-${scenario}-${language}-${width}x${height}.png`;
 await page.screenshot({path:path.join(output,file)});
 const metric=await page.evaluate(()=>{const board=document.querySelector('.mp-board-grid--32');const stage=document.querySelector('.mp-center-stage');const rect=node=>node?.getBoundingClientRect().toJSON();return {board:rect(board),stage:rect(stage),footer:rect(document.querySelector('.mt-captain-panel,.mp-dashboard > details')),tiles:board?.querySelectorAll('.mp-tile').length,cash:document.querySelector('.mp-player[data-marble-seat="p1"] [data-marble-value="cash"],.mt-bank[data-marble-seat="p1"] > div > span')?.textContent,assets:document.querySelector('.mp-player[data-marble-seat="p1"] [data-marble-value="assets"],.mt-bank[data-marble-seat="p1"] dd')?.textContent,action:document.querySelector('#mp-action-primary,#mt-action-primary')?.textContent,choices:[...document.querySelectorAll('.mp-structure-option')].map(node=>node.textContent),overflow:document.documentElement.scrollWidth>innerWidth};});
 console.log(file,JSON.stringify({state,metric,errors}));
 if(errors.length||state.tiles!==32||metric.tiles!==32)throw Error(`Live ${mode} ${scenario} invalid`);
 if(scenario==='build'&&!metric.assets?.includes('505만'))throw Error(`${mode} Bangkok land asset does not show 505만: ${metric.assets}`);
 if(scenario==='rent-pass'){
  const stage=page.locator('.mp-center-stage');
  const before=await page.evaluate(()=>({cash:window.__marbleState.money.p1,passes:window.__marbleState.rentPasses.p1}));
  const pay=stage.locator('#mp-action-primary,#mt-action-primary');
  const pass=stage.getByRole('button',{name:/면제권|pase/i});
  if(!await pay.isVisible()||!await pass.isVisible())throw Error(`${mode} rent choices not both visible`);
  const payBox=await pay.boundingBox(),passBox=await pass.boundingBox();
  if(!payBox||!passBox||payBox.y+payBox.height>height||passBox.y+passBox.height>height)throw Error(`${mode} rent choice clipped at ${height}`);
  await pass.click();await page.waitForTimeout(180);
  const after=await page.evaluate(()=>({cash:window.__marbleState.money.p1,passes:window.__marbleState.rentPasses.p1,phase:window.__marbleState.phase}));
  if(after.cash!==before.cash||after.passes!==0||after.phase==='rent-decision')throw Error(`${mode} rent pass outcome incorrect: ${JSON.stringify({before,after})}`);
  console.log('RENT PASS',mode,JSON.stringify({before,after,payBox,passBox}));
  await page.screenshot({path:path.join(output,`live32-${mode}-rent-pass-resolved-${language}-${width}x${height}.png`)});
 }
 if(scenario==='olympics'||scenario==='olympics-empty'){
  const actions=await page.evaluate(()=>window.__marbleEngine.getPlayerView(window.__marbleState,'p1').actions.map(item=>item.action));
  if(scenario==='olympics'){
   if(actions.filter(item=>item.type==='choose-olympic-target').length!==2||!actions.some(item=>item.type==='skip-olympics'))throw Error(`${mode} Olympics actions incorrect`);
   await page.locator('.mp-stage-destination select').selectOption(JSON.stringify({type:'choose-olympic-target',payload:{tile:4}}));
   await page.screenshot({path:path.join(output,`live32-${mode}-olympics-selected-${language}-${width}x${height}.png`)});
  }else if(actions.length!==1||actions[0].type!=='skip-olympics')throw Error(`${mode} empty Olympics must offer skip`);
  await page.locator('#mp-action-primary,#mt-action-primary').first().click();await page.waitForTimeout(200);
  const after=await page.evaluate(()=>({phase:window.__marbleState.phase,cash:window.__marbleState.money.p1,olympics:window.__marbleState.activeOlympics,hostings:window.__marbleState.olympicHostings}));
  if(after.phase!=='main'||after.cash!==5000000||scenario==='olympics'&&(after.olympics?.tile!==4||after.olympics?.multiplier!==2)||scenario==='olympics-empty'&&after.olympics)throw Error(`${mode} Olympics action not applied: ${JSON.stringify(after)}`);
  console.log('OLYMPICS',mode,scenario,JSON.stringify(after));
  await page.screenshot({path:path.join(output,`live32-${mode}-${scenario}-resolved-${language}-${width}x${height}.png`)});
 }
 if(['purchase','build','rent','tourism'].includes(scenario)) {
  if(scenario==='build'){
   if(metric.choices.length<3)throw Error(`${mode} build choices missing: ${JSON.stringify(metric.choices)}`);
   const hotel=page.getByRole('button',{name:/호텔|Hotel/}).filter({has:page.locator('.mp-structure-option strong')}).first();
   await page.locator('.mp-structure-option').nth(2).click();
  }
  const action=page.locator('#mp-action-primary,#mt-action-primary').first();
  if(await action.isDisabled())throw Error(`Primary action disabled: ${mode} ${scenario}`);
  await action.click();await page.waitForTimeout(450);
  const after=await page.evaluate(scenario=>({phase:window.__marbleState.phase,cash:window.__marbleState.money.p1,property:window.__marbleState.properties[scenario==='purchase'?31:scenario==='tourism'?4:scenario==='build'?1:29],event:window.__marbleState.actionLog?.at(-1)?.type}),scenario);
  const afterFile=`live32-${mode}-${scenario}-resolved-${language}-${width}x${height}.png`;
  await page.screenshot({path:path.join(output,afterFile)});
  console.log(afterFile,JSON.stringify(after));
  if((scenario==='purchase'||scenario==='tourism')&&after.property?.owner!=='p1')throw Error('Purchase not applied');
  if(scenario==='build'&&Object.values(after.property?.buildings??{}).filter(Boolean).length!==1)throw Error('Selected structure not applied');
  if(scenario==='rent'&&after.phase==='rent-decision')throw Error('Rent not resolved');
  if(scenario==='rent'){const choices=await page.evaluate(()=>window.__marbleEngine.getPlayerView(window.__marbleState,'p1').actions.map(item=>item.action.type));console.log('AFTER RENT ACTIONS',mode,choices);if(!choices.includes('takeover'))throw Error('Takeover missing after rent');await page.screenshot({path:path.join(output,`live32-${mode}-takeover-${language}-${width}x${height}.png`)});await page.locator('#mp-action-primary,#mt-action-primary').first().click();await page.waitForTimeout(380);const acquired=await page.evaluate(()=>({owner:window.__marbleState.properties[29].owner,cash:window.__marbleState.money.p1}));console.log('TAKEOVER',mode,acquired);if(acquired.owner!=='p1')throw Error('Takeover not applied');await page.screenshot({path:path.join(output,`live32-${mode}-takeover-resolved-${language}-${width}x${height}.png`)});}
 }
 if(motion){
  const frames=await fs.mkdtemp(path.join(os.tmpdir(),'marble-live-frames-'));
  const cdp=await context.newCDPSession(page);
  const pending=[];let frameCount=0;
  cdp.on('Page.screencastFrame',packet=>{const file=path.join(frames,`frame-${String(frameCount++).padStart(3,'0')}.jpg`);pending.push(fs.writeFile(file,Buffer.from(packet.data,'base64')));void cdp.send('Page.screencastFrameAck',{sessionId:packet.sessionId});});
  await page.evaluate(()=>{window.__motionTrace=[];window.__motionVisible=[];const board=document.querySelector('.mp-board-grid--32');const record=()=>{const tile=board?.querySelector('.mp-tile.is-moving');if(tile){window.__motionTrace.push(tile.getAttribute('aria-label'));requestAnimationFrame(()=>{const marker=tile.querySelector('.mp-pawn-marker.is-moving-pawn'),pawn=marker?.querySelector('.marble-pawn'),box=marker?.getBoundingClientRect(),cell=tile.getBoundingClientRect();window.__motionVisible.push({tile:tile.getAttribute('aria-label'),visible:!!box&&!!pawn&&box.width>=20&&box.height>=25&&box.right>cell.left&&box.left<cell.right&&box.bottom>cell.top&&box.top<cell.bottom&&Number(getComputedStyle(marker).opacity)>=.9});});}};new MutationObserver(record).observe(board,{attributes:true,attributeFilter:['class'],subtree:true});});
  await cdp.send('Page.startScreencast',{format:'jpeg',quality:86,maxWidth:width,maxHeight:height,everyNthFrame:1});
  await page.locator('#mp-action-primary,#mt-action-primary').first().click();
  await page.locator('.mp-tile.is-moving .mp-pawn-marker.is-moving-pawn').first().waitFor({state:'visible'});
  await page.screenshot({path:path.join(output,`live32-${mode}-motion-step-${language}-${width}x${height}.jpg`),type:'jpeg',quality:90});
  await page.waitForTimeout(2400);
  await cdp.send('Page.stopScreencast');await Promise.all(pending);
  const {trace,visible}=await page.evaluate(()=>({trace:window.__motionTrace,visible:window.__motionVisible}));
  console.log('MOTION',mode,JSON.stringify({frames:frameCount,visited:[...new Set(trace)],visible:visible.filter(item=>item.visible).length,samples:visible.length}));
  if(frameCount<2||new Set(trace).size<2)throw Error(`Motion was not observed tile by tile: ${mode}`);
  if(visible.filter(item=>item.visible).length<4)throw Error(`Moving pawn was not visibly painted on the board: ${mode}`);
  const video=path.join(output,`live32-${mode}-motion-${language}-${width}x${height}.mp4`);
  execFileSync('/usr/bin/ffmpeg',['-y','-loglevel','error','-framerate','12','-i',path.join(frames,'frame-%03d.jpg'),'-c:v','libx264','-pix_fmt','yuv420p',video]);
  const first=Math.min(1,frameCount-1),last=frameCount-1;
  await fs.copyFile(path.join(frames,`frame-${String(first).padStart(3,'0')}.jpg`),path.join(output,`live32-${mode}-motion-first-${language}-${width}x${height}.jpg`));
  await fs.copyFile(path.join(frames,`frame-${String(last).padStart(3,'0')}.jpg`),path.join(output,`live32-${mode}-motion-landed-${language}-${width}x${height}.jpg`));
  await fs.rm(frames,{recursive:true,force:true});await cdp.detach();
 }
 await page.close();await context.close();

}
for(const spec of [['2p','roll','ko',1280,800,{motion:true}],['4p','roll','ko',1280,800,{motion:true}],['2p','roll','ko',1440,900,{}],['4p','roll','ko',1440,900,{}],['2p','purchase','ko',1280,800,{}],['4p','purchase','ko',1280,800,{}],['2p','tourism','ko',1280,800,{}],['4p','tourism','ko',1280,800,{}],['2p','shortfall','ko',1280,800,{}],['4p','shortfall','ko',1280,800,{}],['2p','build','ko',1280,800,{}],['4p','build','ko',1280,800,{}],['2p','levels','ko',1280,800,{}],['4p','levels','ko',1280,800,{}],['2p','rent','ko',1280,800,{}],['4p','rent','ko',1280,800,{}],['2p','rent-pass','ko',1280,800,{}],['4p','rent-pass','ko',1280,800,{}],['2p','olympics','ko',1280,800,{}],['4p','olympics','ko',1280,800,{}],['2p','olympics-empty','ko',1280,800,{}],['4p','olympics-empty','ko',1280,800,{}],['2p','purchase','es',1280,800,{}],['4p','purchase','es',1280,800,{}]]){
 if(process.env.MARBLE_CAPTURE_FILTER&&!`${spec[0]}-${spec[1]}-${spec[2]}-${spec[3]}x${spec[4]}`.includes(process.env.MARBLE_CAPTURE_FILTER))continue;
 await scene(...spec);
}
await browser.close();

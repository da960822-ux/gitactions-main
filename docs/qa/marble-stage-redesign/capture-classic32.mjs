import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url));
const profile=JSON.parse(fs.readFileSync(`${out}/classic-world-32-fixture.json`,'utf8'));
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
async function capture(mode,scene,language,width,height) {
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'});
 page.on('pageerror',error=>console.log('PAGE ERROR',mode,scene,error.message));
 await page.goto(process.env.MARBLE_URL??'http://127.0.0.1:5174/play?game=marble');
 const rendered=await page.evaluate(async ({mode,scene,language,profile})=>{
  const React=(await import('/node_modules/.vite/deps/react.js')).default;
  const ReactDOM=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;
  const spanish={출발:'Salida',보너스게임:'Juego extra',방콕:'Bangkok',베이징:'Pekín',독도:'Dokdo',타이페이:'Taipéi',두바이:'Dubái',카이로:'El Cairo',무인도:'Isla desierta',발리:'Bali',도쿄:'Tokio',시드니:'Sídney',포츈카드:'Carta fortuna',퀘벡:'Quebec',하와이:'Hawái',상파울루:'São Paulo',올림픽:'Olimpiadas',프라하:'Praga',푸켓:'Phuket',베를린:'Berlín',모스크바:'Moscú',제네바:'Ginebra',로마:'Roma',세계여행:'Viaje mundial',타히티:'Tahití',런던:'Londres',파리:'París',뉴욕:'Nueva York',국세청:'Agencia tributaria',서울:'Seúl'};
  const cities=Object.fromEntries(profile.cities.map(city=>[city.name,city]));
  const tourism=Object.fromEntries(profile.tourism.map(site=>[site.name,site]));
  const stages={1:0,3:1,5:2,6:3,7:4};
  const owner={1:'p1',3:'p1',5:'p2',6:'p2',7:'p1'};
  const tiles=profile.map.map((cell,index)=>{
   const city=cities[cell.name],site=tourism[cell.name],level=scene==='levels'?stages[index]??0:scene==='crowded'?({27:1,29:2,31:4}[index]??0):0;
   const tile={index,kind:city?'property':site?'tourism':cell.kind==='special'?cell.effect:cell.kind,name:{ko:cell.name,es:spanish[cell.name]??cell.name},owner:scene==='levels'?owner[index]??null:scene==='crowded'?({27:'p3',29:'p1',31:'p2'}[index]??null):null,houses:level};
   if(city) Object.assign(tile,{price:city.land,rent:city.tollByCanonicalStage[0],currentRent:city.tollByCanonicalStage[level],nextBuildCost:city.construction.villa,nextRent:city.tollByCanonicalStage[Math.min(level+1,4)]});
   if(site) Object.assign(tile,{price:site.bankPurchasePrice,rent:site.rentSchedule[0],currentRent:site.rentSchedule[0],playerAcquisitionAllowed:false});
   return tile;
  });
  let component,view,extra={};
  if(mode==='2p'){
   const {marbleEngine}=await import('/src/games/marble.ts');
   component=(await import('/src/app/MarbleBoard.tsx')).default;
   view=marbleEngine.getPlayerView(marbleEngine.createInitialState(71),'p1');
   view.board={...view.board,tiles,cityRouteVersion:4,money:{p1:profile.startingCash,p2:profile.startingCash},assets:{p1:profile.startingCash,p2:profile.startingCash},positions:{p1:scene==='purchase'?31:scene==='levels'?1:0,p2:0},turn:'p1',version:2};
   view.phase=scene==='purchase'?'decision':'roll';
   if(scene==='purchase') view.actions=[{label:{ko:'구매',es:'Comprar'},action:{type:'buy'}},{label:{ko:'지나가기',es:'Pasar'},action:{type:'decline'}}];
   extra={playerId:'p1'};
  } else {
   const {fourMarbleEngine}=await import('/src/games/fourMarble.ts');
   component=(await import('/src/app/MarbleTeamBoard.tsx')).default;
   view=fourMarbleEngine.getPlayerView(fourMarbleEngine.createInitialState(71),'p1');
   view.publicBoard=tiles;
   view.publicState={...view.publicState,money:{p1:profile.startingCash,p2:profile.startingCash,p3:profile.startingCash,p4:profile.startingCash},positions:scene==='crowded'?{p1:29,p2:29,p3:29,p4:29}:{p1:scene==='purchase'?31:scene==='levels'?1:0,p2:0,p3:0,p4:0},properties:scene==='levels'?Object.fromEntries(Object.entries(stages).map(([i,houses])=>[i,{owner:owner[i],houses}])):scene==='crowded'?{27:{owner:'p3',houses:1},29:{owner:'p1',houses:2},31:{owner:'p2',houses:4}}:{}};
   view.players=view.players.map(player=>({...player,score:profile.startingCash}));
   view.phase=scene==='purchase'?'decision':'roll';
   if(scene==='purchase') view.actions=[{label:{ko:'구매',es:'Comprar'},action:{type:'buy'}},{label:{ko:'지나가기',es:'Pasar'},action:{type:'decline'}}];
   extra={nickname:language==='ko'?'플레이어':'Jugador',onReplay:()=>{},onExit:()=>{},onSelectGame:()=>{}};
  }
  document.body.innerHTML='<div id="fixture"></div>';
  ReactDOM.createRoot(document.querySelector('#fixture')).render(React.createElement(component,{view,language,runAction:()=>{},...extra}));
  return {tiles:tiles.length,cities:tiles.filter(t=>t.kind==='property').length,tourism:tiles.filter(t=>t.kind==='tourism').length};
 },{mode,scene,language,profile});
 await page.waitForTimeout(900);
 const metrics=await page.evaluate(()=>{
  const rect=e=>e?.getBoundingClientRect().toJSON();
  const cells=[...document.querySelectorAll('.mp-board-grid--32 .mp-tile')];
  return {viewport:[innerWidth,innerHeight],scrollW:document.documentElement.scrollWidth,scrollH:document.documentElement.scrollHeight,board:rect(document.querySelector('.mp-board-grid--32')),panel:rect(document.querySelector('.mp-board-panel')),first:rect(cells[0]),side:rect(cells[10]),bottom:rect(cells[25]),artHeights:[1,3,5,6,7].map(index=>Math.round(cells[index]?.querySelector('.mp-property-tile-art')?.getBoundingClientRect().height??0)),names:cells.map(e=>e.querySelector('.mp-tile-name')?.textContent),cash:[...document.querySelectorAll('[data-marble-value="cash"],.mt-bank')].map(e=>e.textContent?.slice(0,70)),action:rect(document.querySelector('#mp-action-primary,#mt-action-primary'))};
 });
 const name=`classic32-${mode}-${scene}-${language}-${width}x${height}.png`;
 await page.screenshot({path:`${out}/${name}`});
 console.log(name,rendered,JSON.stringify(metrics));
 if(scene==='crowded') {
  const before=await page.locator('.mp-mobile-spotlight strong').innerText();
  await page.locator('.mp-board-grid--32 .mp-tile').nth(31).locator('.mp-tile-select').click();
  const after=await page.locator('.mp-mobile-spotlight strong').innerText();
  if(before===after||after!=='서울') throw new Error(`Tile selection failed: ${before} -> ${after}`);
  const selectedName=`classic32-${mode}-${scene}-selected-${language}-${width}x${height}.png`;
  await page.screenshot({path:`${out}/${selectedName}`});
  const selectionMetrics=await page.evaluate(()=>{const stage=document.querySelector('.mp-center-stage');const button=stage?.querySelector('button');const rect=stage?.getBoundingClientRect();const buttonRect=button?.getBoundingClientRect();return {stage:rect?.toJSON(),button:buttonRect?.toJSON(),stageZ:stage?getComputedStyle(stage).zIndex:null,hit:buttonRect?document.elementFromPoint(buttonRect.x+buttonRect.width/2,buttonRect.y+buttonRect.height/2)?.className:null,menu:document.querySelector('.mt-captain-panel')?.getBoundingClientRect().toJSON()};});
  console.log(selectedName,JSON.stringify({before,after,ownCash:await page.locator('[data-marble-seat="p1"]').first().innerText(),selectionMetrics}));
 }
 if(mode==='4p'&&scene==='roll'&&width>=768) {
  await page.locator('.mt-captain-panel').scrollIntoViewIfNeeded();
  const menu=await page.locator('.mt-captain-panel').boundingBox();
  if(!menu||menu.y>=height) throw new Error('Auxiliary menu inaccessible');
  const menuName=`classic32-${mode}-${scene}-${language}-${width}x${height}-menu.png`;
  await page.screenshot({path:`${out}/${menuName}`});
  console.log(menuName,JSON.stringify({scrollY:await page.evaluate(()=>scrollY),menu}));
 }
 await page.close();
}
for(const [mode,scene,lang,w,h] of [['2p','roll','ko',1280,800],['2p','roll','ko',1440,900],['4p','roll','ko',1280,800],['4p','roll','ko',1440,900],['2p','levels','ko',1280,800],['2p','purchase','ko',1280,800],['2p','purchase','es',1280,800],['2p','purchase','ko',390,844],['4p','roll','ko',390,844],['4p','purchase','ko',390,844],['4p','crowded','ko',390,844],['4p','roll','ko',768,900]]) {
 if(process.env.MARBLE_CAPTURE_FILTER && !`${mode}-${scene}-${lang}-${w}x${h}`.includes(process.env.MARBLE_CAPTURE_FILTER)) continue;
 await capture(mode,scene,lang,w,h);
}
await browser.close();

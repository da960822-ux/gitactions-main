import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { launchChromium } from './playwright-browser.mjs';
const base=process.env.REVIEW_URL||'http://127.0.0.1:5201';
const output=path.resolve(process.env.PLAYWRIGHT_ARTIFACT_DIR||'output/playwright/improvements/regressions');
await fs.mkdir(output,{recursive:true});
const browser=await launchChromium();const report=[];
async function room(game){
 const page=await browser.newPage({viewport:{width:1440,height:900},locale:'ko-KR'});
 await page.goto(`${base}/play?game=${game}`);await page.locator('#nickname').fill('Review');await page.locator('.lobby-actions > button').click();await page.locator('.demo-banner select').selectOption('p2');await page.locator('.room-game-card').filter({has:page.locator(`.art-${game}`)}).click();await page.locator('#game-board').waitFor();
 await page.evaluate(async()=>{const{client}=await import('/src/core/client.ts');if(client.getSnapshot().mode!=='demo')throw Error('Local demo only');window.reviewClient=client;client.localSeat('p1');await client.setLanguage('ko')});return page;
}
try{
 const fill=await room('catchmind');
 await fill.evaluate(async()=>{const{catchmindEngine:e}=await import('/src/games/catchmind.ts');const c=window.reviewClient;const fresh=e.createInitialState(8);const configured=e.applyAction(fresh,'p1',{type:'settings',payload:{settings:{...fresh.settings,category_id:'animals'}}});c.state=e.applyAction(configured,'p1',{type:'choose',payload:{wordId:0}});c.snapshot.version++;c.localView();c.emit()});
 await fill.getByRole('button',{name:'채우기',exact:true}).click();await fill.locator('canvas').click({position:{x:271.37,y:183.91}});
 await fill.waitForFunction(()=>window.reviewClient.state.fills.length===1);
 const filled=await fill.locator('canvas').evaluate(canvas=>{const d=canvas.getContext('2d').getImageData(0,0,1000,600).data;let count=0;for(let i=0;i<d.length;i+=4)if(d[i]===40&&d[i+1]===79&&d[i+2]===73)count++;return count});assert.equal(filled,600000);
 await fill.locator('canvas').click({position:{x:271.37,y:183.91}});await fill.waitForTimeout(100);assert.equal(await fill.evaluate(()=>window.reviewClient.state.fills.length),1);
 await fill.getByRole('button',{name:'실행 취소',exact:true}).click();await fill.waitForFunction(()=>window.reviewClient.state.fills.length===0);
 await fill.screenshot({path:path.join(output,'catchmind-undo.png'),fullPage:false,animations:'disabled'});report.push({check:'Full-canvas fill, fractional pointer, repeat no-op and undo',pixels:filled,passed:true});await fill.close();
 const sp=await room('splendor');
 await sp.evaluate(async()=>{const c=window.reviewClient;const choice=c.getSnapshot().view.actions.find(a=>a.action.type==='take');if(!choice)throw Error('Missing legal take');await c.sendAction(choice.action)});
 await sp.waitForFunction(()=>document.querySelectorAll('.sp-confirmed-gain').length>0);
 await sp.evaluate(()=>{const c=window.reviewClient;c.snapshot.view=structuredClone(c.snapshot.view);c.emit()});await sp.waitForTimeout(150);assert.ok(await sp.locator('.sp-confirmed-gain').count()>0);
 await sp.emulateMedia({reducedMotion:'reduce'});await sp.waitForTimeout(80);assert.equal(await sp.locator('.sp-confirmed-flight').count(),0);
 await sp.emulateMedia({reducedMotion:'no-preference'});await sp.waitForTimeout(100);assert.equal(await sp.locator('.sp-confirmed-flight').count(),0);
 report.push({check:'Splendor clone snapshot preserves flights; live reduced motion clears without replay',passed:true});await sp.close();
 const mp=await room('marble');
 await mp.evaluate(async()=>{const{marbleEngine:e}=await import('/src/games/marble.ts');const c=window.reviewClient;c.state=e.createInitialState(7);c.state.pawnLocked={p1:true,p2:true};c.snapshot.version++;c.localView();c.emit()});await mp.waitForTimeout(100);
 await mp.evaluate(async()=>{const c=window.reviewClient;await c.sendAction({type:'roll'})});
 await mp.locator('.mp-dice-row.is-rolling').waitFor({timeout:1000});
 const early=await mp.evaluate(()=>({rolling:!!document.querySelector('.mp-dice-row.is-rolling'),moving:document.querySelectorAll('.is-moving-pawn').length}));assert.equal(early.rolling,true);assert.equal(early.moving,0);
 await mp.waitForTimeout(460);assert.ok(await mp.locator('.is-moving-pawn').count()>0);
 await mp.emulateMedia({reducedMotion:'reduce'});await mp.waitForTimeout(100);assert.equal(await mp.locator('.is-moving-pawn').count(),0);assert.equal(await mp.locator('.mp-dice-row.is-rolling').count(),0);
 await mp.screenshot({path:path.join(output,'marble-reduced.png'),fullPage:false,animations:'disabled'});report.push({check:'Marble dice precedes movement; live reduced motion snaps to authority',early,passed:true});await mp.close();
 const jp=await room('jaipur');await jp.setViewportSize({width:390,height:844});
 for(const language of ['ko','es']){
  await jp.evaluate(async l=>{const c=window.reviewClient;c.localSeat(c.getSnapshot().view.turn);await c.setLanguage(l)},language);await jp.waitForTimeout(100);
  const metrics=await jp.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,market:document.querySelector('.jp-market').getBoundingClientRect().toJSON(),hand:document.querySelector('.jp-player-hand').getBoundingClientRect().toJSON(),action:document.querySelector('.jp-market-footer').getBoundingClientRect().toJSON()}));
  assert.ok(metrics.scrollWidth<=metrics.width,`${language}: page overflow ${metrics.scrollWidth}`);assert.ok(metrics.action.bottom<=844,`${language}: action below viewport ${metrics.action.bottom}`);
  await jp.locator('.jp-market-card:not(:disabled)').first().click();
  const confirm=jp.locator('.jp-action-tray .jp-primary-action').first();assert.equal(await confirm.isEnabled(),true);
  await jp.screenshot({path:path.join(output,`jaipur-mobile-${language}.png`),fullPage:true,animations:'disabled'});
  const previous=await jp.evaluate(()=>window.reviewClient.getSnapshot().version);await confirm.click();await jp.waitForFunction(v=>window.reviewClient.getSnapshot().version>v,previous);
  report.push({check:`Jaipur ${language} mobile market/hand/action visible; tap + confirmation advances authority without page overflow`,metrics,passed:true});
 }
 await jp.close();
}finally{await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));await browser.close()}
console.log(JSON.stringify(report,null,2));

import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const out='/workspace/gate1-assets-r8/r7-repair/actual-motion';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:.5,recordVideo:{dir:out,size:{width:960,height:540}}});
const page=await context.newPage();const video=page.video();const observations={scope:'Unedited actual browser review draft. CSS viewport1920x1080, DPR0.5, actual WebGL960x540; SwiftShader. Low-cost matched canopy512px GI preview. Not final quality/FPS approval.',startedUTC:new Date().toISOString(),errors:[],stages:[]};
page.on('pageerror',e=>observations.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')observations.errors.push(m.text());});
await page.addInitScript(()=>{localStorage.setItem('dos-language','ko');window.reviewRaf=[];window.reviewLongTasks=[];const tick=t=>{window.reviewRaf.push(t);requestAnimationFrame(tick)};requestAnimationFrame(tick);try{new PerformanceObserver(list=>window.reviewLongTasks.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true})}catch{}});
const snapshot=async label=>{const data=await page.evaluate(()=>({at:performance.now(),scrollY,lang:document.documentElement.lang,overflow:document.documentElement.scrollWidth>innerWidth,frame:{...document.querySelector('.across-canvas').dataset},intro:document.querySelector('#home').classList.contains('is-intro')}));observations.stages.push({label,...data});console.log('ACTUAL_MOTION_STAGE',label,data.frame.progress,data.frame.camera,data.frame.gpuPendingSkips);return data;};
try{
 await page.goto('http://localhost:5201/',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>document.querySelector('.across-canvas')?.dataset.assetVersion==='chamber-v7.repair-preview',undefined,{timeout:180000});
 await snapshot('first-render');await page.waitForFunction(()=>!document.querySelector('#home').classList.contains('is-intro'),undefined,{timeout:60000});await page.waitForTimeout(2000);
 await page.screenshot({path:out+'/hero-stable.png',timeout:180000});const before=await snapshot('stable-hero');
 await page.mouse.move(180,280);await page.waitForFunction(camera=>document.querySelector('.across-canvas').dataset.camera!==camera,before.frame.camera,{timeout:60000});await page.waitForTimeout(800);await snapshot('pointer-left');
 await page.mouse.move(1700,650);await page.waitForTimeout(1200);await snapshot('pointer-right');
 for(const [label,p]of[['open',.43],['mid',.65],['arrival',1],['reverse-mid',.65],['reverse-open',.43],['hero-return',0]]){
  await page.evaluate(p=>{const host=document.querySelector('#home');const top=host.getBoundingClientRect().top+scrollY;scrollTo({top:top+innerHeight*2.6*p,behavior:'instant'});},p);
  await page.waitForFunction(p=>Math.abs(Number(document.querySelector('.across-canvas').dataset.progress)-p)<.004,p,{timeout:120000});await page.waitForTimeout(600);await snapshot(label);
  if(['mid','arrival','hero-return'].includes(label))await page.screenshot({path:out+'/'+label+'.png',timeout:180000});
 }
 await page.getByRole('button',{name:'ES · RD',exact:true}).click();await page.waitForTimeout(500);await snapshot('spanish');
 observations.spanishTitle=await page.locator('#hero-title').innerText();observations.timing=await page.evaluate(()=>({rafTimes:window.reviewRaf,longTasks:window.reviewLongTasks,videoElements:[...document.querySelectorAll('video')].map(v=>({src:v.getAttribute('src'),readyState:v.readyState,time:v.currentTime,seeking:v.seeking})),note:'rAF and CPU submission are not GPU time/FPS; actual raw video preserved.'}));
 if(observations.errors.length||observations.stages.some(s=>s.overflow))throw Error('Actual draft has runtime/layout errors');
}catch(e){observations.failure=String(e);throw e;}finally{observations.finishedUTC=new Date().toISOString();fs.writeFileSync(out+'/observations.json',JSON.stringify(observations,null,2));await context.close();await video.saveAs(out+'/G1R7-repair-actual-browser-draft.webm');await browser.close();}
console.log('ACTUAL_BROWSER_DRAFT_COMPLETE');

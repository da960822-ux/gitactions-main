import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const out='/workspace/gate1-assets-r8/review-packet-v8-responsive-20261018';fs.mkdirSync(out+'/screenshots',{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,handleSIGTERM:false,args:['--no-sandbox']});
let stopRequested=false;process.on('SIGTERM',()=>{stopRequested=true;});
const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,recordVideo:{dir:out+'/raw-recording',size:{width:1920,height:1080}}});
const page=await context.newPage(),video=page.video();page.setDefaultTimeout(240000);
const observations={scope:'UNEDITED actual full browser:1920x1080 CSS and WebGL DPR1. Fresh visit; no session seen flag. Browser-only AcrossHero active V4→ReviewedHeroResponsive/V8 (wall-time pointer response) module override; active source remainsV4. SwiftShader, not hardware GPU or visual approval.',startedUTC:new Date().toISOString(),errors:[],stages:[]};
page.on('pageerror',e=>observations.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')observations.errors.push(m.text());});
await page.addInitScript(()=>{
 localStorage.setItem('dos-language','ko');window.reviewRaf=[];window.reviewLongTasks=[];window.reviewFrames=[];let last='';
 const tick=t=>{window.reviewRaf.push(t);requestAnimationFrame(tick)};requestAnimationFrame(tick);
 new MutationObserver(()=>{const c=document.querySelector('.across-canvas');if(c?.dataset.frameSerial&&c.dataset.frameSerial!==last){last=c.dataset.frameSerial;window.reviewFrames.push({at:performance.now(),frame:{...c.dataset},intro:document.querySelector('#home')?.classList.contains('is-intro')});}}).observe(document,{attributes:true,subtree:true,childList:true});
 try{new PerformanceObserver(list=>window.reviewLongTasks.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true})}catch{}
});
await page.route('**/src/landing/AcrossHero.tsx*',async route=>{const response=await route.fetch({url:'http://localhost:5201/src/landing/cinematic/folded/ReviewedHeroResponsive.tsx'});await route.fulfill({response});});
const snapshot=async(label,screenshot=true)=>{
 if(stopRequested||fs.existsSync(out+'/STOP-REQUEST'))throw Error('Owned review recording stopped at safe checkpoint');
 const data=await page.evaluate(()=>({at:performance.now(),scrollY,lang:document.documentElement.lang,overflow:document.documentElement.scrollWidth>innerWidth,frame:{...document.querySelector('.across-canvas').dataset},intro:document.querySelector('#home').classList.contains('is-intro')}));
 if(screenshot){const start=Date.now();await page.screenshot({path:out+'/screenshots/'+label+'.png',timeout:300000});data.screenshotReadbackAndEncodeMs=Date.now()-start;data.afterCapture=await page.evaluate(()=>({at:performance.now(),frame:{...document.querySelector('.across-canvas').dataset},copyOpacity:Number(document.querySelector('.across-editorial').style.opacity),titleOpacities:[...document.querySelectorAll('.across-title-line')].map(el=>Number(el.style.opacity))}));const p=Number(data.afterCapture.frame.progress),t=Math.max(0,Math.min(1,(p-.15)/(.46-.15))),expected=1-t*t*(3-2*t);if(Math.abs(data.afterCapture.copyOpacity-expected)>.002)throw Error('DOM copy out of sync with GPU-completed pose');}
 observations.stages.push({label,...data});fs.writeFileSync(out+'/observations-progress.json',JSON.stringify(observations,null,2));console.log('V8_RESPONSIVE_NATIVE_STAGE',label,data.frame.progress,data.frame.entrance,data.frame.camera,data.frame.frameSerial);
 if(observations.errors.length||data.overflow)throw Error('Runtime/layout error at '+label);return data;
};
try{
 await page.goto('http://localhost:5201/',{waitUntil:'commit',timeout:120000});
 await page.waitForFunction(()=>document.querySelector('.across-canvas')?.dataset.assetVersion==='chamber-r8.space-v8-synced',undefined,{timeout:420000});
 if(await page.locator('vite-error-overlay').count())throw Error('Vite overlay');await snapshot('first-real-entry',false);
 await page.waitForFunction(()=>Number(document.querySelector('.across-canvas')?.dataset.entrance)>=.999&&!document.querySelector('#home').classList.contains('is-intro'),undefined,{timeout:240000});
 const stable=await snapshot('stable-hero');
 await page.mouse.move(180,280);await page.waitForFunction(()=>Number(document.querySelector('.across-canvas').dataset.camera.split(',')[0])<-.025,undefined,{timeout:240000});await snapshot('pointer-left');
 await page.mouse.move(1700,650);await page.waitForFunction(()=>Number(document.querySelector('.across-canvas').dataset.camera.split(',')[0])>.02,undefined,{timeout:240000});await snapshot('pointer-right');await page.mouse.move(960,540);
 for(const[label,p]of[['forward-015',.15],['forward-030-nonrigid',.3],['forward-043-open',.43],['forward-065-space',.65],['arrival',1],['reverse-065',.65],['reverse-030-nonrigid',.3],['hero-return',0]]){
  await page.evaluate(p=>{const host=document.querySelector('#home'),top=host.getBoundingClientRect().top+scrollY;scrollTo({top:top+innerHeight*2.6*p,behavior:'instant'});},p);
  await page.waitForFunction(p=>Math.abs(Number(document.querySelector('.across-canvas').dataset.progress)-p)<.003,p,{timeout:240000});await snapshot(label);
 }
 await page.getByRole('button',{name:'ES · RD',exact:true}).click();await snapshot('spanish');observations.spanishTitle=await page.locator('#hero-title').innerText();
 observations.performance=await page.evaluate(()=>({rafTimes:window.reviewRaf,longTasks:window.reviewLongTasks,submittedFrameEvents:window.reviewFrames,videoElements:[...document.querySelectorAll('video')].map(v=>({src:v.getAttribute('src'),readyState:v.readyState,time:v.currentTime,seeking:v.seeking})),note:'rAF/CPU submission/screenshot wall time are NOT GPU frame time or display FPS. Raw software stalls are preserved.'}));
 const cdp=await context.newCDPSession(page);observations.browser=await cdp.send('Browser.getVersion');await cdp.send('Performance.enable');observations.cdpMetrics=(await cdp.send('Performance.getMetrics')).metrics;await cdp.detach();
}catch(e){observations.failure=String(e);throw e;}finally{
 observations.finishedUTC=new Date().toISOString();if(!observations.performance)try{observations.performance=await page.evaluate(()=>({rafTimes:window.reviewRaf,longTasks:window.reviewLongTasks,submittedFrameEvents:window.reviewFrames}));}catch{}
 fs.writeFileSync(out+'/observations.json',JSON.stringify(observations,null,2));await context.close();await video.saveAs(out+'/G1R8-V8-responsive-native-actual-interaction.webm');await browser.close();
}
console.log('V8_RESPONSIVE_NATIVE_BROWSER_RECORDING_COMPLETE');

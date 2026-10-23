import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const P='/workspace/gate1-assets-r8/hero-cosmic-integration-v15';
const obs={kind:'Actual browser forward/reverse; returning visit; no overrides; low-resolution software diagnostic',cssViewport:[960,540],dpr:.5,webgl:[480,270],video:[960,540],encoder:'existing /usr/bin/ffmpeg via local runtime link; official download403, no alternate download',stages:[],errors:[],complete:false};
const started=Date.now();const b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
b.on('disconnected',()=>console.log('BROWSER_DISCONNECTED',Date.now()-started));
let ctx,video;
try{
 ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:.5,recordVideo:{dir:P+'/bounded-video',size:{width:960,height:540}}});
 await ctx.addInitScript(()=>{sessionStorage.setItem('folded-playhouse-seen','1');localStorage.setItem('dos-language','ko')});
 const page=await ctx.newPage();video=page.video();page.on('pageerror',e=>obs.errors.push(String(e)));page.on('crash',()=>console.log('PAGE_CRASH'));page.on('console',m=>{if(m.type()==='error')obs.errors.push(m.text())});
 await page.goto('http://localhost:5201/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('.across-canvas')?.dataset.assetVersion==='chamber-r8.cosmic-v15'&&Number(document.querySelector('.across-canvas').dataset.entrance)>.999,undefined,{timeout:70000});
 obs.interactionStartsSec=(Date.now()-started)/1000;console.log('READY',obs.interactionStartsSec);
 const deadline=Date.now()+65000;
 for(const p of [0,.32,1,.32,0]){
  await page.evaluate(p=>{const el=document.querySelector('#home');scrollTo({top:el.getBoundingClientRect().top+scrollY+innerHeight*2.6*p,behavior:'instant'})},p);
  await page.waitForFunction(p=>Math.abs(Number(document.querySelector('.across-canvas')?.dataset.progress)-p)<.015,p,{timeout:Math.max(1,Math.min(22000,deadline-Date.now()))});
  const frame=await page.evaluate(()=>({...document.querySelector('.across-canvas').dataset}));obs.stages.push({p,sec:(Date.now()-started)/1000,frame});console.log('FRAME',p,frame.progress);await page.waitForTimeout(350);
 }
 obs.complete=true;
}catch(e){obs.failure=String(e);console.log('RECORD_FAILURE',String(e));}
finally{
 try{if(ctx)await ctx.close();if(video)await video.saveAs(P+'/G1R8-V15-actual-scroll-bounded.webm');}catch(e){obs.saveFailure=String(e);console.log('SAVE_FAILURE',String(e));}
 await b.close().catch(()=>{});obs.wallSec=(Date.now()-started)/1000;fs.writeFileSync(P+'/bounded-video-observations.json',JSON.stringify(obs,null,2));console.log('DONE',obs.complete,obs.wallSec);
}

import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const P='/workspace/gate1-assets-r8/hero-surface-integration-v16',obs={scope:'Actual product V16 first visit, CSS1920x1080 DPR.25/native480x270; video960x540. No scene override or retiming.',errors:[],frames:[],introFrames:[],complete:false};
const start=Date.now(),b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});let ctx,video;
try{
 ctx=await b.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:.25,recordVideo:{dir:P+'/raw-video',size:{width:960,height:540}}});await ctx.addInitScript(()=>localStorage.setItem('dos-language','ko'));
 const page=await ctx.newPage();video=page.video();page.on('pageerror',e=>obs.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')obs.errors.push(m.text())});
 await page.goto('http://localhost:5201/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('.across-canvas')?.dataset.assetVersion==='chamber-r8.surface-v16',undefined,{timeout:80000});
 obs.introStartsSec=(Date.now()-start)/1000;console.log('FIRST_FRAME',obs.introStartsSec);
 for(let i=0;i<32;i++){const f=await page.evaluate(()=>({...document.querySelector('.across-canvas').dataset}));if(obs.introFrames.at(-1)?.frameSerial!==f.frameSerial)obs.introFrames.push(f);if(Number(f.entrance)>=.999)break;await page.waitForTimeout(500);}
 await page.waitForFunction(()=>Number(document.querySelector('.across-canvas').dataset.entrance)>.999,undefined,{timeout:20000});
 obs.interactionStartsSec=(Date.now()-start)/1000;
 const save=async(name,p)=>{const frame=await page.evaluate(()=>({...document.querySelector('.across-canvas').dataset}));const layout=await page.evaluate(()=>{const a=document.querySelector('.across-play').getBoundingClientRect(),c=document.querySelector('.across-canvas').getBoundingClientRect();return{cta:{x:a.x,y:a.y,bottom:a.bottom,right:a.right},canvas:{width:c.width,height:c.height},viewport:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth>innerWidth}});await page.screenshot({path:P+'/actual-'+name+'.png'});obs.frames.push({name,requested:p,sec:(Date.now()-start)/1000,frame,layout});console.log('FRAME',name,frame.progress,frame.surfaceVideoOwner);fs.writeFileSync(P+'/observations.json',JSON.stringify(obs,null,2));};
 await save('hero',0);const deadline=Date.now()+100000;
 for(const [name,p]of [['panel-open',.32],['panel-wall',.55],['crossing',.72],['arrival',1],['reverse-panel',.55],['reverse-hero',0]]){await page.evaluate(p=>{const el=document.querySelector('#home');scrollTo({top:el.getBoundingClientRect().top+scrollY+innerHeight*2.6*p,behavior:'instant'})},p);await page.waitForFunction(p=>Math.abs(Number(document.querySelector('.across-canvas').dataset.progress)-p)<.015,p,{timeout:Math.max(1,Math.min(23000,deadline-Date.now()))});await save(name,p);}
 obs.complete=true;
}catch(e){obs.failure=String(e);console.log('FAILURE',String(e));}
finally{try{if(ctx)await ctx.close();if(video)await video.saveAs(P+'/G1R8-V16-actual-intro-surface-scroll-raw.webm');}catch(e){obs.saveFailure=String(e);}await b.close().catch(()=>{});obs.wallSec=(Date.now()-start)/1000;fs.writeFileSync(P+'/observations.json',JSON.stringify(obs,null,2));console.log('CLOSED',obs.complete,obs.wallSec);}

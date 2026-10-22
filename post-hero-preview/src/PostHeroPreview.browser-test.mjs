import assert from 'node:assert/strict';
import {launchChromium} from '../../scripts/playwright-browser.mjs';
const browser=await launchChromium();
const page=await browser.newPage({viewport:{width:1440,height:900}});
page.on('pageerror',error=>console.error(error.message));
await page.route('**/motion-probe',route=>route.fulfill({contentType:'text/html',body:'<div id="probe"></div>'}));
await page.goto(`${process.env.PREVIEW_URL||'http://127.0.0.1:5174'}/motion-probe`);
await page.evaluate(async()=>{
 const React=await import('/node_modules/.vite/deps/react.js'),DOM=await import('/node_modules/.vite/deps/react-dom_client.js'),{PostHeroPreview}=await import('/post-hero-preview/src/PostHeroPreview.tsx');
 await import('/post-hero-preview/src/preview.css');
 HTMLElement.prototype.scrollIntoView=()=>{};
 window.probe={commits:0,states:[],tick:null,state:null};
 const props={embedded:true,renderScene:false,onRegisterFrame:tick=>window.probe.tick=tick,onSceneState:state=>{window.probe.state=state;window.probe.states.push({progress:state.progress,opening:state.opening});}};
 window.probe.root=DOM.default.createRoot(document.getElementById('probe'));window.probe.root.render(React.default.createElement(React.default.Profiler,{id:'post',onRender:()=>window.probe.commits++},React.default.createElement(PostHeroPreview,props)));
});
await page.waitForFunction(()=>window.probe?.tick&&window.probe.state);
const opening=await page.evaluate(async()=>{
 const p=window.probe;p.commits=0;p.states=[];document.querySelector('#letter-scene .primary-button').click();await new Promise(r=>setTimeout(r,0));
 for(let i=0;i<=110;i++){p.tick(1000+i*1000/60);await new Promise(r=>setTimeout(r,0));}
 return{commits:p.commits,scenePublications:p.states.length,distinctOpening:new Set(p.states.map(s=>s.opening)).size,finalOpening:p.state.opening,monotonic:p.states.every((s,i)=>!i||s.opening>=p.states[i-1].opening)};
});
const paper=await page.evaluate(()=>{
 const article=document.querySelector('#moment-letter-copy'),style=article.style,original=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'offsetHeight');let reads=0;
 Object.defineProperty(article,'offsetHeight',{configurable:true,get(){reads++;return original.get.call(this);}});
 const before=style.width;
 for(let i=0;i<60;i++)window.probe.state.onPaperPose({visible:true,corners:[{x:900+i,y:100},{x:1300+i,y:100},{x:1300+i,y:600},{x:900+i,y:600}]});
 delete article.offsetHeight;
 return{poseFrames:60,offsetHeightReads:reads,widthBefore:before,widthAfter:style.width};
});
assert.equal(opening.finalOpening,1);assert.equal(opening.monotonic,true);assert.ok(opening.distinctOpening>100,'scene must receive continuous exact scalars');assert.ok(opening.commits<15,'embedded opening must render at semantic boundaries');
assert.equal(paper.offsetHeightReads,0,'tracking frames must use cached dimensions');assert.equal(paper.widthAfter,'740px');
const reopen=await page.evaluate(async()=>{
 const p=window.probe,article=document.querySelector('#moment-letter-copy'),button=document.querySelector('#letter-scene .primary-button'),naturalHeight=Number(article.dataset.layoutHeight);
 article.style.transform='scaleY(1.5)';button.click();await new Promise(r=>setTimeout(r,0));
 const frozen=p.state.letterClosingRect;p.state.onPaperPose({visible:true,corners:[{x:0,y:0},{x:frozen.width,y:0},{x:frozen.width,y:frozen.height},{x:0,y:frozen.height}]});
 const frozenHeight=parseFloat(article.style.height);button.click();await new Promise(r=>setTimeout(r,30));
 return{naturalHeight,frozenHeight,restoredHeight:Number(article.dataset.layoutHeight),inlineHeight:article.style.height,view:p.state.letterView};
});
assert.ok(reopen.frozenHeight>reopen.naturalHeight*1.4);assert.equal(reopen.restoredHeight,reopen.naturalHeight);assert.equal(reopen.inlineHeight,'');assert.equal(reopen.view,'reading');
const progress=await page.evaluate(async()=>{
 const p=window.probe;for(const el of document.querySelectorAll('[data-pose]'))el.removeAttribute('data-pose');
 let y=0;Object.defineProperty(window,'scrollY',{configurable:true,get:()=>y});
 for(const value of [0,1]){const anchor=document.createElement('div');anchor.dataset.pose=String(value);anchor.getBoundingClientRect=()=>({top:value*1000+innerHeight*.18-y});document.querySelector('.post-hero-preview').append(anchor);}
 p.commits=0;p.states=[];
 for(let i=1;i<=100;i++){y=i*10;dispatchEvent(new Event('scroll'));p.tick(3000+i*16.667);await new Promise(r=>setTimeout(r,0));}
 return{commits:p.commits,distinctProgress:new Set(p.states.map(s=>s.progress)).size,finalProgress:p.state.progress,stage:document.querySelector('.post-hero-preview').dataset.stage};
});
assert.equal(progress.finalProgress,1);assert.equal(progress.stage,'ending');assert.ok(progress.distinctProgress>=100);assert.ok(progress.commits<15);
await page.evaluate(async()=>{
 const React=(await import('/node_modules/.vite/deps/react.js')).default,{PostHeroPreview}=await import('/post-hero-preview/src/PostHeroPreview.tsx');
 const p=window.probe;p.tick=null;p.state=null;
 p.root.render(React.createElement(React.Profiler,{id:'standalone',onRender:()=>p.commits++},React.createElement(PostHeroPreview,{key:'standalone',renderScene:false,onRegisterFrame:tick=>p.tick=tick,onSceneState:state=>p.state=state})));
});
await page.waitForFunction(()=>window.probe.tick&&window.probe.state?.opening===0);
const standalone=await page.evaluate(async()=>{
 const p=window.probe;p.commits=0;document.querySelector('#letter-scene .primary-button').click();await new Promise(r=>setTimeout(r,0));
 for(let i=0;i<=110;i++){p.tick(6000+i*1000/60);await new Promise(r=>setTimeout(r,0));}
 return{commits:p.commits,opening:p.state.opening};
});
assert.ok(Math.abs(standalone.opening-1)<.0005);assert.ok(standalone.commits>90,'standalone scene retains continuous React props');
await page.evaluate(async()=>{
 const React=(await import('/node_modules/.vite/deps/react.js')).default,{useLiveReducedMotion}=await import('/post-hero-preview/src/useLiveReducedMotion.ts');
 function Preference(){return React.createElement('output',{id:'live-preference'},String(useLiveReducedMotion()));}
 window.probe.root.render(React.createElement(Preference));
});
await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('#live-preference')?.textContent==='true');
await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>document.querySelector('#live-preference')?.textContent==='false');
console.log(JSON.stringify({opening,paper,reopen,progress,standalone,livePreference:'reduce -> no-preference passed'},null,2));await browser.close();

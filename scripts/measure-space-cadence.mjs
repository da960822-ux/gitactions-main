import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {launchChromium} from './playwright-browser.mjs';
const out=process.env.HOME_QA_OUTPUT||'output/space-comparison',browser=await launchChromium(),results=[];await fs.mkdir(out,{recursive:true});
try{
for(const [run,kind,port] of [[1,'before-wip',5241],[1,'after-fixes',5233],[2,'after-fixes',5233],[2,'before-wip',5241]]){
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${port}`);await page.locator('.rd-unified-space[data-ready=true]').waitFor({timeout:90000});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1000);
 const result=await page.evaluate(async()=>{const canvas=document.querySelector('.rd-unified-space canvas'),start=performance.now(),count=Number(canvas.dataset.renderCount),frames=[],inputs=[];let active=true;const tick=t=>{if(!active)return;frames.push(t);requestAnimationFrame(tick);};requestAnimationFrame(tick);const timer=setInterval(()=>{const t=(performance.now()-start)/1000,x=720+460*Math.sin(t*Math.PI/2),y=540+130*Math.sin(t*Math.PI/2+.3);document.querySelector('.rd-hero-pin').dispatchEvent(new PointerEvent('pointermove',{clientX:x,clientY:y,bubbles:true}));inputs.push({t,x,y});},50);await new Promise(resolve=>setTimeout(resolve,6500));active=false;clearInterval(timer);const end=performance.now(),seconds=(end-start)/1000,rendered=Number(canvas.dataset.renderCount)-count;const gl=canvas.getContext('webgl2'),extension=gl.getExtension('WEBGL_debug_renderer_info');return{seconds,rendered,renderCallsPerSecond:rendered/seconds,rafPerSecond:new Set(frames).size/seconds,frames,inputs,resolution:JSON.parse(canvas.dataset.renderResolution||'null'),gpu:extension?gl.getParameter(extension.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};});
 assert.deepEqual(errors,[]);assert.ok(result.rendered>5);results.push({run,kind,port,...result,errors});console.log('MEASURED',run,kind,result.renderCallsPerSecond.toFixed(2),result.rafPerSecond.toFixed(2));await page.close();
}
await fs.writeFile(path.join(out,'cadence-abba.json'),JSON.stringify({note:'Same Chromium process, 1440x900 DPR1, 6.5s pointer sine path requested every50ms; ABBA order. Isolated without screencast/tracing. renderCount measures actual renderer.render API submissions; rAF measures browser callback cadence. Neither is physical GPU presentation FPS.',results},null,2));
}finally{await browser.close();}

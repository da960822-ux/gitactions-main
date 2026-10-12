import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {launchChromium} from './playwright-browser.mjs';

const out=process.env.HOME_VIDEO_OUTPUT||'output/space-comparison',run=promisify(execFile);
await fs.mkdir(out,{recursive:true});const browser=await launchChromium();
const protocol=[{t:0,x:500,y:35,scroll:0},{t:2,x:450,y:420,scroll:0},{t:3,x:285,y:420,scroll:0},{t:4,x:450,y:420,scroll:0},{t:5,x:500,y:35,scroll:0},{t:6,x:120,y:350,scroll:0},{t:7.5,x:1290,y:560,scroll:0},{t:9,x:500,y:35,scroll:0},{t:10,x:500,y:35,scroll:0},{t:14,x:500,y:35,scroll:440},{t:16,x:500,y:35,scroll:440},{t:18,x:500,y:35,scroll:680},{t:20,x:500,y:35,scroll:680},{t:22,x:500,y:35,scroll:0},{t:24,x:500,y:35,scroll:0}];
try{
for(const [kind,port] of [['before-wip',5241],['after-fixes',5233]].filter(([kind])=>!process.env.HOME_CAPTURE_KIND||process.env.HOME_CAPTURE_KIND===kind)){
 const dir=path.join(out,kind),frames=[],errors=[];await fs.mkdir(dir,{recursive:true});
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${port}`);await page.locator('.rd-unified-space[data-ready=true]').waitFor({timeout:90000});await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>[...document.querySelectorAll('.rd-hero img')].every(i=>i.complete&&i.naturalWidth));await page.waitForTimeout(1000);
 const cdp=await page.context().newCDPSession(page);let writes=Promise.resolve(),accept=true;const start=Date.now();
 cdp.on('Page.screencastFrame',event=>{if(accept){const file=`frame-${String(frames.length).padStart(6,'0')}.jpg`;frames.push({file,timestamp:event.metadata.timestamp,received:(Date.now()-start)/1000});writes=writes.then(()=>fs.writeFile(path.join(dir,file),Buffer.from(event.data,'base64')));}cdp.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{});});
 await cdp.send('Page.startScreencast',{format:'jpeg',quality:90,maxWidth:1440,maxHeight:900,everyNthFrame:1});
 console.log('CAPTURING',kind);
 const inputs=await page.evaluate(async points=>{
  const started=performance.now(),inputs=[];return await new Promise(resolve=>{const step=()=>{const t=(performance.now()-started)/1000;let index=0;while(index<points.length-2&&t>points[index+1].t)index++;const a=points[index],b=points[index+1],p=Math.min(1,(t-a.t)/(b.t-a.t)),x=a.x+(b.x-a.x)*p,y=a.y+(b.y-a.y)*p,scroll=a.scroll+(b.scroll-a.scroll)*p;scrollTo({top:scroll,behavior:'instant'});const pin=document.querySelector('.rd-hero-pin'),box=pin.getBoundingClientRect();pin.dispatchEvent(new PointerEvent(y>=box.top&&y<=box.bottom?'pointermove':'pointerleave',{clientX:x,clientY:y,bubbles:true}));inputs.push({t,x,y,scroll:scrollY});if(t>=points.at(-1).t)resolve(inputs);else requestAnimationFrame(step);};step();});
 },protocol);
 const end=Date.now();accept=false;await cdp.send('Page.stopScreencast');await writes;assert.deepEqual(errors,[]);assert.ok(frames.length>30);
 const duration=(end-start)/1000-frames[0].received,origin=frames[0].timestamp;let concat='ffconcat version 1.0\n';
 frames.forEach((f,i)=>{const dt=i<frames.length-1?frames[i+1].timestamp-f.timestamp:Math.max(.001,duration-(f.timestamp-origin)-.12);concat+=`file '${f.file}'\nduration ${Math.max(.001,dt).toFixed(6)}\n`;});concat+=`file '${frames.at(-1).file}'\nduration 0.12\n`;
 await fs.writeFile(path.join(dir,'frames.ffconcat'),concat);await fs.writeFile(path.join(out,`${kind}-capture.json`),JSON.stringify({kind,viewport:{width:1440,height:900,dpr:1},duration,frameCount:frames.length,protocol,inputs,errors,frames,note:'Actual production-root CDP JPEG events on Chromium software GPU. Identical wall-clock coordinates/scroll path. Original frame intervals retained; CFR30 duplicates held frames without interpolation or acceleration. Input delivery and captured frame cadence are separately recorded.'},null,2));
 for(const [label,seconds] of [['initial',1.5],['pointer',7.8],['scroll440',15.4],['scroll680',19.4]]){const frame=frames.reduce((best,f)=>Math.abs(f.received-seconds)<Math.abs(best.received-seconds)?f:best,frames[0]);await fs.copyFile(path.join(dir,frame.file),path.join(out,`${kind}-${label}.jpg`));}
 await page.close();const video=path.join(out,`${kind}-actual.mp4`);await run('ffmpeg',['-y','-loglevel','error','-safe','0','-i',path.join(dir,'frames.ffconcat'),'-t',String(duration),'-r','30','-fps_mode','cfr','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',video]);const probe=await run('ffprobe',['-v','error','-show_entries','format=duration','-of','json',video]);assert.ok(Math.abs(Number(JSON.parse(probe.stdout).format.duration)-duration)<.08);console.log('RECORDED',kind,duration.toFixed(2),frames.length);
}
}finally{await browser.close();}

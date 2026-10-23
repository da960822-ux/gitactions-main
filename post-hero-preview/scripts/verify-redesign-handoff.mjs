import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const out='/workspace/scratch/post-polish';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={environment:'Chromium headless / Linux / ANGLE SwiftShader software / DPR 1; not hardware GPU',errors:[],checks:[],captures:[]};
try{
for(const [width,height,language] of [[1920,1080,'es'],[1440,900,'ko'],[390,844,'es']]){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:width===390,hasTouch:width===390});await context.addInitScript(l=>localStorage.setItem('dos-language',l),language);const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:4178',{waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('.post-hero-preview')?.dataset.sceneReady==='true');
 const pose=async(selector,value)=>{console.log(width,'pose',selector,value);await page.locator(selector).evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY-innerHeight*.18,behavior:'instant'}));await page.waitForFunction(v=>Math.abs(Number(document.querySelector('.post-hero-preview').dataset.progress)-v)<.012,value,{timeout:20000});};
 const capture=async(name)=>{const path=`${out}/${width}-${language}-${name}.png`;await page.screenshot({path});report.captures.push(path);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);};
 await pose('.play-table',.45);await capture('play');
 await pose('#letter-scene',.62);const open=page.locator('#letter-scene button');await open.click();console.log(width,'clicked open',await page.locator('.post-hero-preview').evaluate(e=>({p:e.dataset.progress,q:e.dataset.opening})));await page.waitForFunction(()=>Number(document.querySelector('.post-hero-preview').dataset.opening)>.98,undefined,{timeout:60000});await pose('#letter-scene',.62);await capture('open');
 await open.click();await page.waitForFunction(()=>Number(document.querySelector('.post-hero-preview').dataset.opening)<.4);await open.click();await page.waitForFunction(()=>Number(document.querySelector('.post-hero-preview').dataset.opening)>.98);report.checks.push(`${width}: close reversed while still in motion and reopened`);
 await page.keyboard.press('Escape');await page.waitForFunction(()=>Number(document.querySelector('.post-hero-preview').dataset.opening)<.02);assert.equal(await open.evaluate(e=>e===document.activeElement),true);report.checks.push(`${width}: Escape closes and returns focus`);
 await page.locator('.preview-nav nav a').click();await page.waitForFunction(()=>Number(document.querySelector('.post-hero-preview').dataset.progress)>.8);assert.equal(await page.locator('#moment-letter-copy').count(),1);assert.equal(await page.locator('#moment-letter-copy').getAttribute('hidden'),null);await capture('read');
 await pose('.ending',1);await page.locator('.ending').evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY,behavior:'instant'}));await page.waitForFunction(()=>Number(document.querySelector('.post-hero-preview').dataset.progress)>.99);await capture('ending');
 await pose('.play-table',.45);const a=await page.locator('.post-hero-scene').getAttribute('data-camera-z');await pose('#distance',.22);await pose('.play-table',.45);assert.equal(await page.locator('.post-hero-scene').getAttribute('data-camera-z'),a);report.checks.push(`${width}: reverse/direction switch awaited progress and reproduced cameraZ`);
 await context.close();
}
const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const page=await context.newPage();await page.goto('http://127.0.0.1:4178/#papi-letter',{waitUntil:'networkidle'});await page.waitForFunction(()=>Number(document.querySelector('.post-hero-preview').dataset.opening)>.98);assert.equal(await page.locator('#moment-letter-copy').getAttribute('hidden'),null);report.checks.push('reduced motion deep link opens readable DOM');await context.close();
assert.equal(report.errors.length,0);
}finally{await browser.close();await fs.writeFile(`${out}/report.json`,JSON.stringify(report,null,2));}console.log(report);

import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { launchChromium } from './playwright-browser.mjs';

const output=path.resolve(process.env.PLAYWRIGHT_ARTIFACT_DIR||'output/playwright/across-distance');
await fs.mkdir(output,{recursive:true});
const browser=await launchChromium();
const results=[];
const base=process.env.LANDING_URL||'http://127.0.0.1:5191/';
const sizes=[{width:1920,height:1080},{width:1440,height:900},{width:390,height:844}].filter(size=>!process.env.PLAYWRIGHT_VIEWPORT||String(size.width)===process.env.PLAYWRIGHT_VIEWPORT);
try {
  for(const viewport of sizes){
    const name=`${viewport.width}x${viewport.height}`;
    const context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:viewport.width<760,hasTouch:viewport.width<760,recordVideo:{dir:output,size:viewport}});
    const page=await context.newPage();
    const errors=[];const requests=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    page.on('response',r=>{if(r.status()>=400)requests.push({url:r.url(),status:r.status()});});
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.waitForTimeout(1100);
    await page.screenshot({path:path.join(output,`${name}-01-first-entry.png`)});
    await page.waitForTimeout(5100);
    await page.screenshot({path:path.join(output,`${name}-02-stable.png`)});
    assert.equal(await page.locator('.across-title-line').count(),3);
    assert.equal(await page.locator('.game-rail-card').count(),8);
    const stable=await page.evaluate(()=>({scrollY,canvas:{...document.querySelector('.across-canvas').dataset},overflow:document.documentElement.scrollWidth>innerWidth,titleBox:document.querySelector('#hero-title').getBoundingClientRect().toJSON(),intro:!!document.querySelector('.across-gift-intro')}));
    assert.equal(stable.overflow,false,'no horizontal overflow');
    assert.equal(stable.intro,false,'intro dismisses automatically');
    if(viewport.width>760){
      await page.mouse.move(viewport.width*.72,viewport.height*.4,{steps:6});await page.waitForTimeout(650);
      await page.mouse.move(viewport.width*.9,viewport.height*.7,{steps:8});await page.waitForTimeout(1000);
      await page.screenshot({path:path.join(output,`${name}-03-pointer-right.png`)});
      const pointer=await page.locator('.across-canvas').evaluate(el=>Number(el.dataset.pointer));
      assert.ok(pointer>.3,'pointer offsets real scene rig');
      await page.mouse.move(viewport.width*.16,viewport.height*.25,{steps:8});await page.waitForTimeout(950);
      await page.screenshot({path:path.join(output,`${name}-04-pointer-left.png`)});
    }
    const poses=[];
    for(const progress of [.2,.45,.72,.95]){
      await page.evaluate(top=>window.scrollTo({top,behavior:'instant'}),viewport.height*1.7*progress);
      await page.waitForTimeout(1200);
      await page.screenshot({path:path.join(output,`${name}-scroll-${progress}.png`)});
      poses.push(await page.locator('.across-canvas').evaluate(el=>({...el.dataset})));
    }
    assert.ok(Number(poses.at(-1).progress)>.9,'camera reaches inside shared surface');
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(1500);
    await page.screenshot({path:path.join(output,`${name}-05-reverse.png`)});
    assert.ok(Number(await page.locator('.across-canvas').getAttribute('data-progress'))<.03,'reverse restores first pose');
    const frames=await page.evaluate(()=>new Promise(resolve=>{const times=[];let last=performance.now();const start=last;function tick(now){times.push(now-last);last=now;if(now-start<1600)requestAnimationFrame(tick);else resolve({sampleMs:now-start,frames:times.length,meanFrameMs:times.reduce((a,b)=>a+b,0)/times.length,maxFrameMs:Math.max(...times)});}requestAnimationFrame(tick);}));
    await page.locator('button').filter({hasText:'ES · RD'}).click();await page.waitForTimeout(250);
    assert.equal(await page.locator('html').getAttribute('lang'),'es-DO');
    assert.ok((await page.locator('#hero-title').innerText()).includes('para ti.'));
    await page.screenshot({path:path.join(output,`${name}-06-spanish.png`)});
    await page.locator('button').filter({hasText:/^KO$/}).click();
    await page.locator('.across-play').click();await page.waitForTimeout(1200);
    await page.locator('#games').screenshot({path:path.join(output,`${name}-07-gallery.png`)});
    await page.locator('#papi-letter').scrollIntoViewIfNeeded();await page.waitForTimeout(500);
    const letter=page.locator('.moment-fold-button');await letter.click();assert.equal(await letter.getAttribute('aria-expanded'),'false');await page.waitForTimeout(300);await letter.click();await page.waitForTimeout(500);assert.equal(await letter.getAttribute('aria-expanded'),'true');
    await page.locator('#papi-letter').screenshot({path:path.join(output,`${name}-08-letter-existing.png`)});
    await page.locator('.home-footer').scrollIntoViewIfNeeded();await page.waitForTimeout(400);
    await page.screenshot({path:path.join(output,`${name}-09-ending-existing.png`)});
    const video=page.video();await page.close();await context.close();const videoPath=path.join(output,`${name}-raw-browser.webm`);await video.saveAs(videoPath);
    results.push({viewport,stable,poses,frameTiming:frames,errors,failedResponses:requests,video:videoPath});
    assert.deepEqual(errors,[],'no console or page errors');assert.deepEqual(requests,[],'no failed assets');
  }
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});const page=await context.newPage();
  await page.addInitScript(()=>localStorage.setItem('dos-language','es'));await page.goto(base);await page.waitForTimeout(1000);await page.screenshot({path:path.join(output,'reduced-motion.png')});assert.equal(await page.locator('.across-gift-intro').count(),0);
  await page.locator('.game-rail-card').first().click();assert.ok(page.url().includes('/play?game=davinci'));assert.equal(await page.evaluate(()=>localStorage.getItem('dos-language')),'es');
  await page.goto(base);await page.locator('.landing-nav a[href="/feedback"]').click();assert.ok(page.url().endsWith('/feedback'));
  await context.close();
  results.push({routes:'Da Vinci and feedback nav; locale es persists',reducedMotion:'no intro and static camera'});
} finally {await fs.writeFile(path.join(output,'verification.json'),JSON.stringify(results,null,2));await browser.close();}
console.log(JSON.stringify(results,null,2));

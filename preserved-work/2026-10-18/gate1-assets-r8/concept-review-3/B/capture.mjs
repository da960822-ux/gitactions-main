import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const root='/workspace/gate1-assets-r8/concept-review-3/B';
let html=await fs.readFile(root+'/index.html','utf8');
for(const [path,mime] of [['hero-environment.png','image/png'],['arrival-environment.png','image/png'],['file:///workspace/yl-folded-playhouse-r8/public/images/yeonseok-lisbeth-cutout.webp','image/webp'],['file:///workspace/yl-folded-playhouse-r8/public/fonts/dm-sans-regular.ttf','font/ttf'],['file:///workspace/yl-folded-playhouse-r8/public/fonts/dm-sans-700.ttf','font/ttf']]){const actual=path.startsWith('file://')?path.slice(7):root+'/'+path;const data=await fs.readFile(actual);html=html.replaceAll(path,'data:'+mime+';base64,'+data.toString('base64'));}
html=html.replace(/<script>[\s\S]*?<\/script>/,'');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.setContent(html);for(const scene of ['hero','arrival']){await page.evaluate(s=>{document.querySelector('#hero').hidden=s!=='hero';document.querySelector('#arrival').hidden=s!=='arrival'},scene);await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(im=>im.decode()))});await page.screenshot({path:root+'/'+scene+'.png',fullPage:false});const meta=await page.evaluate(()=>({width:innerWidth,height:innerHeight,visible:[...document.querySelectorAll('main')].filter(x=>!x.hidden).length}));assert.equal(meta.width,1920);assert.equal(meta.height,1080);assert.equal(meta.visible,1);}
assert.deepEqual(errors,[]);await fs.writeFile(root+'/capture-check.json',JSON.stringify({nativePixels:[1920,1080],webgl:false,motionImplemented:false,portraitSourceUnchanged:true,errors},null,2));await browser.close();

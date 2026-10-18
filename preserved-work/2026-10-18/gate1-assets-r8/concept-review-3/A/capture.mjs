import fs from 'node:fs/promises';
import { chromium } from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
const root='/workspace/gate1-assets-r8/concept-review-3/A';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
for(const scene of ['hero','arrival']){let html=await fs.readFile(`${root}/${scene}.html`,'utf8');for(const file of ['gowun.woff2','dm.ttf','our-universe-scene.webp','couple.webp','playroom.png']){const mime=file.endsWith('.woff2')?'font/woff2':file.endsWith('.ttf')?'font/ttf':file.endsWith('.png')?'image/png':'image/webp';html=html.replaceAll(`assets/${file}`,`data:${mime};base64,${(await fs.readFile(`${root}/assets/${file}`)).toString('base64')}`);}await page.setContent(html);await page.evaluate(()=>document.fonts.ready);await page.locator('.bg').evaluate(e=>e.decode());await page.screenshot({path:`${root}/${scene}.png`});}
await browser.close();

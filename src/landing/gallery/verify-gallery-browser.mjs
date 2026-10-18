import {chromium} from 'playwright';
import fs from 'node:fs';
const out=new URL('../../../../output/playwright/gallery/',import.meta.url).pathname;
fs.mkdirSync(out,{recursive:true});
const base=process.env.GALLERY_REVIEW_URL??'http://127.0.0.1:5230';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const records=[];
for(const [width,height] of [[1440,900],[1920,1080],[390,844]]){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce',hasTouch:width===390});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
 await page.goto(`${base}/src/landing/gallery/gallery-review.html`);
 await page.locator('#games').scrollIntoViewIfNeeded();
 await page.locator('.rd-studio canvas[data-ready="true"]').waitFor({timeout:120000});
 await page.screenshot({timeout:120000,path:`${out}/isolated-${width}-ko.png`});
 const bounds=await page.locator('.rd-studio canvas').boundingBox();
 const peripheralX=bounds.x+bounds.width/2+(width===390?2.65:5.8)*bounds.height/(2*(width===390?13.4:12.8)*Math.tan(19*Math.PI/180));
 if(width===390)await page.touchscreen.tap(peripheralX,bounds.y+bounds.height/2);else await page.mouse.click(peripheralX,bounds.y+bounds.height/2);
 if(await page.locator('[data-game="davinci"]').getAttribute('aria-pressed')!=='true')throw Error('Reduced-motion raycast failed '+width);

 await page.locator('[data-game="davinci"]').focus();await page.keyboard.press('End');
 if(await page.locator('[data-game="rhythm"]').getAttribute('aria-pressed')!=='true')throw Error('End keyboard selection failed');
 await page.keyboard.press('Home');if(await page.locator('[data-game="davinci"]').getAttribute('aria-pressed')!=='true')throw Error('Home selection failed');
 for(const id of ['davinci','catchmind','domino','jaipur','splendor','minhwatu','marble','rhythm']){
  await page.locator(`[data-game="${id}"]`).click();
  await page.waitForTimeout(300);
  if(await page.locator('.rd-game-start').getAttribute('href')!==`/play?game=${id}`)throw Error('Route mismatch '+id);
 }
 await page.locator('[data-game="marble"]').click();
 await page.locator('#games').scrollIntoViewIfNeeded();await page.waitForTimeout(400);
 await page.screenshot({timeout:120000,path:`${out}/isolated-${width}-marble-ko.png`});
 await page.locator('button').filter({hasText:'ES · RD'}).click();
 await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({timeout:120000,path:`${out}/isolated-${width}-es.png`});
 if(width===390)await page.screenshot({timeout:120000,path:`${out}/isolated-${width}-es-full.png`,fullPage:true});
 records.push({width,height,errors,...await page.evaluate(()=>({lang:document.documentElement.lang,storage:localStorage.getItem('dos-language'),overflow:document.documentElement.scrollWidth>innerWidth,canvas:document.querySelector('.rd-studio canvas')?.dataset.selectedBounds}))});
 await context.close();
}
fs.writeFileSync(`${out}/review.json`,JSON.stringify(records,null,2));
await browser.close();console.log(JSON.stringify(records));

import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const output='output/playwright';const report=JSON.parse(await fs.readFile(`${output}/qa-report.json`,'utf8'));
report.followup={reason:'Manual reopen boundary and mobile artwork framing fixes',checks:[],errors:[],screenshots:[]};
const check=(name,pass)=>{report.followup.checks.push({name,pass:Boolean(pass)});if(!pass)console.log('FAIL',name);};
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>report.followup.errors.push(e.message));await page.goto('http://127.0.0.1:4179/');await page.waitForFunction(()=>document.querySelector('main')?.dataset.sceneReady==='true');
 await page.getByRole('link',{name:'편지 읽기',exact:true}).first().click();await page.waitForFunction(()=>Number(document.querySelector('main')?.dataset.progress)>.8);
 await page.locator('.letter-section-label button').click();await page.waitForFunction(()=>Number(document.querySelector('main')?.dataset.opening)<.02);
 check('Manual close persists at reading progress',await page.locator('#moment-letter-copy').isHidden());
 await page.evaluate(()=>window.scrollBy({top:60,behavior:'instant'}));await page.waitForTimeout(150);check('Reading scroll does not reopen closed letter',Number(await page.locator('main').getAttribute('data-opening'))<.02);
 await page.locator('.letter-section-label button').click();await page.waitForFunction(()=>Number(document.querySelector('main')?.dataset.opening)>.98);
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForFunction(()=>Number(document.querySelector('main')?.dataset.opening)<.02);
 check('Reverse to intro clears direct reopen and closes actual flap',Math.abs(Number(await page.locator('.post-hero-scene').getAttribute('data-flap-angle')))<.05);
 await page.close();
 for(const language of ['ko','es']){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});await context.addInitScript(lang=>localStorage.setItem('dos-language',lang),language);
  const p=await context.newPage();p.on('pageerror',e=>report.followup.errors.push(e.message));await p.goto('http://127.0.0.1:4179/');await p.waitForFunction(()=>document.querySelector('main')?.dataset.sceneReady==='true');
  check(`${language} scene separated below body`,await p.locator('.world').evaluate(el=>el.getBoundingClientRect().top>=innerHeight*.49));
  check(`${language} mobile no horizontal overflow`,await p.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
  const camera=await p.locator('.post-hero-scene').getAttribute('data-camera-z');await p.evaluate(()=>window.scrollBy({top:50,behavior:'instant'}));await p.waitForTimeout(200);check(`${language} reduced-motion camera holds within story stage`,await p.locator('.post-hero-scene').getAttribute('data-camera-z')===camera);
  await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await p.screenshot({path:`${output}/07-story-${language}-390.png`});report.followup.screenshots.push(`07-story-${language}-390.png`);
  await p.getByRole('link',{name:language==='ko'?'편지 읽기':'Leer la carta',exact:true}).first().click();await p.waitForFunction(()=>Number(document.querySelector('main')?.dataset.progress)>.8);
  check(`${language} mobile full source letter visible`,await p.locator('#moment-letter-copy').isVisible());
  await p.screenshot({path:`${output}/08-letter-${language}-390.png`});report.followup.screenshots.push(`08-letter-${language}-390.png`);await context.close();
 }
}finally{await browser.close();await fs.writeFile(`${output}/qa-report.json`,JSON.stringify(report,null,2));}
console.log(JSON.stringify({baseChecks:report.checks.length,followupPassed:report.followup.checks.filter(c=>c.pass).length,followupTotal:report.followup.checks.length,errors:report.followup.errors}));
assert.ok(report.followup.checks.every(c=>c.pass));assert.equal(report.followup.errors.length,0);

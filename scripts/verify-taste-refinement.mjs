import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const dir='output/current-review/taste-refinement/after-browser';
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];
async function draw(p){const b=await p.locator('.pp-signature-pad').boundingBox();assert(b&&b.width>350&&b.height>80);await p.mouse.move(b.x+b.width*.12,b.y+b.height*.64);await p.mouse.down();for(let i=0;i<=24;i++)await p.mouse.move(b.x+b.width*(.12+i*.027),b.y+b.height*(.5+Math.sin(i*.9)*.19));await p.mouse.up();}
try{for(const [language,width,height] of [['es',1440,900],['ko',1920,1080]]){
 const r={language,width,height,status:'running',checks:[],errors:[],networkErrors:[]};results.push(r);
 const c=await browser.newContext({viewport:{width,height},});
 await c.addInitScript(l=>{localStorage.setItem('dos-language',l);localStorage.setItem('dos-partner-pact-response-v1','yes');},language);
 const p=await c.newPage();p.on('pageerror',e=>r.errors.push(String(e)));p.on('response',response=>{if(response.status()>=400)r.networkErrors.push(`${response.status()} ${response.url()}`);});const capture=async n=>p.screenshot({path:`${dir}/${width}-${n}.png`});
 try{
 await p.goto('http://127.0.0.1:5174/',{waitUntil:'networkidle',timeout:90000});await p.locator('.landing-world-host.is-world-ready').waitFor({timeout:60000});
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await capture('hero');
 await p.locator('#distance').evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));await p.waitForTimeout(1200);
 assert.equal(await p.locator('#distance .country-companions').count(),1);assert.equal(await p.locator('.country-companions').evaluate(e=>getComputedStyle(e.closest('#distance')).overflowY),'clip');
 await capture('birds-idle');await p.locator('.lovebird-greeting').click();await p.waitForTimeout(400);await capture('birds-flight');await p.waitForTimeout(1600);await capture('birds-together');
 r.checks.push('cute new bird artwork, actual pointer greeting and wing/heart playback');
 for(const [n,offset] of [['boundary',height*.48],['time',0]]){await p.locator('#time-difference').evaluate((e,offset)=>scrollBy(0,e.getBoundingClientRect().top-offset),offset);await p.waitForTimeout(600);await capture(n);}
 assert(await p.locator('.country-companions').evaluate(e=>e.getBoundingClientRect().bottom<=1));assert.equal(await p.locator('#time-difference .country-companions').count(),0);
 r.checks.push('section-owned clipping: no birds inside time section');
 await p.mouse.wheel(0,-height*.5);await p.waitForTimeout(400);await p.mouse.wheel(0,height*.6);await p.waitForTimeout(500);await capture('direction-change');
 await p.locator('#distance').evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));await p.waitForTimeout(650);await p.locator('.lovebird-greeting').focus();await p.keyboard.press('Enter');await p.waitForTimeout(100);await capture('birds-keyboard');
 r.checks.push('reverse/mid-direction return and keyboard greeting remain usable');
 await p.locator('#shared-place').evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));await p.waitForTimeout(500);await capture('duel');
 await p.locator('#games').evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));await p.waitForTimeout(600);await capture('gallery');
 assert.equal(await p.locator('.rd-game-choices button').count(),8);
 for(const b of await p.locator('.rd-game-choices button').all()){await b.click();await p.waitForFunction(id=>document.querySelector(`[data-game="${id}"]`)?.getAttribute('aria-pressed')==='true',await b.getAttribute('data-game'));assert((await p.locator('.rd-game-start').getAttribute('href')).includes(await b.getAttribute('data-game')));}
 await p.locator('.rd-game-choices button').first().focus();await p.keyboard.press('ArrowRight');await p.waitForFunction(()=>document.querySelectorAll('.rd-game-choices button')[1]?.getAttribute('aria-pressed')==='true');assert.equal(await p.locator('.rd-game-choices button').nth(1).getAttribute('aria-pressed'),'true');await capture('gallery-focus');
 assert.equal(await p.locator('.cs-game-gallery').evaluate(e=>getComputedStyle(e).fontFamily), '"DM Sans", Arial, sans-serif');
 r.checks.push('all eight selection states, matching play href, arrow-key focus, unified DM Sans');
 await p.locator('#letter-scene a[href="#papi-letter"]').click({force:true});await p.waitForTimeout(1300);await p.locator('.pp-dolls').scrollIntoViewIfNeeded();await p.locator('.pp-dolls').click();
 await p.locator('.pp-signature-pad').scrollIntoViewIfNeeded();await capture('contract-empty');assert(await p.locator('.pp-answer').isDisabled());await p.locator('.pp-signature-pad').click();assert(await p.locator('.pp-answer').isDisabled());
 await draw(p);assert(await p.locator('.pp-answer').isEnabled());await p.locator('.pp-name-details summary').click();await p.locator('.pp-signature-name').fill('Lisbeth');assert.equal(await p.locator('.pp-signature-pad').getAttribute('data-point-count'),'0');
 await p.locator('.pp-signature-pad').scrollIntoViewIfNeeded();await draw(p);assert.equal(await p.locator('.pp-signature-name').inputValue(),'');assert.equal(await p.locator('.pp-response').getAttribute('data-signature-mode'),'drawn');
 await capture('signature-drawn');await p.locator('.pp-answer').click();await p.locator('.pp-signed').waitFor();assert.equal(await p.locator('.pp-response').getAttribute('data-signature-status'),'signed');
 const signed=await p.evaluate(()=>JSON.parse(localStorage.getItem('dos-partner-pact-response-v2')));assert.equal(signed.signature.mode,'drawn');assert(signed.signature.strokes[0].length>10);r.savedPointCount=signed.signature.strokes[0].length;
 await capture('signature-confirmed');r.checks.push('old yes ignored; empty tap rejected; draw/type/draw last input wins; real signature confirmed and saved');
 await p.locator('.pp-close').click();await p.locator('.letter-bottom-controls button').scrollIntoViewIfNeeded();const before=await p.evaluate(()=>scrollY);await p.locator('.letter-bottom-controls button').click();
 await p.locator('.letter-rose-pane:not([hidden])').waitFor({state:'visible',timeout:15000});await p.waitForFunction(()=>document.querySelector('#rose-gift-finale')?.dataset.phase==='received',null,{timeout:15000});await p.locator('.ec-finale-actions').waitFor({state:'visible'});
 assert((await p.locator('.rg-last-word').innerText()).includes(language==='ko'?'사인했으니까':'firmaste'));r.foldDelta=(await p.evaluate(()=>scrollY))-before;assert(Math.abs(r.foldDelta)<2);await capture('rose-after-sign');
 r.checks.push('confirmed signature alone enables signed rose caption; fold scroll Δ0');
 await p.locator('.ec-read-again').click();await p.waitForTimeout(600);await p.locator('.pp-dolls').scrollIntoViewIfNeeded();await p.locator('.pp-dolls').click();assert(await p.locator('.pp-signature-mark').isVisible());await p.locator('.pp-reset').click();await p.locator('.pp-signature-pad').waitFor();assert(await p.locator('.pp-answer').isDisabled());assert(await p.locator('.pp-signature-pad').evaluate(e=>document.activeElement===e));
 await capture('signature-reset');r.checks.push('reread retains actual signature; reset removes saved signature and restores pad focus');
 assert.equal(r.errors.length,0);assert.equal(r.networkErrors.length,0);r.status='pass';
 }catch(e){r.status='failed';r.failure=e.stack||String(e);await capture('failure').catch(()=>{});}finally{r.video=p.video()?await p.video().path():null;await c.close();}
}}finally{await browser.close();await fs.writeFile(dir+'/report.json',JSON.stringify(results,null,2));}
console.log(JSON.stringify(results));

if(results.some(result=>result.status!=='pass'))process.exitCode=1;

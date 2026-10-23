import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const output='output/playwright';await fs.mkdir(output,{recursive:true});
const report={url:process.env.PREVIEW_URL||'http://127.0.0.1:4178/',checks:[],errors:[],screenshots:[],browser:'Chromium software WebGL',limitations:['No Safari or physical device testing','No Hero integration or server coevents','Latest approved pawn/joker/noble assets are not in this checkout']};
const check=(name,pass,detail='')=>{report.checks.push({name,pass:Boolean(pass),detail});if(!pass)console.log('FAIL',name,detail);};
const source=await fs.readFile('../src/copy/home.ts','utf8');
const bodies=[...source.matchAll(/letterBody:\s*\[([\s\S]*?)\]/g)].map(m=>[...m[1].matchAll(/'([^']*)'/g)].map(x=>x[1]));
assert.equal(bodies.length,2);
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
async function capture(page,name){await page.screenshot({path:`${output}/${name}.png`});report.screenshots.push(`${name}.png`);console.log('CAPTURE',name);}
async function q(page){return Number(await page.locator('main').getAttribute('data-opening'));}
async function ready(page){await page.waitForFunction(()=>document.querySelector('main')?.dataset.sceneReady==='true');await page.waitForTimeout(200);}
async function jump(page,id){await page.evaluate(id=>{const el=document.getElementById(id);window.scrollTo({top:el.getBoundingClientRect().top+scrollY-innerHeight*.18,behavior:'instant'});},id);await page.waitForFunction(()=>Number(document.querySelector('main')?.dataset.progress)>.59,{},{timeout:10000});}
try{
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(report.url);await ready(page);
 check('WebGL canvas attached',await page.locator('.world canvas').count()===1);
 check('Desktop no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await capture(page,'01-story-ko-desktop');
 await jump(page,'letter-scene');
 await page.getByRole('button',{name:'편지 열기',exact:true}).first().click();
 await page.waitForFunction(()=>Number(document.querySelector('main')?.dataset.opening)>.98);
 check('Click opens q to1',await q(page)>.98);
 await capture(page,'02-open-mesh-ko-desktop');
 const scene=page.locator('.post-hero-scene');
 const pose=await scene.evaluate(el=>({...el.dataset}));
 if(pose.flapAngle!==undefined){check('Actual flap rotated >150deg',Math.abs(Number(pose.flapAngle))>2.6,JSON.stringify(pose));check('Actual paper extracted above body',Number(pose.insertY)>1.5,JSON.stringify(pose));}
 await page.locator('#letter-scene button').click();
 await page.waitForFunction(()=>Number(document.querySelector('main')?.dataset.opening)<.02);
 check('Click closes q back0',await q(page)<.02);
 if(pose.flapAngle!==undefined){check('Actual flap returns closed',Math.abs(Number(await scene.getAttribute('data-flap-angle')))<.05);}
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(150);
 await page.getByRole('link',{name:'편지 읽기',exact:true}).first().click();
 await page.waitForFunction(()=>!document.getElementById('moment-letter-copy')?.hidden);
 for(const paragraph of bodies[0])check('KO source paragraph preserved',await page.locator('#moment-letter-copy').getByText(paragraph,{exact:true}).count()===1,paragraph);
 check('One letter DOM',await page.locator('#moment-letter-copy').count()===1);
 await page.waitForFunction(()=>Number(document.querySelector('main')?.dataset.progress)>.8);
 check('3D insert hands off without duplicate blank paper',await scene.getAttribute('data-paper-visible')==='false');
 await capture(page,'03-full-letter-ko-desktop');
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(100);
 await page.getByRole('button',{name:'Cambiar a español'}).click();
 check('Language document es-DO',await page.locator('html').getAttribute('lang')==='es-DO');
 await page.getByRole('link',{name:'Leer la carta',exact:true}).first().click();
 for(const paragraph of bodies[1])check('ES source paragraph preserved',await page.locator('#moment-letter-copy').getByText(paragraph,{exact:true}).count()===1,paragraph);
 await capture(page,'04-full-letter-es-desktop');
 await page.evaluate(()=>document.querySelector('.ending').scrollIntoView({behavior:'instant'}));await page.waitForTimeout(300);
 await capture(page,'05-ending-es-desktop');
 check('Original game and feedback links retained',await page.locator('a[href="/#games"]').count()===1 && await page.locator('a[href="/feedback"]').count()===1);
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(100);await page.getByRole('button',{name:'한국어로 바꾸기'}).click();
 await page.getByRole('button',{name:'작은 장난들',exact:true}).click();
 await page.locator('#details-playground').scrollIntoViewIfNeeded();
 const domino=page.locator('.domino-card');
 for(let i=0;i<3;i++)await domino.getByRole('button',{name:'선택한 타일 놓기'}).click();
 check('Domino interaction completes',await domino.getByText('맞췄네 haha').count()===1);
 const balance=page.locator('.balance-card');
 check('Balance rejects unbalanced confirm',await balance.getByRole('button',{name:'가운데 놓기'}).isDisabled());
 for(let i=0;i<4;i++)await balance.getByRole('button',{name:'왼쪽',exact:true}).click();
 await balance.getByRole('button',{name:'가운데 놓기'}).click();check('Balance confirms near center',await balance.locator('.balance-window').count()===1);
 const draw=page.locator('.drawing-card');await draw.getByRole('button',{name:'선',exact:true}).click();await draw.getByRole('button',{name:'카드로 뒤집기'}).click();check('Drawing survives flip',await draw.locator('.flipped-drawing polyline').count()===1);
 const rhythm=page.locator('.rhythm-card');await rhythm.getByRole('button',{name:'신호 보기'}).click();for(const i of [1,3,2])await rhythm.getByRole('button',{name:`막대 ${i}`,exact:true}).click();check('Rhythm recognizes user input',await rhythm.getByText('막대가 작은 다리로 이어졌어.').count()===1);
 const bridge=page.locator('.bridge-card');await bridge.getByRole('button',{name:'돌리기 1'}).click();await bridge.getByRole('button',{name:'돌리기 2'}).click();await bridge.getByRole('button',{name:'돌리기 2'}).click();check('Paper rotations complete bridge',await bridge.getByText('통로가 이어졌어.').count()===1);
 await page.locator('.details-card').getByRole('button',{name:'양면 문구',exact:true}).click();
 check('Bilingual phrase turns to Spanish',await page.locator('.phrase-card').innerText()==='Vamos a jugar');
 await page.locator('.details-card').getByRole('button',{name:'빛 각도 바꾸기 1/3'}).click();
 check('Aligned prism reveals game destination',await page.locator('a.prism-game-link[href="/play?game=catchmind"]').count()===1);
 await page.locator('#details-playground').scrollIntoViewIfNeeded();await capture(page,'06-local-details-ko-desktop');
 await context.close();
 for(const [width,height,language] of [[768,1024,'ko'],[390,844,'ko'],[390,844,'es']]){
  const c=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',isMobile:width<500,hasTouch:width<500});await c.addInitScript(lang=>localStorage.setItem('dos-language',lang),language);
  const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.goto(report.url);await ready(p);
  check(`${width}/${language} no overflow`,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await capture(p,`07-story-${language}-${width}`);
  const label=language==='ko'?'편지 읽기':'Leer la carta';await p.getByRole('link',{name:label,exact:true}).first().click();check(`${width}/${language} reduced-motion direct read`,await q(p)>.98&&await p.locator('#moment-letter-copy').isVisible());
  check(`${width}/${language} paper in viewport`,await p.locator('.letter-paper').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}));await capture(p,`08-letter-${language}-${width}`);
  await c.close();
 }
}finally{await browser.close();await fs.writeFile(`${output}/qa-report.json`,JSON.stringify(report,null,2));}
console.log(JSON.stringify({passed:report.checks.filter(c=>c.pass).length,total:report.checks.length,errors:report.errors,screenshots:report.screenshots.length},null,2));
assert.equal(report.errors.length,0,'Browser runtime errors');assert.ok(report.checks.every(c=>c.pass),'Some checks failed');

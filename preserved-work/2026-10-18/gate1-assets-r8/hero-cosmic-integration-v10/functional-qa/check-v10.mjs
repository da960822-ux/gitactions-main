import fs from 'node:fs/promises';
import {launchChromium} from '/workspace/yl-folded-playhouse-r8/scripts/playwright-browser.mjs';
const dir='/workspace/gate1-assets-r8/hero-cosmic-integration-v10/functional-qa',base='http://127.0.0.1:5201/';
const games=['davinci','catchmind','domino','jaipur','splendor','minhwatu','marble','rhythm'];
const ko=['이거 만들면서 네가 보고 어떤 반응을 할까 계속 생각했어.','네가 가족들이랑 자주 하는 도미노도 같이 해보고 싶었고, 다른 게임도 우리 둘이 하면 재밌을 것 같았어.','직접 옆에 있으면 더 좋겠지만, 떨어져 있는 동안에도 이렇게 같이 놀 수 있으면 좋겠어.','아직 부족한 게 있으면 같이 하면서 고쳐갈게.','사랑해, mami.'];
const es=['Mientras hacía esto, no dejaba de pensar en qué cara pondrías al verlo.','Quería jugar contigo al dominó, que juegas tanto con tu familia, y pensé que los otros juegos también serían divertidos para nosotros dos.','Me encantaría estar a tu lado, pero ojalá podamos divertirnos así mientras estamos lejos.','Si algo todavía necesita mejorar, lo iremos arreglando mientras jugamos.','Te amo, mami.'];
const report={base,viewport:{width:1440,height:900,deviceScaleFactor:.5},checks:[],errors:[],heroNote:'V10 frame/camera proof referenced from parent native capture; short functional browser pass does not wait for software-WebGL initialization.'};
async function save(){report.summary={passed:report.checks.filter(x=>x.pass).length,failed:report.checks.filter(x=>!x.pass).length,total:report.checks.length};await fs.writeFile(`${dir}/verification.json`,JSON.stringify(report,null,2));}
async function check(name,pass,detail=''){let x={name,pass:Boolean(pass),detail};report.checks.push(x);await save();console.log(JSON.stringify(x));}
const browser=await launchChromium();
try{
 const ctx=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:.5}),p=await ctx.newPage();p.setDefaultTimeout(6000);
 p.on('pageerror',e=>report.errors.push({type:'pageerror',message:e.message}));p.on('console',m=>{if(m.type()==='error')report.errors.push({type:'console.error',message:m.text()});});
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:7000});await p.locator('.landing').waitFor({state:'visible',timeout:7000});
 const choices=await p.locator('.rd-game-choices button').count();await check('landing renders eight game choices',choices===8,String(choices));
 for(const id of games){
  try{await p.evaluate(id=>document.querySelector(`.rd-game-choices button[data-game="${id}"]`)?.click(),id);await p.waitForFunction(id=>document.querySelector('.rd-game-start')?.getAttribute('href')===`/play?game=${id}`,id,{timeout:2500});const href=await p.locator('.rd-game-start').getAttribute('href');await check(`gallery choice updates href: ${id}`,href===`/play?game=${id}`,String(href));}
  catch(e){await check(`gallery choice updates href: ${id}`,false,String(e));}
 }
 const chosen='rhythm';await p.evaluate(()=>document.querySelector('.rd-game-start')?.click());await p.locator('.lobby-picks').waitFor({state:'visible',timeout:6000});let selected=await p.locator('.pick-item[aria-pressed="true"] .game-thumbnail').getAttribute('class');let url=new URL(p.url());await check('gallery start link selects chosen game in lobby',url.pathname==='/play'&&url.searchParams.get('game')===chosen&&selected?.includes(`art-${chosen}`),JSON.stringify({route:url.pathname+url.search,selected}));
 // Independent route-selection checks for all eight were completed in the preceding short pass.
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:7000});await p.locator('.landing').waitFor({state:'visible',timeout:7000});
 const beforeKo=await p.locator('#moment-letter-copy p').allTextContents();await check('Korean five original paragraphs intact',JSON.stringify(beforeKo)===JSON.stringify(ko),JSON.stringify(beforeKo));
 let state=await p.evaluate(()=>({expanded:document.querySelector('.moment-fold-button')?.getAttribute('aria-expanded'),hidden:document.querySelector('#moment-letter-copy')?.getAttribute('aria-hidden')}));await check('Korean letter begins open',state.expanded==='true'&&state.hidden==='false',JSON.stringify(state));
 await p.evaluate(()=>document.querySelector('#papi-letter .moment-fold-button')?.click());state=await p.evaluate(()=>({expanded:document.querySelector('.moment-fold-button')?.getAttribute('aria-expanded'),hidden:document.querySelector('#moment-letter-copy')?.getAttribute('aria-hidden')}));await check('Korean letter closes',state.expanded==='false'&&state.hidden==='true',JSON.stringify(state));
 await p.evaluate(()=>document.querySelector('#papi-letter .moment-fold-button')?.click());state=await p.evaluate(()=>({expanded:document.querySelector('.moment-fold-button')?.getAttribute('aria-expanded'),hidden:document.querySelector('#moment-letter-copy')?.getAttribute('aria-hidden')}));await check('Korean letter reopens',state.expanded==='true'&&state.hidden==='false');
 await p.evaluate(()=>[...document.querySelectorAll('.landing-language button')].find(b=>b.textContent.includes('ES'))?.click());let lang=await p.evaluate(()=>({stored:localStorage.getItem('dos-language'),html:document.documentElement.lang}));await check('Spanish select sets locale',lang.stored==='es'&&lang.html==='es-DO',JSON.stringify(lang));
 await p.reload({waitUntil:'domcontentloaded',timeout:7000});await p.locator('.landing').waitFor({state:'visible',timeout:7000});lang=await p.evaluate(()=>({stored:localStorage.getItem('dos-language'),html:document.documentElement.lang}));await check('Spanish locale survives refresh',lang.stored==='es'&&lang.html==='es-DO',JSON.stringify(lang));
 const beforeEs=await p.locator('#moment-letter-copy p').allTextContents();await check('Spanish five original paragraphs intact',JSON.stringify(beforeEs)===JSON.stringify(es),JSON.stringify(beforeEs));
 await p.evaluate(()=>[...document.querySelectorAll('.landing-nav a')].find(a=>a.getAttribute('href')==='/feedback')?.click());await p.locator('.feedback-route').waitFor({state:'visible',timeout:6000});const feedback={path:new URL(p.url()).pathname,stored:await p.evaluate(()=>localStorage.getItem('dos-language')),html:await p.locator('html').getAttribute('lang'),heading:await p.locator('.feedback-route h1').innerText()};await check('feedback route preserves Spanish',feedback.path==='/feedback'&&feedback.stored==='es'&&feedback.html==='es-DO'&&feedback.heading.includes('Mami'),JSON.stringify(feedback));
 await ctx.close();
}catch(e){report.errors.push({type:'qa-run-error',message:String(e)});}
finally{await browser.close();await save();console.log(JSON.stringify({summary:report.summary,errors:report.errors},null,2));}

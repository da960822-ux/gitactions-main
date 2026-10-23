import fs from 'node:fs/promises';
import {launchChromium} from '/workspace/yl-folded-playhouse-r8/scripts/playwright-browser.mjs';
const out='/workspace/gate1-assets-r8/hero-cosmic-integration-v10/functional-qa/locale-feedback.json';
const browser=await launchChromium(), checks=[],errors=[];let page;
const check=(name,pass,detail='')=>{checks.push({name,pass:Boolean(pass),detail});console.log(JSON.stringify(checks.at(-1)));};
try{
 const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:.5});page=await context.newPage();page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5201/',{waitUntil:'commit',timeout:8000});
 await page.locator('.landing-language').waitFor({state:'attached',timeout:8000});
 await page.evaluate(()=>[...document.querySelectorAll('.landing-language button')].find(x=>x.textContent.includes('ES'))?.click());
 await page.waitForFunction(()=>document.documentElement.lang==='es-DO',null,{timeout:5000});
 check('Spanish UI selection sets dos-language and es-DO',await page.evaluate(()=>localStorage.getItem('dos-language')==='es'&&document.documentElement.lang==='es-DO'));
 await page.reload({waitUntil:'commit',timeout:8000});
 await page.locator('.landing').waitFor({state:'visible',timeout:8000});
 const locale=await page.evaluate(()=>({stored:localStorage.getItem('dos-language'),lang:document.documentElement.lang}));
 check('Spanish selection survives refresh',locale.stored==='es'&&locale.lang==='es-DO',JSON.stringify(locale));
 const es=['Mientras hacía esto, no dejaba de pensar en qué cara pondrías al verlo.','Quería jugar contigo al dominó, que juegas tanto con tu familia, y pensé que los otros juegos también serían divertidos para nosotros dos.','Me encantaría estar a tu lado, pero ojalá podamos divertirnos así mientras estamos lejos.','Si algo todavía necesita mejorar, lo iremos arreglando mientras jugamos.','Te amo, mami.'];
 const letter=await page.locator('#moment-letter-copy p').allTextContents();check('Spanish original letter has five unchanged paragraphs',JSON.stringify(letter)===JSON.stringify(es),JSON.stringify(letter));
 await page.goto('http://127.0.0.1:5201/feedback',{waitUntil:'commit',timeout:8000});
 await page.locator('.feedback-route').waitFor({state:'visible',timeout:8000});
 const fb={path:new URL(page.url()).pathname,stored:await page.evaluate(()=>localStorage.getItem('dos-language')),lang:await page.locator('html').getAttribute('lang'),heading:await page.locator('.feedback-route h1').innerText()};
 check('feedback route keeps Spanish',fb.path==='/feedback'&&fb.stored==='es'&&fb.lang==='es-DO'&&fb.heading.includes('Mami'),JSON.stringify(fb));
 await context.close();
}catch(e){errors.push(String(e));check('remainder completed',false,String(e));}
finally{await browser.close();await fs.writeFile(out,JSON.stringify({base:'http://127.0.0.1:5201/',viewport:{width:1440,height:900,deviceScaleFactor:.5},checks,errors},null,2));console.log(JSON.stringify({checkCount:checks.length,pass:checks.filter(x=>x.pass).length,fail:checks.filter(x=>!x.pass).length,errors},null,2));}

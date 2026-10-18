import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[];const sourceChecks=[];
try {
  for(const language of ['ko','es']) {
    const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',isMobile:true,hasTouch:true});
    await context.addInitScript(l=>localStorage.setItem('dos-language',l),language);
    const page=await context.newPage();
    await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:4179');
    await page.waitForFunction(()=>document.querySelector('main')?.dataset.sceneReady==='true');
    const letter=page.locator('#moment-letter-copy');
    const originalAccessible=(await letter.getAttribute('hidden'))===null&&(await letter.ariaSnapshot()).includes('Baby, surprise!')&&(await letter.locator('p').count())===7;
    assert.ok(originalAccessible,'Original letter remains accessible before decorative opening');
    assert.equal(await page.locator('#intro .primary-button').getAttribute('href'),'/#games');
    sourceChecks.push({language,initialOriginalAccessible:originalAccessible,earlyGameLink:true});
    await page.screenshot({path:`output/playwright/stage-review/intro-${language}-390.png`});
    for(const [selector,stage] of [['#distance','story'],['.play-table','play'],['#papi-letter','letter'],['.ending','ending']]) {
      if(stage==='letter') await page.getByRole('link',{name:language==='ko'?'편지 읽기':'Leer la carta',exact:true}).first().click();
      else await page.locator(selector).evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY));
      await page.waitForTimeout(180);
      const result=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,stage:document.querySelector('main').dataset.stage,worldTop:document.querySelector('.world').getBoundingClientRect().top,viewportHeight:innerHeight}));
      checks.push({language,requestedStage:stage,...result});
      assert.equal(result.overflow,false);
      assert.ok(result.worldTop>result.viewportHeight*.49);
      if(stage==='ending') {
        const contrast=await page.evaluate(()=>{
          const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
          const ctx=canvas.getContext('2d');
          const luminance=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);};
          const a=luminance(getComputedStyle(document.querySelector('.ending h2')).color);
          const z=luminance(getComputedStyle(document.querySelector('main')).backgroundColor);
          return (Math.max(a,z)+.05)/(Math.min(a,z)+.05);
        });
        checks.at(-1).headingBackgroundContrast=contrast;
        assert.ok(contrast>=4.5,`Ending heading contrast: ${contrast}`);
        await page.screenshot({path:`output/playwright/stage-review/ending-${language}-390.png`});
      }
    }
    await page.getByRole('link',{name:language==='ko'?'편지 읽기':'Leer la carta',exact:true}).first().click();
    await page.locator('.letter-section-label button').click();
    await page.waitForFunction(()=>Number(document.querySelector('main').dataset.opening)<.02);
    assert.equal(await page.locator('#moment-letter-copy').getAttribute('hidden'),'');
    sourceChecks.at(-1).explicitCloseHidesOriginal=true;
    await context.close();
  }
} finally {
  await browser.close();
  await fs.writeFile('review/mobile-polish-report.json',JSON.stringify({checks,sourceChecks},null,2));
}
console.log(JSON.stringify({cases:checks.length,sourceCases:sourceChecks.length,overflowFailures:checks.filter(c=>c.overflow).length}));

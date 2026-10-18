import { chromium } from 'playwright';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const output='output/playwright/handoff-v3';await fs.mkdir(output,{recursive:true});const report={checks:[],poses:[],errors:[]};
const check=(name,pass,detail='')=>{report.checks.push({name,pass,detail});assert.ok(pass,`${name}: ${detail}`);};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}});page.on('pageerror',e=>report.errors.push(e.message));await page.goto('http://127.0.0.1:4179');await page.waitForFunction(()=>document.querySelector('main')?.dataset.sceneReady==='true');await page.evaluate(()=>document.fonts.ready);
 await page.getByRole('link',{name:'편지 읽기',exact:true}).first().click();
 for(const progress of [.705,.78,.85,.87]){
  await page.evaluate(progress=>{const anchors=[...document.querySelectorAll('[data-pose]')].map(e=>({y:e.getBoundingClientRect().top+scrollY-innerHeight*.18,p:Number(e.dataset.pose)}));for(let i=0;i<anchors.length-1;i++){const a=anchors[i],b=anchors[i+1];if(progress>=a.p&&progress<=b.p){scrollTo(0,a.y+(b.y-a.y)*(progress-a.p)/(b.p-a.p));break;}}},progress);
  await page.waitForFunction(p=>Math.abs(Number(document.querySelector('main').dataset.progress)-p)<.003,progress);await page.waitForTimeout(180);
  const state=await page.locator('#moment-letter-copy').evaluate(e=>{const bounds=e.getBoundingClientRect(),corners=JSON.parse(e.dataset.paperCorners||'null');let error=null;if(corners){const x=corners.map(p=>p.x),y=corners.map(p=>p.y);error=Math.max(Math.abs(bounds.left-Math.min(...x)),Math.abs(bounds.right-Math.max(...x)),Math.abs(bounds.top-Math.min(...y)),Math.abs(bounds.bottom-Math.max(...y)));}return{tracking:e.dataset.tracking==='true',error,bounds:{x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height},paperVisible:document.querySelector('.post-hero-scene').dataset.paperVisible,paragraphs:e.querySelectorAll('p').length,overflow:document.documentElement.scrollWidth>innerWidth};});
  report.poses.push({progress,...state});check(`${progress}: no overflow`,!state.overflow);
  if(progress<.86){check(`${progress}: DOM tracks paper`,state.tracking);check(`${progress}: projected bounds error under 2px`,state.error!==null&&state.error<2,`${state.error}`);check(`${progress}: duplicate mesh hidden`,state.paperVisible==='false');}
  else check('Reading endpoint releases projected layout',!state.tracking);
  await page.screenshot({path:`${output}/paper-${progress}.png`});
 }
 check('No browser exceptions',report.errors.length===0,report.errors.join('; '));
 await page.close();
}finally{await browser.close();await fs.writeFile(`${output}/report.json`,JSON.stringify(report,null,2));}
console.log(JSON.stringify({checks:report.checks.length,passed:report.checks.filter(c=>c.pass).length,errors:report.errors}));

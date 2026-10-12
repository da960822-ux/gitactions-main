import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {launchChromium} from './playwright-browser.mjs';

const base=process.env.HOME_UI_URL||'http://127.0.0.1:5233',out=process.env.HOME_QA_OUTPUT||'output/unified-space';
await fs.mkdir(out,{recursive:true});const browser=await launchChromium(),checks=[],errors=[],states=[];
try{
for(const viewport of [{width:1440,height:900},{width:1280,height:800}]){
 const page=await browser.newPage({viewport});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>{
  window.spacePrograms=[];window.spacePixels=[];
  const use=WebGL2RenderingContext.prototype.useProgram;WebGL2RenderingContext.prototype.useProgram=function(program){if(program&&this.canvas.closest('.rd-unified-space')&&!window.spacePrograms.some(item=>item.program===program))window.spacePrograms.push({gl:this,program});return use.call(this,program);};
  const raf=requestAnimationFrame;window.requestAnimationFrame=callback=>raf.call(window,time=>{callback(time);if(!window.inspectSpace)return;const canvas=document.querySelector('.rd-unified-space canvas');if(!canvas?.dataset.portraitBounds)return;const gl=canvas.getContext('webgl2');if(gl.isContextLost())return;const b=JSON.parse(canvas.dataset.portraitBounds),centers=JSON.parse(canvas.dataset.heartCenters),w=canvas.clientWidth,h=canvas.clientHeight,pixel=(x,y)=>{const data=new Uint8Array(4);gl.readPixels(Math.round(x/w*canvas.width),Math.round((1-y/h)*canvas.height),1,1,gl.RGBA,gl.UNSIGNED_BYTE,data);return data[3];};if(pixel(centers[0].x,centers[0].y)<150)return;window.spacePixels.push({face:pixel(b.x+b.width*.36,b.y+b.height*.32),phone:pixel(b.x+b.width*.31,b.y+b.height*.49),hand:pixel(b.x+b.width*.35,b.y+b.height*.66),torso:pixel(b.x+b.width*.64,b.y+b.height*.58)});});
 });
 await page.goto(base);await page.locator('.rd-unified-space[data-ready=true]').waitFor({timeout:90000});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);
 assert.equal(await page.locator('.rd-page canvas').count(),1);
 const programs=await page.evaluate(()=>window.spacePrograms.filter(item=>item.gl.getUniformLocation(item.program,'spaceRects[0]')).length);assert.ok(programs>=5,'Subject shaders must compile the actual text safety masks');
 await page.evaluate(()=>window.inspectSpace=true);
 for(const top of [0,110,220,330,440,560,680]){
  await page.evaluate(top=>scrollTo({top,behavior:'instant'}),top);await page.waitForTimeout(750);
  const state=await page.locator('.rd-hero').evaluate(hero=>{const canvas=hero.querySelector('canvas');return{scroll:scrollY,pinTop:hero.querySelector('.rd-hero-pin').getBoundingClientRect().top,progress:Number(canvas.dataset.progress),camera:JSON.parse(canvas.dataset.camera),portrait:JSON.parse(canvas.dataset.portraitBounds),hearts:JSON.parse(canvas.dataset.heartScreenBounds),caps:JSON.parse(canvas.dataset.heartPixelCaps),fixedLight:JSON.parse(canvas.dataset.fixedKeyLight),rects:JSON.parse(canvas.dataset.textSafeRects)};});
  assert.deepEqual(state.fixedLight,[-4,6,8]);
  for(const heart of state.hearts){assert.ok(Math.max(heart.width,heart.height)<=115,`Heart bound ${JSON.stringify(heart)} at ${top}px exceeds cap`);const p=state.portrait,overlap=heart.x<p.x+p.width&&heart.x+heart.width>p.x&&heart.y<p.y+p.height&&heart.y+heart.height>p.y;assert.equal(overlap,false,'No heart over the portrait, phone or hands');}
  assert.equal(state.rects.length,12);if(top===440){assert.ok(state.portrait.width<viewport.width*.36);assert.ok(state.camera[2]<10);assert.ok(Math.abs(state.pinTop)<1);}
  states.push({viewport,state});if([0,440,680].includes(top))await page.screenshot({path:path.join(out,`space-${viewport.width}-${top}.png`)});
 }
 await page.evaluate(()=>window.inspectSpace=false);const pixels=await page.evaluate(()=>window.spacePixels);assert.ok(pixels.length>5,'Framebuffer readings must include live, opaque foreground heart pixels');assert.ok(pixels.every(sample=>Object.values(sample).every(alpha=>alpha===0)),'Actual framebuffer must be transparent over the solid face, phone, hand and torso pixels');
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(800);
 const center=await page.locator('.rd-unified-space canvas').evaluate(c=>JSON.parse(c.dataset.heartCenters)[0]);const pin=await page.locator('.rd-hero-pin').boundingBox();await page.mouse.move(center.x+pin.x,center.y+pin.y);await page.waitForTimeout(500);assert.ok(await page.locator('.rd-unified-space canvas').evaluate(c=>Math.hypot(...JSON.parse(c.dataset.repulsions)[0]))>4);
 await page.mouse.move(500,35);await page.waitForTimeout(1200);assert.ok(await page.locator('.rd-unified-space canvas').evaluate(c=>JSON.parse(c.dataset.repulsions).every(p=>Math.hypot(...p)<.2)));
 await page.locator('.rd-hero-floor button[aria-pressed]').click();const frozen=await page.locator('.rd-unified-space canvas').getAttribute('data-render-count');await page.waitForTimeout(300);assert.equal(await page.locator('.rd-unified-space canvas').getAttribute('data-render-count'),frozen);await page.locator('.rd-hero-floor button[aria-pressed]').click();
 for(const language of ['KO','ES']){
  await page.getByRole('button',{name:language,exact:true}).click();await page.locator('.rd-nav nav>button').nth(1).click();await page.waitForTimeout(2200);
  const readable=await page.evaluate(()=>[...document.querySelectorAll('.rd-letter-text p,.rd-paper-signature')].every(node=>{const range=document.createRange();range.selectNodeContents(node);return[...range.getClientRects()].every(r=>document.elementFromPoint((r.left+r.right)/2,r.bottom-2)?.closest('.rd-paper'));}));assert.equal(readable,true);assert.ok((await page.locator('.rd-letter-section>header>p').innerText()).includes(language==='KO'?'천천히 읽어줘':'Lee con calma'));await page.screenshot({path:path.join(out,`letter-${viewport.width}-${language}.png`)});await page.locator('.rd-letter-close').press('Escape');
 }
 await page.locator('#gift-games').scrollIntoViewIfNeeded();await page.waitForTimeout(200);assert.ok(await page.locator('.rd-page canvas').count()<=1);assert.equal(await page.locator('.rd-game-choices button').count(),8);assert.equal(await page.locator('.rd-page a[href="/feedback"]').count(),1);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.locator('.rd-unified-space[data-ready=true]').waitFor();await page.evaluate(()=>document.querySelector('.rd-unified-space canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());await page.locator('.rd-raster-scene[data-ready=true]').waitFor();assert.equal(await page.locator('.rd-hero canvas').count(),0);await page.screenshot({path:path.join(out,`context-loss-${viewport.width}.png`)});
 checks.push(`${viewport.width}×${viewport.height}: continuous pinned-camera transition; capped and routed hearts; compiled glyph/head masks; live framebuffer face/phone/hand/torso protection; pointer return; pause; KO/ES final letter; original eight choices; context-loss fallback`);await page.close();
}
for(const mode of ['reduced','no-webgl']){
 const page=await browser.newPage({viewport:{width:1440,height:900},...(mode==='reduced'?{reducedMotion:'reduce'}:{})});page.on('pageerror',e=>errors.push(e.message));if(mode==='no-webgl')await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:get.call(this,type,...args);};});await page.goto(base);await page.locator('.rd-raster-scene[data-ready=true]').waitFor();assert.equal(await page.locator('.rd-page canvas').count(),0);assert.equal(await page.locator('.rd-game-choices button').count(),8);await page.screenshot({path:path.join(out,mode+'.png')});await page.close();checks.push(`${mode}: complete ordered original image fallback and eight links without a visible canvas`);
}
assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'unified-space-qa.json'),JSON.stringify({pass:true,checks,states,errors,note:'Production desktop visual and framebuffer checks on software GPU. No game actions or physical-GPU FPS claim.'},null,2));console.log(`PASS ${checks.length} unified-space groups`);
}finally{await browser.close();}

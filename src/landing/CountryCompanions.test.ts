import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import {cubicBezier,spring} from 'motion';
import sharp from 'sharp';
import {CountryCompanions,Companion,companionBodyMotion,companionBodyPose,companionWingPose,companionTailRotation,companionEncounterPose,companionEncounterAnchor,monitorCompanionArt} from '../../post-hero-preview/src/CountryCompanions';

const ease=cubicBezier(.23,1,.32,1);
const rotate=(x:number,y:number,degrees:number)=>{const angle=degrees*Math.PI/180;return{x:x*Math.cos(angle)-y*Math.sin(angle),y:x*Math.sin(angle)+y*Math.cos(angle)};};

describe('grounded companion greeting',()=>{
 it('keeps one monotonically paced flight with a readable bounded arc at different distances',()=>{
  for(const shift of [0,48,152,240,600]){
   let previous=companionBodyPose(0,shift,-1);
   for(let frame=1;frame<=1000;frame++){
    const pose=companionBodyPose(ease(frame/1000),shift,-1);
    expect(pose.x).toBeLessThanOrEqual(previous.x);expect(pose.x).toBeGreaterThanOrEqual(-shift);
    if(shift>0&&frame>5&&frame<995)expect(previous.x-pose.x).toBeGreaterThan(0);
    expect(pose.y).toBeGreaterThanOrEqual(-78);expect(pose.y).toBeLessThanOrEqual(0);expect(Math.abs(pose.rotation)).toBeLessThanOrEqual(11);
    previous=pose;
   }
   expect(previous.x).toBe(-shift);expect(previous.y).toBe(-0);expect(previous.rotation).toBeCloseTo(-1.8);
  }
 });
 it('keeps the duck at the foot plane and gives a readable bow after the approaching bird draws closer',()=>{
  for(let frame=0;frame<=100;frame++){
   const pose=companionBodyPose(frame/100,240,1);
   expect(pose.x).toBe(0);expect(pose.y).toBe(0);expect(pose.rotation).toBeGreaterThanOrEqual(0);expect(pose.rotation).toBeLessThanOrEqual(4.7);
   if(frame<=40)expect(pose.rotation).toBe(0);
   const contact=rotate((812-1254*.65),(1204-1254*.96),pose.rotation);
   expect(Math.abs(contact.y-(1204-1254*.96))).toBeLessThan(.3);
  }
  expect(companionBodyPose(.72,240,1).rotation).toBeGreaterThan(companionBodyPose(1,240,1).rotation);
 });
 it('uses the same damped mass for approach and return, including interruption from a moving state',()=>{
  const forward=companionBodyMotion('greet',true,false),back=companionBodyMotion('return',false,false);
  expect(forward.target).toBe(1);expect(back.target).toBe(0);expect(back.transition).toEqual(forward.transition);
  for(const current of [.001,.24,.63,.99])for(const target of [0,1]){
   const movement=spring({keyframes:[current,target],...forward.transition});
   let previous=companionBodyPose(current,240,-1);
   for(let ms=0;ms<=1500;ms+=10){
    const pose=companionBodyPose(movement.next(ms).value,240,-1);
    if(ms===0){expect(pose.x).toBeCloseTo(previous.x,10);expect(pose.y).toBeCloseTo(previous.y,10);expect(pose.rotation).toBeCloseTo(previous.rotation,10);}
    if(target===0)expect(pose.x).toBeGreaterThanOrEqual(previous.x-1e-9);else expect(pose.x).toBeLessThanOrEqual(previous.x+1e-9);
    expect(pose.x).toBeGreaterThanOrEqual(-240);expect(pose.x).toBeLessThanOrEqual(0);previous=pose;
   }
  }
  const approach=spring({keyframes:[0,1],...forward.transition});
  const current=approach.next(180).value,velocity=(approach.next(181).value-current)*1000;
  const reversal=spring({keyframes:[current,0],velocity,...back.transition});
  expect(companionBodyPose(reversal.next(0).value,240,-1).x).toBeCloseTo(companionBodyPose(current,240,-1).x,10);
  expect(Math.abs(reversal.next(1).value-current)).toBeLessThan(.004);
  const halfwayHome=spring({keyframes:[1,0],...back.transition}).next(100).value;
  expect(halfwayHome).toBeGreaterThan(.7);
  for(const reduced of [false,true])expect(companionBodyMotion('instant',true,reduced)).toMatchObject({target:1,transition:{duration:0}});
  expect(companionBodyMotion('greet',true,true).transition).toEqual({duration:0});
 });
 it('keeps the entire posed bird rectangles inside the desktop section',()=>{
  for(const [width,height] of [[1440,900],[1920,1080]]){
   const duck={left:width*.38,top:height-height*.16-width*.27,size:width*.27,ox:.65,oy:.96,side:1 as const};
   const hummingbird={left:width*.75,top:height-height*.20-width*.22,size:width*.22,ox:.53,oy:.43,side:-1 as const};
   const travel=hummingbird.left+hummingbird.size*.044-duck.left-duck.size*.91-42;
   for(const bird of [duck,hummingbird])for(let frame=0;frame<=100;frame++){
    const pose=companionBodyPose(frame/100,travel,bird.side);
    for(const [x,y] of [[0,0],[1,0],[1,1],[0,1]]){
     const point=rotate((x-bird.ox)*bird.size,(y-bird.oy)*bird.size,pose.rotation),px=bird.left+bird.ox*bird.size+point.x+pose.x,py=bird.top+bird.oy*bird.size+point.y+pose.y;
     expect(px).toBeGreaterThanOrEqual(0);expect(px).toBeLessThanOrEqual(width);expect(py).toBeGreaterThanOrEqual(0);expect(py).toBeLessThanOrEqual(height);
    }
   }
  }
 });
 it('blooms the encounter heart on arrival, ends its celebration, and can hide without resetting the bird pose',()=>{
  for(const progress of [0,.4,.82])expect(companionEncounterPose(progress)).toEqual(companionEncounterPose(0));
  const arrival=companionEncounterPose(.91),held=companionEncounterPose(1);
  expect(arrival.fill).toBeGreaterThan(.16);expect(arrival.fill).toBeLessThan(1);expect(arrival.burst).toBeGreaterThan(.9);
  expect(held).toEqual({opacity:1,scale:1,draw:1,fill:1,burst:0});
  const hidden=companionEncounterPose(.91,0);
  expect(hidden.opacity).toBe(0);expect(hidden.scale).toBe(arrival.scale);expect(hidden.fill).toBe(arrival.fill);
  for(const [width,height,billX,billY,copyBottom] of [[1440,900,900,528,335],[1920,1080,1200,600,380]]){
   const anchor=companionEncounterAnchor(billX,billY,width,height);
   // The full heart occupies y[-42,43]; its point clears the encounter bills and its lobes clear the copy.
   expect(anchor.y+43).toBeLessThan(billY-60);expect(anchor.y-42).toBeGreaterThan(copyBottom+20);
   expect(anchor.x-70).toBeGreaterThan(0);expect(anchor.x+70).toBeLessThan(width);
  }
  const markup=renderToStaticMarkup(createElement(CountryCompanions,{language:'ko'}));
  expect(markup).toMatch(/data-companion-heart-body="true"[^>]*fill="url\(/);
  const trails=markup.match(/class="companion-light-trails"[^>]*>(.*?)<\/g>/)![1];
  expect((trails.match(/<path /g)||[])).toHaveLength(2);
  const sparks=markup.match(/class="companion-sparks"[^>]*>(.*?)<\/g>/)![1];
  expect((sparks.match(/<path /g)||[])).toHaveLength(4);
 });
 it('renders feather-root overlap within a depth-separated, body-relative wing rig',()=>{
  const markup=renderToStaticMarkup(createElement(CountryCompanions,{language:'ko'}));
  const rig=markup.slice(markup.indexOf('class="hummingbird-rig"'));
  expect(rig.indexOf('hummingbird-wing-far')).toBeLessThan(rig.indexOf('hummingbird-torso.png'));
  expect(rig.indexOf('hummingbird-torso.png')).toBeLessThan(rig.indexOf('hummingbird-wing-near'));
  expect(rig).toContain('transform="translate(635 490)" data-shoulder="far"');
  expect(rig).toContain('transform="translate(675 525)" data-shoulder="near"');
  expect(rig).toContain('gradientUnits="userSpaceOnUse" cx="160" cy="950" r="170"');
  expect((rig.match(/mask="url\(/g)||[])).toHaveLength(2);
  expect(markup.indexOf('companion-contact')).toBeLessThan(markup.indexOf('mandarin-duck.png'));
 });
 it('keeps full feather fans through one finite following stroke and settles at either endpoint',()=>{
  const rest=companionWingPose(0),held=companionWingPose(1);
  expect(held.rotation).toBeCloseTo(rest.rotation);expect(held.scaleY).toBeCloseTo(rest.scaleY);
  expect(companionWingPose(.3).rotation).toBeGreaterThan(40);
  expect(companionWingPose(.75).rotation).toBeLessThan(-55);
  for(const far of [false,true])for(let frame=0;frame<=200;frame++){
   const pose=companionWingPose(frame/200,far);
   expect(pose.scaleY).toBeGreaterThanOrEqual(.82);expect(pose.scaleY).toBeLessThanOrEqual(1);
   expect(pose.scaleX).toBeGreaterThanOrEqual(.84);
  }
  expect(companionWingPose(.3,true)).not.toEqual(companionWingPose(.3,false));
  const markup=renderToStaticMarkup(createElement(Companion,{side:-1,together:false,phase:'greet',shift:240,reduced:false,interactive:true,failed:false,language:'ko',descriptionId:'bird-meaning',onGreet:()=>{},onError:()=>{}}));
  const nearStyle=markup.match(/class="hummingbird-wing hummingbird-wing-near" style="([^"]+)"/)![1];
  expect(nearStyle).toContain(`transform:rotate(${rest.rotation}deg) scale(${rest.scaleX},${rest.scaleY})`);
  expect(nearStyle).toMatch(/transform-origin:0% 0%(?: 0(?:px)?)?(?:;|$)/);expect(nearStyle).toContain('transform-box:view-box');
  expect(markup).not.toContain('transform-box:fill-box');expect(markup).not.toContain('transform-origin:50% 50%');
  const lead=spring({keyframes:[0,1],mass:1,stiffness:100,damping:20}).next(150).value;
  const delayed=spring({keyframes:[0,lead],mass:1,stiffness:100,damping:20}).next(50).value;
  expect(companionBodyPose(lead,240,-1).x).toBeLessThan(companionBodyPose(delayed,240,-1).x);
 });
 it('uses the clean registered torso and separate tail while retaining the approved head pixels',async()=>{
  const markup=renderToStaticMarkup(createElement(CountryCompanions,{language:'ko'}));
  expect(markup).toContain('hummingbird-torso.png');expect(markup).toContain('hummingbird-tail.png');
  expect(markup).toContain('hummingbird-near.png');expect(markup).toContain('hummingbird-far.png');
  expect(markup).not.toContain('hummingbird-body.png');expect(markup).not.toContain('hummingbird-wing.png');
  expect(markup.indexOf('hummingbird-tail.png')).toBeLessThan(markup.indexOf('hummingbird-torso.png'));
  expect(markup).toContain('transform="translate(830 770)" data-joint="hip"');
  const head=async(name:string)=>sharp(readFileSync(new URL('../../public/images/story-companions/'+name+'.png',import.meta.url))).extract({left:0,top:0,width:1254,height:400}).raw().toBuffer();
  const [original,repaired]=await Promise.all([head('hummingbird-body'),head('hummingbird-torso')]);
  let changed=0;
  for(let offset=0;offset<original.length;offset+=4){
   if(original[offset+3]!==repaired[offset+3])changed++;
   if(original[offset+3]>0)for(let channel=0;channel<3;channel++)if(original[offset+channel]!==repaired[offset+channel])changed++;
  }
  expect(changed).toBe(0);
 });
 it('counterbalances the body bank and lets the separate tail trail through a reversal',()=>{
  for(let frame=1;frame<=100;frame++){
   const q=frame/100,bank=companionBodyPose(q,240,-1).rotation,tail=companionTailRotation(q);
   expect(bank).toBeLessThan(0);expect(tail).toBeGreaterThan(0);expect(Math.abs(bank+tail)).toBeLessThan(Math.abs(bank));
  }
  expect(companionTailRotation(0)).toBe(0);
  expect(companionTailRotation(.5,.3)).toBeGreaterThan(companionTailRotation(.5,.5));
  expect(companionTailRotation(.5,.7)).toBeLessThan(companionTailRotation(.5,.5));
  expect(companionTailRotation(.5,.5+1e-6)).toBeCloseTo(companionTailRotation(.5,.5),4);
 });
 it('detects a native near-wing request error and stops delivery after cleanup without requesting fallback art',()=>{
  const requests:NativeImage[]=[];
  class NativeImage{src='';onerror:(()=>void)|null=null;constructor(){requests.push(this);}}
  vi.stubGlobal('Image',NativeImage);
  try{
   let failed=false,errors=0;
   const cleanup=monitorCompanionArt(()=>{failed=true;errors++;});
   const near=requests.find(image=>image.src.endsWith('/hummingbird-near.png'))!;
   expect(near).toBeDefined();expect(requests).toHaveLength(5);
   expect(requests.some(image=>image.src.endsWith('/hummingbird-body.png'))).toBe(false);
   const delayedError=near.onerror!;near.onerror!();
   const markup=renderToStaticMarkup(createElement(Companion,{side:-1,together:true,phase:'greet',shift:240,reduced:false,interactive:true,failed,language:'ko',descriptionId:'bird-meaning',onGreet:()=>{},onError:()=>{}}));
   expect(markup).toContain('hummingbird-body.png');expect(markup).toContain('disabled=""');
   expect(markup).not.toContain('hummingbird-rig');expect(markup).toContain('aria-describedby="bird-meaning"');
   cleanup();delayedError();
   expect(errors).toBe(1);expect(requests.every(image=>image.onerror===null)).toBe(true);
  }finally{vi.unstubAllGlobals();}
 });
 it('replaces a failed layered bird with the intact static original and disables the actual greeting buttons',()=>{
  for(const side of [1,-1] as const){
   const markup=renderToStaticMarkup(createElement(Companion,{side,together:true,phase:'greet',shift:240,reduced:false,interactive:true,failed:true,language:'ko',descriptionId:'bird-meaning',onGreet:()=>{},onError:()=>{}}));
   expect(markup).toContain('disabled=""');expect(markup).toContain('tabindex="-1"');
   expect(markup).toContain('aria-describedby="bird-meaning"');expect(markup).toContain('aria-pressed="false"');
   expect(markup).toContain('style="transform:none"');expect(markup).not.toContain('aria-hidden="true" tabindex');
   expect(markup).toContain(side===1?'mandarin-duck.png':'hummingbird-body.png');
   for(const part of ['hummingbird-rig','hummingbird-torso.png','hummingbird-tail.png','hummingbird-near.png','hummingbird-far.png'])expect(markup).not.toContain(part);
  }

 });
 it('keeps the two real bird buttons and their bilingual labels and descriptions',()=>{
  for(const language of ['ko','es'] as const){
   const markup=renderToStaticMarkup(createElement(CountryCompanions,{language}));
   expect((markup.match(/class="lovebird"/g)||[])).toHaveLength(2);
   expect((markup.match(/type="button"/g)||[])).toHaveLength(3);
   expect(markup).toContain('data-flight-state="idle"');
   expect(markup).toContain(language==='ko'?'Baby의 분홍 벌새에게 인사하기':'Saludar al colibrí rosado de Baby');
   expect(markup).toContain(language==='ko'?'한국 혼례에서 원앙은':'En las bodas coreanas');
  }

 });
});

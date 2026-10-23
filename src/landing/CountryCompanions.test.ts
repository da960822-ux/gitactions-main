import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import {cubicBezier} from 'motion';
import sharp from 'sharp';
import {CountryCompanions,Companion,companionBodyMotion,companionBodyPose,companionTailRotation} from '../../post-hero-preview/src/CountryCompanions';

const ease=cubicBezier(.23,1,.32,1);
const rotate=(x:number,y:number,degrees:number)=>{const angle=degrees*Math.PI/180;return{x:x*Math.cos(angle)-y*Math.sin(angle),y:x*Math.sin(angle)+y*Math.cos(angle)};};

describe('grounded companion greeting',()=>{
 it('keeps one monotonically paced flight with a bounded shallow arc at different distances',()=>{
  for(const shift of [0,48,152,240,600]){
   let previous=companionBodyPose(0,shift,-1);
   for(let frame=1;frame<=1000;frame++){
    const pose=companionBodyPose(ease(frame/1000),shift,-1);
    expect(pose.x).toBeLessThanOrEqual(previous.x);expect(pose.x).toBeGreaterThanOrEqual(-shift);
    if(shift>0&&frame>5&&frame<995)expect(previous.x-pose.x).toBeGreaterThan(0);
    expect(pose.y).toBeGreaterThanOrEqual(-24);expect(pose.y).toBeLessThanOrEqual(0);expect(Math.abs(pose.rotation)).toBeLessThanOrEqual(3);
    previous=pose;
   }
   expect(previous).toEqual({x:-shift,y:-0,rotation:0});
  }
 });
 it('keeps the duck at the foot plane and answers after the approaching bird crosses halfway',()=>{
  for(let frame=0;frame<=100;frame++){
   const pose=companionBodyPose(frame/100,240,1);
   expect(pose.x).toBe(0);expect(pose.y).toBe(0);expect(pose.rotation).toBeGreaterThanOrEqual(0);expect(pose.rotation).toBeLessThanOrEqual(1);
   if(frame<=55)expect(pose.rotation).toBe(0);
   const contact=rotate((812-1254*.65),(1204-1254*.96),pose.rotation);
   expect(Math.abs(contact.y-(1204-1254*.96))).toBeLessThan(.1);
  }
  expect(companionBodyPose(.85,240,1).rotation).toBeGreaterThan(companionBodyPose(1,240,1).rotation);
 });
 it('retargets either direction from the existing progress without a position jump or overshoot',()=>{
  for(const current of [.001,.24,.63,.99])for(const target of [0,1]){
   const start=companionBodyPose(current,240,-1);let previous=start;
   for(let frame=0;frame<=200;frame++){
    const q=current+(target-current)*ease(frame/200),pose=companionBodyPose(q,240,-1);
    if(frame===0)expect(pose).toEqual(start);
    if(target===0)expect(pose.x).toBeGreaterThanOrEqual(previous.x);else expect(pose.x).toBeLessThanOrEqual(previous.x);
    expect(q).toBeGreaterThanOrEqual(0);expect(q).toBeLessThanOrEqual(1);previous=pose;
   }
  }
  expect(companionBodyMotion('return',true,false)).toMatchObject({target:0,transition:{duration:.22}});
  expect(companionBodyMotion('greet',false,false)).toEqual({target:0,transition:{duration:.22,ease:[.23,1,.32,1]}});
  expect(companionBodyMotion('greet',true,false)).toMatchObject({target:1,transition:{duration:.9}});
  for(const reduced of [false,true])expect(companionBodyMotion('instant',true,reduced)).toMatchObject({target:1,transition:{duration:0}});
  expect(companionBodyMotion('greet',true,true).transition.duration).toBe(0);
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
 it('projects a readable downstroke and an edge-on recovery while both shoulder roots stay fixed',()=>{
  const css=readFileSync(new URL('../../post-hero-preview/src/country-companions.css',import.meta.url),'utf8');
  const profiles=['near','far'].map(name=>{
   const rule=css.match(new RegExp('@keyframes companion-wing-'+name+'\\{([\\s\\S]+?)\\n\\}'))![1];
   return [...rule.matchAll(/rotate\((-?[\d.]+)deg\) scale\(([\d.]+),([\d.]+)\)/g)].map(match=>({rotation:Number(match[1]),x:Number(match[2]),y:Number(match[3])}));
  });
  expect(profiles[0]).not.toEqual(profiles[1]);
  for(const [index,profile] of profiles.entries()){
   expect(profile).toHaveLength(4);
   const tip=(stroke:typeof profile[number])=>rotate((1150-250)*stroke.x,(150-950)*stroke.y,stroke.rotation);
   expect(tip(profile[0]).y).toBeLessThan(0);expect(tip(profile[2]).y).toBeGreaterThan(0);
   expect(profile[1].y).toBeLessThan(profile[0].y*.3);
   for(const stroke of profile)expect(rotate(0*stroke.x,0*stroke.y,stroke.rotation)).toEqual({x:0,y:0});
   expect(css).toContain(index?'animation-name:companion-wing-far':'animation:companion-wing-near 360ms');
  }
  expect(css).toContain('animation:companion-hover 360ms');
  expect(css).toContain('[data-visible=false] .hummingbird-tail{animation-play-state:paused}');
  expect(css).toContain('[data-reduced=true] .hummingbird-tail{animation:none}');
  expect(css).not.toContain('animation-delay');
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
 it('counterbalances the actual separate tail during bank and at each hover cycle knot',()=>{
  for(let frame=1;frame<100;frame++){
   const q=frame/100,bank=companionBodyPose(q,240,-1).rotation,tail=companionTailRotation(q);
   expect(bank).toBeLessThan(0);expect(tail).toBeGreaterThan(0);expect(Math.abs(bank+tail)).toBeLessThan(Math.abs(bank));
  }
  expect(companionTailRotation(0)).toBe(0);expect(companionTailRotation(1)).toBeCloseTo(0);
  const css=readFileSync(new URL('../../post-hero-preview/src/country-companions.css',import.meta.url),'utf8');
  const rotations=(name:string)=>[...css.match(new RegExp('@keyframes '+name+'\\{([\\s\\S]+?)\\n\\}'))![1].matchAll(/rotate\((-?[\d.]+)deg\)/g)].map(match=>Number(match[1]));
  const torso=rotations('companion-hover'),tail=rotations('companion-tail');
  expect(tail).toHaveLength(torso.length);for(let index=0;index<tail.length;index++)expect(torso[index]+tail[index]).toBe(0);
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

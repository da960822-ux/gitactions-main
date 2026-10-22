import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import {cubicBezier} from 'motion';
import {CountryCompanions,companionBodyMotion,companionBodyPose} from '../../post-hero-preview/src/CountryCompanions';

const ease=cubicBezier(.77,0,.175,1);
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
 it('leaves the duck planted and limits its complete cutout to a two-degree lean',()=>{
  for(let frame=0;frame<=100;frame++){
   const pose=companionBodyPose(frame/100,240,1);
   expect(pose.x).toBe(0);expect(pose.y).toBe(0);expect(pose.rotation).toBeGreaterThanOrEqual(0);expect(pose.rotation).toBeLessThanOrEqual(2);
  }
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
  expect(companionBodyMotion('greet',true,false)).toMatchObject({target:1,transition:{duration:1.15}});
  for(const reduced of [false,true])expect(companionBodyMotion('instant',true,reduced)).toMatchObject({target:1,transition:{duration:0}});
  expect(companionBodyMotion('greet',true,true).transition.duration).toBe(0);
 });
 it('keeps the entire posed bird rectangles inside the desktop section',()=>{
  for(const [width,height] of [[1440,900],[1920,1080]]){
   const duck={left:width*.38,top:height-height*.16-width*.27,size:width*.27,ox:.62,oy:.9,side:1 as const};
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
 it('sweeps both actual CSS wings above and below fixed shoulder roots in the same phase',()=>{
  const css=readFileSync(new URL('../../post-hero-preview/src/country-companions.css',import.meta.url),'utf8');
  const profiles=['near','far'].map(name=>{
   const rule=css.match(new RegExp('@keyframes companion-wing-'+name+'\\{([^@]+?)\\n'))![1];
   return [...rule.matchAll(/rotate\((-?[\d.]+)deg\) scaleY\(([\d.]+)\)/g)].map(match=>({rotation:Number(match[1]),scaleY:Number(match[2])}));
  });
  expect(profiles[0]).toEqual(profiles[1]);expect(css).not.toContain('animation-delay');
  const markup=renderToStaticMarkup(createElement(CountryCompanions,{language:'ko'}));
  expect(markup.indexOf('hummingbird-wing-far')).toBeLessThan(markup.indexOf('hummingbird-body.png'));
  expect(markup.indexOf('hummingbird-body.png')).toBeLessThan(markup.indexOf('hummingbird-wing-near'));
  for(const [index,{rootX,rootY,scale}] of [{rootX:675,rootY:525,scale:.42},{rootX:635,rootY:490,scale:.34}].entries()){
   const [up,down]=profiles[index];
   const tip=(stroke:typeof up)=>rotate((1150-250)*scale,(150-950)*scale*stroke.scaleY,stroke.rotation);
   expect(tip(up).y).toBeLessThan(0);expect(tip(down).y).toBeGreaterThan(0);
   for(let frame=0;frame<=100;frame++){
    const q=frame<=50?frame/50:(100-frame)/50,rotation=up.rotation+(down.rotation-up.rotation)*q,scaleY=up.scaleY+(down.scaleY-up.scaleY)*q;
    expect(rotate(0,0,rotation)).toEqual({x:0,y:0});
    for(const [x,y] of [[0,0],[1254,0],[1254,1254],[0,1254]]){
     const point=rotate((x-250)*scale,(y-950)*scale*scaleY,rotation);
     expect(rootX+point.x).toBeGreaterThanOrEqual(0);expect(rootX+point.x).toBeLessThanOrEqual(1254);expect(rootY+point.y).toBeGreaterThanOrEqual(0);expect(rootY+point.y).toBeLessThanOrEqual(1254);
    }
   }
  }
 });
});

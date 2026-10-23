import {createElement,Fragment} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {CoupleReactionArt} from './CoupleReactionArt';
import {DuelIllustration,duelCameraPose} from '../landing/story/DuelIllustration';

it('keeps the exact full-room mask union for either presentation-only reaction',()=>{
 for(const reaction of ['lisbeth','yeonseok'] as const){
  const html=renderToStaticMarkup(createElement(CoupleReactionArt,{reaction,alt:'Conditional reaction'}));
  expect(html).toContain('viewBox="0 0 1672 941"');
  expect(html).toContain('/images/approved-couple-room/approved-couple-gaming-room.png');
  expect(html).toContain('/images/approved-couple-room/foreground-semantic-mask.png');
  expect(html).toContain(`/images/approved-couple-room/result-${reaction}-mask.png`);
  expect(html).toContain(`/images/approved-couple-room/result-${reaction}-wins.png`);
  expect(html).toContain('1 -1 -1 0 0');
  expect(html).toContain('1 0 0 0 0');
  expect(html).toContain('operator="dilate" radius="1"');
  expect(html).toContain('mask-type:alpha');
  expect(html.match(/<image /g)).toHaveLength(4);
 }
});

it('gives simultaneous artwork instances independent filter and mask identifiers',()=>{
 const html=renderToStaticMarkup(createElement(Fragment,null,createElement(CoupleReactionArt,{reaction:'lisbeth',alt:'First'}),createElement(CoupleReactionArt,{reaction:'yeonseok',alt:'Second'})));
 const ids=[...html.matchAll(/id="([^"]+)"/g)].map(match=>match[1]);
 expect(ids.length).toBe(8);
 expect(new Set(ids).size).toBe(ids.length);
});

it('presents imagined alternatives with a default choice and no actual result announcement',()=>{
 for(const [language,first,second] of [['ko','네가 이기면','내가 이기면'],['es','Si ganas tú','Si gano yo']] as const){
  const html=renderToStaticMarkup(createElement(DuelIllustration,{language}));
  expect(html).toContain('data-reaction="lisbeth"');
  expect(html).toContain(`aria-pressed="true">${first}`);
  expect(html).toContain(`aria-pressed="false">${second}`);
  expect(html.match(/data-active="true" aria-hidden="false"/g)).toHaveLength(1);
  expect(html.match(/data-active="false" aria-hidden="true"/g)).toHaveLength(1);
  expect(html).not.toContain('Ganó');
  expect(html).not.toContain('승!');
  expect(html).not.toContain('couple-result-moment');
  expect(html).toContain('data-ambient="false"');
  expect(html).toContain('/images/approved-couple-room/environment-chair-vacancy-only.png');
  expect(html).toContain('class="duel-illustration-depth-back"');expect(html).toContain('class="duel-illustration-depth-front"');
  expect(html).toContain('class="duel-illustration-desk"');expect(html).toContain('0 1 1 0 0');
  expect(html).toContain('class="duel-illustration-camera"');
  expect(html).toContain('class="duel-energy-flow"');expect(html).toContain('class="duel-energy-core"');
  expect(html).toContain('<g class="duel-energy-glow">');
  expect(html.indexOf('duel-illustration-energy')).toBeGreaterThan(html.indexOf('duel-illustration-reactions'));
  expect(html).toContain('effect-clearance');expect(html).toContain('<rect y="820" width="1672" height="121"');
  expect(html).not.toContain('class="duel-selection-streak"');
  expect(html).not.toContain('duel-illustration-room-light');expect(html).not.toContain('duel-illustration-celebration');
  expect(html.indexOf('duel-illustration-depth-back')).toBeLessThan(html.indexOf('duel-illustration-depth-front'));
 }
});

it('uses one bounded camera orbit for both depth planes and keeps portrait heads inside the fixed frame',()=>{
 expect(duelCameraPose(0,0,0,0,0)).toEqual({rotateX:0,rotateY:0,z:0});
 expect(duelCameraPose(0,0,0,0,1).rotateY).toBe(.5);expect(duelCameraPose(0,0,0,0,-1).rotateY).toBe(-.5);
 for(const width of [343,720,1100])for(const px of [-1,1])for(const py of [-1,1])for(const scroll of [-1,1])for(const orbit of [-1,1])for(const choice of [-1,1]){
  const height=width*941/1672,pose=duelCameraPose(px,py,scroll,orbit,choice),rx=pose.rotateX*Math.PI/180,ry=pose.rotateY*Math.PI/180;
  expect(Math.abs(pose.rotateX)).toBeLessThanOrEqual(1.65);expect(Math.abs(pose.rotateY)).toBeLessThanOrEqual(3.1);expect(Math.abs(pose.z)).toBeLessThanOrEqual(10);
  for(const x of [.17,.85])for(const y of [.1,.5]){
   const vx=(x-.5)*width*.94,vy=(y-.5)*height*.94,vz=60;
   const orbitX=vx*Math.cos(ry)+vz*Math.sin(ry),orbitZ=-vx*Math.sin(ry)+vz*Math.cos(ry);
   const orbitY=vy*Math.cos(rx)-orbitZ*Math.sin(rx),z=vy*Math.sin(rx)+orbitZ*Math.cos(rx)+pose.z;
   const screenX=width/2+orbitX*1000/(1000-z),screenY=height/2+orbitY*1000/(1000-z);
   expect(screenX).toBeGreaterThan(0);expect(screenX).toBeLessThan(width);expect(screenY).toBeGreaterThan(0);expect(screenY).toBeLessThan(height);
  }
 }
});

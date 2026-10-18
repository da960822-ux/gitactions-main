import {describe,it,expect} from 'vitest';
import {cameraPose,introPose,INTRO_SECONDS,surfaceWeights} from './pose';
describe('folded-world deterministic scene contract',()=>{
 it('passes beside the portrait instead of through its plane',()=>{
  for(const mobile of [false,true])for(let i=0;i<=1000;i++){
   const [x,,z]=cameraPose(i/1000,1,mobile).position;
   if(Math.abs(z-.05)<.3)expect(x).toBeLessThan(1.85-5.9/2-.15);
  }
 });
 it('opens the architectural passage fully before camera advancement',()=>{
  for(const mobile of[false,true])for(const p of[0,.08,.2,.43])expect(cameraPose(p,1,mobile)).toEqual(cameraPose(0,1,mobile));
  expect(surfaceWeights(.43)).toEqual({aperture:1,rail:0});expect(surfaceWeights(1)).toEqual({aperture:1,rail:1});
 });
 it('uses the exact stable pose at the exported final intro frame',()=>{
  expect(introPose(95/30).entrance).toBe(1);
  expect(cameraPose(0,introPose(95/30).entrance,false)).toEqual(cameraPose(0,1,false));
  expect(introPose(0).entrance).toBe(0);expect(introPose(INTRO_SECONDS).entrance).toBe(1);
 });
 it('crosses the actual z=-4 threshold and looks into a distinct next room',()=>{
  for(const mobile of [false,true]){
   const end=cameraPose(1,1,mobile);
   expect(end.position[2]).toBeLessThan(-4);expect(end.target[2]).toBeLessThan(end.position[2]);
   expect(cameraPose(0,1,mobile).position[2]).toBeGreaterThan(9);
  }
 });
 it('restores all forward sample poses exactly when evaluated in reverse',()=>{
  const samples=[0,.2,.45,.72,.95,1];const forward=samples.map(p=>cameraPose(p,1,false));
  for(const [i,p]of [...samples].reverse().entries())expect(cameraPose(p,1,false)).toEqual(forward[forward.length-1-i]);
 });
 it('keeps position and sightline continuous at every camera keyframe',()=>{
  for(const mobile of [false,true])for(const p of [.43,.5,.6,.65,.85]){
   const a=cameraPose(p-.00001,1,mobile),b=cameraPose(p+.00001,1,mobile);
   for(let i=0;i<3;i++){expect(Math.abs(a.position[i]-b.position[i])).toBeLessThan(.002);expect(Math.abs(a.target[i]-b.target[i])).toBeLessThan(.002);}
  }
 });
});

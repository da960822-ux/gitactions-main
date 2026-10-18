import {describe,expect,it} from 'vitest';
import {cameraPose,postConnectionPose} from './poseSpaceV19';
import {foldCosmicVertex,surfacePose,surfaceVertex} from './storySurfaceV19';
import {roomWorldVertex} from './approvedRoomGeometry';

describe('approved B connection',()=>{
 it('holds the approved opening camera through departure readiness',()=>{
  for(const entrance of[0,.5,1])for(const p of[0,.06,.1,.12]){
   const pose=cameraPose(p,entrance,false),opening=cameraPose(0,entrance,false);
   for(const key of['position','target'] as const)for(let i=0;i<3;i++)expect(pose[key][i]).toBeCloseTo(opening[key][i],12);
  }
 });
 it('arrives at the exact approved B camera and holds it',()=>{
  for(const p of[.72,.85,1]){
   expect(cameraPose(p,1,false).position).toEqual(roomWorldVertex(836,470.5,24));
   expect(cameraPose(p,1,false).target).toEqual([-6,.5,-10]);
  }
 });
 it('approaches the illustration without crossing it',()=>{
  let last=Infinity;
  for(let i=12;i<=1000;i++){
   const pose=cameraPose(i/1000,1,false);
   expect(pose.position.every(Number.isFinite)).toBe(true);
   if(i>=240)expect(pose.position[2]).toBeLessThanOrEqual(last+1e-8);
   expect(pose.position[2]).toBeGreaterThan(-.400001);
   expect(pose.position[0]).toBeGreaterThanOrEqual(-6.000001);
   last=pose.position[2];
  }
 });
 it('has continuous position and velocity at the preserved opener and path keys',()=>{
  const h=1e-6;
  for(const p of[.12,.24,.32,.40]){
   const left=cameraPose(p-h,1,false),center=cameraPose(p,1,false),right=cameraPose(p+h,1,false);
   for(const key of['position','target'] as const)for(let i=0;i<3;i++){
    expect(Math.abs(right[key][i]-left[key][i])).toBeLessThan(.001);
    expect(Math.abs((center[key][i]-left[key][i])/h-(right[key][i]-center[key][i])/h)).toBeLessThan(.02);
   }
  }
 });
 it('evaluates the same pose on reverse and a mid-flight reversal',()=>{
  const order=[.12,.24,.36,.5,.72,1,.72,.5,.36,.24,.36,.5,.72];
  const poses=new Map<number,ReturnType<typeof cameraPose>>();
  for(const p of order){const pose=cameraPose(p,1,false);if(poses.has(p))expect(pose).toEqual(poses.get(p));poses.set(p,pose);}
 });
 it('keeps exact room/post endpoints and a finite turn on reverse',()=>{
  const from={position:[-6,.5,-.4],target:[-6,.5,-10],fov:48},to={position:[-6,-2.1,-1],target:[-6.7,-2.75,6.4],fov:38};
  expect(postConnectionPose(0,from,to)).toEqual(from);expect(postConnectionPose(1,from,to)).toEqual(to);
  for(let i=0;i<=100;i++){const pose=postConnectionPose(i/100,from,to);expect(Math.hypot(...pose.position.map((n,j)=>n-pose.target[j]))).toBeGreaterThan(1);expect(pose.position.every(Number.isFinite)).toBe(true);expect(postConnectionPose(i/100,from,to)).toEqual(pose);}
 });
 it('folds one continuous sheet down without stretching across its center',()=>{
  for(const p of[0,.12,.18,.3,.44,.58,.72,1]){
   const a=surfaceVertex(.5-1e-6,.5,p),b=surfaceVertex(.5+1e-6,.5,p);
   expect(b[0]-a[0]).toBeCloseTo(48e-6,10);
   expect(Math.abs(b[1]-a[1])).toBeLessThan(.001);expect(Math.abs(b[2]-a[2])).toBeLessThan(.001);
   expect(foldCosmicVertex(2,-7,-7,7,surfacePose(p).open)).toEqual([2,-7,-4]);
  }
  expect(surfaceVertex(.5,1,1)[1]).toBeCloseTo(-7,10);
  expect(surfaceVertex(.5,1,1)[2]).toBeCloseTo(-18,10);
 });
});

import {describe,expect,it} from 'vitest';
import {cameraPose,postConnectionPose} from './poseSpaceV19';
import {apertureVertex,createStorySurface,surfacePose} from './storySurfaceV19';
import {roomWorldVertex} from './approvedRoomGeometry';
import {Scene} from 'three';
import {portraitDeparture} from './previewSpaceV19';

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
 it('retreats one unit into B without crossing the illustration',()=>{
  let last=-Infinity;
  for(let i=12;i<=1000;i++){
   const pose=cameraPose(i/1000,1,false);
   expect(pose.position.every(Number.isFinite)).toBe(true);
   expect(pose.position[2]).toBeGreaterThanOrEqual(last-1e-8);
   expect(pose.position[2]).toBeGreaterThanOrEqual(-1.400001);
   expect(pose.position[2]).toBeLessThanOrEqual(-.399999);
   expect(pose.position[0]).toBeCloseTo(-6,12);
   last=pose.position[2];
  }
 });
 it('has continuous position and velocity at the preserved opener and path keys',()=>{
  const h=1e-6;
  for(const p of[.12,.25,.32,.42]){
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
 it('retires the face-front portrait before exposing the room',()=>{
  expect(portraitDeparture(.1).z).toBeCloseTo(0,12);expect(portraitDeparture(.1).opacity).toBe(1);
  expect(portraitDeparture(.2)).toEqual({z:-1.4,opacity:0});
  for(const p of[.11,.14,.18,.2]){
   expect(portraitDeparture(p).opacity).toBeGreaterThanOrEqual(0);
   expect(portraitDeparture(p).opacity).toBeLessThanOrEqual(1);
  }
 });
 it('approaches a tall aperture while its outside edges remain beyond the frame',()=>{
  expect(surfacePose(.18).open).toBe(0);expect(surfacePose(.43).open).toBe(1);
  for(const angle of[0,.7,1.5,3.1,4.6]){
   const before=apertureVertex(angle,1,.18),after=apertureVertex(angle,1,.43);
   expect([before.x,before.y]).toEqual([after.x,after.y]);
   expect(Math.max(Math.abs(after.x),Math.abs(after.y))).toBeCloseTo(4,10);
   expect(after.z).toBeGreaterThan(14);
   expect(apertureVertex(angle,0,.3).z).toBeLessThan(apertureVertex(angle,1,.3).z);
  }
  const owned:{dispose:()=>void}[]=[],sheet=createStorySurface(new Scene(),resource=>{owned.push(resource);return resource;});sheet.setProjection(1920,1080,1);
  const geometry=sheet.mesh.geometry,position=geometry.getAttribute('position'),snapshots=new Map<number,number[]>();
  for(const p of[0,.12,.19,.25,.30,.35,.43,.72,.35,.25,.19,.25,.35,0]){
   sheet.update(p,1);expect(sheet.mesh.geometry).toBe(geometry);expect(sheet.mesh.visible).toBe(true);
   const values=Array.from(position.array);expect(values.every(Number.isFinite)).toBe(true);if(snapshots.has(p))expect(values).toEqual(snapshots.get(p));else snapshots.set(p,values);
  }
  owned.forEach(resource=>resource.dispose());
 });
});

import {describe,expect,it} from 'vitest';
import {cameraPose,postConnectionPose} from './poseSpaceV19';
import {createStorySurface} from './storySurfaceV19';
import {cosmicLayerPose,cosmicOwnership,createCosmicForeground} from './cosmicLayers';
import {roomWorldVertex} from './approvedRoomGeometry';
import {PerspectiveCamera,Scene,Vector3} from 'three';
import {ARCH_TRACE,RAIL_HOLES} from './cosmicOwnership';
import {portraitDeparture} from './previewSpaceV19';

describe('approved B connection',()=>{
 it('holds the approved opening camera through departure readiness',()=>{
  for(const entrance of[0,.5,1])for(const p of[0,.03,.06]){
   const pose=cameraPose(p,entrance,false),opening=cameraPose(0,entrance,false);
   for(const key of['position','target'] as const)for(let i=0;i<3;i++)expect(pose[key][i]).toBeCloseTo(opening[key][i],12);
  }
 });
 it('arrives at the exact approved B camera and holds it',()=>{
  for(const p of[.10,.14,.2,.72,.85,1]){
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
  for(const p of[.06,.1]){
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
  expect(portraitDeparture(.06).z).toBeCloseTo(0,12);expect(portraitDeparture(.06).opacity).toBe(1);
  expect(portraitDeparture(.10)).toEqual({z:-1.4,opacity:0});
  for(const p of[.06,.07,.08,.1]){
   expect(portraitDeparture(p).opacity).toBeGreaterThanOrEqual(0);
   expect(portraitDeparture(p).opacity).toBeLessThanOrEqual(1);
  }
 });
 it('keeps whole prop clusters rigid while only their owned structural join bends',()=>{
  const owned:{dispose:()=>void}[]=[],near=createCosmicForeground(new Scene(),resource=>{owned.push(resource);return resource;});
  const geometry=near.mesh.geometry,position=geometry.getAttribute('position'),uv=geometry.getAttribute('uv'),snapshots=new Map<number,number[]>();
  for(const p of[.12,.2,.28,.34,.42,.34,.2]){
   near.update(p,1920,1080);expect(near.mesh.geometry).toBe(geometry);
   const values=Array.from(position.array);expect(values.every(Number.isFinite)).toBe(true);
   const propDepths=[];for(let i=0;i<position.count;i++)if(cosmicOwnership(uv.getX(i)*1536)!=='structure')propDepths.push(position.getZ(i));
   expect(Math.max(...propDepths)-Math.min(...propDepths)).toBeLessThan(1e-6);
   if(snapshots.has(p))expect(values).toEqual(snapshots.get(p));else snapshots.set(p,values);
  }
  expect(cosmicLayerPose(0)).toMatchObject({separation:0,farOpacity:1,approach:0,room:0});
  expect(cosmicLayerPose(.44).approach).toBeLessThan(6.9);
  expect(cosmicLayerPose(.52)).toMatchObject({nearOpacity:0,farOpacity:0,room:1});
  near.update(.52,1920,1080);expect(near.mesh.visible).toBe(false);
  owned.forEach(resource=>resource.dispose());
 });
 it('retains a deformable far environment and restores it identically on reversal',()=>{
  const owned:{dispose:()=>void}[]=[],far=createStorySurface(new Scene(),resource=>{owned.push(resource);return resource;});far.setProjection(1920,1080,1);
  const geometry=far.mesh.geometry,snapshots=new Map<number,number[]>();
  for(const p of[0,.12,.19,.25,.3,.19,0]){
   far.update(p,1);expect(far.mesh.geometry).toBe(geometry);
   const values=Array.from(geometry.getAttribute('position').array);expect(values.every(Number.isFinite)).toBe(true);
   if(snapshots.has(p))expect(values).toEqual(snapshots.get(p));else snapshots.set(p,values);
   expect(far.mesh.visible).toBe(cosmicLayerPose(p).farOpacity>0);
  }
  owned.forEach(resource=>resource.dispose());
 });
 it('traces the source arch/capital and genuine rail openings without a broad far rectangle',()=>{
  const inside=(x:number,y:number,points:number[][])=>{let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
  expect(inside(420,400,ARCH_TRACE)).toBe(true);expect(inside(500,400,ARCH_TRACE)).toBe(false);
  expect(inside(447,184,ARCH_TRACE)).toBe(true);expect(inside(470,184,ARCH_TRACE)).toBe(false);
  expect(RAIL_HOLES.some(hole=>inside(870,775,hole))).toBe(true);
  expect(RAIL_HOLES.some(hole=>inside(930,775,hole))).toBe(false);
 });

 it.each([[1920,1080],[1440,900]])('registers the near layer before any rigid motion at %i×%i',(width,height)=>{
  const owned:{dispose:()=>void}[]=[],near=createCosmicForeground(new Scene(),resource=>{owned.push(resource);return resource;});
  const positions=near.mesh.geometry.getAttribute('position'),uv=near.mesh.geometry.getAttribute('uv');
  for(const p of[.081,.09,.10]){
   near.update(p,width,height);const pose=cameraPose(p,1,false),camera=new PerspectiveCamera(48,width/height,.1,400);
   camera.position.fromArray(pose.position);camera.position.z+=9.6*(Math.max(1,(1672/941)/(width/height))-1);camera.lookAt(...pose.target as[number,number,number]);camera.updateMatrixWorld();
   expect(cosmicLayerPose(p).approach).toBe(0);
   for(const index of[450,900,1800]){
    const point=new Vector3().fromBufferAttribute(positions,index).project(camera),u=uv.getX(index),v=uv.getY(index);
    expect(point.x).toBeCloseTo(u*2-1,5);expect(point.y).toBeCloseTo((v*2-1)/(1.5/(width/height)),5);
   }
  }
  expect(cosmicLayerPose(.10).separation).toBe(1);
  owned.forEach(resource=>resource.dispose());
 });

});

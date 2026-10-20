import {describe,expect,it} from 'vitest';
import {cosmicOpeningPose,deformInitialCosmicVertex,heroStageProjection} from './initialCosmicHero';
import {Scene,PerspectiveCamera,Vector3} from 'three';
import {createStorySurface} from './storySurfaceV19';
import {cameraPose,openingCameraPose} from './poseSpaceV19';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

describe('initial cosmic surface',()=>{
 it('leaves the existing departure and room trajectory untouched',()=>{
  for(const progress of [.12,.18,.5,1]){
   const point={x:2,y:3,z:-4};
   deformInitialCosmicVertex(point,.3,.7,cosmicOpeningPose(progress,.5,1,-1));
   expect(point).toEqual({x:2,y:3,z:-4});
  }
 });
 it('settles exactly to the original surface through a finite intermediate shape',()=>{
  const sample=(entrance:number)=>{
   const point={x:2,y:3,z:-4};
   deformInitialCosmicVertex(point,.3,.7,cosmicOpeningPose(0,entrance));
   return point;
  };
  expect(sample(0)).toEqual({x:2,y:3,z:-4});
  expect(sample(1)).toEqual({x:2,y:3,z:-4});
  expect(sample(.4).z).toBeGreaterThan(-4);
  expect(sample(.4).z).toBeLessThan(sample(.5).z);
 });
 it('keeps perimeter depth anchored and pointer flex bounded',()=>{
  for(const u of [0,.25,.5,.75,1])for(const v of [0,.25,.5,.75,1]){
   const point={x:u,y:v,z:-4};
   deformInitialCosmicVertex(point,u,v,cosmicOpeningPose(0,1,5,-5));
   expect(Math.abs(point.z+4)).toBeLessThanOrEqual(.4);
   if(u===0||u===1||v===0||v===1)expect(point.z).toBeCloseTo(-4,12);
  }
 });
 it('deforms the live indexed mesh and restores its original positions',()=>{
  const owned:{dispose:()=>void}[]=[];
  const surface=createStorySurface(new Scene(),resource=>{owned.push(resource);return resource;});
  surface.setProjection(1920,1080,1);
  surface.update(0,1);
  const positions=surface.mesh.geometry.getAttribute('position');
  const rest=Array.from(positions.array);
  surface.update(0,.5);
  expect(surface.mesh.geometry.getAttribute('position')).toBe(positions);
  expect(Array.from(positions.array)).not.toEqual(rest);
  surface.update(0,1);
  expect(Array.from(positions.array)).toEqual(rest);
  surface.update(.12,1);
  const departure=Array.from(positions.array);
  surface.update(.12,.5,1,-1);
  expect(Array.from(positions.array)).toEqual(departure);
  owned.forEach(resource=>resource.dispose());
 });
 it.each([[1920,1080],[1440,900]])('preserves the approved projection on the near-room stage at %i×%i',(width,height)=>{
  for(const entrance of[0,.5,1]){
   const oldPose=openingCameraPose(entrance),old=new PerspectiveCamera(38,width/height,.1,400);old.position.fromArray(oldPose.position);old.lookAt(...oldPose.target as[number,number,number]);old.updateMatrixWorld();
   const nearPose=cameraPose(0,1,false),near=new PerspectiveCamera(48,width/height,.1,400);near.position.fromArray(nearPose.position);near.position.z+=9.6*(Math.max(1,(1672/941)/(width/height))-1);near.lookAt(...nearPose.target as[number,number,number]);near.updateMatrixWorld();
   const stage=heroStageProjection(width,height,entrance);
   for(const point of[new Vector3(1.85,3.13,.05),new Vector3(-1.54,-3.07,.05),new Vector3(5.24,3.13,.05),new Vector3(-8,4,-4)]){
    const before=point.clone().project(old),after=point.clone().applyMatrix4(stage).project(near);
    expect(after.x).toBeCloseTo(before.x,10);expect(after.y).toBeCloseTo(before.y,10);
   }
  }
 });
 it('preserves every supplied face, outfit and headset pixel',()=>{
  const original=readFileSync(new URL('../../../../public/images/approved-couple-room/approved-character-reference.png',import.meta.url));
  expect(createHash('sha256').update(original).digest('hex')).toBe('ccabcdcc074d7f8840360c1cd5671a024d8c0336f6c7241e44cfb40e89b36f31');
 });
});

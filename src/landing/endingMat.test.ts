import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {createEndingMat} from './endingMat';
import {endingLetterView} from './endingLetterView';

describe('ending stationery support without rejected geographic props',()=>{
 it('supports the original letter and keeps every finite corner inside both desktop artifact areas',()=>{
  const rig=createEndingMat();rig.update(1);rig.root.updateMatrixWorld(true);
  const sheet=rig.root.getObjectByName('ENDING_MAT_SHEET') as THREE.Mesh,bounds=new THREE.Box3().setFromObject(sheet);
  expect(bounds.min.x).toBeLessThan(6.175);expect(bounds.max.x).toBeGreaterThan(8.225);
  expect(bounds.min.z).toBeLessThan(-3.73);expect(bounds.max.z).toBeGreaterThan(-1.2);expect(bounds.max.y).toBeLessThan(-.007);
  for(const [width,height]of [[1920,1080],[1440,900]])for(const sectionTop of [0,120]){
   const pose=endingLetterView(width,height,1,sectionTop),camera=new THREE.PerspectiveCamera(pose.fov,width/height,.1,400);
   camera.position.fromArray(pose.eye);camera.lookAt(new THREE.Vector3().fromArray(pose.target));camera.updateMatrixWorld(true);
   for(const x of [bounds.min.x,bounds.max.x])for(const z of [bounds.min.z,bounds.max.z]){
    const p=new THREE.Vector3(x,bounds.max.y,z).project(camera),screenX=(p.x+1)/2,screenY=(1-p.y)/2;
    expect(screenX).toBeGreaterThan(.45);expect(screenX).toBeLessThan(.95);expect(screenY).toBeGreaterThan(0);expect(screenY).toBeLessThan(1);
   }
  }
  rig.dispose();
 });
 it('has no map runtime, remains absent throughout letter reading, and reverses its ending return deterministically',()=>{
  const rig=createEndingMat();for(const p of [0,.16,.32,.45,.62,.86,.94]){rig.update(p);expect(rig.root.visible).toBe(false);}
  rig.update(.97);const pose=rig.root.position.toArray(),state=rig.state.endingReturn;rig.update(1);rig.update(.62);rig.update(.97);
  expect(rig.root.position.toArray()).toEqual(pose);expect(rig.state.endingReturn).toBe(state);
  expect(rig.root.getObjectByName('STORY_COUNTRY_KOR')).toBeUndefined();expect(rig.root.getObjectByName('STORY_COUNTRY_DOM')).toBeUndefined();rig.dispose();
 });
});

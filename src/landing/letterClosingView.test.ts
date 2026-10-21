import {expect,it} from 'vitest';
import * as THREE from 'three';
import {letterClosingView,letterFoldView} from './letterClosingView';

for(const [width,height]of [[1920,1080],[1440,900]])for(const top of [100,-380])it(`keeps the read sheet registered while folding at ${width}×${height}, top ${top}`,()=>{
 const rect={left:(width-740)/2,top,width:740,height:620};
 const pose=letterClosingView(width,height,rect),camera=new THREE.PerspectiveCamera(pose.fov,width/height,.1,400);
 camera.position.fromArray(pose.eye);camera.lookAt(new THREE.Vector3().fromArray(pose.target));camera.updateMatrixWorld(true);
 for(const [x,y]of [[-.88,.88*rect.height/rect.width],[.88,-.88*rect.height/rect.width]]){
  const point=new THREE.Vector3(7.2+x,.163,-2.8-y).project(camera);
  expect((point.x+1)*width/2).toBeCloseTo(x<0?rect.left:rect.left+rect.width,2);
  expect((1-point.y)*height/2).toBeCloseTo(y>0?rect.top:rect.top+rect.height,2);
 }
});

it('begins with the registered reader and frames the closed envelope inside the viewport',()=>{
 const rect={left:350,top:-220,width:740,height:642};
 expect(letterFoldView(1440,900,rect,1)).toEqual(letterClosingView(1440,900,rect));
 const pose=letterFoldView(1440,900,rect,0),camera=new THREE.PerspectiveCamera(pose.fov,1440/900,.1,400);
 camera.position.fromArray(pose.eye);camera.lookAt(new THREE.Vector3().fromArray(pose.target));camera.updateMatrixWorld(true);
 for(const [x,z]of [[6.175,-1.2],[8.225,-2.55]]){
  const point=new THREE.Vector3(x,.08,z).project(camera);
  expect(Math.abs(point.x)).toBeLessThan(.4);expect(Math.abs(point.y)).toBeLessThan(.5);
 }
});

for(const [width,height]of [[1440,900],[1920,1080]])it(`contains the whole extracted sheet at the physical handoff, ${width}×${height}`,()=>{
 const rect={left:(width-740)/2,top:-380,width:740,height:620};
 const pose=letterFoldView(width,height,rect,.86),camera=new THREE.PerspectiveCamera(pose.fov,width/height,.1,400);
 camera.position.fromArray(pose.eye);camera.lookAt(new THREE.Vector3().fromArray(pose.target));camera.updateMatrixWorld(true);
 for(const [x,z]of [[6.32,-2.8-.88*620/740],[8.08,-2.8+.88*620/740]]){
  const point=new THREE.Vector3(x,.163,z).project(camera);
  expect(Math.abs(point.x)).toBeLessThan(.8);expect(Math.abs(point.y)).toBeLessThan(.98);
 }
});

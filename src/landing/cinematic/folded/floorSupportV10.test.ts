import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {floorSupportShape,sampleFloorSupport} from './floorSupportV10';
describe('thinner continuous cosmic floor support v10',()=>{
 it('keeps the deformation orientation and analytic gradient consistent',()=>{
  const a={height:0,dx:0,dy:0,dz:0},b={...a},c={...a},epsilon=1e-5;
  for(const p of[0,.15,.3,.5,1])for(const x of[-2,0,2,4,6,8])for(const y of[-3.32,-2.4,-1.8,0])for(const z of[-20,-10,-6,-3,0,2]){
   const shape=floorSupportShape(p);sampleFloorSupport(x,y,z,shape,a);
   expect(1+a.dy).toBeGreaterThan(.49);expect(a.height).toBeGreaterThanOrEqual(-10);expect(a.height).toBeLessThanOrEqual(.82);
   for(const [axis,key] of [[0,'dx'],[1,'dy'],[2,'dz']]as const){const left=[x,y,z],right=[x,y,z];left[axis]-=epsilon;right[axis]+=epsilon;sampleFloorSupport(left[0],left[1],left[2],shape,b);sampleFloorSupport(right[0],right[1],right[2],shape,c);expect(a[key]).toBeCloseTo((c.height-b.height)/(2*epsilon),4);}
  }
 });
 it('exports continuous support owners without the rejected separate portrait stage',async()=>{
  const bytes=fs.readFileSync(new URL('../../../../public/models/folded-chamber-r8-space-v6/chamber.glb',import.meta.url));
  const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');let owners=0,stages=0;
  gltf.scene.traverse(o=>{if(o.userData.floorSupport)owners++;if(o.userData.portraitStage||o.name.startsWith('Portrait_Stage'))stages++;});
  expect(owners).toBeGreaterThanOrEqual(2);expect(stages).toBe(0);
 });
});

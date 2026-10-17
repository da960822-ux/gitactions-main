import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {foldPoint,shellGeometry} from './shellGeometry';
describe('architectural shell invariants',()=>{
 it('preserves real thickness, finite normals and equal topology across all four fold states',()=>{
  const nx=12,ny=10,skin=(nx+1)*(ny+1),thickness=.18;
  for(const which of[0,1]){
   const g=shellGeometry((u,v,t)=>foldPoint(which,u,v,t),{nx,ny,thickness,morph:true,splitFront:which===1});
   expect(g.groups.length).toBeLessThanOrEqual(4);
   const positions=[g.getAttribute('position'),...(g.morphAttributes.position??[])],normals=[g.getAttribute('normal'),...(g.morphAttributes.normal??[])];
   for(let target=0;target<4;target++){
    expect(positions[target].count).toBe(positions[0].count);
    for(let i=0;i<skin;i++){
     const a=new T.Vector3().fromBufferAttribute(positions[target],i),b=new T.Vector3().fromBufferAttribute(positions[target],i+skin);
     expect(a.distanceTo(b)).toBeCloseTo(thickness,4);
    }
    for(const n of normals[target].array)expect(Number.isFinite(n)).toBe(true);
   }
   g.dispose();
  }
 });
 it('cuts a real opening in both skins without multiplying material draw groups',()=>{
  const surface=(u:number,v:number)=>new T.Vector3(u,v,0),full=shellGeometry(surface,{nx:10,ny:10}),hole=shellGeometry(surface,{nx:10,ny:10,cutout:(u,v)=>u>.4&&u<.6&&v>.4&&v<.6});
  expect(full.index!.count-hole.index!.count).toBe(4*2*3*2);
  expect(hole.groups.length).toBe(3);full.dispose();hole.dispose();
 });
});

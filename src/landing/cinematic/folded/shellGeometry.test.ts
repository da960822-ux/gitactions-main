import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {foldPoint,shellGeometry} from './shellGeometry';
describe('architectural shell invariants',()=>{
 it('preserves real thickness, finite normals and equal topology across all four fold states',()=>{
  const nx=12,ny=10,skin=(nx+1)*(ny+1),thickness=.18;
  for(const which of[0,1,2]){
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
 it('welds both skin boundaries to the rounded rim at every morph target',()=>{
  const nx=23,ny=17,skin=(nx+1)*(ny+1),g=shellGeometry((u,v,t)=>foldPoint(0,u,v,t),{nx,ny,morph:true});
  for(const p of[g.getAttribute('position'),...(g.morphAttributes.position??[])]){
   let base=skin*2;
   for(let edge=0;edge<4;edge++){
    const steps=edge%2===0?nx:ny;
    for(let i=0;i<=steps;i++){
     const x=edge===0?i:edge===1?nx:edge===2?nx-i:0,y=edge===0?0:edge===1?i:edge===2?ny:ny-i;
     for(const side of[0,1]){
      const a=new T.Vector3().fromBufferAttribute(p,y*(nx+1)+x+side*skin),b=new T.Vector3().fromBufferAttribute(p,base+i*7+side*6);
      expect(a.distanceTo(b)).toBeLessThan(.00001);
     }
    }
    base+=(steps+1)*7;
   }
  }
  g.dispose();
 });
 it('keeps skin triangles nondegenerate and normals consistently oriented during the actual morph',()=>{
  for(const which of[0,1,2]){
   const g=shellGeometry((u,v,t)=>foldPoint(which,u,v,t),{nx:40,ny:24,morph:true}),base=g.getAttribute('position'),bn=g.getAttribute('normal');
   const positions=g.morphAttributes.position!,normals=g.morphAttributes.normal!,index=g.index!,skins=(41*25)*2;
   for(const weights of[[0,0,0],[.4,0,0],[1,0,0],[.5,.5,0],[0,1,0],[0,0,.5],[0,0,1]]){
    const point=(i:number,normal=false)=>{const src=normal?bn:base,targets=normal?normals:positions,p=new T.Vector3().fromBufferAttribute(src,i),rest=1-weights.reduce((a,b)=>a+b,0);p.multiplyScalar(rest);weights.forEach((w,t)=>p.addScaledVector(new T.Vector3().fromBufferAttribute(targets[t],i),w));return p;};
    for(let t=0;t<index.count;t+=3){
     const a=index.getX(t),b=index.getX(t+1),c=index.getX(t+2);if(a>=skins||b>=skins||c>=skins)continue;
     const p=point(a),face=point(b).sub(p).cross(point(c).sub(p));
     expect(face.lengthSq()).toBeGreaterThan(1e-12);
     const normal=point(a,true).add(point(b,true)).add(point(c,true)).normalize();
     expect(face.normalize().dot(normal),JSON.stringify({which,weights,a,b,c})).toBeGreaterThan(.65);
    }
   }
   g.dispose();
  }
 });

 it('closes the lightwell without internal end caps or a normal seam',()=>{
  const loop=(u:number,v:number)=>new T.Vector3(Math.cos(u*Math.PI*2)*3,Math.sin(u*Math.PI*2)*4,-v*8),nx=24,ny=8;
  const g=shellGeometry(loop,{nx,ny,wrapU:true}),p=g.getAttribute('position'),n=g.getAttribute('normal');
  for(let j=0;j<=ny;j++)for(const a of[p,n])expect(new T.Vector3().fromBufferAttribute(a,j*(nx+1)).distanceTo(new T.Vector3().fromBufferAttribute(a,j*(nx+1)+nx))).toBeLessThan(.00001);
  for(const base of[2*(nx+1)*(ny+1),2*(nx+1)*(ny+1)+(nx+1)*7])for(let j=0;j<=6;j++)for(const a of[p,n])expect(new T.Vector3().fromBufferAttribute(a,base+j).distanceTo(new T.Vector3().fromBufferAttribute(a,base+nx*7+j))).toBeLessThan(.00001);
  expect(p.count).toBe(2*(nx+1)*(ny+1)+2*(nx+1)*7);g.dispose();
 });

});

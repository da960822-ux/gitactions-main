import * as T from 'three';
export type Surface = (u:number,v:number,target:number)=>T.Vector3;
const closedSection=new T.CatmullRomCurve3([
 [-.2,-3.25],[6,-3.25],[9,-1.8],[10,2],[9,6],[6,8.7],[1.5,10],[-4,9.5],
].map(([x,y])=>new T.Vector3(x,y,0)),false,'centripetal');
const openSection=new T.CatmullRomCurve3([
 [-7.5,-3.25],[3.8,-3.25],[6.9,-2.6],[8.4,.5],[7.4,4.7],[4.8,6.9],[.8,7.4],[-3,7.1],
].map(([x,y])=>new T.Vector3(x,y,0)),false,'centripetal');
export function foldPoint(which:number,u:number,v:number,target:number):T.Vector3 {
 if(target===3){const hinge=new T.Vector3(which===0?5:2,-3.25,-2.3);return foldPoint(which,u,v,0).sub(hinge).applyAxisAngle(new T.Vector3(0,1,0),which===0?-.12:0).add(hinge);}
 if(which===2){
  const unfold=target===0?0:target===1?.8:1,angle=-Math.PI/3+v*Math.PI,w=(.85+1.35*unfold)*(.8+.2*Math.sin(v*Math.PI)),across=(u-.5)*w;
  return new T.Vector3(T.MathUtils.lerp(3.2+.2*Math.sin(v*Math.PI),3.8+.8*Math.sin(v*Math.PI*2-.7),unfold)+Math.cos(angle)*across,-3.25+v*6.4+.035*Math.sin(u*Math.PI),T.MathUtils.lerp(-4-v*3,-22+.9*Math.sin(v*Math.PI*2),unfold)+Math.sin(angle)*across);
 }
 if(which===0){
  const closed=closedSection.getPoint(T.MathUtils.clamp(u,0,1)),open=openSection.getPoint(T.MathUtils.clamp(u,0,1));
  // One continuous cross-section grows into the atrium; the far architecture is present before entry.
  const depth=T.MathUtils.smoothstep(v,.06,.8),unfold=target===0?depth:target===1?.75+.25*depth:1;
  const p=closed.lerp(open,unfold);p.x-=1.4*Math.sin(Math.PI*v*2)*Math.pow(Math.sin(u*Math.PI),2);p.y+=.35*Math.sin(Math.PI*v*2)*T.MathUtils.smoothstep(u,.25,.5);p.z=-2.3-v*29;
  return p;
 }
 const crest=target===0?.95*Math.exp(-Math.pow((v-.4)/.16,2))*T.MathUtils.smoothstep(u,0,.1)*(1-T.MathUtils.smoothstep(u,.88,1)):0;
 return new T.Vector3(-1.1+u*7.2,-3.27+crest,6-v*(target===0?15:33));
}

// Closed skins plus a rounded, six-segment edge: thickness changes silhouette and reflection normals.
export function shellGeometry(surface:Surface,{nx=40,ny=32,thickness=.12,morph=false,splitFront=false,cutout,frontMaterial,wrapU=false}:{nx?:number;ny?:number;thickness?:number;morph?:boolean;splitFront?:boolean;cutout?:(u:number,v:number)=>boolean;frontMaterial?:(u:number,v:number)=>number;wrapU?:boolean}={}) {
 const targets=morph?[0,1,2,3]:[0],positions:number[][]=[],normals:number[][]=[],uvs:number[]=[],indices:number[]=[],groups:{start:number,count:number,materialIndex:number}[]=[];
 const edges=wrapU?[0,2]:[0,1,2,3],sample=(u:number,v:number,t:number)=>surface(wrapU?((u%1)+1)%1:u,v,t);
 const normalAt=(u:number,v:number,t:number)=>sample(u+.0001,v,t).sub(sample(u-.0001,v,t)).cross(sample(u,v+.0001,t).sub(sample(u,v-.0001,t))).normalize();
 for(const target of targets){const pos:number[]=[],norm:number[]=[];
  const vertex=(p:T.Vector3,n:T.Vector3,u:number,v:number)=>{pos.push(...p.toArray());norm.push(...n.toArray());if(target===0)uvs.push(u,v);};
  for(const side of[1,-1])for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const u=i/nx,v=j/ny,n=normalAt(u,v,target);vertex(surface(u,v,target).addScaledVector(n,side*thickness/2),n.clone().multiplyScalar(side),u,v);}
  for(const edge of edges)for(let i=0;i<=(edge%2===0?nx:ny);i++)for(let j=0;j<=6;j++){
   const steps=edge%2===0?nx:ny,s=i/steps,angle=j/6*Math.PI,u=edge===0?s:edge===1?1:edge===2?1-s:0,v=edge===0?0:edge===1?s:edge===2?1:1-s;
   const n=normalAt(u,v,target),p=surface(u,v,target),du=(wrapU?sample(u+.001,v,target).sub(sample(u-.001,v,target)):surface(Math.min(1,u+.001),v,target).sub(surface(Math.max(0,u-.001),v,target))).normalize(),dv=surface(u,Math.min(1,v+.001),target).sub(surface(u,Math.max(0,v-.001),target)).normalize();
   const out=new T.Vector3();if(v===0)out.add(du.clone().cross(n));if(!wrapU&&u===1)out.add(dv.clone().cross(n).negate());if(v===1)out.add(du.clone().cross(n).negate());if(!wrapU&&u===0)out.add(dv.clone().cross(n));out.normalize();
   const rimNormal=n.clone().multiplyScalar(Math.cos(angle)).addScaledVector(out,Math.sin(angle)).normalize();
   vertex(p.addScaledVector(rimNormal,thickness/2),rimNormal,u,v);
  }
  positions.push(pos);normals.push(norm);
 }
 const skin=(nx+1)*(ny+1),materialIndices:number[][]=Array.from({length:5},()=>[]);
 for(let side=0;side<2;side++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
  const u=(i+.5)/nx,v=(j+.5)/ny;if(cutout?.(u,v))continue;
  const a=side*skin+j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1,m=side===1?1:frontMaterial?frontMaterial(u,v):splitFront&&j/ny<.3?3:0;
  if(side===0)materialIndices[m].push(a,b,c,b,d,c);else materialIndices[m].push(a,c,b,b,c,d);
 }
 let edgeBase=skin*2;
 for(const edge of edges){const steps=edge%2===0?nx:ny;for(let i=0;i<steps;i++)for(let j=0;j<6;j++){const a=edgeBase+i*7+j,b=a+7;materialIndices[2].push(a,a+1,b,b,a+1,b+1);}edgeBase+=(steps+1)*7;}
 for(let materialIndex=0;materialIndex<materialIndices.length;materialIndex++){const batch=materialIndices[materialIndex];if(batch.length){groups.push({start:indices.length,count:batch.length,materialIndex});indices.push(...batch);}}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions[0],3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals[0],3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);const merged:typeof groups=[];for(const g of groups){const last=merged.at(-1);if(last&&last.materialIndex===g.materialIndex&&last.start+last.count===g.start)last.count+=g.count;else merged.push({...g});}merged.forEach(g=>geometry.addGroup(g.start,g.count,g.materialIndex));
 if(morph){geometry.morphAttributes.position=positions.slice(1).map(p=>new T.Float32BufferAttribute(p,3));geometry.morphAttributes.normal=normals.slice(1).map(n=>new T.Float32BufferAttribute(n,3));}
 geometry.computeBoundingSphere();return geometry;
}

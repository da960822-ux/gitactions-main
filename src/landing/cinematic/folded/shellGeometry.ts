import * as T from 'three';
export type Surface = (u:number,v:number,target:number)=>T.Vector3;
const TAU=Math.PI*2;
export function foldPoint(which:number,u:number,v:number,target:number):T.Vector3 {
 if(target===3){const hinge=new T.Vector3(which===0?3:0,-3,which===0?-2:1);return foldPoint(which,u,v,0).sub(hinge).applyAxisAngle(new T.Vector3(1,0,0),which===0?.85:.24).add(hinge);}
 if(which===0){
  if(target===0)return new T.Vector3(3.7+(u-.5)*2.9+.85*Math.sin(v*Math.PI),-3+v*7.5-.35*Math.sin(u*Math.PI),-2.3-v*2.8+.36*Math.sin(u*Math.PI)+.24*Math.cos(u*TAU*2)*Math.sin(v*Math.PI));
  if(target===1)return new T.Vector3(3.0+u*2.6,3.25+.65*Math.sin(u*Math.PI)+.16*Math.cos(u*TAU*2),-3-v*17);
  return new T.Vector3(2.4+u*3.2,4.1+.45*Math.sin(u*Math.PI)+.12*Math.cos(u*TAU*2),-4-v*21);
 }
 if(target===0){const t=Math.max(0,Math.min(1,(u-.23)/.26)),crest=.98*Math.exp(-Math.pow((v-.17)/.14,2))*Math.sin(u*Math.PI)*t*t*(3-2*t);return new T.Vector3(-6.5+u*14,-3.22+.10*Math.sin(u*TAU)+crest,2-v*9.5+.25*Math.sin(u*Math.PI));}
 if(target===1)return new T.Vector3(-6.5+u*13,-3.25+.24*Math.sin(u*Math.PI)*Math.pow(1-v,2),2-v*24);
 return new T.Vector3(-6.5+u*13,-3.25+.13*Math.sin(u*Math.PI)*Math.pow(1-v,2),2-v*24);
}

// Closed skins plus a rounded, six-segment edge: thickness changes silhouette and reflection normals.
export function shellGeometry(surface:Surface,{nx=40,ny=32,thickness=.12,morph=false,splitFront=false,cutout}:{nx?:number;ny?:number;thickness?:number;morph?:boolean;splitFront?:boolean;cutout?:(u:number,v:number)=>boolean}={}) {
 const targets=morph?[0,1,2,3]:[0],positions:number[][]=[],normals:number[][]=[],uvs:number[]=[],indices:number[]=[],groups:{start:number,count:number,materialIndex:number}[]=[];
 const normalAt=(u:number,v:number,t:number)=>surface(u+.0001,v,t).sub(surface(u-.0001,v,t)).cross(surface(u,v+.0001,t).sub(surface(u,v-.0001,t))).normalize();
 for(const target of targets){const pos:number[]=[],norm:number[]=[];
  const vertex=(p:T.Vector3,n:T.Vector3,u:number,v:number)=>{pos.push(...p.toArray());norm.push(...n.toArray());if(target===0)uvs.push(u,v);};
  for(const side of[1,-1])for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const u=i/nx,v=j/ny,n=normalAt(u,v,target);vertex(surface(u,v,target).addScaledVector(n,side*thickness/2),n.clone().multiplyScalar(side),u,v);}
  for(let edge=0;edge<4;edge++)for(let i=0;i<=48;i++)for(let j=0;j<=6;j++){
   const s=i/48,angle=j/6*Math.PI,u=edge===0?s:edge===1?1:edge===2?1-s:0,v=edge===0?0:edge===1?s:edge===2?1:1-s;
   const n=normalAt(u,v,target),p=surface(u,v,target),inward=surface(edge===1?u-.001:edge===3?u+.001:u,edge===0?v+.001:edge===2?v-.001:v,target).sub(p).normalize(),out=inward.negate();
   const rimNormal=n.clone().multiplyScalar(Math.cos(angle)).addScaledVector(out,Math.sin(angle)).normalize();
   vertex(p.addScaledVector(n,Math.cos(angle)*thickness/2).addScaledVector(out,Math.sin(angle)*thickness*.32),rimNormal,u,v);
  }
  positions.push(pos);normals.push(norm);
 }
 const skin=(nx+1)*(ny+1);
 for(let side=0;side<2;side++)for(let j=0;j<ny;j++){
  const start=indices.length;
  for(let i=0;i<nx;i++){if(cutout?.((i+.5)/nx,(j+.5)/ny))continue;const a=side*skin+j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;if(side===0)indices.push(a,b,c,b,d,c);else indices.push(a,c,b,b,c,d);}
  groups.push({start,count:indices.length-start,materialIndex:side===1?1:splitFront&&j/ny<.3?3:0});
 }
 for(let edge=0;edge<4;edge++){const start=indices.length,base=skin*2+edge*49*7;for(let i=0;i<48;i++)for(let j=0;j<6;j++){const a=base+i*7+j,b=a+7;indices.push(a,a+1,b,b,a+1,b+1);}groups.push({start,count:indices.length-start,materialIndex:2});}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions[0],3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals[0],3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);const merged:typeof groups=[];for(const g of groups){const last=merged.at(-1);if(last&&last.materialIndex===g.materialIndex&&last.start+last.count===g.start)last.count+=g.count;else merged.push({...g});}merged.forEach(g=>geometry.addGroup(g.start,g.count,g.materialIndex));
 if(morph){geometry.morphAttributes.position=positions.slice(1).map(p=>new T.Float32BufferAttribute(p,3));geometry.morphAttributes.normal=normals.slice(1).map(n=>new T.Float32BufferAttribute(n,3));}
 geometry.computeBoundingSphere();return geometry;
}

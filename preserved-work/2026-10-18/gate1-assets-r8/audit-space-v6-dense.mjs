import fs from 'node:fs';
import *as T from '/workspace/yl-folded-playhouse-r8/node_modules/three/build/three.module.js';
import {GLTFLoader} from '/workspace/yl-folded-playhouse-r8/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {sampleShellTwist,sampleFloorSupport,floorSupportShape} from './v6-deformation-functions.mjs';
const P='/workspace/gate1-assets-r8',bytes=fs.readFileSync(P+'/space-v6-model/chamber.glb');
const g=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');g.scene.updateMatrixWorld(true);
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const meshes=[];g.scene.traverse(o=>{if(o.isMesh&&!o.userData.lighting_card&&!o.parent?.userData.lighting_card)meshes.push(o)});
const rows=[],v=new T.Vector3(),n=new T.Vector3(),tmp=new T.Vector3(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),cross=new T.Vector3(),expected=new T.Vector3(),support={height:0,dx:0,dy:0,dz:0},twist={x:0,z:0,xx:0,xz:0,zx:0,zz:0};
for(const p of Array.from({length:51},(_,i)=>i/50)){
 for(const mesh of meshes.filter(m=>m.morphTargetInfluences||m.name==='Deep_Burgundy_Continuous_Return')){
  const geo=mesh.geometry,normalMatrix=new T.Matrix3().getNormalMatrix(mesh.matrixWorld),inv=mesh.matrixWorld.clone().invert(),normalInv=normalMatrix.clone().invert();
  let owner=mesh;while(owner&&!owner.userData.lightmapStem&&!owner.userData.normalMap)owner=owner.parent;
  let shell=mesh;while(shell&&!shell.userData.hingeRig)shell=shell.parent;
  const positions=new Float64Array(geo.attributes.position.count*3),normals=new Float64Array(positions.length);let nonfinite=0,minJacobian=Infinity;
  for(let i=0;i<geo.attributes.position.count;i++){
   v.fromBufferAttribute(geo.attributes.position,i);n.fromBufferAttribute(geo.attributes.normal,i);
   if(shell){v.applyMatrix4(mesh.matrixWorld);n.applyMatrix3(normalMatrix).normalize();sampleShellTwist(v.x,v.z,p,1,twist);v.x=twist.x;v.z=twist.z;const nx=n.x,nz=n.z;n.x=twist.zz*nx-twist.zx*nz;n.z=-twist.xz*nx+twist.xx*nz;v.applyMatrix4(inv);n.applyMatrix3(normalInv).normalize();minJacobian=Math.min(minJacobian,twist.xx*twist.zz-twist.xz*twist.zx);}
   if(owner?.userData.floorSupport){sampleFloorSupport(v.x,v.y,v.z,floorSupportShape(p),support);v.y+=support.height;const yy=n.y/(1+support.dy);n.set(n.x-support.dx*yy,yy,n.z-support.dz*yy).normalize();minJacobian=Math.min(minJacobian,1+support.dy);}
   const index=mesh.morphTargetDictionary?.Space_Unfold;
   if(index!==undefined){const influence=smooth(owner?.userData.motionGroup==='rail'?.55:.08,owner?.userData.motionGroup==='rail'?.85:.43,p);tmp.fromBufferAttribute(geo.morphAttributes.position[index],i);if(!geo.morphTargetsRelative)tmp.sub(new T.Vector3().fromBufferAttribute(geo.attributes.position,i));v.addScaledVector(tmp,influence);if(geo.morphAttributes.normal?.[index]){tmp.fromBufferAttribute(geo.morphAttributes.normal[index],i);if(!geo.morphTargetsRelative)tmp.sub(new T.Vector3().fromBufferAttribute(geo.attributes.normal,i));n.addScaledVector(tmp,influence);}}
   v.applyMatrix4(mesh.matrixWorld);n.applyMatrix3(normalMatrix).normalize();v.toArray(positions,i*3);n.toArray(normals,i*3);if(![v.x,v.y,v.z,n.x,n.y,n.z].every(Number.isFinite))nonfinite++;
  }
  let degenerate=0,inverted=0,minDot=1,minArea=Infinity;const index=geo.index,count=(index?.count||geo.attributes.position.count)/3;
  for(let t=0;t<count;t++){const ia=index?index.getX(t*3):t*3,ib=index?index.getX(t*3+1):t*3+1,ic=index?index.getX(t*3+2):t*3+2;a.fromArray(positions,ia*3);b.fromArray(positions,ib*3).sub(a);c.fromArray(positions,ic*3).sub(a);cross.crossVectors(b,c);const area=cross.length()/2;minArea=Math.min(minArea,area);if(area<1e-14){degenerate++;continue;}expected.fromArray(normals,ia*3).add(n.fromArray(normals,ib*3)).add(n.fromArray(normals,ic*3)).normalize();const dot=cross.normalize().dot(expected);minDot=Math.min(minDot,dot);if(dot<-.001)inverted++;}
  rows.push({p,mesh:mesh.name,triangles:count,nonfinite,degenerate,inverted,minNormalDot:minDot,minTriangleArea:minArea,minJacobian:Number.isFinite(minJacobian)?minJacobian:null});
 }
}
const summary={scope:'Actual exported V6 GLTF, same TS deformation helpers as WebGL, 51 intermediate poses (animated geometry; static continuation separately checked in the six-pose audit). Checks finite vertices/normal orientation and local Jacobian; not a global inter-object collision/self-intersection or visual approval proof.',nonfinite:rows.reduce((s,r)=>s+r.nonfinite,0),degenerate:rows.reduce((s,r)=>s+r.degenerate,0),inverted:rows.reduce((s,r)=>s+r.inverted,0),rows};fs.writeFileSync(P+'/space-v6-dense-geometry-audit.json',JSON.stringify(summary,null,2));console.log(JSON.stringify({...summary,rows:rows.filter(r=>r.nonfinite||r.degenerate||r.inverted)},null,2));

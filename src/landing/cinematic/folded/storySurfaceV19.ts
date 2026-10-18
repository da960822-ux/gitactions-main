import * as T from 'three';
import {cameraPose,smoothRange} from './poseSpaceV19';

export function surfacePose(progress:number,entrance=1){
 const open=smoothRange(.18,.34,progress);
 return{center:[0,0,-4],width:24,height:14,yaw:0,bend:open*Math.PI*.52,pitch:0,open,entrance};
}
export function surfaceVertex(u:number,v:number,p:number,e=1){
 const s=surfacePose(p,e),side=u<.5?-1:1,hinge=side*12,distance=12-Math.abs((u-.5)*24),angle=s.bend*(.84+.16*Math.sin(v*Math.PI));
 return[hinge-side*distance*Math.cos(angle),(v-.5)*14,-distance*Math.sin(angle)] as const;
}

/** The Hero image is the same indexed surface that opens behind the characters. */
export function createStorySurface(scene:T.Scene,keep:<A extends{dispose:()=>void}>(a:A)=>A){
 const geometry=keep(new T.PlaneGeometry(1,1,96,64));
 const material=keep(new T.MeshStandardMaterial({color:'#ffffff',metalness:0,roughness:.8,side:T.DoubleSide,emissive:'#ffffff',emissiveIntensity:0,toneMapped:false}));
 const reference=new T.PerspectiveCamera(38,16/9,.1,400),imageMap={value:null as T.Texture|null};
 const mesh=new T.Mesh(geometry,material);mesh.name='HERO_COSMIC_SURFACE_SAME_INDEXED_OPENING';mesh.frustumCulled=false;scene.add(mesh);
 const uv=geometry.getAttribute('uv'),position=geometry.getAttribute('position'),rest=new Float32Array(position.count*3),point=new T.Vector3();
 let signature='',projectionKey='';
 const fold={value:0};
 material.onBeforeCompile=shader=>{
  shader.uniforms.approvedHeroImage=imageMap;shader.uniforms.cosmicFold=fold;
  shader.fragmentShader='uniform sampler2D approvedHeroImage;uniform float cosmicFold;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','outgoingLight=mix(texture2D(approvedHeroImage,vMapUv).rgb,outgoingLight,.10*cosmicFold);\n#include <opaque_fragment>');
 };
 material.customProgramCacheKey=()=> 'same-index-cosmic-wing-to-near-room';
 return{mesh,material,ready:Promise.resolve(),setHeroImage(texture:T.Texture){imageMap.value=texture;material.map=texture;material.needsUpdate=true;},setProjection(width:number,height:number,entrance:number){
  const key=width+':'+height+':'+entrance.toFixed(4);if(key===projectionKey)return;projectionKey=key;signature='';
  reference.aspect=width/height;const c=cameraPose(0,entrance,false);reference.position.fromArray(c.position);reference.lookAt(...c.target as [number,number,number]);reference.updateProjectionMatrix();reference.updateMatrixWorld();
  const imageAspect=1536/1024,viewAspect=width/height,rx=viewAspect<imageAspect?viewAspect/imageAspect:1,ry=viewAspect>imageAspect?imageAspect/viewAspect:1;
  for(let i=0;i<position.count;i++){
   const u=i%97/96,v=1-Math.floor(i/97)/64;
   point.set((u-.5)*2,(v-.5)*2,.5).unproject(reference).sub(reference.position);
   point.multiplyScalar((-4-reference.position.z)/point.z).add(reference.position);rest.set(point.toArray(),i*3);
   uv.setXY(i,u*rx+(1-rx)*.58,v*ry+(1-ry)*.5);
  }
  uv.needsUpdate=true;
 },update(p:number,e:number){
  const next=p.toFixed(5)+':'+e.toFixed(5);if(next===signature)return;signature=next;
  const s=surfacePose(p,e);fold.value=s.open;
  const left=rest[0],right=rest[96*3],half=(right-left)/2;
  for(let i=0;i<position.count;i++){
   const x=rest[i*3],y=rest[i*3+1],side=x<(left+right)/2?-1:1,hinge=side<0?left:right,distance=Math.abs(hinge-x),v=1-Math.floor(i/97)/64;
   const angle=s.bend*(.84+.16*Math.sin(v*Math.PI));
   position.setXYZ(i,hinge-side*distance*Math.cos(angle),y+.32*s.open*Math.sin(v*Math.PI)*distance/half,-4-distance*Math.sin(angle));
  }
  position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();mesh.updateMatrixWorld();
 }};
}

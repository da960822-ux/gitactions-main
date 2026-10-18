import * as T from 'three';
import {cameraPose,smoothRange} from './poseSpaceV19';
import {cosmicOpeningPose,deformInitialCosmicVertex} from './initialCosmicHero';

export function surfacePose(progress:number,entrance=1){
 const open=smoothRange(.175,.27,progress);
 return{center:[0,0,-4],width:24,height:14,yaw:0,bend:Math.sin(open*Math.PI)*Math.PI/3,pitch:0,open,entrance};
}
export function cosmicMarginX(u:number,p:number){return (u*2-1)**9*4*smoothRange(.12,.22,p);}
export function cosmicMarginY(v:number,p:number){return (v*2-1)**9*2*smoothRange(.12,.22,p);}
export function cosmicFoldAmount(u:number,v:number,p:number){
 const sweep=smoothRange(0,1,smoothRange(.14,.48,p)*1.8-u*.8);
 const interior=smoothRange(0,.04,u)*(1-smoothRange(.96,1,u))*smoothRange(0,.04,v)*(1-smoothRange(.96,1,v));
 return sweep*(interior+(1-interior)*smoothRange(.40,.46,p));
}

export function foldCosmicVertex(x:number,y:number,bottom:number,top:number,open:number){
 if(open===0)return[x,y,-4] as const;
 const v=(y-bottom)/(top-bottom),angle=open*Math.PI*.5+.35*Math.sin(v*Math.PI)*Math.sin(open*Math.PI),distance=y-bottom;
 return[x,bottom+distance*Math.cos(angle),-4-distance*Math.sin(angle)] as const;
}
export function surfaceVertex(u:number,v:number,p:number,_entrance=1){
 return foldCosmicVertex((u-.5)*24+cosmicMarginX(u,p),(v-.5)*14,-7,7,cosmicFoldAmount(u,v,p));
}

/** The Hero image is the same indexed surface that opens behind the characters. */
export function createStorySurface(scene:T.Scene,keep:<A extends{dispose:()=>void}>(a:A)=>A){
 const geometry=keep(new T.PlaneGeometry(1,1,96,64));
 const material=keep(new T.MeshStandardMaterial({color:'#ffffff',metalness:0,roughness:.8,side:T.DoubleSide,emissive:'#ffffff',emissiveIntensity:0,toneMapped:false,transparent:false,depthWrite:true}));
 const reference=new T.PerspectiveCamera(38,16/9,.1,400),imageMap={value:null as T.Texture|null};
 const mesh=new T.Mesh(geometry,material);mesh.name='HERO_COSMIC_SURFACE_SAME_INDEXED_OPENING';mesh.frustumCulled=false;scene.add(mesh);
 const uv=geometry.getAttribute('uv'),position=geometry.getAttribute('position'),rest=new Float32Array(position.count*3),point=new T.Vector3();
 let signature='',projectionKey='';
 const fold={value:0};
 material.onBeforeCompile=shader=>{
  shader.uniforms.approvedHeroImage=imageMap;shader.uniforms.cosmicFold=fold;
  shader.fragmentShader='uniform sampler2D approvedHeroImage;uniform float cosmicFold;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','outgoingLight=mix(texture2D(approvedHeroImage,vMapUv).rgb,outgoingLight,.08*cosmicFold);\n#include <opaque_fragment>');
 };
 material.customProgramCacheKey=()=> 'same-index-cosmic-fold-to-approved-illustration';
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
 },update(p:number,e:number,pointerX=0,pointerY=0,_liveCamera?:T.PerspectiveCamera){
  const opening=cosmicOpeningPose(p,e,pointerX,pointerY);
  const next=[p,e,opening.entry,opening.pointerX,opening.pointerY].map(n=>n.toFixed(5)).join(':');if(next===signature)return;signature=next;
  const flex=opening.entry!==0||opening.pointerX!==0||opening.pointerY!==0;
  const s=surfacePose(p,e);fold.value=Math.sin(s.open*Math.PI);
  mesh.visible=p<.27;
  const bottom=rest[(position.count-1)*3+1],top=rest[1],height=top-bottom;
  for(let i=0;i<position.count;i++){
   const u=i%97/96,v=1-Math.floor(i/97)/64;let x=rest[i*3],y=rest[i*3+1],z=-4;
   // A shallow cylindrical leading edge preserves arclength while the opaque sheet leaves the frame.
   const reach=height*.24,hinge=top-reach,distance=Math.max(0,y-hinge);
   if(distance>0&&s.bend>1e-6){const radius=reach/s.bend,theta=distance/radius;y=hinge+radius*Math.sin(theta);z+=radius*(1-Math.cos(theta));}
   y-=height*1.12*s.open;
   position.setXYZ(i,x,y,z);
   if(flex){point.fromBufferAttribute(position,i);deformInitialCosmicVertex(point,u,v,opening);position.setXYZ(i,point.x,point.y,point.z);}
  }
  position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();mesh.updateMatrixWorld();
 }};
}

import * as T from 'three';
import {openingCameraPose,smoothRange} from './poseSpaceV19';
import {cosmicOpeningPose,deformInitialCosmicVertex} from './initialCosmicHero';

const SEGMENTS=192,RINGS=40;
export function surfacePose(progress:number,entrance=1){
 const open=smoothRange(.18,.43,progress);
 return{center:[0,0,-4+22*smoothRange(.23,.43,progress)],width:24,height:14,yaw:0,bend:5.2*Math.sin(Math.PI*open),pitch:0,open,cover:0,entrance};
}
/** A room-sized opening in the environment; the outside perimeter never enters the frame. */
export function apertureVertex(angle:number,radial:number,progress:number){
 const s=surfacePose(progress),c=Math.cos(angle),t=Math.sin(angle);
 const square=1/Math.max(Math.abs(c),Math.abs(t));
 const rounded=1/Math.pow(Math.abs(c)**16+Math.abs(t)**16,1/16);
 const innerWidth=.4*smoothRange(.18,.25,progress),innerHeight=1.6*smoothRange(.18,.205,progress),outer=4;
 const x=c*(innerWidth*rounded+(outer*square-innerWidth*rounded)*radial);
 const y=t*(innerHeight*rounded+(outer*square-innerHeight*rounded)*radial);
 return{x,y,z:s.center[2]-s.bend*Math.pow(1-radial,4),shade:1};
}

/** The artwork stays registered to the environment while the physical aperture uncovers B. */
export function createStorySurface(scene:T.Scene,keep:<A extends{dispose:()=>void}>(a:A)=>A){
 const geometry=keep(new T.BufferGeometry()),count=(SEGMENTS+1)*(RINGS+1);
 const positions=new T.Float32BufferAttribute(new Float32Array(count*3),3),uv=new T.Float32BufferAttribute(new Float32Array(count*2),2),colors=new T.Float32BufferAttribute(new Float32Array(count*3),3),indices:number[]=[];
 for(let r=0;r<RINGS;r++)for(let j=0;j<SEGMENTS;j++){const a=r*(SEGMENTS+1)+j,b=a+SEGMENTS+1;indices.push(a,b,a+1,a+1,b,b+1);}
 geometry.setAttribute('position',positions);geometry.setAttribute('uv',uv);geometry.setAttribute('color',colors);geometry.setIndex(indices);
 const material=keep(new T.MeshBasicMaterial({color:'#ffffff',side:T.DoubleSide,toneMapped:false,vertexColors:true}));
 const mesh=new T.Mesh(geometry,material);mesh.name='HERO_COSMIC_ENVIRONMENT_APERTURE';mesh.frustumCulled=false;scene.add(mesh);
 const reference=new T.PerspectiveCamera(38,16/9,.1,400),point=new T.Vector3();
 let width=1920,height=1080,signature='';
 return{mesh,material,ready:Promise.resolve(),setHeroImage(texture:T.Texture){material.map=texture;material.needsUpdate=true;},setProjection(w:number,h:number,entrance:number){
  const key=w+':'+h+':'+entrance.toFixed(4);if(key!==width+':'+height+':'+reference.userData.entrance){signature='';}
  width=w;height=h;reference.userData.entrance=entrance.toFixed(4);reference.aspect=w/h;
  const c=openingCameraPose(entrance);reference.position.fromArray(c.position);reference.lookAt(...c.target as[number,number,number]);reference.updateProjectionMatrix();reference.updateMatrixWorld();
 },update(p:number,e:number,pointerX=0,pointerY=0,_liveCamera?:T.PerspectiveCamera){
  const next=[p,e,pointerX,pointerY,width,height].join(':');if(next===signature)return;signature=next;
  const opening=cosmicOpeningPose(p,e,pointerX,pointerY),imageAspect=1536/1024,viewAspect=width/height,rx=viewAspect<imageAspect?viewAspect/imageAspect:1,ry=viewAspect>imageAspect?imageAspect/viewAspect:1;
  for(let r=0;r<=RINGS;r++)for(let j=0;j<=SEGMENTS;j++){
   const i=r*(SEGMENTS+1)+j,s=apertureVertex(j/SEGMENTS*Math.PI*2,r/RINGS,p),u=(s.x+1)/2,v=(s.y+1)/2;
   point.set(s.x,s.y,.5).unproject(reference).sub(reference.position);point.multiplyScalar((-4-reference.position.z)/point.z).add(reference.position);point.z+=s.z+4;
   deformInitialCosmicVertex(point,Math.max(0,Math.min(1,u)),Math.max(0,Math.min(1,v)),opening);
   positions.setXYZ(i,point.x,point.y,point.z);uv.setXY(i,u*rx+(1-rx)*.58,v*ry+(1-ry)*.5);colors.setXYZ(i,s.shade,s.shade,s.shade);
  }
  positions.needsUpdate=uv.needsUpdate=true;geometry.computeVertexNormals();
  const normals=geometry.getAttribute('normal'),relief=Math.sin(Math.PI*surfacePose(p).open);
  for(let i=0;i<count;i++){const shade=1-relief*.65*(1-Math.max(0,normals.getZ(i)));colors.setXYZ(i,shade,shade,shade);}
  colors.needsUpdate=true;geometry.computeBoundingSphere();mesh.updateMatrixWorld();
 }};
}

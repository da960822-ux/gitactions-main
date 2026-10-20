import * as THREE from 'three';
import type {LocalEventState} from '../../post-hero-preview/src/LocalEventRig';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type PostCompositionFrame={progress:number;bridge:number;galleryWeight:number;opening:number;time:number;reducedMotion:boolean;width:number;height:number;roomEye:THREE.Vector3;roomTarget:THREE.Vector3;effect?:{name:string;value:number;nonce:number};localEvent?:LocalEventState};
const range=(a:number,b:number,p:number)=>THREE.MathUtils.smoothstep(p,a,b);
// Stage-local poses; the room owner chooses the shared transform after room approval.
const OFFSET=new THREE.Vector3(9,-4.3,-10);
const GALLERY=new THREE.Vector3(-7,-.007,-4.3),LETTER=new THREE.Vector3(7.2,-.007,-1.2);
const poses=[
 {p:0,eye:[1.2,3.2,8.3],target:[2.6,.65,-.7]},
 {p:.10,eye:[1.2,3.2,8.3],target:[2.6,.65,-.7]},
 {p:.30,eye:[3,4.8,10.2],target:[3,.1,-.1]},
 {p:.40,eye:[3,4.8,10.2],target:[3,.1,-.1]},
 {p:.45,eye:[4.3,3.2,7.3],target:[4.3,.7,-1.1]},
 {p:.55,eye:[4.3,3.2,7.3],target:[4.3,.7,-1.1]},
 {p:.62,eye:[5.25,2.35,5.45],target:[6.25,.85,-1.2]},
 {p:.78,eye:[4.5,2.4,2.15],target:[7.2,1.4,-1.2]},
 {p:.84,eye:[4.4,1.6,1.65],target:[7.2,1.6,-1.2]},
 {p:.94,eye:[4.4,1.6,1.65],target:[7.2,1.6,-1.2]},
 {p:1,eye:[3,3.8,11],target:[3,1,0]},
];

/** Renderer-free, open studio stages: no foreground walls or ceiling between eye and content. */
export function createPostHeroComposition(scene:THREE.Scene,onInvalidate:()=>void=()=>{}){
 const root=new THREE.Group();root.name='POST_HERO_ARCHITECTURE';root.position.copy(OFFSET);root.visible=false;scene.add(root);
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
 let disposed=false;
 const loader=new THREE.TextureLoader();
 function texture(path:string,x=1,y=1,color=true){const map=loader.load(path,()=>{if(!disposed)onInvalidate();});map.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(x,y);map.anisotropy=4;textures.add(map);return map;}
 function material(options:THREE.MeshStandardMaterialParameters){const result=new THREE.MeshStandardMaterial(options);materials.add(result);return result;}
 const oak=material({color:'#8c6250',map:texture('/images/approved-couple-room/honeywood-material.png',4.75,2.63),roughness:.75});
 const edge=material({color:'#513942',roughness:.75});
 const bronze=material({color:'#c1987f',roughness:.43,metalness:1});
 function mesh(g:THREE.BufferGeometry,m:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0,shadow=true){geometries.add(g);const object=new THREE.Mesh(g,m);object.position.set(x,y,z);object.castShadow=shadow;object.receiveShadow=true;parent.add(object);return object;}
 function box(w:number,h:number,d:number,m:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0,bevel=0){return mesh(bevel?new RoundedBoxGeometry(w,h,d,2,Math.min(bevel,w/3,h/3,d/3)):new THREE.BoxGeometry(w,h,d),m,parent,x,y,z);}
 // Fixed 1.2m desk at the envelope scale; its near edge falls below both desktop ending frusta.
 const tabletop=box(12,.13,10,oak,root,4.8,-.077,1.1,.045);tabletop.name='POST_FINITE_DESK_EDGE';
 const desk=new THREE.Group();desk.name='LETTER_WRITING_DESK';desk.position.copy(LETTER);root.add(desk);
 // The same low writing pad sits under the preview envelope and the opened letter.
 const writingPad=box(3,.045,2.4,edge,desk,0,.012,-.25,.02);writingPad.name='LETTER_WRITING_PAD';
 const pen=mesh(new THREE.CylinderGeometry(.027,.027,1.2,12),bronze,desk,1.25,.065,.6);pen.rotation.set(Math.PI/2,0,-.35);
 const fill=new THREE.HemisphereLight('#eee1da','#181823',.8);root.add(fill);
 const key=new THREE.DirectionalLight('#f7eff0',2.3);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-13,right:13,top:11,bottom:-11,near:1,far:45});key.shadow.camera.updateProjectionMatrix();key.shadow.bias=-.00025;key.shadow.normalBias=.008;key.shadow.intensity=.55;key.shadow.radius=4;root.add(key,key.target);
 const cool=new THREE.DirectionalLight('#b9c4df',.6);cool.position.set(4,6,-5);root.add(cool);
 const eye=new THREE.Vector3(),target=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3(),background=new THREE.Color('#13141c');
 let eventWeight=0,eventFrom=0,eventTarget=0,eventStart=0;
 const output={eye,target,fov:38,galleryScale:.65,galleryDisplayId:undefined as string|undefined,galleryStoryFocus:0,galleryAnchor:GALLERY.clone().add(OFFSET),letterAnchor:LETTER.clone().add(OFFSET),letterScale:1,roomExit:0,roomDesk:0,background,needsFrame:false};
 return{root,
 update(frame:PostCompositionFrame){
  if(disposed)return output;
  const p=THREE.MathUtils.clamp(frame.progress,0,1),bridge=THREE.MathUtils.clamp(frame.bridge,0,1);root.visible=bridge>.001;
  const index=Math.max(0,Math.min(poses.length-2,poses.findIndex((pose,i)=>i<poses.length-1&&p>=pose.p&&p<=poses[i+1].p))),from=poses[index],to=poses[index+1],t=range(from.p,to.p,p);
  eye.fromArray(from.eye).lerp(a.fromArray(to.eye),t);target.fromArray(from.target).lerp(b.fromArray(to.target),t);
  const activeToy=Boolean(frame.localEvent?.active)&&(p<.43||p>=.56&&p<.70||p>=.94);
  const nextEventTarget=activeToy?1:0;
  if(nextEventTarget!==eventTarget){eventFrom=eventWeight;eventTarget=nextEventTarget;eventStart=frame.time;}
  eventWeight=frame.reducedMotion?eventTarget:THREE.MathUtils.lerp(eventFrom,eventTarget,range(0,.28,frame.time-eventStart));
  const toyPositions:Record<string,[number,number,number]>={L01:[3.09,.55,2.1],L04:[4.45,.7,0],L06:[6.75,.55,.8],L15:p>=.94?[4.4,.55,3.35]:[2.75,.55,-.4]};
  const focus=toyPositions[frame.localEvent?.active??'']??[1.55,.65,.3];
  // The controls occupy the left third; move the eye toward the chosen physical object's right side.
  eye.lerp(a.set(focus[0]-2.3,3.0,focus[2]+5.8),eventWeight);target.lerp(b.set(focus[0]-.75,focus[1],focus[2]),eventWeight);
  const settle=range(.18,.30,p),galleryDeparture=range(.55,.64,p);
  output.galleryStoryFocus=0;output.galleryDisplayId=undefined;
  desk.position.copy(LETTER);
  const invitationView=range(.55,.62,p)*(1-range(.70,.78,p));
  eye.x+=.6*invitationView;target.x+=.6*invitationView;
  eye.sub(target).multiplyScalar(1+.08*invitationView).add(target);
  const contain=frame.width>=760?Math.max(1,(16/9)/(frame.width/Math.max(1,frame.height))):1;
  eye.sub(target).multiplyScalar(contain).add(target);
  eye.add(root.position);target.add(root.position);
  output.galleryAnchor.copy(GALLERY).add(root.position);output.galleryAnchor.x-=18*galleryDeparture;output.galleryAnchor.z-=4*galleryDeparture;output.galleryAnchor.y+=(4.5*settle-2.4*(1-settle));output.letterAnchor.copy(LETTER).add(root.position);output.letterAnchor.x=desk.position.x+root.position.x;
  const letter=range(.55,.62,p),ending=range(.94,1,p);a.set(3,.3,0).lerp(LETTER,letter).lerp(b.set(4.6,1,-.3),ending);key.target.position.copy(a);key.position.copy(a).add(b.set(-6,11,7));key.intensity=2.3*bridge;fill.intensity=.8*bridge;cool.intensity=.6*bridge;
  output.needsFrame=Math.abs(eventWeight-eventTarget)>.0001;
  output.fov=38;output.roomDesk=bridge;output.roomExit=0;return output;
 },dispose(){if(disposed)return;disposed=true;root.removeFromParent();geometries.forEach(item=>item.dispose());materials.forEach(item=>item.dispose());textures.forEach(item=>item.dispose());key.shadow.map?.dispose();}};
}

import * as THREE from 'three';
import {createLocalEventRig,type LocalEventState} from '../../post-hero-preview/src/LocalEventRig';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type PostCompositionFrame={progress:number;bridge:number;galleryWeight:number;opening:number;time:number;reducedMotion:boolean;width:number;height:number;roomEye:THREE.Vector3;roomTarget:THREE.Vector3;effect?:{name:string;value:number;nonce:number};localEvent?:LocalEventState};
export type RoomHandoffDraft={eye:THREE.Vector3;target:THREE.Vector3;fov:number;scale:number;floor:number;bounds:THREE.Box3;exit:{eye:THREE.Vector3;target:THREE.Vector3;floor:THREE.Vector3;progress:number}};
const range=(a:number,b:number,p:number)=>THREE.MathUtils.smoothstep(p,a,b);
// Stage-local poses; the room owner chooses the shared transform after room approval.
const OFFSET=new THREE.Vector3(9,-4.3,-10);
const GALLERY=new THREE.Vector3(-7,-.007,-4.3),LETTER=new THREE.Vector3(6.2,-.007,.15);
const poses=[
 {p:0,eye:[1.2,4.2,10.2],target:[1.2,.55,.1]},
 {p:.10,eye:[1.2,4.2,10.2],target:[1.2,.55,.1]},
 {p:.30,eye:[1.2,4.2,10.2],target:[1.2,.55,.1]},
 {p:.45,eye:[1.2,4.2,10.2],target:[1.2,.55,.1]},
 {p:.55,eye:[1.2,4.2,10.2],target:[1.2,.55,.1]},
 {p:.62,eye:[4.25,2.35,6.8],target:[5.25,.85,.15]},
 {p:.78,eye:[3.5,2.4,3.5],target:[6.2,1.4,.15]},
 {p:.84,eye:[3.4,1.6,3],target:[6.2,1.6,.15]},
 {p:.94,eye:[3.4,1.6,3],target:[6.2,1.6,.15]},
 {p:1,eye:[2.7,3.3,8.8],target:[2.7,1.1,-.3]},
];

/** Renderer-free, open studio stages: no foreground walls or ceiling between eye and content. */
export function createPostHeroComposition(scene:THREE.Scene,onInvalidate:()=>void=()=>{}){
 const root=new THREE.Group();root.name='POST_HERO_ARCHITECTURE';root.position.copy(OFFSET);root.visible=false;scene.add(root);
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
 let disposed=false;
 const loader=new THREE.TextureLoader();
 function texture(path:string,x=1,y=1,color=true){const map=loader.load(path,()=>{if(!disposed)onInvalidate();});map.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(x,y);map.anisotropy=4;textures.add(map);return map;}
 function material(options:THREE.MeshStandardMaterialParameters){const result=new THREE.MeshStandardMaterial(options);materials.add(result);return result;}
  const oak=material({color:'#211a24',roughness:.75});
 const edge=material({color:'#513942',roughness:.75});
 const fabric=material({color:'#171822',bumpMap:texture('/images/approved-couple-room/burgundy-plaster-material.png',12,12,false),bumpScale:.008,roughness:.94,side:THREE.DoubleSide});
 const paper=material({color:'#e9d9bf',roughness:.94,side:THREE.DoubleSide});
 const bronze=material({color:'#c1987f',roughness:.43,metalness:1});
 function mesh(g:THREE.BufferGeometry,m:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0,shadow=true){geometries.add(g);const object=new THREE.Mesh(g,m);object.position.set(x,y,z);object.castShadow=shadow;object.receiveShadow=true;parent.add(object);return object;}
 function box(w:number,h:number,d:number,m:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0,bevel=0){return mesh(bevel?new RoundedBoxGeometry(w,h,d,2,Math.min(bevel,w/3,h/3,d/3)):new THREE.BoxGeometry(w,h,d),m,parent,x,y,z);}
 // The finite cloth and its three hinged sections keep the story in a hand-sized desk space.
 const surfaceGeometry=new THREE.PlaneGeometry(11.8,5.6,96,40);surfaceGeometry.rotateX(-Math.PI/2);
 const surface=mesh(surfaceGeometry,fabric,root,1.7,0,.1,false);surface.name='POST_SHARED_FOLDING_SURFACE';
 const surfacePositions=surfaceGeometry.getAttribute('position'),surfaceBase=surfacePositions.array.slice();
 const tabletop=box(11.8,.13,5.6,oak,root,1.7,-.12,.1,.045);tabletop.name='POST_FINITE_DESK_EDGE';
 const folds=new THREE.Group();folds.name='DISTANCE_HINGED_PAPER';folds.position.set(4.1,.03,-1.65);root.add(folds);
 const hinges=[-1,1].map(side=>{const h=new THREE.Group();h.position.x=side*.32;folds.add(h);const face=box(2.05,.035,2.2,fabric,h,side*1.025,0,0,.012);face.name=side<0?'COUNTRY_FOLD_KOREA':'COUNTRY_FOLD_DOMINICANA';box(.018,.045,2.15,bronze,h,side*2.03,.015,0);return h;});
 const foldTab=box(.26,.025,.45,paper,folds,2.24,.045,.35,.012);foldTab.name='DISTANCE_INVITATION_TAB';
 const localRig=createLocalEventRig(root,onInvalidate);localRig.root.position.set(1.55,.04,.3);
 const desk=new THREE.Group();desk.name='LETTER_WRITING_DESK';desk.position.copy(LETTER);root.add(desk);
 // The same low writing pad sits under the preview envelope and the opened letter.
 box(3.1,.045,2.4,edge,desk,0,.012,-.25,.02);
 const pen=mesh(new THREE.CylinderGeometry(.027,.027,1.2,12),bronze,desk,1.25,.065,.6);pen.rotation.set(Math.PI/2,0,-.35);
 // The original approved pixels return as a cutout, without a wooden backing board.
 const portraitMaterial=new THREE.MeshBasicMaterial({map:texture('/images/approved-couple-room/approved-character-reference.png'),alphaMap:texture('/images/approved-couple-room/character-opacity-mask.png',1,1,false),alphaTest:.5,toneMapped:false,side:THREE.DoubleSide});materials.add(portraitMaterial);
 const portrait=mesh(new THREE.PlaneGeometry(3.5,3.197),portraitMaterial,root,3.6,1.54,-2.35,false);portrait.name='ENDING_APPROVED_PORTRAIT_PRINT';
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;
 const shadowContext=shadowCanvas.getContext('2d');
 if(shadowContext){const gradient=shadowContext.createRadialGradient(64,64,4,64,64,64);gradient.addColorStop(0,'#0008');gradient.addColorStop(.5,'#0004');gradient.addColorStop(1,'#0000');shadowContext.fillStyle=gradient;shadowContext.fillRect(0,0,128,128);}
 const shadowTexture=new THREE.CanvasTexture(shadowCanvas);textures.add(shadowTexture);
 const shadowMaterial=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,toneMapped:false});materials.add(shadowMaterial);
 const contact=mesh(new THREE.PlaneGeometry(4.1,1),shadowMaterial,root,2.8,.006,-2.8,false);contact.rotation.x=-Math.PI/2;

 const fill=new THREE.HemisphereLight('#eee1da','#181823',.8);root.add(fill);
 const key=new THREE.DirectionalLight('#f7eff0',2.3);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-13,right:13,top:11,bottom:-11,near:1,far:45});key.shadow.camera.updateProjectionMatrix();key.shadow.bias=-.00025;key.shadow.normalBias=.008;key.shadow.intensity=.55;key.shadow.radius=4;root.add(key,key.target);
 const cool=new THREE.DirectionalLight('#b9c4df',.6);cool.position.set(4,6,-5);root.add(cool);
 const eye=new THREE.Vector3(),target=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3(),background=new THREE.Color('#13141c');
 let lastSurfaceProgress=NaN,eventWeight=0,eventFrom=0,eventTarget=0,eventStart=0;
 const output={eye,target,fov:38,galleryScale:.65,galleryDisplayId:undefined as string|undefined,galleryStoryFocus:0,galleryAnchor:GALLERY.clone().add(OFFSET),letterAnchor:LETTER.clone().add(OFFSET),letterScale:1,roomExit:0,roomDesk:0,background,needsFrame:false};
 return{root,update(frame:PostCompositionFrame){
  if(disposed)return output;
  const p=THREE.MathUtils.clamp(frame.progress,0,1),bridge=THREE.MathUtils.clamp(frame.bridge,0,1);root.visible=bridge>.001;
  const index=Math.max(0,Math.min(poses.length-2,poses.findIndex((pose,i)=>i<poses.length-1&&p>=pose.p&&p<=poses[i+1].p))),from=poses[index],to=poses[index+1],t=range(from.p,to.p,p);
  eye.fromArray(from.eye).lerp(a.fromArray(to.eye),t);target.fromArray(from.target).lerp(b.fromArray(to.target),t);
  const activeToy=Boolean(frame.localEvent?.active)&&(p<.43||p>=.56&&p<.70||p>=.94);
  const nextEventTarget=activeToy?1:0;
  if(nextEventTarget!==eventTarget){eventFrom=eventWeight;eventTarget=nextEventTarget;eventStart=frame.time;}
  eventWeight=frame.reducedMotion?eventTarget:THREE.MathUtils.lerp(eventFrom,eventTarget,range(0,.28,frame.time-eventStart));
  const toyPositions:Record<string,[number,number,number]>={L01:[.95,.55,.9],L04:[3.15,.7,0],L06:[5.35,.55,.8],L15:p>=.94?[5.65,.55,2.1]:[2.75,.55,-.4]};
  const focus=toyPositions[frame.localEvent?.active??'']??[1.55,.65,.3];
  // The controls occupy the left third; move the eye toward the chosen physical object's right side.
  eye.lerp(a.set(focus[0]-2.3,3.0,focus[2]+5.8),eventWeight);target.lerp(b.set(focus[0]-.75,focus[1],focus[2]),eventWeight);
  const settle=range(.18,.30,p),galleryDeparture=range(.55,.64,p);
  output.galleryStoryFocus=0;output.galleryDisplayId=undefined;
  desk.position.copy(LETTER);
  portrait.visible=p>=.945;contact.visible=portrait.visible;
  portrait.position.set(3.3,1.54,-1.9);contact.position.set(3.3,.006,-1.9);contact.scale.set(.8,.8,1);
  folds.visible=p<.30;hinges[0].rotation.z=(1-settle)*-.62;hinges[1].rotation.z=(1-settle)*.62;
  folds.position.y=.03+(1-settle)*.15;
  surface.visible=tabletop.visible=true;surface.scale.x=tabletop.scale.x=.55+settle*.45;surface.position.x=tabletop.position.x=4.1-settle*2.4;
  if(p!==lastSurfaceProgress){lastSurfaceProgress=p;for(let i=0;i<surfacePositions.count;i++){
   const x=surfaceBase[i*3],z=surfaceBase[i*3+2];
   const curl=(1-settle)*.16*Math.pow(Math.max(0,Math.abs(x)-3.6),2)*Math.exp(-Math.pow((z+.8)/1.8,2));
   surfacePositions.setXYZ(i,x,curl-.012,z);
  }surfacePositions.needsUpdate=true;surfaceGeometry.computeVertexNormals();}
  const invitationView=range(.55,.62,p)*(1-range(.70,.78,p));
  eye.x+=.6*invitationView;target.x+=.6*invitationView;
  eye.sub(target).multiplyScalar(1+.08*invitationView).add(target);
  const contain=frame.width>=760?Math.max(1,(16/9)/(frame.width/Math.max(1,frame.height))):1;
  eye.sub(target).multiplyScalar(contain).add(target);
  eye.add(root.position);target.add(root.position);
  output.galleryAnchor.copy(GALLERY).add(root.position);output.galleryAnchor.x-=18*galleryDeparture;output.galleryAnchor.z-=4*galleryDeparture;output.galleryAnchor.y+=(4.5*settle-2.4*(1-settle));output.letterAnchor.copy(LETTER).add(root.position);output.letterAnchor.x=desk.position.x+root.position.x;
  const letter=range(.55,.62,p),ending=range(.94,1,p);a.set(3,.3,0).lerp(LETTER,letter).lerp(b.set(4.6,1,-.3),ending);key.target.position.copy(a);key.position.copy(a).add(b.set(-6,11,7));key.intensity=2.3*bridge;fill.intensity=.8*bridge;cool.intensity=.6*bridge;
  const isEnding=p>=.94,overview=p>=.24&&p<.56||isEnding;
  output.needsFrame=frame.localEvent?localRig.update(frame.localEvent,frame.time*1000,frame.reducedMotion,isEnding?'ending':'tabletop'):false;
  localRig.root.visible=overview||activeToy;
  localRig.root.position.set(1.55,.04,.3);localRig.root.scale.setScalar(1);
  output.needsFrame ||=Math.abs(eventWeight-eventTarget)>.0001;
  output.fov=38;output.roomDesk=bridge;output.roomExit=0;return output;
 },dispose(){if(disposed)return;disposed=true;localRig.dispose();root.removeFromParent();geometries.forEach(item=>item.dispose());materials.forEach(item=>item.dispose());textures.forEach(item=>item.dispose());key.shadow.map?.dispose();}};
}

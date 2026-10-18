import * as THREE from 'three';
import {createLocalEventRig,type LocalEventState} from '../../post-hero-preview/src/LocalEventRig';
import {createLetterRoses} from '../../post-hero-preview/src/LetterRoses';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type PostCompositionFrame={progress:number;bridge:number;galleryWeight:number;opening:number;time:number;reducedMotion:boolean;width:number;height:number;roomEye:THREE.Vector3;roomTarget:THREE.Vector3;effect?:{name:string;value:number;nonce:number};localEvent?:LocalEventState};
export type RoomHandoffDraft={eye:THREE.Vector3;target:THREE.Vector3;fov:number;scale:number;floor:number;bounds:THREE.Box3;exit:{eye:THREE.Vector3;target:THREE.Vector3;floor:THREE.Vector3;progress:number}};
const range=(a:number,b:number,p:number)=>THREE.MathUtils.smoothstep(p,a,b);
// Stage-local poses; the room owner chooses the shared transform after room approval.
const OFFSET=new THREE.Vector3(9,-4.3,-10);
const GALLERY=new THREE.Vector3(-7,-.007,-4.3),STORY_GALLERY=new THREE.Vector3(-1.6,-.007,-4.3),LETTER=new THREE.Vector3(6.2,-.007,.15);
const poses=[
 {p:0,eye:[0,2.2,7.0],target:[.7,1.55,-.4]},
 {p:.14,eye:[.35,2,6.3],target:[.9,1.5,-.8]},
 {p:.28,eye:[0,3.2,8.7],target:[1.3,.7,-1]},
 {p:.35,eye:[0,3.2,8.7],target:[1.3,.7,-1]},
 {p:.45,eye:[-7,4.493,7.3],target:[-7,4.493,-4.3]},
 {p:.55,eye:[-7,4.493,7.3],target:[-7,4.493,-4.3]},
 {p:.62,eye:[-1,2.6,9],target:[1.1,1.15,0]},
 {p:.78,eye:[3.5,2.4,3.5],target:[6.2,1.4,.15]},
 {p:.84,eye:[3.4,1.6,3],target:[6.2,1.6,.15]},
 {p:.94,eye:[3.4,1.6,3],target:[6.2,1.6,.15]},
 {p:1,eye:[1.2,3.1,10.2],target:[3.05,1.45,-.3]},
];

/** Renderer-free, open studio stages: no foreground walls or ceiling between eye and content. */
export function createPostHeroComposition(scene:THREE.Scene,onInvalidate:()=>void=()=>{}){
 const root=new THREE.Group();root.name='POST_HERO_ARCHITECTURE';root.position.copy(OFFSET);root.visible=false;scene.add(root);
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
 let disposed=false;
 const loader=new THREE.TextureLoader();
 function texture(path:string,x=1,y=1,color=true){const map=loader.load(path,()=>{if(!disposed)onInvalidate();});map.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(x,y);map.anisotropy=4;textures.add(map);return map;}
 function material(options:THREE.MeshStandardMaterialParameters){const result=new THREE.MeshStandardMaterial(options);materials.add(result);return result;}
  const oak=material({color:'#34252c',roughness:.75});
 const edge=material({color:'#513942',roughness:.75});
 const nightSurface=new THREE.Color('#171822'),daySurface=new THREE.Color('#171822'),nightBackground=new THREE.Color('#13141c'),dayBackground=new THREE.Color('#0c080e'),galleryLight={value:0};
 const fabric=material({color:'#171822',bumpMap:texture('/images/approved-couple-room/burgundy-plaster-material.png',12,12,false),bumpScale:.008,roughness:.94,side:THREE.DoubleSide});
 // A material-only distance veil joins the broad sheet to the ink background without a hard horizon.
 fabric.onBeforeCompile=shader=>{
  shader.uniforms.postGalleryLight=galleryLight;
  shader.vertexShader='varying vec3 vPostLocal;\n'+shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvPostLocal=transformed;');
  shader.fragmentShader='uniform float postGalleryLight;\n'+'varying vec3 vPostLocal;\n'+shader.fragmentShader.replace('#include <colorspace_fragment>','#include <colorspace_fragment>\nfloat postVeil=smoothstep(10.0,24.0,length(vPostLocal.xz));\ngl_FragColor.rgb=mix(gl_FragColor.rgb,mix(vec3(0.07451,0.07843,0.10980),vec3(0.04706,0.03137,0.05490),postGalleryLight),postVeil);');
 };
 const paper=material({color:'#e9d9bf',roughness:.94,side:THREE.DoubleSide});
 const bronze=material({color:'#c1987f',roughness:.43,metalness:1});
 function mesh(g:THREE.BufferGeometry,m:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0,shadow=true){geometries.add(g);const object=new THREE.Mesh(g,m);object.position.set(x,y,z);object.castShadow=shadow;object.receiveShadow=true;parent.add(object);return object;}
 function box(w:number,h:number,d:number,m:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0,bevel=0){return mesh(bevel?new RoundedBoxGeometry(w,h,d,2,Math.min(bevel,w/3,h/3,d/3)):new THREE.BoxGeometry(w,h,d),m,parent,x,y,z);}
 // One broad sheet carries all props; its distant edge stays behind the camera's horizon.
 const surfaceGeometry=new THREE.PlaneGeometry(1,1,192,128);surfaceGeometry.rotateX(-Math.PI/2);
 const surface=mesh(surfaceGeometry,fabric,root,0,0,0,false);surface.name='POST_SHARED_FOLDING_SURFACE';
 const surfacePositions=surfaceGeometry.getAttribute('position'),surfaceBase=surfacePositions.array.slice();
 const localRig=createLocalEventRig(root,onInvalidate);localRig.root.position.set(-1.6,.04,.6);localRig.root.scale.setScalar(.85);
 const desk=new THREE.Group();desk.name='LETTER_WRITING_DESK';desk.position.set(6.2,0,.15);root.add(desk);
 box(3.4,.09,3.3,oak,desk,0,-.085,0,.035);
 const roses=createLetterRoses(onInvalidate);roses.root.position.copy(LETTER);root.add(roses.root);
 const pen=mesh(new THREE.CylinderGeometry(.035,.035,1.3,12),bronze,desk,1.25,.025,.25);pen.rotation.set(Math.PI/2,0,-.35);
 const bridgeToy=new THREE.Group();bridgeToy.name='PAPER_BRIDGE_TOY';bridgeToy.position.set(-1.1,.06,.9);desk.add(bridgeToy);
 const bridgePieces=[-1,0,1].map(value=>box(.34,.025,.35,paper,bridgeToy,value*.33,0,0,.01));
 const pocket=new THREE.Group();pocket.name='PAPER_POCKET_TOY';pocket.position.set(1.15,.06,-.6);desk.add(pocket);box(.75,.025,.55,paper,pocket);
 const pocketFlap=new THREE.Group();pocketFlap.position.z=-.28;pocket.add(pocketFlap);box(.75,.02,.55,paper,pocketFlap,0,0,.275);
 const balanceReward=new THREE.Group();balanceReward.name='BALANCE_REWARD_TOY';balanceReward.position.set(-1.2,.12,-.6);desk.add(balanceReward);for(const x of [-.18,0,.18])mesh(new THREE.SphereGeometry(.055,12,8),bronze,balanceReward,x,0,0);
 let connected=false,pocketOpen=false,settled=false;
 // The original approved pixels return as a cutout, without a wooden backing board.
 const portraitMaterial=new THREE.MeshBasicMaterial({map:texture('/images/approved-couple-room/approved-character-reference.png'),alphaMap:texture('/images/approved-couple-room/character-opacity-mask.png',1,1,false),alphaTest:.5,toneMapped:false,side:THREE.DoubleSide});materials.add(portraitMaterial);
 const portrait=mesh(new THREE.PlaneGeometry(4.27,3.9),portraitMaterial,root,2.8,1.95,-2.8,false);portrait.name='ENDING_APPROVED_PORTRAIT_PRINT';
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
  const galleryDistance=.65*9.6*frame.height/Math.max(390,frame.height-500);
  if(p>=.45&&p<=.55){eye.set(-7,4.493,-4.3+galleryDistance);target.set(-7,4.493,-4.3);}
  eye.lerp(a.set(-7,4.493,-4.3+galleryDistance),frame.galleryWeight);target.lerp(b.set(-7,4.493,-4.3),frame.galleryWeight);
  galleryLight.value=frame.galleryWeight;fabric.color.lerpColors(nightSurface,daySurface,frame.galleryWeight);background.lerpColors(nightBackground,dayBackground,frame.galleryWeight);
  const nextEventTarget=frame.localEvent?.active&&p<.62?1:0;
  if(nextEventTarget!==eventTarget){eventFrom=eventWeight;eventTarget=nextEventTarget;eventStart=frame.time;}
  eventWeight=frame.reducedMotion||p>=.62?eventTarget:THREE.MathUtils.lerp(eventFrom,eventTarget,range(0,.28,frame.time-eventStart));
  eye.lerp(a.set(-1.6,2.8,6.4),eventWeight);target.lerp(b.set(-1.6,.9,.6),eventWeight);
  const settle=range(.28,.45,p);
  const letterArrival=range(.42,.58,p),galleryDeparture=range(.55,.64,p)*(1-frame.galleryWeight);
  // The writing desk enters from beyond the story camera; the game table recedes to its left.
  desk.position.x=LETTER.x+8*(1-letterArrival);
  const storyFocus=range(.20,.24,p)*(1-range(.35,.40,p))*(1-frame.galleryWeight);
  output.galleryStoryFocus=storyFocus;output.galleryDisplayId=storyFocus>0?'catchmind':undefined;
  // The mask's last opaque row is 1164/1199: align its shoes, not the transparent quad, with the sheet.
  portrait.position.x=THREE.MathUtils.lerp(2.8,4.9,storyFocus);portrait.position.z=THREE.MathUtils.lerp(-2.8,1,storyFocus);portrait.scale.setScalar(1-.44*storyFocus);portrait.position.y=(1.95-.114)*portrait.scale.x+.035;
  contact.position.x=portrait.position.x;contact.position.z=portrait.position.z+.025;contact.scale.set(portrait.scale.x,portrait.scale.x,1);
  if(p!==lastSurfaceProgress){lastSurfaceProgress=p;for(let i=0;i<surfacePositions.count;i++){
   const u=surfaceBase[i*3]*2,v=surfaceBase[i*3+2]*2,x=u*35,z=v*32-10;
   // The occupied stage stays level; one continuous curved back carries the room-to-table turn.
   const back=Math.max(0,-z-12);
   const perimeter=(1-settle)*.12*Math.exp(-Math.pow((x+10)/2.8,2))*Math.exp(-Math.pow((z+2)/5,2));
   surfacePositions.setXYZ(i,x,back*back*.045+perimeter-.012,z);
  }surfacePositions.needsUpdate=true;surfaceGeometry.computeVertexNormals();}
  roses.root.position.x=desk.position.x;roses.root.visible=p>=.57;roses.root.rotation.y=-.777*range(.55,.78,p)*(1-range(.94,1,p));roses.update(frame.opening);
  const invitationView=range(.55,.62,p)*(1-range(.70,.78,p));
  eye.x+=.6*invitationView;target.x+=.6*invitationView;
  eye.sub(target).multiplyScalar(1+.08*invitationView).add(target);
  const contain=frame.width>=760?Math.max(1,(16/9)/(frame.width/Math.max(1,frame.height))):1;
  eye.sub(target).multiplyScalar(contain).add(target);
  eye.add(root.position);target.add(root.position);
  output.galleryAnchor.copy(GALLERY).lerp(STORY_GALLERY,storyFocus).add(root.position);output.galleryAnchor.x-=18*galleryDeparture;output.galleryAnchor.z-=4*galleryDeparture;output.galleryAnchor.y+=(4.5*settle-2.4*(1-settle))*(1-storyFocus);output.letterAnchor.copy(LETTER).add(root.position);output.letterAnchor.x=desk.position.x+root.position.x;
  if(frame.effect?.name==='paper-bridge')connected=frame.effect.value>0;if(frame.effect?.name==='paper-pocket')pocketOpen=frame.effect.value>0;if(frame.effect?.name==='balance-settled')settled=frame.effect.value>0;
  bridgeToy.visible=connected;pocket.visible=pocketOpen;
  bridgePieces.forEach((piece,i)=>{piece.rotation.y=connected?0:(i-1)*.45;piece.position.y=connected?0:Math.abs(i-1)*.025;});pocketFlap.rotation.x=pocketOpen?-Math.PI*.72:0;balanceReward.visible=settled;
  const letter=range(.55,.62,p)*(1-frame.galleryWeight),ending=range(.94,1,p);a.copy(GALLERY).lerp(LETTER,letter).lerp(b.set(4,1,-1),ending);key.target.position.copy(a);key.position.copy(a).add(b.set(-6,11,7));key.intensity=2.3*bridge;fill.intensity=.8*bridge;cool.intensity=.6*bridge;
  output.needsFrame=frame.localEvent?localRig.update(frame.localEvent,frame.time*1000,frame.reducedMotion):false;
    const activeToy=Boolean(frame.localEvent?.active)&&p<.62;
  const storedDecor=Boolean(frame.localEvent?.hasSavedDecor);
  localRig.root.visible=activeToy||storedDecor&&(p>=.4&&p<=.55||p>=.94);
  if(activeToy)localRig.root.position.set(-1.6,.04,.6);
  else localRig.root.position.set(p>=.94?1.2:GALLERY.x+1.8,.04,p>=.94?1:1.4);
  localRig.root.scale.setScalar(.85);
  output.needsFrame ||=Math.abs(eventWeight-eventTarget)>.0001;
  output.fov=38;output.roomDesk=bridge;output.roomExit=0;return output;
 },dispose(){if(disposed)return;disposed=true;localRig.dispose();roses.dispose();root.removeFromParent();geometries.forEach(item=>item.dispose());materials.forEach(item=>item.dispose());textures.forEach(item=>item.dispose());key.shadow.map?.dispose();}};
}

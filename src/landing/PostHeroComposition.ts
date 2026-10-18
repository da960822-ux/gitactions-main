import * as THREE from 'three';
import {createLetterRoses} from '../../post-hero-preview/src/LetterRoses';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type PostCompositionFrame={progress:number;bridge:number;galleryWeight:number;opening:number;time:number;reducedMotion:boolean;width:number;height:number;roomEye:THREE.Vector3;roomTarget:THREE.Vector3;effect?:{name:string;value:number;nonce:number}};
export type RoomHandoffDraft={eye:THREE.Vector3;target:THREE.Vector3;fov:number;scale:number;floor:number;bounds:THREE.Box3;exit:{eye:THREE.Vector3;target:THREE.Vector3;floor:THREE.Vector3;progress:number}};
const range=(a:number,b:number,p:number)=>THREE.MathUtils.smoothstep(p,a,b);
// Stage-local poses; the room owner chooses the shared transform after room approval.
const OFFSET=new THREE.Vector3(14,0,-31);
const GALLERY=new THREE.Vector3(0,0,0),LETTER=new THREE.Vector3(30,1,-8);
const poses=[
 {p:0,eye:[-5.2,4.4,16],target:[-2,1.6,0]},
 {p:.28,eye:[-3.8,4.2,15],target:[-1,1.4,0]},
 {p:.45,eye:[0,5.3,14],target:[0,1.2,1.3]},
 {p:.55,eye:[0,5.3,14],target:[0,1.2,1.3]},
 {p:.62,eye:[26.8,4.2,4],target:[28.1,2.3,-8]},
 {p:.78,eye:[26.8,4.2,4],target:[28.1,2.3,-8]},
 {p:.84,eye:[30,4.1,4.7],target:[30,2.6,-8]},
 {p:.94,eye:[30,4.1,4.7],target:[30,2.6,-8]},
 {p:1,eye:[23,6.8,13],target:[28,2.7,-8]},
];

/** Renderer-free, open studio stages: no foreground walls or ceiling between eye and content. */
export function createPostHeroComposition(scene:THREE.Scene){
 const root=new THREE.Group();root.name='POST_HERO_ARCHITECTURE';root.position.copy(OFFSET);root.visible=false;scene.add(root);
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
 const loader=new THREE.TextureLoader();
 function texture(path:string,x=1,y=1,color=true){const map=loader.load(path);map.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(x,y);map.anisotropy=4;textures.add(map);return map;}
 function material(options:THREE.MeshStandardMaterialParameters){const result=new THREE.MeshStandardMaterial(options);materials.add(result);return result;}
 const plaster=material({color:'#72616a',map:texture('/images/approved-couple-room/warm-plaster-material.png',12,4),roughness:.94});
 const oak=material({color:'#b99379',map:texture('/images/approved-couple-room/honeywood-material.png',2,1),roughness:.66});
 const edge=material({color:'#513942',roughness:.75});
 const fabric=material({color:'#723a50',map:texture('/images/approved-couple-room/burgundy-plaster-material.png',3,2),roughness:.78,side:THREE.DoubleSide});
 const paper=material({color:'#e9d9bf',roughness:.94,side:THREE.DoubleSide});
 const bronze=material({color:'#c1987f',roughness:.43,metalness:1});
 function mesh(g:THREE.BufferGeometry,m:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0,shadow=true){geometries.add(g);const object=new THREE.Mesh(g,m);object.position.set(x,y,z);object.castShadow=shadow;object.receiveShadow=true;parent.add(object);return object;}
 function box(w:number,h:number,d:number,m:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0,bevel=0){return mesh(bevel?new RoundedBoxGeometry(w,h,d,2,Math.min(bevel,w/3,h/3,d/3)):new THREE.BoxGeometry(w,h,d),m,parent,x,y,z);}
 // One swept floor-to-backdrop surface gives all three places the same horizon and material.
 const cross:Array<[number,number]>=[[24,-.06],[-20,-.06]];
 for(let i=1;i<=24;i++){const t=i/24*Math.PI/2;cross.push([-20-Math.sin(t)*6,6-Math.cos(t)*6-.06]);}
 cross.push([-26,22]);
 const vertices:number[]=[],uvs:number[]=[],indices:number[]=[];
 cross.forEach(([z,y],i)=>{vertices.push(-35,y,z,95,y,z);uvs.push(0,i/(cross.length-1),1,i/(cross.length-1));if(i<cross.length-1){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}});
 const coveGeometry=new THREE.BufferGeometry();coveGeometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));coveGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));coveGeometry.setIndex(indices);coveGeometry.computeVertexNormals();
 const cove=mesh(coveGeometry,plaster,root,0,0,0,false);cove.name='POST_CONTINUOUS_CYCLORAMA';
 // The same indexed sheet settles as gallery floor, then becomes the letter's writing surface.
 const surfaceGeometry=new THREE.PlaneGeometry(1,1,64,32);surfaceGeometry.rotateX(-Math.PI/2);
 const surface=mesh(surfaceGeometry,fabric,root,0,0,0,false);surface.name='POST_SHARED_FOLDING_SURFACE';
 const surfacePositions=surfaceGeometry.getAttribute('position'),surfaceBase=surfacePositions.array.slice();
 const desk=new THREE.Group();desk.name='LETTER_WRITING_DESK';desk.position.set(30,0,-8);root.add(desk);
 box(7,.16,3.5,oak,desk,0,.9,0,.07);box(7,.045,3.5,edge,desk,0,.79,0,.03);
 for(const x of [-3,3])for(const z of [-1.35,1.35])box(.09,.74,.09,bronze,desk,x,.37,z,.025);
 const roses=createLetterRoses();roses.root.position.copy(LETTER).setY(0);root.add(roses.root);
 const pen=mesh(new THREE.CylinderGeometry(.035,.035,1.3,12),bronze,desk,2.5,1.03,.25);pen.rotation.set(Math.PI/2,0,-.35);
 const bridgeToy=new THREE.Group();bridgeToy.name='PAPER_BRIDGE_TOY';bridgeToy.position.set(-2.25,1.01,.6);desk.add(bridgeToy);
 const bridgePieces=[-1,0,1].map(value=>box(.34,.025,.35,paper,bridgeToy,value*.33,0,0,.01));
 const pocket=new THREE.Group();pocket.name='PAPER_POCKET_TOY';pocket.position.set(2.1,1.01,-.6);desk.add(pocket);box(.75,.025,.55,paper,pocket);
 const pocketFlap=new THREE.Group();pocketFlap.position.z=-.28;pocket.add(pocketFlap);box(.75,.02,.55,paper,pocketFlap,0,0,.275);
 const balanceReward=new THREE.Group();balanceReward.name='BALANCE_REWARD_TOY';balanceReward.position.set(-2.25,1.08,-.6);desk.add(balanceReward);for(const x of [-.18,0,.18])mesh(new THREE.SphereGeometry(.055,12,8),bronze,balanceReward,x,0,0);
 let connected=false,pocketOpen=false,settled=false;
 // The original approved pixels return as a cutout, without a wooden backing board.
 const portraitMaterial=new THREE.MeshBasicMaterial({map:texture('/images/approved-couple-room/approved-character-reference.png'),alphaMap:texture('/images/approved-couple-room/character-opacity-mask.png',1,1,false),alphaTest:.5,toneMapped:false,side:THREE.DoubleSide});materials.add(portraitMaterial);
 const portrait=mesh(new THREE.PlaneGeometry(7.4,7.4*1199/1312),portraitMaterial,root,35,3.4,-15,false);portrait.name='ENDING_APPROVED_PORTRAIT_PRINT';
 const fill=new THREE.HemisphereLight('#eee1da','#665264',1.35);root.add(fill);
 const key=new THREE.DirectionalLight('#ffe8d2',2.3);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-13,right:13,top:11,bottom:-11,near:1,far:45});key.shadow.camera.updateProjectionMatrix();key.shadow.bias=-.00025;key.shadow.normalBias=.025;key.shadow.intensity=.55;key.shadow.radius=4;root.add(key,key.target);
 const cool=new THREE.DirectionalLight('#b9c4df',.6);cool.position.set(25,8,-12);root.add(cool);
 const eye=new THREE.Vector3(),target=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3(),background=new THREE.Color('#685761');
 let lastSurfaceProgress=NaN;
 const output={eye,target,fov:48,galleryAnchor:GALLERY.clone().add(OFFSET),letterAnchor:LETTER.clone().add(OFFSET),letterScale:2,roomExit:0,roomDesk:0,background};
 return{root,update(frame:PostCompositionFrame){
  const p=THREE.MathUtils.clamp(frame.progress,0,1),bridge=THREE.MathUtils.clamp(frame.bridge,0,1);root.visible=bridge>.001;
  const index=Math.max(0,Math.min(poses.length-2,poses.findIndex((pose,i)=>i<poses.length-1&&p>=pose.p&&p<=poses[i+1].p))),from=poses[index],to=poses[index+1],t=range(from.p,to.p,p);
  eye.fromArray(from.eye).lerp(a.fromArray(to.eye),t);target.fromArray(from.target).lerp(b.fromArray(to.target),t);
  eye.lerp(a.set(0,5.3,14),frame.galleryWeight);target.lerp(b.set(0,1.2,1.3),frame.galleryWeight);
  const settle=range(.28,.45,p),travel=range(.55,.62,p);
  if(p!==lastSurfaceProgress){lastSurfaceProgress=p;for(let i=0;i<surfacePositions.count;i++){const u=surfaceBase[i*3]*2,v=surfaceBase[i*3+2]*2;const x=u*THREE.MathUtils.lerp(11,3.5,travel)*Math.sqrt(1-.12*v*v),z=v*THREE.MathUtils.lerp(7,1.75,travel)*Math.sqrt(1-.12*u*u);const fold=(1-settle)*2.2*Math.exp(-Math.pow((Math.abs(u)-.68)*6,2))*(1-v*v);surfacePositions.setXYZ(i,x,fold,z);}
  surfacePositions.needsUpdate=true;surfaceGeometry.computeVertexNormals();surface.position.set(30*travel,THREE.MathUtils.lerp(-.02,.99,travel),THREE.MathUtils.lerp(1,-8,travel));}roses.update(frame.opening);
  eye.add(root.position);target.add(root.position);
  output.galleryAnchor.copy(GALLERY).add(root.position);output.letterAnchor.copy(LETTER).add(root.position);
  if(frame.effect?.name==='paper-bridge')connected=frame.effect.value>0;if(frame.effect?.name==='paper-pocket')pocketOpen=frame.effect.value>0;if(frame.effect?.name==='balance-settled')settled=frame.effect.value>0;
  bridgePieces.forEach((piece,i)=>{piece.rotation.y=connected?0:(i-1)*.45;piece.position.y=connected?0:Math.abs(i-1)*.025;});pocketFlap.rotation.x=pocketOpen?-Math.PI*.72:0;balanceReward.visible=settled;
  const letter=range(.55,.62,p)*(1-frame.galleryWeight),ending=range(.94,1,p);a.copy(GALLERY).lerp(LETTER,letter).lerp(b.set(32,1,-8),ending);key.target.position.copy(a);key.position.copy(a).add(b.set(-6,11,7));key.intensity=2.3*bridge;fill.intensity=1.35*bridge;cool.intensity=.6*bridge;
  output.fov=48;output.roomDesk=bridge;output.roomExit=0;return output;
 },dispose(){roses.dispose();root.removeFromParent();geometries.forEach(item=>item.dispose());materials.forEach(item=>item.dispose());textures.forEach(item=>item.dispose());key.shadow.map?.dispose();}};
}

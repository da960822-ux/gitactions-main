import * as THREE from 'three';
import {LETTER_UNFOLDED} from './interaction';
import type {LetterFinalePhase} from '../../src/landing/letterFinaleState';

export type LetterPaperPose = {corners:Array<{x:number;y:number}>;visible:boolean};
export type LetterFrame = {opening:number;progress:number;width:number;height:number;paperAspect?:number;letterView?:LetterFinalePhase;ownCamera?:boolean;reducedMotion?:boolean;onPaperPose?:(pose:LetterPaperPose)=>void;effect?:{name:string;value:number;nonce:number}};

const ease=(a:number,b:number,value:number)=>{const t=THREE.MathUtils.clamp((value-a)/(b-a),0,1);return t*t*(3-2*t);};

// The host owns the renderer, room, lighting, camera timeline and frame clock.
export function createLetterCollection(options:{scene:THREE.Scene;camera:THREE.PerspectiveCamera;host?:HTMLElement},initialState?:LetterFrame){
 const {camera}=options;
 const scene=new THREE.Group();scene.name='letter-collection';options.scene.add(scene);
 let disposed=false;
 let latest:LetterFrame=initialState??{opening:0,progress:0,width:1,height:1};
 const position=new THREE.Vector3(0,1.3,6.2),target=new THREE.Vector3(0,1.3,0);
    const paper = new THREE.MeshStandardMaterial({ color: 0xf4e8d2, roughness: .94, emissive:0x503524, emissiveIntensity:.12, side: THREE.DoubleSide });
    const cream = new THREE.MeshStandardMaterial({ color: 0xeddfc6, roughness: .96, emissive:0x38271b, emissiveIntensity:.08, side: THREE.DoubleSide });
    const crease = new THREE.MeshStandardMaterial({color:0xb39a82,roughness:.96});
    const gold = new THREE.MeshStandardMaterial({ color: 0xd7a18f, metalness: .8, roughness: .46 });
    const burgundy = new THREE.MeshStandardMaterial({ color: 0x35101f, roughness: .85, metalness: .08, side: THREE.DoubleSide });
    const waxMat = new THREE.MeshStandardMaterial({ color: 0x8c253f, roughness: .34, metalness: .12 });
    function mesh(g: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Object3D, x=0, y=0, z=0) {
      const object = new THREE.Mesh(g,m); object.position.set(x,y,z);
      object.castShadow = true; object.receiveShadow = false; parent.add(object); return object;
    }
    function box(w:number,h:number,d:number,m:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0) {
      return mesh(new THREE.BoxGeometry(w,h,d),m,parent,x,y,z);
    }
    function polygon(points:number[][], m:THREE.Material, parent:THREE.Object3D,z:number) {
      const shape = new THREE.Shape(); points.forEach(([x,y],i)=>i ? shape.lineTo(x,y) : shape.moveTo(x,y)); shape.closePath();
      return mesh(new THREE.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:false}),m,parent,0,0,z);
    }
    const envelope = new THREE.Group(); envelope.name='letter-envelope'; scene.add(envelope);
    const shell=new THREE.Group();shell.name='letter-envelope-shell';envelope.add(shell);
    box(2.05,1.35,.025,paper,shell,0,.675,-.055).name='letter-back';
    box(1.96,1.28,.012,burgundy,shell,0,.68,-.035).name='letter-burgundy-liner';
    box(.035,1.35,.11,cream,shell,-1.01,.675,0);
    box(.035,1.35,.11,cream,shell,1.01,.675,0);
    box(2.05,.04,.11,cream,shell,0,.02,0);
    // The front folds sit in front of the insert, so extraction reveals real depth.
    polygon([[-1.025,0],[-1.025,1.35],[.22,.42]],paper,shell,.055);
    polygon([[1.025,0],[1.025,1.35],[-.22,.42]],paper,shell,.06);
    polygon([[-1.025,0],[1.025,0],[1.025,.12],[0,.91],[-1.025,.12]],cream,shell,.075);
    const flap = new THREE.Group();flap.name='letter-flap'; flap.position.set(0,1.35,.085); shell.add(flap);
    polygon([[-1.025,0],[1.025,0],[0,-.96]],paper,flap,0);
    polygon([[-.95,-.04],[.95,-.04],[0,-.88]],cream,flap,-.015);
    // A real raised fold edge keeps the sealed flap legible under the shared soft light.
    const flapCrease=new THREE.Group();flapCrease.name='letter-flap-crease';flap.add(flapCrease);
    for(const x of [-1.025,1.025]){
      const curve=new THREE.LineCurve3(new THREE.Vector3(x,-.006,.014),new THREE.Vector3(0,-.96,.014));
      mesh(new THREE.TubeGeometry(curve,1,.004,4,false),crease,flapCrease);
    }
    const foilCanvas=document.createElement('canvas'); foilCanvas.width=1024;foilCanvas.height=256;
    const foilContext=foilCanvas.getContext('2d');
    if(foilContext) {
      foilContext.clearRect(0,0,1024,256);
      foilContext.fillStyle='#bd8872';foilContext.font='italic 72px Georgia, serif';foilContext.textAlign='center';foilContext.textBaseline='middle';
      foilContext.fillText('For Lisbeth',512,128);
    }
    const foilTexture=new THREE.CanvasTexture(foilCanvas);foilTexture.colorSpace=THREE.SRGBColorSpace;
    const foilLabel=mesh(new THREE.PlaneGeometry(1.12,.28),new THREE.MeshBasicMaterial({map:foilTexture,transparent:true,depthWrite:false,toneMapped:false}),shell,0,.24,.093);
    foilLabel.castShadow=false;
    const seal = new THREE.Group();seal.name='letter-detached-seal'; seal.position.set(0,.48,.235); shell.add(seal);
    const wax = mesh(new THREE.CylinderGeometry(.155,.16,.035,40),waxMat,seal); wax.rotation.x=Math.PI/2;
    mesh(new THREE.TorusGeometry(.118,.008,6,40),gold,seal,0,0,.021);
    const heart = new THREE.Shape(); heart.moveTo(0,-.055); heart.bezierCurveTo(-.13,.025,-.06,.10,0,.045); heart.bezierCurveTo(.06,.10,.13,.025,0,-.055);
    const heartStamp=mesh(new THREE.ShapeGeometry(heart),gold,seal,0,0,.024);
    const initialsCanvas=document.createElement('canvas');initialsCanvas.width=256;initialsCanvas.height=256;
    const initialsContext=initialsCanvas.getContext('2d')!;initialsContext.fillStyle='#d7a18f';initialsContext.font='italic 108px Georgia,serif';initialsContext.textAlign='center';initialsContext.textBaseline='middle';initialsContext.fillText('YL',128,130);
    const initialsTexture=new THREE.CanvasTexture(initialsCanvas);initialsTexture.colorSpace=THREE.SRGBColorSpace;
    const initialsStamp=mesh(new THREE.PlaneGeometry(.21,.21),new THREE.MeshBasicMaterial({map:initialsTexture,transparent:true,depthWrite:false,toneMapped:false}),seal,0,0,.025);
    let heartSelected=false;
    const insert = new THREE.Group();insert.name='letter-insert'; insert.position.set(0,.55,0); envelope.add(insert);
    const panelH=.62;insert.userData.paper='unlettered physical insert; original copy belongs to the single DOM article';
    box(1.76,panelH,.018,paper,insert,0,0,0);
    const topFold=new THREE.Group();topFold.name='letter-top-fold'; topFold.position.y=panelH/2; insert.add(topFold);
    box(1.76,panelH,.018,paper,topFold,0,panelH/2,0);
    const bottomFold=new THREE.Group();bottomFold.name='letter-bottom-fold'; bottomFold.position.y=-panelH/2; insert.add(bottomFold);
    box(1.76,panelH,.018,paper,bottomFold,0,-panelH/2,0);
    for (const x of [-.81,.81]) box(.009,.51,.003,gold,insert,x,0,.012);
    box(1.62,.009,.003,gold,topFold,0,.55,.012);
    box(1.62,.009,.003,gold,bottomFold,0,-.55,.012);

 const paperFace=new THREE.MeshBasicMaterial({color:'#f4e8d2',side:THREE.DoubleSide,toneMapped:false});
 const paperFaces:Array<{mesh:THREE.Mesh;original:THREE.Material;flat:THREE.Material[]}>=[];
 scene.traverse(object=>{
  if(!(object instanceof THREE.Mesh)||object.material!==paper&&object.material!==cream)return;
  const original=object.material;
  if(object.geometry.type==='ExtrudeGeometry')paperFaces.push({mesh:object,original,flat:[paperFace,original]});
  else if(object.geometry.type==='BoxGeometry')paperFaces.push({mesh:object,original,flat:[original,original,original,original,paperFace,paperFace]});
 });
 function projectPaper(){
  if(disposed||!latest.onPaperPose)return;
  scene.updateWorldMatrix(true,true);camera.updateMatrixWorld(true);
  const bounds=options.host?.getBoundingClientRect()??{left:0,top:0};
  const corners=[[-.88,.93],[.88,.93],[.88,-.93],[-.88,-.93]].map(([x,y])=>{
   const point=insert.localToWorld(new THREE.Vector3(x,y,.015)).project(camera);
   return {x:bounds.left+(point.x+1)*latest.width/2,y:bounds.top+(1-point.y)*latest.height/2};
  });
  latest.onPaperPose({corners,visible:latest.letterView!=='rose'&&latest.progress>=.62&&(latest.progress<.86||latest.letterView==='folding')&&latest.opening>LETTER_UNFOLDED&&latest.width>=600&&(!latest.reducedMotion||latest.letterView==='folding')});
 }
 function update(frame:LetterFrame){
  if(disposed)return {position:position.clone(),target:target.clone(),ready:false};
  latest=frame;
  scene.rotation.y=-.777*ease(.55,.78,frame.progress)*(1-ease(.94,1,frame.progress));
  envelope.rotation.x=-Math.PI/2*(1-ease(.55,.62,frame.progress))-.5*Math.PI*ease(.94,1,frame.progress);
  const desktop=frame.width>=761;
  if(desktop){scene.rotation.y=0;envelope.rotation.x=-Math.PI/2;}
  for(const face of paperFaces)face.mesh.material=desktop?face.flat:face.original;
  const q=THREE.MathUtils.clamp(Number.isFinite(frame.opening)?frame.opening:0,0,1);
  if(frame.effect?.name==='wax-stamp')heartSelected=frame.effect.value>0;
  heartStamp.visible=heartSelected;initialsStamp.visible=!heartSelected;
  seal.scale.setScalar(1);
  const domReading=Boolean(frame.onPaperPose)&&q>LETTER_UNFOLDED&&frame.progress>=.62;
  // Move the shell below the viewport while its insert hands the same paper to the DOM.
  // During a close the camera must contain the sheet before the shell returns beneath it.
  // Reusing the opening's .9→1 retreat brought the full open envelope back at reader scale.
  const shellRetirement=frame.letterView==='folding'?ease(.35,.65,q):ease(.9,1,q);
  shell.position.y=desktop&&frame.onPaperPose?-4*shellRetirement:0;
  insert.visible=!domReading&&(!desktop||q>.36);
      flap.rotation.x=-ease(.12,.36,q)*THREE.MathUtils.degToRad(165);
      seal.position.y=.48-ease(.12,.34,q)*.35;
      seal.position.z=.235+ease(0,.12,q)*.08;
      seal.rotation.z=ease(0,.2,q)*.18;
      const aspect=frame.paperAspect&&Number.isFinite(frame.paperAspect)&&frame.paperAspect>0?1.76/(1.86*frame.paperAspect):1;
      insert.scale.y=frame.letterView==='folding'?aspect:1;
      insert.position.y=.55+ease(.36,.62,q)*1.05;
      insert.position.z=-.005+ease(.62,.84,q)*.16;
      topFold.rotation.x=(1-ease(.62,.75,q))*Math.PI*.94;
      bottomFold.rotation.x=-(1-ease(.73,.86,q))*Math.PI*.94;

  if(frame.ownCamera){
   scene.updateWorldMatrix(true,false);
   camera.position.copy(scene.localToWorld(position.clone()));camera.lookAt(scene.localToWorld(target.clone()));
   projectPaper();
  }
  return {position:position.clone(),target:target.clone(),ready:true};
 }
 update(latest);
 return {
  root:scene,
  get ready(){return !disposed;},
  update,
  projectPaper,
  dispose(){
   if(disposed)return;disposed=true;scene.removeFromParent();
   const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
   scene.traverse(object=>{if(object instanceof THREE.Mesh){geometries.add(object.geometry);(Array.isArray(object.material)?object.material:[object.material]).forEach(material=>materials.add(material));}});
   materials.add(paperFace);geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());foilTexture.dispose();initialsTexture.dispose();
   latest.onPaperPose?.({corners:[],visible:false});
  }
 };
}

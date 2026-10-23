import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createHeartGeometry} from './heartGeometry';

export function studioMaterials(){return{
 chrome:new T.MeshPhysicalMaterial({color:'#29272b',metalness:1,roughness:.22,clearcoat:1,clearcoatRoughness:.25}),
 gold:new T.MeshPhysicalMaterial({color:'#dba998',metalness:1,roughness:.3,clearcoat:1}),
 ivory:new T.MeshPhysicalMaterial({color:'#f0e6d9',roughness:.35,clearcoat:.7}),
 ink:new T.MeshStandardMaterial({color:'#141216',roughness:.6,metalness:.08}),
 red:new T.MeshPhysicalMaterial({color:'#8d273f',roughness:.28,metalness:.2,clearcoat:1}),
 jade:new T.MeshPhysicalMaterial({color:'#487e73',roughness:.25,metalness:.15,clearcoat:1}),
};}
export type Materials=ReturnType<typeof studioMaterials>;
/** Sculpture motion leaves GalleryCollection's layout and raycast identity in charge. */
export function createGalleryAttraction(objects:T.Group[]){
 const root=new T.Group();root.name='GALLERY_REFLECTIVE_CRADLE';
 const pivots=objects.map(group=>{const pivot=new T.Group();pivot.name='GALLERY_INGRESS_PIVOT';pivot.add(...group.children);group.add(pivot);return pivot;});
 const metal=new T.MeshPhysicalMaterial({color:'#d7a18f',metalness:.9,roughness:.2,clearcoat:1,clearcoatRoughness:.16});
 const darkChrome=new T.MeshPhysicalMaterial({color:'#251e28',metalness:.92,roughness:.24,clearcoat:1,clearcoatRoughness:.12,side:T.DoubleSide});
 const plateGeometry=new T.CircleGeometry(3.25,64),rimGeometry=new T.TorusGeometry(3.32,.075,10,96,Math.PI*1.72),arcGeometry=new T.TorusGeometry(3.05,.055,10,96,Math.PI*1.25);
 const plate=new T.Mesh(plateGeometry,darkChrome);plate.name='SELECTED_GAME_REFLECTIVE_SURFACE';plate.scale.y=.22;plate.rotation.x=.2;root.add(plate);
 const rim=new T.Mesh(rimGeometry,metal);rim.name='SELECTED_GAME_CRADLE_RIM';rim.scale.y=.26;rim.rotation.z=-.08;rim.position.z=.035;root.add(rim);
 const arc=new T.Mesh(arcGeometry,metal);arc.name='SELECTED_GAME_SPATIAL_ARC';arc.scale.y=.48;arc.rotation.set(.6,0,.12);arc.position.set(0,.35,-.4);root.add(arc);
 let disposed=false;
 return{root,update({entryAge,selectionAge,selected,paused,mobile,time=0,ambient=false}:{entryAge:number;selectionAge:number;selected:string;paused:boolean;mobile:boolean;time?:number;ambient?:boolean}){
  if(disposed)return false;
  const entry=paused?1:T.MathUtils.clamp(entryAge/1.25,0,1),selection=paused?1:T.MathUtils.clamp(selectionAge/1.8,0,1),weight=selection<1?Math.sin(Math.PI*selection)*Math.pow(1-selection,.35):0;
  const breathing=ambient&&!paused?T.MathUtils.smoothstep(selection,0,.35)*entry:0,yaw=Math.sin(time*.48)*breathing,liftWave=Math.sin(time*.72)*breathing;
  pivots.forEach((pivot,i)=>{
   const phase=paused?1:T.MathUtils.clamp((entry*1.25-i*.035)/.98,0,1),remaining=Math.pow(1-phase,3),angle=i/objects.length*Math.PI*2;
   const chosen=objects[i].userData.game===selected;
   const peerWave=chosen?0:Math.sin(time*(.65+i*.035)+i*.83)*breathing;
   const lift=chosen&&!paused?weight*.25+liftWave*.075:peerWave*(.04+i%3*.008);
   pivot.position.set(Math.cos(angle)*remaining*1.2,Math.sin(angle)*remaining*.65-remaining*.9+lift,-remaining*1.2);
   pivot.rotation.set(remaining*.3+(chosen?weight*-.09+Math.sin(time*.36)*breathing*.045:0),remaining*(i%2?-.65:.65)+(chosen?weight*.38+yaw*.22:peerWave*(.085+i%2*.01)),remaining*Math.cos(angle)*.27+(chosen?weight*.045+liftWave*.018:0));
   pivot.scale.setScalar(1-remaining*.22);
  });
  root.position.set(0,mobile?-1.7:-2.25,-.65);root.scale.setScalar(mobile?.55:1);
  root.rotation.set(weight*.16-liftWave*.05,weight*-.38-yaw*.24,weight*.035-liftWave*.02);root.visible=true;
  darkChrome.roughness=.24-weight*.07-liftWave*.025;
  return !paused&&(entry<1||selection<1||ambient);
 },dispose(){if(disposed)return;disposed=true;root.removeFromParent();plateGeometry.dispose();rimGeometry.dispose();arcGeometry.dispose();metal.dispose();darkChrome.dispose();}};
}

type Ready=()=>void;
function flat(color:string){return new T.MeshBasicMaterial({color,toneMapped:false});}
function image(g:T.Group,path:string,w:number,h:number,x:number,y:number,z:number,ready:Ready,crop?:[number,number,number,number]){
 const map=new T.TextureLoader().load(path,()=>{map.userData.pending=false;ready();},undefined,()=>{map.userData.pending=false;ready();});
 map.userData.pending=true;map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
 if(crop){map.offset.set(crop[0],crop[1]);map.repeat.set(crop[2],crop[3]);}
 // Original art stays unlit and undeformed; the paper edge provides spatial lighting.
 return mesh(g,new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map,transparent:true,alphaTest:.025,toneMapped:false,side:T.DoubleSide}),x,y,z);
}
function artCover(g:T.Group,m:Materials,path:string,aspect:number,ready:Ready){
 g.name='GAME_ART_COVER';
 mesh(g,new RoundedBoxGeometry(1.6,2,.06,3,.016),m.chrome);
 mesh(g,new T.PlaneGeometry(1.54,1.94),flat('#e8e6e1'),0,0,.031);
 const h=Math.min(1.9,1.5/aspect),w=h*aspect;
 const face=image(g,path,w,h,0,0,.032,ready);face.name='CONTAINED_ORIGINAL_ART';
}

function mesh(g:T.Group,geometry:T.BufferGeometry,material:T.Material,x=0,y=0,z=0){const o=new T.Mesh(geometry,material);o.position.set(x,y,z);g.add(o);return o;}
function box(g:T.Group,m:T.Material,w:number,h:number,d:number,x=0,y=0,z=0,r=.075){return mesh(g,new RoundedBoxGeometry(w,h,d,6,Math.min(r,d/3)),m,x,y,z);}
function line(g:T.Group,m:T.Material,points:number[][],radius=.025){return mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p as [number,number,number]))),48,radius,12,false),m);}
function disc(g:T.Group,m:T.Material,r:number,x:number,y:number,z:number){const o=mesh(g,new T.CylinderGeometry(r,r,.018,32),m,x,y,z);o.rotation.x=Math.PI/2;return o;}
function pips(g:T.Group,m:T.Material,n:number,y:number,z=.22,spread=.2){const p=n===1?[[0,0]]:n===2?[[-1,-1],[1,1]]:n===3?[[-1,-1],[0,0],[1,1]]:n===4?[[-1,-1],[1,-1],[-1,1],[1,1]]:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]];p.forEach(([x,dy])=>disc(g,m,.062,x*spread,y+dy*spread,z));}

function sculptCamel(g:T.Group,m:Materials){
 // One continuous carved silhouette replaces the disconnected torso, hump and tube neck.
 const s=new T.Shape();s.moveTo(1.2,.91);s.bezierCurveTo(1.32,.96,1.34,1.07,1.2,1.11);s.lineTo(.94,1.13);s.lineTo(.83,1.28);s.quadraticCurveTo(.73,1.3,.77,1.09);s.bezierCurveTo(.61,1.07,.57,.83,.51,.48);s.bezierCurveTo(.45,.22,.28,.24,.18,.49);s.bezierCurveTo(.03,.97,-.35,.92,-.5,.52);s.bezierCurveTo(-.62,.24,-.85,.43,-.98,.2);s.quadraticCurveTo(-1.12,.12,-1.13,-.14);s.quadraticCurveTo(-1.2,-.32,-1.14,-.47);s.lineTo(-1.08,-.48);s.quadraticCurveTo(-1.07,-.29,-1.01,-.22);s.lineTo(-.81,-.56);s.lineTo(-.93,-1.01);s.quadraticCurveTo(-.97,-1.1,-.82,-1.1);s.lineTo(-.6,-1.1);s.quadraticCurveTo(-.56,-1.03,-.68,-1);s.lineTo(-.58,-.56);s.lineTo(-.42,-.22);s.bezierCurveTo(-.2,-.3,.2,-.28,.45,-.2);s.lineTo(.55,-.98);s.quadraticCurveTo(.5,-1.09,.66,-1.1);s.lineTo(.87,-1.1);s.quadraticCurveTo(.93,-1.04,.79,-.99);s.lineTo(.75,-.3);s.bezierCurveTo(.8,.04,.71,.23,.72,.41);s.bezierCurveTo(.76,.7,.89,.91,1.02,.89);s.lineTo(1.2,.91);
 const geometry=new T.ExtrudeGeometry(s,{depth:.48,bevelEnabled:true,bevelThickness:.07,bevelSize:.07,bevelSegments:8,steps:1,curveSegments:36});geometry.translate(0,0,-.24);mesh(g,geometry,m.gold);
 disc(g,m.ink,.028,1.02,1.035,.32);line(g,m.gold,[[.13,.31,.34],[-.02,.43,.34],[-.3,.39,.34],[-.42,.27,.34]],.018);g.rotation.y=-.3;
}
function boardTexture(){const c=document.createElement('canvas');c.width=c.height=768;const p=c.getContext('2d')!;p.fillStyle='#e7dac3';p.fillRect(0,0,768,768);p.strokeStyle='#70554d';p.lineWidth=3;const colors=['#507665','#70637c','#b69556','#975a69'];
 for(let side=0;side<4;side++)for(let i=0;i<10;i++){p.save();p.translate(384,384);p.rotate(side*Math.PI/2);p.translate(-346+i*69,-346);p.fillStyle='#eadfcd';p.fillRect(0,0,68,84);p.strokeRect(0,0,68,84);p.fillStyle=colors[Math.floor(i/3)%4];p.fillRect(0,0,68,17);p.fillStyle='#493b3a';p.textAlign='center';p.font='11px sans-serif';p.fillText(String(side*10+i+1).padStart(2,'0'),34,53);p.restore();}
 p.fillStyle='#392a31';p.fillRect(124,124,520,520);p.strokeStyle='#caa58e';p.strokeRect(132,132,504,504);p.fillStyle='#d7b39b';p.textAlign='center';p.font='38px Georgia';p.fillText('MARBLE',384,348);p.font='17px sans-serif';p.fillText('GWANGJU · SANTO DOMINGO',384,385);p.font='14px sans-serif';p.fillText('FOR THE TWO OF US',384,423);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;return map;}
export function normalizeSculpture(art:T.Group){art.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(art),center=bounds.getCenter(new T.Vector3()),radius=bounds.getBoundingSphere(new T.Sphere()).radius;const g=new T.Group(),scale=new T.Group();art.position.sub(center);scale.scale.setScalar(1/radius);scale.add(art);g.add(scale);return g;}
export function createGameObject(id:string,m:Materials,onAssetReady=()=>{}){
 const g=new T.Group();
 if(id==='davinci'){
  artCover(g,m,'/images/landing-preview/art/leonardo-self-portrait.jpg',1932/2953,onAssetReady);
 }else if(id==='catchmind'){
  box(g,m.chrome,1.65,1.2,.17,-.1,0,0);box(g,m.ivory,1.47,1.02,.025,-.1,0,.102);const heart=mesh(g,createHeartGeometry(),m.red,-.2,.05,.15);heart.scale.set(.24,.24,.04);
  const pencil=new T.Group();mesh(pencil,new T.CylinderGeometry(.055,.055,1.25,12),m.gold);mesh(pencil,new T.ConeGeometry(.055,.2,12),m.ivory,0,-.72,0).rotation.z=Math.PI;mesh(pencil,new T.ConeGeometry(.019,.08,12),m.ink,0,-.83,0).rotation.z=Math.PI;box(pencil,m.ink,.095,.14,.095,0,.61,0,.025);pencil.position.set(.87,-.05,.19);pencil.rotation.z=-.25;g.add(pencil);
 }else if(id==='domino'){
  box(g,m.ivory,.96,1.9,.3);box(g,m.gold,.78,.023,.02,0,0,.166);pips(g,m.ink,3,.48,.164);pips(g,m.ink,5,-.48,.164);g.rotation.z=.1;
 }else if(id==='jaipur'){sculptCamel(g,m);
 }else if(id==='splendor'){
  artCover(g,m,'/images/splendor/box-cover.jpg',998/1280,onAssetReady);
 }else if(id==='minhwatu'){
  ['01-01','03-01','08-01'].forEach((id,i)=>{const card=new T.Group();card.position.set((i-1)*.32,0,(i-1)*.18);card.rotation.z=(i-1)*-.18;box(card,m.chrome,.97,1.59,.095,0,0,0,.025);const map=new T.TextureLoader().load('/images/hwatu/'+id+'.svg',()=>{map.userData.pending=false;onAssetReady();});map.userData.pending=true;map.colorSpace=T.SRGBColorSpace;mesh(card,new T.PlaneGeometry(.91,1.48),new T.MeshStandardMaterial({map,roughness:.65}),0,0,.051);g.add(card);});
 }else if(id==='marble'){
  box(g,m.chrome,2,2,.17);box(g,m.gold,1.96,1.96,.027,0,0,.096,.025);mesh(g,new T.PlaneGeometry(1.9,1.9),new T.MeshStandardMaterial({map:boardTexture(),roughness:.64}),0,0,.112);
  const dice=new T.Group();box(dice,m.ivory,.56,.56,.56,0,0,0,.09);pips(dice,m.ink,5,0,.287,.12);const side=new T.Group();pips(side,m.ink,3,0,.287,.12);side.rotation.y=Math.PI/2;dice.add(side);const top=new T.Group();pips(top,m.ink,1,0,.287,.12);top.rotation.x=-Math.PI/2;dice.add(top);dice.position.set(-.38,.32,.46);dice.rotation.set(.19,-.25,.16);g.add(dice);
  const house=new T.Group();box(house,m.ivory,.48,.42,.34);const roof=new T.Shape();roof.moveTo(-.31,.17);roof.lineTo(0,.48);roof.lineTo(.31,.17);roof.closePath();mesh(house,new T.ExtrudeGeometry(roof,{depth:.4,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:3}),m.red,0,0,-.2);box(house,m.ink,.1,.19,.015,0,-.105,.178,.012);box(house,m.gold,.08,.09,.015,.14,.04,.178,.01);house.position.set(.41,-.4,.41);house.rotation.y=-.15;g.add(house);g.rotation.z=-.1;
 }else{
  mesh(g,new T.TorusGeometry(.77,.055,16,96,Math.PI),m.gold,0,.14,0);mesh(g,new T.TorusGeometry(.68,.073,16,96,Math.PI),m.ink,0,.14,.025);
  for(const side of [-1,1]){line(g,m.gold,[[side*.77,.14,0],[side*.8,-.08,0],[side*.74,-.21,0]],.045);const cup=new T.Group();box(cup,m.chrome,.42,.72,.27,0,0,0,.12);const cushion=mesh(cup,new T.TorusGeometry(.25,.075,16,64),m.ink,0,0,.19);cushion.scale.set(.7,1.12,.85);box(cup,m.ink,.25,.43,.085,0,0,.19,.065);line(cup,m.gold,[[-.12,.28,.15],[.12,.28,.15],[.16,0,.15],[.12,-.28,.15],[-.12,-.28,.15]],.012);cup.position.set(side*.76,-.24,0);cup.rotation.y=-side*.27;g.add(cup);}
  line(g,m.gold,[[.13,-.69,.08],[.13,-.13,.08],[.45,-.02,.08]],.035);const note=disc(g,m.gold,.12,.03,-.7,.1);note.scale.set(1,.7,1);
 }
 return g;
}

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
function mesh(g:T.Group,geometry:T.BufferGeometry,material:T.Material,x=0,y=0,z=0){const o=new T.Mesh(geometry,material);o.position.set(x,y,z);g.add(o);return o;}
function box(g:T.Group,m:T.Material,w:number,h:number,d:number,x=0,y=0,z=0,r=.075){return mesh(g,new RoundedBoxGeometry(w,h,d,6,Math.min(r,d/3)),m,x,y,z);}
function line(g:T.Group,m:T.Material,points:number[][],radius=.025){return mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p as [number,number,number]))),48,radius,12,false),m);}
function disc(g:T.Group,m:T.Material,r:number,x:number,y:number,z:number){const o=mesh(g,new T.CylinderGeometry(r,r,.018,32),m,x,y,z);o.rotation.x=Math.PI/2;return o;}
function print(g:T.Group,text:string,color:string,x=0,y=0,z=.16,w=.65,h=.9){const c=document.createElement('canvas');c.width=256;c.height=320;const ctx=c.getContext('2d')!;ctx.fillStyle=color;ctx.font='700 220px GiftSans, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,128,170);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;mesh(g,new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map,transparent:true,roughness:.75,depthWrite:false}),x,y,z);}
function pips(g:T.Group,m:T.Material,n:number,y:number,z=.22,spread=.2){const p=n===1?[[0,0]]:n===2?[[-1,-1],[1,1]]:n===3?[[-1,-1],[0,0],[1,1]]:n===4?[[-1,-1],[1,-1],[-1,1],[1,1]]:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]];p.forEach(([x,dy])=>disc(g,m,.062,x*spread,y+dy*spread,z));}
function cutGem(g:T.Group,source:T.MeshPhysicalMaterial,size:number,x=0,y=0,z=0){
 const rings=[[.35,.53],[.7,.38],[1,.08],[.99,-.06],[.47,-.5],[.015,-.77]],points:number[]=[];
 const v=(r:number,i:number)=>{const [radius,depth]=rings[r],angle=i/8*Math.PI*2+(r===1||r===4?Math.PI/8:0);return[Math.cos(angle)*radius,Math.sin(angle)*radius,depth];};
 for(let i=0;i<8;i++){points.push(0,0,.53,...v(0,i),...v(0,i+1));for(let r=0;r<5;r++){const a=v(r,i),b=v(r,i+1),c=v(r+1,i),d=v(r+1,i+1);points.push(...a,...c,...b,...b,...c,...d);}}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(points,3));geometry.computeVertexNormals();
 const m=source.clone();m.metalness=.06;m.roughness=.22;m.envMapIntensity=.7;m.ior=1.72;m.clearcoat=.9;
 const o=mesh(g,geometry,m,x,y,z);o.scale.setScalar(size);o.rotation.set(.24,-.38,.16);return o;
}
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
  [-.7,0,.7].forEach((x,i)=>{const tile=new T.Group();tile.position.set(x,i===1?.08:0,0);tile.rotation.y=x*.16;box(tile,i===1?m.ivory:m.chrome,.64,1.4,.3,0,0,0,.1);print(tile,i===0?'0':i===1?'7':'?',i===1?'#2b2328':'#eadbc9',0,0,.16,.45,.74);line(tile,m.gold,[[-.22,-.56,.158],[.22,-.56,.158]],.006);g.add(tile);});
 }else if(id==='catchmind'){
  box(g,m.chrome,1.65,1.2,.17,-.1,0,0);box(g,m.ivory,1.47,1.02,.025,-.1,0,.102);const heart=mesh(g,createHeartGeometry(),m.red,-.2,.05,.15);heart.scale.set(.24,.24,.04);
  const pencil=new T.Group();mesh(pencil,new T.CylinderGeometry(.055,.055,1.25,12),m.gold);mesh(pencil,new T.ConeGeometry(.055,.2,12),m.ivory,0,-.72,0).rotation.z=Math.PI;mesh(pencil,new T.ConeGeometry(.019,.08,12),m.ink,0,-.83,0).rotation.z=Math.PI;box(pencil,m.ink,.095,.14,.095,0,.61,0,.025);pencil.position.set(.87,-.05,.19);pencil.rotation.z=-.25;g.add(pencil);
 }else if(id==='domino'){
  box(g,m.ivory,.96,1.9,.3);box(g,m.gold,.78,.023,.02,0,0,.166);pips(g,m.ink,3,.48,.164);pips(g,m.ink,5,-.48,.164);g.rotation.z=.1;
 }else if(id==='jaipur'){sculptCamel(g,m);
 }else if(id==='splendor'){
  cutGem(g,m.gold,.83,0,.05,.05);cutGem(g,m.jade,.38,-.78,-.48,0);cutGem(g,m.red,.37,.78,.54,-.08);const setting=mesh(g,new T.TorusGeometry(.78,.025,12,96),m.gold,0,.05,-.03);setting.rotation.x=.24;
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

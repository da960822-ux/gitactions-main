import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createHeartGeometry } from './heartGeometry';

// Original miniature sculptures; every object shares this material palette and studio rig.
export function studioMaterials() {
  return {
    chrome: new T.MeshPhysicalMaterial({color:'#29272b',metalness:1,roughness:.17,clearcoat:1,clearcoatRoughness:.2}),
    gold: new T.MeshPhysicalMaterial({color:'#dba998',metalness:1,roughness:.25,clearcoat:1}),
    ivory: new T.MeshPhysicalMaterial({color:'#f0e6d9',roughness:.35,clearcoat:.7}),
    ink: new T.MeshStandardMaterial({color:'#141216',roughness:.35,metalness:.35}),
    red: new T.MeshPhysicalMaterial({color:'#8d273f',roughness:.27,metalness:.35,clearcoat:1}),
    jade: new T.MeshPhysicalMaterial({color:'#487e73',roughness:.16,metalness:.5,clearcoat:1}),
  };
}
export type Materials = ReturnType<typeof studioMaterials>;
function mesh(parent:T.Group, geometry:T.BufferGeometry, material:T.Material, x=0,y=0,z=0, scale?:[number,number,number]) {
  const object=new T.Mesh(geometry,material);object.position.set(x,y,z);if(scale)object.scale.set(...scale);object.castShadow=true;object.receiveShadow=true;parent.add(object);return object;
}
function box(g:T.Group,m:T.Material,w:number,h:number,d:number,x=0,y=0,z=0) { return mesh(g,new RoundedBoxGeometry(w,h,d,4,Math.min(.1,d/3)),m,x,y,z); }
function sphere(g:T.Group,m:T.Material,r:number,x=0,y=0,z=0,scale?:[number,number,number]) {return mesh(g,new T.SphereGeometry(r,32,20),m,x,y,z,scale);}
function line(g:T.Group,m:T.Material,points:number[][],radius=.025) {return mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p as [number,number,number]))),40,radius,8,false),m);}
function disc(g:T.Group,m:T.Material,r:number,x:number,y:number,z:number) {const o=mesh(g,new T.CylinderGeometry(r,r,.035,32),m,x,y,z);o.rotation.x=Math.PI/2;return o;}
function print(g:T.Group,text:string,m:T.Material,x=0,y=0,z=.16) {
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const c=canvas.getContext('2d')!;c.fillStyle='#d6aa98';c.font='500 180px Georgia';c.textAlign='center';c.textBaseline='middle';c.fillText(text,128,139);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const material=new T.MeshStandardMaterial({map:texture,transparent:true,roughness:.65,depthWrite:false});
  mesh(g,new T.PlaneGeometry(.75,.75),material,x,y,z);
}
function pips(g:T.Group,m:T.Material,n:number,y:number,z=.22,spread=.2) {
  const points=n===1?[[0,0]]:n===2?[[-1,-1],[1,1]]:n===3?[[-1,-1],[0,0],[1,1]]:n===4?[[-1,-1],[1,-1],[-1,1],[1,1]]:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]];
  points.forEach(([x,dy])=>disc(g,m,.07,x*spread,y+dy*spread,z));
}
function jewel(g:T.Group,m:T.Material,size:number,x=0,y=0,z=0) {
  const points:number[]=[],rings=[[.42,.5],[1,.08],[.9,-.15],[.02,-.75]];
  const vertex=(ring:number,i:number)=>{const [radius,depth]=rings[ring],a=i/8*Math.PI*2;return [Math.cos(a)*radius,Math.sin(a)*radius,depth];};
  for(let i=0;i<8;i++){points.push(0,0,.5,...vertex(0,i),...vertex(0,i+1));for(let r=0;r<3;r++){const a=vertex(r,i),b=vertex(r,i+1),c=vertex(r+1,i),d=vertex(r+1,i+1);points.push(...a,...c,...b,...b,...c,...d);}}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(points,3));geometry.computeVertexNormals();
  const o=mesh(g,geometry,m,x,y,z);o.scale.setScalar(size);o.rotation.set(.25,-.3,.2);return o;
}
export function createGameObject(id:string,m:Materials) {
  const g=new T.Group();
  if(id==='davinci') {
    [-.7,0,.7].forEach((x,i)=>{const tile=new T.Group();tile.position.set(x,i===1?.12:0,0);tile.rotation.y=x*.25;box(tile,i===1?m.ivory:m.chrome,.62,1.42,.24);print(tile,i===0?'0':i===1?'7':'?',m.gold,0,0,.135);g.add(tile);});
  } else if(id==='catchmind') {
    box(g,m.chrome,1.6,1.22,.17,-.2,0,0);box(g,m.ivory,1.42,1.04,.025,-.2,0,.104);
    const heart=mesh(g,createHeartGeometry(),m.red,-.28,.06,.16);heart.scale.set(.25,.25,.045);
    const pencil=new T.Group();mesh(pencil,new T.CylinderGeometry(.085,.085,1.8,12),m.gold);mesh(pencil,new T.ConeGeometry(.085,.28,12),m.ivory,0,-1.04,0).rotation.z=Math.PI;mesh(pencil,new T.ConeGeometry(.027,.1,12),m.ink,0,-1.22,0).rotation.z=Math.PI;pencil.position.set(.8,0,.3);pencil.rotation.z=-.38;g.add(pencil);
  } else if(id==='domino') {
    box(g,m.ivory,.96,1.9,.3);box(g,m.gold,.78,.026,.026,0,0,.17);pips(g,m.ink,3,.48);pips(g,m.ink,5,-.48);g.rotation.z=.15;
  } else if(id==='jaipur') {
    sphere(g,m.gold,.56,0,-.08,0,[1.55,.65,.65]);sphere(g,m.gold,.42,-.08,.25,0,[1,1.25,.8]);
    line(g,m.gold,[[.55,-.1,0],[.72,.35,0],[.65,.9,0],[.95,1.08,0]],.17);sphere(g,m.gold,.19,1.02,1.05,0,[1.5,.8,.9]);
    for(const x of [-.6,.44])for(const z of [-.2,.2]){line(g,m.gold,[[x,-.3,z],[x+.12,-.7,z],[x+.02,-1,z]],.075);box(g,m.ink,.25,.12,.19,x+.05,-1,z);}
    line(g,m.gold,[[-.8,.02,0],[-1.05,-.2,0],[-1.1,-.5,0]],.045);sphere(g,m.ink,.04,1.02,1.1,.16);g.rotation.y=-.35;
  } else if(id==='splendor') {
    const ring=mesh(g,new T.TorusGeometry(.95,.035,8,64),m.gold,0,0,-.1);jewel(g,m.gold,.87,0,.1,.15);jewel(g,m.jade,.4,-.95,-.65,.05);jewel(g,m.red,.38,.9,.7,-.06);ring.rotation.x=.3;
  } else if(id==='minhwatu') {
    for(let i=0;i<3;i++){const card=new T.Group();card.position.set((i-1)*.35,0,(i-1)*.14);card.rotation.z=(i-1)*-.22;box(card,m.gold,1.07,1.67,.1);box(card,m.chrome,.98,1.58,.025,0,0,.07);line(card,m.gold,[[-.34,-.6,.105],[-.16,-.1,.105],[.1,.37,.105],[.32,.68,.105]],.024);for(let j=0;j<5;j++){sphere(card,j===3?m.red:m.jade,.16,(j%2?1:-1)*.19,(j-2)*.24,.12,[1.1,.48,.18]);}disc(card,m.red,.19,.2,.42,.14);g.add(card);}
  } else if(id==='marble') {
    box(g,m.chrome,1.9,1.9,.17);box(g,m.gold,1.8,1.8,.025,0,0,.1);box(g,m.ink,1.35,1.35,.03,0,0,.13);
    for(let i=0;i<4;i++)for(const side of [-1,1]){box(g,m.ivory,.3,.16,.06,(i-1.5)*.4,side*.8,.15);box(g,m.ivory,.16,.3,.06,side*.8,(i-1.5)*.4,.15);}
    const dice=new T.Group();box(dice,m.ivory,.6,.6,.6);pips(dice,m.ink,5,0,.32,.14);dice.position.set(-.32,.2,.45);dice.rotation.set(.18,-.25,.2);g.add(dice);
    box(g,m.gold,.5,.5,.42,.4,-.3,.42);const roof=mesh(g,new T.ConeGeometry(.43,.3,4),m.red,.4,-.3,.76);roof.rotation.x=Math.PI/2;roof.rotation.y=Math.PI/4;g.rotation.z=-.15;
  } else {
    const arch=mesh(g,new T.TorusGeometry(.76,.085,16,64,Math.PI),m.gold,0,.1,0);arch.rotation.z=0;
    for(const side of [-1,1]){box(g,m.chrome,.3,.63,.46,side*.74,-.15,0);box(g,m.ink,.14,.48,.35,side*.57,-.15,0);}
    line(g,m.gold,[[.15,-.5,.15],[.15,.05,.15],[.5,.18,.15]],.035);sphere(g,m.gold,.13,.03,-.5,.15,[1,.7,.25]);
  }
  return g;
}

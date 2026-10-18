import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {TessellateModifier} from 'three/addons/modifiers/TessellateModifier.js';

// Hero owns this threshold only; the later team owns table interactions and story.
export function createStoryAtrium(scene:T.Scene,keep:<A extends{dispose:()=>void}>(a:A)=>A){
 const root=new T.Group();root.name='HERO_ARRIVAL_THRESHOLD_ONLY';scene.add(root);
 const stone=keep(new T.MeshStandardMaterial({color:'#172331',roughness:.58,metalness:.25})),wine=keep(new T.MeshStandardMaterial({color:'#281521',roughness:.42,metalness:.25})),bronze=keep(new T.MeshStandardMaterial({color:'#b87954',roughness:.26,metalness:.85})),floorMaterial=keep(new T.MeshStandardMaterial({color:'#18232c',roughness:.34,metalness:.4})),ivory=keep(new T.MeshStandardMaterial({color:'#dbcab3',roughness:.38,metalness:.08})),ink=keep(new T.MeshStandardMaterial({color:'#130d16',roughness:.24,metalness:.2}));
 const add=(name:string,geometry:T.BufferGeometry,material:T.Material,pos:number[])=>{const mesh=new T.Mesh(keep(geometry),material);mesh.name=name;mesh.position.fromArray(pos);root.add(mesh);return mesh;};
 const box=(name:string,size:number[],pos:number[],material:T.Material)=>add(name,new T.BoxGeometry(...size as[number,number,number]),material,pos);
 const floor=box('STORY_CONTINUOUS_DARK_STONE_FLOOR',[64,.2,62],[-10,-3.06,-66],floorMaterial);
 const wallShape=new T.Shape();wallShape.moveTo(-32,-13);wallShape.lineTo(32,-13);wallShape.lineTo(32,13);wallShape.lineTo(-32,13);wallShape.closePath();
 const window=new T.Path();window.moveTo(-17,-11);window.lineTo(-17,-1);window.quadraticCurveTo(-17,5,-10,5);window.lineTo(10,5);window.quadraticCurveTo(17,5,17,-1);window.lineTo(17,-11);window.closePath();wallShape.holes.push(window);
 const base=new T.ShapeGeometry(wallShape,24),wallGeometry=keep(new TessellateModifier(1.5,6).modify(base));base.dispose();const pos=wallGeometry.getAttribute('position'),normals=wallGeometry.getAttribute('normal');
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),n=Math.hypot(.018*x,1);pos.setZ(i,.009*x*x);normals.setXYZ(i,-.018*x/n,0,1/n);}
 const wall=new T.Mesh(wallGeometry,stone);wall.name='PHYSICAL_CURVED_WINDOW_WALL';wall.position.set(-10,8,-76);root.add(wall);
 const points=window.getPoints(80).map(v=>new T.Vector3(v.x-10,v.y+8,-76+.009*v.x*v.x+.12));add('ROSE_GOLD_WINDOW_REVEAL',new T.TubeGeometry(new T.CatmullRomCurve3(points,true),240,.065,8,true),bronze,[0,0,0]);
 for(const x of [-37,-33,-29,9,13,17])box('ARCHITECTURAL_BRASS_JOINT',[.045,24,.08],[x,8,-76+.009*(x+10)**2+.12],bronze);
 box('UPPER_DARK_CANOPY',[64,.4,34],[-10,20,-62],wine);
 const warm=new T.RectAreaLight('#ffd0aa',22,14,14);warm.position.set(-21,13,-50);warm.lookAt(-10,0,-62);const cool=new T.RectAreaLight('#a7b9eb',16,12,15);cool.position.set(8,10,-58);cool.lookAt(-12,0,-62);root.add(warm,cool);
 add('HERO_HANDOFF_TABLE_RIM',new RoundedBoxGeometry(12.2,.32,8.2,3,.12),bronze,[-11,-1.38,-58]);add('HERO_HANDOFF_TABLE_SUPPORT',new RoundedBoxGeometry(4,1.4,3,3,.22),wine,[-11,-2.22,-58]);
 for(const [index,x,z,yaw]of [[0,-18.5,-56,Math.PI/2],[1,-3.5,-60,-Math.PI/2]]){const chair=new T.Group();chair.name='TWO_SEATS_ARRIVAL_CUE_'+index;chair.position.set(x,-2.05,z);chair.rotation.y=yaw;root.add(chair);chair.add(new T.Mesh(keep(new RoundedBoxGeometry(2.3,.28,2.1,3,.2)),ivory));const back=new T.Mesh(keep(new RoundedBoxGeometry(2.3,1.5,.24,3,.2)),wine);back.position.set(0,.65,-.92);chair.add(back);for(const lx of[-.83,.83])for(const lz of[-.7,.7]){const leg=new T.Mesh(keep(new T.CylinderGeometry(.045,.055,.85,8)),bronze);leg.position.set(lx,-.55,lz);chair.add(leg);}}
 const pipGeometry=keep(new T.SphereGeometry(.065,10,6));for(let i=0;i<4;i++){const tile=new T.Group();tile.name='DOMINO_ARRIVAL_PROP_'+i;tile.position.set(-13+i*1.4,-.88,-58+(i%2)*.6);tile.rotation.y=-.22+i*.15;root.add(tile);tile.add(new T.Mesh(keep(new RoundedBoxGeometry(1.05,.18,1.9,3,.07)),i%2?ink:ivory));const pipMaterial=i%2?ivory:ink;for(const z of[-.48,.48])for(let j=0;j<i+1;j++){const pip=new T.Mesh(pipGeometry,pipMaterial);pip.scale.y=.2;pip.position.set((j%2?1:-1)*.22,.1,z+(Math.floor(j/2)-.5)*.25);tile.add(pip);}}
 const seam=new T.CubicBezierCurve3(new T.Vector3(-23,-2.94,-74),new T.Vector3(-23,-2.94,-44),new T.Vector3(1,-2.94,-44),new T.Vector3(1,-2.94,-74));add('SHARED_FLOOR_SEAM',new T.TubeGeometry(seam,80,.018,5,false),keep(new T.MeshStandardMaterial({color:'#d4a381',emissive:'#bc7950',emissiveIntensity:.55,metalness:.5,roughness:.4})),[0,0,0]);
 return{root,floor,anchor:new T.Vector3(-11,-1.13,-58)};
}

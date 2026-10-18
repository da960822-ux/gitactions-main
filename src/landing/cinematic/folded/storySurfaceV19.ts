import * as T from 'three';
import {smoothRange} from './poseSpaceV19';

// One indexed sheet keeps its UVs while its silhouette opens into the story wall.
export function surfacePose(progress:number,entrance=1){
 const keys=[[0,-.35,-1.8,-.4,1.15,.72,-.14,.12],[.32,-1.2,.4,-3.5,4.3,2.6,-.25,1.05],[.55,-3.4,-2.8,-12,7,4.4,.15,.8],[.7,-11,-3.05,-42,12,16,0,.2],[1,-11,-3.05,-80,16,30,0,.02]];
 const p=Math.max(0,Math.min(1,progress));let i=0;while(i<keys.length-2&&p>keys[i+1][0])i++;
 const a=keys[i],b=keys[i+1],t=smoothRange(a[0],b[0],p),v=a.slice(1).map((x,j)=>x+(b[j+1]-x)*t);
 return{center:v.slice(0,3),width:v[3],height:v[4],yaw:v[5],bend:v[6]+(1-entrance)*.65,pitch:-Math.PI/2*smoothRange(.32,.65,p),open:smoothRange(.08,.7,p)};
}
export function surfaceVertex(u:number,v:number,p:number,e=1){
 const s=surfacePose(p,e),x=(u-.5)*s.width,y=(v-.5)*s.height;
 const z=s.bend*(Math.cos((u-.5)*Math.PI)-1)+.12*Math.sin(v*Math.PI)*Math.sin(u*Math.PI)*(1-s.open);
 return[x,y,z]as const;
}
export function createStorySurface(scene:T.Scene,keep:<A extends{dispose:()=>void}>(a:A)=>A){
 const geometry=keep(new T.PlaneGeometry(1,1,48,24)),material=keep(new T.MeshStandardMaterial({color:'#29131f',metalness:.32,roughness:.46,side:T.DoubleSide,emissive:'#edbb9e',emissiveIntensity:1.8}));
 const mesh=new T.Mesh(geometry,material);mesh.name='HERO_TO_STORY_SAME_VIDEO_SHEET';mesh.castShadow=true;/* Thin emissive face receives analytic area lighting; avoid shadow-map acne on the single sheet. */mesh.receiveShadow=false;mesh.frustumCulled=false;scene.add(mesh);
 const uv=geometry.getAttribute('uv'),position=geometry.getAttribute('position');let signature='';
 return{mesh,material,update(p:number,e:number){const next=p.toFixed(5)+':'+e.toFixed(5);if(next===signature)return;signature=next;const s=surfacePose(p,e);for(let i=0;i<position.count;i++){const v=surfaceVertex(uv.getX(i),uv.getY(i),p,e);position.setXYZ(i,...v);}position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();mesh.position.fromArray(s.center);mesh.rotation.set(s.pitch,s.yaw,0);mesh.updateMatrixWorld();}};
}

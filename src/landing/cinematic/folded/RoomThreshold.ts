import * as T from 'three';
import {roomBackgroundDepth,roomVertex} from './approvedRoomGeometry';

/** The passage meets the illustration's actual projected wall, ceiling and floor edges. */
export function createRoomThreshold(scene:T.Scene,keep:<A extends{dispose:()=>void}>(value:A)=>A){
 const root=new T.Group();root.name='ROOM_PHYSICAL_THRESHOLD';scene.add(root);
 const timber=keep(new T.MeshStandardMaterial({color:'#6d4734',roughness:.7,metalness:.08}));
 const leftWall=keep(new T.MeshStandardMaterial({color:'#695043',roughness:.92,side:T.DoubleSide}));
 const rightWall=keep(new T.MeshStandardMaterial({color:'#53313d',roughness:.92,side:T.DoubleSide}));
 const ceiling=keep(new T.MeshStandardMaterial({color:'#5c453c',roughness:.92,side:T.DoubleSide}));
 const wood=keep(new T.MeshStandardMaterial({color:'#4d2b1b',roughness:.72,side:T.DoubleSide}));
 wood.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vThresholdWorld;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvThresholdWorld=(modelMatrix*vec4(transformed,1.)).xyz;');shader.fragmentShader='varying vec3 vThresholdWorld;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=1.+.055*sin(vThresholdWorld.x*19.+sin(vThresholdWorld.z*.23)*.8)+.018*sin(vThresholdWorld.x*83.+sin(vThresholdWorld.z*.4));');};
 wood.customProgramCacheKey=()=> 'continuous-entrance-timber';
 function box(name:string,w:number,h:number,d:number,x:number,y:number,z:number){const mesh=new T.Mesh(keep(new T.BoxGeometry(w,h,d)),timber);mesh.name=name;mesh.position.set(x,y,z);mesh.receiveShadow=true;root.add(mesh);}
 box('LEFT_ENTRY_JAMB',.22,21,1.1,-23.11,7.5,-29.5);
 box('RIGHT_ENTRY_JAMB',.22,21,1.1,1.11,7.5,-29.5);
 box('ENTRY_LINTEL',24.44,.22,1.1,-11,18.11,-29.5);
 box('ENTRY_SILL',24.44,.12,1.1,-11,-3.06,-29.5);
 const rear=(u:number,y:number)=>{const p=roomVertex(u*1672,y,roomBackgroundDepth(u,y));return new T.Vector3(p[0]-11,p[1]+7.6,p[2]-64);};
 function strip(name:string,front:(t:number)=>T.Vector3,back:(t:number)=>T.Vector3,material:T.Material){
  const geometry=keep(new T.PlaneGeometry(1,1,32,1)),position=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
  for(let i=0;i<position.count;i++){const t=uv.getX(i),point=front(t).lerp(back(t),uv.getY(i));position.setXYZ(i,point.x,point.y,point.z);}geometry.computeVertexNormals();
  const mesh=new T.Mesh(geometry,material);mesh.name=name;mesh.receiveShadow=true;root.add(mesh);
 }
 strip('CONTINUOUS_LEFT_ROOM_WALL',t=>new T.Vector3(-23,18-21*t,-30),t=>rear(0,t*941),leftWall);
 strip('CONTINUOUS_RIGHT_ROOM_WALL',t=>new T.Vector3(1,18-21*t,-30),t=>rear(1,t*941),rightWall);
 strip('CONTINUOUS_ROOM_CEILING',t=>new T.Vector3(-23+24*t,18,-30),t=>rear(t,0),ceiling);
 strip('CONTINUOUS_ENTRY_FLOOR',t=>new T.Vector3(-23+24*t,-3,-30),t=>rear(t,941),wood);
 const warm=new T.RectAreaLight('#ffd1a0',5,16,12);warm.position.set(-11,12,-36);warm.lookAt(-22,4,-49);root.add(warm);
 const rose=new T.RectAreaLight('#dba3a9',3,12,12);rose.position.set(-11,10,-40);rose.lookAt(6,4,-51);root.add(rose);
 return {root};
}

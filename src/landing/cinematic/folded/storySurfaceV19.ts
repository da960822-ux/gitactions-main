import * as T from 'three';
import {openingCameraPose} from './poseSpaceV19';
import {cosmicOpeningPose,deformInitialCosmicVertex} from './initialCosmicHero';
import {cosmicLayerPose} from './cosmicLayers';

/** Original panorama at a far distance; coherent hidden scenery takes over before local foreground moves. */
export function createStorySurface(scene:T.Scene,keep:<A extends{dispose:()=>void}>(a:A)=>A){
 const geometry=keep(new T.PlaneGeometry(1,1,96,64)),position=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
 const material=keep(new T.MeshBasicMaterial({toneMapped:false,side:T.DoubleSide,transparent:true,depthWrite:false,depthTest:false}));
 const mesh=new T.Mesh(geometry,material);mesh.name='COSMIC_DISTANT_ENVIRONMENT';mesh.renderOrder=1;mesh.frustumCulled=false;scene.add(mesh);
 const reference=new T.PerspectiveCamera(38,16/9,.1,400),point=new T.Vector3(),rest=new Float32Array(position.count*3),cleanplate={value:null as T.Texture|null},separation={value:0};
 let key='',signature='';
 material.onBeforeCompile=shader=>{shader.uniforms.cosmicDisocclusion=cleanplate;shader.uniforms.cosmicSeparation=separation;shader.fragmentShader='uniform sampler2D cosmicDisocclusion;uniform float cosmicSeparation;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
  #ifdef USE_MAP
   vec4 originalRGB=texture2D(map,vMapUv);
   vec4 uncoveredRGB=texture2D(cosmicDisocclusion,vMapUv);
   diffuseColor*=mix(originalRGB,uncoveredRGB,cosmicSeparation);
  #endif
 `);};material.customProgramCacheKey=()=> 'original-opening-to-coherent-distant-backing';
 return{mesh,material,ready:Promise.resolve(),setHeroImage(texture:T.Texture,plate?:T.Texture){material.map=texture;cleanplate.value=plate??texture;material.needsUpdate=true;},setProjection(width:number,height:number,entrance:number){
  const next=width+':'+height+':'+entrance.toFixed(4);if(next===key)return;key=next;signature='';reference.aspect=width/height;const c=openingCameraPose(entrance);reference.position.fromArray(c.position);reference.lookAt(...c.target as[number,number,number]);reference.updateProjectionMatrix();reference.updateMatrixWorld();
  const aspect=width/height,rx=aspect<1.5?aspect/1.5:1,ry=aspect>1.5?1.5/aspect:1;
  for(let i=0;i<position.count;i++){const u=i%97/96,v=1-Math.floor(i/97)/64,wideU=(u-.5)*1.2+.5,wideV=(v-.5)*1.2+.5;point.set((wideU-.5)*2,(wideV-.5)*2,.5).unproject(reference).sub(reference.position);point.multiplyScalar((-4-reference.position.z)/point.z).add(reference.position);rest.set(point.toArray(),i*3);uv.setXY(i,wideU*rx+(1-rx)*.58,wideV*ry+(1-ry)*.5);}uv.needsUpdate=true;
 },update(p:number,e:number,pointerX=0,pointerY=0,_camera?:T.PerspectiveCamera){
  const next=[p,e,pointerX,pointerY].join(':');if(next===signature)return;signature=next;const pose=cosmicLayerPose(p),opening=cosmicOpeningPose(p,e,pointerX,pointerY);separation.value=pose.separation;material.opacity=pose.farOpacity;mesh.visible=pose.farOpacity>0;
  for(let i=0;i<position.count;i++){const u=i%97/96,v=1-Math.floor(i/97)/64;point.fromArray(rest,i*3);deformInitialCosmicVertex(point,u,v,opening);point.sub(reference.position).multiplyScalar(4.5).add(reference.position);position.setXYZ(i,point.x,point.y,point.z);}position.needsUpdate=true;geometry.computeBoundingSphere();mesh.updateMatrixWorld();
 }};
}

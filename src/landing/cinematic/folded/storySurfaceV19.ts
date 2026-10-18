import * as T from 'three';
import {cameraPose,smoothRange} from './poseSpaceV19';

// The same indexed timber floor unrolls into the entrance, including its folded sides.
export function surfacePose(progress:number,entrance=1){
 const p=Math.max(0,Math.min(1,progress)),open=smoothRange(.12,.8,p);
 return{center:[-11*open,-2.89,5-40*open],width:32+12*open,height:10+80*open,yaw:0,bend:6*smoothRange(.24,.65,p),pitch:0,open,entrance};
}
export function surfaceVertex(u:number,v:number,p:number,e=1){
 const s=surfacePose(p,e),side=smoothRange(.36,.5,Math.abs(u-.5));
 const depth=(v-.5)*s.height,far=smoothRange(-5,-22,depth+s.center[2]);
 return[(u-.5)*s.width,-.19*far+side*s.bend*far,depth]as const;
}
export function createStorySurface(scene:T.Scene,keep:<A extends{dispose:()=>void}>(a:A)=>A){
 const geometry=keep(new T.PlaneGeometry(1,1,64,72));
 const material=keep(new T.MeshStandardMaterial({color:'#4d2b1b',metalness:0,roughness:.72,side:T.DoubleSide,emissive:'#b27b56',emissiveIntensity:.025,toneMapped:false}));
 const reference=new T.PerspectiveCamera(38,16/9,.1,400),projection={value:new T.Matrix4()},heroImage={value:null as T.Texture|null},crop={value:new T.Vector4(1,1,0,0)};
 material.onBeforeCompile=shader=>{
  shader.uniforms.heroFloorImage=heroImage;shader.uniforms.heroFloorProjection=projection;shader.uniforms.heroFloorCrop=crop;
  shader.vertexShader='uniform mat4 heroFloorProjection;varying vec4 vHeroFloorProjection;varying vec3 vHeroFloorWorld;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvHeroFloorWorld=(modelMatrix*vec4(transformed,1.)).xyz;vHeroFloorProjection=heroFloorProjection*vec4(vHeroFloorWorld,1.);');
  shader.fragmentShader='uniform sampler2D heroFloorImage;uniform vec4 heroFloorCrop;varying vec4 vHeroFloorProjection;varying vec3 vHeroFloorWorld;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec2 floorUv=(vHeroFloorProjection.xy/vHeroFloorProjection.w*.5+.5)*heroFloorCrop.xy+heroFloorCrop.zw;
   vec3 sourceTimber=texture2D(heroFloorImage,clamp(floorUv,vec2(0.),vec2(1.))).rgb;
   float nativeFloor=1.-smoothstep(-3.,0.,vHeroFloorWorld.z)+smoothstep(-2.9,2.,vHeroFloorWorld.y);
   nativeFloor=clamp(nativeFloor,0.,1.);
   float grain=1.+.055*sin(vHeroFloorWorld.x*19.+sin(vHeroFloorWorld.z*.23)*.8)+.018*sin(vHeroFloorWorld.x*83.+sin(vHeroFloorWorld.z*.4));
   diffuseColor.rgb*=grain;
   diffuseColor.rgb=mix(sourceTimber,diffuseColor.rgb,nativeFloor);
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','outgoingLight=mix(diffuseColor.rgb,outgoingLight,.08+.92*nativeFloor);\n#include <opaque_fragment>');
 };
 material.customProgramCacheKey=()=> 'approved-universe-projected-timber-to-physical-entry';
 const mesh=new T.Mesh(geometry,material);mesh.name='HERO_TO_ROOM_SAME_INDEXED_TIMBER';mesh.castShadow=false;mesh.receiveShadow=true;mesh.frustumCulled=false;scene.add(mesh);
 const uv=geometry.getAttribute('uv'),position=geometry.getAttribute('position');let signature='';
 return{mesh,material,setHeroImage(texture:T.Texture){heroImage.value=texture;},setProjection(width:number,height:number,entrance:number){
  reference.aspect=width/height;const c=cameraPose(0,entrance,false);reference.position.fromArray(c.position);reference.lookAt(...c.target as [number,number,number]);reference.updateProjectionMatrix();reference.updateMatrixWorld();projection.value.multiplyMatrices(reference.projectionMatrix,reference.matrixWorldInverse);
  const imageAspect=1536/1024,viewAspect=width/height,rx=viewAspect<imageAspect?viewAspect/imageAspect:1,ry=viewAspect>imageAspect?imageAspect/viewAspect:1;crop.value.set(rx,ry,(1-rx)*.58,(1-ry)*.5);
 },update(p:number,e:number){const next=p.toFixed(5)+':'+e.toFixed(5);if(next===signature)return;signature=next;const s=surfacePose(p,e);for(let i=0;i<position.count;i++){const v=surfaceVertex(uv.getX(i),uv.getY(i),p,e);position.setXYZ(i,...v);}position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();mesh.position.fromArray(s.center);mesh.rotation.set(0,0,0);mesh.updateMatrixWorld();}};
}

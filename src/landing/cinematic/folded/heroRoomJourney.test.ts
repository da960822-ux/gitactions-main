import {expect,it,vi} from 'vitest';
import * as T from 'three';
import sharp from 'sharp';
import {createHeroRoomJourney} from './heroRoomJourney';
import {createApprovedGamingRoom} from './ApprovedGamingRoom';
import {heroContain,heroWorldProjection} from './initialCosmicHero';
import {roomVertex} from './approvedRoomGeometry';

it('hides the pose edit behind the actual source silhouette, preserving approved registration, reverse scroll and owned resources',async()=>{
 const preference={matches:false};vi.stubGlobal('matchMedia',()=>preference);
 const {data:matte,info}=await sharp('public/images/approved-couple-room/hero-near-source-opacity.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const base='public/images/approved-couple-room/';
 const [sourceAlpha,runtimeAlpha,sourcePlate,runtimePlate]=await Promise.all([
  sharp(base+'hero-near-source-alpha.png').extractChannel('alpha').raw().toBuffer(),
  sharp(base+'hero-near-source-opacity.png').extractChannel('alpha').raw().toBuffer(),
  sharp(base+'hero-cosmic-disocclusion-plate.png').ensureAlpha().raw().toBuffer(),
  sharp(base+'hero-cosmic-disocclusion-plate.webp').ensureAlpha().raw().toBuffer(),
 ]);
 expect(runtimeAlpha.equals(sourceAlpha)).toBe(true);expect(runtimePlate.equals(sourcePlate)).toBe(true);
 const alpha=(uv:T.Vector2)=>{
  const x=T.MathUtils.clamp(uv.x,0,1)*(info.width-1),y=(1-T.MathUtils.clamp(uv.y,0,1))*(info.height-1),x0=Math.floor(x),y0=Math.floor(y),dx=x-x0,dy=y-y0;
  const a=(px:number,py:number)=>matte[(Math.min(py,info.height-1)*info.width+Math.min(px,info.width-1))*4+3]/255;
  return a(x0,y0)*(1-dx)*(1-dy)+a(x0+1,y0)*dx*(1-dy)+a(x0,y0+1)*(1-dx)*dy+a(x0+1,y0+1)*dx*dy;
 };
 const loaded=new Map<string,T.Texture>(),disposals=new Map<T.Texture,ReturnType<typeof vi.fn>>();
 const load=vi.spyOn(T.TextureLoader.prototype,'loadAsync').mockImplementation(async path=>{
  const texture=new T.Texture({width:path.includes('outpaint')?1536:1672,height:path.includes('outpaint')?1024:941} as HTMLImageElement),dispose=vi.fn();
  texture.addEventListener('dispose',dispose);disposals.set(texture,dispose);loaded.set(path,texture);return texture;
 });
 const scene=new T.Scene(),owned=new Set<{dispose:()=>void}>(),canonical=createApprovedGamingRoom(scene,a=>{owned.add(a);return a;});await canonical.ready;
 canonical.root.rotation.y=.31;canonical.root.updateMatrixWorld(true);
 const originalMatrix=canonical.root.matrixWorld.clone(),art=scene.getObjectByName('BYTE_UNTOUCHED_APPROVED_ROOM_WITH_OUTER_ROWS') as T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>;
 art.updateWorldMatrix(true,false);
 const sourceGeometry=art.geometry,sourceMaterial=art.material,sourceMap=art.material.map!,sourceShader=art.material.onBeforeCompile;
 const sourceDisposals=[vi.spyOn(sourceGeometry,'dispose'),vi.spyOn(sourceMaterial,'dispose'),vi.spyOn(sourceMap,'dispose')];
 const journey=createHeroRoomJourney(scene,canonical,{width:1920,height:1080,portrait:'portrait',portraitMask:'mask'}),camera=new T.PerspectiveCamera();
 const mesh=(name:string)=>scene.getObjectByName(name) as T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>;
 const cameraState=()=>({position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),projection:camera.projectionMatrix.toArray()});
 const compile=(material:T.MeshBasicMaterial)=>{
  const shader={uniforms:{},fragmentShader:'#include <alphatest_fragment>'} as unknown as Parameters<typeof material.onBeforeCompile>[0];material.onBeforeCompile(shader,{} as T.WebGLRenderer);return shader;
 };
 const arrival=(w:number,h:number)=>{
  journey.update(1,camera);
  for(const [x,y]of[[-1,-1],[1,1]]){
   const q=new T.Vector3(...roomVertex((x+1)*836,(1-y)*470.5,0)).applyMatrix4(art.matrixWorld).project(camera);
   expect(q.x).toBeCloseTo(x*Math.min(1,(1672/941)/(w/h)),10);expect(q.y).toBeCloseTo(y*Math.min(1,(w/h)/(1672/941)),10);
  }
  expect(camera.fov).toBeCloseTo(48,10);expect(canonical.root.matrixWorld).toEqual(originalMatrix);expect(camera.view?.enabled??false).toBe(false);
 };
 try{
  await journey.ready;
  expect(scene.getObjectByName('OPAQUE_APPROVED_B_FOREGROUND')).toBeUndefined();
  for(const [w,h]of[[1920,1080],[1440,900]]){
   journey.resize(w,h);journey.update(0,camera);
   const clean=mesh('COSMIC_DISOCCLUSION_ONLY'),sky=mesh('ORIGINAL_COSMIC_SKY'),near=mesh('ORIGINAL_ARCH_TERRACE_SILHOUETTE'),feather=mesh('ORIGINAL_ARCH_TERRACE_FEATHER'),standing=mesh('RIGID_APPROVED_PORTRAIT');
   expect(near.material.map).toBe(loaded.get('/images/our-universe-scene.webp'));expect(feather.material.map).toBe(near.material.map);
   expect(near.material).toMatchObject({transparent:false,opacity:1,alphaTest:.5,depthWrite:true});expect(feather.material).toMatchObject({transparent:true,opacity:1,alphaTest:.005,depthWrite:false});
   expect(standing.material.map).toBe(loaded.get('portrait'));expect(standing.material.alphaMap).toBe(loaded.get('mask'));expect(standing.material.opacity).toBe(1);
   const nearShader=compile(near.material),featherShader=compile(feather.material),skyShader=compile(sky.material);
   expect(nearShader.uniforms.heroSourceMatte.value).toBe(loaded.get('/images/approved-couple-room/hero-near-source-opacity.png'));
   expect(nearShader.uniforms.heroSourceMatte.value.colorSpace).toBe(T.NoColorSpace);
   expect([skyShader,nearShader,featherShader].map(shader=>shader.uniforms.heroMatteMode.value)).toEqual([0,1,2]);
   const cp=sky.geometry.getAttribute('position'),cu=sky.geometry.getAttribute('uv'),pp=standing.geometry.getAttribute('position'),portraitMatrix=standing.matrixWorld.clone();
   const rest=Array.from(near.geometry.getAttribute('position').array),portraitVertices=Array.from(pp.array),rx=w/h<1.5?(w/h)/1.5:1,ry=w/h>1.5?1.5/(w/h):1;
   for(let row=1;row<=41;row++)for(let column=1;column<=65;column++){
    const i=row*67+column,u=(column-1)/64,v=(row-1)/40,q=new T.Vector3().fromBufferAttribute(cp,i).applyMatrix4(sky.matrixWorld).project(camera);
    expect(q.x).toBeCloseTo((2*u-1)/rx,6);expect(q.y).toBeCloseTo((1-2*v)/ry,6);expect(cu.getX(i)).toBeCloseTo(u,6);expect(cu.getY(i)).toBeCloseTo(1-v,6);
   }
   const oldMatrix=new T.Matrix4().makeScale(2,2,2).multiply(new T.Matrix4().makeTranslation(6,-.5,-3.1-heroContain(w,h))).multiply(heroWorldProjection(w,h,1)).multiply(new T.Matrix4().makeTranslation(1.85,.03,.05));
   const oldCamera=new T.PerspectiveCamera(48,w/h,.02,120);oldCamera.updateMatrixWorld();
   for(let i=0;i<pp.count;i++){
    const oldPoint=new T.Vector3().fromBufferAttribute(pp,i).applyMatrix4(oldMatrix).project(oldCamera),point=new T.Vector3().fromBufferAttribute(pp,i).applyMatrix4(standing.matrixWorld).project(camera);
    expect(point.x).toBeCloseTo(oldPoint.x,10);expect(point.y).toBeCloseTo(oldPoint.y,10);
   }
   const ray=new T.Raycaster();
   // Test the real RGBA asset, including hypothetical residual pointer extremes; the host actually decays pointer to zero by q.06.
   for(const p of[.209999,.210001])for(const [px,py]of[[0,0],[-1,-1],[1,-1],[-1,1],[1,1]]){
    journey.update(p,camera);camera.translateX(px*.035);camera.translateY(py*.018);camera.updateMatrixWorld(true);journey.syncView(camera);
    for(let x=-1;x<=1;x+=.2)for(let y=-1;y<=1;y+=.2){
     ray.setFromCamera(new T.Vector2(x,y),camera);const hit=ray.intersectObject(near,false)[0];
     expect(hit,`silhouette misses ${w} q${p} ${x},${y}`).toBeDefined();expect(alpha(hit.uv!),`nonopaque source at ${hit.uv!.toArray()}`).toBeGreaterThanOrEqual(.98);
     expect(hit.uv!.x).toBeLessThan(.34);expect(near.visible).toBe(true);
    }
   }
   expect(nearShader.uniforms.heroArchOnly.value).toBe(1);expect(featherShader.uniforms.heroArchOnly.value).toBe(1);
   const standingFaces=[[.28,.24],[.7,.27]].map(([u,v])=>new T.Vector3((u-.5)*6.2*1312/1199,(.5-v)*6.2,0).applyMatrix4(standing.matrixWorld));
   const seatedFaces=[[455,310],[1160,350]].map(([x,y])=>new T.Vector3(...roomVertex(x,y,0)).applyMatrix4(art.matrixWorld));
   const visible=(point:T.Vector3)=>{
    const q=point.clone().project(camera);if(Math.abs(q.x)>1||Math.abs(q.y)>1||q.z<-1||q.z>1)return false;
    ray.setFromCamera(new T.Vector2(q.x,q.y),camera);
    return !ray.intersectObjects([near,sky,clean].filter(mesh=>mesh.visible),false).some(hit=>{
     if(hit.distance>=camera.position.distanceTo(point)-1e-5)return false;
     if(hit.object===clean)return true;
     if(hit.object===sky)return alpha(hit.uv!)<.005;
     return alpha(hit.uv!)>=.98&&(nearShader.uniforms.heroArchOnly.value===0||hit.uv!.x<.34);
    });
   };
   let previousSize:number|undefined;
   for(let step=0;step<=100;step++){
    const p=step/100;journey.update(p,camera);
    const outgoing=standing.visible&&standingFaces.some(visible),incoming=seatedFaces.some(visible);expect(outgoing&&incoming,`two poses q${p}`).toBe(false);
    if(standing.visible)expect(incoming,`B leaks through departing source q${p}`).toBe(false);
    const left=new T.Vector3(...roomVertex(0,470.5,0)).applyMatrix4(art.matrixWorld).project(camera),right=new T.Vector3(...roomVertex(1672,470.5,0)).applyMatrix4(art.matrixWorld).project(camera),size=right.x-left.x;
    if(previousSize!==undefined)expect(size).toBeCloseTo(previousSize,10);previousSize=size;
    expect(Array.from(near.geometry.getAttribute('position').array)).toEqual(rest);expect(Array.from(pp.array)).toEqual(portraitVertices);expect(standing.matrixWorld).toEqual(portraitMatrix);
   }
   journey.update(.26,camera);const middle=cameraState();for(const p of[1,.1,.34,.16,.26])journey.update(p,camera);expect(cameraState()).toEqual(middle);
   for(const p of[.06,.18,.21,.24,.33,.42]){
    journey.update(p-1e-6,camera);const before=camera.position.clone(),fov=camera.fov;journey.update(p+1e-6,camera);expect(before.distanceTo(camera.position)).toBeLessThan(1e-3);expect(Math.abs(fov-camera.fov)).toBeLessThan(1e-3);
   }
   arrival(w,h);const arrived=cameraState();journey.update(.42,camera);expect(cameraState()).toEqual(arrived);
   // Reduced motion is a stationary semantic edit, with no close-up/dolly, and reacts to the live preference immediately.
   preference.matches=true;journey.update(0,camera);const reducedStart=cameraState();
   for(const p of[.1,.16,.209999]){journey.update(p,camera);expect(cameraState()).toEqual(reducedStart);expect(standing.visible&&near.visible&&feather.visible).toBe(true);expect(nearShader.uniforms.heroArchOnly.value).toBe(0);}
   for(const p of[.21,.26,.7,1]){journey.update(p,camera);expect(cameraState()).toEqual(arrived);expect(standing.visible||near.visible||feather.visible||sky.visible).toBe(false);}
   preference.matches=false;journey.update(.26,camera);expect(cameraState()).toEqual(middle);expect(near.visible&&feather.visible).toBe(true);
  }
  expect(art.material).toBe(sourceMaterial);expect(art.geometry).toBe(sourceGeometry);expect(art.material.map).toBe(sourceMap);expect(art.material.onBeforeCompile).toBe(sourceShader);
  const oldStage=scene.getObjectByName('HERO_ROOM_JOURNEY')!,oldGeometry=mesh('ORIGINAL_ARCH_TERRACE_SILHOUETTE').geometry,oldDispose=vi.spyOn(oldGeometry,'dispose');
  journey.setActive(false);expect(oldStage.visible).toBe(false);const inactive=cameraState();journey.update(.12,camera);expect(cameraState()).toEqual(inactive);
  journey.resize(1920,1080);expect(oldStage.parent).toBeNull();expect(oldDispose).toHaveBeenCalledOnce();journey.setActive(true);arrival(1920,1080);
  const heroMaps=[...loaded.entries()].filter(([path])=>!path.includes('approved-couple-gaming-room')&&!path.includes('outpaint')).map(([,texture])=>texture);
  journey.dispose();journey.dispose();expect(scene.children).toEqual([canonical.root]);expect(canonical.root.matrixWorld).toEqual(originalMatrix);
  for(const dispose of sourceDisposals)expect(dispose).not.toHaveBeenCalled();for(const texture of heroMaps)expect(disposals.get(texture)).toHaveBeenCalledOnce();
  let resolveRoom!:()=>void;const late={...canonical,ready:new Promise<void>(resolve=>{resolveRoom=resolve;})},before=disposals.size;
  const cancelled=createHeroRoomJourney(scene,late,{width:1920,height:1080,portrait:'late-portrait',portraitMask:'late-mask'});cancelled.dispose();resolveRoom();await cancelled.ready;
  for(const dispose of [...disposals.values()].slice(before))expect(dispose).toHaveBeenCalledOnce();expect(scene.children).toEqual([canonical.root]);
 }finally{
  vi.unstubAllGlobals();journey.dispose();sourceDisposals.forEach(mock=>mock.mockRestore());owned.forEach(asset=>asset.dispose());load.mockRestore();
 }
});

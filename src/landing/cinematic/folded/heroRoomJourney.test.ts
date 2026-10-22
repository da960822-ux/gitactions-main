import {expect,it,vi} from 'vitest';
import * as T from 'three';
import {createHeroRoomJourney} from './heroRoomJourney';
import {heroContain,heroWorldProjection} from './initialCosmicHero';

it('keeps opaque source-masked people in front of the depth handoff, exact endpoints and reversible owned resources',async()=>{
 const preference={matches:false};vi.stubGlobal('matchMedia',()=>preference);
 const loaded=new Map<string,T.Texture>(),disposals:ReturnType<typeof vi.fn>[]=[];
 const load=vi.spyOn(T.TextureLoader.prototype,'loadAsync').mockImplementation(async path=>{
  const texture=new T.Texture<HTMLImageElement>(),dispose=vi.fn();texture.addEventListener('dispose',dispose);disposals.push(dispose);loaded.set(path,texture);return texture;
 });
 const scene=new T.Scene(),root=new T.Group(),ratio=1672/941,height=48*Math.tan(T.MathUtils.degToRad(24));
 const geometry=new T.PlaneGeometry(height*ratio,height),originalMap=new T.Texture();
 const stencil={stencilWrite:false,stencilRef:7,stencilFunc:T.GreaterStencilFunc,stencilFail:T.ReplaceStencilOp,stencilZFail:T.IncrementStencilOp,stencilZPass:T.DecrementStencilOp} as const;
 const material=new T.MeshBasicMaterial({...stencil,map:originalMap}),art=new T.Mesh(geometry,material);art.name='BYTE_UNTOUCHED_APPROVED_ROOM_WITH_OUTER_ROWS';
 const outerRows={value:new T.Texture()},sourceCompile=vi.fn<typeof material.onBeforeCompile>();
 material.onBeforeCompile=(shader,renderer)=>{
  sourceCompile(shader,renderer);shader.uniforms.roomOuterRows=outerRows;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','ORIGINAL_ROOM_RGB_AND_APPROVED_OUTER_ROWS');
 };
 material.customProgramCacheKey=()=> 'canonical-original-and-outer-rows';
 root.position.set(-6,.5,-10);root.rotation.y=.31;root.scale.setScalar(.4);root.add(art);scene.add(root);root.updateMatrixWorld(true);
 const originalMatrix=root.matrixWorld.clone(),geometryDispose=vi.spyOn(geometry,'dispose'),materialDispose=vi.spyOn(material,'dispose'),mapDispose=vi.spyOn(originalMap,'dispose');
 const canonical={root,floor:art,anchor:new T.Vector3(),ready:Promise.resolve(),setOpacity(){},updateExit(){},updateDesk(){},updateFold(){}};
 const journey=createHeroRoomJourney(scene,canonical,{width:1920,height:1080,portrait:'portrait',portraitMask:'mask'}),camera=new T.PerspectiveCamera();
 const mesh=(name:string)=>scene.getObjectByName(name) as T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>;
 const cameraState=()=>({position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),projection:camera.projectionMatrix.toArray()});
 const arrival=(w:number,h:number)=>{
  journey.update(1,camera);
  for(const [x,y]of[[-1,-1],[1,1]]){
   const q=new T.Vector3(x*geometry.parameters.width/2,y*geometry.parameters.height/2,0).applyMatrix4(root.matrixWorld).project(camera);
   expect(q.x).toBeCloseTo(x*Math.min(1,ratio/(w/h)),10);expect(q.y).toBeCloseTo(y*Math.min(1,(w/h)/ratio),10);
  }
  expect(camera.fov).toBe(48);expect(root.matrixWorld).toEqual(originalMatrix);expect(material).toMatchObject(stencil);
 };
 try{
  await journey.ready;
  const surface=mesh('INDEXED_COSMIC_DEPARTURE_SURFACE'),portrait=mesh('RIGID_APPROVED_PORTRAIT'),seated=mesh('OPAQUE_APPROVED_B_FOREGROUND');
  expect(seated.material.map).toBe(originalMap);expect(seated.material).not.toBe(material);
  expect(seated.geometry).not.toBe(geometry);expect(Array.from(seated.geometry.getAttribute('uv').array)).toEqual(Array.from(geometry.getAttribute('uv').array));
  material.opacity=.25;material.transparent=true;expect(seated.material.opacity).toBe(1);expect(seated.material.transparent).toBe(false);material.opacity=1;material.transparent=false;
  expect(seated.material).toMatchObject({transparent:false,opacity:1,alphaTest:.5,alphaToCoverage:true,depthTest:false,depthWrite:false});expect(seated.renderOrder).toBeGreaterThan(surface.renderOrder);
  const shader={uniforms:{},fragmentShader:'#include <map_fragment>\n#include <alphatest_fragment>'} as unknown as Parameters<typeof seated.material.onBeforeCompile>[0];
  seated.material.onBeforeCompile(shader,{} as T.WebGLRenderer);
  expect(shader.uniforms.heroSemanticMask.value).toBe(loaded.get('/images/approved-couple-room/foreground-semantic-mask.png'));
  expect(shader.uniforms.heroSemanticMask.value.colorSpace).toBe(T.NoColorSpace);
  expect(sourceCompile).toHaveBeenCalledOnce();expect(shader.uniforms.roomOuterRows).toBe(outerRows);
  expect(shader.fragmentShader).toContain('ORIGINAL_ROOM_RGB_AND_APPROVED_OUTER_ROWS');
  expect(seated.material.customProgramCacheKey()).toContain(material.customProgramCacheKey());
  expect(shader.fragmentShader).toContain('clamp(vMapUv,vec2(0.),vec2(1.))');expect(shader.fragmentShader).not.toContain('maskUv.y<0.');
  const portraitVertices=Array.from(portrait.geometry.getAttribute('position').array),portraitMatrix=portrait.matrix.clone();
  journey.update(0,camera);
  const rest=Array.from(surface.geometry.getAttribute('position').array),uv=Array.from(surface.geometry.getAttribute('uv').array);
  expect(surface.geometry.index).not.toBeNull();expect(surface.geometry.getAttribute('position').count).toBeGreaterThan(1000);
  for(const p of[.12,.20,.239999]){
   journey.update(p,camera);expect(portrait.parent!.visible).toBe(true);expect(seated.visible).toBe(false);
   expect(portrait.material.opacity).toBe(1);expect(portrait.parent!.position.toArray()).toEqual([0,0,0]);expect(portrait.parent!.scale.toArray()).toEqual([1,1,1]);
  }
  journey.update(.24,camera);expect(portrait.parent!.visible).toBe(false);expect(seated.visible).toBe(true);expect(seated.material.opacity).toBe(1);
  journey.update(.35,camera);
  const deformed=Array.from(surface.geometry.getAttribute('position').array),normals=Array.from(surface.geometry.getAttribute('normal').array),pose=cameraState();
  const position=surface.geometry.getAttribute('position');
  expect(position.getZ(21*67+33)).toBeLessThan(position.getZ(0)-.3);expect(camera.userData.heroSurface.sourceDepth).toBeGreaterThan(1.75);
  expect(surface.material).toMatchObject({opacity:1,transparent:false,depthTest:true,depthWrite:true});
  expect(Array.from(surface.geometry.getAttribute('uv').array)).toEqual(uv);expect(Array.from(portrait.geometry.getAttribute('position').array)).toEqual(portraitVertices);expect(portrait.matrix).toEqual(portraitMatrix);
  for(const p of[1,.20,.42,.35])journey.update(p,camera);
  expect(cameraState()).toEqual(pose);expect(Array.from(position.array)).toEqual(deformed);expect(Array.from(surface.geometry.getAttribute('normal').array)).toEqual(normals);
  journey.update(.42,camera);expect(surface.visible).toBe(false);expect(seated.visible).toBe(false);expect(portrait.parent!.visible).toBe(false);
  expect(camera.userData.heroSurface.sourceDepth).toBeGreaterThan(camera.userData.heroSurface.roomDepth);
  for(let i=0;i<position.count;i++)expect(-position.getZ(i)).toBeGreaterThan(camera.userData.heroSurface.roomDepth);
  journey.update(0,camera);expect(Array.from(position.array)).toEqual(rest);

  for(const [w,h]of[[1920,1080],[1440,900]]){
   journey.resize(w,h);journey.update(0,camera);
   const cosmic=mesh('INDEXED_COSMIC_DEPARTURE_SURFACE'),standing=mesh('RIGID_APPROVED_PORTRAIT'),incoming=mesh('OPAQUE_APPROVED_B_FOREGROUND');
   const cp=cosmic.geometry.getAttribute('position'),cu=cosmic.geometry.getAttribute('uv'),pp=standing.geometry.getAttribute('position'),ip=incoming.geometry.getAttribute('position');
   const rx=w/h<1.5?(w/h)/1.5:1,ry=w/h>1.5?1.5/(w/h):1;
   for(let row=1;row<=41;row++)for(let column=1;column<=65;column++){
    const i=row*67+column,u=(column-1)/64,v=(row-1)/40,q=new T.Vector3().fromBufferAttribute(cp,i).applyMatrix4(cosmic.matrixWorld).project(camera);
    expect(q.x).toBeCloseTo((2*u-1)/rx,6);expect(q.y).toBeCloseTo((1-2*v)/ry,6);expect(cu.getX(i)).toBeCloseTo(u,6);expect(cu.getY(i)).toBeCloseTo(1-v,6);
   }
   const oldMatrix=new T.Matrix4().makeScale(2,2,2).multiply(new T.Matrix4().makeTranslation(6,-.5,-3.1-heroContain(w,h))).multiply(heroWorldProjection(w,h,1)).multiply(new T.Matrix4().makeTranslation(1.85,.03,.05));
   const oldCamera=new T.PerspectiveCamera(48,w/h,.02,120);oldCamera.updateMatrixWorld();
   for(let i=0;i<pp.count;i++){
    const oldPoint=new T.Vector3().fromBufferAttribute(pp,i).applyMatrix4(oldMatrix).project(oldCamera),point=new T.Vector3().fromBufferAttribute(pp,i).applyMatrix4(standing.matrixWorld).project(camera);
    expect(point.x).toBeCloseTo(oldPoint.x,10);expect(point.y).toBeCloseTo(oldPoint.y,10);
   }
   const ray=new T.Raycaster(),center=camera.clone();
   for(const px of[-1,1])for(const py of[-1,1]){
    camera.copy(center);camera.translateX(px*.035);camera.translateY(py*.018);camera.updateMatrixWorld(true);journey.syncView(camera);
    for(const x of[-1,1])for(const y of[-1,1]){ray.setFromCamera(new T.Vector2(x,y),camera);expect(ray.intersectObject(cosmic,false).length).toBeGreaterThan(0);}
   }
   for(let step=0;step<=100;step++){
    const p=step/100;journey.update(p,camera);
    // Opaque semantic foreground protects all its source pixels from cosmic depth crossing; exactly one pose is present.
    if(p<.42)expect(Number(standing.parent!.visible)+Number(incoming.visible)).toBe(1);
    expect(cosmic.material.opacity).toBe(1);expect(incoming.material.opacity).toBe(1);expect(incoming.material.transparent).toBe(false);
    for(let i=0;i<ip.count;i++){
     const q=new T.Vector3().fromBufferAttribute(ip,i).applyMatrix4(incoming.matrixWorld).project(camera),original=new T.Vector3().fromBufferAttribute(geometry.getAttribute('position'),i).applyMatrix4(art.matrixWorld).project(camera);
     expect(q.x).toBeCloseTo(original.x,10);expect(q.y).toBeCloseTo(original.y,10);
     expect(Math.abs(original.x)).toBeLessThanOrEqual(1+1e-6);expect(Math.abs(original.y)).toBeLessThanOrEqual(1+1e-6);
    }
    if(p<=.42)for(const x of[-1,1])for(const y of[-1,1]){ray.setFromCamera(new T.Vector2(x,y),camera);expect(ray.intersectObject(cosmic,false).length,`cosmic contour entered ${w} p${p}`).toBeGreaterThan(0);}
   }
   arrival(w,h);
   for(const p of[.18,.20,.22,.24,.28,.35,.42]){
    journey.update(p-1e-6,camera);const before=camera.position.clone();journey.update(p+1e-6,camera);expect(before.distanceTo(camera.position)).toBeLessThan(1e-4);
   }
  }
  const current=mesh('INDEXED_COSMIC_DEPARTURE_SURFACE');journey.update(.35,camera);const normal=Array.from(current.geometry.getAttribute('position').array),normalCamera=cameraState();
  preference.matches=true;journey.update(.35,camera);expect(current.material).toMatchObject({opacity:1,transparent:false});expect(mesh('OPAQUE_APPROVED_B_FOREGROUND').visible).toBe(true);
  preference.matches=false;journey.update(.35,camera);expect(Array.from(current.geometry.getAttribute('position').array)).toEqual(normal);expect(cameraState()).toEqual(normalCamera);
  journey.resize(1920,1080);arrival(1920,1080);
  const oldStage=scene.getObjectByName('HERO_ROOM_JOURNEY')!,oldGeometry=mesh('INDEXED_COSMIC_DEPARTURE_SURFACE').geometry,oldDispose=vi.spyOn(oldGeometry,'dispose');
  journey.setActive(false);expect(oldStage.visible).toBe(false);const inactive=cameraState();journey.update(.12,camera);expect(cameraState()).toEqual(inactive);
  journey.resize(1440,900);expect(oldStage.parent).toBeNull();expect(oldDispose).toHaveBeenCalledOnce();journey.setActive(true);arrival(1440,900);
  journey.dispose();journey.dispose();expect(scene.children).toEqual([root]);expect(root.matrixWorld).toEqual(originalMatrix);expect(material).toMatchObject(stencil);
  expect(geometryDispose).not.toHaveBeenCalled();expect(materialDispose).not.toHaveBeenCalled();expect(mapDispose).not.toHaveBeenCalled();for(const dispose of disposals)expect(dispose).toHaveBeenCalledOnce();
  let resolveRoom!:()=>void;const late={...canonical,ready:new Promise<void>(resolve=>{resolveRoom=resolve;})},before=disposals.length;
  const cancelled=createHeroRoomJourney(scene,late,{width:1920,height:1080,portrait:'portrait',portraitMask:'mask'});cancelled.dispose();resolveRoom();await cancelled.ready;
  expect(disposals.length).toBeGreaterThan(before);for(const dispose of disposals.slice(before))expect(dispose).toHaveBeenCalledOnce();expect(scene.children).toEqual([root]);expect(mapDispose).not.toHaveBeenCalled();
 }finally{
  vi.unstubAllGlobals();journey.dispose();geometryDispose.mockRestore();materialDispose.mockRestore();mapDispose.mockRestore();geometry.dispose();material.dispose();originalMap.dispose();outerRows.value.dispose();load.mockRestore();
 }
});

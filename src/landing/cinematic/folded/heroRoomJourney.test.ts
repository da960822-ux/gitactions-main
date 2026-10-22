import {expect,it,vi} from 'vitest';
import * as T from 'three';
import {createHeroRoomJourney} from './heroRoomJourney';
import {heroContain,heroWorldProjection} from './initialCosmicHero';

it('preserves canonical B framing and reversible poses without owning B resources, including disposal before ready',async()=>{
 const motionPreference={matches:false};vi.stubGlobal('matchMedia',()=>motionPreference);
 const textureDisposals:ReturnType<typeof vi.fn>[]=[];
 const load=vi.spyOn(T.TextureLoader.prototype,'loadAsync').mockImplementation(async()=>{
  const texture=new T.Texture<HTMLImageElement>(),disposed=vi.fn();
  texture.addEventListener('dispose',disposed);textureDisposals.push(disposed);
  return texture;
 });
 const scene=new T.Scene(),root=new T.Group(),ratio=1672/941;
 const height=2*24*Math.tan(T.MathUtils.degToRad(48/2));
 const geometry=new T.PlaneGeometry(height*ratio,height);
 const originalStencil={stencilWrite:false,stencilRef:7,stencilFunc:T.GreaterStencilFunc,stencilFail:T.ReplaceStencilOp,stencilZFail:T.IncrementStencilOp,stencilZPass:T.DecrementStencilOp} as const;
 const material=new T.MeshBasicMaterial(originalStencil),art=new T.Mesh(geometry,material);
 root.position.set(-6,.5,-10);root.rotation.y=.31;root.scale.setScalar(.4);root.add(art);scene.add(root);root.updateMatrixWorld(true);
 const originalMatrix=root.matrixWorld.clone(),geometryDispose=vi.spyOn(geometry,'dispose'),materialDispose=vi.spyOn(material,'dispose');
 const canonical={root,floor:art,anchor:new T.Vector3(),ready:Promise.resolve(),setOpacity(){},updateExit(){},updateDesk(){},updateFold(){}};
 const journey=createHeroRoomJourney(scene,canonical,{width:1920,height:1080,portrait:'portrait',portraitMask:'mask'});
 const camera=new T.PerspectiveCamera();
 const cameraState=()=>({position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),fov:camera.fov,projection:camera.projectionMatrix.toArray()});
 const arrival=(width:number,height:number)=>{
  journey.update(1,camera);
  // The approved complete source fits the viewport; this uses its physical corners, not the journey's endpoint formula.
  const halfX=Math.min(1,ratio/(width/height)),halfY=Math.min(1,(width/height)/ratio);
  for(const [x,y]of[[-1,-1],[1,1]]){
   const corner=new T.Vector3(x*geometry.parameters.width/2,y*geometry.parameters.height/2,0).applyMatrix4(root.matrixWorld).project(camera);
   expect(corner.x).toBeCloseTo(x*halfX,10);expect(corner.y).toBeCloseTo(y*halfY,10);
  }
  expect(camera.fov).toBe(48);expect(root.matrixWorld).toEqual(originalMatrix);
 };
 try{
  await journey.ready;
  expect(material).toMatchObject(originalStencil);
  arrival(1920,1080);
  journey.update(.42,camera);const outbound=cameraState();
  for(const progress of[1,.3,.42])journey.update(progress,camera);
  expect(cameraState()).toEqual(outbound);

  const surface=scene.getObjectByName('INDEXED_COSMIC_DEPARTURE_SURFACE') as T.Mesh<T.PlaneGeometry>;
  const portrait=scene.getObjectByName('RIGID_APPROVED_PORTRAIT') as T.Mesh<T.PlaneGeometry>;
  const portraitVertices=Array.from(portrait.geometry.getAttribute('position').array);
  const portraitRestMatrix=portrait.matrix.clone();
  journey.update(0,camera);
  const rest=Array.from(surface.geometry.getAttribute('position').array),uv=Array.from(surface.geometry.getAttribute('uv').array),startEye=camera.position.clone();
  expect(surface.geometry.index).not.toBeNull();expect(surface.geometry.getAttribute('position').count).toBeGreaterThan(1000);
  // The outgoing source has the exact old cover projection, re-registered close to B.
  const positions=surface.geometry.getAttribute('position');
  for(const i of[68,41*67+65]){
   const projected=new T.Vector3().fromBufferAttribute(positions,i).applyMatrix4(surface.matrixWorld).project(camera);
   expect(Math.abs(projected.x)).toBeCloseTo(1,6);expect(Math.abs(projected.y)).toBeCloseTo((1920/1080)/1.5,6);
  }
  for(const p of[.12,.2]){
   journey.update(p,camera);if(p<.18)expect(Array.from(positions.array)).toEqual(rest);
   expect((portrait.material as T.MeshBasicMaterial).opacity).toBe(1);expect(portrait.parent!.position.toArray()).toEqual([0,0,0]);expect(portrait.parent!.scale.toArray()).toEqual([1,1,1]);
  }
  journey.update(.24,camera);const handoffPosition=portrait.parent!.position.clone();
  expect((portrait.material as T.MeshBasicMaterial).opacity).toBeCloseTo(.5,10);expect(handoffPosition.length()).toBeGreaterThan(0);
  journey.update(.3,camera);expect((portrait.material as T.MeshBasicMaterial).opacity).toBe(0);
  journey.update(.24,camera);expect(portrait.parent!.position).toEqual(handoffPosition);expect((portrait.material as T.MeshBasicMaterial).opacity).toBeCloseTo(.5,10);
  journey.update(.28,camera);
  const bent=Array.from(positions.array),normal=Array.from(surface.geometry.getAttribute('normal').array);
  expect(camera.userData.heroSurface.maxVertexDisplacement).toBeCloseTo(.30,10);
  expect(camera.userData.heroSurface.bend).toBeGreaterThan(.2);
  expect(Array.from(surface.geometry.getAttribute('uv').array)).toEqual(uv);
  expect((surface.material as T.MeshBasicMaterial).opacity).toBe(1);
  const sourceUV=surface.geometry.getAttribute('uv');
  for(let i=0;i<positions.count;i++){
   expect(positions.getX(i)).toBe(rest[i*3]);expect(positions.getY(i)).toBe(rest[i*3+1]);
   if(sourceUV.getX(i)===0||sourceUV.getX(i)===1||sourceUV.getY(i)===0||sourceUV.getY(i)===1)expect(positions.getZ(i)).toBe(rest[i*3+2]);
  }
  journey.update(.35,camera);expect((surface.material as T.MeshBasicMaterial).opacity).toBeCloseTo(.5,10);

  expect(Array.from(portrait.geometry.getAttribute('position').array)).toEqual(portraitVertices);
  expect(portrait.matrix).toEqual(portraitRestMatrix);
  journey.update(1,camera);expect(surface.visible).toBe(false);expect(portrait.parent!.visible).toBe(false);
  expect(startEye.distanceTo(camera.position)/.4).toBeLessThan(4);
  journey.update(.28,camera);expect(Array.from(positions.array)).toEqual(bent);expect(Array.from(surface.geometry.getAttribute('normal').array)).toEqual(normal);
  journey.update(0,camera);expect(Array.from(positions.array)).toEqual(rest);

  for(const [w,h]of[[1920,1080],[1440,900]]){
   journey.resize(w,h);
   const outgoing=scene.getObjectByName('RIGID_APPROVED_PORTRAIT') as T.Mesh;
   const facePositions=outgoing.geometry.getAttribute('position');
   const oldPortraitMatrix=new T.Matrix4().makeScale(2,2,2).multiply(new T.Matrix4().makeTranslation(6,-.5,-3.1-heroContain(w,h))).multiply(heroWorldProjection(w,h,1)).multiply(new T.Matrix4().makeTranslation(1.85,.03,.05));
   const oldCamera=new T.PerspectiveCamera(48,w/h,.02,120);oldCamera.updateMatrixWorld();
   journey.update(0,camera);
   const cosmicSurface=scene.getObjectByName('INDEXED_COSMIC_DEPARTURE_SURFACE') as T.Mesh;
   const cosmicPositions=cosmicSurface.geometry.getAttribute('position'),cosmicUV=cosmicSurface.geometry.getAttribute('uv');
   // Every original 64×40 cell retains its old source registration; only an extra edge ring bleeds outward.
   const rx=w/h<1.5?(w/h)/1.5:1,ry=w/h>1.5?1.5/(w/h):1;
   for(let row=1;row<=41;row++)for(let column=1;column<=65;column++){
    const i=row*67+column,u=(column-1)/64,v=(row-1)/40;
    const ndc=new T.Vector3().fromBufferAttribute(cosmicPositions,i).applyMatrix4(cosmicSurface.matrixWorld).project(camera);
    expect(ndc.x).toBeCloseTo((2*u-1)/rx,6);expect(ndc.y).toBeCloseTo((1-2*v)/ry,6);
    expect(cosmicUV.getX(i)).toBeCloseTo(u,6);expect(cosmicUV.getY(i)).toBeCloseTo(1-v,6);
   }
   const raycaster=new T.Raycaster(),centerCamera=camera.clone();
   for(const pointerX of[-1,1])for(const pointerY of[-1,1]){
    camera.copy(centerCamera);camera.translateX(pointerX*.035);camera.translateY(pointerY*.018);camera.updateMatrixWorld(true);journey.syncView(camera);
    for(const x of[-1,1])for(const y of[-1,1]){
     raycaster.setFromCamera(new T.Vector2(x,y),camera);
     expect(raycaster.intersectObject(cosmicSurface,false).length,`uncovered cosmic corner ${w} pointer(${pointerX},${pointerY}) screen(${x},${y})`).toBeGreaterThan(0);
    }
   }
   // The full-frame membrane remains in front of every viewport corner until its bounded reveal is complete.
   for(let step=0;step<=42;step++){
    journey.update(step/100,camera);
    for(const x of[-1,1])for(const y of[-1,1]){
     raycaster.setFromCamera(new T.Vector2(x,y),camera);
     expect(raycaster.intersectObject(cosmicSurface,false).length,`membrane contour entered viewport at ${w} p${step/100}`).toBeGreaterThan(0);
    }
   }
   journey.update(0,camera);
   for(let i=0;i<facePositions.count;i++){
    const oldPoint=new T.Vector3().fromBufferAttribute(facePositions,i).applyMatrix4(oldPortraitMatrix).project(oldCamera);
    const newPoint=new T.Vector3().fromBufferAttribute(facePositions,i).applyMatrix4(outgoing.matrixWorld).project(camera);
    expect(newPoint.x).toBeCloseTo(oldPoint.x,10);expect(newPoint.y).toBeCloseTo(oldPoint.y,10);
   }
   let openingBounds:T.Box3|undefined;
   for(let step=0;step<=100;step++){
    const p=step/100;journey.update(p,camera);
    // B remains fully framed throughout, including both face regions and every source corner.
    for(const [x,y]of[[-1,-1],[1,-1],[-1,1],[1,1]]){
     const corner=new T.Vector3(x*geometry.parameters.width/2,y*geometry.parameters.height/2,0).applyMatrix4(root.matrixWorld).project(camera);
     expect(Math.abs(corner.x)).toBeLessThanOrEqual(1+1e-10);expect(Math.abs(corner.y)).toBeLessThanOrEqual(1+1e-10);
    }
    if(p<=.30){
     const bounds=new T.Box3().setFromPoints(Array.from({length:facePositions.count},(_,i)=>new T.Vector3().fromBufferAttribute(facePositions,i).applyMatrix4(outgoing.matrixWorld).project(camera)));
     if(!openingBounds)openingBounds=bounds.clone();
     const size=bounds.getSize(new T.Vector3()),openingSize=openingBounds.getSize(new T.Vector3());
     expect(size.x).toBeLessThanOrEqual(openingSize.x+1e-6);expect(size.y).toBeLessThanOrEqual(openingSize.y+1e-6);
    }
   }
   arrival(w,h);
   // Small reversals at the dolly, portrait and surface boundaries cannot jump the view.
   for(const p of[.18,.20,.22,.28,.30,.36,.42,.50]){
    journey.update(p-1e-6,camera);const before=root.getWorldPosition(new T.Vector3()).project(camera),eye=camera.position.clone();
    journey.update(p+1e-6,camera);const after=root.getWorldPosition(new T.Vector3()).project(camera);
    expect(before.distanceTo(after)).toBeLessThan(1e-4);expect(eye.distanceTo(camera.position)).toBeLessThan(1e-4);
   }
  }
  const currentSurface=scene.getObjectByName('INDEXED_COSMIC_DEPARTURE_SURFACE') as T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>;
  journey.update(.35,camera);const normalSurface=Array.from(currentSurface.geometry.getAttribute('position').array),normalPose=cameraState();
  motionPreference.matches=true;journey.update(.35,camera);
  expect(currentSurface.visible).toBe(true);expect(currentSurface.material.opacity).toBeCloseTo(.5,10);
  motionPreference.matches=false;journey.update(.35,camera);
  expect(currentSurface.visible).toBe(true);expect(currentSurface.material.opacity).toBeCloseTo(.5,10);expect(currentSurface.material.transparent).toBe(true);
  expect(Array.from(currentSurface.geometry.getAttribute('position').array)).toEqual(normalSurface);expect(cameraState()).toEqual(normalPose);
  journey.update(.12,camera);const heldPortrait=scene.getObjectByName('RIGID_APPROVED_PORTRAIT') as T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>;
  expect(heldPortrait.material.opacity).toBe(1);expect(heldPortrait.parent!.visible).toBe(true);expect(heldPortrait.parent!.position.toArray()).toEqual([0,0,0]);
  journey.resize(1920,1080);journey.update(.42,camera);expect(cameraState()).toEqual(outbound);

  const oldStage=scene.getObjectByName('HERO_ROOM_JOURNEY')!;
  const oldGeometry=(scene.getObjectByName('INDEXED_COSMIC_DEPARTURE_SURFACE') as T.Mesh).geometry,oldGeometryDispose=vi.spyOn(oldGeometry,'dispose');
  journey.setActive(false);
  expect(oldStage.visible).toBe(false);expect(material).toMatchObject(originalStencil);
  const inactive=cameraState();journey.update(.12,camera);expect(cameraState()).toEqual(inactive);
  journey.resize(1440,900);
  expect(oldStage.parent).toBeNull();expect(oldGeometryDispose).toHaveBeenCalledOnce();
  expect(material).toMatchObject(originalStencil);
  journey.setActive(true);arrival(1440,900);
  journey.resize(1920,1080);arrival(1920,1080);
  journey.update(.42,camera);expect(cameraState()).toEqual(outbound);

  journey.dispose();journey.dispose();
  expect(scene.children).toEqual([root]);expect(root.matrixWorld).toEqual(originalMatrix);
  expect(material).toMatchObject(originalStencil);
  expect(geometryDispose).not.toHaveBeenCalled();expect(materialDispose).not.toHaveBeenCalled();
  for(const disposed of textureDisposals)expect(disposed).toHaveBeenCalledOnce();

  let resolveRoom!:()=>void;
  const lateRoom={...canonical,ready:new Promise<void>(resolve=>{resolveRoom=resolve;})};
  const beforeLateLoads=textureDisposals.length;
  const cancelled=createHeroRoomJourney(scene,lateRoom,{width:1920,height:1080,portrait:'portrait',portraitMask:'mask'});
  cancelled.dispose();resolveRoom();await cancelled.ready;
  expect(textureDisposals.length).toBeGreaterThan(beforeLateLoads);
  for(const disposed of textureDisposals.slice(beforeLateLoads))expect(disposed).toHaveBeenCalledOnce();
  expect(scene.children).toEqual([root]);expect(material).toMatchObject(originalStencil);
  expect(geometryDispose).not.toHaveBeenCalled();expect(materialDispose).not.toHaveBeenCalled();
 }finally{
  vi.unstubAllGlobals();journey.dispose();geometryDispose.mockRestore();materialDispose.mockRestore();geometry.dispose();material.dispose();load.mockRestore();
 }
});

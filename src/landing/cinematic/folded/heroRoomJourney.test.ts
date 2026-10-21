import {expect,it,vi} from 'vitest';
import * as T from 'three';
import {createHeroRoomJourney} from './heroRoomJourney';

it('preserves canonical B framing and reversible poses without owning B resources, including disposal before ready',async()=>{
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
  expect(material.stencilWrite).toBe(true);expect(material.stencilFunc).toBe(T.EqualStencilFunc);
  arrival(1920,1080);
  journey.update(.12,camera);expect(camera.fov).toBeLessThan(48);expect(camera.fov).toBeGreaterThan(0);
  journey.update(.42,camera);const outbound=cameraState();
  for(const progress of[1,.3,.42])journey.update(progress,camera);
  expect(cameraState()).toEqual(outbound);

  const oldStage=scene.getObjectByName('HERO_ROOM_JOURNEY')!;
  const oldGeometry=(oldStage.children[0] as T.Mesh).geometry,oldGeometryDispose=vi.spyOn(oldGeometry,'dispose');
  journey.setActive(false);
  expect(oldStage.visible).toBe(false);expect(material.stencilWrite).toBe(false);
  const inactive=cameraState();journey.update(.12,camera);expect(cameraState()).toEqual(inactive);
  journey.resize(1440,900);
  expect(oldStage.parent).toBeNull();expect(oldGeometryDispose).toHaveBeenCalledOnce();
  expect(material.stencilWrite).toBe(false);
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
  journey.dispose();geometryDispose.mockRestore();materialDispose.mockRestore();geometry.dispose();material.dispose();load.mockRestore();
 }
});

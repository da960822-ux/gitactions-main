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
  journey.update(.12,camera);expect(camera.fov).toBe(48);
  journey.update(.42,camera);const outbound=cameraState();
  for(const progress of[1,.3,.42])journey.update(progress,camera);
  expect(cameraState()).toEqual(outbound);

  const roof=scene.getObjectByName('AUTHORED_SHALLOW_CEILING_CONNECTION') as T.Mesh<T.PlaneGeometry>;
  journey.update(0,camera);
  const roofRest=Array.from(roof.geometry.getAttribute('position').array),normalRest=Array.from(roof.geometry.getAttribute('normal').array);
  expect(roof.geometry.getAttribute('position').count).toBeGreaterThan(100);
  journey.update(.35,camera);
  const bent=Array.from(roof.geometry.getAttribute('position').array),bentNormals=Array.from(roof.geometry.getAttribute('normal').array),uv=roof.geometry.getAttribute('uv');
  expect(camera.userData.heroCeiling.maxVertexDrop).toBeGreaterThan(.5);
  expect(camera.userData.heroCeiling.maxNormalDelta).toBeGreaterThan(.1);
  expect(camera.userData.heroCeiling.baseClearance).toBeGreaterThan(0);
  for(let i=0;i<uv.count;i++){
   expect(bent[i*3]).toBe(roofRest[i*3]);expect(bent[i*3+2]).toBe(roofRest[i*3+2]);
   expect(bent[i*3+1]).toBeLessThanOrEqual(roofRest[i*3+1]);
   if(uv.getX(i)===0||uv.getX(i)===3||uv.getY(i)===0||uv.getY(i)===3)expect(bent[i*3+1]).toBe(roofRest[i*3+1]);
  }
  journey.update(.68,camera);expect(Array.from(roof.geometry.getAttribute('position').array)).toEqual(roofRest);
  journey.update(.35,camera);expect(Array.from(roof.geometry.getAttribute('position').array)).toEqual(bent);expect(Array.from(roof.geometry.getAttribute('normal').array)).toEqual(bentNormals);
  journey.update(1,camera);expect(Array.from(roof.geometry.getAttribute('position').array)).toEqual(roofRest);expect(Array.from(roof.geometry.getAttribute('normal').array)).toEqual(normalRest);
  journey.update(.42,camera);expect(cameraState()).toEqual(outbound);

  // Sample complete protected source regions, not only face centers. The actual lowered
  // roof must leave their visible camera-to-B segments clear at either desktop aspect.
  const protectedSourceRects=[[280,75,630,470],[950,110,1405,570],[1380,390,1672,825],[20,565,250,820],[1505,35,1672,300]];
  const raycaster=new T.Raycaster(),target=new T.Vector3(),direction=new T.Vector3();
  let visibleProtectedRays=0;
  for(const [w,h]of[[1920,1080],[1440,900]]){
   journey.resize(w,h);
   const currentRoof=scene.getObjectByName('AUTHORED_SHALLOW_CEILING_CONNECTION') as T.Mesh;
   for(let step=18;step<=68;step++){
    const p=step/100;journey.update(p,camera);
    for(const [x0,y0,x1,y1]of protectedSourceRects)for(let iy=0;iy<=4;iy++)for(let ix=0;ix<=4;ix++){
     target.set(((x0+(x1-x0)*ix/4)/1672-.5)*geometry.parameters.width,(.5-(y0+(y1-y0)*iy/4)/941)*geometry.parameters.height,0).applyMatrix4(root.matrixWorld);
     const ndc=target.clone().project(camera);if(Math.abs(ndc.x)>1||Math.abs(ndc.y)>1||ndc.z< -1||ndc.z>1)continue;
     visibleProtectedRays++;
     const distance=camera.position.distanceTo(target);direction.copy(target).sub(camera.position).normalize();raycaster.set(camera.position,direction);raycaster.near=camera.near;raycaster.far=distance-1e-4;
     expect(raycaster.intersectObject(currentRoof,false),`roof covers protected B source region at ${w} p${p} (${ix},${iy})`).toHaveLength(0);
    }
   }
  }
  expect(visibleProtectedRays).toBeGreaterThan(1000);
  journey.resize(1920,1080);
  journey.update(.35,camera);const foldedView=camera.clone(),stage=scene.getObjectByName('HERO_ROOM_JOURNEY')!;
  const physical=stage.children.filter(object=>object.userData.visibilityRole==='physical-boundary');
  const upperBackgroundOcclusion=()=>{
   let rays=0;
   for(let y=0;y<=60;y+=15)for(let x=0;x<=1672;x+=76){
    target.set((x/1672-.5)*geometry.parameters.width,(.5-y/941)*geometry.parameters.height,0).applyMatrix4(root.matrixWorld);
    const ndc=target.clone().project(camera);if(Math.abs(ndc.x)>1||Math.abs(ndc.y)>1)continue;
    direction.copy(target).sub(camera.position).normalize();raycaster.set(camera.position,direction);raycaster.far=camera.position.distanceTo(target)-1e-4;
    if(raycaster.intersectObjects(physical,false)[0]?.object.name==='AUTHORED_SHALLOW_CEILING_CONNECTION')rays++;
   }
   return rays;
  };
  const foldedOcclusion=upperBackgroundOcclusion();
  journey.update(.68,camera);camera.copy(foldedView);camera.updateMatrixWorld();
  expect(foldedOcclusion).toBeGreaterThan(upperBackgroundOcclusion());

  // Once the room takes the gaze, aim at its people/game positions rather than
  // the solid right wall. This protects the subject, without freezing an authored yaw value.
  journey.update(.5,camera);
  const roomDirection=root.getWorldPosition(new T.Vector3()).sub(camera.position).normalize();
  expect(camera.getWorldDirection(new T.Vector3()).dot(roomDirection)).toBeGreaterThan(Math.cos(T.MathUtils.degToRad(10)));
  for(const points of protectedSourceRects)for(const [x,y]of[[points[0],points[1]],[points[2],points[3]]]){
   const sourcePoint=new T.Vector3((x/1672-.5)*geometry.parameters.width,(.5-y/941)*geometry.parameters.height,0).applyMatrix4(root.matrixWorld).project(camera);
   expect(Math.abs(sourcePoint.x)).toBeLessThan(1);expect(Math.abs(sourcePoint.y)).toBeLessThan(1);
  }
  // Small input reversals across a key boundary must not jump projection or camera pose.
  for(const p of[.27,.30,.35,.43,.68]){
   journey.update(p-1e-6,camera);const before=root.getWorldPosition(new T.Vector3()).project(camera),beforeEye=camera.position.clone();
   journey.update(p+1e-6,camera);const after=root.getWorldPosition(new T.Vector3()).project(camera);
   expect(before.distanceTo(after)).toBeLessThan(1e-4);expect(beforeEye.distanceTo(camera.position)).toBeLessThan(1e-4);
  }

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

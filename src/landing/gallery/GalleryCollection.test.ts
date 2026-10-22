import {afterEach,expect,it,vi} from 'vitest';
import * as T from 'three';
import {gameCatalog} from '../../games/catalog';
import {createGalleryCollection} from './GalleryCollection';

afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});

it('keeps every surrounding game and selected representative raycast-selectable',()=>{
 vi.spyOn(T.TextureLoader.prototype,'load').mockImplementation(()=>new T.Texture());
 vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>({fillText(){},fillRect(){},strokeRect(){},save(){},restore(){},translate(){},rotate(){}})})});
 const collection=createGalleryCollection(),origin=new T.Vector3(0,0,9.6),ray=new T.Raycaster();
 try{
  for(const selected of gameCatalog){
   collection.update({selected:selected.id,time:0,paused:true,snap:true});
   for(const group of collection.root.children){
    let surface:T.Mesh|undefined,fallback:T.Mesh|undefined;
    group.traverse(node=>{
     if(!(node instanceof T.Mesh))return;
     fallback??=node;
     if(!surface&&node.geometry instanceof T.BoxGeometry)surface=node;
    });
    surface??=fallback;
    expect(surface).toBeDefined();
    collection.root.updateMatrixWorld(true);
    surface!.geometry.computeBoundingBox();
    const point=surface!.localToWorld(surface!.geometry.boundingBox!.getCenter(new T.Vector3()));
    ray.set(origin,point.sub(origin).normalize());
    expect(collection.pick(ray)).toBe(group.userData.game);
   }
  }
  collection.setInputEnabled(false);
  expect(collection.pick(ray)).toBeNull();
 }finally{collection.dispose();}
});

it('damps only the hovered sculpture within a small lift and tilt, and resets for reduced motion',()=>{
 vi.spyOn(T.TextureLoader.prototype,'load').mockImplementation(()=>new T.Texture());
 vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>({fillText(){},fillRect(){},strokeRect(){},save(){},restore(){},translate(){},rotate(){}})})});
 const collection=createGalleryCollection(),baseline=createGalleryCollection();
 const frame={selected:'domino',time:0,paused:false,dt:1/60};
 try{
  collection.update({...frame,snap:true});baseline.update({...frame,snap:true});
  const selected=collection.root.children.find(group=>group.userData.game==='domino')!;
  const original=baseline.root.children.find(group=>group.userData.game==='domino')!;
  for(let i=0;i<60;i++)collection.update({...frame,hovered:{id:'domino',x:9,y:-9}});
  expect(selected.position.y-original.position.y).toBeCloseTo(.12,3);
  expect(selected.rotation.x-original.rotation.x).toBeCloseTo(T.MathUtils.degToRad(4),3);
  expect(selected.rotation.y-original.rotation.y).toBeCloseTo(T.MathUtils.degToRad(4),3);
  for(let i=0;i<collection.root.children.length;i++){
   const group=collection.root.children[i],reference=baseline.root.children[i];
   expect(group.scale.equals(reference.scale)).toBe(true);
   if(group!==selected){expect(group.position.equals(reference.position)).toBe(true);expect(group.rotation.equals(reference.rotation)).toBe(true);}
  }
  const lifted=selected.position.y;
  collection.update(frame);
  expect(selected.position.y).toBeLessThan(lifted);
  expect(selected.position.y).toBeGreaterThan(original.position.y);
  for(let i=0;i<90;i++)collection.update(frame);
  expect(selected.position.distanceTo(original.position)).toBeLessThan(.00001);
  collection.update({...frame,paused:true,hovered:{id:'domino',x:1,y:1}});
  baseline.update({...frame,paused:true});
  expect(selected.position.equals(original.position)).toBe(true);
  expect(selected.rotation.equals(original.rotation)).toBe(true);
 }finally{collection.dispose();baseline.dispose();}
});

it('clears the outgoing representative before enlarging the next, settles, and interrupts from its current pose',()=>{
 vi.spyOn(T.TextureLoader.prototype,'load').mockImplementation(()=>new T.Texture());
 vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>({fillText(){},fillRect(){},strokeRect(){},save(){},restore(){},translate(){},rotate(){}})})});
 const collection=createGalleryCollection();
 const pose=()=>collection.root.children.map(group=>[...group.position.toArray(),...group.scale.toArray(),group.rotation.x,group.rotation.y,group.rotation.z]);
 try{
  collection.update({selected:'domino',time:0,paused:false,snap:true});
  const outgoing=collection.root.children.find(group=>group.userData.game==='domino')!;
  const incoming=collection.root.children.find(group=>group.userData.game==='splendor')!;
  const origin=outgoing.position.clone(),incomingOrigin=incoming.position.clone(),smallScale=incoming.scale.x;
  collection.update({selected:'splendor',time:0,paused:false,dt:.08});
  expect(outgoing.position.distanceTo(origin)).toBeLessThan(1e-12);
  expect(outgoing.scale.x).toBeLessThan(1.4);
  expect(incoming.scale.x).toBe(smallScale);
  expect(incoming.position.distanceTo(origin)).toBeLessThan(incomingOrigin.distanceTo(origin));
  for(let frame=0;frame<30;frame++)collection.update({selected:'splendor',time:frame/60,paused:false});
  const settled=pose();
  collection.update({selected:'splendor',time:100,paused:false});
  expect(pose()).toEqual(settled);
  collection.update({selected:'davinci',time:100,paused:false,dt:.16});
  const interrupted=pose();
  collection.update({selected:'marble',time:100,paused:false,dt:0});
  expect(pose()).toEqual(interrupted);
  collection.update({selected:'domino',time:100,paused:true});
  expect(outgoing.scale.x).toBe(2.6);
  expect(outgoing.position.distanceTo(origin)).toBeLessThan(1e-12);
 }finally{collection.dispose();}
});

it('fits the enlarged desktop representative and orbit while preserving mobile and story geometry',()=>{
 vi.spyOn(T.TextureLoader.prototype,'load').mockImplementation(()=>new T.Texture());
 vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>({fillText(){},fillRect(){},strokeRect(){},save(){},restore(){},translate(){},rotate(){}})})});
 const collection=createGalleryCollection(),camera=new T.PerspectiveCamera(38,1267.21875/432,.1,50);
 camera.position.z=9.6;camera.updateMatrixWorld(true);
 try{
  for(const height of [432,518.4])for(const selected of gameCatalog)for(const time of [0,2,5,10]){
   camera.aspect=(height===432?1267.21875:1689.6)/height;camera.updateProjectionMatrix();
   collection.update({selected:selected.id,time,paused:false,snap:true});
   for(const [index,group] of collection.root.children.entries()){
    const chosen=group.userData.game===selected.id;
    expect(group.scale.x).toBeCloseTo(chosen?2.6:(index>0&&index<4?0.65:0.45));
    if(chosen){expect(group.position.x).toBeCloseTo(0);expect(group.position.z).toBeCloseTo(1.3);}
    const box=new T.Box3().setFromObject(group);
    let projectedMinY=Infinity,projectedMaxY=-Infinity;
    for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
     const point=new T.Vector3(x,y,z).project(camera);
     expect(Math.abs(point.x)).toBeLessThan(1);
     expect(Math.abs(point.y)).toBeLessThan(1);
     projectedMinY=Math.min(projectedMinY,point.y);
     projectedMaxY=Math.max(projectedMaxY,point.y);
    }
    if(chosen&&selected.id==='domino')expect((projectedMaxY-projectedMinY)*height/2).toBeGreaterThan(300);
    if(index>0&&index<4&&!chosen)expect((projectedMaxY-projectedMinY)*height/2).toBeGreaterThanOrEqual(42);
   }
  }
  collection.update({selected:'domino',time:0,paused:true,snap:true,mobile:true});
  collection.root.children.forEach((group,index)=>{
   const chosen=group.userData.game==='domino',angle=index/8*Math.PI*2;
   expect(group.scale.x).toBeCloseTo(chosen?1.9:.45);
   expect(group.position.x).toBeCloseTo(chosen?0:Math.cos(angle)*3.35);
   expect(group.position.y).toBeCloseTo(chosen?0:Math.sin(angle)*3.8);
   expect(group.position.z).toBeCloseTo(chosen?1.3:-3.2);
  });
  collection.update({selected:'domino',time:0,paused:true,snap:true,storyFocus:.5});
  collection.root.children.forEach((group,index)=>{
   const chosen=group.userData.game==='domino',angle=index/8*Math.PI*2;
   expect(group.scale.x).toBeCloseTo(chosen?2.3:.45);
   expect(group.position.x).toBeCloseTo(chosen?2.55:Math.cos(angle)*5.8);
   expect(group.position.z).toBeCloseTo(chosen?4.4:-3.2);
  });
 }finally{collection.dispose();}
});

import {afterEach,expect,it,vi} from 'vitest';
import * as T from 'three';
import {gameCatalog} from '../../games/catalog';
import {createGalleryCollection} from './GalleryCollection';

afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});

it('keeps every surrounding game and selected representative raycast-selectable',()=>{
 vi.spyOn(T.TextureLoader.prototype,'load').mockImplementation(()=>new T.Texture());
 vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>({fillText(){},fillRect(){},strokeRect(){},save(){},restore(){},translate(){},rotate(){}})})});
 const collection=createGalleryCollection(),origin=new T.Vector3(0,0,20),ray=new T.Raycaster();
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

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

import {afterEach, describe, expect, it, vi} from 'vitest';
import * as T from 'three';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gameCatalog} from '../../games/catalog';
import {createGalleryAttraction,createGameObject,normalizeSculpture,studioMaterials} from './studioObjects';

afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});

describe('landing game artwork',()=>{
 it('settles the weighted gallery ingress and reflective cradle without changing layout transforms or game identity',()=>{
  const objects=['domino','jaipur'].map((id,i)=>{const group=new T.Group();group.userData.game=id;group.position.set(i*4,1,-1);group.add(new T.Group());return group;});
  const layout=objects.map(group=>group.position.clone()),art=objects.map(group=>group.children[0]),effect=createGalleryAttraction(objects);
  const frame={entryAge:0,selectionAge:0,selected:'domino',paused:false,mobile:false};
  expect(effect.update(frame)).toBe(true);
  expect(objects[0].children[0].position.length()).toBeGreaterThan(.5);
  expect(effect.update({...frame,entryAge:.6,selectionAge:.5})).toBe(true);expect(effect.root.visible).toBe(true);
  expect(objects[0].children[0].position.y).toBeGreaterThan(-.1);
  expect(effect.update({...frame,entryAge:2,selectionAge:2})).toBe(false);expect(effect.root.visible).toBe(true);expect(effect.root.rotation.toArray().slice(0,3).map(value=>Math.abs(Number(value)))).toEqual([0,0,0]);
  objects.forEach((group,i)=>{const pivot=group.children[0];expect(group.position.equals(layout[i])).toBe(true);expect(group.userData.game).toBe(['domino','jaipur'][i]);expect(pivot.children[0]).toBe(art[i]);expect(pivot.position.length()).toBeLessThan(1e-8);expect(pivot.rotation.x).toBe(0);expect(pivot.scale.x).toBe(1);});
  expect(effect.update({...frame,entryAge:2,selectionAge:.4,selected:'jaipur'})).toBe(true);
  expect(objects[1].children[0].position.y).toBeGreaterThan(.1);
  expect(effect.update({...frame,paused:true})).toBe(false);expect(effect.root.visible).toBe(true);
  for(const group of objects)expect(group.children[0].position.length()).toBe(0);
  const resources:T.BufferGeometry[]=[];effect.root.traverse(node=>{if(node instanceof T.Mesh||node instanceof T.Points)resources.push(node.geometry);});
  const spies=resources.map(geometry=>vi.spyOn(geometry,'dispose'));effect.dispose();effect.dispose();for(const spy of spies)expect(spy).toHaveBeenCalledTimes(1);
 });
 it('uses a large physical material stage instead of selection sparks and keeps reduced-motion geometry still',()=>{
  const object=new T.Group();object.userData.game='domino';object.add(new T.Group());const effect=createGalleryAttraction([object]);
  const frame={entryAge:2,selectionAge:.5,selected:'domino',paused:false,mobile:false};effect.update(frame);
  expect(effect.root.rotation.y).toBeLessThan(-.2);expect(object.children[0].rotation.y).toBeGreaterThan(.2);
  const meshes:T.Mesh[]=[];effect.root.traverse(node=>{expect(node).not.toBeInstanceOf(T.Points);if(node instanceof T.Mesh){meshes.push(node);expect(node.material).toBeInstanceOf(T.MeshPhysicalMaterial);}});
  expect(meshes).toHaveLength(3);expect(meshes[0].name).toBe('SELECTED_GAME_REFLECTIVE_SURFACE');
  expect((meshes[0].geometry as T.CircleGeometry).parameters.radius).toBeGreaterThan(3);
  expect(effect.update({...frame,selectionAge:1.8})).toBe(false);expect(Math.abs(effect.root.rotation.y)).toBe(0);
  effect.update({...frame,paused:true,mobile:true});const pose=effect.root.matrix.clone();effect.root.updateMatrix();pose.copy(effect.root.matrix);
  effect.update({...frame,entryAge:99,selectionAge:99,paused:true,mobile:true});effect.root.updateMatrix();expect(effect.root.matrix.equals(pose)).toBe(true);
  expect(effect.root.scale.x).toBe(.55);const materials=new Set(meshes.map(mesh=>mesh.material as T.Material)),spies=[...materials].map(material=>vi.spyOn(material,'dispose'));
  effect.dispose();effect.dispose();for(const spy of spies)expect(spy).toHaveBeenCalledTimes(1);
 });
 it('keeps the visible sculpture alive within readable bounds and counter-rotates the material without moving game layout',()=>{
  const object=new T.Group();object.userData.game='domino';object.position.set(2,1,3);object.add(new T.Group());const effect=createGalleryAttraction([object]),pivot=object.children[0],layout=object.position.clone();
  const frame={entryAge:2,selectionAge:2,selected:'domino',paused:false,mobile:false,ambient:true};
  effect.update({...frame,time:1});const start=pivot.rotation.y;
  for(let time=0;time<=32;time+=.25){
   expect(effect.update({...frame,time})).toBe(true);expect(Math.abs(pivot.rotation.y)).toBeLessThanOrEqual(.22);expect(Math.abs(pivot.position.y)).toBeLessThanOrEqual(.095);expect(Math.abs(effect.root.rotation.y)).toBeLessThanOrEqual(.24);
   expect(pivot.rotation.y*effect.root.rotation.y).toBeLessThanOrEqual(0);expect(object.position.equals(layout)).toBe(true);
  }
  expect(pivot.rotation.y).not.toBe(start);
  expect(effect.update({...frame,time:33,ambient:false})).toBe(false);expect(pivot.position.length()).toBe(0);expect(Math.abs(pivot.rotation.y)).toBe(0);
  expect(effect.update({...frame,time:34,paused:true})).toBe(false);expect(pivot.position.length()).toBe(0);expect(Math.abs(effect.root.rotation.y)).toBe(0);effect.dispose();
 });
 it('lets the seven surrounding pieces breathe in distinct phases without moving their layout or exceeding small readable bounds',()=>{
  const objects=gameCatalog.map((game,i)=>{const group=new T.Group();group.userData.game=game.id;group.position.set(i*2,1,-2);group.add(new T.Group());return group;}),layout=objects.map(group=>group.position.clone()),effect=createGalleryAttraction(objects);
  const frame={entryAge:2,selectionAge:2,selected:gameCatalog[0].id,paused:false,mobile:false,ambient:true};
  effect.update({...frame,time:1});const first=objects.slice(1).map(group=>group.children[0].position.y);
  effect.update({...frame,time:3});objects.slice(1).forEach((group,i)=>expect(group.children[0].position.y).not.toBe(first[i]));
  expect(new Set(objects.slice(1).map(group=>group.children[0].position.y)).size).toBe(7);
  for(let time=0;time<=20;time+=.25){effect.update({...frame,time});objects.forEach((group,i)=>{expect(group.position.equals(layout[i])).toBe(true);if(i){expect(Math.abs(group.children[0].position.y)).toBeLessThanOrEqual(.075);expect(Math.abs(group.children[0].rotation.y)).toBeLessThanOrEqual(.12);}});}
  expect(effect.update({...frame,time:21,ambient:false})).toBe(false);objects.forEach(group=>expect(group.children[0].position.length()).toBe(0));
  expect(effect.update({...frame,time:22,paused:true})).toBe(false);objects.forEach(group=>expect(group.children[0].position.length()).toBe(0));effect.dispose();
 });
 it('retains the exact original portrait and user-supplied Splendor cover bytes',()=>{
  const sources={
   'public/images/landing-preview/art/leonardo-self-portrait.jpg':'5bb300a1a289d972d8625988357e190ddfc9fe306f90a0d0f3416cb0d6efc8ff',
   'public/images/splendor/box-cover.jpg':'41a62f7dc67e2e072e2c8b93104d230ad947598a5db9aa4045590457e95909b5',
  };
  for(const [path,sha256] of Object.entries(sources))expect(createHash('sha256').update(readFileSync(path)).digest('hex')).toBe(sha256);
 });

 it('keeps all eight normalized game assemblies finite and preserves contained original art and source aspect ratios',()=>{
  const paths:string[]=[];
  vi.spyOn(T.TextureLoader.prototype,'load').mockImplementation((url)=>{paths.push(url);const texture=new T.Texture<HTMLImageElement>();texture.name=url;return texture;});
  vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>({fillText(){},fillRect(){},strokeRect(){},save(){},restore(){},translate(){},rotate(){}})})});
  const materials=studioMaterials();
  const originalRatios:Record<string,number>={
   '/images/landing-preview/art/leonardo-self-portrait.jpg':1932/2953,
   '/images/splendor/box-cover.jpg':998/1280,
  };
  for(const {id} of gameCatalog){
   const group=normalizeSculpture(createGameObject(id,materials));
   const bounds=new T.Box3().setFromObject(group),sphere=bounds.getBoundingSphere(new T.Sphere());
   expect(sphere.radius).toBeCloseTo(1,6);
   expect(sphere.center.length()).toBeLessThan(.000001);
   expect(bounds.max.z-bounds.min.z).toBeGreaterThan(0);
   group.traverse(node=>{
    if(!(node instanceof T.Mesh))return;
    const material=node.material as T.MeshBasicMaterial;
    const ratio=originalRatios[material.map?.name??''];
    if(ratio){const dimensions=(node.geometry as T.PlaneGeometry).parameters;expect(dimensions.width/dimensions.height).toBeCloseTo(ratio,2);}
    if(node.name!=='CONTAINED_ORIGINAL_ART')return;
    expect(material.map).not.toBeNull();
    expect(material.map!.repeat.toArray()).toEqual([1,1]);
    expect(material.map!.offset.toArray()).toEqual([0,0]);
    expect(material.toneMapped).toBe(false);
   });
  }
  expect(paths).toContain('/images/landing-preview/art/leonardo-self-portrait.jpg');
  expect(paths).toContain('/images/splendor/box-cover.jpg');
  expect(paths).toContain('/images/hwatu/01-01.svg');
  expect(paths).not.toContain('/images/jaipur/merchant-atlas.webp');
 });
});

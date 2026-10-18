import {afterEach, describe, expect, it, vi} from 'vitest';
import * as T from 'three';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gameCatalog} from '../../games/catalog';
import {createGameObject,normalizeSculpture,studioMaterials} from './studioObjects';

afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});

describe('landing game artwork',()=>{
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

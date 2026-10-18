import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import {CHAMBER_RENDER_CONTRACT} from './world';
const read=(file:string)=>readFileSync(new URL('../../../../public/models/folded-chamber-v7/'+file,import.meta.url));
const bytes=read('chamber.glb'),gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString()),manifest=JSON.parse(read('asset-manifest.json').toString());
describe('versioned shared chamber transfer contract',()=>{
 it('locks the model, corresponding normal bakes, source and lighting in one asset version',()=>{
  expect(manifest.version).toBe(CHAMBER_RENDER_CONTRACT.assetVersion);
  expect(manifest.generatorSha256).toMatch(/^[a-f0-9]{64}$/);expect(manifest.authorBlendSha256).toMatch(/^[a-f0-9]{64}$/);expect(manifest.bakedBlendSha256).toMatch(/^[a-f0-9]{64}$/);
  expect(createHash('sha256').update(readFileSync(new URL('../../../../scripts/build-folded-chamber.py',import.meta.url))).digest('hex')).toBe(manifest.generatorSha256);
  expect(createHash('sha256').update(readFileSync(new URL('../../../../scripts/denoise-chamber-lightmaps.py',import.meta.url))).digest('hex')).toBe(manifest.postprocess.scriptSha256);
  for(const[file,meta]of Object.entries(manifest.files)as[string,{sha256:string;bytes:number}][]){const data=read(file);expect(data.length).toBe(meta.bytes);expect(createHash('sha256').update(data).digest('hex')).toBe(meta.sha256);}
 });
 it('restores storage scale separately from the Lambert irradiance unit conversion',()=>{
  expect(manifest.lightmapQuantity).toBe('outgoingDiffusePerUnitAlbedo');expect(manifest.storageScale).toBe(1);expect(manifest.unitToIrradiance).toBeCloseTo(Math.PI,12);expect(.5*manifest.storageScale*manifest.unitToIrradiance/Math.PI).toBe(.5);
  expect(manifest.poseSamples).toEqual([0,.43,1]);expect(manifest.records).toHaveLength(12);
  for(const record of manifest.records)expect(read(record.file).readUInt32LE(0)).toBe(20000630);
 });
 it('keeps UV0 and tangent normals, isolates atlas materials, and exports the actual shared surface morphs',()=>{
  expect(CHAMBER_RENDER_CONTRACT.diffuseFlipY).toBe(true);expect(CHAMBER_RENDER_CONTRACT.normalFlipY).toBe(false);expect(manifest.normalSpace).toBe('TANGENT');expect(manifest.normalUV).toBe('TEXCOORD_0');
  const users=new Map<number,string>(),receivers=gltf.nodes.filter((n:{extras?:{lightmapStem?:string}})=>n.extras?.lightmapStem);expect(receivers).toHaveLength(4);
  for(const node of receivers){expect(node.extras.assetVersion).toBe(manifest.version);expect(read(node.extras.normalMap).subarray(1,4).toString()).toBe('PNG');for(const primitive of gltf.meshes[node.mesh].primitives){expect(primitive.attributes.TEXCOORD_0).toBeDefined();expect(users.has(primitive.material)&&users.get(primitive.material)!==node.extras.lightmapStem).toBe(false);users.set(primitive.material,node.extras.lightmapStem);}}
  expect(gltf.nodes.filter((n:{extras?:{lighting_card?:boolean;runtime?:boolean}})=>n.extras?.lighting_card&&n.extras.runtime)).toHaveLength(6);
  const seam=gltf.nodes.find((n:{name:string})=>n.name==='Shared_Shell_Light');expect(seam.extras.lightmapStem).toBeUndefined();for(const primitive of gltf.meshes[seam.mesh].primitives)expect(users.has(primitive.material)).toBe(false);
  const dynamic=gltf.meshes.filter((m:{extras?:{targetNames?:string[]}})=>m.extras?.targetNames);expect(dynamic).toHaveLength(6);
  for(const mesh of dynamic){expect(mesh.extras.targetNames).toEqual(['Space_Unfold','Gift_Entry']);for(const primitive of mesh.primitives)for(const target of primitive.targets)for(const key of['POSITION','NORMAL'])expect(gltf.accessors[target[key]].count).toBe(gltf.accessors[primitive.attributes[key]].count);}
  expect(gltf.nodes.map((n:{name:string})=>n.name)).toEqual(expect.arrayContaining(['Shared_Sculpted_Cove','Shared_Sculpted_Foreground','Shared_Unfolding_Canopy','Shared_Light_Chamber']));
 });
});

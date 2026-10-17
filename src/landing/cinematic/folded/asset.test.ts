import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
const bytes=readFileSync(new URL('../../../../public/models/folded-alcove/alcove.glb',import.meta.url));
const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
describe('authored alcove runtime asset contract',()=>{
 it('has a complete glTF2 binary and the six authored architectural nodes',()=>{
  expect(bytes.readUInt32LE(0)).toBe(0x46546c67);expect(bytes.readUInt32LE(4)).toBe(2);expect(bytes.readUInt32LE(8)).toBe(bytes.length);
  expect(json.nodes.map((n:{name:string})=>n.name)).toEqual(expect.arrayContaining(['Alcove_Ivory_Solid','Alcove_Curved_Waist_Lip','Alcove_RoseGold_Mouth','Alcove_Lip_RoseGold','Continuous_Entrance_Canopy','Architecture_Static']));
 });
 it('keeps both real morph targets and matching position/normal counts on every deforming primitive',()=>{
  const dynamic=json.meshes.filter((m:{extras?:{targetNames?:string[]}})=>m.extras?.targetNames);
  expect(dynamic).toHaveLength(5);
  for(const mesh of dynamic){
   expect(mesh.extras.targetNames).toEqual(['Space_Unfold','Gift_Entry']);
   for(const p of mesh.primitives){expect(p.targets).toHaveLength(2);for(const t of p.targets)for(const k of['POSITION','NORMAL'])expect(json.accessors[t[k]].count).toBe(json.accessors[p.attributes[k]].count);}
  }
 });
 it('provides UVs and physical irradiance atlases for every baked receiver',()=>{
  const receivers=json.nodes.filter((n:{extras?:{lightmap?:string}})=>n.extras?.lightmap);expect(receivers).toHaveLength(4);
  for(const node of receivers){const image=readFileSync(new URL('../../../../public/models/folded-alcove/'+node.extras.lightmap,import.meta.url));expect(image.subarray(1,4).toString()).toBe('PNG');for(const p of json.meshes[node.mesh].primitives)expect(p.attributes.TEXCOORD_0).toBeDefined();}
 });
});

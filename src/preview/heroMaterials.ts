import * as T from 'three';

export function createHeroMaterials(){
 return [
  new T.MeshPhysicalMaterial({color:'#efad9c',metalness:.65,roughness:.28,clearcoat:1,envMapIntensity:1.3,emissive:'#612438',emissiveIntensity:.08}),
  new T.MeshPhysicalMaterial({color:'#d55280',metalness:.42,roughness:.24,clearcoat:1,envMapIntensity:1.4,emissive:'#541122',emissiveIntensity:.12}),
  new T.MeshPhysicalMaterial({color:'#e7d9f2',metalness:.28,roughness:.22,clearcoat:1,envMapIntensity:1.3,iridescence:1,iridescenceIOR:1.3,iridescenceThicknessRange:[100,400]}),
 ];
}

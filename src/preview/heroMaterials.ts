import * as T from 'three';

export function createHeroMaterials(){
 return [
  new T.MeshPhysicalMaterial({color:'#c9818e',metalness:.38,roughness:.34,clearcoat:.24,clearcoatRoughness:.38,envMapIntensity:.98,emissive:'#612438',emissiveIntensity:.012}),
  new T.MeshPhysicalMaterial({color:'#d55280',metalness:.08,roughness:.43,clearcoat:.2,clearcoatRoughness:.44,sheen:.3,sheenColor:'#efc2d5',sheenRoughness:.72,envMapIntensity:.94,emissive:'#541122',emissiveIntensity:.012}),
  new T.MeshPhysicalMaterial({color:'#e7d9f2',metalness:.12,roughness:.38,clearcoat:.22,clearcoatRoughness:.4,envMapIntensity:.96,iridescence:.24,iridescenceIOR:1.3,iridescenceThicknessRange:[120,320]}),
 ];
}

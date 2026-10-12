import * as T from 'three';

export function createHeroMaterials(){
 return [
  new T.MeshPhysicalMaterial({color:'#d99486',metalness:.24,roughness:.4,clearcoat:.16,clearcoatRoughness:.4,envMapIntensity:.72,emissive:'#612438',emissiveIntensity:.018}),
  new T.MeshPhysicalMaterial({color:'#d55280',metalness:.03,roughness:.5,clearcoat:.12,clearcoatRoughness:.48,sheen:.34,sheenColor:'#efc2d5',sheenRoughness:.72,envMapIntensity:.68,emissive:'#541122',emissiveIntensity:.016}),
  new T.MeshPhysicalMaterial({color:'#e7d9f2',metalness:.08,roughness:.4,clearcoat:.18,clearcoatRoughness:.42,envMapIntensity:.74,iridescence:.2,iridescenceIOR:1.3,iridescenceThicknessRange:[120,320]}),
 ];
}

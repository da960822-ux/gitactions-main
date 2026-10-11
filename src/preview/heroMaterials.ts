import * as T from 'three';

export function createHeroMaterials(){
 return [
  new T.MeshPhysicalMaterial({color:'#efad9c',metalness:.85,roughness:.23,clearcoat:.8,envMapIntensity:1.3,emissive:'#612438',emissiveIntensity:.06}),
  new T.MeshPhysicalMaterial({color:'#d55280',metalness:.08,roughness:.62,clearcoat:.05,sheen:.65,sheenColor:'#efc2d5',sheenRoughness:.75,envMapIntensity:1,emissive:'#541122',emissiveIntensity:.05}),
  new T.MeshPhysicalMaterial({color:'#e7d9f2',metalness:.28,roughness:.22,clearcoat:1,envMapIntensity:1.3,iridescence:1,iridescenceIOR:1.3,iridescenceThicknessRange:[100,400]}),
 ];
}

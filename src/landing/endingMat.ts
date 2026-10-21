import * as THREE from 'three';

/** Ending stationery mat only. The rejected geographic story has no runtime geometry. */
export function createEndingMat(){
 const root=new THREE.Group();root.name='ENDING_STATIONERY_MAT';root.position.set(7.2,-.06,-2.48);root.visible=false;
 const geometry=new THREE.PlaneGeometry(3.072,2.924);geometry.rotateX(-Math.PI/2);
 const material=new THREE.MeshStandardMaterial({color:'#3a202c',roughness:.94,side:THREE.DoubleSide});
 const sheet=new THREE.Mesh(geometry,material);sheet.name='ENDING_MAT_SHEET';sheet.receiveShadow=true;root.add(sheet);
 const back=new THREE.Mesh(geometry,material);back.position.y=-.035;root.add(back);
 const borderGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1.536,.012,-1.462),new THREE.Vector3(1.536,.012,-1.462),new THREE.Vector3(1.536,.012,1.462),new THREE.Vector3(-1.536,.012,1.462)]);
 const borderMaterial=new THREE.LineBasicMaterial({color:'#bd927d'}),border=new THREE.LineLoop(borderGeometry,borderMaterial);root.add(border);
 const state={endingReturn:0};
 return{root,state,update(progress:number){const value=THREE.MathUtils.smoothstep(progress,.94,1);state.endingReturn=value;root.visible=progress>.94;root.position.y=-.06-12*(1-value);},dispose(){root.removeFromParent();geometry.dispose();material.dispose();borderGeometry.dispose();borderMaterial.dispose();}};
}

import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createLetterRoses} from './LetterRoses';

test('letter reveals exactly four roses on each side and reverses without new resources',()=>{
 const rig=createLetterRoses(),scene=new THREE.Group();scene.add(rig.root);
 const flowers=rig.root.children;
 assert.equal(flowers.length,8);assert.equal(new Set(flowers.map(rose=>rose.name)).size,8);
 for(const side of ['LEFT','RIGHT'])assert.equal(flowers.filter(rose=>rose.name.includes(side)).length,4);
 rig.update(0);assert.ok(flowers.every(rose=>!rose.visible));
 rig.update(1);assert.ok(flowers.every(rose=>rose.visible&&rose.scale.x===1));
 const pose=flowers.map(rose=>({name:rose.name,position:rose.position.toArray(),scale:rose.scale.toArray(),rotation:rose.rotation.toArray()}));
 rig.update(.5);rig.update(0);assert.ok(flowers.every(rose=>!rose.visible));rig.update(1);
 assert.deepEqual(flowers.map(rose=>({name:rose.name,position:rose.position.toArray(),scale:rose.scale.toArray(),rotation:rose.rotation.toArray()})),pose);
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),instances=new Set<THREE.InstancedMesh>();
 rig.root.traverse(node=>{if(node instanceof THREE.Mesh){geometries.add(node.geometry);for(const material of Array.isArray(node.material)?node.material:[node.material])materials.add(material);}if(node instanceof THREE.InstancedMesh)instances.add(node);});
 let geometryDisposals=0,materialDisposals=0,instanceDisposals=0;
 geometries.forEach(item=>item.addEventListener('dispose',()=>geometryDisposals++));materials.forEach(item=>item.addEventListener('dispose',()=>materialDisposals++));instances.forEach(item=>item.addEventListener('dispose',()=>instanceDisposals++));
 rig.dispose();rig.dispose();assert.equal(scene.children.length,0);assert.equal(geometryDisposals,geometries.size);assert.equal(materialDisposals,materials.size);assert.equal(instanceDisposals,instances.size);
});

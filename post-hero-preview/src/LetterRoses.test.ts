import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createLetterRoses} from './LetterRoses';

test('botanical cutouts reverse deterministically and release their shared geometry, materials and textures',()=>{
 const rig=createLetterRoses(),scene=new THREE.Group();scene.add(rig.root);
 const clusters=rig.root.children as THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>[];
 assert.deepEqual(clusters.map(cluster=>cluster.name),['LETTER_ROSE_CLUSTER_LEFT','LETTER_ROSE_CLUSTER_RIGHT']);
 rig.update(0);assert.ok(clusters.every(cluster=>!cluster.visible&&cluster.material.opacity===0));
 rig.update(1);assert.ok(clusters.every(cluster=>cluster.visible&&cluster.material.opacity===1));
 const pose=clusters.map(cluster=>cluster.position.toArray());
 rig.update(.5);assert.ok(clusters.every(cluster=>cluster.material.opacity>0&&cluster.material.opacity<1));
 rig.update(0);rig.update(1);assert.deepEqual(clusters.map(cluster=>cluster.position.toArray()),pose);
 for(const invalid of [NaN,Infinity,-1]){rig.update(invalid);assert.ok(clusters.every(cluster=>!cluster.visible));}
 const resources=new Set<THREE.BufferGeometry|THREE.Material|THREE.Texture>();
 clusters.forEach(cluster=>{resources.add(cluster.geometry);resources.add(cluster.material);resources.add(cluster.material.map!);});
 const disposals=new Map<object,number>();resources.forEach(resource=>resource.addEventListener('dispose',()=>disposals.set(resource,(disposals.get(resource)??0)+1)));
 rig.dispose();rig.dispose();rig.update(1);
 assert.equal(scene.children.length,0);assert.equal(disposals.size,resources.size);assert.ok([...disposals.values()].every(count=>count===1));
});

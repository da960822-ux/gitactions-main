import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createPostHeroComposition,type PostCompositionFrame} from '../../src/landing/PostHeroComposition';
import {createLetterCollection} from './LetterCollection';
import {createLocalEventState} from './LocalEventRig';

test('core post flow hides default toys and preserves original reading, real session results and reversibility',t=>{
 const oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document'),load=THREE.TextureLoader.prototype.load;
 const context={clearRect(){},fillRect(){},fillText(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},createRadialGradient(){return {addColorStop(){}};}};
 Object.defineProperty(globalThis,'document',{configurable:true,value:{createElement:()=>({width:1,height:1,getContext:()=>context})}});
 THREE.TextureLoader.prototype.load=function(){return new THREE.Texture({width:1024,height:1024} as HTMLImageElement);};
 t.after(()=>{THREE.TextureLoader.prototype.load=load;if(oldDocument)Object.defineProperty(globalThis,'document',oldDocument);else Reflect.deleteProperty(globalThis,'document');});
 const scene=new THREE.Scene(),rig=createPostHeroComposition(scene);
 const frame:PostCompositionFrame={progress:.36,bridge:1,galleryWeight:0,opening:0,time:0,reducedMotion:true,width:1920,height:1080,roomEye:new THREE.Vector3(),roomTarget:new THREE.Vector3(),localEvent:createLocalEventState()};
 const evaluate=(progress:number,galleryWeight=0)=>rig.update({...frame,progress,galleryWeight});
 evaluate(.10);assert.equal(rig.root.getObjectByName('local-sixteen-props')!.visible,false,'the distance story does not expose default toys');
 const first=evaluate(.36);const pose={eye:first.eye.toArray(),target:first.target.toArray()};
 const toys=rig.root.getObjectByName('local-sixteen-props')!;
 assert.equal(toys.visible,false,'no independent toy chapter in the main flow');
 assert.equal(rig.root.getObjectByName('ENDING_APPROVED_PORTRAIT_PRINT')!.visible,false);
 assert.equal(rig.root.getObjectByName('LETTER_EIGHT_ROSES'),undefined,'DOM owns the reading roses without a second scene copy');
 const surface=rig.root.getObjectByName('POST_SHARED_FOLDING_SURFACE') as THREE.Mesh;
 surface.geometry.computeBoundingBox();const size=surface.geometry.boundingBox!.getSize(new THREE.Vector3());assert.ok(Math.abs(size.x-7.6)<1e-5);assert.ok(Math.abs(size.z-7.6)<1e-5);
 const gallery=evaluate(.5,1);assert.ok(gallery.galleryAnchor.distanceTo(new THREE.Vector3(2,.193,-14.3))<1e-6);
 assert.equal(gallery.galleryDisplayId,undefined);assert.equal(gallery.galleryStoryFocus,0);assert.equal(gallery.galleryScale,.65);
 for(const p of [.3,.36,.425,.55,.62,.86,1]){evaluate(p);assert.equal(toys.visible,false,'default toys stay absent throughout the main story');}
 const end=rig.update({...frame,progress:1,opening:1,localEvent:{...createLocalEventState(),strokes:[[{x:10,y:10},{x:40,y:20}]],drawingFlipped:true,hasSavedDecor:true}});
 const camera=new THREE.PerspectiveCamera(38,1920/1080,.05,100);camera.position.copy(end.eye);camera.lookAt(end.target);camera.updateMatrixWorld(true);rig.root.updateWorldMatrix(true,true);
 for(const id of ['L06']){const item=toys.getObjectByName(id)!;const bounds=new THREE.Box3().setFromObject(item);const min=new THREE.Vector3(bounds.min.x,bounds.min.y,bounds.max.z).project(camera);assert.ok((min.x+1)/2>.4,id+' stays clear of the left CTA area');}
 assert.equal(rig.root.getObjectByName('ENDING_APPROVED_PORTRAIT_PRINT')!.visible,true);
 const letter=createLetterCollection({scene,camera});letter.root.position.copy(end.letterAnchor);letter.update({progress:1,opening:1,width:1920,height:1080});
 function rect(object:THREE.Object3D){const bounds=new THREE.Box2();object.traverseVisible(child=>{if(!(child instanceof THREE.Mesh))return;child.geometry.computeBoundingBox();const box=child.geometry.boundingBox!;for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const point=new THREE.Vector3(x,y,z).applyMatrix4(child.matrixWorld).project(camera);bounds.expandByPoint(new THREE.Vector2((point.x+1)/2,(1-point.y)/2));}});return bounds;}
 for(const [width,height] of [[1920,1080],[1440,900]]){
  const output=rig.update({...frame,width,height,progress:1,opening:1,localEvent:{...createLocalEventState(),strokes:[[{x:10,y:10},{x:40,y:20}]],drawingFlipped:true}});camera.aspect=width/height;camera.position.copy(output.eye);camera.lookAt(output.target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);scene.updateMatrixWorld(true);
  const portrait=rect(rig.root.getObjectByName('ENDING_APPROVED_PORTRAIT_PRINT')!),drawing=rect(toys.getObjectByName('L06')!),paper=rect(letter.root);
  assert.equal(portrait.intersectsBox(drawing),false,'complete pair and session card have separate projected bounds');assert.equal(paper.intersectsBox(drawing),false,'open physical letter and session card have separate projected bounds');
  for(const bounds of [portrait,drawing,paper]){assert.ok(bounds.min.x>.4);assert.ok(bounds.max.x<1);assert.ok(bounds.min.y>0&&bounds.max.y<1);}
 }
 letter.dispose();
 const returned=evaluate(.36);assert.deepEqual(returned.eye.toArray(),pose.eye);assert.deepEqual(returned.target.toArray(),pose.target);
 const reverse=evaluate(.1).eye.toArray();evaluate(.8);const reverseAgain=evaluate(.1);assert.deepEqual(reverseAgain.eye.toArray(),reverse);
 rig.dispose();rig.dispose();assert.equal(scene.children.length,0);
});

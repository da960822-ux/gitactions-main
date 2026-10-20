import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createPostHeroComposition,type PostCompositionFrame} from '../../src/landing/PostHeroComposition';
import {createLocalEventState} from './LocalEventRig';

test('post local geometry preserves gallery coordinates, deterministic return and single ending couple',t=>{
 const oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document'),load=THREE.TextureLoader.prototype.load;
 const context={clearRect(){},fillRect(){},fillText(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},createRadialGradient(){return {addColorStop(){}};}};
 Object.defineProperty(globalThis,'document',{configurable:true,value:{createElement:()=>({width:1,height:1,getContext:()=>context})}});
 THREE.TextureLoader.prototype.load=function(){return new THREE.Texture({width:1024,height:1024} as HTMLImageElement);};
 t.after(()=>{THREE.TextureLoader.prototype.load=load;if(oldDocument)Object.defineProperty(globalThis,'document',oldDocument);else Reflect.deleteProperty(globalThis,'document');});
 const scene=new THREE.Scene(),rig=createPostHeroComposition(scene);
 const frame:PostCompositionFrame={progress:.36,bridge:1,galleryWeight:0,opening:0,time:0,reducedMotion:true,width:1920,height:1080,roomEye:new THREE.Vector3(),roomTarget:new THREE.Vector3(),localEvent:createLocalEventState()};
 const evaluate=(progress:number,galleryWeight=0)=>rig.update({...frame,progress,galleryWeight});
 evaluate(.10);assert.equal(rig.root.getObjectByName('local-sixteen-props')!.visible,false,'F1 owns the folded surface before the completed toys appear');
 const first=evaluate(.36);const pose={eye:first.eye.toArray(),target:first.target.toArray()};
 const toys=rig.root.getObjectByName('local-sixteen-props')!;
 for(const id of ['L01','L04','L06'])assert.equal(toys.getObjectByName(id)!.visible,true);
 assert.equal(rig.root.getObjectByName('ENDING_APPROVED_PORTRAIT_PRINT')!.visible,false);
 assert.equal(rig.root.getObjectByName('LETTER_EIGHT_ROSES'),undefined,'DOM owns the reading roses without a second scene copy');
 const surface=rig.root.getObjectByName('POST_SHARED_FOLDING_SURFACE') as THREE.Mesh;
 surface.geometry.computeBoundingBox();const size=surface.geometry.boundingBox!.getSize(new THREE.Vector3());assert.ok(Math.abs(size.x-11.8)<1e-5);assert.ok(Math.abs(size.z-5.6)<1e-5);
 evaluate(.45);assert.deepEqual(rig.update({...frame,progress:.55,galleryWeight:1}).eye.toArray(),pose.eye,'gallery DOM cannot move the post camera early');
 const gallery=evaluate(.5,1);assert.ok(gallery.galleryAnchor.distanceTo(new THREE.Vector3(2,.193,-14.3))<1e-6);
 assert.equal(gallery.galleryDisplayId,undefined);assert.equal(gallery.galleryStoryFocus,0);assert.equal(gallery.galleryScale,.65);
 const end=evaluate(1);
 const camera=new THREE.PerspectiveCamera(38,1920/1080,.05,100);camera.position.copy(end.eye);camera.lookAt(end.target);camera.updateMatrixWorld(true);rig.root.updateWorldMatrix(true,true);
 for(const id of ['L01','L06']){const item=toys.getObjectByName(id)!;const bounds=new THREE.Box3().setFromObject(item);const min=new THREE.Vector3(bounds.min.x,bounds.min.y,bounds.max.z).project(camera);assert.ok((min.x+1)/2>.33,id+' stays clear of the left CTA area');}
 assert.equal(rig.root.getObjectByName('ENDING_APPROVED_PORTRAIT_PRINT')!.visible,true);
 const returned=evaluate(.36);assert.deepEqual(returned.eye.toArray(),pose.eye);assert.deepEqual(returned.target.toArray(),pose.target);
 const reverse=evaluate(.1).eye.toArray();evaluate(.8);const reverseAgain=evaluate(.1);assert.deepEqual(reverseAgain.eye.toArray(),reverse);
 rig.dispose();rig.dispose();assert.equal(scene.children.length,0);
});

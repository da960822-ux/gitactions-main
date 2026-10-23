import {test,onTestFinished} from 'vitest';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createPostHeroComposition,type PostCompositionFrame} from '../PostHeroComposition';
import {createLetterCollection} from './LetterCollection';
import {createLocalEventState} from './LocalEventRig';

test('main letter stage omits DOM-owned ending copies and preserves letter, session input and disposal contracts',()=>{
 const oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document'),load=THREE.TextureLoader.prototype.load;
 const context={clearRect(){},fillRect(){},fillText(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}};
 const loaded:Array<{url:string;texture:THREE.Texture;disposals:number}>=[];
 Object.defineProperty(globalThis,'document',{configurable:true,value:{createElement:()=>({width:1,height:1,getContext:()=>context})}});
 THREE.TextureLoader.prototype.load=function(url){const texture=new THREE.Texture({width:1024,height:1024} as HTMLImageElement),item={url,texture,disposals:0};texture.addEventListener('dispose',()=>item.disposals++);loaded.push(item);return texture;};
 onTestFinished(()=>{THREE.TextureLoader.prototype.load=load;if(oldDocument)Object.defineProperty(globalThis,'document',oldDocument);else Reflect.deleteProperty(globalThis,'document');});
 const scene=new THREE.Scene(),rig=createPostHeroComposition(scene);
 assert.deepEqual(loaded.map(item=>item.url),['/images/approved-couple-room/honeywood-material.png'],'main composition no longer loads duplicate character, pawn or photo assets');
 const compositionTexture=loaded[0];
 const frame:PostCompositionFrame={progress:.36,bridge:1,galleryWeight:0,opening:0,time:0,reducedMotion:true,width:1920,height:1080,roomEye:new THREE.Vector3(),roomTarget:new THREE.Vector3(),localEvent:createLocalEventState()};
 const evaluate=(progress:number,galleryWeight=0)=>rig.update({...frame,progress,galleryWeight});
 const first=evaluate(.36),pose={eye:first.eye.toArray(),target:first.target.toArray()};
 assert.equal(rig.root.getObjectByName('STORY_COUNTRY_KOR'),undefined,'rejected geographic props stay absent');
 assert.equal(rig.root.getObjectByName('STORY_COUNTRY_DOM'),undefined);
 for(const p of [0,.1,.3,.36,.425,.55,.62,.78,.86,.94,1]){
  evaluate(p);
  for(const retired of ['local-sixteen-props','ENDING_APPROVED_PORTRAIT_PRINT','LETTER_EIGHT_ROSES','POST_SHARED_FOLDING_SURFACE','DISTANCE_HINGED_PAPER','DISTANCE_INVITATION_TAB'])assert.equal(rig.root.getObjectByName(retired),undefined,'retired toy-table and duplicate ending objects stay absent');
 }
 const tabletop=rig.root.getObjectByName('POST_FINITE_DESK_EDGE') as THREE.Mesh;
 tabletop.geometry.computeBoundingBox();const deskBounds=tabletop.geometry.boundingBox!,size=deskBounds.getSize(new THREE.Vector3());assert.ok(size.x<=12.001&&size.z<=10.001,'one finite physical desk, not an unbounded floor');
 assert.ok(Math.abs(deskBounds.max.y+tabletop.position.y+.012)<1e-5,'wood keeps the original contact height');
 const fixedDesk={position:tabletop.position.toArray(),scale:tabletop.scale.toArray(),vertices:Array.from(tabletop.geometry.getAttribute('position').array)};
 const writingPad=rig.root.getObjectByName('LETTER_WRITING_PAD')!;assert.equal(writingPad.parent?.name,'LETTER_WRITING_DESK');
 const gallery=evaluate(.5,1);assert.equal(gallery.background.getHexString(),'13141c','protected gallery background keeps its original palette');assert.ok(gallery.galleryAnchor.distanceTo(new THREE.Vector3(2,.193,-14.3))<1e-6);
 assert.equal(gallery.galleryDisplayId,undefined);assert.equal(gallery.galleryStoryFocus,0);assert.equal(gallery.galleryScale,.65);
 const hostTransform=new THREE.Matrix4().makeTranslation(-6,-4.3,6).multiply(new THREE.Matrix4().makeRotationY(Math.PI)).multiply(new THREE.Matrix4().makeTranslation(-9,4.3,10));
 for(const [width,height] of [[1920,1080],[1440,900]]){
  const opening=rig.update({...frame,progress:.663,opening:0,width,height,paperHeight:644});assert.equal(opening.fov,30);
  const view=new THREE.PerspectiveCamera(opening.fov,width/height,.05,100);view.position.copy(opening.eye).applyMatrix4(hostTransform);view.lookAt(opening.target.clone().applyMatrix4(hostTransform));view.updateMatrixWorld(true);
  const centre=opening.letterAnchor.clone().add(new THREE.Vector3(0,0,-.675)).applyMatrix4(hostTransform).project(view);
  assert.ok(Math.abs((centre.x+1)/2-.7)<.004&&Math.abs((1-centre.y)/2-.5)<.004,'Host upY and unchanged shared transform register the close envelope at70%/50% in bothPC views');
  assert.ok(Math.abs(opening.eye.z-opening.target.z)>.03,'near-overhead retains a stable camera basis');
  for(const progress of [.54,.55,.663,.94]){rig.update({...frame,width,height,progress});assert.equal(tabletop.visible,false);assert.equal(writingPad.parent!.visible,false);}
 }
 const mobile=rig.update({...frame,width:390,height:844,progress:.663});assert.equal(mobile.fov,30);assert.equal(tabletop.visible,true);assert.equal(writingPad.parent!.visible,true,'mobile keeps its existing letter support and camera');
 const session={...createLocalEventState(),strokes:[[{x:10,y:10},{x:40,y:20}]],drawingFlipped:true,hasSavedDecor:true},savedSession=JSON.stringify(session);
 const end=rig.update({...frame,progress:1,opening:1,localEvent:session});
 assert.equal(JSON.stringify(session),savedSession,'DOM keeps the exact original session strokes and decoration choice');
 assert.ok(end.letterAnchor.distanceTo(new THREE.Vector3(16.2,-4.307,-11.2))<1e-6);assert.equal(end.letterScale,1);
 const camera=new THREE.PerspectiveCamera(38,1920/1080,.05,100),letter=createLetterCollection({scene,camera});letter.root.position.copy(end.letterAnchor);letter.update({progress:1,opening:1,width:1920,height:1080});
 function rect(object:THREE.Object3D){const bounds=new THREE.Box2();object.traverseVisible(child=>{if(!(child instanceof THREE.Mesh))return;child.geometry.computeBoundingBox();const box=child.geometry.boundingBox!;for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const point=new THREE.Vector3(x,y,z).applyMatrix4(child.matrixWorld).project(camera);bounds.expandByPoint(new THREE.Vector2((point.x+1)/2,(1-point.y)/2));}});return bounds;}
 for(const [width,height] of [[1920,1080],[1440,900]]){
  const output=rig.update({...frame,width,height,progress:1,opening:1,localEvent:session});camera.aspect=width/height;camera.position.copy(output.eye);camera.lookAt(output.target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);scene.updateMatrixWorld(true);
  const paper=rect(letter.root);assert.ok(paper.min.x>.4&&paper.max.x<1&&paper.min.y>0&&paper.max.y<1,'physical letter keeps its existing desktop framing');
  for(const x of [deskBounds.min.x,deskBounds.max.x]){const front=new THREE.Vector3(x,deskBounds.max.y,deskBounds.max.z).applyMatrix4(tabletop.matrixWorld).project(camera);assert.ok((1-front.y)/2>1,'finite desk near edge continues below the ending viewport');}
 }
 letter.dispose();
 const returned=evaluate(.36);assert.deepEqual(returned.eye.toArray(),pose.eye);assert.deepEqual(returned.target.toArray(),pose.target);
 assert.deepEqual({position:tabletop.position.toArray(),scale:tabletop.scale.toArray(),vertices:Array.from(tabletop.geometry.getAttribute('position').array)},fixedDesk);
 const reverse=evaluate(.1).eye.toArray();evaluate(.8);assert.deepEqual(evaluate(.1).eye.toArray(),reverse);
 rig.dispose();rig.dispose();assert.equal(scene.children.length,0);assert.equal(compositionTexture.disposals,1,'main texture is released exactly once');
});

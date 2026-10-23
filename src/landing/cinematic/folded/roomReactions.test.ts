import {describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {createRoomReactions,type RoomReactionInput} from './roomReactions';
import {roomVertex} from './approvedRoomGeometry';

const frame:RoomReactionInput={time:0,active:true,reducedMotion:false,pointer:null,hover:null,press:false,activation:0,keyboard:false};
function fixture(){const room=new T.Group(),effect=createRoomReactions(room);return{room,effect,light:(target:string)=>effect.root.getObjectByName('ROOM_LIGHT_'+target) as T.Mesh<T.BufferGeometry,T.ShaderMaterial>};}
function advance(effect:ReturnType<typeof createRoomReactions>,input:Partial<RoomReactionInput>,start=0,duration=2){for(let t=start;t<=start+duration+.0001;t+=1/60)effect.update({...frame,...input,time:t});}

describe('approved B-room object reactions',()=>{
 it('passes a finite material reflection across the room on first arrival without replaying after interruption',()=>{
  const {effect,light}=fixture();effect.update(frame);advance(effect,{},0,.4);
  expect(light('monitor').material.uniforms.uArrival.value).toBeGreaterThan(.6);
  expect(light('keyboard').material.uniforms.uArrivalSweep.value).toBeLessThan(light('monitor').material.uniforms.uArrivalSweep.value);
  expect(light('L06').visible).toBe(true);expect(effect.state.needsFrame).toBe(true);
  advance(effect,{},.4,1.7);for(const id of ['monitor','keyboard','L06','L09']){expect(light(id).visible).toBe(false);expect(light(id).material.uniforms.uArrival.value).toBeLessThan(.001);}
  effect.update({...frame,time:3,active:false});effect.update({...frame,time:4});
  expect(light('monitor').visible).toBe(false);expect(light('monitor').material.uniforms.uArrival.value).toBeLessThan(.001);effect.dispose();
  const interrupted=fixture();interrupted.effect.update(frame);advance(interrupted.effect,{},0,.3);
  interrupted.effect.update({...frame,time:.4,active:false});interrupted.effect.update({...frame,time:.5});
  expect(interrupted.light('monitor').visible).toBe(false);expect(interrupted.light('monitor').material.uniforms.uArrival.value).toBeLessThan(.001);interrupted.effect.dispose();
 });
 it('leaves the original room intact and keeps the photo interior free of effect geometry',()=>{
  const {room,effect,light}=fixture(),approved=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial());room.add(approved);
  const matrix=approved.matrix.clone(),position=Array.from(approved.geometry.getAttribute('position').array);
  effect.update({...frame,hover:'L09',press:true});room.updateMatrixWorld(true);
  const rayAt=(x:number,y:number)=>new T.Raycaster(new T.Vector3(0,0,24),new T.Vector3(...roomVertex(x,y,0)).sub(new T.Vector3(0,0,24)).normalize()).intersectObject(light('L09'));
  expect(rayAt(110,710)).toHaveLength(0);expect(rayAt(95,611).length).toBeGreaterThan(0);
  expect(approved.matrix.equals(matrix)).toBe(true);expect(Array.from(approved.geometry.getAttribute('position').array)).toEqual(position);
  effect.dispose();approved.geometry.dispose();(approved.material as T.Material).dispose();
 });
 it('shows hover feedback immediately, settles held input, and stops requesting frames after exit',()=>{
  const {effect,light}=fixture();effect.update({...frame,hover:'monitor'});
  expect(light('monitor').visible).toBe(true);expect(effect.state.needsFrame).toBe(true);
  advance(effect,{hover:'monitor'});expect(effect.state.needsFrame).toBe(false);expect(light('monitor').material.uniforms.uLevel.value).toBe(1);
  advance(effect,{},2);expect(effect.state.needsFrame).toBe(false);expect(light('monitor').visible).toBe(false);effect.dispose();
 });
 it('retargets press feedback from its current value and releases on the originally pressed object',()=>{
  const {effect,light}=fixture();effect.update(frame);advance(effect,{hover:'keyboard',press:true},0,.1);
  const held=light('keyboard').material.uniforms.uPress.value;expect(held).toBeGreaterThan(0);expect(held).toBeLessThan(1);
  effect.update({...frame,time:.12,hover:'keyboard'});const released=light('keyboard').material.uniforms.uPress.value;expect(released).toBeLessThan(held);expect(released).toBeGreaterThan(0);
  effect.update({...frame,time:.14,hover:'keyboard',press:true});expect(light('keyboard').material.uniforms.uPress.value).toBeGreaterThan(released);
  effect.update({...frame,time:.16,hover:'monitor'});expect(light('keyboard').material.uniforms.uPulse.value).toBeGreaterThan(0);expect(light('monitor').material.uniforms.uPulse.value).toBe(0);effect.dispose();
 });
 it('does not replay an initial activation snapshot and bounds repeated activation energy',()=>{
  const {effect,light}=fixture();effect.update({...frame,hover:'L06',activation:12});expect(light('L06').material.uniforms.uPulse.value).toBe(0);
  for(let i=13;i<30;i++)effect.update({...frame,time:i/60,hover:'L06',activation:i});
  expect(light('L06').material.uniforms.uPulse.value).toBeGreaterThan(.5);expect(light('L06').material.uniforms.uPulse.value).toBeLessThanOrEqual(1);effect.dispose();
 });
 it('greets a room arrival with both original solid hearts, then settles without an ambient loop',()=>{
  const {effect}=fixture();effect.update(frame);
  const heart=effect.root.getObjectByName('RABBIT_DEPTH_GREETING_0') as T.Mesh<T.ExtrudeGeometry,T.ShaderMaterial>,second=effect.root.getObjectByName('RABBIT_DEPTH_GREETING_1') as T.Mesh;
  expect(heart.geometry.type).toBe('ExtrudeGeometry');expect(heart.visible&&second.visible).toBe(true);
  const restingScale=heart.scale.x;advance(effect,{},0,.3);
  expect(heart.position.y).toBeGreaterThan(roomVertex(1480,347,heart.position.z)[1]);
  expect(heart.scale.x).toBeGreaterThan(restingScale*1.15);expect(heart.material.uniforms.uOpacity.value).toBeGreaterThan(.7);
  advance(effect,{},.3,2);expect(heart.visible||second.visible).toBe(false);expect(effect.state.needsFrame).toBe(false);
  effect.update({...frame,time:3,active:false});effect.update({...frame,time:4});expect(heart.visible&&second.visible).toBe(true);effect.dispose();
 });
 it('replays a complete surface sweep on activation after hover has settled',()=>{
  const {effect,light}=fixture();advance(effect,{hover:'keyboard'});expect(light('keyboard').material.uniforms.uSweep.value).toBe(1);
  effect.update({...frame,time:2.1,hover:'keyboard',activation:1});expect(light('keyboard').material.uniforms.uSweep.value).toBeLessThan(.1);
  advance(effect,{hover:'keyboard',activation:1},2.1,2);expect(light('keyboard').material.uniforms.uSweep.value).toBe(1);expect(effect.state.needsFrame).toBe(false);effect.dispose();
 });
 it.each([{reducedMotion:true},{keyboard:true}])('keeps reduced motion and keyboard feedback static: %o',preference=>{
  const {effect,light}=fixture();effect.update({...frame,...preference,hover:'L04',press:true,pointer:{x:1500,y:600}});
  const hearts=effect.root.children.filter(child=>child.name.startsWith('RABBIT_DEPTH')),transforms=hearts.map(heart=>{heart.updateMatrix();return heart.matrix.toArray();});
  effect.update({...frame,...preference,time:3,hover:'L04',press:true,pointer:{x:1600,y:400},activation:1});
  expect(effect.state.needsFrame).toBe(false);hearts.forEach((heart,i)=>{heart.updateMatrix();expect(heart.matrix.toArray()).toEqual(transforms[i]);});
  effect.update({...frame,...preference,time:4,hover:'L06'});expect(light('L06').material.uniforms.uLevel.value).toBe(1);expect(light('L06').material.uniforms.uPulse.value).toBe(0);effect.dispose();
 });
 it('cancels a held press and hides offscreen without a delayed release on return',()=>{
  const {effect,light}=fixture();advance(effect,{hover:'monitor',press:true},0,.1);effect.cancelInteraction();
  effect.update({...frame,time:1});expect(light('monitor').material.uniforms.uPulse.value).toBe(0);
  effect.update({...frame,time:2,active:false});expect(effect.root.visible).toBe(false);expect(effect.state.needsFrame).toBe(false);
  effect.update({...frame,time:3});expect(light('monitor').visible).toBe(false);expect(light('monitor').material.uniforms.uPulse.value).toBe(0);effect.dispose();
 });
 it('disposes shared GPU resources once and removes only its own group',()=>{
  const {room,effect}=fixture(),resources=new Set<T.BufferGeometry|T.Material>();effect.root.traverse(node=>{if(node instanceof T.Mesh){resources.add(node.geometry);for(const material of Array.isArray(node.material)?node.material:[node.material])resources.add(material);}});
  const spies=[...resources].map(resource=>vi.spyOn(resource,'dispose'));effect.dispose();effect.dispose();expect(room.children).toHaveLength(0);for(const spy of spies)expect(spy).toHaveBeenCalledTimes(1);
 });
});

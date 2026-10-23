import {describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {createRoomReactions,type RoomReactionInput} from './roomReactions';
import {ROOM_REFERENCE,roomVertex} from './approvedRoomGeometry';

const frame:RoomReactionInput={time:0,active:true,reducedMotion:false,pointer:null,hover:null,press:false,activation:0,keyboard:false};
function fixture(){const room=new T.Group(),effect=createRoomReactions(room);return{room,effect,light:(target:string)=>effect.root.getObjectByName('ROOM_LIGHT_'+target) as T.Mesh<T.BufferGeometry,T.ShaderMaterial>};}
function advance(effect:ReturnType<typeof createRoomReactions>,input:Partial<RoomReactionInput>,start=0,duration=2){for(let t=start;t<=start+duration+.0001;t+=1/60)effect.update({...frame,...input,time:t});}

describe('approved B-room object reactions',()=>{
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
 it('retargets press feedback from its current value and dissipates release without a second pulse',()=>{
  const {effect,light}=fixture();effect.update(frame);advance(effect,{hover:'keyboard',press:true},0,.1);
  const held=light('keyboard').material.uniforms.uPress.value;expect(held).toBeGreaterThan(0);expect(held).toBeLessThan(1);
  effect.update({...frame,time:.12,hover:'keyboard'});const released=light('keyboard').material.uniforms.uPress.value;expect(released).toBeLessThan(held);expect(released).toBeGreaterThan(0);
  effect.update({...frame,time:.14,hover:'keyboard',press:true});expect(light('keyboard').material.uniforms.uPress.value).toBeGreaterThan(released);
  effect.update({...frame,time:.16,hover:'monitor'});expect(light('keyboard').material.uniforms.uPulse.value).toBe(0);expect(light('monitor').material.uniforms.uPulse.value).toBe(0);effect.dispose();
 });
 it('does not replay an initial activation snapshot and bounds repeated activation energy',()=>{
  const {effect,light}=fixture();effect.update({...frame,hover:'L06',activation:12});expect(light('L06').material.uniforms.uPulse.value).toBe(0);
  for(let i=13;i<30;i++)effect.update({...frame,time:i/60,hover:'L06',activation:i});
  expect(light('L06').material.uniforms.uPulse.value).toBeGreaterThan(.5);expect(light('L06').material.uniforms.uPulse.value).toBeLessThanOrEqual(1);effect.dispose();
 });
 it.each([{reducedMotion:true},{keyboard:true}])('keeps reduced motion and keyboard feedback static: %o',preference=>{
  const {effect,light}=fixture();effect.update({...frame,...preference,hover:'L04',press:true,pointer:{x:1500,y:600}});
  const rabbit=light('L04'),pointer=rabbit.material.uniforms.uPointer.value.clone(),wake=rabbit.material.uniforms.uWake.value.clone();
  effect.update({...frame,...preference,time:3,hover:'L04',press:true,pointer:{x:1600,y:400},activation:1});
  expect(effect.state.needsFrame).toBe(false);expect(rabbit.material.uniforms.uPointer.value.equals(pointer)).toBe(true);expect(rabbit.material.uniforms.uWake.value.equals(wake)).toBe(true);expect(rabbit.material.uniforms.uVelocity.value.length()).toBe(0);
  effect.update({...frame,...preference,time:4,hover:'L06'});expect(light('L06').material.uniforms.uLevel.value).toBe(1);expect(light('L06').material.uniforms.uPulse.value).toBe(0);effect.dispose();
 });
 it('keeps tilted surfaces on the original B-camera rays and registers the pointer to their actual triangle UV',()=>{
  const {effect,light}=fixture(),camera=new T.PerspectiveCamera(ROOM_REFERENCE.fov,ROOM_REFERENCE.width/ROOM_REFERENCE.height,.1,100);camera.position.z=ROOM_REFERENCE.distance;camera.updateMatrixWorld();
  for(const [target,points] of Object.entries({monitor:[[78,344],[205,323],[242,621],[116,589]],keyboard:[[321,680],[590,696],[576,718],[315,699]],L06:[[1264,560],[1420,539],[1382,689],[1218,720]],L09:[[29,619],[162,598],[195,793],[62,829]]})){
   const mesh=light(target),position=mesh.geometry.getAttribute('position');
   expect(new Set(Array.from({length:4},(_,i)=>position.getZ(i))).size).toBeGreaterThan(1);
   points.forEach(([x,y],i)=>{const projected=new T.Vector3().fromBufferAttribute(position,i).project(camera);expect((projected.x+1)*.5*ROOM_REFERENCE.width).toBeCloseTo(x,3);expect((1-projected.y)*.5*ROOM_REFERENCE.height).toBeCloseTo(y,3);});
   const point=new T.Vector3().fromBufferAttribute(position,0).multiplyScalar(.2).addScaledVector(new T.Vector3().fromBufferAttribute(position,1),.3).addScaledVector(new T.Vector3().fromBufferAttribute(position,2),.5),projected=point.clone().project(camera);
   effect.cancelInteraction();effect.update({...frame,time:1,hover:target as RoomReactionInput['hover'],pointer:{x:(projected.x+1)*.5*ROOM_REFERENCE.width,y:(1-projected.y)*.5*ROOM_REFERENCE.height}});
   const actual=mesh.material.uniforms.uPointer.value;expect(actual.x).toBeCloseTo(.8,4);expect(actual.y).toBeCloseTo(.5,4);
  }
  effect.dispose();
 });
 it('tracks pointer direction with a bounded wake, locks the press origin and settles stationary input',()=>{
  const {effect,light}=fixture();effect.update({...frame,hover:'keyboard',pointer:{x:350,y:692}});
  effect.update({...frame,time:.04,hover:'keyboard',pointer:{x:500,y:706},press:true});
  const u=light('keyboard').material.uniforms,origin=u.uOrigin.value.clone();
  expect(u.uVelocity.value.x).toBeGreaterThan(0);expect(u.uVelocity.value.length()).toBeLessThanOrEqual(8);expect(u.uWake.value.x).toBeLessThan(u.uPointer.value.x);
  expect(u.uWave.value).toBeLessThan(1);expect(u.uPulse.value).toBe(0);
  effect.update({...frame,time:.06,hover:'keyboard',pointer:{x:560,y:710},press:true});expect(u.uOrigin.value.equals(origin)).toBe(true);
  advance(effect,{hover:'keyboard',pointer:{x:560,y:710},press:true},.08,3);
  expect(effect.state.needsFrame).toBe(false);expect(u.uVelocity.value.length()).toBe(0);expect(u.uWake.value.equals(u.uPointer.value)).toBe(true);effect.dispose();
 });
 it('lights the keyboard cluster on pointerdown, runs one finite held wave and coalesces its native click on release',()=>{
  const {effect,light}=fixture();effect.update({...frame,hover:'keyboard',pointer:{x:440,y:700}});
  effect.update({...frame,time:1/60,hover:'keyboard',pointer:{x:440,y:700},press:true});
  const u=light('keyboard').material.uniforms;
  expect(u.uPress.value).toBeGreaterThanOrEqual(.55);expect(u.uWave.value).toBeGreaterThan(0);expect(u.uWave.value).toBeLessThan(.1);expect(u.uPulse.value).toBe(0);
  effect.update({...frame,time:.2,hover:'keyboard',pointer:{x:440,y:700},press:true});expect(u.uWave.value).toBeGreaterThan(.1);expect(u.uWave.value).toBeLessThan(1);
  advance(effect,{hover:'keyboard',pointer:{x:440,y:700},press:true},.22,2);
  expect(u.uWave.value).toBe(1);expect(effect.state.needsFrame).toBe(false);
  effect.update({...frame,time:2.3,hover:'keyboard',activation:1});
  expect(u.uPress.value).toBeLessThan(1);expect(u.uPulse.value).toBe(0);expect(u.uWave.value).toBe(1);
  advance(effect,{activation:1},2.32,2);expect(light('keyboard').visible).toBe(false);expect(effect.state.needsFrame).toBe(false);effect.dispose();
 });
 it('grounds the rabbit response on an open desk strip and never puts geometry on plush, ears, faces or the photo',()=>{
  const {effect,light}=fixture();effect.root.updateMatrixWorld(true);
  expect(effect.root.children).toHaveLength(5);expect(effect.root.children.some(node=>node.name.startsWith('RABBIT_DEPTH'))).toBe(false);
  const rayAt=(target:string,x:number,y:number)=>new T.Raycaster(new T.Vector3(0,0,24),new T.Vector3(...roomVertex(x,y,0)).sub(new T.Vector3(0,0,24)).normalize()).intersectObject(light(target));
  for(const [x,y] of [[1500,450],[1615,450],[1550,590],[1460,750],[1600,770],[1515,785],[1560,802],[1590,815]])expect(rayAt('L04',x,y)).toHaveLength(0);
  for(const [x,y] of [[1425,772],[1515,774],[1560,787],[1640,802]])expect(rayAt('L04',x,y).length).toBeGreaterThan(0);
  for(const [x,y] of [[425,315],[1165,370],[110,710]])for(const target of ['monitor','keyboard','L04','L09','L06'])expect(rayAt(target,x,y)).toHaveLength(0);
  effect.dispose();
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

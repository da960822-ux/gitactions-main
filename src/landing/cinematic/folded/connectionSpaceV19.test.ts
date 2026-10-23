import {describe,expect,it} from 'vitest';
import {cameraPose,postConnectionPose} from './poseSpaceV19';
import {createStorySurface} from './storySurfaceV19';
import {roomWorldVertex} from './approvedRoomGeometry';
import {heroContain} from './initialCosmicHero';
import {Scene,PerspectiveCamera,Vector3} from 'three';

const surface=()=>{const owned:{dispose:()=>void}[]=[];return{owned,value:createStorySurface(new Scene(),resource=>{owned.push(resource);return resource;})};};
describe('approved B connection',()=>{
 it('holds the opening eye until deliberate departure begins',()=>{
  for(const e of[0,.5,1])for(const p of[0,.01,.02])expect(cameraPose(p,e,false)).toEqual(cameraPose(0,e,false));
 });
 it('converges to the existing room eye and holds the approved post endpoint',()=>{
  for(const p of[.38,.7,.85,1]){
   expect(cameraPose(p,1,false).position).toEqual(roomWorldVertex(836,470.5,24));
   expect(cameraPose(p,1,false).target).toEqual([-6,.5,-10]);
  }
 });
 it('keeps a finite camera ahead of B throughout the close pass',()=>{
  let previous=Infinity;
  for(let i=0;i<=1000;i++){
   const pose=cameraPose(i/1000,1,false);
   expect(pose.position.every(Number.isFinite)).toBe(true);
   expect(pose.position[2]).toBeLessThanOrEqual(previous+1e-8);
   expect(pose.position[2]).toBeGreaterThan(-10);
   expect(Math.hypot(...pose.position.map((n,j)=>n-pose.target[j]))).toBeGreaterThan(1);
   previous=pose.position[2];
  }
 });
 it('has continuous position and velocity at every close-pass join',()=>{
  const h=1e-6;
  for(const p of[.02,.04,.20,.26,.38]){
   const left=cameraPose(p-h,1,false),center=cameraPose(p,1,false),right=cameraPose(p+h,1,false);
   for(const key of['position','target'] as const)for(let i=0;i<3;i++){
    expect(Math.abs(right[key][i]-left[key][i])).toBeLessThan(.001);
    expect(Math.abs((center[key][i]-left[key][i])/h-(right[key][i]-center[key][i])/h)).toBeLessThan(.02);
   }
  }
 });
 it('evaluates identical camera and mesh poses on reversal without reallocating geometry',()=>{
  const {value,owned}=surface();value.setProjection(1920,1080,1);const geometry=value.mesh.geometry,snapshots=new Map<number,unknown>();
  for(const p of[0,.15,.28,.4,.7,1,.7,.4,.28,.15,0]){
   value.update(p,1);expect(value.mesh.geometry).toBe(geometry);
   const positions=Array.from(geometry.getAttribute('position').array);expect(positions.every(Number.isFinite)).toBe(true);
   const pose={camera:cameraPose(p,1,false),positions};if(snapshots.has(p))expect(pose).toEqual(snapshots.get(p));else snapshots.set(p,pose);
  }
  owned.forEach(resource=>resource.dispose());
 });
 it('reveals only intervals connected to the outer edge, with no interior aperture or plateau',()=>{
  const {value,owned}=surface();value.setProjection(1920,1080,1);const position=value.mesh.geometry.getAttribute('position'),columns=value.mesh.geometry.parameters.widthSegments+1;
  for(const p of[.4,.45,.5,.55,.65]){value.update(p,1);for(let row=0;row<position.count/columns;row++){let exposed=false;for(let col=0;col<columns;col++){const open=position.getZ(row*columns+col)<-10;if(exposed)expect(open).toBe(true);exposed ||=open;}}}
  owned.forEach(resource=>resource.dispose());
 });
 it('does not expose B or cross the camera through I before the approved room eye is reached',()=>{
  const {value,owned}=surface();value.setProjection(1920,1080,1);const positions=value.mesh.geometry.getAttribute('position');
  for(const p of[0,.15,.26,.379]){value.update(p,1);const camera=cameraPose(p,1,false);for(let i=0;i<positions.count;i++){expect(positions.getZ(i)).toBeGreaterThan(-10);expect(camera.position[2]-positions.getZ(i)).toBeGreaterThan(4);}}
  owned.forEach(resource=>resource.dispose());
 });
 it.each([[1920,1080],[1440,900]])('retains approved B framing while the material boundary advances at %i×%i',(width,height)=>{
  for(const p of[.4,.48,.55,.7,1]){const pose=cameraPose(p,1,false),camera=new PerspectiveCamera(48,width/height,.1,400);camera.position.fromArray(pose.position);camera.position.z+=heroContain(width,height);camera.lookAt(...pose.target as[number,number,number]);camera.updateMatrixWorld();
   const corners=[[0,-58],[1672,999]].map(([x,y])=>new Vector3(...roomWorldVertex(x,y,0)).project(camera));expect(corners[0].x).toBeLessThan(-1+2/width);expect(corners[1].x).toBeGreaterThan(1-2/width);expect(corners[0].y).toBeGreaterThan(1);expect(corners[1].y).toBeLessThan(-1);
  }
 });
 it.each([[1920,1080],[1440,900]])('clears every I vertex behind unchanged B at the arrival at %i×%i',(width,height)=>{
  const {value,owned}=surface();value.setProjection(width,height,1);value.update(.7,1);
  const positions=value.mesh.geometry.getAttribute('position');for(let i=0;i<positions.count;i++)expect(positions.getZ(i)).toBeLessThan(-10);
  expect(value.material.opacity).toBe(1);expect(value.material.depthTest).toBe(true);expect(value.material.depthWrite).toBe(true);
  const previous=Array.from(positions.array);value.setProjection(height,width,1);value.update(.3,1);value.setProjection(width,height,1);value.update(.7,1);expect(Array.from(positions.array)).toEqual(previous);
  expect(heroContain(width,height)).toBeGreaterThanOrEqual(0);owned.forEach(resource=>resource.dispose());
 });
 it('keeps the original mesh UV inside its source with no edge clamp extension',()=>{
  const {value,owned}=surface();for(const p of[0,.28,.4,.7]){value.setProjection(1920,1080,1);value.update(p,1);const uv=value.mesh.geometry.getAttribute('uv');expect(Math.min(...uv.array)).toBeGreaterThanOrEqual(0);expect(Math.max(...uv.array)).toBeLessThanOrEqual(1);}
  owned.forEach(resource=>resource.dispose());
 });
 it('keeps exact room/post endpoints and a finite turn on reverse',()=>{
  const from={position:[-6,.5,-.4],target:[-6,.5,-10],fov:48},to={position:[-6,-2.1,-1],target:[-6.7,-2.75,6.4],fov:38};
  expect(postConnectionPose(0,from,to)).toEqual(from);expect(postConnectionPose(1,from,to)).toEqual(to);
  for(let i=0;i<=100;i++){const pose=postConnectionPose(i/100,from,to);expect(Math.hypot(...pose.position.map((n,j)=>n-pose.target[j]))).toBeGreaterThan(1);expect(pose.position.every(Number.isFinite)).toBe(true);}
 });
});

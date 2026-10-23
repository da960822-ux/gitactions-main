import {describe,expect,it,vi} from 'vitest';
import {Mesh,Points,ShaderMaterial} from 'three';
import {createHeroAtmosphere,heroAtmospherePresence} from './heroAtmosphere';

const frame={time:0,progress:0,pointerX:0,pointerY:0,press:false,reducedMotion:false};
function fixture(){
 const effect=createHeroAtmosphere({halfWidthAtUnitZ:.6,halfHeightAtUnitZ:.4});
 const sky=effect.root.children[0] as Mesh,stars=effect.root.children[1] as Points;
 const uniforms=(sky.material as ShaderMaterial).uniforms;
 return{effect,sky,stars,uniforms};
}

describe('initial Hero cosmic atmosphere',()=>{
 it('is visible on the first frame and fully gone before the existing camera approach',()=>{
  expect(heroAtmospherePresence(0)).toBe(1);
  expect(heroAtmospherePresence(.035)).toBeGreaterThan(0);
  expect(heroAtmospherePresence(.035)).toBeLessThan(1);
  for(const p of [.055,.06,.21,1])expect(heroAtmospherePresence(p)).toBe(0);
  const {effect}=fixture();effect.update({...frame,progress:.06});expect(effect.root.visible).toBe(false);
  effect.update({...frame,time:1,progress:0});expect(effect.root.visible).toBe(true);effect.dispose();
 });
 it('keeps all light behind the original 4.2-depth portrait and in the source sky',()=>{
  const {effect,sky,stars}=fixture(),positions=stars.geometry.getAttribute('position');
  expect(sky.position.z).toBeLessThan(-4.2);
  for(let i=0;i<positions.count;i++){
   expect(positions.getZ(i)).toBeLessThan(-4.35);
   const v=positions.getY(i)/(.4*-positions.getZ(i))*.5+.5;
   expect(v).toBeGreaterThan(.51);expect(v).toBeLessThan(1.01);
  }
  expect((sky.material as ShaderMaterial).depthTest).toBe(true);
  expect((stars.material as ShaderMaterial).depthWrite).toBe(false);effect.dispose();
 });
 it('uses substantial curved orbital surfaces behind the portrait rather than an added particle overlay',()=>{
  const {effect}=fixture(),orbits=effect.root.getObjectByName('SCULPTED_COSMIC_ORBITS') as Mesh;
  const position=orbits.geometry.getAttribute('position'),normal=orbits.geometry.getAttribute('normal');
  expect(position.count).toBe(1806);expect(orbits.geometry.index?.count).toBe(9216);
  let near=-Infinity,far=Infinity;
  for(let i=0;i<position.count;i++){near=Math.max(near,position.getZ(i));far=Math.min(far,position.getZ(i));expect(Number.isFinite(normal.getZ(i))).toBe(true);}
  expect(near).toBeLessThan(-4.25);expect(near-far).toBeGreaterThan(.3);
  expect((orbits.material as ShaderMaterial).depthTest).toBe(true);expect((orbits.material as ShaderMaterial).depthWrite).toBe(false);
  effect.dispose();
 });
 it('retargets a press from the current charge and releases bounded light without restarting a timeline',()=>{
  const {effect,uniforms}=fixture();effect.update(frame);
  for(let i=1;i<=20;i++)effect.update({...frame,time:i*.02,press:true,pointerX:.6,pointerY:.4});
  const charge=uniforms.uCharge.value;expect(charge).toBeGreaterThan(.7);
  effect.update({...frame,time:.42});expect(uniforms.uRelease.value).toBeGreaterThan(.5);
  expect(uniforms.uCharge.value).toBeLessThan(charge);
  const interrupted=uniforms.uCharge.value;
  effect.update({...frame,time:.44,press:true});
  expect(uniforms.uCharge.value).toBeGreaterThan(interrupted);expect(uniforms.uCharge.value).toBeLessThan(1);
  effect.update({...frame,time:.46,progress:.06});expect(uniforms.uRelease.value).toBe(0);expect(uniforms.uCharge.value).toBe(0);effect.dispose();
 });
 it('cancels a held pointer without emitting a fresh release when the page resumes',()=>{
  const {effect,uniforms}=fixture();effect.update(frame);
  effect.update({...frame,time:.05,press:1});effect.update({...frame,time:.1,press:1});
  const charge=uniforms.uCharge.value;expect(charge).toBeGreaterThan(0);
  effect.cancelInteraction();effect.update({...frame,time:.15,press:0});
  expect(uniforms.uRelease.value).toBe(0);expect(uniforms.uCharge.value).toBeLessThan(charge);effect.dispose();
 });
 it('makes reduced motion a static authored sky and cleans every GPU resource once',()=>{
  const {effect,sky,stars,uniforms}=fixture();
  effect.update({...frame,time:2,press:true,pointerX:1,pointerY:1});
  effect.update({...frame,time:3,press:true,reducedMotion:true});
  expect(uniforms.uMotion.value).toBe(0);expect(uniforms.uTime.value).toBe(0);expect(uniforms.uPointer.value.length()).toBe(0);expect(uniforms.uCharge.value).toBe(0);expect(uniforms.uRelease.value).toBe(0);
  const orbits=effect.root.getObjectByName('SCULPTED_COSMIC_ORBITS') as Mesh;
  const resources=[sky.geometry,sky.material as ShaderMaterial,stars.geometry,stars.material as ShaderMaterial,orbits.geometry,orbits.material as ShaderMaterial],spies=resources.map(resource=>vi.spyOn(resource,'dispose'));
  effect.dispose();effect.dispose();for(const spy of spies)expect(spy).toHaveBeenCalledTimes(1);
 });
});

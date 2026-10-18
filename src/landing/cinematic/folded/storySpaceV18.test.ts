import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {createStorySurface} from './storySurfaceV17';
import {createStoryAtrium} from './storyAtriumV18';
describe('Hero to story physical handoff',()=>{
 it('keeps one video mesh and UV buffer across expansion and reverse',()=>{
  const owned:{dispose:()=>void}[]=[],keep=<A extends{dispose:()=>void}>(x:A)=>{owned.push(x);return x;},scene=new T.Scene(),sheet=createStorySurface(scene,keep),id=sheet.mesh.uuid,uv=sheet.mesh.geometry.getAttribute('uv'),positions=sheet.mesh.geometry.getAttribute('position');
  sheet.update(0,1);const start=Array.from(positions.array);sheet.update(.55,1);expect(Array.from(positions.array)).not.toEqual(start);sheet.update(1,1);sheet.update(0,1);expect(sheet.mesh.uuid).toBe(id);expect(sheet.mesh.geometry.getAttribute('uv')).toBe(uv);expect(Array.from(positions.array)).toEqual(start);owned.forEach(x=>x.dispose());
 });
 it('arrival camera sees physical destination and curved wall has smooth unit normals',()=>{
  const owned:{dispose:()=>void}[]=[],keep=<A extends{dispose:()=>void}>(x:A)=>{owned.push(x);return x;},scene=new T.Scene(),atrium=createStoryAtrium(scene,keep);scene.updateMatrixWorld(true);
  const camera=new T.Vector3(-3.8,.25,-40),ray=new T.Raycaster(camera,new T.Vector3(-12,.15,-69).sub(camera).normalize()),hits=ray.intersectObject(atrium.root,true);expect(hits.length).toBeGreaterThan(0);expect(hits[0].distance).toBeLessThan(80);expect(hits[0].object.name).toBe('CURVED_STORY_WALL_WITH_REAL_OPENINGS');
  const wall=atrium.root.getObjectByName('CURVED_STORY_WALL_WITH_REAL_OPENINGS')as T.Mesh,n=wall.geometry.getAttribute('normal');for(let i=0;i<n.count;i++){expect(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))).toBeCloseTo(1,5);expect(n.getZ(i)).toBeGreaterThan(.8);}owned.forEach(x=>x.dispose());
 });
});

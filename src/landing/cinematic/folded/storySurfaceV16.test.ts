import {describe,it,expect} from 'vitest';
import {surfacePose,surfaceVertex} from './storySurfaceV16';
describe('persistent story video sheet',()=>{
 it('changes real silhouette/curvature and retains noncollapsed indexed parameterization',()=>{
  for(const p of [0,.16,.32,.55,.7,1]){const s=surfacePose(p);expect(s.width).toBeGreaterThan(1);expect(s.height).toBeGreaterThan(.7);for(const u of [0,.25,.5,.75,1]){const v=surfaceVertex(u,.5,p);expect(v.every(Number.isFinite)).toBe(true);const a=surfaceVertex(u+.0001,.5,p);expect(a[0]-v[0]).toBeGreaterThan(0);}}
  expect(surfacePose(1).width/surfacePose(0).width).toBeGreaterThan(8);expect(surfaceVertex(0,.5,1)[2]).not.toBe(surfaceVertex(.5,.5,1)[2]);
 });
 it('evaluates forward/reverse without accumulated transforms and keeps Hero authored placement',()=>{
  const before=surfaceVertex(.2,.7,.32);surfaceVertex(.2,.7,1);expect(surfaceVertex(.2,.7,.32)).toEqual(before);expect(surfacePose(0).center).toEqual([-.35,-1.55,.65]);
 });
});

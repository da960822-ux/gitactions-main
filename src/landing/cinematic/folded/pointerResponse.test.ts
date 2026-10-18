import {describe,it,expect} from 'vitest';
import {pointerDecay} from './pointerResponse';
describe('pointer wall-time response',()=>{
 it('is independent of frame splitting, including a delayed frame',()=>{
  for(const[a,b]of[[1/60,1/60],[.08,.5],[1,3]])expect(1-(1-pointerDecay(a))*(1-pointerDecay(b))).toBeCloseTo(pointerDecay(a+b),14);
  expect(pointerDecay(1)).toBeGreaterThan(.99);expect(pointerDecay(0)).toBe(0);expect(pointerDecay(-1)).toBe(0);expect(pointerDecay(60)).toBe(1);
 });
});

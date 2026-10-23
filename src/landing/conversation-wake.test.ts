import {describe,it,expect} from 'vitest';
import {advanceWake,recordWake,wakeLimit,type WakePoint} from './conversation-wake';

describe('bounded conversation material wake',()=>{
 it('keeps rapid strokes finite and capped, then clears after their lifetime',()=>{
  const points:WakePoint[]=[];
  for(let index=0;index<80;index++)recordWake(points,index/80,.5,1/120);
  expect(points).toHaveLength(wakeLimit);
  expect(points.every(point=>Number.isFinite(point.width)&&point.width>=.25&&point.width<=1)).toBe(true);
  for(let tick=0;tick<5;tick++)advanceWake(points,.25);
  expect(points).toHaveLength(0);
 });
 it('accumulates a visible stroke from slow sub-pixel moves instead of losing its anchor',()=>{
  const points:WakePoint[]=[];
  for(let step=0;step<30;step++)recordWake(points,step*.001,.4,1/60);
  expect(points.length).toBeGreaterThan(3);
  expect(points[0].x).toBe(0);
  expect(points.at(-1)!.x).toBe(.029);
  expect(points.every(point=>point.width>=.25)).toBe(true);
 });
 it('gives fast movement a wider wake while keeping a stationary head and invalid input bounded',()=>{
  const slow:WakePoint[]=[],fast:WakePoint[]=[];
  for(const points of [slow,fast])recordWake(points,0,0,0);
  recordWake(slow,.1,0,1);recordWake(fast,.1,0,.01);
  expect(fast.at(-1)!.width).toBeGreaterThan(slow.at(-1)!.width);
  const count=fast.length;recordWake(fast,.101,0,NaN);expect(fast).toHaveLength(count);
  recordWake(fast,NaN,0,.1);expect(fast).toHaveLength(count);
  advanceWake(fast,NaN);expect(fast.every(point=>Number.isFinite(point.age))).toBe(true);
  expect(fast.at(-1)!.x).toBe(.101);
 });
});

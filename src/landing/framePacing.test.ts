import {describe,expect,it} from 'vitest';
import {nextRenderFrame} from './framePacing';

describe('gallery frame pacing',()=>{
 it.each([[30,60],[30,120],[30,144],[60,60],[60,120],[60,144]])('preserves a %ifps deadline across %iHz RAF jitter',(fps,hz)=>{
  let previous:number|null=null;const draws:number[]=[];
  for(let frame=0;frame<hz*10;frame++){
   const now=frame*1000/hz+Math.sin(frame*1.7)*.15,next=nextRenderFrame(now,previous,1000/fps);
   if(next===null)continue;previous=next;draws.push(now);
  }
  expect(draws).toHaveLength(fps*10);
  const gaps=draws.slice(1).map((now,i)=>now-draws[i]);
  expect(gaps.reduce((total,gap)=>total+gap,0)/gaps.length).toBeCloseTo(1000/fps,1);
  if(hz===60){expect(Math.min(...gaps)).toBeGreaterThan(fps===60?16:33);expect(Math.max(...gaps)).toBeLessThan(fps===60?17:34);}
 });
 it('skips missed slots after a stall and restarts from a fresh clock after suspension',()=>{
  expect(nextRenderFrame(0,null,1000/30)).toBe(0);expect(nextRenderFrame(16,0,1000/30)).toBeNull();
  const afterStall=nextRenderFrame(1000,0,1000/30)!;expect(afterStall).toBeCloseTo(1000,8);
  expect(nextRenderFrame(1016,afterStall,1000/30)).toBeNull();expect(nextRenderFrame(1033.333,afterStall,1000/30)).toBeCloseTo(1033.333333,5);
  expect(nextRenderFrame(5000,null,1000/60)).toBe(5000);
 });
});

import {describe,expect,it} from 'vitest';
import {companionBodyMotion} from '../../post-hero-preview/src/CountryCompanions';

describe('companion motion ownership and interruption',()=>{
 it('starts native greeting and reversal at the currently rendered pose',()=>{
  for(const together of [true,false])for(const side of [-1,1] as const){
   const motion=companionBodyMotion('greet',together,240,side,false);
   expect(Array.isArray(motion.transform)).toBe(true);expect(motion.transform[0]).toBeNull();
   expect(motion.transition.duration).toBeGreaterThan(1);
   expect(motion.transform.at(-1)).toContain(`translateX(${together?240*side:0}px)`);
  }
 });
 it('retargets visible scroll or resize to apart without replaying a flight or snapping',()=>{
  for(const side of [-1,1] as const){
   const motion=companionBodyMotion('return',true,240,side,false);
   expect(typeof motion.transform).toBe('string');expect(motion.transform).toMatch(/^translateX\(0px\) translateY\(0px\) rotate\(0deg\)$/);
   expect(motion.transition.duration).toBeGreaterThan(.15);expect(motion.transition.duration).toBeLessThan(.3);
   expect(motion.transition).not.toHaveProperty('times');
  }
 });
 it('has an immediate offscreen path and retains the keyboard/reduced static greeting endpoint',()=>{
  const hidden=companionBodyMotion('instant',false,240,1,false),reduced=companionBodyMotion('greet',true,240,1,true),keyboard=companionBodyMotion('instant',true,240,1,false);
  expect(hidden.transition.duration).toBe(0);expect(hidden.transform).toContain('translateX(0px)');
  expect(reduced.transition.duration).toBe(0);expect(reduced.transform).toBe(keyboard.transform);expect(Array.isArray(reduced.transform)).toBe(false);
 });
});

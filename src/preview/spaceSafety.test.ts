import {describe,it,expect} from 'vitest';
import {keepHeartOutsidePortrait} from './spaceSafety';
describe('portrait safety',()=>{
 it('routes a foreground heart clear of the phone, hands and full portrait during retreat',()=>{
  const portrait={x:295,y:210,width:472,height:472};
  const left=keepHeartOutsidePortrait(350,480,48,portrait,-1),right=keepHeartOutsidePortrait(660,500,48,portrait,1);
  expect(left.x+48).toBeLessThan(portrait.x);expect(right.x-48).toBeGreaterThan(portrait.x+portrait.width);
 });
 it('preserves an already clear flank and permits an orbit above or below the portrait',()=>{
  const p={x:420,y:185,width:600,height:600};
  expect(keepHeartOutsidePortrait(310,400,50,p,-1)).toEqual({x:310,y:400});
  expect(keepHeartOutsidePortrait(700,80,30,p,-1)).toEqual({x:700,y:80});
 });
});

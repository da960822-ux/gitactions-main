import {describe,it,expect} from 'vitest';
import {sampleShellTwist,type ShellTwistSample} from './shellTwist';
const fresh=():ShellTwistSample=>({x:0,z:0,xx:0,xz:0,zx:0,zz:0});
describe('nonrigid Hero radial twist',()=>{
 it('preserves orientation and radius while differentiating the actual surface',()=>{
  const a=fresh(),b=fresh(),c=fresh(),eps=1e-5;
  for(const p of[0,.1,.2,.3,.43,1])for(const x of[-10,0,10,18,25])for(const z of[-20,-7,0,10]){
   sampleShellTwist(x,z,p,1,a);expect(a.xx*a.zz-a.xz*a.zx).toBeCloseTo(1,10);expect(Math.hypot(a.x-18,a.z+7)).toBeCloseTo(Math.hypot(x-18,z+7),10);
   sampleShellTwist(x-eps,z,p,1,b);sampleShellTwist(x+eps,z,p,1,c);expect((c.x-b.x)/(2*eps)).toBeCloseTo(a.xx,5);expect((c.z-b.z)/(2*eps)).toBeCloseTo(a.zx,5);
   sampleShellTwist(x,z-eps,p,1,b);sampleShellTwist(x,z+eps,p,1,c);expect((c.x-b.x)/(2*eps)).toBeCloseTo(a.xz,5);expect((c.z-b.z)/(2*eps)).toBeCloseTo(a.zz,5);
  }
 });
 it('changes cross-radius distances, so the deformation is not a rigid hinge',()=>{
  const a=fresh(),b=fresh();sampleShellTwist(0,0,.3,1,a);sampleShellTwist(10,0,.3,1,b);expect(Math.abs(Math.hypot(a.x-b.x,a.z-b.z)-10)).toBeGreaterThan(.2);
  sampleShellTwist(0,0,0,1,a);expect(a.x).toBeCloseTo(0,12);expect(a.z).toBeCloseTo(0,12);
 });
});

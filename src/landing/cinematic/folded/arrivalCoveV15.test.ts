import {it,expect} from 'vitest';
import {sampleArrivalCove,type CoveSample} from './arrivalCoveV15';
it('opens the existing cove without flipping geometry and keeps analytic surface gradients',()=>{
 const a:CoveSample={x:0,y:0,xx:0,xy:0,xz:0,yy:0,yz:0},b={...a},c={...a},eps=1e-5;
 for(const p of[0,.32,.5,.65,.85,1])for(const x of[-15,-4,8])for(const y of[-3.319,-2,0,3,6])for(const z of[-10,-25,-60,-100]){
  sampleArrivalCove(x,y,z,p,a);expect(a.xx*a.yy).toBeGreaterThanOrEqual(1);
  for(const[axis,keys]of [[0,['xx']],[1,['xy','yy']],[2,['xz','yz']]]as const){const l=[x,y,z],r=[x,y,z];l[axis]-=eps;r[axis]+=eps;sampleArrivalCove(l[0],l[1],l[2],p,b);sampleArrivalCove(r[0],r[1],r[2],p,c);expect(a[keys[0]]).toBeCloseTo((c.x-b.x)/(2*eps),4);if(keys.length>1)expect(a[keys[1]!]).toBeCloseTo((c.y-b.y)/(2*eps),4);}
  if(y===-3.319){expect(a.y).toBe(y);}
 }
});

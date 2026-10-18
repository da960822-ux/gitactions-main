import {smoothRange} from './poseSpaceV6';
export type ShellTwistSample={x:number;z:number;xx:number;xz:number;zx:number;zz:number};
// Radius-dependent rotation is a bijection: radius stays fixed, and every ring rotates as one.
export function sampleShellTwist(x:number,z:number,progress:number,entrance:number,out:ShellTwistSample){
 const qx=x-18,qz=z+7,r=Math.hypot(qx,qz),t=Math.max(0,Math.min(1,(r-4)/22));
 const amount=-75*Math.PI/180*smoothRange(.08,.43,progress)*entrance;
 const angle=amount*(.65+.35*t*t*(3-2*t)),derivative=t>0&&t<1?amount*.35*6*t*(1-t)/22:0;
 const c=Math.cos(angle),s=Math.sin(angle),rx=c*qx+s*qz,rz=-s*qx+c*qz,gx=r>0?derivative*qx/r:0,gz=r>0?derivative*qz/r:0;
 out.x=18+rx;out.z=-7+rz;out.xx=c+rz*gx;out.xz=s+rz*gz;out.zx=-s-rx*gx;out.zz=c-rx*gz;
}

import {smoothRange} from './poseSpaceV11';
export type CoveSample={x:number;y:number;xx:number;xy:number;xz:number;yy:number;yz:number};
// The same continuous cove opens into a wider, taller courtyard; its Jacobian stays positive.
export function sampleArrivalCove(x:number,y:number,z:number,progress:number,out:CoveSample){
 const amount=smoothRange(.2,.75,progress),t=Math.max(0,Math.min(1,(-z-15)/20)),depth=t*t*(3-2*t),depthZ=t>0&&t<1?-6*t*(1-t)/20:0;
 const a=Math.max(0,Math.min(1,(y+2.8)/6.8)),side=.45+.55*a*a*(3-2*a),sideY=a>0&&a<1?.55*6*a*(1-a)/6.8:0;
 const b=Math.max(0,Math.min(1,(y-.5)/4.5)),roof=b*b*(3-2*b),roofY=b>0&&b<1?6*b*(1-b)/4.5:0;
 const spread=9*amount,rise=35*amount;
 const depthMeters=-z,axisT=Math.max(0,Math.min(1,(depthMeters-30)/68)),tail=Math.max(0,depthMeters-98),axis=-1-8*axisT*axisT*(3-2*axisT)-.00045*tail*tail,axisZ=(axisT>0&&axisT<1?48*axisT*(1-axisT)/68:0)+.0009*tail;
 out.x=axis+(x-axis)*(1+spread*depth*side);out.y=y+rise*depth*roof;
 out.xx=1+spread*depth*side;out.xy=(x-axis)*spread*depth*sideY;out.xz=axisZ*(1-out.xx)+(x-axis)*spread*depthZ*side;out.yy=1+rise*depth*roofY;out.yz=rise*depthZ*roof;
}

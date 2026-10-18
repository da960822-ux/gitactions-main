import {portraitStagePose} from './stageMotionV15';
export const FLOOR_SUPPORT={height:.75,radiusX:10,radiusZ:7,plateau:0,verticalStart:-2.8,verticalEnd:0}as const;
export type SupportShape={x:number;z:number;cos:number;sin:number;progress:number};
export type SupportSample={height:number;dx:number;dy:number;dz:number};
export function floorSupportShape(progress:number):SupportShape{
 const pose=portraitStagePose(progress);
 return{progress,x:pose.pivot[0]+pose.delta[0],z:pose.pivot[2]+pose.delta[2]+1,cos:Math.cos(pose.angleY),sin:Math.sin(pose.angleY)};
}
export function sampleFloorSupport(x:number,y:number,z:number,shape:SupportShape,out:SupportSample){
 const dx=x-shape.x,dz=z-shape.z,lx=shape.cos*dx-shape.sin*dz,lz=shape.sin*dx+shape.cos*dz;
 const r=Math.hypot(lx/FLOOR_SUPPORT.radiusX,lz/FLOOR_SUPPORT.radiusZ),t=Math.max(0,Math.min(1,(r-FLOOR_SUPPORT.plateau)/(1-FLOOR_SUPPORT.plateau)));
 const h=FLOOR_SUPPORT.height*(1-t*t*(3-2*t)),dr=r>0&&t>0&&t<1?-FLOOR_SUPPORT.height*6*t*(1-t)/(1-FLOOR_SUPPORT.plateau)/r:0;
 const q=Math.max(0,Math.min(1,(y-FLOOR_SUPPORT.verticalStart)/(FLOOR_SUPPORT.verticalEnd-FLOOR_SUPPORT.verticalStart))),w=1-q*q*(3-2*q),wy=q>0&&q<1?-6*q*(1-q)/(FLOOR_SUPPORT.verticalEnd-FLOOR_SUPPORT.verticalStart):0;
 const gx=lx/(FLOOR_SUPPORT.radiusX**2),gz=lz/(FLOOR_SUPPORT.radiusZ**2);
 const tBack=Math.max(0,Math.min(1,(z-shape.z+12)/11.2)),backSmooth=tBack*tBack*(3-2*tBack),opening=Math.max(0,Math.min(1,(shape.progress-.12)/.36)),closed=1-opening*opening*(3-2*opening);
 const drop=-10*(1-backSmooth)*closed,dropZ=tBack>0&&tBack<1?60*tBack*(1-tBack)/11.2*closed:0;
 out.height=(h+drop)*w;out.dx=dr*(gx*shape.cos+gz*shape.sin)*w;out.dy=(h+drop)*wy;out.dz=dropZ*w+dr*(-gx*shape.sin+gz*shape.cos)*w;
}

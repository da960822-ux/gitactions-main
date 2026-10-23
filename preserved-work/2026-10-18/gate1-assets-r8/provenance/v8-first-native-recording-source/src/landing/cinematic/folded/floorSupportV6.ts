import {portraitStagePose} from './stageMotion';
export const FLOOR_SUPPORT={height:.95,radiusX:6,radiusZ:7,plateau:0,verticalStart:-2.8,verticalEnd:0}as const;
export type SupportShape={x:number;z:number;cos:number;sin:number};
export type SupportSample={height:number;dx:number;dy:number;dz:number};
export function floorSupportShape(progress:number):SupportShape{
 const pose=portraitStagePose(progress);
 return{x:pose.pivot[0]+pose.delta[0],z:pose.pivot[2]+pose.delta[2],cos:Math.cos(pose.angleY),sin:Math.sin(pose.angleY)};
}
export function sampleFloorSupport(x:number,y:number,z:number,shape:SupportShape,out:SupportSample){
 const dx=x-shape.x,dz=z-shape.z,lx=shape.cos*dx-shape.sin*dz,lz=shape.sin*dx+shape.cos*dz;
 const r=Math.hypot(lx/FLOOR_SUPPORT.radiusX,lz/FLOOR_SUPPORT.radiusZ),t=Math.max(0,Math.min(1,(r-FLOOR_SUPPORT.plateau)/(1-FLOOR_SUPPORT.plateau)));
 const h=FLOOR_SUPPORT.height*(1-t*t*(3-2*t)),dr=r>0&&t>0&&t<1?-FLOOR_SUPPORT.height*6*t*(1-t)/(1-FLOOR_SUPPORT.plateau)/r:0;
 const q=Math.max(0,Math.min(1,(y-FLOOR_SUPPORT.verticalStart)/(FLOOR_SUPPORT.verticalEnd-FLOOR_SUPPORT.verticalStart))),w=1-q*q*(3-2*q),wy=q>0&&q<1?-6*q*(1-q)/(FLOOR_SUPPORT.verticalEnd-FLOOR_SUPPORT.verticalStart):0;
 const gx=lx/(FLOOR_SUPPORT.radiusX**2),gz=lz/(FLOOR_SUPPORT.radiusZ**2);
 out.height=h*w;out.dx=dr*(gx*shape.cos+gz*shape.sin)*w;out.dy=h*wy;out.dz=dr*(-gx*shape.sin+gz*shape.cos)*w;
}

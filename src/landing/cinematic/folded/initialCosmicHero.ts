import {Matrix4,PerspectiveCamera,MathUtils} from 'three';
import {openingCameraPose} from './poseSpaceV19';

type Point = {x:number;y:number;z:number};
type OpeningPose = {entry:number;pointerX:number;pointerY:number};

const clamp01=(value:number)=>Math.max(0,Math.min(1,value));
const smooth=(value:number)=>{const t=clamp01(value);return t*t*(3-2*t);};

/** Preserve the approved projection while moving the whole Hero into the room's camera neighborhood. */
export function heroStageProjection(width:number,height:number,entrance:number,_progress=0){
 const old=new PerspectiveCamera(38,width/height,.1,400),opening=openingCameraPose(entrance);
 old.position.fromArray(opening.position);old.lookAt(...opening.target as[number,number,number]);old.updateMatrixWorld();
 const near=new PerspectiveCamera(48,width/height,.1,400);
 // Authored source reference; the live camera must not change this registration.
 near.position.set(-6,.5,-1.4+heroContain(width,height));near.lookAt(-6,.5,-10);near.updateMatrixWorld();
 const scale=.28,frameScale=Math.tan(MathUtils.degToRad(24))/Math.tan(MathUtils.degToRad(19));
 return near.matrixWorld.clone().multiply(new Matrix4().makeScale(scale*frameScale,scale*frameScale,scale)).multiply(old.matrixWorldInverse);
}

/** The approved panorama settles before the existing departure path starts. */
export function cosmicOpeningPose(progress:number,entrance:number,pointerX=0,pointerY=0):OpeningPose{
 const presence=1-smooth((progress-.03)/.03);
 const phase=smooth(entrance);
 return{
  // Match the loading image on the first live frame, then open and settle.
  entry:4*phase*(1-phase)*presence,
  pointerX:Math.max(-1,Math.min(1,pointerX))*.24*presence,
  pointerY:Math.max(-1,Math.min(1,pointerY))*.16*presence,
 };
}

/** Mutates the existing indexed surface; its four outer edges stay anchored. */
export function deformInitialCosmicVertex(point:Point,u:number,v:number,pose:OpeningPose):void{
 if(!pose.entry&&!pose.pointerX&&!pose.pointerY)return;
 const envelope=Math.sin(Math.PI*u)*Math.sin(Math.PI*v);
 const across=u*2-1,up=v*2-1;
 // Extend only the outer edge under camera motion, so the panorama cannot uncover a seam.
 point.x+=Math.sign(across)*.6*Math.abs(pose.pointerX)*Math.abs(across)**24;
 point.y+=Math.sign(up)*.6*Math.abs(pose.pointerY)*Math.abs(up)**24;
 // The two shallow wings have different curvature, while the portrait stays rigid.
 point.x+=pose.entry*.18*Math.sin(Math.PI*across)*envelope;
 point.y+=pose.entry*.12*Math.sin(Math.PI*across)*envelope;
 point.z+=envelope*(pose.entry*(1.8+.5*Math.cos(Math.PI*u))+pose.pointerX*across-pose.pointerY*up);
}

/** Host applies this same camera containment once in beforeRender. */
export function heroContain(width:number,height:number){return 9.6*(Math.max(1,(1672/941)/(width/height))-1);}

/** Fixed world placement of the approved portrait; no progress-dependent reprojection. */
export function heroWorldProjection(width:number,height:number,entrance:number){
 const contain=heroContain(width,height);
 return new Matrix4().makeTranslation(-6,.5,3.1+contain)
  .multiply(new Matrix4().makeScale(.5,.5,.5))
  .multiply(new Matrix4().makeTranslation(6,-.5,1.4-contain))
  .multiply(heroStageProjection(width,height,entrance));
}

type Point = {x:number;y:number;z:number};
type OpeningPose = {entry:number;pointerX:number;pointerY:number};

const clamp01=(value:number)=>Math.max(0,Math.min(1,value));
const smooth=(value:number)=>{const t=clamp01(value);return t*t*(3-2*t);};

/** The approved panorama settles before the existing departure path starts. */
export function cosmicOpeningPose(progress:number,entrance:number,pointerX=0,pointerY=0):OpeningPose{
 const presence=1-smooth((progress-.06)/.06);
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

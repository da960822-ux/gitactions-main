import {roomWorldVertex} from './approvedRoomGeometry';
export const INTRO_SECONDS=3.2;
export const FOLD_ANCHORS={hero:[0,-2.9,0],boundary:[0,0,-4],gallery:[0,0,-26]}as const;
export type FoldPose={progress:number;entrance:number;pointerX:number;pointerY:number;time:number};
export const clamp01=(v:number)=>Math.max(0,Math.min(1,v));
export const smoothRange=(a:number,b:number,v:number)=>{const t=clamp01((v-a)/(b-a));return t*t*(3-2*t);};
export function introPose(seconds:number):FoldPose{return{progress:0,entrance:smoothRange(.1,2.9,seconds),pointerX:0,pointerY:0,time:Math.min(seconds,INTRO_SECONDS)};}
/** One progress-only path: reversing scroll evaluates the same pose, including at the room boundary. */
export function cameraPose(progress:number,entrance:number,mobile:boolean){
 const p=clamp01(progress),stable=mobile?[1.3,.25,12.1,1.35,-.1,0]:[0,.3,11.7,.3,-.05,0];
 const arrival=roomWorldVertex(836,470.5,24),target=[-6,.5,-10];
 const keys=[[0,...stable],[.27,...stable],[.38,...arrival,...target],[1,...arrival,...target]];
 const values=interpolatePath(keys,p);
 values[2]+=(1-entrance)*2.5;
 return{position:values.slice(0,3),target:values.slice(3,6)};
}

function interpolatePath(keys:number[][],p:number){
 const index=Math.min(keys.length-2,Math.max(0,keys.findIndex((key,i)=>i<keys.length-1&&p>=key[0]&&p<=keys[i+1][0])));
 const a=keys[index],b=keys[index+1],span=b[0]-a[0],t=clamp01((p-a[0])/span),t2=t*t,t3=t2*t;
 const tangent=(i:number,column:number)=>{
  if(i===0||i===keys.length-1)return 0;
  const left=keys[i-1],middle=keys[i],right=keys[i+1];
  const incoming=(middle[column]-left[column])/(middle[0]-left[0]),outgoing=(right[column]-middle[column])/(right[0]-middle[0]);
  return incoming*outgoing<=0?0:2*incoming*outgoing/(incoming+outgoing);
 };
 const values=a.slice(1).map((value,i)=>(2*t3-3*t2+1)*value+(t3-2*t2+t)*span*tangent(index,i+1)+(-2*t3+3*t2)*b[i+1]+(t3-t2)*span*tangent(index+1,i+1));
 return values;
}

export type ConnectionView={position:number[];target:number[];fov:number};
/** The room remains framed during the retreat, then the camera curls over the shared sheet. */
export function postConnectionPose(progress:number,from:ConnectionView,to:ConnectionView,contain=1):ConnectionView{
 const p=clamp01(progress),eye=from.position,target=from.target;
 const keys=[[0,...eye,...target,from.fov],[.25,-6,1.5*contain,1.8,-8,-1.5,-1.5,44],[.5,-6,-.3,1.8,-7.5,-2.35,8.8,42],[1,...to.position,...to.target,to.fov]];
 const values=interpolatePath(keys,p);
 return{position:values.slice(0,3),target:values.slice(3,6),fov:values[6]};
}

export function surfaceWeights(p:number){return{aperture:smoothRange(.08,.43,p),rail:smoothRange(.55,.85,p)};}

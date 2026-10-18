import {roomWorldVertex} from './approvedRoomGeometry';
export const INTRO_SECONDS=3.2;
export const FOLD_ANCHORS={hero:[0,-2.9,0],boundary:[0,0,-4],gallery:[0,0,-26]}as const;
export type FoldPose={progress:number;entrance:number;pointerX:number;pointerY:number;time:number};
export const clamp01=(v:number)=>Math.max(0,Math.min(1,v));
export const smoothRange=(a:number,b:number,v:number)=>{const t=clamp01((v-a)/(b-a));return t*t*(3-2*t);};
export function introPose(seconds:number):FoldPose{return{progress:0,entrance:smoothRange(.1,2.9,seconds),pointerX:0,pointerY:0,time:Math.min(seconds,INTRO_SECONDS)};}
export function cameraPose(p:number,entrance:number,mobile:boolean){
 const stable=mobile?[1.3,.25,12.1,1.35,-.1,0]:[0,.3,11.7,.3,-.05,0];
 const arrival=roomWorldVertex(836,470.5,24);
 const keys=[[0,...stable],[.08,...stable],[.16,-5.8,.35,8.8,-5.5,.25,-6],[.22,-6,.45,5,-6,.5,-10],[.32,...arrival,-6,.5,-10],[.43,-6.12,.54,-.45,-6,.5,-10],[.6,-5.9,.48,-.38,-6,.5,-10],[1,...arrival,-6,.5,-10]];
 const i=Math.min(keys.length-2,Math.max(0,keys.findIndex((k,j)=>j<keys.length-1&&p>=k[0]&&p<=keys[j+1][0]))),a=keys[i],b=keys[i+1],span=b[0]-a[0],t=clamp01((p-a[0])/span),t2=t*t,t3=t2*t;
 // Shared monotone tangents keep cruise velocity through keys without overshooting a wall.
 const tangent=(index:number,column:number)=>{
  if(index===0||index===keys.length-1)return 0;
  const previous=keys[index-1],current=keys[index],next=keys[index+1];
  const incoming=(current[column]-previous[column])/(current[0]-previous[0]),outgoing=(next[column]-current[column])/(next[0]-current[0]);
  return incoming*outgoing<=0?0:2*incoming*outgoing/(incoming+outgoing);
 };
 const v=a.slice(1).map((value,j)=>(2*t3-3*t2+1)*value+(t3-2*t2+t)*span*tangent(i,j+1)+(-2*t3+3*t2)*b[j+1]+(t3-t2)*span*tangent(i+1,j+1));
 v[2]+=(1-entrance)*2.5;return{position:v.slice(0,3),target:v.slice(3,6)};
}

export function surfaceWeights(p:number){return{aperture:smoothRange(.08,.43,p),rail:smoothRange(.55,.85,p)};}

export const INTRO_SECONDS=3.2;
export const FOLD_ANCHORS={hero:[0,-2.9,0],boundary:[0,0,-4],gallery:[0,0,-26]}as const;
export type FoldPose={progress:number;entrance:number;pointerX:number;pointerY:number;time:number};
export const clamp01=(v:number)=>Math.max(0,Math.min(1,v));
export const smoothRange=(a:number,b:number,v:number)=>{const t=clamp01((v-a)/(b-a));return t*t*(3-2*t);};
export function introPose(seconds:number):FoldPose{return{progress:0,entrance:smoothRange(.1,2.9,seconds),pointerX:0,pointerY:0,time:Math.min(seconds,INTRO_SECONDS)};}
export function cameraPose(p:number,entrance:number,mobile:boolean){
 const keys=mobile
 ?[[0,1.3,.25,12.1,1.35,-.1,0],[.2,1.3,.25,12.1,1.35,-.1,0],[.35,-.7,.5,10.0,.6,.1,-2],[.5,-3.2,.5,4.4,2,.7,-19],[.65,-3.1,.5,-2.2,3.2,1,-23],[.85,-3.2,.7,-7,4.5,1,-26],[1,-3.5,.8,-10.5,5.2,1,-25]]
 :[[0,0,.3,11.7,.3,-.05,0],[.2,0,.3,11.7,.3,-.05,0],[.35,-1.1,.5,10,.6,.1,-2],[.5,-3.2,.5,4.4,2,.7,-19],[.65,-3.1,.5,-2.2,3.2,1,-23],[.85,-3.2,.7,-7,4.5,1,-26],[1,-3.5,.8,-10.5,5.2,1,-25]];
 const i=Math.min(keys.length-2,Math.max(0,keys.findIndex((k,j)=>j<keys.length-1&&p>=k[0]&&p<=keys[j+1][0]))),a=keys[i],b=keys[i+1],t=smoothRange(a[0],b[0],p),v=a.slice(1).map((x,j)=>x+(b[j+1]-x)*t);v[2]+=(1-entrance)*2.5;return{position:v.slice(0,3),target:v.slice(3,6)};
}

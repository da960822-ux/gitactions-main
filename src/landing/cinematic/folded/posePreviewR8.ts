export const INTRO_SECONDS=3.2;
export const FOLD_ANCHORS={hero:[0,-2.9,0],boundary:[0,0,-4],gallery:[0,0,-26]}as const;
export type FoldPose={progress:number;entrance:number;pointerX:number;pointerY:number;time:number};
export const clamp01=(v:number)=>Math.max(0,Math.min(1,v));
export const smoothRange=(a:number,b:number,v:number)=>{const t=clamp01((v-a)/(b-a));return t*t*(3-2*t);};
export function introPose(seconds:number):FoldPose{return{progress:0,entrance:smoothRange(.1,2.9,seconds),pointerX:0,pointerY:0,time:Math.min(seconds,INTRO_SECONDS)};}
export function cameraPose(p:number,entrance:number,mobile:boolean){
 const stable=mobile?[1.3,.25,12.1,1.35,-.1,0]:[0,.3,11.7,.3,-.05,0];
 const keys=[[0,...stable],[.43,...stable],[.5,-2.1,.5,6,1,1,-28],[.6,-2.1,.55,-.5,0,1,-40],[.65,-1.7,.6,-2.2,-2,1,-55],[.85,0,.8,-13,-4,1,-68],[1,-2,1,-24,-5,1,-75]];
 const i=Math.min(keys.length-2,Math.max(0,keys.findIndex((k,j)=>j<keys.length-1&&p>=k[0]&&p<=keys[j+1][0]))),a=keys[i],b=keys[i+1],t=smoothRange(a[0],b[0],p),v=a.slice(1).map((x,j)=>x+(b[j+1]-x)*t);v[2]+=(1-entrance)*2.5;return{position:v.slice(0,3),target:v.slice(3,6)};
}

export function surfaceWeights(p:number){return{aperture:smoothRange(.08,.43,p),rail:smoothRange(.55,.85,p)};}

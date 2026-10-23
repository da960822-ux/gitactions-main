export type WakePoint={x:number;y:number;age:number;width:number};
export const wakeLimit=12;

// Adapted from Shaders CursorTrail's bounded age/width recorder (MIT); see conversation-flow.ts.
export function advanceWake(points:WakePoint[],seconds:number){
 const dt=Number.isFinite(seconds)?Math.max(0,Math.min(.25,seconds)):0;
 for(const point of points)point.age+=dt/1.05;
 while(points.length&&points[0].age>=1)points.shift();
}
export function recordWake(points:WakePoint[],x:number,y:number,seconds:number){
 if(!Number.isFinite(x)||!Number.isFinite(y))return;
 let head=points.at(-1);
 if(!head){points.push({x,y,age:0,width:.25});return;}
 const distance=Math.hypot(x-head.x,y-head.y);
 const width=Math.max(.25,Math.min(1,Math.sqrt(distance/Math.max(.008,Number.isFinite(seconds)?seconds:.008)/1.5)));
 if(points.length===1){points.push({...head});head=points[1];}
 const anchor=points[points.length-2];
 head.x=x;head.y=y;head.age=0;head.width=width;
 if(Math.hypot(x-anchor.x,y-anchor.y)>=.008)points.push({...head});
 if(points.length>wakeLimit)points.shift();
}

export type Point={x:number;y:number};
/** CSS projective mapping of one DOM rectangle onto a projected 3D quad. */
export function paperTransform(corners:Point[],width:number,height:number):string|null {
 if(corners.length!==4||width<=0||height<=0||!corners.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))return null;
 const [p0,p1,p2,p3]=corners;
 const dx1=p1.x-p2.x,dx2=p3.x-p2.x,dx3=p0.x-p1.x+p2.x-p3.x;
 const dy1=p1.y-p2.y,dy2=p3.y-p2.y,dy3=p0.y-p1.y+p2.y-p3.y;
 const determinant=dx1*dy2-dx2*dy1;
 if(Math.abs(determinant)<.00001)return null;
 const g=(dx3*dy2-dx2*dy3)/determinant,h=(dx1*dy3-dx3*dy1)/determinant;
 const a=p1.x-p0.x+g*p1.x,b=p3.x-p0.x+h*p3.x;
 const d=p1.y-p0.y+g*p1.y,e=p3.y-p0.y+h*p3.y;
 return `matrix3d(${[a/width,d/width,0,g/width,b/height,e/height,0,h/height,0,0,1,0,p0.x,p0.y,0,1].join(',')})`;
}
export function blendPaperCorners(from:Point[],to:Point[],progress:number):Point[]{
 const t=Math.min(1,Math.max(0,progress));const s=t*t*(3-2*t);
 return from.map((point,i)=>({x:point.x+(to[i].x-point.x)*s,y:point.y+(to[i].y-point.y)*s}));
}

/** Natural reader placement and the matching envelope retirement, in viewport pixels. */
export function letterOpeningLayout(width:number,height:number,paperHeight:number|undefined,opening:number){
 const w=Number.isFinite(width)&&width>0?width:1,h=Number.isFinite(height)&&height>0?height:1;
 const bodyHeight=typeof paperHeight==='number'&&Number.isFinite(paperHeight)&&paperHeight>32?paperHeight:640;
 const paperWidth=Math.max(1,Math.min(740,Math.floor(w*.49))),top=h*.1;
 const phase=Math.min(1,Math.max(0,(Number.isFinite(opening)?opening:.9)-.9)/.1),handoff=phase*phase*(3-2*phase);
 const pixelsPerUnit=h/(12*Math.tan(Math.PI/12));
 const closedBase=h/2+.675*pixelsPerUnit,openBase=top+Math.max(bodyHeight+105,(1.35+.96*Math.cos(Math.PI/12))*pixelsPerUnit+24);
 return {left:w*.7-paperWidth/2,top,width:paperWidth,height:bodyHeight,pixelsPerUnit,handoff,envelopeBase:closedBase+(openBase-closedBase)*handoff};
}

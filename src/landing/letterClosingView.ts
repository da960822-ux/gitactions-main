export type LetterClosingRect={left:number;top:number;width:number;height:number};

/** Match the physical insert to the reader's last actual rectangle without moving the document. */
export function letterClosingView(width:number,height:number,rect:LetterClosingRect){
 const pixelsPerUnit=Math.max(1,rect.width)/1.76;
 const distance=height/(pixelsPerUnit*2*Math.tan(Math.PI/12));
 const x=7.2-(rect.left+rect.width/2-width/2)/pixelsPerUnit;
 const z=-2.8-(rect.top+rect.height/2-height/2)/pixelsPerUnit;
 return {fov:30,eye:[x,.163+distance,z+.000001] as [number,number,number],target:[x,.163,z] as [number,number,number]};
}

/** Follow the same sheet into its envelope, then leave breathing room for the handover. */
export function letterFoldView(width:number,height:number,rect:LetterClosingRect,opening:number){
 const start=letterClosingView(width,height,rect);
 const progress=Math.max(0,Math.min(1,(1-opening)/.26));
 const t=progress*progress*(3-2*progress);
 const pixelsPerUnit=Math.min(480,width*.38)/2.05;
 const distance=height/(pixelsPerUnit*2*Math.tan(Math.PI/12));
 const envelopeProgress=Math.max(0,Math.min(1,(.65-opening)/.3));
 const envelopeBlend=envelopeProgress*envelopeProgress*(3-2*envelopeProgress);
 // First contain the extracted sheet. Follow it down only when it enters the envelope.
 const centreZ=-2.8+.925*envelopeBlend;
 const endTarget=[7.2,.08,centreZ],endEye=[7.2,.08+distance,centreZ+.000001];
 const mix=(values:number[],end:number[])=>values.map((value,index)=>value+(end[index]-value)*t) as [number,number,number];
 return {fov:30,eye:mix(start.eye,endEye),target:mix(start.target,endTarget)};
}

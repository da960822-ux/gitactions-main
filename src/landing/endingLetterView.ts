/** Fit the existing horizontal letter into EndingChapter's transparent artifact window. */
export function endingLetterView(width:number,height:number,_opening:number,sectionTop=0) {
 const fov=30,aspect=width/Math.max(1,height);
 // Keep one framing for the returned mat; opening the same envelope never changes the camera scale.
 const viewHeight=Math.max(3.2/.65,3.4/(.5*aspect));
 const distance=viewHeight/(2*Math.tan(fov*Math.PI/360));
 const x=7.2-.2*viewHeight*aspect,z=-2.48+(.055-sectionTop/Math.max(1,height))*viewHeight;
 return {fov,eye:[x,distance-.007,z+.04] as [number,number,number],target:[x,-.007,z] as [number,number,number]};
}

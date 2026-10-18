// Exponential damping is stable for the actual elapsed time, including slow GPU frames.
export const pointerDecay=(seconds:number)=>1-Math.exp(-Math.max(0,seconds)*6);

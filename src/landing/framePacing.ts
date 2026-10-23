export function nextRenderFrame(now:number,previous:number|null,interval:number){
 if(previous===null)return now;
 const elapsed=now-previous;
 // Absorb timestamp jitter while preserving the deadline instead of restarting it at each late RAF.
 return elapsed+.5<interval?null:previous+Math.floor((elapsed+.5)/interval)*interval;
}

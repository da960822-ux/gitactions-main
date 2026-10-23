// Khronos EXT_texture_shared_exponent, section 3.8.1; prototype, not production adoption.
export function packRGB9E5(r,g,b){if(![r,g,b].every(v=>Number.isFinite(v)&&v>=0&&v<=65408))throw Error('Out of representable nonnegative HDR range');const max=Math.max(r,g,b);let e=Math.max(-16,Math.floor(Math.log2(max)))+16,scale=2**(e-24);if(Math.floor(max/scale+.5)===512){e++;scale*=2;}const a=[r,g,b].map(v=>Math.floor(v/scale+.5));return((e<<27)|(a[2]<<18)|(a[1]<<9)|a[0])>>>0;}
export function unpackRGB9E5(v){const scale=2**((v>>>27)-24);return[v&511,(v>>>9)&511,(v>>>18)&511].map(x=>x*scale);}
export const cases=[[0,0,0],[.001,.0001,.0005],[.03,.031,.032],[.5,.3,.1],[1,2,4],[12,3,7],[65408,65408,65408]];
for(const c of cases){const d=unpackRGB9E5(packRGB9E5(...c)),peak=Math.max(...c),error=Math.max(...c.map((v,i)=>Math.abs(v-d[i])));if(error>Math.max(2**-25,peak*.002))throw Error('RGB9E5 self check failed '+JSON.stringify({c,d,error}));}

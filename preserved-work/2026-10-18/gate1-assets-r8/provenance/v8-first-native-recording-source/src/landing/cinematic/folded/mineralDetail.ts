import type {WebGLProgramParametersWithUniforms} from 'three';
// World-scale mineral grain; derivative normal follows Three's Mikkelsen surface-gradient method.
export function applyMineralDetail(shader:WebGLProgramParametersWithUniforms){
 shader.vertexShader='varying vec3 vMineralWorld;varying vec3 vMineralView;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvMineralWorld=(modelMatrix*vec4(transformed,1.)).xyz;vMineralView=mvPosition.xyz;');
 shader.fragmentShader=`varying vec3 vMineralWorld;varying vec3 vMineralView;
 float mineralHash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
 float mineralNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(mineralHash(i),mineralHash(i+vec3(1,0,0)),f.x),mix(mineralHash(i+vec3(0,1,0)),mineralHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(mineralHash(i+vec3(0,0,1)),mineralHash(i+vec3(1,0,1)),f.x),mix(mineralHash(i+vec3(0,1,1)),mineralHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
 float mineralFilter(vec3 p){return 1.-smoothstep(.35,.85,max(length(dFdx(p)),length(dFdy(p))));}
 vec3 mineralPerturb(vec3 position,vec3 n,vec2 gradient,float direction){vec3 sx=normalize(dFdx(position)),sy=normalize(dFdy(position)),r1=cross(sy,n),r2=cross(n,sx);float determinant=dot(sx,r1)*direction;return normalize(abs(determinant)*n-sign(determinant)*(gradient.x*r1+gradient.y*r2));}
 `+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+(mineralNoise(vMineralWorld*36.)-.5)*.035*mineralFilter(vMineralWorld*36.),.18,.98);');
 shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nfloat mineralHeight=mineralNoise(vMineralWorld*36.)*.000325*mineralFilter(vMineralWorld*36.);normal=mineralPerturb(vMineralView,normal,vec2(dFdx(mineralHeight),dFdy(mineralHeight)),faceDirection);');
}

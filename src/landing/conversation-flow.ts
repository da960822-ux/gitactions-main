/*
 * GLSL adaptation of Shaders' FlowingGradient, chainedWarpStep and MaterialX noise port.
 * Source: https://github.com/shader-effects-inc/shaders/tree/eb3df5cedc826008be8e1037c1182e649037c74a/packages/core/src
 * shaders/FlowingGradient/index.ts; gpu/kit/fields.ts; gpu/kit/noise.ts; std/paint/fields.ts.
 * The two domain warps, four-color blend and fold lighting are retained; this is not native pixel equivalence.
 *
 * MIT License — Copyright (c) 2026 Shader Effects Inc.
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
export const connectionEchoDuration=1.4;
export function connectionEchoProgress(age:number){return age>=0&&age<connectionEchoDuration?age/connectionEchoDuration:-1;}

export const flowVertex=`
out vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}
`;
export const flowFragment=`
precision highp float;
precision highp int;
in vec2 vUv;
out vec4 outColor;
uniform float uTime;
uniform float uCharge,uEcho;
uniform vec2 uResolution;
uniform vec3 uColorA,uColorB,uColorC,uColorD;
uint rotl(uint x,uint k){return (x<<k)|(x>>(32u-k));}
uint hash3(ivec3 p){
 uint seed=3735928584u;
 uint a=seed+uint(p.x),b=seed+uint(p.y),c=seed+uint(p.z);
 c=(c^b)-rotl(b,14u);a=(a^c)-rotl(c,11u);b=(b^a)-rotl(a,25u);
 c=(c^b)-rotl(b,16u);a=(a^c)-rotl(c,4u);b=(b^a)-rotl(a,14u);
 return (c^b)-rotl(b,24u);
}
float gradient3(uint h,vec3 p){
 h=h&15u;
 float u=h<8u?p.x:p.y;
 float v=h<4u?p.y:((h==12u||h==14u)?p.x:p.z);
 return ((h&1u)!=0u?-u:u)+((h&2u)!=0u?-v:v);
}
float noise3(vec3 p){
 ivec3 cell=ivec3(floor(p));vec3 f=fract(p);
 vec3 fade=f*f*f*(f*(f*6.0-15.0)+10.0);
 float z0=mix(mix(gradient3(hash3(cell),f),gradient3(hash3(cell+ivec3(1,0,0)),f-vec3(1,0,0)),fade.x),
  mix(gradient3(hash3(cell+ivec3(0,1,0)),f-vec3(0,1,0)),gradient3(hash3(cell+ivec3(1,1,0)),f-vec3(1,1,0)),fade.x),fade.y);
 float z1=mix(mix(gradient3(hash3(cell+ivec3(0,0,1)),f-vec3(0,0,1)),gradient3(hash3(cell+ivec3(1,0,1)),f-vec3(1,0,1)),fade.x),
  mix(gradient3(hash3(cell+ivec3(0,1,1)),f-vec3(0,1,1)),gradient3(hash3(cell+ivec3(1,1,1)),f-vec3(1,1,1)),fade.x),fade.y);
 return 0.982*mix(z0,z1,fade.z);
}
vec4 warpStep(vec2 p,float scale,float z,vec2 offA,vec2 offB,float reach,float strength){
 vec3 at=vec3(p*scale,z);
 vec2 n=vec2(noise3(at+vec3(offA,0.0)),noise3(at+vec3(offB,0.0)));
 return vec4(p+n*reach*strength,n);
}
void main(){
 float aspect=uResolution.x/max(uResolution.y,1.0);
 float t=uTime*0.16;
 float strength=0.82;
 vec2 centred=vec2(vUv.x,1.0-vUv.y)-0.5;
 float angle=noise3(vec3(centred.x*0.8+t*0.4,centred.y*0.8-t*0.25,0.0))*12.566370614359172*strength;
 vec2 squashed=vec2(centred.x,centred.y/aspect);
 vec2 spun=vec2(cos(angle)*squashed.x-sin(angle)*squashed.y,sin(angle)*squashed.x+cos(angle)*squashed.y);
 vec2 p=vec2(spun.x,spun.y*aspect);
 vec2 connection=vec2(vUv.x,1.0-vUv.y)-vec2(0.5,510.0/620.0);
 connection.x*=aspect;
 float gathering=exp(-dot(connection,connection)*12.0)*uCharge;
 p+=connection*gathering*0.22;
 p.x+=sin(p.y*5.0+t*2.0)/50.0*strength;
 p.y+=sin(p.x*7.5+t*2.0)/25.0*strength;
 vec4 level1=warpStep(p,2.0,t*0.5,vec2(5.2,1.3),vec2(1.7,9.2),0.25,strength);
 float tz=t*0.3;
 vec4 level2=warpStep(level1.xy,1.5,tz,vec2(8.3,2.8),vec2(3.1,7.4),0.2,strength);
 float zone=noise3(vec3(level2.xy*1.8,tz));
 float hardness=pow(level1.z*0.5+0.5,1.5);
 float edge=mix(0.5,0.008,hardness);
 float blendX=smoothstep(-edge,edge,zone),blendY=smoothstep(-edge,edge,level1.w);
 vec3 base=mix(mix(uColorA,uColorB,blendX),mix(uColorC,uColorD,blendX),blendY);
 float fold=max(1.0-abs(blendX*2.0-1.0),1.0-abs(blendY*2.0-1.0))*hardness;
 float light=((level2.z*0.5+0.5)*0.12+0.94)*(1.0+fold*0.65);
 float echo=0.0;
 if(uEcho>=0.0)echo=exp(-pow((length(connection)-(0.03+uEcho*0.68))/0.025,2.0))*sin(uEcho*3.14159265);
 vec3 answer=vec3(1.0,0.68,0.72)*(gathering*0.3+echo*0.65);
 outColor=linearToOutputTexel(vec4(clamp(base*light+answer,0.0,1.0),1.0));
}
`;

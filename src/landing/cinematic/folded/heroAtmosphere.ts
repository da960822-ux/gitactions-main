import * as T from 'three';

export type HeroAtmosphereInput = {time:number;progress:number;pointerX:number;pointerY:number;press:boolean|number;reducedMotion:boolean};
type Projection = {halfWidthAtUnitZ:number;halfHeightAtUnitZ:number};
const clamp=(value:number)=>T.MathUtils.clamp(value,0,1);
export function heroAtmospherePresence(progress:number){const t=clamp((progress-.018)/.037);return 1-t*t*(3-2*t);}

// Original GLSL: ThreeUI's layered-light treatment is a conceptual reference, with no copied source.
const skyFragment=`
uniform float uTime,uPresence,uCharge,uRelease,uMotion;
uniform vec2 uPointer,uOrigin;
varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float cloud(vec2 p){return .57*noise(p)+.29*noise(p*2.03+7.1)+.14*noise(p*4.07-3.2);}
float meteor(vec2 uv){
 float phase=mod(uTime+.8,11.8);
 float visible=smoothstep(0.,.16,phase)*(1.-smoothstep(2.1,2.65,phase))*uMotion;
 float headX=1.09-phase*.19;
 float curve=.44+(uv.x-.5)*.55+.025*sin(uv.x*7.);
 float behind=uv.x-headX;
 float tail=smoothstep(-.003,.003,behind)*exp(-max(behind,0.)*23.);
 float line=exp(-pow((uv.y-curve)/.0019,2.))*tail;
 float headY=.44+(headX-.5)*.55+.025*sin(headX*7.);
 vec2 head=(uv-vec2(headX,headY))*vec2(1.55,1.);
 float spark=exp(-dot(head,head)*52000.)*2.5;
 float bloom=exp(-dot(head,head)*6000.)*.4;
 return (line+spark+bloom)*visible;
}
void main(){
 vec2 uv=vUv;
 float sky=smoothstep(.29,.37,uv.x)*smoothstep(.43,.59,uv.y);
 vec2 p=uv+uPointer*vec2(.008,.005);
 float flow=uTime*.022;
 float n=cloud(p*vec2(9.,12.)+vec2(-flow,flow*.4));
 // The light follows the diagonal galaxy already in the approved photograph.
 float path=.44+(p.x-.5)*.55;
 float vein=exp(-pow((p.y-path-(n-.5)*.18)/.058,2.));
 float filament=pow(max(0.,sin((p.y-path)*112.+n*9.-uTime*.18)),14.);
 float threads=exp(-pow((p.y-path-(n-.5)*.18)/.012,2.));
 float wisp=vein*(.13+.36*filament)*(.35+.65*n)+threads*.32;
 vec2 delta=(uv-uOrigin)*vec2(1.55,1.);
 float locality=exp(-dot(delta,delta)*32.);
 float gathered=uCharge*locality*(.30+.45*n);
 // Release illuminates existing filaments rather than drawing a ring over the artwork.
 float released=uRelease*exp(-dot(delta,delta)*9.)*(.15+.65*filament)*vein;
 vec3 rose=vec3(.91,.25,.46),gold=vec3(1.,.64,.32),violet=vec3(.42,.25,.72);
 vec3 color=mix(violet,rose,smoothstep(.25,.8,n));
 color=mix(color,gold,filament*.65+gathered*.4);
 float alpha=sky*uPresence*(wisp+gathered+released)*1.25;
 float shooting=meteor(uv)*sky*uPresence*(1.+uCharge*.65);
 // Premultiply only here so the meteor can keep its warm source-star color.
 vec3 light=color*alpha+gold*shooting;
 gl_FragColor=vec4(light,1.);
}`;
const starVertex=`
attribute float aSeed,aSize,aLayer;
uniform float uTime,uPresence,uCharge,uRelease,uMotion;
uniform vec2 uPointer,uOrigin,uFrame;
varying float vGlow,vSeed;
void main(){
 vec3 p=position;
 vec2 uv=p.xy/(uFrame*-p.z)*.5+.5;
 vec2 drift=uPointer*(.009+aLayer*.012);
 drift+=vec2(sin(uTime*.16+aSeed*31.),cos(uTime*.12+aSeed*27.))*(.0015+aLayer*.0015)*uMotion;
 vec2 pull=(uOrigin-uv)*uCharge*.045;
 p.xy+=(drift+pull)*uFrame*-p.z;
 vec4 view=modelViewMatrix*vec4(p,1.);
 gl_Position=projectionMatrix*view;
 float twinkle=.68+.32*sin(uTime*(.45+aSeed*.8)+aSeed*42.);
 vGlow=uPresence*twinkle*(.55+.45*aLayer)*(1.+uRelease*.8);
 vSeed=aSeed;
 gl_PointSize=aSize*(1.+uCharge*.35+uRelease*.28);
}`;
const starFragment=`
varying float vGlow,vSeed;
void main(){
 vec2 p=gl_PointCoord-.5;
 float r=length(p);
 float core=exp(-r*r*75.);
 float halo=exp(-r*r*15.)*.26;
 float rays=(exp(-abs(p.x)*65.)+exp(-abs(p.y)*65.))*exp(-r*7.)*.35;
 float alpha=(core+halo+rays)*vGlow;
 vec3 color=mix(vec3(1.,.56,.36),vec3(.91,.77,1.),vSeed);
 gl_FragColor=vec4(color,alpha);
}`;

/** Camera-ray registered sky light; every draw stays behind the rigid approved portrait. */
export function createHeroAtmosphere({halfWidthAtUnitZ:halfWidth,halfHeightAtUnitZ:halfHeight}:Projection){
 const root=new T.Group();root.name='INITIAL_HERO_COSMIC_ATMOSPHERE';
 const uniforms={uTime:{value:0},uMotion:{value:1},uPresence:{value:1},uCharge:{value:0},uRelease:{value:0},uPointer:{value:new T.Vector2()},uOrigin:{value:new T.Vector2(.71,.76)},uFrame:{value:new T.Vector2(halfWidth,halfHeight)}};
 const skyGeometry=new T.PlaneGeometry(2*halfWidth*4.7,2*halfHeight*4.7);
 const skyMaterial=new T.ShaderMaterial({uniforms,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:skyFragment,transparent:true,depthWrite:false,depthTest:true,blending:T.AdditiveBlending,toneMapped:false});
 const sky=new T.Mesh(skyGeometry,skyMaterial);sky.position.z=-4.7;sky.name='SOURCE_GALAXY_EMISSIVE_FILAMENTS';root.add(sky);
 const positions:number[]=[],seeds:number[]=[],sizes:number[]=[],layers:number[]=[];
 const random=(seed:number)=>{const value=Math.sin(seed*127.1+311.7)*43758.5453;return value-Math.floor(value);};
 for(let i=0;i<256;i++){
  const u=.32+random(i*5+1)*.68,v=.52+random(i*5+2)*.48,layer=i%3/2,depth=4.64-layer*.12;
  positions.push((u*2-1)*halfWidth*depth,(v*2-1)*halfHeight*depth,-depth);
  seeds.push(random(i*5+3));sizes.push(i%19===0?12:1.7+random(i*5+4)*3.8);layers.push(layer);
 }
 const starGeometry=new T.BufferGeometry();starGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));starGeometry.setAttribute('aSeed',new T.Float32BufferAttribute(seeds,1));starGeometry.setAttribute('aSize',new T.Float32BufferAttribute(sizes,1));starGeometry.setAttribute('aLayer',new T.Float32BufferAttribute(layers,1));
 const starMaterial=new T.ShaderMaterial({uniforms,vertexShader:starVertex,fragmentShader:starFragment,transparent:true,depthWrite:false,depthTest:true,blending:T.AdditiveBlending,toneMapped:false});
 const stars=new T.Points(starGeometry,starMaterial);stars.name='THREE_DEPTH_STELLAR_FIELD';stars.frustumCulled=false;root.add(stars);
 const pointerTarget=new T.Vector2();
 let previousTime:number|undefined,wasPressed=false,disposed=false;
 return{root,update(frame:HeroAtmosphereInput){
  if(disposed)return;
  const delta=previousTime===undefined?0:T.MathUtils.clamp(frame.time-previousTime,0,.05);previousTime=frame.time;
  const presence=heroAtmospherePresence(frame.progress),reduced=frame.reducedMotion,pressed=typeof frame.press==='number'?frame.press>.45:frame.press;
  root.visible=presence>0;
  uniforms.uPresence.value=presence;uniforms.uMotion.value=Number(!reduced);
  if(!presence){uniforms.uCharge.value=uniforms.uRelease.value=0;wasPressed=false;return;}
  if(reduced){uniforms.uTime.value=0;uniforms.uPointer.value.set(0,0);uniforms.uCharge.value=uniforms.uRelease.value=0;wasPressed=false;return;}
  uniforms.uTime.value=frame.time;
  const damping=1-Math.exp(-delta*10);
  uniforms.uPointer.value.lerp(pointerTarget.set(T.MathUtils.clamp(frame.pointerX,-1,1),T.MathUtils.clamp(-frame.pointerY,-1,1)),damping);
  if(pressed&&!wasPressed)uniforms.uOrigin.value.set(clamp(frame.pointerX*.5+.5),T.MathUtils.clamp(.5-frame.pointerY*.5,.57,.94));
  if(!pressed&&wasPressed)uniforms.uRelease.value=Math.min(1,uniforms.uRelease.value+Math.max(.25,uniforms.uCharge.value));
  uniforms.uCharge.value+=(Number(pressed)-uniforms.uCharge.value)*(1-Math.exp(-delta*(pressed?4:12)));
  uniforms.uRelease.value*=Math.exp(-delta*3.4);
  wasPressed=pressed;
 },cancelInteraction(){wasPressed=false;uniforms.uRelease.value=0;},dispose(){if(disposed)return;disposed=true;root.removeFromParent();skyGeometry.dispose();skyMaterial.dispose();starGeometry.dispose();starMaterial.dispose();}};
}

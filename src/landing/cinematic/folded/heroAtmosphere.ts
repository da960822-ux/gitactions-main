import * as T from 'three';

export type HeroAtmosphereInput = {time:number;progress:number;pointerX:number;pointerY:number;press:boolean|number;reducedMotion:boolean};
type Projection = {halfWidthAtUnitZ:number;halfHeightAtUnitZ:number};
const clamp=(value:number)=>T.MathUtils.clamp(value,0,1);
export function heroAtmospherePresence(progress:number){const t=clamp((progress-.018)/.037);return 1-t*t*(3-2*t);}

// Original GLSL; Shaders/21st layered light and ThreeUI depth are conceptual references, not copied code.
const skyFragment=`
uniform float uTime,uPresence,uCharge,uRelease,uMotion;
uniform vec2 uPointer,uOrigin;
varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float cloud(vec2 p){return .57*noise(p)+.29*noise(p*2.03+7.1)+.14*noise(p*4.07-3.2);}
float meteorTrail(vec2 uv,float offset,float speed,float lane,float strength){
 float phase=mod(uTime+offset,7.2);
 float visible=smoothstep(0.,.16,phase)*(1.-smoothstep(2.25,2.7,phase))*uMotion;
 float headX=1.12-phase*speed;
 float curve=.57+lane+(uv.x-.5)*.38+.022*sin(uv.x*7.);
 float behind=uv.x-headX;
 float tail=smoothstep(-.004,.004,behind)*exp(-max(behind,0.)*9.);
 float line=(exp(-pow((uv.y-curve)/.0024,2.))+.18*exp(-pow((uv.y-curve)/.009,2.)))*tail;
 float headY=.57+lane+(headX-.5)*.38+.022*sin(headX*7.);
 vec2 head=(uv-vec2(headX,headY))*vec2(1.55,1.);
 float spark=exp(-dot(head,head)*36000.)*3.;
 float bloom=exp(-dot(head,head)*2600.)*.65;
 return (line+spark+bloom)*visible*strength;
}
float meteor(vec2 uv){
 return meteorTrail(uv,.85,.28,.03,1.25)
      +meteorTrail(uv,3.25,.31,.18,1.)
      +meteorTrail(uv,5.65,.26,.10,1.15);
}
float orbitLight(vec2 uv){
 vec2 q=(uv-vec2(.78,.76))*vec2(1.,1.4);
 float angle=atan(q.y,q.x);
 float radius=length(q);
 float arc=exp(-pow((radius-.275)/.0022,2.));
 float travelling=pow(.5+.5*cos(angle-uTime*.85),24.);
 float echo=pow(.5+.5*cos(angle+uTime*.55+2.),32.);
 return arc*(.055+.95*travelling+.38*echo)*uMotion;
}
void main(){
 vec2 uv=vUv;
 float sky=smoothstep(.29,.37,uv.x)*smoothstep(.43,.59,uv.y);
 vec2 p=uv+uPointer*vec2(.008,.005);
 float flow=uTime*.065;
 float n=cloud(p*vec2(9.,12.)+vec2(-flow,flow*.4));
 // The light follows the diagonal galaxy already in the approved photograph.
 float path=.44+(p.x-.5)*.55;
 float vein=exp(-pow((p.y-path-(n-.5)*.18)/.058,2.));
 float filament=pow(max(0.,sin((p.y-path)*112.+n*9.-uTime*.7)),14.);
 float threads=exp(-pow((p.y-path-(n-.5)*.18)/.012,2.));
 float travelling=pow(.5+.5*sin(p.x*13.-uTime*1.1+n*3.),5.);
 float wisp=vein*(.10+.48*filament+.22*travelling)*(.35+.65*n)+threads*.38;
 vec2 delta=(uv-uOrigin)*vec2(1.55,1.);
 float locality=exp(-dot(delta,delta)*32.);
 float gathered=uCharge*locality*(.45+.65*n);
 float wave=exp(-pow((length(delta)-(1.-uRelease)*.55)/.032,2.));
 float released=uRelease*(wave*.85+exp(-dot(delta,delta)*9.)*(.15+.65*filament))*vein;
 vec3 rose=vec3(.91,.25,.46),gold=vec3(1.,.64,.32),violet=vec3(.42,.25,.72);
 vec3 color=mix(violet,rose,smoothstep(.25,.8,n));
 color=mix(color,gold,filament*.65+gathered*.4);
 float alpha=sky*uPresence*(wisp+gathered+released)*1.25;
 float shooting=meteor(uv)*sky*uPresence*(1.+uCharge*.65);
 // Premultiply only here so the meteor can keep its warm source-star color.
 vec3 light=color*alpha+gold*(shooting+orbitLight(uv)*sky*uPresence);
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
 drift+=vec2(sin(uTime*.3+aSeed*31.),cos(uTime*.24+aSeed*27.))*(.002+aLayer*.004)*uMotion;
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
const orbitVertex=`
uniform float uTime,uMotion;
uniform vec2 uPointer,uFrame;
attribute float aLane;
varying vec2 vUv;varying vec3 vNormal,vView;varying float vLane;
void main(){
 vec3 p=position;
 p.z+=sin(uv.x*6.2831853+uTime*.45+aLane)*.025*uMotion;
 p.xy+=uPointer*uFrame*(.055+aLane*.035);
 vec4 view=modelViewMatrix*vec4(p,1.);
 vUv=uv;vLane=aLane;vNormal=normalize(normalMatrix*normal);vView=-view.xyz;
 gl_Position=projectionMatrix*view;
}`;
const orbitFragment=`
uniform float uTime,uPresence,uCharge;
varying vec2 vUv;varying vec3 vNormal,vView;varying float vLane;
void main(){
 float edge=smoothstep(0.,.12,vUv.y)*smoothstep(0.,.12,1.-vUv.y);
 float rim=pow(1.-abs(dot(normalize(vNormal),normalize(vView))),2.);
 float sheen=pow(.5+.5*cos(vUv.x*6.2831853-uTime*(.62-vLane*.18)+vNormal.x*.8),8.);
 vec3 metal=mix(vec3(.62,.22,.39),vec3(1.,.62,.33),vLane*.55+sheen*.45);
 vec3 color=mix(metal,vec3(1.,.88,.72),sheen*.65+rim*.15);
 float alpha=uPresence*edge*(.16+sheen*.48+rim*.2+uCharge*.12);
 gl_FragColor=vec4(color*(.75+sheen*.45),alpha);
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
 const orbitGeometry=new T.BufferGeometry(),orbitPositions:number[]=[],orbitUvs:number[]=[],orbitLanes:number[]=[],orbitIndices:number[]=[];
 for(let lane=0;lane<2;lane++)for(let segment=0;segment<=128;segment++)for(let cross=0;cross<=6;cross++){
  const angle=segment/128*Math.PI*2,across=cross/6-.5,band=lane?.011:.019;
  const u=.77+Math.cos(angle)*(.30+lane*.035)+Math.cos(angle)*across*band;
  const v=.77+lane*.065+Math.sin(angle)*(.17-lane*.055)+Math.sin(angle)*across*band;
  const depth=4.45+Math.sin(angle+lane*1.7)*.11+Math.sin(across*Math.PI)*.055;
  orbitPositions.push((u*2-1)*halfWidth*depth,(v*2-1)*halfHeight*depth,-depth);orbitUvs.push(segment/128,cross/6);orbitLanes.push(lane);
  if(segment<128&&cross<6){const a=lane*129*7+segment*7+cross;orbitIndices.push(a,a+7,a+1,a+1,a+7,a+8);}
 }
 orbitGeometry.setAttribute('position',new T.Float32BufferAttribute(orbitPositions,3));orbitGeometry.setAttribute('uv',new T.Float32BufferAttribute(orbitUvs,2));orbitGeometry.setAttribute('aLane',new T.Float32BufferAttribute(orbitLanes,1));orbitGeometry.setIndex(orbitIndices);orbitGeometry.computeVertexNormals();
 const orbitMaterial=new T.ShaderMaterial({uniforms,vertexShader:orbitVertex,fragmentShader:orbitFragment,transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,toneMapped:false});
 const orbits=new T.Mesh(orbitGeometry,orbitMaterial);orbits.name='SCULPTED_COSMIC_ORBITS';orbits.frustumCulled=false;root.add(orbits);
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
 },cancelInteraction(){wasPressed=false;uniforms.uRelease.value=0;},dispose(){if(disposed)return;disposed=true;root.removeFromParent();skyGeometry.dispose();skyMaterial.dispose();starGeometry.dispose();starMaterial.dispose();orbitGeometry.dispose();orbitMaterial.dispose();}};
}

import * as T from 'three';

export type EncounterPoint={x:number;y:number};
export type BirdEncounterFieldInput={width:number;height:number;time:number;bounds:{left:number;top:number;width:number;height:number};bills:{left:EncounterPoint;right:EncounterPoint};pointer:EncounterPoint|null;encounter:number;active:boolean;hover:boolean;press:boolean;reducedMotion:boolean;keyboard:boolean};
const segments=64,radials=8,particleCount=48;
const clamp=(value:number,min=0,max=1)=>T.MathUtils.clamp(value,min,max);
const vertex=`
attribute vec3 aCenter,aOffset;attribute float aRadius;
uniform float uWidth;uniform vec2 uViewport;
varying vec2 vUv;varying vec3 vNormal;varying vec4 vClip;
void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);vClip=projectionMatrix*modelViewMatrix*vec4(aCenter+aOffset*aRadius*uWidth,1.);gl_Position=vClip;}`;
const clipping=`
vec2 css=(vClip.xy/vClip.w*vec2(.5,-.5)+.5)*uViewport;
float clipped=smoothstep(uBounds.x,uBounds.x+4.,css.x)*(1.-smoothstep(uBounds.z-4.,uBounds.z,css.x))*smoothstep(uBounds.y,uBounds.y+4.,css.y)*(1.-smoothstep(uBounds.w-4.,uBounds.w,css.y));`;
const fragment=`
uniform float uPresence,uEnergy,uFlow,uCharge,uImpulse,uMeet,uGlow,uHeart,uEncounter,uPhase;
uniform vec3 uColor;uniform vec2 uViewport;uniform vec4 uBounds;
varying vec2 vUv;varying vec3 vNormal;varying vec4 vClip;
void main(){
 ${clipping}
 float taper=smoothstep(0.,.055,vUv.x)*(1.-smoothstep(.96,1.,vUv.x));
 float along=mix(vUv.x,1.-vUv.x,uHeart);
 float packet=pow(max(0.,cos((along*1.65-uFlow*.53+uPhase)*6.283185)),10.)*uEnergy;
 float meeting=exp(-pow((along-uMeet)/.10,2.))*uImpulse;
 float front=max(0.,normalize(vNormal).z);
 float key=max(0.,dot(normalize(vNormal),normalize(vec3(-.45,.65,1.))));
 float revealed=mix(1.,.26+.74*uEncounter,uHeart);
 float alpha=uPresence*revealed*taper*clipped;
 alpha*=mix((.76+.18*front+packet*.12+meeting*.14),(.015+.13*pow(front,2.)+packet*.10+meeting*.14),uGlow);
 vec3 pearl=mix(uColor*.22,mix(uColor,vec3(.98,.95,.92),.76),.22+.78*key);
 vec3 color=mix(pearl,uColor,uGlow)+vec3(1.,.98,.94)*pow(key,24.)*.62*(1.-uGlow);
 color=mix(color,vec3(1.,.98,.94),clamp(packet*.72+meeting*.45,0.,.95));
 if(alpha<.001)discard;
 gl_FragColor=vec4(color,clamp(alpha,0.,.95));
}`;
const particleVertex=`
attribute float aSize,aSeed,aWeight;
uniform float uPresence,uEnergy,uMotion,uCharge;
varying float vAlpha,vSeed;varying vec4 vClip;
void main(){vClip=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=vClip;gl_PointSize=aSize*(1.+uCharge*.35);vAlpha=uPresence*uMotion*(.12+.75*uEnergy)*aWeight;vSeed=aSeed;}`;
const particleFragment=`
uniform vec2 uViewport;uniform vec4 uBounds;
varying float vAlpha,vSeed;varying vec4 vClip;
void main(){${clipping}vec2 p=gl_PointCoord-.5;float core=exp(-dot(p,p)*65.);float halo=exp(-dot(p,p)*13.)*.28;vec3 color=mix(vec3(1.,.70,.37),vec3(1.,.48,.73),vSeed);gl_FragColor=vec4(color,(core+halo)*vAlpha*clipped);}`;

/** Camera-local tubes registered to live bill pixels; the shared host owns rendering and DOM occlusion. */
export function createBirdEncounterField(){
 const root=new T.Group();root.name='BIRD_ENCOUNTER_DEPTH_CURRENT';root.matrixAutoUpdate=false;root.visible=false;
 const state={needsFrame:false};
 const common={uPresence:{value:0},uEnergy:{value:0},uFlow:{value:0},uCharge:{value:0},uImpulse:{value:0},uMeet:{value:1},uEncounter:{value:0},uMotion:{value:1},uViewport:{value:new T.Vector2(1,1)},uBounds:{value:new T.Vector4()}};
 const materials:T.ShaderMaterial[]=[],geometries:T.BufferGeometry[]=[];
 const paths=Array.from({length:4},(_,index)=>{
  const geometry=new T.TubeGeometry(new T.LineCurve3(new T.Vector3(0,0,-4),new T.Vector3(1,0,-4)),segments,1,radials,false);geometries.push(geometry);
  const count=(segments+1)*(radials+1),centers=new T.Float32BufferAttribute(new Float32Array(count*3),3),radii=new T.Float32BufferAttribute(new Float32Array(count),1);
  geometry.setAttribute('aCenter',centers);geometry.setAttribute('aRadius',radii);geometry.setAttribute('aOffset',new T.Float32BufferAttribute(new Float32Array(count*3),3));
  for(const key of ['position','normal','aCenter','aRadius','aOffset'])(geometry.getAttribute(key) as T.BufferAttribute).setUsage(T.DynamicDrawUsage);
  const uniforms={...common,uHeart:{value:Number(index>1)},uPhase:{value:index%2*.27},uColor:{value:new T.Color(index%2?0xff759e:0xffbf77)}};
  for(const glow of [1,0]){
   const material=new T.ShaderMaterial({uniforms:{...uniforms,uGlow:{value:glow},uWidth:{value:glow?(index<2?4.8:9.5):(index<2?1.5:5.8)}},vertexShader:vertex,fragmentShader:fragment,transparent:true,depthTest:true,depthWrite:!glow,blending:glow?T.AdditiveBlending:T.NormalBlending,toneMapped:false});materials.push(material);
   const mesh=new T.Mesh(geometry,material);mesh.name=(index<2?'BILL_FEED_':'HOLLOW_MEETING_HALF_')+(index%2?'ROSE':'GOLD')+(glow?'_CORONA':'_CORE');mesh.frustumCulled=false;mesh.renderOrder=glow?0:1;root.add(mesh);
  }
  return{geometry,css:new Float32Array((segments+1)*2),depth:new Float32Array(segments+1),view:Array.from({length:segments+1},()=>new T.Vector3())};
 });
 const particleGeometry=new T.BufferGeometry(),particlePositions=new T.Float32BufferAttribute(new Float32Array(particleCount*3),3),sizes:number[]=[],seeds:number[]=[],weights:number[]=[];
 for(let i=0;i<particleCount;i++){sizes.push(i<4?14+(i%2)*2:2.2+(i%5)*.4);seeds.push(i%2);weights.push(i<4?1:.06+(i%5)*.015);}
 particleGeometry.setAttribute('position',particlePositions);particlePositions.setUsage(T.DynamicDrawUsage);particleGeometry.setAttribute('aSize',new T.Float32BufferAttribute(sizes,1));particleGeometry.setAttribute('aSeed',new T.Float32BufferAttribute(seeds,1));const particleWeights=new T.Float32BufferAttribute(weights,1);particleWeights.setUsage(T.DynamicDrawUsage);particleGeometry.setAttribute('aWeight',particleWeights);geometries.push(particleGeometry);
 const particleMaterial=new T.ShaderMaterial({uniforms:common,vertexShader:particleVertex,fragmentShader:particleFragment,transparent:true,depthTest:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});materials.push(particleMaterial);
 const particles=new T.Points(particleGeometry,particleMaterial);particles.name='PATH_BOUND_DEPTH_SEEDS';particles.frustumCulled=false;particles.renderOrder=2;root.add(particles);
 const bend=new T.Vector2(),bendTarget=new T.Vector2(),previousPointer=new T.Vector2(),normal=new T.Vector3(),binormal=new T.Vector3(),tangent=new T.Vector3(),radial=new T.Vector3(),crossOffset=new T.Vector3(),rolledNormal=new T.Vector3(),rolledBinormal=new T.Vector3(),onePixel=new T.Vector3(),sample=new T.Vector3();
 let lastTime:number|undefined,lastEncounter=0,lastHover=false,wasPressed=false,pointerPresent=false,quiet=2.4,presence=0,charge=0,impulse=0,meet=1,flow=0,seen=false,active=false,disposed=false,suppressWake=false,lastBillSignature='';
 const pixelPoint=(x:number,y:number,depth:number,camera:T.PerspectiveCamera,width:number,height:number,out:T.Vector3)=>{out.set(x/width*2-1,1-y/height*2,.5).applyMatrix4(camera.projectionMatrixInverse);return out.multiplyScalar(-depth/out.z);};
 function cancelInteraction(){suppressWake=seen;wasPressed=false;pointerPresent=false;impulse=0;quiet=2.4;lastTime=undefined;state.needsFrame=charge>.002||bend.lengthSq()>.01;}
 return{root,state,update(camera:T.PerspectiveCamera,input:BirdEncounterFieldInput){
  if(disposed)return;
  const dt=lastTime===undefined?1/60:clamp(input.time-lastTime,0,.1);lastTime=input.time;
  root.visible=input.active&&input.width>0&&input.height>0&&input.bounds.width>8&&input.bounds.height>8;
  if(!root.visible){active=false;cancelInteraction();state.needsFrame=false;lastEncounter=input.encounter;return;}
  const staticPose=input.reducedMotion||input.keyboard,q=clamp(input.encounter),billSignature=[input.bills.left.x,input.bills.left.y,input.bills.right.x,input.bills.right.y].map(value=>value.toFixed(1)).join(':');
  const suppressed=suppressWake;if(suppressed){lastEncounter=q;lastHover=input.hover;wasPressed=input.press;lastBillSignature=billSignature;quiet=2.4;suppressWake=false;}
  const changed=!suppressed&&(Math.abs(q-lastEncounter)>.0001||input.hover!==lastHover||input.press!==wasPressed||billSignature!==lastBillSignature);
  if(changed||(!seen&&!active))quiet=0;
  seen=true;active=true;lastEncounter=q;lastHover=input.hover;lastBillSignature=billSignature;
  if(wasPressed&&!input.press&&!staticPose)impulse=Math.min(1,impulse+Math.max(.35,charge));
  wasPressed=input.press;
  const height=Math.min(142,Math.max(40,Math.min(input.bounds.height-24,Math.min(input.bills.left.y,input.bills.right.y)-input.bounds.top-30))),width=height*.86;
  const cx=clamp((input.bills.left.x+input.bills.right.x)/2,input.bounds.left+width*.55+6,input.bounds.left+input.bounds.width-width*.55-6);
  const cy=clamp(Math.min(input.bills.left.y,input.bills.right.y)-height*.85,input.bounds.top+height*.5+6,input.bounds.top+input.bounds.height-height*.5-6);
  bendTarget.set(0,0);
  if(input.pointer&&input.hover&&!staticPose){
   let vx=0,vy=0;if(pointerPresent&&dt>0){vx=clamp((input.pointer.x-previousPointer.x)/dt,-1200,1200);vy=clamp((input.pointer.y-previousPointer.y)/dt,-1200,1200);if((input.pointer.x-previousPointer.x)**2+(input.pointer.y-previousPointer.y)**2>.25)quiet=0;}
   bendTarget.set(clamp((input.pointer.x-cx)*.18+vx*.012,-36,36),clamp((input.pointer.y-cy)*.14+vy*.008,-30,30));previousPointer.set(input.pointer.x,input.pointer.y);pointerPresent=true;
  }else pointerPresent=false;
  const targetPresence=input.hover||q>.005?1:.44;
  if(staticPose){presence=targetPresence;charge=0;impulse=0;meet=1;bend.set(0,0);quiet=2.4;}
  else{
   presence+=(targetPresence-presence)*(1-Math.exp(-dt*15));charge+=(Number(input.press)-charge)*(1-Math.exp(-dt*(input.press?5:15)));impulse*=Math.exp(-dt*4.5);meet+=((input.press?.55:1)-meet)*(1-Math.exp(-dt*7));bend.lerp(bendTarget,1-Math.exp(-dt*9));quiet=Math.min(2.4,quiet+dt);
   if(Math.abs(presence-targetPresence)<.002)presence=targetPresence;if(Math.abs(charge-Number(input.press))<.002)charge=Number(input.press);if(impulse<.002)impulse=0;if(bend.distanceToSquared(bendTarget)<.01)bend.copy(bendTarget);if(Math.abs(meet-(input.press?.55:1))<.002)meet=input.press?.55:1;
  }
  const energy=staticPose?0:Math.pow(Math.max(0,1-quiet/2.4),.6);if(energy>0)flow+=dt;
  state.needsFrame=!staticPose&&(energy>0||presence!==targetPresence||charge!==Number(input.press)||impulse>0||bend.distanceToSquared(bendTarget)>.01||Math.abs(meet-(input.press?.55:1))>.002);
  root.matrix.copy(camera.matrixWorld);root.updateMatrixWorld(true);
  common.uPresence.value=presence;common.uEnergy.value=energy;common.uFlow.value=flow;common.uCharge.value=charge;common.uImpulse.value=impulse;common.uMeet.value=meet;common.uEncounter.value=q;common.uMotion.value=Number(!staticPose);common.uViewport.value.set(input.width,input.height);common.uBounds.value.set(input.bounds.left,input.bounds.top,input.bounds.left+input.bounds.width,input.bounds.top+input.bounds.height);
  // The currents weave at the notch and share their lower tip, with alternating front/back depth.
  for(let side=0;side<2;side++){
   const path=paths[side+2],direction=side?1:-1;
   for(let i=0;i<=segments;i++){
    const t=i/segments,a=Math.PI*t,envelope=Math.sin(a),upper=1-T.MathUtils.smoothstep(t,.45,.72);
    const crossing=t<.18?Math.sin(Math.PI*t/.18)*7:0;
    path.css[i*2]=cx+direction*16*Math.sin(a)**3*width/32-direction*crossing+bend.x*envelope*upper;
    path.css[i*2+1]=cy-(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a)+2.5)*height/29+bend.y*envelope*upper;
    path.depth[i]=4+direction*.45*Math.sin(a*2)+direction*.24*(1-T.MathUtils.smoothstep(t,.06,.18))+(bend.x/36)*.28*envelope*Math.sin(a*2)+charge*.16*envelope;
   }
  }
  for(let side=0;side<2;side++){
   const path=paths[side],heart=paths[side+2],bill=side?input.bills.right:input.bills.left,endX=heart.css[segments*2],endY=heart.css[segments*2+1],direction=side?1:-1;
   const gap=Math.max(0,input.bills.right.x-input.bills.left.x),lift=Math.min(28,Math.max(8,bill.y-endY)*.7);
   for(let i=0;i<=segments;i++){
    if(i===0){path.css[0]=bill.x;path.css[1]=bill.y;path.depth[0]=4;continue;}
    const t=i/segments,s=1-t,envelope=Math.sin(Math.PI*t)**2;
    let x=s*s*s*bill.x+3*s*s*t*(bill.x-direction*Math.min(32,gap*.25))+3*s*t*t*endX+t*t*t*endX+bend.x*envelope*.45;
    const y=Math.max(endY+(1-t)*3,s*s*s*bill.y+3*s*s*t*(bill.y-(bill.y-endY)*.22)+3*s*t*t*(endY+lift)+t*t*t*endY+bend.y*envelope*.35);
    x=clamp(x,input.bills.left.x+6*envelope,input.bills.right.x-6*envelope);
    path.css[i*2]=x;path.css[i*2+1]=y;
    path.depth[i]=4+direction*.3*Math.sin(Math.PI*t);
   }
  }
  for(let pathIndex=0;pathIndex<paths.length;pathIndex++){
   const path=paths[pathIndex],positions=path.geometry.getAttribute('position'),normals=path.geometry.getAttribute('normal'),centers=path.geometry.getAttribute('aCenter'),radii=path.geometry.getAttribute('aRadius'),offsets=path.geometry.getAttribute('aOffset');
   for(let i=0;i<=segments;i++)pixelPoint(path.css[i*2],path.css[i*2+1],path.depth[i],camera,input.width,input.height,path.view[i]);
   for(let i=0;i<=segments;i++){
    const center=path.view[i];tangent.copy(path.view[Math.min(segments,i+1)]).sub(path.view[Math.max(0,i-1)]).normalize();normal.set(-tangent.y,tangent.x,0).normalize();binormal.crossVectors(tangent,normal).normalize();
    pixelPoint(path.css[i*2]+1,path.css[i*2+1],path.depth[i],camera,input.width,input.height,onePixel);const taper=(pathIndex<2?.36:.60)+(pathIndex<2?.64:.40)*Math.sin(Math.PI*i/segments);const depthScale=pathIndex<2?1:T.MathUtils.lerp(1,.34,clamp((path.depth[i]-3.55)/.9));const radius=onePixel.distanceTo(center)*taper*depthScale;
    const roll=clamp((pathIndex%2?.20:-.20)+(bend.x/36)*.32+(bend.y/30)*.15+charge*.18,-.48,.48)*Math.sin(Math.PI*i/segments);rolledNormal.copy(normal).multiplyScalar(Math.cos(roll)).addScaledVector(binormal,Math.sin(roll));rolledBinormal.copy(binormal).multiplyScalar(Math.cos(roll)).addScaledVector(normal,-Math.sin(roll));
    for(let j=0;j<=radials;j++){
     const index=i*(radials+1)+j,angle=j/radials*Math.PI*2;crossOffset.copy(rolledNormal).multiplyScalar(-Math.cos(angle)).addScaledVector(rolledBinormal,Math.sin(angle)*.55);radial.copy(rolledNormal).multiplyScalar(-Math.cos(angle)).addScaledVector(rolledBinormal,Math.sin(angle)/.55).normalize();sample.copy(center).addScaledVector(crossOffset,radius*(pathIndex<2?1.5:5.8));positions.setXYZ(index,sample.x,sample.y,sample.z);normals.setXYZ(index,radial.x,radial.y,radial.z);centers.setXYZ(index,center.x,center.y,center.z);offsets.setXYZ(index,crossOffset.x,crossOffset.y,crossOffset.z);radii.setX(index,radius);
    }
   }
   positions.needsUpdate=normals.needsUpdate=centers.needsUpdate=radii.needsUpdate=offsets.needsUpdate=true;
  }
  for(let i=0;i<particleCount;i++){
   const path=paths[i%4],base=((Math.floor(i/4)/12)+flow*.26)%1,engaged=Math.min(.9,charge*.75+impulse*.75),t=base*(1-engaged)+meet*engaged,at=(i%4>1?1-t:t)*segments,low=Math.floor(at),high=Math.min(segments,low+1),blend=at-low;
   const x=T.MathUtils.lerp(path.css[low*2],path.css[high*2],blend),y=T.MathUtils.lerp(path.css[low*2+1],path.css[high*2+1],blend),depth=T.MathUtils.lerp(path.depth[low],path.depth[high],blend)+(i<4?[-.28,.24,-.26,.22][i]:((i%5)-2)*.075);
   pixelPoint(x,y,depth,camera,input.width,input.height,sample);particlePositions.setXYZ(i,sample.x,sample.y,sample.z);particleWeights.setX(i,weights[i]*T.MathUtils.smoothstep(t,0,.07)*(1-T.MathUtils.smoothstep(t,.92,1)));
  }
  particlePositions.needsUpdate=particleWeights.needsUpdate=true;
 },cancelInteraction,dispose(){if(disposed)return;disposed=true;root.removeFromParent();geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());}};
}

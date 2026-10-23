import * as T from 'three';
import {ROOM_REFERENCE,roomVertex} from './approvedRoomGeometry';

export type RoomReactionTarget='monitor'|'keyboard'|'L04'|'L09'|'L06';
export type RoomReactionInput={time:number;active:boolean;reducedMotion:boolean;pointer:{x:number;y:number}|null;hover:RoomReactionTarget|null;press:boolean;activation:number;keyboard:boolean};
type XY=readonly[number,number];
type Quad=readonly[XY,XY,XY,XY];
type Depths=readonly[number,number,number,number];
const targets:RoomReactionTarget[]=['monitor','keyboard','L04','L09','L06'];
const vertex=`varying vec2 vUv;varying vec3 vNormal,vView;void main(){vUv=uv;vec4 view=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vView=normalize(-view.xyz);gl_Position=projectionMatrix*view;}`;
const surfaceFragment=`
uniform float uLevel,uPress,uPulse,uSweep,uWave,uKind,uAspect;
uniform vec2 uPointer,uWake,uVelocity,uOrigin;
varying vec2 vUv;
varying vec3 vNormal,vView;
float gaussian(vec2 p,vec2 size){p/=size;return exp(-dot(p,p));}
void main(){
 vec2 uv=vUv,aspect=vec2(uAspect,1.);
 float edge=min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y));
 float interior=smoothstep(0.,.045,edge);
 vec2 p=(uv-uPointer)*aspect,wake=(uv-uWake)*aspect;
 vec2 direction=normalize(vec2(.76,.52)+uVelocity*.16);
 vec2 across=vec2(-direction.y,direction.x);
 vec3 lightPosition=vec3((uPointer-.5)*.65,1.8);
 vec3 n=normalize(vNormal),view=normalize(vView),halfLight=normalize(normalize(lightPosition)+view);
 float facing=abs(dot(n,halfLight));
 float fresnel=pow(1.-abs(dot(n,view)),3.);
 float broad=gaussian(vec2(dot(p,direction),dot(p,across)),vec2(.75,.24));
 float wakeEnergy=min(length(uVelocity)*.12,1.);
 float trail=gaussian(vec2(dot(wake,direction),dot(wake,across)),vec2(.38,.075))*wakeEnergy;
 float radius=length((uv-uOrigin)*aspect),wave=exp(-pow((radius-uWave*1.4)/.16,2.))*uPulse;
 vec3 blue=vec3(.30,.68,1.),rose=vec3(1.,.35,.57),gold=vec3(1.,.72,.44),color=blue;
 float alpha=0.;
 if(uKind<.5){
  float refraction=sin(radius*24.-uWave*11.)*wave*.045;
  float softbox=gaussian(vec2(dot(p,direction)+refraction,dot(p,across)),vec2(.82,.12));
  color=mix(blue,vec3(.77,.90,1.),softbox*.75+uPress*.12);
  alpha=interior*(uLevel*(softbox*.23+trail*.17+broad*.045)+uPress*gaussian(p,vec2(.23))*.19+wave*.21)*(.65+.35*facing);
 }else if(uKind<1.5){
  vec2 cell=fract(uv*vec2(17.,1.));
  float key=smoothstep(.04,.16,min(cell.x,1.-cell.x))*smoothstep(0.,.20,min(uv.y,1.-uv.y));
  float originKey=(floor(uOrigin.x*17.)+.5)/17.;
  float keyDistance=abs(uv.x-originKey);
  float traveling=exp(-pow((keyDistance-uWave*1.05)/.09,2.));
  float nearKey=exp(-pow((uv.x-uPointer.x)/.11,2.));
  float depressed=exp(-pow((uv.x-originKey)/.085,2.));
  float keyWave=traveling*(uPulse+uPress*(1.-uWave)*.95);
  color=mix(mix(blue,rose,smoothstep(0.,1.,uv.x+uPress*.15)),vec3(.96,.90,1.),clamp(depressed*uPress*.95+keyWave*.7,0.,1.));
  alpha=key*(uLevel*(.055+.30*nearKey)+uPress*depressed*.88+keyWave*.95+trail*.1);
 }else if(uKind<2.5){
  float curvature=pow(uv.x-.5,2.)*.12;
  float stripe=dot(p,across)+curvature;
  float satin=exp(-pow(stripe/.13,2.))*exp(-pow(dot(p,direction)/.9,2.));
  float filament=exp(-pow((stripe+.045)/.016,2.))*exp(-pow(dot(p,direction)/.67,2.));
  float grazing=.45+.55*pow(facing,8.)+fresnel*.2;
  color=mix(rose,gold,smoothstep(-.12,.16,stripe));
  alpha=interior*grazing*(uLevel*(satin*.18+filament*.22+trail*.10)+uPress*satin*.22+wave*.16);
 }else if(uKind<3.5){
  vec2 bevel=uPointer;
  if(min(bevel.x,1.-bevel.x)<min(bevel.y,1.-bevel.y))bevel.x=mix(.04,.96,step(.5,bevel.x));
  else bevel.y=mix(.035,.965,step(.5,bevel.y));
  vec2 bevelLight=(uv-bevel)*aspect;
  float grain=.82+.18*sin(uv.y*165.+sin(uv.x*18.)*.6);
  float glass=exp(-pow(dot(bevelLight,across)/.030,2.))*exp(-pow(dot(bevelLight,direction)/.29,2.));
  float wood=gaussian(bevelLight,vec2(.13,.25));
  color=mix(gold,vec3(1.,.89,.73),glass*.7);
  alpha=grain*(uLevel*(wood*.12+glass*.52)+uPress*glass*.24+wave*.24)*(.65+.35*facing);
 }else{
  // An open, tapered desk-contact path below the plush; no geometry covers the bunny.
  float path=exp(-pow((uv.y-.5)/.30,2.));
  float core=exp(-pow((uv.y-.5)/(.075+uPress*.045),2.));
  float taper=smoothstep(.0,.13,uv.x)*(1.-smoothstep(.78,1.,uv.x));
  float travel=.5+(uSweep-.5)*direction.x;
  float head=exp(-pow((uv.x-(.14+.66*travel))/.19,2.));
  float touch=exp(-pow((uv.x-(.18+.6*uPointer.x))/.24,2.));
  color=mix(vec3(.78,.27,.52),vec3(.86,.80,1.),core*.92);
  alpha=taper*(path*(uLevel*.15+uPress*touch*.16)+core*(uLevel*(.20+head*.42+touch*.22)+uPress*touch*.42+uPulse*exp(-pow((uv.x-uWave)/.18,2.))*.65));
 }
 gl_FragColor=vec4(color,clamp(alpha,0.,uKind>3.5?.82:(uKind>.5&&uKind<1.5?.84:.64)));
}`;

// Invert the actual two projected triangles, including perspective-correct UV interpolation.
function surfaceUV(points:Quad,depth:Depths,point:{x:number;y:number},out:T.Vector2){
 const weights=(a:XY,b:XY,c:XY)=>{const x=point.x-a[0],y=point.y-a[1],bx=b[0]-a[0],by=b[1]-a[1],cx=c[0]-a[0],cy=c[1]-a[1],det=bx*cy-by*cx,v=(x*cy-y*cx)/det,w=(bx*y-by*x)/det;return[1-v-w,v,w];};
 let indices=[0,1,2],b=weights(points[0],points[1],points[2]);
 if(b.some(weight=>weight<-.00001)){indices=[0,2,3];b=weights(points[0],points[2],points[3]);}
 const uv=[[0,1],[1,1],[1,0],[0,0]],w=b.map((weight,i)=>weight/(ROOM_REFERENCE.distance-depth[indices[i]])),sum=w[0]+w[1]+w[2];
 out.set(T.MathUtils.clamp(w.reduce((value,weight,i)=>value+weight*uv[indices[i]][0],0)/sum,0,1),T.MathUtils.clamp(w.reduce((value,weight,i)=>value+weight*uv[indices[i]][1],0)/sum,0,1));
}

/** Source-registered material responses; original room artwork and discovery controls stay owned by callers. */
export function createRoomReactions(roomRoot:T.Group){
 const root=new T.Group();root.name='SOURCE_REGISTERED_ROOM_REACTIONS';root.visible=false;roomRoot.add(root);
 const geometries:T.BufferGeometry[]=[],materials:T.Material[]=[],state={needsFrame:false};
 const values=Object.fromEntries(targets.map(target=>[target,{level:0,press:0,pulse:0,sweep:0,wave:1,pointer:new T.Vector2(.5,.5),previous:new T.Vector2(.5,.5),wake:new T.Vector2(.5,.5),velocity:new T.Vector2(),origin:new T.Vector2(.5,.5),tracking:false}])) as Record<RoomReactionTarget,{level:number;press:number;pulse:number;sweep:number;wave:number;pointer:T.Vector2;previous:T.Vector2;wake:T.Vector2;velocity:T.Vector2;origin:T.Vector2;tracking:boolean}>;
 const surfaces:{target:RoomReactionTarget;mesh:T.Mesh;uniforms:Record<string,T.IUniform>;points:Quad;depth:Depths;inputPoints:Quad}[]=[];
 function surface(target:RoomReactionTarget,points:Quad,depth:Depths,kind:number,frame=false,inputPoints=points){
  const geometry=new T.BufferGeometry(),positions:number[]=[],uvs:number[]=[],cx=points.reduce((sum,p)=>sum+p[0],0)/4,cy=points.reduce((sum,p)=>sum+p[1],0)/4;
  const vertices=frame?[...points,...points.map(([x,y])=>[x+(cx-x)*.16,y+(cy-y)*.12] as XY)]:points;
  vertices.forEach(([x,y],i)=>{positions.push(...roomVertex(x,y,depth[i%4]));const u=[0,1,1,0][i%4],v=[1,1,0,0][i%4];uvs.push(i<4?u:.08+u*.84,i<4?v:.06+v*.88);});
  const indices=frame?Array.from({length:4},(_,i)=>{const next=(i+1)%4;return[i,next,next+4,i,next+4,i+4];}).flat():[0,1,2,0,2,3];
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();geometries.push(geometry);
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),aspect=(Math.max(...xs)-Math.min(...xs))/(Math.max(...ys)-Math.min(...ys));
  const uniforms={uLevel:{value:0},uPress:{value:0},uPulse:{value:0},uSweep:{value:0},uWave:{value:1},uKind:{value:kind},uAspect:{value:aspect},uPointer:{value:new T.Vector2(.5,.5)},uWake:{value:new T.Vector2(.5,.5)},uVelocity:{value:new T.Vector2()},uOrigin:{value:new T.Vector2(.5,.5)}};
  const material=new T.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:surfaceFragment,transparent:true,depthWrite:false,depthTest:true,blending:T.AdditiveBlending,side:T.DoubleSide,toneMapped:false});materials.push(material);
  const mesh=new T.Mesh(geometry,material);mesh.name='ROOM_LIGHT_'+target;mesh.visible=false;root.add(mesh);surfaces.push({target,mesh,uniforms,points,depth,inputPoints});
 }
 surface('monitor',[[78,344],[205,323],[242,621],[116,589]],[.55,.2,.22,.6],0);
 // The original hands are above this one actual lower key row.
 surface('keyboard',[[321,680],[590,696],[576,718],[315,699]],[.1,.18,.5,.42],1);
 surface('L06',[[1264,560],[1420,539],[1382,689],[1218,720]],[.18,.5,1.2,.88],2);
 // Ring topology has no triangles in the original photograph interior.
 surface('L09',[[29,619],[162,598],[195,793],[62,829]],[.55,.2,.24,.6],3,true);
 surface('L04',[[1370,748],[1491,777],[1482,798],[1361,769]],[.12,.18,.35,.28],4,false,[[1410,401],[1672,401],[1672,781],[1410,781]]);
 // This narrow source corridor threads between the plush feet and the phone's upper edge.
 const contactPath=[[1405,772,5],[1450,771,5],[1490,770,5],[1515,774,3],[1535,779,2],[1560,787,3],[1590,794,4],[1620,799,5],[1662,804,4]];
 const contactGeometry=surfaces.find(surface=>surface.target==='L04')!.mesh.geometry,contactPositions:number[]=[],contactUV:number[]=[],contactIndices:number[]=[];
 contactPath.forEach(([x,y,halfWidth],i)=>{const u=i/(contactPath.length-1),z=.12+u*.23;for(const side of [-1,1]){contactPositions.push(...roomVertex(x,y+side*halfWidth,z));contactUV.push(u,side<0?1:0);}if(i<contactPath.length-1){const n=i*2;contactIndices.push(n,n+1,n+3,n,n+3,n+2);}});
 contactGeometry.setAttribute('position',new T.Float32BufferAttribute(contactPositions,3));contactGeometry.setAttribute('uv',new T.Float32BufferAttribute(contactUV,2));contactGeometry.setIndex(contactIndices);contactGeometry.computeVertexNormals();
 const desired=new T.Vector2(),speed=new T.Vector2();
 let previousTime:number|undefined,lastActivation:number|undefined,lastHover:RoomReactionTarget|null=null,pressedTarget:RoomReactionTarget|null=null,wasPressed=false,keyboardGesture=false,disposed=false;
 function cancelInteraction(){wasPressed=false;keyboardGesture=false;pressedTarget=null;lastHover=null;previousTime=undefined;for(const target of targets){const value=values[target];value.pulse=0;value.press=0;value.velocity.set(0,0);value.tracking=false;}state.needsFrame=targets.some(target=>values[target].level>0);}
 function reset(){for(const target of targets){const value=values[target];Object.assign(value,{level:0,press:0,pulse:0,sweep:0,wave:1,tracking:false});value.velocity.set(0,0);}state.needsFrame=false;wasPressed=false;keyboardGesture=false;lastHover=null;pressedTarget=null;previousTime=undefined;}
 return{root,state,update(input:RoomReactionInput){
  if(disposed)return;
  const dt=previousTime===undefined?1/60:T.MathUtils.clamp(input.time-previousTime,0,.1);previousTime=input.time;
  const activated=lastActivation!==undefined&&input.activation!==lastActivation;lastActivation=input.activation;
  root.visible=input.active;if(!input.active){reset();return;}
  const staticPose=input.reducedMotion||input.keyboard;
  if(input.hover)lastHover=input.hover;
  const impacted=activated?input.hover??lastHover:null,pressStarted=input.press&&!wasPressed;
  if(pressStarted)pressedTarget=input.hover;
  const keyboardClick=impacted==='keyboard'&&keyboardGesture;
  if(impacted==='keyboard')keyboardGesture=false;
  if(pressStarted&&input.hover==='keyboard')keyboardGesture=true;
  if(!input.press)pressedTarget=null;
  wasPressed=input.press;state.needsFrame=false;
  for(const surface of surfaces){
   const value=values[surface.target],hovered=input.hover===surface.target,level=Number(hovered),press=Number(hovered&&input.press&&pressedTarget===surface.target);
   if(staticPose){value.level=level;value.press=press;value.pulse=0;value.sweep=.5;value.wave=1;value.pointer.set(.5,.5);value.wake.set(.5,.5);value.origin.set(.5,.5);value.velocity.set(0,0);value.tracking=false;}
   else{
    if(hovered&&input.pointer){
     surfaceUV(surface.inputPoints,surface.depth,input.pointer,desired);
     if(!value.tracking){value.pointer.copy(desired);value.previous.copy(desired);value.wake.copy(desired);value.velocity.set(0,0);}
     speed.copy(desired).sub(value.previous).multiplyScalar(dt>0?1/dt:0).clampLength(0,8);
     value.velocity.lerp(speed,1-Math.exp(-dt*14));value.previous.copy(desired);value.pointer.lerp(desired,1-Math.exp(-dt*22));value.tracking=true;
    }else{value.velocity.multiplyScalar(Math.exp(-dt*14));value.tracking=false;}
    value.wake.lerp(value.pointer,1-Math.exp(-dt*7));
    if(value.velocity.lengthSq()<.00001)value.velocity.set(0,0);
    if(value.wake.distanceToSquared(value.pointer)<.000004)value.wake.copy(value.pointer);
    if(hovered&&value.level<.001)value.sweep=0;
    if(hovered&&pressStarted){value.origin.copy(value.pointer);value.wave=0;if(surface.target==='keyboard')value.press=Math.max(value.press,.55);}
    if(impacted===surface.target&&!keyboardClick){value.pulse=Math.min(1,value.pulse+.85);value.wave=0;value.origin.copy(value.pointer);}
    value.level+=(level-value.level)*(1-Math.exp(-dt*18));value.press+=(press-value.press)*(1-Math.exp(-dt*(press?10:24)));value.sweep+=(1-value.sweep)*(1-Math.exp(-dt*5));value.pulse*=Math.exp(-dt*6);value.wave=Math.min(1,value.wave+dt*1.8);
    if(Math.abs(value.level-level)<.002)value.level=level;
    if(Math.abs(value.press-press)<.002)value.press=press;
    if(value.pulse<.002)value.pulse=0;
    if(1-value.sweep<.002)value.sweep=1;
    state.needsFrame||=value.level!==level||value.press!==press||value.pulse>0||(hovered&&(value.sweep<1||value.velocity.lengthSq()>0||value.wake.distanceToSquared(value.pointer)>0||value.pointer.distanceToSquared(value.previous)>.000004));
   }
   surface.mesh.visible=value.level+value.press+value.pulse>.001;
   const u=surface.uniforms;u.uLevel.value=value.level;u.uPress.value=value.press;u.uPulse.value=value.pulse;u.uSweep.value=value.sweep;u.uWave.value=value.wave;u.uPointer.value.copy(value.pointer);u.uWake.value.copy(value.wake);u.uVelocity.value.copy(value.velocity);u.uOrigin.value.copy(value.origin);
  }
 },cancelInteraction,dispose(){if(disposed)return;disposed=true;root.removeFromParent();geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());}};
}

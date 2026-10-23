import * as T from 'three';
import {ROOM_REFERENCE,roomVertex} from './approvedRoomGeometry';

export type RoomReactionTarget='monitor'|'keyboard'|'L04'|'L09'|'L06';
export type RoomReactionInput={time:number;active:boolean;reducedMotion:boolean;pointer:{x:number;y:number}|null;hover:RoomReactionTarget|null;press:boolean;activation:number;keyboard:boolean};
type XY=readonly[number,number];
type Quad=readonly[XY,XY,XY,XY];
const targets:RoomReactionTarget[]=['monitor','keyboard','L04','L09','L06'];
const pixel=2*ROOM_REFERENCE.distance*Math.tan(ROOM_REFERENCE.fov*Math.PI/360)/ROOM_REFERENCE.height;
const vertex=`varying vec2 vUv;varying vec3 vNormal;void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const surfaceFragment=`
uniform float uLevel,uPress,uPulse,uSweep,uKind;
uniform vec2 uPointer;
varying vec2 vUv;
void main(){
 vec2 uv=vUv;
 float edge=min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y));
 float rim=exp(-edge*52.);
 float ribbon=exp(-pow((uv.x+uv.y*.24-(-.25+uSweep*1.55))/.11,2.));
 vec2 near=uv-uPointer;
 float light=exp(-dot(near,near)*10.);
 float motion=sin(uSweep*3.14159265);
 float energy=max(uLevel,uPulse);
 float ripple=exp(-pow((length(near)-uSweep*.95)/.045,2.))*motion;
 vec3 blue=vec3(.16,.61,1.),rose=vec3(1.,.19,.53),gold=vec3(1.,.65,.39);
 vec3 color=mix(blue,rose,step(1.5,uKind));
 float alpha=uLevel*(rim*.55+light*.07)+energy*(ribbon*.55+ripple*.42)+uPress*light*.24;
 if(uKind>.5&&uKind<1.5){
  vec2 key=fract(uv*vec2(16.,4.));
  float keys=smoothstep(.05,.17,min(min(key.x,1.-key.x),min(key.y,1.-key.y)));
  float travel=exp(-pow((uv.x-(-.2+uSweep*1.4))/.18,2.))*motion;
  color=mix(blue,rose,clamp(uv.x*.55+travel*.45+uPress*.3,0.,1.));
  alpha=keys*(uLevel*.12+energy*travel*.9+uPress*.24)+rim*uLevel*.2;
 }
 if(uKind>1.5&&uKind<2.5){
  float falloff=smoothstep(0.,.20,edge);
  float catchlight=exp(-pow((uv.x+uv.y*.65-(-.3+uSweep*2.2))/.2,2.));
  color=mix(rose,gold,catchlight*.65);
  alpha=falloff*(light*(uLevel*.09+uPress*.24)+catchlight*energy*.72+ripple*energy*.2);
 }
 if(uKind>2.5){
  color=gold;
  alpha=uLevel*.08+ribbon*energy*.9+rim*(uPress*.3+motion*energy*.2);
 }
 gl_FragColor=vec4(color,clamp(alpha,0.,.82));
}`;

/** Local source-pixel light surfaces; the illustration, camera and discovery controls stay owned by their callers. */
export function createRoomReactions(roomRoot:T.Group){
 const root=new T.Group();root.name='SOURCE_REGISTERED_ROOM_REACTIONS';root.visible=false;roomRoot.add(root);
 const geometries:T.BufferGeometry[]=[],materials:T.Material[]=[];
 const state={needsFrame:false};
 const values=Object.fromEntries(targets.map(target=>[target,{level:0,press:0,pulse:0,sweep:0}])) as Record<RoomReactionTarget,{level:number;press:number;pulse:number;sweep:number}>;
 const surfaces: {target:RoomReactionTarget;mesh:T.Mesh;uniforms:Record<string,T.IUniform>;bounds:{x:number;y:number;w:number;h:number}}[]=[];
 function surface(target:RoomReactionTarget,points:Quad,kind:number,frame=false){
  const geometry=new T.BufferGeometry(),positions:number[]=[],uvs:number[]=[];
  const vertices=frame?[...points,...points.map(([x,y])=>{const cx=points.reduce((sum,p)=>sum+p[0],0)/4,cy=points.reduce((sum,p)=>sum+p[1],0)/4;return [x+(cx-x)*.16,y+(cy-y)*.12] as XY;})]:points;
  vertices.forEach(([x,y],i)=>{positions.push(...roomVertex(x,y,.08));const u=[0,1,1,0][i%4],v=[1,1,0,0][i%4];uvs.push(i<4?u:.08+u*.84,i<4?v:.06+v*.88);});
  const indices=frame?Array.from({length:4},(_,i)=>{const next=(i+1)%4;return[i,next,next+4,i,next+4,i+4];}).flat():[0,1,2,0,2,3];
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();geometries.push(geometry);
  const uniforms={uLevel:{value:0},uPress:{value:0},uPulse:{value:0},uSweep:{value:0},uKind:{value:kind},uPointer:{value:new T.Vector2(.5,.5)}};
  const material=new T.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:surfaceFragment,transparent:true,depthWrite:false,depthTest:true,blending:T.AdditiveBlending,side:T.DoubleSide,toneMapped:false});materials.push(material);
  const mesh=new T.Mesh(geometry,material);mesh.name='ROOM_LIGHT_'+target;mesh.visible=false;root.add(mesh);
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);surfaces.push({target,mesh,uniforms,bounds:{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)}});
 }
 surface('monitor',[[78,344],[205,323],[242,621],[116,589]],0);
 // The lower keyboard strip excludes both hands in the original source.
 surface('keyboard',[[321,680],[590,696],[576,718],[315,699]],1);
 surface('L06',[[1264,560],[1420,539],[1382,689],[1218,720]],2);
 // Only the actual wooden frame receives light; its photo interior has no triangles.
 surface('L09',[[29,619],[162,598],[195,793],[62,829]],3,true);
 const heartShape=new T.Shape();heartShape.moveTo(0,-.9);heartShape.bezierCurveTo(-.2,-.65,-1,.05,-1,.55);heartShape.bezierCurveTo(-1,1.1,-.3,1.25,0,.65);heartShape.bezierCurveTo(.3,1.25,1,1.1,1,.55);heartShape.bezierCurveTo(1,.05,.2,-.65,0,-.9);
 const heartGeometry=new T.ExtrudeGeometry(heartShape,{depth:.3,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.08,bevelThickness:.06,curveSegments:12});heartGeometry.center();geometries.push(heartGeometry);
 const heartUniforms={uOpacity:{value:0}};
 const heartMaterial=new T.ShaderMaterial({uniforms:heartUniforms,vertexShader:vertex,fragmentShader:'uniform float uOpacity;varying vec3 vNormal;void main(){float facing=.48+.52*max(0.,vNormal.z);gl_FragColor=vec4(vec3(1.,.29,.51)*facing,uOpacity);}',transparent:true,depthWrite:false,depthTest:true,toneMapped:false});materials.push(heartMaterial);
 const hearts=[{x:1480,y:377,size:17},{x:1593,y:350,size:12}].map((anchor,index)=>{const mesh=new T.Mesh(heartGeometry,heartMaterial);mesh.name='RABBIT_DEPTH_GREETING_'+index;mesh.scale.setScalar(pixel*anchor.size);mesh.position.set(...roomVertex(anchor.x,anchor.y,.18+index*.4));mesh.visible=false;root.add(mesh);return{mesh,anchor};});
 let previousTime:number|undefined,lastActivation:number|undefined,lastHover:RoomReactionTarget|null=null,pressedTarget:RoomReactionTarget|null=null,wasPressed=false,disposed=false;
 function cancelInteraction(){wasPressed=false;pressedTarget=null;lastHover=null;previousTime=undefined;for(const target of targets){values[target].pulse=0;values[target].press=0;}state.needsFrame=targets.some(target=>values[target].level>0);}
 function reset(){for(const target of targets)Object.assign(values[target],{level:0,press:0,pulse:0,sweep:0});heartUniforms.uOpacity.value=0;state.needsFrame=false;wasPressed=false;lastHover=null;pressedTarget=null;}
 return{root,state,update(input:RoomReactionInput){
  if(disposed)return;
  const dt=previousTime===undefined?1/60:T.MathUtils.clamp(input.time-previousTime,0,.1);previousTime=input.time;
  const activated=lastActivation!==undefined&&input.activation!==lastActivation;lastActivation=input.activation;
  const entering=input.active&&!root.visible;root.visible=input.active;
  if(!input.active){reset();return;}
  const staticPose=input.reducedMotion||input.keyboard;
  if(input.hover)lastHover=input.hover;
  const impacted=activated?input.hover??lastHover:null;
  if(entering&&!staticPose){values.L04.pulse=1;values.L04.sweep=0;}
  if(impacted&&!staticPose){values[impacted].pulse=Math.min(1,values[impacted].pulse+.8);values[impacted].sweep=0;}
  if(input.press&&!wasPressed)pressedTarget=input.hover;
  if(wasPressed&&!input.press&&pressedTarget&&!staticPose){values[pressedTarget].pulse=Math.min(1,values[pressedTarget].pulse+.7);values[pressedTarget].sweep=0;}
  if(!input.press)pressedTarget=null;
  wasPressed=input.press;
  state.needsFrame=false;
  for(const target of targets){
   const value=values[target],hovered=input.hover===target,level=Number(hovered),press=Number(hovered&&input.press&&pressedTarget===target);
   if(hovered&&value.level<.001)value.sweep=0;
   if(staticPose){value.level=level;value.press=press;value.pulse=0;value.sweep=.5;}
   else{
    value.level+=(level-value.level)*(1-Math.exp(-dt*18));
    value.press+=(press-value.press)*(1-Math.exp(-dt*(press?10:24)));
    value.sweep=Math.min(1,value.sweep+dt/1.1);
    value.pulse*=Math.exp(-dt*3.4);
    if(Math.abs(value.level-level)<.002)value.level=level;
    if(Math.abs(value.press-press)<.002)value.press=press;
    if(value.pulse<.002)value.pulse=0;
    if(1-value.sweep<.002)value.sweep=1;
    state.needsFrame||=value.level!==level||value.press!==press||value.pulse>0||(hovered&&value.sweep<1);
   }
  }
  for(const surface of surfaces){
   const value=values[surface.target];surface.mesh.visible=value.level+value.pulse>.001;
   surface.uniforms.uLevel.value=value.level;surface.uniforms.uPress.value=value.press;surface.uniforms.uPulse.value=value.pulse;surface.uniforms.uSweep.value=value.sweep;
   const {bounds}=surface;if(input.pointer&&!staticPose)surface.uniforms.uPointer.value.set(T.MathUtils.clamp((input.pointer.x-bounds.x)/bounds.w,0,1),1-T.MathUtils.clamp((input.pointer.y-bounds.y)/bounds.h,0,1));else surface.uniforms.uPointer.value.set(.5,.5);
  }
  const rabbit=values.L04;heartUniforms.uOpacity.value=Math.min(.98,rabbit.level*.88+Math.sqrt(rabbit.pulse)*1.3);
  hearts.forEach(({mesh,anchor},i)=>{
   mesh.visible=heartUniforms.uOpacity.value>.001;
   const flourish=staticPose?0:Math.sin(Math.PI*rabbit.sweep),strength=Math.max(rabbit.level,Math.sqrt(rabbit.pulse));
   const rise=staticPose?0:rabbit.level*(24+i*9)+flourish*(70+i*16)*strength;
   mesh.position.set(...roomVertex(anchor.x+(staticPose?0:(i?1:-1)*(flourish*16*strength+rabbit.press*6)),anchor.y-rise,.18+i*.4+(staticPose?0:rabbit.press*.7)));
   mesh.rotation.set(0,staticPose?0:(i?-.38:.38)*(rabbit.level+flourish*strength)+rabbit.press*.3,staticPose?0:(i?-.16:.16)*flourish*strength);
   mesh.scale.setScalar(pixel*anchor.size*(staticPose?1:1+rabbit.level*.12+flourish*.38*strength+rabbit.press*.1));
  });
 },cancelInteraction,dispose(){if(disposed)return;disposed=true;root.removeFromParent();geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());}};
}

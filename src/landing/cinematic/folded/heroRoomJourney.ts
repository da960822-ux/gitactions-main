import * as T from 'three';
import type {createApprovedGamingRoom} from './ApprovedGamingRoom';
import {heroContain,heroWorldProjection} from './initialCosmicHero';

type CanonicalRoom=ReturnType<typeof createApprovedGamingRoom>;
type Options={width:number;height:number;portrait:string;portraitMask?:string};
type Built={update:(progress:number,camera:T.PerspectiveCamera)=>void;syncView:(camera:T.PerspectiveCamera)=>void;setActive:(active:boolean)=>void;dispose:()=>void};

// Original source registration and p-only camera from bc3c5e15; one authored ceiling unfolds above them.
export function createHeroRoomJourney(scene:T.Scene,canonicalRoom:CanonicalRoom,options:Options){
 let width=options.width,height=options.height,disposed=false,active=true,built:Built|undefined;
 const reducedMotion=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):undefined;
 let loaded:T.Texture[]|undefined;
 const textures=new Set<T.Texture>(),roomMaterials=new Set<T.Material>();
 canonicalRoom.root.traverse(object=>{if((object as T.Mesh).isMesh){const material=(object as T.Mesh).material;for(const value of Array.isArray(material)?material:[material])roomMaterials.add(value);}});
 const originalStencil=new Map([...roomMaterials].map(material=>[material,{stencilWrite:material.stencilWrite,stencilRef:material.stencilRef,stencilFunc:material.stencilFunc,stencilFail:material.stencilFail,stencilZFail:material.stencilZFail,stencilZPass:material.stencilZPass}]));
 function setRoomStencil(enabled:boolean){for(const material of roomMaterials){if(enabled)Object.assign(material,{stencilWrite:true,stencilRef:1,stencilFunc:T.EqualStencilFunc,stencilFail:T.KeepStencilOp,stencilZFail:T.KeepStencilOp,stencilZPass:T.KeepStencilOp});else material.stencilWrite=false;}}
 function build(maps:T.Texture[]):Built{
  const [I,P,PA,A,RA,C,warm,burgundy,wood]=maps;
  const aspect=width/height,tan=Math.tan(24*Math.PI/180),rx=aspect<1.5?aspect/1.5:1,ry=aspect>1.5?1.5/aspect:1;
  const coreHeight=4.9,roomScale=coreHeight/(48*tan),roomCenter=new T.Vector3(-8.7,.8,-12),contain=Math.max(1,(1672/941)/aspect),endDistance=24*roomScale*contain,endEye=new T.Vector3(-8.7,.8,-12+endDistance);
  canonicalRoom.root.updateWorldMatrix(true,false);
  const prototypeB=new T.Matrix4().compose(roomCenter,new T.Quaternion(),new T.Vector3(roomScale,roomScale,roomScale));
  const normalization=canonicalRoom.root.matrixWorld.clone().multiply(prototypeB.invert());
  const inverseNormalization=normalization.clone().invert(),rotation=new T.Quaternion(),translation=new T.Vector3(),scaling=new T.Vector3();
  normalization.decompose(translation,rotation,scaling);
  if(scaling.x<=0||Math.abs(scaling.x-scaling.y)>1e-8||Math.abs(scaling.x-scaling.z)>1e-8)throw Error('Hero/B registration requires positive uniform scale');
  const scale=scaling.x;
  const stage=new T.Group();stage.name='HERO_ROOM_JOURNEY';stage.visible=active;scene.add(stage);
  const camera=new T.PerspectiveCamera(48,aspect,.02,120);
  const smooth=(a:number,b:number,p:number)=>{const t=T.MathUtils.clamp((p-a)/(b-a),0,1);return t*t*(3-2*t);};
  const point=(x:number,y:number,depth=4)=>new T.Vector3((x/1536*2-1)/rx*tan*aspect*depth,(1-y/1024*2)/ry*tan*depth,-depth);
  const stencil=(m:T.Material,inside:boolean)=>Object.assign(m,{stencilWrite:true,stencilRef:1,stencilFunc:inside?T.EqualStencilFunc:T.NotEqualStencilFunc,stencilFail:T.KeepStencilOp,stencilZFail:T.KeepStencilOp,stencilZPass:T.KeepStencilOp});
  const exteriorBlend={value:0};
  function sourceMaterial(near:boolean){const m=new T.MeshBasicMaterial({map:I,side:T.DoubleSide,toneMapped:false});m.onBeforeCompile=s=>{Object.assign(s.uniforms,{sourceAlpha:{value:A},repairAlpha:{value:RA},hiddenPlate:{value:C},exteriorBlend});s.fragmentShader='uniform sampler2D sourceAlpha,repairAlpha,hiddenPlate;uniform float exteriorBlend;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
vec2 q=vMapUv,p=vec2(q.x*1536.,(1.-q.y)*1024.);float a=texture2D(sourceAlpha,q).a;
if(p.x>=424.&&p.x<=480.&&p.y>=453.&&p.y<=571.)a=texture2D(repairAlpha,q).a;
${near?'if(a<.5)discard;diffuseColor*=texture2D(map,q);':'diffuseColor*=mix(texture2D(map,q),texture2D(hiddenPlate,q),exteriorBlend);'}
#endif`);};m.customProgramCacheKey=()=>near?'L-room-original-foreground-v1':'L-room-coherent-exterior-v1';return m;}
  function sourcePlane(depth:number){const g=new T.PlaneGeometry(1,1),p=g.getAttribute('position'),uv=g.getAttribute('uv');for(let i=0;i<p.count;i++){const q=point(uv.getX(i)*1536,(1-uv.getY(i))*1024,depth);p.setXYZ(i,q.x,q.y,q.z);}g.computeBoundingSphere();return g;}
  const farMat=sourceMaterial(false);stencil(farMat,false);const farMesh=new T.Mesh(sourcePlane(24),farMat);stage.add(farMesh);
  const nearMesh=new T.Mesh(sourcePlane(4),sourceMaterial(true));stage.add(nearMesh);
  const pMat=new T.MeshBasicMaterial({map:P,alphaMap:PA,transparent:true,alphaTest:.005,depthWrite:true,toneMapped:false,side:T.DoubleSide});stencil(pMat,false);
  const portrait=new T.Mesh(new T.PlaneGeometry(6.2*1312/1199,6.2),pMat);portrait.matrixAutoUpdate=false;portrait.matrix.copy(new T.Matrix4().makeScale(2,2,2).multiply(new T.Matrix4().makeTranslation(6,-.5,-3.1-heroContain(width,height))).multiply(heroWorldProjection(width,height,1)).multiply(new T.Matrix4().makeTranslation(1.85,.03,.05)));stage.add(portrait);
  type VisibilityRole="physical-boundary"|"interior-content";
  function mesh(name:string,vertices:T.Vector3[],uv:number[],material:T.Material,role:VisibilityRole="physical-boundary"){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices.flatMap(v=>v.toArray()),3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();g.computeBoundingSphere();const m=new T.Mesh(g,material);m.name=name;m.frustumCulled=false;if(role==="interior-content")stencil(material,true);else material.stencilWrite=false;m.userData.visibilityRole=role;stage.add(m);return m;}
  function quad(name:string,a:T.Vector3,b:T.Vector3,c:T.Vector3,d:T.Vector3,material:T.Material,role:VisibilityRole="physical-boundary",u=1,v=1){return mesh(name,[a,b,c,a,c,d],[0,0,u,0,u,v,0,0,u,v,0,v],material,role);}
  const sourceContour=[[485,10],[430,145],[425,310],[425,520],[420,650]],q=sourceContour.map(([x,y])=>point(x,y));
  const outside:[number,number][]=[[466,10],[454,35],[435,75],[424,115],[420,145]],inside:[number,number][]=[[485,10],[471,35],[453,75],[443,115],[439,145]];
  const frontVertices:T.Vector3[]=[],frontUV:number[]=[],sideVertices:T.Vector3[]=[],sideUV:number[]=[],capVertices:T.Vector3[]=[],capUV:number[]=[];
  const k=-point(425,310).x/4,endDepth=5.8,entryBack=7.5,floor=-2.8,ceiling=4.2,left=-14.2,back=-12.04;
  const outerTop=.8+4.9/2+4.9*58/941,ceilingSlope=(ceiling-outerTop)/(-endDepth-back),ceilingAt=(z:number)=>ceiling+ceilingSlope*(z+endDepth);
  let length=0;const lengths=[0];for(let i=0;i<q.length-1;i++){length+=q[i].distanceTo(q[i+1]);lengths.push(length);}
  for(let i=0;i<4;i++){
   const a=point(...outside[i]),b=point(...inside[i]),c=point(...inside[i+1]),d=point(...outside[i+1]);frontVertices.push(a,b,c,a,c,d);for(const [x,y]of[outside[i],inside[i],inside[i+1],outside[i],inside[i+1],outside[i+1]])frontUV.push(x/1536,1-y/1024);
   const e=q[i],f=q[i+1],g=f.clone().multiplyScalar(1.45),h=e.clone().multiplyScalar(1.45),v0=lengths[i]/length,v1=lengths[i+1]/length;sideVertices.push(e,f,g,e,g,h);sideUV.push(0,v0,0,v1,1,v1,0,v0,1,v1,1,v0);
   const j=new T.Vector3(-k*endDepth,h.y,-endDepth),l=new T.Vector3(-k*endDepth,g.y,-endDepth);capVertices.push(h,g,l,h,l,j);capUV.push(0,v0,0,v1,1,v1,0,v0,1,v1,1,v0);
  }
  mesh('OBSERVED_ORIGINAL_STONE_BEVEL',frontVertices,frontUV,new T.MeshBasicMaterial({map:I,side:T.DoubleSide,toneMapped:false}));
  mesh('AUTHORED_STONE_INWARD_SIDE',sideVertices,sideUV,new T.MeshBasicMaterial({color:'#4b2c25',side:T.DoubleSide,toneMapped:false}));
  mesh('AUTHORED_JAMB_END_CONNECTION',capVertices,capUV,new T.MeshBasicMaterial({color:'#382018',side:T.DoubleSide,toneMapped:false}));
  function material(map:T.Texture,color:string){return new T.MeshBasicMaterial({map,color,side:T.DoubleSide,toneMapped:false});}
  const leftMat=material(warm,'#b99fa8'),rightMat=material(burgundy,'#a08080'),floorMat=material(wood,'#a18983');
  const V=(x:number,y:number,z:number)=>new T.Vector3(x,y,z),rightAt=(z:number)=>k*z;
  quad('INTERIOR_LEFT_WALL',V(left,floor,-endDepth),V(left,floor,back),V(left,ceilingAt(back),back),V(left,ceiling,-endDepth),leftMat.clone(),"physical-boundary",3,2);
  quad('INTERIOR_BACK_LEFT',V(left,floor,back),V(-8.7,floor,back),V(-8.7,ceilingAt(back),back),V(left,ceilingAt(back),back),leftMat.clone(),"physical-boundary",2,2);
  quad('INTERIOR_BACK_RIGHT',V(-8.7,floor,back),V(rightAt(back),floor,back),V(rightAt(back),ceilingAt(back),back),V(-8.7,ceilingAt(back),back),rightMat.clone(),"physical-boundary",2,2);
  quad('INTERIOR_RIGHT_WALL_AFTER_FREE_ENTRY',V(rightAt(-entryBack),floor,-entryBack),V(rightAt(back),floor,back),V(rightAt(back),ceilingAt(back),back),V(rightAt(-entryBack),ceilingAt(-entryBack),-entryBack),rightMat.clone(),"physical-boundary",2,2);
  quad('INTERIOR_FRONT_RETURN_BEHIND_OBSERVER',V(left,floor,-endDepth),V(rightAt(-endDepth),floor,-endDepth),V(rightAt(-endDepth),ceiling,-endDepth),V(left,ceiling,-endDepth),leftMat.clone(),"physical-boundary",3,2);
  quad('ACTUAL_FLOOR_UNDER_OBSERVER',V(left,floor,-endDepth),V(left,floor,back),V(rightAt(back),floor,back),V(rightAt(-endDepth),floor,-endDepth),floorMat,"physical-boundary",3,3);
  const ceilingGeometry=new T.PlaneGeometry(1,1,32,16),ceilingPosition=ceilingGeometry.getAttribute('position'),ceilingUV=ceilingGeometry.getAttribute('uv'),ceilingWeights=new Float32Array(ceilingPosition.count);
  for(let i=0;i<ceilingPosition.count;i++){
   const u=ceilingUV.getX(i),v=1-ceilingUV.getY(i),z=T.MathUtils.lerp(-endDepth,back,v);
   ceilingPosition.setXYZ(i,T.MathUtils.lerp(left,rightAt(z),u),ceilingAt(z),z);ceilingUV.setXY(i,u*3,v*3);
   // A shallow intrados folds below the roof near the room, where the entry camera can see it.
   // The front edge itself is above that frustum; moving it would be invisible again.
   const foldSection=v>.42?Math.sin(Math.PI*(v-.42)/.58):0;
   ceilingWeights[i]=u===0||u===1||v===0||v===1?0:Math.sin(Math.PI*u)*foldSection*foldSection;
  }
  ceilingGeometry.computeVertexNormals();ceilingGeometry.computeBoundingSphere();
  const ceilingRest=new Float32Array(ceilingPosition.array),ceilingRestNormals=new Float32Array(ceilingGeometry.getAttribute('normal').array);
  const ceilingMesh=new T.Mesh(ceilingGeometry,material(warm,'#957281'));ceilingMesh.name='AUTHORED_SHALLOW_CEILING_CONNECTION';ceilingMesh.userData.visibilityRole='physical-boundary';ceilingMesh.frustumCulled=false;stage.add(ceilingMesh);
  const ceilingState={vertices:ceilingPosition.count,foldDepth:0,maxVertexDrop:0,maxNormalDelta:0,baseClearance:Infinity};let previousDepth=NaN;
  function unfoldCeiling(progress:number){
   // The real fold briefly owns upper-background occlusion, then opens to the flat arrival roof.
   // All wall/B seams stay pinned; no source pixels or independent clip line follow the fold.
   const depth=1.2*smooth(.12,.28,progress)*(1-smooth(.35,.58,progress))*(reducedMotion?.matches ? .2 : 1);
   if(depth===previousDepth)return;previousDepth=depth;ceilingState.foldDepth=depth;ceilingState.maxVertexDrop=0;
   for(let i=0;i<ceilingPosition.count;i++){const offset=depth*ceilingWeights[i];ceilingPosition.setY(i,ceilingRest[i*3+1]-offset);ceilingState.maxVertexDrop=Math.max(ceilingState.maxVertexDrop,offset);}
   ceilingPosition.needsUpdate=true;ceilingGeometry.computeVertexNormals();ceilingGeometry.computeBoundingSphere();
   const normal=ceilingGeometry.getAttribute('normal');ceilingState.maxNormalDelta=0;
   for(let i=0;i<normal.count;i++)ceilingState.maxNormalDelta=Math.max(ceilingState.maxNormalDelta,Math.hypot(normal.getX(i)-ceilingRestNormals[i*3],normal.getY(i)-ceilingRestNormals[i*3+1],normal.getZ(i)-ceilingRestNormals[i*3+2]));
   ceilingMesh.userData.deformation=ceilingState;
  }
  const coreWidth=coreHeight*1672/941,outerBottom=.8-coreHeight*999/941+coreHeight/2;
  const deskGrain=wood.clone();deskGrain.repeat.set(804/1254,73/1254);deskGrain.offset.set(16/1254,1-85/1254);deskGrain.needsUpdate=true;
  quad('DESK_UNDERBODY_BELOW_OUTPAINT',V(-8.7-coreWidth/2,floor,-11.99),V(-8.7+coreWidth/2,floor,-11.99),V(-8.7+coreWidth/2,outerBottom,-11.99),V(-8.7-coreWidth/2,outerBottom,-11.99),material(deskGrain,'#7d5aae'),"interior-content",1,1);
  // This floor is independent of the illustrated desktop crop; no source row is folded into a floor.
  const roomPlanes=[new T.Vector4(1,0,-k,0),new T.Vector4(-1,0,0,left),new T.Vector4(0,0,1,endDepth),new T.Vector4(0,0,-1,back),new T.Vector4(0,-1,0,floor),new T.Vector4(0,1,-ceilingSlope,-ceiling-ceilingSlope*endDepth)];
  const uniforms={inverseProjection:{value:new T.Matrix4()},cameraWorld:{value:new T.Matrix4()},origin:{value:new T.Vector3()},forward:{value:new T.Vector3()},planes:{value:roomPlanes},nearDistance:{value:.02},entrySlope:{value:k},entryNear:{value:endDepth},entryFar:{value:entryBack}};
  const rayMaterial=new T.ShaderMaterial({uniforms,colorWrite:false,depthWrite:false,depthTest:false,stencilWrite:true,stencilRef:1,stencilFunc:T.AlwaysStencilFunc,stencilZPass:T.ReplaceStencilOp,vertexShader:'varying vec2 screenUv;void main(){screenUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`precision highp float;varying vec2 screenUv;uniform mat4 inverseProjection,cameraWorld;uniform vec3 origin,forward;uniform vec4 planes[6];uniform float nearDistance,entrySlope,entryNear,entryFar;const float EPS=.00002;
bool entry(vec3 p){return abs(p.x-entrySlope*p.z)<.0001&&p.z< -entryNear+EPS&&p.z> -entryFar-EPS;}
void main(){vec4 q=cameraWorld*inverseProjection*vec4(screenUv*2.-1.,1.,1.);vec3 d=normalize(q.xyz/q.w-origin);float lo=0.,hi=10000.;for(int i=0;i<6;i++){float a=dot(planes[i].xyz,origin)+planes[i].w,v=dot(planes[i].xyz,d);if(abs(v)<1.e-8){if(a>EPS)discard;}else{float t=-a/v;if(v<0.)lo=max(lo,t);else hi=min(hi,t);}}float tn=nearDistance/max(.00001,dot(d,forward));if(hi<=max(lo,tn)+EPS)discard;if(lo>tn+EPS&&!entry(origin+d*lo))discard;if(entry(origin+d*hi))discard;gl_FragColor=vec4(1.);}`});
  const rayMask=new T.Mesh(new T.PlaneGeometry(2,2),rayMaterial);rayMask.renderOrder=-10;rayMask.frustumCulled=false;stage.add(rayMask);
  const earlySide=2.1*aspect/(1920/1080);
  // Keep looking into the open exterior until the front is behind us, then discover
  // the fixed room through the real entry. Under-aiming here made the right wall the subject.
  const cameraKeys=[{p:0,position:V(0,0,0),yaw:0,fov:48},{p:.12,position:V(-earlySide,0,-.3),yaw:-12.4,fov:33.8},{p:.18,position:V(-earlySide,.4,-2.2),yaw:-9,fov:40},{p:.27,position:V(-1.1,1.3,-3.8),yaw:0,fov:48},{p:.30,position:V(-1.2,1.3,-4.5),yaw:0,fov:48},{p:.35,position:V(-1.3,1.3,-5.4),yaw:40,fov:48},{p:.43,position:V(-1.6,1.25,-6.2),yaw:49,fov:48},{p:.68,position:V(-8.4,.8,-7),yaw:3.4,fov:48},{p:1,position:endEye,yaw:0,fov:48}];
  const belowBaseCeiling=(v:T.Vector3)=>{const clearance=ceilingAt(v.z)-v.y;if(clearance< -1e-6)throw Error('Hero camera/B crosses the conservative ceiling domain');ceilingState.baseClearance=Math.min(ceilingState.baseClearance,clearance);};
  cameraKeys.forEach(key=>belowBaseCeiling(key.position));
  canonicalRoom.root.updateWorldMatrix(true,true);canonicalRoom.root.traverse(object=>{if((object as T.Mesh).isMesh){const position=(object as T.Mesh).geometry.getAttribute('position');for(let i=0;i<position.count;i++)belowBaseCeiling(new T.Vector3().fromBufferAttribute(position,i).applyMatrix4(object.matrixWorld).applyMatrix4(inverseNormalization));}});
  // The base cell is a conservative domain for B contents, not the deformed roof's exact volume.
  // The downward intrados can cover upper B background; its actual triangles own that occlusion
  // by ordinary depth. Protected people/objects are checked against those triangles, not this half-space.
  function cameraAt(p:number){let i=cameraKeys.findIndex((_v,i)=>i<cameraKeys.length-1&&p<=cameraKeys[i+1].p);if(i<0)i=cameraKeys.length-2;const a=cameraKeys[i],b=cameraKeys[i+1],t=smooth(a.p,b.p,p);camera.position.copy(a.position).lerp(b.position,t);camera.rotation.set(0,T.MathUtils.degToRad(T.MathUtils.lerp(a.yaw,b.yaw,t)),0);camera.fov=T.MathUtils.lerp(a.fov,b.fov,t);camera.updateProjectionMatrix();camera.updateMatrixWorld();}
  stage.matrixAutoUpdate=false;stage.matrix.copy(normalization);stage.updateMatrixWorld(true);
  const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>([leftMat,rightMat]);
  stage.traverse(object=>{if((object as T.Mesh).isMesh){const mesh=object as T.Mesh;geometries.add(mesh.geometry);for(const value of Array.isArray(mesh.material)?mesh.material:[mesh.material])materials.add(value);}});
  function syncView(output:T.PerspectiveCamera){
   uniforms.inverseProjection.value.copy(output.projectionMatrixInverse);
   // Keep the frozen room-envelope shader in prototype units, including caller view adjustments.
   uniforms.cameraWorld.value.copy(inverseNormalization).multiply(output.matrixWorld);
   uniforms.origin.value.copy(output.position).applyMatrix4(inverseNormalization);
   output.getWorldDirection(uniforms.forward.value).transformDirection(inverseNormalization);
   uniforms.nearDistance.value=output.near/scale;
  }
  return{update(progress,output){
   const p=T.MathUtils.clamp(progress,0,1);cameraAt(p);unfoldCeiling(p);exteriorBlend.value=smooth(0,.06,p);output.userData.heroCeiling=ceilingState;
   output.position.copy(camera.position).applyMatrix4(normalization);output.quaternion.copy(rotation).multiply(camera.quaternion);output.up.copy(camera.up).applyQuaternion(rotation);output.scale.setScalar(1);
   output.clearViewOffset();output.fov=camera.fov;output.aspect=aspect;output.near=.02*scale;output.far=120*scale;output.updateProjectionMatrix();output.updateMatrixWorld(true);
   syncView(output);
   stage.updateMatrixWorld(true);
  },syncView,setActive(value){stage.visible=value;},dispose(){stage.removeFromParent();geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());deskGrain.dispose();}};
 }
 function rebuild(){if(!loaded||disposed)return;built?.dispose();built=undefined;built=build(loaded);setRoomStencil(active);}
 function dispose(){if(disposed)return;disposed=true;built?.dispose();built=undefined;textures.forEach(texture=>texture.dispose());textures.clear();for(const [material,state]of originalStencil)Object.assign(material,state);}
 const loader=new T.TextureLoader();
 const ready=Promise.all([
  '/images/our-universe-scene.webp',options.portrait,options.portraitMask??'/images/approved-couple-room/character-opacity-mask.png',
  '/images/approved-couple-room/hero-near-source-alpha.png','/images/approved-couple-room/hero-near-repaired-alpha.png','/images/approved-couple-room/hero-cosmic-disocclusion-plate.png',
  '/images/approved-couple-room/warm-plaster-material.png','/images/approved-couple-room/burgundy-plaster-material.png','/images/approved-couple-room/honeywood-material.png',
 ].map(path=>loader.loadAsync(path).then(texture=>{if(disposed)texture.dispose();else textures.add(texture);return texture;}))).then(async maps=>{
  await canonicalRoom.ready;if(disposed)return;
  for(const i of[0,1,5,6,7,8])maps[i].colorSpace=T.SRGBColorSpace;for(const i of[2,3,4])maps[i].colorSpace=T.NoColorSpace;
  for(const i of[6,7,8])maps[i].wrapS=maps[i].wrapT=T.RepeatWrapping;
  loaded=maps;rebuild();
 }).catch(error=>{dispose();throw error;});
 return{ready,update(progress:number,camera:T.PerspectiveCamera){if(!disposed&&active)built?.update(progress,camera);},syncView(camera:T.PerspectiveCamera){if(!disposed&&active)built?.syncView(camera);},resize(nextWidth:number,nextHeight:number){if(width===nextWidth&&height===nextHeight)return;width=nextWidth;height=nextHeight;rebuild();},setActive(value:boolean){if(disposed)return;active=value;built?.setActive(value);if(built)setRoomStencil(value);},dispose};
}

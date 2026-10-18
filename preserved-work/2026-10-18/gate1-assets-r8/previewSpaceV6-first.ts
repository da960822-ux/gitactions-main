import {sampleShellTwist,type ShellTwistSample} from './shellTwist';
import {floorSupportShape,sampleFloorSupport,type SupportSample} from './floorSupportV6';
import {applyRigidPose,portraitStagePose,heroHingePose} from './stageMotion';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {EXRLoader} from 'three/addons/loaders/EXRLoader.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {cameraPose,clamp01,smoothRange,surfaceWeights,type FoldPose} from './poseSpaceV6';
export type WorldOptions={width:number;height:number;pixelRatio:number;portrait:string;surfaceFilm?:string;onFrame?:(data:Record<string,string>)=>void};
export type LandingSceneModule={root:T.Group;anchor:T.Vector3;setSelected?:(id:string)=>void;setInputEnabled?:(enabled:boolean)=>void;dispose:()=>void};
export const CHAMBER_RENDER_CONTRACT={assetVersion:'chamber-r8.space-v6',storageScale:1,unitToIrradiance:Math.PI,bakePoses:[0,.43,1],diffuse:'baked-only',environment:'authored-probe-specular-only',normalUV:0,normalFlipY:false,diffuseFlipY:true}as const;
const ASSET='/models/folded-chamber-v7/';

export function createFoldedWorld(canvas:HTMLCanvasElement,options:WorldOptions){
 let disposed=false,width=options.width,height=options.height,lastSignature='',lastShadowPose='',lastFloorPose='';
 const owned=new Set<{dispose:()=>void}>(),start=performance.now(),marks:Record<string,number>={};
 const keep=<A extends{dispose:()=>void}>(a:A)=>{if(disposed)a.dispose();else owned.add(a);return a;};
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(options.pixelRatio);renderer.setSize(width,height,false);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.AgXToneMapping;renderer.toneMappingExposure=1;renderer.info.autoReset=false;
 const fenceGL=renderer.getContext()as WebGL2RenderingContext;let pendingFence:WebGLSync|null=null,skippedWhilePending=0;const resetFence=()=>{pendingFence=null;lastSignature='';};canvas.addEventListener('webglcontextlost',resetFence);canvas.addEventListener('webglcontextrestored',resetFence);
 const scene=new T.Scene();scene.background=new T.Color('#080b11');
 const camera=new T.PerspectiveCamera(38,width/height,.1,400);
 const twistMeshes:{mesh:T.Mesh;positions:Float32Array;normals:Float32Array;inverse:T.Matrix4;normalInverse:T.Matrix3}[]=[],twistSample:ShellTwistSample={x:0,z:0,xx:0,xz:0,zx:0,zz:0},workPosition=new T.Vector3(),workNormal=new T.Vector3();
 const portraitRig=new T.Group(),shellRig=new T.Group();portraitRig.name='PORTRAIT_AND_ROOTED_STAGE';shellRig.name='HERO_FINISHED_HINGE';scene.add(portraitRig,shellRig);
 const progressUniform={value:0},environmentMix={value:0},apertureMix={value:0},environmentArrival={value:null as T.Texture|null};
 const textureLoader=new T.TextureLoader(),exrLoader=new EXRLoader();
 const loadNormal=(file:string)=>textureLoader.loadAsync(ASSET+file).then(t=>{keep(t);t.flipY=CHAMBER_RENDER_CONTRACT.normalFlipY;t.colorSpace=T.NoColorSpace;t.generateMipmaps=true;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return t;});
 const loadDiffuse=(file:string)=>exrLoader.loadAsync(ASSET+file).then(t=>{keep(t);t.flipY=CHAMBER_RENDER_CONTRACT.diffuseFlipY;t.colorSpace=T.NoColorSpace;t.generateMipmaps=false;t.minFilter=t.magFilter=T.LinearFilter;return t;});
 const hdrLoader=new HDRLoader(),pmrem=new T.PMREMGenerator(renderer);pmrem.compileEquirectangularShader();
 const environments=Promise.all(['hero-environment','arrival-environment','hero-indirect','arrival-indirect'].map(async name=>{const source=await hdrLoader.loadAsync('/models/folded-chamber-r8-space-v6/'+name+'.hdr');source.mapping=T.EquirectangularReflectionMapping;if(disposed){source.dispose();return null;}const map=keep(pmrem.fromEquirectangular(source)).texture;map.name='space-v2-'+name+'-authored-probe';source.dispose();return map;})).then(([hero,arrival,indirectHero,indirectArrival])=>{pmrem.dispose();environmentArrival.value=arrival;return[hero,arrival,hero,arrival,indirectHero,indirectArrival];},error=>{pmrem.dispose();throw error;});
 RectAreaLightUniformsLib.init();
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
 const supportMeshes:{mesh:T.Mesh;positions:Float32Array;normals:Float32Array}[]=[],supportSample:SupportSample={height:0,dx:0,dy:0,dz:0};
 const lightingCards:T.Mesh[]=[],floorReceivers:T.Mesh[]=[],moving:{mesh:T.Mesh;kind:string}[]=[],materials:T.MeshStandardMaterial[]=[];
 const reflection=new Reflector(keep(new T.PlaneGeometry(58,70)),{textureWidth:768,textureHeight:512,multisample:0,clipBias:.003});
 reflection.name='LIVE_PHYSICAL_FLOOR_REFLECTION';reflection.rotation.x=-Math.PI/2;reflection.position.set(-1,-3.319,-13);reflection.renderOrder=-100;reflection.frustumCulled=false;
 const reflectedTexture=reflection.getRenderTarget().texture;reflectedTexture.generateMipmaps=false;reflectedTexture.minFilter=T.LinearFilter;
 const mirrorMaterial=reflection.material as T.ShaderMaterial;mirrorMaterial.colorWrite=false;mirrorMaterial.depthWrite=false;
 // Linear-light 4x4 low-pass before downsampling, then densely sampled Gaussian.
 // No sparse wide tap offsets or box-filtered mip blocks; reflection energy is normalized.
 const filterTargets=[0,1,2].map(()=>keep(new T.WebGLRenderTarget(192,128,{type:T.HalfFloatType,depthBuffer:false,stencilBuffer:false})));
 const filterMaterial=keep(new T.ShaderMaterial({uniforms:{inputMap:{value:reflectedTexture},stepUV:{value:new T.Vector2()},sigma:{value:8},prefilter:{value:1}},vertexShader:'varying vec2 filterUV;void main(){filterUV=position.xy*.5+.5;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`uniform sampler2D inputMap;uniform vec2 stepUV;uniform float sigma;uniform int prefilter;varying vec2 filterUV;void main(){vec3 c=vec3(0.);float total=0.;if(prefilter==1){for(int y=0;y<4;y++)for(int x=0;x<4;x++){c+=texture2D(inputMap,filterUV+(vec2(float(x),float(y))-1.5)*vec2(1./768.,1./512.)).rgb;}c/=16.;}else{for(int i=-24;i<=24;i++){float a=float(i);float w=exp(-.5*a*a/(sigma*sigma));c+=texture2D(inputMap,clamp(filterUV+stepUV*a,vec2(.0001),vec2(.9999))).rgb*w;total+=w;}c/=total;}gl_FragColor=vec4(c,1.);}`,depthTest:false,depthWrite:false,toneMapped:false}));
 const filterGeometry=keep(new T.BufferGeometry());filterGeometry.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));const filterScene=new T.Scene(),filterCamera=new T.Camera();filterScene.add(new T.Mesh(filterGeometry,filterMaterial));
 function filterReflection(){const target=renderer.getRenderTarget(),viewport=renderer.getViewport(new T.Vector4());try{filterMaterial.uniforms.prefilter.value=1;filterMaterial.uniforms.inputMap.value=reflectedTexture;renderer.setRenderTarget(filterTargets[0]);renderer.render(filterScene,filterCamera);filterMaterial.uniforms.prefilter.value=0;filterMaterial.uniforms.sigma.value=Math.max(.6,.31*.31*128/Math.tan(T.MathUtils.degToRad(camera.fov/2))*.30);filterMaterial.uniforms.inputMap.value=filterTargets[0].texture;filterMaterial.uniforms.stepUV.value.set(1/192,0);renderer.setRenderTarget(filterTargets[1]);renderer.render(filterScene,filterCamera);filterMaterial.uniforms.inputMap.value=filterTargets[1].texture;filterMaterial.uniforms.stepUV.value.set(0,1/128);renderer.setRenderTarget(filterTargets[2]);renderer.render(filterScene,filterCamera);}finally{renderer.setRenderTarget(target);renderer.setViewport(viewport);}}
 const originalReflection=reflection.onBeforeRender.bind(reflection);
 reflection.onBeforeRender=(...args)=>{const visibility=floorReceivers.map(m=>m.visible),cardVisibility=lightingCards.map(m=>m.visible);floorReceivers.forEach(m=>{m.visible=false;});lightingCards.forEach(m=>{m.visible=true;});try{originalReflection(...args);mirrorMatrix.value.copy(mirrorMaterial.uniforms.textureMatrix.value).multiply(mirrorInverse.copy(reflection.matrixWorld).invert());filterReflection();}finally{floorReceivers.forEach((m,i)=>{m.visible=visibility[i];});lightingCards.forEach((m,i)=>{m.visible=cardVisibility[i];});}};
 scene.add(reflection);
 // Prototype: dense energy-normalized angular Gaussian approximates GGX; all physical source reflections remain.
 // Reflector's matrix includes its own plane transform; floor vertices are already in world space.
 const mirrorMap={value:filterTargets[2].texture},mirrorMatrix={value:new T.Matrix4()},mirrorInverse=new T.Matrix4();
 let film:HTMLVideoElement|undefined,filmTexture:T.VideoTexture|undefined,lastFilmTime=-1;
 const invalidate=()=>{lastSignature='';};
 if(options.surfaceFilm){film=document.createElement('video');film.src=options.surfaceFilm;film.muted=true;film.playsInline=true;film.preload='auto';filmTexture=keep(new T.VideoTexture(film));filmTexture.colorSpace=T.SRGBColorSpace;film.addEventListener('seeked',invalidate);film.addEventListener('loadeddata',invalidate);film.load();}
 // shortcut: three baked poses interpolate indirect light; add samples if motion QA reveals shadow drift.
 const atlasCache=new Map<string,Promise<{maps:T.DataTexture[];normal:T.Texture}>>();
 function atlas(stem:string,normal:string,restOnly=false){
  const key=stem+(restOnly?':rest':'');
  if(!atlasCache.has(key))atlasCache.set(key,Promise.all([Promise.all((restOnly?['0']:['0','0_43','1']).map(p=>loadDiffuse(stem+'-diffuse-'+p+'.exr'))),loadNormal(normal)]).then(([maps,normal])=>({maps:restOnly?[maps[0],maps[0],maps[0]]:maps,normal})));
  return atlasCache.get(key)!;
 }
 const modelReady=Promise.all([new GLTFLoader().loadAsync('/models/folded-chamber-r8-space-v6/chamber.glb'),environments]).then(async([gltf,env])=>{
  if(disposed)return;const root=gltf.scene;root.name='VERSIONED_SHARED_CHAMBER';scene.add(root);const pending:Promise<void>[]=[],areaSources=new Set<string>(),hingeRoots=new Set<T.Object3D>(),stageRoots=new Set<T.Object3D>();
  root.traverse(object=>{
   if(!(object instanceof T.Mesh))return;keep(object.geometry);if(object.userData.lighting_card||object.parent?.userData.lighting_card){lightingCards.push(object);object.visible=false;}const areaData=object.userData.rect_area_position?object.userData:object.parent?.userData;{const data=areaData;if(data?.rect_area_position&&!areaSources.has(JSON.stringify(data.rect_area_position))){areaSources.add(JSON.stringify(data.rect_area_position));const size=data.rect_area_size,key=JSON.stringify(data.rect_area_position);
if(key===JSON.stringify([-3.5,6.5,6])){const light=new T.SpotLight(new T.Color().fromArray(data.rect_area_color),data.rect_area_power*size[0]*size[1],40,.9,.4,2);light.position.fromArray(data.rect_area_position);light.target.position.fromArray(data.rect_area_target);light.castShadow=true;light.shadow.mapSize.set(2048,2048);light.shadow.camera.near=.2;light.shadow.camera.far=40;light.shadow.bias=-.0002;light.shadow.normalBias=.035;light.shadow.radius=4;light.shadow.blurSamples=8;scene.add(light,light.target);}else{const area=new T.RectAreaLight(new T.Color().fromArray(data.rect_area_color),data.rect_area_power,size[0],size[1]);area.position.fromArray(data.rect_area_position);area.lookAt(new T.Vector3().fromArray(data.rect_area_target));scene.add(area);}}}
   let rigOwner:T.Object3D|null=object;while(rigOwner&&!rigOwner.userData.hingeRig&&!rigOwner.userData.portraitStage)rigOwner=rigOwner.parent;if(rigOwner?.userData.hingeRig){hingeRoots.add(rigOwner);object.updateWorldMatrix(true,false);const pos=object.geometry.getAttribute('position'),normal=object.geometry.getAttribute('normal'),positions=new Float32Array(pos.count*3),normals=new Float32Array(normal.count*3),normalMatrix=new T.Matrix3().getNormalMatrix(object.matrixWorld);for(let i=0;i<pos.count;i++){workPosition.fromBufferAttribute(pos,i).applyMatrix4(object.matrixWorld);workNormal.fromBufferAttribute(normal,i).applyMatrix3(normalMatrix).normalize();positions.set(workPosition.toArray(),i*3);normals.set(workNormal.toArray(),i*3);}twistMeshes.push({mesh:object,positions,normals,inverse:object.matrixWorld.clone().invert(),normalInverse:normalMatrix.clone().invert()});object.frustumCulled=false;}if(rigOwner?.userData.portraitStage)stageRoots.add(rigOwner);
   let owner:T.Object3D|null=object;while(owner&&!owner.userData.lightmapStem&&!owner.userData.normalMap)owner=owner.parent;
   if(owner?.userData.floorSupport){const pos=object.geometry.getAttribute('position'),normal=object.geometry.getAttribute('normal'),positions=new Float32Array(pos.count*3),normals=new Float32Array(normal.count*3);for(let i=0;i<pos.count;i++){positions.set([pos.getX(i),pos.getY(i),pos.getZ(i)],i*3);normals.set([normal.getX(i),normal.getY(i),normal.getZ(i)],i*3);}pos.setUsage(T.DynamicDrawUsage);normal.setUsage(T.DynamicDrawUsage);object.geometry.computeBoundingSphere();object.geometry.boundingSphere!.radius+=1;object.frustumCulled=false;supportMeshes.push({mesh:object,positions,normals});}
   if(object.morphTargetInfluences)moving.push({mesh:object,kind:String(owner?.userData.motionGroup??object.userData.motionGroup??'shell')});
   const stem=owner?.userData.lightmapStem as string|undefined,unbaked=Boolean(owner?.userData.previewUnbaked),restOnly=Boolean(owner?.userData.restBakeOnly);object.castShadow=!lightingCards.includes(object);object.receiveShadow=true;
   const sourceMaterials=Array.isArray(object.material)?object.material:[object.material];
   const copies=sourceMaterials.map(source=>{
    keep(source);const m=keep(source.clone())as T.MeshStandardMaterial;materials.push(m);const localWine=m.name.includes('Deep burgundy mineral');m.envMap=localWine?env[2]:env[0];m.envMapIntensity=1;
    if(!stem&&owner?.userData.normalMap)pending.push(loadNormal(owner.userData.normalMap).then(t=>{m.normalMap=t;m.normalScale.set(1,object.geometry.hasAttribute('tangent')?1:-1);m.needsUpdate=true;}));
    const copyMaterial=['Warm mineral plaster','Satin graphite stone','Deep burgundy mineral'].some(name=>m.name.includes(name));const floor=m.name.includes('Satin graphite stone');if(floor)floorReceivers.push(object);
    pending.push((stem&&!unbaked?atlas(stem,owner!.userData.normalMap,restOnly):Promise.resolve(undefined)).then(data=>{
     if(data){m.lightMap=data.maps[0];m.lightMapIntensity=Number(owner!.userData.lightmapStorageScale)*Number(owner!.userData.lightmapUnitToIrradiance);m.normalMap=data.normal;m.normalScale.set(1,object.geometry.hasAttribute('tangent')?1:-1);}
     const filmSurface=Boolean(filmTexture&&m.name.includes('woven light'));
     if(filmSurface)m.emissiveMap=filmTexture!;
     m.onBeforeCompile=shader=>{
      shader.vertexShader='varying vec3 vSpaceWorld;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvSpaceWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
      shader.uniforms.uIndirectHero={value:env[4]};shader.uniforms.uIndirectArrival={value:env[5]};shader.uniforms.uShellOpen=apertureMix;
      shader.uniforms.uBakeProgress=progressUniform;shader.uniforms.uEnvMix=localWine?apertureMix:environmentMix;shader.uniforms.uArrivalEnv=localWine?{value:env[3]}:environmentArrival;
      let maps=T.ShaderChunk.lights_fragment_maps;if(data&&!restOnly)maps=maps.replace('iblIrradiance += getIBLIrradiance( geometryNormal );','');if(restOnly){maps=maps.replace('iblIrradiance += getIBLIrradiance( geometryNormal );','iblIrradiance += getIBLIrradiance( geometryNormal )*uShellOpen;').replace('vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;','vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity * (1.0-uShellOpen);');}
      if(data){shader.uniforms.uDiffuseMid={value:data.maps[1]};shader.uniforms.uDiffuseEnd={value:data.maps[2]};maps=maps.replace('vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );',`vec4 lightMapTexel = uBakeProgress < 0.43 ? mix(texture2D(lightMap,vLightMapUv),texture2D(uDiffuseMid,vLightMapUv),uBakeProgress/0.43) : mix(texture2D(uDiffuseMid,vLightMapUv),texture2D(uDiffuseEnd,vLightMapUv),(uBakeProgress-0.43)/0.57);`);}
      shader.fragmentShader='uniform sampler2D uIndirectHero;uniform sampler2D uIndirectArrival;uniform float uShellOpen;varying vec3 vSpaceWorld;uniform float uBakeProgress;uniform float uEnvMix;uniform sampler2D uArrivalEnv;'+(data?'uniform sampler2D uDiffuseMid;uniform sampler2D uDiffuseEnd;':'')+'\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_maps>',maps).replace('#include <envmap_physical_pars_fragment>',T.ShaderChunk.envmap_physical_pars_fragment.replace('vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );','vec4 envMapColor=mix(textureCubeUV(uIndirectHero,envMapRotation*worldNormal,1.0),textureCubeUV(uIndirectArrival,envMapRotation*worldNormal,1.0),smoothstep(12.,55.,-vSpaceWorld.z));').replace('vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );','vec4 envMapColor = mix(textureCubeUV(envMap,envMapRotation*reflectVec,roughness),textureCubeUV(uArrivalEnv,envMapRotation*reflectVec,roughness),smoothstep(12.,55.,-vSpaceWorld.z));'));
      shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\nreflectedLight.directSpecular=vec3(0.);'+(data?(restOnly?'reflectedLight.directDiffuse*=uShellOpen;':'reflectedLight.directDiffuse=vec3(0.);'):''));
      if(copyMaterial)shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat copyZone=(1.-smoothstep(18.,36.,-vSpaceWorld.z))*(1.-smoothstep(-4.,-1.,vSpaceWorld.x));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.016,.006,.014),copyZone);').replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nfloat copyRough=(1.-smoothstep(18.,36.,-vSpaceWorld.z))*(1.-smoothstep(-4.,-1.,vSpaceWorld.x));roughnessFactor=mix(roughnessFactor,.82,copyRough);');
      if(filmSurface)shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','totalEmissiveRadiance += texture2D(emissiveMap,vEmissiveMapUv).rgb*.045;');
      if(floor){
       shader.uniforms.uMirrorMap=mirrorMap;shader.uniforms.uMirrorMatrix=mirrorMatrix;
       shader.vertexShader='uniform mat4 uMirrorMatrix;varying vec4 vMirrorCoord;\n'+shader.vertexShader;
       shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvMirrorCoord=uMirrorMatrix*modelMatrix*vec4(transformed,1.0);');
       shader.fragmentShader='uniform sampler2D uMirrorMap;varying vec4 vMirrorCoord;\n'+shader.fragmentShader;
       shader.fragmentShader=shader.fragmentShader.replace('#include <aomap_fragment>',`#include <aomap_fragment>
        vec2 mu=vMirrorCoord.xy/vMirrorCoord.w;
        if(vMirrorCoord.w>0.0&&all(greaterThanEqual(mu,vec2(0.0)))&&all(lessThanEqual(mu,vec2(1.0)))){
         vec3 mirrorRadiance=texture2D(uMirrorMap,mu).rgb;
         float coplanarWeight=1.-smoothstep(.025,.12,abs(vSpaceWorld.y+3.319));reflectedLight.indirectSpecular=mix(reflectedLight.indirectSpecular,mirrorRadiance*EnvironmentBRDF(geometryNormal,geometryViewDir,material.specularColor,material.specularF90,material.roughness),coplanarWeight);
        }`);
      }
     };
     m.customProgramCacheKey=()=>[Boolean(data),restOnly,floor,filmSurface,copyMaterial,'chamber-r8.space-v6'].join(':');m.needsUpdate=true;
    }));return m;
   });
   object.material=Array.isArray(object.material)?copies:copies[0];
  });for(const obj of stageRoots)portraitRig.attach(obj);await Promise.all(pending);marks.model=performance.now()-start;
 });
 const portraitMaterial=keep(new T.MeshBasicMaterial({transparent:true,alphaTest:.025,toneMapped:false}));
 const portrait=new T.Mesh(keep(new T.PlaneGeometry(5.9,5.9)),portraitMaterial);portrait.name='APPROVED_UNCHANGED_PORTRAIT';portrait.castShadow=true;portrait.position.set(1.85,.03,.05);portraitRig.add(portrait);
 const portraitDepth=keep(new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,alphaTest:.025}));portrait.customDepthMaterial=portraitDepth;
 const portraitReady=textureLoader.loadAsync(options.portrait).then(texture=>{keep(texture);texture.colorSpace=T.SRGBColorSpace;portraitMaterial.map=texture;portraitMaterial.needsUpdate=true;portraitDepth.map=texture;portraitDepth.needsUpdate=true;});
 const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info'),rendererName=debug?String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)):'unreported';
 const ready=Promise.all([modelReady,portraitReady]).then(()=>{if(disposed)return;marks.assets=performance.now()-start;});
 function render(pose:FoldPose){
  if(disposed)return;const signature=[pose.progress,pose.entrance,pose.pointerX,pose.pointerY].map(n=>n.toFixed(4)).join(',');if(signature===lastSignature)return;if(pendingFence){const status=fenceGL.clientWaitSync(pendingFence,0,0);if(status===fenceGL.TIMEOUT_EXPIRED){skippedWhilePending++;return;}fenceGL.deleteSync(pendingFence);pendingFence=null;}lastSignature=signature;
  const p=clamp01(pose.progress),e=clamp01(pose.entrance),cam=cameraPose(p,e,width<760),pointer=1-smoothRange(.25,.6,p),weights=surfaceWeights(p),unfold=weights.aperture;
  camera.fov=38+10*smoothRange(.43,1,p);camera.updateProjectionMatrix();camera.position.set(cam.position[0]+pose.pointerX*.12*pointer,cam.position[1]-pose.pointerY*.06*pointer,cam.position[2]);camera.lookAt(...cam.target as[number,number,number]);
  applyRigidPose(portraitRig,portraitStagePose(p));
  const floorSignature=p.toFixed(6)+':'+e.toFixed(6);
  if(floorSignature!==lastFloorPose){lastFloorPose=floorSignature;for(const item of twistMeshes){const pos=item.mesh.geometry.getAttribute('position'),normal=item.mesh.geometry.getAttribute('normal');for(let i=0;i<pos.count;i++){const k=i*3;sampleShellTwist(item.positions[k],item.positions[k+2],p,e,twistSample);workPosition.set(twistSample.x,item.positions[k+1],twistSample.z).applyMatrix4(item.inverse);pos.setXYZ(i,workPosition.x,workPosition.y,workPosition.z);const nx=item.normals[k],ny=item.normals[k+1],nz=item.normals[k+2];workNormal.set(twistSample.zz*nx-twistSample.zx*nz,ny,-twistSample.xz*nx+twistSample.xx*nz).applyMatrix3(item.normalInverse).normalize();normal.setXYZ(i,workNormal.x,workNormal.y,workNormal.z);}pos.needsUpdate=true;normal.needsUpdate=true;}const shape=floorSupportShape(p);for(const item of supportMeshes){const pos=item.mesh.geometry.getAttribute('position'),normal=item.mesh.geometry.getAttribute('normal');for(let i=0;i<pos.count;i++){const offset=i*3,x=item.positions[offset],y=item.positions[offset+1],z=item.positions[offset+2];sampleFloorSupport(x,y,z+(1-e)*.25,shape,supportSample);pos.setXYZ(i,x,y+supportSample.height,z);const nx=item.normals[offset],ny=item.normals[offset+1],nz=item.normals[offset+2],j=1+supportSample.dy,yy=ny/j,xx=nx-supportSample.dx*yy,zz=nz-supportSample.dz*yy,length=Math.hypot(xx,yy,zz);normal.setXYZ(i,xx/length,yy/length,zz/length);}pos.needsUpdate=true;normal.needsUpdate=true;}}
  if(floorSignature!==lastShadowPose){lastShadowPose=floorSignature;renderer.shadowMap.needsUpdate=true;}

  for(const{mesh,kind}of moving){const dict=mesh.morphTargetDictionary!,influences=mesh.morphTargetInfluences!;if(dict.Space_Unfold!==undefined)influences[dict.Space_Unfold]=(kind==='rail'?weights.rail:weights.aperture)*e;if(dict.Gift_Entry!==undefined)influences[dict.Gift_Entry]=1-e;}
  progressUniform.value=p<=.43?.43*weights.aperture:.43+.57*weights.rail;environmentMix.value=smoothRange(.43,1,p);apertureMix.value=weights.aperture;
  for(const m of materials)m.envMapRotation.y=pose.pointerX*.035*pointer;
  if(film&&film.readyState>=2){const t=smoothRange(.30,1,p)*Math.max(0,(film.duration||4)-1/30);if(Math.abs(t-lastFilmTime)>1/30&&!film.seeking){film.currentTime=t;lastFilmTime=t;}}
  renderer.info.reset();const before=performance.now();renderer.render(scene,camera);pendingFence=fenceGL.fenceSync(fenceGL.SYNC_GPU_COMMANDS_COMPLETE,0);fenceGL.flush();
  options.onFrame?.({progress:p.toFixed(4),entrance:e.toFixed(4),camera:camera.position.toArray().map(n=>n.toFixed(3)).join(','),target:cam.target.map(n=>n.toFixed(3)).join(','),fold:unfold.toFixed(4),renderer:rendererName,drawCalls:String(renderer.info.render.calls),triangles:String(renderer.info.render.triangles),geometries:String(renderer.info.memory.geometries),textures:String(renderer.info.memory.textures),filmTime:film?.currentTime.toFixed(3)||'0',filmReady:String(film?.readyState||0),cpuSubmitMs:(performance.now()-before).toFixed(2),initMarks:JSON.stringify(marks),bufferSize:canvas.width+'x'+canvas.height,assetVersion:CHAMBER_RENDER_CONTRACT.assetVersion,diffuse:'unchanged wing GI; Hero rest bake blended to live light during rigid opening; new-space analytic direct + authored indirect-only IBL preview',normal:'actual radius-dependent nonrigid twist; inverse-transpose normals; new geometry normals analytically transformed with continuous floor field',morphMeshes:String(moving.length),reflectionEmitters:String(lightingCards.length),environmentMap:'authored specular probes plus source-excluded indirect-diffuse probes; world-position blend',reflection:'linear mirrored camera, dense normalized49tap angular Gaussian, floor BRDF',portraitStageMatrix:portraitRig.matrix.toArray().map(n=>n.toFixed(6)).join(','),heroHingeMatrix:shellRig.matrix.toArray().map(n=>n.toFixed(6)).join(','),shellDeformation:'radius-dependent twist: same vertices and topology, determinant1 analytic Jacobian; not a rigid hinge',gpuPendingSkips:String(skippedWhilePending),floorSupport:'same continuous floor mesh, no separate frame/pedestal; .95m broad smooth moving height field',contactShadow:'actual2048 PCF from calibrated Hero key proxy, alpha-tested portrait caster',copyZone:'world-space dark burgundy material; portrait pixels untouched',previewStage:'unapproved low-cost lighting/surface prototype',allocationNote:'VRAM and hardware GPU performance not measured'});
 }
 return{scene,camera,renderer,ready,render,resize(w:number,h:number,dpr:number){width=w;height=h;lastSignature='';renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();},dispose(){disposed=true;canvas.removeEventListener('webglcontextlost',resetFence);canvas.removeEventListener('webglcontextrestored',resetFence);if(pendingFence&&!fenceGL.isContextLost())fenceGL.deleteSync(pendingFence);pendingFence=null;film?.removeEventListener('seeked',invalidate);film?.removeEventListener('loadeddata',invalidate);film?.pause();if(film){film.removeAttribute('src');film.load();}reflection.dispose();owned.forEach(r=>r.dispose());renderer.dispose();}};
}

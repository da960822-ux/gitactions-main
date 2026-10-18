import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {EXRLoader} from 'three/addons/loaders/EXRLoader.js';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {cameraPose,clamp01,smoothRange,type FoldPose} from './pose';
export type WorldOptions={width:number;height:number;pixelRatio:number;portrait:string;surfaceFilm?:string;onFrame?:(data:Record<string,string>)=>void};
export type LandingSceneModule={root:T.Group;anchor:T.Vector3;setSelected?:(id:string)=>void;setInputEnabled?:(enabled:boolean)=>void;dispose:()=>void};
export const CHAMBER_RENDER_CONTRACT={assetVersion:'chamber-v6.1',storageScale:1,unitToIrradiance:Math.PI,bakePoses:[0,.65,1],diffuse:'baked-only',environment:'authored-probe-specular-only',normalUV:0,normalFlipY:false,diffuseFlipY:true}as const;
const ASSET='/models/folded-chamber-v6/';

export function createFoldedWorld(canvas:HTMLCanvasElement,options:WorldOptions){
 let disposed=false,width=options.width,height=options.height,lastSignature='';
 const owned=new Set<{dispose:()=>void}>(),start=performance.now(),marks:Record<string,number>={};
 const keep=<A extends{dispose:()=>void}>(a:A)=>{if(disposed)a.dispose();else owned.add(a);return a;};
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(options.pixelRatio);renderer.setSize(width,height,false);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.AgXToneMapping;renderer.toneMappingExposure=1;renderer.info.autoReset=false;
 const scene=new T.Scene();scene.background=new T.Color('#080b11');
 const camera=new T.PerspectiveCamera(38,width/height,.1,100);
 const progressUniform={value:0},environmentMix={value:0},environmentArrival={value:null as T.Texture|null};
 const textureLoader=new T.TextureLoader(),exrLoader=new EXRLoader(),hdrLoader=new HDRLoader();
 const loadNormal=(file:string)=>textureLoader.loadAsync(ASSET+file).then(t=>{keep(t);t.flipY=CHAMBER_RENDER_CONTRACT.normalFlipY;t.colorSpace=T.NoColorSpace;t.generateMipmaps=true;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return t;});
 const loadDiffuse=(file:string)=>exrLoader.loadAsync(ASSET+file).then(t=>{keep(t);t.flipY=CHAMBER_RENDER_CONTRACT.diffuseFlipY;t.colorSpace=T.NoColorSpace;t.generateMipmaps=false;t.minFilter=t.magFilter=T.LinearFilter;return t;});
 const pmrem=new T.PMREMGenerator(renderer);pmrem.compileEquirectangularShader();
 const environments=Promise.all(['hero','arrival','wine'].map(name=>hdrLoader.loadAsync(ASSET+name+'-environment.hdr').then(source=>{source.mapping=T.EquirectangularReflectionMapping;if(disposed){source.dispose();return null;}const target=keep(pmrem.fromEquirectangular(source));target.texture.name=name+'-authored-probe';source.dispose();return target.texture;}))).then(maps=>{pmrem.dispose();environmentArrival.value=maps[1];return maps;},error=>{pmrem.dispose();throw error;});
 const floorReceivers:T.Mesh[]=[],moving:T.Mesh[]=[],materials:T.MeshStandardMaterial[]=[];
 const reflection=new Reflector(keep(new T.PlaneGeometry(58,70)),{textureWidth:768,textureHeight:512,multisample:0,clipBias:.003});
 reflection.name='LIVE_PHYSICAL_FLOOR_REFLECTION';reflection.rotation.x=-Math.PI/2;reflection.position.set(-1,-3.319,-13);reflection.renderOrder=-100;reflection.frustumCulled=false;
 const mirrorMaterial=reflection.material as T.ShaderMaterial;mirrorMaterial.colorWrite=false;mirrorMaterial.depthWrite=false;
 const originalReflection=reflection.onBeforeRender.bind(reflection);
 reflection.onBeforeRender=(...args)=>{const visibility=floorReceivers.map(m=>m.visible);floorReceivers.forEach(m=>{m.visible=false;});try{originalReflection(...args);mirrorMatrix.value.copy(mirrorMaterial.uniforms.textureMatrix.value).multiply(mirrorInverse.copy(reflection.matrixWorld).invert());}finally{floorReceivers.forEach((m,i)=>{m.visible=visibility[i];});}};
 scene.add(reflection);
 // Reflector's matrix includes its own plane transform; floor vertices are already in world space.
 const mirrorMap={value:reflection.getRenderTarget().texture},mirrorMatrix={value:new T.Matrix4()},mirrorInverse=new T.Matrix4();
 let film:HTMLVideoElement|undefined,filmTexture:T.VideoTexture|undefined,lastFilmTime=-1;
 const invalidate=()=>{lastSignature='';};
 if(options.surfaceFilm){film=document.createElement('video');film.src=options.surfaceFilm;film.muted=true;film.playsInline=true;film.preload='auto';filmTexture=keep(new T.VideoTexture(film));filmTexture.colorSpace=T.SRGBColorSpace;film.addEventListener('seeked',invalidate);film.addEventListener('loadeddata',invalidate);film.load();}
 // shortcut: three baked poses interpolate indirect light; add samples if motion QA reveals shadow drift.
 const atlasCache=new Map<string,Promise<{maps:T.DataTexture[];normal:T.Texture}>>();
 function atlas(stem:string,normal:string){
  if(!atlasCache.has(stem))atlasCache.set(stem,Promise.all([Promise.all(['0','0_65','1'].map(p=>loadDiffuse(stem+'-diffuse-'+p+'.exr'))),loadNormal(normal)]).then(([maps,normal])=>({maps,normal})));
  return atlasCache.get(stem)!;
 }
 const modelReady=Promise.all([new GLTFLoader().loadAsync(ASSET+'chamber.glb'),environments]).then(async([gltf,env])=>{
  if(disposed)return;const root=gltf.scene;root.name='VERSIONED_SHARED_CHAMBER';scene.add(root);const pending:Promise<void>[]=[];
  root.traverse(object=>{
   if(!(object instanceof T.Mesh))return;keep(object.geometry);if(object.morphTargetInfluences)moving.push(object);
   let owner:T.Object3D|null=object;while(owner&&!owner.userData.lightmapStem&&!owner.userData.normalMap)owner=owner.parent;
   const stem=owner?.userData.lightmapStem as string|undefined;
   const sourceMaterials=Array.isArray(object.material)?object.material:[object.material];
   const copies=sourceMaterials.map(source=>{
    keep(source);const m=keep(source.clone())as T.MeshStandardMaterial;materials.push(m);const localWine=m.name.includes('Deep burgundy mineral');m.envMap=localWine?env[2]:env[0];m.envMapIntensity=1;
    if(!stem&&owner?.userData.normalMap)pending.push(loadNormal(owner.userData.normalMap).then(t=>{m.normalMap=t;m.normalScale.set(1,object.geometry.hasAttribute('tangent')?1:-1);m.needsUpdate=true;}));
    const floor=m.name.includes('Satin graphite stone');if(floor)floorReceivers.push(object);
    pending.push((stem?atlas(stem,owner!.userData.normalMap):Promise.resolve(undefined)).then(data=>{
     if(data){m.lightMap=data.maps[0];m.lightMapIntensity=Number(owner!.userData.lightmapStorageScale)*Number(owner!.userData.lightmapUnitToIrradiance);m.normalMap=data.normal;m.normalScale.set(1,object.geometry.hasAttribute('tangent')?1:-1);}
     const filmSurface=Boolean(filmTexture&&m.name.includes('woven light'));
     if(filmSurface)m.emissiveMap=filmTexture!;
     m.onBeforeCompile=shader=>{
      shader.uniforms.uBakeProgress=progressUniform;shader.uniforms.uEnvMix=environmentMix;shader.uniforms.uArrivalEnv=localWine?{value:env[2]}:environmentArrival;
      let maps=T.ShaderChunk.lights_fragment_maps.replace('iblIrradiance += getIBLIrradiance( geometryNormal );','');
      if(data){shader.uniforms.uDiffuseMid={value:data.maps[1]};shader.uniforms.uDiffuseEnd={value:data.maps[2]};maps=maps.replace('vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );',`vec4 lightMapTexel = uBakeProgress < 0.65 ? mix(texture2D(lightMap,vLightMapUv),texture2D(uDiffuseMid,vLightMapUv),uBakeProgress/0.65) : mix(texture2D(uDiffuseMid,vLightMapUv),texture2D(uDiffuseEnd,vLightMapUv),(uBakeProgress-0.65)/0.35);`);}
      shader.fragmentShader='uniform float uBakeProgress;uniform float uEnvMix;uniform sampler2D uArrivalEnv;'+(data?'uniform sampler2D uDiffuseMid;uniform sampler2D uDiffuseEnd;':'')+'\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_maps>',maps).replace('#include <envmap_physical_pars_fragment>',T.ShaderChunk.envmap_physical_pars_fragment.replace('vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );','vec4 envMapColor = mix(textureCubeUV(envMap,envMapRotation*reflectVec,roughness),textureCubeUV(uArrivalEnv,envMapRotation*reflectVec,roughness),uEnvMix);'));
      if(filmSurface)shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','totalEmissiveRadiance += texture2D(emissiveMap,vEmissiveMapUv).rgb*.045;');
      if(floor){
       shader.uniforms.uMirrorMap=mirrorMap;shader.uniforms.uMirrorMatrix=mirrorMatrix;
       shader.vertexShader='uniform mat4 uMirrorMatrix;varying vec4 vMirrorCoord;\n'+shader.vertexShader;
       shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvMirrorCoord=uMirrorMatrix*modelMatrix*vec4(transformed,1.0);');
       shader.fragmentShader='uniform sampler2D uMirrorMap;varying vec4 vMirrorCoord;\n'+shader.fragmentShader;
       shader.fragmentShader=shader.fragmentShader.replace('#include <aomap_fragment>',`#include <aomap_fragment>
        vec2 mu=vMirrorCoord.xy/vMirrorCoord.w;vec2 mt=vec2(1.0/768.0,1.0/512.0);
        vec3 mr=texture2D(uMirrorMap,mu).rgb*.4;
        mr+=(texture2D(uMirrorMap,mu+mt*vec2(2.,3.)).rgb+texture2D(uMirrorMap,mu-mt*vec2(2.,3.)).rgb+texture2D(uMirrorMap,mu+mt*vec2(-2.,3.)).rgb+texture2D(uMirrorMap,mu-mt*vec2(-2.,3.)).rgb)*.15;
        float mf=.04+.96*pow(1.0-saturate(dot(geometryNormal,geometryViewDir)),5.0);
        reflectedLight.indirectSpecular=mix(reflectedLight.indirectSpecular,mr*mf*(1.0-material.roughness*.7),.85);`);
      }
     };
     m.customProgramCacheKey=()=>[Boolean(data),floor,filmSurface,'chamber-v6.1'].join(':');m.needsUpdate=true;
    }));return m;
   });
   object.material=Array.isArray(object.material)?copies:copies[0];
  });await Promise.all(pending);marks.model=performance.now()-start;
 });
 const portraitMaterial=keep(new T.MeshBasicMaterial({transparent:true,alphaTest:.025,toneMapped:false}));
 const portrait=new T.Mesh(keep(new T.PlaneGeometry(5.9,5.9)),portraitMaterial);portrait.name='APPROVED_UNCHANGED_PORTRAIT';portrait.position.set(1.85,.03,.05);scene.add(portrait);
 const portraitReady=textureLoader.loadAsync(options.portrait).then(texture=>{keep(texture);texture.colorSpace=T.SRGBColorSpace;portraitMaterial.map=texture;portraitMaterial.needsUpdate=true;});
 const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info'),rendererName=debug?String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)):'unreported';
 const ready=Promise.all([modelReady,portraitReady]).then(()=>{if(disposed)return;marks.assets=performance.now()-start;});
 function render(pose:FoldPose){
  if(disposed)return;const signature=[pose.progress,pose.entrance,pose.pointerX,pose.pointerY].map(n=>n.toFixed(4)).join(',');if(signature===lastSignature)return;lastSignature=signature;
  const p=clamp01(pose.progress),e=clamp01(pose.entrance),cam=cameraPose(p,e,width<760),pointer=1-smoothRange(.25,.6,p),unfold=smoothRange(.15,.85,p);
  camera.fov=38+10*smoothRange(.4,1,p);camera.updateProjectionMatrix();camera.position.set(cam.position[0]+pose.pointerX*.12*pointer,cam.position[1]-pose.pointerY*.06*pointer,cam.position[2]);camera.lookAt(...cam.target as[number,number,number]);
  for(const mesh of moving){const dict=mesh.morphTargetDictionary!,weights=mesh.morphTargetInfluences!;weights[dict.Space_Unfold]=unfold*e;weights[dict.Gift_Entry]=1-e;}
  progressUniform.value=p;environmentMix.value=smoothRange(.2,1,p);
  for(const m of materials)m.envMapRotation.y=pose.pointerX*.035*pointer;
  if(film&&film.readyState>=2){const t=smoothRange(.30,1,p)*Math.max(0,(film.duration||4)-1/30);if(Math.abs(t-lastFilmTime)>1/30&&!film.seeking){film.currentTime=t;lastFilmTime=t;}}
  renderer.info.reset();const before=performance.now();renderer.render(scene,camera);
  options.onFrame?.({progress:p.toFixed(4),entrance:e.toFixed(4),camera:camera.position.toArray().map(n=>n.toFixed(3)).join(','),target:cam.target.map(n=>n.toFixed(3)).join(','),fold:unfold.toFixed(4),renderer:rendererName,drawCalls:String(renderer.info.render.calls),triangles:String(renderer.info.render.triangles),geometries:String(renderer.info.memory.geometries),textures:String(renderer.info.memory.textures),filmTime:film?.currentTime.toFixed(3)||'0',filmReady:String(film?.readyState||0),cpuSubmitMs:(performance.now()-before).toFixed(2),initMarks:JSON.stringify(marks),bufferSize:canvas.width+'x'+canvas.height,assetVersion:CHAMBER_RENDER_CONTRACT.assetVersion,diffuse:'three pose Cycles bake; storage 1 × PI unit conversion; no runtime diffuse',normal:'Blender tangent bake, same TEXCOORD_0, no repeat',morphMeshes:String(moving.length),environmentMap:'same-scene HDR probes; specular only',reflection:'linear mirrored camera, floor BRDF integration',allocationNote:'VRAM and hardware GPU performance not measured'});
 }
 return{scene,camera,renderer,ready,render,resize(w:number,h:number,dpr:number){width=w;height=h;lastSignature='';renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();},dispose(){disposed=true;film?.removeEventListener('seeked',invalidate);film?.removeEventListener('loadeddata',invalidate);film?.pause();if(film){film.removeAttribute('src');film.load();}reflection.dispose();owned.forEach(r=>r.dispose());renderer.dispose();}};
}

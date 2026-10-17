import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {cameraPose,clamp01,smoothRange,type FoldPose} from './pose';
export type WorldOptions={width:number;height:number;pixelRatio:number;portrait:string;surfaceFilm?:string;onFrame?:(data:Record<string,string>)=>void};
export type LandingSceneModule={root:T.Group;anchor:T.Vector3;setSelected?:(id:string)=>void;setInputEnabled?:(enabled:boolean)=>void;dispose:()=>void};
const ASSET='/models/folded-alcove/';

export function createFoldedWorld(canvas:HTMLCanvasElement,options:WorldOptions){
 let disposed=false;
 const start=performance.now(),owned=new Set<{dispose:()=>void}>(),marks:Record<string,number>={};
 const keep=<A extends{dispose:()=>void}>(a:A)=>{if(disposed)a.dispose();else owned.add(a);return a;};
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(options.pixelRatio);renderer.setSize(options.width,options.height,false);
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.shadowMap.autoUpdate=false;renderer.info.autoReset=false;
 const scene=new T.Scene();scene.background=new T.Color('#120d12');scene.fog=new T.FogExp2('#120d12',.006);
 const camera=new T.PerspectiveCamera(38,options.width/options.height,.1,100);
 marks.renderer=performance.now()-start;
 const environmentScene=new RoomEnvironment(),pmrem=new T.PMREMGenerator(renderer),environment=keep(pmrem.fromScene(environmentScene,.04,.1,100,{size:128}));
 scene.environment=environment.texture;scene.environmentIntensity=.25;environmentScene.dispose();pmrem.dispose();
 RectAreaLightUniformsLib.init();
 const key=new T.RectAreaLight('#fff0dc',1.15,7,5);key.position.set(-3,6,7);key.lookAt(1,-1,-3);scene.add(key);
 const far=new T.RectAreaLight('#ffd6a1',1.5,5,4);far.position.set(-4,5,-22);far.lookAt(-4,-2,-22);scene.add(far);
 const shadowLight=new T.DirectionalLight('#ffe5cb',.6);shadowLight.position.set(-4,7,8);shadowLight.target.position.set(1,-1,-4);shadowLight.castShadow=true;
 shadowLight.shadow.mapSize.set(1024,1024);Object.assign(shadowLight.shadow.camera,{left:-8,right:9,top:9,bottom:-6,near:.5,far:35});shadowLight.shadow.normalBias=.018;shadowLight.shadow.bias=-.0004;scene.add(shadowLight,shadowLight.target);
 // A true mirrored camera supplies floor reflections. Roughness is a bounded soft blur, never wave distortion.
 const reflectionShader={name:'RoughTruePlanarReflection',uniforms:{color:{value:new T.Color('#30252b')},tDiffuse:{value:null},textureMatrix:{value:new T.Matrix4()},blurTexel:{value:new T.Vector2(1/768,1/512)}},vertexShader:'uniform mat4 textureMatrix; varying vec4 vUv; void main(){vUv=textureMatrix*vec4(position,1.); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`
 uniform sampler2D tDiffuse;uniform vec2 blurTexel;varying vec4 vUv;
 void main(){vec2 uv=vUv.xy/vUv.w;vec3 c=texture2D(tDiffuse,uv).rgb*.20;
 c+=texture2D(tDiffuse,uv+blurTexel*vec2(2.,0.)).rgb*.12;c+=texture2D(tDiffuse,uv-blurTexel*vec2(2.,0.)).rgb*.12;
 c+=texture2D(tDiffuse,uv+blurTexel*vec2(0.,3.)).rgb*.12;c+=texture2D(tDiffuse,uv-blurTexel*vec2(0.,3.)).rgb*.12;
 c+=texture2D(tDiffuse,uv+blurTexel*vec2(4.,5.)).rgb*.08;c+=texture2D(tDiffuse,uv-blurTexel*vec2(4.,5.)).rgb*.08;
 c+=texture2D(tDiffuse,uv+blurTexel*vec2(-4.,5.)).rgb*.08;c+=texture2D(tDiffuse,uv-blurTexel*vec2(-4.,5.)).rgb*.08;
 gl_FragColor=vec4(c,.19);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`};
 const reflection=new Reflector(keep(new T.PlaneGeometry(58,70)),{textureWidth:768,textureHeight:512,multisample:0,clipBias:.003,shader:reflectionShader});
 reflection.name='LIVE_ROUGH_FLOOR_REFLECTION';reflection.rotation.x=-Math.PI/2;reflection.position.set(-1,-3.34,-13);
 const reflectionMaterial=reflection.material as T.ShaderMaterial;reflectionMaterial.transparent=true;reflectionMaterial.depthWrite=false;reflectionMaterial.toneMapped=true;scene.add(reflection);
 const textureLoader=new T.TextureLoader(),lightmaps=new Map<string,Promise<T.Texture>>();
 const load=(url:string)=>textureLoader.loadAsync(url).then(t=>{keep(t);return t;});
 const normal=load(ASSET+'plaster-normal.png').then(t=>{t.flipY=false;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(65,65);return t;});
 const brush=load(ASSET+'brushed-normal.png').then(t=>{t.flipY=false;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(80,30);return t;});
 const moving:T.Mesh[]=[];let width=options.width,height=options.height,lastSignature='',lastShadow='',root:T.Group|undefined;
 let film:HTMLVideoElement|undefined,filmTexture:T.VideoTexture|undefined,lastFilmTime=-1;
 const invalidate=()=>{lastSignature='';};
 if(options.surfaceFilm){film=document.createElement('video');film.src=options.surfaceFilm;film.muted=true;film.playsInline=true;film.preload='auto';filmTexture=keep(new T.VideoTexture(film));filmTexture.colorSpace=T.SRGBColorSpace;film.addEventListener('seeked',invalidate);film.addEventListener('loadeddata',invalidate);}
 const modelReady=new GLTFLoader().loadAsync(ASSET+'alcove.glb').then(async gltf=>{
  root=gltf.scene;root.name='AUTHORED_ALCOVE_ARCHITECTURE';scene.add(root);const pending:Promise<unknown>[]=[];
  root.traverse(object=>{if(!(object instanceof T.Mesh))return;keep(object.geometry);object.castShadow=object.name.includes('Alcove');object.receiveShadow=true;
   if(object.morphTargetInfluences)moving.push(object);
   let owner:T.Object3D| null=object;while(owner&&!owner.userData.lightmap)owner=owner.parent;
   const file=owner?.userData.lightmap as string|undefined;
   // The far room already contains the baked area-light shadows; the stage key must not add hard projected silhouettes there.
   object.receiveShadow=file!=='room-irradiance.png';
   if(file&&!lightmaps.has(file))lightmaps.set(file,load(ASSET+file).then(t=>{t.flipY=false;return t;}));
   for(const material of(Array.isArray(object.material)?object.material:[object.material])){
    const m=material as T.MeshStandardMaterial;keep(m);if(!(m instanceof T.MeshStandardMaterial))continue;
    const metal=m.metalness>.8;
    pending.push((metal?brush:normal).then(t=>{m.normalMap=t;m.normalScale.setScalar(metal?.045:.022);m.needsUpdate=true;}));
    m.envMapIntensity=metal?1.3:.45;
    if(file)pending.push(lightmaps.get(file)!.then(t=>{m.lightMap=t;m.lightMapIntensity=3;m.needsUpdate=true;}));
    if(filmTexture&&m.name.includes('Warm_IntegratedLight')){
     m.emissiveMap=filmTexture;
     // The exported constant lighting stays lit; the real film adds a small moving caustic on its physical strip.
     m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','totalEmissiveRadiance += texture2D(emissiveMap, vEmissiveMapUv).rgb * .12;');};
    }
   }
  });await Promise.all(pending);marks.model=performance.now()-start;
 });
 const portraitGroup=new T.Group();portraitGroup.name='APPROVED_PORTRAIT';scene.add(portraitGroup);
 const portraitMaterial=keep(new T.MeshBasicMaterial({transparent:true,alphaTest:.025,toneMapped:false}));
 const portrait=new T.Mesh(keep(new T.PlaneGeometry(5.9,5.9)),portraitMaterial);portrait.position.set(1.85,.03,.05);portrait.name='PORTRAIT_01_UNCHANGED_RGBA';portrait.castShadow=true;portraitGroup.add(portrait);
 const portraitReady=load(options.portrait).then(texture=>{texture.colorSpace=T.SRGBColorSpace;portraitMaterial.map=texture;portraitMaterial.needsUpdate=true;});
 const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info'),rendererName=debug?String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)):'unreported';
 const ready=Promise.all([modelReady,portraitReady]).then(()=>{if(disposed)return;marks.assets=performance.now()-start;renderer.compile(scene,camera);});
 function render(pose:FoldPose){
  if(disposed)return;const signature=[pose.progress,pose.entrance,pose.pointerX,pose.pointerY].map(n=>n.toFixed(4)).join(',');if(signature===lastSignature)return;lastSignature=signature;
  const p=clamp01(pose.progress),e=clamp01(pose.entrance),cam=cameraPose(p,e,width<760),pointer=1-smoothRange(.25,.6,p),unfold=smoothRange(.18,.72,p);
  camera.fov=38+10*smoothRange(.4,1,p);camera.updateProjectionMatrix();
  camera.position.set(cam.position[0]+pose.pointerX*.12*pointer,cam.position[1]-pose.pointerY*.06*pointer,cam.position[2]);camera.lookAt(...cam.target as[number,number,number]);
  for(const mesh of moving){const dict=mesh.morphTargetDictionary!,weights=mesh.morphTargetInfluences!;weights[dict.Space_Unfold]=unfold*e;weights[dict.Gift_Entry]=1-e;}
  portraitGroup.position.y=(1-e)*-.16;key.position.x=-3+pose.pointerX*.8;key.position.y=6-pose.pointerY*.45;key.lookAt(1,-1,-3);
  if(film&&film.readyState>=2){const t=smoothRange(.30,1,p)*Math.max(0,(film.duration||4)-1/30);if(Math.abs(t-lastFilmTime)>1/30&&!film.seeking){film.currentTime=t;lastFilmTime=t;}}
  const shadowSignature=[p,e].map(n=>n.toFixed(4)).join(',');if(shadowSignature!==lastShadow){renderer.shadowMap.needsUpdate=true;lastShadow=shadowSignature;}
  renderer.info.reset();const before=performance.now();renderer.render(scene,camera);
  options.onFrame?.({progress:p.toFixed(4),entrance:e.toFixed(4),camera:camera.position.toArray().map(n=>n.toFixed(3)).join(','),target:cam.target.map(n=>n.toFixed(3)).join(','),fold:unfold.toFixed(4),renderer:rendererName,drawCalls:String(renderer.info.render.calls),triangles:String(renderer.info.render.triangles),geometries:String(renderer.info.memory.geometries),textures:String(renderer.info.memory.textures),filmTime:film?.currentTime.toFixed(3)||'0',filmReady:String(film?.readyState||0),cpuSubmitMs:(performance.now()-before).toFixed(2),initMarks:JSON.stringify(marks),bufferSize:canvas.width+'x'+canvas.height,shadowMap:'1024x1024, single directional',reflection:'mirrored camera 768x512, nine-tap roughness blur',lightmaps:'Blender CPU physical diffuse irradiance; four receiver atlases',morphMeshes:String(moving.length),environmentMap:'Three RoomEnvironment128 PMREM',allocationNote:'VRAM and hardware GPU performance not measured'});
 }
 return{scene,camera,renderer,ready,render,resize(w:number,h:number,dpr:number){width=w;height=h;lastSignature='';lastShadow='';renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();},dispose(){disposed=true;film?.removeEventListener('seeked',invalidate);film?.removeEventListener('loadeddata',invalidate);film?.pause();if(film){film.removeAttribute('src');film.load();}shadowLight.shadow.map?.dispose();reflection.dispose();owned.forEach(r=>r.dispose());renderer.dispose();}};
}

from pathlib import Path
root=Path('/workspace/yl-folded-playhouse-r8/src/landing/cinematic/folded')
s=Path('/workspace/yl-folded-playhouse-r7/src/landing/cinematic/folded/world.ts').read_text()
s=s.replace("'chamber-v7.0'","'chamber-v7.repair-preview'")
s=s.replace('ASSET+file',"(file.startsWith('repair-')?'/models/folded-chamber-r7-repair/':ASSET)+file")
s=s.replace("const modelReady=Promise.all([new GLTFLoader().loadAsync(ASSET+'chamber.glb'),environments])","const modelReady=Promise.all([new GLTFLoader().loadAsync('/models/folded-chamber-r7-repair/chamber.glb'),environments])")
s=s.replace("hdrLoader.loadAsync(ASSET+name+'-environment.hdr')","hdrLoader.loadAsync(name==='alcove'?'/models/folded-chamber-r7-repair/alcove-environment.hdr':ASSET+name+'-environment.hdr')")
s=s.replace("['hero','arrival','wine','wine-arrival']","['hero','arrival','wine','wine-arrival','alcove']")
s=s.replace("reflectedTexture.generateMipmaps=true;reflectedTexture.minFilter=T.LinearMipmapLinearFilter;","reflectedTexture.generateMipmaps=false;reflectedTexture.minFilter=T.LinearFilter;")
insert="""
 // Linear-light 4x4 low-pass before downsampling, then densely sampled Gaussian.
 // No sparse wide tap offsets or box-filtered mip blocks; reflection energy is normalized.
 const filterTargets=[0,1,2].map(()=>keep(new T.WebGLRenderTarget(192,128,{type:T.HalfFloatType,depthBuffer:false,stencilBuffer:false})));
 const filterMaterial=keep(new T.ShaderMaterial({uniforms:{inputMap:{value:reflectedTexture},stepUV:{value:new T.Vector2()},sigma:{value:8},prefilter:{value:1}},vertexShader:'varying vec2 filterUV;void main(){filterUV=position.xy*.5+.5;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`uniform sampler2D inputMap;uniform vec2 stepUV;uniform float sigma;uniform int prefilter;varying vec2 filterUV;void main(){vec3 c=vec3(0.);float total=0.;if(prefilter==1){for(int y=0;y<4;y++)for(int x=0;x<4;x++){c+=texture2D(inputMap,filterUV+(vec2(float(x),float(y))-1.5)*vec2(1./768.,1./512.)).rgb;}c/=16.;}else{for(int i=-24;i<=24;i++){float a=float(i);float w=exp(-.5*a*a/(sigma*sigma));c+=texture2D(inputMap,clamp(filterUV+stepUV*a,vec2(.0001),vec2(.9999))).rgb*w;total+=w;}c/=total;}gl_FragColor=vec4(c,1.);}`,depthTest:false,depthWrite:false,toneMapped:false}));
 const filterGeometry=keep(new T.BufferGeometry());filterGeometry.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));const filterScene=new T.Scene(),filterCamera=new T.Camera();filterScene.add(new T.Mesh(filterGeometry,filterMaterial));
 function filterReflection(){const target=renderer.getRenderTarget(),viewport=renderer.getViewport(new T.Vector4());try{filterMaterial.uniforms.prefilter.value=1;filterMaterial.uniforms.inputMap.value=reflectedTexture;renderer.setRenderTarget(filterTargets[0]);renderer.render(filterScene,filterCamera);filterMaterial.uniforms.prefilter.value=0;filterMaterial.uniforms.sigma.value=Math.max(.6,.31*.31*128/Math.tan(T.MathUtils.degToRad(camera.fov/2))*.30);filterMaterial.uniforms.inputMap.value=filterTargets[0].texture;filterMaterial.uniforms.stepUV.value.set(1/192,0);renderer.setRenderTarget(filterTargets[1]);renderer.render(filterScene,filterCamera);filterMaterial.uniforms.inputMap.value=filterTargets[1].texture;filterMaterial.uniforms.stepUV.value.set(0,1/128);renderer.setRenderTarget(filterTargets[2]);renderer.render(filterScene,filterCamera);}finally{renderer.setRenderTarget(target);renderer.setViewport(viewport);}}
"""
s=s.replace(' const originalReflection=reflection.onBeforeRender.bind(reflection);',insert+' const originalReflection=reflection.onBeforeRender.bind(reflection);')
s=s.replace('multiply(mirrorInverse.copy(reflection.matrixWorld).invert());}finally','multiply(mirrorInverse.copy(reflection.matrixWorld).invert());filterReflection();}finally')
s=s.replace('const mirrorMap={value:reflection.getRenderTarget().texture}','const mirrorMap={value:filterTargets[2].texture}')
s=s.replace('float mirrorLod=log2(1.0+material.roughness*material.roughness*512.0*.2);\n         vec3 mirrorRadiance=textureLod(uMirrorMap,mu,mirrorLod).rgb;','vec3 mirrorRadiance=texture2D(uMirrorMap,mu).rgb;')
s=s.replace("      shader.uniforms.uBakeProgress=progressUniform;","      shader.uniforms.uLocalAlcoveEnv={value:env[4]};\n      shader.vertexShader='varying vec3 vRepairWorld;\\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\\nvRepairWorld=(modelMatrix*vec4(transformed,1.)).xyz;');\n      shader.uniforms.uBakeProgress=progressUniform;")
s=s.replace("shader.fragmentShader='uniform float uBakeProgress;","shader.fragmentShader='varying vec3 vRepairWorld;uniform sampler2D uLocalAlcoveEnv;uniform float uBakeProgress;")
old='vec4 envMapColor = mix(textureCubeUV(envMap,envMapRotation*reflectVec,roughness),textureCubeUV(uArrivalEnv,envMapRotation*reflectVec,roughness),uEnvMix);'
new='''vec4 outerEnvironment=mix(textureCubeUV(envMap,envMapRotation*reflectVec,roughness),textureCubeUV(uArrivalEnv,envMapRotation*reflectVec,roughness),uEnvMix);
          float localWeight=smoothstep(36.0,46.0,-vRepairWorld.z)*(1.0-smoothstep(4.0,5.2,abs(vRepairWorld.x+6.0)));
          vec3 ray=reflectVec;vec3 signRay=sign(ray);ray=signRay*max(abs(ray),vec3(.0001));
          vec3 edge=mix(vec3(-10.6,-2.87,-56.6),vec3(-1.4,5.8,-35.0),step(vec3(0.),ray));
          vec3 travel=(edge-vRepairWorld)/ray;float distanceToBox=max(0.0,min(travel.x,min(travel.y,travel.z)));
          vec3 probeRay=vRepairWorld+ray*distanceToBox-vec3(-6.,1.,-49.);
          vec4 envMapColor=mix(outerEnvironment,textureCubeUV(uLocalAlcoveEnv,envMapRotation*probeRay,roughness),localWeight);'''
assert old in s;s=s.replace(old,new.replace(chr(10),chr(92)+"n"))
s=s.replace("environmentMap:'same-scene HDR probes; specular only'","environmentMap:'original probes + local box-projected alcove probe; all specular retained'")
s=s.replace("reflection:'linear mirrored camera, floor BRDF integration'","reflection:'linear planar reflection; lowpass downsample + dense normalized 49tap Gaussian; floor BRDF'")
s=s.replace("// shortcut: roughness-dependent reflection mips approximate GGX filtering; compare against the native floor before upgrading.","// shortcut: angular Gaussian approximates GGX; compare native roughness spread before a final microfacet filter.")
# Bound GPU queue admission. This never reduces geometry, effects or internal resolution.
s=s.replace(" const scene=new T.Scene();", " const fenceGL=renderer.getContext()as WebGL2RenderingContext;let pendingFence:WebGLSync|null=null,skippedWhilePending=0;const resetFence=()=>{pendingFence=null;lastSignature='';};canvas.addEventListener('webglcontextlost',resetFence);canvas.addEventListener('webglcontextrestored',resetFence);\n const scene=new T.Scene();")
s=s.replace("if(signature===lastSignature)return;lastSignature=signature;","if(signature===lastSignature)return;if(pendingFence){const status=fenceGL.clientWaitSync(pendingFence,0,0);if(status===fenceGL.TIMEOUT_EXPIRED){skippedWhilePending++;return;}fenceGL.deleteSync(pendingFence);pendingFence=null;}lastSignature=signature;")
s=s.replace('renderer.render(scene,camera);\n  options.onFrame','renderer.render(scene,camera);pendingFence=fenceGL.fenceSync(fenceGL.SYNC_GPU_COMMANDS_COMPLETE,0);fenceGL.flush();\n  options.onFrame')
s=s.replace("dispose(){disposed=true;film?", "dispose(){disposed=true;canvas.removeEventListener('webglcontextlost',resetFence);canvas.removeEventListener('webglcontextrestored',resetFence);if(pendingFence&&!fenceGL.isContextLost())fenceGL.deleteSync(pendingFence);pendingFence=null;film?")
s=s.replace("allocationNote:'VRAM and hardware GPU performance not measured'","gpuPendingSkips:String(skippedWhilePending),allocationNote:'VRAM and hardware GPU performance not measured; canopy-only 512px 8sample matched GI preview; original full bakes preserved'")
root.joinpath('worldR7Repair.ts').write_text(s)
print('R7_REPAIR_MODULE_READY',len(s))

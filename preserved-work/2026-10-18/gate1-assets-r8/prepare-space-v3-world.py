from pathlib import Path
p=Path('/workspace/yl-folded-playhouse-r8/src/landing/cinematic/folded');s=p.joinpath('previewSpaceV2Lit.ts').read_text().replace('chamber-r8.space-v2-lit','chamber-r8.space-v3').replace('folded-chamber-r8-space-v2-lit/','folded-chamber-r8-space-v3/')
s="import {applyRigidPose,portraitStagePose,heroHingePose} from './stageMotion';\n"+s
s=s.replace(" const progressUniform=", " const portraitRig=new T.Group(),shellRig=new T.Group();portraitRig.name='PORTRAIT_AND_ROOTED_STAGE';shellRig.name='HERO_FINISHED_HINGE';scene.add(portraitRig,shellRig);\n const progressUniform=")
s=s.replace("Promise.all(['hero','arrival'].map(async name=>{const source=await hdrLoader.loadAsync('/models/folded-chamber-r8-space-v3/'+name+'-environment.hdr');", "Promise.all(['hero-environment','arrival-environment','hero-indirect','arrival-indirect'].map(async name=>{const source=await hdrLoader.loadAsync('/models/folded-chamber-r8-space-v3/'+name+'.hdr');")
s=s.replace("then(([hero,arrival])=>{pmrem.dispose();environmentArrival.value=arrival;return[hero,arrival,hero,arrival];}","then(([hero,arrival,indirectHero,indirectArrival])=>{pmrem.dispose();environmentArrival.value=arrival;return[hero,arrival,hero,arrival,indirectHero,indirectArrival];}")
s=s.replace("RectAreaLightUniformsLib.init();scene.add(new T.HemisphereLight('#a4b9d5','#2c1b1f',.035));", "RectAreaLightUniformsLib.init();")
a=s.index(' function atlas(');b=s.index(' const modelReady=',a)
s=s[:a]+''' function atlas(stem:string,normal:string,restOnly=false){
+  const key=stem+(restOnly?':rest':'');
+  if(!atlasCache.has(key))atlasCache.set(key,Promise.all([Promise.all((restOnly?['0']:['0','0_43','1']).map(p=>loadDiffuse(stem+'-diffuse-'+p+'.exr'))),loadNormal(normal)]).then(([maps,normal])=>({maps:restOnly?[maps[0],maps[0],maps[0]]:maps,normal})));
+  return atlasCache.get(key)!;
+ }
+'''.replace('\n+','\n')+s[b:]
s=s.replace("areaSources=new Set<string>();","areaSources=new Set<string>(),hingeRoots=new Set<T.Object3D>(),stageRoots=new Set<T.Object3D>();")
s=s.replace("   let owner:T.Object3D|null=object;", "   let rigOwner:T.Object3D|null=object;while(rigOwner&&!rigOwner.userData.hingeRig&&!rigOwner.userData.portraitStage)rigOwner=rigOwner.parent;if(rigOwner?.userData.hingeRig)hingeRoots.add(rigOwner);if(rigOwner?.userData.portraitStage)stageRoots.add(rigOwner);\n   let owner:T.Object3D|null=object;")
s=s.replace("unbaked=Boolean(owner?.userData.previewUnbaked);", "unbaked=Boolean(owner?.userData.previewUnbaked),restOnly=Boolean(owner?.userData.restBakeOnly);")
s=s.replace("atlas(stem,owner!.userData.normalMap)", "atlas(stem,owner!.userData.normalMap,restOnly)")
s=s.replace("      shader.uniforms.uBakeProgress=progressUniform;", "      shader.uniforms.uIndirectHero={value:env[4]};shader.uniforms.uIndirectArrival={value:env[5]};shader.uniforms.uShellOpen=apertureMix;\n      shader.uniforms.uBakeProgress=progressUniform;")
s=s.replace("let maps=T.ShaderChunk.lights_fragment_maps.replace('iblIrradiance += getIBLIrradiance( geometryNormal );','');", "let maps=T.ShaderChunk.lights_fragment_maps;if(data&&!restOnly)maps=maps.replace('iblIrradiance += getIBLIrradiance( geometryNormal );','');if(restOnly){maps=maps.replace('iblIrradiance += getIBLIrradiance( geometryNormal );','iblIrradiance += getIBLIrradiance( geometryNormal )*uShellOpen;').replace('vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;','vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity * (1.0-uShellOpen);');}")
s=s.replace("shader.fragmentShader='varying vec3 vSpaceWorld;", "shader.fragmentShader='uniform sampler2D uIndirectHero;uniform sampler2D uIndirectArrival;uniform float uShellOpen;varying vec3 vSpaceWorld;")
# Keep native direct-source visibility distinct from diffuse indirect transport.
needle="T.ShaderChunk.envmap_physical_pars_fragment.replace('vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );'"
replacement="T.ShaderChunk.envmap_physical_pars_fragment.replace('vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );','vec4 envMapColor=mix(textureCubeUV(uIndirectHero,envMapRotation*worldNormal,1.0),textureCubeUV(uIndirectArrival,envMapRotation*worldNormal,1.0),smoothstep(12.,55.,-vSpaceWorld.z));').replace('vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );'"
assert needle in s;s=s.replace(needle,replacement)
s=s.replace("+(data?'reflectedLight.directDiffuse=vec3(0.);':'')", "+(data?(restOnly?'reflectedLight.directDiffuse*=uShellOpen;':'reflectedLight.directDiffuse=vec3(0.);'):'')")
s=s.replace("[Boolean(data),floor,filmSurface,'chamber-r8.space-v3']", "[Boolean(data),restOnly,floor,filmSurface,'chamber-r8.space-v3']")
s=s.replace("  });await Promise.all(pending);marks.model", "  });for(const obj of hingeRoots)shellRig.attach(obj);for(const obj of stageRoots)portraitRig.attach(obj);await Promise.all(pending);marks.model")
s=s.replace("portrait.position.set(1.85,.03,.05);scene.add(portrait);", "portrait.position.set(1.85,.03,.05);portraitRig.add(portrait);")
s=s.replace("  for(const{mesh,kind}of moving){", "  applyRigidPose(shellRig,heroHingePose(p,e));applyRigidPose(portraitRig,portraitStagePose(p));\n  for(const{mesh,kind}of moving){")
s=s.replace("influences[dict.Space_Unfold]=(kind==='rail'?weights.rail:weights.aperture)*e;influences[dict.Gift_Entry]=1-e;", "if(dict.Space_Unfold!==undefined)influences[dict.Space_Unfold]=(kind==='rail'?weights.rail:weights.aperture)*e;if(dict.Gift_Entry!==undefined)influences[dict.Gift_Entry]=1-e;")
s=s.replace("diffuse:'R7 atlas on unchanged Hero receivers; new continuous architecture live diffuse-area-light preview'", "diffuse:'unchanged wing GI; Hero rest bake blended to live light during rigid opening; new-space analytic direct + authored indirect-only IBL preview'")
s=s.replace("environmentMap:'two new authored same-space HDR specular probes; world-position blend; analytic diffuse only to avoid double energy'", "environmentMap:'authored specular probes plus source-excluded indirect-diffuse probes; world-position blend'")
s=s.replace("gpuPendingSkips:String(skippedWhilePending)", "portraitStageMatrix:portraitRig.matrix.toArray().map(n=>n.toFixed(6)).join(','),heroHingeMatrix:shellRig.matrix.toArray().map(n=>n.toFixed(6)).join(','),gpuPendingSkips:String(skippedWhilePending)")
p.joinpath('previewSpaceV3.ts').write_text(s)
print('SPACE_V3_WORLD_READY',len(s))

from pathlib import Path
p=Path('/workspace/yl-folded-playhouse-r8/src/landing/cinematic/folded')
s=p.joinpath('previewWorldR8.ts').read_text().replace("import {EXRLoader}","import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';\nimport {EXRLoader}")
s=s.replace('chamber-r8.preview','chamber-r8.space-v2').replace('/models/folded-chamber-r8-preview/','/models/folded-chamber-r8-space-v2/').replace('new T.PerspectiveCamera(38,width/height,.1,100)','new T.PerspectiveCamera(38,width/height,.1,180)')
s=s.replace(" const environments=Promise.resolve([null,null,null,null]as(T.Texture|null)[]);",''' const hdrLoader=new HDRLoader(),pmrem=new T.PMREMGenerator(renderer);pmrem.compileEquirectangularShader();
 const environments=Promise.all(['hero','arrival'].map(async name=>{const source=await hdrLoader.loadAsync('/models/folded-chamber-r8-space-v2/'+name+'-environment.hdr');source.mapping=T.EquirectangularReflectionMapping;if(disposed){source.dispose();return null;}const map=keep(pmrem.fromEquirectangular(source)).texture;map.name='space-v2-'+name+'-authored-probe';source.dispose();return map;})).then(([hero,arrival])=>{pmrem.dispose();environmentArrival.value=arrival;return[hero,arrival,hero,arrival];},error=>{pmrem.dispose();throw error;});''')
a=s.index(' const well=new T.RectAreaLight');b=s.index(' const lightingCards:',a);s=s[:a]+s[b:]
# Reuse the already diagnosed dense linear reflection filter, retaining source radiance.
r=p.joinpath('worldR7Repair.ts').read_text();a=r.index(' // Linear-light 4x4');b=r.index(' const originalReflection=',a)
a0=s.index(' const blurTargets=');b0=s.index(' const originalReflection=',a0);s=s[:a0]+r[a:b]+s[b0:];s=s.replace('value:blurTargets[1].texture','value:filterTargets[2].texture')
s=s.replace(" // Prototype: normalized Gaussian convolution uses a roughness/FOV angular footprint. Not exact GGX convolution."," // Prototype: dense energy-normalized angular Gaussian approximates GGX; all physical source reflections remain.")
s=s.replace("if(object.userData.lighting_card||object.parent?.userData.lighting_card){lightingCards.push(object);object.visible=false;const data=object.userData.rect_area_position?object.userData:object.parent?.userData;if(data?.rect_area_position)","if(object.userData.lighting_card||object.parent?.userData.lighting_card){lightingCards.push(object);object.visible=false;}const areaData=object.userData.rect_area_position?object.userData:object.parent?.userData;{const data=areaData;if(data?.rect_area_position)")
# Rect metadata can live on the parent of multiple GLTF primitives; create one light per source ID.
s=s.replace("const pending:Promise<void>[]=[];","const pending:Promise<void>[]=[],areaSources=new Set<string>();")
s=s.replace("if(data?.rect_area_position){const size=data.rect_area_size", "if(data?.rect_area_position&&!areaSources.has(JSON.stringify(data.rect_area_position))){areaSources.add(JSON.stringify(data.rect_area_position));const size=data.rect_area_size")
needle="      shader.uniforms.uBakeProgress=progressUniform;"
s=s.replace(needle,"      shader.vertexShader='varying vec3 vSpaceWorld;\\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\\nvSpaceWorld=(modelMatrix*vec4(transformed,1.)).xyz;');\n"+needle)
s=s.replace("shader.fragmentShader='uniform float uBakeProgress;","shader.fragmentShader='varying vec3 vSpaceWorld;uniform float uBakeProgress;")
s=s.replace("vec4 envMapColor = mix(textureCubeUV(envMap,envMapRotation*reflectVec,roughness),textureCubeUV(uArrivalEnv,envMapRotation*reflectVec,roughness),uEnvMix);", "vec4 envMapColor = mix(textureCubeUV(envMap,envMapRotation*reflectVec,roughness),textureCubeUV(uArrivalEnv,envMapRotation*reflectVec,roughness),smoothstep(12.,55.,-vSpaceWorld.z));")
# Baked receivers already contain diffuse. All receivers get source specular from
# the authored probes, avoiding a second direct analytic specular contribution.
s=s.replace("      if(filmSurface)shader.fragmentShader=", "      shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\\nreflectedLight.directSpecular=vec3(0.);'+(data?'reflectedLight.directDiffuse=vec3(0.);':''));\n      if(filmSurface)shader.fragmentShader=")
s=s.replace("diffuse:'R7 atlas only on unchanged geometry; new canopy/return are unbaked live-area-light preview'","diffuse:'R7 atlas on unchanged Hero receivers; new continuous architecture live diffuse-area-light preview'")
s=s.replace("environmentMap:'new receiver direct area-light preview; final local HDR not produced'","environmentMap:'two new authored same-space HDR specular probes; world-position blend; analytic diffuse only to avoid double energy'")
s=s.replace("reflection:'linear mirrored camera, normalized angular Gaussian approximation, floor BRDF'","reflection:'linear mirrored camera, dense normalized49tap angular Gaussian, floor BRDF'")
p.joinpath('previewSpaceV2.ts').write_text(s)
print('SPACE_V2_WORLD_READY',len(s))

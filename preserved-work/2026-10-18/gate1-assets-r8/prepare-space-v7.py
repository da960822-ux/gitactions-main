from pathlib import Path
R=Path('/workspace/yl-folded-playhouse-r8/src/landing/cinematic/folded');s=(R/'previewSpaceV6.ts').read_text();s="import {createCurvedFloorReflection} from './curvedReflection';\n"+s;s=s.replace("import {Reflector} from 'three/addons/objects/Reflector.js';\n",'')
start=s.index(' const reflection=new Reflector(');end=s.index(' let film:',start);s=s[:start]+" const curvedReflection=createCurvedFloorReflection(renderer,scene,camera,floorReceivers);\n"+s[end:]
start=s.index('      if(floor){');end=s.index('\n     };',start);s=s[:start]+s[end:]
s=s.replace("copyMaterial&&!floor?'float copyLightLink", "copyMaterial?'float copyLightLink")
s=s.replace('renderer.render(scene,camera);pendingFence=','curvedReflection.render();pendingFence=')
s=s.replace('camera.aspect=w/h;camera.updateProjectionMatrix();','camera.aspect=w/h;camera.updateProjectionMatrix();curvedReflection.resize();')
s=s.replace('reflection.dispose();','curvedReflection.dispose();')
s=s.replace("assetVersion:'chamber-r8.space-v6'","assetVersion:'chamber-r8.space-v7-ssr'")
s=s.replace("diffuse:'baked-only',environment:'authored-probe-specular-only'","diffuse:'hybrid-rest-GI-and-live-prototype',environment:'authored-specular-and-indirect-diffuse-probes'")
s=s.replace("reflection:'linear mirrored camera, dense normalized49tap angular Gaussian, floor BRDF'","reflection:'actual curved normal/depth SSR, alpha-preserved auxiliary buffers, dense normalized33tap roughness blur; authored IBL for offscreen sources'")
(R/'previewSpaceV7.ts').write_text(s)

from pathlib import Path
r=Path('/workspace/yl-folded-playhouse-r8');d=r/'src/landing/cinematic/folded'
s=(d/'arrivalCoveV13.ts').read_text().replace('spread=4*amount','spread=9*amount');(d/'arrivalCoveV14.ts').write_text(s)
s=(d/'arrivalCoveV13.test.ts').read_text().replace("from './arrivalCoveV13'","from './arrivalCoveV14'");(d/'arrivalCoveV14.test.ts').write_text(s)
s=(d/'stageMotionV12.ts').read_text().replace('+2.8*blend','+2.5*blend').replace('-12*blend','-8.5*blend');(d/'stageMotionV14.ts').write_text(s)
s=(d/'floorSupportV12.ts').read_text().replace("from './stageMotionV12'","from './stageMotionV14'");(d/'floorSupportV14.ts').write_text(s)
s=(d/'floorSupportV12.test.ts').read_text().replace("from './stageMotionV12'","from './stageMotionV14'").replace("from './floorSupportV12'","from './floorSupportV14'").replace('support v12','support v14');(d/'floorSupportV14.test.ts').write_text(s)
s=(d/'curvedReflectionV11.ts').read_text().replace('pass.opacity=.16','pass.opacity=.09').replace('.18*.18*h/','.14*.14*h/').replace('pass.maxDistance=35','pass.maxDistance=18');(d/'curvedReflectionV14.ts').write_text(s)
s=(d/'previewSpaceV13.ts').read_text().replace("from './arrivalCoveV13'","from './arrivalCoveV14'").replace("from './floorSupportV12'","from './floorSupportV14'").replace("from './stageMotionV12'","from './stageMotionV14'").replace("from './curvedReflectionV11'","from './curvedReflectionV14'").replace('chamber-r8.cosmic-v13','chamber-r8.cosmic-v14')
s=s.replace("const supportMeshes:","const deformableLights:{light:T.RectAreaLight;position:number[];target:number[];size:number[];power:number}[]=[];\n const supportMeshes:")
a="scene.add(area);}}}"
b="scene.add(area);if(object.name.startsWith('Lightwell_'))deformableLights.push({light:area,position:[...data.rect_area_position],target:[...data.rect_area_target],size:[...size],power:data.rect_area_power});}}}"
assert a in s;s=s.replace(a,b)
s=s.replace("if(owner?.userData.floorSupport){", "if(owner?.userData.floorSupport||/^(Warm_Recessed_Lightwell|Lightwell_)/.test(object.name)){")
a="if(floorSignature!==lastShadowPose)"
b="""for(const source of deformableLights){sampleArrivalCove(source.position[0],source.position[1],source.position[2],p,coveSample);source.light.position.set(coveSample.x,coveSample.y,source.position[2]);const sx=coveSample.xx,sy=coveSample.yy;source.light.width=source.size[0]*sx;source.light.height=source.size[1]*sy;source.light.intensity=source.power/(sx*sy);sampleArrivalCove(source.target[0],source.target[1],source.target[2],p,coveSample);source.light.lookAt(coveSample.x,coveSample.y,source.target[2]);}
  if(floorSignature!==lastShadowPose)"""
assert a in s;s=s.replace(a,b)
s=s.replace("existing cove widens/raises with positive analytic Jacobian","existing cove and its lightwell/reveals widen together with positive analytic Jacobian; transformed area source conserves total flux")
(d/'previewSpaceV14.ts').write_text(s)
p=r/'src/landing/AcrossHero.tsx';p.write_text(p.read_text().replace('previewSpaceV13','previewSpaceV14'))
s=Path('/workspace/gate1-assets-r8/hero-cosmic-integration-v13/capture-quick.mjs').read_text().replace('hero-cosmic-integration-v13','hero-cosmic-integration-v14').replace('chamber-r8.cosmic-v13','chamber-r8.cosmic-v14').replace('cosmic V13','cosmic V14')
Path('/workspace/gate1-assets-r8/hero-cosmic-integration-v14/capture-quick.mjs').write_text(s)
print('V14 connects the lightwell to its moving wall, clears right wall, brings same portrait closer, and attenuates smeared reflection')

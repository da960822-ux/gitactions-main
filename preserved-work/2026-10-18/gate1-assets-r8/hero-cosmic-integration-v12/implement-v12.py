from pathlib import Path
r=Path('/workspace/yl-folded-playhouse-r8');d=r/'src/landing/cinematic/folded'
s=(d/'stageMotionV11.ts').read_text().replace('+3.6*blend','+2.8*blend').replace('-16*blend','-12*blend');(d/'stageMotionV12.ts').write_text(s)
s=(d/'floorSupportV11.ts').read_text().replace("from './stageMotionV11'","from './stageMotionV12'").replace('height:.66','height:.75');(d/'floorSupportV12.ts').write_text(s)
s=(d/'previewSpaceV11.ts').read_text().replace("from './stageMotionV11'","from './stageMotionV12'").replace("from './floorSupportV11'","from './floorSupportV12'").replace('chamber-r8.cosmic-v11','chamber-r8.cosmic-v12')
s="import {sampleArrivalCove,type CoveSample} from './arrivalCove';\n"+s
s=s.replace("const supportMeshes:","const coveSample:CoveSample={x:0,y:0,xx:1,xy:0,xz:0,yy:1,yz:0};\n const supportMeshes:")
s=s.replace('new T.PlaneGeometry(24,16,48,16)','new T.PlaneGeometry(120,80,64,32)').replace('-2.4*Math.pow(x/12,2)','-8*Math.pow(x/60,2)').replace('vista.position.set(-4,3.8,-68)','vista.position.set(-4,8,-100)')
s=s.replace('m.envMapIntensity=1;','m.envMapIntensity=m.name.includes(\'Satin graphite stone\')?.22:1;')
s=s.replace("(!unbaked?'reflectedLight.directSpecular=vec3(0.);':'')","(floor?'reflectedLight.directSpecular*=.06;':!unbaked?'reflectedLight.directSpecular=vec3(0.);':'')")
a="const offset=i*3,x=item.positions[offset],y=item.positions[offset+1],z=item.positions[offset+2];sampleFloorSupport(x,y,z+(1-e)*.25,shape,supportSample);pos.setXYZ(i,x,y+supportSample.height,z);const nx=item.normals[offset],ny=item.normals[offset+1],nz=item.normals[offset+2],j=1+supportSample.dy,yy=ny/j,xx=nx-supportSample.dx*yy,zz=nz-supportSample.dz*yy,length=Math.hypot(xx,yy,zz);"
b="const offset=i*3,ox=item.positions[offset],oy=item.positions[offset+1],z=item.positions[offset+2];sampleArrivalCove(ox,oy,z,p,coveSample);const x=coveSample.x,y=coveSample.y;sampleFloorSupport(x,y,z+(1-e)*.25,shape,supportSample);pos.setXYZ(i,x,y+supportSample.height,z);const rawX=item.normals[offset]/coveSample.xx,rawY=(item.normals[offset+1]-coveSample.xy*rawX)/coveSample.yy,rawZ=item.normals[offset+2]-coveSample.xz*rawX-coveSample.yz*rawY,j=1+supportSample.dy,yy=rawY/j,xx=rawX-supportSample.dx*yy,zz=rawZ-supportSample.dz*yy,length=Math.hypot(xx,yy,zz);"
assert a in s;s=s.replace(a,b).replace('continuous .66m wide crest','continuous .75m wide crest').replace('same floor unrolls to arrival','same floor unrolls to arrival; existing cove widens/raises with positive analytic Jacobian')
(d/'previewSpaceV12.ts').write_text(s)
p=r/'src/landing/AcrossHero.tsx';p.write_text(p.read_text().replace('previewSpaceV11','previewSpaceV12'))
s=(d/'floorSupportV11.test.ts').read_text().replace("from './stageMotionV11'","from './stageMotionV12'").replace("from './floorSupportV11'","from './floorSupportV12'").replace('support v11','support v12').replace('LessThanOrEqual(.66)','LessThanOrEqual(.75)');(d/'floorSupportV12.test.ts').write_text(s)
p=Path('/workspace/gate1-assets-r8/hero-cosmic-integration-v11/capture-quick.mjs');s=p.read_text().replace('hero-cosmic-integration-v11','hero-cosmic-integration-v12').replace('chamber-r8.cosmic-v11','chamber-r8.cosmic-v12').replace('cosmic V11','cosmic V12');Path('/workspace/gate1-assets-r8/hero-cosmic-integration-v12/capture-quick.mjs').write_text(s)
print('V12: same cove opens into a courtyard; fixed world-sized curved environment; safer physical occlusion; no new model or bake')

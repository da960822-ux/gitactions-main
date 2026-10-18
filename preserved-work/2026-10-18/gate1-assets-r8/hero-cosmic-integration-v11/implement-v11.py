from pathlib import Path
r=Path('/workspace/yl-folded-playhouse-r8');d=r/'src/landing/cinematic/folded'
p=(d/'poseSpaceV10.ts').read_text().replace('[1,-6,1.1,-55,-10,1.3,-170]','[1,-3.8,.85,-40,-4,1,-69]')
(d/'poseSpaceV11.ts').write_text(p)
s=(d/'stageMotion.ts').read_text().replace("from './poseSpaceV2'","from './poseSpaceV11'")
s=s.replace("import {smoothRange}","import {cameraPose,smoothRange}")
s=s.replace("return{pivot:[1.85,0,.05],delta:[1.9*t,0,-4.4*t],angleY:-Math.PI/30*t};", """if(progress<=.43)return{pivot:[1.85,0,.05],delta:[1.9*t,0,-4.4*t],angleY:-Math.PI/30*t};
 const start=smoothRange(.10,.52,.43),blend=smoothRange(.43,1,progress),cam=cameraPose(progress,1,false).position;
 const relativeX=(1.85+1.9*start+1.7)*(1-blend)+3.6*blend,relativeZ=(.05-4.4*start-8)*(1-blend)-16*blend;
 return{pivot:[1.85,0,.05],delta:[cam[0]+relativeX-1.85,0,cam[2]+relativeZ-.05],angleY:-Math.PI/30*start*(1-blend)+Math.PI/24*blend};""")
(d/'stageMotionV11.ts').write_text(s)
s=(d/'floorSupportV10.ts').read_text().replace("from './stageMotion'","from './stageMotionV11'").replace('height:.82,radiusX:6','height:.66,radiusX:10').replace('z:pose.pivot[2]+pose.delta[2],','z:pose.pivot[2]+pose.delta[2]+1,').replace('(z+12)/11.2','(z-shape.z+12)/11.2')
(d/'floorSupportV11.ts').write_text(s)
s=(d/'curvedReflectionV9.ts').read_text().replace('pass.opacity=.24','pass.opacity=.16').replace('.31*.31*h/','.18*.18*h/').replace('gl_FragColor.a*=step(.5,texture2D(receiver,vUv).r);','gl_FragColor.rgb*=vec3(.46,.23,.27);gl_FragColor.a*=step(.5,texture2D(receiver,vUv).r);')
(d/'curvedReflectionV11.ts').write_text(s)
s=(d/'previewSpaceV10.ts').read_text().replace("from './floorSupportV10'","from './floorSupportV11'").replace("from './stageMotion'","from './stageMotionV11'").replace("from './poseSpaceV10'","from './poseSpaceV11'").replace("from './curvedReflectionV9'","from './curvedReflectionV11'").replace('chamber-r8.cosmic-v10','chamber-r8.cosmic-v11').replace('midnight-rose-sky.webp','our-universe-scene.webp').replace('imageAspect=1939/811','imageAspect=1536/1024')
s=s.replace("const glassMaterials:T.MeshStandardMaterial[]=[];", """const glassMaterials:T.MeshStandardMaterial[]=[];
 const floorAnchor={value:new T.Vector2(1.85,.05)};
 // A lightweight curved environment layer sits inside the existing architecture; it is not the camera transition.
 const vistaGeometry=keep(new T.PlaneGeometry(24,16,48,16)),vistaPositions=vistaGeometry.getAttribute('position');
 for(let i=0;i<vistaPositions.count;i++){const x=vistaPositions.getX(i);vistaPositions.setZ(i,-2.4*Math.pow(x/12,2));}vistaGeometry.computeVertexNormals();
 const vistaMaterial=keep(new T.MeshBasicMaterial({color:0xffffff,toneMapped:false,side:T.DoubleSide}));const vista=new T.Mesh(vistaGeometry,vistaMaterial);vista.name='EXISTING_COSMIC_ENVIRONMENT_IN_ARRIVAL';vista.position.set(-4,3.8,-68);scene.add(vista);
 void skyReady.then(()=>{if(disposed)return;const texture=keep(cosmicSky!.clone());texture.repeat.set(1,1);texture.offset.set(0,0);texture.needsUpdate=true;vistaMaterial.map=texture;vistaMaterial.needsUpdate=true;});
 const arrivalWarm=new T.PointLight('#f3b084',28,28,2);arrivalWarm.position.set(-10,4,-57);const arrivalCool=new T.PointLight('#929de0',14,24,2);arrivalCool.position.set(2,5,-61);scene.add(arrivalWarm,arrivalCool);
 const inkCanvas=document.createElement('canvas');inkCanvas.width=1024;inkCanvas.height=512;const ink=inkCanvas.getContext('2d')!;ink.clearRect(0,0,1024,512);ink.textAlign='center';ink.fillStyle='#d4a589';ink.font='28px sans-serif';ink.fillText('한국',220,165);ink.font='24px sans-serif';ink.fillText('República Dominicana',710,345);ink.strokeStyle='#a87454';ink.lineWidth=2;ink.beginPath();ink.moveTo(250,200);ink.bezierCurveTo(400,175,500,370,660,350);ink.stroke();
 const floorInk=keep(new T.CanvasTexture(inkCanvas));floorInk.colorSpace=T.SRGBColorSpace;
""")
s=s.replace("m.color.set('#25131d');m.roughness=.24;m.metalness=.32;","m.color.set('#28101b');m.roughness=.18;m.metalness=.72;m.envMapIntensity=.42;")
s=s.replace("shader.uniforms.uIndirectHero={value:env[4]};", "shader.uniforms.uFloorAnchor=floorAnchor;shader.uniforms.uFloorInk={value:floorInk};shader.uniforms.uIndirectHero={value:env[4]};")
s=s.replace("shader.fragmentShader='uniform sampler2D uIndirectHero;", "shader.fragmentShader='uniform vec2 uFloorAnchor;uniform sampler2D uFloorInk;uniform sampler2D uIndirectHero;")
s=s.replace("'#include <lights_fragment_end>\\nreflectedLight.directSpecular=vec3(0);'+", "'#include <lights_fragment_end>\\n'+(!unbaked?'reflectedLight.directSpecular=vec3(0);':'')+")
s=s.replace("edgeCurve=-.2+.025*pow(vSpaceWorld.x-1.85,2.);", "edgeCurve=uFloorAnchor.y-.2+.013*pow(vSpaceWorld.x-uFloorAnchor.x,2.);")
s=s.replace("abs(vSpaceWorld.x-1.85)","abs(vSpaceWorld.x-uFloorAnchor.x)")
s=s.replace("*edgeLight*(1.-uShellOpen);", "*edgeLight;vec2 inkUv=vec2((vSpaceWorld.x+11.)/14.,(-vSpaceWorld.z-48.)/14.);if(all(greaterThanEqual(inkUv,vec2(0.)))&&all(lessThanEqual(inkUv,vec2(1.)))){vec4 words=texture2D(uFloorInk,inkUv);totalEmissiveRadiance+=words.rgb*words.a*.25*uShellOpen;}")
s=s.replace("applyRigidPose(portraitRig,portraitStagePose(p));", "const portraitPose=portraitStagePose(p);applyRigidPose(portraitRig,portraitPose);floorAnchor.value.set(portraitPose.pivot[0]+portraitPose.delta[0],portraitPose.pivot[2]+portraitPose.delta[2]);")
s=s.replace("source-excluded indirect-diffuse probes; world-position blend", "source-excluded indirect-diffuse probes; world-position blend plus actual arrival warm/cool sources")
s=s.replace("pointerX:pose.pointerX", "pointerX:pose.pointerX")
s=s.replace("progress:p.toFixed(4),entrance:e.toFixed(4),camera:", "progress:p.toFixed(4),entrance:e.toFixed(4),pointerX:pose.pointerX.toFixed(4),pointerY:pose.pointerY.toFixed(4),camera:")
s=s.replace("continuous .82m crest; rear floor folds down10m and unrolls into corridor; thin rose-gold inlay", "continuous .66m wide crest; rear fold follows portrait, keeping both cutout corners occluded; same floor unrolls to arrival")
s=s.replace("reflectedLight.directSpecular=vec3(0.);'+","'+(!unbaked?'reflectedLight.directSpecular=vec3(0.);':'')+")
(d/'previewSpaceV11.ts').write_text(s)
p=r/'src/landing/AcrossHero.tsx';p.write_text(p.read_text().replace('previewSpaceV10','previewSpaceV11'))
p=r/'src/landing/across-hero.css';s=p.read_text();s=s.replace('linear-gradient(90deg,#100a13ed 0%,#130a13eb 24%,#160b17b0 37%,transparent 49%)','radial-gradient(ellipse 32% 50% at 22% 55%,#100a13f7 8%,#100a13cf 52%,transparent 100%)');s+='\n.folded-playhouse .across-editorial{text-shadow:0 2px 18px #100a13,0 0 40px #100a13}.folded-playhouse .folded-baby{font-synthesis:style}\n';p.write_text(s)
t=(d/'floorSupportV10.test.ts').read_text().replace("'./floorSupportV10'","'./floorSupportV11'").replace('support v10','support v11').replace('LessThanOrEqual(.82)','LessThanOrEqual(.66)')
t=t.replace("import {floorSupportShape", "import {portraitStagePose} from './stageMotionV11';\nimport {floorSupportShape")
t+='''\nit('keeps the actual portrait lower corners behind the continuous foreground at every transition pose',()=>{const v={height:0,dx:0,dy:0,dz:0};for(const p of[0,.16,.32,.43,.5,.65,.85,1]){const stage=portraitStagePose(p),shape=floorSupportShape(p),cx=stage.pivot[0]+stage.delta[0],cz=stage.pivot[2]+stage.delta[2];for(const edge of[-2.95,0,2.95]){const x=cx+edge*Math.cos(stage.angleY),z=cz-edge*Math.sin(stage.angleY)+.35;sampleFloorSupport(x,-3.319,z,shape,v);expect(-3.319+v.height).toBeGreaterThan(-2.92+.025);}}});\n'''
(d/'floorSupportV11.test.ts').write_text(t)
print('V11: approved universe image, moving occlusion field, crisper burgundy floor, continuous portrait arrival and curved environment layer')

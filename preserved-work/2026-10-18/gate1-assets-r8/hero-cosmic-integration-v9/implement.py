from pathlib import Path
root=Path('/workspace/yl-folded-playhouse-r8');d=root/'src/landing/cinematic/folded'
# Preserve all earlier candidates; V9 is the active continuation of the reviewed composition.
s=(d/'floorSupportV6.ts').read_text().replace('height:.95','height:.62')
(d/'floorSupportV9.ts').write_text(s)
s=(d/'previewSpaceV8.ts').read_text().replace("from './floorSupportV6'","from './floorSupportV9'").replace("from './curvedReflection'","from './curvedReflectionV9'").replace("chamber-r8.space-v8-synced","chamber-r8.cosmic-v9")
s=s.replace("const scene=new T.Scene();scene.background=new T.Color('#080b11');","const scene=new T.Scene();scene.background=new T.Color('#100a13');")
s=s.replace("const textureLoader=new T.TextureLoader(),exrLoader=new EXRLoader();","""const textureLoader=new T.TextureLoader(),exrLoader=new EXRLoader();
 let cosmicSky:T.Texture|undefined;
 const skyReady=textureLoader.loadAsync('/images/midnight-rose-sky.webp').then(texture=>{cosmicSky=keep(texture);texture.colorSpace=T.SRGBColorSpace;scene.background=texture;fitSky();});
 function fitSky(){if(!cosmicSky)return;const imageAspect=1939/811,viewAspect=width/height;cosmicSky.repeat.set(viewAspect<imageAspect?viewAspect/imageAspect:1,viewAspect>imageAspect?imageAspect/viewAspect:1);cosmicSky.offset.set((1-cosmicSky.repeat.x)*.58,(1-cosmicSky.repeat.y)*.5);}
 const glassMaterials:T.MeshStandardMaterial[]=[];
""")
s=s.replace("const localWine=m.name.includes('Deep burgundy mineral');","""const heroGlass=object.name.startsWith('Shared_Sculpted_Cove')||object.name.startsWith('Retained_Hero_Wing')||((m.name.includes('Warm mineral plaster')||m.name.includes('Burgundy satin architecture'))&&Boolean(owner?.userData.floorSupport));
    if(heroGlass){m.transparent=true;m.depthWrite=false;m.opacity=.025;m.color.set('#5b2239');m.roughness=.36;m.metalness=.2;m.userData.cosmicGlass=true;glassMaterials.push(m);}
    if(m.name.includes('Soft rose gold')||m.name.includes('woven light')){m.color.set('#9e6045');m.emissive?.set('#2b100b');m.emissiveIntensity=.18;m.roughness=.38;}
    if(m.name.includes('Satin graphite stone')){m.color.set('#25131d');m.roughness=.24;m.metalness=.32;}
    const localWine=m.name.includes('Deep burgundy mineral');""")
s=s.replace("if(filmSurface)shader.fragmentShader=", "if(floor)shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\\nfloat edgeCurve=1.05+.025*pow(vSpaceWorld.x-1.85,2.);float edgeLight=exp(-pow((vSpaceWorld.z-edgeCurve)/.028,2.))*(1.-smoothstep(10.,19.,abs(vSpaceWorld.x-1.85)));totalEmissiveRadiance+=vec3(.38,.135,.065)*edgeLight*(1.-uShellOpen);');\n      if(filmSurface)shader.fragmentShader=")
s=s.replace('Promise.all([modelReady,portraitReady])','Promise.all([modelReady,portraitReady,skyReady])')
s=s.replace("applyRigidPose(portraitRig,portraitStagePose(p));","applyRigidPose(portraitRig,portraitStagePose(p));for(const m of glassMaterials)m.opacity=.025+.975*smoothRange(.14,.48,p);")
s=s.replace("same continuous floor mesh, no separate frame/pedestal; .95m broad smooth moving height field","same continuous floor mesh, no separate frame/pedestal; lowered .62m broad smooth field and thin rose-gold inlay")
s=s.replace("during rigid opening","during nonrigid opening")
s=s.replace("copyZone:'world-space dark burgundy material; portrait pixels untouched'","copyZone:'dark burgundy DOM atmosphere with original cosmic environment; portrait pixels untouched',cosmicEnvironment:'original midnight-rose-sky.webp background, actual geometry/camera transition remains live'")
s=s.replace("width=w;height=h;lastSignature='';","width=w;height=h;fitSky();lastSignature='';")
(d/'previewSpaceV9.ts').write_text(s)
r=(d/'curvedReflection.ts').read_text().replace('pass.opacity=.48','pass.opacity=.24')
r=r.replace('if(!(object instanceof T.Mesh))return;const selected=',"if(!(object instanceof T.Mesh))return;const selected=")
# Auxiliary buffers must not treat the almost-transparent Hero cove as a solid wall.
r=r.replace("const key=source.uuid+':'+normal+':'+selected;","const glass=Boolean(source.userData.cosmicGlass);const key=source.uuid+':'+normal+':'+selected+':'+(glass&&source.opacity<.15);if(glass&&source.opacity<.15){const hidden=new T.MeshBasicMaterial({visible:false});this.auxiliary.set(key,hidden);return hidden;}")
# Reuse cached auxiliary materials, rather than allocate one on each frame.
r=r.replace("if(glass&&source.opacity<.15){const hidden=", "if(this.auxiliary.has(key))return this.auxiliary.get(key)!;if(glass&&source.opacity<.15){const hidden=")
(d/'curvedReflectionV9.ts').write_text(r)
a=(d/'ReviewedHeroResponsive.tsx').read_text().replace("from './pointerResponse'","from './cinematic/folded/pointerResponse'").replace("from './pose'","from './cinematic/folded/pose'").replace("'../../across-hero.css'","'./across-hero.css'").replace("'./previewSpaceV8'","'./cinematic/folded/previewSpaceV9'")
(root/'src/landing/AcrossHero.tsx').write_text(a)
css=root/'src/landing/across-hero.css'
with css.open('a') as f:f.write('''\n/* Reviewed cosmic composition: retain the portrait camera and the same live folded world. */
.folded-playhouse .across-stage::after{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(90deg,#100a13ed 0%,#130a13eb 24%,#160b17b0 37%,transparent 49%)}
@media(min-width:1101px){.landing:has(.folded-playhouse)>.landing-nav{max-width:none;width:87%;margin:0 auto}.folded-playhouse .across-editorial{left:6.5104%;top:22.4074%;width:32.8125%;max-width:none}.folded-playhouse .folded-dedication{margin-bottom:35px}.folded-playhouse .across-editorial h1{font-size:clamp(62px,6.041667vw,116px);line-height:1.13}.folded-playhouse .across-editorial .folded-baby{font-size:clamp(104px,9.0625vw,174px);padding-bottom:25px;margin-left:-4px}.folded-playhouse .across-caption{margin:29px 0 28px}}
''')
# Analytic gradient and orientation regression check for the changed, thinner field.
t=(d/'floorSupportV6.test.ts').read_text().replace("'./floorSupportV6'","'./floorSupportV9'").replace('broad continuous floor support v6','thinner continuous cosmic floor support v9').replace('LessThanOrEqual(.95)','LessThanOrEqual(.62)')
(d/'floorSupportV9.test.ts').write_text(t)
print('Active Hero updated to cosmic V9; prior V4–V8 sources preserved; no asset file changed')

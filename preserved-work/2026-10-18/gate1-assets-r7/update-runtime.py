from pathlib import Path
R=Path('/workspace/yl-folded-playhouse-r7');p=R/'src/landing/cinematic/folded/world.ts';s=p.read_text().replace('clamp01,smoothRange,type FoldPose','clamp01,smoothRange,surfaceWeights,type FoldPose').replace('chamber-v6.1','chamber-v7.0').replace('folded-chamber-v6','folded-chamber-v7').replace('bakePoses:[0,.65,1]','bakePoses:[0,.43,1]')
s=s.replace("environmentMix={value:0}","environmentMix={value:0},apertureMix={value:0}")
s=s.replace("['hero','arrival','wine']","['hero','arrival','wine','wine-arrival']")
s=s.replace('moving:T.Mesh[]=[]','moving:{mesh:T.Mesh;kind:string}[]=[]')
s=s.replace("if(object.morphTargetInfluences)moving.push(object);",'')
s=s.replace("   const stem=owner?.userData.lightmapStem", "   if(object.morphTargetInfluences)moving.push({mesh:object,kind:String(owner?.userData.motionGroup??object.userData.motionGroup??'shell')});\n   const stem=owner?.userData.lightmapStem")
s=s.replace("shader.uniforms.uEnvMix=environmentMix;shader.uniforms.uArrivalEnv=localWine?{value:env[2]}","shader.uniforms.uEnvMix=localWine?apertureMix:environmentMix;shader.uniforms.uArrivalEnv=localWine?{value:env[3]}")
s=s.replace("['0','0_65','1']","['0','0_43','1']").replace('uBakeProgress < 0.65','uBakeProgress < 0.43').replace('uBakeProgress/0.65','uBakeProgress/0.43').replace('(uBakeProgress-0.65)/0.35','(uBakeProgress-0.43)/0.57')
s=s.replace(" const mirrorMaterial=reflection.material", " const reflectedTexture=reflection.getRenderTarget().texture;reflectedTexture.generateMipmaps=true;reflectedTexture.minFilter=T.LinearMipmapLinearFilter;\n const mirrorMaterial=reflection.material")
a=s.index('        vec2 mu=vMirrorCoord');b=s.index('`);',a)
s=s[:a]+'''        vec2 mu=vMirrorCoord.xy/vMirrorCoord.w;
        if(vMirrorCoord.w>0.0&&all(greaterThanEqual(mu,vec2(0.0)))&&all(lessThanEqual(mu,vec2(1.0)))){
         float mirrorLod=log2(1.0+material.roughness*material.roughness*512.0*.2);
         vec3 mirrorRadiance=textureLod(uMirrorMap,mu,mirrorLod).rgb;
         reflectedLight.indirectSpecular=mirrorRadiance*EnvironmentBRDF(geometryNormal,geometryViewDir,material.specularColor,material.specularF90,material.roughness);
        }''' +s[b:]
s=s.replace(" // Reflector's matrix", " // shortcut: roughness-dependent reflection mips approximate GGX filtering; compare against the native floor before upgrading.\n // Reflector's matrix")
s=s.replace('unfold=smoothRange(.15,.85,p)','weights=surfaceWeights(p),unfold=weights.aperture').replace('38+10*smoothRange(.4,1,p)','38+10*smoothRange(.43,1,p)')
s=s.replace('for(const mesh of moving){const dict=mesh.morphTargetDictionary!,weights=mesh.morphTargetInfluences!;weights[dict.Space_Unfold]=unfold*e;weights[dict.Gift_Entry]=1-e;}','for(const{mesh,kind}of moving){const dict=mesh.morphTargetDictionary!,influences=mesh.morphTargetInfluences!;influences[dict.Space_Unfold]=(kind===\'rail\'?weights.rail:weights.aperture)*e;influences[dict.Gift_Entry]=1-e;}')
s=s.replace('environmentMix.value=smoothRange(.2,1,p);','environmentMix.value=smoothRange(.43,1,p);apertureMix.value=weights.aperture;')
p.write_text(s)
p=R/'src/landing/cinematic/folded/chamber-asset.test.ts';s=p.read_text().replace('folded-chamber-v6','folded-chamber-v7').replace('[0,.65,1]','[0,.43,1]').replace('dynamic).toHaveLength(5)','dynamic).toHaveLength(6)');p.write_text(s)
print('R7_RUNTIME_WRITTEN')

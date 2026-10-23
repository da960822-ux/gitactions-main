import * as T from 'three';
import type {createApprovedGamingRoom} from './ApprovedGamingRoom';
import {heroContain,heroWorldProjection} from './initialCosmicHero';

type CanonicalRoom=ReturnType<typeof createApprovedGamingRoom>;
type Options={width:number;height:number;portrait:string;portraitMask?:string};
type Built={update:(progress:number,camera:T.PerspectiveCamera)=>void;syncView:(camera:T.PerspectiveCamera)=>void;setActive:(active:boolean)=>void;dispose:()=>void};

export function createHeroRoomJourney(scene:T.Scene,canonicalRoom:CanonicalRoom,options:Options){
 let width=options.width,height=options.height,disposed=false,active=true,built:Built|undefined,loaded:T.Texture[]|undefined;
 const reducedMotion=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):undefined;
 const textures=new Set<T.Texture>();
 function build([image,portraitImage,portraitMask,sourceMatte,cleanplate]:T.Texture[]):Built{
  const aspect=width/height,tan=Math.tan(T.MathUtils.degToRad(24)),rx=aspect<1.5?aspect/1.5:1,ry=aspect>1.5?1.5/aspect:1;
  const coreHeight=4.9,coreWidth=coreHeight*1672/941,roomScale=coreHeight/(48*tan),roomCenter=new T.Vector3(-8.7,.8,-12);
  // Adapted from ThreeUI glassToggleScene.resize: fit the subject by camera distance, preserving its physical geometry.
  const endDistance=Math.max(coreHeight,coreWidth/aspect)/(2*tan),endEye=roomCenter.clone().add(new T.Vector3(0,0,endDistance));
  canonicalRoom.root.updateWorldMatrix(true,false);
  const prototypeB=new T.Matrix4().compose(roomCenter,new T.Quaternion(),new T.Vector3(roomScale,roomScale,roomScale));
  const normalization=canonicalRoom.root.matrixWorld.clone().multiply(prototypeB.invert());
  const rotation=new T.Quaternion(),scaling=new T.Vector3();normalization.decompose(new T.Vector3(),rotation,scaling);
  if(scaling.x<=0||Math.abs(scaling.x-scaling.y)>1e-8||Math.abs(scaling.x-scaling.z)>1e-8)throw Error('Hero/B registration requires positive uniform scale');
  const source=canonicalRoom.root.getObjectByName('BYTE_UNTOUCHED_APPROVED_ROOM_WITH_OUTER_ROWS') as T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>|undefined;
  if(!source?.material.map)throw Error('Hero arrival requires the original approved room source');
  const scale=scaling.x,stage=new T.Group();stage.name='HERO_ROOM_JOURNEY';stage.matrixAutoUpdate=false;stage.matrix.copy(normalization);stage.visible=active;scene.add(stage);
  const startEye=endEye.clone().add(new T.Vector3(0,0,2.05)),lensRatio=endDistance/(endDistance+2.05),startTan=tan*lensRatio,lateral=.75*startTan*aspect*1.75/rx;
  const foreground=new T.Group();foreground.name='REGISTERED_COSMIC_FOREGROUND';foreground.position.copy(startEye);stage.add(foreground);
  const smooth=(a:number,b:number,p:number)=>{const t=T.MathUtils.clamp((p-a)/(b-a),0,1);return t*t*(3-2*t);};
  const geometries:T.BufferGeometry[]=[],materials:T.Material[]=[],archOnly={value:0};
  function surface(name:string,map:T.Texture,depthAt:(u:number)=>number,maskMode?:'core'|'feather'|'inverse'){
   const geometry=new T.PlaneGeometry(1,1,66,42),position=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');geometries.push(geometry);
   for(let i=0;i<position.count;i++){
    const column=i%67,row=Math.floor(i/67),u=T.MathUtils.clamp((column-1)/64,0,1),v=T.MathUtils.clamp((row-1)/40,0,1);
    const x=column===0?-1.04:column===66?1.04:2*u-1,y=row===0?1.04:row===42?-1.04:1-2*v,distance=depthAt(u);
    position.setXYZ(i,x*startTan*aspect*distance/rx,y*startTan*distance/ry,-distance);uv.setXY(i,u,1-v);
   }
   geometry.computeVertexNormals();geometry.computeBoundingSphere();
   const material=new T.MeshBasicMaterial({map,side:T.DoubleSide,toneMapped:false,alphaTest:maskMode==='feather'?.005:maskMode?.5:0,transparent:maskMode==='feather',depthWrite:maskMode!=='feather'});materials.push(material);
   if(maskMode){
    material.onBeforeCompile=shader=>{
     shader.uniforms.heroSourceMatte={value:sourceMatte};shader.uniforms.heroMatteMode={value:maskMode==='inverse'?0:maskMode==='core'?1:2};shader.uniforms.heroArchOnly=maskMode==='inverse'?{value:0}:archOnly;
     shader.fragmentShader='uniform sampler2D heroSourceMatte;\nuniform float heroMatteMode;\nuniform float heroArchOnly;\n'+shader.fragmentShader;
     shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`
      float sourceAlpha=texture2D(heroSourceMatte,vMapUv).a;
      if(heroMatteMode<.5)sourceAlpha=1.-step(.005,sourceAlpha);
      else if(heroMatteMode<1.5)sourceAlpha=step(.98,sourceAlpha);
      else sourceAlpha*=1.-step(.98,sourceAlpha);
      diffuseColor.a*=sourceAlpha*(1.-heroArchOnly*step(.34,vMapUv.x));
      #include <alphatest_fragment>
     `);
    };
    material.customProgramCacheKey=()=> 'hero-original-rgba-core-feather-v2';
   }
   const mesh=new T.Mesh(geometry,material);mesh.name=name;mesh.frustumCulled=false;foreground.add(mesh);return mesh;
  }
  const clean=surface('COSMIC_DISOCCLUSION_ONLY',cleanplate,()=>6);
  const sky=surface('ORIGINAL_COSMIC_SKY',image,()=>4.8,'inverse');
  const near=surface('ORIGINAL_ARCH_TERRACE_SILHOUETTE',image,u=>T.MathUtils.lerp(1.75,4.35,smooth(.34,.39,u)),'core');
  const feather=surface('ORIGINAL_ARCH_TERRACE_FEATHER',image,u=>T.MathUtils.lerp(1.75,4.35,smooth(.34,.39,u)),'feather');
  const portraitMaterial=new T.MeshBasicMaterial({map:portraitImage,alphaMap:portraitMask,transparent:true,alphaTest:.005,depthWrite:true,toneMapped:false,side:T.DoubleSide});materials.push(portraitMaterial);
  const portraitGeometry=new T.PlaneGeometry(6.2*1312/1199,6.2);geometries.push(portraitGeometry);
  const portrait=new T.Mesh(portraitGeometry,portraitMaterial);portrait.name='RIGID_APPROVED_PORTRAIT';portrait.matrixAutoUpdate=false;foreground.add(portrait);
  const originalPortrait=new T.Matrix4().makeScale(2,2,2).multiply(new T.Matrix4().makeTranslation(6,-.5,-3.1-heroContain(width,height))).multiply(heroWorldProjection(width,height,1)).multiply(new T.Matrix4().makeTranslation(1.85,.03,.05));
  // Rebase the approved rays to the initial lens once; the portrait stays rigid throughout the journey.
  const portraitScale=4.2/-new T.Vector3().setFromMatrixPosition(originalPortrait).z;
  portrait.matrix.copy(new T.Matrix4().makeScale(portraitScale*lensRatio,portraitScale*lensRatio,portraitScale).multiply(originalPortrait));
  const eye=new T.Vector3(),state={vertices:near.geometry.getAttribute('position').count,indexed:!!near.geometry.index,transition:'source-foreground-occlusion',pose:'standing',foregroundMode:'full-terrace',portraitOpacity:1,reducedMotion:false,cameraTravel:0,roomDepth:endDistance+2.05};
  return{update(progress,output){
   const p=T.MathUtils.clamp(progress,0,1),before=p<.21,reduced=!!reducedMotion?.matches,motion=reduced?(before?0:1):p;
   const approach=smooth(.06,.18,motion),around=smooth(.24,.33,motion),arrival=smooth(.33,.42,motion);
   // Stop before the original jamb, pass its open edge, then move forward; the camera never crosses its solid silhouette.
   eye.copy(startEye);eye.x-=lateral*approach*(1-around);eye.z-=1.4*approach+.65*arrival;
   sky.visible=portrait.visible=clean.visible=before;near.visible=feather.visible=!reduced||before;archOnly.value=before?0:1;
   // The pose edit occurs inside the source silhouette's full-frame opaque coverage, not in an exposed face.
   state.reducedMotion=reduced;state.pose=before?'standing':'seated';state.foregroundMode=before?'full-terrace':'arch-only';state.portraitOpacity=before?1:0;state.cameraTravel=startEye.distanceTo(eye);state.roomDepth=eye.z-roomCenter.z;
   output.position.copy(eye).applyMatrix4(normalization);output.quaternion.copy(rotation);output.up.set(0,1,0).applyQuaternion(rotation);output.scale.setScalar(1);
   // The continuous dolly/lens pair keeps B's approved size; its camera and projection are exact at arrival.
   output.clearViewOffset();output.fov=T.MathUtils.radToDeg(2*Math.atan(tan*endDistance/state.roomDepth));output.aspect=aspect;output.near=.02*scale;output.far=120*scale;output.updateProjectionMatrix();output.updateMatrixWorld(true);
   output.userData.heroSurface=state;stage.updateMatrixWorld(true);
  },syncView(){},setActive(value){stage.visible=value;},dispose(){stage.removeFromParent();geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());}};
 }
 function rebuild(){if(!loaded||disposed)return;built?.dispose();built=undefined;built=build(loaded);}
 function dispose(){if(disposed)return;disposed=true;built?.dispose();built=undefined;textures.forEach(texture=>texture.dispose());textures.clear();}
 const loader=new T.TextureLoader();
 const ready=Promise.all(['/images/our-universe-scene.webp',options.portrait,options.portraitMask??'/images/approved-couple-room/character-opacity-mask.png','/images/approved-couple-room/hero-near-source-opacity.png','/images/approved-couple-room/hero-cosmic-disocclusion-plate.webp'].map(path=>loader.loadAsync(path).then(texture=>{if(disposed)texture.dispose();else textures.add(texture);return texture;}))).then(async maps=>{
  await canonicalRoom.ready;if(disposed)return;maps[0].colorSpace=maps[1].colorSpace=maps[4].colorSpace=T.SRGBColorSpace;maps[2].colorSpace=maps[3].colorSpace=T.NoColorSpace;loaded=maps;rebuild();
 }).catch(error=>{dispose();throw error;});
 return{ready,update(progress:number,camera:T.PerspectiveCamera){if(!disposed&&active)built?.update(progress,camera);},syncView(camera:T.PerspectiveCamera){if(!disposed&&active)built?.syncView(camera);},resize(nextWidth:number,nextHeight:number){if(width===nextWidth&&height===nextHeight)return;width=nextWidth;height=nextHeight;rebuild();},setActive(value:boolean){if(disposed)return;active=value;built?.setActive(value);},dispose};
}

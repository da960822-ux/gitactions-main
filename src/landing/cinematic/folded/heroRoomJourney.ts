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
 function build([image,portraitImage,portraitMask,semanticMask]:T.Texture[]):Built{
  const aspect=width/height,tan=Math.tan(T.MathUtils.degToRad(24)),rx=aspect<1.5?aspect/1.5:1,ry=aspect>1.5?1.5/aspect:1;
  const coreHeight=4.9,coreWidth=coreHeight*1672/941,roomScale=coreHeight/(48*tan),roomCenter=new T.Vector3(-8.7,.8,-12);
  // Adapted from ThreeUI glassToggleScene.resize: fit the subject by camera distance, preserving its physical geometry.
  const endDistance=Math.max(coreHeight,coreWidth/aspect)/(2*tan),endEye=roomCenter.clone().add(new T.Vector3(0,0,endDistance));
  canonicalRoom.root.updateWorldMatrix(true,false);
  const prototypeB=new T.Matrix4().compose(roomCenter,new T.Quaternion(),new T.Vector3(roomScale,roomScale,roomScale));
  const normalization=canonicalRoom.root.matrixWorld.clone().multiply(prototypeB.invert());
  const rotation=new T.Quaternion(),translation=new T.Vector3(),scaling=new T.Vector3();normalization.decompose(translation,rotation,scaling);
  if(scaling.x<=0||Math.abs(scaling.x-scaling.y)>1e-8||Math.abs(scaling.x-scaling.z)>1e-8)throw Error('Hero/B registration requires positive uniform scale');
  const source=canonicalRoom.root.getObjectByName('BYTE_UNTOUCHED_APPROVED_ROOM_WITH_OUTER_ROWS') as T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>|undefined;
  if(!source?.material.map)throw Error('Hero arrival requires the original approved room source');
  const scale=scaling.x,stage=new T.Group();stage.name='HERO_ROOM_JOURNEY';stage.matrixAutoUpdate=false;stage.matrix.copy(normalization);stage.visible=active;scene.add(stage);
  const foreground=new T.Group();foreground.name='REGISTERED_COSMIC_FOREGROUND';stage.add(foreground);
  const smooth=(a:number,b:number,p:number)=>{const t=T.MathUtils.clamp((p-a)/(b-a),0,1);return t*t*(3-2*t);};
  const depth=1.75,halfWidth=tan*aspect*depth/rx,halfHeight=tan*depth/ry;
  const geometry=new T.PlaneGeometry(2*halfWidth,2*halfHeight,66,42),position=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
  // Extend only the border: pointer travel exposed 14px at 1920; 3% half-width supplies 29px without rescaling source pixels.
  for(let i=0;i<position.count;i++){
   const column=i%67,row=Math.floor(i/67),u=T.MathUtils.clamp((column-1)/64,0,1),v=T.MathUtils.clamp((row-1)/40,0,1);
   const x=column===0?-1.03:column===66?1.03:2*u-1,y=row===0?1.03:row===42?-1.03:1-2*v;
   position.setXYZ(i,x*halfWidth,y*halfHeight,-depth);uv.setXY(i,u,1-v);
  }
  const rest=new Float32Array(position.array);geometry.computeBoundingSphere();
  const material=new T.MeshBasicMaterial({map:image,side:T.DoubleSide,toneMapped:false});
  const surface=new T.Mesh(geometry,material);surface.name='INDEXED_COSMIC_DEPARTURE_SURFACE';surface.frustumCulled=false;foreground.add(surface);
  const portraitMaterial=new T.MeshBasicMaterial({map:portraitImage,alphaMap:portraitMask,transparent:true,alphaTest:.005,depthWrite:true,toneMapped:false,side:T.DoubleSide});
  const portrait=new T.Mesh(new T.PlaneGeometry(6.2*1312/1199,6.2),portraitMaterial);portrait.name='RIGID_APPROVED_PORTRAIT';portrait.matrixAutoUpdate=false;
  const originalPortrait=new T.Matrix4().makeScale(2,2,2).multiply(new T.Matrix4().makeTranslation(6,-.5,-3.1-heroContain(width,height))).multiply(heroWorldProjection(width,height,1)).multiply(new T.Matrix4().makeTranslation(1.85,.03,.05));
  // Uniform camera-origin scaling preserves every approved portrait ray and keeps the face plane rigid.
  const portraitDepth=1.35,portraitScale=portraitDepth/-new T.Vector3().setFromMatrixPosition(originalPortrait).z;
  const portraitRegistration=new T.Matrix4().makeScale(portraitScale,portraitScale,portraitScale).multiply(originalPortrait);
  const portraitRig=new T.Group();portraitRig.name='RIGID_PORTRAIT_DEPARTURE';foreground.add(portraitRig);portraitRig.add(portrait);portrait.matrix.copy(portraitRegistration);
  source.updateWorldMatrix(true,false);
  const semanticMaterial=new T.MeshBasicMaterial({map:source.material.map,side:T.DoubleSide,toneMapped:false,alphaTest:.5,alphaToCoverage:true,depthTest:false,depthWrite:false});
  semanticMaterial.onBeforeCompile=(shader,renderer)=>{
   source.material.onBeforeCompile(shader,renderer);
   shader.uniforms.heroSemanticMask={value:semanticMask};
   shader.fragmentShader='uniform sampler2D heroSemanticMask;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`
    // Continue the source-derived desk coverage through the approved outer rows.
    vec2 maskUv=clamp(vMapUv,vec2(0.),vec2(1.));
    vec2 texel=vec2(2./1672.,2./941.);
    vec3 maskColor=vec3(0.);
    // Close the matte's two-pixel ink-line gaps, including diagonals; RGB is still the approved source shader's result.
    for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
     maskColor=max(maskColor,texture2D(heroSemanticMask,maskUv+vec2(float(x),float(y))*texel).rgb);
    }
    diffuseColor.a*=max(maskColor.r,max(maskColor.g,maskColor.b));
    #include <alphatest_fragment>
   `);
  };
  semanticMaterial.customProgramCacheKey=()=>source.material.customProgramCacheKey()+'-hero-semantic-outer-rows-v2';
  const seated=new T.Mesh(source.geometry.clone(),semanticMaterial);seated.name='OPAQUE_APPROVED_B_FOREGROUND';seated.renderOrder=2;seated.matrixAutoUpdate=false;
  seated.matrix.copy(normalization.clone().invert().multiply(source.matrixWorld));stage.add(seated);
  const eye=new T.Vector3();
  const state={vertices:position.count,indexed:!!geometry.index,bend:0,maxVertexDisplacement:0,portraitOpacity:1,cameraTravel:0,sourceDepth:depth,roomDepth:endDistance,pose:'standing',foregroundOpaque:false};
  let previousDepth=NaN,previousBend=NaN;
  function deform(sourceDepth:number,bend:number){
   if(sourceDepth===previousDepth&&bend===previousBend)return;previousDepth=sourceDepth;previousBend=bend;state.bend=bend;state.sourceDepth=sourceDepth;state.maxVertexDisplacement=0;
   for(let i=0;i<position.count;i++){
    const x=rest[i*3],y=rest[i*3+1],envelope=Math.sin(Math.PI*uv.getX(i))*Math.sin(Math.PI*uv.getY(i));
    const recession=bend*envelope*envelope,nx=x*sourceDepth/depth,ny=y*sourceDepth/depth,nz=-sourceDepth-recession;
    position.setXYZ(i,nx,ny,nz);state.maxVertexDisplacement=Math.max(state.maxVertexDisplacement,Math.hypot(nx-x,ny-y,nz+depth));
   }
   position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
  }
  return{update(progress,output){
   const p=T.MathUtils.clamp(progress,0,1),travel=.65*(1-smooth(0,.22,p))*(reducedMotion?.matches ? .25 : 1);
   eye.copy(endEye);eye.z+=travel;
   // A source-registered edge ring stays outside the frustum while the actual mesh crosses behind B.
   const retreat=smooth(.24,.42,p),sourceDepth=T.MathUtils.lerp(depth,endDistance+.15,retreat);
   const bend=(.30+.22*(sourceDepth-depth))*smooth(.18,.28,p)*(reducedMotion?.matches ? .25 : 1);
   state.cameraTravel=travel;state.roomDepth=endDistance+travel;deform(sourceDepth,bend);
   // One opaque standing→seated editorial pose cut; neither face is crossfaded or vertex-warped.
   portraitRig.visible=p<.24;seated.visible=p>=.24&&p<.42;state.portraitOpacity=portraitRig.visible?1:0;state.pose=portraitRig.visible?'standing':'seated';state.foregroundOpaque=seated.visible;
   surface.visible=p<.42;
   // Source registration follows the short dolly, preventing the old near-plane face enlargement.
   foreground.position.copy(eye);
   output.position.copy(eye).applyMatrix4(normalization);output.quaternion.copy(rotation);output.up.set(0,1,0).applyQuaternion(rotation);output.scale.setScalar(1);
   output.clearViewOffset();output.fov=48;output.aspect=aspect;output.near=.02*scale;output.far=120*scale;output.updateProjectionMatrix();output.updateMatrixWorld(true);
   output.userData.heroSurface=state;stage.updateMatrixWorld(true);
  },syncView(){},setActive(value){stage.visible=value;},dispose(){stage.removeFromParent();geometry.dispose();material.dispose();portrait.geometry.dispose();portraitMaterial.dispose();seated.geometry.dispose();semanticMaterial.dispose();}};
 }
 function rebuild(){if(!loaded||disposed)return;built?.dispose();built=undefined;built=build(loaded);}
 function dispose(){if(disposed)return;disposed=true;built?.dispose();built=undefined;textures.forEach(texture=>texture.dispose());textures.clear();}
 const loader=new T.TextureLoader();
 const ready=Promise.all(['/images/our-universe-scene.webp',options.portrait,options.portraitMask??'/images/approved-couple-room/character-opacity-mask.png','/images/approved-couple-room/foreground-semantic-mask.png'].map(path=>loader.loadAsync(path).then(texture=>{if(disposed)texture.dispose();else textures.add(texture);return texture;}))).then(async maps=>{
  await canonicalRoom.ready;if(disposed)return;maps[0].colorSpace=maps[1].colorSpace=T.SRGBColorSpace;maps[2].colorSpace=maps[3].colorSpace=T.NoColorSpace;loaded=maps;rebuild();
 }).catch(error=>{dispose();throw error;});
 return{ready,update(progress:number,camera:T.PerspectiveCamera){if(!disposed&&active)built?.update(progress,camera);},syncView(camera:T.PerspectiveCamera){if(!disposed&&active)built?.syncView(camera);},resize(nextWidth:number,nextHeight:number){if(width===nextWidth&&height===nextHeight)return;width=nextWidth;height=nextHeight;rebuild();},setActive(value:boolean){if(disposed)return;active=value;built?.setActive(value);},dispose};
}

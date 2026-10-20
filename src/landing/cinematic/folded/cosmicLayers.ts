import * as T from 'three';
import {COSMIC_COVERAGE_GLSL} from './cosmicOwnership';
import {cameraPose,smoothRange} from './poseSpaceV19';

type Keep=<A extends{dispose:()=>void}>(resource:A)=>A;
export const COSMIC_CLEANPLATE='/images/hero-cosmic-layers/cosmic-disocclusion-plate.png';
export const COSMIC_MATTE='/images/hero-cosmic-layers/near-foreground-matte.png';
export function cosmicLayerPose(progress:number){
 return{separation:smoothRange(.08,.10,progress),farOpacity:1-smoothRange(.14,.16,progress),approach:3*smoothRange(.10,.14,progress)+2.2*smoothRange(.24,.44,progress),nearOpacity:1-smoothRange(.38,.50,progress),room:smoothRange(.12,.14,progress)};
}
export function cosmicOwnership(x:number){return x<800?'left-props':x>960?'right-props':'structure';}
export function cosmicStructuralWeight(x:number){return smoothRange(800,835,x)*(1-smoothRange(925,960,x));}

/** Local artwork remains frontal2.5D; only the owned wood/stone strip has changing surface normals. */
export function createCosmicForeground(scene:T.Scene,keep:Keep){
 const geometry=keep(new T.PlaneGeometry(1,1,192,128)),position=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
 const material=keep(new T.MeshBasicMaterial({toneMapped:false,side:T.DoubleSide,transparent:true,alphaTest:.02,depthWrite:true,vertexColors:true}));
 geometry.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(position.count*3).fill(1),3));
 const mesh=new T.Mesh(geometry,material);mesh.name='COSMIC_LOCAL_RIGID_PROPS_AND_OWNED_STRUCTURE';mesh.frustumCulled=false;mesh.renderOrder=3;scene.add(mesh);
 material.onBeforeCompile=shader=>{shader.fragmentShader=COSMIC_COVERAGE_GLSL+'\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <alphamap_fragment>',`
  #ifdef USE_ALPHAMAP
   float coverage=originalNearCoverage(vAlphaMapUv,texture2D(alphaMap,vAlphaMapUv).g);
   diffuseColor.a*=smoothstep(.30,.70,coverage);
  #endif
 `);};material.customProgramCacheKey=()=> 'cosmic-local-original-RGB-source-traced-stone-filtered-foliage';
 let key='',last='';const eye=new T.Vector3();
 return{mesh,material,setImages(rgb:T.Texture,matte:T.Texture){material.map=rgb;material.alphaMap=matte;material.needsUpdate=true;},update(p:number,width:number,height:number){
  const pose=cosmicLayerPose(p),signature=[p,width,height].join(':');if(signature===last)return;last=signature;
  const base=cameraPose(p,1,false).position;eye.fromArray(base);eye.z+=9.6*(Math.max(1,(1672/941)/(width/height))-1);
  mesh.visible=width>=760&&pose.separation>0&&pose.nearOpacity>0;material.opacity=pose.nearOpacity;if(!mesh.visible)return;
  const aspect=width/height,imageAspect=1.5,rx=aspect<imageAspect?aspect/imageAspect:1,ry=aspect>imageAspect?imageAspect/aspect:1,tan=Math.tan(24*Math.PI/180);
  const bend=smoothRange(.12,.34,p),colors=geometry.getAttribute('color');
  for(let i=0;i<position.count;i++){
   const u=uv.getX(i),v=uv.getY(i),sourceX=u*1536,sourceY=(1-v)*1024;
   const nx=(u*2-1)/rx,ny=(v*2-1)/ry,weight=cosmicStructuralWeight(sourceX);
   const tableDepth=(eye.y+1.3)/Math.max(.16,-ny*tan),table=smoothRange(790,850,sourceY);
   const depth=6+(tableDepth-6)*table*weight*bend;
   position.setXYZ(i,eye.x+nx*depth*tan*aspect,eye.y+ny*depth*tan,eye.z-depth+pose.approach);
  }
  position.needsUpdate=true;geometry.computeVertexNormals();const normals=geometry.getAttribute('normal');
  for(let i=0;i<position.count;i++){const shade=1-.16*bend*cosmicStructuralWeight(uv.getX(i)*1536)*(1-Math.abs(normals.getY(i)));colors.setXYZ(i,shade,shade,shade);}colors.needsUpdate=true;
  key=width+':'+height;geometry.computeBoundingSphere();mesh.updateMatrixWorld();
 },get state(){return{projection:key,ownership:'whole left x<800 and right x>960 props rigid; only central wood/stone deforms',sourceRGB:'unchanged original panorama',matte:'filtered technical matte with source-traced original arch/capital/rail with filtered foliage matte'};}};
}

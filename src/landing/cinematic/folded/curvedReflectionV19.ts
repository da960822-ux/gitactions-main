import {applyMineralDetail} from './mineralDetail';
import *as T from 'three';
import {SSRPass} from 'three/addons/postprocessing/SSRPass.js';
import {FullScreenQuad} from 'three/addons/postprocessing/Pass.js';

type SurfaceMaterial=T.Material&{map?:T.Texture|null;normalMap?:T.Texture|null;normalScale?:T.Vector2};
function preserveAlpha(material:T.Material,source:SurfaceMaterial){
 if(!source.map||!source.alphaTest)return;
 material.onBeforeCompile=shader=>{
  shader.uniforms.uCutout={value:source.map};shader.uniforms.uAlphaThreshold={value:source.alphaTest};
  shader.vertexShader='varying vec2 vCutoutUv;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvCutoutUv=uv;');
  shader.fragmentShader='uniform sampler2D uCutout;uniform float uAlphaThreshold;varying vec2 vCutoutUv;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace(/void main\s*\(\s*\)\s*\{/, 'void main(){if(texture2D(uCutout,vCutoutUv).a<uAlphaThreshold)discard;');
 };
 material.customProgramCacheKey=()=>source.map!.uuid+':cutout:'+source.alphaTest;
}
export class CurvedSSRPass extends SSRPass{
 private auxiliary=new Map<string,T.Material>();
 renderGeometryPass(renderer:T.WebGLRenderer,target:T.WebGLRenderTarget,normal:boolean){
  const background=this.scene.background,override=this.scene.overrideMaterial,autoClear=renderer.autoClear,clear=new T.Color();renderer.getClearColor(clear);const alpha=renderer.getClearAlpha(),previous=renderer.getRenderTarget();
  const backups:{mesh:T.Mesh;material:T.Material|T.Material[]}[]=[];
  try{
   this.scene.background=null;this.scene.overrideMaterial=null;renderer.autoClear=true;renderer.setRenderTarget(target);renderer.setClearColor(0,0);renderer.clear();
   this.scene.traverseVisible(object=>{
    if(!(object instanceof T.Mesh))return;const selected=this.selects?.includes(object)??false,original=object.material;backups.push({mesh:object,material:original});
    const convert=(source:SurfaceMaterial)=>{
     const glass=Boolean(source.userData.cosmicGlass);const key=source.uuid+':'+normal+':'+selected+':'+(glass&&source.opacity<.15);if(this.auxiliary.has(key))return this.auxiliary.get(key)!;if(glass&&source.opacity<.15){const hidden=new T.MeshBasicMaterial({visible:false});this.auxiliary.set(key,hidden);return hidden;}if(this.auxiliary.has(key))return this.auxiliary.get(key)!;
     const material=normal?new T.MeshNormalMaterial({side:source.side,normalMap:source.normalMap??null,normalScale:source.normalScale??new T.Vector2(1,1)}):new T.MeshBasicMaterial({color:selected?0xffffff:0x000000,side:source.side,toneMapped:false});
     material.clippingPlanes=source.clippingPlanes;material.clipIntersection=source.clipIntersection;material.clipShadows=source.clipShadows;preserveAlpha(material,source);if(normal&&source.userData.mineralDetail){const alphaHook=material.onBeforeCompile;material.onBeforeCompile=(shader,renderer)=>{alphaHook(shader,renderer);applyMineralDetail(shader);};material.customProgramCacheKey=()=>source.uuid+':mineral-normal';}this.auxiliary.set(key,material);return material;
    };
    object.material=Array.isArray(original)?original.map(convert):convert(original);
   });
   renderer.render(this.scene,this.camera);
  }finally{
   for(const{mesh,material}of backups)mesh.material=material;
   this.scene.background=background;this.scene.overrideMaterial=override;renderer.autoClear=autoClear;renderer.setClearColor(clear,alpha);renderer.setRenderTarget(previous);
  }
 }
 _renderOverride(renderer:T.WebGLRenderer,_material:T.Material,target:T.WebGLRenderTarget){this.renderGeometryPass(renderer,target,true);}
 _renderMetalness(renderer:T.WebGLRenderer,_material:T.Material,target:T.WebGLRenderTarget){this.renderGeometryPass(renderer,target,false);}
 override dispose(){for(const material of this.auxiliary.values())material.dispose();this.auxiliary.clear();this.ssrMaterial.dispose();super.dispose();}
}
export function createCurvedFloorReflection(renderer:T.WebGLRenderer,scene:T.Scene,camera:T.PerspectiveCamera,receivers:T.Mesh[]){
 const size=renderer.getDrawingBufferSize(new T.Vector2()),pass=new CurvedSSRPass({renderer,scene,camera,width:size.x,height:size.y,selects:receivers,groundReflector:null});
 pass.resolutionScale=.5;pass.output=SSRPass.OUTPUT.SSR;pass.renderToScreen=false;pass.blur=false;pass.opacity=.09;pass.maxDistance=18;pass.thickness=.08;pass.beautyRenderTarget.depthTexture!.type=T.UnsignedIntType;
 for(const target of[pass.ssrRenderTarget,pass.blurRenderTarget,pass.blurRenderTarget2])target.texture.type=T.HalfFloatType;
 pass.ssrMaterial.fragmentShader=pass.ssrMaterial.fragmentShader.replace('void main(){','void main(){gl_FragColor=vec4(0.);');
 const blurMaterial=new T.ShaderMaterial({uniforms:{inputMap:{value:pass.ssrRenderTarget.texture},axis:{value:new T.Vector2()},sigma:{value:2.6}},depthTest:false,depthWrite:false,toneMapped:false,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'uniform sampler2D inputMap;uniform vec2 axis;uniform float sigma;varying vec2 vUv;void main(){vec3 premul=vec3(0.);float alpha=0.;float total=0.;for(int i=-16;i<=16;i++){float d=float(i),w=exp(-.5*d*d/(sigma*sigma));vec4 c=texture2D(inputMap,clamp(vUv+axis*d,vec2(0.),vec2(1.)));premul+=c.rgb*c.a*w;alpha+=c.a*w;total+=w;}gl_FragColor=vec4(premul/max(alpha,1e-6),alpha/total);}'});
 const overlayMaterial=new T.ShaderMaterial({uniforms:{reflection:{value:pass.blurRenderTarget2.texture},receiver:{value:pass.metalnessRenderTarget.texture}},transparent:true,depthTest:false,depthWrite:false,toneMapped:true,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'uniform sampler2D reflection;uniform sampler2D receiver;varying vec2 vUv;void main(){gl_FragColor=texture2D(reflection,vUv);gl_FragColor.rgb*=vec3(.46,.23,.27);gl_FragColor.a*=step(.5,texture2D(receiver,vUv).r);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});
 const blurQuad=new FullScreenQuad(blurMaterial),overlayQuad=new FullScreenQuad(overlayMaterial);
 function resize(){const dimensions=renderer.getDrawingBufferSize(size);pass.setSize(dimensions.x,dimensions.y);}
 return{pass,colorAttachmentBytes(){return[pass.beautyRenderTarget,pass.normalRenderTarget,pass.metalnessRenderTarget,pass.ssrRenderTarget,pass.blurRenderTarget,pass.blurRenderTarget2].reduce((total,target)=>total+target.width*target.height*(target.texture.type===T.HalfFloatType?8:4),0);},render(){
  pass.ssrMaterial.uniforms.cameraProjectionMatrix.value.copy(camera.projectionMatrix);pass.ssrMaterial.uniforms.cameraInverseProjectionMatrix.value.copy(camera.projectionMatrixInverse);
  const target=renderer.getRenderTarget(),autoClear=renderer.autoClear;
  try{
   pass.render(renderer,pass.blurRenderTarget2,pass.beautyRenderTarget,0,false);
   const w=pass.ssrRenderTarget.width,h=pass.ssrRenderTarget.height;blurMaterial.uniforms.sigma.value=Math.max(.65,.14*.14*h/Math.tan(T.MathUtils.degToRad(camera.fov/2))*.035);
   blurMaterial.uniforms.inputMap.value=pass.ssrRenderTarget.texture;blurMaterial.uniforms.axis.value.set(1/w,0);renderer.setRenderTarget(pass.blurRenderTarget);blurQuad.render(renderer);
   blurMaterial.uniforms.inputMap.value=pass.blurRenderTarget.texture;blurMaterial.uniforms.axis.value.set(0,1/h);renderer.setRenderTarget(pass.blurRenderTarget2);blurQuad.render(renderer);
   renderer.setRenderTarget(target);renderer.autoClear=true;renderer.render(scene,camera);
   renderer.autoClear=false;overlayQuad.render(renderer);
  }finally{renderer.autoClear=autoClear;renderer.setRenderTarget(target);}
 },resize,dispose(){pass.dispose();blurMaterial.dispose();overlayMaterial.dispose();blurQuad.dispose();overlayQuad.dispose();}};
}

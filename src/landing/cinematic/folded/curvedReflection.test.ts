import {describe,it,expect} from 'vitest';
import *as T from 'three';
import {CurvedSSRPass} from './curvedReflection';
describe('curved reflection auxiliary rendering',()=>{
 it('restores source materials and renderer state even when a buffer render fails',()=>{
  const scene=new T.Scene(),background=new T.Color('#12050b');scene.background=background;
  const texture=new T.DataTexture(new Uint8Array([255,255,255,0]),1,1,T.RGBAFormat),material=new T.MeshBasicMaterial({map:texture,alphaTest:.025}),mesh=new T.Mesh(new T.PlaneGeometry(),material);scene.add(mesh);
  const override=new T.MeshBasicMaterial();scene.overrideMaterial=override;
  const clear=new T.Color('#123456');let target:T.WebGLRenderTarget|null=null,alpha=.3;
  let auxiliary:T.Material|undefined;
  const renderer={autoClear:false,getClearColor:(out:T.Color)=>out.copy(clear),getClearAlpha:()=>alpha,getRenderTarget:()=>target,setRenderTarget:(value:T.WebGLRenderTarget|null)=>{target=value;},setClearColor:(value:T.ColorRepresentation,a=1)=>{clear.set(value);alpha=a;},clear:()=>{},render:()=>{auxiliary=mesh.material;throw Error('buffer failure');}}as unknown as T.WebGLRenderer;
  const pass=new CurvedSSRPass({renderer,scene,camera:new T.PerspectiveCamera(),selects:[],groundReflector:null,width:16,height:16}),buffer=new T.WebGLRenderTarget(16,16);
  expect(()=>pass.renderGeometryPass(renderer,buffer,true)).toThrow('buffer failure');
  expect(mesh.material).toBe(material);expect(scene.background).toBe(background);expect(scene.overrideMaterial).toBe(override);expect(renderer.autoClear).toBe(false);expect(target).toBe(null);expect(alpha).toBe(.3);expect(clear.getHexString()).toBe('123456');
  const shader={uniforms:{},vertexShader:'#include <uv_vertex>',fragmentShader:'void main() {}'}as unknown as T.WebGLProgramParametersWithUniforms;
  auxiliary!.onBeforeCompile(shader,renderer);expect(shader.fragmentShader).toContain('texture2D(uCutout,vCutoutUv).a<uAlphaThreshold');expect(shader.uniforms.uCutout.value).toBe(texture);expect(shader.uniforms.uAlphaThreshold.value).toBe(.025);
  pass.dispose();buffer.dispose();mesh.geometry.dispose();material.dispose();override.dispose();texture.dispose();
 });
});

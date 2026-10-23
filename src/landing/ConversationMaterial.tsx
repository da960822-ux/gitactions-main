import {useEffect,useRef} from 'react';
import {Camera,Color,GLSL3,Mesh,PlaneGeometry,Scene,ShaderMaterial,Vector2,Vector4,WebGLRenderer} from 'three';
import {flowFragment,flowVertex} from './conversation-flow';
import {advanceWake,recordWake,wakeLimit,type WakePoint} from './conversation-wake';
import type {MotionValue} from 'motion/react';

export function ConversationMaterial({charge}:{charge:MotionValue<number>}){
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const element=host.current;if(!element)return;
  const preference=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover: hover) and (pointer: fine)');
  const figure=element.closest('figure');
  const points:WakePoint[]=[],trail=Array.from({length:wakeLimit},()=>new Vector4(0,0,1,0));
  let pointerTime=0;
  const pointerMove=(event:PointerEvent)=>{
   if(!active||preference.matches||event.pointerType==='mouse'&&!fine.matches)return;
   const bounds=element.getBoundingClientRect(),now=performance.now();
   recordWake(points,(event.clientX-bounds.left)/bounds.width,(event.clientY-bounds.top)/bounds.height,(now-pointerTime)/1000);pointerTime=now;
  };
  const clearWake=()=>{points.length=0;pointerTime=0;};
  const leave=()=>{pointerTime=0;};
  let renderer:WebGLRenderer|undefined,geometry:PlaneGeometry|undefined,material:ShaderMaterial|undefined;
  let visible=false,active=false,failed=false,elapsed=0,lastDraw=0,draws=0;
  const scene=new Scene(),camera=new Camera();
  const stop=()=>{active=false;lastDraw=0;clearWake();element.dataset.wakeCount='0';renderer?.setAnimationLoop(null);element.dataset.loopActive='false';};
  const fail=(reason:string)=>{failed=true;stop();element.dataset.state='fallback';element.dataset.unavailableReason=reason;if(renderer)renderer.domElement.hidden=true;};
  const contextLost=()=>fail('context-lost');
  const resize=()=>{
   if(!renderer||!material)return;
   const {width,height}=element.getBoundingClientRect();if(!width||!height)return;
   const scale=Math.min(1,720/width),w=Math.round(width*scale),h=Math.round(height*scale);
   renderer.setSize(w,h,false);material.uniforms.uResolution.value.set(w,h);
  };
  const tick=(now:number)=>{
   if(!active||!renderer||!material||failed)return;
   if(lastDraw&&now-lastDraw<1000/30)return;
   const dt=lastDraw?Math.min((now-lastDraw)/1000,.1):0;elapsed+=dt;lastDraw=now;
   advanceWake(points,dt);
   trail.forEach((point,index)=>{const sample=points[index];point.set(sample?.x??0,sample?.y??0,sample?.age??1,sample?.width??0);});
   material.uniforms.uTime.value=elapsed;material.uniforms.uCharge.value=charge.get();material.uniforms.uTrailCount.value=points.length;
   element.dataset.wakeCount=String(points.length);
   try{renderer.render(scene,camera);}catch{fail('render-failed');return;}
   if(failed)return;
   element.dataset.state='running';element.dataset.renderCount=String(++draws);
  };
  const initialize=()=>{
   try{
    renderer=new WebGLRenderer({alpha:true,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});
    renderer.setPixelRatio(1);renderer.debug.onShaderError=()=>fail('shader-compile');
    renderer.domElement.className='fc-material-canvas';renderer.domElement.addEventListener('webglcontextlost',contextLost);
    geometry=new PlaneGeometry(2,2);
    material=new ShaderMaterial({glslVersion:GLSL3,vertexShader:flowVertex,fragmentShader:flowFragment,depthTest:false,depthWrite:false,
     uniforms:{uTime:{value:0},uCharge:{value:0},uTrail:{value:trail},uTrailCount:{value:0},uResolution:{value:new Vector2(720,620)},uColorA:{value:new Color('#592c40')},uColorB:{value:new Color('#b75b7b')},uColorC:{value:new Color('#edc2b1')},uColorD:{value:new Color('#8f4c68')}}});
    scene.add(new Mesh(geometry,material));element.append(renderer.domElement);resize();
   }catch{fail('renderer-unavailable');}
  };
  const update=()=>{
   if(failed)return;
   if(preference.matches||!visible||document.hidden){
    stop();element.dataset.state=preference.matches?'fallback':'suspended';if(renderer)renderer.domElement.hidden=true;return;
   }
   if(!renderer)initialize();
   if(!renderer||failed)return;
   renderer.domElement.hidden=false;
   if(!active){active=true;element.dataset.loopActive='true';renderer.setAnimationLoop(tick);}
  };
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;update();});
  const resizeObserver=new ResizeObserver(resize);
  observer.observe(element);resizeObserver.observe(element);update();
  preference.addEventListener('change',update);document.addEventListener('visibilitychange',update);figure?.addEventListener('pointermove',pointerMove);figure?.addEventListener('pointerleave',leave);
  return()=>{
   stop();figure?.removeEventListener('pointermove',pointerMove);figure?.removeEventListener('pointerleave',leave);observer.disconnect();resizeObserver.disconnect();preference.removeEventListener('change',update);document.removeEventListener('visibilitychange',update);
   renderer?.domElement.removeEventListener('webglcontextlost',contextLost);
   geometry?.dispose();material?.dispose();renderer?.dispose();renderer?.forceContextLoss();renderer?.domElement.remove();
  };
 },[charge]);
 return <div ref={host} className="fc-material" data-state="fallback" data-renderer="three-flowing-gradient" data-render-count="0" data-loop-active="false" aria-hidden="true"/>;
}

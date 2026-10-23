import {useEffect,useRef} from 'react';
import {Camera,Color,GLSL3,Mesh,PlaneGeometry,Scene,ShaderMaterial,Vector2,WebGLRenderer} from 'three';
import {connectionEchoProgress,flowFragment,flowVertex} from './conversation-flow';

export function ConversationMaterial({charging=false,echo=0}:{charging?:boolean;echo?:number}){
 const host=useRef<HTMLDivElement>(null);
 const interaction=useRef({charging,echo});
 useEffect(()=>{interaction.current={charging,echo};},[charging,echo]);
 useEffect(()=>{
  const element=host.current;if(!element)return;
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  let renderer:WebGLRenderer|undefined,geometry:PlaneGeometry|undefined,material:ShaderMaterial|undefined;
  let visible=false,active=false,failed=false,elapsed=0,lastDraw=0,draws=0,lastEcho=echo,releasedAt=-Infinity;
  const scene=new Scene(),camera=new Camera();
  const stop=()=>{active=false;lastDraw=0;releasedAt=-Infinity;lastEcho=interaction.current.echo;if(material){material.uniforms.uCharge.value=0;material.uniforms.uEcho.value=-1;}renderer?.setAnimationLoop(null);element.dataset.loopActive='false';};
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
   material.uniforms.uTime.value=elapsed;
   if(lastEcho!==interaction.current.echo){lastEcho=interaction.current.echo;releasedAt=elapsed;}
   material.uniforms.uCharge.value+=(Number(interaction.current.charging)-material.uniforms.uCharge.value)*(1-Math.exp(-dt*14));
   material.uniforms.uEcho.value=connectionEchoProgress(elapsed-releasedAt);
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
     uniforms:{uTime:{value:0},uCharge:{value:0},uEcho:{value:-1},uResolution:{value:new Vector2(720,620)},uColorA:{value:new Color('#592c40')},uColorB:{value:new Color('#b75b7b')},uColorC:{value:new Color('#edc2b1')},uColorD:{value:new Color('#8f4c68')}}});
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
  preference.addEventListener('change',update);document.addEventListener('visibilitychange',update);
  return()=>{
   stop();observer.disconnect();resizeObserver.disconnect();preference.removeEventListener('change',update);document.removeEventListener('visibilitychange',update);
   renderer?.domElement.removeEventListener('webglcontextlost',contextLost);
   geometry?.dispose();material?.dispose();renderer?.dispose();renderer?.forceContextLoss();renderer?.domElement.remove();
  };
 },[]);
 return <div ref={host} className="fc-material" data-state="fallback" data-renderer="three-flowing-gradient" data-render-count="0" data-loop-active="false" aria-hidden="true"/>;
}

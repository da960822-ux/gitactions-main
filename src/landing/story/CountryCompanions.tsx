import {useEffect,useId,useRef,useState} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {animate,motion,useMotionValue,useSpring,useTransform} from 'motion/react';
import type {MotionValue} from 'motion/react';
import './country-companions.css';
import {useLiveReducedMotion} from './useLiveReducedMotion';

gsap.registerPlugin(ScrollTrigger);
export type CompanionPhase='greet'|'return'|'instant';
const flightSpring={type:'spring' as const,mass:1.2,stiffness:86,damping:21,restDelta:.0001,restSpeed:.001};
const unit=(value:number)=>Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;
export function monitorCompanionArt(onError:()=>void){
 let active=true;
 const images=['mandarin-duck','hummingbird-torso','hummingbird-tail','hummingbird-near','hummingbird-far'].map(name=>{
  const image=new Image();
  image.onerror=()=>{if(active)onError();};
  image.src=`/images/story-companions/${name}.png`;
  return image;
 });
 return()=>{active=false;for(const image of images)image.onerror=null;};
}
export function monitorCompanionArrival(element:Element,onArrive:()=>void){
 let arrival:ReturnType<typeof setTimeout>|undefined;
 const observer=new IntersectionObserver(([entry])=>{
  clearTimeout(arrival);
  if(entry.isIntersecting&&entry.intersectionRatio>=.75)arrival=setTimeout(onArrive,450);
 },{threshold:.75});
 observer.observe(element);
 return()=>{clearTimeout(arrival);observer.disconnect();};
}
export function companionBodyPose(progress:number,shift:number,side:1|-1,attention=0){
 const q=unit(progress),response=unit((q-.32)/.68),bow=response*response*(3-2*response);
 if(side===1)return{x:0,y:0,rotation:-4*Math.sin(Math.PI*unit(q/.32))+11*Math.sin(Math.PI*bow)+1.5*bow+2.2*unit(attention)};
 const travel=Number.isFinite(shift)?Math.max(0,shift):0,lift=Math.min(112,Math.max(30,travel*.48+24));
 return{x:-travel*q,y:-4*lift*q*(1-q)-6*unit(attention),rotation:-9*Math.sin(Math.PI*q)-1.8*q-1.8*unit(attention)};
}
export function companionWingPose(follow:number,far=false,attention=0){
 const q=unit(follow),spread=Math.sin(Math.PI*q),stroke=Math.sin(6*Math.PI*q)*spread;
 return{rotation:(far?-18:-10)+(far?82:72)*stroke-3*unit(attention),scaleX:far?.84:1,scaleY:(far?.82:.9)+.08*spread};
}
export function companionTailRotation(progress:number,follow=progress){
 const q=unit(progress);
 return -companionBodyPose(q,0,-1).rotation*.7+(q-unit(follow))*6;
}
export function companionBodyMotion(phase:CompanionPhase,together:boolean,reduced:boolean){
 const target=together&&phase!=='return'?1:0;
 return{target,transition:reduced||phase==='instant'?{duration:0}:flightSpring};
}
export function Companion({side,together,phase,shift,reduced,interactive,failed,language,descriptionId,onGreet,onError,encounter,onNotice}:{side:1|-1;together:boolean;phase:CompanionPhase;shift:number;reduced:boolean;interactive:boolean;failed:boolean;language:'ko'|'es';descriptionId:string;onGreet:(pointer:boolean)=>void;onError:()=>void;encounter?:MotionValue<number>;onNotice?:(active:boolean)=>void}){
 const ko=language==='ko',progress=useMotionValue(0),attention=useMotionValue(0),shoulder=useId();
 const wingProgress=useSpring(progress,flightSpring),tailProgress=useSpring(wingProgress,flightSpring);
 const [hovered,setHovered]=useState(false),[flightState,setFlightState]=useState<'idle'|'approach'|'hold'|'return'>('idle');
 const transform=useTransform(()=>{const pose=companionBodyPose(progress.get(),shift,side,attention.get());return `translateX(${pose.x}px) translateY(${pose.y}px) rotate(${pose.rotation}deg)`;});
 const nearTransform=useTransform(()=>{const pose=companionWingPose(wingProgress.get(),false,attention.get());return `rotate(${pose.rotation}deg) scale(${pose.scaleX},${pose.scaleY})`;});
 const farTransform=useTransform(()=>{const pose=companionWingPose(wingProgress.get(),true,attention.get());return `rotate(${pose.rotation}deg) scale(${pose.scaleX},${pose.scaleY})`;});
 const tailTransform=useTransform(()=>`rotate(${companionTailRotation(progress.get(),tailProgress.get())}deg)`);
 useEffect(()=>{if(!encounter)return;encounter.set(progress.get());return progress.on('change',value=>encounter.set(value));},[encounter,progress]);
 useEffect(()=>{
  if(failed){progress.jump(0);wingProgress.jump(0);tailProgress.jump(0);setFlightState('idle');return;}
  if(!interactive){progress.stop();wingProgress.stop();tailProgress.stop();return;}
  const body=companionBodyMotion(phase,together,reduced);
  if('duration' in body.transition){progress.jump(body.target);wingProgress.jump(body.target);tailProgress.jump(body.target);setFlightState(together?'hold':'idle');return;}
  setFlightState(body.target?'approach':'return');
  const movement=animate(progress,body.target,{...body.transition,onComplete:()=>setFlightState(body.target?'hold':'idle')});
  return()=>{movement.stop();wingProgress.stop();tailProgress.stop();};
 },[phase,together,reduced,interactive,failed,progress,wingProgress,tailProgress]);
 useEffect(()=>{
  if(reduced||!interactive||failed){attention.jump(0);return;}
  const movement=animate(attention,hovered?1:0,{duration:.18,ease:[.23,1,.32,1]});
  return()=>movement.stop();
 },[hovered,reduced,interactive,failed,attention]);
 const notice=(pointerType:string)=>{if(pointerType==='mouse'&&!reduced&&!failed&&interactive&&matchMedia('(hover: hover) and (pointer: fine)').matches){setHovered(true);onNotice?.(true);}};
 // Motion SVG defaults to a fill-box center; these children already sit at the shoulder or hip.
 const wing=(far:boolean)=><g transform={far?'translate(635 490)':'translate(675 525)'} data-shoulder={far?'far':'near'}><motion.g className={`hummingbird-wing ${far?'hummingbird-wing-far':'hummingbird-wing-near'}`} style={{transform:far?farTransform:nearTransform,originX:0,originY:0,transformBox:'view-box'}}><g className="hummingbird-air-feathers"><image href={`/images/story-companions/hummingbird-${far?'far':'near'}.png`} width="1254" height="1254" transform={`scale(${far?.28:.36}) translate(-${far?145:160} -950)`} mask={`url(#${shoulder}-mask)`} onError={onError}/></g></motion.g></g>;
 const body=<image href={side===1?'/images/story-companions/mandarin-duck.png':failed?'/images/story-companions/hummingbird-body.png':'/images/story-companions/hummingbird-torso.png'} width="1254" height="1254" onError={failed?undefined:onError}/>;
 return <div className={`bird-scroll lovebird-${side===1?'left':'right'}`} inert={!interactive} data-flight-state={flightState}>
  {side===1&&<svg className="companion-ledge" viewBox="0 0 1254 1254" aria-hidden="true"><path className="companion-ledge-face" d="M160 1205H3200V1221H160Z"/><path className="companion-ledge-edge" d="M160 1205H3200"/><ellipse className="companion-contact" cx="812" cy="1204" rx="274" ry="12"/></svg>}
  <motion.button type="button" className="lovebird" aria-describedby={interactive?descriptionId:undefined} aria-label={ko?(side===1?'내 쪽의 원앙에게 인사하기':'Baby의 분홍 벌새에게 인사하기'):(side===1?'Saludar al pato mandarín de mi lado':'Saludar al colibrí rosado de Baby')} aria-pressed={together&&!failed} aria-hidden={!interactive} disabled={failed} tabIndex={interactive&&!failed?0:-1} style={{transform:failed?'none':transform}} onPointerEnter={event=>notice(event.pointerType)} onPointerLeave={()=>{setHovered(false);onNotice?.(false);}} onPointerCancel={()=>{setHovered(false);onNotice?.(false);}} onFocus={event=>{if(event.currentTarget.matches(':focus-visible')){attention.jump(0);setHovered(false);onNotice?.(false);}}} onClick={event=>{if(event.detail===0)attention.jump(0);setHovered(false);onNotice?.(false);if(!failed)onGreet(event.detail>0);}}>
   <svg className="lovebird-art" viewBox="0 0 1254 1254" aria-hidden="true">
    {side===1||failed?body:<g className="hummingbird-rig">
     <defs><radialGradient id={`${shoulder}-blend`} gradientUnits="userSpaceOnUse" cx="160" cy="950" r="170"><stop offset="0" stopColor="black"/><stop offset="1" stopColor="white"/></radialGradient><mask id={`${shoulder}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254"><rect width="1254" height="1254" fill={`url(#${shoulder}-blend)`}/></mask></defs>
     <g transform="translate(830 770)" data-joint="hip"><motion.g style={{transform:tailTransform,originX:0,originY:0,transformBox:'view-box'}}><g className="hummingbird-tail"><image href="/images/story-companions/hummingbird-tail.png" width="1254" height="1254" transform="scale(.55) translate(-380 -490)" onError={onError}/></g></motion.g></g>
     {wing(true)}{body}{wing(false)}
    </g>}
   </svg>
  </motion.button>
 </div>;
}

export function companionEncounterPose(progress:number,presence=1){
 const arrival=unit((unit(progress)-.65)/.35),bloom=arrival*arrival*(3-2*arrival);
 return{opacity:unit(presence)*(.3+.7*bloom),scale:.5+.5*bloom+.32*Math.sin(Math.PI*bloom),y:26*(1-bloom),draw:.4+.6*bloom,fill:.3+.7*bloom,burst:4*bloom*(1-bloom)};
}
export function companionEncounterAnchor(billX:number,billY:number,width:number,height:number){
 return{x:Math.max(78,Math.min(width-78,billX+21)),y:Math.max(60,Math.min(height-150,billY-108))};
}
function CompanionEncounter({progress,trace,together,noticed,interactive,instant}:{progress:MotionValue<number>;trace:{x:number;y:number;span:number};together:boolean;noticed:boolean;interactive:boolean;instant:boolean}){
 const id=useId(),presence=useMotionValue(0);
 useEffect(()=>{
  const target=interactive&&(together||noticed)?1:0;
  if(instant||!interactive){presence.jump(target);return;}
  const movement=animate(presence,target,{duration:target?.18:.14,ease:[.23,1,.32,1]});
  return()=>movement.stop();
 },[together,noticed,interactive,instant,presence]);
 const opacity=useTransform(()=>companionEncounterPose(progress.get(),presence.get()).opacity);
 const transform=useTransform(()=>{const pose=companionEncounterPose(progress.get());return `translateY(${pose.y}px) scale(${pose.scale})`;});
 const fillOpacity=useTransform(()=>companionEncounterPose(progress.get()).fill);
 const dash=useTransform(()=>100*(1-companionEncounterPose(progress.get()).draw));
 const burst=useTransform(()=>companionEncounterPose(progress.get()).burst);
 const sparkTransform=useTransform(()=>`scale(${.7+.8*unit((progress.get()-.65)/.35)})`);
 const trailDash=useTransform(()=>100*(1-unit((progress.get()-.7)/.3)));
 const rightTrail=useTransform(()=>{const start=22+trace.span*(1-unit(progress.get()));return `M${start} 105 C${start+18} 82 63 66 46 30`;});
 return <motion.svg className="companion-heart" aria-hidden="true" style={{opacity}}><defs><linearGradient id={`${id}-rose`} x1="0" y1="-42" x2="0" y2="43" gradientUnits="userSpaceOnUse"><stop stopColor="#ffb4ce"/><stop offset=".55" stopColor="#f071a0"/><stop offset="1" stopColor="#cc477c"/></linearGradient></defs>
  <g transform={`translate(${trace.x} ${trace.y})`}>
   <motion.g className="companion-light-trails" style={{opacity:burst}}><motion.path d="M-22 105 C-40 82 -63 66 -46 30" pathLength="100" strokeDasharray="100" style={{strokeDashoffset:trailDash}}/><motion.path d={rightTrail} pathLength="100" strokeDasharray="100" style={{strokeDashoffset:trailDash}}/></motion.g>
   <motion.g style={{transform,originX:0,originY:0,transformBox:'view-box'}}><motion.path data-companion-heart-body="true" d="M0 43C-63 9-49-42-24-42C-10-42-2-33 0-23C2-33 10-42 24-42C49-42 63 9 0 43Z" fill={`url(#${id}-rose)`} stroke="#ffe1ae" strokeWidth="2.4" pathLength="100" strokeDasharray="100" style={{fillOpacity,strokeDashoffset:dash}}/></motion.g>
   <motion.g className="companion-sparks" style={{opacity:burst,transform:sparkTransform,originX:0,originY:0,transformBox:'view-box'}}>{[[-63,-28],[62,-24],[-54,35],[57,39]].map(([x,y],index)=><path key={index} d={`M${x} ${y-8}l3 6 6 2-6 3-3 6-2-6-6-3 6-2Z`}/>)}</motion.g>
  </g>
 </motion.svg>;
}

export function CountryCompanions({language}:{language:'ko'|'es'}){
 const ko=language==='ko',root=useRef<HTMLDivElement>(null),greeted=useRef(false),reduced=useLiveReducedMotion(),duckNote=useId(),hummingbirdNote=useId(),encounter=useMotionValue(0);
 const [together,setTogether]=useState(false),[visible,setVisible]=useState(false),[phase,setPhase]=useState<CompanionPhase>('instant'),[shift,setShift]=useState(0),[failed,setFailed]=useState(false),[trace,setTrace]=useState({x:0,y:0,span:0}),[noticed,setNoticed]=useState(false);
 // SVG image failures are not reliably forwarded through React's onError in every browser.
 useEffect(()=>monitorCompanionArt(()=>setFailed(true)),[]);
 useEffect(()=>{
  const element=root.current;if(!element)return;
  const distance=element.closest<HTMLElement>('#distance');if(!distance)return;
  const reset=()=>{setNoticed(false);setTogether(false);setPhase('return');};
  const returnCurrent=()=>{setNoticed(false);setTogether(false);setPhase('return');};
  const size={width:distance.clientWidth,height:distance.clientHeight};
  const resize=new ResizeObserver(([entry])=>{if(Math.abs(entry.contentRect.width-size.width)>1||Math.abs(entry.contentRect.height-size.height)>1)returnCurrent();size.width=entry.contentRect.width;size.height=entry.contentRect.height;});resize.observe(distance);
  const observer=new IntersectionObserver(([entry])=>{setVisible(entry.isIntersecting);if(!entry.isIntersecting)reset();},{threshold:.15});observer.observe(distance);
  const hidden=()=>{if(document.hidden){setVisible(false);reset();}else setVisible(distance.getBoundingClientRect().bottom>0&&distance.getBoundingClientRect().top<innerHeight);};document.addEventListener('visibilitychange',hidden);
  const mm=gsap.matchMedia();mm.add('(prefers-reduced-motion: no-preference)',()=>{
   const diagnose=(trigger:ScrollTrigger)=>{element.dataset.companionStart=String(trigger.start);element.dataset.companionEnd=String(trigger.end);element.dataset.companionProgress=String(trigger.progress);};
   const timeline=gsap.timeline({scrollTrigger:{trigger:distance,start:'top 85%',end:'top 10%',scrub:true,refreshPriority:-1,invalidateOnRefresh:true,onRefresh:diagnose,onUpdate:diagnose}});
   timeline.fromTo(element.querySelector('.lovebird-left')!,{xPercent:-4},{xPercent:0,ease:'none'},0).fromTo(element.querySelector('.lovebird-right')!,{xPercent:8},{xPercent:0,ease:'none'},0);
  });
  return()=>{observer.disconnect();resize.disconnect();document.removeEventListener('visibilitychange',hidden);mm.revert();};
 },[]);
 useEffect(()=>{if(reduced||failed){setTogether(false);setPhase('instant');}},[reduced,failed]);
 const positionEncounter=()=>{
  if(!root.current)return;
  const left=root.current.querySelector('.lovebird-left')!.getBoundingClientRect(),right=root.current.querySelector('.lovebird-right')!.getBoundingClientRect(),scene=root.current.querySelector('.companion-atmosphere-pair')!.getBoundingClientRect();
  const duckBill=left.left+left.width*.91,hummingbirdBill=right.left+right.width*.044,distance=Math.max(0,hummingbirdBill-duckBill-42);
  const billY=(left.top+left.width*.27+right.top+right.width*.195)/2-scene.top;
  setShift(distance);setTrace({...companionEncounterAnchor(duckBill-scene.left,billY,scene.width,scene.height),span:distance});
 };
 const notice=(active:boolean)=>{if(active&&!together)positionEncounter();setNoticed(active);};
 useEffect(()=>{
  const bird=root.current?.querySelector('.lovebird-left');
  if(!visible||failed||greeted.current||!bird)return;
  return monitorCompanionArrival(bird,()=>{if(greeted.current)return;greeted.current=true;positionEncounter();setPhase(reduced?'instant':'greet');setTogether(true);});
 },[visible,failed,reduced]);
 const greet=(_pointer:boolean)=>{
  if(failed)return;
  greeted.current=true;
  if(!together)positionEncounter();
  setNoticed(false);setPhase(visible&&!reduced?(together?'return':'greet'):'instant');setTogether(value=>!value);
 };
 return <div ref={root} inert={!visible} className="country-companions" data-together={together&&!failed} data-failed={failed} data-visible={visible} data-ambient={visible&&!reduced&&!failed} data-reduced={Boolean(reduced)} data-interaction-phase={phase} data-story-moment="distance" role="group" aria-labelledby="story-distance-title">
  <div className="companion-stage">
   <div className="companion-atmosphere-pair">
   <div className="companion-air-surface" aria-hidden="true"/>
   <Companion side={1} together={together} phase={phase} shift={0} reduced={Boolean(reduced)||!visible} interactive={visible} failed={failed} language={language} descriptionId={duckNote} onGreet={greet} onError={()=>setFailed(true)} onNotice={notice}/>
   <CompanionEncounter progress={encounter} trace={trace} together={together&&!failed} noticed={noticed&&!failed} interactive={visible&&!failed} instant={Boolean(reduced)||phase==='instant'}/>
   <Companion side={-1} together={together} phase={phase} shift={shift} reduced={Boolean(reduced)||!visible} interactive={visible} failed={failed} language={language} descriptionId={hummingbirdNote} onGreet={greet} onError={()=>setFailed(true)} encounter={encounter} onNotice={notice}/>
   </div>
   <button type="button" className="lovebird-greeting text-button" disabled={failed} aria-pressed={together&&!failed} onClick={event=>greet(event.detail>0)}>{together?(ko?'다시 살짝 떨어져':'Un poquito de espacio'):(ko?'Baby, 가까이 와':'Acércate, Baby')}</button>
  </div>
  <div className="companion-meanings">
   <div id={duckNote}><h3>{ko?'원앙 · 내 쪽에서':'Pato mandarín · de mi lado'}</h3><p>{ko?'내 쪽엔 원앙 한 마리. 네 쪽을 보고 있으니까, 조금 나 같지? ㅋㅋㅋ':'De mi lado hay un pato mandarín. Está mirando hacia ti… se parece un poquito a mí, haha.'}</p></div>
   <div id={hummingbirdNote}><h3>{ko?'벌새 · 네 쪽에서':'Colibrí · de tu lado'}</h3><p>{ko?'네 쪽엔 네가 좋아하는 연분홍 벌새. 여기서는 조금 더 가까이 와도 돼, Baby.':'De tu lado, un colibrí del rosa suave que te gusta. Aquí puedes acercarte un poquito más, Baby.'}</p></div>
  </div>
  {failed&&<p className="lovebird-error" role="status">{ko?'새 그림을 불러오지 못했어. 페이지를 다시 열어줘.':'No se cargaron las aves. Vuelve a abrir la página.'}</p>}
 </div>;
}

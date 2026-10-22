import {useEffect,useId,useRef,useState} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {animate,motion,useMotionValue,useTransform} from 'motion/react';
import './country-companions.css';
import {useLiveReducedMotion} from './useLiveReducedMotion';

gsap.registerPlugin(ScrollTrigger);
export type CompanionPhase='greet'|'return'|'instant';
export function companionBodyPose(progress:number,shift:number,side:1|-1){
 const q=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;
 if(side===1)return{x:0,y:0,rotation:2*q};
 const travel=Number.isFinite(shift)?Math.max(0,shift):0,lift=Math.min(24,travel*.12);
 return{x:-travel*q,y:-4*lift*q*(1-q),rotation:q===0||q===1?0:-3*Math.sin(Math.PI*q)};
}
export function companionBodyMotion(phase:CompanionPhase,together:boolean,reduced:boolean){
 const target=together&&phase!=='return'?1:0;
 const transition=reduced||phase==='instant'?{duration:0}:phase==='return'||!together?{duration:.22,ease:[.23,1,.32,1] as const}:{duration:1.15,ease:[.77,0,.175,1] as const};
 return{target,transition};
}
function Companion({side,together,phase,shift,reduced,interactive,language,descriptionId,onGreet,onError}:{side:1|-1;together:boolean;phase:CompanionPhase;shift:number;reduced:boolean;interactive:boolean;language:'ko'|'es';descriptionId:string;onGreet:(pointer:boolean)=>void;onError:()=>void}){
 const ko=language==='ko',progress=useMotionValue(0);
 const transform=useTransform(()=>{const pose=companionBodyPose(progress.get(),shift,side);return `translateX(${pose.x}px) translateY(${pose.y}px) rotate(${pose.rotation}deg)`;});
 useEffect(()=>{
  const body=companionBodyMotion(phase,together,reduced||!interactive);
  if(body.transition.duration===0){progress.jump(body.target);return;}
  const movement=animate(progress,body.target,body.transition);
  return()=>movement.stop();
 },[phase,together,reduced,interactive,progress]);
 const wing=(far:boolean)=><g className={`hummingbird-wing ${far?'hummingbird-wing-far':'hummingbird-wing-near'}`}><image href="/images/story-companions/hummingbird-wing.png" width="1254" height="1254" transform={far?'translate(635 490) scale(.34) translate(-250 -950)':'translate(675 525) scale(.42) translate(-250 -950)'} onError={onError}/></g>;
 return <div className={`bird-scroll lovebird-${side===1?'left':'right'}`} inert={!interactive}>
  <motion.button type="button" className="lovebird" aria-describedby={interactive?descriptionId:undefined} aria-label={ko?(side===1?'내 쪽의 원앙에게 인사하기':'Baby의 분홍 벌새에게 인사하기'):(side===1?'Saludar al pato mandarín de mi lado':'Saludar al colibrí rosado de Baby')} aria-pressed={together} aria-hidden={!interactive} tabIndex={interactive?0:-1} style={{transform}} onClick={event=>onGreet(event.detail>0)}>
   <svg className="lovebird-art" viewBox="0 0 1254 1254" aria-hidden="true">
    {side===-1&&wing(true)}
    <image href={side===1?'/images/story-companions/mandarin-duck.png':'/images/story-companions/hummingbird-body.png'} width="1254" height="1254" onError={onError}/>
    {side===-1&&wing(false)}
   </svg>
  </motion.button>
 </div>;
}

export function CountryCompanions({language}:{language:'ko'|'es'}){
 const ko=language==='ko',root=useRef<HTMLDivElement>(null),reduced=useLiveReducedMotion(),duckNote=useId(),hummingbirdNote=useId();
 const [together,setTogether]=useState(false),[visible,setVisible]=useState(false),[phase,setPhase]=useState<CompanionPhase>('instant'),[shift,setShift]=useState(0),[failed,setFailed]=useState(false),[trace,setTrace]=useState({x:0,y:0});
 useEffect(()=>{
  const element=root.current;if(!element)return;
  const distance=element.closest<HTMLElement>('#distance');if(!distance)return;
  const reset=()=>{setTogether(false);setPhase('instant');};
  const returnCurrent=()=>{const bounds=distance.getBoundingClientRect();setTogether(false);setPhase(document.hidden||bounds.bottom<=0||bounds.top>=innerHeight||matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'return');};
  const size={width:distance.clientWidth,height:distance.clientHeight};
  const resize=new ResizeObserver(([entry])=>{if(Math.abs(entry.contentRect.width-size.width)>1||Math.abs(entry.contentRect.height-size.height)>1)returnCurrent();size.width=entry.contentRect.width;size.height=entry.contentRect.height;});resize.observe(distance);
  const observer=new IntersectionObserver(([entry])=>{setVisible(entry.isIntersecting);if(!entry.isIntersecting)reset();},{threshold:.15});observer.observe(distance);
  const hidden=()=>{if(document.hidden){setVisible(false);reset();}else setVisible(distance.getBoundingClientRect().bottom>0&&distance.getBoundingClientRect().top<innerHeight);};document.addEventListener('visibilitychange',hidden);
  const mm=gsap.matchMedia();mm.add('(prefers-reduced-motion: no-preference)',()=>{
   const diagnose=(trigger:ScrollTrigger)=>{element.dataset.companionStart=String(trigger.start);element.dataset.companionEnd=String(trigger.end);element.dataset.companionProgress=String(trigger.progress);};
   const timeline=gsap.timeline({scrollTrigger:{trigger:distance,start:'top 85%',end:'top 10%',scrub:true,refreshPriority:-1,invalidateOnRefresh:true,onRefresh:diagnose,onUpdate:trigger=>{diagnose(trigger);returnCurrent();}}});
   timeline.fromTo(element.querySelector('.lovebird-left')!,{xPercent:-4},{xPercent:0,ease:'none'},0).fromTo(element.querySelector('.lovebird-right')!,{xPercent:8},{xPercent:0,ease:'none'},0);
  });
  return()=>{observer.disconnect();resize.disconnect();document.removeEventListener('visibilitychange',hidden);mm.revert();};
 },[]);
 useEffect(()=>{if(reduced){setTogether(false);setPhase('instant');}},[reduced]);
 const greet=(pointer:boolean)=>{
  if(!together&&root.current){const left=root.current.querySelector('.lovebird-left')!.getBoundingClientRect(),right=root.current.querySelector('.lovebird-right')!.getBoundingClientRect(),scene=root.current.getBoundingClientRect();
   const duckBill=left.left+left.width*.91,hummingbirdBill=right.left+right.width*.044,distance=Math.max(0,hummingbirdBill-duckBill-42);
   setShift(distance);setTrace({x:duckBill-scene.left+26,y:(left.top+left.width*.27+right.top+right.width*.195)/2-scene.top-12});
  }
  setPhase(pointer&&visible&&!reduced?'greet':'instant');setTogether(value=>!value);
 };
 return <div ref={root} inert={!visible} className="country-companions" data-together={together} data-visible={visible} data-reduced={Boolean(reduced)} data-interaction-phase={phase} data-story-moment="distance" role="group" aria-labelledby="story-distance-title">
  <div className="companion-stage">
   <Companion side={1} together={together} phase={phase} shift={0} reduced={Boolean(reduced)||!visible} interactive={visible} language={language} descriptionId={duckNote} onGreet={greet} onError={()=>setFailed(true)}/>
   <svg className="companion-heart" aria-hidden="true"><g transform={`translate(${trace.x} ${trace.y})`}>
    <path d="M0 7C-14-1-12-14-5-13C-2-13-1-10 0-8C1-10 2-13 5-13C12-14 14-1 0 7"/>
   </g></svg>
   <Companion side={-1} together={together} phase={phase} shift={shift} reduced={Boolean(reduced)||!visible} interactive={visible} language={language} descriptionId={hummingbirdNote} onGreet={greet} onError={()=>setFailed(true)}/>
   <button type="button" className="lovebird-greeting text-button" aria-pressed={together} onClick={event=>greet(event.detail>0)}>{together?(ko?'다시 살짝 떨어져':'Un poquito de espacio'):(ko?'Baby, 가까이 와':'Acércate, Baby')}</button>
  </div>
  <div className="companion-meanings">
   <div id={duckNote}><h3>{ko?'원앙 · 내 쪽에서':'Pato mandarín · de mi lado'}</h3><p>{ko?'한국 혼례에서 원앙은 부부의 화목을 바라는 상징이야. 너랑 나도 그렇게 다정하게 지내고 싶어서, 내 쪽에 한 마리.':'En las bodas coreanas, los patos mandarines simbolizan el deseo de armonía en pareja. Puse uno de mi lado porque quiero eso contigo.'}</p></div>
   <div id={hummingbirdNote}><h3>{ko?'벌새 · 네 쪽에서':'Colibrí · de tu lado'}</h3><p>{ko?'네가 좋아하는 연분홍을 살짝 입혔어. 원앙 쪽으로 날아오는 건 우리만의 작은 장면이야, Baby. ㅋㅋㅋ':'Le puse un poquito del rosa suave que te gusta. Volando hacia mi pato: una escenita solo nuestra, Baby, haha.'}</p></div>
  </div>
  {failed&&<p className="lovebird-error" role="status">{ko?'새 그림을 불러오지 못했어. 페이지를 다시 열어줘.':'No se cargaron las aves. Vuelve a abrir la página.'}</p>}
 </div>;
}

import {useEffect,useId,useRef,useState} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {motion,useMotionValue,useSpring,useMotionTemplate,useReducedMotion} from 'motion/react';
import './country-companions.css';

gsap.registerPlugin(ScrollTrigger);
const spring={mass:1,stiffness:100,damping:10};
export type CompanionPhase='greet'|'return'|'instant';
export function companionBodyMotion(phase:CompanionPhase,together:boolean,shift:number,side:1|-1,reduced:boolean){
 const target=together&&phase!=='return'?shift*side:0,travel=shift*side,height=Math.min(84,Math.max(48,shift*.24));
 const endpoint=`translateX(${target}px) translateY(0px) rotate(${together&&phase!=='return'?side*3:0}deg)`;
 const bow=[null,`translateX(${travel*.3}px) translateY(-3px) rotate(4deg)`,`translateX(${travel*.65}px) translateY(-5px) rotate(6deg)`,endpoint];
 const flight=[null,...[[.5,-8,-3],[.78,-height*.54,-8],[.75,-height,3],[.5,-height*.72,7],[.25,-height,-7],[.22,-height*.54,-8],[.5,-8,3]].map(([x,y,angle])=>`translateX(${travel*x}px) translateY(${y}px) rotate(${angle}deg)`),endpoint];
 const transform=phase==='greet'&&!reduced?(together?(side===1?bow:flight):[null,endpoint]):endpoint;
 const transition=reduced||phase==='instant'?{duration:0}:phase==='return'?{duration:.22,ease:[.23,1,.32,1] as const}:!together?{duration:1.15,ease:[.77,0,.175,1] as const}:side===1?{duration:1.8,ease:[.77,0,.175,1] as const,times:[0,.32,.62,1]}:{duration:1.8,ease:[.77,0,.175,1] as const,times:[0,.12,.25,.38,.49,.6,.73,.86,1]};
 return{transform,transition};
}
function Companion({side,together,phase,shift,reduced,interactive,language,descriptionId,onGreet,onError}:{side:1|-1;together:boolean;phase:CompanionPhase;shift:number;reduced:boolean;interactive:boolean;language:'ko'|'es';descriptionId:string;onGreet:(pointer:boolean)=>void;onError:()=>void}){
 const ko=language==='ko',x=useSpring(useMotionValue(0),spring),rotation=useSpring(useMotionValue(0),spring);
 const transform=useMotionTemplate`translateX(${x}px) rotate(${rotation}deg)`,body=companionBodyMotion(phase,together,shift,side,reduced);
 useEffect(()=>{if(reduced||!interactive){x.jump(0);rotation.jump(0);}},[reduced,interactive,x,rotation]);
 const wing=(far:boolean)=><g className={`hummingbird-wing ${far?'hummingbird-wing-far':'hummingbird-wing-near'}`}><image href="/images/story-companions/hummingbird-wing.png" width="1254" height="1254" transform={far?'translate(635 490) scale(.45) translate(-250 -950)':'translate(675 525) scale(.55) translate(-250 -950)'} onError={onError}/></g>;
 return <div className={`bird-scroll lovebird-${side===1?'left':'right'}`} inert={!interactive}>
  <motion.button type="button" className="lovebird" aria-describedby={interactive?descriptionId:undefined} aria-label={ko?(side===1?'내 쪽의 원앙에게 인사하기':'Baby의 분홍 벌새에게 인사하기'):(side===1?'Saludar al pato mandarín de mi lado':'Saludar al colibrí rosado de Baby')} aria-pressed={together} aria-hidden={!interactive} tabIndex={interactive?0:-1} initial={false} animate={{transform:body.transform}} transition={body.transition} onClick={event=>onGreet(event.detail>0)} onPointerMove={event=>{if(reduced||event.pointerType!=='mouse'||!matchMedia('(hover: hover) and (pointer: fine)').matches)return;const bounds=event.currentTarget.getBoundingClientRect(),ratio=(event.clientX-bounds.left)/bounds.width-.5;x.set(ratio*8);rotation.set(ratio*4);}} onPointerLeave={()=>{x.set(0);rotation.set(0);}}>
   <motion.svg className="lovebird-art" style={{transform}} viewBox="0 0 1254 1254" aria-hidden="true">
    {side===-1&&<>{wing(true)}{wing(false)}</>}
    <image href={side===1?'/images/story-companions/mandarin-duck.png':'/images/story-companions/hummingbird-body.png'} width="1254" height="1254" onError={onError}/>
   </motion.svg>
  </motion.button>
 </div>;
}

export function CountryCompanions({language}:{language:'ko'|'es'}){
 const ko=language==='ko',root=useRef<HTMLDivElement>(null),reduced=useReducedMotion(),duckNote=useId(),hummingbirdNote=useId();
 const [together,setTogether]=useState(false),[visible,setVisible]=useState(false),[phase,setPhase]=useState<CompanionPhase>('instant'),[shift,setShift]=useState(0),[failed,setFailed]=useState(false),[trace,setTrace]=useState({x:0,y:0});
 const duckShift=Math.min(12,shift*.04),flightShift=shift-duckShift,heartWidth=flightShift*.28,heartHeight=Math.min(84,Math.max(48,flightShift*.24));
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
   const duckBill=left.left+left.width*.91,hummingbirdBill=right.left+right.width*.044,distance=Math.max(0,hummingbirdBill-duckBill-42),flight=distance-Math.min(12,distance*.04);
   setShift(distance);setTrace({x:hummingbirdBill-scene.left-flight*.5,y:right.top+right.width*.195-scene.top-8});
  }
  setPhase(pointer&&visible&&!reduced?'greet':'instant');setTogether(value=>!value);
 };
 return <div ref={root} inert={!visible} className="country-companions" data-together={together} data-visible={visible} data-reduced={Boolean(reduced)} data-interaction-phase={phase} data-story-moment="distance" role="group" aria-labelledby="story-distance-title">
  <div className="companion-stage">
   <Companion side={1} together={together} phase={phase} shift={duckShift} reduced={Boolean(reduced)||!visible} interactive={visible} language={language} descriptionId={duckNote} onGreet={greet} onError={()=>setFailed(true)}/>
   <svg className="companion-heart" aria-hidden="true"><g transform={`translate(${trace.x} ${trace.y})`}>
    <motion.path d={`M0 0C${-heartWidth*.45} ${-heartHeight*.22} ${-heartWidth*1.25} ${-heartHeight*.7} ${-heartWidth*.9} ${-heartHeight}C${-heartWidth*.5} ${-heartHeight*1.26} ${-heartWidth*.1} ${-heartHeight*.95} 0 ${-heartHeight*.72}C${heartWidth*.1} ${-heartHeight*.95} ${heartWidth*.5} ${-heartHeight*1.26} ${heartWidth*.9} ${-heartHeight}C${heartWidth*1.25} ${-heartHeight*.7} ${heartWidth*.45} ${-heartHeight*.22} 0 0`} initial={false} animate={{pathLength:together?1:0,opacity:together&&phase==='greet'&&!reduced?[0,.5,.18]:together?.25:0}} transition={{duration:phase==='greet'&&!reduced?1.8:phase==='return'&&!reduced?.22:0,ease:[.23,1,.32,1]}}/>
   </g></svg>
   <Companion side={-1} together={together} phase={phase} shift={flightShift} reduced={Boolean(reduced)||!visible} interactive={visible} language={language} descriptionId={hummingbirdNote} onGreet={greet} onError={()=>setFailed(true)}/>
   <button type="button" className="lovebird-greeting text-button" aria-pressed={together} onClick={event=>greet(event.detail>0)}>{together?(ko?'다시 살짝 떨어져':'Un poquito de espacio'):(ko?'Baby, 가까이 와':'Acércate, Baby')}</button>
  </div>
  <div className="companion-meanings">
   <div id={duckNote}><h3>{ko?'원앙 · 내 쪽에서':'Pato mandarín · de mi lado'}</h3><p>{ko?'한국 혼례에서 원앙은 부부의 화목을 바라는 상징이야. 너랑 나도 그렇게 다정하게 지내고 싶어서, 내 쪽에 한 마리.':'En las bodas coreanas, los patos mandarines simbolizan el deseo de armonía en pareja. Puse uno de mi lado porque quiero eso contigo.'}</p></div>
   <div id={hummingbirdNote}><h3>{ko?'벌새 · 네 쪽에서':'Colibrí · de tu lado'}</h3><p>{ko?'네가 좋아하는 연분홍을 살짝 입혔어. 원앙 쪽으로 날아오는 건 우리만의 작은 장면이야, Baby. ㅋㅋㅋ':'Le puse un poquito del rosa suave que te gusta. Volando hacia mi pato: una escenita solo nuestra, Baby, haha.'}</p></div>
  </div>
  {failed&&<p className="lovebird-error" role="status">{ko?'새 그림을 불러오지 못했어. 페이지를 다시 열어줘.':'No se cargaron las aves. Vuelve a abrir la página.'}</p>}
 </div>;
}

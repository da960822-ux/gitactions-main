import {useEffect,useId,useRef,useState,type PointerEvent} from 'react';
import {animate,motion,useInView,useScroll,useSpring,useTransform} from 'motion/react';
import {CoupleReactionArt,type CoupleReaction} from '../../app/CoupleReactionArt';
import './duel-illustration.css';
import {useLiveReducedMotion} from './useLiveReducedMotion';

export function duelCameraPose(pointerX:number,pointerY:number,scroll:number,orbit:number,choice:number){
 return{rotateX:-pointerY+scroll*.4+orbit*.25,rotateY:pointerX*1.4+scroll*.5+orbit*.7+choice*.5,z:scroll*6+orbit*4};
}

export function DuelIllustration({language}:{language:'ko'|'es'}){
 const ko=language==='ko',host=useRef<HTMLDivElement>(null),artId=useId(),reduced=useLiveReducedMotion(),inView=useInView(host,{amount:.2});
 const [reaction,setReaction]=useState<CoupleReaction>('lisbeth'),[response,setResponse]=useState(0);
 const [failed,setFailed]=useState(false),[pageVisible,setPageVisible]=useState(()=>typeof document==='undefined'||!document.hidden);
 const ambient=inView&&pageVisible&&!reduced&&!failed,pointerX=useSpring(0,{stiffness:70,damping:24}),pointerY=useSpring(0,{stiffness:70,damping:24}),depth=useSpring(0,{stiffness:65,damping:24}),orbit=useSpring(0,{stiffness:50,damping:24}),choiceDirection=useSpring(0,{stiffness:55,damping:24});
 const {scrollYProgress}=useScroll({target:host,offset:['start end','end start']});
 const kick=useSpring(0,{stiffness:90,damping:24}),kickAnimation=useRef<ReturnType<typeof animate>|null>(null);
 const kickX=useTransform(()=>`${kick.get()*2.2}%`),kickTrail=useTransform(()=>Math.abs(kick.get())<.01?'none':`drop-shadow(${-kick.get()*18}px 0px 7px #ff83b559)`);
 const camera=useTransform(()=>{const pose=duelCameraPose(pointerX.get(),pointerY.get(),depth.get(),orbit.get(),choiceDirection.get());return `translateZ(${pose.z}px) rotateX(${pose.rotateX}deg) rotateY(${pose.rotateY}deg)`;});
 useEffect(()=>{const update=()=>setPageVisible(!document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
 useEffect(()=>{
  if(!ambient){pointerX.jump(0);pointerY.jump(0);depth.jump(0);orbit.jump(0);choiceDirection.jump(0);kick.jump(0);setResponse(0);return;}
  const update=(value:number)=>depth.set(value*2-1);update(scrollYProgress.get());
  const unsubscribe=scrollYProgress.on('change',update),movement=animate(orbit,[0,1,0,-1,0],{duration:20,repeat:Infinity,ease:'easeInOut'});
  return()=>{unsubscribe();movement.stop();kickAnimation.current?.stop();};
 },[ambient,pointerX,pointerY,depth,orbit,choiceDirection,kick,scrollYProgress]);
 const follow=(event:PointerEvent<HTMLDivElement>)=>{if(!ambient||event.pointerType!=='mouse')return;const box=event.currentTarget.getBoundingClientRect();pointerX.set(Math.max(-1,Math.min(1,(event.clientX-box.left)/box.width*2-1)));pointerY.set(Math.max(-1,Math.min(1,(event.clientY-box.top)/box.height*2-1)));};
 const choices=[{id:'lisbeth' as const,label:ko?'네가 이기면':'Si ganas tú',alt:ko?'네가 이기면: 리스벳은 메롱하며 웃고, 연석은 턱을 괴고 뾰로통한 표정.':'Si ganas tú: Lisbeth sonríe sacando la lengua y Yeonseok hace pucheros, con la barbilla en la mano.'},{id:'yeonseok' as const,label:ko?'내가 이기면':'Si gano yo',alt:ko?'내가 이기면: 연석은 박수치며 웃고, 리스벳은 노트북 앞에서 답답해하는 표정.':'Si gano yo: Yeonseok sonríe aplaudiendo y Lisbeth se ve frustrada frente a su portátil.'}];
 return <div ref={host} className="duel-illustration" data-reaction={reaction} data-ambient={ambient}>
  <div className="duel-illustration-stage" onPointerMove={follow} onPointerLeave={()=>{pointerX.set(0);pointerY.set(0);}} onPointerCancel={()=>{pointerX.set(0);pointerY.set(0);}}>
   {failed?<img className="duel-illustration-fallback" src="/images/approved-couple-room/approved-couple-gaming-room.png" alt={ko?'각자의 책상에서 게임하는 연석과 리스벳':'Yeonseok y Lisbeth jugando desde sus escritorios'}/>:<motion.div className="duel-illustration-camera" style={{transform:camera}}>
    <div className="duel-illustration-depth-back"><img className="duel-illustration-room" src="/images/approved-couple-room/environment-chair-vacancy-only.png" alt="" aria-hidden="true" onError={()=>setFailed(true)}/></div>
    <motion.div className="duel-illustration-depth-front" style={{x:kickX,z:60,scale:.94,filter:kickTrail}}>
    <svg className="duel-illustration-desk" viewBox="0 0 1672 941" aria-hidden="true"><defs><filter id={`${artId}-objects`} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 1 1 0 0"/></filter><mask id={`${artId}-desk`} maskUnits="userSpaceOnUse" x="0" y="0" width="1672" height="941" style={{maskType:'alpha'}}><image href="/images/approved-couple-room/foreground-semantic-mask.png" width="1672" height="941" filter={`url(#${artId}-objects)`}/></mask></defs><image href="/images/approved-couple-room/approved-couple-gaming-room.png" width="1672" height="941" mask={`url(#${artId}-desk)`}/></svg>
    <div className="duel-illustration-reactions">{choices.map(choice=><div key={choice.id} className="duel-illustration-layer" data-active={reaction===choice.id} aria-hidden={reaction!==choice.id}><CoupleReactionArt reaction={choice.id} alt={choice.alt} onError={()=>setFailed(true)}/></div>)}</div>
   </motion.div></motion.div>}
   {!failed&&<svg className="duel-illustration-energy" viewBox="0 0 1672 941" aria-hidden="true">
    <defs><linearGradient id={`${artId}-energy`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffd69a"/><stop offset=".48" stopColor="#ff83b5"/><stop offset="1" stopColor="#c5a0ff"/></linearGradient><filter id={`${artId}-glow`} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="7"/></filter><clipPath id={`${artId}-effect-clearance`}><rect width="1672" height="75"/><rect y="820" width="1672" height="121"/><rect y="75" width="190" height="745"/><rect x="1480" y="75" width="192" height="245"/></clipPath></defs>
    <g clipPath={`url(#${artId}-effect-clearance)`}>
     <g className="duel-energy-flow" stroke={`url(#${artId}-energy)`}><g className="duel-energy-glow"><path pathLength="1000" d="M-120 160C180 -80 600 20 860 45S1400 0 1810 180"/><path pathLength="1000" d="M-120 990C280 760 760 900 1060 860S1520 780 1810 970"/></g><g className="duel-energy-core"><path pathLength="1000" d="M-120 160C180 -80 600 20 860 45S1400 0 1810 180"/><path pathLength="1000" d="M-120 990C280 760 760 900 1060 860S1520 780 1810 970"/></g></g>
     {ambient&&response>0&&<g key={response} className="duel-selection-streak" transform={reaction==='lisbeth'?undefined:'translate(1672 0) scale(-1 1)'} stroke={`url(#${artId}-energy)`}><path className="duel-selection-glow" filter={`url(#${artId}-glow)`} pathLength="1000" d="M-120 880C-100 120 340 -10 840 45S1810 80 1760 900C1460 1100 800 720-120 930"/><path className="duel-selection-core" pathLength="1000" d="M-120 880C-100 120 340 -10 840 45S1810 80 1760 900C1460 1100 800 720-120 930"/></g>}
    </g>
   </svg>}
  </div>
  {failed&&<p className="duel-illustration-error" role="status">{ko?'그림을 다시 보려면 아래에서 골라줘.':'Elige una opción abajo para volver a cargar la ilustración.'}</p>}
  <div className="duel-illustration-choices" role="group" aria-label={ko?'이기면 어떤 표정일까?':'¿Qué cara pondríamos al ganar?'}>
   {choices.map(choice=><button key={choice.id} type="button" aria-pressed={reaction===choice.id} onClick={()=>{if(ambient){const direction=choice.id==='lisbeth'?1:-1;choiceDirection.set(direction);setResponse(value=>value+1);kickAnimation.current?.stop();kickAnimation.current=animate(kick,[0,direction,0],{duration:.75,times:[0,.3,1],ease:[.16,1,.3,1]});}setReaction(choice.id);setFailed(false);}}>{choice.label}</button>)}
  </div>
 </div>;
}

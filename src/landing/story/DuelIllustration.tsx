import {useEffect,useId,useRef,useState,type PointerEvent} from 'react';
import {motion,useInView,useScroll,useSpring,useTransform} from 'motion/react';
import {CoupleReactionArt,type CoupleReaction} from '../../app/CoupleReactionArt';
import './duel-illustration.css';
import {useLiveReducedMotion} from './useLiveReducedMotion';

export function DuelIllustration({language}:{language:'ko'|'es'}){
 const ko=language==='ko',host=useRef<HTMLDivElement>(null),lightId=useId(),reduced=useLiveReducedMotion(),inView=useInView(host,{amount:.2});
 const [reaction,setReaction]=useState<CoupleReaction>('lisbeth');
 const [celebration,setCelebration]=useState(0),[failed,setFailed]=useState(false),[pageVisible,setPageVisible]=useState(()=>typeof document==='undefined'||!document.hidden);
 const animate=celebration>0&&inView&&pageVisible&&!reduced&&!failed,lightX=reaction==='lisbeth'?1160:500;
 const ambient=inView&&pageVisible&&!reduced&&!failed,pointerX=useSpring(0,{stiffness:90,damping:24}),pointerY=useSpring(0,{stiffness:90,damping:24}),depth=useSpring(0,{stiffness:70,damping:24});
 const {scrollYProgress}=useScroll({target:host,offset:['start end','end start']});
 const backX=useTransform(()=>`${-pointerX.get()*1.2-depth.get()*.8}%`),backY=useTransform(()=>`${-pointerY.get()*.8-depth.get()*1.2}%`);
 const frontX=useTransform(()=>`${pointerX.get()*.7+depth.get()*.4}%`),frontY=useTransform(()=>`${pointerY.get()*.5+depth.get()*.6}%`);
 useEffect(()=>{const update=()=>setPageVisible(!document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
 useEffect(()=>{if(!ambient){pointerX.jump(0);pointerY.jump(0);depth.jump(0);return;}const update=(value:number)=>depth.set(value*2-1);update(scrollYProgress.get());return scrollYProgress.on('change',update);},[ambient,pointerX,pointerY,depth,scrollYProgress]);
 const follow=(event:PointerEvent<HTMLDivElement>)=>{if(!ambient||event.pointerType!=='mouse')return;const box=event.currentTarget.getBoundingClientRect();pointerX.set(Math.max(-1,Math.min(1,(event.clientX-box.left)/box.width*2-1)));pointerY.set(Math.max(-1,Math.min(1,(event.clientY-box.top)/box.height*2-1)));};
 const choices=[{id:'lisbeth' as const,label:ko?'네가 이기면':'Si ganas tú',alt:ko?'네가 이기면: 리스벳은 메롱하며 웃고, 연석은 턱을 괴고 뾰로통한 표정.':'Si ganas tú: Lisbeth sonríe sacando la lengua y Yeonseok hace pucheros, con la barbilla en la mano.'},{id:'yeonseok' as const,label:ko?'내가 이기면':'Si gano yo',alt:ko?'내가 이기면: 연석은 박수치며 웃고, 리스벳은 노트북 앞에서 답답해하는 표정.':'Si gano yo: Yeonseok sonríe aplaudiendo y Lisbeth se ve frustrada frente a su portátil.'}];
 return <div ref={host} className="duel-illustration" data-reaction={reaction} data-animate={animate} data-ambient={ambient}>
  <motion.div key={celebration} className="duel-illustration-stage" initial={{scale:1,y:0}} animate={animate?{scale:[1,.99,1.012,1],y:[0,3,-6,0]}:{scale:1,y:0}} transition={{duration:animate?.7:0,times:[0,.18,.55,1],ease:[.16,1,.3,1]}} onPointerMove={follow} onPointerLeave={()=>{pointerX.set(0);pointerY.set(0);}} onPointerCancel={()=>{pointerX.set(0);pointerY.set(0);}}>
   {!failed&&<motion.div className="duel-illustration-depth-back" style={{x:backX,y:backY}}><img className="duel-illustration-room" src="/images/approved-couple-room/environment-chair-vacancy-only.png" alt="" aria-hidden="true" onError={()=>setFailed(true)}/><div className="duel-illustration-room-light"/></motion.div>}
   <motion.svg className="duel-illustration-celebration" viewBox="0 0 1672 941" aria-hidden="true" initial={{opacity:0}} animate={{opacity:animate?[0,.9,.6,0]:0}} transition={{duration:animate?.95:0,times:[0,.18,.5,1]}}>
    <defs><linearGradient id={lightId} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffd8a0" stopOpacity="0"/><stop offset="1" stopColor="#ffba7d" stopOpacity=".65"/></linearGradient></defs>
    <path d={`M${lightX-60} 900L${lightX-260} 660Q${lightX} 620 ${lightX+260} 660L${lightX+60} 900Z`} fill={`url(#${lightId})`}/>
   </motion.svg>
   {failed?<img className="duel-illustration-fallback" src="/images/approved-couple-room/approved-couple-gaming-room.png" alt={ko?'각자의 책상에서 게임하는 연석과 리스벳':'Yeonseok y Lisbeth jugando desde sus escritorios'}/>:<motion.div className="duel-illustration-depth-front" style={{x:frontX,y:frontY}}><div className="duel-illustration-depth-float">
    <svg className="duel-illustration-desk" viewBox="0 0 1672 941" aria-hidden="true"><defs><filter id={`${lightId}-objects`} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 1 1 0 0"/></filter><mask id={`${lightId}-desk`} maskUnits="userSpaceOnUse" x="0" y="0" width="1672" height="941" style={{maskType:'alpha'}}><image href="/images/approved-couple-room/foreground-semantic-mask.png" width="1672" height="941" filter={`url(#${lightId}-objects)`}/></mask></defs><image href="/images/approved-couple-room/approved-couple-gaming-room.png" width="1672" height="941" mask={`url(#${lightId}-desk)`}/></svg>
    <div className="duel-illustration-reactions">{choices.map(choice=><div key={choice.id} className="duel-illustration-layer" data-active={reaction===choice.id} aria-hidden={reaction!==choice.id}><CoupleReactionArt reaction={choice.id} alt={choice.alt} onError={()=>setFailed(true)}/></div>)}</div>
   </div></motion.div>}
  </motion.div>
  {failed&&<p className="duel-illustration-error" role="status">{ko?'그림을 다시 보려면 아래에서 골라줘.':'Elige una opción abajo para volver a cargar la ilustración.'}</p>}
  <div className="duel-illustration-choices" role="group" aria-label={ko?'이기면 어떤 표정일까?':'¿Qué cara pondríamos al ganar?'}>
   {choices.map(choice=><button key={choice.id} type="button" aria-pressed={reaction===choice.id} onClick={()=>{setCelebration(value=>value+1);setReaction(choice.id);setFailed(false);}}>{choice.label}</button>)}
  </div>
 </div>;
}

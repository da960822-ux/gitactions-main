import {useEffect,useId,useRef,useState} from 'react';
import {motion,useInView} from 'motion/react';
import {CoupleReactionArt,type CoupleReaction} from '../../app/CoupleReactionArt';
import './duel-illustration.css';
import {useLiveReducedMotion} from './useLiveReducedMotion';

export function DuelIllustration({language}:{language:'ko'|'es'}){
 const ko=language==='ko',host=useRef<HTMLDivElement>(null),lightId=useId(),reduced=useLiveReducedMotion(),inView=useInView(host,{amount:.2});
 const [reaction,setReaction]=useState<CoupleReaction>('lisbeth');
 const [celebration,setCelebration]=useState(0),[failed,setFailed]=useState(false),[pageVisible,setPageVisible]=useState(()=>typeof document==='undefined'||!document.hidden);
 const animate=celebration>0&&inView&&pageVisible&&!reduced&&!failed,lightX=reaction==='lisbeth'?1160:500;
 useEffect(()=>{const update=()=>setPageVisible(!document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
 const choices=[{id:'lisbeth' as const,label:ko?'네가 이기면':'Si ganas tú',alt:ko?'네가 이기면: 리스벳은 메롱하며 웃고, 연석은 턱을 괴고 뾰로통한 표정.':'Si ganas tú: Lisbeth sonríe sacando la lengua y Yeonseok hace pucheros, con la barbilla en la mano.'},{id:'yeonseok' as const,label:ko?'내가 이기면':'Si gano yo',alt:ko?'내가 이기면: 연석은 박수치며 웃고, 리스벳은 노트북 앞에서 답답해하는 표정.':'Si gano yo: Yeonseok sonríe aplaudiendo y Lisbeth se ve frustrada frente a su portátil.'}];
 return <div ref={host} className="duel-illustration" data-reaction={reaction} data-animate={animate}>
  <motion.div key={celebration} className="duel-illustration-stage" initial={{scale:1,y:0}} animate={animate?{scale:[1,.99,1.012,1],y:[0,3,-6,0]}:{scale:1,y:0}} transition={{duration:animate?.7:0,times:[0,.18,.55,1],ease:[.16,1,.3,1]}}>
   {!failed&&<img className="duel-illustration-room" src="/images/approved-couple-room/approved-couple-gaming-room.png" alt="" aria-hidden="true"/>}
   <motion.svg className="duel-illustration-celebration" viewBox="0 0 1672 941" aria-hidden="true" initial={{opacity:0}} animate={{opacity:animate?[0,.9,.6,0]:0}} transition={{duration:animate?.95:0,times:[0,.18,.5,1]}}>
    <defs><linearGradient id={lightId} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffd8a0" stopOpacity="0"/><stop offset="1" stopColor="#ffba7d" stopOpacity=".65"/></linearGradient></defs>
    <path d={`M${lightX-60} 900L${lightX-260} 660Q${lightX} 620 ${lightX+260} 660L${lightX+60} 900Z`} fill={`url(#${lightId})`}/>
    <motion.ellipse cx={lightX} cy="840" rx="260" ry="55" fill="none" stroke="#ffd6a1" strokeWidth="5" initial={{rx:150,opacity:0}} animate={{rx:animate?[150,320,400]:260,opacity:animate?[0,1,0]:0}} transition={{duration:animate?.9:0,ease:'easeOut'}}/>
    {[[-250,170],[-210,370],[220,250],[260,470],[-170,580],[180,650]].map(([x,y],index)=><motion.path key={index} d="M0-14V14M-14 0H14" transform={`translate(${lightX+x} ${y})`} fill="none" stroke="#ffe3af" strokeWidth="4" strokeLinecap="round" initial={{opacity:0,pathLength:0}} animate={{opacity:animate?[0,1,0]:0,pathLength:animate?[0,1,1]:1}} transition={{duration:animate?.65:0,delay:animate?.12+index*.035:0}}/>)}
   </motion.svg>
   {failed?<img className="duel-illustration-fallback" src="/images/approved-couple-room/approved-couple-gaming-room.png" alt={ko?'각자의 책상에서 게임하는 연석과 리스벳':'Yeonseok y Lisbeth jugando desde sus escritorios'}/>:<div className="duel-illustration-reactions">{choices.map(choice=><div key={choice.id} className="duel-illustration-layer" data-active={reaction===choice.id} aria-hidden={reaction!==choice.id}><CoupleReactionArt reaction={choice.id} alt={choice.alt} onError={()=>setFailed(true)}/></div>)}</div>}
  </motion.div>
  {failed&&<p className="duel-illustration-error" role="status">{ko?'그림을 다시 보려면 아래에서 골라줘.':'Elige una opción abajo para volver a cargar la ilustración.'}</p>}
  <div className="duel-illustration-choices" role="group" aria-label={ko?'이기면 어떤 표정일까?':'¿Qué cara pondríamos al ganar?'}>
   {choices.map(choice=><button key={choice.id} type="button" aria-pressed={reaction===choice.id} onClick={()=>{setCelebration(value=>value+1);setReaction(choice.id);setFailed(false);}}>{choice.label}</button>)}
  </div>
 </div>;
}

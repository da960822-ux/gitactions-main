import {useEffect,useRef,type PointerEvent} from 'react';
import {motion,useSpring} from 'motion/react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import './first-conversation.css';

const left={
 contact:'M332 252C250 142 108 158 108 268C108 310 150 350 190 378C220 400 250 418 282 428',
 awkward:'M350 244C262 132 120 151 120 268C120 310 250 294 230 368C208 430 306 480 354 510',
 continuous:'M360 238C280 126 120 151 120 268C120 310 174 368 230 410C270 450 320 490 360 520',
};
const right={
 contact:'M388 252C470 142 612 158 612 268C612 310 570 350 530 378C500 400 470 418 438 428',
 awkward:'M370 244C450 132 600 151 600 268C600 310 546 368 490 410C450 450 400 490 366 510',
 continuous:'M360 238C440 126 600 151 600 268C600 310 546 368 490 410C450 450 400 490 360 520',
};
const portrait='/images/approved-couple-room/approved-couple-gaming-room.png';

export function FirstConversation({language}:{language:'ko'|'es'}){
 const ko=language==='ko',host=useRef<HTMLElement>(null);
 const attraction=useSpring(0,{stiffness:180,damping:24,mass:.7});
 const response=useSpring(0,{stiffness:180,damping:24,mass:.7});
 const reset=()=>{attraction.set(0);response.set(0);};
 const touch=(event:PointerEvent<HTMLElement>)=>{
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const bounds=event.currentTarget.getBoundingClientRect();
  const x=Math.max(-1,Math.min(1,(event.clientX-bounds.left)/bounds.width*2-1));
  const pull=(1-Math.abs(x))*6;
  attraction.set(pull);response.set(-pull);
 };
 useEffect(()=>{
  gsap.registerPlugin(ScrollTrigger);
  const media=gsap.matchMedia();
  media.add('(min-width:1001px) and (prefers-reduced-motion: no-preference)',()=>{
   const element=host.current;if(!element)return;
   const beats=element.querySelectorAll('.fc-beat');
   const updateBeat=(trigger:ScrollTrigger)=>{element.dataset.storyBeat=trigger.progress<.34?'contact':trigger.progress<.67?'awkward':'continuous';};
   const timeline=gsap.timeline({scrollTrigger:{id:'first-conversation-thread',trigger:beats[0],start:'center center',endTrigger:beats[2],end:'center center',scrub:true,invalidateOnRefresh:true,onRefresh:updateBeat,onUpdate:updateBeat}});
   for(const[side,paths]of[['left',left],['right',right]]as const){
    const targets=element.querySelectorAll(`.fc-${side}-route`);
    timeline.fromTo(targets,{attr:{d:paths.contact}},{attr:{d:paths.awkward},duration:1,ease:'none'},0)
     .to(targets,{attr:{d:paths.continuous},duration:1,ease:'none'},1);
   }
   timeline.fromTo('.fc-heart-fill',{opacity:.04},{opacity:.14,duration:1,ease:'none'},1)
    .fromTo('.fc-hour-route',{opacity:0},{opacity:1,duration:.65,ease:'none'},1.35)
    .fromTo('.fc-connection-duration',{opacity:0},{opacity:1,duration:.5,ease:'none'},1.5);
   return()=>{delete element.dataset.storyBeat;};
  },host);
  const preference=()=>{attraction.jump(0);response.jump(0);};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  reduced.addEventListener('change',preference);
  return()=>{media.revert();reduced.removeEventListener('change',preference);attraction.jump(0);response.jump(0);};
 },[language,attraction,response]);

 return <section ref={host} className="first-conversation" id="first-conversation" aria-labelledby="first-conversation-title">
  <div className="fc-layout">
   <div className="fc-story">
    <div className="fc-beat fc-contact">
     <h2 id="first-conversation-title">{ko?<>시작은<br/>InterPals였어.</>:<>Todo empezó<br/>en InterPals.</>}</h2>
     <p>{ko?'서로 다른 시간에 살던, 너랑 나.':'Tú y yo, viviendo en horarios distintos.'}</p>
    </div>
    <div className="fc-beat fc-awkward">
     <h3>{ko?<>처음엔,<br/>좀 서툴렀지.</>:<>Yo no<br/>empecé bien.</>}</h3>
     <p>{ko?'처음부터 내가 잘했던 건 아니지. 좀 무례했잖아.':'No empecé de la mejor manera. Fui un poco grosero contigo.'}</p>
    </div>
    <div className="fc-beat fc-continuous">
     <h3>{ko?<>그리고,<br/>쉬지 않고.</>:<>Y seguimos<br/>sin parar.</>}</h3>
     <p>{ko?'그런데 그날, 우리는 12시간이나 쉬지 않고 연락했어.':'Pero ese primer día nos pasamos doce horas hablando, sin parar.'}</p>
     <p className="fc-afterthought">{ko?'대화는 끝나지 않았네, Baby.':'Y la conversación seguía, Baby.'}</p>
    </div>
   </div>
   <figure className="fc-connection" onPointerMove={touch} onPointerDown={touch} onPointerUp={reset} onPointerLeave={reset} onPointerCancel={reset} aria-label={ko?'연석과 리스벳. InterPals에서 시작한 두 사람의 연락. 서툰 첫인상을 지나, 두 선이 하나의 하트로 이어져 12시간의 끊임없는 대화를 나타내.':'Yeonseok y Lisbeth. Dos personas que se encontraron en InterPals. Tras un comienzo torpe, dos trazos se unen en un corazón: doce horas de conversación sin parar.'}>
    <div className="fc-connection-origin">InterPals</div>
    <svg className="fc-connection-art" viewBox="0 0 720 640" aria-hidden="true">
     <motion.g className="fc-heart-half fc-heart-half-left" style={{x:attraction}}>
      <path className="fc-heart-fill fc-left-route" d={left.continuous}/>
      <path className="fc-heart-route fc-left-route" d={left.continuous}/>
      <path className="fc-hour-route fc-left-route" d={left.continuous} pathLength="6"/>
     </motion.g>
     <motion.g className="fc-heart-half fc-heart-half-right" style={{x:response}}>
      <path className="fc-heart-fill fc-right-route" d={right.continuous}/>
      <path className="fc-heart-route fc-right-route" d={right.continuous}/>
      <path className="fc-hour-route fc-right-route" d={right.continuous} pathLength="6"/>
     </motion.g>
    </svg>
    <div className="fc-person fc-yeonseok"><span>Yeonseok</span><small>{ko?'광주':'Gwangju'}</small><div className="fc-face fc-face-yeonseok" style={{backgroundImage:`url(${portrait})`}} aria-hidden="true"/></div>
    <div className="fc-person fc-lisbeth"><span>Lisbeth</span><small>Santo Domingo</small><div className="fc-face fc-face-lisbeth" style={{backgroundImage:`url(${portrait})`}} aria-hidden="true"/></div>
    <div className="fc-connection-duration" aria-hidden="true"><strong>12</strong><span>{ko?'시간, 쉬지 않고.':'horas, sin parar.'}</span></div>
    <figcaption className="fc-connection-caption" aria-hidden="true"><span className="fc-caption-contact">{ko?'서로에게 닿은 첫 연락.':'El primer contacto.'}</span><span className="fc-caption-awkward">{ko?'조금 서툰 시작.':'Un comienzo un poco torpe.'}</span><span className="fc-caption-continuous">{ko?'그날의 대화는 계속됐어.':'Y ese día seguimos hablando.'}</span></figcaption>
   </figure>
  </div>
 </section>;
}

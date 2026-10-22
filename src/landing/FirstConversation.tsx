import {useEffect,useRef} from 'react';
import {motion,useMotionValue,useReducedMotion,useSpring,useTransform} from 'motion/react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import './first-conversation.css';

export function FirstConversation({language}:{language:'ko'|'es'}){
 const ko=language==='ko',host=useRef<HTMLElement>(null),reduced=useReducedMotion();
 const pointerX=useMotionValue(0),pointerY=useMotionValue(0);
 const tiltX=useSpring(pointerY,{duration:.5,bounce:.2}),tiltY=useSpring(pointerX,{duration:.5,bounce:.2});
 const transform=useTransform(()=>`rotateX(${Math.max(-2.4,Math.min(2.4,tiltX.get()))}deg) rotateY(${Math.max(-2.4,Math.min(2.4,tiltY.get()))}deg)`);
 const reset=()=>{pointerX.set(0);pointerY.set(0);};

 useEffect(()=>{
  gsap.registerPlugin(ScrollTrigger);
  const media=gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)',()=>{
   const context=gsap.context(()=>{
    const timeline=gsap.timeline({scrollTrigger:{trigger:host.current,start:'top 92%',end:'center 55%',scrub:true,invalidateOnRefresh:true}});
    timeline.fromTo('.fc-ribbon-assembly',{y:32,rotation:-2},{y:0,rotation:0,duration:1,ease:'none'},0)
     .fromTo('.fc-fold-start',{rotation:-4,transformOrigin:'235px 215px'},{rotation:0,duration:1,ease:'none'},0)
     .fromTo('.fc-fold-end',{rotation:4,transformOrigin:'510px 325px'},{rotation:0,duration:1,ease:'none'},0);
   },host);
   return()=>context.revert();
  });
  return()=>media.revert();
 },[language]);

 useEffect(()=>{if(reduced){pointerX.jump(0);pointerY.jump(0);}},[reduced,pointerX,pointerY]);

 return <section ref={host} className="first-conversation" id="first-conversation" aria-labelledby="first-conversation-title">
  <div className="fc-copy">
   <h2 id="first-conversation-title">{ko?<>시작은<br/><span>InterPals였어.</span></>:<>Todo empezó<br/><span>en InterPals.</span></>}</h2>
   <p className="fc-honest">{ko?'처음부터 내가 잘했던 건 아니지. 좀 무례했잖아.':'No empecé de la mejor manera. Fui un poco grosero contigo.'}</p>
   <p className="fc-memory">{ko?'그런데 그날, 우리는 12시간이나 쉬지 않고 연락했어.':'Pero ese primer día nos pasamos doce horas hablando, sin parar.'}</p>
   <p className="fc-afterthought">{ko?<>서로 다른 시간에 살면서도,<br/>{' '}대화는 끝나지 않았네, Baby.</>:<>Vivíamos en horarios distintos.<br/>{' '}Y aun así, la conversación seguía, Baby.</>}</p>
  </div>
  <figure className="fc-artifact" aria-label={ko?'12시간 동안 끊이지 않은 우리의 첫 대화':'Nuestra primera conversación: doce horas sin parar'} onPointerMove={event=>{
   if(reduced||event.pointerType!=='mouse'||!matchMedia('(hover: hover) and (pointer: fine)').matches)return;
   const bounds=event.currentTarget.getBoundingClientRect();
   pointerX.set(Math.max(-1,Math.min(1,(event.clientX-bounds.left)/bounds.width*2-1))*2.4);
   pointerY.set(Math.max(-1,Math.min(1,(event.clientY-bounds.top)/bounds.height*2-1))*-2.4);
  }} onPointerLeave={reset} onPointerCancel={reset}>
   <div className="fc-ribbon-assembly">
    <motion.div className="fc-paper-response" style={{transform:reduced?'none':transform}}>
     <svg className="fc-ribbon" viewBox="0 0 700 510" aria-hidden="true">
      <g className="fc-fold-start">
       <path className="fc-paper-back" d="m49 114 204-43 27 127-177 58Z"/>
       <path className="fc-paper-edge" d="m49 114 4 5 201-42-1-6Z"/>
       <path className="fc-paper-turn" d="m103 256 142-57 35-1-37 75-112 26Z"/>
       <text className="fc-origin" x="93" y="139" transform="rotate(-12 93 139)">InterPals</text>
      </g>
      <g className="fc-fold-end">
       <path className="fc-paper-tail" d="m464 322 190 31-44 100-181-52Z"/>
       <path className="fc-paper-edge" d="m429 401 181 52 2-5-181-51Z"/>
      </g>
      <path className="fc-paper-shadow" d="m122 218 451-48 29 224-451 48Z"/>
      <path className="fc-paper-front" d="m113 202 451-48 26 221-451 48Z"/>
      <path className="fc-paper-edge" d="m139 423 451-48 1-5-452 48Z"/>
      <path className="fc-fold-crease" d="m132 211 423-45M147 404l423-45"/>
      <path className="fc-ink" d="M77 167c31-9 49 11 78 2s42-22 77-14c31 8 13 36-19 52s-67 103-67 183c51-23 72 14 123-4s82-29 132-20 79 9 143-23c35-14 2 25 18 45s37 9 60 16"/>
      <text className="fc-duration" x="342" y="312" textAnchor="middle" transform="rotate(-6 342 312)">12<tspan className="fc-hours">{ko?'시간':' horas'}</tspan></text>
      <text className="fc-continuity" x="351" y="344" textAnchor="middle" transform="rotate(-6 351 344)">{ko?'쉬지 않고, 너랑 나.':'Sin parar. Tú y yo.'}</text>
     </svg>
    </motion.div>
   </div>
  </figure>
 </section>;
}

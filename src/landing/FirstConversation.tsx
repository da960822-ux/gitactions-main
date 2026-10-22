import {useEffect,useRef} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import './first-conversation.css';

const contact='M80 260C160 260 190 220 280 220C340 220 380 220 440 220C530 220 560 260 640 260';
const awkward='M80 260C160 260 190 260 280 260C340 260 320 344 380 344C440 344 440 260 640 260';
const continuous='M80 260C160 260 190 390 280 390C340 390 380 390 440 390C530 390 560 260 640 260';

export function FirstConversation({language}:{language:'ko'|'es'}){
 const ko=language==='ko',host=useRef<HTMLElement>(null);
 useEffect(()=>{
  gsap.registerPlugin(ScrollTrigger);
  const media=gsap.matchMedia();
  media.add('(min-width:1001px) and (prefers-reduced-motion: no-preference)',()=>{
   const element=host.current;if(!element)return;
   const routes=element.querySelectorAll('.fc-route');
   const updateBeat=(trigger:ScrollTrigger)=>{element.dataset.storyBeat=trigger.progress<.34?'contact':trigger.progress<.67?'awkward':'continuous';};
   const timeline=gsap.timeline({scrollTrigger:{id:'first-conversation-thread',trigger:element,start:'top 50%',end:'bottom 80%',scrub:true,invalidateOnRefresh:true,onRefresh:updateBeat,onUpdate:updateBeat}});
   timeline.fromTo(routes,{attr:{d:contact}},{attr:{d:awkward},duration:1,ease:'none'},0)
    .to(routes,{attr:{d:continuous},duration:1,ease:'none'},1)
    .fromTo('.fc-route-progress',{strokeDashoffset:1},{strokeDashoffset:0,autoRound:false,duration:2,ease:'none'},0);
   return()=>{delete element.dataset.storyBeat;};
  },host);
  return()=>media.revert();
 },[language]);

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
   <figure className="fc-connection" aria-label={ko?'연석과 리스벳. InterPals에서 시작해, 서툰 첫인상을 지나 12시간 동안 이어진 대화.':'Yeonseok y Lisbeth. De InterPals y un comienzo torpe a doce horas de conversación sin parar.'}>
    <div className="fc-connection-origin">InterPals</div>
    <div className="fc-connection-duration" aria-hidden="true">{ko?'12시간':'12 horas'}</div>
    <svg className="fc-connection-art" viewBox="0 0 720 560" preserveAspectRatio="none" aria-hidden="true">
     <path className="fc-route fc-route-track" d={continuous}/>
     <path className="fc-route fc-route-progress" d={continuous} pathLength="1"/>
     <path className="fc-endpoint-mark" d="M80 260h.01M640 260h.01"/>
    </svg>
    <div className="fc-person fc-yeonseok"><span>Yeonseok</span><small>{ko?'광주':'Gwangju'}</small></div>
    <div className="fc-person fc-lisbeth"><span>Lisbeth</span><small>Santo Domingo</small></div>
    <figcaption className="fc-connection-caption" aria-hidden="true"><span className="fc-caption-contact">{ko?'서로에게 닿은 첫 연락.':'El primer contacto.'}</span><span className="fc-caption-awkward">{ko?'조금 서툰 시작.':'Un comienzo un poco torpe.'}</span></figcaption>
   </figure>
  </div>
 </section>;
}

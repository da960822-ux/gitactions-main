import {useEffect,useId,useRef,useState} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {STORY_START_DATE,storyDistanceKm,relationshipDays,previewPlayHour} from '../coupleStoryFacts';
import {DuelIllustration} from './DuelIllustration';
import {FirstConversation} from '../FirstConversation';
import {CountryCompanions} from './CountryCompanions';
import {StoryTimeInteraction} from './StoryTimeInteraction';
import './story-chapters.css';

export function StoryChapters({language}:{language:'ko'|'es'}){
 const ko=language==='ko',host=useRef<HTMLDivElement>(null),lightId=useId();
 const [now,setNow]=useState(()=>new Date()),[koreanHour,setKoreanHour]=useState(20),[choseTime,setChoseTime]=useState(false);
 useEffect(()=>{const timer=window.setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{
  gsap.registerPlugin(ScrollTrigger);
  const media=gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)',()=>{
   const element=host.current;if(!element)return;
   element.dataset.storyMotion='true';
   gsap.fromTo('.story-light-current',{strokeDashoffset:1000},{strokeDashoffset:0,ease:'none',scrollTrigger:{trigger:element,start:'top center',end:'bottom center',scrub:.6}});
   for(const [selector,from]of[
    ['.story-distance-copy',{x:-64,opacity:.55}],
    ['.story-time-intro>h2',{y:48,opacity:.55}],
    ['.story-couple-copy',{x:64,opacity:.55}],
   ]as const){
    const target=element.querySelector(selector);if(!target)continue;
    gsap.fromTo(target,from,{x:0,y:0,opacity:1,ease:'power3.out',immediateRender:false,scrollTrigger:{trigger:target,start:'top 94%',end:'top 62%',scrub:.45}});
   }
   return()=>{delete element.dataset.storyMotion;};
  },host);
  return()=>media.revert();
 },[]);
 const chosen=previewPlayHour(koreanHour),pad=(value:number)=>String(value).padStart(2,'0');
 const distance=new Intl.NumberFormat(ko?'ko-KR':'es-DO').format(Math.round(storyDistanceKm)),days=new Intl.NumberFormat(ko?'ko-KR':'es-DO').format(relationshipDays(now));
 const river='M950 0C735 260 1100 580 885 900S40 1180 90 1500S1030 1800 925 2120S80 2460 110 2730S780 2910 960 3200';
 return <div ref={host} className="story-connection">
  <svg className="story-light-river" viewBox="0 0 1000 3200" preserveAspectRatio="none" aria-hidden="true" focusable="false">
   <defs><linearGradient id={`${lightId}-river`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#edb7c9"/><stop offset=".5" stopColor="#ffe1ae"/><stop offset="1" stopColor="#f071a0"/></linearGradient></defs>
   <path d={river} pathLength="1000" className="story-light-track"/>
   <g className="story-light-current" stroke={`url(#${lightId}-river)`} strokeDasharray="52 948" strokeDashoffset="1000"><path d={river} pathLength="1000" className="story-light-wake"/><path d={river} pathLength="1000" className="story-light-core"/></g>
  </svg>
  <div data-pose="0"><FirstConversation language={language}/></div>
  <section id="distance" className="story-chapter story-distance" data-pose=".08" aria-labelledby="story-distance-title">
   <div className="story-distance-copy"><h2 id="story-distance-title">{ko?'멀리 있어도, 너랑.':'Lejos, pero contigo.'}</h2><div className="story-distance-facts"><p className="story-distance-number"><span>{ko?'약':'Unos'}</span>{distance}<small>km</small></p><p className="story-reference">{ko?'광주에서 산토도밍고까지, 도시 중심을 잇는 직선거리야.':'Distancia aproximada entre los centros de Gwangju y Santo Domingo.'}</p></div>
   <p className="story-distance-reason">{ko?'한국 리듬게임에 접속이 안 됐잖아. 그래도 너랑 놀고 싶은 마음은 그대로였어. 그럼 여기서 같이 놀자, Baby.':'No podías entrar al juego de ritmo de Corea desde República Dominicana. Pero yo seguía con ganas de jugar contigo. Así que juguemos aquí, Baby.'}</p></div>
   <CountryCompanions language={language}/>
   <a className="text-button story-next" href="#time-difference">{ko?'같이 놀 시간도 골라볼까?':'¿Buscamos una hora para jugar?'}<span aria-hidden="true">↓</span></a>
  </section>
  <section id="time-difference" className="story-chapter story-time" data-pose=".16" aria-labelledby="story-time-title">
   <div className="story-time-intro"><h2 id="story-time-title">{ko?'시간은 달라도, 우리 같이.':'Horas distintas. Un ratito juntos.'}</h2><p>{ko?'한국이 13시간 빨라. 우리 둘 다 눈 뜨고 있을 만한 시간을 찾아보자, Baby.':'Corea va trece horas por delante. Busquemos una hora en que los dos estemos despiertos, Baby.'}</p></div>
   <StoryTimeInteraction language={language} now={now} koreanHour={koreanHour} onHourChange={value=>{setKoreanHour(value);setChoseTime(true);}}/>
   <a className="text-button story-next" href="#shared-place">{ko?'이제 같이 놀자, Baby':'Ahora sí, a jugar, Baby'}<span aria-hidden="true">↓</span></a>
  </section>
  <section id="shared-place" className="story-chapter story-shared-place" data-pose=".32" aria-labelledby="story-place-title">
   <div className="story-couple-copy"><h2 id="story-place-title" data-language={language}>{ko?<>그 많은 사람 중,<br/>너랑 나.</>:<><span className="story-title-line">Entre tantas personas,</span><span className="story-title-line">tú y yo.</span></>}</h2><p className="story-since"><time dateTime={STORY_START_DATE}>2025.04.04</time><span>{ko?`그날로부터 ${days}일`:`${days} días desde entonces`}</span></p>{choseTime&&<p className="story-selected-time" data-selected-play-hour={chosen.koHour}><span>{ko?'골라본 시간':'La hora que probaste'}</span>{ko?'광주':'Gwangju'} {pad(chosen.koHour)}:00 · Santo Domingo {pad(chosen.drHour)}:00{chosen.drDayOffset<0?` (${ko?'전날':'el día anterior'})`:''}</p>}<p className="story-duel-question">{ko?'Baby, 이번엔 누가 이길까?':'Baby, ¿quién gana esta vez?'}</p><a className="text-button story-couple-play" href="#games">{ko?'같이 놀자, Baby':'Vamos a jugar, Baby'}<span aria-hidden="true">↓</span></a></div>
   <DuelIllustration language={language}/>
   <span id="toy-table" className="story-internal-anchor" aria-hidden="true"/>
   <span className="gallery-arrival" data-pose=".45" aria-hidden="true"/>
  </section>
 </div>;
}

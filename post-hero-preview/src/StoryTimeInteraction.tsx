import {useEffect,useId,useRef,useState} from 'react';
import {useInView} from 'motion/react';
import {gsap} from 'gsap';
import {previewPlayHour,storyClockTimes} from '../../src/landing/coupleStoryFacts';
import './story-time-interaction.css';
import {useLiveReducedMotion} from './useLiveReducedMotion';

const pad=(value:number)=>String(value).padStart(2,'0');
function CitySky({hour,city,language}:{hour:number;city:'gwangju'|'santo-domingo';language:'ko'|'es'}){
 const ko=language==='ko',daylight=Math.max(0,Math.min(1,(Math.sin((hour-6)/12*Math.PI)+.15)/1.15)),initial=useRef(daylight);
 const day=hour>=6&&hour<18;
 const period=hour<6||hour>=22?(ko?'밤':'Noche'):hour<12?(ko?'아침':'Mañana'):hour<18?(ko?'오후':'Tarde'):(ko?'저녁':'Atardecer');
 const cityName=city==='gwangju'?(ko?'광주':'Gwangju'):'Santo Domingo';
 return <figure className="story-time-city" data-city={city} data-preview-hour={hour}>
  <div className="story-time-city-art" role="img" aria-label={ko?`${cityName} 도시 풍경 일러스트`:`Vista ilustrada de ${cityName}`}>
   <div className="story-city-night" data-story-daylight={(1-daylight)*.46} style={{opacity:(1-initial.current)*.46}}/>
   <div className="story-city-day" data-story-daylight={daylight*.14} style={{opacity:initial.current*.14}}/>
  </div>
  <figcaption><svg viewBox="0 0 24 24" aria-hidden="true">{day?<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></>:<path d="M19 15.5A8 8 0 0 1 8.5 5a8 8 0 1 0 10.5 10.5Z"/>}</svg><span>{period}</span></figcaption>
 </figure>;
}

export function StoryTimeInteraction({language,now,koreanHour,onHourChange}:{language:'ko'|'es';now:Date;koreanHour:number;onHourChange:(hour:number)=>void}){
 const ko=language==='ko',rangeId=useId(),host=useRef<HTMLDivElement>(null);
 const [pointerInput,setPointerInput]=useState(false),[pageVisible,setPageVisible]=useState(()=>typeof document==='undefined'||!document.hidden);
 const inView=useInView(host,{amount:.1}),reduced=useLiveReducedMotion(),active=inView&&pageVisible&&!reduced,settle=active&&pointerInput;
 const clocks=storyClockTimes(now),preview=previewPlayHour(koreanHour);
 useEffect(()=>{const update=()=>setPageVisible(!document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
 useEffect(()=>{
  const lights=host.current?.querySelectorAll<HTMLElement>('[data-story-daylight]');if(!lights)return;
  const timeline=gsap.timeline({paused:true});
  lights.forEach(light=>timeline.to(light,{opacity:Number(light.dataset.storyDaylight),duration:.24,ease:'power3.out'},0));
  if(settle)timeline.play();else timeline.progress(1);
  return()=>{timeline.kill();};
 },[koreanHour,settle]);
 return <div ref={host} className="story-time-content story-time-interaction" data-time-motion={settle?'fade':'instant'}>
  <p className="story-live-label">{ko?'지금, 각자의 시간':'Ahora, en cada ciudad'}</p>
  <div className="story-live-clocks"><div><span>{ko?'광주':'Gwangju'}</span><time>{pad(clocks.seoul.hour)}:{pad(clocks.seoul.minute)}</time><small>{clocks.seoul.month}.{pad(clocks.seoul.day)}</small></div><div><span>Santo Domingo</span><time>{pad(clocks.santoDomingo.hour)}:{pad(clocks.santoDomingo.minute)}</time><small>{clocks.santoDomingo.month}.{pad(clocks.santoDomingo.day)}</small></div></div>
  <div className="story-hour-picker"><label htmlFor={rangeId}>{ko?'한국 시간으로 골라봐':'Elige una hora de Corea'}</label>
   <div className="story-preview-skies" data-preview-visual="time-of-day"><CitySky hour={preview.koHour} city="gwangju" language={language}/><CitySky hour={preview.drHour} city="santo-domingo" language={language}/></div>
   <input id={rangeId} type="range" min="0" max="23" step="1" value={koreanHour} onPointerDown={()=>setPointerInput(true)} onKeyDown={()=>setPointerInput(false)} onChange={event=>onHourChange(Number(event.target.value))}/>
   <output htmlFor={rangeId} aria-live="polite" data-korean-hour={preview.koHour} data-dominican-hour={preview.drHour} data-day-offset={preview.drDayOffset}><span>{ko?'광주':'Gwangju'} {pad(preview.koHour)}:00</span><span>Santo Domingo {pad(preview.drHour)}:00 <small>{preview.drDayOffset<0?(ko?'전날':'el día anterior'):(ko?'같은 날':'el mismo día')}</small></span></output>
  </div>
 </div>;
}

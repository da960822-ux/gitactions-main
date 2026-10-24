import {useEffect,useId,useRef,useState,type PointerEvent} from 'react';
import {motion,useInView,useScroll,useSpring,useTransform,type MotionValue} from 'motion/react';
import {gsap} from 'gsap';
import {previewPlayHour,storyClockTimes} from '../coupleStoryFacts';
import './story-time-interaction.css';
import {useLiveReducedMotion} from './useLiveReducedMotion';

const pad=(value:number)=>String(value).padStart(2,'0');
export function storyCelestialPose(hour:number){
 const daylight=hour>=6&&hour<18,phase=((hour-(daylight?6:18)+24)%24)/12;
 return{daylight,x:24+152*phase,y:70-30*Math.sin(Math.PI*phase),rotation:hour*30};
}
export function storyCityDepthPose(pointerX:number,pointerY:number,progress:number,side:1|-1){
 return{x:`${-pointerX*3+progress*side*2}%`,y:`${-pointerY*2+progress*(side===1?4:-6)}%`};
}
function CitySky({hour,city,language,active,settle,scroll}:{hour:number;city:'gwangju'|'santo-domingo';language:'ko'|'es';active:boolean;settle:boolean;scroll:MotionValue<number>}){
 const ko=language==='ko',daylight=Math.max(0,Math.min(1,(Math.sin((hour-6)/12*Math.PI)+.15)/1.15)),initial=useRef(daylight);
 const side=city==='gwangju'?1:-1,pointerX=useSpring(0,{stiffness:110,damping:24}),pointerY=useSpring(0,{stiffness:110,damping:24}),depth=useSpring(0,{stiffness:80,damping:24});
 const photoX=useTransform(()=>storyCityDepthPose(pointerX.get(),pointerY.get(),depth.get(),side).x),photoY=useTransform(()=>storyCityDepthPose(pointerX.get(),pointerY.get(),depth.get(),side).y);
 const tiltX=useTransform(pointerY,[-1,1],[4,-4]),tiltY=useTransform(pointerX,[-1,1],[-6,6]),stageY=useTransform(depth,[-1,1],side===1?[10,-10]:[-16,16]);
 const glassX=useTransform(()=>`${depth.get()*side*80+pointerX.get()*12}%`);
 useEffect(()=>{
  if(!active){pointerX.jump(0);pointerY.jump(0);depth.jump(0);return;}
  const update=(value:number)=>depth.set(value*2-1);update(scroll.get());
  return scroll.on('change',update);
 },[active,scroll,pointerX,pointerY,depth]);
 const follow=(event:PointerEvent<HTMLElement>)=>{if(!active||event.pointerType!=='mouse')return;const box=event.currentTarget.getBoundingClientRect();pointerX.set(Math.max(-1,Math.min(1,(event.clientX-box.left)/box.width*2-1)));pointerY.set(Math.max(-1,Math.min(1,(event.clientY-box.top)/box.height*2-1)));};
 const day=hour>=6&&hour<18;
 const period=hour<6||hour>=22?(ko?'밤':'Noche'):hour<12?(ko?'아침':'Mañana'):hour<18?(ko?'오후':'Tarde'):(ko?'저녁':'Atardecer');
 const cityName=city==='gwangju'?(ko?'광주':'Gwangju'):'Santo Domingo';
 const sky=storyCelestialPose(hour);
 return <motion.figure className="story-time-city" data-city={city} data-preview-hour={hour} data-depth-active={active} data-preview-day={day} style={{rotateX:tiltX,rotateY:tiltY,y:stageY}} onPointerMove={follow} onPointerLeave={()=>{pointerX.set(0);pointerY.set(0);}} onPointerCancel={()=>{pointerX.set(0);pointerY.set(0);}}>
  <div className="story-time-city-art" role="img" aria-label={ko?`${cityName} 도시 풍경 일러스트`:`Vista ilustrada de ${cityName}`}>
   <motion.div className="story-city-photograph" style={{x:photoX,y:photoY}}/>
   <div className="story-city-night" data-story-daylight={(1-daylight)*.46} style={{opacity:(1-initial.current)*.46}}/>
   <div className="story-city-day" data-story-daylight={daylight*.14} style={{opacity:initial.current*.14}}/>
   <motion.div className="story-city-hourlight" initial={false} animate={{x:`${(sky.x-100)*.35}%`,rotate:day?-18:18,opacity:.12+daylight*.38}} transition={{duration:settle?.9:0,ease:[.16,1,.3,1]}}/>
   <motion.div className="story-city-refraction" style={{x:glassX}}/>
   <svg className="story-city-celestial" viewBox="0 0 200 100" aria-hidden="true" data-celestial={day?'sun':'moon'}>
    <path className="story-city-orbit" d="M24 70Q100 10 176 70"/>
    <motion.g initial={false} animate={{x:sky.x,y:sky.y}} transition={{duration:settle?.8:0,ease:[.16,1,.3,1]}}>
     <motion.g initial={false} animate={{rotate:sky.rotation}} transition={{duration:settle?.9:0,ease:[.16,1,.3,1]}} className="story-city-dial">{Array.from({length:12},(_,index)=><path key={index} d="M0 -24V-20" transform={`rotate(${index*30})`}/>)}</motion.g>
     <motion.g initial={false} animate={{scale:day?1:.85,opacity:.25+daylight*.65}} transition={{duration:settle?.8:0}} className="story-city-rays">{[0,45,90,135].map(angle=><path key={angle} d="M0 -35V-27M0 27V35" transform={`rotate(${angle})`}/>)}</motion.g>
     {day?<circle className="story-city-sun" r="12"/>:<path className="story-city-moon" d="M8 10A14 14 0 0 1-5-12A14 14 0 1 0 8 10Z"/>}
    </motion.g>
   </svg>
  </div>
  <figcaption><svg viewBox="0 0 24 24" aria-hidden="true">{day?<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></>:<path d="M19 15.5A8 8 0 0 1 8.5 5a8 8 0 1 0 10.5 10.5Z"/>}</svg><span>{period}</span></figcaption>
 </motion.figure>;
}

export function StoryTimeInteraction({language,now,koreanHour,onHourChange}:{language:'ko'|'es';now:Date;koreanHour:number;onHourChange:(hour:number)=>void}){
 const ko=language==='ko',rangeId=useId(),host=useRef<HTMLDivElement>(null);
 const [pointerInput,setPointerInput]=useState(false),[pageVisible,setPageVisible]=useState(()=>typeof document==='undefined'||!document.hidden);
 const inView=useInView(host,{amount:.1}),reduced=useLiveReducedMotion(),active=inView&&pageVisible&&!reduced,settle=active&&pointerInput;
 const {scrollYProgress}=useScroll({target:host,offset:['start end','end start']});
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
  <div className="story-hour-picker"><label htmlFor={rangeId}>{ko?'한국 시간으로 골라봐':'Elige una hora en horario de Corea'}</label>
   <div className="story-preview-skies" data-preview-visual="time-of-day"><CitySky hour={preview.koHour} city="gwangju" language={language} active={active} settle={settle} scroll={scrollYProgress}/><CitySky hour={preview.drHour} city="santo-domingo" language={language} active={active} settle={settle} scroll={scrollYProgress}/></div>
   <input id={rangeId} type="range" min="0" max="23" step="1" value={koreanHour} onPointerDown={()=>setPointerInput(true)} onKeyDown={()=>setPointerInput(true)} onChange={event=>onHourChange(Number(event.target.value))}/>
   <output htmlFor={rangeId} aria-live="polite" data-korean-hour={preview.koHour} data-dominican-hour={preview.drHour} data-day-offset={preview.drDayOffset}><span>{ko?'광주':'Gwangju'} {pad(preview.koHour)}:00</span><span>Santo Domingo {pad(preview.drHour)}:00 <small>{preview.drDayOffset<0?(ko?'전날':'el día anterior'):(ko?'같은 날':'el mismo día')}</small></span></output>
  </div>
 </div>;
}

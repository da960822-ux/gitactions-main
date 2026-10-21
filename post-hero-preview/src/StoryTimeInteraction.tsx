import {useEffect,useId,useRef,useState} from 'react';
import {motion,useInView,useMotionTemplate,useReducedMotion,useSpring} from 'motion/react';
import {gsap} from 'gsap';
import {previewPlayHour,storyClockTimes} from '../../src/landing/coupleStoryFacts';
import './story-time-interaction.css';

const pad=(value:number)=>String(value).padStart(2,'0');
const spring={mass:1,stiffness:100,damping:10};

function skyPose(hour:number){
 const angle=(hour-6)/12*Math.PI;
 return {sunX:140-Math.cos(angle)*101,sunY:100-Math.sin(angle)*70,moonX:140+Math.cos(angle)*101,moonY:100+Math.sin(angle)*70,daylight:Math.max(0,Math.min(1,(Math.sin(angle)+.15)/1.15))};
}

function CitySky({hour,settle,active}:{hour:number;settle:boolean;active:boolean}){
 const id=useId(),pose=skyPose(hour),initial=useRef(pose);
 const sunX=useSpring(pose.sunX,spring),sunY=useSpring(pose.sunY,spring),moonX=useSpring(pose.moonX,spring),moonY=useSpring(pose.moonY,spring);
 const pointerX=useSpring(0,spring),pointerY=useSpring(0,spring);
 const sunTransform=useMotionTemplate`translate(${sunX}px, ${sunY}px)`,moonTransform=useMotionTemplate`translate(${moonX}px, ${moonY}px)`,lightTransform=useMotionTemplate`translate(${pointerX}px, ${pointerY}px)`;
 useEffect(()=>{
  const targets=[[sunX,pose.sunX],[sunY,pose.sunY],[moonX,pose.moonX],[moonY,pose.moonY]] as const;
  targets.forEach(([value,target])=>settle?value.set(target):value.jump(target));
  if(!active){pointerX.jump(0);pointerY.jump(0);}
 },[hour,settle,active,sunX,sunY,moonX,moonY,pointerX,pointerY]);
 useEffect(()=>()=>{[sunX,sunY,moonX,moonY,pointerX,pointerY].forEach(value=>value.stop());},[sunX,sunY,moonX,moonY,pointerX,pointerY]);
 const resetPointer=()=>{if(active){pointerX.set(0);pointerY.set(0);}else{pointerX.jump(0);pointerY.jump(0);}};
 return <svg className="story-time-sky" viewBox="0 0 280 132" aria-hidden="true" data-preview-hour={hour} onPointerMove={event=>{
  if(!active||event.pointerType!=='mouse'||!matchMedia('(hover: hover) and (pointer: fine)').matches)return;
  const bounds=event.currentTarget.getBoundingClientRect();
  pointerX.set(((event.clientX-bounds.left)/bounds.width-.5)*6);pointerY.set(((event.clientY-bounds.top)/bounds.height-.5)*4);
 }} onPointerLeave={resetPointer}>
  <defs>
   <clipPath id={`${id}-horizon`}><path className="story-sky-clip" d="M0 0H280V100H0Z"/></clipPath>
   <radialGradient id={`${id}-day`} cx="50%" cy="75%" r="65%"><stop offset="0" stopColor="#dba478" stopOpacity=".7"/><stop offset=".65" stopColor="#b37571" stopOpacity=".27"/><stop offset="1" stopColor="#b37571" stopOpacity="0"/></radialGradient>
   <radialGradient id={`${id}-night`} cx="50%" cy="75%" r="65%"><stop offset="0" stopColor="#697fa3" stopOpacity=".45"/><stop offset=".6" stopColor="#505777" stopOpacity=".24"/><stop offset="1" stopColor="#505777" stopOpacity="0"/></radialGradient>
  </defs>
  <g clipPath={`url(#${id}-horizon)`}>
   <motion.g style={{transform:lightTransform}}>
    <ellipse cx="140" cy="82" rx="138" ry="85" fill={`url(#${id}-night)`} data-story-daylight={1-pose.daylight} style={{opacity:1-initial.current.daylight}}/>
    <ellipse cx="140" cy="82" rx="138" ry="85" fill={`url(#${id}-day)`} data-story-daylight={pose.daylight} style={{opacity:initial.current.daylight}}/>
   </motion.g>
   <path className="story-sky-guide" d="M39 100A101 70 0 0 1 241 100"/>
   <motion.g style={{transform:sunTransform}}><circle className="story-sky-sun" r="10"/><circle className="story-sky-sun-rim" r="15"/></motion.g>
   <motion.g style={{transform:moonTransform}}><path className="story-sky-moon" d="M5-10A11 11 0 1 0 11 6A10 10 0 0 1 5-10Z"/></motion.g>
  </g>
  <path className="story-sky-horizon" d="M16 100H264"/>
  <path className="story-sky-reflection" d="M70 107H210"/>
 </svg>;
}

export function StoryTimeInteraction({language,now}:{language:'ko'|'es';now:Date}){
 const ko=language==='ko',rangeId=useId(),host=useRef<HTMLDivElement>(null);
 const [koreanHour,setKoreanHour]=useState(20),[pointerInput,setPointerInput]=useState(false),[pageVisible,setPageVisible]=useState(()=>typeof document==='undefined'||!document.hidden);
 const inView=useInView(host,{amount:.1}),reduced=useReducedMotion(),active=inView&&pageVisible&&!reduced,settle=active&&pointerInput;
 const clocks=storyClockTimes(now),preview=previewPlayHour(koreanHour);
 useEffect(()=>{const update=()=>setPageVisible(!document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
 useEffect(()=>{
  const lights=host.current?.querySelectorAll<SVGElement>('[data-story-daylight]');if(!lights)return;
  const timeline=gsap.timeline({paused:true});
  lights.forEach(light=>timeline.to(light,{opacity:Number(light.dataset.storyDaylight),duration:.24,ease:'power3.out'},0));
  if(settle)timeline.play();else timeline.progress(1);
  return()=>{timeline.kill();};
 },[koreanHour,settle]);
 return <div ref={host} className="story-time-content story-time-interaction" data-time-motion={settle?'spring':'instant'}>
  <p className="story-live-label">{ko?'지금, 각자의 시간':'Ahora, en cada ciudad'}</p>
  <div className="story-live-clocks"><div><span>{ko?'광주':'Gwangju'}</span><time>{pad(clocks.seoul.hour)}:{pad(clocks.seoul.minute)}</time><small>{clocks.seoul.month}.{pad(clocks.seoul.day)}</small></div><div><span>Santo Domingo</span><time>{pad(clocks.santoDomingo.hour)}:{pad(clocks.santoDomingo.minute)}</time><small>{clocks.santoDomingo.month}.{pad(clocks.santoDomingo.day)}</small></div></div>
  <div className="story-hour-picker"><label htmlFor={rangeId}>{ko?'한국 시간으로 골라봐':'Elige una hora de Corea'}</label>
   <div className="story-preview-skies" data-preview-visual="time-of-day"><CitySky hour={preview.koHour} settle={settle} active={active}/><CitySky hour={preview.drHour} settle={settle} active={active}/></div>
   <input id={rangeId} type="range" min="0" max="23" step="1" value={koreanHour} onPointerDown={()=>setPointerInput(true)} onKeyDown={()=>setPointerInput(false)} onChange={event=>setKoreanHour(Number(event.target.value))}/>
   <output htmlFor={rangeId} aria-live="polite" data-korean-hour={preview.koHour} data-dominican-hour={preview.drHour} data-day-offset={preview.drDayOffset}><span>{ko?'광주':'Gwangju'} {pad(preview.koHour)}:00</span><span>Santo Domingo {pad(preview.drHour)}:00 <small>{preview.drDayOffset<0?(ko?'전날':'el día anterior'):(ko?'같은 날':'el mismo día')}</small></span></output>
  </div>
 </div>;
}

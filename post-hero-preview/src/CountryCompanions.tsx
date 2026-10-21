import {useEffect,useId,useRef,useState} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {motion,useMotionValue,useSpring,useMotionTemplate,useReducedMotion} from 'motion/react';
import './country-companions.css';

gsap.registerPlugin(ScrollTrigger);
const spring={mass:1,stiffness:100,damping:10};
export type CompanionPhase='greet'|'return'|'instant';
export function companionBodyMotion(phase:CompanionPhase,together:boolean,shift:number,side:1|-1,reduced:boolean){
 const target=together&&phase!=='return'?shift*side:0,stages=together?[.18,.62,.94]:[.94,.62,.18],travel=shift*side;
 const transform=phase==='greet'&&!reduced?[null,`translateX(${travel*stages[0]}px) translateY(-64px) rotate(${side*-8}deg)`,`translateX(${travel*stages[1]}px) translateY(-92px) rotate(${side*3}deg)`,`translateX(${travel*stages[2]}px) translateY(-24px) rotate(${side*5}deg)`,`translateX(${target}px) translateY(0px) rotate(${together?side*3:0}deg)`]:`translateX(${target}px) translateY(0px) rotate(${together&&phase!=='return'?side*3:0}deg)`;
 const transition=reduced||phase==='instant'?{duration:0}:phase==='return'?{duration:.22,ease:[.23,1,.32,1] as const}:{duration:1.15,ease:[.77,0,.175,1] as const,times:[0,.25,.5,.8,1]};
 return{transform,transition};
}
function Companion({side,together,phase,shift,reduced,interactive,language,onGreet,onError}:{side:1|-1;together:boolean;phase:CompanionPhase;shift:number;reduced:boolean;interactive:boolean;language:'ko'|'es';onGreet:(pointer:boolean)=>void;onError:()=>void}){
 const ko=language==='ko',id=useId(),x=useSpring(useMotionValue(0),spring),rotation=useSpring(useMotionValue(0),spring),animated=phase==='greet';
 const transform=useMotionTemplate`translateX(${x}px) rotate(${rotation}deg)`,body=companionBodyMotion(phase,together,shift,side,reduced);
 useEffect(()=>{if(reduced||!interactive){x.jump(0);rotation.jump(0);}},[reduced,interactive,x,rotation]);
 return <div className={`bird-scroll lovebird-${side===1?'left':'right'}`} inert={!interactive}>
  <motion.button type="button" className="lovebird" aria-label={ko?(side===1?'광주의 잉꼬에게 인사하기':'산토도밍고의 시구아팔메라에게 인사하기'):(side===1?'Saludar al inseparable de Gwangju':'Saludar a la cigua palmera de Santo Domingo')} aria-pressed={together} aria-hidden={!interactive} tabIndex={interactive?0:-1} initial={false} animate={{transform:body.transform}} transition={body.transition} onClick={event=>onGreet(event.detail>0)} onPointerMove={event=>{if(reduced||event.pointerType!=='mouse'||!matchMedia('(hover: hover) and (pointer: fine)').matches)return;const bounds=event.currentTarget.getBoundingClientRect(),ratio=(event.clientX-bounds.left)/bounds.width-.5;x.set(ratio*8);rotation.set(ratio*4);}} onPointerLeave={()=>{x.set(0);rotation.set(0);}}>
   <motion.svg className="lovebird-art" style={{transform}} viewBox="0 0 1254 1254" aria-hidden="true">
    <defs><clipPath id={`${id}-wing`}><path d={side===1?'M584 501C527 468 445 475 409 519C348 597 324 695 257 779C210 838 160 923 142 988C278 955 402 856 489 769C577 685 635 595 636 546C636 523 614 507 584 501Z':'M567 435C640 422 710 458 748 510C801 579 847 674 924 755C969 806 1016 868 1042 938C919 906 824 846 735 780C650 714 575 626 552 552C535 496 537 455 567 435Z'}/></clipPath></defs>
    <image href={side===1?'/images/story-companions/lovebird.png':'/images/story-companions/palmchat.png'} width="1254" height="1254" onError={onError}/>
    <motion.g className="companion-wing" clipPath={`url(#${id}-wing)`} style={{transformOrigin:side===1?'584px 510px':'567px 450px'}} initial={false} animate={{transform:animated&&!reduced?[null,`rotate(${side*-6}deg)`,`rotate(${side*2}deg)`,'rotate(0deg)']:'rotate(0deg)'}} transition={animated&&!reduced?{duration:.7,ease:[.77,0,.175,1],times:[0,.35,.7,1]}:phase==='return'&&!reduced?{duration:.22,ease:[.23,1,.32,1]}:{duration:0}}>
     <image href={side===1?'/images/story-companions/lovebird.png':'/images/story-companions/palmchat.png'} width="1254" height="1254" onError={onError}/>
    </motion.g>
   </motion.svg>
  </motion.button>
 </div>;
}

export function CountryCompanions({language}:{language:'ko'|'es'}){
 const ko=language==='ko',root=useRef<HTMLDivElement>(null),reduced=useReducedMotion();
 const [together,setTogether]=useState(false),[visible,setVisible]=useState(false),[phase,setPhase]=useState<CompanionPhase>('instant'),[shift,setShift]=useState(0),[failed,setFailed]=useState(false),[trace,setTrace]=useState({x:0,y:0}),[moment,setMoment]=useState<'distance'|'time'|'shared'>('distance');
 useEffect(()=>{
  const element=root.current;if(!element)return;
  const story=element.parentElement!,distance=story.querySelector('#distance')!,time=story.querySelector('#time-difference')!,shared=story.querySelector('#shared-place')!,stage=element.querySelector('.companion-stage')!;
  const currentMoment=()=>shared.getBoundingClientRect().top<innerHeight*.8?'shared':time.getBoundingClientRect().top<innerHeight*.65?'time':'distance';
  const updateMoment=()=>setMoment(currentMoment());
  const reset=()=>{setTogether(false);setPhase('instant');};
  const returnCurrent=()=>{const bounds=element.getBoundingClientRect();setTogether(false);setPhase(document.hidden||bounds.bottom<=0||bounds.top>=innerHeight||matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'return');};
  const size={width:element.clientWidth,height:element.clientHeight};
  const resize=new ResizeObserver(([entry])=>{if(Math.abs(entry.contentRect.width-size.width)>1||Math.abs(entry.contentRect.height-size.height)>1)returnCurrent();size.width=entry.contentRect.width;size.height=entry.contentRect.height;});resize.observe(element);
  const observer=new IntersectionObserver(([entry])=>{setVisible(entry.isIntersecting);if(!entry.isIntersecting)reset();},{threshold:.15});observer.observe(element);
  const hidden=()=>{if(document.hidden){setVisible(false);reset();}else setVisible(element.getBoundingClientRect().bottom>0&&element.getBoundingClientRect().top<innerHeight);};document.addEventListener('visibilitychange',hidden);
  const mm=gsap.matchMedia();mm.add({motion:'(prefers-reduced-motion: no-preference)',reduced:'(prefers-reduced-motion: reduce)'},context=>{
   const diagnose=(trigger:ScrollTrigger)=>{
    element.dataset.companionStart=String(trigger.start);element.dataset.companionEnd=String(trigger.end);element.dataset.companionProgress=String(trigger.progress);
    element.dataset.companionDistanceTop=String(distance.getBoundingClientRect().top+scrollY);
   };
   if(context.conditions?.reduced){
    const settle=()=>{const next=currentMoment();setMoment(next);gsap.set(stage,next==='distance'?{scale:1,xPercent:0,yPercent:0,autoAlpha:1}:next==='time'?{scale:.6,xPercent:0,yPercent:-50,autoAlpha:1}:{scale:.5,xPercent:12,yPercent:-130,autoAlpha:0});};
    gsap.set(stage,{transformOrigin:'80% 80%'});
    ScrollTrigger.create({trigger:time,start:'top bottom',endTrigger:shared,end:'top 20%',refreshPriority:-2,onRefresh:settle,onUpdate:settle});settle();return;
   }
   // The upstream Hero pin must contribute its spacer before this interval is measured.
   const timeline=gsap.timeline({scrollTrigger:{trigger:distance,start:'top 85%',end:'top 10%',scrub:true,refreshPriority:-1,invalidateOnRefresh:true,onRefresh:diagnose,onUpdate:trigger=>{diagnose(trigger);returnCurrent();}}});
   timeline.fromTo(element.querySelector('.lovebird-left')!,{xPercent:-12},{xPercent:8,ease:'none'},0).fromTo(element.querySelector('.lovebird-right')!,{xPercent:12},{xPercent:-8,ease:'none'},0);
   gsap.set(stage,{transformOrigin:'80% 80%'});
   const handoff=gsap.timeline({scrollTrigger:{trigger:time,start:'top bottom',endTrigger:shared,end:'top 20%',scrub:true,refreshPriority:-2,invalidateOnRefresh:true,onRefresh:updateMoment,onUpdate:trigger=>{element.dataset.handoffProgress=String(trigger.progress);updateMoment();returnCurrent();}}});
   handoff.to(stage,{scale:.6,yPercent:-50,ease:'none',duration:5/9}).to(stage,{scale:.5,xPercent:12,yPercent:-130,autoAlpha:0,ease:'none',duration:4/9});
  });
  return()=>{observer.disconnect();resize.disconnect();document.removeEventListener('visibilitychange',hidden);mm.revert();};
 },[]);
 useEffect(()=>{if(reduced){setTogether(false);setPhase('instant');}},[reduced]);
 const greet=(pointer:boolean)=>{
  if(!together&&root.current){const leftElement=root.current.querySelector<HTMLElement>('.lovebird-left')!,left=leftElement.getBoundingClientRect(),right=root.current.querySelector('.lovebird-right')!.getBoundingClientRect(),scale=left.width/Math.max(1,leftElement.offsetWidth);
   // Alpha-art beaks after the three-degree inward greeting; keep a visible gap.
   setShift(Math.max(0,(right.left+right.width*.068-left.left-left.width*.825-14)/(2*scale)));
   const scene=root.current.querySelector('.companion-stage')!.getBoundingClientRect();
   setTrace({x:(left.left+left.width*.825+right.left+right.width*.068)/2/scale-scene.left/scale,y:(left.top+left.width*.264+right.top+right.width*.318)/2/scale-scene.top/scale});
  }
  setPhase(pointer&&visible&&!reduced?'greet':'instant');setTogether(value=>!value);
 };
 return <div ref={root} className="country-companions" data-together={together} data-visible={visible} data-interaction-phase={phase} data-story-moment={moment} role="group" aria-labelledby="story-distance-title">
  <div className="companion-stage">
  <Companion side={1} together={together} phase={phase} shift={shift} reduced={Boolean(reduced)||!visible} interactive={moment==='distance'} language={language} onGreet={greet} onError={()=>setFailed(true)}/>
  <svg className="companion-heart" aria-hidden="true"><g transform={`translate(${trace.x} ${trace.y-118})`}>
   {[-1,1].map(side=><motion.path key={side} d={`M0 12C${side*24} -25 ${side*80} -22 ${side*80} 18C${side*80} 62 ${side*30} 92 0 118`} initial={false} animate={{pathLength:together?1:0,opacity:together?.5:0}} transition={{duration:phase==='greet'&&!reduced?.75:phase==='return'&&!reduced?.22:0,delay:together&&phase==='greet'&&!reduced?.4:0,ease:[.23,1,.32,1]}}/>)}</g></svg>
  <Companion side={-1} together={together} phase={phase} shift={shift} reduced={Boolean(reduced)||!visible} interactive={moment==='distance'} language={language} onGreet={greet} onError={()=>setFailed(true)}/>
  <button type="button" className="lovebird-greeting text-button" hidden={moment!=='distance'} aria-pressed={together} onClick={event=>greet(event.detail>0)}>{together?(ko?'조금 떨어져 볼까':'Un poquito de espacio'):(ko?'가까이 와':'Acérquense')}</button>
  </div>
  {failed&&<p className="lovebird-error" role="status">{ko?'새 그림을 불러오지 못했어. 페이지를 다시 열어줘.':'No se cargaron las aves. Vuelve a abrir la página.'}</p>}
 </div>;
}

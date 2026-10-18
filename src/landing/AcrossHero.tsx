import {pointerDecay} from './cinematic/folded/pointerResponse';
import {useEffect,useRef,useState} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {INTRO_SECONDS,introPose,smoothRange,type FoldPose} from './cinematic/folded/pose';
import './across-hero.css';

gsap.registerPlugin(ScrollTrigger);
// Keep scroll scrubbing tied to elapsed time after slow frames.
gsap.ticker.lagSmoothing(0);
export function AcrossHero({language}:{language:'ko'|'es'}){
 const section=useRef<HTMLElement>(null),canvas=useRef<HTMLCanvasElement>(null),copy=useRef<HTMLDivElement>(null),destination=useRef<HTMLDivElement>(null);
 const [ready,setReady]=useState(false),[introActive,setIntroActive]=useState(()=>!matchMedia('(prefers-reduced-motion: reduce)').matches&&!sessionStorage.getItem('folded-playhouse-seen')&&!location.hash);
 const skip=useRef<()=>void>(()=>{});const es=language==='es';
 useEffect(()=>{
  const host=section.current!,screen=canvas.current!,reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const first=!reduced.matches&&!sessionStorage.getItem('folded-playhouse-seen')&&!location.hash;
  const pose:FoldPose={progress:0,entrance:first?0:1,pointerX:0,pointerY:0,time:0};
  let world:Awaited<ReturnType<typeof import('./cinematic/folded/previewSpaceV19')['createFoldedWorld']>>|undefined;
  let disposed=false,raf=0,start=0,last=0,elapsed=0,visible=true,inIntro=first,webglLost=false;
  const pointer={x:0,y:0};let trigger:ScrollTrigger|undefined;
  const titleLines=[...host.querySelectorAll<HTMLElement>('.across-title-line')];
  const endIntro=()=>{inIntro=false;pose.entrance=1;setIntroActive(false);sessionStorage.setItem('folded-playhouse-seen','1');};skip.current=endIntro;
  const onMove=(event:PointerEvent)=>{if(event.pointerType==='touch'||reduced.matches)return;const r=screen.getBoundingClientRect();pointer.x=Math.max(-1,Math.min(1,(event.clientX-r.left)/r.width*2-1));pointer.y=Math.max(-1,Math.min(1,(event.clientY-r.top)/r.height*2-1));};
  const leave=()=>{pointer.x=pointer.y=0;};
  const resize=()=>{world?.resize(screen.clientWidth,screen.clientHeight,Math.min(devicePixelRatio,innerWidth<760?1.25:1.5));ScrollTrigger.refresh();};
  const preference=()=>{if(reduced.matches){endIntro();leave();trigger?.disable(true);pose.progress=0;}else trigger?.enable();};
  const lost=(event:Event)=>{event.preventDefault();webglLost=true;setReady(false);endIntro();};
  const restored=()=>{webglLost=false;resize();setReady(true);};
  const docVisibility=()=>{last=0;};
  const media=gsap.matchMedia();media.add('(prefers-reduced-motion: no-preference)',()=>{
   const tl=gsap.timeline({scrollTrigger:{trigger:host,start:'top top',end:'+=260%',pin:'.across-stage',scrub:.35,invalidateOnRefresh:true,onUpdate:self=>{if(self.progress>.015&&inIntro)endIntro();}}});
   tl.to(pose,{progress:1,ease:'none',duration:1});trigger=tl.scrollTrigger;
   return()=>{pose.progress=0;};
  });
  const obs=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;});obs.observe(host);
  const tick=(now:number)=>{
   if(disposed)return;raf=requestAnimationFrame(tick);const actualDt=last?Math.max(0,(now-last)/1000):0,dt=Math.min(actualDt,.08);last=now;if(!visible||document.hidden||webglLost)return;
   elapsed+=dt;
   if(inIntro){const t=Math.max(0,(now-start)/1000);pose.entrance=introPose(t).entrance;pose.time=t;if(t>=INTRO_SECONDS-1/60&&Number(screen.dataset.entrance)>=.999)endIntro();}else pose.time=elapsed;
   const input=inIntro||reduced.matches?0:1;const decay=pointerDecay(actualDt);pose.pointerX+=(pointer.x*input-pose.pointerX)*decay;pose.pointerY+=(pointer.y*input-pose.pointerY)*decay;
   world?.render(pose);
   host.dataset.introOwner=inIntro?'live-space+remotion-surface':'live';host.dataset.introTime=pose.time.toFixed(3);
   const p=Number(screen.dataset.progress??0),displayedEntrance=Number(screen.dataset.entrance??0),exit=smoothRange(.15,.46,p),appear=smoothRange(.73,.94,p);
   if(copy.current){const copyExit=copy.current.querySelector(':focus-visible')?0:exit;copy.current.style.opacity=String(1-copyExit);copy.current.style.transform=`translate3d(${-copyExit*90}px,${-copyExit*65}px,${copyExit*320}px)`;copy.current.style.pointerEvents=copyExit>.98?'none':'auto';copy.current.inert=copyExit>.98;}
   titleLines.forEach((line,index)=>{const a=smoothRange(.12+index*.1,.42+index*.13,displayedEntrance);line.style.opacity=String(a);line.style.transform=`translateY(${(1-a)*22}px)`;});
   if(destination.current){destination.current.style.opacity=String(appear);destination.current.style.transform=`translate3d(0,${(1-appear)*35}px,0)`;destination.current.inert=appear<.95;}
  };
  void import('./cinematic/folded/previewSpaceV19').then(async({createFoldedWorld})=>{
   if(disposed)return;world=createFoldedWorld(screen,{width:screen.clientWidth,height:screen.clientHeight,pixelRatio:Math.min(devicePixelRatio,innerWidth<760?1.25:1.5),portrait:'/images/yeonseok-lisbeth-cutout.webp',surfaceFilm:'/motion/folded-playhouse-lightwell.mp4',introSurfaceFilm:'/motion/folded-playhouse-gift-edge-v18.mp4',onFrame:data=>{Object.assign(screen.dataset,data);if(first||Number(data.entrance)>=.999)setReady(true);}});
   await world.ready;if(disposed)return;world.render(pose);start=performance.now();
   if(inIntro)setIntroActive(true);
   raf=requestAnimationFrame(tick);
  }).catch(error=>{console.error('Folded Playhouse WebGL:',error);endIntro();});
  host.addEventListener('pointermove',onMove);host.addEventListener('pointerleave',leave);window.addEventListener('resize',resize);reduced.addEventListener('change',preference);screen.addEventListener('webglcontextlost',lost);screen.addEventListener('webglcontextrestored',restored);document.addEventListener('visibilitychange',docVisibility);
  return()=>{disposed=true;cancelAnimationFrame(raf);media.revert();obs.disconnect();world?.dispose();host.removeEventListener('pointermove',onMove);host.removeEventListener('pointerleave',leave);window.removeEventListener('resize',resize);reduced.removeEventListener('change',preference);screen.removeEventListener('webglcontextlost',lost);screen.removeEventListener('webglcontextrestored',restored);document.removeEventListener('visibilitychange',docVisibility);};
 },[]);

 return <section ref={section} className={`across-hero folded-playhouse${introActive?' is-intro':''}`} id="home" aria-labelledby="hero-title">
  <div className="across-stage">
   <div className="folded-backdrop" aria-hidden="true"/>
   <img className={`folded-portrait-fallback${ready?' is-ready':''}`} src="/images/yeonseok-lisbeth-cutout.webp" alt="" aria-hidden="true" fetchPriority="high"/>
   <canvas ref={canvas} className={`across-canvas${ready?' is-ready':''}`} role="img" aria-label={es?'Yeonseok y Lisbeth, juntos en un escenario que se abre hacia otro espacio':'다음 공간으로 펼쳐지는 무대에 함께 있는 연석과 리스벳'}/>
   <div ref={copy} className="across-editorial">
    <p className="folded-dedication">YEONSEOK <span aria-hidden="true">♡</span> LISBETH <i>04.04.2025</i></p>
    <h1 id="hero-title"><span className="across-title-line folded-baby">Baby,</span><span className="across-title-line">{es?'¡lo hice':'이거 내가'}</span><span className="across-title-line">{es?'para ti!':'만들었어!'}</span></h1>
    <p className="across-caption">{es?<>Aunque estemos lejos,<br/>para que juguemos juntos.</>:<>멀리 있어도,<br/>우리 둘이 같이 놀 수 있게.</>}</p>
    <div className="across-actions"><a className="across-play" href="#games"><span>{es?'Vamos a jugar':'같이 놀자'}</span><span aria-hidden="true">↗</span></a><a className="across-letter-link" href="#papi-letter">{es?'La carta de Papi':'Papi의 편지'}<span aria-hidden="true">↗</span></a></div>
   </div>
   <div className="folded-side-note" aria-hidden="true"><span>한국</span><i/> <span>República Dominicana</span></div>
   <div ref={destination} className="folded-destination" aria-labelledby="folded-destination-title"><span className="folded-destination-date">2025.04.04</span><h2 id="folded-destination-title">{es?<>Lejos,<br/><em>pero juntos.</em></>:<>멀리 있어도,<br/><em>같은 시간에.</em></>}</h2><a href="#games">{es?'Vamos a jugar':'같이 놀자'} <span aria-hidden="true">↗</span></a></div>
   <div className="across-bottom"><span>YEONSEOK & LISBETH</span><a href="#games">{es?'Un lugar para los dos':'우리 둘이 같이 놀 수 있는 곳'}<span aria-hidden="true">↓</span></a><span>MADE FOR YOU, BABY.</span></div>
   {introActive&&<button className="folded-skip" type="button" onClick={()=>skip.current()}>{es?'Saltar intro':'건너뛰기'} <span aria-hidden="true">↗</span></button>}
  </div>
 </section>;
}

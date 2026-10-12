import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './across-hero.css';

gsap.registerPlugin(ScrollTrigger);
gsap.ticker.lagSmoothing(0);

export function AcrossHero({ language }: { language: 'ko' | 'es' }) {
  const section=useRef<HTMLElement>(null);
  const canvas=useRef<HTMLCanvasElement>(null);
  const [ready,setReady]=useState(false);
  const [intro,setIntro]=useState(false);
  const [introPlaying,setIntroPlaying]=useState(false);
  const es=language==='es';
  useEffect(()=>{
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
    const pose={progress:0,entrance:1};
    let dispose:(()=>void)|undefined;
    let disposed=false;
    const context=gsap.context(()=>{

      const media=gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)',()=>{
        pose.entrance=0;
        gsap.to(pose,{entrance:1,duration:2.4,ease:'power3.out'});
        const entrances=[...section.current!.querySelectorAll<HTMLElement>('.across-title-line')].map((line,index)=>line.animate([{transform:'translateY(110%) rotate(3deg)'},{transform:'translateY(0) rotate(0deg)'}],{duration:1500,delay:200+index*80,easing:'cubic-bezier(0.23,1,0.32,1)',fill:'backwards'}));
        entrances.push(...[...section.current!.querySelectorAll<HTMLElement>('.across-caption, .across-actions, .across-coordinate')].map((line,index)=>line.animate([{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'translateY(0)'}],{duration:1000,delay:800+index*80,easing:'cubic-bezier(0.23,1,0.32,1)',fill:'backwards'})));
        const timeline=gsap.timeline({scrollTrigger:{trigger:section.current,start:'top top',end:'+=170%',pin:'.across-stage',scrub:.8,anticipatePin:1,invalidateOnRefresh:true,onUpdate:self=>{const index=section.current?.querySelector('.across-scene-index');if(index)index.textContent=self.progress>.55?'02':'01';}}});
        timeline.to(pose,{progress:1,duration:1,ease:'none'},0)
          .to('.across-headline',{z:320,y:-90,rotationY:-8,opacity:0,duration:.48,ease:'power1.in'},0)
          .fromTo('.across-caption, .across-actions',{y:0,opacity:1},{y:80,opacity:0,duration:.25,immediateRender:false},0)
          .fromTo('.across-coordinate, .across-dedication',{opacity:1},{opacity:0,duration:.2,immediateRender:false},0)
          .fromTo('.across-story-entry',{z:-350,opacity:0,y:70},{z:0,opacity:1,y:0,duration:.45},.48)
          .fromTo('.across-story-word',{yPercent:105},{yPercent:0,duration:.3,stagger:.06},.55);
        return ()=>{entrances.forEach(animation=>animation.cancel());pose.progress=0;pose.entrance=1;};
      });
      return ()=>media.revert();
    },section);
    void import('./cinematic/across-world').then(({createAcrossWorld})=>{
      if(disposed)return;
      dispose=createAcrossWorld(canvas.current!,'/images/yeonseok-lisbeth-cutout.webp',pose,reduce.matches,()=>{if(!disposed)setReady(true);});
    }).catch(error=>console.warn('Across the Distance: static scene fallback',error));
    if(!reduce.matches&&!sessionStorage.getItem('across-gift-seen')&&!location.hash){setIntro(true);}
    return ()=>{disposed=true;context.revert();dispose?.();};
  },[]);
  const finishIntro=()=>{setIntro(false);setIntroPlaying(false);sessionStorage.setItem('across-gift-seen','1');};
  useEffect(()=>{if(!intro)return;const timeout=window.setTimeout(finishIntro,5500);const scroll=()=>{if(window.scrollY>20)finishIntro();};window.addEventListener('scroll',scroll,{passive:true});return ()=>{window.clearTimeout(timeout);window.removeEventListener('scroll',scroll);};},[intro]);

  return <section ref={section} className="across-hero" id="home" aria-labelledby="hero-title">
    <div className="across-stage">
      <div className="across-atmosphere" aria-hidden="true" />
      <img className={`across-portrait-fallback${ready?' is-ready':''}`} src="/images/yeonseok-lisbeth-cutout.webp" alt="" aria-hidden="true" fetchPriority="high" />
      <canvas ref={canvas} className="across-canvas" role="img" aria-label={es?'Yeonseok y Lisbeth en un escenario de luz, juntos aunque estén lejos':'빛으로 연결된 무대 안에 함께 있는 연석과 리스벳'} />
      <div className="across-editorial">
        <p className="across-dedication">A LITTLE WORLD, JUST FOR US <span>↗</span></p>
        <div className="across-headline">
          <h1 id="hero-title"><span className="across-line-mask"><span className="across-title-line across-baby">Baby,</span></span><span className="across-line-mask"><span className="across-title-line">{es?'lo hice':'이거 내가'}</span></span><span className="across-line-mask"><span className="across-title-line">{es?'para ti.':'만들었어!'}</span></span></h1>
        </div>
        <p className="across-caption">{es?<>Aunque estemos lejos,<br/>para que juguemos juntos.</>:<>멀리 있어도,<br/>우리 둘이 같이 놀 수 있게.</>}</p>
        <div className="across-actions"><a className="across-play" href="#games">{es?'Vamos a jugar':'같이 놀자'} <span aria-hidden="true">↗</span></a><a className="across-letter-link" href="#papi-letter">{es?'La carta de Papi':'Papi의 편지'} <span aria-hidden="true">↗</span></a></div>
      </div>
      <div className="across-coordinate across-coordinate-left"><span>YEONSEOK</span><strong>한국</strong><small>REPUBLIC OF KOREA</small></div>
      <div className="across-coordinate across-coordinate-right"><span>LISBETH</span><strong>República Dominicana</strong><small>THE OTHER SIDE, THE SAME US</small></div>
      <div className="across-story-entry" aria-hidden="true"><p>ACROSS THE DISTANCE</p><h2><span className="across-line-mask"><span className="across-story-word">{es?'Dos lugares.':'서로 다른 곳에서,'}</span></span><span className="across-line-mask"><span className="across-story-word">{es?'Un mismo momento.':'같은 순간으로.'}</span></span></h2><span>{es?'Corea · República Dominicana':'한국 · 도미니카'}</span></div>
      <div className="across-bottom"><span><b className="across-scene-index">01</b> / 06</span><a href="#games">{es?'DESLIZA PARA ACERCARNOS':'SCROLL TO GET A LITTLE CLOSER'} <span aria-hidden="true">↓</span></a><span>Y <i>♡</i> L</span></div>
      {intro&&<div className={`across-gift-intro${introPlaying?' is-playing':''}`}>
        <video src="/motion/gift-intro-remotion.mp4" autoPlay muted playsInline preload="auto" onPlaying={()=>setIntroPlaying(true)} onEnded={finishIntro} onError={finishIntro} aria-label={es?'Un pequeño regalo para Baby':'Baby를 위한 작은 선물'} />
        <button type="button" onClick={finishIntro}>{es?'Entrar':'바로 들어가기'} <span aria-hidden="true">↗</span></button>
      </div>}
    </div>
  </section>;
}

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { landingCopy } from '../../src/copy/home';
import { PostHeroScene } from './Scene';
import Details from './Details';
import { clamp01, createEnvelopeState, updateEnvelopeFromScroll, toggleEnvelope, reopenEnvelope, envelopeTarget } from './interaction';

type Language = 'ko' | 'es';
const story = {
 ko: { chapter:'우리가 같이 놀 곳', subtitle:'KOREA ↔ REPÚBLICA DOMINICANA', title:<>멀리 있어도,<br/>우리 둘이 같이.</>, body:'Baby, 너랑 같이 게임하려고 만들었어. 도미니카에서는 한국 리듬게임에 접속이 안 됐잖아. 그래서 멀리 있어도 우리 둘이 같이 놀 수 있는 곳이 있으면 좋겠다고 생각했어.', next:'조금 내려봐', distance:'한국과 도미니카.', distanceBody:'말이 잘 안 통할 때도 있지만, 너랑 같이 놀고 싶었어.', table:'그래서, 이걸 만들었어.', tableBody:'도미노도 있고, 다른 게임도 있어. Baby, 뭐부터 해볼래?', letter:'Baby, 열어봐.', letterBody:'이건 네가 읽어줬으면 해서.', open:'편지 열기', close:'편지 접기', ending:<>자, 이제 같이 놀자,<br/><em>Baby.</em></>, details:'작은 장난들', hideDetails:'장난 접기', play:'게임 고르기', ideas:'Mami의 아이디어', reading:'편지 읽기', intro:'이야기', scene:'봉투와 편지의 입체 장면', ready:'새로운 편지', back:'처음으로', sealed:'봉투가 닫혀 있어요.', status:'독립 프리뷰 · 기존 게임과 연결되는 링크는 원래 경로를 사용합니다.', notice:'최신 승인 게임말·커플 조커·귀족을 사용하는 장면은 메인 자산 인수 후 연결합니다. 원격 공동 이벤트는 이 프리뷰에 없습니다.' },
 es: { chapter:'Un lugar para los dos', subtitle:'KOREA ↔ REPÚBLICA DOMINICANA', title:<>Aunque estemos lejos,<br/>juguemos juntos.</>, body:'Baby, hice esto para que juguemos juntos. Desde República Dominicana no podías entrar al juego de ritmo de Corea, así que pensé en hacer un lugar donde pudiéramos jugar aunque estemos lejos.', next:'Baja un poquito', distance:'Corea y República Dominicana.', distanceBody:'A veces nos cuesta entendernos, pero quería jugar contigo.', table:'Por eso hice este espacio.', tableBody:'Hay dominó y otros juegos también. Baby, ¿por cuál empezamos?', letter:'Baby, ábrela.', letterBody:'Esto sí quería que lo leyeras.', open:'Abrir la carta', close:'Doblar la carta', ending:<>Ahora sí, vamos a jugar,<br/><em>baby.</em></>, details:'Detallitos', hideDetails:'Cerrar los detallitos', play:'Elegir un juego', ideas:'Ideas de Mami', reading:'Leer la carta', intro:'Nuestra historia', scene:'Escena de un sobre y una carta en tres dimensiones', ready:'Una carta para ti', back:'Volver arriba', sealed:'El sobre está cerrado.', status:'Vista independiente · Los enlaces de juegos conservan sus rutas originales.', notice:'Las escenas con las figuras, comodines y nobles aprobados se conectarán cuando lleguen los archivos del proyecto principal. Esta vista no incluye eventos compartidos en línea.' }
};
function storedLanguage():Language { try { return localStorage.getItem('dos-language')==='es'?'es':'ko'; } catch { return 'ko'; } }

export function PostHeroPreview() {
 const [language,setLanguage]=useState<Language>(storedLanguage);
 const [reducedMotion,setReducedMotion]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 const [progress,setProgress]=useState(0);
 const [opening,setOpening]=useState(0);
 const [detailsOpen,setDetailsOpen]=useState(false);
 const [sceneReady,setSceneReady]=useState(false);
 const [sceneError,setSceneError]=useState('');
 const [effect,setEffect]=useState({name:'none',value:0,nonce:0});
 const control=useRef(createEnvelopeState());
 const q=useRef(0), p=useRef(0), target=useRef(0), reduced=useRef(reducedMotion);
 const opener=useRef<HTMLButtonElement>(null);
 const copy=landingCopy[language], text=story[language];
 const setNewEffect=useCallback((name:string,value=1)=>setEffect(old=>({name,value,nonce:old.nonce+1})),[]);
 const refreshTarget=useCallback(()=>{target.current=reduced.current&&control.current.manual===null?(p.current>=.57?1:0):envelopeTarget(control.current,p.current);},[]);
 useEffect(()=>{reduced.current=reducedMotion;if(reducedMotion){q.current=target.current;setOpening(q.current);}},[reducedMotion]);
 useEffect(()=>{
   const media=matchMedia('(prefers-reduced-motion: reduce)');
   const update=()=>setReducedMotion(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update);
 },[]);
 useEffect(()=>{document.documentElement.lang=language==='es'?'es-DO':'ko'; try{localStorage.setItem('dos-language',language);}catch{/* Storage is optional. */}},[language]);
 useEffect(()=>{
   let frame=0;
   const update=()=>{
     frame=0;
     const anchors=[...document.querySelectorAll<HTMLElement>('[data-pose]')].map(el=>({y:el.getBoundingClientRect().top+scrollY-innerHeight*.18,p:Number(el.dataset.pose)}));
     const y=scrollY;
     let value=0;
     for(let i=0;i<anchors.length-1;i++){
       const a=anchors[i],b=anchors[i+1];
       if(y>=a.y)value=a.p+(b.p-a.p)*clamp01((y-a.y)/Math.max(1,b.y-a.y));
     }
     if(y>=(anchors.at(-1)?.y??Infinity))value=1;
     p.current=clamp01(value);setProgress(p.current);
     control.current=updateEnvelopeFromScroll(control.current,p.current);refreshTarget();
   };
   const request=()=>{if(!frame)frame=requestAnimationFrame(update);};
   addEventListener('scroll',request,{passive:true});addEventListener('resize',request);update();
   return()=>{cancelAnimationFrame(frame);removeEventListener('scroll',request);removeEventListener('resize',request);};
 },[refreshTarget]);
 useEffect(()=>{
   let frame=0,previous=0;
   const tick=(time:number)=>{
     const dt=Math.min(.05,Math.max(0,(time-previous)/1000));previous=time;
     const diff=target.current-q.current;
     if(Math.abs(diff)>.0005){q.current=reduced.current?target.current:q.current+Math.sign(diff)*Math.min(Math.abs(diff),dt/1.8);setOpening(q.current);}
     frame=requestAnimationFrame(tick);
   };
   frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[]);
 const openLetter=()=>{control.current=reopenEnvelope(control.current);refreshTarget();document.getElementById('letter-scene')?.scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'center'});};
 const toggleLetter=()=>{
   if(target.current>.5 && document.activeElement?.closest('#moment-letter-copy'))opener.current?.focus();
   control.current=toggleEnvelope(control.current,p.current);refreshTarget();
 };
 const readLetter=(event?:React.MouseEvent)=>{event?.preventDefault();control.current=reopenEnvelope(control.current);q.current=1;setOpening(1);refreshTarget();document.getElementById('papi-letter')?.scrollIntoView({behavior:'instant',block:'start'});};
 useEffect(()=>{if(location.hash==='#papi-letter')readLetter();},[]);
 const letterVisible=opening>.9;
 const stage=progress<.35?'story':progress<.56?'play':progress<.90?'letter':'ending';
 const playWarmth=clamp01((progress-.27)/.15)*(1-clamp01((progress-.54)/.16));
 const dawn=clamp01((progress-.9)/.1);
 const stageStyle={'--play-warmth':`${playWarmth*100}%`,'--dawn':`${dawn*100}%`} as CSSProperties;
 return <main className={`post-hero-preview ${letterVisible?'letter-is-open':''}`} data-stage={stage} style={stageStyle} data-scene-ready={sceneReady} data-opening={opening.toFixed(3)} data-progress={progress.toFixed(3)}>
  <div className="world" aria-hidden="true">
   {!sceneError&&<PostHeroScene progress={progress} opening={opening} reducedMotion={reducedMotion} effect={effect} portraitSrc="/images/yeonseok-lisbeth-cutout.webp" onReady={()=>setSceneReady(true)} onFailure={setSceneError}/>}
   {sceneError&&<div className="world-fallback"><img src="/images/lisbeth-letter-envelope.webp" alt=""/></div>}
   <div className="world-vignette"/>
  </div>
  <header className="preview-nav">
   <a className="wordmark" href="#intro">Yeonseok <span>♡</span> Lisbeth</a>
   <nav aria-label={language==='ko'?'메뉴':'Navegación'}><a href="#papi-letter" onClick={readLetter}>{text.reading}</a><button className="language-toggle" onClick={()=>setLanguage(language==='ko'?'es':'ko')} aria-label={language==='ko'?'Cambiar a español':'한국어로 바꾸기'}>{language==='ko'?'KO / ES':'ES / KO'}</button></nav>
  </header>
  <section id="intro" className="chapter intro" data-pose="0">
   <div className="chapter-copy"><p className="eyebrow">{text.subtitle}</p><h1>{text.title}</h1><p className="intro-body">{text.body}</p><a className="scroll-cue" href="#distance"><span>↓</span>{text.next}</a></div>
   <div className="chapter-number">01 <span>/</span> 05</div><p className="side-dedication">PARA TI, MAMI ♡</p>
  </section>
  <section id="distance" className="chapter distance" data-pose=".22"><div className="chapter-copy"><p className="eyebrow">01 — {text.chapter}</p><h2>{text.distance}</h2><p>{text.distanceBody}</p><div className="country-labels"><span><img src="/images/marble/flags/kr.svg" alt=""/>한국 · Corea</span><i>↔</i><span><img src="/images/marble/flags/do.svg" alt=""/>República Dominicana</span></div></div></section>
  <section className="chapter play-table" data-pose=".45"><div className="chapter-copy"><p className="eyebrow">02 — BABY, MIRA</p><h2>{text.table}</h2><p>{text.tableBody}</p><button className="text-button" aria-label={detailsOpen?text.hideDetails:text.details} onClick={()=>setDetailsOpen(value=>!value)} aria-expanded={detailsOpen} aria-controls="details-playground">{detailsOpen?text.hideDetails:text.details} <span>↗</span></button></div></section>
  {detailsOpen&&<section className="details-section" id="details-playground" aria-label={text.details}><div className="section-top"><p className="eyebrow">{text.details}</p><button className="icon-button" aria-label={text.hideDetails} onClick={()=>setDetailsOpen(false)}>×</button></div><Details language={language} reducedMotion={reducedMotion} onEffect={setNewEffect}/></section>}
  <section id="letter-scene" className="chapter letter-invitation" data-pose=".62"><div className="chapter-copy"><p className="eyebrow">03 — FOR MY MAMI</p><h2>{text.letter}</h2><p>{text.letterBody}</p><div className="invitation-actions"><button ref={opener} className="primary-button" aria-label={opening>.5?text.close:text.open} aria-expanded={letterVisible} aria-controls="moment-letter-copy" onClick={opening>.5?toggleLetter:openLetter}>{opening>.5?text.close:text.open}<span>{opening>.5?'−':'↗'}</span></button><a href="#papi-letter" className="text-button" onClick={readLetter}>{text.reading}</a></div></div></section>
  <section id="papi-letter" className={`letter-section ${letterVisible?'is-open':'is-folded'}`} data-pose=".86" aria-labelledby="letter-title">
   <div className="letter-section-label"><span className="eyebrow">04 — {text.ready}</span><button className="text-button" aria-label={letterVisible?text.close:text.open} onClick={toggleLetter} aria-expanded={letterVisible} aria-controls="moment-letter-copy">{letterVisible?text.close:text.open} <span>{letterVisible?'−':'+'}</span></button></div>
   <article className="letter-paper" id="moment-letter-copy" hidden={!letterVisible}>
    <div className="paper-rule"/><p className="letter-address">{copy.letterAddress}</p><h2 id="letter-title">{copy.letterTitle}</h2>{copy.letterBody.map(paragraph=><p key={paragraph}>{paragraph}</p>)}<p className="letter-signature">{copy.letterSignature}</p><div className="paper-bottom-mark">Y <span>♡</span> L</div>
   </article>
   {!letterVisible&&<div className="closed-note"><span>♡</span><p>{text.sealed}</p><button className="text-button" onClick={()=>{control.current=reopenEnvelope(control.current);refreshTarget();}}>{text.open} ↗</button></div>}
  </section>
  <section className="chapter ending" data-pose="1"><div className="ending-copy"><p className="eyebrow">2025.04.04 — YEONSEOK ♡ LISBETH</p><h2>{text.ending}</h2><div className="ending-actions"><a className="primary-button" href="/#games">{text.play}<span>↗</span></a><a className="text-button" href="/feedback">{text.ideas}</a></div></div><div className="ending-rule"/><footer><span>Para ti, Lisbeth ♡</span><a href="#intro">{text.back} ↑</a></footer></section>
  <aside className="preview-status"><span>{text.status}</span><details><summary>{language==='ko'?'인수 항목':'Pendiente de conectar'}</summary><p>{text.notice}</p>{sceneError&&<p>{language==='ko'?'입체 장면을 사용할 수 없어 정적 봉투를 표시합니다. 편지는 그대로 읽을 수 있습니다.':'Se muestra el sobre estático. Puedes leer la carta completa.'}</p>}</details></aside>
 </main>;
}

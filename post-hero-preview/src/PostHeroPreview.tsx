import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { landingCopy } from '../../src/copy/home';
import type { PaperPose, PostHeroState } from './Scene';
import { paperTransform, blendPaperCorners } from './paperProjection';
import Details from './Details';
import SharedEventsPanel from './SharedEventsPanel';
import type {SharedEventRound} from '../../src/core/sharedEventsState';
import {restoreLocalEventState,type LocalEventState} from './LocalEventRig';
import { clamp01, createEnvelopeState, updateEnvelopeFromScroll, toggleEnvelope, reopenEnvelope, envelopeTarget } from './interaction';

const StandalonePostHeroScene=lazy(()=>import('./Scene').then(module=>({default:module.PostHeroScene})));

type Language = 'ko' | 'es';
const story = {
 ko: { chapter:'우리가 같이 놀 곳', subtitle:'KOREA ↔ REPÚBLICA DOMINICANA', title:<>멀리 있어도,<br/>우리 둘이 같이.</>, body:'Baby, 너랑 같이 게임하려고 만들었어.', next:'조금 내려봐', distance:'한국과 도미니카.', distanceBody:'도미니카에서는 한국 리듬게임에 접속이 안 됐잖아. 말이 잘 안 통할 때도 있지만, 너랑 같이 놀고 싶었어.', table:'그래서, 이걸 만들었어.', tableBody:'도미노도 있고, 다른 게임도 있어. Baby, 뭐부터 해볼래?', letter:'Baby, 열어봐.', letterBody:'이건 네가 읽어줬으면 해서.', open:'편지 열기', close:'편지 접기', ending:<>자, 이제 같이 놀자,<br/><em>Baby.</em></>, details:'작은 장난들', hideDetails:'장난 접기', play:'게임 고르기', ideas:'Mami의 아이디어', reading:'편지 읽기', intro:'이야기', scene:'봉투와 편지의 입체 장면', ready:'새로운 편지', back:'처음으로', sealed:'봉투가 닫혀 있어요.', status:'독립 프리뷰 · 기존 게임과 연결되는 링크는 원래 경로를 사용합니다.', notice:'최신 승인 게임말·커플 조커·귀족을 사용하는 장면은 메인 자산 인수 후 연결합니다. 원격 공동 이벤트는 이 프리뷰에 없습니다.' },
 es: { chapter:'Un lugar para los dos', subtitle:'KOREA ↔ REPÚBLICA DOMINICANA', title:<>Aunque estemos lejos,<br/>juguemos juntos.</>, body:'Baby, hice esto para que juguemos juntos.', next:'Baja un poquito', distance:'Corea y República Dominicana.', distanceBody:'Desde República Dominicana no podías entrar al juego de ritmo de Corea. A veces nos cuesta entendernos, pero quería jugar contigo.', table:'Por eso hice este espacio.', tableBody:'Hay dominó y otros juegos también. Baby, ¿por cuál empezamos?', letter:'Baby, ábrela.', letterBody:'Esto sí quería que lo leyeras.', open:'Abrir la carta', close:'Doblar la carta', ending:<>Ahora sí, vamos a jugar,<br/><em>baby.</em></>, details:'Detallitos', hideDetails:'Cerrar los detallitos', play:'Elegir un juego', ideas:'Ideas de Mami', reading:'Leer la carta', intro:'Nuestra historia', scene:'Escena de un sobre y una carta en tres dimensiones', ready:'Una carta para ti', back:'Volver arriba', sealed:'El sobre está cerrado.', status:'Vista independiente · Los enlaces de juegos conservan sus rutas originales.', notice:'Las escenas con las figuras, comodines y nobles aprobados se conectarán cuando lleguen los archivos del proyecto principal. Esta vista no incluye eventos compartidos en línea.' }
};
function storedLanguage():Language { try { return localStorage.getItem('dos-language')==='es'?'es':'ko'; } catch { return 'ko'; } }

type PreviewProps = { embedded?: boolean; language?: Language; onLanguageChange?: (language: Language) => void; portraitSrc?: string; portraitMaskSrc?: string; gallery?: ReactNode; playHref?: string; renderScene?: boolean; onSceneState?: (state:PostHeroState)=>void; externalSceneReady?: boolean; onRegisterFrame?: (tick:((now:number)=>void)|null)=>void };
export function PostHeroPreview({embedded=false,language:externalLanguage,onLanguageChange,portraitSrc='/images/yeonseok-lisbeth-cutout.webp',portraitMaskSrc,gallery,playHref,renderScene=true,onSceneState,externalSceneReady=false,onRegisterFrame}:PreviewProps = {}) {
 const [localLanguage,setLocalLanguage]=useState<Language>(storedLanguage);
 const language=externalLanguage??localLanguage;
 const setLanguage=(value:Language)=>{setLocalLanguage(value);onLanguageChange?.(value);};
 const Container=embedded?'section':'main';
 const [reducedMotion,setReducedMotion]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 const [progress,setProgress]=useState(0);
 const [opening,setOpening]=useState(0);
 const [detailsOpen,setDetailsOpen]=useState(false);
 const [roseHintOpen,setRoseHintOpen]=useState(false);
 const roseHintId=useId();
 const [sceneReady,setSceneReady]=useState(false);
 const [sceneError,setSceneError]=useState('');
 const [localEvent,setLocalEvent]=useState<LocalEventState>(()=>restoreLocalEventState(language));
 const localTick=useRef<((now:number)=>void)|null>(null);
 const registerLocalTick=useCallback((tick:((now:number)=>void)|null)=>{localTick.current=tick;},[]);
 const [effect,setEffect]=useState({name:'none',value:0,nonce:0});
 const control=useRef(createEnvelopeState());
 const pendingScroll=useRef<(()=>void)|null>(null);
 const q=useRef(0), p=useRef(0), target=useRef(0), reduced=useRef(reducedMotion);
 const host=useRef<HTMLElement>(null);
 const opener=useRef<HTMLButtonElement>(null),detailsOpener=useRef<HTMLButtonElement>(null);
 const paper=useRef<HTMLElement>(null),paperSlot=useRef<HTMLDivElement>(null);
 const trackPaper=useCallback((pose:PaperPose)=>{
   const article=paper.current,slot=paperSlot.current;if(!article||!slot)return;
   if(!pose.visible){article.removeAttribute('data-tracking');article.removeAttribute('data-paper-corners');article.style.removeProperty('position');article.style.removeProperty('left');article.style.removeProperty('top');article.style.removeProperty('width');article.style.removeProperty('transform');slot.style.removeProperty('height');return;}
   const bounds=slot.getBoundingClientRect(),width=bounds.width,height=article.offsetHeight;
   if(!width||!height)return;
   slot.style.height=`${height}px`;
   const destination=[{x:bounds.left,y:bounds.top},{x:bounds.right,y:bounds.top},{x:bounds.right,y:bounds.top+height},{x:bounds.left,y:bounds.top+height}];
   const corners=blendPaperCorners(pose.corners,destination,clamp01((p.current-.70)/.16));
   const transform=paperTransform(corners,width,height);if(!transform)return;
   article.dataset.tracking='true';article.dataset.paperCorners=JSON.stringify(corners);article.style.position='fixed';article.style.left='0';article.style.top='0';article.style.width=`${width}px`;article.style.transform=transform;
 },[]);
 useEffect(()=>{onSceneState?.({progress,opening,reducedMotion,effect,localEvent,portraitSrc,portraitMaskSrc,onPaperPose:trackPaper});},[progress,opening,reducedMotion,effect,localEvent,portraitSrc,portraitMaskSrc,trackPaper,onSceneState]);
 const copy=landingCopy[language], text=story[language];
 const ko=language==='ko';
 const setNewEffect=useCallback((name:string,value=1)=>setEffect(old=>({name,value,nonce:old.nonce+1})),[]);
 const refreshTarget=useCallback(()=>{target.current=reduced.current&&control.current.manual===null?(p.current>=.57?1:0):envelopeTarget(control.current,p.current);if(target.current<=.5)setRoseHintOpen(false);},[setRoseHintOpen]);
 const handleSharedEventStart=useCallback((round:SharedEventRound,{settle}:{settle:boolean})=>{
   if(round.eventId!=='R01')return;
   control.current=reopenEnvelope(control.current);refreshTarget();
   if(settle){q.current=1;setOpening(1);}
 },[refreshTarget]);
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
     const anchors=[...(host.current?.querySelectorAll<HTMLElement>('[data-pose]')??[])].map(el=>({y:el.getBoundingClientRect().top+scrollY-innerHeight*.18,p:Number(el.dataset.pose)}));
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
   const request=()=>{if(onRegisterFrame)pendingScroll.current=update;else if(!frame)frame=requestAnimationFrame(update);};
   addEventListener('scroll',request,{passive:true});addEventListener('resize',request);update();
   return()=>{pendingScroll.current=null;cancelAnimationFrame(frame);removeEventListener('scroll',request);removeEventListener('resize',request);};
 },[refreshTarget,onRegisterFrame]);
 useEffect(()=>{
   let frame=0,previous=0;
   const tick=(time:number)=>{
     localTick.current?.(time);
     const measure=pendingScroll.current;pendingScroll.current=null;measure?.();
     const dt=previous?Math.max(0,(time-previous)/1000):0;previous=time;
     const diff=target.current-q.current;
     if(Math.abs(diff)>.0005){q.current=reduced.current?target.current:q.current+Math.sign(diff)*Math.min(Math.abs(diff),dt/1.8);setOpening(q.current);}
   };
   if(onRegisterFrame){onRegisterFrame(tick);return()=>onRegisterFrame(null);}
   const loop=(time:number)=>{tick(time);frame=requestAnimationFrame(loop);};
   frame=requestAnimationFrame(loop);return()=>cancelAnimationFrame(frame);
 },[onRegisterFrame]);
 const openLetter=()=>{if(opening>.5)setRoseHintOpen(false);control.current=opening>.5?{...control.current,manual:false}:reopenEnvelope(control.current);refreshTarget();};
 const toggleLetter=()=>{
   if(target.current>.5)setRoseHintOpen(false);
   if(target.current>.5 && document.activeElement?.closest('#moment-letter-copy'))opener.current?.focus();
   control.current=toggleEnvelope(control.current,p.current);refreshTarget();
 };
 useEffect(()=>{
   const closeOnEscape=(event:KeyboardEvent)=>{if(event.key!=='Escape')return;if(roseHintOpen){event.preventDefault();setRoseHintOpen(false);return;}if(target.current<=.5)return;control.current={...control.current,manual:false};refreshTarget();opener.current?.focus({preventScroll:true});};
   addEventListener('keydown',closeOnEscape);return()=>removeEventListener('keydown',closeOnEscape);
 },[refreshTarget,roseHintOpen]);
 const readLetter=(event?:React.MouseEvent)=>{event?.preventDefault();control.current=reopenEnvelope(control.current);q.current=1;setOpening(1);refreshTarget();document.getElementById('papi-letter')?.scrollIntoView({behavior:'instant',block:'start'});};
 useEffect(()=>{if(location.hash==='#papi-letter')readLetter();},[]);
 useEffect(()=>{if(detailsOpen)document.getElementById('details-playground')?.scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'start'});},[detailsOpen,reducedMotion]);
 const closeDetails=()=>{setDetailsOpen(false);detailsOpener.current?.focus({preventScroll:true});detailsOpener.current?.scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'center'});};
 const letterVisible=opening>.9;
 const letterPublic=control.current.manual!==false||letterVisible;
 const stage=progress<.35?'story':progress<.56?'play':progress<.90?'letter':'ending';
 const playWarmth=clamp01((progress-.27)/.15)*(1-clamp01((progress-.54)/.16));
 const dawn=clamp01((progress-.9)/.1);
 const stageStyle={'--play-warmth':`${playWarmth*100}%`,'--dawn':`${dawn*100}%`,'--intro-mark':Math.max(0,1-progress/.08)} as CSSProperties;
 return <Container ref={host} className={`post-hero-preview ${embedded?'post-hero-embedded':''} ${letterVisible?'letter-is-open':''}`} data-stage={stage} style={stageStyle} data-scene-ready={renderScene?sceneReady:externalSceneReady} data-opening={opening.toFixed(3)} data-progress={progress.toFixed(3)}>
  {renderScene&&<div className="world" aria-hidden="true">
   {!sceneError&&<Suspense fallback={null}><StandalonePostHeroScene progress={progress} opening={opening} reducedMotion={reducedMotion} effect={effect} portraitSrc={portraitSrc} portraitMaskSrc={portraitMaskSrc} onPaperPose={trackPaper} onReady={()=>setSceneReady(true)} onFailure={setSceneError}/></Suspense>}
   {sceneError&&<div className="world-fallback"><img src="/images/lisbeth-letter-envelope.webp" alt=""/></div>}
   <div className="world-vignette"/>
  </div>}
  {!embedded&&<header className="preview-nav">
   <a className="wordmark" href="#intro">Yeonseok <span>♡</span> Lisbeth</a>
   <nav aria-label={language==='ko'?'메뉴':'Navegación'}><a href="#papi-letter" onClick={readLetter}>{text.reading}</a><button className="language-toggle" onClick={()=>setLanguage(language==='ko'?'es':'ko')} aria-label={language==='ko'?'Cambiar a español':'한국어로 바꾸기'}>{language==='ko'?'KO / ES':'ES / KO'}</button></nav>
  </header>}
  {!embedded&&<section id="intro" className="chapter intro" data-pose="0">
   <div className="chapter-copy"><p className="eyebrow">{text.subtitle}</p><h1>{text.title}</h1><p className="intro-body">{text.body}</p><div className="intro-actions"><a className="primary-button" href="/#games">{text.play}<span>↗</span></a><a className="scroll-cue" href="#distance"><span>↓</span>{text.next}</a></div></div>
   <div className="chapter-number">01 <span>/</span> 05</div><p className="side-dedication">PARA TI, MAMI ♡</p>
  </section>}
  <section id="distance" className="chapter distance" data-pose={embedded?"0":".10"}>
   <div className="chapter-copy"><p className="eyebrow">2025.04.04</p><h2>{text.distance}</h2><p>{text.distanceBody}</p><div className="country-labels"><span><img src="/images/marble/flags/kr.svg" alt=""/>한국 · Corea</span><i>↔</i><span><img src="/images/marble/flags/do.svg" alt=""/>República Dominicana</span></div></div>
   <p className="story-margin-note">{ko?'그래서, 우리 둘이 놀 곳.':'Por eso, un lugar para jugar contigo.'}</p>
  </section>
  <section className="chapter story-invitation" data-pose=".14" aria-labelledby="story-invite-title">
   <div className="chapter-copy"><p className="eyebrow">{ko?'같은 방에서':'En la misma sala'}</p><h2 id="story-invite-title">{copy.moments[0].title}</h2><p>{copy.moments[0].body}</p><a className="text-button" href="/play">{copy.primaryAction}<span>↗</span></a></div>
  </section>
  <section className="chapter story-translation" data-pose=".28" aria-labelledby="story-translation-title">
   <div className="chapter-copy"><p className="eyebrow">Catchmind</p><h2 id="story-translation-title">{copy.moments[1].title}</h2><p>{copy.moments[1].body}</p><p className="translation-note">{copy.translationLimitNote}</p><a className="text-button" href="/play?game=catchmind">{copy.catchmindAction}<span>↗</span></a></div>
  </section>
  <section className="chapter play-table" data-pose=".45">
   <div className="chapter-copy"><p className="eyebrow">{ko?'Baby, 하나 골라봐.':'Baby, escoge uno.'}</p><h2>{text.table}</h2><p>{text.tableBody}</p><a className="text-button" href="#games">{text.play}<span>↓</span></a></div>
   <aside className="story-ideas"><h3>{copy.moments[2].title}</h3><p>{copy.moments[2].body}</p><a className="text-button" href="/feedback">{copy.ideasAction}<span>↗</span></a></aside>
   <button ref={detailsOpener} className="easter-discovery" aria-expanded={detailsOpen} aria-controls="details-playground" onClick={()=>detailsOpen?closeDetails():setDetailsOpen(true)}><img src="/images/approved-couple-room/lisyeon-pawn.png" alt=""/><span><strong>{detailsOpen?text.hideDetails:text.details}</strong><small>{ko?'토끼, 우리 사진, 종이와 빛… 눌러봐 ㅋㅋㅋ':'El conejito, nuestras fotos, papel y luz… toca, haha.'}</small></span><b aria-hidden="true">{detailsOpen?'−':'+'}</b></button>
  </section>
  {gallery}
  {detailsOpen&&<section className="details-section" id="details-playground" data-pose=".50" aria-label={text.details}><div className="section-top"><p className="eyebrow">{text.details}</p><button className="icon-button" aria-label={text.hideDetails} onClick={closeDetails}>×</button></div><Details language={language} reducedMotion={reducedMotion} onEffect={setNewEffect} onLocalEvent={setLocalEvent} onRegisterFrame={registerLocalTick}/><span className="details-pose-end" data-pose=".55" aria-hidden="true"/></section>}
  <SharedEventsPanel language={language} onSharedStart={handleSharedEventStart}/>
  <section id="letter-scene" className="chapter letter-invitation" data-pose=".62"><div className="chapter-copy"><p className="eyebrow">For my Mami</p><h2>{text.letter}</h2><p>{text.letterBody}</p><div className="invitation-actions"><button ref={opener} className="primary-button" aria-label={opening>.5?text.close:text.open} aria-expanded={letterVisible} aria-controls="moment-letter-copy" onClick={openLetter}>{opening>.5?text.close:text.open}<span>{opening>.5?'−':'↗'}</span></button><a href="#papi-letter" className="text-button" onClick={readLetter}>{text.reading}</a></div></div></section>
  <section id="papi-letter" className={`letter-section ${letterVisible?'is-open':'is-folded'} ${progress>=.86&&letterVisible?'reading-surround':''}`} data-pose=".86" aria-labelledby="letter-title">
   {progress>=.86&&letterVisible&&<div className="letter-reading-art"><button type="button" className="reading-roses reading-roses-left" aria-label={ko?'장미에 숨은 뜻 보기':'Ver qué significan las rosas'} aria-expanded={roseHintOpen} aria-controls={roseHintId} onClick={()=>setRoseHintOpen(open=>!open)}/><button type="button" className="reading-roses reading-roses-right" aria-label={ko?'장미에 숨은 뜻 보기':'Ver qué significan las rosas'} aria-expanded={roseHintOpen} aria-controls={roseHintId} onClick={()=>setRoseHintOpen(open=>!open)}/></div>}
   <div className="letter-section-label"><span className="eyebrow">{text.ready}</span><button className="text-button" aria-label={letterVisible?text.close:text.open} onClick={letterVisible?toggleLetter:()=>{control.current=reopenEnvelope(control.current);refreshTarget();}} aria-expanded={letterVisible} aria-controls="moment-letter-copy">{letterVisible?text.close:text.open} <span>{letterVisible?'−':'+'}</span></button></div>
   <div className="letter-paper-slot" ref={paperSlot}><article ref={paper} className={`letter-paper ${!letterVisible&&letterPublic?'is-visually-sealed':''}`} id="moment-letter-copy" hidden={!letterPublic}>
    <div className="paper-rule"/><p className="letter-address">{copy.letterAddress}</p><h2 id="letter-title">{copy.letterTitle}</h2>{copy.letterBody.map(paragraph=><p key={paragraph}>{paragraph}</p>)}<p className="letter-signature">{copy.letterSignature}</p><div className="paper-bottom-mark">Y <span>♡</span> L</div>
   </article></div>
   {letterVisible&&progress>=.86&&<p id={roseHintId} className="rose-meaning" role="status" aria-live="polite" aria-atomic="true">{roseHintOpen?(ko?'4송이, 그리고 4송이. 우리 시작한 날 ♡':'Cuatro rosas y otras cuatro. El día que empezamos: 4 de abril ♡'):''}</p>}
   {letterVisible&&<div className="letter-bottom-controls"><button className="text-button" onClick={()=>{opener.current?.focus({preventScroll:true});toggleLetter();}}>{text.close} <span>−</span></button></div>}
   {!letterVisible&&<div className="closed-note"><span>♡</span><p>{text.sealed}</p><button className="text-button" onClick={()=>{control.current=reopenEnvelope(control.current);refreshTarget();}}>{text.open} ↗</button></div>}
  </section>
  <section className="chapter ending" data-pose="1"><div className="ending-copy"><p className="eyebrow">2025.04.04 — YEONSEOK ♡ LISBETH</p><h2>{text.ending}</h2><div className="ending-actions"><a className="primary-button" href={playHref??'/#games'}>{text.play}<span>↗</span></a><a className="text-button" href="/feedback">{text.ideas}</a></div></div><div className="ending-rule"/><footer><span>Para ti, Lisbeth ♡</span><a href={embedded?'#home':'#intro'}>{text.back} ↑</a></footer></section>
  {!embedded&&<aside className="preview-status"><span>{text.status}</span><details><summary>{language==='ko'?'인수 항목':'Pendiente de conectar'}</summary><p>{text.notice}</p>{sceneError&&<p>{language==='ko'?'입체 장면을 사용할 수 없어 정적 봉투를 표시합니다. 편지는 그대로 읽을 수 있습니다.':'Se muestra el sobre estático. Puedes leer la carta completa.'}</p>}</details></aside>}
 </Container>;
}

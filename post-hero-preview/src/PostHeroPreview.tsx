import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { landingCopy } from '../../src/copy/home';
import type { PaperPose, PostHeroState } from './Scene';
import { paperTransform, blendPaperCorners } from './paperProjection';
import Details from './Details';
import SharedEventsPanel from './SharedEventsPanel';
import type {SharedEventId,SharedEventRound} from '../../src/core/sharedEventsState';
import {restoreLocalEventState,localEventIds,type LocalEventId,type LocalEventState} from './LocalEventRig';
import { clamp01, LETTER_RANGE, createEnvelopeState, updateEnvelopeFromScroll, toggleEnvelope, reopenEnvelope, envelopeTarget } from './interaction';

const StandalonePostHeroScene=lazy(()=>import('./Scene').then(module=>({default:module.PostHeroScene})));

type Language = 'ko' | 'es';
const story = {
 ko: { title:<>멀리 있어도,<br/>우리 둘이 같이.</>, body:'Baby, 너랑 같이 게임하려고 만들었어.', next:'조금 내려봐', distance:'한국과 도미니카.', distanceBody:'Baby, 도미니카에서는 한국 리듬게임에 접속이 안 됐잖아.', table:'Baby, 하나 눌러봐.', tableBody:'이것도 같이 놀 수 있게 넣었어.', letter:'Baby, 이번엔 이거 열어봐.', letterBody:'이건 네가 읽어줬으면 해서.', open:'편지 열기', close:'편지 접기', ending:<>자, 이제 같이 놀자,<br/><em>Baby.</em></>, play:'게임 고르기', ideas:'Mami의 아이디어', reading:'편지 읽기', back:'처음으로', sealed:'봉투가 닫혀 있어요.', },
 es: { title:<>Aunque estemos lejos,<br/>juguemos juntos.</>, body:'Baby, hice esto para que juguemos juntos.', next:'Baja un poquito', distance:'Corea y República Dominicana.', distanceBody:'Baby, desde República Dominicana no podías entrar al juego de ritmo de Corea.', table:'Baby, toca uno.', tableBody:'También puse estas cositas para jugar.', letter:'Baby, ahora abre esto.', letterBody:'Esto sí quería que lo leyeras.', open:'Abrir la carta', close:'Doblar la carta', ending:<>Ahora sí, vamos a jugar,<br/><em>baby.</em></>, play:'Elegir un juego', ideas:'Ideas de Mami', reading:'Leer la carta', back:'Volver arriba', sealed:'El sobre está cerrado.', }
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
 const [detailRegion,setDetailRegion]=useState<'distance'|'table'|'envelope'|'ending'|null>(null);
 const [sharedEvent,setSharedEvent]=useState<{id:SharedEventId;region:'distance'|'table'|'envelope'|'ending'}|null>(null);
 const [roseHintOpen,setRoseHintOpen]=useState(false);
 const roseHintId=useId();
 const [sceneReady,setSceneReady]=useState(false);
 const [sceneError,setSceneError]=useState('');
 const [localEvent,setLocalEvent]=useState<LocalEventState>(()=>({...restoreLocalEventState(language),dominoTiles:[[1,2],[2,3],[3,4],[4,5]]}));
 const localTick=useRef<((now:number)=>void)|null>(null);
 const registerLocalTick=useCallback((tick:((now:number)=>void)|null)=>{localTick.current=tick;},[]);
 const [effect,setEffect]=useState({name:'none',value:0,nonce:0});
 const control=useRef(createEnvelopeState());
 const pendingScroll=useRef<(()=>void)|null>(null);
 const q=useRef(0), p=useRef(0), target=useRef(0), reduced=useRef(reducedMotion);
 const host=useRef<HTMLElement>(null);
 const opener=useRef<HTMLButtonElement>(null),detailsOpener=useRef<HTMLButtonElement|null>(null),sharedOpener=useRef<HTMLButtonElement|null>(null);
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
 useEffect(()=>{setLocalEvent(old=>({...old,language,phraseFlipped:false}));},[language]);
 const setNewEffect=useCallback((name:string,value=1)=>setEffect(old=>({name,value,nonce:old.nonce+1})),[]);
 const refreshTarget=useCallback(()=>{target.current=reduced.current&&control.current.manual===null?(p.current>=LETTER_RANGE[0]?1:0):envelopeTarget(control.current,p.current);if(target.current<=.5)setRoseHintOpen(false);},[setRoseHintOpen]);
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
 const openLetter=()=>{if(target.current>.5)setRoseHintOpen(false);control.current=target.current>.5?{...control.current,manual:false}:reopenEnvelope(control.current);refreshTarget();};
 const toggleLetter=()=>{
   if(target.current>.5)setRoseHintOpen(false);
   if(target.current>.5 && document.activeElement?.closest('#moment-letter-copy'))opener.current?.focus({preventScroll:true});
   control.current=toggleEnvelope(control.current,p.current);refreshTarget();
 };
 useEffect(()=>{
   const closeOnEscape=(event:KeyboardEvent)=>{if(event.key!=='Escape'||detailRegion||sharedEvent)return;if(roseHintOpen){event.preventDefault();setRoseHintOpen(false);return;}if(target.current<=.5)return;control.current={...control.current,manual:false};refreshTarget();opener.current?.focus({preventScroll:true});};
   addEventListener('keydown',closeOnEscape);return()=>removeEventListener('keydown',closeOnEscape);
 },[refreshTarget,roseHintOpen,detailRegion,sharedEvent]);
 const readLetter=(event?:React.MouseEvent)=>{event?.preventDefault();control.current=reopenEnvelope(control.current);q.current=1;setOpening(1);refreshTarget();document.getElementById('papi-letter')?.scrollIntoView({behavior:'instant',block:'start'});};
 useEffect(()=>{const onHash=()=>{if(location.hash==='#papi-letter')readLetter();};onHash();addEventListener('hashchange',onHash);return()=>removeEventListener('hashchange',onHash);},[]);
 const closeDetails=useCallback((restoreFocus=true)=>{setDetailRegion(null);setLocalEvent(old=>({...old,active:null,rhythmSignal:null,waxPressed:false}));if(restoreFocus)detailsOpener.current?.focus({preventScroll:true});},[]);
 const openDetails=(id:LocalEventId,region:NonNullable<typeof detailRegion>,trigger:HTMLButtonElement)=>{detailsOpener.current=trigger;setSharedEvent(null);setDetailRegion(region);setLocalEvent(old=>({...old,active:id,rhythmSignal:null,waxPressed:false,sideView:false}));};
 const openShared=(id:SharedEventId,region:NonNullable<typeof detailRegion>,trigger:HTMLButtonElement)=>{sharedOpener.current=trigger;setSharedEvent({id,region});};
 const closeShared=()=>{setSharedEvent(null);requestAnimationFrame(()=>sharedOpener.current?.focus({preventScroll:true}));};
 const sceneVisible=!renderScene&&externalSceneReady;
 const workbench=(region:NonNullable<typeof detailRegion>)=>(detailRegion===region||sharedEvent?.region===region)&&<div className="context-workbench" id={`details-${region}`} data-detail-region={region}>
  {detailRegion===region&&<div hidden={Boolean(sharedEvent)}><Details language={language} reducedMotion={reducedMotion} state={localEvent} setState={setLocalEvent} suspended={Boolean(sharedEvent)} onClose={closeDetails} sceneVisible={sceneVisible} onEffect={setNewEffect} onRegisterFrame={registerLocalTick} onSharedEvent={(id,trigger)=>openShared(id,region,trigger)}/></div>}
  {sharedEvent?.region===region&&<div className="shared-context" onKeyDownCapture={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeShared();}}}><button className="text-button shared-context-close" onClick={closeShared}>{ko?'혼자 계속하기':'Seguir por mi cuenta'} <span aria-hidden="true">×</span></button><SharedEventsPanel key={sharedEvent.id} language={language} initialEventId={sharedEvent.id} initiallyOpen onSharedStart={handleSharedEventStart}/></div>}
 </div>;
 const discover=(id:LocalEventId,label:string,region:NonNullable<typeof detailRegion>,className='object-discovery')=><button key={id} className={className} data-local-event={id} aria-expanded={detailRegion===region&&localEvent.active===id} aria-controls={`details-${region}`} onClick={event=>openDetails(id,region,event.currentTarget)}>{label}<span aria-hidden="true">↗</span></button>;
 const letterVisible=opening>.9;
 const wantsLetterOpen=target.current>.5;
 const letterPublic=control.current.manual!==false||letterVisible;
 const stage=progress<.35?'story':progress<.56?'play':progress<.90?'letter':'ending';
 return <Container ref={host} className={`post-hero-preview ${embedded?'post-hero-embedded':''} ${letterVisible?'letter-is-open':''}`} data-stage={stage} data-scene-ready={renderScene?sceneReady:externalSceneReady} data-opening={opening.toFixed(3)} data-progress={progress.toFixed(3)}>
  {renderScene&&<div className="world" aria-hidden="true">
   {!sceneError&&<Suspense fallback={null}><StandalonePostHeroScene progress={progress} opening={opening} reducedMotion={reducedMotion} effect={effect} portraitSrc={portraitSrc} portraitMaskSrc={portraitMaskSrc} localEvent={localEvent} onPaperPose={trackPaper} onReady={()=>setSceneReady(true)} onFailure={setSceneError}/></Suspense>}
   {sceneError&&<div className="world-fallback"><img src="/images/lisbeth-letter-envelope.webp" alt=""/></div>}
   <div className="world-vignette"/>
  </div>}
  {!embedded&&<header className="preview-nav">
   <a className="wordmark" href="#intro">Yeonseok <span>♡</span> Lisbeth</a>
   <nav aria-label={language==='ko'?'메뉴':'Navegación'}><a href="#papi-letter" onClick={readLetter}>{text.reading}</a><button className="language-toggle" onClick={()=>setLanguage(language==='ko'?'es':'ko')} aria-label={language==='ko'?'Cambiar a español':'한국어로 바꾸기'}>{language==='ko'?'KO / ES':'ES / KO'}</button></nav>
  </header>}
  {!embedded&&<section id="intro" className="chapter intro" data-pose="0"><div className="chapter-copy"><h1>{text.title}</h1><p>{text.body}</p><div className="intro-actions"><a className="primary-button" href="/#games">{text.play}</a><a className="text-button" href="#distance">{text.next} <span aria-hidden="true">↓</span></a></div></div></section>}
  <section id="distance" className={`chapter distance ${detailRegion==='distance'?'has-detail':''}`} data-pose={embedded?"0":".10"} aria-labelledby="distance-title">
   <div className="chapter-copy" hidden={detailRegion==='distance'}><h2 id="distance-title">{text.distance}</h2><p>{text.distanceBody}</p><p className="motivation-answer">{ko?'그래서 멀리 있어도 우리 둘이 같이 놀 곳을 만들고 싶었어.':'Por eso quería hacer un lugar para que juguemos juntos aunque estemos lejos.'}</p><a className="text-button" href="#games">{text.play}<span aria-hidden="true">↓</span></a></div>
   <div className="country-labels"><span><img src="/images/marble/flags/kr.svg" alt=""/>한국 · Corea</span><span className="country-gap" aria-hidden="true"/><span><img src="/images/marble/flags/do.svg" alt=""/>República Dominicana</span></div>
   <div className="distance-discoveries">{discover('L16',ko?'같이 놀자 / Vamos a jugar':'Vamos a jugar / 같이 놀자','distance','phrase-tab object-discovery')}{discover('L03',ko?'접힌 방 열어보기':'Abrir la sala de papel','distance')}{discover('L13',ko?'종이 길 이어보기':'Conectar el camino','distance')}</div>
   {workbench('distance')}
  </section>
  <section id="toy-table" className={`chapter play-table ${detailRegion==='table'?'has-detail':''}`} data-pose=".30" aria-labelledby="toy-title">
   <div className="chapter-copy" hidden={detailRegion==='table'}><h2 id="toy-title">{text.table}</h2><p>{text.tableBody}</p><a className="text-button" href="#games">{text.play}<span aria-hidden="true">↓</span></a></div>
   <div className="toy-affordances" aria-label={ko?'테이블 위 물건':'Objetos de la mesa'}>{discover('L01',ko?'도미노 넘어뜨리기':'Empujar el dominó','table','toy-affordance domino-affordance')}{discover('L04',ko?'토끼의 빛 움직이기':'Mover la luz del conejito','table','toy-affordance light-affordance')}{discover('L06',ko?'이 종이에 그리기':'Dibujar en este papel','table','toy-affordance drawing-affordance')}</div>
   <div className="table-discoveries">{discover('L09',ko?'사진 셔터':'Ventanas de fotos','table')}{discover('L10',ko?'접힌 카드':'Carta de papel','table')}{discover('L12',ko?'작은 넘김책':'Librito animado','table')}</div>
   <details className="other-objects"><summary>{ko?'다른 작은 물건 보기':'Ver otros detallitos'}</summary><div className="object-groups">{[
    {label:ko?'종이':'Papel',ids:['L03','L06','L10','L12','L13','L16']},
    {label:ko?'타일':'Fichas',ids:['L01','L02','L05']},
    {label:ko?'빛과 바람':'Luz y aire',ids:['L04','L07','L11','L14']},
    {label:ko?'말과 장식':'Figuras y detalles',ids:['L08','L09','L15']}
   ].map(group=><details key={group.label} name="small-object-group"><summary>{group.label}</summary><div>{group.ids.map(id=>discover(id as LocalEventId,(ko?['도미노 연쇄','균형 잡기','접힌 놀이방','그림자 놀이','보석 렌즈','그려서 카드 만들기','리듬 다리','한 바퀴','사진 셔터','종이 팝업','도장 찍기','작은 넘김책','종이 통로','바람 보내기','테이블 장식','양면 초대말']:['Cadena de dominós','Equilibrar','Sala de papel','Sombras','Lente de gema','Dibujar una tarjeta','Puente de ritmo','Dar una vuelta','Fotos','Papel desplegable','Poner un sello','Librito','Camino de papel','Soplar','Decorar','Invitación de dos caras'])[localEventIds.indexOf(id as LocalEventId)],'table'))}</div></details>)}</div></details>
   {workbench('table')}
   <span className="gallery-arrival" data-pose=".45" aria-hidden="true"/>
  </section>
  {gallery}
  <section id="letter-scene" className={`chapter letter-invitation ${detailRegion==='envelope'||sharedEvent?.region==='envelope'?'has-detail':''}`} data-pose=".62" aria-labelledby="envelope-title"><div className="chapter-copy" hidden={detailRegion==='envelope'||sharedEvent?.region==='envelope'}><h2 id="envelope-title">{text.letter}</h2><p>{text.letterBody}</p><div className="invitation-actions"><button ref={opener} className="primary-button" aria-label={wantsLetterOpen?text.close:text.open} aria-expanded={letterPublic} aria-controls="moment-letter-copy" onClick={openLetter}>{wantsLetterOpen?text.close:text.open}<span aria-hidden="true">{wantsLetterOpen?'−':'↗'}</span></button><a href="#papi-letter" className="text-button" onClick={readLetter}>{text.reading}</a></div><button className="text-button together-choice" data-shared-event="R01" onClick={event=>openShared('R01','envelope',event.currentTarget)}>{ko?'같이 열어볼까?':'¿La abrimos juntos?'}</button></div>{progress<.84&&<div className="envelope-discoveries">{discover('L11',ko?'작은 밀랍에 도장 찍기':'Poner un sello en la cera','envelope')}{discover('L12',ko?'옆에 있는 넘김책':'El librito de al lado','envelope')}</div>}{workbench('envelope')}</section>
  <section id="papi-letter" className={`letter-section ${letterVisible?'is-open':'is-folded'} ${progress>=.86&&letterVisible?'reading-surround':''}`} data-pose=".86" aria-labelledby="letter-title">
   {progress>=.86&&letterVisible&&<div className="letter-reading-art"><button type="button" className="reading-roses reading-roses-left" aria-label={ko?'장미에 숨은 뜻 보기':'Ver qué significan las rosas'} aria-expanded={roseHintOpen} aria-controls={roseHintId} onClick={()=>setRoseHintOpen(open=>!open)}/><button type="button" className="reading-roses reading-roses-right" aria-label={ko?'장미에 숨은 뜻 보기':'Ver qué significan las rosas'} aria-expanded={roseHintOpen} aria-controls={roseHintId} onClick={()=>setRoseHintOpen(open=>!open)}/></div>}
   <div className="letter-section-label"><button className="text-button" aria-label={letterVisible?text.close:text.open} onClick={letterVisible?toggleLetter:()=>{control.current=reopenEnvelope(control.current);refreshTarget();}} aria-expanded={letterPublic} aria-controls="moment-letter-copy">{letterVisible?text.close:text.open} <span>{letterVisible?'−':'+'}</span></button></div>
   <div className="letter-paper-slot" ref={paperSlot}><article ref={paper} className={`letter-paper ${!letterVisible&&letterPublic?'is-visually-sealed':''}`} id="moment-letter-copy" hidden={!letterPublic}>
    <div className="paper-rule"/><p className="letter-address">{copy.letterAddress}</p><h2 id="letter-title">{copy.letterTitle}</h2>{copy.letterBody.map(paragraph=><p key={paragraph}>{paragraph}</p>)}<p className="letter-signature">{copy.letterSignature}</p><div className="paper-bottom-mark">Y <span>♡</span> L</div>
   </article></div>
   {letterVisible&&progress>=.86&&<p id={roseHintId} className="rose-meaning" role="status" aria-live="polite" aria-atomic="true">{roseHintOpen?(ko?'4송이, 그리고 4송이. 우리 시작한 날 ♡':'Cuatro rosas y otras cuatro. El día que empezamos: 4 de abril ♡'):''}</p>}
   {letterVisible&&<div className="letter-bottom-controls"><button className="text-button" onClick={()=>{opener.current?.focus({preventScroll:true});toggleLetter();}}>{text.close} <span>−</span></button></div>}
   {!letterVisible&&<div className="closed-note"><span>♡</span><p>{text.sealed}</p><button className="text-button" onClick={()=>{control.current=reopenEnvelope(control.current);refreshTarget();}}>{text.open} ↗</button></div>}
  </section>
  <section className={`chapter ending ${detailRegion==='ending'?'has-detail':''}`} data-pose="1"><div className="ending-copy" hidden={detailRegion==='ending'}><h2>{text.ending}</h2>{localEvent.drawingFlipped&&localEvent.strokes.length>0&&<p className="action-recall">{ko?'네가 그린 카드도 여기 두었어.':'Tu tarjeta también se queda aquí.'}</p>}<div className="ending-actions"><a className="primary-button" href={playHref??'/#games'}>{playHref?copy.primaryAction:text.play}<span aria-hidden="true">↗</span></a><a className="text-button" href="/feedback">{text.ideas}</a></div><div className="ending-object-choices">{discover('L15',ko?'장식 여기 두기':'Dejar un detalle aquí','ending')}{discover('L07',ko?'리듬 한 번 더':'Otro ritmo','ending')}</div><p className="ending-date">2025.04.04 — Yeonseok ♡ Lisbeth</p></div>{workbench('ending')}<footer><span>Para ti, Lisbeth ♡</span><a href={embedded?'#home':'#intro'}>{text.back} ↑</a></footer></section>

 </Container>;
}

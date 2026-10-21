import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { landingCopy } from '../../src/copy/home';
import type { PaperPose, PostHeroState } from './Scene';
import { paperTransform, blendPaperCorners, letterOpeningLayout } from './paperProjection';
import Details from './Details';
import SharedEventsPanel from './SharedEventsPanel';
import type {SharedEventId,SharedEventRound} from '../../src/core/sharedEventsState';
import {restoreLocalEventState,pawnSource,approvedPawns,type LocalEventId,type LocalEventState} from './LocalEventRig';
import { clamp01, LETTER_RANGE, LETTER_PAPER_HANDOFF, LETTER_UNFOLDED, closeEnvelope, createEnvelopeState, updateEnvelopeFromScroll, toggleEnvelope, reopenEnvelope, envelopeTarget } from './interaction';

const StandalonePostHeroScene=lazy(()=>import('./Scene').then(module=>({default:module.PostHeroScene})));

type Language = 'ko' | 'es';
const story = {
 ko: { title:<>멀리 있어도,<br/>우리 둘이 같이.</>, body:'Baby, 너랑 같이 게임하려고 만들었어.', next:'조금 내려봐', distance:'한국과 도미니카.', distanceBody:'Baby, 도미니카에서는 한국 리듬게임에 접속이 안 됐잖아.', letter:'Baby, 이번엔 이거 열어봐.', letterBody:'이건 네가 읽어줬으면 해서.', open:'편지 열기', continueOpen:'계속 열기', cancelClose:'접기 취소', close:'편지 접기', ending:<>자, 이제 같이 놀자,<br/><em>Baby.</em></>, play:'게임 고르기', ideas:'Mami의 아이디어', reading:'편지 읽기', back:'처음으로', sealed:'봉투가 닫혀 있어요.', },
 es: { title:<>Aunque estemos lejos,<br/>juguemos juntos.</>, body:'Baby, hice esto para que juguemos juntos.', next:'Baja un poquito', distance:'Corea y República Dominicana.', distanceBody:'Baby, desde República Dominicana no podías entrar al juego de ritmo de Corea.', letter:'Baby, ahora abre esto.', letterBody:'Esto sí quería que lo leyeras.', open:'Abrir la carta', continueOpen:'Seguir abriendo', cancelClose:'Cancelar el cierre', close:'Doblar la carta', ending:<>Ahora sí, vamos a jugar,<br/><em>baby.</em></>, play:'Elegir un juego', ideas:'Ideas de Mami', reading:'Leer la carta', back:'Volver arriba', sealed:'El sobre está cerrado.', }
};
function storedLanguage():Language { try { return localStorage.getItem('dos-language')==='es'?'es':'ko'; } catch { return 'ko'; } }

type DetailRegion='room'|'envelope'|'ending';
type RoomDiscovery={id:LocalEventId;trigger:HTMLButtonElement;nonce:number};
type PreviewProps = { roomDiscovery?:RoomDiscovery;roomActive?:boolean; embedded?: boolean; language?: Language; onLanguageChange?: (language: Language) => void; portraitSrc?: string; portraitMaskSrc?: string; gallery?: ReactNode; playHref?: string; renderScene?: boolean; onSceneState?: (state:PostHeroState)=>void; externalSceneReady?: boolean; onRegisterFrame?: (tick:((now:number)=>void)|null)=>void };
export function PostHeroPreview({embedded=false,language:externalLanguage,onLanguageChange,portraitSrc='/images/yeonseok-lisbeth-cutout.webp',portraitMaskSrc,gallery,playHref,renderScene=true,onSceneState,externalSceneReady=false,onRegisterFrame,roomDiscovery,roomActive}:PreviewProps = {}) {
 const [localLanguage,setLocalLanguage]=useState<Language>(storedLanguage);
 const language=externalLanguage??localLanguage;
 const setLanguage=(value:Language)=>{setLocalLanguage(value);onLanguageChange?.(value);};
 const Container=embedded?'section':'main';
 const [reducedMotion,setReducedMotion]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 const [progress,setProgress]=useState(0);
 const [opening,setOpening]=useState(0);
 const [detailRegion,setDetailRegion]=useState<DetailRegion|null>(null);
 const [sharedEvent,setSharedEvent]=useState<{id:SharedEventId;region:DetailRegion}|null>(null);
 const [roseHintOpen,setRoseHintOpen]=useState(false);
 const roseHintId=useId();
 const [sceneReady,setSceneReady]=useState(false);
 const [sceneError,setSceneError]=useState('');
 const [localEvent,setLocalEvent]=useState<LocalEventState>(()=>({...restoreLocalEventState(language),dominoTiles:[[1,2],[2,3],[3,4],[4,5]]}));
 const localTick=useRef<((now:number)=>void)|null>(null);
 const registerLocalTick=useCallback((tick:((now:number)=>void)|null)=>{localTick.current=tick;},[]);
 const [effect,setEffect]=useState({name:'none',value:0,nonce:0});
 const control=useRef(createEnvelopeState());
 const focusAfterFold=useRef(false);
 const pendingScroll=useRef<(()=>void)|null>(null);
 const q=useRef(0), p=useRef(0), target=useRef(0), reduced=useRef(reducedMotion);
 const host=useRef<HTMLElement>(null);
 const opener=useRef<HTMLButtonElement>(null),detailsOpener=useRef<HTMLButtonElement|null>(null),sharedOpener=useRef<HTMLButtonElement|null>(null),sharedClose=useRef<HTMLButtonElement>(null);
 const roomDialog=useRef<HTMLDialogElement>(null),lastRoomNonce=useRef<number|undefined>(undefined);
 const paper=useRef<HTMLElement>(null),paperSlot=useRef<HTMLDivElement>(null);
 const trackPaper=useCallback((pose:PaperPose)=>{
   const article=paper.current,slot=paperSlot.current;if(!article||!slot)return;
   if(!pose.visible){article.removeAttribute('data-tracking');article.removeAttribute('data-paper-corners');article.style.removeProperty('position');article.style.removeProperty('left');article.style.removeProperty('top');article.style.removeProperty('width');article.style.removeProperty('transform');slot.style.removeProperty('height');return;}
   const bounds=slot.getBoundingClientRect(),phase=clamp01((p.current-LETTER_PAPER_HANDOFF)/(.86-LETTER_PAPER_HANDOFF)),readBlend=phase*phase*(3-2*phase),desktop=innerWidth>=761;
   const opening=letterOpeningLayout(innerWidth,innerHeight,article.offsetHeight,q.current);
   const width=desktop?opening.width+(bounds.width-opening.width)*readBlend:bounds.width;
   article.style.width=`${width}px`;const height=article.offsetHeight;
   if(!width||!height)return;
   slot.style.height=`${height}px`;
   const destination=[{x:bounds.left,y:bounds.top},{x:bounds.right,y:bounds.top},{x:bounds.right,y:bounds.top+height},{x:bounds.left,y:bounds.top+height}];
   const openingCorners=[{x:opening.left,y:opening.top},{x:opening.left+opening.width,y:opening.top},{x:opening.left+opening.width,y:opening.top+height},{x:opening.left,y:opening.top+height}];
   const reader=desktop?blendPaperCorners(openingCorners,destination,phase):destination;
   const corners=desktop?blendPaperCorners(pose.corners,reader,opening.handoff):blendPaperCorners(pose.corners,destination,phase);
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
   stopLetterMotion();focusAfterFold.current=false;alignEnvelopeView(settle);control.current=reopenEnvelope(control.current);refreshTarget();
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
     if(focusAfterFold.current&&target.current===0&&q.current<.0005){focusAfterFold.current=false;opener.current?.focus({preventScroll:true});}
   };
   if(onRegisterFrame){onRegisterFrame(tick);return()=>onRegisterFrame(null);}
   const loop=(time:number)=>{tick(time);frame=requestAnimationFrame(loop);};
   frame=requestAnimationFrame(loop);return()=>cancelAnimationFrame(frame);
 },[onRegisterFrame]);
 function stopLetterMotion(){if(control.current.returning||control.current.manual===true&&q.current<1)scrollTo({top:scrollY,behavior:'instant'});}
 function alignEnvelopeView(instant=false){
   const scene=document.getElementById('letter-scene'),bounds=scene?.getBoundingClientRect();
   if(bounds&&bounds.top>1)scene?.scrollIntoView({behavior:instant||reduced.current?'instant':'smooth',block:'start'});
 }
 const closeLetter=()=>{
   stopLetterMotion();setRoseHintOpen(false);control.current=closeEnvelope(control.current,p.current);focusAfterFold.current=true;refreshTarget();
   if(control.current.returning)document.getElementById('letter-scene')?.scrollIntoView({behavior:reduced.current?'instant':'smooth',block:'start'});
 };
 const toggleLetter=()=>{
   if(!control.current.returning&&target.current>=.5){closeLetter();return;}
   stopLetterMotion();focusAfterFold.current=false;control.current=toggleEnvelope(control.current,p.current);if(control.current.manual===true&&q.current<LETTER_UNFOLDED)alignEnvelopeView();refreshTarget();
 };
 useEffect(()=>{
   const interrupt=()=>stopLetterMotion();
   const scrollKey=(event:KeyboardEvent)=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(event.key))interrupt();};
   addEventListener('wheel',interrupt,{passive:true});addEventListener('pointerdown',interrupt,{passive:true,capture:true});addEventListener('keydown',scrollKey);
   return()=>{removeEventListener('wheel',interrupt);removeEventListener('pointerdown',interrupt,true);removeEventListener('keydown',scrollKey);};
 },[]);
 useEffect(()=>{
   const closeOnEscape=(event:KeyboardEvent)=>{if(event.key!=='Escape'||detailRegion||sharedEvent)return;if(roseHintOpen){event.preventDefault();setRoseHintOpen(false);return;}if(control.current.returning){event.preventDefault();stopLetterMotion();return;}if(target.current<=.5)return;event.preventDefault();closeLetter();};
   addEventListener('keydown',closeOnEscape);return()=>removeEventListener('keydown',closeOnEscape);
 },[refreshTarget,roseHintOpen,detailRegion,sharedEvent]);
 const readLetter=(event?:React.MouseEvent)=>{event?.preventDefault();stopLetterMotion();focusAfterFold.current=false;control.current=reopenEnvelope(control.current);q.current=1;setOpening(1);refreshTarget();document.getElementById('papi-letter')?.scrollIntoView({behavior:'instant',block:'start'});};
 useEffect(()=>{const onHash=()=>{if(location.hash==='#papi-letter')readLetter();};onHash();addEventListener('hashchange',onHash);return()=>removeEventListener('hashchange',onHash);},[]);
 const closeDetails=useCallback((restoreFocus=true)=>{setDetailRegion(null);setLocalEvent(old=>({...old,active:null,rhythmSignal:null,waxPressed:false}));if(restoreFocus)requestAnimationFrame(()=>detailsOpener.current?.focus({preventScroll:true}));},[]);

 const openShared=(id:SharedEventId,region:NonNullable<typeof detailRegion>,trigger:HTMLButtonElement)=>{sharedOpener.current=trigger;setSharedEvent({id,region});};
 const closeShared=()=>{setSharedEvent(null);requestAnimationFrame(()=>sharedOpener.current?.focus({preventScroll:true}));};
 useEffect(()=>{if(sharedEvent)sharedClose.current?.focus({preventScroll:true});},[sharedEvent]);
 useEffect(()=>{
  if(!roomDiscovery||lastRoomNonce.current===roomDiscovery.nonce)return;
  lastRoomNonce.current=roomDiscovery.nonce;detailsOpener.current=roomDiscovery.trigger;setSharedEvent(null);setDetailRegion('room');
  setLocalEvent(old=>({...old,active:roomDiscovery.id,rhythmSignal:null,waxPressed:false,sideView:false}));
 },[roomDiscovery]);
 useEffect(()=>{if(roomActive===false&&(detailRegion==='room'||sharedEvent?.region==='room')){setSharedEvent(null);closeDetails(false);}},[roomActive,detailRegion,sharedEvent,closeDetails]);
 const roomIsOpen=detailRegion==='room'||sharedEvent?.region==='room';
 useEffect(()=>{
  const dialog=roomDialog.current;if(!dialog)return;
  if(roomIsOpen&&!dialog.open){dialog.showModal();dialog.querySelector<HTMLElement>('#details-title')?.focus({preventScroll:true});}
  else if(!roomIsOpen&&dialog.open)dialog.close();
 },[roomIsOpen]);
 const sceneVisible=!renderScene&&externalSceneReady;
 const workbench=(region:NonNullable<typeof detailRegion>)=>(detailRegion===region||sharedEvent?.region===region)&&<div className="context-workbench" id={`details-${region}`} data-detail-region={region}>
  {detailRegion===region&&<div hidden={Boolean(sharedEvent)}><Details language={language} reducedMotion={reducedMotion} state={localEvent} setState={setLocalEvent} suspended={Boolean(sharedEvent)} onClose={closeDetails} sceneVisible={region!=='room'&&sceneVisible} onEffect={setNewEffect} onRegisterFrame={registerLocalTick} onSharedEvent={(id,trigger)=>openShared(id,region,trigger)}/></div>}
  {sharedEvent?.region===region&&<div className="shared-context" onKeyDownCapture={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeShared();}}}><button ref={sharedClose} className="text-button shared-context-close" onClick={closeShared}>{ko?'혼자 계속하기':'Seguir por mi cuenta'} <span aria-hidden="true">×</span></button><SharedEventsPanel key={sharedEvent.id} language={language} initialEventId={sharedEvent.id} initiallyOpen onSharedStart={handleSharedEventStart}/></div>}
 </div>;

 const letterVisible=opening>LETTER_UNFOLDED;
 const wantsLetterOpen=!control.current.returning&&target.current>.5;
 const openAction=control.current.returning?text.cancelClose:wantsLetterOpen?text.close:opening>.0005&&control.current.manual!==false?text.continueOpen:text.open;
 const letterPublic=control.current.manual!==false||letterVisible;
 const readingAction=control.current.returning?text.cancelClose:control.current.manual===false?text.open:text.close;
 const stage=progress<.35?'story':progress<.56?'play':progress<.90?'letter':'ending';
 return <Container ref={host} className={`post-hero-preview ${embedded?'post-hero-embedded':''} ${letterVisible?'letter-is-open':''}`} data-stage={stage} data-letter-returning={control.current.returning} data-scene-ready={renderScene?sceneReady:externalSceneReady} data-opening={opening.toFixed(3)} data-progress={progress.toFixed(3)}>
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
  <section id="distance" className="chapter distance" data-pose={embedded?"0":".10"} aria-labelledby="distance-title">
   <div className="distance-story"><h2 id="distance-title" className="distance-heading">{text.distance}</h2><div className="chapter-copy distance-reason"><p>{text.distanceBody}</p><p className="motivation-answer">{ko?'그래서 멀리 있어도 우리 둘이 같이 놀 곳을 만들고 싶었어.':'Por eso quería hacer un lugar para que juguemos juntos aunque estemos lejos.'}</p></div></div>
   <div className="distance-workstations"><img src="/images/approved-couple-room/approved-couple-gaming-room.png" width="1672" height="941" alt={ko?'한국 쪽 키보드와 마우스를 쓰는 손, 도미니카 쪽 노트북과 마우스를 쓰는 손':'Las manos en el teclado y el ratón del lado de Corea, y el portátil y la mano en el ratón del lado dominicano'}/></div>
   <div className="country-labels"><span><img src="/images/marble/flags/kr.svg" alt=""/>한국 · Corea</span><span><img src="/images/marble/flags/do.svg" alt=""/>República Dominicana</span></div>
   <a className="text-button distance-play" href="#games">{text.play}<span aria-hidden="true">↓</span></a>
   <span id="toy-table" className="story-internal-anchor" data-pose=".30" aria-hidden="true"/>
   <span className="gallery-arrival" data-pose=".45" aria-hidden="true"/>
  </section>
  {gallery}
  <section id="letter-scene" className={`chapter letter-invitation ${detailRegion==='envelope'||sharedEvent?.region==='envelope'?'has-detail':''}`} data-pose=".62" aria-labelledby="envelope-title"><div className="chapter-copy" hidden={detailRegion==='envelope'||sharedEvent?.region==='envelope'}><h2 id="envelope-title">{text.letter}</h2><p>{text.letterBody}</p><div className="invitation-actions"><button ref={opener} className="primary-button" aria-label={openAction} aria-expanded={letterPublic} aria-controls="moment-letter-copy" onClick={toggleLetter}>{openAction}<span aria-hidden="true">{wantsLetterOpen?'−':'↗'}</span></button><a href="#papi-letter" className="text-button" onClick={readLetter}>{text.reading}</a></div><button className="text-button together-choice" data-shared-event="R01" onClick={event=>openShared('R01','envelope',event.currentTarget)}>{ko?'같이 열어볼까?':'¿La abrimos juntos?'}</button></div>{workbench('envelope')}</section>
  <section id="papi-letter" className={`letter-section ${letterVisible?'is-open':'is-folded'} ${progress>=.86&&letterVisible?'reading-surround':''}`} data-pose=".86" aria-labelledby="letter-title">
   {progress>=.86&&letterVisible&&<div className="letter-reading-art"><button type="button" className="reading-roses reading-roses-left" aria-label={ko?'장미에 숨은 뜻 보기':'Ver qué significan las rosas'} aria-expanded={roseHintOpen} aria-controls={roseHintId} onClick={()=>setRoseHintOpen(open=>!open)}/><button type="button" className="reading-roses reading-roses-right" aria-label={ko?'장미에 숨은 뜻 보기':'Ver qué significan las rosas'} aria-expanded={roseHintOpen} aria-controls={roseHintId} onClick={()=>setRoseHintOpen(open=>!open)}/></div>}
   {letterVisible&&<div className="letter-section-label"><button className="text-button" aria-label={readingAction} onClick={toggleLetter} aria-expanded={letterPublic} aria-controls="moment-letter-copy">{readingAction} <span>−</span></button></div>}
   <div className="letter-paper-slot" ref={paperSlot}><article ref={paper} className={`letter-paper ${!letterVisible&&letterPublic?'is-visually-sealed':''}`} id="moment-letter-copy" hidden={!letterPublic}>
    <div className="paper-rule"/><p className="letter-address">{copy.letterAddress}</p><h2 id="letter-title">{copy.letterTitle}</h2>{copy.letterBody.map(paragraph=><p key={paragraph}>{paragraph}</p>)}<p className="letter-signature">{copy.letterSignature}</p><div className="paper-bottom-mark">Y <span>♡</span> L</div>
   </article></div>
   {letterVisible&&progress>=.86&&<p id={roseHintId} className="rose-meaning" role="status" aria-live="polite" aria-atomic="true">{roseHintOpen?(ko?'4송이, 그리고 4송이. 우리 시작한 날 ♡':'Cuatro rosas y otras cuatro. El día que empezamos: 4 de abril ♡'):''}</p>}
   {letterVisible&&<div className="letter-bottom-controls"><button className="text-button" onClick={toggleLetter}>{readingAction} <span>−</span></button></div>}
   {!letterVisible&&control.current.manual===false&&<div className="closed-note"><p>{text.sealed}</p><button className="text-button" onClick={()=>{stopLetterMotion();focusAfterFold.current=false;control.current=reopenEnvelope(control.current);refreshTarget();}}>{text.open} ↗</button></div>}
  </section>
  <section id="together-again" className={`chapter ending ${detailRegion==='ending'?'has-detail':''}`} data-pose="1">
   <div className="ending-room"><img src="/images/approved-couple-room/approved-couple-gaming-room.png" width="1672" height="941" alt={ko?'각자의 게임방에서 함께 게임하는 우리 둘':'Los dos jugando desde nuestras habitaciones'}/></div>
   <div className={`ending-copy ${localEvent.strokes.length>0||localEvent.hasSavedDecor?'has-keepsake':''}`} hidden={detailRegion==='ending'}>
    <div className="ending-message"><h2>{text.ending}</h2><div className="ending-actions"><a className="primary-button" href={playHref??'/#games'}>{playHref?copy.primaryAction:text.play}<span aria-hidden="true">↗</span></a><a className="text-button" href="/feedback">{text.ideas}</a></div><p className="ending-date">2025.04.04 — Yeonseok ♡ Lisbeth</p></div>
    {(localEvent.strokes.length>0||localEvent.hasSavedDecor)&&<figure className="ending-keepsake">
     {localEvent.strokes.length>0&&<svg className="ending-drawing" viewBox="0 0 100 60" role="img" aria-label={ko?'네가 그린 그림':'Tu dibujo'}>{localEvent.strokes.map((line,i)=><polyline key={i} points={line.map(point=>`${point.x},${point.y}`).join(' ')} fill="none" stroke="#7b293d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>)}</svg>}
     {localEvent.hasSavedDecor&&(localEvent.decorKind==='pawn'?<img className="ending-decor" src={pawnSource(localEvent.decorPawn)} alt={`${ko?'네가 고른 게임말':'La figura que elegiste'}: ${approvedPawns[localEvent.decorPawn][language]}`}/>:<svg className="ending-decor" viewBox="0 0 44 44" role="img" aria-label={localEvent.decorKind==='gem'?(ko?'네가 고른 보석':'La gema que elegiste'):(ko?'네가 고른 종이 클립':'El clip que elegiste')}>{localEvent.decorKind==='gem'?<><path d="M22 5 36 21 22 39 8 21Z" fill="#e6b58d"/><path d="M22 5V39L8 21Z" fill="#bc7e68"/><path d="M22 5 36 21 22 18Z" fill="#f9d5ac"/></>:<path d="M29 10 15 25a5 5 0 0 0 7 7l13-14a8 8 0 0 0-12-11L10 21a11 11 0 0 0 16 15" fill="none" stroke="#dbb7a3" strokeWidth="3" strokeLinecap="round"/>}</svg>)}
     {localEvent.drawingFlipped&&localEvent.strokes.length>0&&<figcaption className="action-recall">{ko?'네가 그린 카드도 여기 두었어.':'Tu tarjeta también se queda aquí.'}</figcaption>}
    </figure>}
   </div>
   {workbench('ending')}<footer><span>Para ti, Lisbeth ♡</span><a href={embedded?'#home':'#intro'}>{text.back} ↑</a></footer>
  </section>

  <dialog ref={roomDialog} className="room-discovery-dialog" aria-label={ko?'선택한 물건':'Objeto seleccionado'} onCancel={event=>{event.preventDefault();if(sharedEvent)closeShared();else closeDetails();}}>
   {workbench('room')}
  </dialog>
 </Container>;
}

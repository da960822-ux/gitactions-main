import { lazy, Suspense, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { landingCopy } from '../../src/copy/home';
import type { PaperPose, PostHeroState } from './Scene';
import { paperTransform, blendPaperCorners, letterOpeningLayout } from './paperProjection';
import Details from './Details';
import SharedEventsPanel from './SharedEventsPanel';
import {StoryChapters} from './StoryChapters';
import {EndingChapter} from './EndingChapter';
import {preloadRoseGiftArt} from './RoseGiftFinale';
import {PartnerPact} from './PartnerPact';
import {useLiveReducedMotion} from './useLiveReducedMotion';
import {createLetterFinaleState,reduceLetterFinale,type LetterFinaleEvent} from '../../src/landing/letterFinaleState';
import type {SharedEventId,SharedEventRound} from '../../src/core/sharedEventsState';
import {restoreLocalEventState,type LocalEventId,type LocalEventState} from './LocalEventRig';
import { advanceLetterOpening, clamp01, LETTER_PAPER_HANDOFF, LETTER_UNFOLDED, closeEnvelope, createEnvelopeState, updateEnvelopeFromScroll, toggleEnvelope, reopenEnvelope, envelopeTarget } from './interaction';

const progressBucket=(value:number)=>value<.35?0:value<.56?1:value<.86?2:value<.90?3:4;
const openingBucket=(value:number)=>value<=.0005?0:value<=LETTER_UNFOLDED?1:2;
const StandalonePostHeroScene=lazy(()=>import('./Scene').then(module=>({default:module.PostHeroScene})));

type Language = 'ko' | 'es';
const story = {
 ko: { title:<>멀리 있어도,<br/>우리 둘이 같이.</>, body:'Baby, 너랑 같이 게임하려고 만들었어.', next:'조금 내려봐', letter:'Baby, 이번엔 이거 열어봐.', letterBody:'게임은 잠깐만. 이건 네가 꼭 읽어줬으면 좋겠어.', open:'봉투 열어보기', continueOpen:'계속 열기', cancelClose:'접기 취소', close:'편지 접기', play:'게임 고르기', reading:'바로 읽기', sealed:'봉투가 닫혀 있어요.', },
 es: { title:<>Aunque estemos lejos,<br/>juguemos juntos.</>, body:'Baby, hice esto para que juguemos juntos.', next:'Baja un poquito', letter:'Baby, ahora abre esto.', letterBody:'Dejemos el juego un momentito. Esto sí quiero que lo leas.', open:'Abrir el sobre', continueOpen:'Seguir abriendo', cancelClose:'Cancelar el cierre', close:'Doblar la carta', play:'Elegir un juego', reading:'Leerla directamente', sealed:'El sobre está cerrado.', }
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
 const reducedMotion=useLiveReducedMotion();
 const boundedFrames=embedded&&!renderScene&&Boolean(onRegisterFrame);
 const [progress,setProgress]=useState(0);
 const [opening,setOpening]=useState(0);
 const [detailRegion,setDetailRegion]=useState<DetailRegion|null>(null);
 const [sharedEvent,setSharedEvent]=useState<{id:SharedEventId;region:DetailRegion}|null>(null);
 const [roseHintOpen,setRoseHintOpen]=useState(false);
 const [letterFinale,setLetterFinale]=useState(createLetterFinaleState);
 const [giftEpoch,setGiftEpoch]=useState(0);
 useEffect(()=>{if(letterFinale.phase==='reading')void preloadRoseGiftArt();},[letterFinale.phase]);
 const finale=useRef(letterFinale);
 const [pactAccepted,setPactAccepted]=useState(false);
 const [letterClosingRect,setLetterClosingRect]=useState<{left:number;top:number;width:number;height:number}>();
 const closingRect=useRef<typeof letterClosingRect>(undefined),closingScrollY=useRef(0);
 const [surfaceSnapshot,setSurfaceSnapshot]=useState<{height:number;offset:number;paperHeight:number}|null>(null);
 const readerSurface=useRef<HTMLElement>(null),readerOpener=useRef<HTMLButtonElement>(null);
 const roseHintId=useId();
 const [sceneReady,setSceneReady]=useState(false);
 const [sceneError,setSceneError]=useState('');
 const [localEvent,setLocalEvent]=useState<LocalEventState>(()=>({...restoreLocalEventState(language),dominoTiles:[[1,2],[2,3],[3,4],[4,5]]}));
 const localTick=useRef<((now:number)=>void)|null>(null);
 const registerLocalTick=useCallback((tick:((now:number)=>void)|null)=>{localTick.current=tick;},[]);
 const [effect,setEffect]=useState({name:'none',value:0,nonce:0});
 const control=useRef({...createEnvelopeState(),manual:false as boolean|null});
 const focusAfterFold=useRef(false),focusReader=useRef(false);
 const changeLetterView=useCallback((event:LetterFinaleEvent)=>{if(event.type==='read'||event.type==='reopen'||event.type==='shared-open'){setGiftEpoch(epoch=>epoch+1);closingRect.current=undefined;setLetterClosingRect(undefined);setSurfaceSnapshot(null);}const next=reduceLetterFinale(finale.current,event);finale.current=next;setLetterFinale(next);},[]);
 const pendingScroll=useRef<(()=>void)|null>(null);
 const q=useRef(0), p=useRef(0), target=useRef(0), reduced=useRef(reducedMotion);
 const host=useRef<HTMLElement>(null);
 const progressSnapshot=useRef(0),openingSnapshot=useRef(0);
 const updateProgress=useCallback((value:number)=>{if(!boundedFrames||progressBucket(value)!==progressBucket(progressSnapshot.current)){progressSnapshot.current=value;setProgress(value);}},[boundedFrames]);
 const updateOpening=useCallback((value:number)=>{if(!boundedFrames||openingBucket(value)!==openingBucket(openingSnapshot.current)){openingSnapshot.current=value;setOpening(value);}},[boundedFrames]);
 const opener=useRef<HTMLButtonElement>(null),detailsOpener=useRef<HTMLButtonElement|null>(null),sharedOpener=useRef<HTMLButtonElement|null>(null),sharedClose=useRef<HTMLButtonElement>(null);
 const roomDialog=useRef<HTMLDialogElement>(null),lastRoomNonce=useRef<number|undefined>(undefined);
 const paper=useRef<HTMLElement>(null),paperSlot=useRef<HTMLDivElement>(null);
 const paperLayout=useRef({width:0,height:0});
 const trackPaper=useCallback((pose:PaperPose)=>{
   const article=paper.current,slot=paperSlot.current;if(!article||!slot)return;
   const folding=finale.current.phase==='folding';
   if(!pose.visible||finale.current.phase==='rose'||!folding&&p.current>=.86){if(article.dataset.tracking){article.removeAttribute('data-tracking');article.removeAttribute('data-paper-corners');article.style.removeProperty('position');article.style.removeProperty('left');article.style.removeProperty('top');article.style.removeProperty('width');article.style.removeProperty('height');article.style.removeProperty('transform');slot.style.removeProperty('height');}return;}
   const bounds=slot.getBoundingClientRect(),phase=clamp01((p.current-LETTER_PAPER_HANDOFF)/(.86-LETTER_PAPER_HANDOFF)),desktop=innerWidth>=761;
   const frozen=folding?closingRect.current:undefined;
   const width=frozen?.width??paperLayout.current.width,height=frozen?.height??paperLayout.current.height;
   if(!width||!height)return;
   const opening=letterOpeningLayout(innerWidth,innerHeight,height,q.current);
   const destination=[{x:bounds.left,y:bounds.top},{x:bounds.right,y:bounds.top},{x:bounds.right,y:bounds.top+height},{x:bounds.left,y:bounds.top+height}];
   const openingCorners=[{x:opening.left,y:opening.top},{x:opening.left+opening.width,y:opening.top},{x:opening.left+opening.width,y:opening.top+height},{x:opening.left,y:opening.top+height}];
   const reader=desktop?blendPaperCorners(openingCorners,destination,phase):destination;
   const corners=folding?pose.corners:desktop?blendPaperCorners(pose.corners,reader,opening.handoff):blendPaperCorners(pose.corners,destination,phase);
   const transform=paperTransform(corners,width,height);if(!transform)return;
   article.dataset.tracking='true';article.dataset.paperCorners=JSON.stringify(corners);article.style.position='fixed';article.style.left='0';article.style.top='0';if(article.style.width!==`${width}px`)article.style.width=`${width}px`;if(frozen){if(article.style.height!==`${height}px`)article.style.height=`${height}px`;}else article.style.removeProperty('height');if(slot.style.height!==`${height}px`)slot.style.height=`${height}px`;article.style.transform=transform;
 },[]);
 const scenePayload=useRef<PostHeroState|null>(null);
 scenePayload.current={progress:p.current,opening:q.current,reducedMotion,effect,localEvent,portraitSrc,portraitMaskSrc,onPaperPose:trackPaper,letterView:letterFinale.phase,letterClosingRect};
 const publishScene=useCallback(()=>{
  if(host.current){host.current.dataset.progress=p.current.toFixed(3);host.current.dataset.opening=q.current.toFixed(3);}
  if(scenePayload.current)onSceneState?.({...scenePayload.current,progress:p.current,opening:q.current});
 },[onSceneState]);
 useEffect(publishScene,[progress,opening,reducedMotion,effect,localEvent,portraitSrc,portraitMaskSrc,trackPaper,publishScene,letterFinale.phase,letterClosingRect]);
 const copy=landingCopy[language], text=story[language];
 const ko=language==='ko';
 useEffect(()=>{setLocalEvent(old=>({...old,language,phraseFlipped:false}));},[language]);
 const setNewEffect=useCallback((name:string,value=1)=>setEffect(old=>({name,value,nonce:old.nonce+1})),[]);
 const refreshTarget=useCallback(()=>{target.current=envelopeTarget(control.current,p.current);if(target.current<=.5)setRoseHintOpen(false);},[setRoseHintOpen]);
 const handleSharedEventStart=useCallback((round:SharedEventRound,{settle}:{settle:boolean})=>{
   if(round.eventId!=='R01')return;
   changeLetterView({type:'shared-open'});stopLetterMotion();focusAfterFold.current=false;alignEnvelopeView(settle);control.current=reopenEnvelope(control.current);refreshTarget();
   if(settle){q.current=1;updateOpening(1);publishScene();}
 },[refreshTarget,changeLetterView,updateOpening,publishScene]);
 useEffect(()=>{reduced.current=reducedMotion;if(reducedMotion){q.current=target.current;updateOpening(q.current);publishScene();}},[reducedMotion,updateOpening,publishScene]);
 useEffect(()=>{document.documentElement.lang=language==='es'?'es-DO':'ko'; try{localStorage.setItem('dos-language',language);}catch{/* Storage is optional. */}},[language]);
 useLayoutEffect(()=>{
   if(letterFinale.phase==='rose'){host.current?.querySelector<HTMLElement>('#rose-gift-title')?.focus({preventScroll:true});focusAfterFold.current=false;}
   else if(letterFinale.phase==='sealed'&&focusAfterFold.current){readerOpener.current?.focus({preventScroll:true});focusAfterFold.current=false;}
 },[letterFinale.phase]);
 useLayoutEffect(()=>{
   if(!focusReader.current||letterFinale.phase!=='reading')return;
   focusReader.current=false;host.current?.querySelector<HTMLElement>('#letter-title')?.focus({preventScroll:true});
 });
 useLayoutEffect(()=>{
   if(letterFinale.phase!=='rose')return;
   const finale=readerSurface.current?.querySelector<HTMLElement>('#together-again');if(!finale)return;
   const observer=new ResizeObserver(()=>setSurfaceSnapshot(snapshot=>snapshot?{...snapshot,height:Math.max(snapshot.height,snapshot.offset+finale.offsetHeight)}:snapshot));
   observer.observe(finale);
   return()=>observer.disconnect();
 },[letterFinale.phase]);
 useEffect(()=>{
   let frame=0;
   const update=()=>{
     frame=0;
     if(finale.current.phase==='folding'&&closingRect.current)setLetterClosingRect({...closingRect.current,top:closingRect.current.top-(scrollY-closingScrollY.current)});
     const anchors=[...(host.current?.querySelectorAll<HTMLElement>('[data-pose]')??[])].map(el=>({y:el.getBoundingClientRect().top+scrollY-innerHeight*.18,p:Number(el.dataset.pose)}));
     const y=scrollY;
     let value=0;
     for(let i=0;i<anchors.length-1;i++){
       const a=anchors[i],b=anchors[i+1];
       if(y>=a.y)value=a.p+(b.p-a.p)*clamp01((y-a.y)/Math.max(1,b.y-a.y));
     }
     if(y>=(anchors.at(-1)?.y??Infinity))value=1;
     p.current=clamp01(value);updateProgress(p.current);
     control.current=updateEnvelopeFromScroll(control.current,p.current);refreshTarget();publishScene();
   };
   const request=()=>{if(onRegisterFrame)pendingScroll.current=update;else if(!frame)frame=requestAnimationFrame(update);};
   addEventListener('scroll',request,{passive:true});addEventListener('resize',request);update();
   return()=>{pendingScroll.current=null;cancelAnimationFrame(frame);removeEventListener('scroll',request);removeEventListener('resize',request);};
 },[refreshTarget,onRegisterFrame,updateProgress,publishScene]);
 useEffect(()=>{
   let frame=0,previous=0;
   const tick=(time:number)=>{
     localTick.current?.(time);
     const measure=pendingScroll.current;pendingScroll.current=null;measure?.();
     const dt=previous?Math.max(0,(time-previous)/1000):0;previous=time;
     const diff=target.current-q.current;
     if(diff!==0){q.current=advanceLetterOpening(q.current,target.current,dt,reduced.current);updateOpening(q.current);publishScene();}
     if(finale.current.phase==='folding'&&q.current<.0005&&target.current===0){changeLetterView({type:'fold-complete',opening:q.current,target:target.current});}
   };
   if(onRegisterFrame){onRegisterFrame(tick);return()=>onRegisterFrame(null);}
   const loop=(time:number)=>{tick(time);frame=requestAnimationFrame(loop);};
   frame=requestAnimationFrame(loop);return()=>cancelAnimationFrame(frame);
 },[onRegisterFrame,changeLetterView,updateOpening,publishScene]);
 function stopLetterMotion(){if(control.current.returning||control.current.manual===true&&q.current<1)scrollTo({top:scrollY,behavior:'instant'});}
 function alignEnvelopeView(instant=false){
   const scene=document.getElementById('letter-scene'),bounds=scene?.getBoundingClientRect();
   if(bounds&&bounds.top>1)scene?.scrollIntoView({behavior:instant||reduced.current?'instant':'smooth',block:'start'});
 }
 const settleLetter=()=>{q.current=target.current;updateOpening(q.current);publishScene();};
 const closeLetter=(instant=false)=>{
   const rect=paper.current?.getBoundingClientRect();
   closingRect.current=rect&&rect.width>1&&rect.height>1?{left:rect.left,top:rect.top,width:rect.width,height:rect.height}:undefined;
   closingScrollY.current=scrollY;
   setLetterClosingRect(closingRect.current);
   const surface=readerSurface.current;if(surface){const offset=-surface.getBoundingClientRect().top;setSurfaceSnapshot({offset,height:Math.max(surface.offsetHeight,offset+innerHeight),paperHeight:paperSlot.current?.offsetHeight??0});}
   changeLetterView({type:'close',opening:q.current});setRoseHintOpen(false);control.current={...closeEnvelope(control.current,p.current),returning:false};focusAfterFold.current=true;refreshTarget();if(instant||reduced.current)settleLetter();
 };
 const toggleLetter=(event?:React.MouseEvent,instant=false)=>{
   instant=instant||event?.detail===0;
   if(!control.current.returning&&target.current>=.5){closeLetter(instant);return;}
   changeLetterView({type:'reopen'});stopLetterMotion();focusAfterFold.current=false;control.current=toggleEnvelope(control.current,p.current);if(control.current.manual===true&&q.current<LETTER_UNFOLDED&&!instant)alignEnvelopeView();refreshTarget();if(instant||reduced.current)settleLetter();
 };
 useEffect(()=>{
   const interrupt=()=>{focusReader.current=false;stopLetterMotion();if(finale.current.phase==='folding'){changeLetterView({type:'interrupt'});focusAfterFold.current=false;}};
   const scrollKey=(event:KeyboardEvent)=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(event.key))interrupt();};
   addEventListener('wheel',interrupt,{passive:true});addEventListener('pointerdown',interrupt,{passive:true,capture:true});addEventListener('keydown',scrollKey);
   return()=>{removeEventListener('wheel',interrupt);removeEventListener('pointerdown',interrupt,true);removeEventListener('keydown',scrollKey);};
 },[changeLetterView]);
 useEffect(()=>{
   const closeOnEscape=(event:KeyboardEvent)=>{if(event.key!=='Escape'||detailRegion||sharedEvent)return;if(roseHintOpen){event.preventDefault();setRoseHintOpen(false);return;}if(finale.current.phase==='folding'){event.preventDefault();toggleLetter(undefined,true);return;}if(target.current<=.5)return;event.preventDefault();closeLetter(true);};
   addEventListener('keydown',closeOnEscape);return()=>removeEventListener('keydown',closeOnEscape);
 },[refreshTarget,roseHintOpen,detailRegion,sharedEvent]);
 const readLetter=(event?:React.MouseEvent)=>{event?.preventDefault();focusReader.current=Boolean(event);changeLetterView({type:'read'});stopLetterMotion();focusAfterFold.current=false;control.current=reopenEnvelope(control.current);q.current=1;updateOpening(1);publishScene();refreshTarget();document.getElementById('papi-letter')?.scrollIntoView({behavior:'instant',block:'start'});};
 useEffect(()=>{const onHash=()=>{if(location.hash==='#papi-letter')readLetter();};onHash();addEventListener('hashchange',onHash);return()=>removeEventListener('hashchange',onHash);},[]);
 const closeDetails=useCallback((restoreFocus=true)=>{setDetailRegion(null);setLocalEvent(old=>({...old,active:null,rhythmSignal:null,waxPressed:false,motionInstant:false}));if(restoreFocus)requestAnimationFrame(()=>detailsOpener.current?.focus({preventScroll:true}));},[]);

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
 const openAction=letterFinale.phase==='folding'?text.cancelClose:wantsLetterOpen?text.close:opening>.0005&&control.current.manual!==false?text.continueOpen:text.open;
 const letterPublic=control.current.manual!==false||letterVisible;
 const readingAction=letterFinale.phase==='folding'?text.cancelClose:control.current.manual===false?text.open:text.close;
 const stage=progress<.35?'story':progress<.56?'play':progress<.90?'letter':'ending';
 useLayoutEffect(()=>{
  const article=paper.current,slot=paperSlot.current;if(!article||!slot)return;
  const measure=()=>{
   if(finale.current.phase==='folding'||article.hidden)return;
   const width=slot.getBoundingClientRect().width;if(width<=0)return;
   if(article.dataset.tracking&&(article.style.height||Math.abs(parseFloat(article.style.width)-width)>.5)){paperLayout.current.width=width;article.style.width=`${width}px`;article.style.removeProperty('height');return;}
   const height=article.offsetHeight;if(height<=0)return;
   paperLayout.current={width,height};article.dataset.layoutWidth=String(width);article.dataset.layoutHeight=String(height);
  };
  measure();const observer=new ResizeObserver(measure);observer.observe(slot);observer.observe(article);
  return()=>observer.disconnect();
 },[language,letterPublic,letterFinale.phase]);

 return <Container ref={host} className={`post-hero-preview ${embedded?'post-hero-embedded':''} ${letterVisible?'letter-is-open':''}`} data-stage={stage} data-letter-returning={control.current.returning} data-scene-ready={renderScene?sceneReady:externalSceneReady} data-opening={q.current.toFixed(3)} data-progress={p.current.toFixed(3)} data-rose-gift={letterFinale.phase==='rose'} data-letter-view={letterFinale.phase}>
  {renderScene&&<div className="world" aria-hidden="true">
   {!sceneError&&<Suspense fallback={null}><StandalonePostHeroScene letterView={letterFinale.phase} letterClosingRect={letterClosingRect} progress={progress} opening={opening} reducedMotion={reducedMotion} effect={effect} portraitSrc={portraitSrc} portraitMaskSrc={portraitMaskSrc} localEvent={localEvent} onPaperPose={trackPaper} onReady={()=>setSceneReady(true)} onFailure={setSceneError}/></Suspense>}
   {sceneError&&<div className="world-fallback"><img src="/images/lisbeth-letter-envelope.webp" alt=""/></div>}
   <div className="world-vignette"/>
  </div>}
  {!embedded&&<header className="preview-nav">
   <a className="wordmark" href="#intro">Yeonseok <span>♡</span> Lisbeth</a>
   <nav aria-label={language==='ko'?'메뉴':'Navegación'}><a href="#papi-letter" onClick={readLetter}>{text.reading}</a><button className="language-toggle" onClick={()=>setLanguage(language==='ko'?'es':'ko')} aria-label={language==='ko'?'Cambiar a español':'한국어로 바꾸기'}>{language==='ko'?'KO / ES':'ES / KO'}</button></nav>
  </header>}
  {!embedded&&<section id="intro" className="chapter intro" data-pose="0"><div className="chapter-copy"><h1>{text.title}</h1><p>{text.body}</p><div className="intro-actions"><a className="primary-button" href="/#games">{text.play}</a><a className="text-button" href="#distance">{text.next} <span aria-hidden="true">↓</span></a></div></div></section>}
  <StoryChapters language={language}/>
  {gallery}
  <section id="letter-scene" className={`chapter letter-invitation ${detailRegion==='envelope'||sharedEvent?.region==='envelope'?'has-detail':''}`} data-pose=".62" aria-labelledby="envelope-title"><div className="chapter-copy" hidden={detailRegion==='envelope'||sharedEvent?.region==='envelope'}><h2 id="envelope-title">{text.letter}</h2><p>{text.letterBody}</p><div className="invitation-actions"><button ref={opener} className="primary-button" aria-label={openAction} aria-expanded={letterPublic} aria-controls="moment-letter-copy" onClick={toggleLetter}>{openAction}<span aria-hidden="true">{wantsLetterOpen?'−':'↗'}</span></button><a href="#papi-letter" className="text-button" onClick={readLetter}>{text.reading}</a></div><button className="text-button together-choice" data-shared-event="R01" onClick={event=>openShared('R01','envelope',event.currentTarget)}>{ko?'연결해서 같이 열기':'Abrirla juntos en una sala'}</button></div>{workbench('envelope')}</section>
  <section ref={readerSurface} id="papi-letter" className={`letter-section letter-journey ${letterVisible?'is-open':'is-folded'} ${progress>=.86&&letterVisible?'reading-surround':''}`} data-pose=".86" data-view={letterFinale.phase} aria-label={text.reading} style={surfaceSnapshot?{minHeight:surfaceSnapshot.height}:undefined}>
   <div className="letter-reading-pane" hidden={letterFinale.phase==='rose'}>
    {progress>=.86&&letterVisible&&<div className="letter-reading-art"><button type="button" className="reading-roses reading-roses-left" aria-label={ko?'장미에 숨은 뜻 보기':'Ver qué significan las rosas'} aria-expanded={roseHintOpen} aria-controls={roseHintId} onClick={()=>setRoseHintOpen(open=>!open)}/><button type="button" className="reading-roses reading-roses-right" aria-label={ko?'장미에 숨은 뜻 보기':'Ver qué significan las rosas'} aria-expanded={roseHintOpen} aria-controls={roseHintId} onClick={()=>setRoseHintOpen(open=>!open)}/></div>}
    <div className="letter-paper-slot" ref={paperSlot} style={surfaceSnapshot?{minHeight:surfaceSnapshot.paperHeight}:undefined}><article ref={paper} className={`letter-paper ${!letterVisible&&letterPublic?'is-visually-sealed':''}`} id="moment-letter-copy" hidden={!letterPublic}>
     <div className="paper-rule"/><p className="letter-address">{copy.letterAddress}</p><h2 id="letter-title" tabIndex={-1}>{copy.letterTitle}</h2>{copy.letterBody.map(paragraph=><p key={paragraph}>{paragraph}</p>)}<p className="letter-signature">{copy.letterSignature}</p><div className="paper-bottom-mark">Y <span>♡</span> L</div>
    </article></div>
    {(letterVisible||letterFinale.phase==='folding')&&progress>=.86&&<p id={roseHintId} className="rose-meaning" role="status" aria-live="polite" aria-atomic="true">{roseHintOpen?(ko?'4송이, 그리고 4송이. 우리 시작한 날 ♡':'Cuatro rosas y otras cuatro. El día que empezamos: 4 de abril ♡'):''}</p>}
    <div id="letter-reading-end" className="letter-reading-end" hidden={letterFinale.phase==='sealed'||letterFinale.phase==='reading'&&!letterVisible}>
     <div className="letter-optional-pact" data-active={letterFinale.phase==='reading'} inert={letterFinale.phase!=='reading'}><PartnerPact language={language} onResponseChange={setPactAccepted}/></div>
     <div className="letter-bottom-controls"><button type="button" className="text-button" onClick={toggleLetter} aria-controls="moment-letter-copy">{readingAction}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></div>
    </div>
    <div className="closed-note" hidden={letterFinale.phase!=='sealed'} style={surfaceSnapshot?{position:'absolute',top:surfaceSnapshot.offset,left:0,right:0}:undefined}><p>{text.sealed}</p><button ref={readerOpener} type="button" className="text-button" onClick={readLetter}>{text.open} ↗</button></div>
   </div>
   {letterFinale.phase!=='sealed'&&<div key={giftEpoch} className="letter-rose-pane" hidden={letterFinale.phase!=='rose'} style={surfaceSnapshot?{top:surfaceSnapshot.offset}:undefined}><EndingChapter language={language} playHref={playHref} embedded={embedded} state={localEvent} detailsOpen={detailRegion==='ending'} pactAccepted={pactAccepted} reducedMotion={reducedMotion} onReadLetter={readLetter}>{workbench('ending')}</EndingChapter></div>}
  </section>
  <div id="letter-journey-end" className="letter-journey-anchor" data-pose="1" aria-hidden="true"/>

  <dialog ref={roomDialog} className="room-discovery-dialog" aria-label={ko?'선택한 물건':'Objeto seleccionado'} onCancel={event=>{event.preventDefault();if(sharedEvent)closeShared();else closeDetails();}}>
   {workbench('room')}
  </dialog>
 </Container>;
}

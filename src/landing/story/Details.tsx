import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction, type PointerEvent } from 'react';
import { isDominoChainComplete, placeDominoTile } from './interaction';
import { createLocalEventState, serializeLocalEventPreferences, LOCAL_EVENT_PREF_KEY, localEventIds, stepBalance, paperGustHeight, pawnSource, type DrawingPoint, type LocalEventId, type LocalEventState } from './LocalEventRig';
import AssetPlayground from './AssetPlayground';
import PrismDomino from './PrismDomino';
import './details.css';

type Props={state:LocalEventState;setState:Dispatch<SetStateAction<LocalEventState>>;onClose:(restoreFocus?:boolean)=>void;sceneVisible?:boolean;suspended?:boolean;onSharedEvent?:(eventId:'R02'|'R03'|'R04',trigger:HTMLButtonElement)=>void;language:'ko'|'es';reducedMotion:boolean;onEffect:(name:string,value?:number)=>void;onRegisterFrame?:(tick:((now:number)=>void)|null)=>void};
const names={ko:['도미노 줄세우기','균형 잡기','접힌 놀이방','그림자 놀이','보석 렌즈','그려서 카드 만들기','리듬 다리','한 바퀴','사진 셔터','종이 팝업','도장 찍기','작은 넘김책','종이 통로','바람 보내기','테이블 장식','두 언어로 초대하기'],es:['Cadena de dominós','Equilibrar','Sala de papel','Jugar con sombras','Lente de gema','Dibujar una tarjeta','Puente de ritmo','Dar una vuelta','Ventanas de fotos','Escenario de papel','Poner un sello','Librito animado','Camino de papel','Soplar','Decorar la mesa','Una invitación en dos idiomas']};
const descriptions={ko:['끝 숫자를 맞춰서 이어봐. 첫 타일을 넘어뜨리면 마지막 타일이 서랍을 열어.','좌우로 기울여 구슬을 가운데 홈에 놓아봐. 아래 작은 창이 열려.','종이를 펼쳐봐. 작은 테이블에 우리 둘 자리도 있어.','조명을 움직여 같은 게임말의 그림자를 크게, 작게 만들어봐.','세 각도 중 하나에서 흩어진 문양이 도미노로 맞춰져.','직접 그린 그림을 카드로 뒤집어봐. 그림은 이 세션에만 남아.','신호를 보고 같은 순서로 세 막대를 눌러봐. 시간제한은 없어.','선택한 말이 레일 앞뒤를 지나 다시 제자리로 돌아와.','셔터를 열어 우리 사진을 한 장씩, 또는 나란히 봐.','카드와 종이 받침을 펼쳐 앞과 옆에서 봐.','봉인 옆의 작은 밀랍 조각이야. 편지 봉인과는 별개야.','같은 말들의 작은 동작을 네 장으로 앞뒤 넘겨봐.','세 조각을 돌려 길을 이어봐. 편지는 언제든 따로 열 수 있어.','바람을 보내봐. 종이가 살짝 들렸다가 다시 내려와.','말, 보석, 클립을 골라 세 자리 중 한 곳에 두어봐.','카드를 뒤집어봐. 말은 달라도, 같이 놀자는 뜻은 같아.'],es:['Une las fichas haciendo coincidir los números. Empuja la primera y la última abrirá un cajón.','Inclina a los lados para llevar la bolita al centro. Se abre una ventanita debajo.','Despliega el papel. Hay una mesita con un lugar para cada uno.','Mueve la luz para agrandar o reducir la sombra de la figura.','En uno de los tres ángulos, las partes forman un dominó.','Haz un dibujo y voltéalo para ver tu tarjeta. El dibujo solo se conserva durante esta sesión.','Mira la señal y repite el orden de las tres barras. No hay límite de tiempo.','La figura elegida pasa por delante y detrás del riel y vuelve a su lugar.','Abre las ventanas para ver nuestras fotos por separado o juntas.','Despliega la carta y su soporte de papel; míralos de frente y de lado.','Es una muestra de cera, aparte del sello de la carta.','Pasa adelante y atrás las cuatro escenas con las mismas figuras.','Gira las tres piezas para conectar el camino. La carta siempre se puede abrir aparte.','Sopla un poquito. El papel se levanta y vuelve a su lugar.','Elige una figura, gema o clip y colócalo en uno de tres lugares.','Dale la vuelta a la tarjeta. En coreano o en español, la invitación es la misma: jugar juntos.']};
const supply:readonly(readonly[number,number])[]=[[2,3],[4,3],[4,5]];
const pattern=[0,2,1];
const relatedObjects:Record<LocalEventId,LocalEventId[]>={
 L01:['L15','L05','L09','L10'],L02:['L03','L13'],L03:['L13','L16'],L04:['L02','L08','L14'],L05:['L01'],L06:['L12','L07'],L07:['L14','L06'],L08:['L04','L02','L14'],L09:['L01','L10'],L10:['L09','L12'],L11:['L12'],L12:['L03','L13','L16','L11'],L13:['L16','L03'],L14:['L04','L06'],L15:['L01','L05'],L16:['L12']
};
const PREF_KEY=LOCAL_EVENT_PREF_KEY;
function GustPaper({raised,phase,staticPose,ko}:{raised:boolean;phase:number;staticPose:boolean;ko:boolean}){
 const height=(u:number,v:number)=>raised?paperGustHeight(u,v,phase,staticPose):0;
 const project=(u:number,v:number)=>`${(180+u*115+v*25).toFixed(2)},${(96+v*30-height(u,v)*110).toFixed(2)}`;
 const gust=raised?(staticPose?1:Math.sin(Math.PI*phase)):0;
 const gemY=96+gust*1.38*30;
 return <svg className="paper-gust" viewBox="0 0 360 172" role="img" aria-label={ko?'바람에 들리는 한 장의 종이와 그 아래 보석':'Una hoja que se eleva con el aire y la gema debajo'} data-gust-phase={phase.toFixed(3)} data-gem-offset={gust.toFixed(3)}>
  <path d="M38 64 286 64 328 143 80 143Z" fill="#271a24" stroke="#aa8272"/>
  <ellipse cx="180" cy="104" rx="112" ry="27" fill="#120b13" opacity=".32"/>
  <g data-gust-gem="" transform={`translate(${180+gust*1.38*25} ${gemY})`}><path d="M0-12 10 0 0 12-10 0Z" fill="#c7956c"/><path d="M0-12 0 12-10 0Z" fill="#f0c799"/><path d="M0-12 10 0 0-2Z" fill="#ffdfb0"/></g>
  {Array.from({length:128},(_,i)=>{const u=-1+i%16/8,v=-1+Math.floor(i/16)/4,du=1/8,dv=1/4;const slopeU=(height(u+du,v+dv/2)-height(u,v+dv/2))/du,slopeV=(height(u+du/2,v+dv)-height(u+du/2,v))/dv;const light=Math.max(.64,Math.min(1,.9-.16*slopeU-.13*slopeV));const color=`rgb(${Math.round(244*light)} ${Math.round(232*light)} ${Math.round(210*light)})`;return <polygon key={i} points={[project(u,v),project(u+du,v),project(u+du,v+dv),project(u,v+dv)].join(' ')} fill={color} stroke={color} strokeWidth=".55"/>;})}
  <polygon points={[project(-1,-1),project(1,-1),project(1,1),project(-1,1)].join(' ')} fill="none" stroke="#bcaa96" strokeWidth=".8"/>
 </svg>;
}
export default function Details({language,reducedMotion,onEffect,state:s,setState:set,onClose,sceneVisible=false,suspended=false,onSharedEvent,onRegisterFrame}:Props){
 const ko=language==='ko';const domino={placed:[...s.dominoTiles],openEnd:s.dominoTiles.at(-1)?.[1]??2};const tiles=supply.filter(tile=>!s.dominoTiles.some(placed=>placed[0]===tile[0]&&placed[1]===tile[1]||placed[0]===tile[1]&&placed[1]===tile[0]));const [selected,setSelected]=useState(0);const [mismatch,setMismatch]=useState(false);const [input,setInput]=useState<number[]>([]);const [signal,setSignal]=useState(false);const [saveStatus,setSaveStatus]=useState<'saved'|'session'|null>(null);const [cooling,setCooling]=useState<LocalEventId[]>([]);const [gustPhase,setGustPhase]=useState(1);const gustSerial=useRef(-1);const cooldownTimers=useRef<number[]>([]);
 const section=useRef<HTMLElement>(null),svg=useRef<SVGSVGElement>(null),drawing=useRef<number|null>(null),heading=useRef<HTMLHeadingElement>(null),touchFlipHandled=useRef(false),keyboard=useRef(false);const state=useRef(s);state.current=s;const signalTimer=useRef<number[]>([]);const lastPhysical=useRef<Record<string,number>>({});
 const change=useCallback((patch:Partial<LocalEventState>,animate=false)=>set(old=>({...old,...patch,motionInstant:keyboard.current,motionSerial:old.motionSerial+(animate?1:0)})),[set]);
 const stop=useCallback((restoreFocus=true)=>{signalTimer.current.forEach(clearTimeout);signalTimer.current=[];setSignal(false);drawing.current=null;set(old=>({...old,active:null,rhythmSignal:null,waxPressed:false,motionInstant:false}));onEffect('wax-press',0);onClose(restoreFocus);},[onEffect,onClose,set]);
 useEffect(()=>{if(!suspended)heading.current?.focus({preventScroll:true});},[s.active,suspended]);
 useEffect(()=>{if(suspended)return;const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();stop();}};const settle=()=>{const bounds=section.current?.getBoundingClientRect();if(state.current.active&&bounds&&(bounds.bottom<Math.min(innerHeight*.25,200)||bounds.top>innerHeight*.8))stop(false);};addEventListener('keydown',escape);addEventListener('scroll',settle,{passive:true});return()=>{removeEventListener('keydown',escape);removeEventListener('scroll',settle);signalTimer.current.forEach(clearTimeout);cooldownTimers.current.forEach(clearTimeout);};},[stop,suspended]);
 useEffect(()=>{
  if(suspended)return;
  const gust=s.active==='L14';
  if(gust){
   if(!s.windRaised||reducedMotion||s.motionInstant||!s.effectsEnabled){gustSerial.current=s.motionSerial;setGustPhase(1);return;}
   if(gustSerial.current===s.motionSerial)return;
   gustSerial.current=s.motionSerial;setGustPhase(0);
  }else if(s.active!=='L02'||s.ball.settled||reducedMotion||s.motionInstant||!s.effectsEnabled)return;
  let previous=0,accumulator=0,start=0,finished=false;
  const tick=(now:number)=>{
   if(finished)return;
   if(gust){if(!start)start=now;const phase=Math.min(1,Math.max(0,(now-start)/850));setGustPhase(phase);finished=phase===1;return;}
   accumulator+=previous?Math.min(.05,(now-previous)/1000):1/60;previous=now;const steps=Math.floor(accumulator*120);accumulator-=steps/120;if(steps)set(old=>{let ball=old.ball;for(let i=0;i<steps;i++)ball=stepBalance(ball,old.tilt,1/120);return {...old,ball};});
  };
  if(onRegisterFrame){onRegisterFrame(tick);return()=>onRegisterFrame(null);}
  let frame=0;const loop=(now:number)=>{tick(now);if(!finished)frame=requestAnimationFrame(loop);};frame=requestAnimationFrame(loop);return()=>cancelAnimationFrame(frame);
 },[s.active,s.ball.settled,s.windRaised,s.motionSerial,reducedMotion,s.motionInstant,s.effectsEnabled,onRegisterFrame,suspended]);
 function persist(patch:Partial<LocalEventState>,explicitDecor=false){const next={...s,...patch,hasSavedDecor:patch.hasSavedDecor??(explicitDecor||s.hasSavedDecor)};change({...patch,hasSavedDecor:next.hasSavedDecor});try{localStorage.setItem(PREF_KEY,serializeLocalEventPreferences(next));setSaveStatus('saved');}catch{setSaveStatus('session');}}
 function physical(patch:Partial<LocalEventState>){
  const id=s.active;if(!id)return false;const now=performance.now();if(now-(lastPhysical.current[id]??-Infinity)<5000)return false;
  lastPhysical.current[id]=now;setCooling(old=>[...old.filter(value=>value!==id),id]);cooldownTimers.current.push(window.setTimeout(()=>setCooling(old=>old.filter(value=>value!==id)),5000));change(patch,true);return true;
 }
 function reset(){
  const fresh=createLocalEventState(language);
  const fields:Record<LocalEventId,Array<keyof LocalEventState>>={L01:['dominoTiles','dominoFallen','drawerOpen'],L02:['tilt','ball'],L03:['pocketOpen','sideView'],L04:['lightAngle'],L05:['prism'],L06:['strokes','drawingFlipped'],L07:['rhythmSignal','rhythmSolved'],L08:['railStep'],L09:['jokerOpen','jokerView'],L10:['noble','nobleOpen','sideView'],L11:['waxPressed'],L12:['bookPage'],L13:['patchTurns'],L14:['windRaised'],L15:['drawerOpen'],L16:['phraseFlipped']};
  if(s.active)change(Object.fromEntries(fields[s.active].map(key=>[key,fresh[key]])));
  if(s.active==='L01'){change({dominoTiles:[[1,2]],dominoFallen:false,drawerOpen:false});setSelected(0);setMismatch(false);}
  if(s.active==='L07'){setInput([]);setSignal(false);signalTimer.current.forEach(clearTimeout);}
 }
 function place(){const tile=tiles[selected];if(!tile)return;const next=placeDominoTile(domino,tile);if(!next){setMismatch(true);return;}change({dominoTiles:next.placed,dominoFallen:false});setMismatch(false);setSelected(Math.max(0,Math.min(selected,tiles.length-2)));}
 function point(event:PointerEvent<SVGSVGElement>):DrawingPoint{const box=svg.current!.getBoundingClientRect();return {x:Math.max(0,Math.min(100,(event.clientX-box.left)/box.width*100)),y:Math.max(0,Math.min(60,(event.clientY-box.top)/box.height*60))};}
 function addShape(points:DrawingPoint[]){if(s.strokes.reduce((n,line)=>n+line.length,0)+points.length<=200)change({strokes:[...s.strokes,points]});}
 function startDraw(event:PointerEvent<SVGSVGElement>){if(s.drawingFlipped||drawing.current!==null||s.strokes.reduce((n,line)=>n+line.length,0)>=200)return;drawing.current=event.pointerId;event.currentTarget.setPointerCapture(event.pointerId);change({strokes:[...s.strokes,[point(event)]]});}
 function moveDraw(event:PointerEvent<SVGSVGElement>){if(drawing.current!==event.pointerId)return;const p=point(event);set(old=>old.strokes.reduce((n,line)=>n+line.length,0)<200?{...old,strokes:old.strokes.map((line,i)=>i===old.strokes.length-1?[...line,p]:line)}:old);}
 function flipDrawing(){drawing.current=null;set(old=>({...old,drawingFlipped:!old.drawingFlipped,motionInstant:keyboard.current}));}
 function showSignal(){signalTimer.current.forEach(clearTimeout);setInput([]);setSignal(true);change({rhythmSolved:false,rhythmSignal:reducedMotion||keyboard.current?null:pattern[0]});if(reducedMotion||keyboard.current||!s.effectsEnabled)return;pattern.forEach((bar,i)=>{signalTimer.current.push(window.setTimeout(()=>change({rhythmSignal:bar}),i*500));});signalTimer.current.push(window.setTimeout(()=>{change({rhythmSignal:null});setSignal(false);},1500));}
 function pressBar(bar:number){const next=input.length>=3?[bar]:[...input,bar];setInput(next);if(next.length===3)change({rhythmSolved:next.every((v,i)=>v===pattern[i])},true);}
 function waxRelease(){change({waxPressed:false},true);onEffect('wax-press',0);}
 const activeIndex=s.active?localEventIds.indexOf(s.active):-1;const done=isDominoChainComplete(domino);const bridgeDone=s.patchTurns.every((v,i)=>v===[1,2,0][i]);
 const button=(label:string,click:()=>void,pressed?:boolean,disabled=false)=><button className="egg-button" onClick={click} aria-pressed={pressed} disabled={disabled}>{label}</button>;
 return <section ref={section} className={`details-eggs ${sceneVisible?'has-world':''} ${reducedMotion||s.motionInstant||!s.effectsEnabled?'asset-motion-reduced':''}`} aria-labelledby="details-title" onKeyDownCapture={event=>{if(event.key==='Enter'||event.key===' '||event.key.startsWith('Arrow')){keyboard.current=true;set(old=>old.motionInstant?old:{...old,motionInstant:true});}}} onPointerDownCapture={event=>{if(event.isPrimary){touchFlipHandled.current=false;keyboard.current=false;set(old=>old.motionInstant?{...old,motionInstant:false}:old);}}} onClickCapture={event=>{if(event.detail===0){keyboard.current=true;set(old=>old.motionInstant?old:{...old,motionInstant:true});}const handled=touchFlipHandled.current;touchFlipHandled.current=false;if(handled&&event.detail>0){event.preventDefault();event.stopPropagation();}}}>
  {s.active&&<article id="local-event-controls" className="egg-card local-event-controls" data-active-local-event={s.active}>
   <div className="local-event-title"><h3 id="details-title" ref={heading} tabIndex={-1}>{names[language][activeIndex]}</h3><button className="detail-close" onClick={()=>stop()} aria-label={ko?'놀이 닫기':'Cerrar este juego'}>×</button></div><p>{descriptions[language][activeIndex]}</p>
   {s.active==='L01'&&<><div className="domino-row" aria-label={ko?'놓은 도미노':'Dominós colocados'}>{domino.placed.map(([a,b],i)=><div className={`domino-tile ${s.dominoFallen?'fallen':''}`} key={i}><span>{a}</span><i/><span>{b}</span></div>)}</div><div className="domino-pickers">{tiles.map((tile,i)=><button className="egg-button" key={tile.join('-')} aria-pressed={selected===i} onClick={()=>{setSelected(i);setMismatch(false);}}>{tile[0]} · {tile[1]}</button>)}</div><div className="egg-actions"><button className="egg-button" disabled={done||!tiles.length} onClick={place}>{ko?'선택한 타일 놓기':'Colocar ficha elegida'}</button><button className="egg-button egg-primary" disabled={!done||s.dominoFallen||cooling.includes('L01')} onClick={()=>physical({dominoFallen:true,drawerOpen:true})}>{ko?'첫 타일 넘어뜨리기':'Empujar la primera ficha'}</button>{button(ko?'완성 모습 보기':'Ver la cadena completa',()=>change({dominoTiles:[[1,2],[2,3],[3,4],[4,5]],dominoFallen:false}))}{button(ko?'서랍 직접 열기':'Abrir el cajón',()=>change({active:'L15',drawerOpen:true}))}</div>{mismatch&&<p role="status">{ko?'이 끝 숫자와 맞지 않아.':'Ese extremo no coincide.'}</p>}{s.dominoFallen&&<p className="egg-reward">{ko?'딱 맞았네 ㅋㅋㅋ':'¡Encajó! haha'}</p>}</>}
   {s.active==='L02'&&<><svg className={`balance-tray ${s.ball.settled?'settled':''}`} viewBox="0 0 560 240" role="img" aria-label={ko?'구슬 받침과 아래 작은 창':'La bandeja y su ventanita'} style={{transform:`rotate(${-s.tilt}deg)`}}>
    <path d="M180 123V225H380V123" fill="#d6b99b" stroke="#aa8272" strokeWidth="1.5"/>
    <rect x="196" y="139" width="168" height="91" rx="2" fill="#271a24" stroke="#b48e73" strokeWidth="2"/>
    <defs><clipPath id="balance-window-opening"><rect x="203" y="146" width="154" height="77"/></clipPath></defs>
    <g clipPath="url(#balance-window-opening)">
     <image href={pawnSource(s.pawn)} x="250" y="150" width="60" height="73" preserveAspectRatio="xMidYMid meet"/>
     <path d="M203 223H357" stroke="#f4e8d2" strokeWidth="3"/>
     <g className="tray-window-left"><rect x="203" y="146" width="77" height="77" fill="#e5ceb2"/><path d="M273 176V195" stroke="#a77c69" strokeWidth="2"/></g>
     <g className="tray-window-right"><rect x="280" y="146" width="77" height="77" fill="#dec6ac"/><path d="M287 176V195" stroke="#a77c69" strokeWidth="2"/></g>
    </g>
    <path d="M66 70Q280 151 494 70V89Q280 171 66 89Z" fill="#c3a184" stroke="#aa8272" strokeWidth="1.5"/>
    <path d="M66 70Q280 124 494 70L481 49Q280 103 79 49Z" fill="#f4e8d2" stroke="#c5a88e" strokeWidth="1.5"/>
    <path d="M79 63Q280 113 481 63" fill="none" stroke="#d4b79d" strokeWidth="2"/>
    <ellipse className="tray-groove" cx="280" cy="97" rx="16" ry="5" fill="#9f796b"/>
    <circle className="balance-ball" cx={280+s.ball.position*170} cy={s.ball.settled?90:85-30*(s.ball.position/.85)**2} r="9" fill="#7b293d" stroke="#d7a18f" strokeWidth="1.5"/>
   </svg><p aria-live="polite">{ko?`기울기 ${s.tilt}°`:`Inclinación ${s.tilt}°`}{s.ball.settled?(ko?' · 작은 창이 열렸어.':' · Se abrió la ventanita.'):''}</p><div className="egg-actions">{button(ko?'왼쪽':'Izquierda',()=>change({tilt:Math.max(-8,s.tilt-1),ball:reducedMotion||keyboard.current||!s.effectsEnabled?{position:Math.max(-.85,s.ball.position-.1),velocity:0,settled:false}:{...s.ball,settled:false}}))}{button(ko?'수평으로':'Nivelar',()=>change({tilt:0,ball:reducedMotion||keyboard.current||!s.effectsEnabled?stepBalance(s.ball,0,1/120):s.ball}))}{button(ko?'오른쪽':'Derecha',()=>change({tilt:Math.min(8,s.tilt+1),ball:reducedMotion||keyboard.current||!s.effectsEnabled?{position:Math.min(.85,s.ball.position+.1),velocity:0,settled:false}:{...s.ball,settled:false}}))}{button(ko?'완성 모습 보기':'Ver el resultado',()=>change({tilt:0,ball:{position:0,velocity:0,settled:true}}))}</div></>}
   {s.active==='L03'&&<><div className={`pocket-fold ${s.pocketOpen?'open':''}`} data-side-view={s.sideView}><span>◇</span><span>□</span>
    <svg className="pocket-room" display="none" viewBox="0 0 640 390" role="img" aria-label={s.pocketOpen?(ko?'같은 종이를 펼친 두 자리, 작은 테이블과 선택한 게임말':'El mismo papel abierto, con dos asientos, una mesita y la figura elegida'):(ko?'같은 종이를 접은 모습':'La misma hoja de papel doblada')}>
     {s.pocketOpen?<g className="pocket-interior">
      <path d="M63 272 320 196 577 272 320 358Z" fill="#120b13" opacity=".3"/>
      <path d="M52 254 320 180 588 254 320 343Z" fill="#e5ceb2" stroke="#bda38a" strokeWidth="1.2"/>
      <path d="M52 254 52 88 320 35 320 180Z" fill="#f4e8d2" stroke="#c5a88e" strokeWidth="1.2"/>
      <path d="M320 35 588 88 588 254 320 180Z" fill="#dec6ac" stroke="#c5a88e" strokeWidth="1.2"/>
      <path d="M320 36V180L52 254M320 180 588 254M320 180V342" fill="none" stroke="#ad8b75" strokeWidth="1" strokeDasharray="4 5" opacity=".65"/>
      <g fill="#7b293d" stroke="#b77c81" strokeWidth="1">
       <path d="M175 217V165Q196 150 217 165V217L196 227Z"/><path d="M175 217 196 207 224 219 202 231Z" fill="#a66a74"/>
       <path d="M177 219V258L184 261V225M217 222V255L224 252V219" fill="#bc987e" stroke="#bc987e"/>
       <path d="M423 217V165Q444 150 465 165V217L444 227Z"/><path d="M423 217 444 207 472 219 450 231Z" fill="#a66a74"/>
       <path d="M425 219V258L432 261V225M465 222V255L472 252V219" fill="#bc987e" stroke="#bc987e"/>
      </g>
      <path d="M262 268 270 310 278 312 273 269M367 268 362 310 370 307 378 266" fill="#b48e73"/>
      <ellipse cx="320" cy="256" rx="91" ry="29" fill="#e9d4b8" stroke="#bb987c" strokeWidth="1.3"/>
      <path d="M230 258Q320 290 410 258V264Q320 299 230 264Z" fill="#c3a184"/>
      <image href={pawnSource(s.pawn)} x="293" y="202" width="54" height="54" preserveAspectRatio="xMidYMid meet"/>
      <path d="M58 255 320 344 583 256" fill="none" stroke="#f4e8d2" strokeWidth="2"/>
     </g>:<g className="pocket-closed">
      <path d="M95 192 319 146 546 192 320 261Z" fill="#e4ccb0" stroke="#bda38a" strokeWidth="1.3"/>
      <path d="M95 192 319 128 320 245Z" fill="#f4e8d2" stroke="#c5a88e" strokeWidth="1.3"/>
      <path d="M319 128 546 192 320 245Z" fill="#dec6ac" stroke="#c5a88e" strokeWidth="1.3"/>
      <path d="M320 135V239" stroke="#ad8b75" strokeWidth="1" strokeDasharray="4 5"/>
     </g>}
    </svg>
   </div><div className="egg-actions">{button(ko?(s.pocketOpen?'놀이방 접기':'놀이방 펼치기'):(s.pocketOpen?'Doblar la sala':'Abrir la sala'),()=>change({pocketOpen:!s.pocketOpen},true),s.pocketOpen)}{button(ko?'정면 / 옆면':'Frente / lado',()=>change({sideView:!s.sideView}),s.sideView)}</div></>}
   {s.active==='L05'&&<><PrismDomino angle={s.prism} language={language}/><div className="egg-actions">{[0,1,2].map(angle=><button className="egg-button" key={angle} aria-pressed={s.prism===angle} onClick={()=>change({prism:angle as 0|1|2})}>{ko?`각도 ${angle+1}`:`Ángulo ${angle+1}`}</button>)}</div>{s.prism===1&&<a className="egg-button" href="/play?game=domino">{ko?'도미노 열기':'Abrir dominó'}</a>}</>}
   {s.active==='L06'&&<><div className={`drawing-surface ${s.drawingFlipped?'is-card':''}`} data-drawing-view={s.drawingFlipped?'card':'paper'}><svg ref={svg} className="drawing-paper" viewBox="0 0 100 60" role="img" aria-label={s.drawingFlipped?(ko?'네 그림이 담긴 카드':'Tu tarjeta con el mismo dibujo'):(ko?'200점까지 그리는 그림판':'Papel para dibujar, hasta 200 puntos')} onPointerDown={startDraw} onPointerMove={moveDraw} onPointerUp={()=>drawing.current=null} onPointerCancel={()=>drawing.current=null}>{s.strokes.map((line,i)=><polyline key={i} points={line.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke="#7b293d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>)}</svg>{s.drawingFlipped&&<p className="drawing-card-signature">{ko?'Baby에게':'Para ti, Baby.'}</p>}</div>{s.drawingFlipped&&<p className="egg-reward drawing-card-note" role="status">{ko?'이제 네 그림이 카드가 됐어 ♡':'Tu dibujo ya es una tarjeta ♡'}</p>}<div className="egg-actions">{!s.drawingFlipped&&<>{button(ko?'마름모 찍기':'Dibujar rombo',()=>addShape([{x:18,y:30},{x:50,y:12},{x:82,y:30},{x:50,y:50},{x:18,y:30}]))}{button(ko?'선 찍기':'Dibujar línea',()=>addShape([{x:15,y:45},{x:85,y:15}]))}{button(ko?'지우기':'Borrar',()=>change({strokes:[]}))}</>}<button className="egg-button egg-primary" onPointerUp={event=>{if(event.pointerType!=='touch'||!event.isPrimary)return;const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)return;event.preventDefault();touchFlipHandled.current=true;flipDrawing();}} onPointerCancel={()=>{touchFlipHandled.current=false;}} onClick={()=>flipDrawing()} aria-pressed={s.drawingFlipped}>{s.drawingFlipped?(ko?'그림으로 돌아가기':'Volver al dibujo'):(ko?'카드로 뒤집기':'Voltear a tarjeta')}</button></div></>}
   {s.active==='L07'&&<><div className={`rhythm-bars ${s.rhythmSolved?'solved':''}`} data-rhythm-solved={s.rhythmSolved}>
    <svg viewBox="0 0 560 240" aria-hidden="true"><path d="M25 176H88L142 224H25Z" fill="#dec6ac" stroke="#c5a88e"/><path d="M472 176H535V224H418Z" fill="#dec6ac" stroke="#c5a88e"/><path d="M25 176H88V188H25M472 176H535V188H472" fill="#f4e8d2" stroke="#c5a88e"/><path d="M89 177 141 224M471 177 419 224" stroke="#aa8272" strokeWidth="2"/></svg>
    {[0,1,2].map(bar=><button key={bar} className={`rhythm-bar bar-${bar} ${s.rhythmSignal===bar?'signal':''} ${input.includes(bar)?'pressed':''}`} aria-label={`${ko?'막대':'Barra'} ${bar+1}`} onClick={()=>pressBar(bar)}><span/><b>{bar+1}</b></button>)}
   </div><div className="egg-actions">{button(ko?'신호 보기':'Ver señal',showSignal)}{button(ko?'다시 입력':'Repetir',()=>{setInput([]);change({rhythmSolved:false});})}</div>{(reducedMotion||s.motionInstant||!s.effectsEnabled||signal)&&<p>{ko?'순서':'Orden'}: 1 → 3 → 2</p>}<p role="status">{s.rhythmSolved?(ko?'세 막대가 다리가 됐어.':'Las tres barras forman un puente.'):input.length===3?(ko?'신호를 다시 볼 수 있어.':'Puedes volver a ver la señal.'):input.map(i=>i+1).join(' → ')}</p></>}
   {s.active==='L11'&&<><div className={`wax-sample ${s.waxPressed?'pressed':''}`}>{s.stamp==='YL'?'YL':'♡'}</div><div className="egg-actions">{button('YL',()=>{persist({stamp:'YL'});onEffect('wax-stamp',0);},s.stamp==='YL')}{button(ko?'작은 하트':'Corazón',()=>{persist({stamp:'heart'});onEffect('wax-stamp',1);},s.stamp==='heart')}<button className="egg-button egg-primary" aria-pressed={s.waxPressed} disabled={cooling.includes('L11')&&!s.waxPressed} onPointerDown={event=>{if(physical({waxPressed:true})){event.currentTarget.setPointerCapture(event.pointerId);onEffect('wax-press',1);}}} onPointerUp={waxRelease} onPointerCancel={waxRelease} onKeyDown={event=>{if((event.key===' '||event.key==='Enter')&&!event.repeat){event.preventDefault();if(physical({waxPressed:true}))onEffect('wax-press',1);}}} onKeyUp={event=>{if(event.key===' '||event.key==='Enter')waxRelease();}} onBlur={()=>s.waxPressed&&waxRelease()}>{ko?'누르기':'Presionar'}</button></div></>}
   {s.active==='L13'&&<><div className={`paper-bridge ${bridgeDone?'complete':''}`} data-path-connected={bridgeDone}>{s.patchTurns.map((turn,i)=><button className="patch-piece" key={i} aria-label={`${ko?'조각 돌리기':'Girar pieza'} ${i+1}`} data-piece-turn={turn} onClick={()=>change({patchTurns:s.patchTurns.map((v,n)=>n===i?(v+1)%4:v)})}>
    <svg viewBox="0 0 100 100" aria-hidden="true"><g transform={`rotate(${(turn-[1,2,0][i])*90} 50 50)`}>
     <rect width="100" height="100" fill="#f4e8d2"/><path d="M0 99H100" stroke="#c5a88e" strokeWidth="3"/><path d="M89 0V11H100" fill="#dec6ac" stroke="#c5a88e"/>
     <path d={['M0 50H34V25H100','M0 25H50V75H100','M0 75H66V50H100'][i]} fill="none" stroke="#c99a8b" strokeWidth="18" strokeLinejoin="round"/>
     <path className="paper-path" d={['M0 50H34V25H100','M0 25H50V75H100','M0 75H66V50H100'][i]} fill="none" stroke="#7b293d" strokeWidth="12" strokeLinejoin="round"/>
    </g></svg>
   </button>)}</div>{button(ko?'완성 모습 보기':'Ver el resultado',()=>change({patchTurns:[1,2,0]},true))}{bridgeDone&&<p role="status">{ko?'종이 통로가 이어졌어.':'El camino de papel está conectado.'}</p>}</>}
   {s.active==='L14'&&<><GustPaper raised={s.windRaised} phase={gustPhase} staticPose={reducedMotion||s.motionInstant||!s.effectsEnabled} ko={ko}/>{button(ko?'바람 한 번 보내기':'Soplar una vez',()=>{physical({windRaised:true});},undefined,cooling.includes('L14'))}{button(ko?'내려놓기':'Dejar en su lugar',()=>change({windRaised:false}))}</>}
   {s.active==='L16'&&<><div className="phrase-card" lang={(language==='es')!==s.phraseFlipped?'es':'ko'}>{(language==='es')!==s.phraseFlipped?'Vamos a jugar':'같이 놀자'}</div>{button(ko?'같은 카드 뒤집기':'Voltear la misma tarjeta',()=>change({phraseFlipped:!s.phraseFlipped}),s.phraseFlipped)}</>}
   {(['L04','L08','L09','L10','L12','L15'] as LocalEventId[]).includes(s.active)&&<div className="asset-playground"><AssetPlayground language={language} state={s} change={change} physical={physical} cooling={cooling.includes(s.active)} saveDecor={patch=>persist(patch,true)}/></div>}
   <div className="related-objects egg-actions">{relatedObjects[s.active].map(id=><button key={id} className="egg-button" data-local-related={id} onClick={()=>change({active:id,rhythmSignal:null,waxPressed:false,sideView:false})}>{names[language][localEventIds.indexOf(id)]}</button>)}</div>
   {onSharedEvent&&(s.active==='L06'||s.active==='L07'||s.active==='L15')&&<button className="egg-button shared-context-choice" data-shared-event={s.active==='L06'?'R03':s.active==='L07'?'R04':'R02'} onClick={event=>onSharedEvent(s.active==='L06'?'R03':s.active==='L07'?'R04':'R02',event.currentTarget)}>{ko?(s.active==='L06'?'반씩 그려볼까?':s.active==='L07'?'번갈아 해보기':'장식 말 보내기'):(s.active==='L06'?'¿Dibujamos una mitad cada uno?':s.active==='L07'?'Jugar por turnos':'Enviar una figura')}</button>}
   {cooling.includes(s.active)&&<small role="status">{ko?'물건이 제자리에 놓이면 잠깐 기다렸다가 다시 눌러봐.':'Cuando el objeto vuelva a su lugar, espera un momentito antes de repetir.'}</small>}<div className="egg-actions local-event-footer">{button(ko?'이 놀이 처음부터':'Reiniciar este juego',reset)}</div>
  </article>}
  <details className="effects-setting"><summary>{ko?'효과와 저장한 장식':'Efectos y detalles guardados'}</summary><div className="egg-actions">{button(s.effectsEnabled?(ko?'켜짐':'Activados'):(ko?'꺼짐 · 완성 모습':'Desactivados · vista final'),()=>persist({effectsEnabled:!s.effectsEnabled}),s.effectsEnabled)}{button(ko?'저장한 장식 초기화':'Restablecer detalles guardados',()=>persist({decorKind:'gem',decorPawn:0,decorSlot:1,stamp:'YL',hasSavedDecor:false}))}</div></details>{saveStatus&&<small className="preference-status" role="status">{saveStatus==='saved'?(ko?'이 기기에 선택을 저장했어.':'Preferencias guardadas en este dispositivo'):(ko?'이 브라우저에 저장할 수 없어. 지금 세션에서는 유지돼.':'No se pudo guardar en este navegador. Se conserva durante esta sesión.')}</small>}
  <p className="details-footnote">{ko?'Escape로 내려놓을 수 있어.':'Pulsa Escape para dejarlo.'}{s.active==='L06'&&(ko?' 그림은 이 세션에만 남아.':' El dibujo solo se queda durante esta sesión.')}</p>
 </section>;
}

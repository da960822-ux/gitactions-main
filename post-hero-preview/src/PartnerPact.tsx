import {useEffect,useId,useLayoutEffect,useRef,useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import gsap from 'gsap';
import './partner-pact.css';

const responseKey='dos-partner-pact-response-v2';
type Point={x:number;y:number};
export type PactSignature={mode:'drawn';strokes:Point[][]}|{mode:'typed';name:string};
const pointLimit=200;

export function isPactSignature(value:unknown):value is PactSignature{
 if(!value||typeof value!=='object')return false;
 const signature=value as Record<string,unknown>;
 if(signature.mode==='typed')return typeof signature.name==='string'&&signature.name.trim().length>=2&&signature.name.trim().length<=40&&!/[\u0000-\u001f\u007f]/.test(signature.name);
 if(signature.mode!=='drawn'||!Array.isArray(signature.strokes))return false;
 let points=0,movement=0;
 for(const line of signature.strokes){
  if(!Array.isArray(line)||line.length<2)return false;
  let previous:Point|undefined;
  for(const point of line){
   if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y)||point.x<0||point.x>100||point.y<0||point.y>60)return false;
   if(previous)movement+=Math.hypot(point.x-previous.x,point.y-previous.y);
   previous=point;points++;
   if(points>pointLimit)return false;
  }
 }
 return points>=2&&movement>=1.5;
}

export function persistPactResponse(signature:PactSignature|null){
 try{
  if(signature===null){localStorage.removeItem(responseKey);return true;}
  if(!isPactSignature(signature))return false;
  localStorage.setItem(responseKey,JSON.stringify({version:2,signature}));return true;
 }catch{return false;}
}

export function parsePactResponse(raw:string|null):PactSignature|null{
 if(!raw)return null;
 try{const value=JSON.parse(raw) as {version?:unknown;signature?:unknown};return value?.version===2&&isPactSignature(value.signature)?value.signature:null;}
 catch{return null;}
}

function readPactResponse(){
 try{
  return {ok:true,signature:parsePactResponse(localStorage.getItem(responseKey))};
 }catch{return {ok:false,signature:null as PactSignature|null};}
}

export function PartnerPact({language,onResponseChange}:{language:'ko'|'es';onResponseChange?:(accepted:boolean)=>void}){
 const ko=language==='ko',panelId=useId(),titleId=useId(),padId=useId(),reduced=useReducedMotion();
 const opener=useRef<HTMLButtonElement>(null),answerButton=useRef<HTMLButtonElement>(null),signaturePad=useRef<SVGSVGElement>(null),paper=useRef<HTMLElement>(null),title=useRef<HTMLHeadingElement>(null),animateOpening=useRef(false),previousOpen=useRef(false),focusAfterReset=useRef(false),drawing=useRef<number|null>(null);
 const [open,setOpen]=useState(false),[accepted,setAccepted]=useState(false),[pressed,setPressed]=useState(false),[imageFailed,setImageFailed]=useState(false),[storageIssue,setStorageIssue]=useState<'read'|'save'|'reset'|null>(null),[strokes,setStrokes]=useState<Point[][]>([]),[name,setName]=useState(''),[savedSignature,setSavedSignature]=useState<PactSignature|null>(null);
 const typedName=name.trim(),signature:PactSignature|null=typedName.length>=2?{mode:'typed',name:typedName}:isPactSignature({mode:'drawn',strokes})?{mode:'drawn',strokes}:null;
 const readResponse=()=>{const result=readPactResponse();setSavedSignature(result.signature);setAccepted(Boolean(result.signature));setStorageIssue(result.ok?null:'read');};
 useEffect(()=>{readResponse();},[]);
 useEffect(()=>{onResponseChange?.(accepted);},[accepted,onResponseChange]);
 useLayoutEffect(()=>{
  if(open)title.current?.focus({preventScroll:true});
  else if(previousOpen.current)opener.current?.focus({preventScroll:true});
  previousOpen.current=open;
 },[open]);
 useLayoutEffect(()=>{if(focusAfterReset.current&&!accepted){signaturePad.current?.focus({preventScroll:true});focusAfterReset.current=false;}},[accepted]);
 useEffect(()=>{
  if(!open||!paper.current)return;
  paper.current.scrollTop=0;
  if(reduced||!animateOpening.current)return;
  const tween=gsap.fromTo(paper.current,{opacity:.65,rotationX:-9,y:12,clipPath:'inset(0 0 88% 0)'},{opacity:1,rotationX:0,y:0,clipPath:'inset(0 0 0% 0)',duration:.48,ease:'power3.out'});
  return()=>{tween.revert();};
 },[open,reduced]);
 const close=()=>{drawing.current=null;setOpen(false);setPressed(false);};
 const answer=()=>{if(!signature||accepted)return;setSavedSignature(signature);setAccepted(true);setStorageIssue(persistPactResponse(signature)?null:'save');};
 const reset=()=>{focusAfterReset.current=true;setAccepted(false);setSavedSignature(null);setStrokes([]);setName('');setStorageIssue(persistPactResponse(null)?null:'reset');};
 const retry=()=>{if(storageIssue==='read')readResponse();else if(storageIssue==='save'&&savedSignature)setStorageIssue(persistPactResponse(savedSignature)?null:'save');else reset();};
 const point=(event:React.PointerEvent<SVGSVGElement>):Point=>{const rect=event.currentTarget.getBoundingClientRect();return {x:Math.max(0,Math.min(100,(event.clientX-rect.left)/Math.max(1,rect.width)*100)),y:Math.max(0,Math.min(60,(event.clientY-rect.top)/Math.max(1,rect.height)*60))};};
 const startDraw=(event:React.PointerEvent<SVGSVGElement>)=>{if(accepted||drawing.current!==null||strokes.reduce((n,line)=>n+line.length,0)>=pointLimit)return;const first=point(event);drawing.current=event.pointerId;event.currentTarget.setPointerCapture(event.pointerId);setName('');setStrokes(old=>[...old,[first]]);};
 const moveDraw=(event:React.PointerEvent<SVGSVGElement>)=>{if(drawing.current!==event.pointerId)return;const next=point(event);setStrokes(old=>old.reduce((n,line)=>n+line.length,0)<pointLimit?old.map((line,i)=>i===old.length-1?[...line,next]:line):old);};
 const endDraw=(event:React.PointerEvent<SVGSVGElement>,cancelled=false)=>{if(drawing.current!==event.pointerId)return;drawing.current=null;setStrokes(old=>{const line=old.at(-1);if(cancelled||!line||line.length<2||line.slice(1).reduce((distance,p,index)=>distance+Math.hypot(p.x-line[index].x,p.y-line[index].y),0)<1.5)return old.slice(0,-1);return old;});};
 const clear=()=>{drawing.current=null;setStrokes([]);setName('');};
 const mode=signature?.mode??'empty';
 return <div className="partner-pact" data-open={open}>
  <motion.button ref={opener} type="button" className="pp-dolls" hidden={open} aria-expanded={open} aria-controls={panelId} aria-label={ko?'인형과 우리의 약속 열기':'Abrir nuestro pacto con las figuras'} initial={false} animate={{transform:pressed&&!reduced?'scale(.97)':'scale(1)'}} transition={{type:'spring',stiffness:450,damping:32,mass:.6}} onPointerDown={event=>{if(event.pointerType==='mouse'&&!reduced)setPressed(true);}} onPointerUp={()=>setPressed(false)} onPointerLeave={()=>setPressed(false)} onPointerCancel={()=>setPressed(false)} onBlur={()=>setPressed(false)} onClick={event=>{animateOpening.current=event.detail>0;setPressed(false);setOpen(true);}}>
   <img src="/images/story-companions/hanbok-pact-dolls.png" width="1254" height="1254" alt={ko?'붉은 혼례 한복을 입은 신부와 아이보리 차카바나를 입은 신랑 인형':'Figuras de una novia con hanbok rojo y un novio con chacabana marfil'} hidden={imageFailed} draggable="false" onError={()=>setImageFailed(true)}/>
   <span className="pp-doll-caption">{ko?'우리의 약속':'Nuestro pacto'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></span>
   {imageFailed&&<span className="pp-art-status" role="status">{ko?'인형 그림은 못 불러왔지만, 약속은 여기 있어.':'La figura no cargó, pero el pacto está aquí.'}</span>}
  </motion.button>
  <section ref={paper} id={panelId} className="pp-paper" hidden={!open} aria-labelledby={titleId} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}}}>
   <header className="pp-heading"><h3 ref={title} id={titleId} tabIndex={-1}>{ko?'평생 파트너 계약서':'Nuestro pacto para toda la vida'}</h3><button type="button" className="pp-close" onClick={close}>{ko?'접기':'Cerrar'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg></button></header>
   <blockquote>{ko?'Baby, 내일도 그다음 날도 나랑 한 팀 해줄래?':'Baby, ¿hacemos equipo hoy, mañana y todos los días?'}</blockquote>
   <div className="pp-promises">
    <p>{ko?'13시간이나 시차가 나도, 네 하루에 함께하고 싶어. 내 하루도 너랑 나눌게.':'Aunque nos separen trece horas, quiero estar presente en tu día y compartir el mío contigo.'}</p>
    <p>{ko?'보고 싶을 땐 꼭 보고 싶다고 말해줘. 서운한 마음도 들려줘. 네 얘기, 잘 들을게.':'Si me extrañas, dímelo; si algo te duele, también. Quiero escucharte bien.'}</p>
    <p>{ko?'내가 게임에서 져도 언제나 네 편이야. 대신 다음 판은 꼭 같이 해줘 ㅋㅋㅋ':'Aunque pierda, siempre estoy de tu lado. Pero prométeme otra partida, haha.'}</p>
   </div>
   <div className="pp-response" data-signature-mode={mode} data-signature-status={accepted?'signed':signature?'ready':'empty'}>
    {accepted?<div className="pp-signed" role="status">{ko?'서명했어, Baby ♡':'Firmado, Baby ♡'}{savedSignature?.mode==='drawn'?<svg className="pp-signature-mark" viewBox="0 0 100 60" preserveAspectRatio="none" aria-label={ko?'직접 그린 서명':'Firma dibujada'}>{savedSignature.strokes.map((line,index)=><polyline key={index} points={line.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>)}</svg>:<span className="pp-signed-name">{savedSignature?.mode==='typed'?savedSignature.name:''}</span>}</div>:<>
     <p className="pp-signature-label" id={`${padId}-label`}>{ko?'여기에 직접 서명해줘':'Firma aquí con tu propio trazo'}</p>
     <svg ref={signaturePad} id={padId} className="pp-signature-pad" viewBox="0 0 100 60" preserveAspectRatio="none" role="img" tabIndex={0} aria-labelledby={`${padId}-label`} aria-describedby={`${padId}-note`} data-point-count={strokes.reduce((n,line)=>n+line.length,0)} onPointerDown={startDraw} onPointerMove={moveDraw} onPointerUp={event=>endDraw(event)} onPointerCancel={event=>endDraw(event,true)} onLostPointerCapture={event=>endDraw(event,true)}>{strokes.map((line,index)=><polyline key={index} points={line.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>)}</svg>
     <p id={`${padId}-note`} className="pp-signature-note">{ko?'톡 한 번은 서명이 되지 않아.':'Un solo toque no cuenta como firma.'}</p>
     <details className="pp-name-details"><summary>{ko?'직접 쓰기 어렵다면 이름으로 서명':'Si prefieres escribir tu nombre'}</summary><label className="pp-signature-label pp-name-label" htmlFor={`${padId}-name`}>{ko?'이름을 입력해 텍스트로 서명':'Escribe tu nombre como firma'}</label><input className="pp-signature-name" id={`${padId}-name`} value={name} maxLength={40} autoComplete="name" onChange={event=>{setStrokes([]);setName(event.currentTarget.value);}} aria-describedby={`${padId}-name-note`} /><p id={`${padId}-name-note`} className="pp-signature-note">{ko?'이름을 입력하면 손글씨 대신 텍스트로 저장돼.':'El nombre se guarda como texto, no como letra manuscrita.'}</p></details>
     <div className="pp-signature-actions"><button type="button" className="pp-clear" onClick={clear}>{ko?'다시 쓰기':'Borrar y volver a firmar'}</button><button ref={answerButton} type="button" className="pp-answer" disabled={!signature} aria-pressed="false" onClick={answer}>{ko?'서명하고 평생 한 팀 되기 ♡':'Firmar para ser un equipo toda la vida ♡'}</button></div>
    </>}
    <p className="pp-local-note">{ko?'이 서명과 대답은 이 브라우저에만 저장돼.':'Esta firma y respuesta se guardan solo en este navegador.'}</p>
    {storageIssue&&<p className="pp-storage-issue" role="status">{storageIssue==='save'?(ko?'지금 대답은 유지했어. 다음 방문을 위해 저장하지는 못했어.':'Tu respuesta sigue aquí, pero no pudimos guardarla para otra visita.'):storageIssue==='reset'?(ko?'지금 대답은 지웠지만, 저장된 대답을 지우지 못했어.':'Borramos la respuesta de esta visita, pero no la guardada.'):ko?'저장된 서명을 읽지 못했어. 여기서 새로 서명해도 돼.':'No pudimos leer la firma guardada. Puedes firmar aquí.'} <button type="button" onClick={retry}>{ko?'다시 시도':'Intentar de nuevo'}</button></p>}
    {accepted&&<button type="button" className="pp-reset" onClick={reset}>{ko?'내 서명과 대답 지우기':'Borrar mi firma y respuesta'}</button>}
   </div>
  </section>
 </div>;
}

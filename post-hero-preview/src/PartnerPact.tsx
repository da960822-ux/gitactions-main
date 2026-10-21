import {useEffect,useId,useLayoutEffect,useRef,useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import gsap from 'gsap';
import './partner-pact.css';

const responseKey='dos-partner-pact-response-v1';

export function persistPactResponse(accepted:boolean){
 try{if(accepted)localStorage.setItem(responseKey,'yes');else localStorage.removeItem(responseKey);return true;}
 catch{return false;}
}

export function PartnerPact({language,onResponseChange}:{language:'ko'|'es';onResponseChange?:(accepted:boolean)=>void}){
 const ko=language==='ko',panelId=useId(),titleId=useId(),reduced=useReducedMotion();
 const opener=useRef<HTMLButtonElement>(null),answerButton=useRef<HTMLButtonElement>(null),paper=useRef<HTMLElement>(null),title=useRef<HTMLHeadingElement>(null),animateOpening=useRef(false),previousOpen=useRef(false);
 const [open,setOpen]=useState(false),[accepted,setAccepted]=useState(false),[pressed,setPressed]=useState(false),[imageFailed,setImageFailed]=useState(false),[storageIssue,setStorageIssue]=useState<'read'|'save'|'reset'|null>(null);
 const readResponse=()=>{try{setAccepted(localStorage.getItem(responseKey)==='yes');setStorageIssue(null);}catch{setStorageIssue('read');}};
 useEffect(()=>{readResponse();},[]);
 useEffect(()=>{onResponseChange?.(accepted);},[accepted,onResponseChange]);
 useLayoutEffect(()=>{
  if(open)title.current?.focus({preventScroll:true});
  else if(previousOpen.current)opener.current?.focus({preventScroll:true});
  previousOpen.current=open;
 },[open]);
 useEffect(()=>{
  if(!open||!paper.current)return;
  paper.current.scrollTop=0;
  if(reduced||!animateOpening.current)return;
  const tween=gsap.fromTo(paper.current,{opacity:.65,rotationX:-9,y:12,clipPath:'inset(0 0 88% 0)'},{opacity:1,rotationX:0,y:0,clipPath:'inset(0 0 0% 0)',duration:.48,ease:'power3.out'});
  return()=>{tween.revert();};
 },[open,reduced]);
 const close=()=>{setOpen(false);setPressed(false);};
 const answer=()=>{setAccepted(true);setStorageIssue(persistPactResponse(true)?null:'save');};
 const reset=()=>{answerButton.current?.focus({preventScroll:true});setAccepted(false);setStorageIssue(persistPactResponse(false)?null:'reset');};
 const retry=()=>{if(storageIssue==='read')readResponse();else if(storageIssue==='save')answer();else reset();};
 return <div className="partner-pact" data-open={open}>
  <motion.button ref={opener} type="button" className="pp-dolls" hidden={open} aria-expanded={open} aria-controls={panelId} aria-label={ko?'인형과 우리의 약속 열기':'Abrir nuestro pacto con las figuras'} initial={false} animate={{transform:pressed&&!reduced?'scale(.97)':'scale(1)'}} transition={{type:'spring',stiffness:450,damping:32,mass:.6}} onPointerDown={event=>{if(event.pointerType==='mouse'&&!reduced)setPressed(true);}} onPointerUp={()=>setPressed(false)} onPointerLeave={()=>setPressed(false)} onPointerCancel={()=>setPressed(false)} onBlur={()=>setPressed(false)} onClick={event=>{animateOpening.current=event.detail>0;setPressed(false);setOpen(true);}}>
   <img src="/images/story-companions/hanbok-pact-dolls.png" width="1254" height="1254" alt={ko?'붉은 혼례 한복을 입은 신부와 아이보리 차카바나를 입은 신랑 인형':'Figuras de una novia con hanbok rojo y un novio con chacabana marfil'} hidden={imageFailed} draggable="false" onError={()=>setImageFailed(true)}/>
   <span className="pp-doll-caption">{ko?'우리의 약속':'Nuestro pacto'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></span>
   {imageFailed&&<span className="pp-art-status" role="status">{ko?'인형 그림은 못 불러왔지만, 약속은 여기 있어.':'La figura no cargó, pero el pacto está aquí.'}</span>}
  </motion.button>
  <section ref={paper} id={panelId} className="pp-paper" hidden={!open} aria-labelledby={titleId} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}}}>
   <header className="pp-heading"><h3 ref={title} id={titleId} tabIndex={-1}>{ko?'우리의 약속':'Nuestro pacto'}</h3><button type="button" className="pp-close" onClick={close}>{ko?'접기':'Cerrar'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg></button></header>
   <blockquote>{ko?'Baby, 내 평생의 동반자가 되어줄래?':'Baby, ¿quieres ser mi compañera de vida?'}</blockquote>
   <div className="pp-promises">
    <p>{ko?'13시간 차이가 나도, 너랑 얘기할 시간은 챙기고 싶어.':'Aunque nos separen trece horas, quiero hacer tiempo para hablar contigo.'}</p>
    <p>{ko?'보고 싶으면 보고 싶다고, 서운하면 서운하다고 말하자. 나도 잘 들을게.':'Si me extrañas o algo te molesta, dímelo. Yo también voy a hablarte y escucharte.'}</p>
    <p>{ko?'그리고 계속 같이 놀자. 내가 져도 또 할게 ㅋㅋㅋ':'Y sigamos jugando. Aunque pierda, voy a pedir otra partida, haha.'}</p>
   </div>
   <div className="pp-response">
    <button ref={answerButton} type="button" className="pp-answer" aria-pressed={accepted} onClick={answer}>{accepted?(ko?'내 대답: 응, 너랑 함께 ♡':'Mi respuesta: sí, contigo ♡'):(ko?'응, 너랑 함께 ♡':'Sí, contigo ♡')}</button>
    <p className="pp-local-note">{ko?'이 대답은 이 브라우저에만 저장돼.':'Esta respuesta se guarda solo en este navegador.'}</p>
    {storageIssue&&<p className="pp-storage-issue" role="status">{storageIssue==='save'?(ko?'지금 대답은 유지했어. 다음 방문을 위해 저장하지는 못했어.':'Tu respuesta sigue aquí, pero no pudimos guardarla para otra visita.'):storageIssue==='reset'?(ko?'지금 대답은 지웠지만, 저장된 대답을 지우지 못했어.':'Borramos la respuesta de esta visita, pero no la guardada.'):ko?'저장된 대답을 읽지 못했어. 여기서 새로 답해도 돼.':'No pudimos leer tu respuesta guardada. Puedes responder aquí.'} <button type="button" onClick={retry}>{ko?'다시 시도':'Intentar de nuevo'}</button></p>}
    {accepted&&<button type="button" className="pp-reset" onClick={reset}>{ko?'내 대답 지우기':'Borrar mi respuesta'}</button>}
   </div>
  </section>
 </div>;
}

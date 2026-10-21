import {useEffect,useRef,useState} from 'react';
import gsap from 'gsap';
import './rose-gift-finale.css';

const poses=['offer','contact','received'] as const;

export function roseGiftClosingLine(language:'ko'|'es',received:boolean,pactAccepted:boolean){
 if(received&&pactAccepted)return language==='ko'?'약속했으니까, 이제 내 평생 파트너야, Baby. ㅋㅋㅋ':'Ya dijiste que sí, Baby. Ahora eres mi compañera de vida, haha.';
 return language==='ko'?'마지막으로, 내 장미 한 송이.':'Y para terminar, una rosa de mi parte.';
}

export function RoseGiftFinale({language,reducedMotion=false,pactAccepted=false}:{language:'ko'|'es';reducedMotion?:boolean;pactAccepted?:boolean}){
 const ko=language==='ko',titleId='rose-gift-title',root=useRef<HTMLElement>(null),art=useRef<HTMLDivElement>(null);
 const timeline=useRef<gsap.core.Timeline|null>(null),played=useRef(-1),[loaded,setLoaded]=useState(0),[failed,setFailed]=useState(false),[visible,setVisible]=useState(false),[replay,setReplay]=useState(0),[phase,setPhase]=useState('waiting');
 const ready=loaded===7&&!failed;
 useEffect(()=>{
  const el=root.current;if(!el)return;
  const observer=new IntersectionObserver(entries=>setVisible(entries[0].isIntersecting),{threshold:.35});observer.observe(el);
  return()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  const images=art.current?.querySelectorAll<HTMLImageElement>('img');
  images?.forEach((image,index)=>{if(image.complete&&image.naturalWidth)setLoaded(old=>old|1<<index);});
 },[]);
 useEffect(()=>{
  if(!ready||!art.current)return;
  const images=art.current.querySelectorAll('img');
  if(reducedMotion||played.current===replay){gsap.set(images,{opacity:0});gsap.set(images[2],{opacity:1});setPhase('received');return;}
  if(!visible)return;
  played.current=replay;
  gsap.set(images,{opacity:0});gsap.set(images[0],{opacity:1});setPhase('offer');
  // Keep the outgoing registered pose opaque until the incoming pose covers it, avoiding a whole-body alpha dip.
  const sequence=gsap.timeline({onComplete:()=>setPhase('received')});timeline.current=sequence;
  sequence.to(images[1],{opacity:1,duration:.1,ease:'none'},.85)
   .set(images[0],{opacity:0},.95)
   .call(()=>setPhase('contact'),[],.95)
   .to(images[2],{opacity:1,duration:.1,ease:'none'},1.8);
  sequence.set(images[1],{opacity:0},1.9);
  return()=>{sequence.kill();timeline.current=null;gsap.set(images,{clearProps:'opacity'});};
 },[ready,reducedMotion,replay,visible]);
 const playAgain=(event:React.MouseEvent<HTMLButtonElement>)=>{
  if(event.detail===0){timeline.current?.progress(1);setPhase('received');return;}
  setReplay(old=>old+1);
 };
 return <section ref={root} id="rose-gift-finale" className="rose-gift-finale" data-phase={phase} aria-labelledby={titleId}>
  <div className="rg-copy">
   <h3 id={titleId} tabIndex={-1}>{ko?<>Baby,<br/>이건 너한테.</>:<>Baby,<br/>esta es para ti.</>}</h3>
   <p className="rg-last-word" aria-live="polite">{roseGiftClosingLine(language,phase==='received',pactAccepted)}</p>
   <button type="button" className="rg-replay" disabled={!ready||reducedMotion} onClick={playAgain}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/></svg>{ko?'한 번 더 보기':'Ver otra vez'}
   </button>
   {failed&&<p className="rg-status" role="status">{ko?'그림을 불러오지 못했어. Baby, 이 장미는 너한테 주는 거야.':'La ilustración no cargó. Baby, esta rosa es para ti.'}</p>}
  </div>
  <div ref={art} className="rg-art" data-ready={ready||failed} role="img" aria-label={ko?'연석이 리스베스에게 빨간 장미 한 송이를 건네고, 리스베스가 웃으며 받아 드는 장면':'Yeonseok le ofrece una rosa roja a Lisbeth y ella la recibe sonriendo'}>
   {poses.map((pose,index)=><img key={pose} className={`rg-pose rg-pose-${pose}`} src={`/images/rose-gift/${pose}.png`} alt="" aria-hidden="true" draggable="false" width="1199" height="1312" onLoad={()=>setLoaded(old=>old|1<<index)} onError={()=>setFailed(true)}/>)}
  </div>
 </section>;
}

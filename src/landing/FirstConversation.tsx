import {useEffect,useId,useRef,type PointerEvent} from 'react';
import {motion,useSpring,useTransform} from 'motion/react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import './first-conversation.css';
import {ConversationMaterial} from './ConversationMaterial';

const left={
 contact:'M152 350C122 416 234 388 304 420C276 378 234 398 242 428C250 451 284 473 304 490',
 awkward:'M152 350C98 436 310 348 286 430C270 472 346 398 352 440C336 468 344 494 356 510',
 continuous:'M152 350C122 416 286 388 360 440C332 398 290 418 298 448C306 471 340 493 360 510',
};
const right={
 contact:'M568 350C598 416 486 388 416 420C444 378 486 398 478 428C470 451 436 473 416 490',
 awkward:'M568 350C598 416 442 388 368 440C396 398 438 418 430 448C422 471 388 493 368 510',
 continuous:'M568 350C598 416 434 388 360 440C388 398 430 418 422 448C414 471 380 493 360 510',
};
const sharedShape='M0 156C140 54 250 88 360 158C480 238 620 52 720 134L720 376C600 470 488 366 360 426C222 488 88 418 0 478Z';
const portrait='/images/approved-couple-room/approved-character-reference.png';
const portraitMask='/images/approved-couple-room/character-opacity-mask.png';

function CutoutPortrait({className,side,x,y,width,height}:{className:string;side:'yeonseok'|'lisbeth';x:number;y:number;width:number;height:number}){
 const id=useId().replace(/:/g,'');
 const separator='620,0 620,500 622,550 626,575 640,600 655,625 640,660';
 const viewBox=side==='yeonseok'?'0 0 656 660':'610 0 702 660';
 const points=side==='yeonseok'?`0,0 ${separator} 0,660`:`${separator} 1312,660 1312,0`;
 return <svg className={className} x={x} y={y} width={width} height={height} viewBox={viewBox} aria-hidden="true">
  <defs>
   <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width="1312" height="1199" style={{maskType:'luminance'}}>
    <image href={portraitMask} x="0" y="0" width="1312" height="1199"/>
   </mask>
   <clipPath id={`${id}-clip`} clipPathUnits="userSpaceOnUse"><polygon points={points}/></clipPath>
   <linearGradient id={`${id}-fade`} gradientUnits="userSpaceOnUse" x1="0" y1="500" x2="0" y2="640"><stop stopColor="white"/><stop offset="1" stopColor="white" stopOpacity="0"/></linearGradient>
   <mask id={`${id}-fade-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width="1312" height="1199" style={{maskType:'alpha'}}><rect width="1312" height="1199" fill={`url(#${id}-fade)`}/></mask>
  </defs>
  <g clipPath={`url(#${id}-clip)`} mask={`url(#${id}-fade-mask)`}>
   <image href={portrait} x="0" y="0" width="1312" height="1199" mask={`url(#${id}-mask)`}/>
  </g>
 </svg>;
}

export function FirstConversation({language}:{language:'ko'|'es'}){
 const ko=language==='ko',host=useRef<HTMLElement>(null),id=useId().replace(/:/g,'');
 const pressed=useRef(false);
 const intent=useSpring(0,{stiffness:460,damping:34,mass:.65});
 const responseX=useSpring(0,{stiffness:360,damping:30,mass:.65});
 const responseY=useSpring(0,{stiffness:360,damping:30,mass:.65});
 const responseOpacity=useTransform(intent,[0,1],[0,.9]);
 const responseWidth=useTransform(intent,[0,1],[2,4]);
 const reset=()=>{pressed.current=false;intent.set(0);responseX.set(0);responseY.set(0);};
 const respond=(event:PointerEvent<HTMLElement>)=>{
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(event.pointerType==='mouse'&&!matchMedia('(hover: hover) and (pointer: fine)').matches)return;
  const bounds=event.currentTarget.getBoundingClientRect();
  responseX.set(Math.max(-1,Math.min(1,(event.clientX-bounds.left)/bounds.width*2-1))*18);
  responseY.set(Math.max(-1,Math.min(1,(event.clientY-bounds.top)/bounds.height*2-1))*14);
  intent.set(pressed.current?1:.45);
 };
 useEffect(()=>{
  gsap.registerPlugin(ScrollTrigger);
  const media=gsap.matchMedia();
  media.add('(min-width:1001px) and (prefers-reduced-motion: no-preference)',()=>{
   const element=host.current;if(!element)return;
   const beats=element.querySelectorAll('.fc-beat');
   const updateBeat=(trigger:ScrollTrigger)=>{element.dataset.storyBeat=trigger.progress<.34?'contact':trigger.progress<.67?'awkward':'continuous';};
   const timeline=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{id:'first-conversation-thread',trigger:beats[0],start:'center center',endTrigger:beats[2],end:'center center',scrub:true,invalidateOnRefresh:true,onRefresh:updateBeat,onUpdate:updateBeat}});
   timeline.addLabel('contact',0).addLabel('awkward',1).addLabel('continuous',2);
   for(const[side,paths]of[['left',left],['right',right]]as const){
    const targets=element.querySelectorAll(`.fc-${side}-route`);
    timeline.fromTo(targets,{attr:{d:paths.contact}},{attr:{d:paths.awkward},duration:1},'contact')
     .to(targets,{attr:{d:paths.continuous},duration:1},'awkward');
   }
   timeline.fromTo('.fc-portrait-left',{svgOrigin:'190 275',x:-40,y:-8,scale:.94},{x:-20,y:10,scale:.97,duration:1},'contact')
    .to('.fc-portrait-left',{x:0,y:0,scale:1,duration:1},'awkward')
    .fromTo('.fc-portrait-right',{svgOrigin:'511 287',x:40,y:18,scale:.94},{x:0,y:0,scale:1,duration:2},'contact')
    .fromTo('.fc-shared-surface',{opacity:.045},{opacity:.16,duration:2},'contact')
    .fromTo('.fc-daylight',{x:-240},{x:300,duration:2},'contact')
    .fromTo('.fc-thread',{opacity:.42},{opacity:.85,duration:1},'awkward')
    .fromTo('.fc-connection-duration',{opacity:0},{opacity:1,duration:.4},1.6);
   return()=>{delete element.dataset.storyBeat;};
  },host);
  const preference=()=>{pressed.current=false;intent.jump(0);responseX.jump(0);responseY.jump(0);};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  reduced.addEventListener('change',preference);window.addEventListener('blur',preference);document.addEventListener('visibilitychange',preference);
  return()=>{media.revert();reduced.removeEventListener('change',preference);window.removeEventListener('blur',preference);document.removeEventListener('visibilitychange',preference);preference();};
 },[language,intent,responseX,responseY]);

 return <section ref={host} className="first-conversation" id="first-conversation" aria-labelledby="first-conversation-title">
  <div className="fc-layout">
   <div className="fc-story">
    <div className="fc-beat fc-contact">
     <h2 id="first-conversation-title">{ko?<>InterPals에서,<br/>너를 만났어.</>:<>Nos encontramos<br/>en InterPals.</>}</h2>
     <p>{ko?'광주에 있던 나랑, 산토도밍고에 있던 너.':'Yo en Gwangju. Tú en Santo Domingo.'}</p>
    </div>
    <div className="fc-beat fc-awkward">
     <h3>{ko?<>첫인사는,<br/>내가 좀 못했지.</>:<>Mi primera impresión<br/>no fue la mejor.</>}</h3>
     <p>{ko?'내가 좀 무례하게 시작했는데도, 우리 대화는 거기서 끝나지 않았어.':'Al principio fui un poco grosero contigo, pero seguimos hablando.'}</p>
    </div>
    <div className="fc-beat fc-continuous">
     <h3>{ko?<>그런데도,<br/>대화는 계속됐어.</>:<>Y seguimos<br/>hablando.</>}</h3>
     <p>{ko?'서로 다른 시간에 살면서도, 첫날부터 12시간을 쉬지 않고 연락했어.':'Aunque teníamos horarios distintos, ese primer día pasamos doce horas hablando sin parar.'}</p>
     <p className="fc-afterthought">{ko?'Baby, 난 아직도 너랑 할 얘기가 많아.':'Baby, todavía tengo tanto que contarte.'}</p>
    </div>
   </div>
   <figure className="fc-connection" onPointerEnter={respond} onPointerMove={respond} onPointerDown={event=>{pressed.current=true;respond(event);}} onPointerUp={event=>{pressed.current=false;if(event.pointerType==='mouse')respond(event);else reset();}} onPointerLeave={reset} onPointerCancel={reset} aria-label={ko?'InterPals에서 만난 연석과 리스벳. 서툰 첫인사를 지나 첫날 12시간 이어진 대화.':'Yeonseok y Lisbeth se conocieron en InterPals. Pasaron de un comienzo torpe a doce horas de conversación el primer día.'}>
    <div className="fc-shared-surface fc-material-surface" style={{clipPath:`url(#${id}-material-clip)`}}><ConversationMaterial/></div>
    <div className="fc-connection-origin">InterPals</div>
    <div className="fc-person fc-yeonseok"><span>Yeonseok</span><small>{ko?'광주':'Gwangju'}</small></div>
    <div className="fc-person fc-lisbeth"><span>Lisbeth</span><small>Santo Domingo</small></div>
    <svg className="fc-connection-art" viewBox="0 0 720 620" aria-hidden="true">
     <defs>
      <clipPath id={`${id}-surface`}><path d={sharedShape}/></clipPath>
      <clipPath id={`${id}-material-clip`} clipPathUnits="objectBoundingBox"><path d={sharedShape} transform="scale(0.001388888888889 0.001612903225806)"/></clipPath>
     </defs>
     <g className="fc-shared-surface"><path d={sharedShape} fill="#edb7c9"/>
      <g clipPath={`url(#${id}-surface)`}><path className="fc-daylight" d="M-80 0H270L570 620H220Z" fill="#edc2b1"/></g>
     </g>
     <g className="fc-portrait-left"><CutoutPortrait className="fc-face fc-face-yeonseok" side="yeonseok" x={40} y={124} width={300} height={302}/></g>
     <g className="fc-portrait-right"><CutoutPortrait className="fc-face fc-face-lisbeth" side="lisbeth" x={352} y={138} width={318} height={299}/></g>
     <g className="fc-thread"><path className="fc-heart-route fc-left-route" d={left.continuous}/><path className="fc-heart-route fc-right-route" d={right.continuous}/></g>
     <motion.g className="fc-thread-response" style={{opacity:responseOpacity,x:responseX,y:responseY,strokeWidth:responseWidth}}>
      <path className="fc-left-route" d={left.continuous}/><path className="fc-right-route" d={right.continuous}/>
     </motion.g>
    </svg>
    <div className="fc-connection-duration" aria-hidden="true">{ko?<>첫날, <strong>12시간</strong>을 쉬지 않고.</>:<>Ese primer día, <strong>12 horas</strong> sin parar.</>}</div>
    <figcaption className="fc-connection-caption">
     <span className="fc-caption-contact">{ko?'서로 다른 곳에서 시작된 인사.':'Un saludo desde lugares distintos.'}</span><span className="fc-caption-awkward">{ko?'첫인사는 서툴렀어도.':'Aunque mi comienzo fue torpe.'}</span><span className="fc-caption-continuous">{ko?'서로 다른 시간 속, 같은 대화.':'Distintas horas. Una misma conversación.'}</span>
    </figcaption>
   </figure>
  </div>
 </section>;
}

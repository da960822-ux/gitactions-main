import {useCallback,useEffect,useId,useRef,useState} from 'react';
import gsap from 'gsap';
import './rose-gift-finale.css';
import {createRoseFireworks} from './rose-fireworks';

const original='/images/rose-gift/received.png',offerArt='/images/rose-gift/offer.png',body='/images/rose-gift/body-clean.png',flower='/images/rose-gift/rose-single.png',limbs='/images/rose-gift/limb-atlas.png',hands='/images/rose-gift/hand-pose-atlas.png';
let roseGiftArtPreload:Promise<void>|null=null;
export function preloadRoseGiftArt():Promise<void>{
 if(typeof Image==='undefined')return Promise.resolve();
 if(!roseGiftArtPreload)roseGiftArtPreload=Promise.all([original,offerArt,body,flower,limbs,hands].map(src=>new Promise<void>(resolve=>{
  try{
   const image=new Image(),finish=()=>resolve();
   image.onload=finish;image.onerror=finish;image.src=src;
   if(typeof image.decode==='function')void image.decode().then(finish,finish);
   else if(image.complete)finish();
  }catch{resolve();}
 }))).then(()=>undefined);
 return roseGiftArtPreload;
}
const DURATION=3,TRANSFER=1.65,FLOWER_SCALE=.16;
export function roseGiftCanCelebrate(seconds:number,active:boolean){return active&&Number.isFinite(seconds)&&seconds>=DURATION;}
type Point={x:number;y:number};
const turn=(point:Point,pivot:Point,degrees:number):Point=>{const angle=degrees*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),x=point.x-pivot.x,y=point.y-pivot.y;return{x:pivot.x+x*c-y*s,y:pivot.y+x*s+y*c};};
const range=(a:number,b:number,value:number)=>{const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t);};
const add=(a:Point,b:Point):Point=>({x:a.x+b.x,y:a.y+b.y});
const origin={x:0,y:0},donorShoulder={x:522,y:620},donorElbow={x:535,y:663},donorWrist={x:616,y:656},recipientShoulder={x:710,y:620},recipientElbow={x:735,y:688},recipientWrist={x:735,y:610};
function donorArm(upper:number,lower:number){
 const elbow=turn(donorElbow,donorShoulder,upper);
 return{elbow,wrist:turn(turn(donorWrist,donorShoulder,upper),elbow,lower),grip:turn(turn({x:656,y:652},donorShoulder,upper),elbow,lower)};
}
const contactRecipientElbow=turn(recipientElbow,recipientShoulder,52);
const contactDonor=donorArm(-16,0).grip,contactRecipient=turn(turn({x:740,y:575},recipientShoulder,52),contactRecipientElbow,-62);
const contactStemAngle=(Math.atan2(contactDonor.y-contactRecipient.y,contactDonor.x-contactRecipient.x)-Math.atan2(272,57))*180/Math.PI;
const contactStemOffset=turn({x:contactDonor.x-contactRecipient.x,y:contactDonor.y-contactRecipient.y},origin,-contactStemAngle);
/** Two separate contacts on one stem; complete limb cutouts preserve each hand's silhouette. */
export function roseGiftPose(seconds:number){
 const time=Math.max(0,Math.min(DURATION,Number.isFinite(seconds)?seconds:0));
 const offer=range(.15,1.2,time),receive=range(.55,1.2,time),lift=range(1.85,2.85,time),retreat=range(1.85,2.85,time);
 const donor=8-24*offer+16*retreat,elbow=0,donorPose=donorArm(donor,elbow);
 const recipientUpper=52*receive-52*lift,recipient=20-82*receive+62*lift,recipientElbowWorld=turn(recipientElbow,recipientShoulder,recipientUpper);
 const recipientGrip=turn(turn({x:740,y:575},recipientShoulder,recipientUpper),recipientElbowWorld,recipient),recipientWristWorld=turn(turn(recipientWrist,recipientShoulder,recipientUpper),recipientElbowWorld,recipient);
 const handTurn=range(1.05,1.35,time),recipientTurn=30*handTurn,recipientForeshorten=1-.65*handTurn,recipientClosed=time>=1.38,recipientClosedTurn=30*(1-lift),recipientClosedForeshorten=.35+.65*range(1.6,1.95,time),donorOpen=range(1.6,1.9,time);
 const roseAngle=18+(contactStemAngle-18)*offer+(-8-contactStemAngle)*lift,stemOffset=turn(contactStemOffset,origin,roseAngle);
 const rose=time<TRANSFER?donorPose.grip:add(recipientGrip,stemOffset);
 return{time,donor,elbow,donorElbow:donorPose.elbow,donorWrist:donorPose.wrist,donorGrip:donorPose.grip,recipientUpper,recipient,recipientElbow:recipientElbowWorld,recipientWristWorld,recipientGrip,
  roseAngle,rose,stemOffset,recipientTurn,recipientForeshorten,recipientClosed,recipientClosedTurn,recipientClosedForeshorten,donorOpen,
  owner:time<TRANSFER?'donor':'recipient',phase:time<1.2?'offer':time<1.85?'contact':time<DURATION?'receiving':'received'};
}
// Contours follow the approved raster's skin/alpha boundary, never a rectangular body crop.
const armPaths={"donor": "M544,590 L550,594 L556,621 L587,634 L600,636 L618,635 L627,623 L643,616 L652,618 L653,616 L680,615 L688,613 L695,620 L694,628 L685,636 L679,638 L668,638 L667,640 L669,642 L681,648 L697,648 L709,640 L714,641 L720,639 L728,646 L728,649 L716,662 L715,666 L707,676 L699,683 L697,683 L693,678 L701,665 L702,659 L693,662 L693,665 L690,667 L692,670 L690,677 L671,697 L651,697 L621,686 L612,680 L605,679 L552,689 L518,685 L512,683 L504,675 L498,663 L488,635 L489,623 L494,618 L544,590Z", "receiver": "M723,537 L752,542 L757,549 L751,557 L757,560 L767,571 L767,574 L764,576 L766,580 L759,587 L746,588 L757,598 L758,601 L758,607 L755,614 L757,615 L758,627 L769,665 L769,682 L767,688 L758,703 L747,712 L739,712 L731,708 L715,692 L709,682 L707,673 L709,663 L715,659 L722,649 L722,646 L718,646 L714,642 L717,628 L718,608 L701,587 L696,578 L696,574 L698,571 L698,565 L709,543 L714,538 L723,537Z", "support": "M785,598 L791,598 L806,605 L815,607 L823,615 L825,620 L845,646 L873,656 L913,664 L933,664 L931,642 L944,631 L962,623 L986,617 L990,621 L991,626 L993,675 L991,696 L982,721 L975,728 L969,730 L930,726 L890,711 L835,682 L818,679 L802,664 L801,661 L794,661 L795,664 L791,668 L782,666 L775,659 L776,653 L771,647 L772,642 L769,638 L771,628 L765,630 L758,623 L772,605 L785,598Z"};
const roseHole='M658 420L781 420L797 519L819 575L843 742L794 748L762 644L707 565L663 527Z';
export function roseGiftClosingLine(language:'ko'|'es',received:boolean,pactAccepted:boolean){
 if(received&&pactAccepted)return language==='ko'?'네가 사인했으니까, 이제 우리는 평생 함께야, Baby. 내가 제일 좋아하는 내 편, 오래오래 나랑 함께해줘 ♡':'Como firmaste, ahora vamos a estar juntos toda la vida, Baby. Mi persona favorita, quédate conmigo por muchos, muchos años ♡';
 return language==='ko'?'마지막으로, 내 장미 한 송이.':'Y para terminar, una rosa de mi parte.';
}
export function RoseGiftFinale({language,reducedMotion=false,pactAccepted=false,onReceived}:{language:'ko'|'es';reducedMotion?:boolean;pactAccepted?:boolean;onReceived?:()=>void}){
 const ko=language==='ko',id=useId(),titleId='rose-gift-title',root=useRef<HTMLElement>(null),art=useRef<SVGSVGElement>(null);
 const timeline=useRef<gsap.core.Timeline|null>(null),celebrationArt=useRef<HTMLCanvasElement>(null),fireworks=useRef<ReturnType<typeof createRoseFireworks>|null>(null),score=useRef({time:0}),started=useRef(false),notified=useRef(false),receivedCallback=useRef(onReceived),replay=useRef<(instant:boolean)=>void>(()=>{});
 receivedCallback.current=onReceived;
 const [loaded,setLoaded]=useState(0),[failed,setFailed]=useState(false),[visible,setVisible]=useState(false),[pageVisible,setPageVisible]=useState(()=>typeof document==='undefined'||!document.hidden),[phase,setPhase]=useState(reducedMotion?'received':'waiting');
 const celebrated=useRef(false);
 const ready=loaded===63&&!failed,staticArt=reducedMotion||failed,canPlay=useRef(false);
 canPlay.current=visible&&pageVisible&&!staticArt;
 const complete=useCallback((celebrate=false)=>{setPhase('received');if(celebrate&&!celebrated.current&&roseGiftCanCelebrate(score.current.time,canPlay.current)){celebrated.current=true;window.dispatchEvent(new CustomEvent('rose-gift-celebrate'));}if(!notified.current){notified.current=true;receivedCallback.current?.();}},[]);
 useEffect(()=>{const el=root.current;if(!el)return;const observer=new IntersectionObserver(entries=>setVisible(entries[0].isIntersecting&&entries[0].intersectionRatio>=.25),{threshold:.25});observer.observe(el);return()=>observer.disconnect();},[]);
 useEffect(()=>{const update=()=>setPageVisible(!document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
 useEffect(()=>{if(failed||reducedMotion&&(loaded&1)){score.current.time=DURATION;started.current=true;complete();}},[failed,reducedMotion,loaded,complete]);
 useEffect(()=>{
  const svg=art.current;if(!ready||!svg||reducedMotion)return;
   const parts=Object.fromEntries([...svg.querySelectorAll<SVGElement>('[data-rg-joint]')].map(node=>[node.dataset.rgJoint!,node]));
  const paint=()=>{
   const pose=roseGiftPose(score.current.time);
   parts['donor-arm'].setAttribute('transform',`rotate(${pose.donor} 522 620)`);
   parts['donor-wrist-front'].setAttribute('transform',`rotate(${pose.donor} 522 620)`);
   parts['donor-hands'].setAttribute('transform',`rotate(${pose.donor} 522 620)`);
   parts['donor-closed'].setAttribute('transform',`rotate(${pose.donor} 522 620)`);
   parts['recipient-upper'].setAttribute('transform',`rotate(${pose.recipientUpper} 710 620)`);
   parts['recipient-upper-base'].setAttribute('transform',`rotate(${pose.recipientUpper} 710 620)`);
   parts['recipient-lower'].setAttribute('transform',`rotate(${pose.recipient} 735 688)`);
   parts['recipient-open'].setAttribute('transform',`rotate(${pose.recipientUpper} 710 620) rotate(${pose.recipient} 735 688)`);
   parts['recipient-closed'].setAttribute('transform',`rotate(${pose.recipientUpper} 710 620) rotate(${pose.recipient} 735 688)`);
   parts['recipient-open-turn'].setAttribute('transform',`rotate(${pose.recipientTurn} 735 610) translate(735 610) scale(${pose.recipientForeshorten} ${pose.recipientForeshorten}) translate(-735 -610)`);
   parts['recipient-closed-turn'].setAttribute('transform',`rotate(${pose.recipientClosedTurn} 735 610) translate(735 610) scale(${pose.recipientClosedForeshorten} ${pose.recipientClosedForeshorten}) translate(-735 -610)`);
   parts['recipient-open'].setAttribute('visibility',`${pose.recipientClosed?'hidden':'visible'}`);
   parts['recipient-closed'].setAttribute('visibility',`${pose.recipientClosed?'visible':'hidden'}`);
   parts['rose-contact-mask'].setAttribute('fill',`${pose.recipientClosed?'black':'white'}`);
   parts['donor-open-window'].setAttribute('width',`${166*pose.donorOpen}`);
   parts['donor-closed-window'].setAttribute('x',`${590+166*pose.donorOpen}`);
   parts['donor-closed-window'].setAttribute('width',`${166*(1-pose.donorOpen)}`);
   parts.rose.setAttribute('transform',`translate(${pose.rose.x} ${pose.rose.y}) rotate(${pose.roseAngle})`);
   svg.dataset.time=pose.time.toFixed(4);svg.dataset.owner=pose.owner;svg.dataset.roseGrip=`${pose.rose.x.toFixed(3)},${pose.rose.y.toFixed(3)}`;
   setPhase(old=>old===pose.phase?old:pose.phase);
  };
  const play=(instant:boolean)=>{
   timeline.current?.kill();timeline.current=null;
   fireworks.current?.reset();
   if(instant){score.current.time=DURATION;paint();complete();return;}
   score.current.time=0;paint();
   const sequence=gsap.timeline({paused:true,onUpdate:paint,onComplete:()=>complete(true)});timeline.current=sequence;
   sequence.to(score.current,{time:DURATION,duration:DURATION,ease:'none'});started.current=true;if(canPlay.current)sequence.play();
  };
  replay.current=play;paint();
  return()=>{timeline.current?.kill();timeline.current=null;replay.current=()=>{};};
 },[ready,reducedMotion,complete]);
 useEffect(()=>{
  if(!ready||staticArt)return;
  if(visible&&pageVisible){if(!started.current)replay.current(false);else timeline.current?.resume();}else timeline.current?.pause();
 },[ready,staticArt,visible,pageVisible]);
 useEffect(()=>{const canvas=celebrationArt.current;if(!canvas)return;const controller=createRoseFireworks(canvas);fireworks.current=controller;return()=>{controller.dispose();if(fireworks.current===controller)fireworks.current=null;};},[]);
 useEffect(()=>{
  const active=phase==='received'&&roseGiftCanCelebrate(score.current.time,visible&&pageVisible&&!staticArt);
  fireworks.current?.setActive(active);
  if(root.current)root.current.dataset.celebration=staticArt&&phase==='received'?'static':active?'playing':phase==='received'?'paused':'idle';
 },[phase,visible,pageVisible,staticArt]);
 const image=(clip:string)=><image href={original} width="1199" height="1312" clipPath={`url(#${id}-${clip})`} onLoad={()=>setLoaded(old=>old|1)} onError={()=>setFailed(true)}/>;
 return <section ref={root} id="rose-gift-finale" className="rose-gift-finale" data-phase={phase} data-celebration={staticArt&&phase==='received'?'static':'idle'} data-celebration-visible={visible&&pageVisible} aria-labelledby={titleId}>
  <div className="rg-copy"><h3 id={titleId} tabIndex={-1}>{ko?<>Baby,<br/>이건 너한테.</>:<>Baby,<br/>esta es para ti.</>}</h3><p className="rg-last-word" aria-live="polite">{roseGiftClosingLine(language,phase==='received',pactAccepted)}</p>
   <button type="button" className="rg-replay" disabled={!ready||reducedMotion} onClick={event=>replay.current(event.detail===0)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/></svg>{ko?'한 번 더 보기':'Ver otra vez'}</button>
   {failed&&<p className="rg-status" role="status">{ko?'그림을 불러오지 못했어. Baby, 이 장미는 너한테 주는 거야.':'La ilustración no cargó. Baby, esta rosa es para ti.'}</p>}
  </div>
  <div className="rg-art" data-ready={ready||staticArt} data-static={staticArt} role="img" aria-label={ko?'연석이 리스베스에게 빨간 장미 한 송이를 건네고, 리스베스가 웃으며 받아 드는 장면':'Yeonseok le ofrece una rosa roja a Lisbeth y ella la recibe sonriendo'}>
   <div className="rg-celebration-glow" aria-hidden="true"/>
   <canvas ref={celebrationArt} className="rg-celebration" aria-hidden="true" data-trigger="handover-complete" data-running="false" data-burst-count="0"/>
   <img className="rg-static" src={original} alt="" aria-hidden="true" draggable="false" width="1199" height="1312" onLoad={()=>setLoaded(old=>old|1)} onError={()=>setFailed(true)}/>
   <svg ref={art} className="rg-live" viewBox="0 0 1199 1312" preserveAspectRatio="xMidYMax meet" aria-hidden="true" data-rig="complete-limb-handover" data-time="0" data-owner="donor">
    <defs>
     {Object.entries(armPaths).map(([name,path])=><clipPath key={name} id={`${id}-${name}`}><path d={path}/></clipPath>)}
     <mask id={`${id}-fixed`} maskUnits="userSpaceOnUse" x="0" y="0" width="1199" height="1312" style={{maskType:'luminance'}}><rect width="1199" height="1312" fill="white"/>{Object.values(armPaths).map((path,i)=><path key={i} d={path} fill="black" stroke="black" strokeWidth="7"/>)}<path d={roseHole} fill="black"/></mask>
     <mask id={`${id}-body-underlay`} maskUnits="userSpaceOnUse" x="0" y="0" width="1199" height="1312" style={{maskType:'luminance'}}><rect width="1199" height="1312" fill="black"/>{Object.values(armPaths).map((path,i)=><path key={i} d={path} fill="white" stroke="white" strokeWidth="7"/>)}<path d={roseHole} fill="white"/></mask>
     <mask id={`${id}-support-without-stem`} maskUnits="userSpaceOnUse" x="0" y="0" width="1199" height="1312" style={{maskType:'luminance'}}><rect width="1199" height="1312" fill="white"/><path d="M790 657L796 657L800 658L801 660V668H791V660Z" fill="black"/></mask>
     <mask id={`${id}-rose-held-contact`} maskUnits="userSpaceOnUse" x="-164" y="-220" width="328" height="400" style={{maskType:'luminance'}}><rect x="-164" y="-220" width="328" height="400" fill="white"/><rect data-rg-joint="rose-contact-mask" x={-contactStemOffset.x-8} y={-contactStemOffset.y-17} width="16" height="34" fill="white"/></mask>
     <mask id={`${id}-sleeve-without-arm`} maskUnits="userSpaceOnUse" x="0" y="0" width="1199" height="1312" style={{maskType:'luminance'}}><rect width="1199" height="1312" fill="white"/>{Object.values(armPaths).map((path,i)=><path key={i} d={path} fill="black"/>)}<path d={roseHole} fill="black"/></mask>
     <clipPath id={`${id}-donor-forearm`}><path d="M475 570H616V675Q606 679 596 680V730H475Z"/></clipPath>
     <clipPath id={`${id}-donor-sleeve`}><path d="M475 550H585V589L550 610L490 640H475Z"/></clipPath>
     <clipPath id={`${id}-donor-wrist`}><path d="M616 610H756V740H616V679Q600 672 602 650Q600 634 616 623Z"/></clipPath>
     <clipPath id={`${id}-donor-wrist-front`}><path d="M590 638H613Q617 646 617 656Q619 669 611 678L590 684Z"/></clipPath>
     <clipPath id={`${id}-donor-hand-open`}><rect data-rg-joint="donor-open-window" x="590" y="590" width="0" height="150"/></clipPath>
     <clipPath id={`${id}-donor-hand-closed`}><rect data-rg-joint="donor-closed-window" x="590" y="590" width="166" height="150"/></clipPath>
     <clipPath id={`${id}-recipient-forearm`}><rect x="680" y="607" width="120" height="130"/></clipPath>
     <clipPath id={`${id}-recipient-hand-open`}><path d="M660 500H825V627H660Z"/></clipPath>
     <clipPath id={`${id}-recipient-hand-closed`}><path d="M680 510H800V627H680Z"/></clipPath>
     <clipPath id={`${id}-recipient-sleeve`}><path d="M680 570L692 578L701 587L718 608L719 625Q697 618 674 609L669 606Z"/></clipPath>
     <clipPath id={`${id}-recipient-upper`}><path d="M714 619L736 626Q748 639 754 655Q758 677 744 686Q736 692 729 684L731 665Q727 646 714 637Z"/></clipPath>
     <clipPath id={`${id}-atlas-donor`}><rect width="1200" height="887"/></clipPath>
     <clipPath id={`${id}-atlas-recipient`}><rect x="1200" width="574" height="887"/></clipPath>
     <clipPath id={`${id}-hand-atlas-donor`}><rect width="1000" height="887"/></clipPath>
     <clipPath id={`${id}-hand-atlas-recipient`}><rect x="1000" width="774" height="887"/></clipPath>
    </defs>
    <image href={body} width="1199" height="1312" mask={`url(#${id}-body-underlay)`} onLoad={()=>setLoaded(old=>old|2)} onError={()=>setFailed(true)}/>
    <image href={original} width="1199" height="1312" mask={`url(#${id}-fixed)`}/>
    <g data-rg-joint="recipient-open" visibility="visible"><g data-rg-joint="recipient-open-turn"><g clipPath={`url(#${id}-recipient-hand-open)`}><g transform="translate(448 520) scale(.2 .15)" clipPath={`url(#${id}-hand-atlas-recipient)`}><image href={hands} width="1774" height="887"/></g></g></g></g>
    <g data-rg-joint="recipient-closed" visibility="hidden"><g data-rg-joint="recipient-closed-turn"><g clipPath={`url(#${id}-recipient-hand-closed)`}><g transform="matrix(.27972 -.0379 .04548 .2331 306 570)" clipPath={`url(#${id}-atlas-recipient)`}><image href={limbs} width="1774" height="887"/></g></g></g></g>
    <g data-rg-joint="donor-arm" clipPath={`url(#${id}-donor)`}>{image('donor-forearm')}</g>
    <g data-rg-joint="recipient-upper-base">
     <g transform="matrix(1.07902111 -.3607323 .3607323 1.07902111 -306.26433775 210.77171679)"><image href={offerArt} width="1199" height="1312" clipPath={`url(#${id}-recipient-upper)`} onLoad={()=>setLoaded(old=>old|32)} onError={()=>setFailed(true)}/></g>
    </g>
    <image href={original} width="1199" height="1312" clipPath={`url(#${id}-donor-sleeve)`} mask={`url(#${id}-sleeve-without-arm)`}/>
    <image href={original} width="1199" height="1312" clipPath={`url(#${id}-recipient-sleeve)`}/>
    <g data-rg-joint="rose" data-flower-instance="single"><image href={flower} x={-633*FLOWER_SCALE} y={-1050*FLOWER_SCALE} width={1024*FLOWER_SCALE} height={1536*FLOWER_SCALE} mask={`url(#${id}-rose-held-contact)`} onLoad={()=>setLoaded(old=>old|4)} onError={()=>setFailed(true)}/></g>
    <g data-rg-joint="donor-hands">
     <g data-rg-joint="donor-open" clipPath={`url(#${id}-donor-wrist)`}><g clipPath={`url(#${id}-donor-hand-open)`}><g transform="translate(472.08 482.6) scale(.22 .3)" clipPath={`url(#${id}-atlas-donor)`}><image href={limbs} width="1774" height="887"/></g></g></g>
    </g>
    <g data-rg-joint="recipient-upper">
     <g data-rg-joint="recipient-lower">
     <g clipPath={`url(#${id}-recipient-forearm)`}><g transform="matrix(.27972 -.0379 .04548 .2331 306 570)" clipPath={`url(#${id}-atlas-recipient)`}><image href={limbs} width="1774" height="887" onLoad={()=>setLoaded(old=>old|8)} onError={()=>setFailed(true)}/></g></g>
     </g>
    </g>
    <g data-rg-joint="donor-closed" clipPath={`url(#${id}-donor-wrist)`}><g clipPath={`url(#${id}-donor-hand-closed)`}><g transform="translate(496 533.2) scale(.2 .24)" clipPath={`url(#${id}-hand-atlas-donor)`}><image href={hands} width="1774" height="887" onLoad={()=>setLoaded(old=>old|16)} onError={()=>setFailed(true)}/></g></g></g>
    <g data-rg-joint="donor-wrist-front" transform="rotate(8 522 620)">{image('donor-wrist-front')}</g>
    <g mask={`url(#${id}-support-without-stem)`}>{image('support')}</g>
   </svg>
  </div>
 </section>;
}

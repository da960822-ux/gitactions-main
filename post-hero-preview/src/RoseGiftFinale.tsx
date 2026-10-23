import {useCallback,useEffect,useId,useRef,useState} from 'react';
import gsap from 'gsap';
import './rose-gift-finale.css';

const original='/images/rose-gift/received.png',body='/images/rose-gift/body-clean.png',flower='/images/rose-gift/rose-single.png';
let roseGiftArtPreload:Promise<void>|null=null;
export function preloadRoseGiftArt():Promise<void>{
 if(typeof Image==='undefined')return Promise.resolve();
 if(!roseGiftArtPreload)roseGiftArtPreload=Promise.all([original,body,flower].map(src=>new Promise<void>(resolve=>{
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
type Point={x:number;y:number};
const turn=(point:Point,pivot:Point,degrees:number):Point=>{const angle=degrees*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),x=point.x-pivot.x,y=point.y-pivot.y;return{x:pivot.x+x*c-y*s,y:pivot.y+x*s+y*c};};
const range=(a:number,b:number,value:number)=>{const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t);};
const add=(a:Point,b:Point):Point=>({x:a.x+b.x,y:a.y+b.y});
const origin={x:0,y:0},donorShoulder={x:522,y:620},donorElbow={x:535,y:663},donorWrist={x:616,y:656},recipientElbow={x:735,y:688},recipientWrist={x:735,y:610};
function donorArm(upper:number,lower:number){
 const elbow=turn(donorElbow,donorShoulder,upper);
 return{elbow,wrist:turn(turn(donorWrist,donorShoulder,upper),elbow,lower),grip:turn(turn({x:704,y:650},donorShoulder,upper),elbow,lower)};
}
const contactDonor=donorArm(0,-14).grip,contactRecipient=turn({x:740,y:575},recipientElbow,-8);
const contactStemAngle=(Math.atan2(contactDonor.y-contactRecipient.y,contactDonor.x-contactRecipient.x)-Math.atan2(272,57))*180/Math.PI;
const contactStemOffset=turn({x:contactDonor.x-contactRecipient.x,y:contactDonor.y-contactRecipient.y},origin,-contactStemAngle);
/** Two separate contacts on one stem; intact source palms keep their original anatomy. */
export function roseGiftPose(seconds:number){
 const time=Math.max(0,Math.min(DURATION,Number.isFinite(seconds)?seconds:0));
 const offer=range(.15,1.2,time),receive=range(.55,1.2,time),lift=range(1.85,2.85,time),retreat=range(1.85,2.85,time);
 const donor=0,elbow=14-28*offer+14*retreat,donorPose=donorArm(donor,elbow);
 const recipient=-8*receive+8*lift,recipientGrip=turn({x:740,y:575},recipientElbow,recipient),recipientWristWorld=turn(recipientWrist,recipientElbow,recipient);
 const roseAngle=18+(contactStemAngle-18)*offer+(-8-contactStemAngle)*lift,stemOffset=turn(contactStemOffset,origin,roseAngle);
 const rose=time<TRANSFER?donorPose.grip:add(recipientGrip,stemOffset);
 return{time,donor,elbow,donorElbow:donorPose.elbow,donorWrist:donorPose.wrist,donorGrip:donorPose.grip,recipient,recipientElbow,recipientWristWorld,recipientGrip,
  roseAngle,rose,stemOffset,
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
 const timeline=useRef<gsap.core.Timeline|null>(null),score=useRef({time:0}),started=useRef(false),notified=useRef(false),receivedCallback=useRef(onReceived),replay=useRef<(instant:boolean)=>void>(()=>{});
 receivedCallback.current=onReceived;
 const [loaded,setLoaded]=useState(0),[failed,setFailed]=useState(false),[visible,setVisible]=useState(false),[pageVisible,setPageVisible]=useState(()=>typeof document==='undefined'||!document.hidden),[phase,setPhase]=useState(reducedMotion?'received':'waiting');
 const ready=loaded===7&&!failed,staticArt=reducedMotion||failed;
 const complete=useCallback(()=>{setPhase('received');if(!notified.current){notified.current=true;receivedCallback.current?.();}},[]);
 useEffect(()=>{const el=root.current;if(!el)return;const observer=new IntersectionObserver(entries=>setVisible(entries[0].isIntersecting),{threshold:.25});observer.observe(el);return()=>observer.disconnect();},[]);
 useEffect(()=>{const update=()=>setPageVisible(!document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
 useEffect(()=>{if(failed||reducedMotion&&(loaded&1)){score.current.time=DURATION;started.current=true;complete();}},[failed,reducedMotion,loaded,complete]);
 useEffect(()=>{
  const svg=art.current;if(!ready||!svg||reducedMotion)return;
  const parts=Object.fromEntries([...svg.querySelectorAll<SVGGElement>('[data-rg-joint]')].map(node=>[node.dataset.rgJoint!,node]));
  const paint=()=>{
   const pose=roseGiftPose(score.current.time);
   parts['donor-upper'].setAttribute('transform',`rotate(${pose.donor} 522 620)`);
   parts['donor-lower'].setAttribute('transform',`rotate(${pose.elbow} 535 663)`);
   parts['recipient-lower'].setAttribute('transform',`rotate(${pose.recipient} 735 688)`);
   parts.rose.setAttribute('transform',`translate(${pose.rose.x} ${pose.rose.y}) rotate(${pose.roseAngle})`);
   svg.dataset.time=pose.time.toFixed(4);svg.dataset.owner=pose.owner;svg.dataset.roseGrip=`${pose.rose.x.toFixed(3)},${pose.rose.y.toFixed(3)}`;
   setPhase(old=>old===pose.phase?old:pose.phase);
  };
  const play=(instant:boolean)=>{
   timeline.current?.kill();
   if(instant){score.current.time=DURATION;paint();complete();return;}
   score.current.time=0;paint();
   const sequence=gsap.timeline({paused:true,onUpdate:paint,onComplete:complete});timeline.current=sequence;
   sequence.to(score.current,{time:DURATION,duration:DURATION,ease:'none'});started.current=true;sequence.play();
  };
  replay.current=play;paint();
  return()=>{timeline.current?.kill();timeline.current=null;replay.current=()=>{};};
 },[ready,reducedMotion,complete]);
 useEffect(()=>{
  if(!ready||staticArt)return;
  if(visible&&pageVisible){if(!started.current)replay.current(false);else timeline.current?.resume();}else timeline.current?.pause();
 },[ready,staticArt,visible,pageVisible]);
 const image=(clip:string)=><image href={original} width="1199" height="1312" clipPath={`url(#${id}-${clip})`} onLoad={()=>setLoaded(old=>old|1)} onError={()=>setFailed(true)}/>;
 return <section ref={root} id="rose-gift-finale" className="rose-gift-finale" data-phase={phase} aria-labelledby={titleId}>
  <div className="rg-copy"><h3 id={titleId} tabIndex={-1}>{ko?<>Baby,<br/>이건 너한테.</>:<>Baby,<br/>esta es para ti.</>}</h3><p className="rg-last-word" aria-live="polite">{roseGiftClosingLine(language,phase==='received',pactAccepted)}</p>
   <button type="button" className="rg-replay" disabled={!ready||reducedMotion} onClick={event=>replay.current(event.detail===0)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/></svg>{ko?'한 번 더 보기':'Ver otra vez'}</button>
   {failed&&<p className="rg-status" role="status">{ko?'그림을 불러오지 못했어. Baby, 이 장미는 너한테 주는 거야.':'La ilustración no cargó. Baby, esta rosa es para ti.'}</p>}
  </div>
  <div className="rg-art" data-ready={ready||staticArt} data-static={staticArt} role="img" aria-label={ko?'연석이 리스베스에게 빨간 장미 한 송이를 건네고, 리스베스가 웃으며 받아 드는 장면':'Yeonseok le ofrece una rosa roja a Lisbeth y ella la recibe sonriendo'}>
   <img className="rg-static" src={original} alt="" aria-hidden="true" draggable="false" width="1199" height="1312" onLoad={()=>setLoaded(old=>old|1)} onError={()=>setFailed(true)}/>
   <svg ref={art} className="rg-live" viewBox="0 0 1199 1312" preserveAspectRatio="xMidYMax meet" aria-hidden="true" data-rig="intact-contour-handover" data-time="0" data-owner="donor">
    <defs>
     {Object.entries(armPaths).map(([name,path])=><clipPath key={name} id={`${id}-${name}`}><path d={path}/></clipPath>)}
     <mask id={`${id}-fixed`} maskUnits="userSpaceOnUse" x="0" y="0" width="1199" height="1312" style={{maskType:'luminance'}}><rect width="1199" height="1312" fill="white"/>{Object.values(armPaths).map((path,i)=><path key={i} d={path} fill="black" stroke="black" strokeWidth="7"/>)}<path d={roseHole} fill="black"/></mask>
     <mask id={`${id}-support-without-stem`} maskUnits="userSpaceOnUse" x="0" y="0" width="1199" height="1312" style={{maskType:'luminance'}}><rect width="1199" height="1312" fill="white"/><path d="M790 657L796 657L800 658L801 660V668H791V660Z" fill="black"/></mask>
     <clipPath id={`${id}-donor-proximal`}><path d="M478 578H556V704H478Z"/></clipPath>
     <clipPath id={`${id}-donor-middle`}><path d="M526 640Q535 624 562 626L620 612L738 600V710H526Z"/></clipPath>
    </defs>
    <image href={body} width="1199" height="1312" onLoad={()=>setLoaded(old=>old|2)} onError={()=>setFailed(true)}/>
    <image href={original} width="1199" height="1312" mask={`url(#${id}-fixed)`}/>
    <g data-rg-joint="rose" data-flower-instance="single"><image href={flower} x={-633*FLOWER_SCALE} y={-1050*FLOWER_SCALE} width={1024*FLOWER_SCALE} height={1536*FLOWER_SCALE} onLoad={()=>setLoaded(old=>old|4)} onError={()=>setFailed(true)}/></g>
    <g data-rg-joint="donor-upper"><g clipPath={`url(#${id}-donor)`}>{image('donor-proximal')}</g><g data-rg-joint="donor-lower"><g clipPath={`url(#${id}-donor)`}>{image('donor-middle')}</g></g></g>
    <g data-rg-joint="recipient-lower">{image('receiver')}</g>
    <g mask={`url(#${id}-support-without-stem)`}>{image('support')}</g>
   </svg>
  </div>
 </section>;
}

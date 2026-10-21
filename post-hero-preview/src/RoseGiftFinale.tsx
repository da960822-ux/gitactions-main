import {useCallback,useEffect,useId,useRef,useState} from 'react';
import gsap from 'gsap';
import './rose-gift-finale.css';

const original='/images/rose-gift/received.png',offering='/images/rose-gift/offer.png',body='/images/rose-gift/body-clean.png',flower='/images/rose-gift/rose-single.png';
const DURATION=3,TRANSFER=1.5,FLOWER_SCALE=.19;
type Point={x:number;y:number};
const turn=(point:Point,pivot:Point,degrees:number):Point=>{const angle=degrees*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),x=point.x-pivot.x,y=point.y-pivot.y;return{x:pivot.x+x*c-y*s,y:pivot.y+x*s+y*c};};
const range=(a:number,b:number,value:number)=>{const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t);};
const donorShoulder={x:522,y:620},donorElbow={x:535,y:663},donorWrist={x:616,y:656},recipientShoulder={x:720,y:632},recipientWrist={x:735,y:610};
function joints(time:number){
 const reach=range(.1,.9,time),receive=range(.55,1.3,time),lift=range(1.65,2.85,time),release=range(1.55,2.55,time);
 const donor=-34+16*reach+18*release,elbow=6*(1-reach),wrist=-5*(1-reach);
 const recipient=12-72*receive+60*lift,roseAngle=time<TRANSFER?donor-12:-30+22*lift;
 let donorGrip=turn({x:704,y:650},donorWrist,wrist);donorGrip=turn(donorGrip,donorElbow,elbow);donorGrip=turn(donorGrip,donorShoulder,donor);
 const wristWorld=turn(recipientWrist,recipientShoulder,recipient),gripOffset=turn({x:5,y:-35},{x:0,y:0},roseAngle);
 return{donor,elbow,wrist,recipient,recipientWrist:roseAngle-recipient,support:5*(1-lift),donorRelease:range(1.55,1.94,time),recipientClose:range(1.22,1.55,time),roseAngle,donorGrip,recipientGrip:{x:wristWorld.x+gripOffset.x,y:wristWorld.y+gripOffset.y}};
}
/** Deterministic cutout joints; one flower stays attached to its current hand. */
export function roseGiftPose(seconds:number){
 const time=Math.max(0,Math.min(DURATION,Number.isFinite(seconds)?seconds:0)),pose=joints(time);
 const donorFlower=(p:ReturnType<typeof joints>)=>{const offset=turn({x:0,y:-70*FLOWER_SCALE},{x:0,y:0},p.roseAngle);return{x:p.donorGrip.x+offset.x,y:p.donorGrip.y+offset.y};};
 let rose=donorFlower(pose);
 if(time>=TRANSFER){const contact=joints(TRANSFER),held=donorFlower(contact),offset=turn({x:held.x-contact.recipientGrip.x,y:held.y-contact.recipientGrip.y},{x:0,y:0},pose.roseAngle-contact.roseAngle);rose={x:pose.recipientGrip.x+offset.x,y:pose.recipientGrip.y+offset.y};}
 return{...pose,time,rose,owner:time<TRANSFER?'donor':'recipient',phase:time<1.25?'offer':time<1.65?'contact':time<DURATION?'receiving':'received'};
}
// Contours follow the approved raster's skin/alpha boundary, never a rectangular body crop.
const armPaths={"donor": "M544,590 L550,594 L556,621 L587,634 L600,636 L618,635 L627,623 L643,616 L652,618 L653,616 L680,615 L688,613 L695,620 L694,628 L685,636 L679,638 L668,638 L667,640 L669,642 L681,648 L697,648 L709,640 L714,641 L720,639 L728,646 L728,649 L716,662 L715,666 L707,676 L699,683 L697,683 L693,678 L701,665 L702,659 L693,662 L693,665 L690,667 L692,670 L690,677 L671,697 L651,697 L621,686 L612,680 L605,679 L552,689 L518,685 L512,683 L504,675 L498,663 L488,635 L489,623 L494,618 L544,590Z", "receiver": "M723,537 L752,542 L757,549 L751,557 L757,560 L767,571 L767,574 L764,576 L766,580 L759,587 L746,588 L757,598 L758,601 L758,607 L755,614 L757,615 L758,627 L769,665 L769,682 L767,688 L758,703 L747,712 L739,712 L731,708 L715,692 L709,682 L707,673 L709,663 L715,659 L722,649 L722,646 L718,646 L714,642 L717,628 L718,608 L701,587 L696,578 L696,574 L698,571 L698,565 L709,543 L714,538 L723,537Z", "support": "M785,598 L791,598 L806,605 L815,607 L823,615 L825,620 L845,646 L873,656 L913,664 L933,664 L931,642 L944,631 L962,623 L986,617 L990,621 L991,626 L993,675 L991,696 L982,721 L975,728 L969,730 L930,726 L890,711 L835,682 L818,679 L802,664 L801,661 L794,661 L795,664 L791,668 L782,666 L775,659 L776,653 L771,647 L772,642 L769,638 L771,628 L765,630 L758,623 L772,605 L785,598Z"};
const roseHole='M658 420L781 420L797 519L819 575L843 742L794 748L762 644L707 565L663 527Z';
const offerHandPaths={donor:'M566 557L569 557L573 561L573 565L583 560L591 560L597 566L598 571L593 580L599 587L599 593L595 598L597 602L597 610L592 616L593 623L585 633L571 638L567 636L568 627L564 626L564 629L561 631L562 638L560 640L554 641L542 660L531 671L526 673L516 678L497 680L493 678L485 669L479 657L477 646L480 639L486 609L499 601L522 592L524 592L527 596L527 591L533 577L539 571L544 569L548 564L560 562Z',receiver:'M640 574L651 578L659 578L662 581L670 584L676 591L678 591L688 605L691 613L691 618L706 632L708 625L707 610L709 608L720 610L736 616L746 621L750 625L751 631L759 647L759 673L756 686L748 701L740 706L727 704L707 694L698 684L692 678L679 656L672 649L664 649L658 647L646 640L634 640L628 645L622 645L619 642L620 638L629 628L636 626L637 624L629 623L619 628L614 628L608 623L608 621L619 612L625 609L635 608L632 606L612 607L607 603L607 599L610 596L627 591L637 591L645 594L654 594L646 592L639 585L638 576Z'};
export function roseGiftClosingLine(language:'ko'|'es',received:boolean,pactAccepted:boolean){
 if(received&&pactAccepted)return language==='ko'?'약속했으니까, 이제 내 평생 파트너야, Baby. ㅋㅋㅋ':'Ya dijiste que sí, Baby. Ahora eres mi compañera de vida, haha.';
 return language==='ko'?'마지막으로, 내 장미 한 송이.':'Y para terminar, una rosa de mi parte.';
}
export function RoseGiftFinale({language,reducedMotion=false,pactAccepted=false,onReceived}:{language:'ko'|'es';reducedMotion?:boolean;pactAccepted?:boolean;onReceived?:()=>void}){
 const ko=language==='ko',id=useId(),titleId='rose-gift-title',root=useRef<HTMLElement>(null),art=useRef<SVGSVGElement>(null);
 const timeline=useRef<gsap.core.Timeline|null>(null),score=useRef({time:0}),started=useRef(false),notified=useRef(false),receivedCallback=useRef(onReceived),replay=useRef<(instant:boolean)=>void>(()=>{});
 receivedCallback.current=onReceived;
 const [loaded,setLoaded]=useState(0),[failed,setFailed]=useState(false),[visible,setVisible]=useState(false),[pageVisible,setPageVisible]=useState(()=>typeof document==='undefined'||!document.hidden),[phase,setPhase]=useState(reducedMotion?'received':'waiting');
 const ready=loaded===15&&!failed,staticArt=reducedMotion||failed;
 const complete=useCallback(()=>{setPhase('received');if(!notified.current){notified.current=true;receivedCallback.current?.();}},[]);
 useEffect(()=>{const el=root.current;if(!el)return;const observer=new IntersectionObserver(entries=>setVisible(entries[0].isIntersecting),{threshold:.25});observer.observe(el);return()=>observer.disconnect();},[]);
 useEffect(()=>{const update=()=>setPageVisible(!document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
 useEffect(()=>{if(failed||reducedMotion&&(loaded&1)){score.current.time=DURATION;started.current=true;complete();}},[failed,reducedMotion,loaded,complete]);
 useEffect(()=>{
  const svg=art.current;if(!ready||!svg||reducedMotion)return;
  const parts=Object.fromEntries([...svg.querySelectorAll<SVGGElement>('[data-rg-joint]')].map(node=>[node.dataset.rgJoint!,node]));
  const paint=()=>{
   const pose=roseGiftPose(score.current.time);
   for(const name of ['donor-back','donor-front'])parts[name].setAttribute('transform',`rotate(${pose.donor} 522 620)`);
   for(const name of ['donor-elbow-back','donor-elbow-front'])parts[name].setAttribute('transform',`rotate(${pose.elbow} 535 663)`);
   parts['donor-hand'].setAttribute('transform',`rotate(${pose.wrist} 616 656)`);
   for(const name of ['recipient-back','recipient-front'])parts[name].setAttribute('transform',`rotate(${pose.recipient} 720 632)`);
   parts['recipient-hand'].setAttribute('transform',`rotate(${pose.recipientWrist} 735 610)`);
   parts['donor-grip'].setAttribute('opacity',String(1-pose.donorRelease));parts['donor-release'].setAttribute('opacity',String(pose.donorRelease));
   parts['recipient-reach'].setAttribute('opacity',String(1-pose.recipientClose));parts['recipient-grip'].setAttribute('opacity',String(pose.recipientClose));
   for(const name of ['support-back','support-front'])parts[name].setAttribute('transform',`rotate(${pose.support} 966 644)`);
   parts.rose.setAttribute('transform',`translate(${pose.rose.x} ${pose.rose.y}) rotate(${pose.roseAngle})`);
   svg.dataset.time=pose.time.toFixed(4);svg.dataset.owner=pose.owner;svg.dataset.roseGrip=`${pose.rose.x.toFixed(3)},${pose.rose.y.toFixed(3)}`;
   setPhase(old=>old===pose.phase?old:pose.phase);
  };
  const play=(instant:boolean)=>{
   timeline.current?.kill();
   if(instant){score.current.time=DURATION;paint();complete();return;}
   const sequence=gsap.timeline({paused:true,onUpdate:paint,onComplete:complete});timeline.current=sequence;
   if(started.current&&score.current.time>0)sequence.to(score.current,{time:0,duration:Math.min(.9,score.current.time*.3),ease:'power2.inOut'});
   sequence.to(score.current,{time:DURATION,duration:DURATION,ease:'none'});started.current=true;sequence.play();
  };
  replay.current=play;paint();
  return()=>{timeline.current?.kill();timeline.current=null;replay.current=()=>{};};
 },[ready,reducedMotion,complete]);
 useEffect(()=>{
  if(!ready||staticArt)return;
  if(visible&&pageVisible){if(!started.current)replay.current(false);else timeline.current?.resume();}else timeline.current?.pause();
 },[ready,staticArt,visible,pageVisible]);
 const image=(clip:string,skin=false,clear=false)=><image href={original} width="1199" height="1312" clipPath={`url(#${id}-${clip})`} filter={skin?`url(#${id}-${clear?'skin-clear':'skin'})`:undefined} onLoad={()=>setLoaded(old=>old|1)} onError={()=>setFailed(true)}/>;
 const offerHand=(name:'donor'|'receiver')=><g clipPath={`url(#${id}-offer-${name}-skin)`}><image href={offering} width="1199" height="1312" clipPath={`url(#${id}-offer-${name}-wrist)`} filter={`url(#${id}-${name==='receiver'?'skin-clear':'skin'})`} onLoad={()=>setLoaded(old=>old|8)} onError={()=>setFailed(true)}/></g>;
 return <section ref={root} id="rose-gift-finale" className="rose-gift-finale" data-phase={phase} aria-labelledby={titleId}>
  <div className="rg-copy"><h3 id={titleId} tabIndex={-1}>{ko?<>Baby,<br/>이건 너한테.</>:<>Baby,<br/>esta es para ti.</>}</h3><p className="rg-last-word" aria-live="polite">{roseGiftClosingLine(language,phase==='received',pactAccepted)}</p>
   <button type="button" className="rg-replay" disabled={!ready||reducedMotion} onClick={event=>replay.current(event.detail===0)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/></svg>{ko?'한 번 더 보기':'Ver otra vez'}</button>
   {failed&&<p className="rg-status" role="status">{ko?'그림을 불러오지 못했어. Baby, 이 장미는 너한테 주는 거야.':'La ilustración no cargó. Baby, esta rosa es para ti.'}</p>}
  </div>
  <div className="rg-art" data-ready={ready||staticArt} data-static={staticArt} role="img" aria-label={ko?'연석이 리스베스에게 빨간 장미 한 송이를 건네고, 리스베스가 웃으며 받아 드는 장면':'Yeonseok le ofrece una rosa roja a Lisbeth y ella la recibe sonriendo'}>
   <img className="rg-static" src={original} alt="" aria-hidden="true" draggable="false" width="1199" height="1312" onLoad={()=>setLoaded(old=>old|1)} onError={()=>setFailed(true)}/>
   <svg ref={art} className="rg-live" viewBox="0 0 1199 1312" preserveAspectRatio="xMidYMax meet" aria-hidden="true" data-rig="registered-cutout" data-time="0" data-owner="donor">
    <defs>
     {Object.entries(armPaths).map(([name,path])=><clipPath key={name} id={`${id}-${name}`}><path d={path}/></clipPath>)}
     {Object.entries(offerHandPaths).map(([name,path])=><clipPath key={name} id={`${id}-offer-${name}-skin`}><path d={path}/></clipPath>)}
     <mask id={`${id}-fixed`} maskUnits="userSpaceOnUse" x="0" y="0" width="1199" height="1312" style={{maskType:'luminance'}}><rect width="1199" height="1312" fill="white"/>{Object.values(armPaths).map((path,i)=><path key={i} d={path} fill="black" stroke="black" strokeWidth="7"/>)}<path d={roseHole} fill="black"/></mask>
     <filter id={`${id}-skin`} colorInterpolationFilters="sRGB"><feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  30 -30 0 1 0"/><feComponentTransfer result="skin"><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer><feComposite in="SourceGraphic" in2="skin" operator="in"/></filter>
     <filter id={`${id}-skin-clear`} colorInterpolationFilters="sRGB"><feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  30 -30 0 1 0"/><feComponentTransfer result="warm"><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer><feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  8 0 0 0 -1.25"/><feComponentTransfer result="skin"><feFuncA type="discrete" tableValues="0 1"/></feComponentTransfer><feComposite in="skin" in2="warm" operator="in" result="mask"/><feComposite in="SourceGraphic" in2="mask" operator="in"/></filter>
     <linearGradient id={`${id}-wrist-skin`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ef9b6c"/><stop offset="1" stopColor="#fcc08e"/></linearGradient>
     <clipPath id={`${id}-offer-donor-wrist`}><path d="M527 550H607V645H549Q532 645 518 636V606Z"/></clipPath>
     <clipPath id={`${id}-offer-receiver-wrist`}><path d="M600 565H697V626Q689 644 676 654H600Z"/></clipPath>
     <clipPath id={`${id}-donor-proximal`}><rect x="478" y="578" width="72" height="126"/></clipPath>
     <clipPath id={`${id}-donor-middle`}><rect x="530" y="590" width="104" height="120"/></clipPath>
     <clipPath id={`${id}-donor-palm`}><rect x="614" y="602" width="122" height="108"/></clipPath>
     <clipPath id={`${id}-donor-bridge`}><path d="M608 633Q635 631 657 639L663 672Q642 689 608 681Z"/></clipPath>
     <clipPath id={`${id}-receiver-middle`}><path d="M712 606Q734 595 755 608L780 735H688V635Z"/></clipPath>
     <clipPath id={`${id}-receiver-palm`}><path d="M688 526H778V612Q755 642 717 625L688 612Z"/></clipPath>
     <clipPath id={`${id}-support-middle`}><rect x="818" y="592" width="184" height="146"/></clipPath>
     <clipPath id={`${id}-support-palm`}><rect x="748" y="590" width="88" height="110"/></clipPath>
    </defs>
    <image href={body} width="1199" height="1312" onLoad={()=>setLoaded(old=>old|2)} onError={()=>setFailed(true)}/>
    <image href={original} width="1199" height="1312" mask={`url(#${id}-fixed)`}/>
    <g data-rg-joint="donor-back"><g clipPath={`url(#${id}-donor)`}>{image('donor-proximal',true)}</g><g data-rg-joint="donor-elbow-back"><g clipPath={`url(#${id}-donor)`}>{image('donor-middle',true)}</g></g></g>
    <g data-rg-joint="recipient-back"><g clipPath={`url(#${id}-receiver)`}><path d="M714 602Q735 590 753 607L765 646Q747 658 715 635Z" style={{fill:`url(#${id}-wrist-skin)`,stroke:'none'}}/>{image('receiver-middle',true,true)}</g></g>
    <g data-rg-joint="support-back" clipPath={`url(#${id}-support)`}>{image('support-middle',true)}</g>
    <g data-rg-joint="rose" data-flower-instance="single"><image href={flower} x={-600*FLOWER_SCALE} y={-830*FLOWER_SCALE} width={1024*FLOWER_SCALE} height={1536*FLOWER_SCALE} onLoad={()=>setLoaded(old=>old|4)} onError={()=>setFailed(true)}/></g>
    <g data-rg-joint="donor-front"><g data-rg-joint="donor-elbow-front"><g data-rg-joint="donor-hand"><g data-rg-joint="donor-grip"><g clipPath={`url(#${id}-donor)`}>{image('donor-bridge',true)}</g><g transform="translate(704 650) rotate(31.75) scale(.95) translate(-566 -602)">{offerHand('donor')}</g></g><g data-rg-joint="donor-release" opacity="0" clipPath={`url(#${id}-donor)`}>{image('donor-palm',true)}</g></g></g></g>
    <g data-rg-joint="recipient-front"><g data-rg-joint="recipient-hand"><g data-rg-joint="recipient-reach" transform="translate(735 610) rotate(70) scale(.75) translate(-685 -637)">{offerHand('receiver')}</g><g data-rg-joint="recipient-grip" opacity="0" clipPath={`url(#${id}-receiver)`}>{image('receiver-palm',true,true)}</g></g></g>
    <g data-rg-joint="support-front" clipPath={`url(#${id}-support)`}>{image('support-palm',true)}</g>
   </svg>
  </div>
 </section>;
}

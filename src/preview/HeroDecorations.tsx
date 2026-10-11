import type {CSSProperties} from 'react';
const stars=[[8,13,10],[17,29,5],[28,21,12],[11,57,6],[24,62,8],[7,76,4],[19,45,4],[26,40,6],[78,9,8],[89,23,11],[95,39,5],[83,46,5],[94,61,12],[80,69,6],[88,79,4],[31,8,4]];
const hearts=[[14,37,32,0,-18],[24,14,25,2,16],[87,13,30,1,20],[91,56,34,2,-14]];
export function HeroDecorations(){return <div className="rd-hero-decorations" aria-hidden="true">
 <img className="rd-cosmic-veil" src="/images/landing-preview/hero/nebula-fringe.png" width="1440" height="816" alt=""/>
 {stars.map(([x,y,size],i)=><span key={i} className={`rd-star ${i%4===0?'rd-star-twinkle':''}`} style={{left:`${x}%`,top:`${y}%`,width:size,height:size,opacity:i%3===0?.8:.42,animationDelay:`${i*.7}s`}}/>)}
 {hearts.map(([x,y,size,color,angle],i)=><img key={i} className="rd-tiny-heart" src={`/images/landing-preview/hero/heart-${color}-neutral.png`} width={size} height={size} alt="" style={{left:`${x}%`,top:`${y}%`,width:size,transform:`rotate(${angle}deg)`} as CSSProperties}/>)}
 <span className="rd-meteor"/>
 <div className="rd-hero-sparks" data-particle-count="0"/>
 </div>;}

export function attachHeroSparks(hero:HTMLElement,paused:boolean){
 const host=hero.querySelector<HTMLElement>('.rd-hero-sparks')!,fine=matchMedia('(hover:hover) and (pointer:fine)'),particles=new Map<HTMLElement,Animation>();let last=0,lastX=-1000,lastY=-1000,visible=true,meteorCount=0;const meteor=hero.querySelector<HTMLElement>('.rd-meteor')!;let meteorAnimation:Animation|undefined;
 const emit=(event:PointerEvent)=>{
  const now=performance.now();if(paused||!visible||!fine.matches||document.hidden||now-last<750||Math.hypot(event.clientX-lastX,event.clientY-lastY)<80||particles.size+4>8)return;
  if((event.target as Element).closest('button,a'))return;
  for(const node of hero.querySelectorAll('.rd-couple,.rd-baby-plane,.rd-message-plane,.rd-actions')){const r=node.getBoundingClientRect();if(event.clientX>=r.left-18&&event.clientX<=r.right+18&&event.clientY>=r.top-18&&event.clientY<=r.bottom+18)return;}
  const box=hero.getBoundingClientRect();last=now;lastX=event.clientX;lastY=event.clientY;
  for(let i=0;i<4;i++){const node=document.createElement('span');node.className=i===1?'rd-spark-heart':'rd-star rd-spark-star';node.style.left=`${event.clientX-box.left}px`;node.style.top=`${event.clientY-box.top}px`;if(i===1)node.style.backgroundImage="url('/images/landing-preview/hero/heart-1-neutral.png')";host.appendChild(node);const angle=i*Math.PI/2+.35,dx=Math.cos(angle)*38,dy=Math.sin(angle)*30-10;
   const animation=node.animate([{opacity:0,transform:'translate3d(0,0,0) scale(.95)'},{opacity:.9,offset:.18,transform:`translate3d(${dx*.3}px,${dy*.3}px,0) scale(1.06)`},{opacity:0,transform:`translate3d(${dx}px,${dy}px,0) scale(.95)`}],{duration:650,easing:'cubic-bezier(0.23,1,0.32,1)'});particles.set(node,animation);animation.finished.catch(()=>{}).finally(()=>{particles.delete(node);node.remove();host.dataset.particleCount=String(particles.size);});
  }host.dataset.particleCount=String(particles.size);
 };
 const passMeteor=()=>{if(!visible||document.hidden||meteorAnimation)return;const right=meteorCount++%2===0;meteor.style.left=right?'88%':'14%';meteor.style.top=right?'13%':'20%';meteor.style.rotate=right?'146deg':'34deg';meteorAnimation=meteor.animate([{opacity:0,transform:'translate3d(0,0,0)'},{opacity:.7,offset:.22,transform:`translate3d(${right?-28:28}px,18px,0)`},{opacity:0,transform:`translate3d(${right?-110:110}px,70px,0)`}],{duration:1100,easing:'linear'});meteorAnimation.finished.catch(()=>{}).finally(()=>{meteorAnimation=undefined;});};
 const updateVisibility=()=>{hero.dataset.decorVisible=String(visible&&!document.hidden);if(!visible||document.hidden)meteorAnimation?.cancel();};
 const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;updateVisibility();});let first:number|undefined,repeat:number|undefined;if(!paused){hero.addEventListener('pointermove',emit);observer.observe(hero);document.addEventListener('visibilitychange',updateVisibility);first=window.setTimeout(passMeteor,4500);repeat=window.setInterval(passMeteor,15000);}
 return()=>{observer.disconnect();document.removeEventListener('visibilitychange',updateVisibility);clearTimeout(first);clearInterval(repeat);meteorAnimation?.cancel();hero.removeEventListener('pointermove',emit);particles.forEach((animation,node)=>{animation.cancel();node.remove();});particles.clear();host.dataset.particleCount='0';};
}

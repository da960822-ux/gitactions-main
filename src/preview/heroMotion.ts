export function attachHeroMotion(hero:HTMLElement,paused:boolean){
 const portrait=hero.querySelector<HTMLElement>('.rd-couple-drift')!,title=hero.querySelector<HTMLElement>('.rd-baby-plane')!,message=hero.querySelector<HTMLElement>('.rd-message-plane')!,light=hero.querySelector<HTMLElement>('.rd-scene-light')!,fill=hero.querySelector<HTMLElement>('.rd-scene-fill')!,shadow=hero.querySelector<HTMLElement>('.rd-scene-shadow')!,floor=hero.querySelector<HTMLElement>('.rd-scene-floor-light')!;
 const cursor=document.createElement('span');cursor.className='rd-scene-cursor';cursor.setAttribute('aria-hidden','true');
 const pointer=matchMedia('(min-width:751px) and (hover:hover) and (pointer:fine)');let targetX=0,targetY=0,targetDepth=0,x=0,y=0,depth=0,vx=0,vy=0,vd=0,last=0,elapsed=0,frame=0,visible=true;
 const draw=()=>{const ambient=paused?0:Math.sin(elapsed*.22)*21;
  portrait.style.transform=Math.abs(x)+Math.abs(y)+Math.abs(depth)<.0001?'none':`perspective(1600px) translate3d(${x*16}px,${y*10}px,0) rotateY(${x*1.2}deg) rotateX(${-y*.8}deg) scale(${1+depth*.025})`;
  title.style.transform=`translate3d(${-x*8}px,${-y*4}px,0)`;message.style.transform=`translate3d(${x*3}px,${y*2}px,0)`;
  light.style.transform=`translate3d(${x*95+ambient}px,${y*36}px,0) rotate(${-12+x*7}deg)`;fill.style.transform=`translate3d(${-x*45-ambient*.6}px,${-y*18}px,0)`;
  shadow.style.transform=`translate3d(${-x*24}px,${-y*8}px,0) scale(${1-depth*.07})`;floor.style.transform=`translate3d(${-x*35+ambient*.4}px,${y*5}px,0) scale(${1+depth*.12})`;light.style.opacity=String(.85+depth*.15);
  floor.style.opacity=String(.65+Math.abs(x)*.08);hero.dataset.sceneMotion=JSON.stringify({x,y,depth,scale:1+depth*.025,portrait:[x*16,y*10],light:[x*95+ambient,y*36],title:[-x*8,-y*4]});
 };
 const tick=(now:number)=>{const dt=last?Math.min(.25,(now-last)/1000):0;last=now;if(visible&&!document.hidden){elapsed+=dt;const steps=Math.max(1,Math.ceil(dt*120)),h=dt/steps;
   // The same mass 1 / stiffness 100 / damping 10 spring retargets every scene layer.
   for(let i=0;i<steps;i++){vx+=(100*(targetX-x)-10*vx)*h;vy+=(100*(targetY-y)-10*vy)*h;x+=vx*h;y+=vy*h;vd+=(100*(targetDepth-depth)-10*vd)*h;depth+=vd*h;}draw();
  }frame=requestAnimationFrame(tick);
 };
 const leave=()=>{targetX=0;targetY=0;targetDepth=0;cursor.style.opacity='0';hero.dataset.sceneInput='idle';};
 const move=(event:PointerEvent)=>{if(!pointer.matches||paused)return;const box=hero.getBoundingClientRect();targetX=Math.max(-1,Math.min(1,(event.clientX-box.left)/box.width*2-1));targetY=Math.max(-1,Math.min(1,(event.clientY-box.top)/box.height*2-1));targetDepth=Math.max(0,1-Math.hypot(targetX*1.25,(targetY-.15)*1.15));cursor.style.transform=`translate3d(${event.clientX-box.left-12}px,${event.clientY-box.top-12}px,0)`;cursor.style.opacity='1';hero.dataset.sceneInput='pointer';};
 draw();hero.dataset.sceneInput='idle';if(paused){hero.dataset.sceneMode='paused';return()=>{};}
 hero.dataset.sceneMode='running';hero.appendChild(cursor);hero.addEventListener('pointermove',move);hero.addEventListener('pointerleave',leave);pointer.addEventListener('change',leave);
 const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(!visible)leave();});observer.observe(hero);frame=requestAnimationFrame(tick);
 return()=>{cancelAnimationFrame(frame);observer.disconnect();hero.removeEventListener('pointermove',move);hero.removeEventListener('pointerleave',leave);pointer.removeEventListener('change',leave);cursor.remove();};
}

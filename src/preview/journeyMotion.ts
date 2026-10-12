export function attachJourneyMotion(page:HTMLElement,paused:boolean){
 const letter=page.querySelector<HTMLElement>('.rd-letter-section')!,rose=page.querySelector<HTMLElement>('.rd-rose-gift')!,parts=[...rose.querySelectorAll<HTMLElement>('img')];
 const desktop=matchMedia('(min-width:1024px) and (pointer:fine)');let frame=0,top=0,active=true;
 const draw=()=>{frame=0;const arrival=paused||!desktop.matches?1:Math.max(0,Math.min(1,(innerHeight-top+scrollY)/(innerHeight*.55)));parts.forEach(part=>{part.style.transform=`translate3d(0,${(1-arrival)*24}px,0) rotate(${18-(1-arrival)*2}deg)`;part.style.opacity=String(.65+.35*arrival);});rose.dataset.arrival=String(arrival);};
 const measure=()=>{top=letter.getBoundingClientRect().top+scrollY;draw();};
 const schedule=()=>{if(!frame&&!document.hidden)frame=requestAnimationFrame(draw);};
 const resize=new ResizeObserver(measure);resize.observe(letter);document.fonts.ready.then(()=>{if(active)measure();});measure();
 if(!paused){window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);}
 return()=>{active=false;cancelAnimationFrame(frame);resize.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);};
}

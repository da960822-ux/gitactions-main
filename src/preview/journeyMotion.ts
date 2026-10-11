export function attachJourneyMotion(page:HTMLElement,paused:boolean){
 const journey=page.querySelector<HTMLElement>('.rd-journey')!,hero=page.querySelector<HTMLElement>('.rd-hero')!,games=page.querySelector<HTMLElement>('.rd-games')!,letter=page.querySelector<HTMLElement>('.rd-letter-section')!,rose=page.querySelector<HTMLElement>('.rd-rose-gift')!,svg=page.querySelector<SVGSVGElement>('.rd-journey-thread')!,path=svg.querySelector<SVGPathElement>('path')!,glint=svg.querySelector<SVGCircleElement>('circle')!;
 const desktop=matchMedia('(min-width:1024px) and (pointer:fine)');let frame=0,origin=0,distance=1,length=0;
 const draw=()=>{frame=0;const still=paused||!desktop.matches,progress=still?1:Math.max(0,Math.min(1,(scrollY-origin)/distance)),point=path.getPointAtLength(progress*length);glint.style.transform=`translate(${point.x}px,${point.y}px)`;glint.style.opacity=progress>0&&progress<1?'.85':'0';svg.dataset.progress=String(progress);
  const arrival=still?1:Math.max(0,Math.min(1,(innerHeight-letter.getBoundingClientRect().top)/(innerHeight*.55)));rose.style.transform=`translate3d(0,${(1-arrival)*24}px,0) rotate(${(1-arrival)*-2}deg)`;rose.style.opacity=String(.65+.35*arrival);rose.dataset.arrival=String(arrival);
 };
 const measure=()=>{const width=journey.clientWidth,height=journey.clientHeight,heroHeight=hero.offsetHeight,gameTop=games.offsetTop;svg.setAttribute('viewBox',`0 0 ${width} ${height}`);path.setAttribute('d',`M ${width*.79} ${heroHeight*.66} C ${width*.87} ${heroHeight*.70}, ${width*.985} ${heroHeight*.70}, ${width*.985} ${heroHeight*.82} S ${width*.985} ${heroHeight+36}, ${width*.96} ${heroHeight+90} S ${width*.96} ${gameTop-26}, ${width*.82} ${gameTop+48}`);length=path.getTotalLength();origin=journey.getBoundingClientRect().top+scrollY;distance=Math.max(1,gameTop-innerHeight*.4);draw();};
 const schedule=()=>{if(!frame&&!document.hidden)frame=requestAnimationFrame(draw);};
 const resize=new ResizeObserver(measure);resize.observe(journey);resize.observe(hero);resize.observe(letter);measure();
 if(!paused){window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);}
 return()=>{cancelAnimationFrame(frame);resize.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);};
}

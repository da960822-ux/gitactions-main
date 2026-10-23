import {useEffect,useId,useRef,useState} from 'react';

// Adapted from UpFork Border Beam Button (MIT, revision 1); see THIRD_PARTY_NOTICES.
function fade(count:number,length:number,peak:number,power:number){
  const target=Array.from({length:count},(_,index)=>peak*(1-(index+.5)/count)**power);
  return target.map((value,index)=>({length:length*(index+1)/count,opacity:1-(1-value)/(1-(target[index+1]??0))}));
}
const body=fade(24,26,.92,1.6),head=fade(4,3.6,.95,1.1);
const dash=(length:number)=>`0 ${60-length} ${length} 40`;

export function GameStartBeam(){
  const svg=useRef<SVGSVGElement>(null),pointer=useRef<SVGRadialGradientElement>(null),id=useId();
  const [size,setSize]=useState<{width:number;height:number;radius:number}|null>(null);
  useEffect(()=>{
    const element=svg.current,target=element?.parentElement;if(!element||!target)return;
    const fine=matchMedia('(hover: hover) and (pointer: fine)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
    let frame=0,width=0,height=0,px=0,py=0,inView=false;
    const reset=()=>{
      cancelAnimationFrame(frame);frame=0;element.dataset.active='false';
      pointer.current?.setAttribute('cx',String(width/2));pointer.current?.setAttribute('cy',String(height/2));
    };
    const preference=()=>{element.dataset.reduced=String(reduced.matches);reset();};
    const measure=()=>{
      width=target.offsetWidth;height=target.offsetHeight;
      if(width<1||height<1){reset();return;}
      const radius=Math.max(0,parseFloat(getComputedStyle(target).borderTopLeftRadius)-.5)||0;
      setSize(previous=>previous?.width===width&&previous.height===height&&previous.radius===radius?previous:{width,height,radius});
      reset();
    };
    const render=()=>{
      frame=0;pointer.current?.setAttribute('cx',px.toFixed(1));pointer.current?.setAttribute('cy',py.toFixed(1));
    };
    const move=(event:PointerEvent)=>{
      if(event.pointerType!=='mouse'||!fine.matches||reduced.matches||document.hidden||!inView||target.matches(':focus-visible'))return;
      const bounds=target.getBoundingClientRect();if(!bounds.width||!bounds.height)return;
      px=Math.max(0,Math.min(width,(event.clientX-bounds.left)*width/bounds.width));
      py=Math.max(0,Math.min(height,(event.clientY-bounds.top)*height/bounds.height));
      element.dataset.active='true';if(!frame)frame=requestAnimationFrame(render);
    };
    const intersection=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;if(!inView)reset();});
    const resize=new ResizeObserver(measure);intersection.observe(target);resize.observe(target);measure();preference();
    target.addEventListener('pointerenter',move);target.addEventListener('pointermove',move,{passive:true});
    target.addEventListener('pointerleave',reset);target.addEventListener('pointercancel',reset);target.addEventListener('focus',reset);
    document.addEventListener('visibilitychange',reset);window.addEventListener('blur',reset);
    fine.addEventListener('change',preference);reduced.addEventListener('change',preference);
    return()=>{
      reset();intersection.disconnect();resize.disconnect();
      target.removeEventListener('pointerenter',move);target.removeEventListener('pointermove',move);
      target.removeEventListener('pointerleave',reset);target.removeEventListener('pointercancel',reset);target.removeEventListener('focus',reset);
      document.removeEventListener('visibilitychange',reset);window.removeEventListener('blur',reset);
      fine.removeEventListener('change',preference);reduced.removeEventListener('change',preference);
    };
  },[]);
  const rect=size?{x:.5,y:.5,width:size.width-1,height:size.height-1,rx:size.radius,pathLength:100}:null;
  return <svg ref={svg} className="game-start-beam" data-active="false" aria-hidden="true" focusable="false" viewBox={size?`0 0 ${size.width} ${size.height}`:undefined} fill="none">
    {size&&rect&&<>
      <defs>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2={size.width} y2={size.height} gradientUnits="userSpaceOnUse"><stop stopColor="#b75b7b"/><stop offset="1" stopColor="#f4c9b7"/></linearGradient>
        <radialGradient ref={pointer} id={`${id}-pointer`} cx={size.width/2} cy={size.height/2} r="72" gradientUnits="userSpaceOnUse"><stop stopColor="#fff1e9"/><stop offset="1" stopColor="#e8a7bf" stopOpacity="0"/></radialGradient>
      </defs>
      <rect {...rect} className="game-start-beam-static" stroke="#f5c5d4" strokeWidth="1.5"/>
      <g className="game-start-beam-moving">
        <rect {...rect} stroke={`url(#${id}-pointer)`} strokeWidth="2" opacity=".75"/>
        {body.map((layer,index)=><rect key={`body-${index}`} {...rect} className="game-start-beam-layer" stroke={`url(#${id}-beam)`} strokeWidth="1.6" strokeDasharray={dash(layer.length)} opacity={layer.opacity}/>)}
        {head.map((layer,index)=><rect key={`head-${index}`} {...rect} className="game-start-beam-layer" stroke="#fff3eb" strokeWidth="1.9" strokeDasharray={dash(layer.length)} opacity={layer.opacity}/>)}
      </g>
    </>}
  </svg>;
}

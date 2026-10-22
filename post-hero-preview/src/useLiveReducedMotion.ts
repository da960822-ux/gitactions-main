import {useEffect,useState} from 'react';

export function useLiveReducedMotion(){
 const [reduced,setReduced]=useState(()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{
  const media=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReduced(media.matches);
  media.addEventListener('change',update);update();
  return()=>media.removeEventListener('change',update);
 },[]);
 return reduced;
}

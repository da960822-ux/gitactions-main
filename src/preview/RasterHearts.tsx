import {useEffect,useRef,useState} from 'react';
import layout from './heroRasterLayout.json';

// shortcut: software GPUs use rendered 3D views rather than continuous mesh rotation; use StudioScene for hardware rendering.
export function RasterHearts(){
 const host=useRef<HTMLDivElement>(null),[ready,setReady]=useState(false);
 useEffect(()=>{let alive=true;const images=[...host.current!.parentElement!.querySelectorAll<HTMLImageElement>('.rd-raster-heart img')];Promise.all(images.map(image=>image.decode().catch(()=>{}))).then(()=>requestAnimationFrame(()=>{if(alive)setReady(true);}));return()=>{alive=false;};},[]);
 const heart=(box:number[],i:number)=><div key={i} className={`rd-raster-heart ${i===2?'rd-raster-front':''}`} data-ready={ready} data-box={JSON.stringify(box)}>{['neutral','left','right'].map(light=><img key={light} data-light={light} src={`/images/landing-preview/hero/heart-${i}-${light}.png`} width={box[2]} height={box[3]} loading="eager" decoding="sync" alt="" aria-hidden="true"/>)}</div>;
 return <><div ref={host} className="rd-raster-scene" data-ready={ready} data-renderer="raster">
  {layout.hearts.slice(0,2).map(heart)}
 </div>{heart(layout.hearts[2],2)}</>;
}

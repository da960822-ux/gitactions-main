import assets from '../../public/images/marble/airline-characters.json';
import {useEffect,useRef,useState} from 'react';
import type {Language} from '../core/types';
import {isFreshMarbleCosmetic,marbleEventSequence,type MarbleActionEvent} from './marble-motion';

export function marbleFlight(event:MarbleActionEvent|null|undefined,tiles:readonly {name?:Partial<Record<Language,string>>}[],language:Language) {
  if(!event||event.skipCosmetics||event.type!=='move'||event.source!=='train'||!marbleEventSequence(event)||!Number.isInteger(event.to)||!tiles[event.to!])return null;
  return {sequence:marbleEventSequence(event),airline:event.actor==='p1'||event.actor==='p3'?'asiana':'jetblue',destination:tiles[event.to!].name?.[language]??'',from:tiles[event.from??-1]?.name?.[language]??'',to:event.to};
}

export function freshMarbleFlightEvents(events:readonly MarbleActionEvent[],previous:number,hidden:boolean) {
 const fresh=events.filter(event=>marbleEventSequence(event)>previous);
 return !hidden&&fresh.length<=12&&fresh.every((event,index)=>marbleEventSequence(event)===previous+index+1)?fresh:[];
}

const loads=new Map<string,Promise<boolean>>();
export function preloadMarblePlane(airline:string) {
 const asset=assets.assets.find(asset=>asset.airline===airline)!;
 if(!loads.has(airline))loads.set(airline,new Promise<boolean>(resolve=>{const image=new Image();image.onload=()=>resolve(true);image.onerror=()=>resolve(false);image.src=asset.path;}));
 return loads.get(airline)!;
}
/** Two user-approved transparent scenes, preloaded before the first confirmed journey. */
export function MarbleFlight({event,tiles,language,events=[]}:{events?:readonly MarbleActionEvent[];event?:MarbleActionEvent|null;tiles:readonly {name?:Partial<Record<Language,string>>}[];language:Language}) {
  const sequence=marbleEventSequence(event),previous=useRef(sequence);
  const [flight,setFlight]=useState<ReturnType<typeof marbleFlight>>(null);
  const timer=useRef<number|undefined>(undefined),pending=useRef(0);
  const rawSequence=events.reduce((max,event)=>Math.max(max,marbleEventSequence(event)),0),rawPrevious=useRef(rawSequence);
  const show=(next:NonNullable<ReturnType<typeof marbleFlight>>)=>{const id=next.sequence;pending.current=id;void preloadMarblePlane(next.airline).then(ready=>{if(!ready||pending.current!==id||document.hidden)return;window.clearTimeout(timer.current);setFlight(next);timer.current=window.setTimeout(()=>setFlight(null),2800);});};
  useEffect(()=>{void preloadMarblePlane('asiana');void preloadMarblePlane('jetblue');},[]);
  useEffect(()=>{
    const before=rawPrevious.current;rawPrevious.current=rawSequence;
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const fresh=freshMarbleFlightEvents(events,before,document.hidden);
    if(!fresh.length)return;
    const travel=fresh.map(event=>marbleFlight(event,tiles,language)).filter(Boolean).at(-1);if(travel)show(travel);
  },[rawSequence]);
  useEffect(()=>{
    const next=marbleFlight(event,tiles,language);
    if(sequence<previous.current){pending.current=0;window.clearTimeout(timer.current);setFlight(null);}
    else if(next&&isFreshMarbleCosmetic(event,previous.current)&&!document.hidden){show(next);}
    previous.current=sequence;
  },[sequence,event,tiles,language]);
  useEffect(()=>{const hide=()=>{if(document.hidden){pending.current=0;window.clearTimeout(timer.current);setFlight(null);}};document.addEventListener('visibilitychange',hide);return()=>{pending.current=0;window.clearTimeout(timer.current);document.removeEventListener('visibilitychange',hide);};},[]);
  if(!flight)return null;
  const asiana=flight.airline==='asiana';
  return <div key={flight.sequence} className="mp-flight mp-confirmed-flight is-flying" role="status" data-flight-destination={flight.to} data-flight-airline={flight.airline} style={{color:asiana?'#a54e69':'#356896'}}>
    <img className="mp-flight-character" src={assets.assets.find(asset=>asset.airline===flight.airline)!.path} width="1100" height="619" alt={asiana?(language==='ko'?'아시아나 창밖에서 여행을 부르는 리스벳':'Lisbeth te invita a viajar desde Asiana'):(language==='ko'?'젯블루 창밖에서 여행을 부르는 연석':'Yeonseok te invita a viajar desde JetBlue')}/>

    <span><b>{asiana?(language==='ko'?'아시아나':'Asiana'):(language==='ko'?'젯블루':'JetBlue')}</b> · {language==='ko'?'둘의 상상 여행':'Nuestro viaje imaginado'}</span><small>{flight.from} → {flight.destination}</small>
  </div>;
}

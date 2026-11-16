import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Language } from '../core/types';
import './marble-motion-effects.css';

type Seat = 'p1'|'p2'|'p3'|'p4';
type Account = Seat|'bank'|'fund';
type Point = { x:number; y:number };
type Flight = { key:number; from:Point; to:Point; amount:number; sender:Account; receiver:Account };
export type MoneyEvent = { sequence?:number; amount?:number; fromAccount?:unknown; toAccount?:unknown };
const isAccount=(value:unknown):value is Account=>['p1','p2','p3','p4','bank','fund'].includes(String(value));

function anchor(account:Account):Point|null {
  const seat=account.startsWith('p') ? document.querySelector(`[data-marble-seat="${account}"] [data-marble-value="cash"]`) ?? document.querySelector(`[data-marble-seat="${account}"]`) : null;
  const center=document.querySelector('.mp-board-panel');
  const box=(seat??center)?.getBoundingClientRect();
  if(!box)return null;
  return seat ? {x:box.left+box.width/2,y:box.top+box.height/2} : {x:box.left+28,y:box.top+28};
}

/** Queue transfers from presented events, never from the newest server snapshot. The settled receipt remains the accessible record. */
export function MarbleMoneyFlight({event}:{event:MoneyEvent|undefined;cash:Partial<Record<Seat,number>>;language:Language;viewer?:Seat}) {
  const lastSequence=useRef<number>(event?.sequence??0);
  const timer=useRef<number|undefined>(undefined);
  const pending=useRef<Flight[]>([]);
  const running=useRef(false);
  const [flight,setFlight]=useState<Flight|null>(null);
  const clear=()=>{window.clearTimeout(timer.current);pending.current=[];running.current=false;setFlight(null);};
  const next=()=>{
    if(document.hidden||window.matchMedia('(prefers-reduced-motion: reduce)').matches){clear();return;}
    const item=pending.current.shift();
    if(!item){running.current=false;setFlight(null);return;}
    running.current=true;setFlight(item);
    timer.current=window.setTimeout(next,850);
  };
  useEffect(()=>{
    const query=window.matchMedia('(prefers-reduced-motion: reduce)');
    const stop=()=>{if(document.hidden||query.matches)clear();};
    query.addEventListener('change',stop);document.addEventListener('visibilitychange',stop);
    return()=>{window.clearTimeout(timer.current);pending.current=[];query.removeEventListener('change',stop);document.removeEventListener('visibilitychange',stop);};
  },[]);
  useEffect(()=>{
    const sequence=event?.sequence??0;
    if(!sequence)return;
    if(sequence<lastSequence.current){lastSequence.current=sequence;clear();return;}
    if(sequence===lastSequence.current)return;
    lastSequence.current=sequence;
    if(!event||!event.amount||event.amount<=0||!isAccount(event.fromAccount)||!isAccount(event.toAccount)||window.matchMedia('(prefers-reduced-motion: reduce)').matches||document.hidden)return;
    const from=anchor(event.fromAccount),to=anchor(event.toAccount);
    if(!from||!to)return;
    pending.current.push({key:sequence,from,to,amount:event.amount,sender:event.fromAccount,receiver:event.toAccount});
    if(!running.current)next();
  },[event?.sequence]);
  if(!flight)return null;
  const {from,to}=flight;
  const variables={'--money-dx':`${to.x-from.x}px`,'--money-dy':`${to.y-from.y}px`,'--money-dx-mid':`${(to.x-from.x)*.56}px`,'--money-dy-mid':`${(to.y-from.y)*.56}px`,left:from.x,top:from.y} as CSSProperties;
  return <div className="mp-money-flight" aria-hidden="true" data-money-sequence={flight.key}>
    {/* Amounts stay in the sequenced HUD and receipt; no floating text may obscure decisions. */}
    <span className="mp-money-token" style={variables}><b>₩</b></span>
  </div>;
}

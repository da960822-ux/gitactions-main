import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Language } from '../core/types';
import { moneyText } from './marble-visuals';
import './marble-motion-effects.css';

type Seat = 'p1'|'p2'|'p3'|'p4';
type Account = Seat|'bank'|'fund';
type Point = { x:number; y:number };
type Flight = { key:number; from:Point; to:Point; amount:number; sender:Account; receiver:Account };
type MoneyEvent = { sequence?:number; amount?:number; fromAccount?:unknown; toAccount?:unknown };
const isAccount=(value:unknown):value is Account=>['p1','p2','p3','p4','bank','fund'].includes(String(value));

function anchor(account:Account):Point|null {
  const seat=account.startsWith('p') ? document.querySelector(`[data-marble-seat="${account}"] [data-marble-value="cash"]`) ?? document.querySelector(`[data-marble-seat="${account}"]`) : null;
  const center=document.querySelector('.mp-board-center');
  const box=(seat??center)?.getBoundingClientRect();
  if(!box)return null;
  return seat ? {x:box.left+box.width/2,y:box.top+box.height/2} : {x:box.left+box.width*.72,y:box.top+box.height*.78};
}

/** One short visual transfer for a newly confirmed engine event. The settled receipt remains the accessible record. */
export function MarbleMoneyFlight({event,cash,language}:{event:MoneyEvent|undefined;cash:Partial<Record<Seat,number>>;language:Language}) {
  const lastSequence=useRef<number>(event?.sequence??0);
  const timer=useRef<number|undefined>(undefined);
  const [flight,setFlight]=useState<Flight|null>(null);
  useEffect(()=>{
    const sequence=event?.sequence??0;
    if(sequence<=lastSequence.current)return;
    lastSequence.current=sequence;
    window.clearTimeout(timer.current);
    setFlight(null);
    if(!event||!event.amount||event.amount<=0||!isAccount(event.fromAccount)||!isAccount(event.toAccount)||window.matchMedia('(prefers-reduced-motion: reduce)').matches||document.hidden)return;
    const from=anchor(event.fromAccount),to=anchor(event.toAccount);
    if(!from||!to)return;
    setFlight({key:sequence,from,to,amount:event.amount,sender:event.fromAccount,receiver:event.toAccount});
    timer.current=window.setTimeout(()=>setFlight(current=>current?.key===sequence?null:current),850);
    return()=>window.clearTimeout(timer.current);
  },[event?.sequence]);
  if(!flight)return null;
  const {from,to,amount,sender,receiver}=flight;
  const variables={'--money-dx':`${to.x-from.x}px`,'--money-dy':`${to.y-from.y}px`,'--money-dx-mid':`${(to.x-from.x)*.56}px`,'--money-dy-mid':`${(to.y-from.y)*.56}px`,left:from.x,top:from.y} as CSSProperties;
  const finish=(seat:Account,sign:string,point:Point)=>seat.startsWith('p')&&<span className={`mp-money-endpoint mp-money-endpoint--${sign==='+'?'receive':'send'}`} style={{left:point.x,top:point.y}}><b>{sign}{moneyText(amount,language)}</b><small>{language==='ko'?'잔액':'Saldo'} {moneyText(cash[seat as Seat]??0,language)}</small></span>;
  return <div className="mp-money-flight" aria-hidden="true" data-money-sequence={flight.key}>
    {finish(sender,'−',from)}
    <span className="mp-money-token" style={variables}><b>{moneyText(amount,language)}</b></span>
    {finish(receiver,'+',to)}
  </div>;
}

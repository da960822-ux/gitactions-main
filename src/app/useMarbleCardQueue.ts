import {useLayoutEffect,useRef,useState} from 'react';
import {marbleEventArtFamily} from './MarbleEventArt';
export type CardOutcome={card:any;result:any};
const ignoredResult=(event:any)=>!(['forced-sale','earthquake','construction-grant'].includes(event.cardId)&&event.cardPhase==='resolution')&&['move','pawn','arrival','sell','loan','repay','build','buy','takeover'].includes(event.type);
const isCard=(event:any)=>event.type==='event-card'&&event.cardPhase!=='resolution'&&!!marbleEventArtFamily(event.cardId??event.id);
/** Capture only this snapshot's card resolution; later unrelated turns cannot replace it. */
export function collectCardOutcomes(events:any[]):CardOutcome[]{
 const outcomes:CardOutcome[]=[];let current:CardOutcome|undefined;
 for(const event of events){
  if(typeof event.cardDrawSequence==='number'){
   const linked=outcomes.find(outcome=>outcome.card.sequence===event.cardDrawSequence);
   if(linked){if(!ignoredResult(event))linked.result=event;current=linked;continue;}
   if(isCard(event)&&event.sequence===event.cardDrawSequence){current={card:event,result:event};outcomes.push(current);continue;}
  }
  if(['roll','turn'].includes(event.type)){current=undefined;continue;}
  if(current?.card.cardDrawSequence!==undefined&&event.cardDrawSequence===undefined&&!isCard(event))continue;
  if(isCard(event)){
   if(current&&(current.card.cardId??current.card.id)===(event.cardId??event.id)){current.result=event;continue;}
   current={card:event,result:event};outcomes.push(current);
  }else if(current&&!ignoredResult(event))current.result=event;
 }
 return outcomes;
}
export function updateCardQueue(queue:CardOutcome[],events:any[],seen:number){
 const sequence=Number(events.at(-1)?.sequence??0);
 if(sequence<seen)return {queue:[],sequence};
 // Full-log boundaries distinguish a new draw after a separately delivered roll.
 // Matching the original draw sequence also refreshes deferred debt settlement.
 const captured=collectCardOutcomes(events),next=queue.map(old=>{const linked=events.filter(event=>event.cardDrawSequence===old.card.sequence&&!ignoredResult(event)).at(-1);return captured.find(item=>item.card.sequence===old.card.sequence)??(linked?{...old,result:linked}:old);});
 for(const outcome of captured)if(outcome.card.sequence>seen&&!next.some(item=>item.card.sequence===outcome.card.sequence))next.push(outcome);
 return {queue:next,sequence};
}
/** One game is at most 120 turns; retain its unacknowledged cards instead of dropping them on timers. */
export function useMarbleCardQueue(events:any[]){
 const sequence=Number(events.at(-1)?.sequence??0),seen=useRef(sequence);
 const [queue,setQueue]=useState<CardOutcome[]>([]);
 useLayoutEffect(()=>{
  const previous=seen.current;seen.current=sequence;
  setQueue(old=>updateCardQueue(old,events,previous).queue);
 },[sequence]);
 return {outcome:queue[0]??null,remaining:queue.length,acknowledge:()=>setQueue(old=>old.slice(1))};
}

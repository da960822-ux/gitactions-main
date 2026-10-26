import { useEffect, useRef, useState } from 'react';
import type { MarbleView } from '../games/fourMarble';
import { playCue } from '../audio/audio';
import { marblePresentationFrames, marbleCueForEvent, type MarbleActionEvent, type MarblePresentationFrame } from './marble-motion';

export function useMarbleTeamMotion(view: MarbleView) {
  const s=view.publicState;
  const [positions,setPositions]=useState<Record<string,number>>(s.positions);
  const [traveler,setTraveler]=useState<MarblePresentationFrame['traveler']>(null);
  const [rolling,setRolling]=useState(false);
  const [event,setEvent]=useState<MarbleActionEvent|null>(null);
  const [changedProperties,setChanged]=useState<number[]>([]);
  const previous=useRef<{sequence:number;positions:Record<string,number>;properties:string[]}|null>(null);
  const timers=useRef<ReturnType<typeof setTimeout>[]>([]);
  const busy=useRef(false);
  const reduced=useRef(false);
  const latest=useRef(s);latest.current=s;
  useEffect(()=>{
    const query=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>{reduced.current=query.matches;if(query.matches){timers.current.forEach(clearTimeout);busy.current=false;setPositions(latest.current.positions);setTraveler(null);setRolling(false);}};update();query.addEventListener('change',update);
    const snap=()=>{if(document.hidden){timers.current.forEach(clearTimeout);busy.current=false;setPositions(latest.current.positions);setTraveler(null);setRolling(false);}};
    document.addEventListener('visibilitychange',snap);
    return()=>{timers.current.forEach(clearTimeout);query.removeEventListener('change',update);document.removeEventListener('visibilitychange',snap);};
  },[]);
  useEffect(()=>{
    const props=view.publicBoard.map((_,i)=>`${s.properties[i]?.owner??''}:${s.properties[i]?.houses??0}:${JSON.stringify(s.properties[i]?.buildings??{})}`);
    const before=previous.current;previous.current={sequence:s.actionSequence,positions:s.positions,properties:props};
    const interrupted=busy.current;busy.current=false;timers.current.forEach(clearTimeout);timers.current=[];
    const fresh=(s.actionLog??[]).filter(e=>e.sequence>(before?.sequence??s.actionSequence));
    setChanged(before?props.flatMap((p,i)=>p!==before.properties[i]?[i]:[]):[]);
    if(!before||!fresh.length||reduced.current||document.hidden||interrupted||fresh.length>12){
      setPositions(s.positions);setTraveler(null);setRolling(false);
      if(before&&fresh.length&&!document.hidden){const latest=fresh.at(-1)!;setEvent(latest);const cue=latest.type==='win'&&view.result?.winner==='B'?'lose':marbleCueForEvent(latest);if(cue)playCue('marble',cue);timers.current.push(setTimeout(()=>setEvent(null),3000));}
      return;
    }
    const frames=marblePresentationFrames(fresh,before.positions,s.positions,view.publicBoard.length);busy.current=true;let sounded=0;
    for(const frame of frames)timers.current.push(setTimeout(()=>{
      setPositions(frame.positions);setTraveler(frame.traveler);setRolling(frame.dice);setEvent(frame.event);
      if(frame.event.sequence&&frame.event.sequence>sounded&&!document.hidden){sounded=frame.event.sequence;const cue=frame.event.type==='win'&&view.result?.winner==='B'?'lose':marbleCueForEvent(frame.event);if(cue)playCue('marble',cue);}
      if(frame===frames.at(-1))busy.current=false;
    },frame.at));
    timers.current.push(setTimeout(()=>{setEvent(null);setChanged([]);},(frames.at(-1)?.at??0)+2500));
  },[s.actionSequence]);
  return {positions,traveler,rolling,event,changedProperties};
}

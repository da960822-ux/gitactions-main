import { useEffect, useRef, useState } from 'react';
import type { MarbleView } from '../games/fourMarble';
import { cancelSceneAudio } from '../audio/audio';
import { createMarbleAudioPresenter } from '../audio/marble-audio';
import { marblePresentationFrames, type MarbleActionEvent, type MarblePresentationFrame } from './marble-motion';

export function useMarbleTeamMotion(view: MarbleView) {
  const s=view.publicState;
  const [positions,setPositions]=useState<Record<string,number>>(s.positions);
  const [traveler,setTraveler]=useState<MarblePresentationFrame['traveler']>(null);
  const [rolling,setRolling]=useState(false);
  const [presenting,setPresenting]=useState(false);
  const [presentedSequence,setPresentedSequence]=useState(s.actionSequence);
  const [event,setEvent]=useState<MarbleActionEvent|null>(null);
  const [changedProperties,setChanged]=useState<number[]>([]);
  const previous=useRef<{sequence:number;positions:Record<string,number>;properties:string[]}|null>(null);
  const timers=useRef<ReturnType<typeof setTimeout>[]>([]);
  const busy=useRef(false);
  const reduced=useRef(false);
  const latest=useRef(s);latest.current=s;
  useEffect(()=>{
    const query=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>{reduced.current=query.matches;if(query.matches){timers.current.forEach(clearTimeout);busy.current=false;setPresenting(false);setPresentedSequence(latest.current.actionSequence);setPositions(latest.current.positions);setTraveler(null);setRolling(false);}};update();query.addEventListener('change',update);
    const snap=()=>{if(document.hidden){cancelSceneAudio('marble');timers.current.forEach(clearTimeout);busy.current=false;setPresenting(false);setPresentedSequence(latest.current.actionSequence);setPositions(latest.current.positions);setTraveler(null);setRolling(false);}};
    document.addEventListener('visibilitychange',snap);
    return()=>{cancelSceneAudio('marble');timers.current.forEach(clearTimeout);query.removeEventListener('change',update);document.removeEventListener('visibilitychange',snap);};
  },[]);
  useEffect(()=>{
    const props=view.publicBoard.map((_,i)=>`${s.properties[i]?.owner??''}:${s.properties[i]?.houses??0}:${s.properties[i]?.buildings?.join(',')??''}:${s.properties[i]?.landmark??false}`);
    const before=previous.current;previous.current={sequence:s.actionSequence,positions:s.positions,properties:props};
    const interrupted=busy.current;if(interrupted)cancelSceneAudio('marble');busy.current=false;setPresenting(false);timers.current.forEach(clearTimeout);timers.current=[];
    const fresh=(s.actionLog??[]).filter(e=>e.sequence>(before?.sequence??s.actionSequence));
    setChanged(before?props.flatMap((p,i)=>p!==before.properties[i]?[i]:[]):[]);
    if(!before||!fresh.length||reduced.current||document.hidden||interrupted||fresh.length>12||(fresh.length>0&&fresh[0].sequence!==before.sequence+1)){
      setPositions(s.positions);setTraveler(null);setRolling(false);setPresentedSequence(s.actionSequence);
      if(before&&fresh.length&&!document.hidden){setEvent({...fresh.at(-1)!,skipCosmetics:true});timers.current.push(setTimeout(()=>setEvent(null),3000));
        if(reduced.current&&!interrupted&&fresh.length<=12&&fresh[0].sequence===before.sequence+1){const sound=createMarbleAudioPresenter('p1',view.result?.winner==='draw'?'draw':view.result?.winner==='B'?'lose':'win');for(const event of fresh)sound({event,traveler:null});}
      }
      return;
    }
    const frames=marblePresentationFrames(fresh,before.positions,s.positions,view.publicBoard.length);busy.current=true;setPresenting(true);const sound=createMarbleAudioPresenter('p1',view.result?.winner==='draw'?'draw':view.result?.winner==='B'?'lose':'win');
    for(const frame of frames)timers.current.push(setTimeout(()=>{
      setPositions(frame.positions);setTraveler(frame.traveler);setRolling(frame.dice);setEvent(frame.event);setPresentedSequence(Number(frame.event.sequence??s.actionSequence));
      if(!document.hidden)sound(frame);
      if(frame===frames.at(-1)){busy.current=false;setPresenting(false);}
    },frame.at));
    timers.current.push(setTimeout(()=>{setEvent(null);setChanged([]);},(frames.at(-1)?.at??0)+2500));
  },[s.actionSequence]);
  return {positions,traveler,rolling,event,changedProperties,presenting,presentedSequence};
}

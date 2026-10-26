import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { fourSeats, fourTeam, type FourSeat, type FourView } from '../core/fourPlayer';
import type { GameAction, GameId, Language } from '../core/types';
import { minhwatuScoreBreakdown, minhwatuYakuProgress, scoreMinhwatuYakus, type MinhwatuCard, type MinhwatuEvent, type MinhwatuKind } from '../games/minhwatu';
import type { MinhwatuPolicyView } from '../games/fourMinhwatu';
import { HwatuCard } from './HwatuCard';
import { HwatuMotion } from './HwatuMotion';
import { useMinhwatuPresentation } from './useMinhwatuPresentation';
import { MinhwatuCredits } from './MinhwatuGuide';
import { GameFeedback } from './GameFeedback';
import './minhwatu-team-table.css';

const text = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
const categories: MinhwatuKind[] = ['bright', 'animal', 'ribbon', 'plain'];
const categoryNames = { bright: {ko:'광',es:'Brillantes'}, animal:{ko:'열끗',es:'Animales'}, ribbon:{ko:'띠',es:'Cintas'}, plain:{ko:'피',es:'Simples'} };

// The legacy Hwatu motion primitive has two animation lanes. Only public captures enter its second lane.
export function minhwatuTeamPresentation(view: FourView) {
  const source = (view as MinhwatuPolicyView).minhwatu;
  const captures = {p1:source.captures.p1,p2:[...source.captures.p2,...source.captures.p3,...source.captures.p4]};
  const breakdown = minhwatuScoreBreakdown({p1:source.captures.p1,p2:[]});
  breakdown.p1.finalScore=view.players.find(p=>p.id==='p1')?.score??0;
  breakdown.p1.opponentYakuPoints=scoreMinhwatuYakus(source.captures.p2)+scoreMinhwatuYakus(source.captures.p4);
  const winner = view.result?.winner==='draw'?'draw':view.result?.winner==='A'?'p1':'p2';
  const log:MinhwatuEvent[]=source.events.map(event=>({...event,actor:event.actor?event.actor==='p1'?'p1':'p2':undefined,...(event.type==='win'&&view.result?{winner}: {})}));
  return {game:'minhwatu',turn:view.turn==='p1'?'p1':'p2',phase:view.phase,ownHand:source.hand,hand:source.hand,
    opponentCount:view.players.filter(p=>p.id!=='p1').reduce((sum,p)=>sum+p.count,0),
    board:{table:source.table,captures,pendingCard:source.pending,deckCount:source.deckCount,remainingDeck:source.deckCount,scores:{p1:breakdown.p1.finalScore,p2:0},breakdown,rulesVersion:2,actionLog:log},log,actions:view.actions,
    result:view.result?{winner,scores:{p1:view.result.scores.A,p2:view.result.scores.B},reason:view.result.reason.ko}:null};
}

type Props={view:FourView;language:Language;runAction:(action:GameAction)=>void|Promise<unknown>;nickname?:string;roomId?:string;version?:number;
  onReplay?:()=>boolean|void|Promise<boolean|void>;onExit?:()=>void;onSelectGame?:(game:GameId)=>void|Promise<void>;error?:string;busy?:boolean};

export function MinhwatuTeamTable({view,language,runAction,nickname,roomId='',version:_version,onReplay,onExit,onSelectGame,error:outerError,busy:outerBusy=false}:Props){
  const source=(view as MinhwatuPolicyView).minhwatu, audioView=useMemo(()=>minhwatuTeamPresentation(view),[view]);
  const presentation=useMinhwatuPresentation(audioView,'p1',`${roomId}:native-four`),shown=presentation.view;
  const hand=shown.ownHand as MinhwatuCard[],table=shown.board.table as MinhwatuCard[],pending=shown.board.pendingCard as MinhwatuCard|null;
  const [selected,setSelected]=useState<string|null>(null),[sending,setSending]=useState(false),[error,setError]=useState('');
  const [dialog,setDialog]=useState<'help'|'events'|'exit'|null>(null),[menu,setMenu]=useState(false);
  const [preview,setPreview]=useState<{card:MinhwatuCard;left:number;top:number}|null>(null),[scoreChanges,setScoreChanges]=useState<Partial<Record<FourSeat,number>>>({});
  const lock=useRef(false),handButtons=useRef(new Map<string,HTMLButtonElement>()),targetButtons=useRef(new Map<number,HTMLButtonElement>());
  const dialogRef=useRef<HTMLDivElement>(null),priorScores=useRef(view.players.map(p=>p.score)),previousTurn=useRef(view.turn),previousPhase=useRef(view.phase);
  const active=view.turn==='p1'&&!view.result,busy=outerBusy||sending||presentation.busy;
  const selectedIndex=hand.findIndex(card=>card.id===selected),selectedCard=hand[selectedIndex];
  const capturePhase=view.phase==='capture-draw';
  const monthCount=selectedCard?table.filter(card=>card.month===selectedCard.month).length:0;
  const choosingTarget=active&&(capturePhase||Boolean(selectedCard&&monthCount===2));
  const targetChoice=(index:number)=>view.actions.find(option=>option.action.type===(capturePhase?'capture':'play')&&Number(option.action.payload?.targetIndex)===index&&(capturePhase||Number(option.action.payload?.index)===selectedIndex));
  const name=(seat:FourSeat)=>seat==='p1'?nickname||text(language,'나','Tú'):seat==='p3'?text(language,'AI 팀원','Compañero IA'):text(language,`상대 ${seat==='p2'?1:2}`,`Rival ${seat==='p2'?1:2}`);
  const turnName=view.turn==='p1'?text(language,'내 차례','Tu turno'):text(language,`${name(view.turn)} 차례`,`Turno de ${name(view.turn)}`);
  const instruction=presentation.busy?text(language,'패 이동 중','Moviendo cartas'):view.result?text(language,'정산 완료','Partida terminada'):!active?turnName:choosingTarget?text(language,'바닥 패를 고르세요','Elige una carta de la mesa'):text(language,'패를 고르세요','Elige una carta');
  const captureOwner=source.events.filter(event=>event.type==='capture'&&event.actor!=='p1').at(-1)?.actor;
  const movingActor=source.events.filter(event=>event.type==='play').at(-1)?.actor;
  const shownOther=(shown.board.captures.p2??[]) as MinhwatuCard[];
  const captures=Object.fromEntries(fourSeats.map(seat=>[seat,seat==='p1'?shown.board.captures.p1:shownOther.filter(card=>source.captures[seat].some(owned=>owned.id===card.id))])) as Record<FourSeat,MinhwatuCard[]>;
  const bonuses=Object.fromEntries(fourSeats.map(seat=>[seat,scoreMinhwatuYakus(captures[seat])])) as Record<FourSeat,number>;
  const points=Object.fromEntries(fourSeats.map(seat=>[seat,captures[seat].reduce((sum,card)=>sum+card.points,0)+2*bonuses[seat]-fourSeats.filter(other=>fourTeam(other)!==fourTeam(seat)).reduce((sum,other)=>sum+bonuses[other],0)])) as Record<FourSeat,number>;
  const teamScores=view.result?.scores??{A:points.p1+points.p3,B:points.p2+points.p4};
  const handKey=hand.map(card=>card.id).join('|');
  const scoreKey=fourSeats.map(seat=>points[seat]).join('|');
  useEffect(()=>{setSelected(null);setPreview(null);setError('');},[handKey,view.turn,view.phase]);
  useEffect(()=>{
    const ownStart=previousTurn.current!=='p1'&&view.turn==='p1',drawStart=previousPhase.current!=='capture-draw'&&capturePhase;
    previousTurn.current=view.turn;previousPhase.current=view.phase;
    if(!busy&&active&&(ownStart||drawStart)){
      if(capturePhase){const first=table.findIndex((_,index)=>Boolean(targetChoice(index)));targetButtons.current.get(first)?.focus({preventScroll:true});}
      else if(hand[0])handButtons.current.get(hand[0].id)?.focus({preventScroll:true});
    }
  },[busy,active,view.turn,view.phase]);
  useEffect(()=>{
    const changes=Object.fromEntries(fourSeats.flatMap((seat,index)=>points[seat]===priorScores.current[index]?[]:[[seat,points[seat]-priorScores.current[index]]])) as Partial<Record<FourSeat,number>>;
    priorScores.current=fourSeats.map(seat=>points[seat]);
    if(!Object.keys(changes).length)return;
    setScoreChanges(previous=>Object.fromEntries(fourSeats.flatMap(seat=>previous[seat]!==undefined||changes[seat]!==undefined?[[seat,(previous[seat]??0)+(changes[seat]??0)]]:[])));
    const timer=window.setTimeout(()=>setScoreChanges({}),1000);return()=>window.clearTimeout(timer);
  },[scoreKey]);

  useEffect(()=>{
    if(!dialog)return;
    const previous=document.activeElement as HTMLElement|null;
    const focusables=()=>[...(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],summary,[tabindex="0"]')??[])];
    focusables()[0]?.focus();
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){setDialog(null);return;}
      if(event.key==='Tab'){const values=focusables(),first=values[0],last=values.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
    };
    document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);previous?.focus();};
  },[dialog]);
  const submit=async(action:GameAction)=>{
    if(lock.current||!active||busy)return;
    lock.current=true;setSending(true);setError('');
    try{const accepted=await runAction(action);if(accepted===false)setError(text(language,'선택을 다시 확인하세요.','Revisa la selección.'));else setSelected(null);}
    catch{setError(text(language,'패를 내지 못했어요. 다시 선택하세요.','No se pudo jugar. Vuelve a elegir.'));}
    finally{lock.current=false;setSending(false);}
  };
  const switchGame=async(game:GameId)=>{setMenu(false);setError('');try{await onSelectGame?.(game);}catch{setError(text(language,'게임을 바꾸지 못했어요. 다시 선택하세요.','No se pudo cambiar. Elige otra vez.'));}};
  const replay=async()=>{if(lock.current)return;lock.current=true;setSending(true);try{await onReplay?.();}catch{setError(text(language,'새 판을 시작하지 못했어요. 다시 눌러주세요.','No se pudo iniciar otra partida. Inténtalo de nuevo.'));}finally{lock.current=false;setSending(false);}};
  const inspect=(card:MinhwatuCard,element:HTMLButtonElement)=>{const bounds=element.getBoundingClientRect();setPreview({card,left:Math.max(8,Math.min(window.innerWidth-164,bounds.right+8)),top:Math.max(8,Math.min(window.innerHeight-290,bounds.top))});};
  const cancel=()=>{const old=selected;setSelected(null);if(old)handButtons.current.get(old)?.focus({preventScroll:true});};
  const chooseHand=(card:MinhwatuCard,index:number)=>{
    if(busy||!active||capturePhase)return;
    const options=view.actions.filter(option=>option.action.type==='play'&&Number(option.action.payload?.index)===index);
    if(options.length===1){void submit(options[0].action);return;}
    const next=selected===card.id?null:card.id;setSelected(next);setError('');
    if(next&&options.length>1)requestAnimationFrame(()=>targetButtons.current.get(Number(options[0].action.payload?.targetIndex))?.focus({preventScroll:true}));
  };
  const pile=(seat:FourSeat)=>{
    const seatCards=captures[seat],yakus=minhwatuYakuProgress(seatCards),player=view.players.find(player=>player.id===seat)!;
    const motionLane=seat==='p1'?'p1':seat===captureOwner?'p2':null;
    return <section className={`mh4-bank mh4-bank-${seat} team-${fourTeam(seat)} ${view.turn===seat&&!view.result?'is-turn':''} ${seatCards.length?'':'is-empty'}`} data-minhwatu-seat={seat} aria-label={text(language,`${name(seat)} 획득패와 족보`,`${name(seat)}: capturas y yakus`)}>
      <header><div><b>{name(seat)}</b><small>{text(language,fourTeam(seat)==='A'?'우리 팀':'상대 팀',fourTeam(seat)==='A'?'Tu equipo':'Equipo rival')} · {player.count}{text(language,'장',' cartas')}</small></div><output aria-label={text(language,`${name(seat)} 점수`,`${name(seat)} puntos`)} data-hwatu-zone={seat==='p1'?'score-p1':undefined}>{points[seat]}<small>{text(language,'점','pts')}</small>{scoreChanges[seat]!==undefined&&<span className="mh4-score-change" key={`${seat}:${scoreKey}`}>{scoreChanges[seat]!>0?'+':''}{scoreChanges[seat]}</span>}</output></header>
      {seat!=='p1'&&<div className="mh4-hidden-hand" data-hwatu-zone={seat===movingActor?'opponent-hand':undefined} aria-label={text(language,`${name(seat)} 비공개 손패 ${player.count}장`,`${name(seat)}: ${player.count} cartas ocultas`)}>{Array.from({length:player.count},(_,index)=><i aria-hidden="true" key={index}/>)}</div>}
      <div className="mh4-capture-groups">{categories.map(kind=><div className={`mh4-capture-kind kind-${kind}`} key={kind} data-hwatu-zone={motionLane?`captures-${motionLane}-${kind}`:undefined}>
        <h3><img src={`/images/hwatu-support/category-${kind}.svg`} alt=""/>{categoryNames[kind][language]} <b>{seatCards.filter(card=>card.kind===kind).length}</b></h3>
        <div className="mh4-capture-cards">{seatCards.filter(card=>card.kind===kind).map(card=><button className="mh4-captured-card" type="button" key={card.id} data-hwatu-card-id={card.id}
          aria-label={text(language,`${name(seat)} · ${card.month}월 ${card.badge.ko} · ${card.points}점 · 크게 보기`,`${name(seat)} · Mes ${card.month}, ${card.badge.es} · ${card.points} pts · Ver más grande`)}
          onPointerEnter={event=>inspect(card,event.currentTarget)} onFocus={event=>inspect(card,event.currentTarget)} onClick={event=>inspect(card,event.currentTarget)} onPointerLeave={()=>setPreview(null)} onBlur={()=>setPreview(null)}><HwatuCard card={card} language={language} compactMonth/></button>)}</div>
        {!seatCards.some(card=>card.kind===kind)&&<span className="mh4-capture-anchor" data-hwatu-landing-anchor aria-hidden="true"/>}
      </div>)}</div>
      <ul className="mh4-yakus" aria-label={text(language,`${name(seat)}의 족보 8개`,`Los ocho yakus de ${name(seat)}`)}>{yakus.map(yaku=><li className={yaku.complete?'is-complete':''} key={yaku.id}><span>{yaku.label[language]}</span><b>{yaku.complete?`+${yaku.bonus}`:`${yaku.have}/${yaku.need}`}</b></li>)}</ul>
    </section>;
  };
  const fieldCount=table.length;
  const fieldWidth=fieldCount<=8?58:fieldCount<=14?56:fieldCount<=36?42:36;
  let modal:ReactNode=null;
  if(dialog==='help')modal=<><h2>{text(language,'민화투 · 네 자리 팀전','Minhwatu · cuatro jugadores')}</h2><ol><li>{text(language,'각자 5장, 바닥 8장, 더미 20장. 나와 맞은편 AI가 한 팀이에요.','5 cartas por persona, 8 en mesa y 20 en el mazo. Tú y la IA de enfrente forman equipo.')}</li><li>{text(language,'손패를 누르면 바로 냅니다. 같은 월 바닥 패가 두 장이면 하나를 고릅니다. 이어 더미 한 장을 공개해요.','Toca una carta de tu mano para jugarla. Si hay dos cartas del mismo mes en la mesa, elige una. Después se revela una del mazo.')}</li><li>{text(language,'같은 월 세 장은 전부 가져옵니다. 손패와 더미가 모두 비면 끝나요. 고·스톱은 없어요.','Con tres cartas del mismo mes se toman todas. Termina al vaciar manos y mazo. No hay Go ni Stop.')}</li><li>{text(language,'기본 20/10/5/0점 + 개인 족보의 2배 − 상대팀 두 사람의 족보. 두 팀원의 점수를 합쳐 승패를 정해요.','Base 20/10/5/0 + doble de yakus propios − yakus de ambos rivales. Se suman los dos compañeros.')}</li><li>{text(language,'족보는 개인별입니다. 홍단·청단·초단 30점, 고도리 50점, 11월 40점, 5·10·12월 각각 20점. 팀원 패는 볼 수 없어요.','Yakus individuales: cintas 30, Godori 50, mes 11 completo 40 y meses 5/10/12 completos 20. No se ve la mano del compañero.')}</li></ol><MinhwatuCredits language={language}/></>;
  if(dialog==='events')modal=<><h2>{text(language,'민화투 최근 행동','Actividad de Minhwatu')}</h2><ol className="mh4-history">{source.events.filter(event=>event.type!=='turn').slice().reverse().map(event=><li key={event.sequence}><b>{event.actor?name(event.actor):''}</b> {event.title[language].replace(/^P[1-4] · /,'')}<div>{event.cards?.map(card=><HwatuCard card={card} language={language} key={card.id}/>)}</div></li>)}</ol></>;
  if(dialog==='exit')modal=<><h2>{text(language,'민화투를 끝낼까요?','¿Terminar Minhwatu?')}</h2><p>{text(language,'현재 판은 저장되지 않아요.','La partida actual no se guarda.')}</p><button type="button" onClick={()=>{setDialog(null);onExit?.();}}>{text(language,'게임 끝내기','Terminar partida')}</button></>;
  return <section className="mh4-table minhwatu-table" aria-label={text(language,'민화투 4인 2대2 게임판','Mesa Minhwatu de cuatro jugadores, 2 contra 2')} onKeyDown={event=>{if(dialog)return;if(event.key==='Escape'){setPreview(null);setMenu(false);if(selected){event.preventDefault();cancel();}}}}>
    <header className="mh4-header"><h1>{text(language,'민화투','Minhwatu')} <small>2 vs 2</small></h1><div className="mh4-team-score" aria-label={text(language,'팀 합계 점수','Puntos totales de equipos')}><span>{text(language,'우리 팀','Tu equipo')} <b>{teamScores.A}</b></span><span>{text(language,'상대 팀','Equipo rival')} <b>{teamScores.B}</b></span></div><nav aria-label={text(language,'민화투 메뉴','Menú de Minhwatu')}>
      <GameFeedback language={language} gameId="minhwatu" playerId="p1" view={audioView} pending={sending} identity={`${roomId}:native-minhwatu`}/>
      <button type="button" onClick={()=>setDialog('help')}>{text(language,'게임 방법','Cómo jugar')}</button><button type="button" onClick={()=>setDialog('events')}>{text(language,'최근 행동','Actividad')}</button>
      {onSelectGame&&<div className="mh4-switch"><button type="button" aria-expanded={menu} onClick={()=>setMenu(!menu)}>{text(language,'게임 바꾸기','Cambiar juego')}</button>{menu&&<div>{(['davinci','domino','splendor','marble'] as GameId[]).map(game=><button type="button" key={game} onClick={()=>void switchGame(game)}>{({davinci:{ko:'다빈치 코드',es:'Da Vinci'},domino:{ko:'도미노',es:'Dominó'},splendor:{ko:'스플렌더',es:'Splendor'},marble:{ko:'부루마블',es:'Marble'}} as any)[game][language]}</button>)}</div>}</div>}
      {onExit&&<button type="button" onClick={()=>setDialog('exit')}>{text(language,'나가기','Salir')}</button>}</nav></header>
    {(outerError||error)&&<p className="mh4-error" role="alert">{outerError||error}</p>}
    <div className="mh4-arena">{pile('p2')}{pile('p3')}{pile('p4')}
      <section className="mh4-field" aria-label={text(language,'공개된 바닥 패','Cartas visibles en la mesa')} style={{'--mh4-field-width':`${fieldWidth}px`} as CSSProperties}>
        <header><h2>{text(language,'바닥 패','Mesa')} <small>{table.length}</small></h2><strong className="mh4-phase" role="status" aria-live="polite">{instruction}</strong><div className="mh4-stock" data-hwatu-zone="deck"><i aria-hidden="true"/><b>{shown.board.deckCount}</b><span className="sr-only">{text(language,'남은 더미','Mazo restante')}</span></div></header>
        <div className="mh4-field-cards" data-hwatu-zone="table">{table.map((card,index)=>{const choice=targetChoice(index),target=Boolean(choosingTarget&&choice);return <button key={card.id} type="button" className={`mh4-field-card ${target?'is-target':''}`} data-hwatu-card-id={card.id} ref={node=>{if(node)targetButtons.current.set(index,node);else targetButtons.current.delete(index);}}
          aria-label={text(language,`${card.month}월 ${card.badge.ko}${target?' · 선택해 가져오기':''}`,`Mes ${card.month}, ${card.badge.es}${target?' · Elegir para capturar':''}`)} disabled={!target||busy} onClick={()=>choice&&void submit(choice.action)}><HwatuCard card={card} language={language}/>{target&&<span className="mh4-target-mark">{text(language,'선택','Elegir')}</span>}</button>;})}</div>
        <div className="mh4-draw" data-hwatu-zone="draw">{pending&&<><span>{text(language,'뒤집은 패','Carta revelada')}</span><div className="mh4-drawn-card" data-hwatu-card-id={pending.id}><HwatuCard card={pending} language={language}/></div></>}<span className="mh4-draw-anchor" data-hwatu-landing-anchor aria-hidden="true"/></div>
        <div className="mh4-motion"><HwatuMotion events={shown.log} language={language} playerId="p1" step={presentation.step}/></div>
      </section>
    </div>
    <div className="mh4-human">{pile('p1')}<section className={`mh4-hand ${active&&!busy?'is-active':''}`} aria-label={text(language,'내 손패','Tu mano')}><header><h2>{text(language,'내 패','Tu mano')} <small>{hand.length}</small></h2>{view.result&&<strong>{view.result.winner==='draw'?text(language,'무승부','Empate'):view.result.winner==='A'?text(language,'우리 팀 승리','Ganó tu equipo'):text(language,'상대 팀 승리','Ganaron los rivales')}</strong>}</header>
      <div className="mh4-hand-row"><div className="mh4-hand-cards" data-hwatu-zone="hand" onKeyDown={event=>{if(!active||busy||capturePhase||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;const index=hand.findIndex(card=>handButtons.current.get(card.id)===document.activeElement);if(index<0)return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?hand.length-1:(index+(event.key==='ArrowRight'?1:-1)+hand.length)%hand.length;handButtons.current.get(hand[next].id)?.focus({preventScroll:true});}}>{hand.map((card,index)=>{const playable=view.actions.some(option=>option.action.type==='play'&&option.action.payload?.index===index),capturable=active&&!capturePhase&&table.some(other=>other.month===card.month);return <button key={card.id} type="button" className={`mh4-hand-card ${selected===card.id?'is-selected':''} ${capturable?'is-capturable':''}`} data-hwatu-card-id={card.id} ref={node=>{if(node)handButtons.current.set(card.id,node);else handButtons.current.delete(card.id);}} disabled={!active||busy||capturePhase||!playable} aria-pressed={selected===card.id}
        aria-label={text(language,`${card.month}월 ${card.badge.ko}${capturable?' · 가져올 수 있음':''}`,`Mes ${card.month}, ${card.badge.es}${capturable?' · Puede capturar':''}`)} onClick={()=>chooseHand(card,index)}><HwatuCard card={card} language={language}/>{capturable&&<img className="mh4-capture-mark" src="/images/hwatu-support/capture.svg" alt="" aria-hidden="true"/>}</button>;})}</div>
        <div className="mh4-hand-actions">{active&&selectedCard&&!capturePhase&&<button type="button" disabled={busy} onClick={cancel}>{text(language,'취소','Cancelar')}</button>}{view.result&&onReplay&&<button type="button" className="mh4-confirm" disabled={busy} onClick={()=>void replay()}>{text(language,'한 판 더','Otra partida')}</button>}</div>
      </div>
    </section></div>
    {preview&&<div className="mh4-preview" role="tooltip" style={{left:preview.left,top:preview.top}}><HwatuCard card={preview.card} language={language}/><span>{text(language,`${preview.card.month}월 ${preview.card.badge.ko} · ${preview.card.points}점`,`Mes ${preview.card.month}, ${preview.card.badge.es} · ${preview.card.points} pts`)}</span></div>}
    {dialog&&<div className="mh4-dialog-overlay" onClick={()=>setDialog(null)}><div className="mh4-dialog" role="dialog" aria-modal="true" aria-label={text(language,dialog==='help'?'민화투 게임 방법':dialog==='events'?'민화투 최근 행동':'민화투 종료',dialog==='help'?'Cómo jugar Minhwatu':dialog==='events'?'Actividad de Minhwatu':'Salir de Minhwatu')} ref={dialogRef} onClick={event=>event.stopPropagation()}><button className="mh4-dialog-close" type="button" onClick={()=>setDialog(null)}>{text(language,'닫기','Cerrar')}</button>{modal}</div></div>}
  </section>;
}

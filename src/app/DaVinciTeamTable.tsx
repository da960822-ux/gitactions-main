import { Fragment, useEffect, useRef, useState } from 'react';
import type { FourSeat, FourView } from '../core/fourPlayer';
import type { GameAction, GameId, Language } from '../core/types';
import type { FourDavinciView, FourDavinciVisibleTile } from '../games/fourDavinci';
import { GameFeedback } from './GameFeedback';
import { playCue, type AudioCue } from '../audio/audio';
import '../styles/davinci-premium.css';
import { getJokerPortraits } from './private-game-art';
import '../styles/davinci-team.css';

type EnemySeat = 'p2' | 'p4';
type Props = { view: FourView; language: Language; runAction: (action: GameAction) => void | Promise<unknown>; nickname?: string; roomId?: string; version?: number; onReplay?: () => void | Promise<void>; onExit?: () => void; onSelectGame?: (game: GameId) => void | Promise<void>; error?: string; busy?: boolean };
const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
const seatName = (seat: FourSeat, language: Language) => copy(language, seat === 'p1' ? '나' : seat === 'p3' ? '팀원' : seat === 'p2' ? '상대 1' : '상대 2', seat === 'p1' ? 'Tú' : seat === 'p3' ? 'Compañero' : seat === 'p2' ? 'Rival 1' : 'Rival 2');

export function daVinciTeamAction(view: FourDavinciView, target: EnemySeat, action: GameAction): GameAction | null {
  if (view.result || view.turn !== 'p1') return null;
  if (action.type === 'guess') {
    if (action.payload?.target !== undefined && action.payload.target !== target) return null;
    return view.actions.find(option => option.action.type === 'guess' && option.action.payload?.target === target &&
      option.action.payload.index === action.payload?.index && option.action.payload.value === action.payload?.value)?.action ?? null;
  }
  return view.actions.find(option => option.action.type === action.type && JSON.stringify(option.action.payload ?? {}) === JSON.stringify(action.payload ?? {}))?.action ?? null;
}


type PublicEvent = FourDavinciView['policy']['log'][number];
type TileTarget = { seat: EnemySeat; index: number };
export function fourDaVinciEventCue(event: PublicEvent | undefined, result: FourDavinciView['result'] = null): AudioCue | null {
  if(result)return result.winner==='A'?'win':result.winner==='B'?'lose':'event';
  if(!event)return null;
  return event.type==='draw'?'draw':event.type==='arrange'?'place':event.type==='correct-guess'?'correct':event.type==='wrong-guess'?'error':event.type==='stop'||event.type==='skip-draw'?'turn':null;
}
export function fourDaVinciTileFeedback(view: FourDavinciView, event: PublicEvent | undefined, seat: FourSeat, index: number) {
  const tile = view.policy.racks[seat][index];
  const flipping = Boolean(tile?.revealed && event && (event.type === 'correct-guess' && event.target === seat && event.index === index || event.type === 'wrong-guess' && event.actor === seat && event.revealedOwnIndex === index));
  return { flipping, winning: Boolean(flipping && view.result?.winner === 'A' && event?.type === 'correct-guess' && (seat === 'p2' || seat === 'p4')),
    arriving: Boolean(seat === 'p1' && event?.actor === seat && (event.type === 'draw' || event.type === 'arrange') && event.insertedIndex === index) };
}
export function fourDaVinciGuessLabel(language: Language, target: TileTarget, tile: FourDavinciVisibleTile, value: number | 'joker') {
  return copy(language, `${seatName(target.seat, language)} ${target.index + 1}번 ${tile.color === 'black' ? '검정' : '흰색'} = ${value === 'joker' ? '조커' : value} 추측`,
    `${seatName(target.seat, language)} · ficha ${target.index + 1} ${tile.color === 'black' ? 'negra' : 'blanca'} = ${value === 'joker' ? 'comodín' : value}`);
}
function NativeTile({ tile, index, own, language, feedback }: { tile: FourDavinciVisibleTile; index: number; own: boolean; language: Language; feedback: ReturnType<typeof fourDaVinciTileFeedback> }) {
  const [failedPortrait, setFailedPortrait] = useState<string>();
  const visible = own || tile.revealed, value = visible ? tile.value === 'joker' ? '－' : String(tile.value ?? '· ·') : '· ·';
  const portrait = visible && tile.value === 'joker' ? getJokerPortraits()[tile.color] : undefined;
  return <><span className="dv-tile-order">{index + 1}</span><b>{portrait && portrait !== failedPortrait ? <img className="dv-joker-portrait" src={portrait} alt="" aria-hidden="true" draggable={false} onError={() => setFailedPortrait(portrait)}/> : value}</b>
    <span className="dv-tile-color">{copy(language, tile.color === 'black' ? '검정' : '흰색', tile.color === 'black' ? 'Negra' : 'Blanca')}</span>
    {tile.revealed && <small className="dv-tile-state"><svg aria-hidden="true"><use href="/images/davinci/state-icons.svg#revealed"/></svg>{copy(language, '공개', 'Visible')}</small>}
    {feedback.winning && <span className="sr-only">{copy(language, '팀 승리를 결정한 타일', 'Ficha que decidió la victoria del equipo')}</span>}
  </>;
}

export default function DaVinciTeamTable({ view: rawView, language, runAction, nickname, roomId, version, onReplay, onExit, onSelectGame, error, busy = false }: Props) {
  const view = rawView as FourDavinciView, latest = view.policy.log.at(-1);
  const [target, setTarget] = useState<TileTarget | null>(null);
  const [value, setValue] = useState<number | 'joker' | null>(null);
  const [filter, setFilter] = useState<'all' | 'black' | 'white'>('all');
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState('');
  const [dialog, setDialog] = useState<'rules' | 'exit' | null>(null);
  const [animatedEvent, setAnimatedEvent] = useState<PublicEvent>();
  const lock = useRef(false), previousSequence = useRef(latest?.sequence ?? 0), commitRef = useRef<HTMLButtonElement>(null), dialogRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef(new Map<string, HTMLButtonElement>());
  const active = view.turn === 'p1' && !view.result, disabled = pending || busy;
  const targetTile = target ? view.policy.racks[target.seat][target.index] : undefined;
  const guess = target && value !== null ? daVinciTeamAction(view, target.seat, { type: 'guess', payload: { target: target.seat, index: target.index, value } }) : null;
  const controls = view.actions.filter(({ action }) => ['draw', 'skip-draw', 'stop', 'finish-setup'].includes(action.type));
  const moving = view.policy.ownJokerToPlace;
  const ownWithoutMoving = moving ? view.policy.own.filter((_, index) => index !== moving.index) : view.policy.own;
  const sequence = latest?.sequence ?? 0;
  const feedbackEvent = view.result ? latest : animatedEvent;
  const scoreA = view.players.filter(player => player.id === 'p1' || player.id === 'p3').reduce((n, player) => n + player.score, 0);
  const scoreB = view.players.filter(player => player.id === 'p2' || player.id === 'p4').reduce((n, player) => n + player.score, 0);
  const history = view.policy.log.filter(event => event.type === 'correct-guess' || event.type === 'wrong-guess').slice(-3);
  useEffect(() => {
    if (sequence > previousSequence.current) { setAnimatedEvent(latest); const cue=fourDaVinciEventCue(latest,view.result); if(cue)playCue('davinci',cue); }
    previousSequence.current = sequence;
    setValue(null);
    if (view.phase !== 'guess' || !active || target && view.policy.racks[target.seat][target.index]?.revealed) setTarget(null);
  }, [sequence, view.phase, active]);
  useEffect(() => {
    if (!animatedEvent) return;
    const timer = window.setTimeout(() => setAnimatedEvent(undefined), 1800);
    return () => window.clearTimeout(timer);
  }, [animatedEvent]);
  useEffect(() => { if(value !== null)commitRef.current?.focus({ preventScroll: true }); }, [value]);
  useEffect(() => {
    if (!dialog) return;
    const prior = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>('button')?.focus();
    return () => prior?.focus({ preventScroll: true });
  }, [dialog]);
  const cancel = () => {
    if (lock.current || busy) return;
    setValue(null);
    if(target)tileRefs.current.get(`${target.seat}:${target.index}`)?.focus({preventScroll:true});
  };
  const send = async (action: GameAction) => {
    if (lock.current || busy || !active) return false;
    const mapped = daVinciTeamAction(view, action.payload?.target === 'p4' ? 'p4' : 'p2', action);
    if (!mapped) return false;
    lock.current = true; setPending(true); setLocalError('');
    if(action.type === 'guess')playCue('davinci','guess');
    try { const accepted = await runAction(mapped); if(accepted !== false)setValue(null); return accepted; }
    catch { setLocalError(copy(language,'행동을 확인하지 못했어요. 다시 선택해 주세요.','No se pudo confirmar la acción. Elige otra vez.')); return false; }
    finally { lock.current = false; setPending(false); }
  };
  const choose = (seat: EnemySeat, index: number) => {
    if(!active || view.phase !== 'guess' || disabled)return;
    setTarget({seat,index});setValue(null);playCue('davinci','select');
  };
  const actionCue = view.result ? copy(language,'팀전 종료','Partida terminada') : !active ? copy(language,`${seatName(view.turn, language)} 차례`, `Turno de ${seatName(view.turn, language)}`)
    : moving ? copy(language,'조커를 놓을 자리를 고르세요','Elige dónde colocar el comodín')
      : view.phase === 'setup' ? copy(language,'패를 확인하고 준비 완료','Revisa tus fichas y confirma')
        : view.phase === 'draw' ? copy(language,'타일을 한 장 뽑으세요','Roba una ficha')
          : !target ? copy(language,'상대의 숨은 타일을 누르세요','Pulsa una ficha rival oculta') : value === null ? copy(language,'숫자 또는 조커를 고르세요','Elige un número o comodín') : copy(language,'선택한 타일을 추측하세요','Adivina la ficha elegida');
  const rack = (seat: FourSeat) => {
    const player = view.players.find(item=>item.id===seat), own=seat==='p1';
    const tiles = own ? view.policy.own : view.policy.racks[seat];
    const tileNode = (tile: FourDavinciVisibleTile, index: number) => {
      const feedback = fourDaVinciTileFeedback(view, feedbackEvent, seat, index), selected = target?.seat === seat && target.index === index;
      const selectable = !own && seat !== 'p3' && !tile.revealed && active && view.phase === 'guess';
      const masked = !own && !tile.revealed ? {...tile,value:null} : tile;
      const tileClass = `dv-tile dv-tile-${tile.color} ${own?'dv-own-tile':''} ${tile.revealed?'is-revealed':''} ${selected?'is-target':''} ${feedback.winning?'is-winning-reveal':feedback.flipping?'is-flipping':''} ${feedback.arriving?'is-arriving':''}`;
      const label = copy(language,`${seatName(seat,language)} ${index+1}번 ${tile.color==='black'?'검정':'흰색'} 타일, ${own||tile.revealed ? tile.value==='joker'?'조커':tile.value : '숫자 숨김'}`,`${seatName(seat,language)} · ficha ${index+1} ${tile.color==='black'?'negra':'blanca'}, ${own||tile.revealed ? tile.value==='joker'?'comodín':tile.value : 'número oculto'}`);
      const content=<NativeTile tile={masked} index={index} own={own} language={language} feedback={feedback}/>;
      return selectable ? <button type="button" className={tileClass} key={`${seat}-${index}`} ref={element=>{if(element)tileRefs.current.set(`${seat}:${index}`,element);else tileRefs.current.delete(`${seat}:${index}`);}} data-seat={seat} data-tile-index={index} aria-label={label} aria-pressed={selected} disabled={disabled || filter!=='all' && tile.color!==filter} onClick={()=>choose(seat as EnemySeat,index)}>{content}{selected&&<em><svg aria-hidden="true"><use href="/images/davinci/state-icons.svg#target"/></svg>{copy(language,'목표','Objetivo')}</em>}</button>
        : <div className={tileClass} role="img" aria-label={label} key={`${seat}-${index}`} data-seat={seat} data-tile-index={index}>{content}</div>;
    };
    return <section className={`dv4-rack dv4-rack-${seat} ${view.turn===seat&&!view.result?'is-current':''} ${player?.eliminated?'is-eliminated':''}`} aria-label={copy(language,`${seatName(seat,language)} 타일`, `Fichas de ${seatName(seat,language)}`)}>
      <header><h2>{own?nickname||seatName(seat,language):seatName(seat,language)}</h2><span>{player?.eliminated?copy(language,'탈락','Eliminado'):view.turn===seat&&!view.result?copy(language,'차례','Turno'):view.phase==='setup'?(view.policy.ready[seat]?copy(language,'준비 완료','Listo'):copy(language,'준비 중','Preparando')):copy(language,`숨김 ${player?.count??0}`,`${player?.count??0} ocultas`)}</span></header>
      {own&&moving ? <div className="dv4-joker-placement"><div className={`dv-tile dv-joker-preview dv-tile-${moving.color}`} role="img" aria-label={copy(language,'배치할 조커','Comodín por colocar')}><NativeTile tile={view.policy.own[moving.index]} index={moving.index} own language={language} feedback={{flipping:false,winning:false,arriving:false}}/></div><div className="dv4-joker-gaps" role="group" aria-label={copy(language,'조커를 놓을 자리','Posición del comodín')}>{Array.from({length:ownWithoutMoving.length+1},(_,index)=>{
        const choice=view.actions.find(option=>option.action.type==='place-joker'&&option.action.payload?.index===index);
        return <Fragment key={index}><button type="button" className="dv4-gap" aria-label={copy(language,`${index+1}번째 빈 칸에 조커 배치`,`Colocar comodín en espacio ${index+1}`)} disabled={disabled||!choice} onClick={()=>choice&&void send(choice.action)}>{copy(language,'여기 놓기','Colocar')}</button>{index<ownWithoutMoving.length&&tileNode(ownWithoutMoving[index],index>=moving.index?index+1:index)}</Fragment>;
      })}</div></div> : <div className="dv4-tiles">{tiles.map(tileNode)}</div>}
    </section>;
  };
  return <div className="dv4-table" data-phase={view.phase} data-version={version} aria-label={copy(language,'다빈치 코드 네 사람 게임판','Mesa de Código Da Vinci para cuatro')} onKeyDown={event=>{
    if(event.key==='Escape'){if(dialog){event.preventDefault();setDialog(null);}else if(value!==null){event.preventDefault();cancel();}}
    if(event.key==='Tab'&&dialog){const items=[...(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],select')??[])];const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
  }}>
    <header className="dv4-header"><div><h1>{copy(language,'다빈치 코드','Código Da Vinci')} <small>{copy(language,'2대2','2 contra 2')}</small></h1><span className="dv4-team-score">{copy(language,'우리 팀','Tu equipo')} <b>{view.result?.scores.A??scoreA} : {view.result?.scores.B??scoreB}</b> {copy(language,'상대 팀','Rivales')}</span></div><nav aria-label={copy(language,'게임 메뉴','Menú del juego')}>
      <GameFeedback gameId="davinci" language={language} playerId="p1" view={null} pending={disabled} identity={roomId??'four-davinci'}/>
      <button type="button" onClick={()=>setDialog('rules')}>{copy(language,'규칙','Reglas')}</button>
      {(onSelectGame||onReplay||onExit)&&<details className="dv4-menu"><summary>{copy(language,'메뉴','Menú')}</summary><div>{onReplay&&!view.result&&<button type="button" disabled={disabled} onClick={()=>void onReplay()}>{copy(language,'새 판','Nueva partida')}</button>}{onSelectGame&&<><button type="button" disabled={disabled} onClick={()=>void onSelectGame('splendor')}>{copy(language,'스플렌더','Splendor')}</button><button type="button" disabled={disabled} onClick={()=>void onSelectGame('minhwatu')}>{copy(language,'민화투','Minhwatu')}</button><button type="button" disabled={disabled} onClick={()=>void onSelectGame('marble')}>{copy(language,'부루마블','Marble')}</button><button type="button" disabled={disabled} onClick={()=>void onSelectGame('domino')}>{copy(language,'도미노','Dominó')}</button></>}{onExit&&<button type="button" onClick={()=>setDialog('exit')}>{copy(language,'나가기','Salir')}</button>}</div></details>}
    </nav></header>
    {(error||localError)&&<p role="alert" className="dv4-error">{error||localError}</p>}
    <div className="dv4-tabletop">{rack('p3')}{rack('p2')}
      <section className="dv4-deduction" aria-label={copy(language,'내 차례와 추리','Tu turno y deducción')}>
        <div className="dv4-pool" aria-label={copy(language,`남은 더미 ${view.policy.deckCount}개`,`Mazo: ${view.policy.deckCount} fichas`)}><i className="dv4-pool-back" aria-hidden="true"/><i className="dv4-pool-back" aria-hidden="true"/><span>{copy(language,'더미','Mazo')} <b>{view.policy.deckCount}</b></span></div>
        <p className="dv4-action-cue" role="status">{actionCue}</p>
        {view.result?<div className={`dv4-result ${view.result.winner==='A'?'is-win':''}`} role="status"><strong>{view.result.winner==='A'?copy(language,'우리 팀 승리!','¡Ganó tu equipo!'):view.result.winner==='B'?copy(language,'상대 팀 승리','Ganó el equipo rival'):copy(language,'무승부','Empate')}</strong><p>{view.result.reason[language]}</p>{onReplay&&<button type="button" onClick={()=>void onReplay()} disabled={disabled}>{copy(language,'다시 하기','Volver a jugar')}</button>}</div>:<>
          {controls.length>0&&<div className="dv4-actions">{controls.map(({action})=><button type="button" key={action.type} className={action.type==='stop'?'is-secondary':''} disabled={disabled} onClick={()=>void send(action)}>{copy(language,action.type==='draw'?'타일 뽑기':action.type==='skip-draw'?'추리 시작':action.type==='stop'?'차례 마치기':'준비 완료',action.type==='draw'?'Robar ficha':action.type==='skip-draw'?'Adivinar':action.type==='stop'?'Terminar turno':'Listo')}</button>)}</div>}
          {active&&view.phase==='guess'&&<div className="dv4-picker" aria-label={copy(language,'선택한 타일의 숫자 추리','Adivinar la ficha elegida')}><div className="dv4-filters" role="group" aria-label={copy(language,'상대 타일 색 필터','Filtrar fichas rivales por color')}>{(['all','black','white']as const).map(color=><button type="button" key={color} aria-pressed={filter===color} disabled={disabled} onClick={()=>{setFilter(color);setTarget(null);setValue(null);}}>{copy(language,color==='all'?'전체':color==='black'?'검정':'흰색',color==='all'?'Todas':color==='black'?'Negras':'Blancas')}</button>)}</div>
            <div className="dv4-numbers" role="group" aria-label={copy(language,'추측할 숫자 또는 조커','Número o comodín que quieres adivinar')}>{([...Array.from({length:12},(_,n)=>n),'joker']as const).map(number=><button type="button" key={number} className={number==='joker'?'is-joker':''} aria-pressed={value===number} disabled={disabled||!target||!daVinciTeamAction(view,target.seat,{type:'guess',payload:{target:target.seat,index:target.index,value:number}})} onClick={()=>{setValue(number);playCue('davinci','select');}}>{number==='joker'?'－':number}</button>)}</div>
            <button ref={commitRef} type="button" className="dv4-commit" disabled={disabled||!guess} onClick={()=>guess&&void send(guess)}>{pending?copy(language,'전송 중…','Enviando…'):target&&targetTile&&value!==null?fourDaVinciGuessLabel(language,target,targetTile,value):copy(language,target?'숫자를 고르세요':'상대 타일을 고르세요',target?'Elige un número':'Elige una ficha rival')}</button>{value!==null&&<button type="button" className="dv4-cancel" disabled={disabled} onClick={cancel}>{copy(language,'취소','Cancelar')}</button>}
          </div>}
        </>}
      </section>{rack('p4')}{rack('p1')}
    </div>
    <footer className="dv4-history" role="log" aria-live="polite" aria-relevant="additions" aria-label={copy(language,'최근 공개 추리','Deducciones públicas recientes')}><b>{copy(language,'최근 추리','Deducciones')}</b>{history.length?history.map(event=><span key={event.sequence} className={event.type==='correct-guess'?'is-correct':'is-wrong'}>{seatName(event.actor,language)} → {event.target?seatName(event.target,language):''} {Number(event.index)+1} · <strong>{event.value==='joker'?'－':event.value}</strong> <small>{event.type==='correct-guess'?copy(language,'정답','Acierto'):copy(language,'오답','Fallo')}</small></span>):<span>{copy(language,'공개된 추리가 아직 없어요','Aún no hay deducciones públicas')}</span>}</footer>
    {dialog&&<div className="dv4-dialog-backdrop" onClick={()=>setDialog(null)}><div ref={dialogRef} className="dv4-dialog" role="dialog" aria-modal="true" aria-label={copy(language,dialog==='rules'?'다빈치 팀전 규칙':'게임 종료',dialog==='rules'?'Reglas de Da Vinci por equipos':'Terminar partida')} onClick={event=>event.stopPropagation()}>{dialog==='rules'?<><h2>{copy(language,'다빈치 코드 · 네 사람','Código Da Vinci · cuatro jugadores')}</h2><p>{copy(language,'나와 맞은편 팀원이 한 팀입니다. 각자 3장씩 받고 숫자는 작은 순서로, 같은 숫자는 검정 먼저 놓습니다. 조커는 원하는 자리에 놓고 이후 옮기지 않습니다.','Tú y tu compañero de enfrente forman un equipo. Cada persona recibe 3 fichas ordenadas; negro antes de blanco al empatar. Coloca los comodines donde quieras y no los muevas después.')}</p><p>{copy(language,'내 차례에는 한 장 뽑고 양옆 상대의 숨은 타일을 추리합니다. 맞히면 계속하거나 멈추고, 틀리면 방금 뽑은 내 타일이 공개됩니다. 더미가 비면 새 공개 없이 차례를 넘깁니다.','Roba una ficha y adivina una ficha de cualquiera de los dos rivales. Al acertar puedes continuar o parar; al fallar revelas la ficha robada. Sin mazo, un fallo solo termina el turno.')}</p><p>{copy(language,'패가 모두 공개된 사람은 탈락합니다. 상대 둘이 모두 탈락하면 팀 승리입니다. 팀원 패도 공유하지 않는 조커 포함 하우스 팀 규칙입니다.','Quien tiene todas sus fichas reveladas queda eliminado. Elimina a los dos rivales para ganar. Esta variante casera con comodines no comparte las fichas privadas entre compañeros.')}</p><button type="button" onClick={()=>setDialog(null)}>{copy(language,'닫기','Cerrar')}</button></>:<><h2>{copy(language,'현재 게임을 나갈까요?','¿Salir de la partida?')}</h2><p>{copy(language,'진행 상황은 저장되지 않아요.','El progreso no se guarda.')}</p><button type="button" onClick={()=>setDialog(null)}>{copy(language,'계속하기','Continuar')}</button><button type="button" onClick={()=>{setDialog(null);onExit?.();}}>{copy(language,'나가기','Salir')}</button></>}</div></div>}
  </div>;
}

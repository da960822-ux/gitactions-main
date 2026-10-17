import { useEffect, useRef, useState } from 'react';
import type { GameAction, Language, PlayerId } from '../core/types';
import { GameValue } from './GameValue';
import { playCue } from '../audio/audio';
import { getJokerPortraits, type JokerPortraits } from './private-game-art';
import '../styles/davinci-premium.css';

type Choice = { label: Record<Language, string>; action: GameAction };
type TileValue = number | 'joker';
type Tile = { color: 'black' | 'white'; value: TileValue | null; revealed?: boolean };
type EventType = 'result' | 'correct' | 'wrong' | 'draw' | 'rival-draw' | 'arrange' | 'skip-draw' | 'stop' | 'turn';
type VisualEvent = { key: string; snapshot: string; viewer: PlayerId; type: EventType; index?: number; value?: TileValue; guess?: TileValue; actor?: PlayerId };
export type DaVinciTableProps = { view: any; language: Language; playerId: PlayerId; runAction: (action: GameAction) => void | Promise<unknown>; jokerPortraits?: JokerPortraits };

const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
const record = (value: unknown): Record<string, any> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
const list = (value: unknown): any[] => Array.isArray(value) ? value : [];
const colorLabel = (color: string, language: Language) => color === 'white' ? copy(language, '흰색', 'Blanca') : copy(language, '검정', 'Negra');
const tileValueLabel = (value: TileValue | null | undefined) => value === 'joker' ? '－' : value == null ? '· ·' : String(value);
function JokerPortrait({ src }: { src?: string }) {
  const [failedSource, setFailedSource] = useState<string | undefined>();
  return src && src !== failedSource ? <img className="dv-joker-portrait" src={src} alt="" aria-hidden="true" draggable={false} onError={() => setFailedSource(src)}/> : <>－</>;
}
const resultKey = (result: any) => result ? `${result.winner ?? ''}:${result.reason ?? ''}:${JSON.stringify(result.scores ?? {})}` : '';
export function findDaVinciGuess(choices: unknown[], index: number, value: TileValue): Choice | undefined {
  return choices.map(record).map(choice => choice as unknown as Choice).find(choice => choice.action?.type === 'guess' && Number(choice.action.payload?.index) === index && choice.action.payload?.value === value);
}
export function findDaVinciJokerPlacement(choices: unknown[], gap: number): Choice | undefined {
  return choices.map(record).map(choice => choice as unknown as Choice).find(choice => choice.action?.type === 'place-joker' && Number(choice.action.payload?.index) === gap);
}
export function daVinciGuessButtonLabel(language: Language, value: TileValue): string {
  return value === 'joker' ? copy(language, '조커로 추측하기', 'Adivinar el comodín') : copy(language, '이 숫자로 추측하기', 'Adivinar este número');
}
export function davinciSnapshotKey(view: any) {
  const own = list(view?.hand).map((tile: any) => `${tile?.color}:${tile?.value}:${tile?.revealed ? 1 : 0}`).join('|');
  const rival = list(view?.board?.opponentTiles).map((tile: any) => `${tile?.color}:${tile?.revealed ? tile?.value : '?'}:${tile?.revealed ? 1 : 0}`).join('|');
  const setupReady = `${view?.board?.setupReady?.p1 ? 1 : 0}:${view?.board?.setupReady?.p2 ? 1 : 0}`;
  const movingJoker = `${view?.ownJokerToPlace?.color ?? ''}:${view?.ownJokerToPlace?.index ?? ''}`;
  return [view?.turn ?? '', view?.phase ?? '', own, rival, setupReady, movingJoker, resultKey(view?.result), record(view?.board?.lastEvent).sequence ?? ''].join('~');
}

export function deriveDaVinciVisualEvent(previous: { viewer: PlayerId; view: any } | null, next: any, viewer: PlayerId): VisualEvent | null {
  if (!previous?.view || previous.viewer !== viewer || previous.view?.result) return null;
  const before = previous.view, beforeOwn = list(before.hand), afterOwn = list(next?.hand), beforeRival = list(before?.board?.opponentTiles), afterRival = list(next?.board?.opponentTiles);
  const beforeResult = !!before?.result, afterResult = !!next?.result;
  let type: EventType | null = null, index: number | undefined, value: TileValue | undefined;
  let guess: TileValue | undefined, actor: PlayerId | undefined;
  const event = record(next?.board?.lastEvent), priorEvent = record(before?.board?.lastEvent);
  const hasNewPublicEvent = Number.isSafeInteger(event.sequence) && event.sequence > (Number.isSafeInteger(priorEvent.sequence) ? priorEvent.sequence : 0);
  if (hasNewPublicEvent) {
      actor = event.actor === 'p1' || event.actor === 'p2' ? event.actor : undefined;
      guess = event.guess === 'joker' ? 'joker' : Number.isInteger(event.guess) && Number(event.guess) >= 0 && Number(event.guess) <= 11 ? Number(event.guess) : undefined;
      // A failed guess publicly names its target, but the flip is the actor's
      // newly drawn tile. Keep those two positions distinct in the animation.
      const rawIndex = event.type === 'wrong-guess'
        ? (Number.isInteger(event.revealedOwnIndex) ? Number(event.revealedOwnIndex) : undefined)
        : (Number.isInteger(event.targetIndex) ? Number(event.targetIndex) : undefined);
      if (event.type === 'draw') {
        type = actor === viewer ? 'draw' : 'rival-draw';
        index = Number.isInteger(event.insertedIndex) ? Number(event.insertedIndex) : undefined;
        const drawn = actor === viewer ? afterOwn[index ?? -1] : afterRival[index ?? -1];
        if (actor === viewer && drawn?.value === 'joker') value = 'joker';
      }
      else if (event.type === 'arrange') { type = 'arrange'; index = [event.insertedIndex, event.index, event.destinationIndex].find(Number.isInteger); }
      else if (event.type === 'skip-draw') type = 'skip-draw';
      else if (event.type === 'stop') type = 'stop';
      else if (event.type === 'correct-guess') {
        type = 'correct'; index = rawIndex;
        const revealed = actor === viewer ? afterRival[index ?? -1] : afterOwn[index ?? -1];
        if (revealed?.revealed && (revealed.value === 'joker' || Number.isFinite(Number(revealed.value)))) value = revealed.value;
      } else if (event.type === 'wrong-guess') {
        type = 'wrong'; index = rawIndex;
        const revealed = actor === viewer ? afterOwn[index ?? -1] : afterRival[index ?? -1];
        if (revealed?.revealed && (revealed.value === 'joker' || Number.isFinite(Number(revealed.value)))) value = revealed.value;
      }
  }
  if (!type && !Object.prototype.hasOwnProperty.call(next?.board ?? {}, 'lastEvent')) {
    const newOwn = afterOwn.map((tile, i) => ({ tile, i, knownBefore: beforeOwn.some((old: any) => old?.color === tile?.color && old?.value === tile?.value) })).find(item => !item.knownBefore);
    const ownReveal = afterOwn.map((tile, i) => ({ tile, i, old: beforeOwn.find((candidate: any) => candidate?.color === tile?.color && candidate?.value === tile?.value) })).find(item => item.tile?.revealed && item.old && !item.old.revealed);
    const rivalReveal = afterRival.map((tile, i) => ({ tile, i, old: beforeRival[i] })).find(item => item.tile?.revealed && !item.old?.revealed);
    const turnChanged = before?.turn !== next?.turn;
    if (ownReveal) {
      index = ownReveal.i; value = ownReveal.tile.value; actor = before?.turn === 'p1' || before?.turn === 'p2' ? before.turn : undefined;
      type = before.turn === viewer ? 'wrong' : 'correct';
    } else if (rivalReveal) {
      index = rivalReveal.i; actor = before?.turn === 'p1' || before?.turn === 'p2' ? before.turn : undefined;
      if (rivalReveal.tile?.value !== null && rivalReveal.tile?.value !== undefined) value = rivalReveal.tile.value;
      type = turnChanged ? 'wrong' : 'correct';
    } else if (newOwn) { type = newOwn.tile?.revealed ? 'wrong' : 'draw'; actor = viewer; index = newOwn.i; value = newOwn.tile?.revealed ? Number(newOwn.tile.value) : undefined; }
    else if (afterRival.length > beforeRival.length) { type = 'rival-draw'; actor = viewer === 'p1' ? 'p2' : 'p1'; }
    else if (before?.turn === viewer && before?.phase === 'draw' && next?.turn === viewer && next?.phase === 'guess') { type = 'skip-draw'; actor = viewer; }
    else if (turnChanged) { type = 'turn'; actor = before?.turn; }
  }
  if (!type && !beforeResult && afterResult) type = 'result';
  if (!type) return null;
  const snapshot = davinciSnapshotKey(next);
  return { key: `${viewer}:${type}:${snapshot}:${Number(record(next?.board?.lastEvent).sequence ?? 0)}`, snapshot, viewer, type, ...(index === undefined ? {} : { index }), ...(value === undefined || (value !== 'joker' && !Number.isFinite(value)) ? {} : { value }), ...(guess === undefined ? {} : { guess }), ...(actor ? { actor } : {}) };
}

export default function DaVinciTable({ view, language, playerId, runAction, jokerPortraits = getJokerPortraits() }: DaVinciTableProps) {
  const board = record(view?.board), rival: Tile[] = list(board.opponentTiles), own: Tile[] = list(view?.hand);
  const choices: Choice[] = list(view?.actions), guessChoices = choices.filter(choice => choice.action.type === 'guess');
  const hidden = rival.map((tile, index) => ({ tile, index })).filter(item => !item.tile?.revealed);
  const hasJokerRules = Number(board.tileCount ?? 24) >= 26 || guessChoices.some(choice => choice.action.payload?.value === 'joker');
  const ownReady = board.setupReady?.[playerId] === true;
  const ownJokerToPlace = record(view?.ownJokerToPlace);
  const hasOwnJokerToPlace = (ownJokerToPlace.color === 'black' || ownJokerToPlace.color === 'white') && Number.isInteger(ownJokerToPlace.index) && own[ownJokerToPlace.index]?.value === 'joker';
  const placementChoices = choices.filter(choice => choice.action.type === 'place-joker');
  const finishSetupChoice = choices.find(choice => choice.action.type === 'finish-setup');
  const setupIncomplete = board.setupReady != null && !(board.setupReady.p1 && board.setupReady.p2);
  const setupPhase = view?.phase === 'setup' || (ownReady && setupIncomplete);
  const placementPhase = view?.phase === 'place-joker';
  const active = view?.turn === playerId && !view?.result && !(setupPhase && ownReady) && view?.phase !== 'waiting';
  const gameInteractionPhase = !view?.result && !setupPhase && !placementPhase && view?.phase !== 'waiting';
  const initialDeal = setupPhase && !list(board.actionLog).length && board.lastEvent == null && !board.setupReady?.p1 && !board.setupReady?.p2 && Number(board.turnNumber ?? 1) === 1;
  const drawChoice = choices.find(choice => choice.action.type === 'draw');
  const skipDrawChoice = choices.find(choice => choice.action.type === 'skip-draw');
  const stopChoice = choices.find(choice => choice.action.type === 'stop');
  const ownHandWithoutMovingJoker = hasOwnJokerToPlace ? own.filter((_, index) => index !== Number(ownJokerToPlace.index)) : own;
  const [colorFilter, setColorFilter] = useState<'all' | 'white' | 'black'>('all');
  const [targetIndex, setTargetIndex] = useState<number>(hidden[0]?.index ?? 0);
  const [number, setNumber] = useState<TileValue>(0);
  const [confirming, setConfirming] = useState<Choice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const restoreTargetFocus = useRef(false);
  const snapshotKey = davinciSnapshotKey(view);
  const previous = useRef<{ viewer: PlayerId; view: any } | null>(null);
  const mounted = useRef(true);
  const [visualEvent, setVisualEvent] = useState<VisualEvent | null>(null);
  useEffect(() => {
    const prior = previous.current;
    previous.current = { viewer: playerId, view };
    const event = deriveDaVinciVisualEvent(prior, view, playerId);
    setVisualEvent(event);
    setConfirming(null);
    setSubmitting(false);
  }, [snapshotKey, playerId]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (!visualEvent || visualEvent.viewer !== playerId) return;
    const timer = window.setTimeout(() => setVisualEvent(current => current?.key === visualEvent.key ? null : current), 1800);
    return () => window.clearTimeout(timer);
  }, [visualEvent, playerId]);
  useEffect(() => {
    if (!hidden.some(item => item.index === targetIndex)) setTargetIndex(hidden[0]?.index ?? 0);
  }, [rival.map(tile => `${tile?.revealed ? 1 : 0}:${tile?.color}`).join('|'), targetIndex]);
  useEffect(() => {
    if (confirming) confirmButtonRef.current?.focus();
    else if (restoreTargetFocus.current) {
      restoreTargetFocus.current = false;
      tableRef.current?.querySelector<HTMLButtonElement>('.dv-rival-rack button[aria-pressed="true"]')?.focus();
    }
  }, [confirming]);

  const filteredTargets = hidden.filter(item => colorFilter === 'all' || item.tile.color === colorFilter);
  const target = active && gameInteractionPhase ? hidden.find(item => item.index === targetIndex) : undefined;
  const cancelGuess = () => { restoreTargetFocus.current = true; setConfirming(null); };
  const guess = findDaVinciGuess(guessChoices, targetIndex, number);
  const visibleEvent = visualEvent?.viewer === playerId && visualEvent.snapshot === snapshotKey ? visualEvent : null;
  const statusText = (event: VisualEvent) => {
    if (event.type === 'result') return copy(language, '다빈치 코드 대국이 끝났어요.', 'La partida de Código Da Vinci terminó.');
    if (event.type === 'correct' && event.actor !== playerId) return event.index !== undefined && event.value !== undefined ? copy(language, `상대가 내 ${event.index + 1}번째 타일을 맞혔어요: ${tileValueLabel(event.value)}.`, `La otra persona acertó mi ficha ${event.index + 1}: ${tileValueLabel(event.value)}.`) : copy(language, '상대가 내 타일 숫자를 맞혔어요.', 'La otra persona adivinó una ficha mía.');
    if (event.type === 'correct') return event.index !== undefined && event.value !== undefined ? copy(language, `${event.index + 1}번째 상대 타일이 ${tileValueLabel(event.value)}로 공개됐어요.`, `La ficha rival ${event.index + 1} se reveló como ${tileValueLabel(event.value)}.`) : copy(language, '타일 숫자가 공개됐어요.', 'Se reveló un número.');
    if (event.type === 'wrong') {
      if (event.actor === playerId) return event.index === undefined
        ? copy(language, '틀려서 차례를 넘겼어요. 이번 차례에는 새로 뽑은 타일이 없어 공개될 타일도 없어요.', 'Fallaste y termina tu turno. Como no robaste una ficha, no hay una ficha nueva que revelar.')
        : copy(language, `틀린 추측으로 방금 뽑은 내 타일이 공개됐어요${event.value === undefined ? '' : `: ${tileValueLabel(event.value)}`}.`, `Tu ficha recién robada quedó revelada tras fallar${event.value === undefined ? '' : `: ${tileValueLabel(event.value)}`}.`);
      return event.index === undefined
        ? copy(language, '상대가 틀려 차례를 넘겼어요.', 'La otra persona falló y terminó su turno.')
        : copy(language, '상대가 틀려 방금 뽑은 타일이 공개됐어요.', 'La otra persona falló y se reveló la ficha que acababa de robar.');
    }
    if (event.type === 'draw') return event.value === 'joker' ? copy(language, '조커를 뽑았어요. 원하는 위치에 배치하세요.', 'Robaste el comodín. Elige dónde colocarlo.') : copy(language, '새 타일을 정렬된 손패에 넣었어요.', 'Añadiste una ficha a tu mano ordenada.');
    if (event.type === 'rival-draw') return copy(language, '상대가 타일을 뽑았어요.', 'La otra persona robó una ficha.');
    if (event.type === 'arrange') return copy(language, '조커를 손패에 배치했어요.', 'Colocaste el comodín en tu mano.');
    if (event.type === 'skip-draw') return copy(language, '더미가 비어 뽑기 없이 추측을 시작해요.', 'El mazo está vacío; puedes adivinar sin robar.');
    if (event.type === 'stop') return event.actor === playerId ? copy(language, '추측을 멈추고 차례를 넘겼어요.', 'Terminaste tu turno.') : copy(language, '상대가 추측을 멈추고 차례를 넘겼어요.', 'La otra persona terminó su turno.');
    return view?.turn === playerId ? copy(language, '내 차례예요.', 'Es tu turno.') : copy(language, '차례가 바뀌었어요.', 'Cambió el turno.');
  };
  const resultOutcome = !view?.result ? undefined : view.result.winner === 'draw' ? 'draw' : view.result.winner === playerId ? 'win' : 'lose';
  const resultMessage = !view?.result ? '' : resultOutcome === 'win' ? copy(language, '상대 타일을 모두 공개했어요. 승리!', 'Revelaste todas las fichas rivales. ¡Ganaste!') : resultOutcome === 'draw' ? copy(language, '무승부', 'Empate') : copy(language, '내 타일이 모두 공개됐어요.', 'Se revelaron todas tus fichas.');
  const guessDescriptor = number === 'joker' ? copy(language, '조커(－)', 'comodín (－)') : String(number);
  const phaseLabel = view?.result ? copy(language, '결과', 'Resultado')
    : setupPhase ? ownReady ? copy(language, '초기 패 준비 완료', 'Mano inicial lista') : hasOwnJokerToPlace ? copy(language, '조커를 손패에 배치', 'Colocar el comodín') : copy(language, '초기 패 준비', 'Preparar mano inicial')
      : placementPhase ? copy(language, '조커를 손패에 배치', 'Colocar el comodín')
        : view?.phase === 'waiting' ? copy(language, '상대 행동을 기다리는 중', 'Esperando a la otra persona')
          : drawChoice ? copy(language, '타일 뽑기', 'Robar ficha') : skipDrawChoice ? copy(language, '더미 없음 · 추측 계속', 'Mazo vacío · adivina') : guessChoices.length ? copy(language, '숫자 추측', 'Adivinar número') : stopChoice ? copy(language, '차례 마치기', 'Terminar turno') : copy(language, '상대 행동을 기다리는 중', 'Esperando a la otra persona');
  const ownTileNode = (tile: Tile, index: number) => {
    const flipsOwnTile = visibleEvent?.index === index && ((visibleEvent.type === 'wrong' && visibleEvent.actor === playerId) || (visibleEvent.type === 'correct' && visibleEvent.actor !== playerId));
    const arrivesOwnTile = visibleEvent?.type === 'draw' && visibleEvent.actor === playerId && visibleEvent.index === index
      || visibleEvent?.type === 'arrange' && visibleEvent.actor === playerId && !hasOwnJokerToPlace && tile.value === 'joker' && visibleEvent.index === index;
    return <div role="img" className={`dv-tile dv-own-tile dv-tile-${tile?.color === 'white' ? 'white' : 'black'} ${tile?.revealed ? 'is-revealed' : ''} ${flipsOwnTile ? 'is-flipping' : ''} ${arrivesOwnTile ? 'is-arriving' : ''}`} key={`${tile?.color}-${tile?.value}`} aria-label={copy(language, `${index + 1}번째 ${colorLabel(tile?.color ?? 'black', language)} 타일, 숫자 ${tileValueLabel(tile?.value)}${tile?.revealed ? ', 공개됨' : ''}`, `Ficha propia ${index + 1} ${colorLabel(tile?.color ?? 'black', language)}, número ${tileValueLabel(tile?.value)}${tile?.revealed ? ', revelada' : ''}`)}><span className="dv-tile-order">{index + 1}</span><b>{tile.value === 'joker' ? <JokerPortrait src={jokerPortraits[tile.color]}/> : tileValueLabel(tile?.value)}</b><span className="dv-tile-color">{colorLabel(tile?.color ?? 'black', language)}</span>{tile?.revealed && <small className="dv-tile-state"><svg aria-hidden="true"><use href="/images/davinci/state-icons.svg#revealed"/></svg>{copy(language, '공개', 'Visible')}</small>}</div>;
  };
  const actionLog = list(board.actionLog).filter((event: any) => event?.type === 'correct-guess' || event?.type === 'wrong-guess').slice(-12);
  const streaks: Record<PlayerId, number> = { p1: 0, p2: 0 };
  for (const seat of ['p1', 'p2'] as const) {
    for (const event of [...list(board.actionLog)].reverse()) {
      if (event?.actor !== seat) continue;
      if (event.type === 'correct-guess') streaks[seat]++;
      else if (event.type === 'wrong-guess' || event.type === 'stop') break;
    }
  }

  const workbenchStage = view?.result ? 'result' : setupPhase ? 'setup' : placementPhase ? 'joker' : drawChoice ? 'draw' : skipDrawChoice ? 'guess' : guessChoices.length ? 'guess' : stopChoice ? 'stop' : 'waiting';
  return <div ref={tableRef} className="table-game dv-table" data-workbench-stage={workbenchStage} aria-label={copy(language, '다빈치 코드 게임판', 'Mesa de Código Da Vinci')}>
    <header className="dv-header">
      <div><h2>{copy(language, '다빈치 코드', 'Código Da Vinci')}</h2><p>{copy(language, '색과 정렬 순서를 단서로 상대의 숨은 숫자를 추리하세요.', 'Usa el color y el orden como pistas para deducir los números ocultos.')}</p></div>
      <div className="dv-score-strip"><div className={view?.turn === playerId ? 'is-active' : ''}><span>{copy(language, '내 타일', 'Tus fichas')}</span><b>{own.length}</b>{streaks[playerId] > 0 && <small>{copy(language, `연속 정답 ${streaks[playerId]}`, `Aciertos seguidos: ${streaks[playerId]}`)}</small>}</div><div className="dv-hidden-stat"><span>{copy(language, '숫자 숨김', 'Números ocultos')}</span><GameValue value={Number(view?.opponentCount ?? hidden.length)} resetKey={`${playerId}:davinci:hidden`}/></div><div className={view?.turn !== playerId ? 'is-active' : ''}><span>{copy(language, '상대 타일', 'Fichas rivales')}</span><b>{rival.length}</b>{streaks[playerId === 'p1' ? 'p2' : 'p1'] > 0 && <small>{copy(language, `상대 연속 정답 ${streaks[playerId === 'p1' ? 'p2' : 'p1']}`, `Aciertos rivales seguidos: ${streaks[playerId === 'p1' ? 'p2' : 'p1']}`)}</small>}</div></div>
    </header>
    <div className="dv-phasebar"><span className={`dv-turn-mark ${active ? 'is-you' : ''}`}>{view?.result ? copy(language, '대국 종료', 'Partida terminada') : setupPhase && ownReady ? copy(language, '준비 완료', 'Listo') : active ? copy(language, '내 차례', 'Tu turno') : copy(language, '상대 차례', 'Turno rival')}</span><b>{phaseLabel}</b><span className="dv-deck-count">{copy(language, `남은 더미 ${Number(board.deckCount ?? 0)}개`, `Mazo: ${Number(board.deckCount ?? 0)} fichas`)}</span><span className="dv-turn-count">{copy(language, `${Number(board.turnNumber ?? 1)}번째 차례`, `Turno ${Number(board.turnNumber ?? 1)}`)}</span></div>
    {actionLog.length > 0 && <section className="dv-history" aria-label={copy(language, '최근 공개 추측', 'Adivinanzas recientes')}><span>{copy(language, '최근 공개 추측', 'Adivinanzas recientes')}</span>{actionLog.slice(-4).map((event: any, index: number) => <p key={`${event.sequence ?? index}-${event.actor}-${event.type}`} className={event.type === 'correct-guess' ? 'is-correct' : 'is-wrong'}><b>{event.actor === playerId ? copy(language, '나', 'Tú') : copy(language, '상대', 'Rival')}</b><span>{copy(language, `${Number(event.targetIndex ?? 0) + 1}번째 타일에`, `Ficha ${Number(event.targetIndex ?? 0) + 1}:`)}</span><strong>{tileValueLabel(event.guess)}</strong><small>{event.type === 'correct-guess' ? copy(language, '정답', 'Acierto') : copy(language, '오답', 'Fallo')}</small></p>)}</section>}
    <section className={`dv-rack dv-rival-rack ${initialDeal ? 'is-initial-deal' : ''}`} aria-label={copy(language, '상대의 정렬된 타일', 'Fichas rivales ordenadas')}>
      <div className="dv-section-title"><div><h3>{copy(language, '상대 타일', 'Fichas rivales')}</h3></div><small>{copy(language, '색과 위치는 공개, 숫자는 가려져요', 'Color y posición visibles; número oculto')}</small></div>
      <div className="dv-tile-row">{rival.map((tile, index) => {
        const selectable = !tile?.revealed && !!active && gameInteractionPhase;
        const flipsRivalTile = visibleEvent?.index === index && ((visibleEvent.type === 'correct' && visibleEvent.actor === playerId) || (visibleEvent.type === 'wrong' && visibleEvent.actor !== playerId));
        const winningReveal = !!view?.result && resultOutcome === 'win' && visibleEvent?.type === 'correct' && visibleEvent.actor === playerId && visibleEvent.index === index;
        const arrivesRivalTile = visibleEvent?.type === 'rival-draw' && visibleEvent.actor !== playerId && visibleEvent.index === index;
        const tileClass = `dv-tile dv-tile-${tile?.color === 'white' ? 'white' : 'black'} ${tile?.revealed ? 'is-revealed' : ''} ${targetIndex === index && target ? 'is-target' : ''} ${flipsRivalTile && !winningReveal ? 'is-flipping' : ''} ${winningReveal ? 'is-winning-reveal' : ''} ${arrivesRivalTile ? 'is-arriving' : ''}`;
        const contents = <><span className="dv-tile-order">{index + 1}</span><b>{tile?.revealed ? tile.value === 'joker' ? <JokerPortrait src={jokerPortraits[tile.color]}/> : tileValueLabel(tile.value) : '· ·'}</b><span className="dv-tile-color">{colorLabel(tile?.color ?? 'black', language)}</span>{tile?.revealed && <small className="dv-tile-state"><svg aria-hidden="true"><use href="/images/davinci/state-icons.svg#revealed"/></svg>{copy(language, '공개', 'Revelada')}</small>}{selectable && targetIndex === index && <em><svg aria-hidden="true"><use href="/images/davinci/state-icons.svg#target"/></svg>{copy(language, '목표', 'Objetivo')}</em>}</>;
        return selectable ? <button type="button" key={`rival-${index}`} className={tileClass} aria-pressed={targetIndex === index} aria-label={copy(language, `${index + 1}번째 ${colorLabel(tile.color, language)} 상대 타일${tile.revealed ? `, ${tileValueLabel(tile.value)}` : ', 숫자 숨김'}`, `Ficha rival ${index + 1} ${colorLabel(tile.color, language)}${tile.revealed ? `, ${tileValueLabel(tile.value)}` : ', número oculto'}`)} onClick={() => { setTargetIndex(index); setColorFilter(tile.color); setConfirming(null); playCue('davinci', 'select'); }}>{contents}</button>
          : <div key={`rival-${index}`} role="img" className={tileClass} aria-label={copy(language, `${index + 1}번째 ${colorLabel(tile?.color ?? 'black', language)} 상대 타일${tile?.revealed ? `, ${tileValueLabel(tile.value)}` : ', 숫자 숨김'}`, `Ficha rival ${index + 1} ${colorLabel(tile?.color ?? 'black', language)}${tile?.revealed ? `, ${tileValueLabel(tile.value)}` : ', número oculto'}`)}>{contents}</div>;
      })}{!rival.length && <p className="dv-empty">{copy(language, '상대 타일을 기다리고 있어요.', 'Esperando las fichas rivales.')}</p>}</div>
    </section>
    <section className="dv-controls" aria-label={copy(language, '차례와 추측 도구', 'Acciones y herramientas de adivinanza')}>
      <div className="dv-actions">
        {drawChoice && <button type="button" className="dv-action dv-action-primary" onClick={() => void runAction(drawChoice.action)}>{copy(language, '타일 뽑기', 'Robar ficha')}<small>{copy(language, '손패에 정렬해 넣기', 'Insertar en orden')}</small></button>}
        {skipDrawChoice && <button type="button" className="dv-action dv-action-primary" onClick={() => void runAction(skipDrawChoice.action)}>{copy(language, '추측 계속하기', 'Seguir adivinando')}<small>{copy(language, '뽑을 타일이 없어요', 'No quedan fichas para robar')}</small></button>}
        {stopChoice && <button type="button" className="dv-action dv-action-secondary" onClick={() => void runAction(stopChoice.action)}>{copy(language, '차례 마치기', 'Terminar turno')}<small>{copy(language, '더 추측하지 않고 넘기기', 'Ceder sin seguir adivinando')}</small></button>}
        {finishSetupChoice && <button type="button" className="dv-action dv-action-primary" onClick={() => void runAction(finishSetupChoice.action)}>{copy(language, '초기 패 준비 완료', 'Terminé de preparar mi mano')}<small>{copy(language, '손패 배치를 확인했어요', 'Ya revisé la posición de mi mano')}</small></button>}
        {setupPhase && ownReady && setupIncomplete && <p className="dv-waiting">{copy(language, '준비가 끝났어요. 상대가 준비를 마치면 대국이 시작돼요.', 'Tu mano está lista. La partida comenzará cuando la otra persona termine.')}</p>}
        {placementPhase && <p className="dv-waiting">{copy(language, '아래 손패의 빈 칸을 골라 조커를 놓으세요.', 'Elige un espacio vacío en tu mano para colocar el comodín.')}</p>}
        {!active && !view?.result && view?.phase === 'waiting' && !setupPhase && <p className="dv-waiting">{copy(language, '상대가 행동하고 있어요. 타일의 순서와 색을 살펴보세요.', 'La otra persona está jugando. Observa el orden y el color de las fichas.')}</p>}
      </div>
      <div className="dv-guess-box">
        {!gameInteractionPhase ? <div className="dv-stage-message"><h3>{view?.result ? phaseLabel : setupPhase ? copy(language, '손패 준비', 'Preparar la mano') : placementPhase ? copy(language, '조커 배치', 'Colocar el comodín') : copy(language, '상대 차례', 'Turno rival')}</h3><p>{view?.result ? resultMessage : setupPhase ? copy(language, '조커가 있다면 아래에서 원하는 위치에 먼저 배치하고 준비 완료를 눌러 주세요.', 'Si tienes un comodín, colócalo abajo donde prefieras y luego confirma que terminaste.') : placementPhase ? copy(language, '조커는 공개되지 않아요. 원하는 위치를 선택하면 추측 단계로 넘어가요.', 'El comodín permanece oculto. Elige su posición para continuar con las adivinanzas.') : copy(language, '상대의 행동을 기다리고 있어요.', 'Esperando la acción de la otra persona.')}</p></div> : <>
        <div className="dv-section-title"><div><h3>{copy(language, '숨은 숫자 추측', 'Adivina el número oculto')}</h3></div><small>{copy(language, hasJokerRules ? '타일을 고른 뒤 0~11 또는 조커를 선택하세요' : '타일을 고른 뒤 0부터 11까지 선택하세요', hasJokerRules ? 'Elige una ficha y luego un número del 0 al 11 o el comodín' : 'Elige una ficha y luego un número del 0 al 11')}</small></div>
        <div className="dv-color-filter" role="group" aria-label={copy(language, '상대 타일 색 필터', 'Filtrar fichas por color')}>
          {(['all', 'black', 'white'] as const).map(color => <button type="button" key={color} className={colorFilter === color ? 'is-selected' : ''} aria-pressed={colorFilter === color} onClick={() => { setColorFilter(color); const next = hidden.find(item => color === 'all' || item.tile.color === color); if (next) setTargetIndex(next.index); setConfirming(null); }} disabled={color !== 'all' && !hidden.some(item => item.tile.color === color)}>{color === 'all' ? copy(language, '전체', 'Todas') : colorLabel(color, language)} <small>{color === 'all' ? hidden.length : hidden.filter(item => item.tile.color === color).length}</small></button>)}
        </div>
        <div className="dv-number-grid" role="group" aria-label={copy(language, hasJokerRules ? '추측할 숫자 또는 조커' : '추측할 숫자', hasJokerRules ? 'Número o comodín que quieres adivinar' : 'Número que quieres adivinar')}>
          {([...Array.from({ length: 12 }, (_, value) => value), ...(hasJokerRules ? ['joker' as const] : [])] as TileValue[]).map(value => <button type="button" key={value} className={`${number === value ? 'is-selected' : ''} ${value === 'joker' ? 'is-joker' : ''}`} aria-pressed={number === value} disabled={!active || !guessChoices.length || !target || !filteredTargets.some(item => item.index === targetIndex)} onClick={() => { setNumber(value); setConfirming(null); playCue('davinci', 'select'); }}>{tileValueLabel(value)}</button>)}
        </div>
        <div className="dv-guess-footer">
          {target && <p className="dv-guess-summary" role="status">{copy(language, `${targetIndex + 1}번째 ${colorLabel(target.tile.color, language)} 타일 · ${guessDescriptor} 추측`, `Ficha ${targetIndex + 1} ${colorLabel(target.tile.color, language)} · adivinar ${guessDescriptor}`)}</p>}
        {confirming ? <div className="dv-confirm-row" onKeyDown={event => { if (event.key === 'Escape' && !submitting) cancelGuess(); }}><span>{copy(language, `상대 ${targetIndex + 1}번째 타일이 ${number === 'joker' ? '조커' : number}라고 추측할까요?`, `¿Adivinar que la ficha rival ${targetIndex + 1} es ${guessDescriptor}?`)}</span><button ref={confirmButtonRef} type="button" className="dv-action-primary" disabled={submitting} onClick={async () => {
            if (submitting) return;
            setSubmitting(true);
            try {
              const accepted = await runAction(confirming.action);
              if (mounted.current) { setSubmitting(false); if (accepted !== false) setConfirming(null); }
            } catch { if (mounted.current) setSubmitting(false); }
          }}>{submitting ? copy(language, '전송 중…', 'Enviando…') : copy(language, '추측 확정', 'Confirmar')}</button><button type="button" className="dv-cancel" disabled={submitting} onClick={cancelGuess}>{copy(language, '취소', 'Cancelar')}</button></div> : <button type="button" className="dv-guess-submit" disabled={!guess || !active || !target || !filteredTargets.some(item => item.index === targetIndex)} onClick={() => guess && setConfirming(guess)}>{daVinciGuessButtonLabel(language, number)}</button>}
          {active && guessChoices.length > 0 && stopChoice && Number(board.deckCount ?? 0) > 0 && <p className="dv-rule-note dv-rule-penalty"><span className="dv-penalty-visual" aria-hidden="true"><i/>→<i/></span>{copy(language, '맞히면 계속 추측하거나 차례를 마칠 수 있어요. 틀리면 방금 뽑은 타일이 공개되고 차례가 끝나요.', 'Si aciertas, puedes seguir o terminar tu turno. Si fallas, se revela la ficha que acabas de robar y termina tu turno.')}</p>}
          {active && guessChoices.length > 0 && stopChoice && Number(board.deckCount ?? 0) <= 0 && <p className="dv-rule-note">{copy(language, '더미가 비었어요. 틀려도 새로 공개될 내 타일은 없고 차례가 끝나요.', 'El mazo está vacío. Si fallas, no se revela una ficha nueva y termina tu turno.')}</p>}
          {active && skipDrawChoice && <p className="dv-rule-note">{copy(language, '더미가 비었어요. 타일을 뽑지 않고 추측을 계속해요.', 'El mazo está vacío. Puedes seguir adivinando sin robar.')}</p>}
        </div>
        </>}
      </div>
    </section>
    <section className={`dv-rack dv-own-rack ${initialDeal ? 'is-initial-deal' : ''}`} aria-label={copy(language, '내 손패', 'Tu mano')}>
      <div className="dv-section-title"><div><h3>{copy(language, '내 타일', 'Tus fichas')}</h3></div><small>{copy(language, '내 숫자는 나에게 공개돼요', 'Tú puedes ver tus números')}</small></div>
      {hasOwnJokerToPlace ? <div className="dv-joker-placement">
        <div className={`dv-joker-preview dv-tile dv-tile-${ownJokerToPlace.color} ${visibleEvent?.type === 'draw' && visibleEvent.actor === playerId && visibleEvent.value === 'joker' ? 'is-arriving' : ''}`} role="img" aria-label={copy(language, `${colorLabel(ownJokerToPlace.color, language)} 조커 타일, 원하는 위치에 배치`, `Comodín ${colorLabel(ownJokerToPlace.color, language)}, elige dónde colocarlo`)}><b><JokerPortrait src={jokerPortraits[ownJokerToPlace.color === 'white' ? 'white' : 'black']}/></b><span className="dv-tile-color">{colorLabel(ownJokerToPlace.color, language)}</span><small>{copy(language, '배치할 조커', 'Comodín por colocar')}</small></div>
        <div className="dv-tile-row dv-joker-gap-row" role="group" aria-label={copy(language, '조커를 손패에 놓을 위치', 'Posición del comodín en tu mano')}>
          {Array.from({ length: ownHandWithoutMovingJoker.length + 1 }, (_, gap) => {
            const placeChoice = findDaVinciJokerPlacement(placementChoices, gap);
            return <div className="dv-joker-gap" key={`gap-${gap}`}><button type="button" className="dv-gap-button" disabled={!active || !placeChoice} aria-label={copy(language, `${gap + 1}번째 빈 칸에 조커 배치`, `Colocar el comodín en el espacio ${gap + 1}`)} title={copy(language, '여기에 조커 놓기', 'Colocar aquí')} onClick={() => placeChoice && void runAction(placeChoice.action)}>+</button>{gap < ownHandWithoutMovingJoker.length && ownTileNode(ownHandWithoutMovingJoker[gap], gap)}</div>;
          })}
        </div>
      </div> : <div className="dv-tile-row">{own.map((tile, index) => ownTileNode(tile, index))}</div>}
    </section>
    {visibleEvent && <p className={`dv-event dv-event-${visibleEvent.type}`} role="status" key={visibleEvent.key}>{statusText(visibleEvent)}</p>}
    {view?.result && <div className={`dv-result dv-result-${resultOutcome}`} data-game="davinci" data-outcome={resultOutcome} role="status"><b>{resultMessage}</b></div>}
  </div>;
}

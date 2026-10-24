import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { GameAction, Language, PlayerId } from '../core/types';
import type { MinhwatuCard, MinhwatuEvent, MinhwatuKind } from '../games/minhwatu';
import { HwatuCard } from './HwatuCard';
import { HwatuMotion } from './HwatuMotion';
import { useMinhwatuPresentation } from './useMinhwatuPresentation';
import '../styles/minhwatu-table.css';
import '../styles/table-playability.css';

type Choice = { label: Record<Language, string>; action: GameAction };
type Props = { view: any; language: Language; playerId: PlayerId; playerNames?: Partial<Record<PlayerId, string>>; runAction: (action: GameAction) => void | Promise<unknown>; onReplay?: () => boolean | void | Promise<boolean | void>; replayPending?: boolean; requiresAgreement?: boolean; sceneKey?: string };
type AnyRecord = Record<string, any>;
const text = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
const record = (value: unknown): AnyRecord => value && typeof value === 'object' ? value as AnyRecord : {};
const array = <T,>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];
const categories: MinhwatuKind[] = ['bright', 'animal', 'ribbon', 'plain'];
const categoryName: Record<MinhwatuKind, Record<Language, string>> = {
  bright: { ko: '광', es: 'Brillantes' }, animal: { ko: '열끗', es: 'Animales' }, ribbon: { ko: '띠', es: 'Cintas' }, plain: { ko: '피', es: 'Simples' },
};

function captureCounts(cards: MinhwatuCard[]) {
  return Object.fromEntries(categories.map(kind => [kind, cards.filter(card => card.kind === kind).length])) as Record<MinhwatuKind, number>;
}

export function minhwatuTargetAction(choices: readonly { action: GameAction }[], index: number, handIndex: number, capturePhase: boolean) {
  return choices.find(choice => choice.action.type === (capturePhase ? 'capture' : 'play')
    && Number(choice.action.payload?.targetIndex) === index
    && (capturePhase || Number(choice.action.payload?.index) === handIndex));
}

export function runWithActionLock<T>(lock: { current: boolean }, action: () => T | Promise<T>): Promise<T> | undefined {
  if (lock.current) return undefined;
  lock.current = true;
  return Promise.resolve().then(action).finally(() => { lock.current = false; });
}

export function MinhwatuTable({ view, language, playerId, playerNames, runAction, onReplay, replayPending = false, requiresAgreement = true, sceneKey = '' }: Props) {
  const presentation = useMinhwatuPresentation(view, playerId, sceneKey);
  const shownView = presentation.view, displayBusy = presentation.busy;
  const board: AnyRecord = record(shownView?.board), hand: MinhwatuCard[] = array(shownView?.ownHand), table: MinhwatuCard[] = array(board.table);
  const choices: Choice[] = array(view?.actions), captures: Record<PlayerId, MinhwatuCard[]> = { p1: array(board.captures?.p1), p2: array(board.captures?.p2) };
  const otherId: PlayerId = playerId === 'p1' ? 'p2' : 'p1', active = view?.turn === playerId && !view?.result;
  const pending: MinhwatuCard | null = board.pendingCard ?? null, capturePhase = view?.phase === 'capture-draw';
  const [selected, setSelected] = useState<string | null>(null), [actionBusy, setActionBusy] = useState(false), [replayBusy, setReplayBusy] = useState(false), [error, setError] = useState('');
  const [localReplayIdentity, setLocalReplayIdentity] = useState<string | null>(null);
  const replayIdentity = `${playerId}:${sceneKey}`, localReplayPending = requiresAgreement && localReplayIdentity === replayIdentity;
  const busy = actionBusy || displayBusy;
  const actionLock = useRef(false);
  const resultRef = useRef<HTMLElement>(null);
  const handButtons = useRef(new Map<string, HTMLButtonElement>()), tableButtons = useRef(new Map<number, HTMLButtonElement>());
  const handActions = useRef<HTMLDivElement>(null);
  const focusAfterTurn = useRef(false), focusTarget = useRef(false), replayLock = useRef(false);
  const publicEvents = array<MinhwatuEvent>(shownView?.log ?? board.actionLog);
  const handIds = hand.map(card => card.id).join('|');
  const previousTurn = useRef(view?.turn);
  const previousPhase = useRef(view?.phase);
  useEffect(() => {
    const ownTurnStarted = previousTurn.current !== playerId && view?.turn === playerId;
    const drawCaptureStarted = previousPhase.current !== 'capture-draw' && view?.phase === 'capture-draw' && view?.turn === playerId;
    previousTurn.current = view?.turn;
    previousPhase.current = view?.phase;
    if (handIds || ownTurnStarted || view?.phase !== 'capture-draw') { setSelected(null); setError(''); }
    if (ownTurnStarted) focusAfterTurn.current = true;
    if (drawCaptureStarted) focusTarget.current = true;
  }, [handIds, view?.turn, view?.phase, playerId]);

  const selectedIndex = hand.findIndex(card => card.id === selected);
  const plays = choices.filter(choice => choice.action.type === 'play' && Number(choice.action.payload?.index) === selectedIndex);
  const selectedCard = selectedIndex >= 0 ? hand[selectedIndex] : undefined;
  const actionForTarget = (index: number) => minhwatuTargetAction(choices, index, selectedIndex, capturePhase);
  const scoreBreakdown = record(board.breakdown), stockCount = Number(board.deckCount ?? board.remainingDeck ?? 0);
  const publicLog = publicEvents.filter(event => event.type !== 'turn').slice(-48).reverse();
  const lastCapture = publicEvents.filter(event => event.type === 'capture').at(-1);
  const recentCaptureIds = (seat: PlayerId) => array<MinhwatuCard>(publicEvents.filter(event => event.type === 'capture' && event.actor === seat).at(-1)?.cards).map(card => card.id);
  const selectedMonthCount = selectedCard ? table.filter(card => card.month === selectedCard.month).length : 0;
  useEffect(() => {
    if (focusAfterTurn.current && shownView?.result && !busy) {
      focusAfterTurn.current = false;
      resultRef.current?.focus();
      return;
    }
    if (focusAfterTurn.current && active && !busy) {
      focusAfterTurn.current = false;
      const first = hand.find(card => choices.some(choice => choice.action.type === 'play' && Number(choice.action.payload?.index) === hand.indexOf(card)));
      if (first) handButtons.current.get(first.id)?.focus({ preventScroll: true });
    }
  }, [active, busy, handIds, choices]);
  useEffect(() => {
    if (active && !busy && (capturePhase || selectedCard && selectedMonthCount === 2) && focusTarget.current) {
      focusTarget.current = false;
      const firstTarget = table.findIndex((_, index) => Boolean(actionForTarget(index)));
      if (firstTarget >= 0) tableButtons.current.get(firstTarget)?.focus();
    }
  }, [selected, active, capturePhase, selectedMonthCount, busy, table, choices]);
  useEffect(() => {
    if (!active || busy || capturePhase || !selectedCard || plays.length !== 1 || plays[0].action.payload?.targetIndex !== undefined) return;
    const bounds = handActions.current?.getBoundingClientRect();
    if (bounds && (bounds.bottom > window.innerHeight || bounds.top < 0)) handActions.current?.scrollIntoView({ block: 'nearest' });
  }, [selected, active, busy, capturePhase, plays.length]);
  const motionEvent = presentation.step?.events[0];
  const landingEvent = motionEvent?.type === 'capture' && motionEvent.actor ? motionEvent : undefined;
  const captureLandingCards = (seat: PlayerId) => landingEvent?.actor === seat
    ? array<MinhwatuCard>(landingEvent.cards).filter(card => !captures[seat].some(captured => captured.id === card.id))
    : [];
  const movingCardId = motionEvent?.cards?.[0]?.id;
  const needsTableLanding = Boolean(movingCardId && !table.some(card => card.id === movingCardId)
    && (motionEvent?.type === 'play' && !presentation.step?.targetId || motionEvent?.type === 'draw' && presentation.step?.transfer && !presentation.step.targetId));
  const fieldCount = table.length + Number(needsTableLanding);
  const fieldColumns = fieldCount <= 8 ? 4 : fieldCount <= 12 ? 6 : fieldCount <= 14 ? 7 : fieldCount <= 18 ? 6 : fieldCount <= 24 ? 8 : fieldCount <= 30 ? 10 : 12;
  const fieldCardWidth = fieldCount <= 8 ? 58 : fieldCount <= 14 ? 56 : fieldCount <= 36 ? 42 : 36;
  const fieldGap = fieldCount <= 14 ? 10 : 4;

  const instruction = displayBusy ? text(language, '패 이동 중', 'Moviendo cartas')
    : shownView?.result ? text(language, '정산 완료', 'Partida terminada')
    : shownView?.turn !== playerId ? text(language, '상대 차례', 'Turno rival')
    : capturePhase || selectedCard && selectedMonthCount === 2 ? text(language, '바닥 패를 고르세요', 'Elige una carta de la mesa')
    : selectedCard ? text(language, '내기를 확정하세요', 'Confirma la carta')
    : text(language, '패를 고르세요', 'Elige una carta');

  const run = async (choice?: { action: GameAction }) => {
    if (!choice || !active || busy) return;
    const actionPromise = runWithActionLock(actionLock, () => runAction(choice.action));
    if (!actionPromise) return;
    setActionBusy(true); setError('');
    try {
      const accepted = await actionPromise;
      if (accepted === false) { setError(text(language, '동작이 거절됐어요. 현재 선택을 확인하세요.', 'No se aceptó la jugada. Revisa tu selección.')); return; }
      setSelected(null);
      focusAfterTurn.current = true;
    } catch {
      setError(text(language, '동작을 완료하지 못했어요. 다시 선택하세요.', 'No se pudo completar. Vuelve a elegir.'));
    } finally { setActionBusy(false); }
  };

  const requestReplay = async () => {
    if (!onReplay || replayLock.current || replayBusy || replayPending && localReplayPending) return;
    replayLock.current = true;
    setReplayBusy(true);
    try { const accepted = await onReplay(); if (accepted !== false && requiresAgreement) setLocalReplayIdentity(replayIdentity); }
    catch { setError(text(language, '재경기 요청을 보내지 못했어요. 다시 시도하세요.', 'No se pudo enviar la solicitud. Inténtalo de nuevo.')); }
    finally { replayLock.current = false; setReplayBusy(false); }
  };

  useEffect(() => { if (!replayPending) setLocalReplayIdentity(null); }, [replayPending]);
  const result = record(shownView?.result), resultScores = record(result.scores);
  const ownBreakdown = record(scoreBreakdown[playerId]), rivalBreakdown = record(scoreBreakdown[otherId]);
  const ownBase = Number(ownBreakdown.basePoints ?? 0), ownBonus = Number(ownBreakdown.ownYakuPoints ?? 0), rivalBonus = Number(rivalBreakdown.ownYakuPoints ?? 0);
  const finalOwnScore = Number(resultScores[playerId] ?? ownBreakdown.finalScore ?? board.scores?.[playerId] ?? 0);
  const finalRivalScore = Number(resultScores[otherId] ?? rivalBreakdown.finalScore ?? board.scores?.[otherId] ?? 0);
  const ownName = playerNames?.[playerId] ?? text(language, '나', 'Tú'), rivalName = playerNames?.[otherId] ?? text(language, '상대', 'Rival');
  const cancelSelection = () => {
    const selectedId = selected;
    setSelected(null); setError('');
    if (selectedId) requestAnimationFrame(() => handButtons.current.get(selectedId)?.focus({ preventScroll: true }));
  };

  return <section className={`minhwatu-table ${shownView?.result ? 'is-finished' : ''}`} aria-label={text(language, '민화투 게임판', 'Mesa de Minhwatu')} onKeyDown={event => {
    if (event.key === 'Escape' && selected && !busy) { event.preventDefault(); cancelSelection(); }
  }}>
    <header className="hwatu-header">
      <div className="hwatu-title"><h2>{text(language, '민화투', 'Minhwatu')}</h2><p>{text(language, '48장으로 한 판 겨뤄요.', 'Jueguen una mano con 48 cartas.')}</p></div>
      <div className="hwatu-seat-strip" aria-label={text(language, '현재 점수와 차례', 'Puntos y turno')}>
        {(['p1', 'p2'] as PlayerId[]).map((seat, index) => <div className={`hwatu-seat-score ${seat === playerId ? 'is-own' : ''} ${shownView?.turn === seat && !shownView?.result ? 'is-turn' : ''}`} data-hwatu-zone={`score-${seat}`} data-player={seat} aria-current={shownView?.turn === seat && !shownView?.result ? 'true' : undefined} key={seat}>
          <span className={`hwatu-seat-dot seat-${index + 1}`} aria-hidden="true"/>
          <span className="hwatu-seat-label">{playerNames?.[seat] && <b>{playerNames[seat]} </b>}{seat === playerId ? text(language, '나', 'Tú') : text(language, '상대', 'Rival')}</span>
          <strong>{Number(board.scores?.[seat] ?? scoreBreakdown[seat]?.finalScore ?? 0)}<small>{text(language, '점', 'pts')}</small></strong>
        </div>)}
      </div>
    </header>

    {shownView?.result && <section ref={resultRef} className="hwatu-result" data-game="minhwatu" data-outcome={result.winner === 'draw' ? 'draw' : result.winner === playerId ? 'win' : 'lose'} role="status" tabIndex={-1}>
      <b>{result.winner === 'draw' ? text(language, '무승부', 'Empate') : result.winner === playerId ? text(language, '이겼어요!', '¡Ganaste!') : text(language, '상대가 이겼어요.', 'Ganó la otra persona.')}</b>
      <span>{ownName} {finalOwnScore} : {finalRivalScore} {rivalName}</span>
      <small>{text(language, `내 점수 ${ownBase} + 내 족보 ${ownBonus} × 2 − 상대 족보 ${rivalBonus} = ${finalOwnScore}`, `Tus puntos ${ownBase} + tus yakus ${ownBonus} × 2 − yakus rivales ${rivalBonus} = ${finalOwnScore}`)}</small>
      {onReplay && <div className="hwatu-replay"><button type="button" disabled={busy || replayBusy || localReplayPending} aria-busy={replayBusy} onClick={() => void requestReplay()}>{replayBusy ? text(language, '요청 중…', 'Enviando…') : !requiresAgreement ? text(language, '다시 하기', 'Jugar otra vez') : replayPending && !localReplayPending ? text(language, '동의하고 한 판 더', 'Aceptar y jugar otra') : localReplayPending ? text(language, '동의 대기 중…', 'Esperando aceptación…') : text(language, '한 판 더 요청', 'Pedir otra partida')}</button>
        {localReplayPending && <small role="status">{text(language, '상대 동의를 기다리고 있어요.', 'Esperando a la otra persona.')}</small>}
        {requiresAgreement && replayPending && !localReplayPending && <small role="status">{text(language, '상대가 새 판을 요청했어요.', 'La otra persona pidió otra partida.')}</small>}</div>}
    </section>}

    <div className="hwatu-tabletop-stage">
      <CaptureRack cards={captures[otherId]} landingCards={captureLandingCards(otherId)} recentIds={recentCaptureIds(otherId)} seat={otherId} viewer={playerId} language={language} name={playerNames?.[otherId]} breakdown={record(scoreBreakdown[otherId])}/>
      <div className="hwatu-play-center">
        <div className="hwatu-opponent-bar" aria-label={text(language, '상대 손패', 'Mano rival')}>
          <div className="hwatu-opponent-summary"><b>{text(language, '상대 손패', 'Mano rival')}</b><span className="hwatu-opponent-count">{Number(shownView?.opponentCount ?? 0)}{text(language, '장', ' cartas')}</span></div>
          <span className="hwatu-opponent-fan" data-hwatu-zone="opponent-hand" aria-hidden="true">{Array.from({ length: Math.min(10, Number(shownView?.opponentCount ?? 0)) }, (_, i) => <i key={i} style={{ '--fan-index': i } as CSSProperties}/>)}</span>
          <div className="hwatu-event-overlay"><HwatuMotion events={publicEvents} language={language} playerId={playerId} step={presentation.step}/></div>
        </div>

        <section className="hwatu-felt" style={{ '--hw-field-columns': fieldColumns, '--hw-field-card-width': `${fieldCardWidth}px`, '--hw-field-gap': `${fieldGap}px`, '--hw-field-grid-width': `${fieldColumns * fieldCardWidth + (fieldColumns - 1) * fieldGap}px` } as CSSProperties} aria-label={text(language, '공개된 바닥 패', 'Cartas visibles en la mesa')}>
          <header className="hwatu-felt-heading"><div><h3>{text(language, '바닥 패', 'Mesa')}</h3><span aria-label={text(language, `공개된 패 ${table.length}장`, `${table.length} cartas visibles`)}>{table.length}</span></div>
            <span className="hwatu-stock-count" data-hwatu-zone="deck"><span className="hwatu-deck-back" aria-hidden="true"><i/><i/><i/></span><span>{text(language, '남은 더미', 'Mazo')}</span><b>{stockCount}</b></span>
          </header>
          <div className={`hwatu-table-cards ${shownView?.result && !table.length ? 'is-empty-finished' : ''} ${!table.length && !needsTableLanding && !pending ? 'is-empty' : ''}`} data-hwatu-zone="table">
            {table.map((card, index) => {
              const choice = actionForTarget(index), legal = Boolean(choice && active && (selectedCard || capturePhase));
              const target = legal && (capturePhase || selectedMonthCount === 2);
              const label = `${text(language, `${card.month}월 ${card.flower.ko} ${card.badge.ko}`, `Mes ${card.month}, ${card.flower.es}, ${card.badge.es}`)}, ${Number(card.points ?? 0)} ${text(language, '점', 'pts')}${target ? ` · ${text(language, '선택해 가져오기', 'Elegir para capturar')}` : ''}`;
              return legal ? <button ref={node => { if (node) tableButtons.current.set(index, node); else tableButtons.current.delete(index); }} className={`hwatu-table-card is-legal ${target ? 'is-target' : ''}`} type="button" key={card.id} data-hwatu-card-id={card.id} onClick={() => void run(choice)} aria-label={label} disabled={busy}>
                <HwatuCard card={card} language={language}/>{target && <span className="hwatu-target-label">{text(language, '선택', 'Elegir')}</span>}
              </button> : <div className="hwatu-table-card" key={card.id} data-hwatu-card-id={card.id} aria-label={label}><HwatuCard card={card} language={language}/></div>;
            })}
            {needsTableLanding && <span className="hwatu-table-landing-anchor" data-hwatu-landing-anchor aria-hidden="true" style={{ width: fieldCardWidth, height: fieldCardWidth * 1.63, opacity: 0, pointerEvents: 'none' }}/ >}
          </div>
          {!shownView?.result && <div className="hwatu-draw-area" data-hwatu-zone="draw">
            {pending && <div className="hwatu-draw-label"><img src="/images/hwatu-support/draw.svg" alt="" aria-hidden="true"/><span>{text(language, '뒤집은 패', 'Carta revelada')}</span></div>}
            {pending ? <div className="hwatu-drawn-card" data-hwatu-card-id={pending.id} data-hwatu-landing-anchor><HwatuCard card={pending} language={language}/></div> : null}
            {!pending && <span className="hwatu-draw-landing-anchor" data-hwatu-landing-anchor aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '58%', width: 60, height: 98, opacity: 0, transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}/ >}
          </div>}
        </section>
        <div className={`hwatu-phase-note ${active ? 'is-active' : ''}`} role="status" aria-live="polite">
          <span className="hwatu-phase-dot" aria-hidden="true"/><span>{instruction}</span>
          {error && <b className="hwatu-error" role="alert">{error}</b>}
        </div>

        <CaptureRack cards={captures[playerId]} landingCards={captureLandingCards(playerId)} recentIds={recentCaptureIds(playerId)} seat={playerId} viewer={playerId} language={language} name={playerNames?.[playerId]} breakdown={record(scoreBreakdown[playerId])}/>

        <section className={`hwatu-hand-section ${active && !busy ? 'is-active' : ''} ${shownView?.result && !hand.length ? 'is-empty-finished' : ''}`} aria-label={text(language, '내 손패', 'Tu mano')}>
          <header className="hwatu-hand-heading"><div><h3>{text(language, '내 손패', 'Tu mano')}</h3><span>{hand.length}</span></div></header>
          <div className={`hwatu-choice-hand ${shownView?.result && !hand.length ? 'is-empty-finished' : ''}`} data-hwatu-zone="hand" onKeyDown={event => {
            if (!active || busy || capturePhase || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            const index = hand.findIndex(card => handButtons.current.get(card.id) === document.activeElement);
            if (index < 0) return;
            event.preventDefault();
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? hand.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + hand.length) % hand.length;
            handButtons.current.get(hand[next].id)?.focus({ preventScroll: true });
          }}>{hand.map((card, index) => {
            const legalChoices = choices.filter(choice => choice.action.type === 'play' && Number(choice.action.payload?.index) === index);
            const isSelected = selected === card.id, canPlay = legalChoices.length > 0 && active && !capturePhase;
            const matches = table.filter(item => item.month === card.month).length;
            const capturable = active && !capturePhase && matches > 0;
            return <button ref={node => { if (node) handButtons.current.set(card.id, node); else handButtons.current.delete(card.id); }} className={`hwatu-hand-choice ${isSelected ? 'is-selected' : ''} ${canPlay ? 'is-playable' : ''} ${capturable ? 'is-capturable' : ''}`} type="button" key={card.id} data-hwatu-card-id={card.id} disabled={!active || !legalChoices.length || capturePhase || busy} aria-pressed={isSelected} aria-label={`${text(language, `${card.month}월 ${card.flower.ko} ${card.badge.ko}`, `Mes ${card.month}, ${card.flower.es}, ${card.badge.es}`)}, ${Number(card.points ?? 0)} ${text(language, '점', 'pts')}${capturable ? ` · ${text(language, '가져올 수 있음', 'Se puede capturar')}` : ''}`} onClick={() => { setError(''); focusTarget.current = matches === 2 && !isSelected; setSelected(isSelected ? null : card.id); }}>
              <HwatuCard card={card} language={language}/>{capturable && <img className="hwatu-hand-capture-marker" src="/images/hwatu-support/capture.svg" alt="" aria-hidden="true"/>}
            </button>;
          })}</div>
          <div className="hwatu-hand-actions" ref={handActions}>{active && !capturePhase && selectedCard && <div className="hwatu-confirm-row">
            {plays.length === 1 && plays[0].action.payload?.targetIndex === undefined ? <button className="hwatu-confirm" type="button" disabled={busy} aria-label={text(language, `${selectedCard.month}월 패 내기`, `Jugar la carta del mes ${selectedCard.month}`)} onClick={() => void run(plays[0])}>{text(language, '내기', 'Jugar')}</button> : null}
            <button className="hwatu-cancel" type="button" disabled={busy} onClick={cancelSelection}>{text(language, '선택 취소', 'Cancelar')}</button>
          </div>}
</div>
        </section>

      </div>
    </div>

    <details className="hwatu-action-log">
      <summary>{text(language, '최근 행동', 'Actividad reciente')} · {publicLog.length}{lastCapture && <span className="hwatu-last-capture"> · {lastCapture.actor === playerId ? text(language, '내 획득', 'Tu captura') : text(language, '상대 획득', 'Captura rival')}: {String(record(lastCapture.title)[language] ?? '')}</span>}</summary>
      {publicLog.length ? <ol>{publicLog.map((event, index) => {
        const actor = event.actor === playerId ? text(language, '나', 'Tú') : event.actor ? text(language, '상대', 'Contrincante') : '';
        const deltas = record(event.scoreChanges);
        const changes = (['p1', 'p2'] as PlayerId[]).filter(seat => Number(deltas[seat] ?? 0) !== 0).map(seat => {
          const delta = Number(deltas[seat]);
          return `${seat === playerId ? text(language, '나', 'Tú') : text(language, '상대', 'Contrincante')} ${delta > 0 ? '+' : ''}${delta}`;
        });
        return <li key={`${Number(event.sequence ?? index)}:${index}`}><span>{actor && <b>{actor}</b>} {String(record(event.title)[language] ?? '')}</span>{changes.length > 0 && <small>{changes.join(' · ')}</small>}{event.cards?.length && <div className="hwatu-log-cards" aria-label={text(language, '이 행동의 공개 패', 'Cartas visibles de esta acción')}>{event.cards.map(card => <HwatuCard key={card.id} card={card} language={language}/>)}</div>}</li>;
      })}</ol> : <p>{text(language, '아직 기록된 행동이 없어요.', 'Todavía no hay acciones registradas.')}</p>}
    </details>

    <details className="hwatu-scoring" aria-label={text(language, '점수와 족보', 'Puntos y combinaciones')}>
      <summary>{text(language, '점수 계산과 족보 상세', 'Detalle de puntos y combinaciones')} · {text(language, '내 기본점수 + 내 족보 × 2 − 상대 족보', 'Tus puntos base + tus yakus × 2 − yakus rivales')}</summary>
      <div className="hwatu-breakdowns">{(['p1', 'p2'] as PlayerId[]).map(seat => {
        const info = record(scoreBreakdown[seat]), base = Number(info.basePoints ?? 0), ownYaku = Number(info.ownYakuPoints ?? 0), enemyYaku = Number(info.opponentYakuPoints ?? 0), finalScore = Number(info.finalScore ?? board.scores?.[seat] ?? 0);
        const ownedByViewer = seat === playerId, yakus: AnyRecord[] = array(info.yakus);
        const countData = record(info.counts), cards = captures[seat], counts = captureCounts(cards);
        return <article className={`hwatu-breakdown ${ownedByViewer ? 'is-own' : ''}`} data-seat={seat} key={seat}>
          <header><b>{ownedByViewer ? text(language, '내 점수', 'Tus puntos') : text(language, '상대 점수', 'Puntos rivales')}</b><strong>{finalScore}<small>{text(language, '점', 'pts')}</small></strong></header>
          <p className="hwatu-formula">{ownedByViewer
            ? text(language, `기본 ${base} + 내 족보 ${ownYaku} × 2 − 상대 족보 ${enemyYaku} = ${finalScore}`, `Base ${base} + tus yakus ${ownYaku} × 2 − yakus del rival ${enemyYaku} = ${finalScore}`)
            : text(language, `상대 기본 ${base} + 상대 족보 ${ownYaku} × 2 − 내 족보 ${enemyYaku} = ${finalScore}`, `Base rival ${base} + yakus del rival ${ownYaku} × 2 − tus yakus ${enemyYaku} = ${finalScore}`)}</p>
          <div className="hwatu-count-line" aria-label={text(language, '획득한 패 종류별 수', 'Cartas capturadas por categoría')}>{categories.map(kind => <span key={kind}><b>{categoryName[kind][language]}</b> {Number(countData[kind] ?? counts[kind])}</span>)}</div>
          <ul className="hwatu-yaku-list">{yakus.map(yaku => {
            const id = String(yaku.id ?? ''), label = record(yaku.label)[language] ?? id, bonus = Number(yaku.bonus ?? 0), godori = /godori|고도리/i.test(`${id} ${label}`);
            const icon = godori ? 'godori' : id.startsWith('month-') ? 'month' : /dan/i.test(id) ? 'ribbon' : null;
            return <li className={yaku.complete ? 'is-complete' : ''} key={id || label}>{icon && <img src={`/images/hwatu-support/${icon}.svg`} alt="" aria-hidden="true"/>}<span>{label}</span><b>{godori && yaku.complete && bonus === 0 ? text(language, '3장 완성 · 추가 점수 없음', 'Completo · sin puntos extra') : yaku.complete ? `+${bonus} ${text(language, '점', 'pts')}` : text(language, `${Number(yaku.have ?? 0)}/${Number(yaku.need ?? 0)}장`, `${Number(yaku.have ?? 0)}/${Number(yaku.need ?? 0)}`)}</b></li>;
          })}</ul>
          {!yakus.length && <p className="hwatu-no-yaku">{text(language, '완성한 족보가 아직 없어요.', 'Todavía no hay combinaciones completas.')}</p>}
        </article>;
      })}</div>
      <p className="hwatu-rule-note">{Number(board.rulesVersion) === 1
        ? text(language, '광 20점 · 열끗 10점 · 띠 5점 · 피 0점. 이전 방 규칙에서는 고도리 추가 점수가 없어요. 고/스톱 없이 한 판으로 끝나요.', 'Brillantes 20 · animales 10 · cintas 5 · simples 0. En las partidas anteriores, Godori no suma puntos extra. Se juega una sola mano, sin Go-Stop.')
        : text(language, '광 20점 · 열끗 10점 · 띠 5점 · 피 0점. 고도리 3장을 모으면 50점 보너스예요. 고/스톱 없이 한 판으로 끝나요.', 'Brillantes 20 · animales 10 · cintas 5 · simples 0. Al reunir los 3 Godori, ganas 50 puntos extra. Se juega una sola mano, sin Go-Stop.')}</p>
    </details>

  </section>;
}

function CaptureRack({ cards, landingCards = [], recentIds = [], seat, viewer, language, name, breakdown }: { cards: MinhwatuCard[]; landingCards?: MinhwatuCard[]; recentIds?: string[]; seat: PlayerId; viewer: PlayerId; language: Language; name?: string; breakdown: AnyRecord }) {
  const isViewer = seat === viewer, counts = captureCounts(cards), yakus = array<AnyRecord>(breakdown.yakus);
  const [preview, setPreview] = useState<{ card: MinhwatuCard; left: number; top: number } | null>(null);
  const inspect = (card: MinhwatuCard, button: HTMLButtonElement) => {
    const bounds = button.getBoundingClientRect();
    setPreview({ card, left: Math.max(8, Math.min(window.innerWidth - 160, bounds.right + 8)), top: Math.max(8, Math.min(window.innerHeight - 290, bounds.top)) });
  };
  useEffect(() => { setPreview(null); }, [cards.map(card => card.id).join('|'), language]);
  const layoutCards = [...new Map([...cards, ...landingCards].map(card => [card.id, card])).values()];
  const columns = categories.map(kind => {
    const count = layoutCards.filter(card => card.kind === kind).length;
    const stacked = count > (kind === 'plain' ? 10 : 5);
    const rowCount = kind === 'plain' ? Math.min(count, 10) : count;
    return `minmax(110px, ${Math.max(1, stacked ? 1 + (rowCount - 1) * .55 : rowCount)}fr)`;
  }).join(' ');
  return <aside className={`hwatu-capture-rack ${isViewer ? 'is-own' : ''} ${cards.length ? '' : 'is-empty'}`} data-seat={seat} aria-label={`${isViewer ? text(language, '내가 모은 패', 'Mis capturas') : text(language, '상대가 모은 패', 'Capturas rivales')}: ${cards.length}`}>
    <header className="hwatu-capture-rack-heading"><div>{name && <span className="hwatu-player-name">{name}</span>}<b>{isViewer ? text(language, '내가 모은 패', 'Mis capturas') : text(language, '상대가 모은 패', 'Capturas rivales')}</b><span>{cards.length} {text(language, '장', 'cartas')}</span>{recentIds.length > 0 && <small>{text(language, `최근 ${recentIds.length}장`, `Últimas ${recentIds.length}`)}</small>}</div></header>
    <div className="hwatu-capture-categories" style={{ '--hw-capture-columns': columns } as CSSProperties}>{categories.map(kind => {
      const incoming = landingCards.filter(card => card.kind === kind);
      const incomingIds = new Set(incoming.map(card => card.id));
      const ordered = layoutCards.filter(card => card.kind === kind).sort((a, b) => a.month - b.month || a.id.localeCompare(b.id));
      const stacked = kind !== 'bright' && ordered.length > (kind === 'plain' ? 10 : 5);
      const rows = kind === 'plain' ? Array.from({ length: Math.ceil(ordered.length / 10) }, (_, index) => ordered.slice(index * 10, index * 10 + 10)) : [ordered];
      return <section className={`hwatu-category-pile kind-${kind} ${stacked ? 'is-stacked' : ''}`} key={kind} data-hwatu-zone={`captures-${seat}-${kind}`}>
        <header className="hwatu-category-heading">
            <img src={`/images/hwatu-support/category-${kind}.svg`} alt="" aria-hidden="true"/>
            <span className="hwatu-category-label"><span>{categoryName[kind][language]}</span><b>{counts[kind]}</b></span>
        </header>
        <div className="hwatu-captured-cards">{rows.map((row, rowIndex) => <div className="hwatu-capture-row" key={rowIndex}>{row.map(card => incomingIds.has(card.id)
          ? <span className="hwatu-capture-landing" key={`landing:${card.id}`} data-hwatu-landing-anchor data-hwatu-landing-card-id={card.id} aria-hidden="true"/>
          : <button type="button" className={`hwatu-captured-card ${recentIds.includes(card.id) ? 'is-recent' : ''}`} key={card.id} data-hwatu-card-id={card.id}
            aria-label={`${text(language, `${card.month}월 ${card.flower.ko} ${card.badge.ko}`, `Mes ${card.month}, ${card.flower.es}, ${card.badge.es}`)} · ${card.points} ${text(language, '점', 'pts')}${recentIds.includes(card.id) ? ` · ${text(language, '최근 획득', 'Captura reciente')}` : ''} · ${text(language, '크게 보기', 'Ver más grande')}`}
            onPointerEnter={event => inspect(card, event.currentTarget)} onFocus={event => inspect(card, event.currentTarget)} onClick={event => inspect(card, event.currentTarget)}
            onPointerLeave={() => setPreview(null)} onBlur={() => setPreview(null)} onKeyDown={event => { if (event.key === 'Escape' && preview) { event.preventDefault(); event.stopPropagation(); setPreview(null); } }}>
            <HwatuCard card={card} language={language} compactMonth/>
          </button>)}</div>)}
        </div>
      </section>;
    })}</div>
    <section className="hwatu-rail-progress" aria-label={text(language, '족보 진행', 'Progreso de combinaciones')}>
      <h3>{text(language, '족보', 'Combinaciones')}</h3>
      <ul>{yakus.map(yaku => <li key={String(yaku.id)} className={yaku.complete ? 'is-complete' : ''}>
        <span>{record(yaku.label)[language] ?? yaku.id}</span><b>{yaku.complete && Number(yaku.bonus) > 0 ? `+${yaku.bonus}` : `${Number(yaku.have ?? 0)}/${Number(yaku.need ?? 0)}`}</b>
      </li>)}</ul>
    </section>
    {preview && <span className="hwatu-capture-preview" role="tooltip" style={{ left: preview.left, top: preview.top }}>
      <img src={`/images/hwatu/${preview.card.id.split('-').map(part => part.padStart(2, '0')).join('-')}.svg`} alt=""/>
      <span>{text(language, `${preview.card.month}월 · ${preview.card.flower.ko} · ${preview.card.badge.ko} · ${preview.card.points}점`, `Mes ${preview.card.month} · ${preview.card.flower.es} · ${preview.card.badge.es} · ${preview.card.points} pts`)}</span>
    </span>}
  </aside>;
}

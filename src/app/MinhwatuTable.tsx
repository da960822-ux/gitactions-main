import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { GameAction, Language, PlayerId } from '../core/types';
import type { MinhwatuCard, MinhwatuEvent, MinhwatuKind } from '../games/minhwatu';
import { HwatuCard } from './HwatuCard';
import { GameValue } from './GameValue';
import { HwatuMotion } from './HwatuMotion';
import '../styles/minhwatu-table.css';

type Choice = { label: Record<Language, string>; action: GameAction };
type Props = { view: any; language: Language; playerId: PlayerId; playerNames?: Partial<Record<PlayerId, string>>; runAction: (action: GameAction) => void | Promise<unknown> };
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

export function MinhwatuTable({ view, language, playerId, playerNames, runAction }: Props) {
  const board: AnyRecord = record(view?.board), hand: MinhwatuCard[] = array(view?.ownHand), table: MinhwatuCard[] = array(board.table);
  const choices: Choice[] = array(view?.actions), captures: Record<PlayerId, MinhwatuCard[]> = { p1: array(board.captures?.p1), p2: array(board.captures?.p2) };
  const otherId: PlayerId = playerId === 'p1' ? 'p2' : 'p1', active = view?.turn === playerId && !view?.result;
  const pending: MinhwatuCard | null = board.pendingCard ?? null, capturePhase = view?.phase === 'capture-draw';
  const [selected, setSelected] = useState<string | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const actionLock = useRef(false);
  const scoreGeneration = useRef({ sequence: 0, generation: 0 });
  const publicEvents = array<MinhwatuEvent>(view?.log ?? board.actionLog);
  const publicSequence = Math.max(0, ...publicEvents.map(event => Number(event.sequence ?? 0)));
  if (publicSequence < scoreGeneration.current.sequence) scoreGeneration.current.generation++;
  scoreGeneration.current.sequence = publicSequence;
  const scoreResetKey = `minhwatu:${playerId}:${scoreGeneration.current.generation}`;
  const handIds = hand.map(card => card.id).join('|');
  useEffect(() => { setSelected(null); setError(''); }, [handIds, view?.turn, view?.phase, playerId]);

  const selectedIndex = hand.findIndex(card => card.id === selected);
  const plays = choices.filter(choice => choice.action.type === 'play' && Number(choice.action.payload?.index) === selectedIndex);
  const selectedCard = selectedIndex >= 0 ? hand[selectedIndex] : undefined;
  const actionForTarget = (index: number) => minhwatuTargetAction(choices, index, selectedIndex, capturePhase);
  const scoreBreakdown = record(board.breakdown), stockCount = Number(board.deckCount ?? board.remainingDeck ?? 0);
  const activeLabel = active ? text(language, '내 차례', 'Tu turno') : text(language, '상대 차례', 'Turno rival');
  const publicLog = publicEvents.slice(-6).reverse();
  const selectedMonthCount = selectedCard ? table.filter(card => card.month === selectedCard.month).length : 0;
  const fieldColumns = table.length <= 8 ? 4 : table.length <= 12 ? 6 : table.length <= 14 ? 7 : table.length <= 18 ? 6 : table.length <= 24 ? 8 : table.length <= 30 ? 10 : 12;
  const fieldCardWidth = table.length <= 8 ? 58 : table.length <= 14 ? 54 : table.length <= 36 ? 36 : 25;
  const fieldGap = table.length <= 14 ? 10 : 4;

  const instruction = view?.result ? text(language, '한 판이 끝났어요. 양쪽 점수와 족보를 확인하세요.', 'Terminó la partida. Revisa los puntos y las combinaciones de ambos lados.')
    : !active ? text(language, '상대 차례예요. 공개된 패와 점수를 확인할 수 있어요.', 'Turno rival. Puedes revisar las cartas visibles y los puntos.')
    : capturePhase ? text(language, '방금 공개된 패를 바닥의 두 후보 중 하나에 가져오세요.', 'Elige una de las dos cartas de la mesa para llevarte la recién revelada.')
    : selectedCard && selectedMonthCount === 2 ? text(language, '바닥의 두 후보 중 가져올 패를 선택하세요.', 'Elige cuál de las dos cartas de la mesa quieres capturar.')
    : selectedCard && selectedMonthCount === 1 ? text(language, '낼 패의 짝은 자동으로 가져옵니다. 내기를 확정하세요.', 'La pareja se captura automáticamente. Confirma la jugada.')
    : selectedCard && selectedMonthCount === 3 ? text(language, '같은 달 바닥 패 세 장을 모두 가져옵니다. 내기를 확정하세요.', 'Capturarás las tres cartas de ese mes. Confirma la jugada.')
    : selectedCard ? text(language, '패를 바닥에 내려놓으려면 내기를 확정하세요.', 'Confirma la jugada para dejar la carta en la mesa.')
    : text(language, '손패에서 이번 차례에 낼 패를 선택하세요.', 'Elige una carta de tu mano para jugar.');

  const run = async (choice?: { action: GameAction }) => {
    if (!choice || !active) return;
    const actionPromise = runWithActionLock(actionLock, () => runAction(choice.action));
    if (!actionPromise) return;
    setBusy(true); setError('');
    try {
      const accepted = await actionPromise;
      if (accepted === false) { setError(text(language, '동작이 거절됐어요. 현재 선택을 확인하세요.', 'No se aceptó la jugada. Revisa tu selección.')); return; }
      setSelected(null);
    } catch {
      setError(text(language, '동작을 완료하지 못했어요. 다시 선택하세요.', 'No se pudo completar. Vuelve a elegir.'));
    } finally { setBusy(false); }
  };

  return <section className={`minhwatu-table ${view?.result ? 'is-finished' : ''}`} aria-label={text(language, '민화투 게임판', 'Mesa de Minhwatu')}>
    <header className="hwatu-header">
      <div className="hwatu-title"><h2>{text(language, '민화투', 'Minhwatu')}</h2><p>{text(language, '48장으로 한 판 겨뤄요.', 'Jueguen una mano con 48 cartas.')}</p></div>
      <div className="hwatu-seat-strip" aria-label={text(language, '현재 점수와 차례', 'Puntos y turno')}>
        {(['p1', 'p2'] as PlayerId[]).map((seat, index) => <div className={`hwatu-seat-score ${seat === playerId ? 'is-own' : ''} ${view?.turn === seat && !view?.result ? 'is-turn' : ''}`} data-hwatu-zone={`score-${seat}`} data-player={seat} key={seat}>
          <span className={`hwatu-seat-dot seat-${index + 1}`} aria-hidden="true"/>
          <span className="hwatu-seat-label">{playerNames?.[seat] && <b>{playerNames[seat]} </b>}{seat === playerId ? text(language, '나', 'Tú') : text(language, '상대', 'Rival')}{view?.turn === seat && !view?.result ? ` · ${seat === playerId ? text(language, '내 차례', 'Tu turno') : text(language, '상대 차례', 'Turno rival')}` : ''}</span>
          <strong><GameValue value={Number(board.scores?.[seat] ?? scoreBreakdown[seat]?.finalScore ?? 0)} resetKey={`${scoreResetKey}:${seat}`}/><small>{text(language, '점', 'pts')}</small></strong>
        </div>)}
      </div>
    </header>

    {view?.result && <section className="hwatu-result" data-game="minhwatu" data-outcome={view.result.winner === 'draw' ? 'draw' : view.result.winner === playerId ? 'win' : 'lose'} role="status"><b>{view.result.winner === 'draw' ? text(language, '무승부', 'Empate') : view.result.winner === playerId ? text(language, '이겼어요!', '¡Ganaste!') : text(language, '상대가 이겼어요.', 'Ganó la otra persona.')}</b><span>{text(language, '최종 점수', 'Puntos finales')} {Number(view.result.scores?.p1 ?? 0)} : {Number(view.result.scores?.p2 ?? 0)}</span></section>}

    <div className="hwatu-tabletop-stage">
      <CaptureRack cards={captures[playerId]} seat={playerId} viewer={playerId} language={language} name={playerNames?.[playerId]} scoreResetKey={scoreResetKey} breakdown={record(scoreBreakdown[playerId])}/>
      <div className="hwatu-play-center">
        <div className="hwatu-opponent-bar" aria-label={text(language, '상대 손패', 'Mano rival')}>
          <div className="hwatu-opponent-summary"><b>{text(language, '상대 손패', 'Mano rival')}</b><span className="hwatu-opponent-count">{Number(view?.opponentCount ?? 0)}{text(language, '장', ' cartas')}</span></div>
          <span className="hwatu-opponent-fan" data-hwatu-zone="opponent-hand" aria-hidden="true">{Array.from({ length: Math.min(10, Number(view?.opponentCount ?? 0)) }, (_, i) => <i key={i} style={{ '--fan-index': i } as CSSProperties}/>)}</span>
          <div className="hwatu-event-overlay"><HwatuMotion events={publicEvents} language={language} playerId={playerId}/></div>
          <span className={`hwatu-turn-chip ${view?.result ? 'is-finished' : active ? 'is-active' : ''}`} role="status">{view?.result ? text(language, '정산 완료', 'Partida terminada') : activeLabel}</span>
        </div>

        <section className="hwatu-felt" style={{ '--hw-field-columns': fieldColumns, '--hw-field-card-width': `${fieldCardWidth}px`, '--hw-field-gap': `${fieldGap}px`, '--hw-field-grid-width': `${fieldColumns * fieldCardWidth + (fieldColumns - 1) * fieldGap}px` } as CSSProperties} aria-label={text(language, '공개된 바닥 패', 'Cartas visibles en la mesa')}>
          <header className="hwatu-felt-heading"><div><h3>{text(language, '바닥 패', 'Mesa')}</h3><span>{text(language, `공개된 패 ${table.length}장`, `${table.length} cartas visibles`)}</span></div>
            <span className="hwatu-stock-count" data-hwatu-zone="deck"><span className="hwatu-deck-back" aria-hidden="true"><i/><i/><i/></span><span>{text(language, '남은 더미', 'Mazo')}</span><b>{stockCount}</b></span>
          </header>
          <div className={`hwatu-table-cards ${view?.result && !table.length ? 'is-empty-finished' : ''}`} data-hwatu-zone="table">
            {table.map((card, index) => {
              const choice = actionForTarget(index), legal = Boolean(choice && active && (selectedCard || capturePhase));
              const target = legal && (capturePhase || selectedMonthCount === 2);
              const label = `${text(language, `${card.month}월 ${card.flower.ko} ${card.badge.ko}`, `Mes ${card.month}, ${card.flower.es}, ${card.badge.es}`)}${target ? ` · ${text(language, '선택해 가져오기', 'Elegir para capturar')}` : ''}`;
              return legal ? <button className={`hwatu-table-card is-legal ${target ? 'is-target' : ''}`} type="button" key={card.id} data-hwatu-card-id={card.id} onClick={() => void run(choice)} aria-label={label} disabled={busy}>
                <HwatuCard card={card} language={language}/>{target && <span className="hwatu-target-label">{text(language, '선택', 'Elegir')}</span>}
              </button> : <div className="hwatu-table-card" key={card.id} data-hwatu-card-id={card.id} aria-label={label}><HwatuCard card={card} language={language}/></div>;
            })}
          </div>
          {!view?.result && <div className="hwatu-draw-area" data-hwatu-zone="draw">
            <div className="hwatu-draw-label"><span>{text(language, '이번 차례 공개', 'Carta revelada')}</span><small>{text(language, '더미 맨 위', 'Parte superior del mazo')}</small></div>
            {pending ? <div className="hwatu-drawn-card" data-hwatu-card-id={pending.id}><HwatuCard card={pending} language={language}/></div> : <span className="hwatu-draw-hint">{text(language, '차례가 끝나면 더미에서 한 장을 공개해요.', 'Al terminar la jugada, se revela una carta del mazo.')}</span>}
          </div>}
        </section>
        <div className={`hwatu-phase-note ${active ? 'is-active' : ''}`} role="status" aria-live="polite">
          <span className="hwatu-phase-dot" aria-hidden="true"/><span>{instruction}</span>
          {busy && <b>{text(language, '처리 중…', 'Procesando…')}</b>}
          {error && <b className="hwatu-error" role="alert">{error}</b>}
        </div>

        <section className={`hwatu-hand-section ${view?.result && !hand.length ? 'is-empty-finished' : ''}`} aria-label={text(language, '내 손패', 'Tu mano')}>
          <header className="hwatu-hand-heading"><div><h3>{text(language, '내 손패', 'Tu mano')}</h3><span>{hand.length}</span></div><small>{text(language, '표시된 패로 바닥 패를 가져올 수 있어요.', 'Las cartas marcadas pueden capturar.')}</small></header>
          <div className={`hwatu-choice-hand ${view?.result && !hand.length ? 'is-empty-finished' : ''}`} data-hwatu-zone="hand">{hand.map((card, index) => {
            const legalChoices = choices.filter(choice => choice.action.type === 'play' && Number(choice.action.payload?.index) === index);
            const isSelected = selected === card.id, canPlay = legalChoices.length > 0 && active && !capturePhase;
            const matches = table.filter(item => item.month === card.month).length;
            const capturable = active && !capturePhase && matches > 0;
            return <button className={`hwatu-hand-choice ${isSelected ? 'is-selected' : ''} ${canPlay ? 'is-playable' : ''} ${capturable ? 'is-capturable' : ''}`} type="button" key={card.id} data-hwatu-card-id={card.id} disabled={!active || !legalChoices.length || capturePhase || busy} aria-pressed={isSelected} aria-label={`${text(language, `${card.month}월 ${card.flower.ko} ${card.badge.ko}`, `Mes ${card.month}, ${card.flower.es}, ${card.badge.es}`)}${capturable ? ` · ${text(language, '가져올 수 있음', 'Se puede capturar')}` : ''}`} onClick={() => { setError(''); setSelected(isSelected ? null : card.id); }}>
              <HwatuCard card={card} language={language}/>
            </button>;
          })}</div>
          <div className="hwatu-hand-actions">{active && !capturePhase && selectedCard && <div className="hwatu-confirm-row">
            {plays.length === 1 && plays[0].action.payload?.targetIndex === undefined ? <button className="hwatu-confirm" type="button" disabled={busy} onClick={() => void run(plays[0])}>{text(language, `${selectedCard.month}월 패 내기`, `Jugar la carta del mes ${selectedCard.month}`)}</button> : <span>{text(language, '바닥에서 가져올 패를 선택하세요.', 'Elige en la mesa la carta que vas a capturar.')}</span>}
            <button className="hwatu-cancel" type="button" disabled={busy} onClick={() => { setSelected(null); setError(''); }}>{text(language, '선택 취소', 'Cancelar')}</button>
          </div>}
          {capturePhase && active && <p className="hwatu-confirm-row" role="status">{text(language, '바닥에서 같은 달 패를 선택하세요.', 'Elige en la mesa una carta del mismo mes.')}</p>}</div>
        </section>

      </div>
      <CaptureRack cards={captures[otherId]} seat={otherId} viewer={playerId} language={language} name={playerNames?.[otherId]} scoreResetKey={scoreResetKey} breakdown={record(scoreBreakdown[otherId])}/>
    </div>

    <details className="hwatu-action-log">
      <summary>{text(language, '최근 행동', 'Actividad reciente')} · {publicLog.length}</summary>
      {publicLog.length ? <ol>{publicLog.map((event, index) => {
        const actor = event.actor === playerId ? text(language, '나', 'Tú') : event.actor ? text(language, '상대', 'Contrincante') : '';
        const deltas = record(event.scoreChanges);
        const changes = (['p1', 'p2'] as PlayerId[]).filter(seat => Number(deltas[seat] ?? 0) !== 0).map(seat => {
          const delta = Number(deltas[seat]);
          return `${seat === playerId ? text(language, '나', 'Tú') : text(language, '상대', 'Contrincante')} ${delta > 0 ? '+' : ''}${delta}`;
        });
        return <li key={`${Number(event.sequence ?? index)}:${index}`}><span>{actor && <b>{actor}</b>} {String(record(event.title)[language] ?? '')}</span>{changes.length > 0 && <small>{changes.join(' · ')}</small>}</li>;
      })}</ol> : <p>{text(language, '아직 기록된 행동이 없어요.', 'Todavía no hay acciones registradas.')}</p>}
    </details>

    <details className="hwatu-scoring" aria-label={text(language, '점수와 족보', 'Puntos y combinaciones')}>
      <summary>{text(language, '점수 계산과 족보 상세', 'Detalle de puntos y combinaciones')} · {text(language, '내 기본점수 + 내 족보 × 2 − 상대 족보', 'Tus puntos base + tus yakus × 2 − yakus rivales')}</summary>
      <div className="hwatu-breakdowns">{(['p1', 'p2'] as PlayerId[]).map(seat => {
        const info = record(scoreBreakdown[seat]), base = Number(info.basePoints ?? 0), ownYaku = Number(info.ownYakuPoints ?? 0), enemyYaku = Number(info.opponentYakuPoints ?? 0), finalScore = Number(info.finalScore ?? board.scores?.[seat] ?? 0);
        const ownedByViewer = seat === playerId, yakus: AnyRecord[] = array(info.yakus);
        const countData = record(info.counts), cards = captures[seat], counts = captureCounts(cards);
        return <article className={`hwatu-breakdown ${ownedByViewer ? 'is-own' : ''}`} data-seat={seat} key={seat}>
          <header><b>{ownedByViewer ? text(language, '내 점수', 'Tus puntos') : text(language, '상대 점수', 'Puntos rivales')}</b><strong><GameValue value={finalScore} resetKey={`${scoreResetKey}:breakdown:${seat}`}/><small>{text(language, '점', 'pts')}</small></strong></header>
          <p className="hwatu-formula">{ownedByViewer
            ? text(language, `기본 ${base} + 내 족보 ${ownYaku} × 2 − 상대 족보 ${enemyYaku} = ${finalScore}`, `Base ${base} + tus yakus ${ownYaku} × 2 − yakus del rival ${enemyYaku} = ${finalScore}`)
            : text(language, `상대 기본 ${base} + 상대 족보 ${ownYaku} × 2 − 내 족보 ${enemyYaku} = ${finalScore}`, `Base rival ${base} + yakus del rival ${ownYaku} × 2 − tus yakus ${enemyYaku} = ${finalScore}`)}</p>
          <div className="hwatu-count-line" aria-label={text(language, '획득한 패 종류별 수', 'Cartas capturadas por categoría')}>{categories.map(kind => <span key={kind}><b>{categoryName[kind][language]}</b> {Number(countData[kind] ?? counts[kind])}</span>)}</div>
          <ul className="hwatu-yaku-list">{yakus.map(yaku => {
            const id = String(yaku.id ?? ''), label = record(yaku.label)[language] ?? id, bonus = Number(yaku.bonus ?? 0), godori = /godori|고도리/i.test(`${id} ${label}`);
            return <li className={yaku.complete ? 'is-complete' : ''} key={id || label}><span>{label}</span><b>{godori && yaku.complete && bonus === 0 ? text(language, '3장 완성 · 추가 점수 없음', 'Completo · sin puntos extra') : yaku.complete ? `+${bonus} ${text(language, '점', 'pts')}` : text(language, `${Number(yaku.have ?? 0)}/${Number(yaku.need ?? 0)}장`, `${Number(yaku.have ?? 0)}/${Number(yaku.need ?? 0)}`)}</b></li>;
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

function CaptureRack({ cards, seat, viewer, language, name, scoreResetKey, breakdown }: { cards: MinhwatuCard[]; seat: PlayerId; viewer: PlayerId; language: Language; name?: string; scoreResetKey: string; breakdown: AnyRecord }) {
  const isViewer = seat === viewer, counts = captureCounts(cards), score = Number(breakdown.finalScore ?? 0), yakus = array<AnyRecord>(breakdown.yakus);
  return <aside className={`hwatu-capture-rack ${isViewer ? 'is-own' : ''}`} data-seat={seat} aria-label={`${isViewer ? text(language, '내가 모은 패', 'Mis capturas') : text(language, '상대가 모은 패', 'Capturas rivales')}: ${score}`}>
    <header className="hwatu-capture-rack-heading"><div>{name && <span className="hwatu-player-name">{name}</span>}<b>{isViewer ? text(language, '내가 모은 패', 'Mis capturas') : text(language, '상대가 모은 패', 'Capturas rivales')}</b><span>{cards.length} {text(language, '장', 'cartas')}</span></div><strong><GameValue value={score} resetKey={`${scoreResetKey}:rack:${seat}`}/><small>{text(language, '점', 'pts')}</small></strong></header>
    <div className="hwatu-capture-categories">{categories.map(kind => {
      const pile = cards.filter(card => card.kind === kind).sort((a, b) => a.month - b.month || a.id.localeCompare(b.id));
      return <section className={`hwatu-category-pile kind-${kind}`} key={kind} data-hwatu-zone={`captures-${seat}-${kind}`}>
        <header><span>{categoryName[kind][language]}</span><b>{counts[kind]}</b></header>
        {pile.length ? <div className="hwatu-captured-grid" style={{ '--capture-count': pile.length } as CSSProperties}>{pile.map(card => <div className="hwatu-captured-card" key={card.id} data-hwatu-card-id={card.id} tabIndex={0}><HwatuCard card={card} language={language}/></div>)}</div> : <span className="hwatu-empty-pile">—</span>}
      </section>;
    })}</div>
    <section className="hwatu-rail-progress" aria-label={text(language, '족보 진행', 'Progreso de combinaciones')}>
      <h3>{text(language, '족보', 'Combinaciones')}</h3>
      <ul>{yakus.map(yaku => <li key={String(yaku.id)} className={yaku.complete ? 'is-complete' : ''}>
        <span>{record(yaku.label)[language] ?? yaku.id}</span><b>{yaku.complete && Number(yaku.bonus) > 0 ? `+${yaku.bonus}` : `${Number(yaku.have ?? 0)}/${Number(yaku.need ?? 0)}`}</b>
      </li>)}</ul>
    </section>
  </aside>;
}

import { useEffect, useRef, useState } from 'react';
import type { Language, PlayerId } from '../core/types';
import { dominoSequence, dominoWindow, type DominoActionEvent } from './domino-motion';
import '../styles/domino-events.css';

function latestEvent(events: readonly (DominoActionEvent | null | undefined)[]) {
  return events.filter((event): event is DominoActionEvent => Boolean(event) && dominoSequence(event) > 0).slice().sort((a, b) => dominoSequence(a) - dominoSequence(b)).at(-1) ?? null;
}

function actorName(actor: string | undefined, playerId: PlayerId, language: Language) {
  if (!actor) return '';
  if (actor === playerId) return language === 'ko' ? '나' : 'Tú';
  if (actor === 'p1' || actor === 'p2') return language === 'ko' ? '상대' : 'Tu pareja';
  if (actor === 'b1' || actor === 'b2') return language === 'ko' ? `봇 ${actor.slice(1)}` : `Bot ${actor.slice(1)}`;
  return '';
}

function pipPoints(count: number): [number, number][] {
  const patterns: Record<number, [number, number][]> = {
    0: [], 1: [[8, 8]], 2: [[4, 4], [12, 12]], 3: [[4, 4], [8, 8], [12, 12]],
    4: [[4, 4], [12, 4], [4, 12], [12, 12]], 5: [[4, 4], [12, 4], [8, 8], [4, 12], [12, 12]],
    6: [[4, 3], [12, 3], [4, 8], [12, 8], [4, 13], [12, 13]],
  };
  return patterns[count] ?? [];
}

function TileArt({ tile }: { tile: DominoActionEvent['tile'] }) {
  if (!tile) return <EventArt type="play"/>;
  return <svg className="domino-event-art domino-event-tile-art" viewBox="0 0 34 44" aria-hidden="true">
    <rect x="1.5" y="1.5" width="31" height="41" rx="5"/><path d="M3 22h28"/>
    {pipPoints(tile.a).map(([x, y], index) => <circle key={`a${index}`} cx={x + 1} cy={y + 2} r="1.6"/>)}
    {pipPoints(tile.b).map(([x, y], index) => <circle key={`b${index}`} cx={x + 1} cy={y + 24} r="1.6"/>)}
  </svg>;
}

function EventArt({ type }: { type: string }) {
  if (type === 'play') return null;
  if (type === 'pass') return <svg className="domino-event-art" viewBox="0 0 36 36" aria-hidden="true"><rect x="5" y="8" width="11" height="20" rx="3"/><rect x="20" y="8" width="11" height="20" rx="3"/><path d="m7 28 22-21"/></svg>;
  if (type === 'turn') return <svg className="domino-event-art" viewBox="0 0 36 36" aria-hidden="true"><path d="M9 13a11 11 0 0 1 19-3l3 3M31 7v6h-6M27 23a11 11 0 0 1-19 3l-3-3M5 29v-6h6"/></svg>;
  if (type === 'tranque') return <svg className="domino-event-art domino-tranque-art" viewBox="0 0 36 36" aria-hidden="true"><rect x="4" y="9" width="28" height="18" rx="3"/><path d="M13 9v18m10-18v18M8 4l20 28"/></svg>;
  if (type === 'capicua') return <svg className="domino-event-art domino-capicua-art" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="13"/><path d="m18 7 3 7 8 .5-6 5 2 8-7-4-7 4 2-8-6-5 8-.5z"/><path d="M6 10 4 8m26 0-2 2M6 26l-2 2m26 0-2-2"/></svg>;
  if (type === 'paso-corrido') return <svg className="domino-event-art domino-paso-art" viewBox="0 0 38 36" aria-hidden="true"><path d="M5 9h28l-4 8 4 10H5l4-10z"/><path d="m14 13 5 4-5 4m6-8 5 4-5 4"/></svg>;
  if (type === 'round-end' || type === 'score') return <svg className="domino-event-art" viewBox="0 0 36 36" aria-hidden="true"><path d="M5 30h26M9 25V16h5v9m4 0V8h5v17m4 0v-6h4v6"/><path d="m8 11 7-5 6 2 8-5"/></svg>;
  if (type === 'win') return <svg className="domino-event-art domino-win-art" viewBox="0 0 36 36" aria-hidden="true"><path d="M18 4 21 12l9-4-4 9 8 3-8 3 4 9-9-4-3 8-3-8-9 4 4-9-8-3 8-3-4-9 9 4z"/></svg>;
  if (type === 'round-start') return <svg className="domino-event-art" viewBox="0 0 36 36" aria-hidden="true"><path d="M8 31V5m1 2h18l-5 6 5 6H9"/></svg>;
  return <svg className="domino-event-art" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="12"/><path d="M18 11v14m-7-7h14"/></svg>;
}

export function DominoEventStage({ events, language, playerId, ownTeam = playerId }: {
  events: readonly (DominoActionEvent | null | undefined)[];
  language: Language;
  playerId: PlayerId;
  ownTeam?: PlayerId;
}) {
  const [presented, setPresented] = useState<DominoActionEvent | null>(() => latestEvent(events));
  const [queue, setQueue] = useState<DominoActionEvent[]>([]);
  const [reduced, setReduced] = useState(false);
  const [round, setRound] = useState(0);
  const sequence = useRef<number | null>(null);
  const currentPlayer = useRef(playerId);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    const ordered = events.filter((event): event is DominoActionEvent => Boolean(event) && dominoSequence(event) > 0).slice().sort((a, b) => dominoSequence(a) - dominoSequence(b));
    if (currentPlayer.current !== playerId) {
      currentPlayer.current = playerId;
      sequence.current = ordered.reduce((max, event) => Math.max(max, dominoSequence(event)), 0);
      setRound(value => value + 1);
      setQueue([]);
      setPresented(ordered.at(-1) ?? null);
      return;
    }
    if (sequence.current === null) {
      sequence.current = ordered.reduce((max, event) => Math.max(max, dominoSequence(event)), 0);
      setPresented(ordered.at(-1) ?? null);
      return;
    }
    const update = dominoWindow(ordered, sequence.current);
    if (update.reset) {
      sequence.current = update.latest;
      setRound(value => value + 1);
      setQueue([]);
      if (!update.fresh.length) {
        setPresented(null);
        return;
      }
    }
    if (!update.fresh.length) return;
    sequence.current = update.latest;
    if (reduced) {
      setPresented(update.fresh.at(-1) ?? null);
      setQueue([]);
    } else setQueue(current => [...current, ...update.fresh]);
  }, [events, playerId, reduced]);

  useEffect(() => {
    if (reduced || !queue.length) return;
    setPresented(queue[0]);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setQueue(current => current.slice(1));
    }, 430);
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = null;
    };
  }, [queue, reduced]);

  useEffect(() => {
    if (reduced && queue.length) {
      setPresented(queue.at(-1) ?? null);
      setQueue([]);
    }
  }, [queue, reduced]);

  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);

  if (!presented) return null;
  const type = presented.type ?? '';
  const actor = actorName(presented.actor, playerId, language);
  const points = Number.isFinite(presented.points) && Number(presented.points) > 0 ? Number(presented.points) : null;
  const winner = presented.team === 'p1' || presented.team === 'p2'
    ? presented.team === ownTeam
      ? (language === 'ko' ? '우리 팀 승리' : 'Ganó tu equipo')
      : (language === 'ko' ? '상대 팀 승리' : 'Ganó el equipo rival')
    : '';
  return <div className={`domino-event-stage domino-event-stage--${type.replace(/[^a-z-]/g, '')}${queue.length && !reduced ? ' is-animating' : ''}`} key={`${round}:${dominoSequence(presented)}`} role="group" aria-label={presented.title?.[language] ?? (language === 'ko' ? '도미노 진행 상황' : 'Evento de dominó')}>
    <span className="domino-event-mark" aria-hidden="true">{type === 'play' ? <TileArt tile={presented.tile}/> : <EventArt type={type}/>}</span>
    <div className="domino-event-copy">
      <div className="domino-event-heading"><strong>{presented.title?.[language] ?? ''}</strong>{actor && <span>{actor}</span>}</div>
      {presented.text?.[language] && <p className="domino-event-detail">{presented.text[language]}</p>}
      {presented.round !== undefined && (type === 'round-start' || type === 'round-end') && <small>{language === 'ko' ? `${presented.round}라운드` : `Ronda ${presented.round}`}</small>}
      {points !== null && <b className="domino-event-points">+{points}<small>{language === 'ko' ? '점' : 'puntos'}</small></b>}
      {winner && type === 'win' && <span className="domino-event-winner">{winner}</span>}
    </div>
    {type === 'capicua' && <span className="domino-event-seal" aria-hidden="true">C</span>}
    {type === 'paso-corrido' && <span className="domino-event-ribbon">{points
      ? (language === 'ko' ? `연속 패스 보너스 +${points}` : `Bono por pases seguidos +${points}`)
      : (language === 'ko' ? '파소 코리도' : 'Paso corrido')}</span>}
  </div>;
}

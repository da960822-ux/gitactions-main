import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { DominoTile } from './DominoTile';
import { playCue } from '../audio/audio';
import type { Language, PlayerId } from '../core/types';
import { dominoSequence, dominoWindow, type DominoActionEvent } from './domino-motion';
import '../styles/domino-events.css';

function latestEvent(events: readonly (DominoActionEvent | null | undefined)[]) {
  return events.filter((event): event is DominoActionEvent => Boolean(event) && dominoSequence(event) > 0).slice().sort((a, b) => dominoSequence(a) - dominoSequence(b)).at(-1) ?? null;
}

function actorName(actor: string | undefined, playerId: PlayerId, language: Language, mode: string) {
  if (!actor) return '';
  if (actor === playerId) return language === 'ko' ? '나' : 'Tú';
  if (actor === 'p1' || actor === 'p2') return mode === 'humans-vs-bots' ? language === 'ko' ? '팀원' : 'Compañero' : language === 'ko' ? '상대' : 'Rival';
  if (actor === 'b1' || actor === 'b2') return language === 'ko' ? `봇 ${actor.slice(1)}` : `Bot ${actor.slice(1)}`;
  return '';
}

function TileArt({ tile }: { tile: DominoActionEvent['tile'] }) {
  return tile ? <span className="domino-event-tile-art"><DominoTile left={tile.a} right={tile.b} vertical/></span> : null;
}

type TileBounds = { left: number; top: number; width: number; height: number; a?: number; b?: number };
type Flight = { event: DominoActionEvent; source: TileBounds; target: TileBounds; vertical: boolean; rotation: number };
const bounds = (node: HTMLElement): TileBounds => {
  const { left, top, width, height } = node.getBoundingClientRect();
  return { left, top, width, height };
};
const tileKey = (a: number, b: number) => [a, b].sort((x, y) => x - y).join('|');

function EventArt({ type }: { type: string }) {
  if (type === 'play') return null;
  if (type === 'pass') return <svg className="domino-event-art" viewBox="0 0 36 36" aria-hidden="true"><rect x="5" y="8" width="11" height="20" rx="3"/><rect x="20" y="8" width="11" height="20" rx="3"/><path d="m7 28 22-21"/></svg>;
  if (type === 'turn') return <svg className="domino-event-art" viewBox="0 0 36 36" aria-hidden="true"><path d="M9 13a11 11 0 0 1 19-3l3 3M31 7v6h-6M27 23a11 11 0 0 1-19 3l-3-3M5 29v-6h6"/></svg>;
  if (type === 'tranque') return <svg className="domino-event-art domino-tranque-art" viewBox="0 0 36 36" aria-hidden="true"><rect x="4" y="9" width="28" height="18" rx="3"/><path d="M13 9v18m10-18v18M8 4l20 28"/></svg>;
  if (type === 'capicua') return <svg className="domino-event-art domino-capicua-art" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="13"/><path d="m18 7 3 7 8 .5-6 5 2 8-7-4-7 4 2-8-6-5 8-.5z"/><path d="M6 10 4 8m26 0-2 2M6 26l-2 2m26 0-2-2"/></svg>;
  if (type === 'paso-corrido' || type === 'opening-pass') return <svg className="domino-event-art domino-paso-art" viewBox="0 0 38 36" aria-hidden="true"><path d="M5 9h28l-4 8 4 10H5l4-10z"/><path d="m14 13 5 4-5 4m6-8 5 4-5 4"/></svg>;
  if (type === 'round-end' || type === 'score') return <svg className="domino-event-art" viewBox="0 0 36 36" aria-hidden="true"><path d="M5 30h26M9 25V16h5v9m4 0V8h5v17m4 0v-6h4v6"/><path d="m8 11 7-5 6 2 8-5"/></svg>;
  if (type === 'win') return <svg className="domino-event-art domino-win-art" viewBox="0 0 36 36" aria-hidden="true"><path d="M18 4 21 12l9-4-4 9 8 3-8 3 4 9-9-4-3 8-3-8-9 4 4-9-8-3 8-3-4-9 9 4z"/></svg>;
  if (type === 'round-start') return <svg className="domino-event-art" viewBox="0 0 36 36" aria-hidden="true"><path d="M8 31V5m1 2h18l-5 6 5 6H9"/></svg>;
  return <svg className="domino-event-art" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="12"/><path d="M18 11v14m-7-7h14"/></svg>;
}

export function DominoEventStage({ events, language, playerId, ownTeam = playerId, identity = playerId, mode = '1v1' }: {
  events: readonly (DominoActionEvent | null | undefined)[];
  language: Language;
  playerId: PlayerId;
  ownTeam?: PlayerId;
  identity?: string;
  mode?: string;
}) {
  const [presented, setPresented] = useState<DominoActionEvent | null>(() => latestEvent(events));
  const [queue, setQueue] = useState<DominoActionEvent[]>([]);
  const [reduced, setReduced] = useState(false);
  const [round, setRound] = useState(0);
  const sequence = useRef<number | null>(null);
  const currentIdentity = useRef(identity);
  const stageRef = useRef<HTMLDivElement>(null);
  const handBounds = useRef(new Map<string, TileBounds>());
  const confirmedSource = useRef<{ key: string; bounds: TileBounds } | null>(null);
  const sources = useRef(new Map<number, TileBounds>());
  const pendingTargets = useRef(new Map<number, HTMLElement>());
  const clearTargets = () => {
    pendingTargets.current.forEach(node => node.classList.remove('is-flight-target'));
    pendingTargets.current.clear();
  };
  const [flight, setFlight] = useState<Flight | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const root = () => stageRef.current?.closest<HTMLElement>('.domino-premium');
  // The shared feedback announces titles and wins; this region adds public detail only.
  const eventDetail = (event: DominoActionEvent) => {
    if (event.type === 'pass') return [actorName(event.actor, playerId, language, mode), language === 'ko' ? `연속 패스 ${event.count ?? 0}회` : `Pases seguidos: ${event.count ?? 0}`].filter(Boolean).join(' · ');
    if (!['tranque', 'capicua', 'paso-corrido', 'opening-pass', 'round-end', 'score'].includes(event.type ?? '')) return '';
    const score = Number(event.points) > 0 ? `${event.team ? event.team === ownTeam ? language === 'ko' ? '우리 팀' : 'Tu equipo' : language === 'ko' ? '상대 팀' : 'Equipo rival' : ''} +${event.points} ${language === 'ko' ? '점' : 'puntos'}`.trim() : '';
    return [event.text?.[language], score].filter(Boolean).join(' · ');
  };

  useLayoutEffect(() => {
    const table = root();
    pendingTargets.current.forEach(node => node.classList.add('is-flight-target'));
    for (const event of events) {
      if (!event?.tile || event.actor !== playerId || sources.current.has(dominoSequence(event))) continue;
      const key = tileKey(event.tile.a, event.tile.b);
      const source = confirmedSource.current?.key === key ? confirmedSource.current.bounds : handBounds.current.get(key);
      if (source) { sources.current.set(dominoSequence(event), source); if (confirmedSource.current?.key === key) confirmedSource.current = null; }
    }
    handBounds.current.clear();
    table?.querySelectorAll<HTMLElement>('.dp-hand-tile[data-domino-a][data-domino-b]').forEach(node => {
      handBounds.current.set(tileKey(Number(node.dataset.dominoA), Number(node.dataset.dominoB)), { ...bounds(node), a: Number(node.dataset.dominoA), b: Number(node.dataset.dominoB) });
    });
  });
  useEffect(() => {
    const table = root();
    const rememberSelected = (event: Event) => {
      if (!(event.target instanceof Element) || !event.target.closest('.dp-end-target,.dp-start-target')) return;
      const tile = table?.querySelector<HTMLElement>('.dp-hand-tile.is-selected');
      if (tile) confirmedSource.current = { key: tileKey(Number(tile.dataset.dominoA), Number(tile.dataset.dominoB)), bounds: { ...bounds(tile), a: Number(tile.dataset.dominoA), b: Number(tile.dataset.dominoB) } };
    };
    table?.addEventListener('click', rememberSelected, true);
    return () => table?.removeEventListener('click', rememberSelected, true);
  }, [identity]);
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
    if (currentIdentity.current !== identity) {
      currentIdentity.current = identity;
      confirmedSource.current = null;
      sources.current.clear();
      clearTargets();
      setFlight(null);
      setAnnouncement('');
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
      sources.current.clear();
      clearTargets();
      setFlight(null);
      setAnnouncement('');
      setPresented(ordered.at(-1) ?? null);
      return;
    }
    if (!update.fresh.length) return;
    const backlog = update.fresh.filter(event => event.type === 'play').length > 4;
    if (document.hidden || update.fresh.some(event => event.type === 'round-end' || event.type === 'win') || backlog) {
      sequence.current = update.latest;
      setQueue([]);
      clearTargets();
      setFlight(null);
      setAnnouncement(document.hidden || backlog ? '' : update.fresh.map(eventDetail).filter(Boolean).at(-1) ?? '');
      setPresented(ordered.at(-1) ?? null);
      return;
    }
    sequence.current = update.latest;
    if (reduced) {
      setPresented(update.fresh.at(-1) ?? null);
      setAnnouncement(update.fresh.map(eventDetail).filter(Boolean).at(-1) ?? '');
      if (update.fresh.some(event => event.type === 'play')) playCue('domino', 'place');
      setQueue([]);
    } else {
      for (const event of update.fresh) {
        if (event.type !== 'play') continue;
        const target = root()?.querySelector<HTMLElement>(`.dp-tile.is-chain[data-sequence="${dominoSequence(event)}"]`);
        if (target) { target.classList.add('is-flight-target'); pendingTargets.current.set(dominoSequence(event), target); }
      }
      setQueue(current => [...current, ...update.fresh]);
    }
  }, [events, playerId, identity, reduced]);

  useEffect(() => {
    if (reduced || !queue.length) { clearTargets(); setFlight(null); return; }
    const event = queue[0];
    setPresented(event);
    const detail = eventDetail(event);
    if (detail) setAnnouncement(detail);
    const table = root();
    const target = event.type === 'play' && event.tile
      ? table?.querySelector<HTMLElement>(`.dp-tile.is-chain[data-sequence="${dominoSequence(event)}"]`) : null;
    const seat = /^(p|b)[12]$/.test(event.actor ?? '')
      ? table?.querySelector<HTMLElement>(`[data-domino-seat="${event.actor}"] .dp-backs`)
        ?? table?.querySelector<HTMLElement>(`[data-domino-seat="${event.actor}"]`) : null;
    const pane = target?.closest<HTMLElement>('.dp-chain-scroll');
    if (target && pane) {
      const tile = bounds(target), area = bounds(pane);
      const shift = tile.left < area.left ? tile.left - area.left : tile.left + tile.width > area.left + area.width ? tile.left + tile.width - area.left - area.width : 0;
      if (shift) pane.scrollLeft += shift;
    }
    const source = sources.current.get(dominoSequence(event)) ?? (seat ? bounds(seat) : null);
    if (target && source && event.tile) {
      const destination = bounds(target);
      if (destination.width > 0 && destination.left >= 0 && destination.top >= 0) {
        target.classList.add('is-flight-target');
        const a = Number(target.dataset.dominoA ?? event.tile.a), b = Number(target.dataset.dominoB ?? event.tile.b);
        const vertical = target.classList.contains('is-double');
        const reversed = source.a !== undefined && source.a !== a && source.b === a;
        setFlight({ event: { ...event, tile: { a, b } }, source, target: destination, vertical, rotation: vertical ? -90 : reversed ? 180 : 0 });
      }
    }
    timer.current = window.setTimeout(() => {
      timer.current = null;
      target?.classList.remove('is-flight-target');
      pendingTargets.current.delete(dominoSequence(event));
      sources.current.delete(dominoSequence(event));
      if (event.type === 'play' && !document.hidden) playCue('domino', 'place');
      setFlight(null);
      setQueue(current => current.slice(1));
    }, event.type === 'play' ? 340 : 180);
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = null;
      target?.classList.remove('is-flight-target');
    };
  }, [dominoSequence(queue[0]), reduced]);

  useEffect(() => {
    const settle = () => {
      if (!document.hidden) return;
      sequence.current = Math.max(sequence.current ?? 0, ...events.map(dominoSequence));
      setQueue([]);
      clearTargets();
      setFlight(null);
      setAnnouncement('');
      setPresented(latestEvent(events));
    };
    document.addEventListener('visibilitychange', settle);
    window.addEventListener('pagehide', settle);
    return () => { document.removeEventListener('visibilitychange', settle); window.removeEventListener('pagehide', settle); };
  }, [events]);

  useEffect(() => {
    if (reduced && queue.length) {
      setPresented(queue.at(-1) ?? null);
      setQueue([]);
    }
  }, [queue, reduced]);

  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); clearTargets(); }, []);

  if (!presented) return <span ref={stageRef} hidden/>;
  const type = presented.type ?? '';
  const actor = actorName(presented.actor, playerId, language, mode);
  const points = Number.isFinite(presented.points) && Number(presented.points) > 0 ? Number(presented.points) : null;
  const winner = presented.team === 'p1' || presented.team === 'p2'
    ? presented.team === ownTeam
      ? (language === 'ko' ? '우리 팀 승리' : 'Ganó tu equipo')
      : (language === 'ko' ? '상대 팀 승리' : 'Ganó el equipo rival')
    : '';
  const resultTitle = type === 'win' && presented.team && presented.team !== ownTeam
    ? (language === 'ko' ? '경기 결과' : 'Resultado del partido')
    : presented.title?.[language] ?? '';
  return <><span className="dp-sr-only" aria-live="polite" aria-atomic="true">{announcement}</span><div ref={stageRef} className={`domino-event-stage domino-event-stage--${type.replace(/[^a-z-]/g, '')}${queue.length && !reduced ? ' is-animating' : ''}`} key={`${round}:${dominoSequence(presented)}`} role="group" aria-label={resultTitle || (language === 'ko' ? '도미노 진행 상황' : 'Evento de dominó')}>
    <span className="domino-event-mark" aria-hidden="true">{type === 'play' ? <TileArt tile={presented.tile}/> : <EventArt type={type}/>}</span>
    <div className="domino-event-copy">
      <div className="domino-event-heading"><strong>{resultTitle}</strong>{actor && <span>{actor}</span>}</div>
      {presented.text?.[language] && <p className="domino-event-detail">{presented.text[language]}</p>}
      {presented.round !== undefined && (type === 'round-start' || type === 'round-end') && <small>{language === 'ko' ? `${presented.round}라운드` : `Ronda ${presented.round}`}</small>}
      {points !== null && <b className="domino-event-points">+{points}<small>{language === 'ko' ? '점' : 'puntos'}</small></b>}
      {winner && type === 'win' && <span className="domino-event-winner">{winner}</span>}
    </div>
    {type === 'capicua' && <span className="domino-event-seal" aria-hidden="true">C</span>}
    {type === 'opening-pass' && <span className="domino-event-ribbon">{language === 'ko' ? `첫 패스 보너스 +${points}` : `Bono de salida +${points}`}</span>}
    {type === 'paso-corrido' && <span className="domino-event-ribbon">{points
      ? (language === 'ko' ? `연속 패스 보너스 +${points}` : `Bono por pases seguidos +${points}`)
      : (language === 'ko' ? '파소 코리도' : 'Paso corrido')}</span>}
  </div>{flight?.event.tile && createPortal(<div className="domino-flight" data-domino-flight-sequence={dominoSequence(flight.event)} aria-hidden="true" style={{
    left: flight.target.left, top: flight.target.top, width: flight.target.width, height: flight.target.height,
    '--flight-x': `${flight.source.left + flight.source.width / 2 - flight.target.left - flight.target.width / 2}px`,
    '--flight-y': `${flight.source.top + flight.source.height / 2 - flight.target.top - flight.target.height / 2}px`,
    '--flight-scale': Math.min(1.5, Math.max(.5, flight.source.width / flight.target.width)),
    '--flight-rotation': `${flight.rotation}deg`,
  } as CSSProperties}><DominoTile left={flight.event.tile.a} right={flight.event.tile.b} vertical={flight.vertical}/></div>, document.body)}</>;
}

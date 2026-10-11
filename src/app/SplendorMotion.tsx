import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import art from '../../public/images/splendor/card-map.json';
import { SplendorGem } from './SplendorGem';
import { playCue, type AudioCue } from '../audio/audio';

type Box = { left: number; top: number; width: number; height: number };
type MotionEvent = {
  key: string; version?: number; outgoingCounts?: Record<string, number>; incomingCounts?: Record<string, number>; reserveGoldCount?: number;
  purchasedCard?: { id: string; bonus: string }; nobleId?: string;
  nobleAwarded?: boolean; nobleRecipient?: 'you' | 'rival' | 'unknown';
  result?: string;
};
type Flight = { id: string; kind: 'payment' | 'gain' | 'card' | 'noble'; from: Box; to: Box; delay: number; gem?: string; count?: number; src?: string; cue?: AudioCue };
const center = (box: Box) => ({ x: box.left + box.width / 2, y: box.top + box.height / 2 });

// A second legal action may arrive before the first flight lands. Keep both
// explanations visible without delaying either authority transition.
export function appendSplendorFlights<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const ids = new Set(current.map(flight => flight.id));
  return [...current, ...incoming.filter(flight => !ids.has(flight.id))].slice(-24);
}

export function splendorReserveGoldFlight(event: Pick<MotionEvent, 'reserveGoldCount' | 'incomingCounts'>) {
  const count = event.reserveGoldCount ?? 0;
  // Positive net gold is already shown by the existing incoming-token layer.
  return Number.isInteger(count) && count > 0 && !(Number(event.incomingCounts?.gold ?? 0) > 0) ? count : 0;
}

export function splendorMotionAllowed(eventVersion: number | undefined, version: number, lastVersion: number, hidden: boolean, reduced: boolean) {
  return eventVersion !== undefined && eventVersion === version && version > lastVersion && !hidden && !reduced;
}

export function SplendorMotion({ scope, version, viewer, event }: { scope: string; version: number; viewer: 'p1' | 'p2'; event: MotionEvent | null }) {
  const marker = useRef<HTMLSpanElement>(null);
  const positions = useRef<{ scope: string; before: Map<string, Box>; current: Map<string, Box> }>({ scope, before: new Map(), current: new Map() });
  const played = useRef({ scope, version, key: '' });
  const soundKeys = useRef(new Set<string>());
  const soundTimers = useRef(new Map<string, number>());
  const flightTimers = useRef(new Map<string, number>());
  const [flights, setFlights] = useState<Flight[]>([]);
  const landingCue = (key: string, cue: AudioCue) => {
    if (soundKeys.current.has(key) || document.hidden) return;
    if (soundKeys.current.size >= 24) soundKeys.current.delete(soundKeys.current.values().next().value!);
    soundKeys.current.add(key);
    const timer = soundTimers.current.get(key);
    if (timer !== undefined) window.clearTimeout(timer);
    soundTimers.current.delete(key);
    playCue('splendor', cue);
  };
  useEffect(() => {
    soundKeys.current.clear();
    const clear = () => {
      soundTimers.current.forEach(timer => window.clearTimeout(timer)); soundTimers.current.clear();
      flightTimers.current.forEach(timer => window.clearTimeout(timer)); flightTimers.current.clear();
      setFlights([]);
    };
    // Fixed viewport coordinates cannot remain correct when the viewport or a
    // scrolling ancestor moves. The real target stays visible as the fallback.
    const moved = () => {
      clear();
      const root = marker.current?.closest('.sp-splendor');
      if (root) positions.current = { scope, before: new Map(), current: readPositions(root) };
    };
    const hidden = () => { if (document.hidden) clear(); else moved(); };
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduce = () => { if (motion.matches) clear(); };
    motion.addEventListener('change', reduce);
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('resize', moved);
    document.addEventListener('scroll', moved, true);
    return () => {
      clear(); motion.removeEventListener('change', reduce); document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('resize', moved); document.removeEventListener('scroll', moved, true);
    };
  }, [scope]);
  useLayoutEffect(() => {
    const root = marker.current?.closest('.sp-splendor');
    if (!root) return;
    const next = readPositions(root);
    const sameScope = positions.current.scope === scope;
    positions.current = { scope, before: sameScope ? positions.current.current : new Map(), current: next };
    if (!sameScope) { played.current = { scope, version, key: '' }; setFlights([]); }
  }, [scope, version]);
  useEffect(() => {
    if (!event || event.key === played.current.key || played.current.scope !== scope) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const accepted = splendorMotionAllowed(event.version, version, played.current.version, document.hidden, false);
    if (event.version === version) played.current = { scope, version, key: event.key };
    if (!accepted) return;
    if (event.result) {
      // A result cue takes precedence even when a prior action is still flying.
      soundTimers.current.forEach(timer => window.clearTimeout(timer)); soundTimers.current.clear();
      setFlights(current => current.map(flight => ({ ...flight, cue: undefined })));
    }
    if (!event.result) {
      const cues: Array<{ key: string; cue: AudioCue; delay: number }> = [];
      if (event.purchasedCard) cues.push({ key: `${event.key}:card`, cue: 'buy', delay: 910 });
      if (event.nobleAwarded) cues.push({ key: `${event.key}:noble`, cue: 'noble', delay: event.purchasedCard ? 1410 : 650 });
      for (const cue of cues) {
        if (reduced) landingCue(cue.key, cue.cue);
        else soundTimers.current.set(cue.key, window.setTimeout(() => landingCue(cue.key, cue.cue), cue.delay + 60));
      }
    }
    if (reduced) { setFlights([]); return; }
    const root = marker.current?.closest('.sp-splendor');
    if (!root) return;
    const box = (selector: string): Box | undefined => {
      const node = root.querySelector(selector); if (!node) return;
      const rect = node.getBoundingClientRect();
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    };
    const batch: Flight[] = [];
    for (const gem of ['white', 'blue', 'green', 'red', 'black', 'gold']) {
      const count = Number(event.incomingCounts?.[gem] ?? 0);
      if (!Number.isInteger(count) || count <= 0) continue;
      const from = box(`.sp-bank .sp-gem-pile.sp-color-${gem}`), to = box(`.sp-treasury-gem .sp-color-${gem}`);
      if (from && to) batch.push({ id: `${event.key}:gain-${gem}`, kind: 'gain', from, to, delay: batch.length * 35, gem, count });
    }
    const reserveGoldCount = splendorReserveGoldFlight(event);
    if (reserveGoldCount) {
      const from = box('.sp-bank .sp-gem-pile.sp-color-gold'), to = box('.sp-treasury-gem .sp-color-gold');
      if (from && to) batch.push({ id: `${event.key}:gold-gain`, kind: 'gain', from, to, delay: 0, gem: 'gold', count: reserveGoldCount });
    }
    for (const gem of ['white', 'blue', 'green', 'red', 'black', 'gold']) {
      const count = event.outgoingCounts?.[gem];
      if (!Number.isInteger(count) || Number(count) <= 0) continue;
      const from = box(`.sp-treasury-gem .sp-color-${gem}`), to = box(`.sp-bank .sp-gem-pile.sp-color-${gem}`);
      if (from && to) batch.push({ id: `${event.key}:${gem}`, kind: 'payment', from, to, delay: reserveGoldCount && gem === 'gold' ? 260 : batch.length * 35, gem, count });
    }
    if (event.purchasedCard) {
      const from = positions.current.before.get(event.purchasedCard.id), to = box(`.sp-bonus.sp-color-${event.purchasedCard.bonus}`);
      const source = art.cards.find(card => card.engineId === event.purchasedCard?.id);
      if (from && to && source) batch.push({ id: `${event.key}:card`, kind: 'card', from, to, delay: 260, src: `/images/splendor/${source.src}`, cue: event.result ? undefined : 'buy' });
    }
    if (event.nobleAwarded && event.nobleId && (event.nobleRecipient === 'you' || event.nobleRecipient === 'rival')) {
      const from = positions.current.before.get(`noble:${event.nobleId}`);
      const seat = event.nobleRecipient === 'you' ? viewer : viewer === 'p1' ? 'p2' : 'p1';
      const to = box(`[data-sp-score-seat="${seat}"] > b`), source = art.nobles.find(noble => noble.engineId === event.nobleId);
      if (from && to && source) batch.push({ id: `${event.key}:noble`, kind: 'noble', from, to, delay: event.purchasedCard ? 760 : 0, src: `/images/splendor/${source.src}`, cue: event.result ? undefined : 'noble' });
    }
    setFlights(current => appendSplendorFlights(current, batch));
    const ids = new Set(batch.map(flight => flight.id));
    flightTimers.current.set(event.key, window.setTimeout(() => {
      setFlights(current => current.filter(flight => !ids.has(flight.id)));
      flightTimers.current.delete(event.key);
    }, 1650));
  }, [event, scope, version, viewer]);
  return <span ref={marker} className="sp-motion-layer" aria-hidden="true">{flights.map(flight => {
    const from = center(flight.from), to = center(flight.to), width = flight.gem ? 22 : Math.min(flight.from.width, 90), height = flight.kind === 'card' ? width * 1.4 : width;
    return <span key={flight.id} className={`sp-confirmed-flight sp-confirmed-${flight.kind}`} data-motion-kind={flight.kind} style={{ left: from.x - width / 2, top: from.y - height / 2, width, height, '--sp-dx': `${to.x - from.x}px`, '--sp-dy': `${to.y - from.y}px`, '--sp-delay': `${flight.delay}ms` } as CSSProperties} onAnimationEnd={() => { if (flight.cue) landingCue(flight.id, flight.cue); setFlights(current => current.filter(item => item.id !== flight.id)); }}>{flight.gem ? <><SplendorGem gem={flight.gem}/><b className="sp-flight-count">×{flight.count}</b></> : <img src={flight.src} alt=""/>}</span>;
  })}</span>;
}

function readPositions(root: Element) {
  const next = new Map<string, Box>();
  root.querySelectorAll('[data-card-id], [data-sp-noble-id]').forEach(node => {
    const id = node.getAttribute('data-card-id') ?? `noble:${node.getAttribute('data-sp-noble-id')}`;
    const face = node.querySelector('.sp-card-face,.sp-reserved-art img,.sp-noble-art img') ?? node;
    const rect = face.getBoundingClientRect();
    next.set(id, { left: rect.left, top: rect.top, width: rect.width, height: rect.height });
  });
  return next;
}

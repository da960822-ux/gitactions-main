import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Language, PlayerId } from '../core/types';
import type { HwatuEvent } from './hwatu-motion';
import type { MinhwatuCard } from '../games/minhwatu';
import { claimInitialHwatuDeal, HWATU_EVENT_INTERVAL, hwatuDestination, hwatuEventWindow, hwatuSequence } from './hwatu-motion';
import '../styles/hwatu-motion.css';

function latestEvent(events: readonly HwatuEvent[]) {
  return events.slice().sort((a, b) => hwatuSequence(a) - hwatuSequence(b)).at(-1) ?? null;
}

function safeFace(id: string) {
  const match = /^(1[0-2]|[1-9])-([1-4])$/.exec(id);
  return match ? `/images/hwatu/${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}.svg` : null;
}

function zone(root: HTMLElement, name: string) {
  return [...root.querySelectorAll<HTMLElement>('[data-hwatu-zone]')].find(element => element.dataset.hwatuZone === name) ?? null;
}

function cardInZone(root: HTMLElement, id: string, area: HTMLElement | null) {
  return area ? [...area.querySelectorAll<HTMLElement>('[data-hwatu-card-id]')].find(element => element.dataset.hwatuCardId === id) ?? null : null;
}

function point(element: Element | null, fallback: DOMRect | null = null): DOMRect | null {
  return element?.getBoundingClientRect() ?? fallback;
}

function fly(root: HTMLElement, card: MinhwatuCard, fromName: string, toName: string, index: number, flip = false, previous: Map<string, DOMRect> | null = null) {
  const sourceZone = zone(root, fromName);
  const sourceCard = cardInZone(root, card.id, sourceZone);
  const src = previous?.get(`${fromName}:${card.id}`) ?? previous?.get(`${fromName}:@zone`) ?? point(sourceCard, point(sourceZone));
  const destZone = zone(root, toName);
  const dest = point(cardInZone(root, card.id, destZone), point(destZone, previous?.get(`${toName}:@zone`) ?? null));
  const face = safeFace(card.id);
  if (!src || !dest || !face) return;
  const width = Math.max(36, Math.min(74, src.width || 54));
  const height = Math.max(58, Math.min(116, src.height || width * 1.62));
  const element = document.createElement('div');
  element.className = `hwatu-flight${flip ? ' is-flip' : ''}`;
  element.setAttribute('aria-hidden', 'true');
  element.style.left = `${src.left + (src.width - width) / 2}px`;
  element.style.top = `${src.top + (src.height - height) / 2}px`;
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
  const inner = document.createElement('span');
  inner.className = 'hwatu-flight-inner';
  if (flip) {
    const back = document.createElement('i');
    back.className = 'hwatu-flight-back';
    back.setAttribute('aria-hidden', 'true');
    inner.append(back);
  }
  const image = document.createElement('img');
  image.src = face;
  image.alt = '';
  image.draggable = false;
  inner.append(image);
  element.append(inner);
  document.body.append(element);
  const targetLeft = dest.left + (dest.width - width) / 2 + (toName.startsWith('captures-') ? (index % 4) * 8 : 0);
  const targetTop = dest.top + (dest.height - height) / 2 - (toName.startsWith('captures-') ? (index % 3) * 5 : 0);
  const dx = targetLeft - (src.left + (src.width - width) / 2);
  const dy = targetTop - (src.top + (src.height - height) / 2);
  const travel = element.animate([
    { transform: 'translate3d(0,0,0) rotate(-3deg) scale(.94)', opacity: 0.9 },
    { transform: `translate3d(${dx * .62}px,${dy * .62 - 20}px,0) rotate(4deg) scale(1.05)`, opacity: 1, offset: 0.68 },
    { transform: `translate3d(${dx}px,${dy}px,0) rotate(0deg) scale(1)`, opacity: 1 },
  ], { duration: 255, delay: Math.min(index, 4) * 45, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' });
  if (flip) inner.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(180deg)' }], { duration: 220, delay: Math.min(index, 4) * 45, easing: 'ease-out', fill: 'both' });
  void travel.finished.then(() => element.remove()).catch(() => element.remove());
}

function playMotion(root: HTMLElement, event: HwatuEvent, previous: Map<string, DOMRect> | null, playerId: PlayerId) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const board = root.closest<HTMLElement>('.minhwatu-table') ?? root.parentElement;
  if (!board) return;
  if (event.type === 'deal') event.cards?.forEach((card, index) => fly(board, card, 'deck', 'table', index, false, previous));
  if (event.type === 'play' && event.cards?.[0]) fly(board, event.cards[0], event.actor && event.actor !== playerId ? 'opponent-hand' : 'hand', 'table', 0, false, previous);
  if (event.type === 'draw' && event.cards?.[0]) fly(board, event.cards[0], 'deck', 'draw', 0, true, previous);
  if (event.type === 'capture' && event.actor) event.cards?.forEach((card, index) => fly(board, card, event.origins?.[card.id] ?? 'table', hwatuDestination(card, event.actor!), index, false, previous));
}

export function HwatuMotion({ events, language, playerId }: { events: readonly HwatuEvent[]; language: Language; playerId: PlayerId }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sequence = useRef<number | null>(null);
  const owner = useRef(playerId);
  const timer = useRef<number | null>(null);
  const latestSequence = useRef<number | null>(null);
  const liveRects = useRef(new Map<string, DOMRect>());
  const departureRects = useRef(new Map<number, Map<string, DOMRect>>());
  const [queue, setQueue] = useState<HwatuEvent[]>([]);
  const activeEvent = queue[0] ?? null;
  const [presented, setPresented] = useState<HwatuEvent | null>(() => latestEvent(events));
  const [reduced, setReduced] = useState(false);

  useLayoutEffect(() => {
    const board = rootRef.current?.closest<HTMLElement>('.minhwatu-table');
    if (!board) return;
    const latest = events.reduce((max, event) => Math.max(max, hwatuSequence(event)), 0);
    if (latestSequence.current !== null && latest !== latestSequence.current) {
      const reset = latest < latestSequence.current;
      if (reset) departureRects.current.clear();
      events.filter(event => hwatuSequence(event) > 0 && (reset || hwatuSequence(event) > latestSequence.current!))
        .forEach(event => departureRects.current.set(hwatuSequence(event), liveRects.current));
    }
    latestSequence.current = latest;
    const positions = new Map<string, DOMRect>();
    [...board.querySelectorAll<HTMLElement>('[data-hwatu-zone]')].forEach(area => {
      const name = area.dataset.hwatuZone;
      if (!name) return;
      positions.set(`${name}:@zone`, area.getBoundingClientRect());
      [...area.querySelectorAll<HTMLElement>('[data-hwatu-card-id]')].forEach(card => {
        const id = card.dataset.hwatuCardId;
        if (id) positions.set(`${name}:${id}`, card.getBoundingClientRect());
      });
    });
    liveRects.current = positions;
  });

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (reduced) document.querySelectorAll('.hwatu-flight').forEach(element => {
      element.getAnimations().forEach(animation => animation.cancel());
      element.remove();
    });
  }, [reduced]);

  useEffect(() => {
    const ordered = events.filter(event => hwatuSequence(event) > 0).slice().sort((a, b) => hwatuSequence(a) - hwatuSequence(b));
    const latest = ordered.at(-1) ?? null;
    if (owner.current !== playerId) {
      owner.current = playerId;
      sequence.current = latest ? hwatuSequence(latest) : 0;
      latestSequence.current = sequence.current;
      departureRects.current.clear();
      setQueue([]);
      setPresented(latest);
      return;
    }
    if (sequence.current === null) {
      sequence.current = latest ? hwatuSequence(latest) : 0;
      setPresented(latest);
      if (ordered.length === 1 && latest?.type === 'deal' && claimInitialHwatuDeal(latest, 'motion')) {
        if (reduced) return;
        setQueue([latest]);
      }
      return;
    }
    const windowed = hwatuEventWindow(ordered, sequence.current);
    if (windowed.reset) {
      sequence.current = windowed.latestSequence;
      setQueue([]);
      setPresented(latest);
      if (ordered.length === 1 && latest?.type === 'deal' && claimInitialHwatuDeal(latest, 'motion') && !reduced) {
        setQueue([latest]);
      }
      return;
    }
    if (!windowed.fresh.length) return;
    sequence.current = windowed.latestSequence;
    if (reduced) {
      departureRects.current.clear();
      setPresented(windowed.fresh.at(-1) ?? latest);
      setQueue([]);
    } else setQueue(current => [...current, ...windowed.fresh]);
  }, [events, playerId, reduced]);

  useEffect(() => {
    if (reduced || !activeEvent) {
      if (!activeEvent) departureRects.current.clear();
      return;
    }
    const event = activeEvent;
    setPresented(event);
    const previous = departureRects.current.get(hwatuSequence(event)) ?? null;
    departureRects.current.delete(hwatuSequence(event));
    if (rootRef.current) playMotion(rootRef.current, event, previous, playerId);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setQueue(current => current.slice(1));
    }, HWATU_EVENT_INTERVAL);
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = null;
    };
  }, [activeEvent, reduced]);

  useEffect(() => {
    if (reduced && queue.length) {
      setPresented(queue.at(-1) ?? null);
      setQueue([]);
    }
  }, [reduced, queue]);

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    document.querySelectorAll('.hwatu-flight').forEach(element => element.remove());
  }, []);

  if (!presented) return <div ref={rootRef} className="hwatu-motion-stage" data-hwatu-motion aria-hidden="true"/>;
  const title = presented.title?.[language] ?? '';
  const detail = presented.type === 'special' && presented.yaku?.bonus
    ? presented.yaku.label?.[language]
    : '';
  return <div ref={rootRef} className={`hwatu-motion-stage${queue.length && !reduced ? ' is-animating' : ''}`} data-hwatu-motion aria-hidden="true">
    <div className={`hwatu-motion-note hwatu-motion-note--${presented.type}${presented.type === 'win' ? ' is-win' : ''}${queue.length && !reduced ? ' is-fresh' : ''}`} data-hwatu-event-sequence={hwatuSequence(presented)} key={`${playerId}:${hwatuSequence(presented)}`}>
      <svg viewBox="0 0 28 28" aria-hidden="true"><path d="M4 20c5-1 6-11 10-11s5 10 10 11M6 22h16M11 16l3-3 3 3"/></svg>
      <span><b>{title}</b>{detail && <small>{detail}</small>}</span>
      {presented.type === 'special' && <i aria-hidden="true"/>}
      {presented.type === 'win' && <span className="hwatu-win-burst" aria-hidden="true"><svg viewBox="0 0 44 24"><path d="M7 12c3-6 7-6 10 0-3 6-7 6-10 0Zm10 0c3-6 7-6 10 0-3 6-7 6-10 0Zm10 0c3-6 7-6 10 0-3 6-7 6-10 0Z"/><path d="M3 3v4m0-2h4m30 12v4m0-2h4"/></svg></span>}
    </div>
  </div>;
}

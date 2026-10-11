import { useEffect, useLayoutEffect, useRef } from 'react';
import type { Language, PlayerId } from '../core/types';
import type { HwatuEvent } from './hwatu-motion';
import { minhwatuYakuProgress, type MinhwatuCard } from '../games/minhwatu';
import { hwatuDestination, hwatuSequence } from './hwatu-motion';
import '../styles/hwatu-motion.css';
import type { MinhwatuPresentationStep } from './useMinhwatuPresentation';

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

function cardInZone(id: string, area: HTMLElement | null) {
  return area ? [...area.querySelectorAll<HTMLElement>('[data-hwatu-card-id]')].find(element => element.dataset.hwatuCardId === id) ?? null : null;
}

function point(element: Element | null, fallback: DOMRect | null = null): DOMRect | null {
  return element?.getBoundingClientRect() ?? fallback;
}

function clearHwatuEffects() {
  document.querySelectorAll('.hwatu-flight,.hwatu-score-flight').forEach(element => {
    element.getAnimations().forEach(animation => animation.cancel());
    element.remove();
  });
}

function fly(root: HTMLElement, card: MinhwatuCard, fromName: string, toName: string, flip = false, previous: Map<string, DOMRect> | null = null, target?: DOMRect, duration = 220, delay = 0, retain = false) {
  const sourceZone = zone(root, fromName);
  const sourceCard = cardInZone(card.id, sourceZone);
  const src = previous?.get(`${fromName}:${card.id}`) ?? previous?.get(`${fromName}:@zone`) ?? point(sourceCard, point(sourceZone));
  const destZone = zone(root, toName);
  const reservation = destZone ? [...destZone.querySelectorAll<HTMLElement>('[data-hwatu-landing-card-id]')].find(slot => slot.dataset.hwatuLandingCardId === card.id) ?? null : null;
  const destinationCard = cardInZone(card.id, destZone);
  const anchor = destZone?.querySelector<HTMLElement>('[data-hwatu-landing-anchor]');
  const dest = target ?? point(reservation, point(destinationCard, point(anchor ?? null, point(destZone, previous?.get(`${toName}:@zone`) ?? null))));
  const face = safeFace(card.id);
  if (!src || !dest || !face) return;
  const width = Math.max(36, Math.min(74, src.width || 54));
  const height = Math.max(58, Math.min(116, src.height || width * 1.62));
  const element = document.createElement('div');
  element.className = `hwatu-flight${flip ? ' is-flip' : ''}`;
  element.setAttribute('aria-hidden', 'true');
  element.dataset.hwatuFlightCard = card.id;
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
  const targetScale = reservation || destinationCard || anchor || target ? Math.min(dest.width / width, dest.height / height) : 1;
  const targetLeft = dest.left + (dest.width - width) / 2;
  const targetTop = dest.top + (dest.height - height) / 2;
  const dx = targetLeft - (src.left + (src.width - width) / 2);
  const dy = targetTop - (src.top + (src.height - height) / 2);
  const travel = element.animate([
    { transform: 'translate3d(0,0,0) rotate(-3deg) scale(.94)', opacity: 0.9 },
    { transform: `translate3d(${dx * .62}px,${dy * .62 - 20}px,0) rotate(4deg) scale(1.05)`, opacity: 1, offset: 0.68 },
    { transform: `translate3d(${dx}px,${dy}px,0) rotate(0deg) scale(${targetScale})`, opacity: 1 },
  ], { duration, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' });
  if (flip) inner.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(180deg)' }], { duration: Math.min(duration, 200), delay, easing: 'ease-out', fill: 'both' });
  void travel.finished.then(() => { if (!retain) element.remove(); }).catch(() => element.remove());
  return dest;
}

export function HwatuMotion({ events, language, playerId, step }: { events: readonly HwatuEvent[]; language: Language; playerId: PlayerId; step?: MinhwatuPresentationStep | null }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const rects = useRef(new Map<string, DOMRect>());
  const landings = useRef(new Map<string, DOMRect>());
  const last = useRef<MinhwatuPresentationStep | null>(null);
  useLayoutEffect(() => {
    const board = rootRef.current?.closest<HTMLElement>('.minhwatu-table');
    if (!board) return;
    if (step && step !== last.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const event = step.events[0], previous = new Map([...rects.current, ...landings.current]);
      if (event.type === 'play' || event.type === 'draw') {
        const card = event.cards?.[0];
        if (card) {
          const from = step.transfer ? 'draw' : event.type === 'draw' ? 'deck' : event.actor === playerId ? 'hand' : 'opponent-hand';
          const to = event.type === 'draw' && !step.transfer ? 'draw' : 'table';
          const target = step.targetId && (event.type === 'play' || step.transfer) ? previous.get(`table:${step.targetId}`) : undefined;
          const dest = fly(board, card, from, to, event.type === 'draw' && !step.transfer, previous, target, step.impactOffsets[0], 0, Boolean(target));
          if (dest) { landings.current.set(`${to}:${card.id}`, dest); if (step.transfer) landings.current.set(`draw:${card.id}`, dest); }
        }
      }
      if (event.type === 'capture') document.querySelectorAll<HTMLElement>('.hwatu-flight').forEach(flight => { if (event.cards?.some(card => card.id === flight.dataset.hwatuFlightCard)) { flight.getAnimations().forEach(animation => animation.cancel()); flight.remove(); } });
      if (event.type === 'capture' && event.actor) event.cards?.forEach((card, index) => fly(board, card, event.origins?.[card.id] ?? 'table', hwatuDestination(card, event.actor!), false, previous, undefined, 200, 60 + index * 25));
    }
    last.current = step ?? null;
    const positions = new Map<string, DOMRect>();
    board.querySelectorAll<HTMLElement>('[data-hwatu-zone]').forEach(area => {
      const name = area.dataset.hwatuZone!; positions.set(`${name}:@zone`, area.getBoundingClientRect());
      area.querySelectorAll<HTMLElement>('[data-hwatu-card-id]').forEach(card => positions.set(`${name}:${card.dataset.hwatuCardId}`, card.getBoundingClientRect()));
    });
    rects.current = positions;
    if (!step) landings.current.clear();
  });
  useEffect(() => {
    const cancel = () => { clearHwatuEffects(); landings.current.clear(); };
    window.addEventListener('minhwatu-presentation-cancel', cancel);
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    query.addEventListener?.('change', cancel);
    return () => { cancel(); window.removeEventListener('minhwatu-presentation-cancel', cancel); query.removeEventListener?.('change', cancel); };
  }, [playerId]);
  useEffect(() => {
    const event = step?.events[0];
    if (!event || event.type !== 'capture' || !step) return;
    const timer = window.setTimeout(() => {
      const board = rootRef.current?.closest<HTMLElement>('.minhwatu-table');
      if (!board || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      for (const seat of ['p1', 'p2'] as PlayerId[]) {
        const delta = event.scoreChanges?.[seat] ?? 0, rect = point(zone(board, `score-${seat}`));
        if (!delta || !rect) continue;
        const popup = document.createElement('span'); popup.className = `hwatu-score-flight${delta < 0 ? ' is-negative' : ''}`;
        popup.dataset.hwatuScoreSequence = String(event.sequence); popup.setAttribute('aria-hidden', 'true');
        popup.textContent = `${delta > 0 ? '+' : '−'}${Math.abs(delta)}`; popup.style.left = `${rect.right - 42}px`; popup.style.top = `${rect.bottom}px`;
        document.body.append(popup);
        const animation = popup.animate([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-24px)' }], { duration: 560, easing: 'ease-out' });
        void animation.finished.then(() => popup.remove()).catch(() => popup.remove());
      }
    }, step.impactOffsets.at(-1) ?? 0);
    return () => window.clearTimeout(timer);
  }, [step]);
  const presented = step?.events[0] ?? latestEvent(events);
  const strongest = step?.events.filter(event => event.type === 'special' && Number(event.yaku?.bonus) > 0).sort((a, b) => Number(b.yaku?.bonus) - Number(a.yaku?.bonus))[0];
  const faces = strongest ? minhwatuYakuProgress([]).find(yaku => yaku.id === strongest.yaku?.id)?.cardIds.slice(0, 4) ?? [] : [];
  return <div ref={rootRef} className={`hwatu-motion-stage${step ? ' is-animating' : ''}`} data-hwatu-motion aria-hidden="true">
    {presented && <div className={`hwatu-motion-note hwatu-motion-note--${presented.type}${step ? ' is-fresh' : ''}`} data-hwatu-event-sequence={presented.sequence}>
      <img className="hwatu-event-icon" src="/images/hwatu-support/capture.svg" alt=""/>
      {faces.length > 0 && <span className="hwatu-earned-faces" data-hwatu-celebration={strongest?.yaku?.id}>{faces.map(id => <img key={id} src={safeFace(id)!} alt="" data-hwatu-earned-card={id}/>)}</span>}
      <span><b>{step?.events.map(event => event.title[language]).join(' · ') ?? presented.title[language]}</b>
        {step?.events[0].type === 'special' && <small>{step.events.map(event => `${event.yaku?.label[language]} +${event.yaku?.bonus}`).join(' · ')}</small>}
      </span>
    </div>}
  </div>;
}

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Language, PlayerId } from '../core/types';
import type { JaipurGood } from '../games/jaipur';
import { playCue } from '../audio/audio';
import { JAIPUR_FLIGHT_MS, jaipurEventWindow, jaipurFlights, jaipurLandingFeedback, jaipurSequence, type JaipurEvent, type JaipurFlight } from './jaipur-motion';
import { JaipurBonusArt, JaipurCoin, JaipurGoodArt, jaipurCardVariant } from './JaipurArt';
import '../styles/jaipur-motion.css';

type Position = { left: number; top: number; width: number; height: number };
type FlightView = JaipurFlight & Position & { dx: number; dy: number };

function latestEvent(events: readonly (JaipurEvent | null | undefined)[]) {
  return events.filter((event): event is JaipurEvent => event != null && jaipurSequence(event) > 0).slice().sort((a, b) => jaipurSequence(a) - jaipurSequence(b)).at(-1) ?? null;
}

function latestNotice(events: readonly (JaipurEvent | null | undefined)[]) {
  return events.filter((event): event is JaipurEvent => event != null && ['round-end', 'win', 'bonus'].includes(event.type)).slice().sort((a, b) => jaipurSequence(a) - jaipurSequence(b)).at(-1) ?? null;
}

const goodNames = {
  ko: { diamond: '다이아몬드', gold: '금', silver: '은', cloth: '옷감', spice: '향신료', leather: '가죽', camel: '낙타' },
  es: { diamond: 'Diamantes', gold: 'Oro', silver: 'Plata', cloth: 'Tela', spice: 'Especias', leather: 'Cuero', camel: 'Camello' },
} as const;

function localRect(element: Element, root: DOMRect): Position {
  const rect = element.getBoundingClientRect();
  return { left: rect.left - root.left, top: rect.top - root.top, width: rect.width, height: rect.height };
}

function formatSummary(event: JaipurEvent, language: Language, playerId: PlayerId) {
  const summary = event.summary;
  if (!summary) return '';
  const seats = ['p1', 'p2'] as const;
  return seats.map(seat => {
    const row = summary.breakdown[seat];
    const name = seat === playerId ? (language === 'ko' ? '나' : 'Tú') : (language === 'ko' ? '상대' : 'Tu pareja');
    const score = row.detailed && row.goods !== null && row.bonus !== null
      ? `${language === 'ko' ? '상품' : 'Mercancías'} ${row.goods} + ${language === 'ko' ? '보너스' : 'bono'} ${row.bonus} + ${language === 'ko' ? '낙타' : 'camellos'} ${row.camel}`
      : `${language === 'ko' ? '판매 점수' : 'Ventas'} ${row.sale} + ${language === 'ko' ? '낙타' : 'camellos'} ${row.camel}`;
    return `${name}: ${score} = ${row.total} ${language === 'ko' ? '점' : 'pts'}`;
  }).join(' · ');
}

export function JaipurMotion({ events, language, playerId }: { events: readonly (JaipurEvent | null | undefined)[]; language: Language; playerId: PlayerId }) {
  const sequence = useRef<number | null>(null);
  const player = useRef(playerId);
  const positions = useRef(new Map<string, Position>());
  const timer = useRef<number | null>(null);
  const noticeTimer = useRef<number | null>(null);
  const arrivalTimers = useRef<number[]>([]);
  const [queue, setQueue] = useState<JaipurEvent[]>([]);
  const [flights, setFlights] = useState<FlightView[]>([]);
  const [presented, setPresented] = useState<JaipurEvent | null>(() => latestEvent(events));
  const [notice, setNotice] = useState<JaipurEvent | null>(() => latestNotice(events));
  const [noticeMotionSequence, setNoticeMotionSequence] = useState<number | null>(null);
  const [reduced, setReduced] = useState(false);
  const currentRound = latestEvent(events)?.round ?? 1;

  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>('.jaipur-board');
    if (!root) return;
    const bounds = root.getBoundingClientRect();
    root.querySelectorAll<HTMLElement>('[data-jaipur-zone]').forEach(element => {
      const zone = element.dataset.jaipurZone;
      if (zone) positions.current.set(zone, localRect(element, bounds));
      const cards = element.matches('[data-jaipur-card-id]') ? [element] : [...element.querySelectorAll<HTMLElement>('[data-jaipur-card-id]')];
      cards.forEach((card, index) => {
        const owner = card.closest<HTMLElement>('[data-jaipur-zone]')?.dataset.jaipurZone;
        const id = card.dataset.jaipurCardId;
        if (owner && id) positions.current.set(`${owner}:${id}`, localRect(card, bounds));
        if (owner) positions.current.set(`${owner}:slot-${index}`, localRect(card, bounds));
      });
    });
    if (positions.current.size > 240) positions.current = new Map([...positions.current].slice(-180));
  });

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    const clear = () => { setQueue([]); setFlights([]); setNoticeMotionSequence(null); };
    const onVisibility = () => { if (document.hidden) clear(); };
    window.addEventListener('resize', clear);
    document.addEventListener('visibilitychange', onVisibility);
    return () => { window.removeEventListener('resize', clear); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);

  useEffect(() => {
    const ordered = events.filter((event): event is JaipurEvent => Boolean(event) && jaipurSequence(event) > 0).slice().sort((a, b) => jaipurSequence(a) - jaipurSequence(b));
    if (player.current !== playerId) {
      player.current = playerId;
      sequence.current = ordered.reduce((max, event) => Math.max(max, jaipurSequence(event)), 0);
      setQueue([]); setFlights([]); setPresented(ordered.at(-1) ?? null); setNotice(latestNotice(ordered)); setNoticeMotionSequence(null);
      return;
    }
    if (sequence.current === null) {
      sequence.current = ordered.reduce((max, event) => Math.max(max, jaipurSequence(event)), 0);
      return;
    }
    const update = jaipurEventWindow(ordered, sequence.current);
    if (update.reset) {
      sequence.current = update.latestSequence;
      setQueue([]); setFlights([]);
    }
    if (!update.fresh.length) {
      if (update.reset && !ordered.length) { setPresented(null); setNotice(null); setNoticeMotionSequence(null); }
      return;
    }
    sequence.current = update.latestSequence;
    if (update.fresh.at(-1)?.type === 'round-start') {
      setNotice([...update.fresh].reverse().find(event => event.type === 'round-end') ?? null);
      setNoticeMotionSequence(null);
    }
    if (reduced || document.hidden) {
      const last = update.fresh.at(-1) ?? null;
      setPresented(last); setNotice([...update.fresh].reverse().find(event => ['round-end', 'win', 'bonus'].includes(event.type)) ?? null); setNoticeMotionSequence(null); setQueue([]); setFlights([]);
      if (!document.hidden) update.fresh.forEach(event => {
        const landing = jaipurLandingFeedback(event, jaipurFlights(event, playerId));
        if (landing) playCue('jaipur', landing.cue);
      });
    } else setQueue(current => [...current, ...update.fresh]);
  }, [events, playerId, reduced]);

  useEffect(() => {
    if (reduced && queue.length) {
      setPresented(queue.at(-1) ?? null);
      setNotice(latestNotice(queue) ?? notice);
      setQueue([]); setFlights([]);
      return;
    }
    if (!queue.length) return;
    const event = queue[0];
    setPresented(event);
    if (['round-end', 'win', 'bonus'].includes(event.type)) {
      setNotice(event);
      setNoticeMotionSequence(jaipurSequence(event));
      if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
      noticeTimer.current = window.setTimeout(() => { noticeTimer.current = null; setNotice(null); }, event.type === 'round-end' || event.type === 'win' ? 4500 : 2600);
    }
    const root = document.querySelector<HTMLElement>('.jaipur-board');
    if (!root) { setFlights([]); return; }
    const rootRect = root.getBoundingClientRect();
    const getPosition = (key: string) => {
      const current = positions.current.get(key);
      if (current) return current;
      const split = key.indexOf(':');
      const zone = split < 0 ? key : key.slice(0, split);
      const id = split < 0 ? '' : key.slice(split + 1);
      if (zone === 'settlement') {
        const summary = root.querySelector('[data-jaipur-zone="settlement"]');
        if (summary) return localRect(summary, rootRect);
      }
      const card = id && !id.startsWith('slot-') ? [...root.querySelectorAll<HTMLElement>('[data-jaipur-card-id]')].find(item => item.dataset.jaipurCardId === id) : undefined;
      return card ? localRect(card, rootRect) : positions.current.get(zone);
    };
    const placed = jaipurFlights(event, playerId).flatMap(original => {
      const flight = event.round < currentRound && original.kind !== 'card' ? { ...original, to: 'settlement' } : original;
      const from = getPosition(flight.from), to = getPosition(flight.to);
      if (!from || !to || !from.width || !from.height || !to.width || !to.height) return [];
      const size = flight.kind === 'bonus' ? { width: 56, height: 74 } : flight.kind === 'token' ? { width: 38, height: 38 } : {
        width: Math.min(92, Math.max(58, Math.min(from.width, from.height))),
        height: Math.min(116, Math.max(74, Math.min(from.height, from.width * 1.28))),
      };
      const startX = from.left + from.width / 2, startY = from.top + from.height / 2;
      return [{ ...flight, ...size, left: startX - size.width / 2, top: startY - size.height / 2,
        dx: to.left + to.width / 2 - startX, dy: to.top + to.height / 2 - startY }];
    });
    setFlights(placed);
    const landing = jaipurLandingFeedback(event, placed);
    if (landing) arrivalTimers.current.push(window.setTimeout(() => playCue('jaipur', landing.cue), landing.delay));
    const duration = Math.max(260, ...placed.map(flight => flight.delay + JAIPUR_FLIGHT_MS));
    timer.current = window.setTimeout(() => {
      timer.current = null; setFlights([]); setQueue(current => current.slice(1));
    }, duration);
    return () => { if (timer.current !== null) window.clearTimeout(timer.current); timer.current = null; arrivalTimers.current.forEach(window.clearTimeout); arrivalTimers.current = []; };
  }, [queue[0], reduced, playerId]);

  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current); }, []);

  const detail = presented?.text?.[language] ?? '';
  return <div className="jaipur-motion-layer" aria-live="polite" aria-atomic="true">
    {flights.map(flight => <span key={flight.id} data-jaipur-flight-from={flight.from} data-jaipur-flight-to={flight.to} className={`jaipur-flight jaipur-flight--${flight.kind}${presented?.type === 'sale' && ['diamond', 'gold', 'silver'].includes(flight.good) ? ' is-luxury' : ''}`} style={{ left: flight.left, top: flight.top, width: flight.width, height: flight.height, '--flight-x': `${flight.dx}px`, '--flight-y': `${flight.dy}px`, '--flight-delay': `${flight.delay}ms` } as React.CSSProperties} aria-hidden="true">
      {flight.kind === 'card' ? <div className="jaipur-flight-card"><JaipurGoodArt className="jaipur-flight-good" good={flight.good as JaipurGood} variant={jaipurCardVariant(flight.cardId ?? flight.id)} decorative/><small>{goodNames[language][flight.good as JaipurGood]}</small></div>
        : flight.kind === 'bonus' ? <><i className="jaipur-bonus-back"><JaipurBonusArt/></i><b className="jaipur-bonus-face"><JaipurBonusArt revealed value={Number(flight.good)}/></b></>
          : <JaipurCoin value={Number(flight.good)} good={flight.mark as JaipurGood | undefined} language={language}/>}
    </span>)}
    {notice?.round === currentRound && notice.title?.[language] && <div className={`jaipur-event-note${notice.type === 'win' ? ' is-win' : notice.type === 'bonus' ? ' is-bonus' : ''}${noticeMotionSequence === jaipurSequence(notice) ? ' is-fresh' : ''}`} key={`${jaipurSequence(notice)}:${notice.type}`}>
      <strong>{notice.title[language]}</strong>{notice === presented && detail && <span>{detail}</span>}{notice.type === 'round-end' && formatSummary(notice, language, playerId) && <b>{formatSummary(notice, language, playerId)}</b>}
      {notice.type === 'win' && noticeMotionSequence === jaipurSequence(notice) && <svg className="jaipur-win-confetti" viewBox="0 0 100 52" aria-hidden="true"><circle cx="13" cy="32" r="3"/><circle cx="31" cy="10" r="2.5"/><circle cx="68" cy="12" r="3"/><circle cx="88" cy="34" r="2.5"/><path d="M49 4c6 5 7 12 1 17-6-5-7-12-1-17Zm-28 26c6 0 11 4 11 10-6 1-11-3-11-10Zm48-6c6-2 12 1 14 7-6 3-12 0-14-7Z"/></svg>}
    </div>}
  </div>;
}

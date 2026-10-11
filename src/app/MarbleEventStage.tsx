import { useEffect, useRef, useState } from 'react';
import type { Language, PlayerId } from '../core/types';
import { marbleEventSequence, marbleEventType, marbleEventWindow, marbleMoneyDelta, type MarbleActionEvent } from './marble-motion';
import '../styles/marble-events.css';

const labels: Record<string, Record<Language, string>> = {
  roll: { ko: '주사위', es: 'Dados' }, move: { ko: '이동', es: 'Movimiento' }, pawn: { ko: '이동', es: 'Movimiento' },
  arrival: { ko: '도착', es: 'Llegada' }, 'event-card': { ko: '이벤트 카드', es: 'Carta de evento' }, buy: { ko: '구매', es: 'Compra' },
  build: { ko: '건설', es: 'Construcción' }, rent: { ko: '임대료', es: 'Alquiler' }, tax: { ko: '세금', es: 'Impuesto' },
  bonus: { ko: '보너스', es: 'Bono' }, loan: { ko: '대출', es: 'Préstamo' }, repay: { ko: '상환', es: 'Pago' }, crisis: { ko: '위기', es: 'Dificultad' },
  bankruptcy: { ko: '파산', es: 'Bancarrota' }, 'monopoly-warning': { ko: '독점 경고', es: 'Aviso de monopolio' }, island: { ko: '무인도', es: 'Isla' },
  escape: { ko: '탈출', es: 'Salida' }, train: { ko: '열차', es: 'Tren' }, rest: { ko: '휴식', es: 'Descanso' }, turn: { ko: '차례', es: 'Turno' }, win: { ko: '승리', es: 'Victoria' },
};

function actorLabel(event: MarbleActionEvent, playerId: PlayerId, language: Language) {
  const actor = event.actor ?? event.playerId;
  if (!actor) return '';
  if (actor === playerId) return language === 'ko' ? '나' : 'Tú';
  return language === 'ko' ? '상대' : 'Tu pareja';
}

function playerLabel(id: unknown, playerId: PlayerId, language: Language) {
  if (id === 'p1' || id === 'p2') return id === playerId ? (language === 'ko' ? '나' : 'Tú') : (language === 'ko' ? '상대' : 'Tu pareja');
  return '';
}

function latestEvent(events: readonly (MarbleActionEvent | null | undefined)[]) {
  return events.filter((event): event is MarbleActionEvent => Boolean(event) && marbleEventSequence(event) > 0).slice().sort((a, b) => marbleEventSequence(a) - marbleEventSequence(b)).at(-1) ?? null;
}

function EventMark({ type }: { type: string }) {
  if (type === 'event-card' || type === 'arrival' || type === 'monopoly-warning') return <svg className="marble-event-symbol marble-event-card-symbol" viewBox="0 0 32 32" aria-hidden="true"><g className="marble-event-card-face"><rect x="5" y="4" width="22" height="24" rx="3"/><path d="M10 10h12M10 15h9M10 21l4-3 4 3 4-3"/></g>{type === 'monopoly-warning' && <path className="marble-event-alert" d="M25 4v8m0 4v.1"/>}</svg>;
  if (type === 'buy') return <svg className="marble-event-symbol" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="8"/><path d="M16 11v10m3-8c-1-2-6-2-6 1s6 1 6 4-5 3-7 1M16 3v3M16 26v3M3 16h3m20 0h3"/></svg>;
  if (type === 'build') return <svg className="marble-event-symbol marble-event-build-symbol" viewBox="0 0 32 32" aria-hidden="true"><path d="M5 27h22"/><rect x="7" y="18" width="6" height="9" rx="1"/><rect x="14" y="12" width="6" height="15" rx="1"/><rect x="21" y="6" width="5" height="21" rx="1"/><path d="M16 8V4m0 0-2 2m2-2 2 2"/></svg>;
  if (type === 'rent' || type === 'tax' || type === 'bonus') return <svg className="marble-event-symbol" viewBox="0 0 32 32" aria-hidden="true"><circle cx="10" cy="16" r="6"/><circle cx="23" cy="16" r="6"/><path d="M12 16h9m-3-3 3 3-3 3M8 14h4m-4 4h4m9-4h4m-4 4h4"/></svg>;
  if (type === 'loan' || type === 'repay') return <svg className="marble-event-symbol marble-event-contract-symbol" viewBox="0 0 32 32" aria-hidden="true"><path d="M8 4h12l5 5v19H8zM20 4v6h5M12 15h9m-9 4h9m-9 4h5"/><path className="marble-contract-stamp" d="m20 22 2 2 4-5"/></svg>;
  if (type === 'crisis' || type === 'bankruptcy') return <svg className="marble-event-symbol" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4 29 27H3z"/><path d="M16 12v7m0 4v.1"/></svg>;
  if (type === 'island' || type === 'escape') return <svg className="marble-event-symbol marble-event-island-symbol" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12"/><path d="M5 18c6-4 16-4 22 0M10 23h12M13 16l3-6 3 6"/></svg>;
  if (type === 'train' || type === 'move' || type === 'pawn') return <svg className="marble-event-symbol marble-event-route-symbol" viewBox="0 0 32 32" aria-hidden="true"><path d="M5 24c7 0 5-15 12-15s4 15 10 15"/><circle cx="5" cy="24" r="2"/><circle cx="27" cy="24" r="2"/><path d="M17 7v4m-3-1 3 3 3-3"/></svg>;
  if (type === 'win') return <svg className="marble-event-symbol marble-event-win-symbol" viewBox="0 0 32 32" aria-hidden="true"><path d="m16 3 2.4 7.1L26 7l-3.1 7.5L30 17l-7.2 2.3L26 27l-7.3-3.3L16 31l-2.5-7.3L6 27l3.1-7.5L2 17l7.2-2.5L6 7l7.5 3.1z"/></svg>;
  if (type === 'roll') return <svg className="marble-event-symbol marble-event-dice-symbol" viewBox="0 0 32 32" aria-hidden="true"><rect x="6" y="6" width="20" height="20" rx="4"/><circle cx="12" cy="12" r="1.5"/><circle cx="20" cy="12" r="1.5"/><circle cx="16" cy="16" r="1.5"/><circle cx="12" cy="20" r="1.5"/><circle cx="20" cy="20" r="1.5"/></svg>;
  return <svg className="marble-event-symbol" viewBox="0 0 32 32" aria-hidden="true"><path d="M7 24 24 7M12 7h12v12"/></svg>;
}

export function MarbleEventStage({ events, language, playerId }: { events: readonly (MarbleActionEvent | null | undefined)[]; language: Language; playerId: PlayerId }) {
  const sequence = useRef<number | null>(null);
  const [queue, setQueue] = useState<MarbleActionEvent[]>([]);
  const [presented, setPresented] = useState<MarbleActionEvent | null>(() => latestEvent(events));
  const [reduced, setReduced] = useState(false);
  const [round, setRound] = useState(0);
  const timer = useRef<number | null>(null);
  const currentPlayer = useRef(playerId);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    const ordered = events.filter((event): event is MarbleActionEvent => Boolean(event) && marbleEventSequence(event) > 0).slice().sort((a, b) => marbleEventSequence(a) - marbleEventSequence(b));
    if (currentPlayer.current !== playerId) {
      currentPlayer.current = playerId;
      sequence.current = ordered.reduce((max, event) => Math.max(max, marbleEventSequence(event)), 0);
      setRound(value => value + 1);
      setQueue([]);
      setPresented(ordered.at(-1) ?? null);
      return;
    }
    if (sequence.current === null) {
      sequence.current = ordered.reduce((max, event) => Math.max(max, marbleEventSequence(event)), 0);
      setPresented(ordered.at(-1) ?? null);
      return;
    }
    const window = marbleEventWindow(ordered, sequence.current);
    if (window.reset) {
      setRound(value => value + 1);
      setQueue([]);
      sequence.current = window.latestSequence;
      if (!window.fresh.length) {
        setPresented(null);
        return;
      }
    }
    const fresh = window.fresh;
    if (!fresh.length) return;
    sequence.current = window.latestSequence;
    if (reduced) {
      setPresented(fresh[fresh.length - 1]);
      setQueue([]);
    } else setQueue(current => [...current, ...fresh]);
  }, [events, reduced]);

  useEffect(() => {
    if (reduced || !queue.length) return;
    setPresented(queue[0]);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setQueue(current => current.slice(1));
    }, 640);
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = null;
    };
  }, [queue, reduced]);

  useEffect(() => {
    if (reduced && queue.length) {
      setPresented(queue[queue.length - 1]);
      setQueue([]);
    }
  }, [reduced, queue]);

  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);

  if (!presented) return null;
  const type = marbleEventType(presented);
  const heading = presented.title?.[language] || labels[type]?.[language] || (language === 'ko' ? '게임 기록' : 'Movimiento');
  const detail = presented.text?.[language];
  const actor = actorLabel(presented, playerId, language);
  const actorId = String(presented.actor ?? presented.playerId ?? playerId);
  const amount = marbleMoneyDelta(presented, actorId);
  const warningAmount = amount === null && (type === 'crisis' || type === 'monopoly-warning') && typeof presented.amount === 'number' ? presented.amount : null;
  const fromId = presented.fromPlayer;
  const toId = presented.toPlayer;
  const from = playerLabel(fromId, playerId, language);
  const to = playerLabel(toId, playerId, language);
  const bank = language === 'ko' ? '은행' : 'Banco';
  const hasTransfer = ['rent', 'tax', 'buy', 'build', 'loan', 'repay', 'bonus', 'monopoly-warning'].includes(type) && (fromId !== undefined || toId !== undefined);
  const transferFrom = from || (toId !== undefined && fromId === undefined ? bank : actor);
  const transferTo = to || (fromId !== undefined && toId === undefined ? bank : '');
  return <div className={`marble-event-stage marble-event-stage--${type.replace(/[^a-z-]/g, '')}${queue.length && !reduced ? ' is-animating' : ''}`} key={`${round}:${marbleEventSequence(presented)}`}>
    <span className="marble-event-mark" aria-hidden="true"><EventMark type={type}/><i/><b/><em/></span>
    <div className="marble-event-copy">
      <div className="marble-event-heading"><strong>{heading}</strong>{actor && <span>{actor}</span>}</div>
      {detail && <p>{detail}</p>}
    </div>
    {hasTransfer && <span className="marble-event-transfer">{transferFrom}<i aria-hidden="true">→</i>{transferTo}</span>}
    {amount !== null && <strong className={`marble-event-amount${amount < 0 ? ' is-negative' : ''}`}>{amount > 0 ? '+' : amount < 0 ? '−' : ''}{Math.abs(amount)}</strong>}
    {warningAmount !== null && <strong className="marble-event-amount is-assessment"><span>{language === 'ko' ? type === 'crisis' ? '지급 필요' : '부담금' : type === 'crisis' ? 'Pendiente' : 'Cargo'}</span>{warningAmount}</strong>}
  </div>;
}

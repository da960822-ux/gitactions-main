import { useEffect, useRef, useState } from 'react';
import type { Language, PlayerId } from '../core/types';
import type { MarbleEventId } from '../games/marble';
import { marbleCueForEvent, marbleEventSequence, marbleEventType, marbleMoneyDelta, type MarbleActionEvent } from './marble-motion';
import { playCue } from '../audio/audio';
import { marblePresentation } from './marble-presentation';
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
  if (id === 'bank') return language === 'ko' ? '은행' : 'Banco';
  if (id === 'fund') return language === 'ko' ? '공동 기금' : 'Fondo común';
  if (id === 'p1' || id === 'p2') return id === playerId ? (language === 'ko' ? '나' : 'Tú') : (language === 'ko' ? '상대' : 'Tu pareja');
  return '';
}

function latestEvent(events: readonly (MarbleActionEvent | null | undefined)[]) {
  return events.filter((event): event is MarbleActionEvent => Boolean(event) && marbleEventSequence(event) > 0).slice().sort((a, b) => marbleEventSequence(a) - marbleEventSequence(b)).at(-1) ?? null;
}

const goldenKeyArt: Record<MarbleEventId, string> = {
  festival: 'festival', lottery: 'festival', 'rent-rebate': 'festival',
  'travel-cost': 'tax', maintenance: 'tax', 'monopoly-warning': 'tax',
  'visit-santo-domingo': 'cities', 'city-dividend': 'cities',
  retreat: 'train', 'advance-start': 'train', 'train-ticket': 'train',
  'go-to-island': 'island', 'escape-pass': 'island',
  'city-festival': 'city-festival', blackout: 'blackout', 'rent-pass': 'rent-pass',
};

function EventMark({ type, event }: { type: string; event: MarbleActionEvent }) {
  const cardId = String(event.cardId ?? event.id ?? '');
  if (type === 'event-card') return <svg className="marble-event-golden-key-art" viewBox="0 0 128 160" aria-hidden="true"><g className="marble-event-card-face"><use href={`/images/marble/golden-key-cards.svg#${goldenKeyArt[cardId as MarbleEventId] ?? 'festival'}`} width="128" height="160"/></g></svg>;
  const symbol = type === 'bonus' ? 'fund-pay' : type === 'tax' ? 'tax' : type === 'island' || type === 'escape' ? 'island' : type === 'train' ? 'train' : type === 'rest' ? 'rest' : null;
  if (symbol) return <svg className="marble-event-symbol" viewBox="0 0 32 32" aria-hidden="true"><use href={`/images/marble/tile-symbols.svg#${symbol}`} width="32" height="32"/></svg>;

  if (type === 'arrival' || type === 'monopoly-warning') return <svg className="marble-event-symbol marble-event-card-symbol" viewBox="0 0 32 32" aria-hidden="true"><g className="marble-event-card-face"><rect x="5" y="4" width="22" height="24" rx="3"/><path d="M10 10h12M10 15h9M10 21l4-3 4 3 4-3"/></g>{type === 'monopoly-warning' && <path className="marble-event-alert" d="M25 4v8m0 4v.1"/>}</svg>;
  if (type === 'buy') return <svg className="marble-event-symbol" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="8"/><path d="M16 11v10m3-8c-1-2-6-2-6 1s6 1 6 4-5 3-7 1M16 3v3M16 26v3M3 16h3m20 0h3"/></svg>;
  if (type === 'build') return <svg className="marble-event-symbol marble-event-build-symbol" viewBox="0 0 32 32" aria-hidden="true"><path d="M5 27h22"/><rect x="7" y="18" width="6" height="9" rx="1"/><rect x="14" y="12" width="6" height="15" rx="1"/><rect x="21" y="6" width="5" height="21" rx="1"/><path d="M16 8V4m0 0-2 2m2-2 2 2"/></svg>;
  if (type === 'rent') return <svg className="marble-event-symbol" viewBox="0 0 32 32" aria-hidden="true"><circle cx="10" cy="16" r="6"/><circle cx="23" cy="16" r="6"/><path d="M12 16h9m-3-3 3 3-3 3M8 14h4m-4 4h4m9-4h4m-4 4h4"/></svg>;
  if (type === 'loan' || type === 'repay') return <svg className="marble-event-symbol marble-event-contract-symbol" viewBox="0 0 32 32" aria-hidden="true"><path d="M8 4h12l5 5v19H8zM20 4v6h5M12 15h9m-9 4h9m-9 4h5"/><path className="marble-contract-stamp" d="m20 22 2 2 4-5"/></svg>;
  if (type === 'crisis' || type === 'bankruptcy') return <svg className="marble-event-symbol" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4 29 27H3z"/><path d="M16 12v7m0 4v.1"/></svg>;
  if (type === 'move' || type === 'pawn') return <svg className="marble-event-symbol marble-event-route-symbol" viewBox="0 0 32 32" aria-hidden="true"><path d="M5 24c7 0 5-15 12-15s4 15 10 15"/><circle cx="5" cy="24" r="2"/><circle cx="27" cy="24" r="2"/><path d="M17 7v4m-3-1 3 3 3-3"/></svg>;
  if (type === 'win') return <svg className="marble-event-symbol marble-event-win-symbol" viewBox="0 0 32 32" aria-hidden="true"><path d="m16 3 2.4 7.1L26 7l-3.1 7.5L30 17l-7.2 2.3L26 27l-7.3-3.3L16 31l-2.5-7.3L6 27l3.1-7.5L2 17l7.2-2.5L6 7l7.5 3.1z"/></svg>;
  if (type === 'roll') return <svg className="marble-event-symbol marble-event-dice-symbol" viewBox="0 0 32 32" aria-hidden="true"><rect x="6" y="6" width="20" height="20" rx="4"/><circle cx="12" cy="12" r="1.5"/><circle cx="20" cy="12" r="1.5"/><circle cx="16" cy="16" r="1.5"/><circle cx="12" cy="20" r="1.5"/><circle cx="20" cy="20" r="1.5"/></svg>;
  return <svg className="marble-event-symbol" viewBox="0 0 32 32" aria-hidden="true"><path d="M7 24 24 7M12 7h12v12"/></svg>;
}

export function MarbleEventStage({ events, language, playerId, result }: { events: readonly (MarbleActionEvent | null | undefined)[]; language: Language; playerId: PlayerId; result?: unknown }) {
  const [presentation, setPresentation] = useState(() => ({ event: latestEvent(events), animate: false, audible: false }));
  const presented = presentation.event;
  const sounded = useRef<typeof presentation | null>(null);
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const timeline = useRef<ReturnType<typeof marblePresentation> | null>(null);
  if (!timeline.current) timeline.current = marblePresentation((event, animate, audible) => {
    setPresentation({ event, animate, audible });
  });

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    timeline.current!.update(events.filter((event): event is MarbleActionEvent => Boolean(event)), playerId, reduced, Boolean(result));
  }, [events, playerId, reduced, result]);
  useEffect(() => () => timeline.current!.dispose(), []);
  useEffect(() => {
    if (sounded.current === presentation) return;
    sounded.current = presentation;
    const cue = presentation.event && marbleCueForEvent(presentation.event);
    if (presentation.audible && !result && cue && cue !== 'win') playCue('marble', cue);
  }, [presentation, result]);

  if (!presented) return null;
  const type = marbleEventType(presented);
  const heading = presented.title?.[language] || labels[type]?.[language] || (language === 'ko' ? '게임 기록' : 'Movimiento');
  const detail = presented.text?.[language];
  const actor = actorLabel(presented, playerId, language);
  const actorId = String(presented.actor ?? presented.playerId ?? playerId);
  const amount = marbleMoneyDelta(presented, actorId);
  const warningAmount = amount === null && (type === 'crisis' || type === 'monopoly-warning') && typeof presented.amount === 'number' ? presented.amount : null;
  const fromId = presented.fromAccount ?? presented.fromPlayer;
  const toId = presented.toAccount ?? presented.toPlayer;
  const from = playerLabel(fromId, playerId, language);
  const to = playerLabel(toId, playerId, language);
  const bank = language === 'ko' ? '은행' : 'Banco';
  const assessed = warningAmount !== null;
  const fund = language === 'ko' ? '공동 기금' : 'Fondo común';
  const recipient = presented.creditor === 'fund' ? fund : presented.creditor === 'bank' || ['buy', 'build', 'repay', 'loan'].includes(type) ? bank : language === 'ko' ? '납부처' : 'Destinatario';
  const source = presented.source === 'fund' ? fund : bank;
  const hasTransfer = ['rent', 'tax', 'buy', 'build', 'loan', 'repay', 'bonus', 'monopoly-warning', 'crisis', 'train'].includes(type) && (amount !== 0 && (fromId !== undefined || toId !== undefined || amount !== null || assessed));
  const incoming = amount !== null && amount > 0;
  const transferFrom = from || (incoming || toId !== undefined ? source : actor);
  const transferTo = to || (incoming || toId !== undefined ? actor : recipient);
  const route = typeof presented.from === 'number' && Number.isInteger(presented.from) && typeof presented.to === 'number' && Number.isInteger(presented.to)
    ? language === 'ko' ? `${presented.from + 1}번 → ${presented.to + 1}번 칸` : `Casilla ${presented.from + 1} → ${presented.to + 1}` : '';
  const status = type === 'event-card' ? language === 'ko' ? '카드 공개' : 'Carta revelada'
    : type === 'crisis' ? language === 'ko' ? '미지급 · 해결 필요' : 'Pendiente de pago'
      : assessed ? language === 'ko' ? '부담금 산정' : 'Cargo previsto'
        : amount === 0 ? language === 'ko' ? '현금 변동 없음' : 'Sin cambio de efectivo'
          : amount !== null ? language === 'ko' ? amount < 0 ? '지급 완료' : '수령 완료' : amount < 0 ? 'Pago realizado' : 'Cobro realizado' : '';
  return <div className={`marble-event-stage marble-event-stage--${type.replace(/[^a-z-]/g, '')}${presentation.animate && !reduced && !result ? ' is-animating' : ''}`} key={marbleEventSequence(presented)}>
    <span className="marble-event-mark" aria-hidden="true"><EventMark type={type} event={presented}/><i/><b/><em/></span>
    <div className="marble-event-copy">
      <div className="marble-event-heading"><strong>{heading}</strong>{actor && <span>{actor}</span>}</div>
      {status && <span className={`marble-event-status${assessed ? ' is-pending' : ''}`}>{status}</span>}
      {detail && <p>{detail}</p>}
      {route && <small className="marble-event-route">{route}</small>}
    </div>
    {hasTransfer && <span className="marble-event-transfer">{transferFrom}<i aria-hidden="true">→</i>{transferTo}</span>}
    {amount !== null && <strong className={`marble-event-amount${amount < 0 ? ' is-negative' : ''}`}>{amount > 0 ? '+' : amount < 0 ? '−' : ''}{Math.abs(amount)}</strong>}
    {warningAmount !== null && <strong className="marble-event-amount is-assessment"><span>{language === 'ko' ? type === 'crisis' ? '지급 필요' : '부담금' : type === 'crisis' ? 'Pendiente' : 'Cargo'}</span>{warningAmount}</strong>}
  </div>;
}

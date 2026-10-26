import { MarblePropertyLedger, MarblePropertySale } from './MarblePropertyLedger';
import { sameMarbleAction, selectMarblePrimaryAction } from '../games/marble-actions';
import { MarblePropertyArt } from './MarblePropertyArt';
import dioramas from '../../public/images/marble/dioramas/manifest.json';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { GameAction, Language, PlayerId } from '../core/types';
import { playCue } from '../audio/audio';
import { MarbleEventStage } from './MarbleEventStage';
import { MarbleTransactionReceipt } from './MarbleTransactionReceipt';
import { MarbleDecisionPreview } from './MarbleDecisionPreview';
import { MarbleMobileSpotlight } from './MarbleMobileSpotlight';
import { MarblePlayerHud } from './MarblePlayerHud';
import { MarbleBoardShell } from './MarbleBoardShell';
import { MarbleCityTile } from './MarbleCityTile';
import { MarblePawn, MarblePawnPicker } from './MarblePawn';
import { groups, specialNames, cityArtNames, cityFlag, pawnId, buildingName, rentValue, moneyText } from './marble-visuals';
import { marbleGridPosition, marblePresentationFrames, marbleCueForEvent, marbleJourneyDisplay, type MarbleActionEvent } from './marble-motion';
import '../styles/marble-premium.css';
import './marble-context.css';
import './marble-ownership.css';
import './marble-stage-redesign.css';

type Choice = { label: Record<Language, string>; action: GameAction };
type Seat = PlayerId;
type Props = { view: any; language: Language; playerId: PlayerId; runAction: (action: GameAction) => void | Promise<unknown>; solo?: boolean };
const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
const record = (value: unknown): Record<string, any> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
const list = (value: unknown): any[] => Array.isArray(value) ? value : [];
const num = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const seatName = (seat: Seat, playerId: PlayerId, language: Language) => seat === playerId ? copy(language, '나', 'Tú') : copy(language, '상대', 'Tu pareja');

function phaseName(phase: string, language: Language) {
  const phases: Record<string, Record<Language, string>> = {
    roll: { ko: '주사위 굴릴 차례', es: 'Lanza los dados' }, decision: { ko: '도시 구매 결정', es: 'Decide si compras' }, main: { ko: '차례 마무리', es: 'Termina tu turno' },
    island: { ko: '무인도에서 나가기', es: 'Salir de la isla' }, 'train-decision': { ko: '열차 목적지 선택', es: 'Elige tu destino en tren' }, debt: { ko: '결제 방법 선택', es: 'Resuelve el pago' }, 'event-decision': { ko: '카드 효과를 적용할 도시 선택', es: 'Elige una ciudad para la carta' }, 'rent-decision': { ko: '통행료 결제 선택', es: 'Elige cómo pagar la renta' }, finished: { ko: '경기 종료', es: 'Partida terminada' },
  };
  return phases[phase]?.[language] ?? copy(language, '게임 현황', 'Estado de la partida');
}

export function MarbleDie({ value, language }: { value: number; language: Language }) {
  const dots: Record<number, string[]> = { 1: ['m'], 2: ['tl', 'br'], 3: ['tl', 'm', 'br'], 4: ['tl', 'tr', 'bl', 'br'], 5: ['tl', 'tr', 'm', 'bl', 'br'], 6: ['tl', 'ml', 'bl', 'tr', 'mr', 'br'] };
  return <span className={`mp-die ${value ? 'has-value' : ''}`} role="img" aria-label={value ? String(value) : copy(language, '아직 굴리지 않음', 'Sin lanzar')}>
    <svg viewBox="0 0 48 48" aria-hidden="true"><rect x="3" y="3" width="42" height="42" rx="12"/>{value ? (dots[value] ?? []).map(point => <circle key={point} cx={point.includes('l') ? 15 : point.includes('r') ? 33 : 24} cy={point.includes('t') ? 15 : point.includes('b') ? 33 : 24} r="3.1"/>) : <path className="mp-die-unrolled" d="m24 12 2.8 8.2L35 23l-8.2 2.8L24 34l-2.8-8.2L13 23l8.2-2.8Z"/>}</svg>
  </span>;
}

function ImpactText({ tile, language, fund = 0, modern = true }: { tile: Record<string, any>; language: Language; fund?: number; modern?: boolean }) {
  const kind = String(tile.kind ?? '');
  const name = String(record(tile.name)[language] ?? record(tile.name).ko ?? '');
  if (kind === 'property') return <><b>{name}</b><span>{tile.owner ? copy(language, `통행료 ${rentValue(tile, modern)}`, `Alquiler ${rentValue(tile, modern)}`) : copy(language, `구매 ${num(tile.price)} · 기본 통행료 ${num(tile.rent)}`, `Compra ${num(tile.price)} · renta ${num(tile.rent)}`)}</span></>;
  return <><b>{name || specialNames[kind]?.[language]}</b><span>{journeySpecialLine(tile, language, fund)}</span></>;
}

function journeySpecialLine(tile: Record<string, any>, language: Language, fund: number) {
  switch (tile.kind) {
    case 'start': return copy(language, '통과할 때 200을 받아요.', 'Recibe 200 al pasar.');
    case 'tax': return copy(language, `납부 ${moneyText(num(tile.price), language)}`, `Pago ${moneyText(num(tile.price), language)}`);
    case 'fund-deposit': return copy(language, `공동 기금에 ${moneyText(num(tile.price), language)}을 내요.`, `Aporta ${moneyText(num(tile.price), language)} al fondo común.`);
    case 'fund': return copy(language, `공동 기금 ${moneyText(fund, language)}을 받아요.`, `Recibe ${moneyText(fund, language)} del fondo común.`);
    case 'event': return copy(language, '카드를 뽑아 효과를 확인해요.', 'Roba una carta y aplica su efecto.');
    case 'island': return copy(language, '최대 세 차례 쉬어요 · 다음 차례에 탈출 방법을 선택해요.', 'Hasta tres turnos de espera · elige cómo salir en tu próximo turno.');
    case 'train': return copy(language, '다음 차례에 목적지를 골라요 · 운임 100.', 'Elige destino en tu próximo turno · pasaje 100.');
    case 'rest': return copy(language, '추가 비용이 없어요.', 'No tiene costo adicional.');
    default: return copy(language, '이 칸에서는 추가 효과가 없어요.', 'Esta casilla no tiene un efecto adicional.');
  }
}

export function focusMarbleAction(panel: HTMLElement | null) {
  const stage = typeof panel?.closest === 'function' ? panel.closest<HTMLElement>('.mp-layout')?.querySelector<HTMLElement>('#mp-action-primary:not(:disabled)') : null;
  (stage ?? panel?.querySelector<HTMLElement>('.mp-action-primary:not(:disabled)') ?? panel?.querySelector<HTMLElement>('button:not(:disabled),select:not(:disabled)') ?? panel)?.focus();
}

export default function MarbleBoard({ view: rawView, language, playerId, runAction: dispatchAction }: Props) {
  const view = record(rawView), board = record(view.board), tiles = list(board.tiles), choices: Choice[] = list(view.actions);
  const players: Seat[] = ['p1', 'p2'];
  const seatLabel = (seat: Seat) => seatName(seat, playerId, language);
  const validSeat = (value: unknown): value is Seat => players.includes(value as Seat);
  const positionsSignature = players.map(seat => `${seat}:${num(record(board.positions)[seat])}`).join('|');
  const modern = tiles.length === 40 || num(board.version) >= 2;
  const isLegacy = tiles.length === 18;
  const positions = record(board.positions), money = record(board.money), assets = record(board.assets), debt = record(board.debt);
  const active = board.turn === playerId && view.status !== 'finished';
  const actionsOf = (type: string) => choices.filter(choice => choice.action?.type === type);
  const actionOf = (type: string) => actionsOf(type)[0];
  const pawnChoices = actionsOf('choose-pawn');
  const roll = actionOf('roll'), buy = actionOf('buy'), decline = actionOf('decline'), endTurn = actionOf('endTurn');
  const buildActions = actionsOf('build'), trainActions = actionsOf('choose-train'), eventCityActions = actionsOf('choose-event-city');
  const handled = new Set(['roll', 'buy', 'takeover', 'sell-property', 'decline', 'endTurn', 'build', 'choose-train', 'choose-pawn', 'borrow', 'repay', 'declare-bankruptcy', 'attempt-doubles', 'pay-escape', 'use-escape-pass', 'skip-train', 'choose-event-city', 'pay-rent', 'use-rent-pass']);
  const otherActions = choices.filter(choice => !handled.has(String(choice.action?.type)));
  const activeSeat: Seat = validSeat(board.turn) ? board.turn : 'p1';
  const pos = Number.isInteger(positions[activeSeat]) ? num(positions[activeSeat]) : 0;
  const [selectedTile, setSelectedTile] = useState(pos);
  const [selectedSaleTile, setSelectedSaleTile] = useState<number | null>(null);
  const selectedCity = tiles[selectedTile] ?? {};
  const selectedName = String(record(selectedCity.name)[language] ?? record(selectedCity.name).ko ?? '');
  const selectedCityArt = cityArtNames[selectedName] ?? null;
  const landmarkNote = num(board.cityRouteVersion) >= 3 ? dioramas.assets.find(asset => asset.slug === selectedCityArt)?.note?.[language] : null;
  const selectedOwner = validSeat(selectedCity.owner) ? selectedCity.owner as Seat : null;
  const selectedBuild = actionsOf('build').find(choice => num(choice.action.payload?.tile) === selectedTile);
  const selectedIsAction = selectedTile === pos;
  const purchaseCost = selectedIsAction && selectedCity.kind === 'property' && buy ? num(selectedCity.price) : null;
  const selectedRent = rentValue(selectedCity, modern);
  const rentSteps = [0, 1, 2, 3].map(level => rentValue({ ...selectedCity, houses: level }, modern));
  const nextBuildCost = selectedOwner && selectedCity.nextBuildCost != null ? num(selectedCity.nextBuildCost) : null;
  const nextRent = selectedCity.nextRent != null ? num(selectedCity.nextRent) : rentValue({ ...selectedCity, houses: num(selectedCity.houses) + 1 }, modern);
  const currentTile = tiles[pos] ?? {};
  const eventLog = list(board.actionLog);
  const actionSequence = num(board.actionSequence) || Math.max(0, ...eventLog.map(event => num(event.sequence)));
  const lastPublicEvent = record(board.lastEvent);
  const stageEvents = eventLog.length ? eventLog : lastPublicEvent.title && lastPublicEvent.text ? [{
    sequence: num(lastPublicEvent.sequence), type: 'event-card', actor: lastPublicEvent.playerId ?? playerId,
    title: record(lastPublicEvent.title), text: record(lastPublicEvent.text), cashDelta: num(lastPublicEvent.cashDelta),
    from: lastPublicEvent.from, to: lastPublicEvent.to,
  }] : [];
  const lastMove = record(board.lastMove);
  const lastMoveSequence = num(lastMove.sequence);
  const rollValues = list(board.lastRoll).map(num);
  const diceSequence = num(board.diceSequence);
  const [traveler, setTraveler] = useState<{ seat: Seat; tile: number; seq: number } | null>(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [displayPositions, setDisplayPositions] = useState<Record<string, number>>(() => Object.fromEntries(players.map(seat => [seat, num(positions[seat])])));
  const journeyDisplay = marbleJourneyDisplay({ selectedTile, actionTile: pos, displayedTile: num(displayPositions[activeSeat]), traveler, playerId: activeSeat, diceRolling });
  const [presentedEvent, setPresentedEvent] = useState<MarbleActionEvent | null>(() => stageEvents.at(-1) ?? null);
  const motionTimers = useRef<number[]>([]);
  const motionBusy = useRef(false);
  const [reduced, setReduced] = useState(false);
  const [confirmBankruptcy, setConfirmBankruptcy] = useState(false);
  const previous = useRef<{ positions: Record<string, number>; move: number; action: number; dice: number; phase: string } | null>(null);
  const previousProperties = useRef<string | null>(null);
  const [changedProperties, setChangedProperties] = useState<number[]>([]);
  const propertySignature = tiles.map(tile => `${tile.owner ?? ''}:${num(tile.houses)}`).join('|');
  const ownedBy = (seat: Seat) => tiles.map((tile, index) => ({ tile, index })).filter(({ tile }) => tile.kind === 'property' && tile.owner === seat);
  const pendingPayment = record(board.pendingPayment);
  const phase = String(view.phase ?? 'roll');
  const fund = num(board.fundPool);
  const [target, setTarget] = useState('');
  const destinations = phase === 'event-decision' ? eventCityActions : phase === 'train-decision' ? trainActions : [];
  const selectedDestination = destinations.find(choice => JSON.stringify(choice.action) === target) ?? destinations[0];
  const primaryChoice = selectMarblePrimaryAction({ phase, choices, position: pos, selectedTile, selectedSaleTile, selectedAction: selectedDestination?.action });
  const isPrimary = (choice?: Choice) => modern && sameMarbleAction(choice?.action, primaryChoice?.action);
  const primaryIndex = primaryChoice ? num(primaryChoice.action.payload?.tile ?? primaryChoice.action.payload?.destination ?? pos) : pos;
  const primaryTile = tiles[primaryIndex] ?? currentTile;
  const primaryStructure = primaryChoice?.action.type === 'build' ? String(primaryChoice.action.payload?.structure ?? '') : '';
  const primaryBuildOption = list(primaryTile.nextBuildOptions).find(option => record(option).structure === primaryStructure);
  const primaryCost = primaryChoice?.action.type === 'buy' ? num(primaryTile.price) : primaryChoice?.action.type === 'build' ? num(primaryBuildOption?.cost ?? primaryTile.nextBuildCost) : primaryChoice?.action.type === 'takeover' ? num(record(board.takeoverOffer).price) : primaryChoice?.action.type === 'pay-rent' ? num(board.pendingRent?.amount) : 0;
  const primaryAfterCash = num(money[playerId]) - primaryCost;
  const primaryBuildRent = primaryTile.referenceProfileId === 'kakao-world-business-2013-zero-discount' ? num(primaryTile.currentToll) : rentValue(primaryTile, modern);
  const primaryNextBuildRent = primaryBuildOption ? num(primaryBuildOption.tollAfter) : primaryTile.nextRent != null ? num(primaryTile.nextRent) : rentValue({ ...primaryTile, houses: num(primaryTile.houses) + 1 }, modern);
  const needsCityChoice = active && ['train-decision', 'event-decision'].includes(phase) && destinations.length > 0;
  const pendingPurchasePrice = phase === 'decision' && primaryTile.kind === 'property' ? num(primaryTile.price) : null;
  const pendingPurchaseShortfall = pendingPurchasePrice === null ? 0 : Math.max(0, pendingPurchasePrice - num(money[playerId]));
  const unaffordableBuild = phase === 'main' && buildActions.length === 0 ? ownedBy(playerId).find(({ tile }) => num(tile.houses) < 3 && num(tile.nextBuildCost) > num(money[playerId])) : undefined;
  const primaryCityArt = cityArtNames[String(record(primaryTile.name).ko ?? '')];
  const islandRemaining = num(record(board.islandTurns)[playerId]);
  const escapePassCount = num(record(board.escapePasses)[playerId]);
  const turns = Math.min(num(board.turns), 120);
  const currentTurn = Math.max(1, Math.min(120, turns + 1));
  const latestReceipt = record(stageEvents.at(-1));
  const receiptBoundary = stageEvents.map(event => event.type).map(type => type === 'turn' || type === 'roll').lastIndexOf(true);
  const latestMoneyReceipt = record(stageEvents.slice(Math.max(0, receiptBoundary)).filter(event => typeof event.moneyDelta?.[playerId] === 'number' && event.moneyDelta[playerId] !== 0).at(-1));
  const latestTransaction = [...eventLog].reverse().find(event => Object.values(record(event.moneyDelta)).some(delta => typeof delta === 'number' && delta !== 0));
  const accountLabel = (account: unknown) => account === 'bank' ? copy(language, '은행', 'Banco') : account === 'fund' ? copy(language, '공동 기금', 'Fondo común') : validSeat(account) ? seatLabel(account) : '';
  const [actionPending, setActionPending] = useState(false);
  const actionPendingRef = useRef(false);
  const interactionLocked = actionPending || diceRolling || !!traveler;
  const journeyInFlight = diceRolling || !!traveler || num(displayPositions[activeSeat]) !== pos;
  const settledHud = useRef({ money: { ...money }, assets: { ...assets } });
  useEffect(() => { if (!journeyInFlight) settledHud.current = { money: { ...money }, assets: { ...assets } }; }, [journeyInFlight, money.p1, money.p2, assets.p1, assets.p2]);
  const hudMoney = journeyInFlight ? settledHud.current.money : money;
  const hudAssets = journeyInFlight ? settledHud.current.assets : assets;
  const dispatch = async (action: GameAction) => {
    const choice = choices.find(item => item.action.type === action.type && JSON.stringify(item.action.payload ?? {}) === JSON.stringify(action.payload ?? {}));
    if (!choice || interactionLocked || actionPendingRef.current) return false;
    actionPendingRef.current = true; setActionPending(true);
    try { return await dispatchAction(action); }
    finally { actionPendingRef.current = false; setActionPending(false); }
  };
  const run = (choice?: Choice) => choice && void dispatch(choice.action);
  const layoutRef = useRef<HTMLDivElement>(null);
  const actionPanelRef = useRef<HTMLElement>(null);
  const cityDetailsRef = useRef<HTMLDetailsElement>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(stageEvents.length > 0);
  const inspectTile = (index: number) => { setSelectedTile(index); if ((tiles.length !== 32 || window.innerWidth > 680) && cityDetailsRef.current) cityDetailsRef.current.open = true; };
  useEffect(() => { setTarget(''); setSelectedSaleTile(null); }, [phase, playerId]);
  useEffect(() => {
    if (!actionSequence) return;
    setFeedbackVisible(true);
    const timer = window.setTimeout(() => setFeedbackVisible(false), 3500);
    return () => window.clearTimeout(timer);
  }, [actionSequence]);

  useLayoutEffect(() => {
    const layout = layoutRef.current;
    if (!layout || !modern) return;
    const resize = () => {
      const top = layout.getBoundingClientRect().top + window.scrollY;
      layout.style.setProperty('--mp-available-height', `${Math.max(320, window.innerHeight - top - 18)}px`);
    };
    resize();
    const observer = new ResizeObserver(resize);
    const room = layout.closest('.room-main');
    if (room) observer.observe(room);
    window.addEventListener('resize', resize);
    return () => { observer.disconnect(); window.removeEventListener('resize', resize); };
  }, [modern, language]);

  useEffect(() => { setConfirmBankruptcy(false); }, [phase, playerId, actionSequence]);
  useLayoutEffect(() => { setSelectedTile(pos); }, [pos]);

  useEffect(() => {
    const currentProperties = tiles.map(tile => `${tile.owner ?? ''}:${num(tile.houses)}`);
    const signature = currentProperties.join('|');
    const before = previousProperties.current;
    previousProperties.current = signature;
    if (!before) return;
    const old = before.split('|');
    const changed = currentProperties.flatMap((value, index) => value !== old[index] ? [index] : []);
    setChangedProperties(changed);
    if (!changed.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setTimeout(() => setChangedProperties([]), 700);
    return () => window.clearTimeout(timer);
  }, [propertySignature]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const next = { positions: Object.fromEntries(players.map(seat => [seat, num(positions[seat])])), move: lastMoveSequence, action: actionSequence, dice: diceSequence, phase };
    const before = previous.current;
    previous.current = next;
    // Repeated snapshots and locale changes keep the active timeline intact.
    if (before && before.action === next.action && before.move === next.move && before.dice === next.dice && !reduced) return;
    const interrupted = motionBusy.current;
    motionBusy.current = false;
    motionTimers.current.forEach(window.clearTimeout); motionTimers.current = [];
    const freshEvents = eventLog.filter(event => num(event.sequence) > (before?.action ?? actionSequence)).sort((a, b) => num(a.sequence) - num(b.sequence));
    const frames = before ? marblePresentationFrames(freshEvents, before.positions, next.positions, tiles.length || 18) : [];
    if (!before || reduced || document.hidden || actionSequence < before.action || interrupted || freshEvents.length > 12 || !frames.length) {
      setTraveler(null); setDiceRolling(false); setDisplayPositions(next.positions); setPresentedEvent(stageEvents.at(-1) ?? null);
      // Static/reduced feedback keeps the latest sound; it never replays a queue.
      if (before && freshEvents.length && !document.hidden && actionSequence >= before.action) {
        const event = [...freshEvents].reverse().find((item: MarbleActionEvent) => marbleCueForEvent(item) && !['move', 'turn'].includes(String(item.type))) ?? freshEvents.at(-1)!;
        const cue = event.type === 'win' && view.result?.winner === (playerId === 'p1' ? 'p2' : 'p1') ? 'lose' : marbleCueForEvent(event);
        if (cue) playCue('marble', cue);
      }
      return;
    }
    let cueSequence = 0;
    motionBusy.current = true;
    const apply = (frame: typeof frames[number]) => {
      if (frame === frames.at(-1)) motionBusy.current = false;
      const sequence = num(frame.event.sequence);
      if (sequence > cueSequence && !document.hidden) {
        cueSequence = sequence;
        const cue = frame.event.type === 'win' && view.result?.winner === (playerId === 'p1' ? 'p2' : 'p1') ? 'lose' : marbleCueForEvent(frame.event);
        if (cue) playCue('marble', cue);
      }
      setDiceRolling(frame.dice); setTraveler(frame.traveler && validSeat(frame.traveler.seat) ? { ...frame.traveler, seat: frame.traveler.seat } : null); setDisplayPositions(frame.positions); setPresentedEvent(frame.event);
    };
    apply(frames[0]);
    motionTimers.current = frames.slice(1).map(frame => window.setTimeout(() => apply(frame), frame.at));
  }, [positionsSignature, lastMoveSequence, diceSequence, actionSequence, reduced]);

  useEffect(() => {
    const snap = () => {
      motionTimers.current.forEach(window.clearTimeout); motionTimers.current = [];
      motionBusy.current = false; setTraveler(null); setDiceRolling(false);
      const latest = previous.current;
      if (latest) setDisplayPositions(latest.positions);
    };
    const hidden = () => { if (document.hidden) snap(); };
    document.addEventListener('visibilitychange', hidden);
    return () => { motionTimers.current.forEach(window.clearTimeout); document.removeEventListener('visibilitychange', hidden); };
  }, []);

  const opponentPhase: Record<string, Record<Language, string>> = {
    roll: { ko: '상대가 주사위를 굴릴 차례예요', es: 'A tu pareja le toca lanzar los dados' },
    decision: { ko: '상대가 도시 구매를 결정하고 있어요', es: 'Tu pareja está decidiendo si compra la ciudad' },
    main: { ko: '상대가 차례를 마무리하고 있어요', es: 'Tu pareja está terminando su turno' },
    island: { ko: '상대가 무인도에서 나갈 방법을 고르고 있어요', es: 'Tu pareja está eligiendo cómo salir de la isla' },
    'train-decision': { ko: '상대가 열차 목적지를 고르고 있어요', es: 'Tu pareja está eligiendo destino en tren' },
    'event-decision': { ko: '상대가 카드 효과를 적용할 도시를 고르고 있어요', es: 'Tu pareja está eligiendo una ciudad para la carta' },
    'rent-decision': { ko: '상대가 통행료 결제를 고르고 있어요', es: 'Tu pareja está eligiendo cómo pagar la renta' },
    debt: { ko: '상대가 결제 방법을 선택하고 있어요', es: 'Tu pareja está resolviendo un pago' },
  };
  const phaseLabel = !active && !view.result ? opponentPhase[phase]?.[language] ?? phaseName(phase, language) : phaseName(phase, language);
  const ownerName = validSeat(currentTile.owner) ? seatLabel(currentTile.owner) : null;
  const statusCopy = view.result ? copy(language, '경기가 끝났어요', 'Partida terminada') : active ? copy(language, '내 차례', 'Tu turno') : copy(language, '상대 차례', 'Turno de tu pareja');
  const scoreLabel = modern ? num(board.economicVersion) >= 1 ? copy(language, '순자산', 'Patrimonio neto') : copy(language, '총 자산', 'Activos totales') : copy(language, '현금', 'Efectivo');
  const outcome = view.result?.winner === 'draw' ? 'draw' : view.result?.winner === playerId ? 'win' : view.result ? 'lose' : '';

  return <section className={`marble-premium distilled-marble ${isLegacy ? 'is-legacy' : 'is-modern'}`} aria-label={copy(language, '부루마블 경기판', 'Tablero de Marble')}>
    <header className="mp-header"><div className="mp-brand"><h2>{copy(language, '부루마블', 'Marble')}</h2><p>{copy(language, '도시를 사고 건물을 지으며 여행해요. 같이 여행은 가도, 통행료는 따로야.', 'Compra ciudades, construye y recorre el mundo. Viajamos juntos, pero el alquiler va por separado.')}</p></div><div className={`mp-turn-badge ${active ? 'is-active' : ''}`}><span className="mp-turn-gem" aria-hidden="true"/><b>{statusCopy}</b><span>{phaseLabel}</span></div></header>

    <a className="mp-action-skip" href="#marble-current-action" onClick={event => { event.preventDefault(); focusMarbleAction(actionPanelRef.current); }}>{copy(language, '현재 행동으로 이동', 'Ir a la acción actual')}</a>
    <div className="mp-layout" ref={layoutRef}>
      <MarbleBoardShell tileCount={tiles.length} language={language}>
          {tiles.map((tile, index) => {
            const position = marbleGridPosition(index, tiles.length);
            if (!position) return null;
            const atSeats = players.filter(seat => !record(board.eliminated)[seat] && num(displayPositions[seat]) === index);
            const movingSeat = traveler?.tile === index ? traveler.seat : null;
            return <MarbleCityTile key={tile.index ?? index} tile={tile} index={index} tileCount={tiles.length} position={position} language={language} routeVersion={num(board.cityRouteVersion)} modern={modern} selected={selectedTile === index} pending={pos === index && phase === 'decision'} changed={changedProperties.includes(index)} atSeats={atSeats} movingSeat={movingSeat} travelerSequence={traveler?.seq} playerId={playerId} pawnForSeat={seat => pawnId(record(board.pawns)[seat]) ?? (seat === 'p1' ? 'fox' : 'cat')} seatLabel={seat => seatName(seat as PlayerId, playerId, language)} onInspect={inspectTile}/>;
          })}
          <div className={`mp-board-center ${isLegacy ? 'mp-board-center--18' : ''}`}>
            <div className="mp-ownership-key"><span className="mp-key-group"/>{copy(language, '윗띠 · 색상군', 'Franja · grupo')}<span className="mp-key-owner"/>{copy(language, '테두리·기단 · 소유자 번호', 'Borde y base · número del dueño')}<span className="mp-money-key">{copy(language, '미소유 숫자 = 매입 · 소유 숫자 = 통행료', 'Sin dueño: compra · Con dueño: alquiler')}</span></div>
            {tiles.length >= 32 && <img className="mp-world-map" src="/images/marble/world-map-board.webp" alt="" aria-hidden="true" decoding="async"/>}
            {tiles.length === 32 && <MarbleMobileSpotlight name={selectedName} city={selectedCityArt} level={num(selectedCity.houses)} owner={selectedOwner} ownerLabel={selectedOwner?seatLabel(selectedOwner):copy(language,'은행','Banco')} price={['property','tourism'].includes(String(selectedCity.kind))?num(selectedCity.price):null} toll={['property','tourism'].includes(String(selectedCity.kind))?selectedRent:null} language={language} routeVersion={num(board.cityRouteVersion)}/>}
            <div className="mp-center-route">{tiles.length === 32 ? <span>{copy(language, '방콕 → 도쿄 → 베를린 → 뉴욕 → 서울 → 출발', 'Bangkok → Tokio → Berlín → Nueva York → Seúl → Salida')}</span> : num(board.cityRouteVersion) >= 2 ? <span>{copy(language, '광주 → 뉴욕 → 산토도밍고 → 뉴어크 → 서울 → 광주', 'Gwangju → Nueva York → Santo Domingo → Newark → Seúl → Gwangju')}</span> : <><span>{copy(language, '광주 출발', 'Desde Gwangju')}</span><span className="mp-route-line" aria-hidden="true">↗</span><span>{copy(language, '세계 여행', 'Viaje mundial')}</span></>}</div>
            <div className="mp-map-hud"><span>{copy(language, '턴', 'Turno')} <b>{currentTurn} / 120</b></span>{modern && <span>{copy(language, '공동 기금', 'Fondo común')} <b>{moneyText(fund, language)}</b></span>}</div>
            {modern && <section className={`mp-center-stage mp-stage--${journeyInFlight ? 'moving' : phase}`} aria-label={copy(language, '현재 도착과 다음 행동', 'Llegada y acción actual')}>
              {journeyInFlight ? <div className="mp-moving-status" aria-live="polite"><h2>{copy(language, '여행 중', 'En camino')}</h2><div className="mp-stage-dice">{[0, 1].map(index => <MarbleDie key={`${diceSequence}-moving-${index}`} value={rollValues[index] ?? 0} language={language}/>)}</div><p>{copy(language, '말이 한 칸씩 이동하고 있어요', 'La ficha avanza casilla por casilla')}</p></div> : phase === 'roll' ? <>
                <h2>{active ? copy(language, '다음 여행을 시작하세요', 'Empieza el próximo viaje') : phaseLabel}</h2>
                <div className={`mp-stage-dice ${diceRolling ? 'is-rolling' : ''}`}>{[0, 1].map(index => <MarbleDie key={`${diceSequence}-center-${index}`} value={rollValues[index] ?? 0} language={language}/>)}</div>
                {active && roll && <button id="mp-action-primary" className="mp-action mp-action-primary" type="button" disabled={interactionLocked} onClick={() => run(roll)}>{copy(language, '주사위 굴리기', 'Lanzar los dados')}</button>}
              </> : <>
                {primaryTile.kind === 'property' && primaryCityArt ? <figure className={`mp-stage-art ${changedProperties.includes(primaryIndex) ? 'is-upgrading' : ''}`} key={`${primaryCityArt}-${num(primaryTile.houses)}`}><MarblePropertyArt routeVersion={num(board.cityRouteVersion)} language={language} city={primaryCityArt} level={num(primaryTile.houses)} owner={validSeat(primaryTile.owner) ? primaryTile.owner : null} ownerLabel={validSeat(primaryTile.owner) ? seatLabel(primaryTile.owner) : copy(language, '은행', 'Banco')}/></figure> : <span className="mp-stage-special" aria-hidden="true"><svg viewBox="0 0 32 32"><use href={`/images/marble/tile-symbols.svg#${primaryTile.kind === 'fund-deposit' ? 'fund-pay' : primaryTile.kind === 'event' ? 'key' : String(primaryTile.kind ?? 'rest')}`}/></svg></span>}
                <div className="mp-stage-details">
                  <small className="mp-center-action-phase">{primaryChoice?.action.type === 'build' ? copy(language, '도시 건설', 'Construir ciudad') : phaseLabel}</small>
                  <h2>{String(record(primaryTile.name)[language] ?? record(primaryTile.name).ko ?? copy(language, '여행', 'Viaje'))}</h2><span className="mp-stage-cash-before">{copy(language,`내 현금 ${moneyText(num(money[playerId]),language)}`,`Mi efectivo ${moneyText(num(money[playerId]),language)}`)}</span>
                  {primaryTile.kind === 'property' ? <p className="mp-stage-property-line">{validSeat(primaryTile.owner) ? seatLabel(primaryTile.owner) : copy(language, '은행 소유 · 구매 가능', 'Del banco · disponible')} · {buildingName(num(primaryTile.houses), language, true) || copy(language, '미건설', 'Sin construir')} · {copy(language, `현재 통행료 ${moneyText(primaryBuildRent, language)}`, `Alquiler actual ${moneyText(primaryBuildRent, language)}`)}</p> : <p className="mp-stage-property-line"><ImpactText tile={primaryTile} language={language} fund={fund} modern={modern}/></p>}
                  {phase === 'decision' && primaryTile.kind === 'property' && <MarbleDecisionPreview kind="buy" cost={num(primaryTile.price)} cashAfter={num(money[playerId])-num(primaryTile.price)} tollBefore={0} tollAfter={primaryBuildRent} shortfall={pendingPurchaseShortfall} language={language}/>}
                  {primaryChoice?.action.type === 'build' && <MarbleDecisionPreview kind="build" cost={primaryCost} cashAfter={primaryAfterCash} tollBefore={primaryBuildRent} tollAfter={primaryNextBuildRent} levelBefore={num(primaryTile.houses)} language={language}/>}
                  {primaryChoice?.action.type === 'takeover' && <MarbleDecisionPreview kind="takeover" cost={primaryCost} cashAfter={primaryAfterCash} tollBefore={primaryBuildRent} tollAfter={primaryBuildRent} levelBefore={num(primaryTile.houses)} recipient={validSeat(primaryTile.owner) ? seatLabel(primaryTile.owner) : copy(language,'소유자','propietario')} acquiredStage={buildingName(num(primaryTile.houses),language,true)||copy(language,'미건설','Sin construir')} language={language}/>}
                  {unaffordableBuild && <p className="mp-stage-shortfall" role="status">{copy(language, `${String(record(unaffordableBuild.tile.name)[language] ?? '')} 다음 건설 ${moneyText(num(unaffordableBuild.tile.nextBuildCost), language)} · ${moneyText(num(unaffordableBuild.tile.nextBuildCost) - num(money[playerId]), language)} 부족`, `${String(record(unaffordableBuild.tile.name).es ?? '')} próximo nivel ${moneyText(num(unaffordableBuild.tile.nextBuildCost), language)} · faltan ${moneyText(num(unaffordableBuild.tile.nextBuildCost) - num(money[playerId]), language)}`)}</p>}
                  {needsCityChoice && <label className="mp-stage-destination">{phase === 'event-decision' ? copy(language, '효과를 적용할 도시', 'Ciudad para el efecto') : copy(language, `목적지 · 운임 ${num(board.pendingTrainFare ?? 100)}`, `Destino · pasaje ${num(board.pendingTrainFare ?? 100)}`)}<select value={JSON.stringify(selectedDestination?.action ?? {})} disabled={interactionLocked} onChange={event => setTarget(event.target.value)}>{destinations.map(option => <option key={JSON.stringify(option.action)} value={JSON.stringify(option.action)}>{option.label[language]}</option>)}</select></label>}
                  {primaryChoice && active && <button id="mp-action-primary" className="mp-action mp-action-primary" type="button" disabled={interactionLocked || (primaryChoice.action.type === 'buy' && pendingPurchaseShortfall > 0)} onClick={() => run(primaryChoice)}>{needsCityChoice ? phase === 'event-decision' ? copy(language, '이 도시 선택', 'Aplicar a esta ciudad') : copy(language, '이 도시로 이동', 'Viajar a esta ciudad') : primaryChoice.action.type === 'buy' ? copy(language, `구매 · ${moneyText(primaryCost, language)}`, `Comprar · ${moneyText(primaryCost, language)}`) : primaryChoice.action.type === 'build' ? copy(language, `이 도시에 건설 · ${moneyText(primaryCost, language)}`, `Construir aquí · ${moneyText(primaryCost, language)}`) : primaryChoice.label[language]}</button>}
                  {phase === 'decision' && decline && active && <button className="mp-action mp-action-secondary" type="button" disabled={interactionLocked} onClick={() => run(decline)}>{copy(language, '이번에는 지나가기', 'Pasar esta vez')}</button>}
                  {phase === 'main' && endTurn && active && ['build','takeover'].includes(String(primaryChoice?.action.type)) && <button className="mp-action mp-action-secondary" type="button" disabled={interactionLocked} onClick={() => run(endTurn)}>{primaryChoice?.action.type==='build'?copy(language,'건설하지 않고 차례 마치기','Terminar sin construir'):copy(language,'인수하지 않고 차례 마치기','Terminar sin adquirir')}</button>}
                </div>
              </>}
              {latestTransaction && !feedbackVisible && !diceRolling && !traveler && <MarbleTransactionReceipt title={String(record(latestTransaction.title)[language] ?? '')} detail={String(record(latestTransaction.text)[language] ?? '')} flow={latestTransaction.fromAccount && latestTransaction.toAccount && num(latestTransaction.amount) > 0 ? `${accountLabel(latestTransaction.fromAccount)} → ${accountLabel(latestTransaction.toAccount)} · ${moneyText(num(latestTransaction.amount), language)}` : undefined} delta={typeof record(latestTransaction.moneyDelta)[playerId] === 'number' ? num(record(latestTransaction.moneyDelta)[playerId]) : undefined} language={language}/>}
            </section>}

            {lastMove.source === 'train' && lastMove.from === 30 && <div className={`mp-flight ${traveler?.seq === lastMoveSequence ? 'is-flying' : ''}`} style={{ color: lastMove.playerId === 'p1' ? '#a54e69' : '#356896' } as CSSProperties}>
              <svg viewBox="0 0 160 100" aria-hidden="true"><ellipse cx="80" cy="86" rx="47" ry="5" fill="#344c59" opacity=".12"/><g stroke="#344c59" strokeWidth="2" strokeLinejoin="round"><path d="m72 44 19-35 12 1-12 38 36 7 16 12-9 6-42-12-17 23-11-2 8-27-45-6-14-9 7-5z" fill="#fff8e7"/><path d="m27 43-15-22 11 1 19 21z" fill="currentColor"/><path d="m76 44 15-35 12 1-12 38zM89 61 75 84l-11-2 8-27z" fill="currentColor"/><path d="m114 55 13 2 8 8-15-1z" fill="#8db9c8"/></g></svg>
              <span><b>{lastMove.playerId === 'p1' ? copy(language, '아시아나', 'Asiana') : copy(language, '젯블루', 'JetBlue')}</b> · {copy(language, '둘의 상상 여행', 'Nuestro viaje imaginado')}</span>
              <small>{String(record(tiles[num(lastMove.to)]?.name)[language] ?? '')}</small>
            </div>}
          </div>
      </MarbleBoardShell>

      <aside className="mp-dashboard" aria-label={copy(language, '게임 현황과 행동', 'Estado y acciones')}>
        <section className="mp-scoreboard" aria-label={copy(language, '현금과 총 자산', 'Efectivo y activos totales')}>
          {players.map(seat => {
            const own = ownedBy(seat);
            return <MarblePlayerHud key={seat} seat={seat} name={seatLabel(seat)} pawn={pawnId(record(board.pawns)[seat]) ?? (seat === 'p1' ? 'fox' : 'cat')} cash={Number.isFinite(hudMoney[seat])?num(hudMoney[seat]):null} assets={num(hudAssets[seat])} scoreLabel={scoreLabel} active={board.turn===seat} self={seat===playerId} language={language} resetKey={`${playerId}:marble`} meta={{debt:num(debt[seat]),cities:own.length,landmarks:modern?own.filter(({tile})=>num(board.cityRouteVersion)>=4?tile.buildings?.landmark:num(tile.houses)>=3).length:0,groups:list(record(board.monopolies)[seat]).length,rentPasses:num(record(board.rentPasses)[seat])}}/>;
          })}
        </section>

        {pawnChoices.length > 0 && <details className="mp-pawn-picker-shell mp-city-detail"><summary>{copy(language, '말 선택', 'Elegir ficha')}</summary><MarblePawnPicker view={view} playerId={playerId} language={language} runAction={dispatch} disabled={interactionLocked}/></details>}

        <section ref={actionPanelRef} id="marble-current-action" tabIndex={-1} className="mp-turn-panel" aria-label={copy(language, '주사위와 행동', 'Dados y acciones')}>
          <div className="mp-phase-title"><h3>{phaseLabel}</h3><span>{copy(language, `턴 ${currentTurn}`, `Turno ${currentTurn}`)} / 120</span></div>
          <div className={`mp-dice-row ${diceRolling ? 'is-rolling' : ''}`} aria-label={copy(language, '최근 주사위 결과', 'Último resultado de los dados')}>
            {[0, 1].map(index => <MarbleDie key={`${diceSequence}-${index}`} value={rollValues[index] ?? 0} language={language}/>)}
            {rollValues.length >= 2 && <b className="mp-dice-total">{rollValues[0] + rollValues[1]}</b>}
          </div>
          <div className="mp-current-tile" aria-live="polite"><span className="mp-current-flag">{cityFlag(record(currentTile.name)) && <img src={`/images/marble/flags/${cityFlag(record(currentTile.name))}.svg`} alt="" loading="lazy" decoding="async"/>}</span><div><ImpactText tile={currentTile} language={language} fund={fund} modern={modern}/></div>{ownerName && <b className="mp-current-owner">{ownerName}</b>}</div>

          {active && phase === 'island' && <p className="mp-island-help">{copy(language, `무인도에 있어요 · 남은 차례 ${islandRemaining}. 쌍이 나오면 나가고, 100을 내거나 탈출권을 쓸 수 있어요${escapePassCount ? ` (탈출권 ${escapePassCount}장 보유)` : ''}.`, `Estás en la isla · ${islandRemaining} turnos pendientes. Puedes intentar sacar dobles, pagar 100 o usar un pase${escapePassCount ? ` (tienes ${escapePassCount})` : ''}.`)}</p>}
          {active && phase === 'train-decision' && <p className="mp-train-help">{copy(language, `운임 ${num(board.pendingTrainFare ?? 100)}을 내고 소유 여부와 관계없이 부동산 칸으로 이동할 수 있어요. 목적지가 없으면 열차를 건너뛰세요.`, `El pasaje cuesta ${num(board.pendingTrainFare ?? 100)}. Puedes elegir cualquier ciudad, aunque tenga dueño. Si no hay destinos disponibles, puedes pasar el tren.`)}</p>}
          {active && phase === 'event-decision' && <p className="mp-decision-help">{board.pendingEvent?.id === 'city-festival' ? copy(language, '내 도시 하나를 선택하세요. 다음 상대 방문의 통행료가 2배가 된 뒤 축제가 끝나요.', 'Elige una ciudad tuya. La próxima visita rival paga el doble y termina el festival.') : copy(language, '상대 도시 하나를 선택하세요. 다음 내 방문의 통행료가 절반이 된 뒤 정전이 끝나요.', 'Elige una ciudad rival. Tu próxima visita paga la mitad y termina el apagón.')}</p>}
          {active && phase === 'rent-decision' && <div className="mp-payment-alert" role="status"><b>{copy(language, '통행료를 내거나 면제권을 쓰세요', 'Paga la renta o usa tu pase')}</b><span>{board.pendingRent?.reason?.[language]}</span><strong>{moneyText(num(board.pendingRent?.amount), language)}</strong></div>}
          {phase === 'debt' && <div className="mp-payment-alert" role="status"><b>{copy(language, '결제가 필요해요', 'Hay un pago pendiente')}</b><span>{String(pendingPayment.reason?.[language] ?? '')}</span><strong>{moneyText(num(pendingPayment.amount), language)}</strong></div>}

          {purchaseCost !== null && <div className="mp-purchase-recap"><span>{copy(language, `구매 후 현금 ${moneyText(num(money[playerId]) - purchaseCost, language)}`, `Efectivo después ${moneyText(num(money[playerId]) - purchaseCost, language)}`)}</span></div>}
          {active && board.takeoverOffer && <p className="mp-purchase-recap">{board.takeoverOffer.price == null ? copy(language, '랜드마크 · 인수 불가', 'Monumento · no se puede adquirir') : copy(language, `인수 ${board.takeoverOffer.price} · 인수 후 현금 ${num(money[playerId]) - board.takeoverOffer.price}`, `Adquirir ${board.takeoverOffer.price} · efectivo después ${num(money[playerId]) - board.takeoverOffer.price}`)}</p>}
          {buildActions.some(choice => !isPrimary(choice)) && <section className="mp-build-shortcut" aria-label={copy(language, '건설 가능한 도시', 'Ciudades disponibles para construir')}>
            <strong>{copy(language, `건설 가능한 도시 ${buildActions.length}곳`, `${buildActions.length} ciudades disponibles`)}</strong>
            {buildActions.filter(choice => !isPrimary(choice)).map(choice => {
              const index = num(choice.action.payload?.tile), city = tiles[index] ?? {}, structure = String(choice.action.payload?.structure ?? ''), option = list(city.nextBuildOptions).find(item => record(item).structure === structure), cost = num(option?.cost ?? city.nextBuildCost), next = num(option?.tollAfter ?? city.nextRent), current = city.referenceProfileId === 'kakao-world-business-2013-zero-discount' ? num(city.currentToll) : rentValue(city, modern);
              return <div className="mp-build-option" key={index}>
                <span><b>{choice.label[language]}</b><small>{copy(language, `건설 후 현금 ${moneyText(num(money[playerId]) - cost, language)} · 통행료 ${moneyText(current, language)} → ${moneyText(next, language)}`, `Efectivo después ${moneyText(num(money[playerId]) - cost, language)} · renta ${moneyText(current, language)} → ${moneyText(next, language)}`)}</small></span>
                <button className="mp-action mp-action-primary" type="button" disabled={interactionLocked} onClick={() => run(choice)}>{copy(language, '건설', 'Construir')}<span aria-hidden="true">↗</span></button>
              </div>;
            })}
          </section>}
          <div className="mp-actions"><fieldset disabled={interactionLocked}><legend className="sr-only">{copy(language, '가능한 행동', 'Acciones disponibles')}</legend>
            {roll && !isPrimary(roll) && <button className="mp-action mp-action-primary" type="button" onClick={() => run(roll)}>{copy(language, '주사위 굴리기', 'Lanzar los dados')}<span aria-hidden="true">↗</span></button>}
            {actionsOf('takeover').filter(choice => !isPrimary(choice)).map(choice => <button className="mp-action mp-action-primary" key="takeover" onClick={() => run(choice)}>{choice.label[language]}</button>)}
            {buy && !isPrimary(buy) && <button className="mp-action mp-action-primary" type="button" onClick={() => run(buy)}>{copy(language, `구매 · ${moneyText(num(board.tiles[pos]?.price), language)}`, `Comprar · ${moneyText(num(board.tiles[pos]?.price), language)}`)}<span aria-hidden="true">↗</span></button>}
            {decline && <button className="mp-action mp-action-secondary" type="button" disabled={interactionLocked} onClick={() => run(decline)}>{copy(language, '구매하지 않고 지나가기', 'Continuar sin comprar')}</button>}
            {endTurn && !isPrimary(endTurn) && !['build','takeover'].includes(String(primaryChoice?.action.type)) && <button className="mp-action mp-action-secondary" type="button" onClick={() => run(endTurn)}>{endTurn.label[language]}<span aria-hidden="true">→</span></button>}
            {actionsOf('attempt-doubles').filter(choice => !isPrimary(choice)).map(choice => <button className="mp-action mp-action-primary" key={String(choice.action.type)} type="button" onClick={() => run(choice)}>{choice.label[language]}<span aria-hidden="true">↗</span></button>)}
            {actionsOf('pay-escape').map(choice => <button className="mp-action mp-action-primary" key={String(choice.action.type)} type="button" onClick={() => run(choice)}>{choice.label[language]}</button>)}
            {actionsOf('use-escape-pass').map(choice => <button className="mp-action mp-action-secondary" key={String(choice.action.type)} type="button" onClick={() => run(choice)}>{choice.label[language]}</button>)}
            {!modern && eventCityActions.length > 0 && <TrainChooser key={String(board.pendingEvent?.id)} choices={eventCityActions} language={language} runAction={dispatch} eventCity/>}
            {['pay-rent', 'use-rent-pass'].flatMap(type => actionsOf(type)).filter(choice => !isPrimary(choice)).map(choice => <button className="mp-action mp-action-primary" key={`${choice.action.type}-${JSON.stringify(choice.action.payload ?? {})}`} type="button" onClick={() => run(choice)}>{choice.label[language]}</button>)}
            {!modern && trainActions.length > 0 && <TrainChooser choices={trainActions} language={language} runAction={dispatch}/>}
            {actionsOf('skip-train').map(choice => <button className="mp-action mp-action-secondary" key={String(choice.action.type)} type="button" onClick={() => run(choice)}>{choice.label[language]}</button>)}
            {(actionsOf('borrow').length > 0 || actionsOf('repay').length > 0) && (phase === 'debt' ? <>
              <p className="mp-loan-note">{copy(language, '받기 300 · 상환 330', 'Recibes 300 y devuelves 330')}</p>
              {actionsOf('borrow').map(choice => <button className="mp-action mp-action-primary" key={choice.action.type} type="button" onClick={() => run(choice)}>{choice.label[language]}</button>)}
            </> : <details className="mp-loan-options"><summary>{copy(language, '대출·상환', 'Préstamo y pago')}</summary>
              <p className="mp-loan-note">{copy(language, '대출은 300을 받고 나중에 330을 갚아요. 한 번에 하나만 이용할 수 있어요.', 'Recibes 300 y luego devuelves 330. Solo puedes tener un préstamo pendiente.')}</p>
              {['borrow', 'repay'].flatMap(type => actionsOf(type)).map(choice => <button className="mp-action mp-action-secondary" key={choice.action.type} type="button" onClick={() => run(choice)}>{choice.label[language]}</button>)}
            </details>)}
            <MarblePropertySale choices={actionsOf('sell-property')} language={language} runAction={dispatch} selectedTile={selectedSaleTile} onSelectTile={setSelectedSaleTile} disabled={interactionLocked}/>
            {actionsOf('declare-bankruptcy').map(choice => <div className="mp-bankruptcy-confirm" key={String(choice.action.type)}>
              {!confirmBankruptcy ? <button className="mp-action mp-action-danger" type="button" onClick={() => setConfirmBankruptcy(true)}>{copy(language, '파산 선택 검토', 'Revisar opción de quiebra')}</button> : <>
                <p role="alert">{copy(language, '파산을 인정하면 경기가 즉시 끝나요. 계속할까요?', 'Si declaras la quiebra, la partida termina de inmediato. ¿Quieres continuar?')}</p>
                <button className="mp-action mp-action-danger" type="button" onClick={() => run(choice)}>{choice.label[language]}</button>
                <button className="mp-action mp-action-secondary" type="button" onClick={() => setConfirmBankruptcy(false)}>{copy(language, '돌아가기', 'Volver')}</button>
              </>}
            </div>)}
            {otherActions.map((choice, index) => <button className="mp-action mp-action-secondary" key={`${choice.action.type}-${index}`} type="button" onClick={() => run(choice)}>{choice.label[language]}</button>)}
            {!active && !view.result && <p className="mp-waiting">{copy(language, '상대가 차례를 진행하고 있어요.', 'Tu pareja está jugando su turno')}</p>}
          </fieldset></div>
        </section>

        {(feedbackVisible || diceRolling || traveler) && stageEvents.length > 0 && <section className="mp-event-theater" aria-label={copy(language, '방금 일어난 일', 'Lo que acaba de pasar')}>
          {<MarbleEventStage events={stageEvents} event={presentedEvent} animating={!reduced && (diceRolling || traveler !== null)} language={language} playerId={playerId} result={view.result}/>}
        </section>}

        <details ref={cityDetailsRef} className="mp-city-detail" data-marble-owner={selectedOwner ?? 'bank'} aria-label={selectedName}><summary>{copy(language, '도시 상세 · ', 'Detalles · ')}{selectedName}</summary>
          <div className="mp-city-detail-head"><div><small>{copy(language, '선택한 칸', 'Casilla seleccionada')}</small><span>{selectedTile === pos ? copy(language, '현재 행동 위치', 'Ubicación de acción') : copy(language, `현재 행동은 ${String(record(currentTile.name)[language] ?? record(currentTile.name).ko ?? '')}`, `La acción sigue en ${String(record(currentTile.name)[language] ?? record(currentTile.name).ko ?? '')}`)}</span></div></div>
            {modern && <section className="mp-journey-hud" aria-label={copy(language, '현재 도시와 24개 도시 빠른 바로가기', 'Ciudad actual y accesos rápidos a las 24 ciudades')}>
                <div className="mp-journey-arrival">
                <div className="mp-journey-stage" aria-label={copy(language, '실제 건설 단계', 'Etapa construida')}>
                  {selectedCity.kind === 'property' && selectedCityArt ? <MarblePropertyArt routeVersion={num(board.cityRouteVersion)} language={language} city={selectedCityArt} level={num(selectedCity.houses)} owner={selectedOwner} ownerLabel={selectedOwner ? seatLabel(selectedOwner) : copy(language, '은행', 'Banco')}/> : selectedCity.kind === 'property' ? <span>{selectedName}</span> : <svg className="mp-journey-special-symbol" viewBox="0 0 32 32" aria-hidden="true"><use href={`/images/marble/tile-symbols.svg#${selectedCity.kind === 'fund-deposit' ? 'fund-pay' : selectedCity.kind === 'event' ? 'key' : String(selectedCity.kind ?? 'rest')}`}/></svg>}
                  {selectedCity.kind === 'property' && <small>{buildingName(num(selectedCity.houses), language, modern) || copy(language, '현재 미건설', 'Sin construir')}</small>}
                </div>
                <div className="mp-journey-copy">
                  <small>{copy(language, journeyDisplay === 'inspect' ? '도시 살펴보기 · 행동 위치는 유지' : journeyDisplay === 'moving' ? '이동 중 · 이번 도착 예정' : '현재 도착 · 행동 위치', journeyDisplay === 'inspect' ? 'Vista de ciudad · la acción sigue en su destino' : journeyDisplay === 'moving' ? 'En movimiento · próximo destino' : 'Llegada actual · ubicación de acción')}</small>
                  <h3>{selectedName || specialNames[String(selectedCity.kind ?? '')]?.[language] || copy(language, '여행 도시', 'Ciudad del viaje')}</h3>
                  {selectedCity.kind === 'property' ? <p className="mp-journey-impact"><span><strong>{selectedOwner ? copy(language, '현재 통행료', 'Renta actual') : copy(language, '매입가', 'Compra')}</strong> {moneyText(selectedOwner ? selectedRent : num(selectedCity.price), language)}</span><span><strong>{selectedOwner ? copy(language, '기본 통행료', 'Renta base') : copy(language, '예상 통행료', 'Renta')}</strong> {moneyText(selectedOwner ? num(selectedCity.rent) : selectedRent, language)}</span></p> : <p className="mp-journey-special-line">{journeySpecialLine(selectedCity, language, fund)}</p>}
                  {selectedOwner && <span className={`mp-journey-owner mp-owner-${selectedOwner}`}>{copy(language, `소유 · ${seatLabel(selectedOwner)}`, `Dueño · ${seatLabel(selectedOwner)}`)} · {buildingName(num(selectedCity.houses), language, modern) || copy(language, '미건설', 'Sin construir')}</span>}
                </div>
              </div>
              {modern && num(board.cityRouteVersion) >= 2 && <nav className="mp-journey-stops" aria-label={copy(language, '24개 도시 중 대표 도시 빠른 바로가기', 'Accesos rápidos entre las 24 ciudades')}>
                {[1, 3, 15, 31, 38].map(index => {
                  const stop = tiles[index], name = String(record(stop?.name)[language] ?? record(stop?.name).ko ?? '');
                  return stop && <button type="button" key={index} aria-label={copy(language, `${name} 빠른 바로가기`, `Acceso rápido a ${name}`)} aria-pressed={selectedTile === index} onClick={() => inspectTile(index)}><span>{String(index + 1).padStart(2, '0')}</span>{name}</button>;
                })}
              </nav>}
            </section>}
          {selectedCity.kind === 'property' ? <>
            <article className={`mp-property-card mp-group-${String(selectedCity.group ?? '')}`} data-marble-owner={selectedOwner ?? 'bank'} aria-label={`${selectedName}, ${moneyText(num(selectedCity.price), language)}`}>
              <img className="mp-property-card-frame" src="/images/marble/ownership-card-frame.svg" alt="" aria-hidden="true"/>
              <h3 id="mp-city-detail-title">{selectedName}</h3>
              <div className="mp-property-card-art">{selectedCityArt && <MarblePropertyArt routeVersion={num(board.cityRouteVersion)} language={language} city={selectedCityArt} level={modern ? num(selectedCity.houses) : 0} owner={selectedOwner} ownerLabel={selectedOwner ? seatLabel(selectedOwner) : copy(language, '은행', 'Banco')}/>}</div>
              <div className="mp-property-card-owner"><b className={`mp-owner-mark ${selectedOwner ? `mp-owner-${selectedOwner}` : ''}`}>{selectedOwner && <MarblePawn pawn={pawnId(record(board.pawns)[selectedOwner]) ?? (selectedOwner === 'p1' ? 'fox' : 'cat')} language={language} label={seatLabel(selectedOwner)}/>} {selectedOwner ? seatLabel(selectedOwner) : copy(language, '미소유', 'Sin dueño')}</b><span className="mp-card-group">{groups[String(selectedCity.group ?? '')]?.[language] ?? String(selectedCity.group ?? '')}</span></div>
              <div className="mp-property-card-price"><small>{copy(language, '매입 가격', 'Precio')}</small><b>{moneyText(num(selectedCity.price), language)}</b></div>
              <div className="mp-property-card-rents" aria-label={copy(language, '건설 단계별 통행료', 'Renta por nivel')}>
                {rentSteps.map((rent, level) => <span className={num(selectedCity.houses) === level ? 'is-active' : ''} key={level}><small>{level === 0 ? copy(language, '기본', 'Base') : level === 3 ? copy(language, '랜드마크', 'Monumento') : `${level}${copy(language, '단계', ' niv.')}`}</small><b>{moneyText(rent, language)}</b></span>)}
              </div>
            </article>
            {modern && <MarblePropertyLedger tile={selectedCity as any} language={language} economicVersion={num(board.economicVersion)} propertyRulesVersion={num(board.propertyRulesVersion)} multiplier={num(selectedCity.monopolyMultiplier) || 1}/>}
            {landmarkNote && <p className="mp-landmark-note">{landmarkNote}</p>}
            {nextBuildCost !== null && !selectedBuild && <div className="mp-city-upgrade"><b>{copy(language, '다음 건설 단계', 'Siguiente nivel')}</b><span>{copy(language, `비용 ${moneyText(nextBuildCost, language)}`, `Costo ${moneyText(nextBuildCost, language)}`)}</span><span>{copy(language, `건설 후 통행료 ${moneyText(nextRent, language)}`, `Renta después ${moneyText(nextRent, language)}`)}</span><small>{copy(language, '차례와 규칙 조건을 충족할 때', 'Cuando sea tu turno y cumplas las condiciones')}</small></div>}
            {purchaseCost !== null && <div className="mp-city-projection"><b>{copy(language, '구매 예상', 'Compra')}</b><span>{copy(language, `비용 ${moneyText(purchaseCost, language)}`, `Costo ${moneyText(purchaseCost, language)}`)}</span><span>{copy(language, `구매 후 현금 ${moneyText(num(money[playerId]) - purchaseCost, language)}`, `Efectivo después ${moneyText(num(money[playerId]) - purchaseCost, language)}`)}</span></div>}

          </> : <p className="mp-city-special">{specialNames[String(selectedCity.kind ?? '')]?.[language] ?? copy(language, '도시 정보', 'Detalles de la casilla')}{num(selectedCity.price) > 0 ? ` · ${copy(language, ['tax', 'fund-deposit'].includes(String(selectedCity.kind)) ? `납부액 ${moneyText(num(selectedCity.price), language)}` : `비용 ${moneyText(num(selectedCity.price), language)}`, ['tax', 'fund-deposit'].includes(String(selectedCity.kind)) ? `Pago ${moneyText(num(selectedCity.price), language)}` : `Costo ${moneyText(num(selectedCity.price), language)}`)}` : ''}</p>}
        </details>



        {eventLog.length > 0 && <details className="mp-history"><summary>{copy(language, '최근 기록', 'Actividad reciente')} <span>{eventLog.length}</span></summary>          {latestReceipt.title?.[language] && <div className="mp-latest-receipt" role="status"><small>{copy(language, '최근 행동 · 즉시 반영', 'Última acción · actualizada')}</small><b>{latestReceipt.title[language]}</b><span>{latestReceipt.text?.[language]}</span>{typeof latestMoneyReceipt.moneyDelta?.[playerId] === 'number' && <strong>{latestMoneyReceipt !== latestReceipt && latestMoneyReceipt.title?.[language] ? `${latestMoneyReceipt.title[language]} · ` : ''}{copy(language, '내 현금', 'Tu efectivo')} {latestMoneyReceipt.moneyDelta[playerId] > 0 ? '+' : ''}{moneyText(latestMoneyReceipt.moneyDelta[playerId], language)}</strong>}</div>}<ol>{eventLog.slice(-5).reverse().map((event: any) => <li key={num(event.sequence)}><span>{String(record(event.title)[language] ?? '')}</span><small>{String(record(event.text)[language] ?? '')}</small></li>)}</ol></details>}

        <details className="mp-portfolio"><summary>{copy(language, '보유 도시', 'Ciudades adquiridas')} <span>{players.reduce((total,seat) => total + ownedBy(seat).length, 0)}</span></summary>
          {players.map(seat => <div className="mp-portfolio-seat" key={seat} data-marble-owner={seat}><h4>{seatLabel(seat)} · {ownedBy(seat).length}</h4>{ownedBy(seat).length ? <ul>{ownedBy(seat).map(({ tile, index }) => { const title = String(record(tile.name)[language] ?? ''), art = cityArtNames[String(record(tile.name).ko ?? '')]; return <li key={index}><button className="mp-portfolio-city" type="button" aria-pressed={selectedTile === index} aria-label={copy(language, `${title} 도시 카드 열기`, `Abrir tarjeta de ${title}`)} onClick={() => inspectTile(index)}>{art && <MarblePropertyArt routeVersion={num(board.cityRouteVersion)} language={language} city={art} level={modern ? num(tile.houses) : 0} owner={seat} ownerLabel={seatLabel(seat)}/>}<span><b>{title}</b><small>{groups[String(tile.group)]?.[language] ?? String(tile.group ?? '')}</small></span></button><span className="mp-portfolio-level">{buildingName(num(tile.houses), language, modern) || copy(language, `임대 ${rentValue(tile, modern)}`, `Renta ${rentValue(tile, modern)}`)}</span>{buildActions.some(choice => num(choice.action.payload?.tile) === index) && <button type="button" aria-label={copy(language, `${title} 건설 선택`, `Seleccionar mejora de ${title}`)} onClick={() => inspectTile(index)}>{copy(language, '개선', 'Mejorar')}</button>}</li>; })}</ul> : <p>{copy(language, '아직 보유한 도시가 없어요.', 'Todavía no hay ciudades.')}</p>}</div>)}
        </details>
      </aside>
    </div>
    {view.result && <Result view={view} playerId={playerId} language={language} modern={modern} netWorth={num(board.economicVersion) >= 1} outcome={outcome}/>}
  </section>;
}

function TrainChooser({ choices, language, runAction, eventCity = false }: { choices: Choice[]; language: Language; runAction: Props['runAction']; eventCity?: boolean }) {
  const [selected, setSelected] = useState('0');
  const index = Math.min(Math.max(0, Number(selected)), choices.length - 1);
  const choice = choices[index];
  return <div className="mp-train-chooser"><label htmlFor="mp-train-destination">{eventCity ? copy(language, '효과를 적용할 도시', 'Ciudad para el efecto') : copy(language, '목적지', 'Destino')}</label><select id="mp-train-destination" value={selected} onChange={event => setSelected(event.target.value)}>{choices.map((item, i) => <option key={`${item.action.payload?.destination ?? i}`} value={String(i)}>{item.label[language]}</option>)}</select><button className="mp-action mp-action-primary" type="button" onClick={() => choice && void runAction(choice.action)}>{eventCity ? copy(language, '이 도시에 적용', 'Aplicar a esta ciudad') : copy(language, '이곳으로 이동', 'Viajar a este lugar')}</button></div>;
}

function Result({ view, playerId, language, modern, netWorth, outcome }: { view: any; playerId: PlayerId; language: Language; modern: boolean; netWorth: boolean; outcome: string }) {
  const scores = record(view.result?.scores);
  const reason = String(view.result?.reason ?? '');
  const detail = reason.includes('asset turn limit') || reason.includes('turn limit')
    ? copy(language, '120번째 차례에 정한 자산 기준으로 승패가 정해졌어요.', 'Al llegar al turno 120, el total de activos decidió la partida.')
    : reason.includes('insolvent') ? copy(language, '결제할 수 없는 금액이 남아 파산했어요.', 'La partida terminó por una deuda que no se pudo pagar.')
      : copy(language, '모든 자산을 계산해 경기 결과를 정했어요.', 'El resultado se calculó con los activos finales.');
  const scoreLabel = modern ? netWorth ? copy(language, '순자산', 'Patrimonio neto') : copy(language, '총 자산', 'Activos totales') : copy(language, '현금', 'Efectivo');
  return <section className={`mp-result is-${outcome}`} data-outcome={outcome} data-game="marble" role="status"><div><h3>{outcome === 'win' ? copy(language, '이겼어요!', '¡Ganaste!') : outcome === 'draw' ? copy(language, '비겼어요', 'Empate') : copy(language, '상대가 이겼어요', 'Ganó tu pareja')}</h3><p>{detail}</p></div><div className="mp-result-scores">{(['p1', 'p2'] as const).map(seat => <span key={seat}><small>{seat === playerId ? copy(language, '나', 'Tú') : copy(language, '상대', 'Tu pareja')}</small><b>{moneyText(num(scores[seat]), language)}</b></span>)}</div><small>{scoreLabel}</small></section>;
}

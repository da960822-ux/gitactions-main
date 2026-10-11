import { MarblePropertyArt } from './MarblePropertyArt';
import dioramas from '../../public/images/marble/dioramas/manifest.json';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { GameAction, Language, PlayerId } from '../core/types';
import { GameValue } from './GameValue';
import { MarbleEventStage } from './MarbleEventStage';
import { MarblePawn, MarblePawnPicker, marblePawnCatalog, type MarblePawnId } from './MarblePawn';
import { marbleGridPosition, marbleMovementPath, type MarbleMoveEvent } from './marble-motion';
import '../styles/marble-premium.css';

type Choice = { label: Record<Language, string>; action: GameAction };
type Seat = PlayerId;
type Props = { view: any; language: Language; playerId: PlayerId; runAction: (action: GameAction) => void | Promise<unknown> };
const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
const record = (value: unknown): Record<string, any> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
const list = (value: unknown): any[] => Array.isArray(value) ? value : [];
const num = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const seatName = (seat: Seat, playerId: PlayerId, language: Language) => seat === playerId ? copy(language, '나', 'Tú') : copy(language, '상대', 'Tu pareja');
const moneyText = (value: number, language: Language) => value.toLocaleString(language === 'ko' ? 'ko-KR' : 'es-DO');

const groups: Record<string, Record<Language, string>> = {
  green: { ko: '숲', es: 'Bosque' }, blue: { ko: '바다', es: 'Mar' }, purple: { ko: '보랏빛', es: 'Violeta' }, orange: { ko: '노을', es: 'Atardecer' },
  red: { ko: '정원', es: 'Jardín' }, yellow: { ko: '햇살', es: 'Sol' }, teal: { ko: '청록', es: 'Turquesa' }, dark: { ko: '밤', es: 'Noche' },
  pink: { ko: '분홍', es: 'Rosado' }, brown: { ko: '대지', es: 'Tierra' }, gold: { ko: '금빛', es: 'Dorado' }, silver: { ko: '은빛', es: 'Plateado' },
};
const specialNames: Record<string, Record<Language, string>> = {
  start: { ko: '출발', es: 'Salida' }, tax: { ko: '세금', es: 'Impuesto' }, rest: { ko: '휴식', es: 'Descanso' }, event: { ko: '황금 열쇠', es: 'Llave dorada' },
  island: { ko: '무인도', es: 'Isla desierta' }, train: { ko: '열차역', es: 'Estación de tren' }, fund: { ko: '사회복지기금', es: 'Fondo social' }, 'fund-deposit': { ko: '기금 납부', es: 'Aporte al fondo' },
};
const cityArtNames: Record<string, string> = {
  베를린: 'berlin', 'Berlín': 'berlin', 마이애미: 'miami', Miami: 'miami', 이스탄불: 'istanbul', Estambul: 'istanbul', 아그라: 'agra', Agra: 'agra', 아테네: 'athens', Atenas: 'athens', 시드니: 'sydney', 'Sídney': 'sydney',
  광주: 'gwangju', Gwangju: 'gwangju', 산토도밍고: 'santo-domingo', 'Santo Domingo': 'santo-domingo', 마드리드: 'madrid', Madrid: 'madrid', 산티아고: 'santiago', Santiago: 'santiago',
  푸에르토플라타: 'puerto-plata', 'Puerto Plata': 'puerto-plata', 산후안: 'san-juan', 'San Juan': 'san-juan', 라베가: 'la-vega', 'La Vega': 'la-vega', 푼타카나: 'punta-cana', 'Punta Cana': 'punta-cana',
  뉴욕: 'new-york', 'Nueva York': 'new-york', 파리: 'paris', 'París': 'paris', 도쿄: 'tokyo', Tokio: 'tokyo', 바르셀로나: 'barcelona', Barcelona: 'barcelona', 사마나: 'samana', 'Samaná': 'samana',
  아바나: 'havana', 'La Habana': 'havana', 멕시코시티: 'mexico-city', 'Ciudad de México': 'mexico-city', 리스본: 'lisbon', Lisboa: 'lisbon', 런던: 'london', Londres: 'london', 로마: 'rome', Roma: 'rome',
  뉴어크: 'newark', Newark: 'newark', 서울: 'seoul', 'Seúl': 'seoul', 발파라이소: 'valparaiso', 'Valparaíso': 'valparaiso', 세부: 'cebu', Cebú: 'cebu', 토론토: 'toronto', Toronto: 'toronto', 오클랜드: 'auckland', Auckland: 'auckland', 밴쿠버: 'vancouver', Vancouver: 'vancouver',
};

function cityFlag(names: Record<string, unknown>): string | null {
  const known: Record<string, string> = {
    광주: 'kr', Gwangju: 'kr', 산토도밍고: 'do', 'Santo Domingo': 'do', 마드리드: 'es', Madrid: 'es', 산티아고: 'do', Santiago: 'do',
    푸에르토플라타: 'do', 'Puerto Plata': 'do', 산후안: 'pr', 'San Juan': 'pr', 라베가: 'do', 'La Vega': 'do', 푼타카나: 'do', 'Punta Cana': 'do',
    뉴욕: 'us', 'Nueva York': 'us', 파리: 'fr', 'París': 'fr', 도쿄: 'jp', Tokio: 'jp', 바르셀로나: 'es', Barcelona: 'es', 사마나: 'do', 'Samaná': 'do',
    아바나: 'cu', 'La Habana': 'cu', 멕시코시티: 'mx', 'Ciudad de México': 'mx', 리스본: 'pt', Lisboa: 'pt', 런던: 'gb', Londres: 'gb', 로마: 'it', Roma: 'it',
    뉴어크: 'us', Newark: 'us', 서울: 'kr', 'Seúl': 'kr', 마이애미: 'us', Miami: 'us', 발파라이소: 'cl', 'Valparaíso': 'cl', 세부: 'ph', Cebú: 'ph', 토론토: 'ca', Toronto: 'ca', 오클랜드: 'nz', Auckland: 'nz', 밴쿠버: 'ca', Vancouver: 'ca',
  };
  for (const name of Object.values(names)) if (typeof name === 'string' && known[name]) return known[name];
  return null;
}

function pawnId(value: unknown): MarblePawnId | null {
  return marblePawnCatalog.some(item => item.id === value) ? value as MarblePawnId : null;
}
function buildingName(level: number, language: Language, modern: boolean) {
  if (modern) return level >= 3 ? copy(language, '랜드마크', 'Monumento') : level === 2 ? copy(language, '아파트', 'Apartamentos') : level === 1 ? copy(language, '단독주택', 'Casa unifamiliar') : '';
  return level ? copy(language, '집', 'Casa') : '';
}
function rentValue(tile: Record<string, any>, modern: boolean) {
  const level = num(tile.houses);
  return num(tile.rent) * (modern ? ([1, 2, 4, 8][level] ?? 1) : level + 1);
}
function phaseName(phase: string, language: Language) {
  const phases: Record<string, Record<Language, string>> = {
    roll: { ko: '주사위 굴릴 차례', es: 'Lanza los dados' }, decision: { ko: '도시 구매 결정', es: 'Decide si compras' }, main: { ko: '차례 마무리', es: 'Termina tu turno' },
    island: { ko: '무인도에서 나가기', es: 'Salir de la isla' }, 'train-decision': { ko: '열차 목적지 선택', es: 'Elige tu destino en tren' }, debt: { ko: '결제 방법 선택', es: 'Resuelve el pago' }, 'event-decision': { ko: '카드 효과를 적용할 도시 선택', es: 'Elige una ciudad para la carta' }, 'rent-decision': { ko: '통행료 결제 선택', es: 'Elige cómo pagar la renta' }, finished: { ko: '경기 종료', es: 'Partida terminada' },
  };
  return phases[phase]?.[language] ?? copy(language, '게임 현황', 'Estado de la partida');
}
function moneyLabel(value: unknown, language: Language) { return moneyText(num(value), language); }

function Die({ value, language }: { value: number; language: Language }) {
  const dots: Record<number, string[]> = { 1: ['m'], 2: ['tl', 'br'], 3: ['tl', 'm', 'br'], 4: ['tl', 'tr', 'bl', 'br'], 5: ['tl', 'tr', 'm', 'bl', 'br'], 6: ['tl', 'ml', 'bl', 'tr', 'mr', 'br'] };
  return <span className={`mp-die ${value ? 'has-value' : ''}`} role="img" aria-label={value ? String(value) : copy(language, '아직 굴리지 않음', 'Sin lanzar')}>
    <svg viewBox="0 0 48 48" aria-hidden="true"><rect x="3" y="3" width="42" height="42" rx="12"/>{(dots[value] ?? []).map(point => <circle key={point} cx={point.includes('l') ? 15 : point.includes('r') ? 33 : 24} cy={point.includes('t') ? 15 : point.includes('b') ? 33 : 24} r="3.1"/>)}</svg>
  </span>;
}

function ImpactText({ tile, language }: { tile: Record<string, any>; language: Language }) {
  const kind = String(tile.kind ?? '');
  const name = String(record(tile.name)[language] ?? record(tile.name).ko ?? '');
  if (kind === 'property') return <><b>{name}</b><span>{copy(language, `구매 ${num(tile.price)} · 기본 통행료 ${num(tile.rent)}`, `Compra ${num(tile.price)} · renta ${num(tile.rent)}`)}</span></>;
  const amount = num(tile.price);
  return <><b>{name || specialNames[kind]?.[language]}</b><span>{specialNames[kind]?.[language] ?? ''}{amount > 0 && ['tax', 'fund-deposit'].includes(kind) ? ` · ${copy(language, `납부 ${moneyText(amount, language)}`, `Pago ${moneyText(amount, language)}`)}` : ''}</span></>;
}

export default function MarbleBoard({ view: rawView, language, playerId, runAction }: Props) {
  const view = record(rawView), board = record(view.board), tiles = list(board.tiles), choices: Choice[] = list(view.actions);
  const modern = tiles.length === 40 || num(board.version) >= 2;
  const isLegacy = tiles.length === 18;
  const positions = record(board.positions), money = record(board.money), assets = record(board.assets), debt = record(board.debt);
  const active = board.turn === playerId && view.status !== 'finished';
  const actionsOf = (type: string) => choices.filter(choice => choice.action?.type === type);
  const actionOf = (type: string) => actionsOf(type)[0];
  const pawnChoices = actionsOf('choose-pawn');
  const roll = actionOf('roll'), buy = actionOf('buy'), decline = actionOf('decline'), endTurn = actionOf('endTurn');
  const buildActions = actionsOf('build'), trainActions = actionsOf('choose-train'), eventCityActions = actionsOf('choose-event-city');
  const handled = new Set(['roll', 'buy', 'decline', 'endTurn', 'build', 'choose-train', 'choose-pawn', 'borrow', 'repay', 'declare-bankruptcy', 'attempt-doubles', 'pay-escape', 'use-escape-pass', 'skip-train', 'choose-event-city', 'pay-rent', 'use-rent-pass']);
  const otherActions = choices.filter(choice => !handled.has(String(choice.action?.type)));
  const pos = Number.isInteger(positions[playerId]) ? num(positions[playerId]) : 0;
  const [selectedTile, setSelectedTile] = useState(pos);
  const selectedCity = tiles[selectedTile] ?? {};
  const selectedName = String(record(selectedCity.name)[language] ?? record(selectedCity.name).ko ?? '');
  const selectedCityArt = cityArtNames[selectedName] ?? null;
  const landmarkNote = num(board.cityRouteVersion) >= 3 ? dioramas.assets.find(asset => asset.slug === selectedCityArt)?.note?.[language] : null;
  const selectedOwner = selectedCity.owner === 'p1' || selectedCity.owner === 'p2' ? selectedCity.owner as Seat : null;
  const selectedBuild = actionsOf('build').find(choice => num(choice.action.payload?.tile) === selectedTile);
  const selectedIsAction = selectedTile === pos;
  const purchaseCost = selectedIsAction && selectedCity.kind === 'property' && buy ? num(selectedCity.price) : null;
  const buildCostMatch = selectedBuild?.label[language].match(/\(([\d,]+)\)\s*$/);
  const buildCost = selectedBuild ? selectedCity.nextBuildCost != null ? num(selectedCity.nextBuildCost) : buildCostMatch ? Number(buildCostMatch[1].replaceAll(',', '')) : null : null;
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
  const [confirmBankruptcy, setConfirmBankruptcy] = useState(false);
  const previous = useRef<{ positions: Record<Seat, number>; move: number; action: number; dice: number; phase: string } | null>(null);
  const previousProperties = useRef<string | null>(null);
  const [changedProperties, setChangedProperties] = useState<number[]>([]);
  const propertySignature = tiles.map(tile => `${tile.owner ?? ''}:${num(tile.houses)}`).join('|');
  const ownedBy = (seat: Seat) => tiles.map((tile, index) => ({ tile, index })).filter(({ tile }) => tile.kind === 'property' && tile.owner === seat);
  const pendingPayment = record(board.pendingPayment);
  const phase = String(view.phase ?? 'roll');
  const players = (['p1', 'p2'] as const);
  const fund = num(board.fundPool);
  const islandRemaining = num(record(board.islandTurns)[playerId]);
  const escapePassCount = num(record(board.escapePasses)[playerId]);
  const turns = Math.min(num(board.turns), 120);
  const currentTurn = Math.max(1, Math.min(120, turns + 1));
  const latestReceipt = record(stageEvents.at(-1));
  const receiptBoundary = stageEvents.map(event => event.type).map(type => type === 'turn' || type === 'roll').lastIndexOf(true);
  const latestMoneyReceipt = record(stageEvents.slice(Math.max(0, receiptBoundary)).filter(event => typeof event.moneyDelta?.[playerId] === 'number' && event.moneyDelta[playerId] !== 0).at(-1));
  const run = (choice?: Choice) => choice && void runAction(choice.action);
  const layoutRef = useRef<HTMLDivElement>(null);

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
    let pulseTimer: number | null = null;
    const next = { positions: { p1: num(positions.p1), p2: num(positions.p2) }, move: lastMoveSequence, action: actionSequence, dice: diceSequence, phase };
    const before = previous.current;
    previous.current = next;
    if (!before) return;
    if (before.dice !== diceSequence && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDiceRolling(true);
      pulseTimer = window.setTimeout(() => setDiceRolling(false), 620);
      if (before.move === lastMoveSequence && before.positions.p1 === next.positions.p1 && before.positions.p2 === next.positions.p2) return () => { if (pulseTimer !== null) window.clearTimeout(pulseTimer); };
    }
    const freshEvents = eventLog.filter(event => num(event.sequence) > before.action).sort((a, b) => num(a.sequence) - num(b.sequence));
    const moveEvents = freshEvents.filter(event => event.type === 'move' && (event.actor === 'p1' || event.actor === 'p2'));
    const seat = moveEvents.length ? moveEvents[0].actor as Seat : players.find(player => before.positions[player] !== next.positions[player]);
    if (!seat || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setTraveler(null); return () => { if (pulseTimer !== null) window.clearTimeout(pulseTimer); }; }
    const size = tiles.length || 18;
    const diceSteps = rollValues.reduce((sum, value) => sum + value, 0);
    const path: number[] = [];
    let cursor = before.positions[seat];
    for (const event of moveEvents.filter(item => item.actor === seat)) {
      const from = Number.isInteger(event.from) ? num(event.from) : cursor;
      const to = Number.isInteger(event.to) ? num(event.to) : next.positions[seat];
      if (from !== cursor) {
        const gap = (from - cursor + size) % size;
        for (let step = 1; step <= gap; step += 1) path.push((cursor + step) % size);
      }
      const steps = Number.isFinite(Number(event.steps)) ? Number(event.steps) : (to - from + size) % size;
      for (let step = 1; step <= Math.min(Math.abs(steps), size); step += 1) path.push(((from + Math.sign(steps) * step) % size + size) % size);
      cursor = to;
    }
    if (!path.length && (lastMoveSequence > before.move || before.positions[seat] !== next.positions[seat])) {
      const moveEvent: MarbleMoveEvent | null = lastMoveSequence > before.move ? { sequence: lastMoveSequence, playerId: String(lastMove.playerId), effect: String(lastMove.source ?? 'move'), from: Number.isInteger(lastMove.from) ? num(lastMove.from) : before.positions[seat], to: Number.isInteger(lastMove.to) ? num(lastMove.to) : next.positions[seat], steps: Number.isInteger(lastMove.steps) ? num(lastMove.steps) : null } : null;
      path.push(...marbleMovementPath(before.positions[seat], next.positions[seat], diceSteps, moveEvent, Boolean(moveEvent), seat, size));
    }
    if (path.length && path.at(-1) !== next.positions[seat]) {
      const gap = (next.positions[seat] - (path.at(-1) ?? before.positions[seat]) + size) % size;
      for (let step = 1; step <= gap; step += 1) path.push(((path.at(-1) ?? before.positions[seat]) + step) % size);
    }
    if (!path.length) return;
    const sequence = lastMoveSequence || diceSequence || turns;
    setTraveler({ seat, tile: path[0], seq: sequence });
    const timers = path.map((tile, index) => window.setTimeout(() => setTraveler(index === path.length - 1 ? null : { seat, tile: path[index + 1], seq: sequence }), 58 * (index + 1)));
    return () => { timers.forEach(window.clearTimeout); if (pulseTimer !== null) window.clearTimeout(pulseTimer); };
  }, [positions.p1, positions.p2, lastMoveSequence, lastMove.from, lastMove.to, lastMove.steps, lastMove.source, lastMove.playerId, diceSequence, actionSequence, phase, propertySignature]);

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
  const monopolyLabels = list(record(board.monopolies)[playerId]).map(group => groups[String(group)]?.[language] ?? String(group));
  const tileKind = String(currentTile.kind ?? '');
  const ownerName = currentTile.owner === 'p1' || currentTile.owner === 'p2' ? seatName(currentTile.owner, playerId, language) : null;
  const statusCopy = view.result ? copy(language, '경기가 끝났어요', 'Partida terminada') : active ? copy(language, '내 차례', 'Tu turno') : copy(language, '상대 차례', 'Turno de tu pareja');
  const scoreLabel = modern ? num(board.economicVersion) >= 1 ? copy(language, '순자산', 'Patrimonio neto') : copy(language, '총 자산', 'Activos totales') : copy(language, '현금', 'Efectivo');
  const outcome = view.result?.winner === 'draw' ? 'draw' : view.result?.winner === playerId ? 'win' : view.result ? 'lose' : '';

  return <section className={`marble-premium ${isLegacy ? 'is-legacy' : 'is-modern'}`} aria-label={copy(language, '부루마블 경기판', 'Tablero de Marble')}>
    <header className="mp-header"><div className="mp-brand"><h2>{copy(language, '부루마블', 'Marble')}</h2><p>{copy(language, '도시를 사고, 임대료를 모아 세계를 여행해요.', 'Compra ciudades, cobra rentas y recorre el mundo.')}</p></div><div className={`mp-turn-badge ${active ? 'is-active' : ''}`}><span className="mp-turn-gem" aria-hidden="true"/><b>{statusCopy}</b><span>{phaseLabel}</span></div></header>

    <div className="mp-layout" ref={layoutRef}>
      <section className="mp-board-panel" aria-label={copy(language, `${tiles.length}칸 순환 보드`, `Tablero de ${tiles.length} casillas`)}>
        <div className={`mp-board-grid ${isLegacy ? 'mp-board-grid--18' : 'mp-board-grid--40'}`} role="list" aria-label={copy(language, `총 ${tiles.length}칸 보드`, `Recorrido de ${tiles.length} casillas`)}>
          {tiles.map((tile, index) => {
            const kind = String(tile.kind ?? 'rest'), name = String(record(tile.name)[language] ?? record(tile.name).ko ?? ''), group = String(tile.group ?? '');
            const position = marbleGridPosition(index, tiles.length);
            const atSeats = players.filter(seat => num(positions[seat]) === index);
            const movingSeat = traveler?.tile === index ? traveler.seat : null;
            const seats = atSeats.filter(seat => traveler?.seat !== seat);
            if (!position) return null;
            const tileOwner = tile.owner === 'p1' || tile.owner === 'p2' ? tile.owner as Seat : null;
            const edge = tiles.length === 40 ? (position[1] === 1 || position[1] === 11 ? 'mp-tile--horizontal' : position[0] === 1 ? 'mp-tile--west' : 'mp-tile--east') : '';
            const isKey = modern && [2, 7, 12, 18, 27, 34].includes(index);
            const tileSymbol = isKey || kind === 'event' ? 'key' : kind === 'fund-deposit' ? 'fund-pay' : kind;
            const flag = kind === 'property' ? cityFlag(record(tile.name)) : null;
            const building = buildingName(num(tile.houses), language, modern);
            const aria = kind === 'property'
              ? `${name}, ${tileOwner ? copy(language, `소유자 ${seatName(tileOwner, playerId, language)}`, `Dueño ${seatName(tileOwner, playerId, language)}`) : copy(language, '미소유', 'Sin dueño')}, ${copy(language, `매입 ${num(tile.price)}, 임대 ${rentValue(tile, modern)}`, `compra ${num(tile.price)}, renta ${rentValue(tile, modern)}`)}${building ? `, ${building}` : ''}${record(tile.rentModifiers).festival ? copy(language, ', 도시 축제: 다음 상대 방문 통행료 2배, 1회', ', Festival: próxima visita rival, renta doble, un uso') : ''}${record(tile.rentModifiers).blackout ? copy(language, ', 정전: 다음 카드 소유자 방문 통행료 절반, 1회', ', Apagón: próxima visita del titular, media renta, un uso') : ''}`
              : `${name}, ${specialNames[kind]?.[language] ?? ''}`;
            return <article className={`mp-tile ${edge} mp-kind-${kind} ${isKey ? 'is-key' : ''} ${group ? `mp-group-${group}` : ''} ${tileOwner ? `is-owned-${tileOwner}` : ''} ${atSeats.length || movingSeat ? 'has-player' : ''} ${movingSeat ? 'is-moving' : ''} ${changedProperties.includes(index) ? 'is-changed' : ''} ${pos === index && phase === 'decision' ? 'is-pending' : ''} ${selectedTile === index ? 'is-selected' : ''}`} style={{ gridColumn: position[0], gridRow: position[1] } as CSSProperties} role="listitem" aria-label={aria} key={tile.index ?? index}>
              <div className="mp-tile-content">
                <div className="mp-tile-top"><span>{String(index + 1).padStart(2, '0')}</span>{flag && <img src={`/images/marble/flags/${flag}.svg`} alt="" aria-hidden="true" loading="lazy" decoding="async"/>}{tileOwner && <b className={`mp-owner mp-owner-${tileOwner}`}>{seatName(tileOwner, playerId, language)}</b>}</div>
                {kind === 'property' ? <div className="mp-property-tile-view">
                  {cityArtNames[name] && <MarblePropertyArt routeVersion={num(board.cityRouteVersion)} language={language} className="mp-property-tile-art" city={cityArtNames[name]} level={modern ? num(tile.houses) : 0}/>}
                  <div className="mp-property-tile-copy"><strong className="mp-tile-name">{name}</strong><small className="mp-tile-economy"><b>{moneyText(num(tile.price), language)}</b><span>{copy(language, `임대 ${moneyText(rentValue(tile, modern), language)}`, `Renta ${moneyText(rentValue(tile, modern), language)}`)}</span></small></div>
                  {num(tile.houses) > 0 && modern && <span className="mp-building-badge" aria-label={building}>{num(tile.houses) >= 3 ? '★' : num(tile.houses)}</span>}
                </div> : <><strong className="mp-tile-name">{name}</strong>{['start', 'key', 'island', 'train', 'rest', 'fund', 'fund-pay', 'tax'].includes(tileSymbol) && <svg className="mp-tile-symbol" aria-hidden="true" viewBox="0 0 32 32"><use href={`/images/marble/tile-symbols.svg#${tileSymbol}`}/></svg>}<small className="mp-tile-kind">{specialNames[kind]?.[language] ?? ''}{['tax', 'fund-deposit'].includes(kind) && num(tile.price) ? ` · ${copy(language, `납부 ${moneyText(num(tile.price), language)}`, `Pago ${moneyText(num(tile.price), language)}`)}` : ''}</small></>}
              </div>
              {['festival', 'blackout'].filter(effect => record(tile.rentModifiers)[effect]).map(effect => <span className="mp-city-effect" key={effect} title={effect === 'festival' ? copy(language, '도시 축제 · 다음 상대 방문 통행료 2배 · 1회', 'Festival · próxima visita rival: renta doble · un uso') : copy(language, '정전 · 다음 카드 소유자 방문 통행료 절반 · 1회', 'Apagón · próxima visita del titular: media renta · un uso')}><svg viewBox="0 0 128 128" aria-hidden="true"><use href={`/images/marble/golden-key-cards.svg#${effect === 'festival' ? 'city-festival' : 'blackout'}-mark`}/></svg><span>{effect === 'festival' ? '×2' : '½'}</span></span>)}
              {(seats.length > 0 || movingSeat) && <div className="mp-pawns" aria-label={copy(language, '이 칸의 말', 'Fichas en esta casilla')}>
                {seats.map(seat => { const id = pawnId(record(board.pawns)[seat]) ?? (seat === 'p1' ? 'fox' : 'cat'); return <span className={`mp-pawn-marker ${seat === playerId ? 'is-you' : ''}`} key={seat} title={seatName(seat, playerId, language)}><MarblePawn pawn={id} language={language} label={seatName(seat, playerId, language)}/></span>; })}
                {movingSeat && <span className={`mp-pawn-marker is-moving-pawn ${movingSeat === playerId ? 'is-you' : ''}`} key={`${movingSeat}-${traveler?.seq}`}><MarblePawn pawn={pawnId(record(board.pawns)[movingSeat]) ?? (movingSeat === 'p1' ? 'fox' : 'cat')} language={language} label={seatName(movingSeat, playerId, language)}/></span>}
              </div>}
              <button className="mp-tile-select" type="button" aria-label={copy(language, `선택 ${aria}`, `Seleccionar ${aria}`)} aria-pressed={selectedTile === index} onClick={() => setSelectedTile(index)}/>
            </article>;
          })}
          <div className={`mp-board-center ${isLegacy ? 'mp-board-center--18' : ''}`}>
            {tiles.length === 40 && <img className="mp-world-map" src="/images/marble/world-map-board.webp" alt="" aria-hidden="true" decoding="async"/>}
            <div className="mp-center-route">{num(board.cityRouteVersion) >= 2 ? <span>{copy(language, '광주 → 뉴욕 → 산토도밍고 → 뉴어크 → 서울 → 광주', 'Gwangju → Nueva York → Santo Domingo → Newark → Seúl → Gwangju')}</span> : <><span>{copy(language, '광주 출발', 'Desde Gwangju')}</span><span className="mp-route-line" aria-hidden="true">↗</span><span>{copy(language, '세계 여행', 'Viaje mundial')}</span></>}</div>
            <div className="mp-map-hud"><span>{copy(language, '턴', 'Turno')} <b>{currentTurn} / 120</b></span>{modern && <span>{copy(language, '공동 기금', 'Fondo común')} <b>{moneyText(fund, language)}</b></span>}</div>
            {modern && selectedCityArt && <figure className="mp-city-preview" aria-label={copy(language, `${selectedName} 건물 미리보기`, `Vista del edificio de ${selectedName}`)}>
              <MarblePropertyArt routeVersion={num(board.cityRouteVersion)} language={language} city={selectedCityArt} level={num(selectedCity.houses) || 3}/>
              <figcaption><b>{selectedName}</b><span>{num(selectedCity.houses) ? buildingName(num(selectedCity.houses), language, true) : copy(language, '랜드마크 미리보기 · 미건설', 'Vista del monumento · sin construir')}</span></figcaption>
            </figure>}
            {lastMove.source === 'train' && lastMove.from === 30 && <div className={`mp-flight ${traveler?.seq === lastMoveSequence ? 'is-flying' : ''}`} style={{ color: lastMove.playerId === 'p1' ? '#a54e69' : '#356896' } as CSSProperties}>
              <svg viewBox="0 0 160 100" aria-hidden="true"><ellipse cx="80" cy="86" rx="47" ry="5" fill="#344c59" opacity=".12"/><g stroke="#344c59" strokeWidth="2" strokeLinejoin="round"><path d="m72 44 19-35 12 1-12 38 36 7 16 12-9 6-42-12-17 23-11-2 8-27-45-6-14-9 7-5z" fill="#fff8e7"/><path d="m27 43-15-22 11 1 19 21z" fill="currentColor"/><path d="m76 44 15-35 12 1-12 38zM89 61 75 84l-11-2 8-27z" fill="currentColor"/><path d="m114 55 13 2 8 8-15-1z" fill="#8db9c8"/></g></svg>
              <span><b>{lastMove.playerId === 'p1' ? 'Asiana' : 'JetBlue'}</b> · {copy(language, '둘의 상상 여행', 'Nuestro viaje imaginado')}</span>
              <small>{String(record(tiles[num(lastMove.to)]?.name)[language] ?? '')}</small>
            </div>}
          </div>
        </div>

      </section>

      <aside className="mp-dashboard" aria-label={copy(language, '게임 현황과 행동', 'Estado y acciones')}>
        <section className="mp-scoreboard" aria-label={copy(language, '현금과 총 자산', 'Efectivo y activos totales')}>
          {players.map(seat => {
            const own = ownedBy(seat), playerDebt = num(debt[seat]), playerAssets = num(assets[seat]);
            const landmarkCount = modern ? own.filter(({ tile }) => num(tile.houses) >= 3).length : 0;
            const groupsOwned = list(record(board.monopolies)[seat]);
            const pawn = pawnId(record(board.pawns)[seat]) ?? (seat === 'p1' ? 'fox' : 'cat');
            return <div className={`mp-player ${seat === playerId ? 'is-you' : ''} ${board.turn === seat ? 'is-turn' : ''}`} key={seat}>
              <div className="mp-player-name"><MarblePawn pawn={pawn} language={language} label={seatName(seat, playerId, language)}/><b>{seatName(seat, playerId, language)}</b>{board.turn === seat && <span>{copy(language, '차례', 'Turno')}</span>}</div>
              <div className="mp-player-value"><small>{copy(language, '현금', 'Efectivo')}</small><b><GameValue value={num(money[seat])} resetKey={`${playerId}:marble:cash:${seat}`} format={value => moneyText(value, language)}/></b></div>
              <div className="mp-player-value"><small>{scoreLabel}</small><b><GameValue value={playerAssets} resetKey={`${playerId}:marble:assets:${seat}`} format={value => moneyText(value, language)}/></b></div>
              {num(record(board.rentPasses)[seat]) > 0 && <span className="mp-held-rent-pass"><svg viewBox="0 0 128 128" aria-hidden="true"><use href="/images/marble/golden-key-cards.svg#rent-pass-mark"/></svg>{copy(language, `통행료 면제권 ${num(record(board.rentPasses)[seat])}장`, `Pases de renta ${num(record(board.rentPasses)[seat])}`)}</span>}
              {(playerDebt > 0 || own.length > 0 || groupsOwned.length > 0) && <div className="mp-player-meta">{playerDebt > 0 && <span className="has-debt">{copy(language, `대출 ${moneyText(playerDebt, language)}`, `Préstamo ${moneyText(playerDebt, language)}`)}</span>}{own.length > 0 && <span>{copy(language, `도시 ${own.length}`, `Ciudades ${own.length}`)}</span>}{landmarkCount > 0 && <span>{copy(language, `랜드마크 ${landmarkCount}`, `Monumentos ${landmarkCount}`)}</span>}{groupsOwned.length > 0 && <span>{copy(language, `완성 그룹 ${groupsOwned.length}`, `Grupos completos ${groupsOwned.length}`)}</span>}</div>}
            </div>;
          })}
        </section>

        {pawnChoices.length > 0 && <section className="mp-pawn-picker-shell" aria-label={copy(language, '말 선택', 'Elige tu ficha')}><MarblePawnPicker view={view} playerId={playerId} language={language} runAction={runAction}/></section>}

        <section className="mp-turn-panel" aria-label={copy(language, '주사위와 행동', 'Dados y acciones')}>
          <div className="mp-phase-title"><h3>{phaseLabel}</h3><span>{copy(language, `턴 ${currentTurn}`, `Turno ${currentTurn}`)} / 120</span></div>
          <div className={`mp-dice-row ${diceRolling ? 'is-rolling' : ''}`} aria-label={copy(language, '최근 주사위 결과', 'Último resultado de los dados')}>
            {[0, 1].map(index => <Die key={`${diceSequence}-${index}`} value={rollValues[index] ?? 0} language={language}/>)}
            {rollValues.length >= 2 && <b className="mp-dice-total">{rollValues[0] + rollValues[1]}</b>}
          </div>
          <div className="mp-current-tile" aria-live="polite"><span className="mp-current-flag">{cityFlag(record(currentTile.name)) && <img src={`/images/marble/flags/${cityFlag(record(currentTile.name))}.svg`} alt="" loading="lazy" decoding="async"/>}</span><div><small>{copy(language, '도착 및 행동 위치', 'Ubicación de llegada y acción')}</small><ImpactText tile={currentTile} language={language}/></div>{ownerName && <b className="mp-current-owner">{ownerName}</b>}</div>
          {active && phase === 'decision' && <p className="mp-decision-help">{copy(language, '이 도시에 도착했어요. 구매하거나 지나갈 수 있어요.', 'Llegaste a esta ciudad. Puedes comprarla o continuar.')}</p>}
          {active && phase === 'island' && <p className="mp-island-help">{copy(language, `무인도에 있어요 · 남은 차례 ${islandRemaining}. 쌍이 나오면 나가고, 100을 내거나 탈출권을 쓸 수 있어요${escapePassCount ? ` (탈출권 ${escapePassCount}장 보유)` : ''}.`, `Estás en la isla · ${islandRemaining} turnos pendientes. Puedes intentar sacar dobles, pagar 100 o usar un pase${escapePassCount ? ` (tienes ${escapePassCount})` : ''}.`)}</p>}
          {active && phase === 'train-decision' && <p className="mp-train-help">{copy(language, `운임 ${num(board.pendingTrainFare ?? 100)}을 내고 소유 여부와 관계없이 부동산 칸으로 이동할 수 있어요. 목적지가 없으면 열차를 건너뛰세요.`, `El pasaje cuesta ${num(board.pendingTrainFare ?? 100)}. Puedes elegir cualquier ciudad, aunque tenga dueño. Si no hay destinos disponibles, puedes pasar el tren.`)}</p>}
          {active && phase === 'event-decision' && <p className="mp-decision-help">{board.pendingEvent?.id === 'city-festival' ? copy(language, '내 도시 하나를 선택하세요. 다음 상대 방문의 통행료가 2배가 된 뒤 축제가 끝나요.', 'Elige una ciudad tuya. La próxima visita rival paga el doble y termina el festival.') : copy(language, '상대 도시 하나를 선택하세요. 다음 내 방문의 통행료가 절반이 된 뒤 정전이 끝나요.', 'Elige una ciudad rival. Tu próxima visita paga la mitad y termina el apagón.')}</p>}
          {active && phase === 'rent-decision' && <div className="mp-payment-alert" role="status"><b>{copy(language, '통행료를 내거나 면제권을 쓰세요', 'Paga la renta o usa tu pase')}</b><span>{board.pendingRent?.reason?.[language]}</span><strong>{moneyText(num(board.pendingRent?.amount), language)}</strong></div>}
          {phase === 'debt' && <div className="mp-payment-alert" role="status"><b>{copy(language, '결제가 필요해요', 'Hay un pago pendiente')}</b><span>{String(pendingPayment.reason?.[language] ?? '')}</span><strong>{moneyText(num(pendingPayment.amount), language)}</strong></div>}
          {latestReceipt.title?.[language] && <div className="mp-latest-receipt" role="status"><small>{copy(language, '최근 행동 · 즉시 반영', 'Última acción · actualizada')}</small><b>{latestReceipt.title[language]}</b><span>{latestReceipt.text?.[language]}</span>{typeof latestMoneyReceipt.moneyDelta?.[playerId] === 'number' && <strong>{latestMoneyReceipt !== latestReceipt && latestMoneyReceipt.title?.[language] ? `${latestMoneyReceipt.title[language]} · ` : ''}{copy(language, '내 현금', 'Tu efectivo')} {latestMoneyReceipt.moneyDelta[playerId] > 0 ? '+' : ''}{moneyText(latestMoneyReceipt.moneyDelta[playerId], language)}</strong>}</div>}
          {selectedBuild && buildCost !== null && <div className="mp-build-shortcut"><b>{selectedName}</b><span>{copy(language, `비용 ${moneyText(buildCost, language)} · 건설 후 현금 ${moneyText(num(money[playerId]) - buildCost, language)}`, `Costo ${moneyText(buildCost, language)} · Efectivo después ${moneyText(num(money[playerId]) - buildCost, language)}`)}</span><span>{copy(language, `통행료 ${moneyText(selectedRent, language)} → ${moneyText(nextRent, language)} (+${moneyText(nextRent - selectedRent, language)})`, `Renta ${moneyText(selectedRent, language)} → ${moneyText(nextRent, language)} (+${moneyText(nextRent - selectedRent, language)})`)}</span><button className="mp-action mp-action-primary" type="button" onClick={() => run(selectedBuild)}>{selectedBuild.label[language]}<span aria-hidden="true">↗</span></button></div>}
          <div className="mp-actions">
            {roll && <button className="mp-action mp-action-primary" type="button" onClick={() => run(roll)}>{copy(language, '주사위 굴리기', 'Lanzar los dados')}<span aria-hidden="true">↗</span></button>}
            {buy && <button className="mp-action mp-action-primary" type="button" onClick={() => run(buy)}>{copy(language, `도시 구매 · ${num(currentTile.price)}`, `Comprar ciudad · ${num(currentTile.price)}`)}<span aria-hidden="true">↗</span></button>}
            {decline && <button className="mp-action mp-action-secondary" type="button" onClick={() => run(decline)}>{copy(language, '구매하지 않고 지나가기', 'Continuar sin comprar')}</button>}
            {endTurn && <button className="mp-action mp-action-primary" type="button" onClick={() => run(endTurn)}>{copy(language, '차례 마치기', 'Terminar turno')}<span aria-hidden="true">→</span></button>}
            {actionsOf('attempt-doubles').map(choice => <button className="mp-action mp-action-primary" key={String(choice.action.type)} type="button" onClick={() => run(choice)}>{choice.label[language]}<span aria-hidden="true">↗</span></button>)}
            {actionsOf('pay-escape').map(choice => <button className="mp-action mp-action-primary" key={String(choice.action.type)} type="button" onClick={() => run(choice)}>{choice.label[language]}</button>)}
            {actionsOf('use-escape-pass').map(choice => <button className="mp-action mp-action-secondary" key={String(choice.action.type)} type="button" onClick={() => run(choice)}>{choice.label[language]}</button>)}
            {eventCityActions.length > 0 && <TrainChooser key={String(board.pendingEvent?.id)} choices={eventCityActions} language={language} runAction={runAction} eventCity/>}
            {['pay-rent', 'use-rent-pass'].flatMap(type => actionsOf(type)).map(choice => <button className="mp-action mp-action-primary" key={choice.action.type} type="button" onClick={() => run(choice)}>{choice.label[language]}</button>)}
            {trainActions.length > 0 && <TrainChooser choices={trainActions} language={language} runAction={runAction}/>}
            {actionsOf('skip-train').map(choice => <button className="mp-action mp-action-secondary" key={String(choice.action.type)} type="button" onClick={() => run(choice)}>{choice.label[language]}</button>)}
            {actionsOf('borrow').length > 0 && <p className="mp-loan-note">{copy(language, '대출은 300을 받고 나중에 330을 갚아요. 한 번에 하나만 이용할 수 있어요.', 'Recibes 300 y luego devuelves 330. Solo puedes tener un préstamo pendiente.')}</p>}
            {actionsOf('borrow').map(choice => <button className="mp-action mp-action-secondary" key={String(choice.action.type)} type="button" onClick={() => run(choice)}>{choice.label[language]}</button>)}
            {actionsOf('repay').map(choice => <button className="mp-action mp-action-secondary" key={String(choice.action.type)} type="button" onClick={() => run(choice)}>{choice.label[language]}</button>)}
            {actionsOf('declare-bankruptcy').map(choice => <div className="mp-bankruptcy-confirm" key={String(choice.action.type)}>
              {!confirmBankruptcy ? <button className="mp-action mp-action-danger" type="button" onClick={() => setConfirmBankruptcy(true)}>{copy(language, '파산 선택 검토', 'Revisar opción de quiebra')}</button> : <>
                <p role="alert">{copy(language, '파산을 인정하면 경기가 즉시 끝나요. 계속할까요?', 'Si declaras la quiebra, la partida termina de inmediato. ¿Quieres continuar?')}</p>
                <button className="mp-action mp-action-danger" type="button" onClick={() => run(choice)}>{choice.label[language]}</button>
                <button className="mp-action mp-action-secondary" type="button" onClick={() => setConfirmBankruptcy(false)}>{copy(language, '돌아가기', 'Volver')}</button>
              </>}
            </div>)}
            {otherActions.map((choice, index) => <button className="mp-action mp-action-secondary" key={`${choice.action.type}-${index}`} type="button" onClick={() => run(choice)}>{choice.label[language]}</button>)}
            {!active && !view.result && <p className="mp-waiting">{copy(language, '상대가 차례를 진행하고 있어요.', 'Tu pareja está jugando su turno.')}</p>}
          </div>
        </section>

        <section className="mp-event-theater" aria-label={copy(language, '방금 일어난 일', 'Lo que acaba de pasar')}>
          <h4>{copy(language, '방금 일어난 일', 'Lo que acaba de pasar')}</h4>
          {stageEvents.length > 0 ? <MarbleEventStage events={stageEvents} language={language} playerId={playerId} result={view.result}/> : <p className="mp-event-empty">{copy(language, '첫 주사위를 굴리면 이곳에 도착과 카드 효과가 표시돼요.', 'Al lanzar los dados, aquí verás las llegadas y los efectos de las cartas.')}</p>}
        </section>

        <details className="mp-city-detail" aria-label={selectedName}><summary>{copy(language, '도시 상세 · ', 'Detalles · ')}{selectedName}</summary>
          <div className="mp-city-detail-head"><div><small>{copy(language, '선택한 칸', 'Casilla seleccionada')}</small><span>{selectedTile === pos ? copy(language, '현재 행동 위치', 'Ubicación de acción') : copy(language, `현재 행동은 ${String(record(currentTile.name)[language] ?? record(currentTile.name).ko ?? '')}`, `La acción sigue en ${String(record(currentTile.name)[language] ?? record(currentTile.name).ko ?? '')}`)}</span></div></div>
          {selectedCity.kind === 'property' ? <>
            <article className={`mp-property-card mp-group-${String(selectedCity.group ?? '')}`} aria-label={`${selectedName}, ${moneyText(num(selectedCity.price), language)}`}>
              <img className="mp-property-card-frame" src="/images/marble/ownership-card-frame.svg" alt="" aria-hidden="true"/>
              <h3 id="mp-city-detail-title">{selectedName}</h3>
              <div className="mp-property-card-art">{selectedCityArt && <MarblePropertyArt routeVersion={num(board.cityRouteVersion)} language={language} city={selectedCityArt} level={modern ? num(selectedCity.houses) : 0}/>}</div>
              <div className="mp-property-card-owner"><b className={`mp-owner-mark ${selectedOwner ? `mp-owner-${selectedOwner}` : ''}`}>{selectedOwner && <MarblePawn pawn={pawnId(record(board.pawns)[selectedOwner]) ?? (selectedOwner === 'p1' ? 'fox' : 'cat')} language={language} label={seatName(selectedOwner, playerId, language)}/>} {selectedOwner ? seatName(selectedOwner, playerId, language) : copy(language, '미소유', 'Sin dueño')}</b><span className="mp-card-group">{groups[String(selectedCity.group ?? '')]?.[language] ?? String(selectedCity.group ?? '')}</span></div>
              <div className="mp-property-card-price"><small>{copy(language, '매입 가격', 'Precio')}</small><b>{moneyText(num(selectedCity.price), language)}</b></div>
              <div className="mp-property-card-rents" aria-label={copy(language, '건설 단계별 통행료', 'Renta por nivel')}>
                {rentSteps.map((rent, level) => <span className={num(selectedCity.houses) === level ? 'is-active' : ''} key={level}><small>{level === 0 ? copy(language, '기본', 'Base') : level === 3 ? copy(language, '랜드마크', 'Monumento') : `${level}${copy(language, '단계', ' niv.')}`}</small><b>{moneyText(rent, language)}</b></span>)}
              </div>
            </article>
            {landmarkNote && <p className="mp-landmark-note">{landmarkNote}</p>}
            {nextBuildCost !== null && !selectedBuild && <div className="mp-city-upgrade"><b>{copy(language, '다음 건설 단계', 'Siguiente nivel')}</b><span>{copy(language, `비용 ${moneyText(nextBuildCost, language)}`, `Costo ${moneyText(nextBuildCost, language)}`)}</span><span>{copy(language, `건설 후 통행료 ${moneyText(nextRent, language)}`, `Renta después ${moneyText(nextRent, language)}`)}</span><small>{copy(language, '차례와 규칙 조건을 충족할 때', 'Cuando sea tu turno y cumplas las condiciones')}</small></div>}
            {purchaseCost !== null && <div className="mp-city-projection"><b>{copy(language, '구매 예상', 'Compra')}</b><span>{copy(language, `비용 ${moneyText(purchaseCost, language)}`, `Costo ${moneyText(purchaseCost, language)}`)}</span><span>{copy(language, `구매 후 현금 ${moneyText(num(money[playerId]) - purchaseCost, language)}`, `Efectivo después ${moneyText(num(money[playerId]) - purchaseCost, language)}`)}</span></div>}

          </> : <p className="mp-city-special">{specialNames[String(selectedCity.kind ?? '')]?.[language] ?? copy(language, '도시 정보', 'Detalles de la casilla')}{num(selectedCity.price) > 0 ? ` · ${copy(language, ['tax', 'fund-deposit'].includes(String(selectedCity.kind)) ? `납부액 ${moneyText(num(selectedCity.price), language)}` : `비용 ${moneyText(num(selectedCity.price), language)}`, ['tax', 'fund-deposit'].includes(String(selectedCity.kind)) ? `Pago ${moneyText(num(selectedCity.price), language)}` : `Costo ${moneyText(num(selectedCity.price), language)}`)}` : ''}</p>}
        </details>


        {eventLog.length > 0 && <details className="mp-history"><summary>{copy(language, '최근 기록', 'Actividad reciente')} <span>{eventLog.length}</span></summary><ol>{eventLog.slice(-5).reverse().map((event: any) => <li key={num(event.sequence)}><span>{String(record(event.title)[language] ?? '')}</span><small>{String(record(event.text)[language] ?? '')}</small></li>)}</ol></details>}

        <details className="mp-portfolio"><summary>{copy(language, '보유 도시', 'Ciudades adquiridas')} <span>{ownedBy('p1').length + ownedBy('p2').length}</span></summary>
          {players.map(seat => <div className="mp-portfolio-seat" key={seat}><h4>{seatName(seat, playerId, language)} · {ownedBy(seat).length}</h4>{ownedBy(seat).length ? <ul>{ownedBy(seat).map(({ tile, index }) => { const title = String(record(tile.name)[language] ?? ''); return <li key={index}><button className="mp-portfolio-city" type="button" aria-pressed={selectedTile === index} aria-label={copy(language, `${title} 도시 카드 열기`, `Abrir tarjeta de ${title}`)} onClick={() => setSelectedTile(index)}>{cityArtNames[title] && <MarblePropertyArt routeVersion={num(board.cityRouteVersion)} language={language} city={cityArtNames[title]} level={modern ? num(tile.houses) : 0}/>}<span><b>{title}</b><small>{groups[String(tile.group)]?.[language] ?? String(tile.group ?? '')}</small></span></button><span className="mp-portfolio-level">{buildingName(num(tile.houses), language, modern) || copy(language, `임대 ${rentValue(tile, modern)}`, `Renta ${rentValue(tile, modern)}`)}</span>{buildActions.some(choice => num(choice.action.payload?.tile) === index) && <button type="button" aria-label={copy(language, `${title} 건설 선택`, `Seleccionar mejora de ${title}`)} onClick={() => setSelectedTile(index)}>{copy(language, '개선', 'Mejorar')}</button>}</li>; })}</ul> : <p>{copy(language, '아직 보유한 도시가 없어요.', 'Todavía no hay ciudades.')}</p>}</div>)}
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

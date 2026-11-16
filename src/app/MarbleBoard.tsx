import { marbleSpecialDestinationImage } from './marble-destination-art';
import { marbleSpaceTarget, useMarbleSpaceAction } from './useMarbleSpaceAction';
import {MarbleFlight} from './MarbleFlight';
import { MarbleIslandDecision } from './MarbleIslandDecision';
import {MarbleOwnershipDecision} from './MarbleOwnershipDecision';
import {MarbleFinancePanel} from './MarbleFinancePanel';
import {marbleLandmarkNote} from './marble-world-theme';
import { marbleMonopolyGroups, MarbleMonopolyStatus } from './MarbleMonopoly';
import {classicSaleValue} from '../games/marbleClassicEconomy';
import {useMarbleCardQueue} from './useMarbleCardQueue';
import {marbleEventText} from './marble-event-text';
import { MarbleResultPanel } from './MarbleResultPanel';
import { MarbleCardOutcome, currentCardOutcome } from './MarbleCardOutcome';
import { MarbleCardDecision } from './MarbleCardDecision';
import { constructionValueAtPrice } from '../games/marbleConstruction';
import { marbleColorTollBonus, marbleCityValueAtPrice } from '../games/marbleEconomy';
import { MarbleLegacyConstructionPanel } from './MarbleLegacyConstructionPanel';
import { MarbleConstructionPicker } from './MarbleConstructionPicker';
import { MarbleTravelPreview } from './MarbleTravelPreview';
import { ownershipPreview, travelPreview, constructionLabel, unavailableConstruction } from './marble-decision';
import { MarblePropertyLedger, MarblePropertySale } from './MarblePropertyLedger';
import { MarblePropertyArt } from './MarblePropertyArt';
import dioramas from '../../public/images/marble/dioramas/manifest.json';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { GameAction, Language, PlayerId } from '../core/types';
import { cancelSceneAudio } from '../audio/audio';
import { createMarbleAudioPresenter } from '../audio/marble-audio';
import { MarbleEventStage } from './MarbleEventStage';
import { MarbleTransactionReceipt } from './MarbleTransactionReceipt';
import { MarbleMoneyFlight } from './MarbleMoneyFlight';
import { MarbleDecisionPreview } from './MarbleDecisionPreview';
import { MarblePlayerHud } from './MarblePlayerHud';
import { MarbleBoardShell } from './MarbleBoardShell';
import { MarbleCityTile } from './MarbleCityTile';
import { marblePassStartSalary } from '../games/marbleEconomy';
import { useMarbleSettlementLock } from './useMarbleSettlementLock';
import { MarblePawnPicker } from './MarblePawn';
import { groups, specialNames, cityArtNames, cityFlag, pawnId, buildingName, rentValue, moneyText } from './marble-visuals';
import { marblePresentedBalances, marbleGridPosition, marblePresentationFrames, type MarbleActionEvent } from './marble-motion';
import '../styles/marble-premium.css';
import './marble-context.css';
import './marble-ownership.css';
import './marble-stage-redesign.css';
import './marble-board-readable.css';
import './marble-sidebar.css';

type Choice = { label: Record<Language, string>; action: GameAction };
type Seat = PlayerId;
type Props = { view: any; language: Language; playerId: PlayerId; runAction: (action: GameAction) => void | Promise<unknown>; solo?: boolean; onReplay?:()=>void|Promise<unknown>; onExit?:()=>void|Promise<unknown>; replayPending?:boolean; playerNames?:Partial<Record<PlayerId,string>> };
const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
const record = (value: unknown): Record<string, any> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
const list = (value: unknown): any[] => Array.isArray(value) ? value : [];
const num = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const seatName = (seat: Seat, playerId: PlayerId, language: Language) => seat === playerId ? copy(language, '나', 'Tú') : copy(language, '상대', 'Tu pareja');

function phaseName(phase: string, language: Language) {
  const phases: Record<string, Record<Language, string>> = {
    roll: { ko: '주사위 굴릴 차례', es: 'Lanza los dados' }, decision: { ko: '도시 구매 결정', es: 'Decide si compras' }, main: { ko: '차례 마무리', es: 'Termina tu turno' },
    island: { ko: '무인도에서 나가기', es: 'Salir de la isla' }, 'train-decision': { ko: '세계여행 목적지 선택', es: 'Elige destino de viaje' }, debt: { ko: '결제 방법 선택', es: 'Resuelve el pago' }, 'event-decision': { ko: '카드 효과를 적용할 도시 선택', es: 'Elige una ciudad para la carta' }, 'rent-decision': { ko: '통행료 결제 선택', es: 'Elige cómo pagar la renta' }, finished: { ko: '경기 종료', es: 'Partida terminada' },
  };
  return phases[phase]?.[language] ?? copy(language, '게임 현황', 'Estado de la partida');
}

export function MarbleDie({ value, language }: { value: number; language: Language }) {
  const dots: Record<number, string[]> = { 1: ['m'], 2: ['tl', 'br'], 3: ['tl', 'm', 'br'], 4: ['tl', 'tr', 'bl', 'br'], 5: ['tl', 'tr', 'm', 'bl', 'br'], 6: ['tl', 'ml', 'bl', 'tr', 'mr', 'br'] };
  return <span className={`mp-die ${value ? 'has-value' : ''}`} role="img" aria-label={value ? String(value) : copy(language, '아직 굴리지 않음', 'Sin lanzar')}>
    <svg viewBox="0 0 48 48" aria-hidden="true"><rect x="3" y="3" width="42" height="42" rx="12"/>{value ? (dots[value] ?? []).map(point => <circle key={point} cx={point.includes('l') ? 15 : point.includes('r') ? 33 : 24} cy={point.includes('t') ? 15 : point.includes('b') ? 33 : 24} r="3.1"/>) : <path className="mp-die-unrolled" d="m24 12 2.8 8.2L35 23l-8.2 2.8L24 34l-2.8-8.2L13 23l8.2-2.8Z"/>}</svg>
  </span>;
}

function ImpactText({ tile, language, fund = 0, modern = true, economicVersion }: { tile: Record<string, any>; language: Language; fund?: number; modern?: boolean; economicVersion?: number }) {
  const kind = String(tile.kind ?? '');
  const name = String(record(tile.name)[language] ?? record(tile.name).ko ?? '');
  if (kind === 'property'||kind==='tourism') return <><b>{name}</b><span>{tile.owner ? copy(language, `기본 통행료 ${rentValue(tile, modern, economicVersion)}`, `Alquiler base ${rentValue(tile, modern, economicVersion)}`) : copy(language, `구매 ${num(tile.price)} · 기본 통행료 ${num(tile.rent)}`, `Compra ${num(tile.price)} · renta ${num(tile.rent)}`)}</span></>;
  return <><b>{name || specialNames[kind]?.[language]}</b><span>{journeySpecialLine(tile, language, fund, economicVersion)}</span></>;
}

function journeySpecialLine(tile: Record<string, any>, language: Language, fund: number, economicVersion?: number) {
  switch (tile.kind) {
    case 'start': return copy(language, `통과할 때 ${marblePassStartSalary(economicVersion,tile.economyProfile)}을 받아요.`, `Recibe ${marblePassStartSalary(economicVersion,tile.economyProfile)} al pasar.`);
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

export default function MarbleBoard({ view: rawView, language, playerId, runAction: dispatchAction, onReplay, onExit, replayPending, playerNames }: Props) {
  const view = record(rawView), board = record(view.board), tiles = list(board.tiles).map(tile=>({...tile,economyProfile:board.economyProfile})), choices: Choice[] = list(view.actions);
  const players: Seat[] = ['p1', 'p2'];
  const monopolyGroups = marbleMonopolyGroups(tiles, num(board.propertyRulesVersion) === 1);
  const seatLabel = (seat: Seat) => playerNames?.[seat] || seatName(seat, playerId, language);
  const validSeat = (value: unknown): value is Seat => players.includes(value as Seat);
  const positionsSignature = players.map(seat => `${seat}:${num(record(board.positions)[seat])}`).join('|');
  const modern = tiles.length === 32 || tiles.length === 40 || num(board.version) >= 2;
  const isLegacy = tiles.length === 18;
  const positions = record(board.positions), money = record(board.money), assets = record(board.assets), debt = record(board.debt);
  const active = board.turn === playerId && view.status !== 'finished';
  const actionsOf = (type: string) => choices.filter(choice => choice.action?.type === type);
  const actionOf = (type: string) => actionsOf(type)[0];
  const pawnChoices = actionsOf('choose-pawn');
  const roll = actionOf('roll'), buy = actionOf('buy'), decline = actionOf('decline'), endTurn = actionOf('endTurn');
  const buildActions = actionsOf('build').filter((choice,index,all)=>all.findIndex(other=>other.action.payload?.tile===choice.action.payload?.tile)===index), trainActions = actionsOf('choose-train'), eventCityActions = actionsOf('choose-event-city');
  const handled = new Set(['roll', 'buy', 'takeover', 'sell-property', 'decline', 'endTurn', 'build', 'choose-train', 'choose-pawn', 'borrow', 'repay', 'declare-bankruptcy', 'attempt-doubles', 'pay-escape', 'use-escape-pass', 'skip-train', 'choose-event-city', 'pay-rent', 'use-rent-pass']);
  const otherActions = choices.filter(choice => !handled.has(String(choice.action?.type)));
  const activeSeat: Seat = validSeat(board.turn) ? board.turn : 'p1';
  const pos = Number.isInteger(positions[activeSeat]) ? num(positions[activeSeat]) : 0;
  const [selectedTile, setSelectedTile] = useState(pos);
  const selectedCity = tiles[selectedTile] ?? {};
  const selectedName = String(record(selectedCity.name)[language] ?? record(selectedCity.name).ko ?? '');
  const selectedCityArt = selectedCity.kind==='tourism'?`tourism:${selectedCity.name.ko}`:cityArtNames[String(record(selectedCity.name).ko ?? '')] ?? (num(board.cityRouteVersion)===4?`korea-${selectedTile}`:null);
  const landmarkNote = num(board.cityRouteVersion) >= 3 ? marbleLandmarkNote(selectedCityArt??'',language,num(board.cityRouteVersion)) ?? dioramas.assets.find(asset => asset.slug === selectedCityArt)?.note?.[language] : null;
  const selectedOwner = validSeat(selectedCity.owner) ? selectedCity.owner as Seat : null;
  const selectedBuild = actionsOf('build').find(choice => num(choice.action.payload?.tile) === selectedTile);
  const selectedIsAction = selectedTile === pos;
  const purchaseCost = selectedIsAction && ['property','tourism'].includes(selectedCity.kind) && buy ? num(selectedCity.price) : null;
  const economyVersion = num(board.economicVersion);
  const selectedRent = rentValue(selectedCity, modern, economyVersion);
  const rentSteps = [0, 1, 2, 3].map(level => rentValue({ ...selectedCity, houses: level }, modern, economyVersion));
  const nextBuildCost = selectedOwner && selectedCity.nextBuildCost != null ? num(selectedCity.nextBuildCost) : null;
  const nextRent = selectedCity.nextRent != null ? num(selectedCity.nextRent) : rentValue({ ...selectedCity, houses: num(selectedCity.houses) + 1 }, modern, economyVersion);
  const currentTile = tiles[pos] ?? {};
  const eventLog = list(board.actionLog);
  const actionSequence = num(board.actionSequence) || Math.max(0, ...eventLog.map(event => num(event.sequence)));
  const lastPublicEvent = record(board.lastEvent);
  const stageEvents = eventLog.length ? eventLog : lastPublicEvent.title && lastPublicEvent.text ? [{
    sequence: num(lastPublicEvent.sequence), type: 'event-card', actor: lastPublicEvent.playerId ?? playerId,
    title: record(lastPublicEvent.title), text: record(lastPublicEvent.text), cashDelta: num(lastPublicEvent.cashDelta), moneyDelta:{[lastPublicEvent.playerId??playerId]:num(lastPublicEvent.cashDelta)},
    from: lastPublicEvent.from, to: lastPublicEvent.to,
  }] : [];
  const lastMove = record(board.lastMove);
  const lastMoveSequence = num(lastMove.sequence);
  const rollValues = list(board.lastRoll).map(num);
  const diceSequence = num(board.diceSequence);
  const [traveler, setTraveler] = useState<{ seat: Seat; tile: number; seq: number } | null>(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [displayPositions, setDisplayPositions] = useState<Record<string, number>>(() => Object.fromEntries(players.map(seat => [seat, num(positions[seat])])));
  const [presentedEvent, setPresentedEvent] = useState<MarbleActionEvent | null>(() => stageEvents.at(-1) ?? null);
  const motionTimers = useRef<number[]>([]);
  const motionBusy = useRef(false);
  const [reduced, setReduced] = useState(false);
  const [confirmBankruptcy, setConfirmBankruptcy] = useState(false);
  const previous = useRef<{ positions: Record<string, number>; move: number; action: number; dice: number; phase: string } | null>(null);
  const previousProperties = useRef<string | null>(null);
  const [changedProperties, setChangedProperties] = useState<number[]>([]);
  const propertySignature = tiles.map(tile => `${tile.owner ?? ''}:${num(tile.houses)}:${(tile.buildings??[]).join(',')}:${!!tile.landmark}`).join('|');
  const ownedBy = (seat: Seat) => tiles.map((tile, index) => ({ tile, index })).filter(({ tile }) => ['property','tourism'].includes(tile.kind) && tile.owner === seat);
  const pendingPayment = record(board.pendingPayment);
  const phase = String(view.phase ?? 'roll');
  const fund = num(board.fundPool);
  const [target, setTarget] = useState('');
  const destinations = phase === 'event-decision' ? eventCityActions : phase === 'train-decision' ? trainActions : [];
  const selectedDestination = destinations.find(choice => JSON.stringify(choice.action) === target) ?? undefined;
  const primaryChoice = phase === 'roll' ? roll
    : phase === 'decision' ? buy ?? decline
    : phase === 'main' ? selectedBuild ?? buildActions.find(choice => num(choice.action.payload?.tile) === pos) ?? buildActions[0] ?? actionsOf('takeover')[0] ?? endTurn
    : phase === 'island' ? actionOf('attempt-doubles') ?? actionOf('pay-escape') ?? actionOf('use-escape-pass')
    : phase === 'train-decision' ? trainActions.length ? selectedDestination : actionOf('skip-train')
    : phase === 'event-decision' ? selectedDestination
    : phase === 'rent-decision' ? actionOf('pay-rent') ?? actionOf('use-rent-pass')
    : phase === 'debt' ? undefined
    : undefined;
  const isPrimary = (choice?: Choice) => modern && !!choice && !!primaryChoice && choice.action.type === primaryChoice.action.type && JSON.stringify(choice.action.payload ?? {}) === JSON.stringify(primaryChoice.action.payload ?? {});
  const hasSecondaryActions=phase!=='island'&&choices.some(choice=>!isPrimary(choice)&&!['choose-event-city','choose-train','choose-pawn','build','buy','repay'].includes(choice.action.type)&&!(choice.action.type==='borrow'&&phase!=='debt')&&!(choice.action.type==='skip-train'&&modern&&phase==='train-decision')&&!(choice.action.type==='decline'&&modern&&['buy','decline'].includes(primaryChoice?.action.type??'')));
  const primaryIndex = primaryChoice ? num(primaryChoice.action.payload?.tile ?? primaryChoice.action.payload?.destination ?? pos) : pos;
  const primaryTile = tiles[primaryIndex] ?? currentTile;
  const primaryCost = primaryChoice?.action.type === 'buy' ? num(primaryTile.price) : primaryChoice?.action.type === 'build' ? num(primaryTile.nextBuildCost) : primaryChoice?.action.type === 'takeover' ? num(board.takeoverOffer?.price) : primaryChoice?.action.type === 'pay-rent' ? num(board.pendingRent?.amount) : 0;
  const primaryAfterCash = num(money[playerId]) - primaryCost;
  const primaryBuildRent = rentValue(primaryTile, modern, economyVersion);
  const primaryNextBuildRent = primaryTile.nextRent != null ? num(primaryTile.nextRent) : rentValue({ ...primaryTile, houses: num(primaryTile.houses) + 1 }, modern, economyVersion);
  const needsCityChoice = active && ['train-decision', 'event-decision'].includes(phase) && destinations.length > 0;
  const pendingPurchasePrice = phase === 'decision' && ['property','tourism'].includes(primaryTile.kind) ? num(primaryTile.price) : null;
  const pendingPurchaseShortfall = pendingPurchasePrice === null ? 0 : Math.max(0, pendingPurchasePrice - num(money[playerId]));
  const unaffordableBuild = num(board.constructionRulesVersion)<2 && phase === 'main' && buildActions.length === 0 ? ownedBy(playerId).find(({ tile, index }) => (board.constructionRulesVersion !== 1 || board.buildSite === 'start' || board.buildSite === index) && (board.constructionRulesVersion !== 1 || num(tile.houses) < 2 || num(tile.houses) === 2 && list(board.landmarkOptions).includes(index)) && num(tile.nextBuildCost) > num(money[playerId])) : undefined;
  const constructionV2 = num(board.constructionRulesVersion) >= 2;
  const unavailableBuild = constructionV2 && phase==='main' && !buildActions.length ? unavailableConstruction(tiles,playerId,board.buildSite,num(record(board.completedLaps)[playerId]),list(board.landmarkOptions),num(money[playerId]),economyVersion) : undefined;
  const ownershipAfter = ownershipPreview(tiles, primaryIndex, playerId, marbleColorTollBonus(board));
  const acquisitionContext=active&&phase==='main'&&board.takeoverOffer?.price!=null;
  const tourismPurchase=active&&phase==='decision'&&currentTile.kind==='tourism';
  const primaryCityArt = primaryTile.kind==='tourism'?`tourism:${primaryTile.name.ko}`:cityArtNames[String(record(primaryTile.name).ko ?? '')] ?? (num(board.cityRouteVersion)===4?`korea-${primaryIndex}`:'');
  const islandRemaining = num(record(board.islandTurns)[playerId]);
  const escapePassCount = num(record(board.escapePasses)[playerId]);
  const turns = Math.min(num(board.turns), 120);
  const currentTurn = Math.max(1, Math.min(120, turns + 1));
  const cardQueue=useMarbleCardQueue(eventLog);
  const cardOutcome=cardQueue.outcome??(phase==='event-decision'?currentCardOutcome(eventLog):null);
  const [acknowledgedReceipt,setAcknowledgedReceipt]=useState(0);
  const latestReceipt = record(stageEvents.at(-1));
  const receiptBoundary = stageEvents.map(event => event.type).map(type => type === 'turn' || type === 'roll').lastIndexOf(true);
  const latestMoneyReceipt = record(stageEvents.slice(Math.max(0, receiptBoundary)).filter(event => typeof event.moneyDelta?.[playerId] === 'number' && event.moneyDelta[playerId] !== 0).at(-1));
  const latestTransaction = stageEvents.slice(receiptBoundary + 1).filter(event => Object.values(record(event.moneyDelta)).some(delta => typeof delta === 'number' && delta !== 0)).at(-1);
  const currentReceipt = latestTransaction && num(latestTransaction.sequence) === num(stageEvents.at(-1)?.sequence) ? latestTransaction : undefined;
  const settlementLock = useMarbleSettlementLock(num(latestTransaction?.sequence));
  const accountLabel = (account: unknown) => account === 'bank' ? copy(language, '은행', 'Banco') : account === 'fund' ? copy(language, '공동 기금', 'Fondo común') : validSeat(account) ? seatLabel(account) : '';
  const [actionPending, setActionPending] = useState(false);
  const actionPendingRef = useRef(false);
  const interactionLocked = actionPending || motionBusy.current || diceRolling || !!traveler || settlementLock.locked;
  const journeyInFlight = diceRolling || !!traveler || num(displayPositions[activeSeat]) !== pos;
  const settledHud = useRef({ money: { ...money }, assets: { ...assets } });
  useEffect(() => { if (!motionBusy.current && num(presentedEvent?.sequence ?? actionSequence)>=actionSequence) settledHud.current = { money: { ...money }, assets: { ...assets } }; }, [journeyInFlight, presentedEvent, actionSequence, money.p1, money.p2, assets.p1, assets.p2]);
  const hudMoney = marblePresentedBalances(money, eventLog, num(presentedEvent?.sequence ?? actionSequence));
  const hudAssets = motionBusy.current || num(presentedEvent?.sequence ?? actionSequence)<actionSequence ? settledHud.current.assets : assets;
  const dispatch = async (action: GameAction) => {
    const choice = choices.find(item => item.action.type === action.type && JSON.stringify(item.action.payload ?? {}) === JSON.stringify(action.payload ?? {}));
    if (!choice || interactionLocked || motionBusy.current || actionPendingRef.current || settlementLock.held.current) return false;
    actionPendingRef.current = true; setActionPending(true);
    try { const accepted = await dispatchAction(action); settlementLock.holdAfterAction(action.type, accepted); return accepted; }
    finally { actionPendingRef.current = false; setActionPending(false); }
  };
  const run = (choice?: Choice) => choice && void dispatch(choice.action);
  const layoutRef = useRef<HTMLDivElement>(null);
  const actionPanelRef = useRef<HTMLElement>(null);
  const cityDetailsRef = useRef<HTMLDetailsElement>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [travelNotice,setTravelNotice]=useState('');
  const inspectTile = (index: number) => {
    if(active&&phase==='event-decision'&&!interactionLocked){const choice=eventCityActions.find(item=>num(item.action.payload?.tile)===index);if(choice){setSelectedTile(index);setTarget(JSON.stringify(choice.action));requestAnimationFrame(()=>document.querySelector<HTMLElement>('#mp-card-confirm')?.focus());}return;}
    setSelectedTile(index);
    if(active&&phase==='train-decision'&&!interactionLocked){
      const destination=trainActions.find(choice=>num(choice.action.payload?.destination??choice.action.payload?.tile)===index);
      if(destination)setTarget(JSON.stringify(destination.action));
      if(destination||tiles[index]?.kind==='train'){setTravelNotice('');requestAnimationFrame(()=>document.querySelector<HTMLElement>('#mp-action-primary, #mp-travel-prompt')?.focus());return;}
    }
    if(tiles[index]?.kind==='train')setTravelNotice(copy(language,'이 칸에 도착한 다음 내 차례에 목적지를 선택할 수 있어요.','Elige destino en tu próximo turno tras llegar aquí.'));
    if (cityDetailsRef.current) cityDetailsRef.current.open = true;
  };
  useEffect(() => {setTarget('');setTravelNotice('');}, [phase]);
  const resetSequence=useRef(actionSequence);
  useEffect(()=>{if(actionSequence<resetSequence.current){setAcknowledgedReceipt(0);setFeedbackVisible(false);feedbackSequence.current=0;}resetSequence.current=actionSequence;},[actionSequence]);
  const feedbackSequence = useRef(num(presentedEvent?.sequence));
  useEffect(() => {
    const sequence=num(presentedEvent?.sequence);
    if(sequence<=feedbackSequence.current)return;
    feedbackSequence.current=sequence;
    setFeedbackVisible(true);
    const timer=window.setTimeout(()=>setFeedbackVisible(false),1800);
    return ()=>window.clearTimeout(timer);
  },[presentedEvent?.sequence]);
  const showCardOutcome=cardOutcome&&!journeyInFlight&&(phase!=='event-decision'||!active);
  const showEventFeedback=phase!=='event-decision' && phase!=='train-decision' && phase!=='debt' && feedbackVisible && presentedEvent && !journeyInFlight && !['roll','move','pawn','turn','arrival','buy','build','takeover'].includes(String(presentedEvent.type));


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
    const currentProperties = tiles.map(tile => `${tile.owner ?? ''}:${num(tile.houses)}:${(tile.buildings??[]).join(',')}:${!!tile.landmark}`);
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
    if (interrupted) cancelSceneAudio('marble');
    motionBusy.current = false;
    motionTimers.current.forEach(window.clearTimeout); motionTimers.current = [];
    const freshEvents = eventLog.filter(event => num(event.sequence) > (before?.action ?? actionSequence)).sort((a, b) => num(a.sequence) - num(b.sequence));
    const frames = before ? marblePresentationFrames(freshEvents, before.positions, next.positions, tiles.length || 18) : [];
    if (!before || reduced || document.hidden || actionSequence < before.action || interrupted || freshEvents.length > 12 || (freshEvents.length > 0 && num(freshEvents[0].sequence) !== before.action + 1) || !frames.length) {
      setTraveler(null); setDiceRolling(false); setDisplayPositions(next.positions); setPresentedEvent(stageEvents.length ? {...stageEvents.at(-1),skipCosmetics:true} : null);
      // Catch-up, reconnect and interrupted timelines are silent; reduced motion keeps current feedback.
      if (before && reduced && !interrupted && freshEvents.length <= 12 && freshEvents.length && !document.hidden && num(freshEvents[0].sequence) === before.action + 1) {
        const present = createMarbleAudioPresenter(playerId, view.result?.winner === 'draw' ? 'draw' : view.result?.winner === playerId ? 'win' : 'lose');
        for (const event of freshEvents) present({ event, traveler: null });
      }
      return;
    }
    const presentAudio = createMarbleAudioPresenter(playerId, view.result?.winner === 'draw' ? 'draw' : view.result?.winner === playerId ? 'win' : 'lose');
    motionBusy.current = true;
    const apply = (frame: typeof frames[number]) => {
      if (frame === frames.at(-1)) motionBusy.current = false;
      if (!document.hidden) presentAudio(frame);
      setDiceRolling(frame.dice); setTraveler(frame.traveler && validSeat(frame.traveler.seat) ? { ...frame.traveler, seat: frame.traveler.seat } : null); setDisplayPositions(frame.positions); setPresentedEvent(frame.event);
    };
    apply(frames[0]);
    motionTimers.current = frames.slice(1).map(frame => window.setTimeout(() => apply(frame), frame.at));
  }, [positionsSignature, lastMoveSequence, diceSequence, actionSequence, reduced]);

  useEffect(() => {
    const snap = () => {
      motionTimers.current.forEach(window.clearTimeout); motionTimers.current = [];
      cancelSceneAudio('marble');
      motionBusy.current = false; setTraveler(null); setDiceRolling(false); setPresentedEvent(null);
      const latest = previous.current;
      if (latest) setDisplayPositions(latest.positions);
    };
    const hidden = () => { if (document.hidden) snap(); };
    document.addEventListener('visibilitychange', hidden);
    return () => { cancelSceneAudio('marble'); motionTimers.current.forEach(window.clearTimeout); document.removeEventListener('visibilitychange', hidden); };
  }, []);

  const opponentPhase: Record<string, Record<Language, string>> = {
    roll: { ko: '상대가 주사위를 굴릴 차례예요', es: 'A tu pareja le toca lanzar los dados' },
    decision: { ko: '상대가 도시 구매를 결정하고 있어요', es: 'Tu pareja está decidiendo si compra la ciudad' },
    main: { ko: '상대가 차례를 마무리하고 있어요', es: 'Tu pareja está terminando su turno' },
    island: { ko: '상대가 무인도에서 나갈 방법을 고르고 있어요', es: 'Tu pareja está eligiendo cómo salir de la isla' },
    'train-decision': { ko: '상대가 세계여행 목적지를 고르고 있어요', es: 'Tu pareja está eligiendo destino de viaje' },
    'event-decision': { ko: '상대가 카드 효과를 적용할 도시를 고르고 있어요', es: 'Tu pareja está eligiendo una ciudad para la carta' },
    'rent-decision': { ko: '상대가 통행료 결제를 고르고 있어요', es: 'Tu pareja está eligiendo cómo pagar la renta' },
    debt: { ko: '상대가 결제 방법을 선택하고 있어요', es: 'Tu pareja está resolviendo un pago' },
  };
  const phaseLabel = !active && !view.result ? opponentPhase[phase]?.[language] ?? phaseName(phase, language) : phaseName(phase, language);
  const ownerName = validSeat(currentTile.owner) ? seatLabel(currentTile.owner) : null;
  const statusCopy = view.result ? copy(language, '경기가 끝났어요', 'Partida terminada') : active ? copy(language, '내 차례', 'Tu turno') : copy(language, '상대 차례', 'Turno de tu pareja');
  const scoreLabel = modern ? num(board.economicVersion) >= 1 ? copy(language, '순자산', 'Patrimonio neto') : copy(language, '총 자산', 'Activos totales') : copy(language, '현금', 'Efectivo');
  const outcome = view.result?.winner === 'draw' ? 'draw' : view.result?.winner === playerId ? 'win' : view.result ? 'lose' : '';

  const spaceBoardRef = useRef<HTMLElement>(null);
  const spaceAction = active && modern && !interactionLocked && !journeyInFlight ? marbleSpaceTarget(phase, primaryChoice?.action.type, !!(showCardOutcome || showEventFeedback)) : undefined;
  useMarbleSpaceAction(spaceBoardRef, !!spaceAction);

  return <section ref={spaceBoardRef} data-marble-space-board="" className={`marble-premium distilled-marble ${isLegacy ? 'is-legacy' : 'is-modern'}`} aria-label={copy(language, '부루마블 경기판', 'Tablero de Marble')}>
    {modern&&<MarbleMoneyFlight viewer={playerId} event={presentedEvent??undefined} cash={money} language={language}/>}
    <header className="mp-header"><div className="mp-brand"><h2>{copy(language, '부루마블', 'Marble')}</h2><p>{copy(language, '도시를 사고 건물을 지으며 여행해요. 같이 여행은 가도, 통행료는 따로야.', 'Compra ciudades, construye y recorre el mundo. Viajamos juntos, pero el alquiler va por separado.')}</p></div><div className={`mp-turn-badge ${active ? 'is-active' : ''}`}><span className="mp-turn-gem" aria-hidden="true"/><b>{statusCopy}</b><span>{phaseLabel}</span></div></header>

    <a className="mp-action-skip" href="#marble-current-action" onClick={event => { event.preventDefault(); focusMarbleAction(actionPanelRef.current); }}>{copy(language, '현재 행동으로 이동', 'Ir a la acción actual')}</a>
    <div className="mp-layout" ref={layoutRef}>
      <MarbleBoardShell tileCount={tiles.length} language={language}>
          {tiles.map((tile, index) => {
            const position = marbleGridPosition(index, tiles.length);
            if (!position) return null;
            const atSeats = players.filter(seat => !record(board.eliminated)[seat] && num(displayPositions[seat]) === index);
            const movingSeat = traveler?.tile === index ? traveler.seat : null;
            return <MarbleCityTile key={tile.index ?? index} tile={{...tile,economicVersion:economyVersion}} index={index} tileCount={tiles.length} monopoly={monopolyGroups.find(group=>group.complete&&group.tiles.includes(index))} effectEvent={presentedEvent} effectSelectable={active&&phase==='event-decision'&&!interactionLocked&&eventCityActions.some(choice=>num(choice.action.payload?.tile)===index)} travelSelectable={active&&phase==='train-decision'&&!interactionLocked&&trainActions.some(choice=>num(choice.action.payload?.destination)===index)} interactionHint={tile.kind==='train'?copy(language,active&&phase==='train-decision'?'이 칸을 여행 목적지로 선택':'이 칸에 도착한 다음 내 차례에 세계여행을 이용해요.',active&&phase==='train-decision'?'Elegir esta casilla como destino':'Llega aquí durante tu turno para viajar.'):undefined} position={position} language={language} routeVersion={num(board.cityRouteVersion)} modern={modern} selected={selectedTile === index} pending={pos === index && phase === 'decision'} changed={changedProperties.includes(index)} growth={false} atSeats={atSeats} arrivalSeat={!journeyInFlight&&num(displayPositions[activeSeat])===index?activeSeat:null} movingSeat={movingSeat} travelerSequence={traveler?.seq} playerId={playerId} pawnForSeat={seat => pawnId(record(board.pawns)[seat]) ?? (seat === 'p1' ? 'fox' : 'cat')} seatLabel={seat => seatLabel(seat as PlayerId)} onInspect={inspectTile}/>;
          })}
          <div className={`mp-board-center ${isLegacy ? 'mp-board-center--18' : ''}`}><MarbleFlight event={presentedEvent} events={eventLog} tiles={tiles} language={language}/>
            <div className="mp-ownership-key"><span className="mp-key-group"/>{copy(language, '윗띠 · 색상군', 'Franja · grupo')}<span className="mp-key-owner"/>{copy(language, '테두리·기단 · 소유자 번호', 'Borde y base · número del dueño')}<span className="mp-money-key">{copy(language, '미소유 숫자 = 매입 · 소유 숫자 = 통행료', 'Sin dueño: compra · Con dueño: alquiler')}</span></div>
            {tiles.length === 40 && <img className="mp-world-map" src="/images/marble/world-map-board.webp" alt="" aria-hidden="true" decoding="async"/>}
            <div className="mp-center-route">{num(board.cityRouteVersion)===5?<span>{copy(language,'세계 도시와 섬 · 32칸','Ciudades e islas · 32 casillas')}</span>:num(board.cityRouteVersion)===4?<span>{copy(language,'한국맵 · 연구용 미리보기 · 플레이 불가','Corea · vista de investigación · no jugable')}</span>:num(board.cityRouteVersion) >= 2 ? <span>{copy(language, '광주 → 뉴욕 → 산토도밍고 → 뉴어크 → 서울 → 광주', 'Gwangju → Nueva York → Santo Domingo → Newark → Seúl → Gwangju')}</span> : <><span>{copy(language, '광주 출발', 'Desde Gwangju')}</span><span className="mp-route-line" aria-hidden="true">↗</span><span>{copy(language, '세계 여행', 'Viaje mundial')}</span></>}</div>
            <div className="mp-map-hud"><span>{copy(language, '턴', 'Turno')} <b>{currentTurn} / 120</b></span>{modern && <span>{copy(language, '공동 기금', 'Fondo común')} <b>{moneyText(fund, language)}</b></span>}</div>
            {modern && <section data-marble-space-action={spaceAction} className={`mp-center-stage mp-stage--${journeyInFlight ? 'moving' : phase} ${primaryChoice?.action.type === 'endTurn' ? 'mp-stage--secondary' : ''}`} aria-label={copy(language, '현재 도착과 다음 행동', 'Llegada y acción actual')}>
              {!journeyInFlight && active && phase==='event-decision' && board.pendingEvent ? <MarbleCardDecision ownerCash={num(record(money)[primaryTile.owner])} ownerShields={num(record(board.cityShields)[primaryTile.owner])} laps={num(record(board.completedLaps)[playerId])} constructionRulesVersion={num(board.constructionRulesVersion)} festivalRulesVersion={num(board.festivalRulesVersion)} source={board.pendingEventSource} id={board.pendingEvent.id} tile={{...primaryTile,economicVersion:economyVersion}} actor={playerId} choices={eventCityActions} choice={selectedDestination} owner={validSeat(primaryTile.owner)?seatLabel(primaryTile.owner):copy(language,'은행','Banco')} language={language} disabled={interactionLocked} onChoose={setTarget} onConfirm={dispatch}/> : showCardOutcome ? <MarbleCardOutcome passSalary={marblePassStartSalary(economyVersion,board.economyProfile)} outcome={cardOutcome!} pendingCount={cardQueue.remaining} waiting={phase==='event-decision'?copy(language,`${seatLabel(activeSeat)} 님이 효과를 적용할 도시를 선택하고 있어요.`,`${seatLabel(activeSeat)} está eligiendo la ciudad para el efecto.`):undefined} actorName={validSeat(cardOutcome?.card.actor??cardOutcome?.card.playerId)?seatLabel(cardOutcome!.card.actor??cardOutcome!.card.playerId):undefined} names={Object.fromEntries(players.map(seat=>[seat,seatLabel(seat)]))} language={language} economicVersion={economyVersion} constructionRulesVersion={num(board.constructionRulesVersion)} disabled={motionBusy.current} onContinue={()=>{cardQueue.acknowledge();setAcknowledgedReceipt(old=>Math.max(old,num(cardOutcome?.result.sequence)));setFeedbackVisible(false);}}/> : showEventFeedback ? <div className="mp-context-event"><MarbleEventStage passSalary={marblePassStartSalary(economyVersion,board.economyProfile)} events={stageEvents} event={presentedEvent} playerNames={Object.fromEntries(players.map(seat=>[seat,{ko:seatLabel(seat),es:seatLabel(seat)}]))} animating={!reduced} language={language} playerId={playerId} result={view.result} economicVersion={economyVersion} constructionRulesVersion={num(board.constructionRulesVersion)}/><button data-marble-space-continue="" className="mp-action mp-action-secondary" onClick={()=>{setAcknowledgedReceipt(actionSequence);setFeedbackVisible(false);}}>{copy(language,'계속','Continuar')}</button></div> : journeyInFlight ? <div className="mp-moving-status" aria-live="polite"><h2>{copy(language, '여행 중', 'En camino')}</h2><div className={`mp-stage-dice ${diceRolling?'is-rolling':''}`}>{[0, 1].map(index => <MarbleDie key={`${diceSequence}-moving-${index}`} value={rollValues[index] ?? 0} language={language}/>)}</div><p>{copy(language, '말이 한 칸씩 이동하고 있어요', 'La ficha avanza casilla por casilla')}</p></div> : active&&phase==='debt' ? <div className="mp-debt-decision"><header><h2>{copy(language,'지급할 돈이 부족해요','Falta dinero para pagar')}</h2></header>
            <MarblePropertySale compact initiallyOpen={!actionOf('borrow')} choices={actionsOf('sell-property')} cash={num(money[playerId])} obligation={num(pendingPayment.amount)} preview={index=>{const city=tiles[index];return {name:String(record(city.name)[language]??''),buildings:constructionLabel(city,language)||buildingName(num(city.houses),language,modern)||copy(language,'빈 땅','Terreno vacío'),refund:city.kind==='tourism'?num(city.price)/2:city.cityEconomy?classicSaleValue(city.cityEconomy,{...city,houses:num(city.houses)}):Math.floor((constructionV2?constructionValueAtPrice(num(city.price),city,economyVersion):marbleCityValueAtPrice(num(city.price),num(city.houses),economyVersion))/2),toll:rentValue(city,modern,economyVersion),groupLost:monopolyGroups.some(group=>group.complete&&group.tiles.includes(index)),groupTollLost:num(city.monopolyMultiplier)>1};}} language={language} runAction={dispatch} disabled={interactionLocked}/>
            {actionsOf('declare-bankruptcy').map(choice => <div className="mp-bankruptcy-confirm" key={String(choice.action.type)}>
              {!confirmBankruptcy ? <button className="mp-action mp-action-danger" type="button" disabled={interactionLocked} onClick={() => setConfirmBankruptcy(true)}>{copy(language, '파산하기', 'Declararse en quiebra')}</button> : <>
                <p role="alert">{copy(language, '매각이나 대출로 갚을 수 있어도 파산할 수 있어요. 확정하면 즉시 패배하고 경기가 끝나며 되돌릴 수 없습니다.', 'Puedes declararte en quiebra aunque puedas vender o pedir un préstamo. Al confirmar, pierdes y la partida termina. No se puede deshacer.')}</p>
                <button className="mp-action mp-action-danger" type="button" disabled={interactionLocked} onClick={() => run(choice)}>{copy(language, '파산 확정', 'Confirmar quiebra')}</button>
                <button className="mp-action mp-action-secondary" type="button" onClick={() => setConfirmBankruptcy(false)}>{copy(language, '돌아가기', 'Volver')}</button>
              </>}
            </div>)}
</div> : active&&phase==='island' ? <MarbleIslandDecision choices={choices} turns={islandRemaining} passes={escapePassCount} cash={num(money[playerId])} language={language} disabled={interactionLocked} onAction={dispatch} id="mp-action-primary"/> : active&&phase==='train-decision' ? <div className="mp-travel-decision"><h2>{selectedDestination?String(record(primaryTile.name)[language]??''):copy(language,'세계여행','Viaje mundial')}</h2><p id="mp-travel-prompt" tabIndex={-1}>{copy(language,'보드에서 도착할 칸을 눌러 선택하세요.','Pulsa una casilla del tablero para elegir destino.')}</p>{selectedDestination&&<MarbleTravelPreview language={language} owner={validSeat(primaryTile.owner)?seatLabel(primaryTile.owner):copy(language,'은행','Banco')} preview={travelPreview({tile:{...primaryTile,economicVersion:economyVersion},visitor:playerId,position:pos,destination:primaryIndex,fare:num(board.pendingTrainFare??100),cash:num(money[playerId]),salary:marblePassStartSalary(economyVersion,board.economyProfile),fundPool:fund,passes:num(record(board.rentPasses)[playerId])})}/>}<footer className="mp-construction-footer"><button type="button" className="mp-construction-cancel" disabled={interactionLocked||!actionOf('skip-train')} onClick={()=>{const skip=actionOf('skip-train');if(skip)void dispatch(skip.action);}}>{copy(language,'여행하지 않기','No viajar')}</button><button id="mp-action-primary" type="button" className="mp-action mp-action-primary" disabled={interactionLocked||!selectedDestination} onClick={()=>{if(selectedDestination)void dispatch(selectedDestination.action);}}>{copy(language,'선택한 칸으로 여행','Viajar a la casilla elegida')}</button></footer><small>{String(actionOf('skip-train')?.label[language]??'').replace('세계여행를','여행을')}</small></div> : acquisitionContext||tourismPurchase ? <MarbleOwnershipDecision id="mp-action-primary" mode={tourismPurchase?'tourism':'takeover'} tile={currentTile} cost={tourismPurchase?num(currentTile.price):num(board.takeoverOffer?.price)} cash={num(money[playerId])} rent={rentValue(ownershipPreview(tiles,pos,playerId,marbleColorTollBonus(board)),modern,economyVersion)} recipient={validSeat(currentTile.owner)?seatLabel(currentTile.owner):undefined} discountCost={tourismPurchase?null:board.takeoverOffer?.discountPrice} discount={actionsOf('takeover').find(choice=>choice.action.payload?.useDiscountPass===true)?.action} primary={(tourismPurchase?buy:actionsOf('takeover').find(choice=>!choice.action.payload?.useDiscountPass))?.action} skip={(tourismPurchase?decline:endTurn)?.action} language={language} disabled={interactionLocked} onAction={dispatch}/> : active && primaryChoice && ['buy','build'].includes(primaryChoice.action.type) ? <div className="mp-construction-stage">{primaryChoice.action.type==='build'&&buildActions.length>1&&<label className="mp-construction-site">{copy(language,'건설 도시','Ciudad')}<select value={primaryIndex} disabled={interactionLocked} onChange={event=>setSelectedTile(Number(event.target.value))}>{buildActions.map(option=>{const index=num(option.action.payload?.tile);return <option key={index} value={index}>{String(record(tiles[index]?.name)[language]??'')}</option>;})}</select></label>}{constructionV2 ? <MarbleConstructionPicker routeVersion={num(board.cityRouteVersion)||3} key={`${phase}:${primaryIndex}:${actionSequence}`} id="mp-action-primary" choices={actionsOf(primaryChoice.action.type).filter(choice=>primaryChoice.action.type==='buy'||num(choice.action.payload?.tile)===primaryIndex)} tile={{...primaryTile,...(primaryChoice.action.type==='buy'?ownershipAfter:{}),economicVersion:economyVersion}} cash={num(money[playerId])} laps={num(record(board.completedLaps)[playerId])} language={language} disabled={interactionLocked} onConfirm={dispatch} onCancel={()=>{const skip=primaryChoice.action.type==='buy'?decline:endTurn;if(skip)return dispatch(skip.action);}}/> : <MarbleLegacyConstructionPanel key={`${phase}:${primaryIndex}:${actionSequence}`} id="mp-action-primary" action={primaryChoice.action} choices={actionsOf(primaryChoice.action.type).filter(choice=>primaryChoice.action.type==='buy'||num(choice.action.payload?.tile)===primaryIndex)} economicVersion={economyVersion} tile={{...primaryTile,...(primaryChoice.action.type==='buy'?ownershipAfter:{})}} cash={num(money[playerId])} cost={primaryCost} resultingRent={primaryChoice.action.type==='build'?primaryNextBuildRent:rentValue(ownershipAfter,modern,economyVersion)} language={language} disabled={interactionLocked} onConfirm={dispatch} onCancel={()=>{const skip=primaryChoice.action.type==='buy'?decline:endTurn;if(skip)return dispatch(skip.action);}}/>}</div> : phase === 'roll' && selectedTile !== pos && ['property','tourism'].includes(selectedCity.kind) ? <>
                <figure className="mp-stage-art">{<MarblePropertyArt routeVersion={num(board.cityRouteVersion)} language={language} city={selectedCityArt??''} level={num(selectedCity.houses)} buildings={selectedCity.buildings} landmark={selectedCity.landmark} owner={selectedOwner} ownerLabel={selectedOwner?seatLabel(selectedOwner):copy(language,'은행','Banco')}/>}</figure>
                <div className="mp-stage-details"><small>{copy(language,'선택한 도시 · 현재 행동은 주사위','Ciudad seleccionada · lanza los dados')}</small><h2>{String(record(selectedCity.name)[language] ?? '')}</h2><p className="mp-stage-property-line">{selectedOwner?seatLabel(selectedOwner):copy(language,'은행 소유','Del banco')} · {(constructionLabel(selectedCity,language)||buildingName(num(selectedCity.houses),language,true))||copy(language,'빈 땅','Terreno vacío')} · {copy(language,'통행료','Alquiler')} {moneyText(selectedRent,language)}</p><div className="mp-stage-preview"><span><small>{copy(language,'매입가','Precio de compra')}</small><b>{moneyText(num(selectedCity.price),language)}</b></span><span><small>{copy(language,'기본 통행료','Alquiler base')}</small><b>{moneyText(selectedRent,language)}</b></span></div>{active&&roll&&<button id="mp-action-primary" className="mp-action mp-action-primary" type="button" disabled={interactionLocked} onClick={() => run(roll)}>{copy(language,'주사위 굴리기','Lanzar los dados')}</button>}</div>
              </> : phase === 'roll' ? <>
                <h2>{active ? copy(language, '다음 여행을 시작하세요', 'Empieza el próximo viaje') : phaseLabel}</h2>
                <div className={`mp-stage-dice ${diceRolling ? 'is-rolling' : ''}`}>{[0, 1].map(index => <MarbleDie key={`${diceSequence}-center-${index}`} value={rollValues[index] ?? 0} language={language}/>)}</div>
                {active && roll && <button id="mp-action-primary" className="mp-action mp-action-primary" type="button" disabled={interactionLocked} onClick={() => run(roll)}>{copy(language, '주사위 굴리기', 'Lanzar los dados')}</button>}
              </> : <>
                {['property','tourism'].includes(primaryTile.kind) ? <figure className={`mp-stage-art ${changedProperties.includes(primaryIndex) ? 'is-upgrading' : ''}`} key={`${primaryCityArt}-${num(primaryTile.houses)}`}><MarblePropertyArt routeVersion={num(board.cityRouteVersion)} language={language} city={primaryCityArt??''} level={num(primaryTile.houses)} buildings={primaryTile.buildings} landmark={primaryTile.landmark} owner={validSeat(primaryTile.owner) ? primaryTile.owner : null} ownerLabel={validSeat(primaryTile.owner) ? seatLabel(primaryTile.owner) : copy(language, '은행', 'Banco')}/></figure> : <span className="mp-stage-special" aria-hidden="true">{marbleSpecialDestinationImage(primaryTile.kind)?<img className="mp-destination-stage-art" src={marbleSpecialDestinationImage(primaryTile.kind)} alt=""/>:<svg viewBox="0 0 32 32"><use href={`/images/marble/tile-symbols.svg#${primaryTile.kind === 'fund-deposit' ? 'fund-pay' : primaryTile.kind === 'event' ? 'key' : String(primaryTile.kind ?? 'rest')}`}/></svg>}</span>}
                <div className="mp-stage-details">
                  <small className="mp-center-action-phase">{primaryChoice?.action.type === 'build' ? copy(language, '도시 건설', 'Construir ciudad') : phaseLabel}</small>
                  <h2>{String(record(primaryTile.name)[language] ?? record(primaryTile.name).ko ?? copy(language, '여행', 'Viaje'))}</h2>
                  {['property','tourism'].includes(primaryTile.kind) ? <p className="mp-stage-property-line">{validSeat(primaryTile.owner) ? seatLabel(primaryTile.owner) : copy(language, '은행 소유 · 구매 가능', 'Del banco · disponible')} · {(constructionLabel(primaryTile,language)||buildingName(num(primaryTile.houses), language, true)) || copy(language, '미건설', 'Sin construir')} · {copy(language, `기본 통행료 ${moneyText(primaryBuildRent, language)}`, `Alquiler base ${moneyText(primaryBuildRent, language)}`)}</p> : <p className="mp-stage-property-line">{primaryTile.kind==='event' && phase==='main' ? <span>{copy(language,'카드 효과 처리가 끝났어요. 차례를 마치세요.','El efecto de la carta terminó. Finaliza el turno.')}</span> : <ImpactText tile={primaryTile} language={language} fund={fund} modern={modern} economicVersion={economyVersion}/>}</p>}
                  {!constructionV2 && phase === 'decision' && ['property','tourism'].includes(primaryTile.kind) && <MarbleDecisionPreview kind="buy" cost={num(primaryTile.price)} cashAfter={num(money[playerId])-num(primaryTile.price)} tollBefore={0} tollAfter={rentValue(ownershipAfter, modern, economyVersion)} shortfall={pendingPurchaseShortfall} language={language}/>}
                  {!constructionV2 && primaryChoice?.action.type === 'build' && <MarbleDecisionPreview kind="build" cost={primaryCost} cashAfter={primaryAfterCash} tollBefore={primaryBuildRent} tollAfter={primaryNextBuildRent} levelBefore={num(primaryTile.houses)} language={language}/>}
                  {constructionV2 && phase==='main' && primaryTile.owner===playerId && !primaryTile.landmark && primaryTile.buildings?.length===3 && !list(board.landmarkOptions).includes(primaryIndex) && <p className="mp-landmark-rule">{copy(language,'3종 건설 완료 · 랜드마크는 이 도시 재방문 또는 출발 정확 도착 때 건설해요.','Tres edificios completos. Construye el monumento al revisitar la ciudad o llegar exactamente a Salida.')}</p>}
                  {phase === 'main' && board.constructionRulesVersion === 1 && <p className="mp-landmark-rule">{copy(language, '첫 구매는 2단계까지. 기존 2단계 도시 인수 직후 또는 재방문·출발 정확 도착 때 랜드마크 가능', 'Compra inicial hasta nivel 2. Monumento al adquirir una ciudad ya de nivel 2, revisitarla o llegar a Salida')}</p>}
                  {active && phase === 'main' && buildActions.length > 1 && <label className="mp-stage-build-choice">{copy(language,'건설할 도시 선택','Elige una ciudad para construir')}<select value={primaryChoice?.action.type==='build'?num(primaryChoice.action.payload?.tile):num(buildActions[0].action.payload?.tile)} onChange={event=>setSelectedTile(Number(event.target.value))}>{buildActions.map(choice=>{const index=num(choice.action.payload?.tile),city=tiles[index];return <option key={index} value={index}>{String(record(city.name)[language]??'')} · {constructionV2?constructionLabel(city,language):num(city.houses)===2?copy(language,'랜드마크','Monumento'):copy(language,`${num(city.houses)+1}단계`,`nivel ${num(city.houses)+1}`)}{!constructionV2&&` · ${moneyText(num(city.nextBuildCost),language)}`}</option>;})}</select></label>}
                  {primaryChoice?.action.type === 'takeover' && <MarbleDecisionPreview kind="takeover" cost={primaryCost} cashAfter={primaryAfterCash} tollBefore={primaryBuildRent} tollAfter={rentValue(ownershipAfter, modern, economyVersion)} groupChange={ownershipAfter.colorComplete?copy(language,'인수 후 내 색상 그룹 완성','Grupo propio completo tras adquirir')+(ownershipAfter.monopolyMultiplier===2?copy(language,' · 통행료 2배',' · alquiler doble'):''):monopolyGroups.some(group=>group.complete&&group.tiles.includes(primaryIndex))?copy(language,'기존 소유자의 그룹 독점 해제','Se rompe el grupo del antiguo dueño'):undefined} recipient={validSeat(board.takeoverOffer?.owner)?seatLabel(board.takeoverOffer.owner):undefined} language={language}/>}
                  {primaryChoice?.action.type === 'pay-rent' && <MarbleDecisionPreview kind="rent" cost={primaryCost} cashAfter={primaryAfterCash} tollBefore={primaryCost} tollAfter={primaryCost} recipient={validSeat(board.pendingRent?.creditor)?seatLabel(board.pendingRent.creditor):undefined} language={language}/>}
                  {unavailableBuild && <p className="mp-stage-shortfall" role="status">{copy(language,`${String(record(unavailableBuild.tile.name)[language])} 최소 추가 건설 ${moneyText(unavailableBuild.cost,language)} · ${moneyText(unavailableBuild.cost-num(money[playerId]),language)} 부족`,`${String(record(unavailableBuild.tile.name)[language])}: construcción mínima ${moneyText(unavailableBuild.cost,language)} · faltan ${moneyText(unavailableBuild.cost-num(money[playerId]),language)}`)}</p>}
                  {unaffordableBuild && <p className="mp-stage-shortfall" role="status">{copy(language, `${String(record(unaffordableBuild.tile.name)[language] ?? '')} 다음 건설 ${moneyText(num(unaffordableBuild.tile.nextBuildCost), language)} · ${moneyText(num(unaffordableBuild.tile.nextBuildCost) - num(money[playerId]), language)} 부족`, `${String(record(unaffordableBuild.tile.name).es ?? '')} próximo nivel ${moneyText(num(unaffordableBuild.tile.nextBuildCost), language)} · faltan ${moneyText(num(unaffordableBuild.tile.nextBuildCost) - num(money[playerId]), language)}`)}</p>}
                  {phase==='train-decision'&&active&&<p id="mp-travel-prompt" tabIndex={-1} className="mp-travel-board-prompt">{copy(language,selectedDestination?'다른 칸을 눌러 목적지를 바꿀 수 있어요.':'보드에서 도착할 칸을 눌러 주세요. 모든 칸을 선택할 수 있어요.',selectedDestination?'Pulsa otra casilla para cambiar el destino.':'Pulsa cualquier casilla del tablero para elegir destino.')}</p>}

                  {constructionV2 && active && primaryChoice && ['buy','build'].includes(primaryChoice.action.type) && <MarbleConstructionPicker routeVersion={num(board.cityRouteVersion)||3} key={`${phase}:${primaryIndex}:${actionSequence}`} id="mp-action-primary" choices={actionsOf(primaryChoice.action.type).filter(choice=>primaryChoice.action.type==='buy'||num(choice.action.payload?.tile)===primaryIndex)} tile={{...primaryTile,...(primaryChoice.action.type==='buy'?ownershipAfter:{}),economicVersion:economyVersion}} cash={num(money[playerId])} laps={num(record(board.completedLaps)[playerId])} language={language} disabled={interactionLocked} onConfirm={dispatch}/>}
                  {phase === 'train-decision' && selectedDestination && <MarbleTravelPreview language={language} owner={validSeat(primaryTile.owner)?seatLabel(primaryTile.owner):copy(language,'은행','Banco')} preview={travelPreview({tile:{...primaryTile,economicVersion:economyVersion},visitor:playerId,position:pos,destination:primaryIndex,fare:num(board.pendingTrainFare??100),cash:num(money[playerId]),salary:marblePassStartSalary(economyVersion,board.economyProfile),fundPool:fund,passes:num(record(board.rentPasses)[playerId])})}/>}
                  {primaryChoice && active && !(constructionV2 && ['buy','build'].includes(primaryChoice.action.type)) && <button id="mp-action-primary" className="mp-action mp-action-primary" type="button" disabled={interactionLocked || (primaryChoice.action.type === 'buy' && pendingPurchaseShortfall > 0)} onClick={() => run(primaryChoice)}>{needsCityChoice ? phase === 'event-decision' ? copy(language, '이 도시 선택', 'Aplicar a esta ciudad') : copy(language, '이 칸으로 이동', 'Viajar a esta casilla') : primaryChoice.action.type === 'buy' ? copy(language, `구매 · ${moneyText(primaryCost, language)}`, `Comprar · ${moneyText(primaryCost, language)}`) : primaryChoice.action.type === 'build' ? copy(language, `이 도시에 건설 · ${moneyText(primaryCost, language)}`, `Construir aquí · ${moneyText(primaryCost, language)}`) : primaryChoice.label[language]}</button>}
                  {primaryChoice?.action.type === 'build' && endTurn && active && <button className="mp-action mp-action-secondary" type="button" disabled={interactionLocked} onClick={() => run(endTurn)}>{copy(language, '건설하지 않고 차례 마치기', 'Terminar sin construir')}</button>}
                  {phase === 'rent-decision' && actionOf('use-rent-pass') && num(record(board.rentPasses)[playerId]) > 0 && active && <button className="mp-action mp-action-secondary" type="button" disabled={interactionLocked} onClick={() => run(actionOf('use-rent-pass'))}>{actionOf('use-rent-pass')?.label[language]}</button>}
                  {phase === 'decision' && decline && active && <button className="mp-action mp-action-secondary" type="button" disabled={interactionLocked} onClick={() => run(decline)}>{copy(language, '이번에는 지나가기', 'Pasar esta vez')}</button>}
                </div>
              </>}
              {!showCardOutcome && !acquisitionContext && !tourismPurchase && !['buy','build'].includes(primaryChoice?.action.type??'') && num(currentReceipt?.sequence)>acknowledgedReceipt && phase!=='event-decision' && currentReceipt && !showEventFeedback && !diceRolling && !traveler && <MarbleTransactionReceipt title={String(record(latestTransaction.title)[language] ?? '')} detail={String(record(latestTransaction.text)[language] ?? '')} flow={latestTransaction.fromAccount && latestTransaction.toAccount && num(latestTransaction.amount) > 0 ? `${accountLabel(latestTransaction.fromAccount)} → ${accountLabel(latestTransaction.toAccount)} · ${moneyText(num(latestTransaction.amount), language)}` : undefined} delta={typeof record(latestTransaction.moneyDelta)[playerId] === 'number' ? num(record(latestTransaction.moneyDelta)[playerId]) : undefined} language={language}/>}
            </section>}


          </div>
      </MarbleBoardShell>

      <aside className="mp-dashboard" aria-label={copy(language, '게임 현황과 행동', 'Estado y acciones')}>
        {!view.result&&<div className="mp-finance-entry"><MarbleFinancePanel compact active={active} loanRulesVersion={num(board.loanRulesVersion)} cash={num(money[playerId])} debt={num(debt[playerId])} due={active&&phase==='debt'?num(pendingPayment.amount):0} borrow={actionOf('borrow')?.action} repay={actionOf('repay')?.action} language={language} disabled={interactionLocked} onAction={dispatch}/></div>}
        <section className="mp-scoreboard" aria-label={copy(language, '현금과 총 자산', 'Efectivo y activos totales')}>
          {players.map(seat => {
            const own = ownedBy(seat);
            return <MarblePlayerHud key={seat} seat={seat} name={seatLabel(seat)} pawn={pawnId(record(board.pawns)[seat]) ?? (seat === 'p1' ? 'fox' : 'cat')} cash={num(hudMoney[seat])} assets={num(hudAssets[seat])} scoreLabel={scoreLabel} active={board.turn===seat} self={seat===playerId} language={language} resetKey={`${playerId}:marble`} meta={{debt:num(debt[seat]),cities:own.length,landmarks:modern?own.filter(({tile})=>num(tile.houses)>=3).length:0,groups:list(record(board.monopolies)[seat]).length,rentPasses:num(record(board.rentPasses)[seat]),takeoverDiscountPasses:num(record(board.takeoverDiscountPasses)[seat]),escapePasses:num(record(board.escapePasses)[seat]),cityShields:num(record(board.cityShields)[seat])}}/>;
          })}
        </section>

        <MarbleMonopolyStatus tiles={tiles} seats={players} boardProfile={String(board.boardProfile ?? '')} boardRevision={num(board.boardRevision)} groups={monopolyGroups} playerId={playerId} language={language} seatLabel={seatLabel}/>
        {pawnChoices.length > 0 && <details className="mp-pawn-picker-shell mp-city-detail"><summary>{copy(language, '말 선택', 'Elegir ficha')}</summary><MarblePawnPicker view={view} playerId={playerId} language={language} runAction={dispatch} disabled={interactionLocked}/></details>}

        <section ref={actionPanelRef} id="marble-current-action" tabIndex={-1} className="mp-turn-panel" aria-label={copy(language, '주사위와 행동', 'Dados y acciones')}>
          {spaceAction && <small className="mp-space-hint">{language === 'ko' ? 'Space · 현재 행동 실행' : 'Espacio · acción actual'}</small>}<div className="mp-phase-title"><h3>{phaseLabel}</h3><span>{copy(language, `턴 ${currentTurn}`, `Turno ${currentTurn}`)} / 120</span></div>
          <div className={`mp-dice-row ${diceRolling ? 'is-rolling' : ''}`} aria-label={copy(language, '최근 주사위 결과', 'Último resultado de los dados')}>
            {[0, 1].map(index => <MarbleDie key={`${diceSequence}-${index}`} value={rollValues[index] ?? 0} language={language}/>)}
            {rollValues.length >= 2 && <b className="mp-dice-total">{rollValues[0] + rollValues[1]}</b>}
          </div>
          <div className="mp-current-tile" aria-live="polite"><span className="mp-current-flag">{cityFlag(record(currentTile.name)) && <img src={`/images/marble/flags/${cityFlag(record(currentTile.name))}.svg`} alt="" loading="lazy" decoding="async"/>}</span><div>{currentTile.kind==='event'&&phase==='main'?<><b>{String(record(currentTile.name)[language]??'')}</b><span>{copy(language,'카드 효과 처리 완료','Efecto de carta completado')}</span></>:<ImpactText tile={currentTile} language={language} fund={fund} modern={modern} economicVersion={economyVersion}/>}</div>{ownerName && <b className="mp-current-owner">{ownerName}</b>}</div>

          {active && phase === 'train-decision' && <p className="mp-train-help">{copy(language, `운임 ${num(board.pendingTrainFare ?? 100)}을 내고 보드의 모든 칸 중 목적지를 직접 눌러 선택하세요. 취소하려면 여행하지 않기를 누르세요.`, `El pasaje cuesta ${num(board.pendingTrainFare ?? 100)}. Puedes elegir cualquier ciudad, aunque tenga dueño. Si no hay destinos disponibles, puedes pasar el tren.`)}</p>}

          {active && phase === 'rent-decision' && <div className="mp-payment-alert" role="status"><b>{copy(language, '통행료를 내거나 면제권을 쓰세요', 'Paga la renta o usa tu pase')}</b><span>{board.pendingRent?.reason?.[language]}</span><strong>{moneyText(num(board.pendingRent?.amount), language)}</strong></div>}
          {phase === 'debt' && <div className="mp-payment-alert" role="status"><b>{copy(language, '결제가 필요해요', 'Hay un pago pendiente')}</b><span>{String(pendingPayment.reason?.[language] ?? '')}</span><strong>{moneyText(num(pendingPayment.amount), language)}</strong></div>}

          {!constructionV2 && purchaseCost !== null && <div className="mp-purchase-recap"><span>{copy(language, `구매 후 현금 ${moneyText(num(money[playerId]) - purchaseCost, language)}`, `Efectivo después ${moneyText(num(money[playerId]) - purchaseCost, language)}`)}</span></div>}
          {active && !acquisitionContext && board.takeoverOffer && <p className="mp-purchase-recap">{board.takeoverOffer.price == null ? copy(language, '랜드마크 · 인수 불가', 'Monumento · no se puede adquirir') : copy(language, `인수 ${board.takeoverOffer.price} · 인수 후 현금 ${num(money[playerId]) - board.takeoverOffer.price}`, `Adquirir ${board.takeoverOffer.price} · efectivo después ${num(money[playerId]) - board.takeoverOffer.price}`)}</p>}
          {!constructionV2 && buildActions.some(choice => !isPrimary(choice)) && <section className="mp-build-shortcut" aria-label={copy(language, '건설 가능한 도시', 'Ciudades disponibles para construir')}>
            <strong>{copy(language, `건설 가능한 도시 ${buildActions.length}곳`, `${buildActions.length} ciudades disponibles`)}</strong>
            {buildActions.filter(choice => !isPrimary(choice)).map(choice => {
              const index = num(choice.action.payload?.tile), city = tiles[index] ?? {}, cost = num(city.nextBuildCost), next = num(city.nextRent), current = rentValue(city, modern, economyVersion);
              return <div className="mp-build-option" key={index}>
                <span><b>{choice.label[language]}</b><small>{copy(language, `건설 후 현금 ${moneyText(num(money[playerId]) - cost, language)} · 통행료 ${moneyText(current, language)} → ${moneyText(next, language)}`, `Efectivo después ${moneyText(num(money[playerId]) - cost, language)} · renta ${moneyText(current, language)} → ${moneyText(next, language)}`)}</small></span>
                <button className="mp-action mp-action-primary" type="button" disabled={interactionLocked} onClick={() => {setSelectedTile(index);requestAnimationFrame(()=>document.querySelector<HTMLElement>('#mp-action-primary')?.focus());}}>{copy(language, '단계 선택', 'Elegir nivel')}<span aria-hidden="true">↗</span></button>
              </div>;
            })}
          </section>}
          {travelNotice&&<p role="status" className="mp-travel-notice">{travelNotice}</p>}{hasSecondaryActions&&!(modern&&phase==='debt')&&<div className="mp-actions"><fieldset disabled={interactionLocked}><legend className="sr-only">{copy(language, '가능한 행동', 'Acciones disponibles')}</legend>
            {roll && !isPrimary(roll) && <button className="mp-action mp-action-primary" type="button" onClick={() => run(roll)}>{copy(language, '주사위 굴리기', 'Lanzar los dados')}<span aria-hidden="true">↗</span></button>}
            {actionsOf('takeover').filter(choice => !acquisitionContext&&!isPrimary(choice)).map(choice => <button className="mp-action mp-action-primary" key="takeover" onClick={() => run(choice)}>{choice.label[language]}</button>)}
            {buy && !isPrimary(buy) && <button className="mp-action mp-action-primary" type="button" onClick={() => run(buy)}>{copy(language, `구매 · ${moneyText(num(board.tiles[pos]?.price), language)}`, `Comprar · ${moneyText(num(board.tiles[pos]?.price), language)}`)}<span aria-hidden="true">↗</span></button>}
            {decline && (!modern||(!tourismPurchase&&primaryChoice?.action.type!=='buy'&&!isPrimary(decline))) && <button className="mp-action mp-action-secondary" type="button" disabled={interactionLocked} onClick={() => run(decline)}>{copy(language, '구매하지 않고 지나가기', 'Continuar sin comprar')}</button>}
            {endTurn && !acquisitionContext && !isPrimary(endTurn) && primaryChoice?.action.type !== 'build' && <button className="mp-action mp-action-secondary" type="button" onClick={() => run(endTurn)}>{endTurn.label[language]}<span aria-hidden="true">→</span></button>}
            {!modern && eventCityActions.length > 0 && <TrainChooser key={String(board.pendingEvent?.id)} choices={eventCityActions} language={language} runAction={dispatch} eventCity/>}
            {['pay-rent', 'use-rent-pass'].flatMap(type => actionsOf(type)).filter(choice => !isPrimary(choice) && choice.action.type !== 'use-rent-pass').map(choice => <button className="mp-action mp-action-primary" key={`${choice.action.type}-${JSON.stringify(choice.action.payload ?? {})}`} type="button" disabled={interactionLocked} onClick={() => run(choice)}>{copy(language, '파산 확정', 'Confirmar quiebra')}</button>)}
            {!modern && trainActions.length > 0 && <TrainChooser choices={trainActions} language={language} runAction={dispatch}/>}
            {actionsOf('skip-train').filter(choice=>!modern&&!isPrimary(choice)).map(choice => <button className="mp-action mp-action-secondary" key={String(choice.action.type)} type="button" disabled={interactionLocked} onClick={() => run(choice)}>{copy(language, '파산 확정', 'Confirmar quiebra')}</button>)}
            {!modern&&<>
            <MarblePropertySale choices={actionsOf('sell-property')} cash={num(money[playerId])} obligation={num(pendingPayment.amount)} preview={index=>{const city=tiles[index];return {name:String(record(city.name)[language]??''),buildings:constructionLabel(city,language)||buildingName(num(city.houses),language,modern)||copy(language,'빈 땅','Terreno vacío'),refund:city.kind==='tourism'?num(city.price)/2:city.cityEconomy?classicSaleValue(city.cityEconomy,{...city,houses:num(city.houses)}):Math.floor((constructionV2?constructionValueAtPrice(num(city.price),city,economyVersion):marbleCityValueAtPrice(num(city.price),num(city.houses),economyVersion))/2),toll:rentValue(city,modern,economyVersion),groupLost:monopolyGroups.some(group=>group.complete&&group.tiles.includes(index)),groupTollLost:num(city.monopolyMultiplier)>1};}} language={language} runAction={dispatch} disabled={interactionLocked}/>
            {actionsOf('declare-bankruptcy').map(choice => <div className="mp-bankruptcy-confirm" key={String(choice.action.type)}>
              {!confirmBankruptcy ? <button className="mp-action mp-action-danger" type="button" disabled={interactionLocked} onClick={() => setConfirmBankruptcy(true)}>{copy(language, '파산하기', 'Declararse en quiebra')}</button> : <>
                <p role="alert">{copy(language, '매각이나 대출로 갚을 수 있어도 파산할 수 있어요. 확정하면 즉시 패배하고 경기가 끝나며 되돌릴 수 없습니다.', 'Puedes declararte en quiebra aunque puedas vender o pedir un préstamo. Al confirmar, pierdes y la partida termina. No se puede deshacer.')}</p>
                <button className="mp-action mp-action-danger" type="button" disabled={interactionLocked} onClick={() => run(choice)}>{copy(language, '파산 확정', 'Confirmar quiebra')}</button>
                <button className="mp-action mp-action-secondary" type="button" onClick={() => setConfirmBankruptcy(false)}>{copy(language, '돌아가기', 'Volver')}</button>
              </>}
            </div>)}
</>}
            {otherActions.map((choice, index) => <button className="mp-action mp-action-secondary" key={`${choice.action.type}-${index}`} type="button" disabled={interactionLocked} onClick={() => run(choice)}>{copy(language, '파산 확정', 'Confirmar quiebra')}</button>)}
            {!active && !view.result && <p className="mp-waiting">{copy(language, '상대가 차례를 진행하고 있어요.', 'Tu pareja está jugando su turno')}</p>}
          </fieldset></div>}
        </section>



        <details ref={cityDetailsRef} className="mp-city-detail" data-marble-owner={selectedOwner ?? 'bank'} aria-label={selectedName}><summary>{copy(language, '도시 상세 · ', 'Detalles · ')}{selectedName}</summary>
          <div className="mp-city-detail-head"><div><small>{copy(language, '선택한 칸', 'Casilla seleccionada')}</small><span>{selectedTile === pos ? copy(language, '현재 행동 위치', 'Ubicación de acción') : copy(language, `현재 행동은 ${String(record(currentTile.name)[language] ?? record(currentTile.name).ko ?? '')}`, `La acción sigue en ${String(record(currentTile.name)[language] ?? record(currentTile.name).ko ?? '')}`)}</span></div></div>
          {['property','tourism'].includes(selectedCity.kind) ? <>
            <div className="mp-inspector-summary">
              <MarblePropertyArt routeVersion={num(board.cityRouteVersion)} language={language} city={selectedCityArt??''} level={modern ? num(selectedCity.houses) : 0} buildings={selectedCity.buildings} landmark={selectedCity.landmark} owner={selectedOwner} ownerLabel={selectedOwner ? seatLabel(selectedOwner) : copy(language,'은행','Banco')}/>
              <div><h3>{selectedName}</h3><p>{copy(language,'소유','Dueño')} · {selectedOwner ? seatLabel(selectedOwner) : copy(language,'은행','Banco')}</p><p>{(constructionLabel(selectedCity,language)||buildingName(num(selectedCity.houses),language,modern)) || copy(language,'빈 땅','Terreno vacío')}</p><p>{copy(language,'매입가','Compra')} {moneyText(num(selectedCity.price),language)} · {copy(language,selectedOwner?'현재 통행료':'매입 후 통행료',selectedOwner?'Alquiler actual':'Alquiler tras compra')} {moneyText(selectedRent,language)}</p></div>
            </div>
            {!modern && <div className="mp-property-card-rents" aria-label={copy(language,'건설 단계별 통행료','Renta por nivel')}>{rentSteps.map((rent,level)=><span key={level}><small>{level}</small><b>{moneyText(rent,language)}</b></span>)}</div>}
            {modern && <MarblePropertyLedger tile={selectedCity as any} language={language} economicVersion={economyVersion} propertyRulesVersion={num(board.propertyRulesVersion)} constructionRulesVersion={num(board.constructionRulesVersion)} multiplier={num(selectedCity.monopolyMultiplier) || 1} effectiveValues/>}
            {landmarkNote && <p className="mp-landmark-note">{landmarkNote}</p>}
            {nextBuildCost !== null && !selectedBuild && <div className="mp-city-upgrade"><b>{copy(language, '다음 건설 단계', 'Siguiente nivel')}</b><span>{copy(language, `비용 ${moneyText(nextBuildCost, language)}`, `Costo ${moneyText(nextBuildCost, language)}`)}</span><span>{copy(language, `건설 후 통행료 ${moneyText(nextRent, language)}`, `Renta después ${moneyText(nextRent, language)}`)}</span><small>{copy(language, '차례와 규칙 조건을 충족할 때', 'Cuando sea tu turno y cumplas las condiciones')}</small></div>}
            {!constructionV2 && purchaseCost !== null && <div className="mp-city-projection"><b>{copy(language, '구매 예상', 'Compra')}</b><span>{copy(language, `비용 ${moneyText(purchaseCost, language)}`, `Costo ${moneyText(purchaseCost, language)}`)}</span><span>{copy(language, `구매 후 현금 ${moneyText(num(money[playerId]) - purchaseCost, language)}`, `Efectivo después ${moneyText(num(money[playerId]) - purchaseCost, language)}`)}</span></div>}

          </> : <p className="mp-city-special">{journeySpecialLine(selectedCity,language,fund,economyVersion)}</p>}
        </details>




        {stageEvents.length > 0 && <details className="mp-history"><summary>{copy(language, '최근 기록', 'Actividad reciente')} <span>{stageEvents.length}</span></summary>          {latestReceipt.title?.[language] && <div className="mp-latest-receipt" role="status"><small>{copy(language, '최근 행동 · 즉시 반영', 'Última acción · actualizada')}</small><b>{latestReceipt.title[language]}</b><span>{marbleEventText(latestReceipt.text?.[language],language,Object.fromEntries(players.map(seat=>[seat,seatLabel(seat)])))}</span>{typeof latestMoneyReceipt.moneyDelta?.[playerId] === 'number' && <strong>{latestMoneyReceipt !== latestReceipt && latestMoneyReceipt.title?.[language] ? `${latestMoneyReceipt.title[language]} · ` : ''}{copy(language, '내 현금', 'Tu efectivo')} {latestMoneyReceipt.moneyDelta[playerId] > 0 ? '+' : '−'}{moneyText(Math.abs(latestMoneyReceipt.moneyDelta[playerId]), language)}</strong>}</div>}<ol>{stageEvents.slice(-5).reverse().map((event: any) => <li key={num(event.sequence)}><span>{String(record(event.title)[language] ?? '')}</span><small>{marbleEventText(record(event.text)[language],language,Object.fromEntries(players.map(seat=>[seat,seatLabel(seat)])))}</small></li>)}</ol></details>}

        <details className="mp-portfolio"><summary>{copy(language, '보유 도시', 'Ciudades adquiridas')} <span>{players.reduce((total,seat) => total + ownedBy(seat).length, 0)}</span></summary>
          {players.map(seat => <div className="mp-portfolio-seat" key={seat} data-marble-owner={seat}><h4>{seatLabel(seat)} · {ownedBy(seat).length}</h4>{ownedBy(seat).length ? <ul>{ownedBy(seat).map(({ tile, index }) => { const title = String(record(tile.name)[language] ?? ''), art = cityArtNames[String(record(tile.name).ko ?? '')]; return <li key={index}><button className="mp-portfolio-city" type="button" aria-pressed={selectedTile === index} aria-label={copy(language, `${title} 도시 카드 열기`, `Abrir tarjeta de ${title}`)} onClick={() => inspectTile(index)}>{art && <MarblePropertyArt routeVersion={num(board.cityRouteVersion)} language={language} city={art} level={modern ? num(tile.houses) : 0} buildings={tile.buildings} landmark={tile.landmark} owner={seat} ownerLabel={seatLabel(seat)}/>}<span><b>{title}</b><small>{groups[String(tile.group)]?.[language] ?? String(tile.group ?? '')}</small></span></button><span className="mp-portfolio-level">{(constructionLabel(tile,language)||buildingName(num(tile.houses), language, modern)) || copy(language, `임대 ${rentValue(tile, modern, economyVersion)}`, `Renta ${rentValue(tile, modern, economyVersion)}`)}</span>{buildActions.some(choice => num(choice.action.payload?.tile) === index) && <button type="button" aria-label={copy(language, `${title} 건설 선택`, `Seleccionar mejora de ${title}`)} onClick={() => inspectTile(index)}>{copy(language, '개선', 'Mejorar')}</button>}</li>; })}</ul> : <p>{copy(language, '아직 보유한 도시가 없어요.', 'Todavía no hay ciudades.')}</p>}</div>)}
        </details>
      </aside>
    </div>
    {view.result && <Result view={view} playerId={playerId} language={language} modern={modern} netWorth={num(board.economicVersion) >= 1} outcome={outcome} onReplay={onReplay} onExit={onExit} replayPending={replayPending} playerNames={playerNames}/>}
  </section>;
}

function TrainChooser({ choices, language, runAction, eventCity = false }: { choices: Choice[]; language: Language; runAction: Props['runAction']; eventCity?: boolean }) {
  const [selected, setSelected] = useState('0');
  const index = Math.min(Math.max(0, Number(selected)), choices.length - 1);
  const choice = choices[index];
  return <div className="mp-train-chooser"><label htmlFor="mp-train-destination">{eventCity ? copy(language, '효과를 적용할 도시', 'Ciudad para el efecto') : copy(language, '목적지', 'Destino')}</label><select id="mp-train-destination" value={selected} onChange={event => setSelected(event.target.value)}>{choices.map((item, i) => <option key={`${item.action.payload?.destination ?? i}`} value={String(i)}>{item.label[language]}</option>)}</select><button className="mp-action mp-action-primary" type="button" onClick={() => choice && void runAction(choice.action)}>{eventCity ? copy(language, '이 도시에 적용', 'Aplicar a esta ciudad') : copy(language, '이곳으로 이동', 'Viajar a este lugar')}</button></div>;
}

function Result({ view, playerId, language, modern, netWorth, outcome, onReplay, onExit, replayPending, playerNames }: { onReplay?:()=>void|Promise<unknown>; onExit?:()=>void|Promise<unknown>; replayPending?:boolean; playerNames?:Partial<Record<PlayerId,string>>; view: any; playerId: PlayerId; language: Language; modern: boolean; netWorth: boolean; outcome: string }) {
  const scores = record(view.result?.scores);
  const reason = String(view.result?.reason ?? '');
  const ownershipReasons:Record<string,string>={
    'line-monopoly':copy(language,'라인 독점 승리 · 한 변의 도시와 관광지를 모두 소유했어요.','Victoria de línea: todas las ciudades e islas turísticas de un lado.'),
    'triple-monopoly':copy(language,'트리플 독점 승리 · 서로 다른 색상 그룹 3개를 완성했어요.','Victoria triple: tres grupos de color completos.'),
    'tourism-monopoly':copy(language,'관광 독점 승리 · 관광지 8곳을 모두 소유했어요.','Victoria turística: los ocho destinos turísticos son tuyos.'),
  };
  const detail = ownershipReasons[reason] ?? (reason.includes('asset turn limit') || reason.includes('turn limit')
    ? copy(language, '120번째 차례에 정한 자산 기준으로 승패가 정해졌어요.', 'Al llegar al turno 120, el total de activos decidió la partida.')
    : reason.includes('insolvent') ? copy(language, '결제할 수 없는 금액이 남아 파산했어요.', 'La partida terminó por una deuda que no se pudo pagar.')
      : copy(language, '모든 자산을 계산해 경기 결과를 정했어요.', 'El resultado se calculó con los activos finales.'));
  const scoreLabel = modern ? netWorth ? copy(language, '순자산', 'Patrimonio neto') : copy(language, '총 자산', 'Activos totales') : copy(language, '현금', 'Efectivo');
  const name=(seat:PlayerId)=>playerNames?.[seat]||seatName(seat,playerId,language);
  const winnerLabel=outcome==='draw'?copy(language,'무승부','Empate'):copy(language,`${name(view.result.winner)} 승리!`,`¡Ganó ${name(view.result.winner)}!`);
  return <MarbleResultPanel language={language} winnerLabel={winnerLabel} reason={detail} draw={outcome==='draw'} scoreLabel={scoreLabel} scores={(['p1','p2'] as const).map(seat=>({name:name(seat),score:num(scores[seat])}))} onReplay={onReplay} onExit={onExit} replayPending={replayPending}/>;
}

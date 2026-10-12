import { useEffect, useRef, useState } from 'react';
import type { GameAction, Language, PlayerId } from '../core/types';
import { GameValue } from './GameValue';
import DaVinciTable from './DaVinciTable';
import { JaipurBoard } from './JaipurBoard';
import { SplendorGem as GemIcon } from './SplendorGem';
import { SplendorMotion } from './SplendorMotion';
import splendorArt from '../../public/images/splendor/card-map.json';
import '../styles/game-design-system.css';
import '../styles/table-games.css';
import '../styles/splendor-premium.css';

type TableGameId = 'jaipur' | 'splendor' | 'davinci';
type Choice = { label: Record<Language, string>; action: GameAction };
type Props = { game: TableGameId; view: any; language: Language; playerId: PlayerId; roomId?: string | null; version?: number; runAction: (action: GameAction) => void };
type RecordValue = Record<string, any>;

const gems = ['white', 'blue', 'green', 'red', 'black', 'gold'] as const;
const colors = ['white', 'blue', 'green', 'red', 'black'] as const;
const splendorCardArtById = new Map(splendorArt.cards.map(card => [card.engineId, card.src]));
const splendorNobleArtById = new Map(splendorArt.nobles.map(noble => [noble.engineId, noble.src]));
export const splendorCardArtSrc = (id: unknown) => { const src = splendorCardArtById.get(String(id)); return src ? `/images/splendor/${src}` : null; };
export const splendorNobleArtSrc = (id: unknown) => { const src = splendorNobleArtById.get(String(id)); return src ? `/images/splendor/${src}` : null; };
const copy = (language: Language, ko: string, es: string) => language === 'ko' ? ko : es;
const record = (value: unknown): RecordValue => value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : {};
const array = (value: unknown): any[] => Array.isArray(value) ? value : [];
const gemName = (gem: string, language: Language) => ({
  white: copy(language, '흰색', 'Blanca'), blue: copy(language, '파랑', 'Azul'),
  green: copy(language, '초록', 'Verde'), red: copy(language, '빨강', 'Roja'),
  black: copy(language, '검정', 'Negra'), gold: copy(language, '황금', 'Comodín'),
}[gem] ?? gem);
const tokenReturnCount = (value: unknown) => Object.values(record(value)).reduce<number>((sum, count) => sum + Number(count ?? 0), 0);
export const splendorTotalAfterTake = (tokens: RecordValue, picked: number, returnTokens: unknown) =>
  gems.reduce((total, gem) => total + Number(tokens[gem] ?? 0), 0) + picked - tokenReturnCount(returnTokens);
export const splendorRequiredReturns = (tokens: RecordValue, picked: number, limit = 10) => Math.max(0, splendorTotalAfterTake(tokens, picked, {}) - limit);

export function splendorCardAction(actions: Choice[], source: 'market' | 'reserved', id: string, cards: any[], tier?: number) {
  const index = cards.findIndex(card => String(card?.id) === id);
  if (index < 0) return undefined;
  return actions.find(({ action }) => action.type === 'buy' && action.payload?.source === source && action.payload?.index === index && (source === 'reserved' || action.payload?.tier === tier));
}

export const splendorSelectedTier = (selectedTier: unknown, cardTier?: unknown) => Number(selectedTier ?? cardTier ?? 0);
export const splendorSelectedTierText = (language: Language, tier: number, points?: number) => copy(language,
  `단계 ${tier}${points === undefined ? '' : ` · ${points}점`}`,
  `Nivel ${tier}${points === undefined ? '' : ` · ${points} pts`}`);

const equalReturns = (left: unknown, right: unknown) => gems.every(gem => Number(record(left)[gem] ?? 0) === Number(record(right)[gem] ?? 0));
export function splendorTakeAction(actions: Choice[], selectedGems: string[], returnTokens: unknown, doubleGem?: string) {
  return actions.find(({ action }) => doubleGem
    ? action.type === 'takeTwo' && action.payload?.gem === doubleGem && equalReturns(action.payload?.returnTokens, returnTokens)
    : action.type === 'take' && sameStrings(action.payload?.gems, selectedGems) && equalReturns(action.payload?.returnTokens, returnTokens));
}

export function splendorReserveChoices(actions: Choice[], reservedCount: number) {
  return reservedCount >= 3 ? [] : actions.filter(choice => choice.action.type === 'reserve');
}

export const splendorCardCostPlan = (card: RecordValue, tokens: RecordValue, bonuses: RecordValue) => {
  const due = Object.fromEntries(colors.map(gem => [gem, Math.max(0, Number(record(card.cost)[gem] ?? 0) - Number(bonuses[gem] ?? 0))]));
  const colored = Object.fromEntries(colors.map(gem => [gem, Math.min(Number(due[gem]), Number(tokens[gem] ?? 0))]));
  let goldLeft = Number(tokens.gold ?? 0);
  const goldByGem = Object.fromEntries(colors.map(gem => {
    const use = Math.min(goldLeft, Number(due[gem]) - Number(colored[gem])); goldLeft -= use; return [gem, use];
  }));
  const gold = colors.reduce((sum, gem) => sum + Number(due[gem]) - Number(colored[gem]), 0);
  return { due, colored, gold, goldByGem, deficit: Math.max(0, gold - Number(tokens.gold ?? 0)) };
};
export const splendorCardPaymentRows = (card: RecordValue, tokens: RecordValue, bonuses: RecordValue) => {
  const plan = splendorCardCostPlan(card, tokens, bonuses);
  return colors.filter(gem => Number(record(card.cost)[gem] ?? 0) > 0).map(gem => {
    const cost = Number(record(card.cost)[gem] ?? 0), discount = Number(bonuses[gem] ?? 0), paid = Number(plan.colored[gem]), gold = Number(plan.goldByGem[gem]);
    return { gem, cost, discount, paid, gold, short: Math.max(0, Number(plan.due[gem]) - paid - gold) };
  });
};

type SplendorGuidancePhase = 'finished' | 'noble-choice' | 'rival-noble-choice' | 'other-turn' | 'return-required' | 'take-confirm' | 'own-turn';
export function splendorGuidance(language: Language, phase: SplendorGuidancePhase, result: any, playerId: PlayerId, needed: number, canTake: boolean, canTakeTwo: boolean, requiredReturns: number) {
  if (phase === 'finished') {
    const status = result?.winner === 'draw'
      ? copy(language, '게임 종료 · 무승부예요.', 'Partida terminada · empate.')
      : result?.winner === playerId
        ? copy(language, '게임 종료 · 이겼어요.', 'Partida terminada · ganaste.')
        : result?.winner
          ? copy(language, '게임 종료 · 상대가 이겼어요.', 'Partida terminada · ganó la otra persona.')
          : copy(language, '게임이 끝났어요.', 'La partida terminó.');
    return { phase, status, bank: copy(language, '게임이 끝나 보석을 가져올 수 없어요.', 'La partida terminó; ya no se toman gemas.') };
  }
  if (phase === 'noble-choice') return {
    phase,
    status: copy(language, '귀족을 하나 선택하세요.', 'Elige un noble.'),
    bank: copy(language, '귀족을 선택하는 동안 보석 행동은 대기해요.', 'La toma de gemas espera mientras eliges un noble.'),
  };
  if (phase === 'rival-noble-choice') return {
    phase,
    status: copy(language, '상대가 귀족을 선택 중이에요. 차례를 기다려 주세요.', 'La otra persona está eligiendo un noble. Espera tu turno.'),
    bank: copy(language, '상대가 선택 중이에요. 내 차례에 보석을 가져올 수 있어요.', 'La otra persona está eligiendo. Podrás tomar gemas en tu turno.'),
  };
  if (phase === 'other-turn') return {
    phase,
    status: copy(language, '상대 차례예요. 공개 카드와 은행을 살펴보세요.', 'Turno rival. Puedes revisar las cartas y el banco.'),
    bank: copy(language, '내 차례에 보석을 가져올 수 있어요.', 'Podrás tomar gemas en tu turno.'),
  };
  if (phase === 'return-required') return {
    phase,
    status: copy(language, `10개 한도에 맞춰 보석 ${requiredReturns}개를 반환하고 가져오기를 확인하세요.`, `Devuelve ${requiredReturns} fichas para respetar el límite de 10 y confirma la toma.`),
    bank: copy(language, `보석 ${requiredReturns}개를 반환한 뒤 가져오기를 확인하세요.`, `Devuelve ${requiredReturns} fichas y confirma la toma.`),
  };
  if (phase === 'take-confirm') return {
    phase,
    status: copy(language, '보석을 선택했어요. 가져오기를 확인하세요.', 'Elegiste las gemas. Confirma la toma.'),
    bank: copy(language, '선택한 보석을 확인해 가져오세요.', 'Confirma para tomar las gemas elegidas.'),
  };
  if (!canTake && !canTakeTwo) return {
    phase,
    status: copy(language, '가져올 보석이 없어요. 카드를 구매하거나 예약하세요.', 'No quedan gemas para tomar. Puedes comprar o reservar una carta.'),
    bank: copy(language, '은행에 가져올 보석이 없어요.', 'No quedan gemas disponibles para tomar.'),
  };
  const takeRule = needed >= 3
    ? copy(language, '서로 다른 색 보석 3개', '3 gemas de colores distintos')
    : needed === 2
      ? copy(language, '은행에 남은 서로 다른 색 보석 2개', 'las 2 gemas disponibles de colores distintos')
      : copy(language, '은행에서 보석 1개', '1 gema disponible del banco');
  const sameColorRule = canTakeTwo
    ? copy(language, ', 또는 은행에 4개 이상 있는 같은 색 2개', ', o 2 del mismo color si quedan al menos 4 en el banco')
    : '';
  return {
    phase,
    status: copy(language, '보석을 가져오거나, 비용이 맞는 카드를 구매하거나 예약하세요.', 'Toma gemas, compra una carta si te alcanza o reserva una.'),
    bank: `${copy(language, '가져오기: ', 'Toma: ')}${takeRule}${sameColorRule}.`,
  };
}

export function splendorActionPanelMessages(language: Language, source: 'market' | 'reserved' | 'deck', phase: SplendorGuidancePhase, status: string, reserveSummary: string) {
  return {
    reserveLine: source === 'reserved' ? copy(language, '이미 예약한 카드 · 구매', 'Compra la carta que ya reservaste.') : reserveSummary,
    waitingHint: phase === 'finished' || phase === 'other-turn' || phase === 'rival-noble-choice' ? status : null,
  };
}

export function TableGames(props: Props) {
  if (props.game === 'jaipur') return <JaipurBoard {...props}/>;
  if (props.game === 'splendor') return <SplendorTable {...props}/>;
  return <DaVinciTable {...props}/>;
}

type SplendorVisualEvent = {
  key: string;
  viewer: PlayerId;
  version?: number;
  kind: 'result' | 'noble' | 'purchase' | 'reserve' | 'tokens' | 'market' | 'turn';
  marketArrivals: string[];
  reservedArrivals: string[];
  incomingTokens: string[];
  incomingCounts: Record<string, number>;
  outgoingCounts: Record<string, number>;
  reserveGoldCount?: number;
  bonusGem: string | null;
  turnChanged: boolean;
  nobleRecipient?: 'you' | 'rival' | 'unknown';
  nobleAwarded?: boolean;
  nobleId?: string;
  noblePoints?: number;
  purchasedCard?: { id: string; bonus: string; points: number; tier: number };
  result?: 'win' | 'lose' | 'draw';
};

const marketEntries = (view: any) => [1, 2, 3].flatMap(tier => array(record(view?.board?.market)[tier]).map((card, index) => ({ tier, index, id: String(card?.id ?? `${tier}-${index}`), card: record(card) })));
const gemCounts = (view: any) => record(view?.ownHand?.tokens);
const ownedBonuses = (view: any) => record(view?.ownHand?.bonuses);

export function deriveSplendorVisualEvent(previous: any, next: any, viewer: PlayerId): SplendorVisualEvent | null {
  if (!previous?.view || previous.viewer !== viewer) return null;
  const beforeMarket = marketEntries(previous.view), afterMarket = marketEntries(next);
  const beforeIds = new Set(beforeMarket.map(card => card.id));
  const afterIds = new Set(afterMarket.map(card => card.id));
  const marketArrivals = afterMarket.filter(card => !beforeIds.has(card.id)).map(card => card.id);
  const beforeReserved = array(previous.view?.ownHand?.reserved).map((card: any) => String(card?.id));
  const reservedArrivals = array(next?.ownHand?.reserved).map((card: any) => String(card?.id)).filter((id: string) => !beforeReserved.includes(id));
  const beforeTokens = gemCounts(previous.view), afterTokens = gemCounts(next);
  const incomingCounts = Object.fromEntries(gems.map(gem => [gem, Math.max(0, Number(afterTokens[gem] ?? 0) - Number(beforeTokens[gem] ?? 0))]));
  const outgoingCounts = Object.fromEntries(gems.map(gem => [gem, Math.max(0, Number(beforeTokens[gem] ?? 0) - Number(afterTokens[gem] ?? 0))]));
  const reserveGoldCount = reservedArrivals.length && Number(previous.view?.board?.bank?.gold ?? 0) > 0 ? 1 : 0;
  outgoingCounts.gold = Math.max(0, reserveGoldCount + Number(beforeTokens.gold ?? 0) - Number(afterTokens.gold ?? 0));
  const incomingTokens = gems.filter(gem => Number(incomingCounts[gem] ?? 0) > 0);
  const beforeBonuses = ownedBonuses(previous.view), afterBonuses = ownedBonuses(next);
  const bonusGem = colors.find(gem => Number(afterBonuses[gem] ?? 0) > Number(beforeBonuses[gem] ?? 0)) ?? null;
  const beforeReservedCards = array(previous.view?.ownHand?.reserved), afterReservedIds = new Set(array(next?.ownHand?.reserved).map((card: any) => String(card?.id)));
  const removedMarketCards = beforeMarket.filter(entry => beforeIds.has(entry.id) && !afterIds.has(entry.id) && entry.card.bonus === bonusGem);
  const removedReservedCards = beforeReservedCards.filter((card: any) => !afterReservedIds.has(String(card?.id)) && card?.bonus === bonusGem);
  const purchasedRaw = bonusGem ? removedReservedCards.length === 1 ? removedReservedCards[0] : removedMarketCards.length === 1 ? removedMarketCards[0].card : null : null;
  const purchasedCard = purchasedRaw ? { id: String(purchasedRaw.id ?? 'purchased'), bonus: String(purchasedRaw.bonus ?? bonusGem), points: Number(purchasedRaw.points ?? 0), tier: Number(purchasedRaw.tier ?? 1) } : undefined;
  const beforeNobles = Number(previous.view?.ownHand?.nobles ?? 0), afterNobles = Number(next?.ownHand?.nobles ?? 0);
  const beforeNobleIds = Object.keys(record(previous.view?.board?.nobles));
  const afterNobleIds = Object.keys(record(next?.board?.nobles));
  const nobleLeftMarket = beforeNobleIds.some(id => !afterNobleIds.includes(id));
  const nobleId = beforeNobleIds.find(id => !afterNobleIds.includes(id));
  const nobleData = nobleId ? record(record(previous.view?.board?.nobles)[nobleId]) : {};
  const rivalSeat = viewer === 'p1' ? 'p2' : 'p1';
  const beforeRivalNobles = Number(record(previous.view?.board?.ownedNobles)[rivalSeat] ?? 0);
  const afterRivalNobles = Number(record(next?.board?.ownedNobles)[rivalSeat] ?? 0);
  const turnChanged = previous.view?.turn !== next?.turn;
  const hadResult = !!previous.view?.result, hasResult = !!next?.result;
  let kind: SplendorVisualEvent['kind'] | null = null;
  let result: SplendorVisualEvent['result'];
  if (!hadResult && hasResult) {
    kind = 'result';
    result = next.result.winner === 'draw' ? 'draw' : next.result.winner === viewer ? 'win' : 'lose';
  } else if (afterNobles > beforeNobles || afterRivalNobles > beforeRivalNobles || nobleLeftMarket) kind = 'noble';
  else if (bonusGem) kind = 'purchase';
  else if (reservedArrivals.length) kind = 'reserve';
  else if (incomingTokens.length) kind = 'tokens';
  else if (marketArrivals.length) kind = 'market';
  else if (turnChanged) kind = 'turn';
  if (!kind) return null;
  const nobleRecipient = afterNobles > beforeNobles ? 'you' : afterRivalNobles > beforeRivalNobles ? 'rival' : 'unknown';
  const signature = [kind, ...marketArrivals, ...reservedArrivals, reserveGoldCount, ...incomingTokens.map(gem => `${gem}-${incomingCounts[gem]}`), ...gems.map(gem => outgoingCounts[gem] ? `out-${gem}-${outgoingCounts[gem]}` : ''), bonusGem ?? '', purchasedCard?.id ?? '', beforeNobles, afterNobles, beforeRivalNobles, afterRivalNobles, record(next?.board?.turns).p1 ?? '', record(next?.board?.turns).p2 ?? '', next?.turn ?? '', result ?? ''].join(':');
  const nobleAwarded = afterNobles > beforeNobles || afterRivalNobles > beforeRivalNobles || nobleLeftMarket;
  return { key: `${viewer}:${signature}`, viewer, kind, marketArrivals, reservedArrivals, incomingTokens, incomingCounts, outgoingCounts, ...(reserveGoldCount ? { reserveGoldCount } : {}), bonusGem, turnChanged, ...(purchasedCard ? { purchasedCard } : {}), ...(nobleAwarded ? { nobleAwarded, nobleRecipient, ...(nobleId ? { nobleId, noblePoints: Number(nobleData.points ?? 3) } : {}) } : {}), ...(result ? { result } : {}) };
}

function SplendorTable({ view, language, playerId, roomId = null, version = 0, runAction }: Props) {
  const board = record(view?.board), hand = record(view?.ownHand), choices: Choice[] = array(view?.actions);
  const bank = record(board.bank), market = record(board.market), nobles = record(board.nobles), scores = record(board.score);
  const publicBonuses = record(board.ownedBonuses);
  const tokens = record(hand.tokens), owned = record(hand.bonuses), reserved = array(hand.reserved);
  const [picked, setPicked] = useState<string[]>([]), [returnDraft, setReturnDraft] = useState<Record<string, number>>({}), [selectedDoubleGem, setSelectedDoubleGem] = useState<string | null>(null), [reserveChoices, setReserveChoices] = useState<Record<string, number>>({}), [selectedCard, setSelectedCard] = useState<{ id: string; source: 'market' | 'reserved' | 'deck'; tier?: number; viewer: PlayerId; roomId: string | null; version: number } | null>(null);
  const actionPanelRef = useRef<HTMLElement | null>(null), cardFocusReturnRef = useRef<HTMLElement | null>(null);
  const enterPanelFocusRef = useRef(false), returnCardFocusRef = useRef(false);
  const previous = useRef<{ viewer: PlayerId; view: any; version: number; roomId: string | null } | null>(null);
  const eventTimer = useRef<number | null>(null);
  const [visualEvent, setVisualEvent] = useState<SplendorVisualEvent | null>(null);
  const takeChoices = choices.filter(choice => choice.action.type === 'take');
  const distinctAvailable = colors.filter(gem => Number(bank[gem] ?? 0) > 0).length;
  const needed = Math.min(3, distinctAvailable);
  const bankTakeTwo = (gem: string) => choices.filter(choice => choice.action.type === 'takeTwo' && choice.action.payload?.gem === gem);
  const matchingTakes = takeChoices.filter(choice => sameStrings(choice.action.payload?.gems, picked));
  const selectedTake = splendorTakeAction(choices, picked, returnDraft);
  const selectedDoubleOptions = selectedDoubleGem ? bankTakeTwo(selectedDoubleGem) : [];
  const selectedDouble = selectedDoubleGem ? splendorTakeAction(choices, [], returnDraft, selectedDoubleGem) : undefined;
  const active = view?.turn === playerId && !view?.result;
  const scoreTotal = Number(hand.points ?? 0) + Number(hand.nobles ?? 0);
  const handTokenTotal = gems.reduce((total, gem) => total + Number(tokens[gem] ?? 0), 0);
  const hasNobleChoice = (view?.phase === 'chooseNoble' && active) || choices.some(choice => choice.action.type === 'chooseNoble');
  const rivalChoosingNoble = view?.phase === 'chooseNoble' && !active;
  const hasSelectedTake = picked.length > 0 || selectedDoubleGem !== null;
  const requiredTakeReturns = hasSelectedTake ? splendorRequiredReturns(tokens, selectedDoubleGem ? 2 : picked.length) : 0;
  const guidancePhase: SplendorGuidancePhase = view?.result || view?.phase === 'finished' ? 'finished'
    : hasNobleChoice ? 'noble-choice'
      : rivalChoosingNoble ? 'rival-noble-choice'
        : !active ? 'other-turn'
        : requiredTakeReturns > 0 ? 'return-required'
          : hasSelectedTake ? 'take-confirm' : 'own-turn';
  const guidance = splendorGuidance(language, guidancePhase, view?.result, playerId, needed,
    takeChoices.length > 0, choices.some(choice => choice.action.type === 'takeTwo'), requiredTakeReturns);
  const resetKey = [view?.turn, ...gems.map(gem => Number(bank[gem] ?? 0)), ...gems.map(gem => Number(tokens[gem] ?? 0)), Number(tokens.gold ?? 0), scoreTotal, reserved.map((card: any) => card.id).join(',')].join(':');
  useEffect(() => { setPicked([]); setReturnDraft({}); setSelectedDoubleGem(null); setReserveChoices({}); }, [resetKey]);
  useEffect(() => {
    if (!selectedCard) {
      if (returnCardFocusRef.current) {
        returnCardFocusRef.current = false;
        const target = cardFocusReturnRef.current;
        requestAnimationFrame(() => {
          if (target?.isConnected) target.focus();
          else document.querySelector<HTMLElement>('.sp-splendor [data-sp-zone="market"] [data-card-id]')?.focus();
        });
      }
      return;
    }
    if (enterPanelFocusRef.current) {
      enterPanelFocusRef.current = false;
      requestAnimationFrame(() => actionPanelRef.current?.focus());
    }
    if (selectedCard.viewer !== playerId || selectedCard.roomId !== roomId) { setSelectedCard(null); return; }
    const exists = selectedCard.source === 'market'
      ? array(record(board.market)[Number(selectedCard.tier ?? 0)]).some(card => String(card?.id) === selectedCard.id)
      : selectedCard.source === 'reserved' ? reserved.some(card => String(card?.id) === selectedCard.id) : reserveDeck(Number(selectedCard.tier ?? 0)).length > 0;
    if (!exists) setSelectedCard(null);
    else if (selectedCard.version !== version) setSelectedCard(current => current && ({ ...current, version }));
  }, [view, playerId, roomId, version, selectedCard]);
  useEffect(() => {
    const candidates = selectedDoubleOptions.length ? selectedDoubleOptions : matchingTakes;
    if (!candidates.length) { setReturnDraft({}); return; }
    const first = record(candidates[0].action.payload?.returnTokens);
    setReturnDraft(Object.fromEntries(gems.map(gem => [gem, Number(first[gem] ?? 0)]).filter(([, count]) => Number(count) > 0)));
  }, [picked, selectedDoubleGem, matchingTakes.length, selectedDoubleOptions.length]);
  useEffect(() => {
    if (!selectedCard) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') { returnCardFocusRef.current = true; setSelectedCard(null); } };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedCard]);
  useEffect(() => {
    const before = previous.current;
    if (before && before.viewer === playerId && before.roomId === roomId && before.version === version) return;
    previous.current = { viewer: playerId, view, version, roomId };
    const reset = !before || before.viewer !== playerId || before.roomId !== roomId || version < before.version;
    const derived = reset ? null : deriveSplendorVisualEvent(before, view, playerId);
    if (!reset && !derived) return;
    if (eventTimer.current !== null) window.clearTimeout(eventTimer.current);
    eventTimer.current = null;
    const nextEvent = derived ? { ...derived, version } : null;
    setVisualEvent(nextEvent);
    if (nextEvent) eventTimer.current = window.setTimeout(() => { eventTimer.current = null; setVisualEvent(null); }, 1800);
  }, [view, playerId, version, roomId]);
  useEffect(() => () => {
    if (eventTimer.current !== null) window.clearTimeout(eventTimer.current);
  }, []);
  const finalRound = !view?.result && Math.max(Number(scores.p1 ?? 0), Number(scores.p2 ?? 0)) >= 15;
  const turnCounts = record(board.turns), rivalSeat: PlayerId = playerId === 'p1' ? 'p2' : 'p1';
  const lowerTurnSeat: PlayerId = Number(turnCounts.p1 ?? 0) < Number(turnCounts.p2 ?? 0) ? 'p1' : 'p2';
  const turnCountsUnequal = Number(turnCounts.p1 ?? 0) !== Number(turnCounts.p2 ?? 0);
  const finalTurnSeat: PlayerId | null = !finalRound ? null : view?.phase === 'chooseNoble' ? (turnCountsUnequal ? lowerTurnSeat : rivalSeat)
    : Number(turnCounts.p1 ?? 0) < Number(turnCounts.p2 ?? 0) ? 'p1'
      : Number(turnCounts.p2 ?? 0) < Number(turnCounts.p1 ?? 0) ? 'p2' : view?.turn;
  const reserveMarket = (tier: number, index: number) => choices.filter(choice => choice.action.type === 'reserve' && choice.action.payload?.tier === tier && choice.action.payload?.index === index);
  const reserveDeck = (tier: number) => choices.filter(choice => choice.action.type === 'reserve' && choice.action.payload?.tier === tier && choice.action.payload?.index === undefined);
  const tokenReturnOptions = (candidate: Choice[]) => candidate.map(choice => choice.action.payload?.returnTokens ?? {});
  const chooseReserve = (key: string, options: Choice[]) => options[Math.min(reserveChoices[key] ?? 0, Math.max(0, options.length - 1))];
  const reserveControl = (key: string, options: Choice[]) => options.length > 1 && <label className="sp-return-select"><span>{copy(language, '토큰 반환', 'Devolver')}</span><select aria-label={copy(language, '예약 토큰 반환 계획', 'Plan de devolución al reservar')} value={Math.min(reserveChoices[key] ?? 0, options.length - 1)} onChange={event => setReserveChoices(current => ({ ...current, [key]: Number(event.target.value) }))}>{tokenReturnOptions(options).map((option, index) => <option key={`${index}-${returnLabel(option, language)}`} value={index}>{returnLabel(option, language)}</option>)}</select></label>;
  const clickGem = (gem: string) => {
    if (!active || Number(bank[gem] ?? 0) <= 0 || !needed) return;
    setSelectedCard(null);
    setSelectedDoubleGem(null);
    setPicked(current => current.includes(gem) ? current.filter(value => value !== gem) : current.length < needed ? [...current, gem] : current);
  };
  const selectedReservedIndex = selectedCard?.source === 'reserved' ? reserved.findIndex(card => String(card?.id) === selectedCard.id) : -1;
  const selectedReservedCard = selectedReservedIndex >= 0 ? reserved[selectedReservedIndex] : null;
  const selectedTier = splendorSelectedTier(selectedCard?.tier, selectedReservedCard?.tier);
  const selectedMarket = selectedCard?.source === 'market' ? array(record(board.market)[selectedTier]).find(card => String(card?.id) === selectedCard.id) : null;
  const selectedMarketIndex = selectedCard?.source === 'market' ? array(record(board.market)[selectedTier]).findIndex(card => String(card?.id) === selectedCard.id) : -1;
  const selectedDeckTier = selectedCard?.source === 'deck' ? selectedTier : null;
  const selectedRaw = selectedMarket ?? selectedReservedCard;
  const selectedCardData: RecordValue | null = selectedRaw ? { ...record(selectedRaw), id: selectedCard?.id, tier: selectedCard?.tier ?? selectedRaw.tier } : null;
  const selectedBuy = selectedCardData && selectedCard && selectedCard.source !== 'deck' ? splendorCardAction(choices, selectedCard.source, selectedCard.id, selectedCard.source === 'market' ? array(record(board.market)[selectedTier]) : reserved, selectedTier) : undefined;
  const selectedReserveOptions = selectedCard?.source === 'market' && selectedMarketIndex >= 0 ? splendorReserveChoices(reserveMarket(selectedTier, selectedMarketIndex), reserved.length) : selectedDeckTier ? splendorReserveChoices(reserveDeck(selectedDeckTier), reserved.length) : [];
  const selectedReserve = selectedCard ? chooseReserve(`selected-${selectedCard.id}`, selectedReserveOptions) : undefined;
  const reserveSummary = copy(language,`예약 ${reserved.length}/3 · 금 ${Number(bank.gold)>0?'+1':'없음'} · 반환 ${returnLabel(selectedReserve?.action.payload?.returnTokens,language)}`,`Reserva ${reserved.length}/3 · ${Number(bank.gold)>0?'+1 oro':'sin oro'} · devuelve ${returnLabel(selectedReserve?.action.payload?.returnTokens,language)}`);
  const panelMessages = selectedCard ? splendorActionPanelMessages(language, selectedCard.source, guidance.phase, guidance.status, reserveSummary) : null;
  const selectCard = (id: string, source: 'market' | 'reserved' | 'deck', tier?: number, target?: HTMLElement, keyboard = false) => { cardFocusReturnRef.current = target ?? null; enterPanelFocusRef.current = keyboard; returnCardFocusRef.current = false; setPicked([]); setReturnDraft({}); setSelectedDoubleGem(null); setSelectedCard({ id, source, ...(tier ? { tier } : {}), viewer: playerId, roomId, version }); };
  const adjustReturn = (gem: string, amount: number, max: number) => setReturnDraft(current => {
    const next = Math.max(0, Math.min(max, Number(current[gem] ?? 0) + amount));
    return { ...current, [gem]: next };
  });
  const eventCopy = (event: SplendorVisualEvent) => {
    if (event.kind === 'result') return event.result === 'win' ? copy(language, '스플렌더에서 이겼어요', 'Ganaste Splendor') : event.result === 'draw' ? copy(language, '무승부', 'Empate') : copy(language, '상대가 이겼어요', 'Ganó la otra persona');
    if (event.kind === 'noble') return event.nobleRecipient === 'rival' ? copy(language, '귀족이 상대를 방문했어요', 'Un noble visita a la otra persona') : event.nobleRecipient === 'you' ? copy(language, '귀족이 나를 방문했어요', 'Un noble te visita') : copy(language, '귀족이 방문했어요', 'Llega un noble');
    if (event.kind === 'purchase') return copy(language, `영구 보너스 ${gemName(event.bonusGem ?? '', language)} +1`, `Bonificación permanente de ${gemName(event.bonusGem ?? '', language)} +1`);
    if (event.kind === 'reserve') return copy(language, '카드를 개인 보관함에 넣었어요', 'Carta guardada en tu reserva');
    if (event.kind === 'tokens') return copy(language, '보석이 내 보관함으로 이동했어요', 'Las gemas pasaron a tu reserva');
    if (event.kind === 'market') return copy(language, '새 개발 카드가 공개됐어요', 'Hay nuevas cartas disponibles');
    return view?.turn === playerId ? copy(language, '내 차례예요', 'Es tu turno') : copy(language, '상대 차례예요', 'Turno de la otra persona');
  };
  const shownEvent = visualEvent?.viewer === playerId ? visualEvent : null;
  const marketArrivals = new Set(shownEvent?.marketArrivals ?? []), reservedArrivals = new Set(shownEvent?.reservedArrivals ?? []);
  const scoreKey = `${playerId}:splendor`;
  const title = copy(language, '스플렌더', 'Splendor');
  return <div className="table-game sp-splendor" aria-label={copy(language, '스플렌더 게임판', 'Mesa de Splendor')} onClick={event=>{if(event.target===event.currentTarget||(event.target instanceof Element&&event.target.closest('.sp-card-empty')))setSelectedCard(null);}}>
    <header className="sp-scorebar">
      <div className="sp-title"><span>{title}</span><small>{copy(language, '보석을 모아 개발 카드를 얻고, 먼저 15점에 도달하세요.', 'Reúne gemas, compra desarrollos y alcanza 15 puntos.')}</small></div>
      {(['p1', 'p2'] as const).map((seat) => <div className={`sp-player-score ${seat === playerId ? 'is-you' : ''} ${view?.turn === seat ? 'is-active' : ''}`} data-sp-score-seat={seat} key={seat}>
        <span>{seat === playerId ? copy(language, '나', 'Tú') : copy(language, '상대', 'Rival')}</span><b><GameValue value={Number(scores[seat] ?? 0)} resetKey={`${scoreKey}:${seat}`}/></b><small>{copy(language, '점', 'pts')}</small><small className="sp-public-card-count">{colors.reduce((total, gem) => total + Number(record(publicBonuses[seat])[gem] ?? 0), 0)} {copy(language, '개발 카드', 'cartas')}</small>{view?.turn === seat && !view?.result && <i>{copy(language, '차례', 'Turno')}</i>}<span className="sp-public-bonuses" aria-label={copy(language,'공개 영구 보너스','Bonificaciones permanentes públicas')}>{colors.map(gem=><span className={`sp-public-bonus sp-color-${gem}`} key={gem} title={gemName(gem,language)}><GemIcon gem={gem}/><b>{Number(record(record(board.ownedBonuses)[seat])[gem]??0)}</b></span>)}</span>
      </div>)}
      {finalRound && <p className="sp-final-turn" role="status">{finalTurnSeat === playerId ? copy(language, '15점에 도달했어요. 이번 차례가 마지막이에요.', 'Se alcanzaron 15 puntos. Este es el último turno.') : copy(language, '15점에 도달했어요. 상대의 마지막 차례예요.', 'Se alcanzaron 15 puntos. La otra persona tiene su último turno.')}</p>}
    </header>
    <div className="sp-feedback-slot">{guidance.phase === 'own-turn' && shownEvent
      ? <p className={`sp-event sp-event-${shownEvent.kind}`} key={shownEvent.key} role="status">{eventCopy(shownEvent)}</p>
      : <p className="sp-turn-guide" data-phase={guidance.phase} role="status">{guidance.status}</p>}</div>
    <section className="sp-market" data-sp-zone="market" aria-label={copy(language, '개발 카드 시장', 'Mercado de desarrollo')}>
      {[3, 2, 1].map(tier => <section className={`sp-tier sp-tier-${tier}`} key={tier} aria-label={copy(language, `${tier}단계 개발 카드`, `Cartas de nivel ${tier}`)}>
        <div className="sp-tier-rail"><header className="sp-tier-head"><b>{tier}</b><span>{copy(language, `${tier}단계`, `Nivel ${tier}`)}</span><i>{array(market[tier]).length} / 4</i></header>
        <div className="sp-deck-control"><button type="button" className="sp-button sp-button-quiet" aria-label={copy(language, `${tier}단계 덱 예약 선택`, `Elegir reserva del mazo de nivel ${tier}`)} title={copy(language, '덱 맨 위 카드 한 장을 확인 없이 예약하는 내용을 미리 봅니다.', 'Previsualiza la reserva de la carta superior sin revelar su contenido.')} disabled={reserved.length>=3||!reserveDeck(tier).length} aria-pressed={selectedDeckTier===tier} onClick={event=>selectCard(`deck-${tier}`,'deck',tier,event.currentTarget,event.detail===0)}>{copy(language,'덱 예약','Reservar')}</button></div>
        </div>
        <div className="sp-card-grid">{array(market[tier]).map((raw: any, index: number) => {
          const card = record(raw), id = String(card.id ?? `${tier}-${index}`), selected = selectedCard?.source === 'market' && selectedCard.id === id;
          const spareCard = { ...card, id, tier, index };
          const costPlan = splendorCardCostPlan(spareCard, tokens, owned);
          const legalBuy = choices.some(({action})=>action.type==='buy'&&action.payload?.source==='market'&&Number(action.payload?.tier)===tier&&Number(action.payload?.index)===index);
          return <SplendorMarketCard key={id} card={spareCard} language={language} selected={selected} viewer={playerId} version={version} incoming={marketArrivals.has(id)} deficit={costPlan.deficit} legalBuy={legalBuy} onSelect={(target,keyboard)=>card.id!=null&&selectCard(String(card.id),'market',tier,target,keyboard)}/>;
        })}{Array.from({length:Math.max(0,4-array(market[tier]).length)},(_,slot)=><div className="sp-card-empty" key={`empty-${tier}-${slot}`} aria-hidden="true"/>)}</div>
      </section>)}
    </section>
    <aside className="sp-sidebar">
      {(selectedCardData||selectedDeckTier)&&<section ref={actionPanelRef} tabIndex={-1} className="sp-action-panel" data-selected-card-id={selectedCardData?.id??selectedCard?.id} data-source-zone={selectedCard?.source} data-viewer={playerId} data-room-id={roomId??''} data-version={version} aria-label={copy(language,'선택한 카드 행동','Acciones de la carta seleccionada')}>
          <header className="sp-section-heading"><div><h2>{copy(language,selectedCard?.source==='deck'?'덱 카드 예약':selectedCard?.source==='reserved'?'예약 카드 행동':'선택한 카드',selectedCard?.source==='deck'?'Reservar del mazo':selectedCard?.source==='reserved'?'Acciones de reserva':'Carta seleccionada')}</h2><p>{splendorSelectedTierText(language,selectedTier,selectedCardData?Number(selectedCardData.points??0):undefined)}</p></div><button type="button" className="sp-action-cancel" aria-label={copy(language,'선택 취소','Cancelar selección')} onClick={()=>{returnCardFocusRef.current=true;setSelectedCard(null);}}>×</button></header>
          {selectedCardData?<div className="sp-action-card"><span className="sp-action-art" aria-hidden="true">{splendorCardArtSrc(selectedCardData.id)&&<img src={splendorCardArtSrc(selectedCardData.id)!} alt=""/>}</span><div><b>{copy(language,`영구 보너스 +1 ${gemName(String(selectedCardData.bonus),language)}`,`Bono permanente +1 ${gemName(String(selectedCardData.bonus),language)}`)}</b></div></div>:<div className="sp-action-card sp-deck-preview"><span className={`sp-card-back sp-card-back-${selectedDeckTier}`} aria-hidden="true"/><b>{copy(language,'덱 맨 위 카드 한 장을 예약해요. 카드 내용은 예약 전까지 비공개예요.','Reservas la carta superior sin ver su contenido hasta confirmar.')}</b></div>}
          {selectedCardData&&(()=>{const plan=splendorCardCostPlan(selectedCardData,tokens,owned);const projected={...owned,[String(selectedCardData.bonus)]:Number(owned[String(selectedCardData.bonus)]??0)+1};const visitors=Object.entries(nobles).filter(([,noble])=>colors.every(gem=>Number(projected[gem]??0)>=Number(record(noble?.requirement)[gem]??0)));return <>
            <div className="sp-payment-preview" aria-label={copy(language,'구매 예상 지불','Pago previsto')}>
              <b className="sp-payment-title">{copy(language,'예상 지불','Pago previsto')}</b>
              {splendorCardPaymentRows(selectedCardData,tokens,owned).length?<div className="sp-pay-grid" role="table" aria-label={copy(language,'색별 비용과 지불','Coste y pago por color')}>
                <div className="sp-pay-row sp-pay-head" role="row"><span aria-hidden="true"/><span role="columnheader">{copy(language,'비용','Coste')}</span><span role="columnheader">{copy(language,'할인','Bono')}</span><span role="columnheader">{copy(language,'낼 토큰','Fichas')}</span><span role="columnheader">{copy(language,'금','Oro')}</span><span role="columnheader">{copy(language,'부족','Falta')}</span></div>
                {splendorCardPaymentRows(selectedCardData,tokens,owned).map(({gem,cost,discount,paid,gold,short})=>{const label=`${gemName(gem,language)}: ${copy(language,'비용','Coste')} ${cost}, ${copy(language,'할인','Bono')} ${discount}, ${copy(language,'낼 토큰','Fichas')} ${paid}, ${copy(language,'금','Oro')} ${gold}, ${copy(language,'부족','Falta')} ${short}`;return <div className={`sp-pay-row sp-color-${gem} ${short?'is-short':''}`} role="row" key={gem} aria-label={label}><span className="sp-pay-gem" role="rowheader" title={gemName(gem,language)}><GemIcon gem={gem}/></span><span className="sp-pay-cell" role="cell">{cost}</span><span className="sp-pay-cell" role="cell">{discount}</span><span className="sp-pay-cell" role="cell">{paid}</span><span className="sp-pay-cell" role="cell">{gold}</span><span className="sp-pay-cell" role="cell">{short>0?<strong>{short}</strong>:'0'}</span></div>;})}
              </div>:<span className="sp-pay-no-cost">{copy(language,'비용 없음','Sin coste')}</span>}
              <span className="sp-pay-gold" aria-label={`${copy(language,'황금 토큰 필요','Oro necesario')}: ${plan.gold}, ${copy(language,'보유','disponible')}: ${Number(tokens.gold??0)}`}><GemIcon gem="gold"/>{copy(language,`금 필요 ${plan.gold} · 보유 ${Number(tokens.gold??0)}`,`Oro: ${plan.gold} necesarios · ${Number(tokens.gold??0)} disponibles`)}</span>
            </div>
            <div className="sp-noble-preview"><b>{copy(language,'구매 후 귀족 진척','Progreso de nobles tras comprar')}</b>{Object.entries(nobles).map(([id,noble])=><span className="sp-noble-preview-line" key={id} aria-label={copy(language,`귀족 조건 ${id}`,`Requisitos del noble ${id}`)}>{colors.filter(gem=>Number(record(noble?.requirement)[gem]??0)>0).map(gem=><i className={`sp-noble-progress-chip sp-color-${gem}`} key={gem} title={gemName(gem,language)}><GemIcon gem={gem}/>{Number(projected[gem]??0)}/{Number(record(noble?.requirement)[gem])}</i>)}{visitors.some(([visitor])=>visitor===id)&&<strong>{copy(language,'방문 예상 +3점','Visita prevista +3 pts')}</strong>}</span>)}{!Object.keys(nobles).length&&<span>{copy(language,'남은 귀족 없음','No quedan nobles')}</span>}</div>
          </>})()}
          <div className="sp-reserve-preview" data-reserve-source={selectedCard?.source}><span>{panelMessages?.reserveLine}</span>{selectedCard?.source!=='reserved'&&selectedReserveOptions.length>0&&reserveControl(`selected-${selectedCard?.id}`,selectedReserveOptions)}</div>
          {panelMessages?.waitingHint&&<p className="sp-action-hint" data-phase={guidance.phase}>{panelMessages.waitingHint}</p>}
          <div className="sp-action-buttons">{selectedCardData&&<button type="button" className="sp-button sp-button-buy" disabled={!selectedBuy||!active||!selectedCard||selectedCard.version!==version} onClick={()=>{if(!selectedCard||selectedCard.version!==version)return;const current=selectedCard.source==='market'?array(record(board.market)[Number(selectedCard.tier??0)]):reserved;const action=splendorCardAction(choices,selectedCard.source as 'market'|'reserved',selectedCard.id,current,Number(selectedCard.tier??0));if(action)runAction(action.action);}}>{selectedBuy?copy(language,'구매 확정','Confirmar compra'):copy(language,'현재 합법 구매 아님','Compra no disponible')}</button>}{selectedCard?.source!=='reserved'&&<button type="button" className="sp-button sp-button-quiet" disabled={!selectedReserve||!active||!selectedCard||selectedCard.version!==version||reserved.length>=3} title={copy(language,`예약하면 금 ${Number(bank.gold)>0?'1개를 받아요':'토큰이 없어요'} · 슬롯 ${reserved.length}/3`,`Al reservar ${Number(bank.gold)>0?'recibes 1 oro':'no hay oro'} · espacios ${reserved.length}/3`)} onClick={()=>{if(selectedReserve&&selectedCard?.version===version)runAction(selectedReserve.action);}}>{copy(language,'예약 확정','Confirmar reserva')}</button>}</div>
        </section>}
      <section className="sp-bank" data-sp-zone="bank" aria-label={copy(language, '보석 은행', 'Banco de gemas')}>
        <header className="sp-section-heading"><div><h2>{copy(language, '보석 은행', 'Banco de gemas')}</h2><p className="sp-bank-guidance" data-phase={guidance.phase}>{guidance.bank}</p></div></header>
        <div className="sp-gem-piles">{colors.map(gem => {
          const double = bankTakeTwo(gem)[0];
          const pressed = picked.includes(gem), pile = Number(bank[gem] ?? 0), canPick = takeChoices.length > 0;
          return <div className={`sp-gem-option ${pressed ? 'is-picked' : ''}`} key={gem}>
            <button type="button" className={`sp-gem-pile sp-color-${gem}`} aria-label={`${gemName(gem, language)}: ${pile}`} aria-pressed={pressed} disabled={!active || !canPick || !pile || !needed} onClick={()=>clickGem(gem)}><GemIcon gem={gem}/><b>{pile}</b></button>
            <span className="sp-gem-name">{gemName(gem,language)}{pressed && <small>{copy(language,'선택됨','Elegida')}</small>}</span>
            {double&&<button type="button" className={`sp-double-take ${selectedDoubleGem===gem?'is-picked':''}`} disabled={!active} aria-pressed={selectedDoubleGem===gem} aria-label={copy(language,`${gemName(gem,language)} 2개 가져오기`,`Tomar 2 gemas del mismo color: ${gemName(gem,language)}`)} onClick={()=>{setSelectedCard(null);setPicked([]);setSelectedDoubleGem(current=>current===gem?null:gem);}}>{copy(language,'+2 선택','+2')}</button>}
          </div>;
        })}<div className="sp-gem-option sp-gem-gold"><span className="sp-gem-pile sp-color-gold"><GemIcon gem="gold"/><b>{Number(bank.gold??0)}</b></span><span className="sp-gem-name">{gemName('gold',language)}</span></div></div>
        {(picked.length > 0 || selectedDoubleGem) && <div className="sp-token-confirm" data-sp-zone="take-plan">
          {(()=>{const count=selectedDoubleGem?2:picked.length, validAction=selectedDouble??selectedTake, returned=tokenReturnCount(returnDraft), after=splendorTotalAfterTake(tokens,count,returnDraft), requiredReturns=splendorRequiredReturns(tokens,count);return <>
            <p role="status">{selectedDoubleGem?copy(language,`${gemName(selectedDoubleGem,language)} 2개 선택` ,`2 gemas ${gemName(selectedDoubleGem,language)}`):copy(language,`서로 다른 색 ${picked.length}/${needed} 선택`,`Colores distintos ${picked.length}/${needed}`)} · {copy(language,`반환 ${returned}개 · 현재 ${handTokenTotal} + 획득 ${count} − 반환 ${returned} = ${after}/10`,`Devolver ${returned} · ahora ${handTokenTotal} + tomas ${count} − devuelves ${returned} = ${after}/10`)}</p>
            {requiredReturns>0&&<div className="sp-return-tray" aria-label={copy(language,'반환할 보석 선택','Elige las gemas que devuelves')}>{gems.map(gem=>{const max=Number(tokens[gem]??0)+(selectedDoubleGem?Number(selectedDoubleGem===gem?2:0):picked.filter(value=>value===gem).length),value=Number(returnDraft[gem]??0);return <div className="sp-return-stepper" data-gem={gem} key={gem}><GemIcon gem={gem}/><span>{gemName(gem,language)} <b>{value}</b></span><button type="button" aria-label={copy(language,`${gemName(gem,language)} 하나 더 반환`,`Devolver una ${gemName(gem,language)} más`)} disabled={value>=max} onClick={()=>adjustReturn(gem,1,max)}>+</button><button type="button" aria-label={copy(language,`${gemName(gem,language)} 하나 덜 반환`,`Devolver una ${gemName(gem,language)} menos`)} disabled={!value} onClick={()=>adjustReturn(gem,-1,max)}>−</button></div>;})}</div>}
            <button type="button" className="sp-button sp-button-primary" disabled={!active||!validAction||after>10||count!==needed&&!selectedDoubleGem} onClick={()=>validAction&&active&&runAction(validAction.action)}>{copy(language,'보석 가져오기','Tomar gemas')}</button>
          </>;})()}
        </div>}
      </section>
      <section className="sp-treasury" aria-label={copy(language, '내 보관함', 'Tus gemas y bonificaciones')}>
        <header className="sp-section-heading"><div><h2>{copy(language,'내 보관함','Tus gemas')}</h2><p>{copy(language,'토큰과 영구 보너스','Fichas y bonificaciones permanentes')}</p></div><span className="sp-capacity"><b>{handTokenTotal}</b> / 10</span></header>
        <div className="sp-treasury-gems">{gems.map(gem=><div className="sp-treasury-gem" key={gem}><GemIcon gem={gem}/><b><GameValue value={Number(tokens[gem]??0)} resetKey={`${playerId}:splendor:token:${gem}`}/></b><span>{gemName(gem,language)}</span></div>)}</div>
        <div className="sp-bonus-row" aria-label={copy(language,'영구 카드 보너스','Bonificaciones permanentes')}><small>{copy(language,'영구 보너스','Bonificaciones permanentes')}</small>{colors.map(gem=><span className={`sp-bonus sp-color-${gem} ${shownEvent?.bonusGem===gem?'is-gain':''}`} key={gem}><GemIcon gem={gem}/><b><GameValue value={Number(owned[gem]??0)} resetKey={`${playerId}:splendor:bonus:${gem}`}/></b></span>)}</div>
        {shownEvent?.purchasedCard&&<div className="sp-acquired-card" data-card-id={shownEvent.purchasedCard.id}><span className="sp-acquired-art" aria-hidden="true">{splendorCardArtSrc(shownEvent.purchasedCard.id)&&<img src={splendorCardArtSrc(shownEvent.purchasedCard.id)!} alt=""/>}</span><span><b>{copy(language,'새 카드가 포트폴리오에 들어왔어요','Nueva carta añadida a tu colección')}</b></span></div>}
      </section>
      <section className="sp-reserved" aria-label={copy(language,'예약 카드','Cartas reservadas')}>
        <header className="sp-section-heading"><div><h2>{copy(language,'예약 카드','Cartas reservadas')}</h2><p>{copy(language,'내가 볼 수 있는 카드','Solo tú ves estas cartas')}</p></div><span className="sp-capacity"><b>{reserved.length}</b> / 3</span></header>
        <div className="sp-reserved-list">{Array.from({length:3},(_,index)=>{
          const card=reserved[index]; if(!card)return <div className="sp-reserved-empty" key={`slot-${index}`}><span>{index+1}</span>{copy(language,'빈 슬롯','Espacio vacío')}</div>;
          const id=String(card.id??index), selected=selectedCard?.source==='reserved'&&selectedCard.id===id;
          return <SplendorReservedCard key={id} card={{...record(card),id,index}} language={language} selected={selected} viewer={playerId} version={version} incoming={reservedArrivals.has(id)} onSelect={(target,keyboard)=>card.id!=null&&selectCard(String(card.id),'reserved',undefined,target,keyboard)}/>;
        })}</div>
        <p className="sp-opponent-reserved">{copy(language,'상대 예약 카드','Reservadas de la otra persona')} <b>{Number(board.reservedOpponentCount??0)} / 3</b> · {copy(language,`상대 토큰 ${Number(view?.opponentCount??0)}개`,`Fichas rivales: ${Number(view?.opponentCount??0)}`)}</p>
      </section>
    </aside>
      <section className={`sp-nobles ${choices.some(choice=>choice.action.type==='chooseNoble')?'is-choosing':''} ${shownEvent?.nobleAwarded?'is-visit':''}`} aria-label={copy(language,'공개 귀족','Nobles visibles')}>
        <header className="sp-section-heading"><div><h2>{choices.some(choice=>choice.action.type==='chooseNoble')?copy(language,'귀족을 선택하세요','Elige un noble'):copy(language,'귀족','Nobles')}</h2><p>{copy(language,'개발 보너스 조건','Requisitos de bonificación')}</p></div></header>
        {shownEvent?.nobleAwarded&&<div className="sp-noble-event" role="status" data-recipient={shownEvent.nobleRecipient}><span className="sp-noble-event-art" aria-hidden="true">{splendorNobleArtSrc(shownEvent.nobleId)&&<img src={splendorNobleArtSrc(shownEvent.nobleId)!} alt=""/>}</span><b>{eventCopy({...shownEvent,kind:'noble'})}</b></div>}
        <div className="sp-noble-list">{Object.entries(nobles).map(([id,raw])=>{
          const noble=record(raw), choice=choices.find(item=>item.action.type==='chooseNoble'&&item.action.payload?.id===id), needs=colors.filter(gem=>Number(noble.requirement?.[gem]??0)>0);
          const artSrc = splendorNobleArtSrc(id);
          return <button type="button" className={`sp-noble ${choice?'is-selectable':''}`} data-sp-noble-id={id} key={id} disabled={!choice} aria-label={`${copy(language,'귀족','Noble')} · ${Number(noble.points??3)} ${copy(language,'점','pts')}${choice?` · ${copy(language,'선택 가능','disponible')}`:''}`} onClick={()=>choice&&runAction(choice.action)}>
            <span className="sp-noble-art" aria-hidden="true">{artSrc&&<img src={artSrc} alt=""/>}</span><span className="sp-noble-info"><b>{copy(language,'귀족 방문','Visita noble')}</b><small>{Number(noble.points??3)} {copy(language,'점','pts')}</small><span className="sp-noble-cost">{needs.map(gem=><i className={`sp-cost sp-color-${gem}`} key={gem}><GemIcon gem={gem}/><b>{Number(noble.requirement[gem])}</b></i>)}</span><span className="sp-noble-progress" aria-label={copy(language,'내 영구 보너스 진척','Tu progreso de bonificaciones')}>{needs.map(gem=><small className={Number(owned[gem]??0)>=Number(noble.requirement[gem])?'is-met':''} key={gem}>{gemName(gem,language)} {Math.min(Number(owned[gem]??0),Number(noble.requirement[gem]))}/{Number(noble.requirement[gem])}</small>)}</span></span>
            {choice&&<span className="sp-noble-select-label">{copy(language,'선택','Elegir')}</span>}
          </button>;
        })}{!Object.keys(nobles).length&&<p className="sp-empty">{copy(language,'남은 귀족이 없어요','No quedan nobles')}</p>}</div>
      </section>
    <SplendorMotion scope={`${roomId??'demo'}:${playerId}`} version={version} viewer={playerId} event={shownEvent}/>

    {view?.result&&<ResultLine game="splendor" result={view.result} playerId={playerId} language={language}/>}
  </div>;
}

function SplendorMarketCard({card,language,selected,viewer,version,incoming,deficit,legalBuy,onSelect}:{card:RecordValue;language:Language;selected:boolean;viewer:PlayerId;version:number;incoming:boolean;deficit:number;legalBuy:boolean;onSelect:(target:HTMLElement,keyboard:boolean)=>void}) {
  const bonus=String(card.bonus??'white'), tier=Number(card.tier??1), artSrc=splendorCardArtSrc(card.id);
  const costColors=colors.filter(gem=>Number(card.cost?.[gem]??0)>0);
  const costDescription=costColors.map(gem=>`${Number(card.cost[gem])} ${gemName(gem,language)}`).join(', ')||copy(language,'비용 없음','Sin costo');
  const costState=deficit>0?copy(language,`토큰 ${deficit}개 부족`,`Faltan ${deficit} fichas`):legalBuy?copy(language,'구매 가능','Disponible para compra'):copy(language,'비용 충족','Coste cubierto');
  const choose=(event:React.KeyboardEvent<HTMLElement>)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect(event.currentTarget,true);}};
  return <article className={`sp-card ${selected?'is-selected':''} ${incoming?'is-arrival':''} ${legalBuy&&deficit===0?'is-buyable':''}`} data-card-id={card.id} data-source-zone="market" data-tier={tier} data-viewer={viewer} data-version={version} data-cost-deficit={deficit} aria-pressed={selected} aria-label={copy(language,`${tier}단계 카드 · 보너스 ${gemName(bonus,language)} +1 · ${Number(card.points??0)}점 · 비용 ${costDescription} · ${costState}`,`Carta de nivel ${tier} · bonificación ${gemName(bonus,language)} +1 · ${Number(card.points??0)} pts · costo ${costDescription} · ${costState}`)} role="button" tabIndex={0} onClick={event=>onSelect(event.currentTarget,event.detail===0)} onKeyDown={choose}>
    <div className={`sp-card-art sp-color-${bonus}`} data-art-src={artSrc??''} aria-hidden="true">{artSrc?<img className="sp-card-face" src={artSrc} alt="" width="250" height="350" loading="lazy"/>:<span className="sp-card-fallback"><GemIcon gem={bonus}/>{copy(language,'카드 그림을 불러올 수 없어요','Imagen no disponible')}</span>}</div>
    <div className="sp-card-details"><div className={`sp-bonus-label sp-color-${bonus}`} title={copy(language,`영구 보너스 ${gemName(bonus,language)}`,`Bonificación permanente ${gemName(bonus,language)}`)}><GemIcon gem={bonus}/><span>+1</span></div><b className="sp-card-prestige">{Number(card.points??0)} {copy(language,'점','pts')}</b><span className="sp-card-cost-summary" aria-hidden="true">{costColors.length?costColors.map(gem=><span className={`sp-card-cost-chip sp-color-${gem}`} key={gem} title={`${gemName(gem,language)} ${Number(card.cost[gem])}`}><GemIcon gem={gem}/><b>{Number(card.cost[gem])}</b></span>):<span className="sp-card-no-cost">{copy(language,'비용 없음','Sin costo')}</span>}</span><span className="sp-card-select-hint">{selected?copy(language,'선택됨 · Esc 취소','Seleccionada · Esc cancela'):copy(language,'선택해 비용 확인','Selecciona para ver el coste')}</span></div>
  </article>;
}

function SplendorReservedCard({card,language,selected,viewer,version,incoming,onSelect}:{card:RecordValue;language:Language;selected:boolean;viewer:PlayerId;version:number;incoming:boolean;onSelect:(target:HTMLElement,keyboard:boolean)=>void}) {
  const bonus=String(card.bonus??'white'),cost=colors.filter(gem=>Number(card.cost?.[gem]??0)>0);
  const artSrc=splendorCardArtSrc(card.id);
  const costDescription=cost.map(gem=>`${Number(card.cost[gem])} ${gemName(gem,language)}`).join(', ')||copy(language,'없음','ninguno');
  const accessibleName=copy(language,`예약 ${Number(card.tier)}단계 카드 · 보너스 ${gemName(bonus,language)} +1 · ${Number(card.points??0)}점 · 비용 ${costDescription}`,`Carta reservada de nivel ${Number(card.tier)} · bonificación ${gemName(bonus,language)} +1 · ${Number(card.points??0)} pts · coste ${costDescription}`);
  const choose=(event:React.KeyboardEvent<HTMLElement>)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect(event.currentTarget,true);}};
  return <article className={`sp-reserved-card ${selected?'is-selected':''} ${incoming?'is-arrival':''}`} data-card-id={card.id} data-source-zone="reserved" data-viewer={viewer} data-version={version} aria-pressed={selected} aria-label={accessibleName} role="button" tabIndex={0} onClick={event=>onSelect(event.currentTarget,event.detail===0)} onKeyDown={choose}><span className="sp-reserved-art" aria-hidden="true">{artSrc&&<img src={artSrc} alt="" width="52" height="74" loading="lazy"/>}</span><div><b>{copy(language,'예약 카드','Carta reservada')} · {copy(language,`단계 ${Number(card.tier)}`,`Nivel ${Number(card.tier)}`)}</b><span className="sp-reserved-value">{Number(card.points??0)} {copy(language,'점','pts')} · {copy(language,`보너스 ${gemName(bonus,language)}`,`Bonificación ${gemName(bonus,language)}`)}</span><span className="sp-reserved-cost">{costDescription}</span></div></article>;
}

function sameStrings(left: unknown, right: string[]) { return Array.isArray(left) && left.length === right.length && left.every(value => right.includes(value as string)); }
function returnLabel(value: unknown, language: Language) { const tokens = record(value); const entries = Object.entries(tokens).filter(([,count]) => Number(count) > 0); return entries.length ? entries.map(([gem,count]) => `${count} ${gemName(gem, language)}`).join(' · ') : copy(language, '반환 없음', 'Sin devolución'); }
function ResultLine({game, result, playerId, language}: {game: TableGameId; result: any; playerId: PlayerId; language: Language}) {
  const message = result?.winner === 'draw' ? copy(language, '무승부', 'Empate') : result?.winner === playerId ? copy(language, '이겼어요', 'Ganaste') : copy(language, '상대가 이겼어요', 'Ganó la otra persona');
  const outcome = result?.winner === 'draw' ? 'draw' : result?.winner === playerId ? 'win' : 'lose';
  const scores = record(result?.scores);
  const detail = game === 'jaipur'
    ? copy(language, `라운드 승리 ${Number(scores.p1 ?? 0)} 대 ${Number(scores.p2 ?? 0)}`, `Rondas ganadas: ${Number(scores.p1 ?? 0)} a ${Number(scores.p2 ?? 0)}`)
    : game === 'splendor' && result?.scores
      ? copy(language, `최종 점수 ${Number(scores.p1 ?? 0)} 대 ${Number(scores.p2 ?? 0)}`, `Puntuación final: ${Number(scores.p1 ?? 0)} a ${Number(scores.p2 ?? 0)}`)
      : game === 'davinci'
        ? copy(language, '상대의 타일을 모두 공개했어요.', 'Se revelaron todas las fichas de la otra persona.')
        : '';
  const tiedScoreWinner = game === 'splendor' && scores.p1 !== undefined && Number(scores.p1) === Number(scores.p2) && result?.winner !== 'draw';
  return <div className={`tg-result tg-result-${outcome}`} data-game={game} data-outcome={outcome} role="status"><b>{message}</b>{detail && <span>{detail}</span>}{tiedScoreWinner && <span>{copy(language, '같은 점수라 개발 카드가 적은 쪽이 이겼어요.', 'Con los mismos puntos, ganó quien tiene menos cartas de desarrollo.')}</span>}</div>;
}

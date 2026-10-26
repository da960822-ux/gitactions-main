import { fourSeats, fourTeam, localized, nextFourSeat, type FourCard, type FourEngine, type FourResult, type FourSeat, type FourView } from '../core/fourPlayer';
import { minhwatuEngine, minhwatuYakuProgress, scoreMinhwatuYakus, type MinhwatuCard, type MinhwatuEvent, type MinhwatuState } from './minhwatu';
import type { GameAction } from '../core/types';

export interface FourMinhwatuState {
  seed: number;
  turn: FourSeat;
  hands: Record<FourSeat, MinhwatuCard[]>;
  captures: Record<FourSeat, MinhwatuCard[]>;
  table: MinhwatuCard[];
  deck: MinhwatuCard[];
  pending: { card: MinhwatuCard } | null;
  phase: 'play' | 'capture-draw' | 'finished';
  result: FourResult | null;
  events?: FourMinhwatuEvent[];
}

export type FourMinhwatuEvent = Omit<MinhwatuEvent, 'actor' | 'winner' | 'scoreChanges'> & { actor?: FourSeat };

export interface MinhwatuPolicyView extends FourView {
  minhwatu: {
    hand: MinhwatuCard[];
    table: MinhwatuCard[];
    captures: Record<FourSeat, MinhwatuCard[]>;
    pending: MinhwatuCard | null;
    deckCount: number;
    events: FourMinhwatuEvent[];
  };
}

const cards = (seed: number) => {
  const initial = minhwatuEngine.createInitialState(seed);
  return [...initial.hands.p1, ...initial.hands.p2, ...initial.table, ...initial.deck];
};

function scores(state: Pick<FourMinhwatuState, 'captures'>): Record<FourSeat, number> {
  const yakus = Object.fromEntries(fourSeats.map(seat => [seat, scoreMinhwatuYakus(state.captures[seat])])) as Record<FourSeat, number>;
  return Object.fromEntries(fourSeats.map(seat => [seat,
    state.captures[seat].reduce((sum, card) => sum + card.points, 0) + 2 * yakus[seat] -
    fourSeats.filter(other => fourTeam(other) !== fourTeam(seat)).reduce((sum, other) => sum + yakus[other], 0),
  ])) as Record<FourSeat, number>;
}

function resultFor(state: FourMinhwatuState): FourResult {
  const individual = scores(state), totals = { A: individual.p1 + individual.p3, B: individual.p2 + individual.p4 };
  return { winner: totals.A === totals.B ? 'draw' : totals.A > totals.B ? 'A' : 'B', scores: totals,
    reason: localized('개인 족보를 정산한 두 팀의 합산 점수', 'Suma por equipos tras puntuar los yakus individuales') };
}

function currentTurn(state: FourMinhwatuState, player: FourSeat): MinhwatuState {
  return { seed: state.seed, rulesVersion: 2, turn: 'p1', hands: { p1: state.hands[player], p2: [] },
    captures: { p1: state.captures[player], p2: [] }, table: state.table, deck: state.deck, pending: state.pending,
    phase: state.phase, result: null };
}

function validate(state: FourMinhwatuState, player: FourSeat, action: GameAction): string | null {
  if (!fourSeats.includes(player)) return 'Invalid player';
  if (state.result || state.phase === 'finished') return 'Game is finished';
  if (player !== state.turn) return 'Not your turn';
  return minhwatuEngine.validateAction(currentTurn(state, player), 'p1', action);
}

function cardView(card: MinhwatuCard, index?: number): FourCard {
  const position = index === undefined ? '' : `${index + 1}. `;
  return { id: card.id, title: localized(`${position}${card.month}월 · ${card.badge.ko}`, `${position}Mes ${card.month} · ${card.badge.es}`),
    detail: localized(`${card.points}점 · ${card.flower.ko}`, `${card.points} pts · ${card.flower.es}`),
    image: `/images/hwatu/${card.id.split('-').map(part => part.padStart(2, '0')).join('-')}.svg` };
}

function getView(state: FourMinhwatuState, player: FourSeat): MinhwatuPolicyView {
  const individual = scores(state);
  const actions = !state.result && player === state.turn ? minhwatuEngine.getPlayerView(currentTurn(state, player), 'p1').actions : [];
  return { game: 'minhwatu', turn: state.turn, phase: state.phase,
    players: fourSeats.map(id => ({ id, score: individual[id], count: state.hands[id].length,
      detail: localized(`획득 ${state.captures[id].length}장 · 족보 ${scoreMinhwatuYakus(state.captures[id])}점`, `${state.captures[id].length} capturadas · yakus ${scoreMinhwatuYakus(state.captures[id])} pts`) })),
    hand: state.hands[player].map(cardView),
    panels: [
      { id: 'table', title: localized(`바닥 · 더미 ${state.deck.length}장`, `Mesa · mazo ${state.deck.length}`), cards: state.table.map(cardView) },
      ...(state.pending ? [{ id: 'pending', title: localized('뒤집은 카드 · 짝을 고르세요', 'Carta revelada · elige pareja'), cards: [cardView(state.pending.card)] }] : []),
      ...fourSeats.map(id => ({ id: `captures-${id}`, title: localized(`${id.toUpperCase()} 획득패`, `Capturas ${id.toUpperCase()}`), cards: state.captures[id].map(card => cardView(card)) })),
    ],
    actions: structuredClone(actions), result: state.result ? structuredClone(state.result) : null,
    note: localized('4인 분배 기반의 2대2 자체 팀 규칙 · 개인 족보만 인정하며 팀원의 손패는 공유하지 않아요.', 'Variante propia 2 contra 2 con reparto para cuatro · yakus individuales y manos privadas.'),
    minhwatu: { hand: structuredClone(state.hands[player]), table: structuredClone(state.table), captures: structuredClone(state.captures), pending: state.pending ? structuredClone(state.pending.card) : null,
      deckCount: state.deck.length, events: structuredClone(state.events ?? []) },
  };
}

function chooseAiAction(rawView: FourView, player: FourSeat, random = Math.random): GameAction | null {
  const view = rawView as MinhwatuPolicyView;
  if (view.result || view.turn !== player || !view.actions.length) return null;
  const { hand, table, captures, pending } = view.minhwatu;
  const own = captures[player], enemies = fourSeats.filter(seat => fourTeam(seat) !== fourTeam(player));
  const ownProgress = minhwatuYakuProgress(own);
  const enemyProgress = enemies.flatMap(seat => minhwatuYakuProgress(captures[seat]));
  const value = (captured: MinhwatuCard[]) => {
    const progress = minhwatuYakuProgress([...own, ...captured]);
    const combo = progress.reduce((sum, yaku, i) => sum + (yaku.have > ownProgress[i].have ?
      yaku.bonus * (yaku.complete ? 2 : yaku.have / yaku.need * .5) : 0), 0);
    const blocking = captured.reduce((sum, card) => sum + enemyProgress.reduce((n, yaku) =>
      n + (!yaku.complete && yaku.cardIds.includes(card.id) ? yaku.bonus * (yaku.have / yaku.need) ** 2 : 0), 0), 0);
    return captured.reduce((sum, card) => sum + card.points, 0) + combo + blocking;
  };
  const known = new Set([...hand, ...table, ...Object.values(captures).flat(), ...(pending ? [pending] : [])].map(card => card.id));
  // shortcut: unknown cards are equally likely draws; upgrade to public-event inference for stronger late-game play.
  const unseen = cards(0).filter(card => !known.has(card.id));
  const gain = (card: MinhwatuCard, surface: MinhwatuCard[], target?: number) => {
    const matches = surface.flatMap((other, index) => other.month === card.month ? [index] : []);
    const chosen = matches.length === 3 ? matches : matches.length === 2 ? [target ?? matches.reduce((best, index) => value([card, surface[index]]) > value([card, surface[best]]) ? index : best, matches[0])] : matches;
    return { captured: chosen.length ? [card, ...chosen.map(index => surface[index])] : [], surface: chosen.length ? surface.filter((_, index) => !chosen.includes(index)) : [...surface, card] };
  };
  let best = -Infinity, choices: GameAction[] = [];
  for (const option of view.actions) {
    const action = option.action, card = action.type === 'capture' ? pending! : hand[Number(action.payload?.index)];
    const { captured, surface } = gain(card, table, action.payload?.targetIndex as number | undefined);
    let utility = value(captured);
    if (action.type === 'play' && unseen.length) utility += unseen.reduce((sum, drawn) => sum + value(gain(drawn, surface).captured), 0) / unseen.length;
    if (!captured.length) utility -= card.points * .45 + enemyProgress.reduce((sum, yaku) => sum + (yaku.cardIds.includes(card.id) ? yaku.bonus * yaku.have / yaku.need * .4 : 0), 0);
    if (utility > best) { best = utility; choices = [action]; }
    else if (utility === best) choices.push(action);
  }
  return choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))];
}

export const fourMinhwatuEngine: FourEngine = {
  id: 'minhwatu',
  createInitialState(seed): FourMinhwatuState {
    const deck = cards(seed);
    return { seed: seed >>> 0, turn: fourSeats[seed >>> 30], hands: { p1: deck.slice(0, 5), p2: deck.slice(5, 10), p3: deck.slice(10, 15), p4: deck.slice(15, 20) },
      captures: { p1: [], p2: [], p3: [], p4: [] }, table: deck.slice(20, 28), deck: deck.slice(28), pending: null, phase: 'play', result: null,
      events: [{ sequence: 1, type: 'deal', title: localized('네 자리의 패를 나눴어요', 'Se reparten las cuatro manos'), cards: deck.slice(20, 28) }] };
  },
  validateAction: validate,
  applyAction(state: FourMinhwatuState, player, action): FourMinhwatuState {
    const error = validate(state, player, action); if (error) throw new Error(error);
    const moved = minhwatuEngine.applyAction(currentTurn(state, player), 'p1', action);
    const next: FourMinhwatuState = { ...state, hands: { ...state.hands, [player]: moved.hands.p1 },
      captures: { ...state.captures, [player]: moved.captures.p1 }, table: moved.table, deck: moved.deck,
      pending: moved.pending, phase: moved.pending ? 'capture-draw' : 'play', turn: moved.pending ? player : nextFourSeat(player), result: null };
    if (!next.pending && !next.deck.length && fourSeats.every(seat => !next.hands[seat].length)) { next.phase = 'finished'; next.result = resultFor(next); }
    const events: FourMinhwatuEvent[] = (moved.events ?? []).filter(event => event.type !== 'turn' && event.type !== 'win').map(event => {
      const { actor: _actor, winner: _winner, scoreChanges: _scoreChanges, ...publicEvent } = event;
      return { ...publicEvent, actor: player, title: localized(`${player.toUpperCase()} · ${event.title.ko}`, `${player.toUpperCase()} · ${event.title.es}`) };
    });
    if (next.result) events.push({ sequence: 0, type: 'win', title: localized('두 팀의 민화투 정산', 'Resultado de los dos equipos') });
    else if (!next.pending) events.push({ sequence: 0, type: 'turn', actor: next.turn, title: localized(`${next.turn.toUpperCase()} 차례`, `Turno de ${next.turn.toUpperCase()}`) });
    const sequence = state.events?.at(-1)?.sequence ?? 0;
    next.events = [...(state.events ?? []), ...events.map((event, index) => ({ ...event, sequence: sequence + index + 1 }))].slice(-48);
    return next;
  },
  getPlayerView: getView,
  chooseAiAction,
};

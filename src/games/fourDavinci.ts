import { fourSeats, fourTeam, localized, nextFourSeat, type FourCard, type FourEngine, type FourResult, type FourSeat, type FourView } from '../core/fourPlayer';
import { seededRandom, shuffle, type GameAction } from '../core/types';
import { davinciGuessProbabilities } from './davinciAi';

type Color = 'black' | 'white';
type Tile = { color: Color; value: number | 'joker'; revealed: boolean };
export type FourDavinciVisibleTile = Omit<Tile, 'value'> & { value: Tile['value'] | null };
type Event = { sequence: number; type: 'draw' | 'wrong-guess' | 'correct-guess' | 'arrange' | 'stop' | 'skip-draw' | 'ready'; actor: FourSeat; target?: FourSeat; index?: number; value?: Tile['value']; insertedIndex?: number; revealedOwnIndex?: number };
export interface FourDavinciState {
  seed: number; turn: FourSeat; phase: 'setup' | 'draw' | 'place-joker' | 'guess' | 'reveal-own' | 'finished';
  hands: Record<FourSeat, Tile[]>; deck: Tile[]; ready: Record<FourSeat, boolean>; pendingJokers: Record<FourSeat, Color[]>;
  drawnIndex: number | null; mayStop: boolean; score: Record<FourSeat, number>; log: Event[]; eventSequence: number; result: FourResult | null;
  pendingGuess?: { target: FourSeat; index: number; value: Tile['value'] };
}
export interface FourDavinciView extends FourView {
  policy: { own: Tile[]; racks: Record<FourSeat, FourDavinciVisibleTile[]>; deckCount: number; log: Event[]; ready: Record<FourSeat, boolean>; ownJokerToPlace?: { color: Color; index: number } };
}
function appendEvent(state: FourDavinciState, event: Omit<Event, 'sequence'>) {
  const eventSequence = (state.eventSequence ?? 0) + 1;
  return { eventSequence, log: [...state.log, { ...event, sequence: eventSequence }].slice(-80) };
}
const isSeat = (seat: unknown): seat is FourSeat => fourSeats.includes(seat as FourSeat);
const live = (state: FourDavinciState, seat: FourSeat) => state.hands[seat].some(tile => !tile.revealed);
const tileLabel = (tile: FourDavinciVisibleTile, index: number) => localized(
  `${index + 1} · ${tile.color === 'black' ? '검정' : '흰색'} ${tile.value === null ? '?' : tile.value === 'joker' ? '－' : tile.value}`,
  `${index + 1} · ${tile.color === 'black' ? 'negra' : 'blanca'} ${tile.value === null ? '?' : tile.value === 'joker' ? '－' : tile.value}`,
);
const insert = (hand: Tile[], tile: Tile) => {
  const next = [...hand];
  const at = typeof tile.value === 'number' ? next.findIndex(existing => typeof existing.value === 'number' &&
    (existing.value > (tile.value as number) || existing.value === tile.value && existing.color === 'white' && tile.color === 'black')) : -1;
  next.splice(at < 0 ? next.length : at, 0, tile);
  return next;
};
function advance(state: FourDavinciState) {
  let turn = nextFourSeat(state.turn);
  while (!live(state, turn)) turn = nextFourSeat(turn);
  return { ...state, turn, phase: state.deck.length ? 'draw' as const : 'guess' as const, drawnIndex: null, mayStop: false };
}
function finish(state: FourDavinciState): FourDavinciState {
  const alive = fourSeats.filter(seat => live(state, seat));
  const winner = alive.every(seat => fourTeam(seat) === 'A') ? 'A' : alive.every(seat => fourTeam(seat) === 'B') ? 'B' : null;
  if (!winner) return state;
  return { ...state, phase: 'finished', result: { winner,
    scores: { A: state.score.p1 + state.score.p3, B: state.score.p2 + state.score.p4 },
    reason: localized('상대 팀 두 사람의 타일이 모두 공개됐어요.', 'Se revelaron todas las fichas de los dos rivales.'),
  } };
}
function validate(state: FourDavinciState, player: FourSeat, action: GameAction): string | null {
  if (!isSeat(player)) return 'invalid_player';
  if (state.result) return 'game_finished';
  if (!action || typeof action.type !== 'string') return 'invalid_action';
  if (state.turn !== player) return 'not_your_turn';
  const x = action.payload ?? {};
  if (state.phase === 'setup') {
    if (action.type === 'finish-setup') return state.pendingJokers[player].length ? 'place_joker_first' : null;
    return action.type === 'place-joker' && state.pendingJokers[player].length && Number.isInteger(x.index) && Number(x.index) >= 0 && Number(x.index) < state.hands[player].length ? null : 'invalid_setup';
  }
  if (!live(state, player)) return 'player_eliminated';
  if (action.type === 'draw') return state.phase === 'draw' && state.deck.length ? null : 'cannot_draw';
  if (action.type === 'skip-draw') return state.phase === 'draw' && !state.deck.length ? null : 'cannot_skip_draw';
  if (action.type === 'reveal-own') return state.phase === 'reveal-own' && state.pendingGuess && Number.isInteger(x.index) && Number(x.index) >= 0 && Number(x.index) < state.hands[player].length && !state.hands[player][Number(x.index)].revealed ? null : 'choose_hidden_own_tile';
  if (action.type === 'place-joker') return state.phase === 'place-joker' && state.drawnIndex !== null &&
    state.hands[player][state.drawnIndex]?.value === 'joker' && Number.isInteger(x.index) && Number(x.index) >= 0 && Number(x.index) < state.hands[player].length ? null : 'invalid_joker_position';
  if (action.type === 'stop') return state.phase === 'guess' && state.mayStop ? null : 'cannot_stop';
  if (action.type !== 'guess' || state.phase !== 'guess') return 'invalid_action';
  if (!isSeat(x.target) || fourTeam(x.target) === fourTeam(player)) return 'choose_enemy';
  if (!Number.isInteger(x.index) || Number(x.index) < 0 || Number(x.index) >= state.hands[x.target].length || state.hands[x.target][Number(x.index)].revealed) return 'invalid_target_tile';
  return x.value === 'joker' || Number.isInteger(x.value) && Number(x.value) >= 0 && Number(x.value) <= 11 ? null : 'invalid_guess';
}
function apply(state: FourDavinciState, player: FourSeat, action: GameAction): FourDavinciState {
  const error = validate(state, player, action); if (error) throw new Error(error);
  const x = action.payload ?? {};
  if (action.type === 'finish-setup') {
    const ready = { ...state.ready, [player]: true }, complete = fourSeats.every(seat => ready[seat]);
    return { ...state, ...appendEvent(state, { type: 'ready', actor: player }), ready, turn: complete ? 'p1' : nextFourSeat(player), phase: complete ? 'draw' : 'setup' };
  }
  if (action.type === 'place-joker') {
    const setup = state.phase === 'setup';
    const oldIndex = setup ? state.hands[player].findIndex(tile => tile.value === 'joker' && tile.color === state.pendingJokers[player][0]) : state.drawnIndex!;
    const hand = [...state.hands[player]], [tile] = hand.splice(oldIndex, 1); hand.splice(Number(x.index), 0, tile);
    return { ...state, ...appendEvent(state, { type: 'arrange', actor: player, insertedIndex: Number(x.index) }), hands: { ...state.hands, [player]: hand }, drawnIndex: setup ? null : Number(x.index),
      phase: setup ? 'setup' : 'guess', pendingJokers: setup ? { ...state.pendingJokers, [player]: state.pendingJokers[player].slice(1) } : state.pendingJokers };
  }
  if (action.type === 'draw') {
    const tile = state.deck[state.deck.length - 1], hand = insert(state.hands[player], tile);
    return { ...state, hands: { ...state.hands, [player]: hand }, deck: state.deck.slice(0, -1), drawnIndex: hand.indexOf(tile), mayStop: false,
      phase: tile.value === 'joker' ? 'place-joker' : 'guess', ...appendEvent(state, { type: 'draw', actor: player, insertedIndex: hand.indexOf(tile) }) };
  }
  if (action.type === 'skip-draw') return { ...state, ...appendEvent(state, { type: 'skip-draw', actor: player }), phase: 'guess', drawnIndex: null, mayStop: false };
  if (action.type === 'reveal-own') {
    const index = Number(x.index), hands = { ...state.hands, [player]: state.hands[player].map((tile, i) => i === index ? { ...tile, revealed: true } : tile) };
    const next = finish({ ...state, hands, pendingGuess: undefined, ...appendEvent(state, { type: 'wrong-guess', actor: player, ...state.pendingGuess!, revealedOwnIndex: index }) });
    return next.result ? next : advance(next);
  }
  if (action.type === 'stop') return advance({ ...state, ...appendEvent(state, { type: 'stop', actor: player }) });
  const target = x.target as FourSeat, index = Number(x.index), correct = state.hands[target][index].value === x.value;
  if (!correct && state.drawnIndex == null && live(state, player)) return { ...state, phase: 'reveal-own', mayStop: false, pendingGuess: { target, index, value: x.value as Tile['value'] } };
  const recorded = appendEvent(state, { type: correct ? 'correct-guess' : 'wrong-guess', actor: player, target, index, value: x.value as Tile['value'], ...(!correct && state.drawnIndex != null ? { revealedOwnIndex: state.drawnIndex } : {}) });
  if (correct) return finish({ ...state, mayStop: true, ...recorded, score: { ...state.score, [player]: state.score[player] + 1 },
    hands: { ...state.hands, [target]: state.hands[target].map((tile, i) => i === index ? { ...tile, revealed: true } : tile) } });
  const hands = state.drawnIndex == null ? state.hands : { ...state.hands, [player]: state.hands[player].map((tile, i) => i === state.drawnIndex ? { ...tile, revealed: true } : tile) };
  const next = finish({ ...state, hands, ...recorded });
  return next.result ? next : advance(next);
}
function view(state: FourDavinciState, player: FourSeat): FourDavinciView {
  const racks = Object.fromEntries(fourSeats.map(seat => [seat, state.hands[seat].map(tile => ({ ...tile, value: seat === player || tile.revealed ? tile.value : null }))])) as Record<FourSeat, FourDavinciVisibleTile[]>;
  const actions: FourView['actions'] = [];
  const add = (ko: string, es: string, action: GameAction) => actions.push({ label: localized(ko, es), action });
  if (!state.result && state.turn === player) {
    if (state.phase === 'setup' && !state.pendingJokers[player].length) add('배치 완료', 'Listo para jugar', { type: 'finish-setup' });
    if (state.phase === 'place-joker' || state.phase === 'setup' && state.pendingJokers[player].length) {
      state.hands[player].forEach((_, index) => add(`조커를 ${index + 1}번째 자리에 놓기`, `Colocar comodín en posición ${index + 1}`, { type: 'place-joker', payload: { index } }));
    }
    if (state.phase === 'draw') add(state.deck.length ? '타일 뽑기' : '추리 시작', state.deck.length ? 'Robar ficha' : 'Adivinar', { type: state.deck.length ? 'draw' : 'skip-draw' });
    if (state.phase === 'guess') {
      for (const target of fourSeats.filter(seat => fourTeam(seat) !== fourTeam(player))) racks[target].forEach((tile, index) => {
        if (tile.revealed) return;
        for (const value of [...Array.from({ length: 12 }, (_, n) => n), 'joker' as const]) add(
          `${target.toUpperCase()} ${index + 1}번 ${tile.color === 'black' ? '검정' : '흰색'}: ${value === 'joker' ? '－' : value}`,
          `${target.toUpperCase()} ficha ${index + 1} ${tile.color === 'black' ? 'negra' : 'blanca'}: ${value === 'joker' ? '－' : value}`,
          { type: 'guess', payload: { target, index, value } },
        );
      });
      if (state.mayStop) add('차례 마치기', 'Terminar turno', { type: 'stop' });
    }
    if (state.phase === 'reveal-own') state.hands[player].forEach((tile, index) => { if (!tile.revealed) add(`내 ${index + 1}번 타일 공개`, `Revelar mi ficha ${index + 1}`, { type: 'reveal-own', payload: { index } }); });
  }
  const card = (tile: FourDavinciVisibleTile, seat: FourSeat, index: number): FourCard => ({ id: `${seat}-${index}`, title: tileLabel(tile, index),
    detail: localized(tile.revealed ? '공개됨' : seat === player ? '나만 볼 수 있어요' : '비공개', tile.revealed ? 'Revelada' : seat === player ? 'Solo tú puedes verla' : 'Oculta'),
    color: tile.color === 'black' ? '#27313d' : '#f4ecda', hidden: tile.value === null,
  });
  const ownJokerIndex = state.phase === 'setup' ? state.hands[player].findIndex(tile => tile.value === 'joker' && tile.color === state.pendingJokers[player][0]) : state.turn === player && state.phase === 'place-joker' ? state.drawnIndex ?? -1 : -1;
  const visibleLog = state.log.filter(event => event.type !== 'arrange' || event.actor === player).map(({ insertedIndex, ...event }) => event.actor === player && insertedIndex !== undefined ? { ...event, insertedIndex } : event);
  return { game: 'davinci', turn: state.turn, phase: state.phase, result: state.result, actions,
    players: fourSeats.map(seat => ({ id: seat, score: state.score[seat], count: state.hands[seat].filter(tile => !tile.revealed).length,
      eliminated: !live(state, seat), detail: localized(state.ready[seat] ? '준비 완료' : '시작 배치 중', state.ready[seat] ? 'Listo' : 'Preparando fichas') })),
    hand: racks[player].map((tile, index) => card(tile, player, index)),
    panels: fourSeats.filter(seat => seat !== player).map(seat => ({ id: seat, title: localized(`${seat.toUpperCase()} · ${fourTeam(seat)}팀`, `${seat.toUpperCase()} · Equipo ${fourTeam(seat)}`), cards: racks[seat].map((tile, index) => card(tile, seat, index)) })),
    note: localized(`4인·조커 팀 변형 · 각 3장 · 남은 더미 ${state.deck.length}장 · 팀원 패 공유 없음`, `Variante por equipos con comodines · 3 fichas iniciales · Mazo: ${state.deck.length} · Sin compartir fichas`),
    policy: { own: state.hands[player].map(tile => ({ ...tile })), racks, deckCount: state.deck.length, log: visibleLog, ready: { ...state.ready }, ...(ownJokerIndex >= 0 ? { ownJokerToPlace: { color: state.hands[player][ownJokerIndex].color, index: ownJokerIndex } } : {}) },
  };
}
function ai(rawView: FourView, player: FourSeat, random = Math.random): GameAction | null {
  const v = rawView as FourDavinciView, choices = v.actions.map(option => option.action);
  if (!choices.length || v.result) return null;
  const guesses = choices.filter(action => action.type === 'guess');
  if (!guesses.length) return choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))];
  const distributions = new Map<FourSeat, Map<string, number>>();
  for (const target of fourSeats.filter(seat => fourTeam(seat) !== fourTeam(player))) {
    const known = [...v.policy.own, ...fourSeats.filter(seat => seat !== player && seat !== target).flatMap(seat => v.policy.racks[seat].filter(tile => tile.revealed).map(tile => ({ ...tile, value: tile.value! })))];
    const lastDraw = v.policy.log.map(event => event.type === 'draw' && event.actor === target).lastIndexOf(true);
    const failures = v.policy.log.slice(lastDraw + 1).filter(event => event.type === 'wrong-guess' && event.target === target)
      .map(event => ({ type: 'wrong-guess', actor: 'p1', targetIndex: event.index, guess: event.value }));
    distributions.set(target, davinciGuessProbabilities(known, v.policy.racks[target], failures, 'p1'));
  }
  const probability = (action: GameAction) => distributions.get(action.payload!.target as FourSeat)?.get(`${action.payload!.index}:${action.payload!.value}`) ?? 0;
  const score = (action: GameAction) => probability(action) * (v.players.find(p => p.id === action.payload!.target)?.count === 1 ? 1.2 : 1);
  const bestScore = Math.max(...guesses.map(score)), best = guesses.filter(action => score(action) === bestScore);
  if (choices.some(action => action.type === 'stop') && probability(best[0]) < .55 && v.players.find(p => p.id === player)!.count <= 2 && v.policy.deckCount > 0) return { type: 'stop' };
  return best[Math.min(best.length - 1, Math.floor(random() * best.length))];
}
export const fourDavinciEngine: FourEngine = {
  id: 'davinci',
  createInitialState(seed): FourDavinciState {
    const pack: Tile[] = (['black', 'white'] as const).flatMap(color => [...Array.from({ length: 12 }, (_, value): Tile => ({ color, value, revealed: false })), { color, value: 'joker', revealed: false }]);
    const deck = shuffle(pack, seededRandom(seed)), hands: Record<FourSeat, Tile[]> = { p1: [], p2: [], p3: [], p4: [] };
    for (let i = 0; i < 3; i++) for (const seat of fourSeats) hands[seat] = insert(hands[seat], deck.pop()!);
    return { seed, turn: 'p1', phase: 'setup', hands, deck, ready: { p1: false, p2: false, p3: false, p4: false },
      pendingJokers: Object.fromEntries(fourSeats.map(seat => [seat, hands[seat].filter(tile => tile.value === 'joker').map(tile => tile.color)])) as Record<FourSeat, Color[]>,
      drawnIndex: null, mayStop: false, score: { p1: 0, p2: 0, p3: 0, p4: 0 }, log: [], eventSequence: 0, result: null };
  },
  validateAction: validate, applyAction: apply, getPlayerView: view, chooseAiAction: ai,
};

import { describe, expect, it } from 'vitest';
import { fourSeats, type FourSeat, type FourView } from '../core/fourPlayer';
import { seededRandom } from '../core/types';
import { fourSplendorEngine as engine, type FourSplendorState, type FourSplendorView } from './fourSplendor';

const colors = ['white', 'blue', 'green', 'red', 'black', 'gold'] as const;
function conserved(state: FourSplendorState) {
  for (const gem of colors) expect(state.bank[gem] + fourSeats.reduce((n, p) => n + state.hands[p][gem], 0)).toBe(gem === 'gold' ? 5 : 7);
  const bought = fourSeats.reduce((n, p) => n + colors.filter(g => g !== 'gold').reduce((m, g) => m + state.bonuses[p][g], 0), 0);
  expect(bought + fourSeats.reduce((n, p) => n + state.reserved[p].length, 0) + ([1, 2, 3] as const).reduce((n, tier) => n + state.decks[tier].length + state.market[tier].length, 0)).toBe(90);
  for (const p of fourSeats) {
    expect(colors.reduce((n, g) => n + state.hands[p][g], 0)).toBeLessThanOrEqual(10);
    expect(state.reserved[p].length).toBeLessThanOrEqual(3);
  }
}
const apply = (state: FourSplendorState, action: { type: string; payload?: Record<string, unknown> }) => engine.applyAction(state, state.active, action) as FourSplendorState;

describe('four-player Splendor team variant', () => {
  it('sets up the official four-player supply and five nobles with individual wallets', () => {
    const state: FourSplendorState = engine.createInitialState(17);
    expect(Object.keys(state.availableNobles)).toHaveLength(5);
    expect(state.market[1]).toHaveLength(4);
    expect(state.market[2]).toHaveLength(4);
    expect(state.market[3]).toHaveLength(4);
    state.hands.p1.blue = 1;
    expect(state.hands.p3.blue).toBe(0);
  });

  it('rotates all four seats and rejects wrong-seat or malformed actions', () => {
    let state: FourSplendorState = engine.createInitialState(17);
    for (const p of fourSeats) {
      expect(state.active).toBe(p);
      expect(engine.validateAction(state, p === 'p1' ? 'p2' : 'p1', { type: 'take', payload: { gems: ['blue', 'green', 'red'] } })).toBe('Not your turn');
      const action = engine.getPlayerView(state, p).actions[0].action;
      expect(engine.validateAction(state, p, action)).toBeNull();
      state = apply(state, action); conserved(state);
    }
    expect(state.active).toBe('p1');
    expect(state.turns).toEqual({ p1: 1, p2: 1, p3: 1, p4: 1 });
    expect(engine.validateAction(state, 'p1', null as any)).toBe('Invalid action');
    expect(engine.validateAction(state, 'unknown' as FourSeat, { type: 'take' })).toBe('Invalid player');
    expect(engine.validateAction(state, 'p1', { type: 'take', payload: { gems: ['blue', 'blue', 'blue'] } })).toBeTruthy();
  });

  it('names the gem colors for all ten take choices and distinguishes return plans and blind reserve tiers', () => {
    const state: FourSplendorState = engine.createInitialState(17);
    const actions = engine.getPlayerView(state, 'p1').actions;
    const takes = actions.filter(choice => choice.action.type === 'take');
    expect(takes).toHaveLength(10);
    for (const language of ['ko', 'es'] as const) expect(new Set(takes.map(choice => choice.label[language])).size).toBe(10);
    const whiteBlueGreen = takes.find(choice => JSON.stringify(choice.action.payload?.gems) === JSON.stringify(['white', 'blue', 'green']))!;
    expect(whiteBlueGreen.label).toEqual({ ko: '보석 가져오기 · 흰색 1 · 파랑 1 · 초록 1', es: 'Tomar gemas · Blanco 1 · Azul 1 · Verde 1' });
    expect(actions.find(choice => choice.action.type === 'takeTwo' && choice.action.payload?.gem === 'blue')?.label.ko).toContain('파랑 2');
    const blind = actions.filter(choice => choice.action.type === 'reserve' && choice.action.payload?.index === undefined);
    expect(blind.map(choice => choice.label.ko)).toEqual(['1단계 덱에서 비공개 예약', '2단계 덱에서 비공개 예약', '3단계 덱에서 비공개 예약']);
    state.hands.p1 = { white: 2, blue: 2, green: 2, red: 2, black: 2, gold: 0 };
    for (const g of colors) state.bank[g] -= state.hands.p1[g];
    const withReturns = engine.getPlayerView(state, 'p1').actions.filter(choice => choice.action.type === 'take');
    const returningRed = withReturns.find(choice => JSON.stringify(choice.action.payload?.gems) === JSON.stringify(['white', 'blue', 'green']) && JSON.stringify(choice.action.payload?.returnTokens) === JSON.stringify({ white: 1, red: 2 }))!;
    expect(returningRed.label.ko).toContain('반환 흰색 1 · 빨강 2');
    expect(returningRed.label.es).toContain('Devolver Blanco 1 · Rojo 2');
  });

  it('hides blind reservations from opponents and teammates without exposing deck order', () => {
    let state: FourSplendorState = engine.createInitialState(17);
    const reservedId = state.decks[3][0].id;
    state = apply(state, { type: 'reserve', payload: { tier: 3 } });
    const hiddenState: FourSplendorState = structuredClone(state);
    hiddenState.reserved.p1[0] = { ...hiddenState.reserved.p1[0], id: 'hidden-sentinel' };
    hiddenState.decks[1].reverse();
    expect(engine.getPlayerView(hiddenState, 'p2')).toEqual(engine.getPlayerView(state, 'p2'));
    expect(engine.getPlayerView(hiddenState, 'p3')).toEqual(engine.getPlayerView(state, 'p3'));
    expect(engine.getPlayerView(state, 'p1').hand[0].id).toBe(reservedId);
    conserved(state);
  });

  it('publishes bought faces to all seats, keeps reservations hidden, and marks legacy history incomplete', () => {
    let state: any = engine.createInitialState(26);
    const purchased = { ...state.market[1][0], cost: { white: 0, blue: 0, green: 0, red: 0, black: 0 } };
    state.market[1] = [purchased, ...state.market[1].slice(1)];
    state = engine.applyAction(state, 'p1', { type: 'buy', payload: { source: 'market', tier: 1, index: 0 } });
    expect(state.acquiredCards.p1[0]).toMatchObject({ id: purchased.id, points: purchased.points, bonus: purchased.bonus });
    expect((engine.getPlayerView(state, 'p3') as FourSplendorView).players.find(player => player.id === 'p1')?.acquiredCards[0].id).toBe(purchased.id);
    const hidden = state.market[2][0].id;
    state = engine.applyAction(state, 'p2', { type: 'reserve', payload: { tier: 2, index: 0 } });
    const publicView = engine.getPlayerView(state, 'p3') as FourSplendorView;
    expect(publicView.players.find(player => player.id === 'p2')?.count).toBe(1);
    expect(JSON.stringify(publicView)).not.toContain(hidden);

    const legacy: any = structuredClone(engine.createInitialState(27));
    delete legacy.acquiredCards; delete legacy.acquiredCardHistoryComplete;
    legacy.cardPoints.p1 = 6; legacy.bonuses.p1.white = 2;
    const legacyCard = { ...legacy.market[1][0], cost: { white: 0, blue: 0, green: 0, red: 0, black: 0 } };
    legacy.market[1] = [legacyCard, ...legacy.market[1].slice(1)];
    const upgraded = engine.applyAction(legacy, 'p1', { type: 'buy', payload: { source: 'market', tier: 1, index: 0 } });
    const legacyView = engine.getPlayerView(upgraded, 'p2') as FourSplendorView;
    const legacyPlayer = legacyView.players.find(player => player.id === 'p1')!;
    expect(legacyPlayer.acquiredCards.map(card => card.id)).toEqual([legacyCard.id]);
    expect(legacyPlayer.acquiredCardHistoryComplete).toBe(false);
    expect(legacyPlayer.cardPoints).toBe(6 + legacyCard.points);
  });

  it('allows choosing any legal token return plan and conserves the common supply', () => {
    let state: FourSplendorState = engine.createInitialState(17);
    state.hands.p1 = { white: 2, blue: 2, green: 2, red: 2, black: 2, gold: 0 };
    for (const g of colors) state.bank[g] -= state.hands.p1[g];
    const action = { type: 'take', payload: { gems: ['white', 'blue', 'green'], returnTokens: { red: 2, white: 1 } } };
    expect(engine.validateAction(state, 'p1', action)).toBeNull();
    state = apply(state, action); conserved(state);
    expect(state.hands.p1).toEqual({ white: 2, blue: 3, green: 3, red: 0, black: 2, gold: 0 });
  });

  it('awards an eligible noble after a non-purchase turn and holds a multiple-noble choice in the same turn', () => {
    let state: FourSplendorState = engine.createInitialState(17);
    state.bonuses.p1 = { white: 4, blue: 4, green: 4, red: 4, black: 4 };
    state.availableNobles = { a: { points: 3, requirement: { white: 3 } }, b: { points: 3, requirement: { blue: 3 } } };
    state = apply(state, { type: 'reserve', payload: { tier: 1 } });
    expect(state.active).toBe('p1'); expect(state.turns.p1).toBe(0);
    expect(state.pendingNobles).toEqual(['a', 'b']);
    state = apply(state, { type: 'chooseNoble', payload: { id: 'a' } });
    expect(state.active).toBe('p2'); expect(state.turns.p1).toBe(1); expect(state.nobles.p1).toBe(3);
    for (const p of ['p2', 'p3', 'p4'] as FourSeat[]) state = apply(state, engine.getPlayerView(state, p).actions[0].action);
    state = apply(state, { type: 'reserve', payload: { tier: 1 } });
    expect(state.nobles.p1).toBe(6);
  });

  it('finishes only after equal four-seat turn counts and uses team points then combined card count', () => {
    let state: FourSplendorState = engine.createInitialState(17);
    state.cardPoints.p1 = 29;
    state.cardPoints.p2 = 30;
    state = apply(state, { type: 'reserve', payload: { tier: 1 } });
    expect(state.pendingEnd).toBe(true); expect(state.result).toBeNull();
    for (const p of ['p2', 'p3', 'p4'] as FourSeat[]) {
      state = apply(state, engine.getPlayerView(state, p).actions[0].action);
      if (p !== 'p4') expect(state.result).toBeNull();
    }
    expect(state.result?.winner).toBe('B');
    expect(state.result?.scores).toEqual({ A: 29, B: 30 });
    expect(engine.getPlayerView(state, 'p1').actions).toEqual([]);
    expect(engine.validateAction(state, 'p1', { type: 'reserve', payload: { tier: 1 } })).toBe('Game is finished');
  });

  it('breaks tied team scores by combined purchased-card counts, then allows a draw', () => {
    const initial = (): FourSplendorState => {
      const state: FourSplendorState = engine.createInitialState(17);
      state.active = 'p4'; state.turns = { p1: 1, p2: 1, p3: 1, p4: 0 }; state.pendingEnd = true;
      state.cardPoints.p1 = 30; state.cardPoints.p2 = 30;
      state.bonuses.p1.blue = 1; state.bonuses.p2.blue = 2;
      return state;
    };
    expect(apply(initial(), { type: 'reserve', payload: { tier: 1 } }).result?.winner).toBe('A');
    const equal = initial(); equal.bonuses.p1.blue = 2;
    expect(apply(equal, { type: 'reserve', payload: { tier: 1 } }).result?.winner).toBe('draw');
  });

  it('plays complete legal AI matches without reading the state or mutating public views', () => {
    for (const seed of [7, 91, 305]) {
      let state: FourSplendorState = engine.createInitialState(seed);
      const random = seededRandom(seed);
      for (let step = 0; step < 1200 && !state.result; step++) {
        const view = engine.getPlayerView(state, state.active), before = structuredClone(view);
        const action = engine.chooseAiAction(view, state.active, random);
        expect(view).toEqual(before);
        expect(action, `seed ${seed} step ${step}`).toBeTruthy();
        expect(engine.validateAction(state, state.active, action!)).toBeNull();
        state = apply(state, action!); conserved(state);
      }
      expect(state.result, `seed ${seed} must finish`).toBeTruthy();
      expect(new Set(Object.values(state.turns)).size).toBe(1);
    }
    expect(engine.chooseAiAction({ actions: [], result: null } as unknown as FourView, 'p1')).toBeNull();
  }, 60000);
});

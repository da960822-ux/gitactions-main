import { describe, it, expect } from 'vitest';
import { marbleBuildCost, marbleEngine, MarbleEventId, MarbleState } from './marble';
import { seededRandom } from '../core/types';

const increment = 0x6d2b79f5;
function seedForDice(test: (a: number, b: number) => boolean) {
  for (let seed = 0; seed < 10000; seed++) {
    const r = seededRandom(seed), a = 1 + Math.floor(r() * 6), b = 1 + Math.floor(r() * 6);
    if (test(a, b)) return seed;
  }
  throw new Error('seed not found');
}
const seedForSum = (sum: number) => seedForDice((a, b) => a + b === sum);
const seedForDoubles = () => seedForDice((a, b) => a === b);
const seedForMiss = () => seedForDice((a, b) => a !== b);
// Regression fixtures for saved forty-space rooms before the personalized route.
const initial = (seed = 15): MarbleState => ({ ...marbleEngine.createInitialState(seed), economicVersion: 2, money: { p1: 1500, p2: 1500 }, cityRouteVersion: undefined, propertyRulesVersion: undefined, constructionRulesVersion: undefined });
function eventState(id: MarbleEventId, target = 2): MarbleState {
  const seed = seedForSum(target);
  return { ...initial(seed), eventDeck: [id], positions: { p1: 0, p2: 0 } };
}
const act = (s: MarbleState, type: string, payload?: Record<string, unknown>) => marbleEngine.applyAction(s, 'p1', { type, payload });

describe('Marble 40-space house-rule engine', () => {
  it('keeps 24 cities and all economics while ordering the new journey and preserving saved boards', () => {
    const fresh = marbleEngine.createInitialState(15);
    const tiles = marbleEngine.getPlayerView(fresh, 'p1').board.tiles;
    const saved = marbleEngine.getPlayerView(initial(15), 'p1').board.tiles;
    expect(fresh.boardVersion).toBe(2);
    expect(fresh.cityRouteVersion).toBe(3);
    expect(tiles).toHaveLength(40);
    expect(tiles.filter((tile: any) => tile.kind === 'property')).toHaveLength(24);
    expect([1, 3, 15, 31, 38].map(i => tiles[i].name.ko)).toEqual(['광주', '뉴욕', '산토도밍고', '뉴어크', '서울']);
    const savedV2 = marbleEngine.getPlayerView({ ...fresh, cityRouteVersion: 2 }, 'p1').board.tiles;
    const changes = [[11, '베를린', '라베가'], [13, '마이애미', '푼타카나'], [21, '이스탄불', '사마나'], [32, '아그라', '발파라이소'], [33, '아테네', '세부'], [36, '시드니', '오클랜드']] as const;
    for (const [index, name, previousName] of changes) {
      expect(tiles[index].name.ko).toBe(name);
      expect(savedV2[index].name.ko).toBe(previousName);
    }
    for (const [index, tile] of tiles.entries()) {
      const { name, ...values } = tile;
      const { name: previousName, ...previousValues } = savedV2[index];
      expect(values).toEqual(previousValues);
      if (!changes.some(([changed]) => changed === index)) expect(name).toEqual(previousName);
    }
    const economy = (board: any[]) => board.map(tile => `${tile.kind}:${tile.price}:${tile.rent}:${tile.group}`).sort();
    expect(economy(tiles)).toEqual(economy(savedV2));
    expect(tiles[3]).toMatchObject({ price: savedV2[3].price, rent: savedV2[3].rent, group: savedV2[3].group });
    expect(tiles[15]).toMatchObject({ price: savedV2[15].price, rent: savedV2[15].rent, group: savedV2[15].group });
    expect(fresh).toMatchObject({ economicVersion: 3, money: { p1: 3000, p2: 3000 } });
    expect(tiles[1]).toMatchObject({ price: 80, rent: 20 });
    expect(saved[1]).toMatchObject({ price: 100, rent: 12 });
    expect(saved[3].name.ko).toBe('산토도밍고');
    expect(saved[15].name.ko).toBe('뉴욕');
    expect(saved[31].name.ko).toBe('마이애미');
    expect(saved[38].name.ko).toBe('밴쿠버');
    for (const index of [0, 2, 6, 7, 10, 12, 14, 18, 20, 23, 26, 27, 30, 34, 37, 39]) expect(tiles[index]).toEqual(savedV2[index]);
  });

  it('resolves the Santo Domingo card at the correct city in new, saved forty-space and legacy rooms', () => {
    const fresh = { ...marbleEngine.createInitialState(seedForSum(2)), economicVersion: 2 as const, money: { p1: 1500, p2: 1500 }, eventDeck: ['visit-santo-domingo'] as MarbleEventId[] };
    for (const [state, destination] of [[fresh, 15], [{ ...fresh, cityRouteVersion: undefined }, 3], [{ ...fresh, boardVersion: undefined }, 2]] as const) {
      const moved = act(state, 'roll');
      expect(moved.positions.p1).toBe(destination);
      expect(moved.phase).toBe('decision');
      expect(moved.money.p1).toBe(1500);
      expect(marbleEngine.getPlayerView(moved, 'p1').board.tiles[destination]).toMatchObject({ name: { ko: '산토도밍고' }, price: 120, rent: 15 });
    }
  });
  it('creates the classic-size adapted map and hides deck/RNG state from both views', () => {
    const a = initial(15), b = initial(15);
    expect(a.eventDeck).toEqual(b.eventDeck);
    expect(a.eventDeck).toHaveLength(16);
    expect(a.economicVersion).toBe(2);
    const view = marbleEngine.getPlayerView(a, 'p1');
    expect(view.board.tiles).toHaveLength(40);
    expect(view.board.tiles[1]).toMatchObject({ name: { ko: '광주', es: 'Gwangju' } });
    expect(view.board.tiles[3]).toMatchObject({ name: { ko: '산토도밍고', es: 'Santo Domingo' } });
    expect(view.board.tiles[10].kind).toBe('island');
    expect(view.board.tiles[20].kind).toBe('fund');
    expect(view.board.tiles[30].kind).toBe('train');
    expect(view.board.tiles[37].kind).toBe('fund-deposit');
    expect([2, 7, 12, 18, 27, 34].every(i => view.board.tiles[i].kind === 'event')).toBe(true);
    expect(JSON.stringify(view)).not.toMatch(/rng|eventDeck|eventRng/);
    expect(JSON.stringify(marbleEngine.getPlayerView(a, 'p2'))).not.toMatch(/rng|eventDeck|eventRng/);
  });

  it('retains the 18-space board and original eight-card deck for saved states without boardVersion', () => {
    const modern = initial(), legacy = { ...modern, boardVersion: undefined, eventDeck: undefined, eventRng: undefined } as MarbleState;
    expect(marbleEngine.getPlayerView(legacy, 'p1').board.tiles).toHaveLength(18);
    expect(legacy.boardVersion).toBeUndefined();
    const e = { ...legacy, positions: { p1: 7, p2: 0 }, eventDeck: ['festival'] as MarbleEventId[], rng: seedForSum(8) };
    const moved = act(e, 'roll');
    expect(moved.eventDeck).toHaveLength(0);
    expect(marbleEngine.getPlayerView(moved, 'p1').board.tiles).toHaveLength(18);
  });

  it('advances the two-die random stream by exactly two draws', () => {
    const seed = 18, expectedRandom = seededRandom(seed); let s = initial(seed);
    for (let i = 0; i < 4; i++) {
      const expected = [1 + Math.floor(expectedRandom() * 6), 1 + Math.floor(expectedRandom() * 6)];
      s = marbleEngine.applyAction({ ...s, active: 'p1', phase: 'roll', result: null }, 'p1', { type: 'roll' });
      expect(s.lastRoll).toEqual(expected);
      expect(s.rng).toBe((seed + (i + 1) * 2 * increment) >>> 0);
      expect(s.diceSequence).toBe(i + 1);
    }
  });

  it('applies all 12 cards, reveals effects, does not chain event landings, and keeps event actions out of the roll phase', () => {
    const cases: Array<{ id: MarbleEventId; money?: number; position?: number; phase?: MarbleState['phase']; pass?: number; island?: number; fare?: number | null }> = [
      { id: 'festival', money: 1650 }, { id: 'lottery', money: 1700 }, { id: 'rent-rebate', money: 1580 },
      { id: 'travel-cost', money: 1400 }, { id: 'maintenance', money: 1500 },
      { id: 'visit-santo-domingo', money: 1500, position: 3, phase: 'decision' },
      { id: 'advance-start', money: 1700, position: 0 }, { id: 'retreat', money: 1500, position: 39 },
      { id: 'go-to-island', money: 1500, position: 10, island: 3 }, { id: 'escape-pass', money: 1500, pass: 1 },
      { id: 'train-ticket', money: 1500, phase: 'train-decision', fare: 0 }, { id: 'city-dividend', money: 1500 },
    ];
    for (const c of cases) {
      const s = eventState(c.id), moved = act(s, 'roll');
      expect(moved.lastEvent).toMatchObject({ id: c.id, sequence: 1, playerId: 'p1' });
      expect(moved.money.p1).toBe(c.money);
      expect(moved.positions.p1).toBe(c.position ?? 2);
      expect(moved.phase).toBe(c.phase ?? 'main');
      if (c.island) expect(moved.islandTurns?.p1).toBe(c.island);
      if (c.pass) expect(moved.escapePasses?.p1).toBe(c.pass);
      if (c.fare !== undefined) expect(moved.pendingTrainFare).toBe(c.fare);
      expect(marbleEngine.validateAction(moved, 'p1', { type: 'roll' })).toBe('Cannot roll now');
    }
    const eventAtSanto = act({ ...eventState('visit-santo-domingo'), eventDeck: ['visit-santo-domingo'], properties: { '3': { owner: 'p2', houses: 1 } } }, 'roll');
    expect(eventAtSanto.money).toEqual({ p1: 1470, p2: 1530 });
    expect(eventAtSanto.lastEvent?.sequence).toBe(1);
  });

  it('cycles through all twelve cards before repeating and keeps the public sequence increasing', () => {
    const ids: MarbleEventId[] = ['festival', 'lottery', 'rent-rebate', 'travel-cost', 'maintenance', 'visit-santo-domingo', 'advance-start', 'retreat', 'go-to-island', 'escape-pass', 'train-ticket', 'city-dividend', 'monopoly-warning'];
    let s = { ...initial(70), eventDeck: ids } as MarbleState;
    for (let i = 0; i < 13; i++) {
      s = { ...s, phase: 'roll', positions: { ...s.positions, p1: 0 }, rng: seedForSum(2), islandTurns: { p1: 0, p2: 0 }, pendingTrainFare: null };
      s = act(s, 'roll');
      expect(s.lastEvent!.sequence).toBe(i + 1);
    }
    expect(s.eventDeck).toHaveLength(12); // The escape-pass card is held out until used.
  });

  it('sends island arrivals to a three-turn hold and supports failed doubles, paying, and escape passes', () => {
    const sent = act({ ...eventState('go-to-island'), eventDeck: ['go-to-island'] }, 'roll');
    expect(sent.positions.p1).toBe(10); expect(sent.islandTurns?.p1).toBe(3);
    const missedSeed = seedForMiss();
    let s: MarbleState = { ...sent, active: 'p1', phase: 'island' };
    for (const remaining of [2, 1, 0]) {
      s = marbleEngine.applyAction({ ...s, active: 'p1', phase: 'island', islandTurns: { p1: remaining + 1, p2: 0 }, rng: missedSeed }, 'p1', { type: 'attempt-doubles' });
      expect(s.islandTurns?.p1).toBe(remaining);
      expect(s.active).toBe('p2');
    }
    const paid = act({ ...sent, phase: 'island' }, 'pay-escape');
    expect(paid.money.p1).toBe(1400); expect(paid.phase).toBe('roll'); expect(paid.islandTurns?.p1).toBe(0);
    const passed = act({ ...sent, phase: 'island', escapePasses: { p1: 1, p2: 0 } }, 'use-escape-pass');
    expect(passed.escapePasses?.p1).toBe(0); expect(passed.phase).toBe('roll');
    expect(marbleEngine.validateAction({ ...sent, phase: 'island' }, 'p1', { type: 'use-escape-pass' })).toBe('No escape pass');
  });

  it('releases island doubles and moves using the true roll, but failed attempts consume a turn', () => {
    const seed = seedForDoubles(), start = { ...initial(seed), phase: 'island' as const, positions: { p1: 10, p2: 0 }, islandTurns: { p1: 3, p2: 0 } };
    const escaped = act(start, 'attempt-doubles');
    expect(escaped.lastRoll[0]).toBe(escaped.lastRoll[1]);
    expect(escaped.diceSequence).toBe(1);
    expect(escaped.positions.p1).toBe(10 + escaped.lastRoll[0] + escaped.lastRoll[1]);
    expect(escaped.islandTurns?.p1).toBe(0);
    expect(escaped.lastMove).toMatchObject({ source: 'island', from: 10, steps: escaped.lastRoll[0] + escaped.lastRoll[1] });
    const miss = act({ ...start, rng: seedForMiss() }, 'attempt-doubles');
    expect(miss.active).toBe('p2'); expect(miss.islandTurns?.p1).toBe(2); expect(miss.phase).toBe('roll'); expect(miss.diceSequence).toBe(1);
  });

  it('offers train on the next own turn, validates destination and fare, and teleports without false dice movement', () => {
    const seed = seedForSum(4);
    let s = marbleEngine.applyAction({ ...initial(seed), positions: { p1: 10, p2: 0 } }, 'p1', { type: 'roll' });
    expect(s.positions.p1).toBe(14); expect(s.trainReady?.p1).toBe(true);
    s = marbleEngine.applyAction(s, 'p1', { type: 'endTurn' });
    s = { ...s, active: 'p1', phase: 'train-decision' as const, pendingTrainFare: 100, pendingTrainSource: 'station' };
    expect(marbleEngine.validateAction(s, 'p1', { type: 'choose-train', payload: { destination: 10 } })).toBe('Invalid destination');
    expect(marbleEngine.validateAction({ ...s, money: { p1: 50, p2: 1500 } }, 'p1', { type: 'choose-train', payload: { destination: 1 } })).toBe('Insufficient funds');
    const traveled = act(s, 'choose-train', { destination: 1 });
    expect(traveled.positions.p1).toBe(1); expect(traveled.money.p1).toBe(1600);
    expect(traveled.actionLog?.find(event => event.type === 'train' && event.from === 14)).toMatchObject({ amount: 100, fromAccount: 'p1', toAccount: 'bank', moneyDelta: { p1: -100 } });
    expect(traveled.lastMove).toMatchObject({ source: 'train', from: 14, to: 1, steps: 27 });
    expect(traveled.lastRoll).toEqual(s.lastRoll);
    expect(traveled.diceSequence).toBe(s.diceSequence);
    expect(traveled.phase).toBe('decision');
    const skipped = act(s, 'skip-train'); expect(skipped.phase).toBe('roll'); expect(skipped.trainReady?.p1).toBe(false);
  });

  it('deposits to and collects the shared social fund, including insolvency on deposit', () => {
    const depositSeed = seedForSum(7);
    const deposit = marbleEngine.applyAction({ ...initial(depositSeed), positions: { p1: 30, p2: 0 }, money: { p1: 200, p2: 1500 }, fundPool: 10 }, 'p1', { type: 'roll' });
    expect(deposit.positions.p1).toBe(37); expect(deposit.money.p1).toBe(50); expect(deposit.fundPool).toBe(160);
    expect(deposit.actionLog?.at(-1)).toMatchObject({ fromAccount: 'p1', toAccount: 'fund', amount: 150 });
    const collectSeed = seedForSum(3);
    const collected = marbleEngine.applyAction({ ...initial(collectSeed), positions: { p1: 17, p2: 0 }, fundPool: 160 }, 'p1', { type: 'roll' });
    expect(collected.positions.p1).toBe(20); expect(collected.money.p1).toBe(1660); expect(collected.fundPool).toBe(0);
    expect(collected.actionLog?.find(event => event.type === 'bonus')).toMatchObject({ fromAccount: 'fund', toAccount: 'p1', amount: 160 });
    const insolvent = marbleEngine.applyAction({ ...initial(depositSeed), positions: { p1: 30, p2: 0 }, money: { p1: 149, p2: 1500 } }, 'p1', { type: 'roll' });
    expect(insolvent).toMatchObject({ phase: 'debt', active: 'p1', pendingPayment: { amount: 150, creditor: 'fund' }, result: null });
    expect(insolvent.actionLog?.at(-1)).toMatchObject({ type: 'crisis', fromAccount: 'p1', toAccount: 'fund' });
    const legacyInsolvent = marbleEngine.applyAction({ ...initial(depositSeed), economicVersion: undefined, positions: { p1: 30, p2: 0 }, money: { p1: 149, p2: 1500 } }, 'p1', { type: 'roll' });
    expect(legacyInsolvent.result?.winner).toBe('p2');
  });

  it('makes event train tickets free and exposes only destination actions, not the event deck', () => {
    let s = act(eventState('train-ticket'), 'roll');
    const view = marbleEngine.getPlayerView(s, 'p1');
    expect(view.actions.some((item: any) => item.action.type === 'choose-train' && item.action.payload.destination === 1)).toBe(true);
    expect(s.pendingTrainSource).toBe('card');
    s = act(s, 'choose-train', { destination: 3 });
    expect(s.money.p1).toBe(1500); expect(s.positions.p1).toBe(3); expect(s.phase).toBe('decision');
    expect(s.actionLog?.find(event => event.type === 'train' && event.from === 2)).toMatchObject({ amount: 0, fromAccount: 'p1', toAccount: 'bank', moneyDelta: { p1: -0 } });
    expect(s.lastMove).toMatchObject({ source: 'train', steps: 1 });
    const skipped = act(act(eventState('train-ticket'), 'roll'), 'skip-train');
    expect(skipped.phase).toBe('main');
    expect(marbleEngine.validateAction(skipped, 'p1', { type: 'roll' })).toBe('Cannot roll now');
    expect(JSON.stringify(view)).not.toMatch(/eventDeck|eventRng|rng/);
  });

  it('preserves property buy/rent/build rules and clones mutable public data', () => {
    const seed = seedForSum(3), unowned = marbleEngine.applyAction(initial(seed), 'p1', { type: 'roll' });
    expect(unowned.phase).toBe('decision');
    const purchased = act(unowned, 'buy'); expect(purchased.properties['3']).toEqual({ owner: 'p1', houses: 0 });
    const rentState = { ...initial(seed), properties: { '3': { owner: 'p2' as const, houses: 1 } }, money: { p1: 100, p2: 1500 } };
    const rented = marbleEngine.applyAction(rentState, 'p1', { type: 'roll' });
    expect(rented.money).toEqual({ p1: 70, p2: 1530 });
    const ready = { ...initial(), phase: 'main' as const, properties: { '1': { owner: 'p1' as const, houses: 0 }, '3': { owner: 'p1' as const, houses: 0 } }, money: { p1: 1000, p2: 1500 } };
    expect(marbleEngine.validateAction(ready, 'p1', { type: 'build', payload: { tile: 1 } })).toBeNull();
    const view = marbleEngine.getPlayerView({ ...purchased, lastEvent: { id: 'festival', sequence: 1, playerId: 'p1', ...({ title: { ko: 'x', es: 'x' }, text: { ko: 'x', es: 'x' }, effect: 'cash' as const }), cashDelta: 1, from: null, to: null, steps: null } }, 'p2');
    view.board.tiles[1].name.ko = 'mutated'; view.board.lastEvent!.title.ko = 'mutated';
    expect(purchased.boardVersion).toBe(2);
  });

  it('allows three upgrades in saved rooms and scales rent x1/x2/x4/x8', () => {
    let s: MarbleState = { ...initial(), phase: 'main', properties: { '1': { owner: 'p1', houses: 0 } }, money: { p1: 1000, p2: 1500 } };
    for (const tier of [1, 2, 3]) {
      expect(marbleEngine.validateAction(s, 'p1', { type: 'build', payload: { tile: 1 } })).toBeNull();
      s = marbleEngine.applyAction(s, 'p1', { type: 'build', payload: { tile: 1 } });
      expect(s.properties['1'].houses).toBe(tier);
    }
    expect(marbleEngine.validateAction(s, 'p1', { type: 'build', payload: { tile: 1 } })).toBe('Cannot build here');
    for (const [tier, multiplier] of [1, 2, 4, 8].entries()) {
      const start: MarbleState = { ...initial(seedForSum(2)), positions: { p1: 39, p2: 0 }, money: { p1: 1000, p2: 1000 }, properties: { '1': { owner: 'p2', houses: tier } } };
      const landed = marbleEngine.applyAction(start, 'p1', { type: 'roll' });
      expect(landed.money.p1).toBe(1000 + 200 - 12 * multiplier);
    }
  });

  it('prices new-room upgrades by city value, publishes projections, and preserves flat saved-room costs', () => {
    expect(marbleBuildCost({ kind: 'property', name: { ko: '테스트', es: 'Prueba' }, price: 100 }, 0, 2)).toBe(40);
    expect(marbleBuildCost({ kind: 'property', name: { ko: '테스트', es: 'Prueba' }, price: 100 }, 1, 2)).toBe(60);
    expect(marbleBuildCost({ kind: 'property', name: { ko: '테스트', es: 'Prueba' }, price: 560 }, 2, 2)).toBe(450);
    expect(marbleBuildCost({ kind: 'property', name: { ko: '테스트', es: 'Prueba' }, price: 100 }, 0, 1)).toBe(100);

    const ready: MarbleState = { ...initial(), phase: 'main', properties: { '1': { owner: 'p1', houses: 0 } }, money: { p1: 1000, p2: 1500 } };
    const view = marbleEngine.getPlayerView(ready, 'p1');
    expect(view.board.tiles[1]).toMatchObject({ nextBuildCost: 40, nextRent: 24 });
    expect(view.actions.find((item: any) => item.action.type === 'build')?.label.ko).toContain('(40)');
    const built = act(ready, 'build', { tile: 1 });
    expect(built.money.p1).toBe(960);
    expect(built.actionLog?.at(-1)).toMatchObject({ type: 'build', amount: 40, fromAccount: 'p1', toAccount: 'bank', moneyDelta: { p1: -40 } });
    expect(marbleEngine.getPlayerView(built, 'p1').board.assets.p1).toBe(1100);

    const savedRules = { ...ready, economicVersion: 1 as const };
    expect(marbleEngine.getPlayerView(savedRules, 'p1').board.tiles[1]).toMatchObject({ nextBuildCost: 100, nextRent: 24 });
    expect(marbleEngine.getPlayerView(savedRules, 'p1').actions.find((item: any) => item.action.type === 'build')?.label.ko).toContain('(100)');
    expect(act(savedRules, 'build', { tile: 1 }).money.p1).toBe(900);
  });

  it('rejects wrong player, wrong phase, invalid target, and malformed actions', () => {
    const s = initial();
    expect(marbleEngine.validateAction(s, 'p2', { type: 'roll' })).toBe('Not your turn');
    expect(marbleEngine.validateAction(s, 'p1', null as any)).toBe('Invalid action');
    expect(marbleEngine.validateAction(s, 'p3' as any, { type: 'roll' })).toBe('Invalid player');
    expect(marbleEngine.validateAction(s, 'p1', { type: 'attempt-doubles' })).toBe('Not on the island');
    expect(marbleEngine.validateAction({ ...s, phase: 'train-decision' }, 'p1', { type: 'choose-train', payload: { destination: 10 } })).toBe('Invalid destination');
  });

  it('uses total assets at 120 turns, including unspent building value, and preserves a draw', () => {
    const s = { ...initial(3), economicVersion: 1 as const };
    const winner = marbleEngine.applyAction({ ...s, phase: 'main', turns: 119, money: { p1: 100, p2: 250 }, properties: { '1': { owner: 'p1', houses: 1 } } }, 'p1', { type: 'endTurn' });
    expect(winner.result).toMatchObject({ winner: 'p1', scores: { p1: 300, p2: 250 }, reason: 'asset turn limit / límite por patrimonio' });
    const draw = marbleEngine.applyAction({ ...s, phase: 'main', turns: 119 }, 'p1', { type: 'endTurn' });
    expect(draw.result).toMatchObject({ winner: 'draw', scores: { p1: 1500, p2: 1500 } });
  });

  it('keeps the fixed loan at 300 cash / 330 debt and subtracts debt from assets until repaid', () => {
    const start = initial();
    expect(marbleEngine.validateAction(start, 'p1', { type: 'borrow', payload: { amount: 301 } })).toBe('Loan amount is fixed');
    const borrowed = act(start, 'borrow');
    expect(borrowed.money.p1).toBe(1800);
    expect(borrowed.debt).toEqual({ p1: 330, p2: 0 });
    expect(marbleEngine.getPlayerView(borrowed, 'p1').board.assets.p1).toBe(1470);
    expect(marbleEngine.validateAction(borrowed, 'p1', { type: 'borrow' })).toBe('Repay the existing loan first');
    const repaid = marbleEngine.applyAction(borrowed, 'p1', { type: 'repay' });
    expect(repaid.money.p1).toBe(1470);
    expect(repaid.debt?.p1).toBe(0);
    const again = marbleEngine.applyAction(repaid, 'p1', { type: 'borrow' });
    expect(again.money.p1).toBe(1770);
    expect(again.debt?.p1).toBe(330);
  });

  it('treats Sali and Suli as one additional skin with one position and the existing turn', () => {
    const start = initial();
    const chosen = marbleEngine.applyAction(start, 'p1', { type: 'choose-pawn', payload: { pawn: 'sali-suli' } });
    expect(chosen.pawns?.p1).toBe('sali-suli');
    expect(chosen.positions).toEqual(start.positions);
    expect(chosen.money).toEqual(start.money);
    expect(chosen.active).toBe(start.active);
    expect(chosen.phase).toBe(start.phase);
    expect(chosen.turns).toBe(start.turns);
    expect(marbleEngine.getPlayerView(chosen, 'p1').board.pawns.p1).toBe('sali-suli');
    expect(marbleEngine.validateAction({ ...chosen, active: 'p2' }, 'p2', { type: 'choose-pawn', payload: { pawn: 'sali-suli' } })).toBe('Invalid or occupied figure');
  });

  it('offers seven unique pawns, rejects occupied choices, and locks a pawn after the first roll', () => {
    const start = initial();
    const view = marbleEngine.getPlayerView(start, 'p1');
    expect(view.actions.filter((item: any) => item.action.type === 'choose-pawn')).toHaveLength(6);
    expect(marbleEngine.validateAction(start, 'p1', { type: 'choose-pawn', payload: { pawn: 'cat' } })).toBe('Invalid or occupied figure');
    const chosen = marbleEngine.applyAction(start, 'p1', { type: 'choose-pawn', payload: { pawn: 'dragon' } });
    expect(chosen.pawns?.p1).toBe('dragon');
    expect(marbleEngine.validateAction({ ...chosen, active: 'p2' }, 'p2', { type: 'choose-pawn', payload: { pawn: 'dragon' } })).toBe('Invalid or occupied figure');
    const rolled = marbleEngine.applyAction(chosen, 'p1', { type: 'roll' });
    expect(rolled.pawnLocked?.p1).toBe(true);
    expect(marbleEngine.validateAction({ ...rolled, phase: 'roll' }, 'p1', { type: 'choose-pawn', payload: { pawn: 'fox' } })).toBe('Figure is locked after your first roll');
    expect(marbleEngine.validateAction(start, 'p1', { type: 'choose-pawn', payload: { pawn: 'unicorn' } })).toBe('Invalid or occupied figure');
  });

  it('settles emergency rent to its property owner once and resumes the same player', () => {
    const s = { ...initial(seedForSum(3)), money: { p1: 5, p2: 1500 }, properties: { '3': { owner: 'p2' as const, houses: 0 } } };
    const crisis = marbleEngine.applyAction(s, 'p1', { type: 'roll' });
    expect(crisis).toMatchObject({ phase: 'debt', active: 'p1', pendingPayment: { amount: 15, creditor: 'p2', type: 'rent', tile: 3, resumeActive: 'p1' } });
    const settled = marbleEngine.applyAction(crisis, 'p1', { type: 'borrow' });
    expect(settled).toMatchObject({ phase: 'main', active: 'p1', pendingPayment: null, money: { p1: 290, p2: 1515 }, debt: { p1: 330, p2: 0 } });
    expect(settled.actionLog?.filter(event => event.type === 'rent')).toHaveLength(1);
    expect(settled.actionLog?.find(event => event.type === 'rent')).toMatchObject({ fromPlayer: 'p1', toPlayer: 'p2', amount: 15 });
  });

  it('rejects a loan that cannot cover a maintenance crisis and lets the debtor declare bankruptcy', () => {
    const state = {
      ...eventState('maintenance'), money: { p1: 0, p2: 1500 },
      properties: { '1': { owner: 'p1' as const, houses: 4 }, '3': { owner: 'p1' as const, houses: 4 }, '4': { owner: 'p1' as const, houses: 4 } },
    };
    const crisis = act(state, 'roll');
    expect(crisis).toMatchObject({ phase: 'debt', active: 'p1', pendingPayment: { amount: 480, creditor: 'bank', type: 'tax', resumeActive: 'p1' } });
    expect(marbleEngine.validateAction(crisis, 'p1', { type: 'borrow' })).toBe('Loan cannot cover this payment');
    expect(marbleEngine.getPlayerView(crisis, 'p1').actions.some((item: any) => item.action.type === 'borrow')).toBe(false);
    expect(crisis.eventSequence).toBe(1);
    expect(crisis.actionLog?.filter(event => event.type === 'event-card' && event.cardId === 'maintenance')).toHaveLength(1);
    const ended = marbleEngine.applyAction(crisis, 'p1', { type: 'declare-bankruptcy' });
    expect(ended.result?.winner).toBe('p2');
    expect(ended.pendingPayment).toBeNull();
    expect(ended.eventSequence).toBe(1);
  });

  it('charges the monopoly-warning target with the most completed groups, capped at 300', () => {
    const s = {
      ...eventState('monopoly-warning'),
      properties: {
        '1': { owner: 'p2' as const, houses: 0 }, '3': { owner: 'p2' as const, houses: 0 },
        '4': { owner: 'p2' as const, houses: 0 }, '5': { owner: 'p2' as const, houses: 0 },
        '8': { owner: 'p2' as const, houses: 0 }, '9': { owner: 'p2' as const, houses: 0 },
        '11': { owner: 'p2' as const, houses: 0 }, '13': { owner: 'p2' as const, houses: 0 },
        '15': { owner: 'p1' as const, houses: 0 }, '16': { owner: 'p1' as const, houses: 0 },
      },
    };
    const warned = act(s, 'roll');
    expect(warned.phase).toBe('main');
    expect(warned.money.p2).toBe(1200);
    expect(warned.money.p1).toBe(1500);
    expect(warned.lastEvent).toMatchObject({ id: 'monopoly-warning', playerId: 'p1', sequence: 1 });
    const assessment = warned.actionLog?.find(event => event.type === 'monopoly-warning' && event.cardId === 'monopoly-warning');
    expect(assessment).toMatchObject({ actor: 'p2', amount: 300, fromAccount: 'p2', toAccount: 'bank' });
    expect(assessment?.moneyDelta).toBeUndefined();
    expect(warned.actionLog?.filter(event => event.type === 'monopoly-warning').at(-1)).toMatchObject({ actor: 'p2', amount: 300, fromAccount: 'p2', toAccount: 'bank', moneyDelta: { p2: -300 } });
  });

  it('uses the drawer as the tie-breaker when completed-group counts match', () => {
    const s = {
      ...eventState('monopoly-warning'),
      properties: {
        '1': { owner: 'p1' as const, houses: 0 }, '3': { owner: 'p1' as const, houses: 0 },
        '4': { owner: 'p2' as const, houses: 0 }, '5': { owner: 'p2' as const, houses: 0 },
      },
    };
    const warned = act(s, 'roll');
    expect(warned.money).toEqual({ p1: 1400, p2: 1500 });
    expect(warned.lastEvent?.playerId).toBe('p1');
    expect(warned.actionLog?.filter(event => event.type === 'monopoly-warning').at(-1)).toMatchObject({ actor: 'p1', amount: 100 });
  });

  it('does not charge a monopoly warning when neither player completed a group', () => {
    const warned = act(eventState('monopoly-warning'), 'roll');
    expect(warned.money).toEqual({ p1: 1500, p2: 1500 });
    expect(warned.phase).toBe('main');
    expect(warned.lastEvent?.text.ko).toContain('부담금이 없습니다');
    expect(warned.actionLog?.some(event => event.type === 'monopoly-warning' && event.amount)).toBe(false);
  });

  it('lets the non-drawer borrow for a monopoly warning, then resumes the drawer without replaying the card', () => {
    const s = {
      ...eventState('monopoly-warning'),
      money: { p1: 1500, p2: 100 },
      properties: {
        '1': { owner: 'p2' as const, houses: 0 }, '3': { owner: 'p2' as const, houses: 0 },
        '4': { owner: 'p2' as const, houses: 0 }, '5': { owner: 'p2' as const, houses: 0 },
      },
    };
    const crisis = act(s, 'roll');
    expect(crisis.phase).toBe('debt');
    expect(crisis.active).toBe('p2');
    expect(crisis.pendingPayment).toMatchObject({ amount: 200, creditor: 'bank', type: 'monopoly-warning', resumePhase: 'main', resumeActive: 'p1' });
    expect(crisis.lastEvent).toMatchObject({ id: 'monopoly-warning', playerId: 'p1', sequence: 1 });
    expect(marbleEngine.validateAction(crisis, 'p1', { type: 'borrow' })).toBe('Not your turn');
    expect(marbleEngine.validateAction(crisis, 'p2', { type: 'roll' })).toBe('Resolve the compulsory payment first');

    const resumed = marbleEngine.applyAction(crisis, 'p2', { type: 'borrow' });
    expect(resumed.phase).toBe('main');
    expect(resumed.active).toBe('p1');
    expect(resumed.pendingPayment).toBeNull();
    expect(resumed.money.p2).toBe(200);
    expect(resumed.debt?.p2).toBe(330);
    expect(resumed.eventSequence).toBe(1);
    expect(resumed.actionLog?.filter(event => event.type === 'event-card' && event.cardId === 'monopoly-warning')).toHaveLength(1);
    expect(resumed.actionLog?.filter(event => event.type === 'monopoly-warning' && event.cardId === 'monopoly-warning')).toHaveLength(1);
    expect(resumed.lastEvent?.playerId).toBe('p1');
  });

  it('keeps source state immutable and exposes only an ordered 40-entry public action history', () => {
    const source: MarbleState = { ...initial(), phase: 'main' };
    const before = JSON.stringify(source);
    let s = source;
    for (let i = 0; i < 45; i++) s = marbleEngine.applyAction({ ...s, phase: 'main' }, s.active, { type: 'endTurn' });
    expect(JSON.stringify(source)).toBe(before);
    const publicView = marbleEngine.getPlayerView(s, 'p2');
    expect(publicView.board.actionLog).toHaveLength(40);
    expect(publicView.board.actionLog.map((event: any) => event.sequence)).toEqual(Array.from({ length: 40 }, (_, i) => i + 6));
    expect(JSON.stringify(publicView)).not.toMatch(/"rng"|"eventDeck"|"eventRng"/);
  });
});


describe('strategic golden keys', () => {
  const properties: MarbleState['properties'] = { '1': { owner: 'p1', houses: 0 }, '3': { owner: 'p1', houses: 1 }, '4': { owner: 'p2', houses: 1 }, '5': { owner: 'p2', houses: 0 } };
  const draw = (id: MarbleEventId, extra: Partial<MarbleState> = {}) => act({ ...eventState(id), properties, ...extra }, 'roll');
  const choose = (s: MarbleState, tile: unknown) => act(s, 'choose-event-city', { tile });
  const land = (s: MarbleState, p: 'p1' | 'p2', tile: number) => marbleEngine.applyAction({ ...s, active: p, phase: 'roll', positions: { ...s.positions, [p]: (tile - 2 + 40) % 40 }, rng: seedForSum(2) }, p, { type: 'roll' });
  it('requires a legal owned target, rejects forged actions and reports empty selection clearly', () => {
    for (const [id, good, bad] of [['city-festival', 1, 4], ['blackout', 4, 1]] as const) {
      const state = draw(id); expect(state.phase).toBe('event-decision');
      for (const tile of [bad, -1, 99, '1', 2, 1.5]) expect(marbleEngine.validateAction(state, 'p1', { type: 'choose-event-city', payload: { tile } })).toBe('Invalid event city');
      expect(marbleEngine.validateAction(state, 'p2', { type: 'choose-event-city', payload: { tile: good } })).toBe('Not your turn');
      expect(marbleEngine.validateAction(state, 'p1', { type: 'endTurn' })).toBe('Choose an event city first');
      const after = choose(state, good); expect(after.phase).toBe('main'); expect(after.pendingEvent).toBeNull();
      expect(state.rentModifiers).toEqual({}); expect(after.properties).toEqual(properties);
      expect(after.money).toEqual(state.money);
      expect(marbleEngine.getPlayerView(after, 'p1').board.assets).toEqual(marbleEngine.getPlayerView(state, 'p1').board.assets);
      expect(after.lastEvent?.text.ko).toContain('착지 1회');
    }
    for (const id of ['city-festival', 'blackout'] as const) {
      const after = draw(id, { properties: {} }); expect(after.phase).toBe('main'); expect(after.lastEvent?.text.ko).toContain('선택 가능한 도시가 없어');
    }
  });
  it('affects only the selected city and consumes exactly one opposing landing', () => {
    const festival = choose(draw('city-festival'), 3);
    const elsewhere = land(festival, 'p2', 1); expect(elsewhere.money.p2).toBe(1688); expect(elsewhere.rentModifiers?.['3'].festival).toBeTruthy();
    const arrived = land(elsewhere, 'p2', 3); expect(arrived.money.p2).toBe(1628); expect(arrived.rentModifiers?.['3']).toBeUndefined();
    expect(land(arrived, 'p2', 3).money.p2).toBe(1598);
    expect(festival.rentModifiers?.['3'].festival).toBeTruthy();
    const blackout = choose(draw('blackout'), 4); expect(land(blackout, 'p1', 5).money.p1).toBe(1478);
    const half = land(blackout, 'p1', 4); expect(half.money.p1).toBe(1482); expect(half.rentModifiers?.['4']).toBeUndefined();
    expect(land(half, 'p1', 4).money.p1).toBe(1446);
  });
  it('combines different effects to base rent, replaces repeated effects and persists across turns', () => {
    const first = choose(draw('city-festival'), 3);
    const repeated = choose(draw('city-festival', { rentModifiers: first.rentModifiers }), 3);
    expect(repeated.rentModifiers?.['3']).toEqual(first.rentModifiers?.['3']);
    const both: MarbleState = { ...repeated, rentModifiers: { '3': { ...repeated.rentModifiers?.['3'], blackout: { source: 'blackout', playerId: 'p2', owner: 'p1' } } } };
    const next = act(both, 'endTurn'); expect(next.rentModifiers).toEqual(both.rentModifiers);
    const arrived = land(next, 'p2', 3); expect(arrived.money.p2).toBe(1470); expect(arrived.rentModifiers?.['3']).toBeUndefined();
    expect(both.rentModifiers?.['3'].blackout).toBeTruthy();
  });
  it('holds a rent pass without automatically spending it and waives a single assessed rent', () => {
    const held = draw('rent-pass'); expect(held.rentPasses?.p1).toBe(1); expect(held.eventDeck).not.toContain('rent-pass');
    const pending = land(held, 'p1', 4); expect(pending.phase).toBe('rent-decision'); expect(pending.money.p1).toBe(1500); expect(pending.pendingRent?.amount).toBe(36);
    expect(marbleEngine.validateAction(pending, 'p1', { type: 'borrow' })).toBe('Resolve the rent decision first');
    expect(marbleEngine.validateAction(pending, 'p2', { type: 'use-rent-pass' })).toBe('Not your turn');
    const paid = act(pending, 'pay-rent', { amount: 0, creditor: 'p1' }); expect(paid.money).toEqual({ p1: 1464, p2: 1536 }); expect(paid.rentPasses?.p1).toBe(1);
    const waived = act(pending, 'use-rent-pass'); expect(waived.money).toEqual({ p1: 1500, p2: 1500 }); expect(waived.pendingRent).toBeNull(); expect(waived.rentPasses?.p1).toBe(0);
    expect(waived.eventDeck!.filter(id => id === 'rent-pass')).toHaveLength(1);
    expect(marbleEngine.validateAction(waived, 'p1', { type: 'use-rent-pass' })).toBe('No matching decision');
    expect(land(waived, 'p1', 4).money.p1).toBe(1464);
    const taxed = land(held, 'p1', 6); expect(taxed.money.p1).toBe(1400); expect(taxed.rentPasses?.p1).toBe(1); expect(taxed.phase).toBe('main');
    const old = land({ ...held, eventVersion: undefined }, 'p1', 4); expect(old.phase).toBe('main'); expect(old.money.p1).toBe(1464);
    expect(pending.rentPasses?.p1).toBe(1); expect(pending.pendingRent?.reason.ko).toContain('마드리드');
  });
  it('consumes city modifiers even when waived and settles low-cash pay exactly once after borrowing', () => {
    const held = draw('rent-pass', { money: { p1: 0, p2: 1500 }, rentModifiers: { '4': { festival: { source: 'city-festival', playerId: 'p2', owner: 'p2' }, blackout: { source: 'blackout', playerId: 'p1', owner: 'p2' } } } });
    const pending = land(held, 'p1', 4); expect(pending.pendingRent?.amount).toBe(36); expect(pending.rentModifiers?.['4']).toBeUndefined();
    expect(act(pending, 'use-rent-pass').money.p1).toBe(0);
    const debt = act(pending, 'pay-rent'); expect(debt.phase).toBe('debt'); expect(debt.pendingRent).toBeNull(); expect(debt.pendingPayment?.creditor).toBe('p2');
    const paid = act(debt, 'borrow'); expect(paid.money).toEqual({ p1: 264, p2: 1536 }); expect(paid.phase).toBe('main'); expect(paid.rentPasses?.p1).toBe(1);
    expect(paid.actionLog!.filter(event => event.type === 'rent')).toHaveLength(1);
    expect(held.rentModifiers?.['4'].festival).toBeTruthy(); expect(pending.pendingRent?.reason).not.toBe(debt.pendingPayment?.reason);
  });
  it('refills 16 cards while held passes stay out, exposes copied effects but never deck order, and preserves old rooms', () => {
    const after = draw('festival', { eventDeck: [], rentPasses: { p1: 1, p2: 0 } }); expect(after.eventDeck).not.toContain('rent-pass');
    const publicState = choose(draw('city-festival'), 3); const publicView = marbleEngine.getPlayerView(publicState, 'p2');
    expect(publicView.board.eventCardCount).toBe(16); expect(publicView.actions).toHaveLength(0); expect(JSON.stringify(publicView)).not.toMatch(/eventDeck|eventRng/);
    publicView.board.tiles[3].rentModifiers.festival.owner = 'p2'; expect(publicState.rentModifiers?.['3'].festival?.owner).toBe('p1');
    for (const [boardVersion, economicVersion, count] of [[undefined, undefined, 8], [2, undefined, 12], [2, 2, 13]] as const) {
      const old = { ...eventState('festival'), boardVersion, economicVersion, eventVersion: undefined, eventDeck: [], positions: { p1: boardVersion === 2 ? 0 : 5, p2: 0 } } as MarbleState;
      const moved = act(old, 'roll'); expect(moved.eventDeck!.length + (boardVersion === 2 && moved.lastEvent?.id !== 'escape-pass' ? 0 : 1)).toBe(count);
      expect(moved.eventDeck!.some(id => ['city-festival', 'blackout', 'rent-pass'].includes(id))).toBe(false);
    }
  });
});

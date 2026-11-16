import { legacyInitial } from './marble.effectFixtures';
import { describe, expect, it } from 'vitest';
import { seededRandom, type GameAction } from '../core/types';
import { fourMarbleEngine as engine, type FourMarbleState } from './fourMarble';
import { constructionCost, constructionRent, constructionValue } from './marbleConstruction';
import { marbleLandPrice } from './marbleEconomy';
// Explicit research fixture; production40 defaults retain construction v1.
const initial = (seed = 1): FourMarbleState => ({ ...legacyInitial(engine, seed), constructionRulesVersion: 2, completedLaps: { p1: 0, p2: 0, p3: 0, p4: 0 } });
const step = (s: FourMarbleState, a: GameAction) => engine.applyAction(s, s.active, a) as FourMarbleState;
const rawTile = { kind: 'property' as const, name: { ko: '광주', es: 'Gwangju' }, price: 100, rent: 12, group: 'green' };
function dice(total: number) { for (let seed = 0; seed < 10000; seed++) { const r = seededRandom(seed); if (2 + Math.floor(r() * 6) + Math.floor(r() * 6) === total) return seed; } throw Error('seed'); }
function landAt(index: number, card?: FourMarbleState['eventDeck'][number]) { const s = initial(); s.positions.p1 = (index + 38) % 40; s.rng = dice(2); if (card) s.eventDeck = [card]; return s; }
function decision() { const s = initial(); s.phase = 'decision'; s.pendingTile = 1; s.positions.p1 = 1; s.buildSite = 1; return s; }
const purchase = { type: 'buy', payload: { buildings: ['building', 'villa'] } };
describe('four-seat independent construction', () => {
  it('atomically purchases independently selected buildings and rejects locked, duplicate and unaffordable selections', () => {
    const s = decision(), before = structuredClone(s);
    for (const buildings of [['hotel'], ['villa', 'villa'], ['unknown']]) expect(engine.validateAction(s, 'p1', { type: 'buy', payload: { buildings } })).toBeTruthy();
    const total = marbleLandPrice(rawTile, 3) + constructionCost(rawTile, { buildings: ['villa', 'building'] }, 3);
    s.money.p1 = total - 1; expect(engine.validateAction(s, 'p1', purchase)).toBeTruthy(); expect(() => step(s, purchase)).toThrow(); expect(s.properties).toEqual({});
    s.money.p1 = total; const n = step(s, purchase); expect(n.money.p1).toBe(0); expect(n.properties[1]).toMatchObject({ buildings: ['villa', 'building'], landmark: false });
    expect(n.actionLog.filter(e => e.moneyDelta)).toHaveLength(1); expect(n.actionLog.at(-1)).toMatchObject({ amount: total, moneyDelta: { p1: -total } }); expect(before.properties).toEqual({});
  });
  it('permits building without a villa, locks hotel until a completed lap and requires later arrival for landmark', () => {
    let s = step(decision(), { type: 'buy', payload: { buildings: ['building'] } });
    expect(s.properties[1].buildings).toEqual(['building']);
    expect(engine.validateAction(s, 'p1', { type: 'build', payload: { tile: 1, buildings: ['hotel'] } })).toBeTruthy();
    s.completedLaps!.p1 = 1;
    s = step(s, { type: 'build', payload: { tile: 1, buildings: ['hotel', 'villa'] } });
    expect(engine.validateAction(s, 'p1', { type: 'build', payload: { tile: 1, landmark: true } })).toBeTruthy();
    s.phase = 'train-decision'; s.positions.p1 = 14; s.trainFare = 0;
    s = step(s, { type: 'choose-train', payload: { destination: 1 } });
    s = step(s, { type: 'build', payload: { tile: 1, landmark: true } }); expect(s.properties[1].landmark).toBe(true);
    expect(engine.getPlayerView(s, 'p1').actions.some(c => c.action.type === 'build')).toBe(false);
    s.active = 'p2'; s.positions.p2 = 1; s.takeoverTile = 1; expect(engine.validateAction(s, 'p2', { type: 'takeover', payload: { tile: 1 } })).toBeTruthy();
  });
  it('counts forward laps but never retreat or island relocation; exact START grants a single remote construction', () => {
    let s = landAt(0); s.properties[1] = { owner: 'p1', houses: 2, buildings: ['villa', 'building', 'hotel'], landmark: false };
    s = step(s, { type: 'roll' }); expect(s.completedLaps!.p1).toBe(1); expect(s.buildSite).toBe('start');
    s = step(s, { type: 'build', payload: { tile: 1, landmark: true } }); expect(s.buildSite).toBeNull();
    const retreat = step(landAt(2, 'retreat'), { type: 'roll' }); expect(retreat.completedLaps!.p1).toBe(0);
    const island = step(landAt(2, 'go-to-island'), { type: 'roll' }); expect(island.completedLaps!.p1).toBe(0);
    const start = step(landAt(2, 'advance-start'), { type: 'roll' }); expect(start.completedLaps!.p1).toBe(1);
  });
  it('uses actual independent construction in rent, asset value, takeover and liquidation', () => {
    const s = landAt(1); s.properties[1] = { owner: 'p2', houses: 1, buildings: ['hotel'] }; s.completedLaps!.p2 = 1;
    let n = step(s, { type: 'roll' }); const toll = constructionRent(rawTile, s.properties[1], 3), value = constructionValue(rawTile, s.properties[1], 3);
    expect(n.money.p2).toBe(3000 + toll); expect(engine.getPlayerView(n, 'p2').players.find(p => p.id === 'p2')?.score).toBe(3000 + toll + value);
    const cash = n.money.p1; n = step(n, { type: 'takeover', payload: { tile: 1 } }); expect(n.money.p1).toBe(cash - 2 * value); expect(n.properties[1].buildings).toEqual(['hotel']);
    n.phase = 'debt'; n.money.p1 = 0; n.pendingPayment = { amount: 9999, creditor: 'bank', resumeActive: 'p1' }; n = step(n, { type: 'sell-property', payload: { tile: 1 } }); expect(n.money.p1).toBe(Math.floor(value / 2));
  });
  it('preserves no-payload legacy buys and linear builds without migrating state', () => {
    const s = decision(); s.constructionRulesVersion = 1; delete s.completedLaps;
    const bought = step(s, { type: 'buy' }); const built = step(bought, { type: 'build', payload: { tile: 1 } }); expect(built.properties[1]).toEqual({ owner: 'p1', houses: 1 }); expect(built.constructionRulesVersion).toBe(1);
  });
});
describe('four-seat normalized receipts', () => {
  it.each(['festival', 'lottery', 'rent-rebate', 'city-dividend', 'advance-start'] as const)('emits exactly one award receipt for %s', card => {
    const s = landAt(2, card); s.properties[1] = { owner: 'p1', houses: 0, buildings: [] };
    const n = step(s, { type: 'roll' }), receipts = n.actionLog.filter(e => e.moneyDelta);
    expect(receipts).toHaveLength(1); expect(receipts[0]).toMatchObject({ fromAccount: 'bank', toAccount: 'p1', moneyDelta: { p1: n.money.p1 - s.money.p1 } });
  });
  it('emits fund, paid escape and train fare plus destination toll receipts', () => {
    const s = landAt(20); s.fundPool = 180; const collected = step(s, { type: 'roll' }); expect(collected.actionLog.find(e => e.moneyDelta)).toMatchObject({ amount: 180, fromAccount: 'fund', toAccount: 'p1', moneyDelta: { p1: 180 } });
    const island = initial(); island.phase = 'island'; island.islandTurns.p1 = 3; expect(step(island, { type: 'pay-escape' }).actionLog.at(-1)).toMatchObject({ amount: 100, moneyDelta: { p1: -100 } });
    const train = initial(); train.phase = 'train-decision'; train.positions.p1 = 0; train.properties[1] = { owner: 'p4', houses: 0, buildings: [] }; const n = step(train, { type: 'choose-train', payload: { destination: 1 } }); const transfers = n.actionLog.filter(e => e.moneyDelta); expect(transfers).toHaveLength(2); expect(transfers[0]).toMatchObject({ amount: 100, toAccount: 'bank' }); expect(transfers[1]).toMatchObject({ toAccount: 'p4' });
  });
  it.each(['city-festival', 'blackout', 'monopoly-warning'] as const)('explicitly explains no eligible target for %s', card => {
    const n = step(landAt(2, card), { type: 'roll' }); expect(n.phase).toBe('main'); expect(n.actionLog.at(-1)?.text.ko).toMatch(/없/);
  });
});

it('finishes independent-building AI matches with legal affordable actions and no input mutations', () => {
  for (const seed of [1, 17, 91, 305, 1009]) {
    let s = initial(seed); const random = seededRandom(seed);
    for (let count = 0; count < 2500 && !s.result; count++) {
      const before = JSON.stringify(s), action = engine.chooseAiAction(engine.getPlayerView(s, s.active), s.active, random);
      expect(action).toBeTruthy(); expect(engine.validateAction(s, s.active, action!)).toBeNull(); s = step(s, action!);
      expect(JSON.stringify(s)).not.toBe(before);
      for (const money of Object.values(s.money)) expect(money).toBeGreaterThanOrEqual(0);
      for (const prop of Object.values(s.properties)) { expect(new Set(prop.buildings).size).toBe(prop.buildings?.length ?? 0); if (prop.landmark) expect(prop.buildings).toHaveLength(3); }
    }
    expect(s.result).toBeTruthy();
  }
}, 30000);

it('rejects mixed landmark/building payloads, empty builds and unknown fields without mutating state', () => {
  let s = decision(); s.completedLaps!.p1 = 1; s = step(s, { type: 'buy', payload: { buildings: ['hotel', 'villa', 'building'] } }); s.landmarkOptions = [1];
  const before = JSON.stringify(s);
  for (const payload of [{ tile: 1, buildings: [] }, { tile: 1, landmark: true, buildings: ['villa'] }, { tile: 1, landmark: true, free: true }, { tile: 1, buildings: ['villa'] }]) {
    expect(engine.validateAction(s, 'p1', { type: 'build', payload })).toBeTruthy(); expect(() => step(s, { type: 'build', payload })).toThrow();
  }
  expect(JSON.stringify(s)).toBe(before);
});

it('allows blackout targeting when every enemy city is a landmark', () => {
  const s = landAt(2, 'blackout'); s.properties[1] = { owner: 'p2', houses: 3, buildings: ['villa', 'building', 'hotel'], landmark: true };
  const n = step(s, { type: 'roll' }); expect(n.phase).toBe('event-decision'); expect(engine.validateAction(n,'p1',{type:'choose-event-city',payload:{tile:1}})).toBeNull();
});

it('explains the final failed island attempt and successful doubles escape', () => {
  const s = initial(); s.phase = 'island'; s.positions.p1 = 10; s.islandTurns.p1 = 1; s.rng = dice(3);
  const failed = step(s, { type: 'attempt-doubles' }); expect(failed.islandTurns.p1).toBe(0); expect(failed.actionLog.find(e => e.type === 'island')?.text.ko).toContain('다음 차례');
  s.rng = dice(2); const escaped = step(s, { type: 'attempt-doubles' }); expect(escaped.islandTurns.p1).toBe(0); expect(escaped.actionLog.some(e => e.type === 'escape')).toBe(true); expect(escaped.actionLog.some(e => e.type === 'arrival' && e.tile === 12)).toBe(true);
});

it('accepts land-only no-payload buys in new games and rejects stale or occupied purchase decisions', () => {
  const s = decision(); const n = step(s, { type: 'buy' }); expect(n.properties[1]).toMatchObject({ owner: 'p1', buildings: [], landmark: false }); expect(n.money.p1).toBe(s.money.p1 - marbleLandPrice(rawTile, 3));
  s.properties[1] = { owner: 'p2', houses: 0, buildings: [] };
  expect(engine.validateAction(s, 'p1', { type: 'buy' })).toBeTruthy(); expect(engine.validateAction(s, 'p1', purchase)).toBeTruthy(); expect(engine.validateAction(s, 'p1', { type: 'decline' })).toBeTruthy();
  delete s.properties[1]; s.positions.p1 = 3; expect(engine.validateAction(s, 'p1', { type: 'buy' })).toBeTruthy();
  s.positions.p1 = 1; s.pendingTile = 2; expect(engine.validateAction(s, 'p1', { type: 'buy' })).toBeTruthy();
});

it('allows immediate landmark after takeover of three preexisting buildings, even on first lap', () => {
  for (const buildings of [['villa', 'building', 'hotel'], ['villa', 'building']] as const) {
    const complete = buildings.length === 3;
    let s = landAt(1); s.properties[1] = { owner: 'p2', houses: complete ? 2 : 1, buildings: [...buildings] }; s.completedLaps!.p1 = complete ? 0 : 1;
    s = step(s, { type: 'roll' }); s = step(s, { type: 'takeover', payload: { tile: 1 } });
    if (!complete) s = step(s, { type: 'build', payload: { tile: 1, buildings: ['hotel'] } });
    expect(engine.validateAction(s, 'p1', { type: 'build', payload: { tile: 1, landmark: true } }) === null).toBe(complete);
    if (complete) expect(step(s, { type: 'build', payload: { tile: 1, landmark: true } }).properties[1].landmark).toBe(true);
  }
});

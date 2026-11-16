import { legacyInitial } from './marble.effectFixtures';
import { describe, expect, it } from 'vitest';
import { marbleEngine as engine, type MarbleState } from './marble';
import { constructionCost, constructionRent, constructionValue, marbleBuildingTypes } from './marbleConstruction';
import { chooseSimpleAiAction } from './simpleAi';
import { seededRandom, type GameAction } from '../core/types';
// Explicit research fixture; production40 defaults retain construction v1.
const fresh = (seed = 1): MarbleState => ({ ...legacyInitial(engine, seed), constructionRulesVersion: 2, completedLaps: { p1: 0, p2: 0 } });
const step = (s: MarbleState, a: GameAction) => engine.applyAction(s, s.active, a);
const buyState = (): MarbleState => ({ ...fresh(), phase: 'decision', positions: { p1: 4, p2: 0 }, pendingTile: 4, buildSite: 4 });
const rawTile = engine.getPlayerView({ ...fresh(), economicVersion: 2 }, 'p1').board.tiles[4];
function dice(a: number, b: number) { for (let seed = 0; seed < 10000; seed++) { const r = seededRandom(seed); if (1 + Math.floor(r() * 6) === a && 1 + Math.floor(r() * 6) === b) return seed; } throw Error('No seed'); }
const rollFrom = (s: MarbleState, from: number, a = 1, b = 2) => step({ ...s, phase: 'roll', positions: { ...s.positions, p1: from }, rng: dice(a, b) }, { type: 'roll' });
describe('independent construction v2', () => {
  it('starts versioned and purchases only the independently selected building in one transfer', () => {
    const s = buyState(), action = { type: 'buy', payload: { buildings: ['building'] } };
    const n = step(s, action), cost = 110 + constructionCost(rawTile, { buildings: ['building'] }, 3);
    expect(n.constructionRulesVersion).toBe(2); expect(n.completedLaps?.p1).toBe(0);
    expect(n.properties[4]).toEqual({ owner: 'p1', houses: 1, buildings: ['building'], landmark: false });
    expect(n.money.p1).toBe(3000 - cost); expect(n.actionLog?.filter(e => e.moneyDelta)).toHaveLength(1);
    expect(n.actionLog?.at(-1)).toMatchObject({ type: 'buy', amount: cost, moneyDelta: { p1: -cost } });
    expect(s.properties).toEqual({}); expect(s.money.p1).toBe(3000);
  });
  it('accepts unordered selections, land only and rejects duplicate, unknown, locked or contradictory selections', () => {
    const s = buyState();
    expect(engine.validateAction(s, 'p1', { type: 'buy', payload: { buildings: ['building', 'villa'] } })).toBeNull();
    expect(engine.validateAction(s, 'p1', { type: 'buy', payload: { buildings: [] } })).toBeNull();
    for (const payload of [{ buildings: ['villa', 'villa'] }, { buildings: ['castle'] }, { buildings: ['hotel'] }, { buildings: [], landmark: true }, { buildings: [], amount: 0 }]) expect(engine.validateAction(s, 'p1', { type: 'buy', payload })).toBeTruthy();
  });
  it('validates combined land+building affordability atomically', () => {
    const s = { ...buyState(), money: { p1: 110, p2: 3000 } }, original = structuredClone(s);
    expect(() => step(s, { type: 'buy', payload: { buildings: ['villa'] } })).toThrow(); expect(s).toEqual(original);
    expect(step(s, { type: 'buy' }).money.p1).toBe(0);
  });
  it('adds missing buildings in one transaction and disallows owned/empty selections or another site', () => {
    const s = step(buyState(), { type: 'buy', payload: { buildings: ['building'] } });
    for (const payload of [{ tile: 4, buildings: ['building'] }, { tile: 4, buildings: [] }, { tile: 5, buildings: ['villa'] }]) expect(engine.validateAction(s, 'p1', { type: 'build', payload })).toBeTruthy();
    const n = step(s, { type: 'build', payload: { tile: 4, buildings: ['villa'] } });
    expect(n.properties[4].buildings).toEqual(['villa', 'building']); expect(s.properties[4].buildings).toEqual(['building']);
    expect(engine.getPlayerView(n, 'p1').board.tiles[4]).toMatchObject({ buildings: ['villa', 'building'], landmark: false });
  });
  it('unlocks hotel after a forward lap, including a start card but not retreat or island', () => {
    const n = rollFrom(fresh(), 39); expect(n.completedLaps?.p1).toBe(1);
    const s = { ...buyState(), completedLaps: n.completedLaps };
    expect(engine.validateAction(s, 'p1', { type: 'buy', payload: { buildings: ['hotel'] } })).toBeNull();
    const card = rollFrom({ ...fresh(), eventDeck: ['advance-start'] }, 0, 1, 1); expect(card.completedLaps?.p1).toBe(1);
    for (const id of ['retreat', 'go-to-island'] as const) expect(rollFrom({ ...fresh(), eventDeck: [id] }, 0, 1, 1).completedLaps?.p1).toBe(0);
    expect(rollFrom({ ...fresh(), phase: 'roll' }, 1).completedLaps?.p1).toBe(0);
  });
  it('requires all three before a revisit, then landmark blocks takeover but permits blackout', () => {
    const s = step({ ...buyState(), completedLaps: { p1: 1, p2: 0 } }, { type: 'buy', payload: { buildings: [...marbleBuildingTypes] } });
    expect(engine.validateAction(s, 'p1', { type: 'build', payload: { tile: 4, landmark: true } })).toBeTruthy();
    const landed = rollFrom(s, 1); expect(landed.landmarkOptions).toEqual([4]);
    const n = step(landed, { type: 'build', payload: { tile: 4, landmark: true } }); expect(n.properties[4].landmark).toBe(true);
    const rival = { ...n, active: 'p2' as const, positions: { p1: 4, p2: 4 }, phase: 'main' as const, takeoverTile: 4 };
    expect(engine.validateAction(rival, 'p2', { type: 'takeover', payload: { tile: 4 } })).toBeTruthy();
    expect(engine.validateAction({ ...rival, phase: 'event-decision', pendingEvent: { id: 'blackout', playerId: 'p2' } }, 'p2', { type: 'choose-event-city', payload: { tile: 4 } })).toBeNull();
  });
  it('allows only one remote construction at exact start; ordinary crossing is not a remote permit', () => {
    const s = step({ ...buyState(), completedLaps: { p1: 1, p2: 0 } }, { type: 'buy', payload: { buildings: [...marbleBuildingTypes] } });
    const crossed = rollFrom(s, 39); expect(crossed.buildSite).not.toBe('start');
    const arrived = rollFrom(s, 37); expect(arrived.buildSite).toBe('start');
    const n = step(arrived, { type: 'build', payload: { tile: 4, landmark: true } }); expect(n.buildSite).toBeNull();
  });
  it('uses actual buildings for assets, toll, takeover and half-value liquidation', () => {
    const s = step(buyState(), { type: 'buy', payload: { buildings: ['building'] } }), prop = s.properties[4];
    expect(engine.getPlayerView(s, 'p1').board.assets.p1).toBe(3000);
    const arrival = rollFrom({ ...fresh(), properties: { 4: { ...prop, owner: 'p2' } } }, 1);
    expect(arrival.money.p1).toBe(3000 - constructionRent(rawTile, prop, 3));
    expect(engine.getPlayerView(arrival, 'p1').board.takeoverOffer?.price).toBe(2 * constructionValue(rawTile, prop, 3));
    const debt: MarbleState = { ...s, phase: 'debt', money: { p1: 0, p2: 3000 }, debt: { p1: 330, p2: 0 }, pendingPayment: { amount: 9999, creditor: 'bank', reason: { ko: '세금', es: 'Impuesto' }, resumePhase: 'main', resumeActive: 'p1', type: 'tax' } };
    expect(step(debt, { type: 'sell-property', payload: { tile: 4 } }).money.p1).toBe(Math.floor(constructionValue(rawTile, prop, 3) / 2));
  });
  it('preserves saved linear construction actions without migrating their properties', () => {
    const s: MarbleState = { ...buyState(), constructionRulesVersion: 1, phase: 'main', properties: { 4: { owner: 'p1', houses: 0 } } };
    const n = step(s, { type: 'build', payload: { tile: 4 } }); expect(n.properties[4]).toEqual({ owner: 'p1', houses: 1 });
  });
});

it('AI prices the selected bundle, preserves a reserve and completes fresh independent games', () => {
  const s = { ...buyState(), money: { p1: 260, p2: 3000 } };
  const selected = chooseSimpleAiAction('marble', engine.getPlayerView(s, 'p1'), 'p1', () => 0, 150)!;
  expect(selected.type).toBe('buy');
  expect(step(s, selected).money.p1).toBeGreaterThanOrEqual(150);
  for (const seed of [2, 19, 115]) {
    let state = fresh(seed); const random = seededRandom(seed);
    for (let turn = 0; turn < 1600 && !state.result; turn++) {
      const p = state.active, view = engine.getPlayerView(state, p), action = chooseSimpleAiAction('marble', view, p, random);
      expect(action).not.toBeNull(); expect(engine.validateAction(state, p, action!)).toBeNull();
      const before = structuredClone(state); state = step(state, action!);
      expect(before.money.p1).toBeGreaterThanOrEqual(0); expect(before.money.p2).toBeGreaterThanOrEqual(0);
    }
    expect(state.result).not.toBeNull();
  }
});

it('allows landmark immediately after taking over already-complete buildings, but not after filling an incomplete takeover', () => {
  for (const buildings of [['villa', 'building', 'hotel'], ['villa', 'building']] as const) {
    const complete = buildings.length === 3;
    let s = rollFrom({ ...fresh(), completedLaps: { p1: complete ? 0 : 1, p2: 1 }, properties: { 4: { owner: 'p2', houses: complete ? 2 : 1, buildings: [...buildings] } } }, 1);
    s = step(s, { type: 'takeover', payload: { tile: 4 } });
    if (!complete) s = step(s, { type: 'build', payload: { tile: 4, buildings: ['hotel'] } });
    expect(engine.validateAction(s, 'p1', { type: 'build', payload: { tile: 4, landmark: true } }) === null).toBe(complete);
    if (complete) expect(step(s, { type: 'build', payload: { tile: 4, landmark: true } }).properties[4].landmark).toBe(true);
  }
});

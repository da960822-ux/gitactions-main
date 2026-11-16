import { createLegacyMarbleState } from './marble';
import { createFourLegacyMarbleState, fourMarbleEngine } from './fourMarble';
import { seededRandom } from '../core/types';
import type { MarbleEventId } from './marble';

export function legacyInitial<T extends {createInitialState(seed:number):any}>(engine:T, seed:number):ReturnType<T['createInitialState']> {
  return ((engine as unknown) === fourMarbleEngine ? createFourLegacyMarbleState(seed) : createLegacyMarbleState(seed)) as ReturnType<T['createInitialState']>;
}
export function marbleScenarioDice(a = 1, b = 1) {
  for (let seed = 0; seed < 10000; seed++) { const random = seededRandom(seed); if (1 + Math.floor(random() * 6) === a && 1 + Math.floor(random() * 6) === b) return seed; }
  throw new Error('No deterministic dice seed');
}
export function marbleEffectFixture(engine: any, constructionRulesVersion: 1 | 2 = 1) {
  const state = legacyInitial(engine, 1);
  state.constructionRulesVersion = constructionRulesVersion;
  if (constructionRulesVersion === 2) state.completedLaps = Object.fromEntries(Object.keys(state.money).map(player => [player, 1]));
  state.money = Object.fromEntries(Object.keys(state.money).map(player => [player, 10000]));
  state.pawnLocked = Object.fromEntries(Object.keys(state.money).map(player => [player, true]));
  state.properties = {
    1: { owner: 'p1', houses: 1, ...(constructionRulesVersion === 2 ? { buildings: ['villa'], landmark: false } : {}) },
    4: { owner: 'p2', houses: 1, ...(constructionRulesVersion === 2 ? { buildings: ['villa'], landmark: false } : {}) },
    5: { owner: 'p2', houses: 0, ...(constructionRulesVersion === 2 ? { buildings: [], landmark: false } : {}) },
    15: { owner: 'p2', houses: 0, ...(constructionRulesVersion === 2 ? { buildings: [], landmark: false } : {}) },
  };
  return state;
}
export function marbleDrawFixture(engine: any, card: MarbleEventId, version: 1 | 2 = 1) {
  return { ...marbleEffectFixture(engine, version), rng: marbleScenarioDice(), eventDeck: [card], positions: { ...legacyInitial(engine, 1).positions, p1: 0 } };
}
export function marbleBrowserScenario(engine: any, kind: 'takeover' | 'festival' | 'blackout') {
  let state = marbleEffectFixture(engine);
  if (kind === 'takeover') {
    state.positions.p1 = 1; state.rng = marbleScenarioDice(1, 2);
    return engine.applyAction(state, 'p1', { type: 'roll' });
  }
  state = marbleDrawFixture(engine, kind === 'festival' ? 'city-festival' : 'blackout');
  return engine.applyAction(state, 'p1', { type: 'roll' });
}
/** State-only projection: presentation receipts and harmless optional defaults are deliberately excluded. */
export function marbleRuleSnapshot(state: any) {
  const fields = ['active','phase','positions','money','properties','eventDeck','islandTurns','escapePasses','rentPasses','trainReady','pendingTile','pendingTrainFare','pendingTrainSource','trainFare','trainFromCard','pendingEvent','pendingRent','pendingPayment','debt','fundPool','takeoverTile','extraRoll','doublesCount','buildSite','landmarkOptions','eliminated','turns','result','rentModifiers','modifiers'];
  return Object.fromEntries(fields.filter(key => state[key] !== undefined).map(key => [key, state[key]]));
}

import { describe, expect, it } from 'vitest';
import { marbleEngine } from './marble';
import { fourMarbleEngine } from './fourMarble';
import { constructionRent } from './marbleConstruction';
import { marbleColorTollBonus } from './marbleEconomy';
import { worldIslandsBoardFor } from './marbleBoardProfiles';
import { ownershipPreview } from '../app/marble-decision';
import { rentValue } from '../app/marble-visuals';

const property = (owner = 'p2') => ({ owner, houses: 0, buildings: [], landmark: false });
const tilesOf = (engine: any, state: any) => { const view = engine.getPlayerView(state, 'p1'); return (view.board?.tiles ?? view.publicBoard).map((tile: any, index: number) => ({ ...tile, ...state.properties[index] })); };
const travel = (engine: any, state: any, destination: number) => engine.applyAction({ ...state, phase: 'train-decision', pendingTrainFare: 0, trainFare: 0, positions: { ...state.positions, [state.active]: destination } }, state.active, { type: 'choose-train', payload: { destination } });

for (const [mode, engine] of [['2p', marbleEngine], ['4p', fourMarbleEngine]] as const) {
 describe(`${mode} revision-specific color toll rules`, () => {
  it.each([undefined, 1, 2, 3, 4])('charges and displays the exact completed-group toll after reload, revision %s', revision => {
   let state: any = engine.createInitialState(19); state.boardRevision = revision;
   state.properties = { 1: property(), 3: property() };
   state = JSON.parse(JSON.stringify(state));
   const multiplier = revision === 3 || revision === 4 ? 1 : 2;
   const tiles = tilesOf(engine, state);
   expect(tiles[1].monopolyMultiplier).toBe(multiplier);
   expect(rentValue(tiles[1], true, state.economicVersion)).toBe(2 * multiplier);
   const before = { ...state.money }; const next = travel(engine, state, 1);
   expect(next.money.p1).toBe(before.p1 - 2 * multiplier);
   expect(next.money.p2).toBe(before.p2 + 2 * multiplier);
   expect(next.actionLog.filter((event: any) => event.type === 'rent').at(-1)).toMatchObject({ amount: 2 * multiplier });
   expect(ownershipPreview(tiles, 1, 'p2', marbleColorTollBonus(state)).monopolyMultiplier).toBe(multiplier);
  });
  it('uses normal city tolls at every construction tier, including landmarks', () => {
   for (const buildings of [[], ['villa'], ['building'], ['hotel'], ['villa', 'building', 'hotel']]) {
    for (const landmark of buildings.length === 3 ? [false, true] : [false]) {
     const state: any = engine.createInitialState(19);
     state.properties = { 1: { ...property(), houses: buildings.length, buildings, landmark }, 3: property() };
     const tile = tilesOf(engine, state)[1]; const amount = constructionRent(tile, state.properties[1], state.economicVersion);
     expect(tile.monopolyMultiplier).toBe(1); expect(rentValue(tile, true, state.economicVersion)).toBe(amount);
     const next = travel(engine, state, 1); expect(next.money.p1).toBe(state.money.p1 - amount);
    }
   }
  });
  it('keeps festival one-time x2, without stacking a color bonus in revision3', () => {
   let state: any = engine.createInitialState(19); state.properties = { 1: property(), 3: property() };
   const modifiers = mode === '2p' ? 'rentModifiers' : 'modifiers';
   state[modifiers][1] = { festival: mode === '2p' ? { owner: 'p2', playerId: 'p2' } : 'p2' };
   const before = state.money.p1; state = travel(engine, state, 1);
   expect(state.money.p1).toBe(before - 4); expect(state[modifiers][1]?.festival).toBeUndefined();
   state = travel(engine, state, 1); expect(state.money.p1).toBe(before - 6);
  });
  it('requires three different complete groups, not three cities, and still wins immediately', () => {
   let state: any = engine.createInitialState(19); const board = worldIslandsBoardFor(3);
   const groups = [...new Set(board.filter(tile => tile.group).map(tile => tile.group!))];
   const oneGroup = board.flatMap((tile, index) => tile.group === groups[1] ? [index] : []);
   state.properties = Object.fromEntries(oneGroup.slice(0, -1).map(index => [index, property('p1')]));
   state = travel(engine, state, oneGroup.at(-1)!); state = engine.applyAction(state, 'p1', { type: 'buy' });
   expect(Object.keys(state.properties)).toHaveLength(3); expect(state.result).toBeNull();
   state = engine.createInitialState(19);
   const indices = board.flatMap((tile, index) => tile.group && [groups[0], groups[2], groups[6]].includes(tile.group) ? [index] : []);
   const last = indices.at(-1)!;
   state.properties = Object.fromEntries(indices.filter(index => index !== last).map(index => [index, property('p1')]));
   expect(state.result).toBeNull(); state = travel(engine, state, last); state = engine.applyAction(state, 'p1', { type: 'buy' });
   expect(state.result?.winner).toBe(mode === '2p' ? 'p1' : 'A');
   if (mode === '2p') expect(state.result.reason).toBe('triple-monopoly');
   else expect(state.actionLog.at(-1)).toMatchObject({ victoryType: 'triple-monopoly' });
  });
 });
}

it('does not change classic or unversioned property-rule eligibility', () => {
 expect(marbleColorTollBonus({ propertyRulesVersion: 1, boardProfile: 'classic-korea-2015', boardRevision: 3 })).toBe(true);
 expect(marbleColorTollBonus({ propertyRulesVersion: 1 })).toBe(true);
 expect(marbleColorTollBonus({ boardProfile: 'world-islands-32-v1', boardRevision: 2 })).toBe(false);
});

import { describe, expect, it } from 'vitest';
import { marbleEngine } from './marble';
import { fourMarbleEngine } from './fourMarble';
import { marbleBoardProfileMetadata, worldIslandsBoardFor } from './marbleBoardProfiles';
import { classicToll, marbleRentBoard } from './marbleClassicEconomy';
import { rentValue } from '../app/marble-visuals';
const source = worldIslandsBoardFor(4);
const kinds = ['villa', 'building', 'hotel'] as const;
const tilesOf = (engine: any, state: any) => { const v = engine.getPlayerView(state, 'p1'); return v.board?.tiles ?? v.publicBoard; };
const travel = (engine: any, state: any, destination: number) => engine.applyAction({ ...state, phase: 'train-decision', pendingTrainFare: 0, trainFare: 0, positions: { ...state.positions, p1: destination } }, 'p1', { type: 'choose-train', payload: { destination } });
it('projects all18 cities monotonically without mutating source, costs, sale or takeover values', () => {
 const before = structuredClone(source), board = marbleRentBoard(source, 2);
 expect(board.filter(t => t.cityEconomy)).toHaveLength(18);
 for (const [index, tile] of board.entries()) {
  const e = tile.cityEconomy, original = source[index].cityEconomy;
  if (!e || !original) continue;
  expect(e.landCost).toBe(original.landCost); expect(e.buildCosts).toEqual(original.buildCosts); expect(e.landmarkCost).toBe(original.landmarkCost); expect(e.saleByMask).toEqual(original.saleByMask); expect(e.landmarkSale).toBe(original.landmarkSale);
  for (let mask = 0; mask < 8; mask++) {
   expect(e.tollByMask[mask]).toBe(Math.round(original.tollByMask[mask]! * .8));
   for (let bit = 0; bit < 3; bit++) if (!(mask & (1 << bit))) expect(e.tollByMask[mask | (1 << bit)]!).toBeGreaterThan(e.tollByMask[mask]!);
  }
  expect(e.landmarkToll).toBe(Math.round(original.landmarkToll * .7)); expect(e.landmarkToll).toBeGreaterThan(e.tollByMask[7]!);
 }
 const ordered = board.flatMap(t => t.cityEconomy ? [t.cityEconomy] : []).sort((a, b) => a.sourceCostRow - b.sourceCostRow);
 for (let i = 1; i < ordered.length; i++) {
  for (let mask = 0; mask < 8; mask++) {
   const previousSource = source.find(t => t.cityEconomy?.sourceCostRow === ordered[i - 1].sourceCostRow)!.cityEconomy!;
   const currentSource = source.find(t => t.cityEconomy?.sourceCostRow === ordered[i].sourceCostRow)!.cityEconomy!;
   if (currentSource.tollByMask[mask]! >= previousSource.tollByMask[mask]!) expect(ordered[i].tollByMask[mask]!).toBeGreaterThanOrEqual(ordered[i - 1].tollByMask[mask]!);
  }
  expect(ordered[i].landmarkToll).toBeGreaterThanOrEqual(ordered[i - 1].landmarkToll);
 }
 expect(source).toEqual(before); expect(marbleRentBoard(source)).toBe(source); expect(marbleRentBoard(source, 1)).toBe(source);
 const seoul = board.find(t => t.name.ko === '서울')!.cityEconomy!;
 expect(seoul.tollByMask).toEqual([96,288,504,696,936,1128,1344,1536]); expect(seoul.landmarkToll).toBe(1974);
});
for (const [mode, engine] of [['2p', marbleEngine], ['4p', fourMarbleEngine]] as const) describe(`${mode} versioned rent projection`, () => {
 for (const version of [undefined, 1, 2]) it(`all18 cities/all9 stages display and charge exactly once after reload, version ${version}`, () => {
  for (const [index, tile] of source.entries()) {
   if (!tile.cityEconomy) continue;
   for (let stage = 0; stage < 9; stage++) {
    let s: any = engine.createInitialState(17); s.rentRulesVersion = version;
    const mask = stage === 8 ? 7 : stage, prop = { owner: 'p2', houses: 0, buildings: kinds.filter((_, bit) => mask & (1 << bit)), landmark: stage === 8 };
    s.properties = { [index]: prop }; s.money = Object.fromEntries(Object.keys(s.money).map(p => [p, 10000])); s = JSON.parse(JSON.stringify(s));
    const original = classicToll(tile.cityEconomy, prop)!;
    const expected = version === 2 ? Math.round(original * (prop.landmark ? .7 : .8)) : original;
    const visible = { ...tilesOf(engine, s)[index], ...prop };
    expect(rentValue(visible, true, s.economicVersion)).toBe(expected);
    const n = travel(engine, s, index); expect(n.money.p1).toBe(10000 - expected); expect(n.money.p2).toBe(10000 + expected);
    expect(n.actionLog.filter((e: any) => e.type === 'rent')).toHaveLength(1);
   }
  }
 });
 it('new games use lower tolls and festival multiplies the rounded base once', () => {
  let s: any = engine.createInitialState(17); expect(s.rentRulesVersion).toBe(2);
  const index = source.findIndex(t => t.name.ko === '서울'); s.money.p1 = 10000; s.properties = { [index]: { owner: 'p2', houses: 2, buildings: [...kinds], landmark: false } };
  const key = mode === '2p' ? 'rentModifiers' : 'modifiers'; s[key][index] = { festival: mode === '2p' ? { owner: 'p2', playerId: 'p2' } : 'p2' };
  s = travel(engine, s, index); expect(s.money.p1).toBe(10000 - 3072); expect(s[key][index]?.festival).toBeUndefined();
  s = travel(engine, s, index); expect(s.money.p1).toBe(10000 - 3072 - 1536);
 });
 it('all tourist islands charge96, retain price150 and old saves charge120', () => {
  for (const [index, tile] of source.entries()) if (tile.kind === 'tourism') {
   for (const version of [undefined, 2]) {
    const s: any = engine.createInitialState(17); s.rentRulesVersion = version; s.properties = { [index]: { owner: 'p2', houses: 0, buildings: [] } };
    const publicView: any = engine.getPlayerView(s, 'p1');
    expect((publicView.board ?? publicView.publicState).profileMetadata.tourismToll).toBe(version === 2 ? 96 : 120);
    expect(marbleBoardProfileMetadata('world-islands-32-v1', 3)).toMatchObject({ tourismToll: 120 });
    const view = tilesOf(engine, s)[index]; expect(view.price).toBe(150); expect(view.rent).toBe(version === 2 ? 96 : 120);
    expect(travel(engine, s, index).money.p1).toBe(3000 - (version === 2 ? 96 : 120));
   }
  }
 });
});

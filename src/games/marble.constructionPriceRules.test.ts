import { describe, expect, it } from 'vitest';
import { marbleEngine } from './marble';
import { fourMarbleEngine } from './fourMarble';
import { worldIslandsBoardFor } from './marbleBoardProfiles';
import { classicInvestment, classicSaleValue, classicTakeoverPrice, marbleRentBoard } from './marbleClassicEconomy';
const source = worldIslandsBoardFor(3), kinds = ['villa', 'building', 'hotel'] as const;
const tilesOf = (engine: any, state: any) => { const v = engine.getPlayerView(state, 'p1'); return v.board?.tiles ?? v.publicBoard; };
it('discounts each construction component once; land, source and independent rent rules remain unchanged', () => {
 const before = structuredClone(source), pricesOnly = marbleRentBoard(source, undefined, 2), both = marbleRentBoard(source, 2, 2);
 for (const [index, tile] of source.entries()) {
  if (!tile.cityEconomy) continue;
  const e = pricesOnly[index].cityEconomy!, raw = tile.cityEconomy;
  expect(e.landCost).toBe(raw.landCost); expect(pricesOnly[index].price).toBe(tile.price); expect(e.tollByMask).toEqual(raw.tollByMask);
  for (const kind of kinds) expect(e.buildCosts[kind]).toBe(Math.round(raw.buildCosts[kind] * .8));
  expect(e.landmarkCost).toBe(Math.round(raw.landmarkCost * .8));
  for (let mask = 0; mask < 8; mask++) {
   const buildings = kinds.filter((_, bit) => mask & (1 << bit)), prop = { houses: 0, buildings };
   const cost = raw.landCost + buildings.reduce((sum, kind) => sum + Math.round(raw.buildCosts[kind] * .8), 0);
   expect(classicInvestment(e, prop)).toBe(cost); expect(classicTakeoverPrice(e, prop)).toBe(cost * 2); expect(classicSaleValue(e, prop)).toBe(cost / 2);
   expect(both[index].cityEconomy!.buildCosts).toEqual(e.buildCosts);
  }
  const landmark = { houses: 3, buildings: [...kinds], landmark: true };
  expect(classicSaleValue(e, landmark)).toBe((e.landCost + Object.values(e.buildCosts).reduce((sum, value) => sum + value, 0)) / 2);
  expect(classicTakeoverPrice(e, landmark)).toBeNull();
 }
 expect(source).toEqual(before);
 const seoul = both.find(t => t.name.ko === '서울')!.cityEconomy!;
 expect(classicInvestment(seoul, { houses: 2, buildings: [...kinds] })).toBe(1164);
 expect(classicInvestment(seoul, { houses: 3, buildings: [...kinds], landmark: true })).toBe(1644);
 expect(seoul.landmarkSale).toBe(582);
});
for (const [mode, engine] of [['2p', marbleEngine], ['team', fourMarbleEngine]] as const) describe(`${mode} construction-price save compatibility`, () => {
 for (const version of [undefined, 1, 2]) it(`all18 cities/all masks purchase, upgrade and sale use actual costs, version ${version}`, () => {
  for (const [index, tile] of source.entries()) {
   if (!tile.cityEconomy) continue;
   for (let mask = 0; mask < 8; mask++) {
    let s: any = engine.createInitialState(4); s.constructionPriceRulesVersion = version; s.money.p1 = 10000;
    s.phase = 'decision'; s.positions.p1 = index; s.pendingTile = index; s.buildSite = index; s.completedLaps.p1 = 1;
    s = JSON.parse(JSON.stringify(s));
    const e = tilesOf(engine, s)[index].cityEconomy, buildings = kinds.filter((_, bit) => mask & (1 << bit));
    const expected = tile.cityEconomy.landCost + buildings.reduce((sum, kind) => sum + (version === 2 ? Math.round(tile.cityEconomy!.buildCosts[kind] * .8) : tile.cityEconomy!.buildCosts[kind]), 0);
    const buy = { type: 'buy', payload: { buildings } }; expect(engine.validateAction(s, 'p1', buy)).toBeNull(); s = engine.applyAction(s, 'p1', buy);
    expect(s.money.p1).toBe(10000 - expected);
    if (mask === 7) {
     s.landmarkOptions = [index]; const build = { type: 'build', payload: { tile: index, landmark: true } };
     expect(engine.validateAction(s, 'p1', build)).toBeNull(); s = engine.applyAction(s, 'p1', build);
     expect(s.money.p1).toBe(10000 - expected - e.landmarkCost);
    }
    s.money.p1 = 0; s.phase = 'debt'; s.pendingPayment = { amount: 1, creditor: 'bank', resumeActive: 'p1', resumePhase: 'main', reason: { ko: '검증', es: 'Prueba' }, type: 'tax' };
    const sale = { type: 'sell-property', payload: { tile: index } };
    expect(engine.validateAction(s, 'p1', sale)).toBeNull(); s = engine.applyAction(s, 'p1', sale);
    expect(s.money.p1).toBe(expected / 2 - 1); expect(s.properties[index]).toBeUndefined();
   }
  }
 });
});

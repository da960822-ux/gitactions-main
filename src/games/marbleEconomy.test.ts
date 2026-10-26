import { describe, expect, it } from 'vitest';
import { seededRandom } from '../core/types';
import { fourMarbleEngine } from './fourMarble';
import { marbleBuildCost, marbleEngine, type MarbleState } from './marble';
import { marbleBuildCostAtPrice, marbleCityValueAtPrice, marbleLandPrice, marbleRentAmount, marbleRentAtBase, marbleTakeoverPriceAtPrice } from './marbleEconomy';

function seedForSum(sum: number) {
  for (let seed = 0; seed < 10000; seed++) {
    const random = seededRandom(seed);
    if (2 + Math.floor(random() * 6) + Math.floor(random() * 6) === sum) return seed;
  }
  throw new Error('No dice seed');
}

describe('Marble versioned economy profile', () => {
  it('makes five mixed-price land purchases plus one first build on each affordable at game start', () => {
    const fresh = marbleEngine.createInitialState(1);
    const tiles = marbleEngine.getPlayerView(fresh, 'p1').board.tiles;
    const rawTiles = marbleEngine.getPlayerView({ ...fresh, economicVersion: 2 }, 'p1').board.tiles;
    const indices = [1, 4, 8, 3, 38];
    const land = indices.reduce((sum, index) => sum + tiles[index].price!, 0);
    const builds = indices.reduce((sum, index) => sum + marbleBuildCost(rawTiles[index], 0, 3), 0);
    expect(indices.map(index => tiles[index].price)).toEqual([80, 110, 140, 210, 450]);
    expect({ land, builds, remaining: 3000 - land - builds }).toEqual({ land: 990, builds: 390, remaining: 1620 });
    expect(1500 - 1240 - 490).toBe(-230); // Same five cities under the saved v2 economy.
  });

  it('uses one price, construction and rent schedule in the 2p and team engines', () => {
    const two = marbleEngine.createInitialState(3), four = fourMarbleEngine.createInitialState(3);
    const twoView = marbleEngine.getPlayerView(two, 'p1'), fourView: any = fourMarbleEngine.getPlayerView(four, 'p1');
    expect(twoView.board.tiles[1]).toMatchObject({ price: 80, rent: 20 });
    expect(fourView.publicBoard[1]).toMatchObject({ price: 80, rent: 20 });
    const tile = marbleEngine.getPlayerView({ ...two, economicVersion: 2 }, 'p1').board.tiles[1];
    expect([0, 1, 2, 3].map(level => marbleRentAmount(tile, level, 3))).toEqual([20, 40, 60, 80]);
    expect(marbleRentAmount(tile, 3, 3, 2)).toBe(160);
    expect([0, 1, 2].map(level => marbleBuildCost(tile, level, 3))).toEqual([30, 50, 60]);
    expect(marbleLandPrice(tile, 2)).toBe(100);
    expect(marbleRentAmount({ ...tile, price: 100, rent: 12 }, 3, 2)).toBe(96);
  });

  it('keeps the live adjusted-price ledger preview aligned with engine values', () => {
    // The public views already contain v3-adjusted values. Preview helpers must not scale them a second time.
    const price = 80, baseRent = 20;
    expect([0, 1, 2].map(level => marbleBuildCostAtPrice(price, level, 3))).toEqual([30, 50, 60]);
    expect([0, 1, 2, 3].map(level => marbleRentAtBase(baseRent, level, 3))).toEqual([20, 40, 60, 80]);
    expect(marbleCityValueAtPrice(price, 1, 3)).toBe(110);
    expect(marbleTakeoverPriceAtPrice(price, 1, 3)).toBe(220);
  });

  it('charges the same 300 salary on pass-start crossings for both engines', () => {
    const seed = seedForSum(2);
    let two: MarbleState = { ...marbleEngine.createInitialState(seed), positions: { p1: 39, p2: 0 } };
    let four = { ...fourMarbleEngine.createInitialState(seed), positions: { ...fourMarbleEngine.createInitialState(seed).positions, p1: 39 } };
    two = marbleEngine.applyAction(two, 'p1', { type: 'roll' });
    four = fourMarbleEngine.applyAction(four, 'p1', { type: 'roll' });
    expect(two.money.p1).toBe(3300);
    expect(four.money.p1).toBe(3300);
  });

  it('debits and previews the same first build after purchase on both routes', () => {
    let two: MarbleState = { ...marbleEngine.createInitialState(5), phase: 'decision', positions: { p1: 1, p2: 0 }, pendingTile: 1 };
    let four = { ...fourMarbleEngine.createInitialState(5), phase: 'decision' as const, positions: { ...fourMarbleEngine.createInitialState(5).positions, p1: 1 }, pendingTile: 1 };
    two = marbleEngine.applyAction(two, 'p1', { type: 'buy' });
    four = fourMarbleEngine.applyAction(four, 'p1', { type: 'buy' });
    expect(two.actionLog?.at(-1)).toMatchObject({ type: 'buy', amount: 80 });
    expect(four.actionLog.at(-1)).toMatchObject({ type: 'buy', amount: 80 });
    two = marbleEngine.applyAction(two, 'p1', { type: 'build', payload: { tile: 1 } });
    four = fourMarbleEngine.applyAction(four, 'p1', { type: 'build', payload: { tile: 1 } });
    expect(two.actionLog?.at(-1)).toMatchObject({ type: 'build', amount: 30 });
    expect(four.actionLog.at(-1)).toMatchObject({ type: 'build', amount: 30 });
    expect(marbleEngine.getPlayerView(two, 'p1').board.tiles[1]).toMatchObject({ houses: 1, nextRent: 60 });
    expect((fourMarbleEngine.getPlayerView(four, 'p1').panels[0].cards[1] as any).detail.ko).toContain('통행료 40');
  });

  it('keeps the new economy on the existing loan/liquidation debt path', () => {
    const seed = seedForSum(4);
    let s: MarbleState = { ...marbleEngine.createInitialState(seed), positions: { p1: 39, p2: 0 }, money: { p1: 0, p2: 4500 }, properties: { '3': { owner: 'p2', houses: 3 }, '16': { owner: 'p2', houses: 0 } } };
    s = marbleEngine.applyAction(s, 'p1', { type: 'roll' });
    expect(s).toMatchObject({ phase: 'debt', pendingPayment: { amount: 480, type: 'rent' }, result: null });
    expect(marbleEngine.validateAction(s, 'p1', { type: 'borrow' })).toBeNull();
    s = marbleEngine.applyAction(s, 'p1', { type: 'borrow' });
    expect(s).toMatchObject({ phase: 'main', money: { p1: 120, p2: 4980 }, debt: { p1: 330, p2: 0 } });
  });

  it('keeps saved v2 cash, prices, rents, build costs and salary unchanged', () => {
    const two = { ...marbleEngine.createInitialState(2), economicVersion: 2 as const, money: { p1: 1500, p2: 1500 } };
    const four = { ...fourMarbleEngine.createInitialState(2), economicVersion: 2 as const, money: { p1: 1500, p2: 1500, p3: 1500, p4: 1500 } };
    expect(marbleEngine.getPlayerView(two, 'p1').board.tiles[1]).toMatchObject({ price: 100, rent: 12 });
    expect((fourMarbleEngine.getPlayerView(four, 'p1') as any).publicBoard[1]).toMatchObject({ price: 100, rent: 12 });
    expect(marbleBuildCost(marbleEngine.getPlayerView(two, 'p1').board.tiles[1], 0, 2)).toBe(40);
  });
});

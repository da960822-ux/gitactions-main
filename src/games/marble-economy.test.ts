import { describe, expect, it } from 'vitest';
import { marbleBaseRentForPrice, marbleBuildCostForPrice, marbleCityValueForPrice, marbleEconomyConfig, marbleRentAtStage, marbleTakeoverPriceForValue } from './marble-economy';

describe('Marble economy configuration and calculations', () => {
  it('keeps legacy, v2, and current candidate rules explicitly versioned', () => {
    expect(marbleEconomyConfig.legacy.stageRentMultipliers).toEqual([1, 2, 4, 8]);
    expect(marbleEconomyConfig.v2.stageRentMultipliers).toEqual([1, 2, 4, 8]);
    expect(marbleEconomyConfig.v3.stageRentMultipliers).toEqual([1, 2, 3, 4]);
    expect(marbleBuildCostForPrice(100, 0)).toBe(100);
    expect(marbleBuildCostForPrice(100, 0, 2)).toBe(40);
    expect(marbleBuildCostForPrice(100, 0, 3)).toBe(40);
  });

  it('retains current v3 rent and investment examples while candidate numbers await source verification', () => {
    expect([100, 140, 260, 560].map(marbleBaseRentForPrice)).toEqual([20, 30, 60, 140]);
    expect([0, 1, 2].map(level => marbleBuildCostForPrice(560, level, 3))).toEqual([220, 340, 450]);
    expect(marbleRentAtStage(140, 3, 3, true, undefined, 2)).toBe(1120);
    expect(marbleCityValueForPrice(140, 2, 3)).toBe(280);
    expect(marbleTakeoverPriceForValue('property', 280, 2)).toBe(560);
    expect(marbleTakeoverPriceForValue('property', 700, 3)).toBeNull();
  });

  it('matches legacy linear levels and allows the board data to override a version ladder', () => {
    expect(marbleRentAtStage(20, 2, undefined, false)).toBe(60);
    expect(marbleRentAtStage(20, 2, 3, true, [1, 3, 5, 7])).toBe(100);
  });
});

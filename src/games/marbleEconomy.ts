import type { MarbleTile } from './marble';

export type MarbleEconomyVersion = 1 | 2 | 3;

// v3 is a compact rebalance of the existing 40-space board, not a copied price table.
export const MARBLE_ECONOMY_V3 = {
  startingCash: 3000,
  passStartSalary: 300,
  landPriceFactor: 0.8,
  buildFactors: [0.4, 0.6, 0.8],
  lowRentYield: 0.25,
  highRentYield: 0.3,
  stageMultipliers: [1, 2, 3, 4],
} as const;

const round10 = (value: number) => Math.round(value / 10) * 10;
export const marbleStartingCash = (version?: number) => version === 3 ? MARBLE_ECONOMY_V3.startingCash : 1500;
export const marblePassStartSalary = (version?: number) => version === 3 ? MARBLE_ECONOMY_V3.passStartSalary : 200;
export const marbleLandPrice = (tile: MarbleTile, version?: number) => version === 3 ? Math.max(50, round10((tile.price ?? 0) * MARBLE_ECONOMY_V3.landPriceFactor)) : tile.price ?? 0;

export function marbleBaseRent(tile: MarbleTile, version?: number) {
  if (version !== 3) return tile.rent ?? 0;
  const originalPrice = tile.price ?? 0;
  const yieldAtPrice = MARBLE_ECONOMY_V3.lowRentYield + Math.max(0, Math.min(1, (originalPrice - 100) / (560 - 100))) * (MARBLE_ECONOMY_V3.highRentYield - MARBLE_ECONOMY_V3.lowRentYield);
  return Math.max(10, round10(marbleLandPrice(tile, version) * yieldAtPrice));
}

export function marbleRentAtBase(baseRent: number, houses: number, version?: number, monopolyMultiplier = 1, modern = true) {
  const levelMultiplier = version === 3 && modern
    ? MARBLE_ECONOMY_V3.stageMultipliers[Math.max(0, Math.min(3, Math.trunc(houses)))]
    : modern ? [1, 2, 4, 8][houses] ?? 1 : houses + 1;
  return baseRent * levelMultiplier * monopolyMultiplier;
}
export const marbleRentAmount = (tile: MarbleTile, houses: number, version?: number, monopolyMultiplier = 1, modern = true) => marbleRentAtBase(marbleBaseRent(tile, version), houses, version, monopolyMultiplier, modern);

/** Calculate against an already version-adjusted display price (used by views). */
export function marbleBuildCostAtPrice(price: number, level: number, version?: number) {
  if (version === 3) {
    const factor = MARBLE_ECONOMY_V3.buildFactors[Math.max(0, Math.min(2, Math.trunc(level)))];
    return Math.max(30, round10(Math.max(0, price) * factor));
  }
  if (version !== 2) return 100;
  const factor = [0.4, 0.6, 0.8][Math.max(0, Math.min(2, Math.trunc(level)))] ?? 0.4;
  return Math.max(40, round10(Math.max(0, price) * factor));
}
export function marbleBuildCostForVersion(tile: MarbleTile, level: number, version?: number) {
  return marbleBuildCostAtPrice(marbleLandPrice(tile, version), level, version);
}
export function marbleCityValueAtPrice(price: number, houses: number, version?: number) {
  return price + Array.from({ length: Math.max(0, houses) }, (_, level) => marbleBuildCostAtPrice(price, level, version)).reduce((sum, cost) => sum + cost, 0);
}
export const marbleTakeoverPriceAtPrice = (price: number, houses: number, version?: number) => houses < 3 ? 2 * marbleCityValueAtPrice(price, houses, version) : null;

export const marbleAiReserve = (version?: number) => version === 3 ? Math.round(marblePassStartSalary(version) / 2) : 200;

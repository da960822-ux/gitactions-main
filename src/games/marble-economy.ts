export const marbleEconomyConfig = {
  legacy: {
    baseRent: 'city-table',
    buildCost: { flat: 100 },
    stageRentMultipliers: [1, 2, 4, 8],
  },
  v2: {
    baseRent: 'city-table',
    buildCost: { factors: [0.4, 0.6, 0.8], minimum: 40, rounding: 10 },
    stageRentMultipliers: [1, 2, 4, 8],
  },
  v3: {
    // Current QA candidate only; replace these values after the edition-specific reference audit.
    baseRent: { kind: 'linear-yield', lowPrice: 100, highPrice: 560, lowYield: 0.2, highYield: 0.25, minimum: 10, rounding: 10 },
    buildCost: { factors: [0.4, 0.6, 0.8], minimum: 40, rounding: 10 },
    stageRentMultipliers: [1, 2, 3, 4],
  },
} as const;

export const marbleRentMultipliers = marbleEconomyConfig.v3.stageRentMultipliers;

function rulesForVersion(economicVersion?: number) {
  if (economicVersion === 3) return marbleEconomyConfig.v3;
  if (economicVersion === 2) return marbleEconomyConfig.v2;
  return marbleEconomyConfig.legacy;
}

export function marbleBaseRentForPrice(rawPrice: number) {
  const { lowPrice, highPrice, lowYield, highYield, minimum, rounding } = marbleEconomyConfig.v3.baseRent;
  const price = Math.max(0, rawPrice);
  const progress = Math.max(0, Math.min(1, (price - lowPrice) / (highPrice - lowPrice)));
  const yieldRate = lowYield + (highYield - lowYield) * progress;
  return Math.max(minimum, Math.round((price * yieldRate) / rounding) * rounding);
}

export function marbleBuildCostForPrice(rawPrice: number, level: number, economicVersion?: number) {
  const rules = rulesForVersion(economicVersion).buildCost;
  if ('flat' in rules) return rules.flat;
  const index = Math.max(0, Math.min(rules.factors.length - 1, Math.trunc(level)));
  const factor = rules.factors[index] ?? 0;
  return Math.max(rules.minimum, Math.round((Math.max(0, rawPrice) * factor) / rules.rounding) * rules.rounding);
}

export function marbleRentAtStage(baseRent: number, houses: number, economicVersion?: number, modern = true, overrides?: readonly number[], groupMultiplier = 1) {
  const versionRules = rulesForVersion(economicVersion);
  const multiplier = modern
    ? (overrides ?? versionRules.stageRentMultipliers)[houses] ?? 1
    : houses + 1;
  return baseRent * multiplier * groupMultiplier;
}

export function marbleCityValueForPrice(price: number, houses: number, economicVersion?: number) {
  return price + Array.from({ length: houses }, (_, level) => marbleBuildCostForPrice(price, level, economicVersion)).reduce((sum, cost) => sum + cost, 0);
}

export function marbleTakeoverPriceForValue(kind: string, cityValue: number, houses: number): number | null {
  return kind === 'property' && houses < 3 ? 2 * cityValue : null;
}

import type { MarbleTile } from './marble';
import type { MarbleConstruction, MarbleConstructionSelection } from './marbleConstruction';
import { classicEconomyProvenance, classicSourceCities, classicSourceTourism } from './marbleClassicEconomyData';

export const CLASSIC_ECONOMY_PROFILE = 'mobile-2013-first-x3-v1' as const;
export type ClassicEconomyProfile = typeof CLASSIC_ECONOMY_PROFILE;
export const classicEconomyConfig = {
  id: CLASSIC_ECONOMY_PROFILE,
  sourceClass: 'first', classMultiplier: 5, rawPerMan: 10000, displayPerMan: 3,
  startingCash: 3000, passStartSalary: 450,
  // Fees are not in the extracted workbook. Null is not a free action.
  travelFare: null, jailEscapeFee: null, expoFee: null,
  provenance: classicEconomyProvenance,
} as const;
const scaleRaw = (raw: number) => raw * classicEconomyConfig.displayPerMan / classicEconomyConfig.rawPerMan;
const scaleBase = (base: number) => scaleRaw(base * classicEconomyConfig.classMultiplier);
export interface ClassicCityEconomy {
  profile: ClassicEconomyProfile; city: string; sourceCostRow: number; sourceTollRow: number;
  landCost: number; buildCosts: { villa: number; building: number; hotel: number }; landmarkCost: number;
  tollByMask: (number | null)[]; inferredTollMasks: number[]; landmarkToll: number;
  saleByMask: number[]; landmarkSale: number;
}
export interface ClassicTourismEconomy {
  profile: ClassicEconomyProfile; purchaseCost: number; tollStages: readonly number[]; colorMultiplierApplies: false;
}
export const classicCityEconomies: Readonly<Record<string, ClassicCityEconomy>> = Object.fromEntries(classicSourceCities.map(([city, sourceCostRow, sourceTollRow, costs, tolls]) => {
  const [land, villa, building, hotel, landmark] = costs;
  const tollByMask: (number | null)[] = Array(8).fill(null);
  [0, 1, 3, 7].forEach((mask, index) => { tollByMask[mask] = scaleBase(tolls[index]); });
  // Missing combinations are an additive reconstruction, crosschecked only against2015 Cairo building-only56,000.
  for (const mask of [2, 4, 5, 6]) tollByMask[mask] = scaleBase(tolls[0] + (mask & 1 ? tolls[1] - tolls[0] : 0) + (mask & 2 ? tolls[2] - tolls[1] : 0) + (mask & 4 ? tolls[3] - tolls[2] : 0));
  const saleByMask = Array.from({ length: 8 }, (_, mask) => scaleRaw(Math.floor((land + (mask & 1 ? villa : 0) + (mask & 2 ? building : 0) + (mask & 4 ? hotel : 0)) * 5 / 2)));
  return [city, {
    profile: CLASSIC_ECONOMY_PROFILE, city, sourceCostRow, sourceTollRow,
    landCost: scaleBase(land), buildCosts: { villa: scaleBase(villa), building: scaleBase(building), hotel: scaleBase(hotel) }, landmarkCost: scaleBase(landmark),
    tollByMask, inferredTollMasks: [2, 4, 5, 6], landmarkToll: scaleBase(tolls[4]), saleByMask, landmarkSale: saleByMask[7],
  }];
}));
export const classicTourismEconomy: ClassicTourismEconomy = {
  profile: CLASSIC_ECONOMY_PROFILE, purchaseCost: scaleBase(classicSourceTourism.purchase), tollStages: classicSourceTourism.tollStages.map(scaleBase), colorMultiplierApplies: false,
};
export function classicBuildingMask(property: MarbleConstruction) {
  return (property.buildings ?? []).reduce((mask, type) => mask | ({ villa: 1, building: 2, hotel: 4 }[type]), 0);
}
export function classicConstructionCost(economy: ClassicCityEconomy, selection: MarbleConstructionSelection) {
  return selection.landmark ? economy.landmarkCost : selection.buildings.reduce((sum, type) => sum + economy.buildCosts[type], 0);
}
export const classicInvestment = (economy: ClassicCityEconomy, property: MarbleConstruction) => economy.landCost + classicConstructionCost(economy, { buildings: property.buildings ?? [] }) + (property.landmark ? economy.landmarkCost : 0);
export function classicToll(economy: ClassicCityEconomy, property: MarbleConstruction, multiplier = 1): number | null {
  const base = property.landmark ? economy.landmarkToll : economy.tollByMask[classicBuildingMask(property)];
  return base == null ? null : base * multiplier;
}
export const classicSaleValue = (economy: ClassicCityEconomy, property: MarbleConstruction) => property.landmark ? economy.landmarkSale : economy.saleByMask[classicBuildingMask(property)];
export const classicTakeoverPrice = (economy: ClassicCityEconomy, property: MarbleConstruction) => property.landmark ? null : 2 * classicInvestment(economy, property);

// Adapt only the playable projection: source tables and unversioned saves retain their original economy.
export function marbleRentBoard(board: MarbleTile[], rentVersion?: number, constructionPriceVersion?: number): MarbleTile[] {
  if (rentVersion !== 2 && constructionPriceVersion !== 2) return board;
  return board.map(tile => {
    if (tile.cityEconomy) {
      const source = tile.cityEconomy;
      const buildCosts = constructionPriceVersion === 2 ? { villa: Math.round(source.buildCosts.villa * .8), building: Math.round(source.buildCosts.building * .8), hotel: Math.round(source.buildCosts.hotel * .8) } : source.buildCosts;
      const saleByMask = constructionPriceVersion === 2 ? Array.from({ length: 8 }, (_, mask) => (source.landCost + (mask & 1 ? buildCosts.villa : 0) + (mask & 2 ? buildCosts.building : 0) + (mask & 4 ? buildCosts.hotel : 0)) / 2) : source.saleByMask;
      const cityEconomy = { ...source, buildCosts, saleByMask, landmarkSale: saleByMask[7],
        landmarkCost: constructionPriceVersion === 2 ? Math.round(source.landmarkCost * .8) : source.landmarkCost,
        tollByMask: rentVersion === 2 ? source.tollByMask.map(toll => toll == null ? null : Math.round(toll * .8)) : source.tollByMask,
        landmarkToll: rentVersion === 2 ? Math.round(source.landmarkToll * .7) : source.landmarkToll };
      return { ...tile, cityEconomy, rent: cityEconomy.tollByMask[0]! };
    }
    if (tile.tourismEconomy && rentVersion === 2) {
      const tourismEconomy = { ...tile.tourismEconomy, tollStages: tile.tourismEconomy.tollStages.map(toll => Math.round(toll * .8)) };
      return { ...tile, tourismEconomy, rent: tourismEconomy.tollStages[0] };
    }
    return tile;
  });
}

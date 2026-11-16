import { classicConstructionCost, classicInvestment, classicToll } from './marbleClassicEconomy';
import type { MarbleTile } from './marble';
import { marbleBaseRent, marbleLandPrice } from './marbleEconomy';

// Provisional custom adaptation: source-calibrated values must be approved before publication.
export const MARBLE_CONSTRUCTION_ECONOMY = { costFactors: { villa: .4, building: .6, hotel: .8, landmark: .8 }, rentIncrements: { villa: .5, building: 1, hotel: 1.5 }, landmarkRentMultiplier: 5 } as const;
export const marbleBuildingTypes = ['villa', 'building', 'hotel'] as const;
export type MarbleBuildingType = typeof marbleBuildingTypes[number];
export type MarbleConstruction = { houses: number; buildings?: MarbleBuildingType[]; landmark?: boolean };
export type MarbleConstructionSelection = { buildings: MarbleBuildingType[]; landmark?: never } | { landmark: true; buildings?: never };
export const constructionReady = (p?: MarbleConstruction) => !!p && !p.landmark && marbleBuildingTypes.every(type => p.buildings?.includes(type));
export const isLandmark = (p: MarbleConstruction, version?: number) => version === 2 ? !!p.landmark : p.houses === 3;
export function constructionOptions(p: MarbleConstruction | undefined, laps: number, landmarkEligible: boolean): MarbleConstructionSelection[] {
  if (p?.landmark) return [];
  if (constructionReady(p)) return landmarkEligible ? [{ landmark: true }] : [];
  const available = marbleBuildingTypes.filter(type => !p?.buildings?.includes(type) && (type !== 'hotel' || laps >= 1));
  return Array.from({ length: (1 << available.length) - 1 }, (_, i) => ({ buildings: available.filter((_, bit) => ((i + 1) & (1 << bit)) !== 0) }));
}
export function constructionSelectionMatches(selection: Record<string, unknown>, option: MarbleConstructionSelection) {
  if (option.landmark) return selection.landmark === true && selection.buildings === undefined;
  return selection.landmark === undefined && Array.isArray(selection.buildings) && selection.buildings.length === option.buildings.length && new Set(selection.buildings).size === selection.buildings.length && option.buildings.every(type => (selection.buildings as unknown[]).includes(type));
}
export const constructionCostAtPrice = (price: number, selection: MarbleConstructionSelection, _version?: number) => {
  const cost = (type: MarbleBuildingType | 'landmark') => Math.max(30, Math.round(price * MARBLE_CONSTRUCTION_ECONOMY.costFactors[type] / 10) * 10);
  return selection.landmark ? cost('landmark') : selection.buildings.reduce((sum, type) => sum + cost(type), 0);
};
export const constructionCost = (tile: MarbleTile, selection: MarbleConstructionSelection, version?: number) => tile.cityEconomy ? classicConstructionCost(tile.cityEconomy, selection) : constructionCostAtPrice(marbleLandPrice(tile, version), selection, version);
export function applyConstruction<T extends MarbleConstruction>(property: T, selection: MarbleConstructionSelection): T {
  const buildings = marbleBuildingTypes.filter(type => property.buildings?.includes(type) || selection.buildings?.includes(type));
  const landmark = !!property.landmark || !!selection.landmark;
  return { ...property, buildings, landmark, houses: landmark ? 3 : buildings.length === 3 ? 2 : buildings.length ? 1 : 0 };
}
export const constructionValueAtPrice = (price: number, p: MarbleConstruction, version?: number) => price + constructionCostAtPrice(price, { buildings: p.buildings ?? [] }, version) + (p.landmark ? constructionCostAtPrice(price, { landmark: true }, version) : 0);
export const constructionValue = (tile: MarbleTile, p: MarbleConstruction, version?: number) => tile.cityEconomy ? classicInvestment(tile.cityEconomy, p) : constructionValueAtPrice(marbleLandPrice(tile, version), p, version);
export const constructionRentAtBase = (base: number, p: MarbleConstruction, multiplier = 1) => Math.round(base * (p.landmark ? MARBLE_CONSTRUCTION_ECONOMY.landmarkRentMultiplier : 1 + (p.buildings ?? []).reduce((sum, type) => sum + MARBLE_CONSTRUCTION_ECONOMY.rentIncrements[type], 0)) * multiplier);
export function constructionRent(tile: MarbleTile, p: MarbleConstruction, version?: number, multiplier = 1) {
  if (!tile.cityEconomy) return constructionRentAtBase(marbleBaseRent(tile, version), p, multiplier);
  const toll = classicToll(tile.cityEconomy, p, multiplier);
  if (toll == null) throw new Error('Unverified classic building combination toll');
  return toll;
}

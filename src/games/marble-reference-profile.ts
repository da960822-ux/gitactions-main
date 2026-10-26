/**
 * Research-only reference profile. This is not wired into marbleEngine: rent and
 * salary tables are still incomplete, and this community-sourced 2013 mobile
 * edition must not be blended into the existing 40-space PC-like routes.
 */
export type ClassicMarbleStructure = 'villa' | 'building' | 'hotel' | 'landmark';
export type ClassicMarbleBuildings = Readonly<Partial<Record<ClassicMarbleStructure, boolean>>>;
export type ClassicMarblePropertyState = Readonly<{
  ownerId: string | null;
  /** Building types are independent booleans, not a single sequential level. */
  buildings: ClassicMarbleBuildings;
}>;

export type ClassicMarbleCity = {
  name: string;
  land: number;
  construction: Readonly<Record<ClassicMarbleStructure, number>>;
};

export type ClassicMarbleCell =
  | { kind: 'start'; name: string }
  | { kind: 'city'; name: string; city: string }
  | { kind: 'tourism'; name: string; purchasable: false }
  | { kind: 'special'; name: string; effect: 'bonus-game' | 'island' | 'card' | 'olympic' | 'world-travel' | 'tax' };

export const classicMarbleReferenceProfile = {
  id: 'kakao-world-business-2013-zero-discount',
  label: 'Kakao mobile · World map · Business class',
  referenceVersion: 1,
  effectiveDate: '2013-12-01',
  currency: 'marble',
  source: {
    constructionTable: 'https://appdata.hungryapp.co.kr/data_file/data_img/201312/01/Wjg761F138583142696648188.png',
    startingCash: 'https://m.hungryapp.co.kr/bbs/bbs_view.php?durl=YmNvZGU9ZXZlcm1hcnZlbCZwaWQ9MzUwOTg2JnVzZXI9',
    mapOrder: 'https://tcatmon.com/wiki/모두의마블_for_Kakao',
  },
  provenance: {
    constructionTable: 'Secondary community calculator screenshot; transcribed from image; zero construction discount; source author notes possible minor error.',
    startingCash: 'Independent 2014-12-14 community post reporting historical 5,000,000 starting cash.',
    mapOrder: 'Secondary map listing; 32-cell World map order.',
    limitations: 'Historical Korean Kakao mobile edition only. Not an official current-price table. No verified salary schedule or class-normalized rent/toll table yet.',
  },
  readiness: {
    activation: 'blocked-pending-rent-and-salary-reference',
    salary: 'missing',
    rent: 'missing',
    class: 'business',
    constructionDiscount: 0,
  },
  startingCashHistorical: { amount: 5_000_000, sourceDate: '2014-12-14' },
  rules: {
    ordinaryPropertyAcquisitionMultiplier: 2,
    saleRecoveryNumerator: 1,
    saleRecoveryDenominator: 2,
    landmarkSurchargeRecoveredOnSale: false,
    landmarkSurchargeIncludedInAcquisitionBasis: false,
    tourismPurchasable: false,
    ownArrivalRequiredForConstruction: true,
    constructionMinimumOwnLaps: { villa: 0, building: 1, hotel: 2, landmark: 3 },
    buildingSelection: 'independent-set-villa-building-hotel',
    landmarkRequiresAllOrdinaryBuildings: true,
  },
  cities: [
    { name: '방콕', land: 50000, construction: { villa: 25000, building: 75000, hotel: 125000, landmark: 125000 } },
    { name: '베이징', land: 65000, construction: { villa: 25000, building: 75000, hotel: 125000, landmark: 125000 } },
    { name: '타이페이', land: 120000, construction: { villa: 50000, building: 150000, hotel: 250000, landmark: 250000 } },
    { name: '두바이', land: 120000, construction: { villa: 50000, building: 150000, hotel: 250000, landmark: 250000 } },
    { name: '카이로', land: 135000, construction: { villa: 50000, building: 150000, hotel: 250000, landmark: 250000 } },
    { name: '도쿄', land: 180000, construction: { villa: 75000, building: 225000, hotel: 375000, landmark: 375000 } },
    { name: '시드니', land: 180000, construction: { villa: 75000, building: 225000, hotel: 375000, landmark: 375000 } },
    { name: '퀘벡', land: 235000, construction: { villa: 100000, building: 300000, hotel: 500000, landmark: 500000 } },
    { name: '상파울루', land: 250000, construction: { villa: 100000, building: 300000, hotel: 500000, landmark: 500000 } },
    { name: '프라하', land: 295000, construction: { villa: 125000, building: 375000, hotel: 625000, landmark: 625000 } },
    { name: '베를린', land: 310000, construction: { villa: 125000, building: 375000, hotel: 625000, landmark: 625000 } },
    { name: '모스크바', land: 350000, construction: { villa: 150000, building: 450000, hotel: 750000, landmark: 750000 } },
    { name: '제네바', land: 365000, construction: { villa: 150000, building: 450000, hotel: 750000, landmark: 750000 } },
    { name: '로마', land: 365000, construction: { villa: 150000, building: 450000, hotel: 750000, landmark: 750000 } },
    { name: '런던', land: 410000, construction: { villa: 175000, building: 525000, hotel: 875000, landmark: 875000 } },
    { name: '파리', land: 425000, construction: { villa: 175000, building: 525000, hotel: 875000, landmark: 875000 } },
    { name: '뉴욕', land: 480000, construction: { villa: 200000, building: 600000, hotel: 1000000, landmark: 1000000 } },
    { name: '서울', land: 500000, construction: { villa: 200000, building: 600000, hotel: 1000000, landmark: 1000000 } },
  ] satisfies readonly ClassicMarbleCity[],
  tourism: [
    { name: '독도', land: 250000 },
    { name: '하와이', land: 250000 },
    { name: '푸켓', land: 250000 },
    { name: '발리', land: 250000 },
    { name: '타히티', land: 250000 },
  ] as const,
  map: [
    { kind: 'start', name: '출발' },
    { kind: 'city', name: '방콕', city: '방콕' },
    { kind: 'special', name: '보너스게임', effect: 'bonus-game' },
    { kind: 'city', name: '베이징', city: '베이징' },
    { kind: 'tourism', name: '독도', purchasable: false },
    { kind: 'city', name: '타이페이', city: '타이페이' },
    { kind: 'city', name: '두바이', city: '두바이' },
    { kind: 'city', name: '카이로', city: '카이로' },
    { kind: 'special', name: '무인도', effect: 'island' },
    { kind: 'tourism', name: '발리', purchasable: false },
    { kind: 'city', name: '도쿄', city: '도쿄' },
    { kind: 'city', name: '시드니', city: '시드니' },
    { kind: 'special', name: '포츈카드', effect: 'card' },
    { kind: 'city', name: '퀘벡', city: '퀘벡' },
    { kind: 'tourism', name: '하와이', purchasable: false },
    { kind: 'city', name: '상파울루', city: '상파울루' },
    { kind: 'special', name: '올림픽', effect: 'olympic' },
    { kind: 'city', name: '프라하', city: '프라하' },
    { kind: 'tourism', name: '푸켓', purchasable: false },
    { kind: 'city', name: '베를린', city: '베를린' },
    { kind: 'special', name: '포츈카드', effect: 'card' },
    { kind: 'city', name: '모스크바', city: '모스크바' },
    { kind: 'city', name: '제네바', city: '제네바' },
    { kind: 'city', name: '로마', city: '로마' },
    { kind: 'special', name: '세계여행', effect: 'world-travel' },
    { kind: 'tourism', name: '타히티', purchasable: false },
    { kind: 'city', name: '런던', city: '런던' },
    { kind: 'city', name: '파리', city: '파리' },
    { kind: 'special', name: '포츈카드', effect: 'card' },
    { kind: 'city', name: '뉴욕', city: '뉴욕' },
    { kind: 'special', name: '국세청', effect: 'tax' },
    { kind: 'city', name: '서울', city: '서울' },
  ] satisfies readonly ClassicMarbleCell[],
} as const;

const cityByName = new Map(classicMarbleReferenceProfile.cities.map(city => [city.name, city]));

/** Costs are independent set members; for example a hotel can coexist with a villa. */
export function classicMarbleInvestment(cityName: string, buildings: ClassicMarbleBuildings = {}) {
  const city = cityByName.get(cityName);
  if (!city) return null;
  return city.land + (['villa', 'building', 'hotel'] as const).reduce((total, structure) => total + (buildings[structure] ? city.construction[structure] : 0), 0);
}

export function classicMarbleConstructionCost(cityName: string, structure: ClassicMarbleStructure) {
  return cityByName.get(cityName)?.construction[structure] ?? null;
}

export function classicMarbleLandmarkCost(cityName: string) {
  return classicMarbleConstructionCost(cityName, 'landmark');
}

export function classicMarbleAcquisitionPrice(cityName: string, buildings: ClassicMarbleBuildings = {}) {
  const investment = classicMarbleInvestment(cityName, buildings);
  return investment === null ? null : investment * classicMarbleReferenceProfile.rules.ordinaryPropertyAcquisitionMultiplier;
}

export function classicMarbleSaleValue(cityName: string, buildings: ClassicMarbleBuildings = {}) {
  const investment = classicMarbleInvestment(cityName, buildings);
  return investment === null ? null : Math.floor(investment * classicMarbleReferenceProfile.rules.saleRecoveryNumerator / classicMarbleReferenceProfile.rules.saleRecoveryDenominator);
}

export function classicMarbleAvailableStructures(buildings: ClassicMarbleBuildings, completedOwnLaps: number, isOwnArrival: boolean): ClassicMarbleStructure[] {
  if (!isOwnArrival) return [];
  const rules = classicMarbleReferenceProfile.rules.constructionMinimumOwnLaps;
  const available: ClassicMarbleStructure[] = [];
  for (const structure of ['villa', 'building', 'hotel'] as const) {
    if (!buildings[structure] && completedOwnLaps >= rules[structure]) available.push(structure);
  }
  const ordinaryComplete = (['villa', 'building', 'hotel'] as const).every(structure => buildings[structure]);
  if (ordinaryComplete && !buildings.landmark && completedOwnLaps >= rules.landmark) available.push('landmark');
  return available;
}

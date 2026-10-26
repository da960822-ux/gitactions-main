/**
 * Versioned historical profile for the newly started 2013 Kakao World/Business route.
 * Unverified mechanics stay marked here rather than inheriting unrelated modern rules.
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
  /** Business-class tolls: bare land, villa, building, hotel, landmark. */
  tollByCanonicalStage: readonly [number, number, number, number, number];
};

export type ClassicMarbleClass = 'economy' | 'business' | 'first';

export type ClassicMarbleCell =
  | { kind: 'start'; name: string }
  | { kind: 'city'; name: string; city: string }
  | { kind: 'tourism'; name: string; purchasableFromBank: true; acquirableFromPlayer: false }
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
    tourismRules: '2013 XLS supplied in audit: https://cafe.naver.com/momakakao/124693',
    olympicsRules: 'https://www.inven.co.kr/board/mogong/4222/601 and https://www.inven.co.kr/board/mogong/4222/578 (2015-04 community reports)',
    launchCashScreenshot: 'Supplied verified launch-day class-selection screenshot; direct URL not included in this handoff.',
    cityTolls: 'https://cafe.naver.com/momakakao/124693',
    partialBuildingMaskObservation: 'https://upload2.inven.co.kr/upload/2015/03/27/bbs/i12866364001.png',
    tourismRentRules: '2013-12-01 XLS: https://cafe.naver.com/momakakao/124693; clarifying modern community description: https://www.namu.moe/w/모두의마블%20for%20kakao/규칙',
    tourismVictory: 'https://www.inven.co.kr/board/mogong/4222/402',
  },
  provenance: {
    constructionTable: 'Secondary community calculator screenshot; transcribed from image; zero construction discount; source author notes possible minor error.',
    startingCash: 'Independent 2014-12-14 community post reporting historical 5,000,000 starting cash.',
    mapOrder: 'Secondary map listing; 32-cell World map order.',
    partialBuildingMaskObservation: 'Inven community screenshot of Cairo, Economy class: villa unchecked, building selected, hotel locked; observed toll 56,000. This corroborates this one partial mask only.',
    tourismRentRules: 'XLS class rows separate blue islands by owned count and pink beaches by visit count. Modern community write-up says the visitor pays the old amount before a beach tier advances; treated as secondary explanation, not direct 2013 screenshot proof.',
    tourismVisitDefaults: 'Beach stage starts at 1 and unowned visits advance it by default for implementation; these two details were not directly verified in the supplied source.',
    tourismVictory: '2015 mobile community explanation says owning all five tourism sites wins immediately.',
    limitations: 'Historical Korean Kakao mobile edition only. Community documents are not official current specifications. Salary is inferred, not observed. Some noncanonical building-mask tolls remain additive inference; tourism beach initial/unowned visit defaults remain assumptions. This is not a claim of complete rule reproduction.',
  },
  readiness: {
    activation: 'active-for-new-route-v4-and-solo-team-route; legacy-saves-retain-old-profile',
    salary: 'inferred-not-authoritative',
    cityRent: 'verified-business-canonical-build-stages',
    partialMaskCityRent: 'direct-observation-for-cairo-building-only; additive-inference-for-other-noncanonical-masks',
    tourismRentSchedule: 'verified-with-distinct-island-and-beach-selectors',
    pricesAndConstruction: 'verified-for-this-historical-edition',
    class: 'business',
    constructionDiscount: 0,
  },
  startingCash: { amount: 5_000_000, status: 'confirmed-by-launch-screenshot-and-2014-community-post', sourceDate: '2014-12-14' },
  salaryReference: { amount: 750_000, status: 'inferred-only', basis: 'class-proportional estimate; not direct evidence' },
  rules: {
    classTollMultipliers: { economy: 1, business: 2.5, first: 5 },
    tollBaseClass: 'business',
    cityTollStageNames: ['land', 'villa', 'building', 'hotel', 'landmark'],
    cityTollBuildingMasks: [[], ['villa'], ['villa', 'building'], ['villa', 'building', 'hotel'], ['villa', 'building', 'hotel', 'landmark']],
    partialMaskTollRule: 'sum-per-building-increments-derived-from-canonical-table',
    cityGroupMonopolyMultiplier: 1,
    ordinaryPropertyAcquisitionMultiplier: 2,
    saleRecoveryNumerator: 1,
    saleRecoveryDenominator: 2,
    landmarkSurchargeRecoveredOnSale: false,
    landmarkSurchargeIncludedInAcquisitionBasis: false,
    tourismBankPurchasePrice: 250_000,
    tourismAcquirableFromPlayer: false,
    tourismRentSchedule: [200_000, 400_000, 800_000],
    tourismGroupMonopolyMultiplier: 1,
    tourismIslandRentSelector: 'same-owner-island-count-1-to-3',
    tourismBeachRentSelector: 'per-site-visit-stage-1-to-3; increase-after-visitor-payment',
    tourismBeachInitialStage: 1,
    tourismUnownedVisitAdvancesBeach: 'assumed',
    islandEscapeFee: { amount: 500_000, status: 'inferred-class-proportional-not-enabled' },
    olympicsSelector: 'one-global-hosted-property; multiplier advances 2-to-5; next host replaces prior location',
    tourismAllFiveImmediateWin: true,
    ownArrivalRequiredForConstruction: true,
    constructionMinimumOwnLaps: { villa: 0, building: 1, hotel: 2, landmark: 3 },
    buildingSelection: 'independent-set-villa-building-hotel',
    landmarkRequiresAllOrdinaryBuildings: true,
  },
  cities: [
    { name: '방콕', land: 50000, construction: { villa: 25000, building: 75000, hotel: 125000, landmark: 125000 }, tollByCanonicalStage: [5000, 20000, 70000, 210000, 835000] },
    { name: '베이징', land: 65000, construction: { villa: 25000, building: 75000, hotel: 125000, landmark: 125000 }, tollByCanonicalStage: [5000, 25000, 80000, 230000, 855000] },
    { name: '타이페이', land: 120000, construction: { villa: 50000, building: 150000, hotel: 250000, landmark: 250000 }, tollByCanonicalStage: [15000, 60000, 175000, 475000, 1600000] },
    { name: '두바이', land: 120000, construction: { villa: 50000, building: 150000, hotel: 250000, landmark: 250000 }, tollByCanonicalStage: [15000, 60000, 175000, 475000, 1600000] },
    { name: '카이로', land: 135000, construction: { villa: 50000, building: 150000, hotel: 250000, landmark: 250000 }, tollByCanonicalStage: [20000, 70000, 190000, 500000, 1625000] },
    { name: '도쿄', land: 180000, construction: { villa: 75000, building: 225000, hotel: 375000, landmark: 375000 }, tollByCanonicalStage: [35000, 115000, 325000, 875000, 2375000] },
    { name: '시드니', land: 180000, construction: { villa: 75000, building: 225000, hotel: 375000, landmark: 375000 }, tollByCanonicalStage: [35000, 115000, 325000, 875000, 2375000] },
    { name: '퀘벡', land: 235000, construction: { villa: 100000, building: 300000, hotel: 500000, landmark: 500000 }, tollByCanonicalStage: [50000, 165000, 450000, 1125000, 2875000] },
    { name: '상파울루', land: 250000, construction: { villa: 100000, building: 300000, hotel: 500000, landmark: 500000 }, tollByCanonicalStage: [60000, 180000, 475000, 1175000, 2925000] },
    { name: '프라하', land: 295000, construction: { villa: 125000, building: 375000, hotel: 625000, landmark: 625000 }, tollByCanonicalStage: [80000, 255000, 700000, 1625000, 3500000] },
    { name: '베를린', land: 310000, construction: { villa: 125000, building: 375000, hotel: 625000, landmark: 625000 }, tollByCanonicalStage: [85000, 270000, 700000, 1675000, 3550000] },
    { name: '모스크바', land: 350000, construction: { villa: 150000, building: 450000, hotel: 750000, landmark: 750000 }, tollByCanonicalStage: [110000, 325000, 825000, 1975000, 3850000] },
    { name: '제네바', land: 365000, construction: { villa: 150000, building: 450000, hotel: 750000, landmark: 750000 }, tollByCanonicalStage: [120000, 350000, 900000, 2075000, 3950000] },
    { name: '로마', land: 365000, construction: { villa: 150000, building: 450000, hotel: 750000, landmark: 750000 }, tollByCanonicalStage: [120000, 350000, 900000, 2075000, 3950000] },
    { name: '런던', land: 410000, construction: { villa: 175000, building: 525000, hotel: 875000, landmark: 875000 }, tollByCanonicalStage: [140000, 450000, 1150000, 2650000, 4400000] },
    { name: '파리', land: 425000, construction: { villa: 175000, building: 525000, hotel: 875000, landmark: 875000 }, tollByCanonicalStage: [150000, 475000, 1200000, 2750000, 4500000] },
    { name: '뉴욕', land: 480000, construction: { villa: 200000, building: 600000, hotel: 1000000, landmark: 1000000 }, tollByCanonicalStage: [180000, 550000, 1350000, 3050000, 4550000] },
    { name: '서울', land: 500000, construction: { villa: 200000, building: 600000, hotel: 1000000, landmark: 1000000 }, tollByCanonicalStage: [200000, 600000, 1450000, 3200000, 4700000] },
  ] satisfies readonly ClassicMarbleCity[],
  tourism: [
    { name: '독도', group: 'island', rentMode: 'owner-count', bankPurchasePrice: 250000, playerAcquisitionAllowed: false, rentSchedule: [200000, 400000, 800000] },
    { name: '하와이', group: 'island', rentMode: 'owner-count', bankPurchasePrice: 250000, playerAcquisitionAllowed: false, rentSchedule: [200000, 400000, 800000] },
    { name: '푸켓', group: 'island', rentMode: 'owner-count', bankPurchasePrice: 250000, playerAcquisitionAllowed: false, rentSchedule: [200000, 400000, 800000] },
    { name: '발리', group: 'beach', rentMode: 'visit-stage', bankPurchasePrice: 250000, playerAcquisitionAllowed: false, initialVisitStage: 1, rentSchedule: [200000, 400000, 800000] },
    { name: '타히티', group: 'beach', rentMode: 'visit-stage', bankPurchasePrice: 250000, playerAcquisitionAllowed: false, initialVisitStage: 1, rentSchedule: [200000, 400000, 800000] },
  ] as const,
  map: [
    { kind: 'start', name: '출발' },
    { kind: 'city', name: '방콕', city: '방콕' },
    { kind: 'special', name: '보너스게임', effect: 'bonus-game' },
    { kind: 'city', name: '베이징', city: '베이징' },
    { kind: 'tourism', name: '독도', purchasableFromBank: true, acquirableFromPlayer: false },
    { kind: 'city', name: '타이페이', city: '타이페이' },
    { kind: 'city', name: '두바이', city: '두바이' },
    { kind: 'city', name: '카이로', city: '카이로' },
    { kind: 'special', name: '무인도', effect: 'island' },
    { kind: 'tourism', name: '발리', purchasableFromBank: true, acquirableFromPlayer: false },
    { kind: 'city', name: '도쿄', city: '도쿄' },
    { kind: 'city', name: '시드니', city: '시드니' },
    { kind: 'special', name: '포츈카드', effect: 'card' },
    { kind: 'city', name: '퀘벡', city: '퀘벡' },
    { kind: 'tourism', name: '하와이', purchasableFromBank: true, acquirableFromPlayer: false },
    { kind: 'city', name: '상파울루', city: '상파울루' },
    { kind: 'special', name: '올림픽', effect: 'olympic' },
    { kind: 'city', name: '프라하', city: '프라하' },
    { kind: 'tourism', name: '푸켓', purchasableFromBank: true, acquirableFromPlayer: false },
    { kind: 'city', name: '베를린', city: '베를린' },
    { kind: 'special', name: '포츈카드', effect: 'card' },
    { kind: 'city', name: '모스크바', city: '모스크바' },
    { kind: 'city', name: '제네바', city: '제네바' },
    { kind: 'city', name: '로마', city: '로마' },
    { kind: 'special', name: '세계여행', effect: 'world-travel' },
    { kind: 'tourism', name: '타히티', purchasableFromBank: true, acquirableFromPlayer: false },
    { kind: 'city', name: '런던', city: '런던' },
    { kind: 'city', name: '파리', city: '파리' },
    { kind: 'special', name: '포츈카드', effect: 'card' },
    { kind: 'city', name: '뉴욕', city: '뉴욕' },
    { kind: 'special', name: '국세청', effect: 'tax' },
    { kind: 'city', name: '서울', city: '서울' },
  ] satisfies readonly ClassicMarbleCell[],
} as const;

const cityByName = new Map(classicMarbleReferenceProfile.cities.map(city => [city.name, city]));
const tourismByName = new Map<string, (typeof classicMarbleReferenceProfile.tourism)[number]>(classicMarbleReferenceProfile.tourism.map(tile => [tile.name, tile]));

function classScale(targetClass: ClassicMarbleClass) {
  return classicMarbleReferenceProfile.rules.classTollMultipliers[targetClass] /
    classicMarbleReferenceProfile.rules.classTollMultipliers.business;
}

export function classicMarbleBankPurchasePrice(kind: 'city' | 'tourism', name: string) {
  if (kind === 'city') return cityByName.get(name)?.land ?? null;
  return tourismByName.get(name)?.bankPurchasePrice ?? null;
}

/** Costs are independent set members; for example a hotel can coexist with a villa. */
export function classicMarbleInvestment(cityName: string, buildings: ClassicMarbleBuildings = {}) {
  const city = cityByName.get(cityName);
  if (!city) return null;
  return city.land + (['villa', 'building', 'hotel'] as const).reduce((total, structure) => total + (buildings[structure] ? city.construction[structure] : 0), 0);
}

export function classicMarbleAssetValue(cityName: string, buildings: ClassicMarbleBuildings = {}) {
  const investment = classicMarbleInvestment(cityName, buildings);
  const city = cityByName.get(cityName);
  return investment === null || !city ? null : investment + (buildings.landmark ? city.construction.landmark : 0);
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

export function classicMarbleCityToll(cityName: string, buildings: ClassicMarbleBuildings = {}, playerClass: ClassicMarbleClass = 'business') {
  const city = cityByName.get(cityName);
  if (!city) return null;
  if (buildings.landmark && !(['villa', 'building', 'hotel'] as const).every(structure => buildings[structure])) return null;
  const canonicalStages = [
    !buildings.villa && !buildings.building && !buildings.hotel && !buildings.landmark,
    !!buildings.villa && !buildings.building && !buildings.hotel && !buildings.landmark,
    !!buildings.villa && !!buildings.building && !buildings.hotel && !buildings.landmark,
    !!buildings.villa && !!buildings.building && !!buildings.hotel && !buildings.landmark,
    !!buildings.villa && !!buildings.building && !!buildings.hotel && !!buildings.landmark,
  ];
  const stage = canonicalStages.indexOf(true);
  if (stage >= 0) return city.tollByCanonicalStage[stage] * classScale(playerClass);
  const [land, villa, building, hotel, landmark] = city.tollByCanonicalStage;
  const economyToll = land
    + (buildings.villa ? villa - land : 0)
    + (buildings.building ? building - villa : 0)
    + (buildings.hotel ? hotel - building : 0)
    + (buildings.landmark ? landmark - hotel : 0);
  return economyToll * classScale(playerClass);
}

export function classicMarbleCityTollEvidence(cityName: string, buildings: ClassicMarbleBuildings = {}) {
  if (!cityByName.has(cityName)) return 'missing-city' as const;
  if (buildings.landmark && !(['villa', 'building', 'hotel'] as const).every(structure => buildings[structure])) return 'unsupported-mask' as const;
  if (cityName === '카이로' && !!buildings.building && !buildings.villa && !buildings.hotel && !buildings.landmark) return 'direct-partial-mask-observation' as const;
  const canonical = [
    !buildings.villa && !buildings.building && !buildings.hotel && !buildings.landmark,
    !!buildings.villa && !buildings.building && !buildings.hotel && !buildings.landmark,
    !!buildings.villa && !!buildings.building && !buildings.hotel && !buildings.landmark,
    !!buildings.villa && !!buildings.building && !!buildings.hotel && !buildings.landmark,
    !!buildings.villa && !!buildings.building && !!buildings.hotel && !!buildings.landmark,
  ].some(Boolean);
  return canonical ? 'source-table-canonical-stage' as const : 'additive-inference-only' as const;
}

/** The tier is accepted explicitly; the reference selector (e.g. tourism ownership count) is still unresolved. */
export function classicMarbleTourismToll(name: string, verifiedStep: number, playerClass: ClassicMarbleClass = 'business') {
  const tile = tourismByName.get(name);
  if (!tile || !Number.isInteger(verifiedStep) || verifiedStep < 0 || verifiedStep >= tile.rentSchedule.length) return null;
  return tile.rentSchedule[verifiedStep] * classScale(playerClass);
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

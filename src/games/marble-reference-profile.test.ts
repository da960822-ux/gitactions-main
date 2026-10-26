import { describe, expect, it } from 'vitest';
import {
  classicMarbleAcquisitionPrice,
  classicMarbleAvailableStructures,
  classicMarbleBankPurchasePrice,
  classicMarbleCityToll,
  classicMarbleCityTollEvidence,
  classicMarbleConstructionCost,
  classicMarbleInvestment,
  classicMarbleLandmarkCost,
  classicMarbleReferenceProfile,
  classicMarbleSaleValue,
  classicMarbleTourismToll,
} from './marble-reference-profile';

describe('historical Kakao World / Business reference profile', () => {
  it('keeps the 2013 mobile map separate and complete at its observed size', () => {
    expect(classicMarbleReferenceProfile.map).toHaveLength(32);
    expect(classicMarbleReferenceProfile.cities).toHaveLength(18);
    expect(classicMarbleReferenceProfile.tourism).toHaveLength(5);
    expect(classicMarbleReferenceProfile.map.filter(cell => cell.kind === 'city')).toHaveLength(18);
    expect(classicMarbleReferenceProfile.map.filter(cell => cell.kind === 'tourism')).toHaveLength(5);
    expect(classicMarbleReferenceProfile.readiness).toMatchObject({
      activation: 'active-for-new-route-v4-and-solo-team-route; legacy-saves-retain-old-profile',
      salary: 'inferred-not-authoritative',
      cityRent: 'verified-business-canonical-build-stages',
    });
    expect(classicMarbleReferenceProfile.startingCash.amount).toBe(5_000_000);
    expect(classicMarbleReferenceProfile.salaryReference).toMatchObject({ amount: 750_000, status: 'inferred-only' });
  });

  it('uses per-city building prices and an independent building set', () => {
    expect(classicMarbleConstructionCost('방콕', 'villa')).toBe(25_000);
    expect(classicMarbleConstructionCost('서울', 'hotel')).toBe(1_000_000);
    expect(classicMarbleLandmarkCost('서울')).toBe(1_000_000);
    const selected = { villa: true, hotel: true };
    expect(classicMarbleInvestment('방콕', selected)).toBe(200_000);
    expect(classicMarbleAcquisitionPrice('방콕', selected)).toBe(400_000);
    expect(classicMarbleSaleValue('방콕', selected)).toBe(100_000);
    expect(classicMarbleBankPurchasePrice('city', '서울')).toBe(500_000);
    expect(classicMarbleBankPurchasePrice('tourism', '독도')).toBe(250_000);
    expect(classicMarbleAcquisitionPrice('독도')).toBeNull();
    expect(classicMarbleReferenceProfile.rules.landmarkSurchargeRecoveredOnSale).toBe(false);
  });

  it('provides verified city and tourism tolls only for documented canonical stages', () => {
    expect(classicMarbleCityToll('방콕')).toBe(5_000);
    expect(classicMarbleCityToll('방콕', { villa: true })).toBe(20_000);
    expect(classicMarbleCityToll('방콕', { villa: true, building: true, hotel: true })).toBe(210_000);
    expect(classicMarbleCityToll('서울', { villa: true, building: true, hotel: true, landmark: true })).toBe(4_700_000);
    expect(classicMarbleCityToll('방콕', { villa: true, hotel: true })).toBe(160_000);
    expect(classicMarbleCityTollEvidence('방콕', { villa: true, hotel: true })).toBe('additive-inference-only');
    expect(classicMarbleCityToll('카이로', { building: true }, 'economy')).toBe(56_000);
    expect(classicMarbleCityTollEvidence('카이로', { building: true })).toBe('direct-partial-mask-observation');
    expect(classicMarbleCityToll('카이로', { building: true })).toBe(140_000);
    expect(classicMarbleCityToll('카이로', { villa: true })).toBe(70_000);
    expect(classicMarbleCityToll('카이로', { villa: true, building: true })).toBe(190_000);
    expect(classicMarbleCityToll('카이로', { hotel: true })).toBe(330_000);
    expect(classicMarbleCityToll('카이로', { villa: true, hotel: true })).toBe(380_000);
    expect(classicMarbleCityToll('카이로', { building: true, hotel: true })).toBe(450_000);
    expect(classicMarbleCityToll('카이로', { villa: true, building: true, hotel: true })).toBe(500_000);
    expect(classicMarbleCityTollEvidence('카이로', { hotel: true })).toBe('additive-inference-only');
    expect(classicMarbleCityToll('방콕', {}, 'economy')).toBe(2_000);
    expect(classicMarbleCityToll('방콕', {}, 'first')).toBe(10_000);
    expect(classicMarbleTourismToll('독도', 0)).toBe(200_000);
    expect(classicMarbleTourismToll('독도', 1)).toBe(400_000);
    expect(classicMarbleTourismToll('독도', 2)).toBe(800_000);
    expect(classicMarbleTourismToll('독도', 3)).toBeNull();
    expect(classicMarbleReferenceProfile.tourism.every(tile =>
      tile.bankPurchasePrice === 250_000 && tile.playerAcquisitionAllowed === false &&
      tile.rentSchedule.join(',') === '200000,400000,800000')).toBe(true);
    expect(classicMarbleReferenceProfile.rules.tourismGroupMonopolyMultiplier).toBe(1);
  });

  it('matches the transcribed Business toll rows for all 18 cities', () => {
    const expected: Record<string, readonly number[]> = {
      '방콕': [5_000, 20_000, 70_000, 210_000, 835_000],
      '베이징': [5_000, 25_000, 80_000, 230_000, 855_000],
      '타이페이': [15_000, 60_000, 175_000, 475_000, 1_600_000],
      '두바이': [15_000, 60_000, 175_000, 475_000, 1_600_000],
      '카이로': [20_000, 70_000, 190_000, 500_000, 1_625_000],
      '도쿄': [35_000, 115_000, 325_000, 875_000, 2_375_000],
      '시드니': [35_000, 115_000, 325_000, 875_000, 2_375_000],
      '퀘벡': [50_000, 165_000, 450_000, 1_125_000, 2_875_000],
      '상파울루': [60_000, 180_000, 475_000, 1_175_000, 2_925_000],
      '프라하': [80_000, 255_000, 700_000, 1_625_000, 3_500_000],
      '베를린': [85_000, 270_000, 700_000, 1_675_000, 3_550_000],
      '모스크바': [110_000, 325_000, 825_000, 1_975_000, 3_850_000],
      '제네바': [120_000, 350_000, 900_000, 2_075_000, 3_950_000],
      '로마': [120_000, 350_000, 900_000, 2_075_000, 3_950_000],
      '런던': [140_000, 450_000, 1_150_000, 2_650_000, 4_400_000],
      '파리': [150_000, 475_000, 1_200_000, 2_750_000, 4_500_000],
      '뉴욕': [180_000, 550_000, 1_350_000, 3_050_000, 4_550_000],
      '서울': [200_000, 600_000, 1_450_000, 3_200_000, 4_700_000],
    };
    expect(Object.fromEntries(classicMarbleReferenceProfile.cities.map(city => [city.name, city.tollByCanonicalStage]))).toEqual(expected);
  });

  it('keeps lap gates and own-arrival requirement explicit for building choices', () => {
    expect(classicMarbleAvailableStructures({}, 0, false)).toEqual([]);
    expect(classicMarbleAvailableStructures({}, 0, true)).toEqual(['villa']);
    expect(classicMarbleAvailableStructures({ villa: true }, 1, true)).toEqual(['building']);
    expect(classicMarbleAvailableStructures({ villa: true, building: true }, 2, true)).toEqual(['hotel']);
    expect(classicMarbleAvailableStructures({ villa: true, building: true, hotel: true }, 2, true)).toEqual([]);
    expect(classicMarbleAvailableStructures({ villa: true, building: true, hotel: true }, 3, true)).toEqual(['landmark']);
    expect(classicMarbleAvailableStructures({ villa: true, building: true, hotel: true }, 3, false)).toEqual([]);
  });
});

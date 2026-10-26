import { describe, expect, it } from 'vitest';
import {
  classicMarbleAcquisitionPrice,
  classicMarbleAvailableStructures,
  classicMarbleConstructionCost,
  classicMarbleInvestment,
  classicMarbleLandmarkCost,
  classicMarbleReferenceProfile,
  classicMarbleSaleValue,
} from './marble-reference-profile';

describe('historical Kakao World / Business reference profile', () => {
  it('keeps the 2013 mobile map separate and complete at its observed size', () => {
    expect(classicMarbleReferenceProfile.map).toHaveLength(32);
    expect(classicMarbleReferenceProfile.cities).toHaveLength(18);
    expect(classicMarbleReferenceProfile.tourism).toHaveLength(5);
    expect(classicMarbleReferenceProfile.map.filter(cell => cell.kind === 'city')).toHaveLength(18);
    expect(classicMarbleReferenceProfile.map.filter(cell => cell.kind === 'tourism')).toHaveLength(5);
    expect(classicMarbleReferenceProfile.readiness).toMatchObject({ activation: 'blocked-pending-rent-and-salary-reference', rent: 'missing', salary: 'missing' });
    expect(classicMarbleReferenceProfile.startingCashHistorical.amount).toBe(5_000_000);
  });

  it('uses per-city building prices and an independent building set', () => {
    expect(classicMarbleConstructionCost('방콕', 'villa')).toBe(25_000);
    expect(classicMarbleConstructionCost('서울', 'hotel')).toBe(1_000_000);
    expect(classicMarbleLandmarkCost('서울')).toBe(1_000_000);
    const selected = { villa: true, hotel: true };
    expect(classicMarbleInvestment('방콕', selected)).toBe(200_000);
    expect(classicMarbleAcquisitionPrice('방콕', selected)).toBe(400_000);
    expect(classicMarbleSaleValue('방콕', selected)).toBe(100_000);
    expect(classicMarbleAcquisitionPrice('독도')).toBeNull();
    expect(classicMarbleReferenceProfile.rules.landmarkSurchargeRecoveredOnSale).toBe(false);
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

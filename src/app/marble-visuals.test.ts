import { describe, expect, it } from 'vitest';
import { buildingSummary, moneyText, visualBuildingLevel } from './marble-visuals';

describe('Marble money scale', () => {
  it('preserves the old small-money display and keeps world-map amounts exact', () => {
    expect(moneyText(1500, 'ko')).toBe('1,500');
    expect(moneyText(5000000, 'ko')).toBe('500만');
    expect(moneyText(500000, 'ko')).toBe('50만');
    expect(moneyText(125000, 'ko')).toBe('12.5만');
    expect(moneyText(5000000, 'es')).toBe('5 M');
    expect(moneyText(500000, 'es')).toBe('500 mil');
  });
});
describe('Marble independent building masks',()=>{
  it('displays a building-only city as a building while preserving its independent mask',()=>{
    const tile={houses:1,buildings:{building:true}};
    expect(visualBuildingLevel(tile,4)).toBe(2);
    expect(buildingSummary(tile,'ko',4)).toBe('빌딩');
    expect(buildingSummary(tile,'es',4)).toBe('Edificio');
  });
  it('shows a landmark after all ordinary structures without relying on the houses count',()=>{
    const tile={houses:3,buildings:{villa:true,building:true,hotel:true,landmark:true}};
    expect(visualBuildingLevel(tile,4)).toBe(4);
    expect(buildingSummary(tile,'ko',4)).toBe('빌라 + 빌딩 + 호텔 + 랜드마크');
  });
});

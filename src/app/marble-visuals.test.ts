import { describe, expect, it } from 'vitest';
import { moneyText } from './marble-visuals';

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

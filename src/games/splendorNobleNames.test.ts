import { describe, expect, it } from 'vitest';
import { splendorNobleName } from './splendorNobleNames';
import { splendorEngine } from './splendor';
import { fourSplendorEngine } from './fourSplendor';

describe('Splendor noble titles', () => {
  it('gives every stable noble ID a distinct Korean and Spanish name', () => {
    for (const language of ['ko', 'es'] as const) {
      const names = Array.from({ length: 16 }, (_, index) => splendorNobleName(`n${index}`, language));
      expect(new Set(names).size).toBe(16);
      expect(names.every(name => name !== (language === 'ko' ? '귀족' : 'Noble'))).toBe(true);
    }
    expect(splendorNobleName('n0', 'ko')).toBe('대양의 여왕 리스벳');
    expect(splendorNobleName('n15', 'es')).toBe('La rosa de Santo Domingo');
    expect(splendorNobleName('old-save-id', 'ko')).toBe('귀족');
  });
  it('names two-player and four-player noble choices without changing their IDs or costs', () => {
    const two = splendorEngine.createInitialState(3);
    two.availableNobles = { n10: { points: 3, requirement: { white: 4, green: 4 } } };
    two.pendingNobles = ['n10'];
    const twoChoice = splendorEngine.getPlayerView(two, 'p1').actions[0];
    expect(twoChoice.label).toEqual({ ko: '검은 너울의 황진이 선택 (3점)', es: 'Elegir a Hwang Jin-yi del velo negro (3 puntos)' });
    expect(twoChoice.action.payload?.id).toBe('n10');
    const four = fourSplendorEngine.createInitialState(3);
    four.availableNobles = { n10: { points: 3, requirement: { white: 4, green: 4 } } };
    four.pendingNobles = ['n10'];
    const fourChoice = fourSplendorEngine.getPlayerView(four, 'p1').actions[0];
    expect(fourChoice.label.ko).toContain('검은 너울의 황진이 선택');
    expect(fourChoice.label.es).toContain('Hwang Jin-yi del velo negro');
    expect(fourChoice.action.payload?.id).toBe('n10');
  });
});

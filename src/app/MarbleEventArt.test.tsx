import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MarbleEventArt, marbleEventArtFamily, marbleEventArtPath, marbleEventFamilyById } from './MarbleEventArt';

const expected = {
  festival: 'cash', lottery: 'cash', 'rent-rebate': 'cash', 'city-dividend': 'cash',
  'visit-santo-domingo': 'movement', retreat: 'movement', 'advance-start': 'movement', 'train-ticket': 'movement', 'go-to-island': 'movement',
  'travel-cost': 'city', maintenance: 'city', 'monopoly-warning': 'city', 'city-festival': 'city', blackout: 'city',
  'escape-pass': 'protection', 'rent-pass': 'protection',
} as const;
const assetNames = { cash: 'cash-dividend', movement: 'movement-travel', city: 'city-intervention', protection: 'protection-exemption' } as const;

describe('Marble event art', () => {
  it('maps every event ID to its approved family without changing the event set', () => {
    expect(marbleEventFamilyById).toEqual(expected);
    for (const [id, family] of Object.entries(expected)) {
      expect(marbleEventArtFamily(id)).toBe(family);
      expect(marbleEventArtPath(id)).toBe(`/images/marble/events/${assetNames[family]}.webp`);
    }
  });

  it('renders native card-size dimensions and transparent fallback for unknown or missing art', () => {
    const fallback = createElement('svg', { 'data-fallback-art': 'golden-key-symbol' });
    const known = renderToStaticMarkup(createElement(MarbleEventArt, { cardId: 'city-dividend', fallback }));
    expect(known).toContain('src="/images/marble/events/cash-dividend.webp"');
    expect(known).toContain('width="96" height="120"');
    expect(known).toContain('alt=""');
    expect(known).toContain('data-event-family="cash"');

    const unknown = renderToStaticMarkup(createElement(MarbleEventArt, { cardId: 'unmapped-card', fallback }));
    expect(unknown).toContain('data-art-pending="unknown"');
    expect(unknown).toContain('data-fallback-art="golden-key-symbol"');
    expect(unknown).not.toContain('<img');
    expect(marbleEventArtPath('toString')).toBeNull();
  });
});

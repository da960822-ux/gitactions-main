import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MarbleEventArt, marbleEventArtFamily, marbleEventArtPath, marbleEventFamilyById, marbleEventSymbols } from './MarbleEventArt';

const expected = {
  'takeover-discount-pass':'protection',
  festival: 'cash', lottery: 'cash', 'rent-rebate': 'cash', 'city-dividend': 'cash',
  'visit-santo-domingo': 'movement', retreat: 'movement', 'advance-start': 'movement', 'train-ticket': 'movement', 'go-to-island': 'movement',
  'travel-cost': 'city', maintenance: 'city', 'monopoly-warning': 'city', 'city-festival': 'city', blackout: 'city',
  'escape-pass': 'protection', 'rent-pass': 'protection',
  'forced-sale':'city',earthquake:'city','city-shield':'protection','construction-grant':'city','property-hunt':'movement',birthday:'cash',
} as const;
const assetNames = { cash: 'cash-dividend', movement: 'movement-travel', city: 'city-intervention', protection: 'protection-exemption' } as const;

describe('Marble event art', () => {
  it('gives all twenty-three effects distinct recognizable symbols',()=>{expect(Object.keys(marbleEventSymbols)).toHaveLength(23);expect(new Set(Object.values(marbleEventSymbols)).size).toBe(23);for(const id of Object.keys(expected)){expect(renderToStaticMarkup(createElement(MarbleEventArt,{cardId:id,fallback:null}))).toContain(`data-effect-symbol="${marbleEventSymbols[id as keyof typeof marbleEventSymbols]}"`);}});
  it('draws seven distinct semantic scenes without a generic face or raster dependency',()=>{
    const scenes=['forced-sale','earthquake','city-shield','construction-grant','property-hunt','birthday','takeover-discount-pass'].map(cardId=>renderToStaticMarkup(createElement(MarbleEventArt,{cardId,fallback:null})));
    expect(new Set(scenes).size).toBe(7);
    for(const scene of scenes){expect(scene).toContain('data-art-medium="svg"');expect(scene).toContain('marble-semantic-scene');expect(scene).not.toContain('<img');expect(scene).toContain('width="160" height="200"');}
  });
  it('maps every event ID to its approved family without changing the event set', () => {
    expect(marbleEventFamilyById).toEqual(expected);
    for (const [id, family] of Object.entries(expected)) {
      expect(marbleEventArtFamily(id)).toBe(family);
      const custom:Record<string,string>={'travel-cost':'expense',maintenance:'repair','monopoly-warning':'expense',blackout:'blackout','rent-pass':'protection','city-festival':'festival'};
      expect(marbleEventArtPath(id)).toBe(custom[id]?`/images/marble/events/semantic-v2/${custom[id]}.webp`:`/images/marble/events/${assetNames[family]}.webp`);
    }
  });

  it('renders native card-size dimensions and transparent fallback for unknown or missing art', () => {
    const fallback = createElement('svg', { 'data-fallback-art': 'golden-key-symbol' });
    const known = renderToStaticMarkup(createElement(MarbleEventArt, { cardId: 'city-dividend', fallback }));
    expect(known).toContain('src="/images/marble/events/cash-dividend.webp"');
    expect(known).toContain('width="160" height="200"');
    expect(known).toContain('alt=""');
    expect(known).toContain('data-event-family="cash"');

    const unknown = renderToStaticMarkup(createElement(MarbleEventArt, { cardId: 'unmapped-card', fallback }));
    expect(unknown).toContain('data-art-pending="unknown"');
    expect(unknown).toContain('data-fallback-art="golden-key-symbol"');
    expect(unknown).not.toContain('<img');
    expect(marbleEventArtPath('toString')).toBeNull();
  });
});

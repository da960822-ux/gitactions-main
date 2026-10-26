import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { marbleEngine } from '../games/marble';
import { MarblePropertyLedger } from './MarblePropertyLedger';

describe('reference Marble property ledger', () => {
  it('shows all five canonical historical stages and acquisition basis from shared data', () => {
    const tile = marbleEngine.getPlayerView(marbleEngine.createInitialState(1), 'p1').board.tiles[1];
    const html = renderToStaticMarkup(createElement(MarblePropertyLedger, { tile, language: 'ko', economicVersion: 4, propertyRulesVersion: 1 }));
    const rows = html.match(/<tbody>(.*?)<\/tbody>/)?.[1].match(/<tr.*?>.*?<\/tr>/g) ?? [];
    expect(rows).toHaveLength(5);
    expect(rows.map(row => Array.from(row.matchAll(/<td>(.*?)<\/td>/g), cell => cell[1]))).toEqual([
      ['50000', '50000', '5000', '100000'],
      ['25000', '75000', '20000', '150000'],
      ['75000', '150000', '70000', '300000'],
      ['125000', '275000', '210000', '550000'],
      ['125000', '400000', '835000', '550000'],
    ]);
  });
});

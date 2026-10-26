import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { marbleEngine } from '../games/marble';
import { MarblePropertyLedger } from './MarblePropertyLedger';

describe('reference Marble property ledger', () => {
  it('shows independent building examples with exact formatted profile amounts', () => {
    const tile = marbleEngine.getPlayerView(marbleEngine.createInitialState(1), 'p1').board.tiles[1];
    const html = renderToStaticMarkup(createElement(MarblePropertyLedger, { tile, language: 'ko', economicVersion: 4, propertyRulesVersion: 1 }));
    const rows = html.match(/<tbody>(.*?)<\/tbody>/)?.[1].match(/<tr.*?>.*?<\/tr>/g) ?? [];
    expect(rows).toHaveLength(6);
    expect(html).toContain('독립 건설 조합');
    expect(rows[0]).toContain('<th>대지</th><td>5만</td><td>5만</td><td>5,000</td><td>10만</td>');
    expect(rows[2]).toContain('<th>빌딩만</th><td>7.5만</td>');
    expect(rows[2]).toContain('<td>5.5만</td>');
    expect(rows[3]).toContain('<td>14.5만</td>');
    expect(rows[5]).toContain('<td>83.5만</td>');
  });
});

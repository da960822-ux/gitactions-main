import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { JaipurMotion } from './JaipurMotion';

describe('Jaipur event presentation', () => {
  it('keeps the current round settlement readable without replaying its motion', () => {
    const html = renderToStaticMarkup(createElement(JaipurMotion, {
      events: [{ sequence: 12, round: 2, type: 'round-end', title: { ko: '2라운드 정산', es: 'Cuenta de la ronda 2' }, summary: {
        round: 2, winner: 'p1', cause: 'piles', camelCounts: { p1: 4, p2: 2 }, roundsWon: { p1: 1, p2: 1 },
        breakdown: {
          p1: { goods: 21, bonus: 3, sale: 24, camel: 5, total: 29, detailed: true },
          p2: { goods: 17, bonus: 0, sale: 17, camel: 0, total: 17, detailed: true },
        },
      } }],
      language: 'es', playerId: 'p1',
    }));
    expect(html).toContain('Cuenta de la ronda 2');
    expect(html).toContain('Tú: Mercancías 21 + bono 3 + camellos 5 = 29 pts');
    expect(html).toContain('Tu pareja: Mercancías 17 + bono 0 + camellos 0 = 17 pts');
    expect(html).not.toContain('jaipur-flight');
    expect(html).not.toContain('jaipur-event-note is-fresh');
  });
});

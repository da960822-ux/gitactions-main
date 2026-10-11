import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MarbleEventStage } from './MarbleEventStage';

describe('Marble event stage server rendering', () => {
  it('renders a current legacy card and signed cash delta without starting its motion', () => {
    const html = renderToStaticMarkup(createElement(MarbleEventStage, {
      language: 'es', playerId: 'p1',
      events: [{ sequence: 4, id: 'travel-cost', effect: 'cash', playerId: 'p1', title: { ko: '여행 경비', es: 'Gastos de viaje' }, text: { ko: '100을 냅니다.', es: 'Pagas 100.' }, cashDelta: -100 }],
    }));
    expect(html).toContain('Gastos de viaje');
    expect(html).toContain('−100');
    expect(html).not.toContain('is-animating');
  });

  it('labels an unpaid crisis assessment without presenting it as a completed debit', () => {
    const html = renderToStaticMarkup(createElement(MarbleEventStage, {
      language: 'es', playerId: 'p1',
      events: [{ sequence: 8, type: 'crisis', actor: 'p1', title: { ko: '파산 위기', es: 'Riesgo de quiebra' }, text: { ko: '지급에 부족합니다.', es: 'Falta dinero para pagar.' }, amount: 200 }],
    }));
    expect(html).toContain('Pendiente');
    expect(html).toContain('200');
    expect(html).not.toContain('is-negative');
  });

  it('shows a loan as a transfer from the bank to the player', () => {
    const html = renderToStaticMarkup(createElement(MarbleEventStage, {
      language: 'ko', playerId: 'p1',
      events: [{ sequence: 9, type: 'loan', actor: 'p1', toPlayer: 'p1', title: { ko: '대출', es: 'Préstamo' }, text: { ko: '300을 받았습니다.', es: 'Recibiste 300.' }, amount: 300, moneyDelta: { p1: 300 } }],
    }));
    expect(html).toContain('은행');
    expect(html).toContain('→</i>나');
    expect(html).toContain('+300');
  });
});

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

describe('Marble public event meaning', () => {
  const renderEvent = (event: Record<string, unknown>) => renderToStaticMarkup(createElement(MarbleEventStage, { language: 'ko', playerId: 'p1', events: [{ sequence: 10, ...event }] }));
  it('distinguishes an exposed penalty card from a settled payment without inventing a debit', () => {
    const card = renderEvent({ type: 'event-card', cardId: 'travel-cost', text: { ko: '100을 냅니다.' } });
    expect(card).toContain('golden-key-cards.svg#tax');
    expect(card).toContain('카드 공개');
    expect(card).toContain('100을 냅니다.');
    expect(card).not.toContain('marble-event-amount');
    const paid = renderEvent({ type: 'tax', actor: 'p1', fromAccount: 'p1', toAccount: 'fund', moneyDelta: { p1: -100 } });
    expect(paid).toContain('나<i aria-hidden="true">→</i>공동 기금');
    expect(paid).toContain('지급 완료');
    expect(paid).toContain('−100');
  });
  it.each([
    ['city-festival', 'city-festival'], ['blackout', 'blackout'], ['rent-pass', 'rent-pass'],
  ])('illustrates %s with its card family', (cardId, family) => {
    const html = renderEvent({ type: 'event-card', cardId });
    expect(html).toContain(`golden-key-cards.svg#${family}`);
    expect(html).toContain('viewBox="0 0 128 160"');
    expect(html).toContain('marble-event-card-face');
    expect(html).not.toContain('tile-symbols.svg');
  });
  it('shows an unpaid crisis and the actual creditor without a fabricated cash change', () => {
    const crisis = renderEvent({ type: 'crisis', actor: 'p1', fromAccount: 'p1', toAccount: 'p2', amount: 200 });
    expect(crisis).toContain('미지급 · 해결 필요');
    expect(crisis).toContain('나<i aria-hidden="true">→</i>상대');
    expect(crisis).not.toContain('지급 완료');
    expect(crisis).not.toContain('is-negative');
  });
  it('labels a free train movement as no cash change', () => {
    const free = renderEvent({ type: 'train', actor: 'p1', fromAccount: 'p1', toAccount: 'bank', from: 5, to: 15, moneyDelta: { p1: 0 } });
    expect(free).toContain('현금 변동 없음');
    expect(free).not.toContain('수령 완료');
    expect(free).not.toContain('marble-event-transfer');
  });
  it('uses distinct reward/island/train symbols and the public movement endpoints', () => {
    for (const [cardId, symbol] of [['festival', 'festival'], ['go-to-island', 'island'], ['train-ticket', 'train']]) {
      expect(renderEvent({ type: 'event-card', cardId })).toContain(`golden-key-cards.svg#${symbol}`);
    }
    expect(renderEvent({ type: 'train', from: 5, to: 15 })).toContain('6번 → 16번 칸');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JaipurBoard, jaipurSalePreview, toggleJaipurTakeSelection } from './JaipurBoard';

const view = (overrides: Record<string, any> = {}) => ({
  turn: 'p1', phase: 'choose', ownHand: ['gold', 'gold', 'cloth'], opponentCount: 2,
  board: {
    round: 1, market: ['camel', 'diamond', 'silver', 'camel', 'spice'], deckCount: 18,
    marketCards: ['m-c1', 'm-d1', 'm-s1', 'm-c2', 'm-sp1'].map((id, i) => ({ id, good: ['camel', 'diamond', 'silver', 'camel', 'spice'][i] })),
    piles: { diamond: [7, 5], gold: [6, 5, 4], silver: [5], cloth: [4], spice: [3], leather: [2] },
    tokens: { p1: 4, p2: 9 }, herdCounts: { p1: 1, p2: 3 }, roundsWon: { p1: 1, p2: 0 }, camelBadges: { p1: 0, p2: 1 },
    bonusTileCounts: { 3: 2, 4: 2, 5: 1 },
  },
  actions: [
    { label: { ko: '낙타 가져오기', es: 'Tomar camellos' }, action: { type: 'take', payload: { mode: 'camels' } } },
    { label: { ko: '다이아 가져오기', es: 'Tomar diamantes' }, action: { type: 'take', payload: { mode: 'single', indices: [1] } } },
    { label: { ko: '금 2장 판매', es: 'Vender oro' }, action: { type: 'sell', payload: { good: 'gold', count: 2 } } },
  ],
  ...overrides,
});

const render = (data: any, language: 'ko' | 'es' = 'ko', playerId: 'p1' | 'p2' = 'p1') => renderToStaticMarkup(createElement(JaipurBoard, { view: data, language, playerId, runAction: vi.fn() }));

describe('JaipurBoard', () => {
  it('renders public market, own hand and opponent count without exposing opposing card faces', () => {
    const html = render(view({ opponentHand: ['secret-spice-card'], privateOpponentBonus: 9001 }));
    expect(html).toContain('data-jaipur-zone="market"');
    expect(html).toContain('data-jaipur-zone="sale"');
    expect(html).toContain('data-jaipur-zone="hand"');
    expect(html).toContain('data-jaipur-zone="opponent-hand"');
    expect(html).toContain('2 <small>장</small>');
    expect(html).toContain('data-jaipur-card-id="m-d1"');
    expect(html).toContain('다이아몬드');
    expect(html).not.toContain('secret-spice-card');
    expect(html).not.toContain('9001');
  });

  it('keeps the sale flight destination mounted during a non-sale turn', () => {
    const html = render(view({ phase: 'choose' }));
    expect(html.match(/data-jaipur-zone="sale"/g)).toHaveLength(1);
    expect(html).toContain('class="jp-pile-grid" data-jaipur-zone="sale"');
    expect(html).not.toContain('class="jp-sale-options" data-jaipur-zone="sale"');
  });

  it('places the motion layer after scores so transient notices have a flow position', () => {
    const html = render(view());
    expect(html.indexOf('class="jp-scorebar"')).toBeGreaterThanOrEqual(0);
    expect(html.indexOf('class="jaipur-motion-layer"')).toBeGreaterThan(html.indexOf('class="jp-scorebar"'));
  });

  it('labels each active seat relative to the viewer', () => {
    expect(render(view({ turn: 'p1' }), 'ko', 'p1')).toContain('내 차례');
    expect(render(view({ turn: 'p1' }), 'ko', 'p2')).toContain('상대 차례');
    expect(render(view({ turn: 'p2' }), 'es', 'p2')).toContain('Tu turno');
    expect(render(view({ turn: 'p1' }), 'es', 'p2')).toContain('Turno rival');
  });

  it('explains token supply counts and next-value labels in both languages', () => {
    const ko = render(view());
    expect(ko).toContain('aria-label="남음 1개"');
    expect(ko).toContain('다음');
    expect(ko).toContain('class="jp-pile-next-label">다음</span>');
    expect(ko).toContain('class="jp-pile-next-value"');
    expect(ko).toContain('5점');
    const es = render(view(), 'es');
    expect(es).toContain('aria-label="Quedan 1"');
    expect(es).toContain('Siguiente:');
    expect(es).toContain('class="jp-pile-next-label">Siguiente:</span>');
    expect(es).toContain('class="jp-pile-next-value"');
    expect(es).toContain('5 pts');
  });

  it('previews only the known top token and keeps bonus values hidden', () => {
    const html = render(view({ board: { ...view().board, piles: { ...view().board.piles, gold: [5, 999] }, bonusValues: [888] } }));
    expect(html).toContain('aria-label="금 토큰 5점"');
    expect(html).not.toContain('999');
    expect(html).not.toContain('888');
    expect(html).toContain('뒤집힌 판매 보너스');
    expect(jaipurSalePreview('ko', 3, 5, true)).toContain('첫 토큰 5점 · 나머지 2개 상품 토큰은 판매 때 공개');
    expect(jaipurSalePreview('ko', 3, 5, true)).toContain('보너스 타일 가능 · 보너스 타일 가치는 비공개');
    expect(jaipurSalePreview('es', 3, 5, true)).toContain('Primera ficha: 5 pts');
    expect(jaipurSalePreview('ko', 2, null, false)).toContain('첫 상품 토큰 점수는 판매 때 공개');
    expect(jaipurSalePreview('es', 1, null, false)).toContain('se revela al vender');
    const unrevealed = render(view({ board: { ...view().board, piles: { ...view().board.piles, gold: [null, 999] } } }));
    expect(unrevealed).not.toContain('금 토큰 0점');
    expect(unrevealed).not.toContain('999');
  });

  it('keeps 5+ sale previews honest for six- and seven-card groups', () => {
    for (const count of [6, 7]) {
      expect(jaipurSalePreview('ko', count, 4, true)).toContain(`나머지 ${count - 1}개 상품 토큰은 판매 때 공개`);
      expect(jaipurSalePreview('es', count, 4, true)).toContain(`las otras ${count - 1} fichas`);
      expect(jaipurSalePreview('ko', count, 4, true)).toContain('보너스 타일 가능');
      expect(jaipurSalePreview('ko', count, 4, true)).toContain('보너스 타일 가치는 비공개');
    }
    expect(jaipurSalePreview('ko', 3, 4, false)).toContain('남은 보너스 타일 없음');
  });

  it('stages a market selection behind a separate confirm control', () => {
    const html = render(view());
    expect(html).toContain('data-jaipur-card-id="m-d1"');
    expect(html).toContain('class="jp-action-tray jp-take-controls"');
    expect(html).toContain('가져오기 선택');
    expect(html).toContain('class="jp-primary-action" disabled=""');
    expect(html).toContain('취소');
    expect(html).toContain('class="jp-cancel-action" disabled=""');
  });

  it('toggles the same take selection off while replacing a different selection', () => {
    expect(toggleJaipurTakeSelection([], ['market-good'])).toEqual(['market-good']);
    expect(toggleJaipurTakeSelection(['market-good'], ['market-good'])).toEqual([]);
    expect(toggleJaipurTakeSelection(['market-good'], ['market-camel-a', 'market-camel-b'])).toEqual(['market-camel-a', 'market-camel-b']);
    expect(toggleJaipurTakeSelection(['market-camel-a', 'market-camel-b'], ['market-camel-a', 'market-camel-b'])).toEqual([]);
  });

  it('does not invent legal actions and localizes the board for Dominican Spanish', () => {
    const empty = view({ actions: [] });
    const html = render(empty, 'es');
    expect(html).toContain('Mercado público');
    expect(html).toContain('Mano rival');
    expect(html).toContain('disabled=""');
    expect(html).toContain('No disponible');
  });

  it('uses engine-provided camel and sale actions, with no precious-good sale below two cards', () => {
    const data = view({ ownHand: ['gold'], actions: [
      { label: { ko: '낙타', es: 'Camellos' }, action: { type: 'take', payload: { mode: 'camels' } } },
    ] });
    const html = render(data);
    expect(html).not.toContain('jp-sale-option');
    expect(html).toContain('시장 카드: 낙타');
  });

  it('shows the authoritative settlement breakdown and recent public trade values', () => {
    const html = render(view({
      board: { ...view().board, roundSummary: { winner: 'p1', breakdown: {
        p1: { detailed: true, goods: 7, bonus: 4, sale: 11, camel: 5, total: 16 },
        p2: { detailed: false, goods: null, bonus: null, sale: 8, camel: 0, total: 8 },
      } } },
      log: [{ sequence: 21, type: 'sale', actor: 'p1', title: { ko: '금 3장 판매', es: 'Venta de oro' }, cards: [{ id: 'public-card-a', good: 'gold' }, { id: 'public-card-b', good: 'gold' }, { id: 'public-card-c', good: 'gold' }], points: 12 }],
    }));
    expect(html).toContain('상품 7 · 보너스 4 · 낙타 5');
    expect(html).toContain('합산 점수');
    expect(html).toContain('금 3장 · 12점 획득');
    expect(html).toContain('data-sequence="21"');
    expect(html).toContain('<details class="jp-history-drawer">');
    expect(html).toContain('data-jaipur-zone="settlement"');
    expect(html).toContain('이전 라운드 정산 · 최근 거래');
    expect(html).not.toContain('open=""');
  });
});

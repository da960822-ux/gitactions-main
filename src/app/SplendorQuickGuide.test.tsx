import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SplendorQuickGuide } from './SplendorQuickGuide';

describe('Splendor quick guide responsive flow', () => {
  it('keeps the original purchase instructions and omits the desktop worked flow on mobile', () => {
    const html = renderToStaticMarkup(<SplendorQuickGuide language="ko" desktopDisplay={false}/>);
    expect(html).toContain('같은 색 영구 보너스를 비용에서 빼고, 남은 값은 토큰이나 금');
    expect(html).toContain('카드를 누르면 비용 확인창이 나와요. ‘구매 확정’ 또는 ‘예약 확정’을 눌러요. 구매하면 그 카드의 보너스를 얻어요; 예약은 최대 3장');
    expect(html).not.toContain('첫 구매 예: 초록 보너스');
    expect(html).not.toContain('sp-guide-purchase-flow');
    expect(html).not.toContain('sp-guide-action-steps');
  });

  it('shows the engine-cost example on desktop', () => {
    const html = renderToStaticMarkup(<SplendorQuickGuide language="es" desktopDisplay/>);
    expect(html).toContain('1 bonificación verde + 3 fichas verdes');
    expect(html).toContain('Pagas 3 verdes · carta +1 punto');
    expect(html).toContain('sp-guide-purchase-flow');
    expect(html).toContain('sp-guide-action-steps');
    expect(html).toContain('Elige carta');
    expect(html).toContain('Revisa el pago por color');
    expect(html).toContain('Confirma la compra');
    expect(html).not.toContain('Primera compra: tienes 1 bonificación verde');
  });
});

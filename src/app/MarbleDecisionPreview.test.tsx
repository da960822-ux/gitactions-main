import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MarbleDecisionPreview } from './MarbleDecisionPreview';

describe('MarbleDecisionPreview', () => {
  it('shows cost, signed after-cash, toll change and shortfall in both languages', () => {
    const buy=renderToStaticMarkup(createElement(MarbleDecisionPreview,{kind:'buy',cost:180,cashAfter:-20,tollBefore:0,tollAfter:40,shortfall:20,language:'ko'}));
    expect(buy).toContain('구매 180'); expect(buy).toContain('구매 불가 · 현재 현금 160'); expect(buy).toContain('통행료 0 → 40'); expect(buy).toContain('현금 20 부족');
    const build=renderToStaticMarkup(createElement(MarbleDecisionPreview,{kind:'build',cost:70,cashAfter:1250,tollBefore:40,tollAfter:80,levelBefore:0,language:'es'}));
    expect(build).toContain('Nivel 0 → 1'); expect(build).toContain('Alquiler 40 → 80'); expect(build).toContain('Efectivo después 1,250');
  });
});

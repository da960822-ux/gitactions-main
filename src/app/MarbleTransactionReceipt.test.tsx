import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MarbleTransactionReceipt } from './MarbleTransactionReceipt';

describe('MarbleTransactionReceipt', () => {
  it('keeps one concise bilingual transfer line and the signed cash change', () => {
    const ko = renderToStaticMarkup(createElement(MarbleTransactionReceipt, { title:'통행료 지급', detail:'뉴욕에 도착', flow:'나 → 상대 · 60', delta:-60, language:'ko' }));
    expect(ko).toContain('나 → 상대 · 60');
    expect(ko).toContain('내 현금 -60');
    expect(ko.match(/mp-center-receipt/g)).toHaveLength(1);
    const es = renderToStaticMarkup(createElement(MarbleTransactionReceipt, { title:'Alquiler pagado', detail:'Llegada a Nueva York', flow:'Tú → Rival · 60', delta:60, language:'es' }));
    expect(es).toContain('Tu efectivo +60');
  });
});

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MatchReplay } from './MatchReplay';

describe('same-game replay agreement', () => {
  it('explains that both players must agree in both languages', () => {
    for (const language of ['ko', 'es'] as const) {
      const markup = renderToStaticMarkup(createElement(MatchReplay, { language, pending: false, onReplay: async () => {} }));
      expect(markup).toContain(language === 'ko' ? '두 사람 모두 동의' : 'ambos estén de acuerdo');
      expect(markup).toContain(language === 'ko' ? '새 판 요청' : 'Pedir otra partida');
    }
  });
  it('offers agreement when a replay is pending', () => {
    const markup = renderToStaticMarkup(createElement(MatchReplay, { language: 'es', pending: true, onReplay: async () => {} }));
    expect(markup).toContain('role="status"');
    expect(markup).toContain('Aceptar otra partida');
  });
});

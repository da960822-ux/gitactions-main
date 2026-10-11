import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MINHWATU_GODORI_BONUS } from '../games/minhwatu';
import { GameGuide } from './PlayApp';
import { MinhwatuGuide } from './MinhwatuGuide';

describe('Minhwatu illustrated guide', () => {
  it('shows the 0–3 matching cases and revealed deck card with original month faces', () => {
    for (const language of ['ko', 'es'] as const) {
      const html = renderToStaticMarkup(<MinhwatuGuide language={language}/>);
      for (const face of ['01-01', '01-02', '01-03', '01-04', '02-01']) {
        expect(html).toContain(`/images/hwatu/${face}.svg`);
      }
      for (const title of language === 'ko'
        ? ['0장 일치', '1장 일치', '2장 일치', '3장 일치', '더미 맨 위 공개']
        : ['0 coincidencias', '1 coincidencia', '2 coincidencias', '3 coincidencias', 'Se revela el mazo']) {
        expect(html).toContain(title);
      }
    }
  });

  it('illustrates actual ribbon and Godori faces with the engine bonus and score equation', () => {
    const ko = renderToStaticMarkup(<MinhwatuGuide language="ko"/>);
    const es = renderToStaticMarkup(<MinhwatuGuide language="es"/>);
    for (const face of ['01-02', '02-02', '03-02', '06-02', '09-02', '10-02', '04-02', '05-02', '07-02', '02-01', '04-01', '08-02']) {
      expect(ko).toContain(`/images/hwatu/${face}.svg`);
    }
    expect(ko).toContain(`고도리 · ${MINHWATU_GODORI_BONUS}점`);
    expect(es).toContain(`Godori · ${MINHWATU_GODORI_BONUS} pts`);
    expect(ko).toContain('130');
    expect(ko).toContain('−30');
    expect(es).toContain('130');
    expect(es).toContain('−30');
  });

  it('is included only in Minhwatu’s existing below-board guide', () => {
    const minhwatu = renderToStaticMarkup(createElement(GameGuide, { gameId: 'minhwatu', language: 'ko' }));
    const domino = renderToStaticMarkup(createElement(GameGuide, { gameId: 'domino', language: 'ko' }));
    expect(minhwatu).toContain('class="minhwatu-guide"');
    expect(minhwatu).toContain('id="game-guide"');
    expect(domino).not.toContain('class="minhwatu-guide"');
  });
});

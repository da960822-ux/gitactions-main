import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { gameCatalog } from '../games/catalog';
import { GameRail } from './GameRail';

describe('GameRail', () => {
  it('keeps every game, localized label and factual description linked to its selected-game route', () => {
    for (const language of ['ko', 'es'] as const) {
      const html = renderToStaticMarkup(<GameRail language={language}/>);
      expect(html).toContain(language === 'ko' ? '게임 고르기' : 'Elige un juego');
      expect(html.match(/class="game-rail-card game-/g)).toHaveLength(8);
      expect(html.match(/class="game-rail-cta" aria-hidden="true"/g)).toHaveLength(8);
      expect(html).toContain(language === 'ko' ? '같이 놀기' : 'Jugar juntos');
      expect(html).toContain(language === 'ko' ? '게임은 컴퓨터에서 같이 하자 ♡' : 'Para jugar, nos vemos en la computadora ♡');
      expect(html).not.toContain('<button');
      for (const game of gameCatalog) {
        expect(html).toContain(`href="/play?game=${game.id}"`);
        expect(html).toContain(`id="game-rail-title-${game.id}"`);
        expect(html).toContain(game.title[language]);
        expect(html).toContain(`id="game-rail-description-${game.id}"`);
        expect(html).toContain(game.subtitle[language]);
      }
    }
  });
});

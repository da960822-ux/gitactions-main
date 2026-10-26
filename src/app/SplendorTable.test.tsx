import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { splendorEngine } from '../games/splendor';
import { SplendorPublicBonuses, SplendorTable } from './SplendorTable';

describe('opponent Splendor details', () => {
  it('renders bought card faces and points while keeping reservations as backs only', () => {
    let state = splendorEngine.createInitialState(31);
    state = splendorEngine.applyAction(state, 'p1', { type: 'take', payload: { gems: ['white', 'blue', 'green'] } });
    const bought = { ...state.market[1][0], cost: { white: 0, blue: 0, green: 0, red: 0, black: 0 } };
    state = { ...state, market: { ...state.market, 1: [bought, ...state.market[1].slice(1)] } };
    state = splendorEngine.applyAction(state, 'p2', { type: 'buy', payload: { source: 'market', tier: 1, index: 0 } });
    state = splendorEngine.applyAction(state, 'p1', { type: 'take', payload: { gems: ['white', 'blue', 'green'] } });
    const hiddenReserveId = state.market[2][0].id;
    state = splendorEngine.applyAction(state, 'p2', { type: 'reserve', payload: { tier: 2, index: 0 } });
    const html = renderToStaticMarkup(<SplendorTable view={splendorEngine.getPlayerView(state, 'p1')} language="es" playerId="p1" runAction={() => {}}/>);
    expect(html).toMatch(/<button[^>]*class="sp-player-score [^"]*"[^>]*aria-haspopup="dialog"/);
    expect(html).toContain('aria-label="Ver las gemas y bonificaciones del rival"');
    expect(html).toContain('class="sp-player-detail-hint">Ver detalles</span>');
    expect(html).toContain('Información pública rival');
    const bonusSummary = renderToStaticMarkup(<SplendorPublicBonuses language="es" bonuses={{ white: 2, blue: 1, green: 0, red: 0, black: 0 }}/>);
    expect(bonusSummary).toContain('Bonificaciones permanentes por color');
    expect(bonusSummary).toContain('Blanca +2 · Azul +1 · Verde +0 · Roja +0 · Negra +0');
    expect(html).toContain('Cartas de desarrollo adquiridas');
    expect(html).toContain('Puntos de desarrollo');
    expect(html).toContain(`data-card-id="${bought.id}"`);
    expect(html).toContain('1 cartas reservadas boca abajo');
    expect(html.match(/class="sp-card-back"/g)).toHaveLength(1);
    expect(html).not.toContain(hiddenReserveId);
    const profileCss = readFileSync(new URL('../styles/splendor-premium.css', import.meta.url), 'utf8');
    expect(profileCss).toMatch(/\.sp-profile-reserved > \.sp-card-back[^}]*display: block;[^}]*width: 34px;[^}]*height: 44px;/);
    expect(profileCss).toMatch(/\.sp-profile-dialog h2,[^{]*\.spt-profile-dialog h2[^}]*color: #26483b;/);
  });

  it('shows legacy acquisition history as incomplete without inventing cards from bonus totals', () => {
    let state = splendorEngine.createInitialState(32);
    const previousScore = 4, previousBonus = { white: 3, blue: 1, green: 0, red: 0, black: 0 };
    state = { ...state, acquiredCards: undefined, acquiredCardHistoryComplete: undefined, cardPoints: { p1: previousScore, p2: 0 }, bonuses: { ...state.bonuses, p1: previousBonus } };
    const view = splendorEngine.getPlayerView(state, 'p2');
    expect(view.board.acquiredCards.p1).toEqual([]);
    expect(view.board.cardPoints.p1).toBe(previousScore);
    expect(view.board.acquiredCardHistoryComplete.p1).toBe(false);
  });
});

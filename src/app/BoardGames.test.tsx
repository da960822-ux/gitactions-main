import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import DominoBoard from './DominoBoard';
import MarbleBoard from './MarbleBoard';
import { orderDominoChain } from './domino-chain';
import { dominoPlacementsFor } from './DominoBoard';
import { marbleEngine } from '../games/marble';
import { dominoEngine } from '../games/domino';

const runAction = vi.fn();

describe('DominoBoard presentation', () => {
  const view = {
    mode: '1v1', turn: 'p1', status: 'your-turn', hand: [{ a: 2, b: 6 }, { a: 0, b: 0 }],
    board: { tiles: [{ a: 2, b: 3, by: 'p2' }], ends: { left: 2, right: 3 }, counts: { p1: 2, p2: 4 }, scores: { p1: 8, p2: 11 }, seats: ['p1', 'p2'], teams: { p1: ['p1'], p2: ['p2'] } },
    actions: [{ label: { ko: '2|6 왼쪽', es: '2|6 izquierda' }, action: { type: 'play', payload: { index: 0, side: 'left' } } }],
  };

  it('exposes playable hand tiles and only their legal endpoint actions in both languages', () => {
    const ko = renderToStaticMarkup(<DominoBoard view={view} language="ko" playerId="p1" runAction={runAction}/>);
    const es = renderToStaticMarkup(<DominoBoard view={view} language="es" playerId="p1" runAction={runAction}/>);

    expect(dominoPlacementsFor(view.actions, 0).map(choice => choice.action.payload?.side)).toEqual(['left']);
    expect(dominoPlacementsFor(view.actions, 1)).toEqual([]);
    expect(ko).toContain('내 타일 2와 6, 놓을 수 있음');
    expect(ko).toContain('aria-pressed="false"');
    expect(es).toContain('Tu ficha 2 y 6, disponible para jugar');
    expect(es).toContain('Se muestran al final');
  });

  it('keeps blocked-game feedback about lower remaining pips without adding a positive reward', () => {
    const html = renderToStaticMarkup(<DominoBoard view={{ ...view, phase: 'finished', status: 'finished', result: { winner: 'p1', reason: 'Blocked game; lower team pip total wins', scores: { p1: 8, p2: 11 } }, actions: [] }} language="es" playerId="p1" runAction={runAction}/>);
    expect(html).toContain('Gana el equipo con menos puntos restantes');
    expect(html).toContain('Puntos restantes');
    expect(html).not.toContain('game-value-delta');
    expect(html).not.toContain('¡+');
  });

  it('recognizes either human seat as a winner in the humans-versus-bots mode', () => {
    const html = renderToStaticMarkup(<DominoBoard view={{ ...view, mode: 'humans-vs-bots', phase: 'finished', board: { ...view.board, teams: { p1: ['p1', 'p2'], p2: ['b1', 'b2'] } }, status: 'finished', result: { winner: 'p1', reason: 'A player played all dominoes', scores: { p1: 0, p2: 12 } }, actions: [] }} language="es" playerId="p2" runAction={runAction}/>);
    expect(html).toContain('¡Ganó tu equipo!');
    expect(html).not.toContain('Ganó tu rival');
  });

  it('reconstructs the spatial chain from chronological history after left and right placements', () => {
    const ordered = orderDominoChain([{ a: 6, b: 6 }, { a: 5, b: 6 }, { a: 4, b: 5 }, { a: 6, b: 2 }], { left: 4, right: 2 });
    expect(ordered.map((tile: any) => `${tile.a}|${tile.b}`)).toEqual(['4|5', '5|6', '6|6', '6|2']);
    expect(ordered.slice(0, -1).every((tile: any, index: number) => tile.b === ordered[index + 1].a)).toBe(true);
  });

  it('keeps engine-produced legal chains connected and aligned with both open ends across seeds', () => {
    for (let seed = 0; seed < 32; seed += 1) {
      let state: any = dominoEngine.createInitialState(seed);
      for (let turn = 0; turn < 30 && !state.result; turn += 1) {
        const player = state.turn as 'p1' | 'p2';
        const current = dominoEngine.getPlayerView(state, player);
        const plays = current.actions.filter((choice: any) => choice.action.type === 'play');
        const action = plays.length ? plays[(turn % 2) === 0 ? plays.length - 1 : 0].action : current.actions.find((choice: any) => choice.action.type === 'pass')?.action;
        if (!action) break;
        state = dominoEngine.applyAction(state, player, action);
        const view = dominoEngine.getPlayerView(state, 'p1');
        const chain = orderDominoChain(view.board.tiles, view.board.ends);
        expect(chain).toHaveLength(view.board.tiles.length);
        expect(chain.slice(0, -1).every((tile: any, index: number) => tile.b === chain[index + 1].a)).toBe(true);
        if (chain.length) {
          expect(chain[0].a).toBe(view.board.ends.left);
          expect(chain.at(-1)!.b).toBe(view.board.ends.right);
        }
      }
    }
  });
});

describe('MarbleBoard presentation', () => {
  const makeView = (language: 'ko' | 'es') => {
    const state = marbleEngine.createInitialState(728);
    delete state.economicVersion;
    const view = marbleEngine.getPlayerView(state, 'p1');
    const property = view.board.tiles.find((tile: any) => tile.kind === 'property');
    property.owner = 'p1';
    property.houses = 2;
    view.board.assets.p1 += property.price + 200;
    view.board.lastEvent = {
      id: 'travel-cost', sequence: 1, playerId: 'p1',
      title: { ko: '여행 경비', es: 'Gastos de viaje' },
      text: { ko: '여행 경비로 100을 냅니다.', es: 'Pagas 100 por gastos de viaje.' },
      effect: 'cash', cashDelta: -100, from: null, to: null, steps: null,
    };
    return renderToStaticMarkup(<MarbleBoard view={view} language={language} playerId="p1" runAction={runAction}/>);
  };

  it('preserves the 40-space map while exposing localized owner, rent, building level, and real cash delta', () => {
    const ko = makeView('ko');
    const es = makeView('es');
    expect((ko.match(/role="listitem" aria-label=/g) ?? []).length).toBe(40);
    expect(ko).toContain('소유자 나');
    expect(ko).toContain('임대');
    expect(ko).toContain('빌딩');
    expect(ko).toContain('marble-event-amount is-negative">−100');
    expect(ko).toContain('광주');
    expect(es).toContain('Dueño Tú');
    expect(es).toContain('Edificio');
    expect(es).toContain('marble-event-amount is-negative">−100');
    expect(es).toContain('Santo Domingo');
    expect(es).toContain('Gwangju');
  });

  it('renders the existing event transaction and phase action without exposing a board-changing affordance', () => {
    const html = makeView('es');
    expect(html).toContain('Gastos de viaje');
    expect(html).toContain('Lanzar los dados');
    expect(html).toContain('role="list" aria-label="Recorrido de 40 casillas"');
    expect(html).not.toContain('eventDeck');
    expect(html).not.toContain('rng');
  });
});

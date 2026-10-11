import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { GameAction } from '../core/types';
import { dominoEngine } from '../games/domino';
import DominoBoard, { dominoOpeningChoice, dominoPlacementsFor, freshDominoTileSequences } from './DominoBoard';

const play = (index: number, side: 'left' | 'right'): GameAction => ({ type: 'play', payload: { index, side } });
const fixture = (overrides: Record<string, any> = {}) => ({
  game: 'domino', mode: '1v1', phase: 'play', round: 1, turn: 'p1', status: 'your-turn',
  settings: { difficulty: 'normal', targetScore: 0, capicuaBonus: 0, pasoCorridoBonus: 0, tranqueRule: 'team' },
  hand: [{ a: 2, b: 6 }, { a: 0, b: 0 }], opponentCount: 7,
  board: { tiles: [{ a: 3, b: 2, by: 'p2', side: 'right', sequence: 1 }], ends: { left: 3, right: 2 }, seats: ['p1', 'p2'], counts: { p1: 2, p2: 7 }, teams: { p1: ['p1'], p2: ['p2'] }, scores: null, matchScores: { p1: 0, p2: 0 }, roundResult: null },
  actions: [{ label: { ko: '왼쪽에 놓기', es: 'Jugar a la izquierda' }, action: play(0, 'left') }],
  log: [{ sequence: 1, type: 'play', actor: 'p2', title: { ko: '도미노 놓기', es: 'Jugar dominó' }, tile: { a: 3, b: 2 }, side: 'right' }],
  ...overrides,
});
const render = (view: any, language: 'ko' | 'es' = 'ko') => renderToStaticMarkup(createElement(DominoBoard, { view, language, playerId: 'p1', runAction: vi.fn() }));

describe('DominoBoard', () => {
  it('renders a warm felt table, connected public chain, bilingual setup and status without sums for hidden hands', () => {
    const view = fixture({ privateHands: { p2: [{ a: 6, b: 6 }] }, seed: 9182 });
    const html = render(view);
    expect(html).toContain('도미노');
    expect(html).toContain('공개된 도미노 줄');
    expect(html).toContain('상대');
    expect(html).toContain('7');
    expect(html).toContain('라운드 종료 후 공개');
    expect(html).not.toContain('6 | 6');
    expect(html).not.toContain('9182');
    expect(html).not.toContain('privateHands');
    expect(html).not.toContain('상대 손패 점수');
    expect(html).not.toContain('선택한 타일을 왼쪽 끝에 놓기');
  });

  it('uses only engine-emitted legal endpoints for a selected hand index', () => {
    const choices = [
      { action: play(0, 'left') },
      { action: play(0, 'right') },
      { action: play(1, 'left') },
      { action: { type: 'pass' } },
    ];
    expect(dominoPlacementsFor(choices, 0).map(choice => choice.action.payload?.side)).toEqual(['left', 'right']);
    expect(dominoPlacementsFor(choices, 1).map(choice => choice.action.payload?.side)).toEqual(['left']);
    expect(dominoPlacementsFor(choices, 9)).toEqual([]);
    expect(dominoPlacementsFor([{ action: { type: 'play', payload: { index: 0, side: 'center' } } }], 0)).toEqual([]);
  });

  it('offers the exact legal opening tile directly when the public chain is still empty', () => {
    const opening = { action: play(1, 'left') };
    expect(dominoOpeningChoice([opening])).toBe(opening);
    expect(dominoOpeningChoice([{ action: play(1, 'right') }])).toBeNull();
    const view = fixture({ board: { ...fixture().board, tiles: [], ends: null }, hand: [{ a: 2, b: 6 }, { a: 6, b: 6 }], actions: [opening] });
    const html = render(view);
    expect(html).toContain('시작 타일 6|6 놓기');
    expect(html).toContain('첫 타일 6|6 놓기');
  });

  it('renders the real seeded engine opening action for the active seat', () => {
    const state = dominoEngine.createInitialState(141);
    const activeSeat = state.turn as 'p1' | 'p2';
    const view = dominoEngine.getPlayerView(state, activeSeat);
    const legalOpening = view.actions.find((choice: any) => choice.action.type === 'play')?.action as GameAction;
    expect(dominoOpeningChoice(view.actions)?.action).toEqual(legalOpening);
    const html = renderToStaticMarkup(createElement(DominoBoard, { view, language: 'es', playerId: activeSeat, runAction: vi.fn() }));
    const tile = view.hand[Number(legalOpening.payload?.index)];
    expect(html).toContain(`Jugar ficha inicial ${tile.a}|${tile.b}`);
  });

  it('animates only newly committed placement sequences, not the initial board snapshot', () => {
    expect(freshDominoTileSequences([10, 11], [{ sequence: 10 }, { sequence: 11 }, { sequence: 12 }, { sequence: 13 }])).toEqual([12, 13]);
    expect(freshDominoTileSequences([], [{ a: 1, b: 2 }, { a: 3, b: 4 }])).toEqual([]);
    expect(render(fixture())).not.toContain('is-arriving');
  });

  it('shows all four seats and team roles in partner mode without revealing bot pip faces', () => {
    const view = fixture({ mode: 'partners', turn: 'b1', status: 'bot-turn', hand: [], board: {
      ...fixture().board,
      seats: ['p1', 'b1', 'p2', 'b2'], counts: { p1: 0, b1: 6, p2: 7, b2: 7 },
      teams: { p1: ['p1', 'b1'], p2: ['p2', 'b2'] },
    }, actions: [] });
    const html = render(view, 'es');
    expect(html).toContain('Tu mano');
    expect(html).toContain('IA');
    expect(html).toContain('Tu equipo');
    expect(html).toContain('Rivales');
    expect(html).toContain('role="img" aria-label="Ficha de dominó oculta"');
    expect(html).not.toContain('6 | 6');
  });

  it('calls the other human a teammate in the human-versus-bots mode', () => {
    const view = fixture({ mode: 'humans-vs-bots', turn: 'p2', status: 'opponent-turn', actions: [], board: {
      ...fixture().board, seats: ['p1', 'b1', 'p2', 'b2'], counts: { p1: 7, b1: 7, p2: 7, b2: 7 },
      teams: { p1: ['p1', 'p2'], p2: ['b1', 'b2'] },
    } });
    expect(render(view)).toContain('팀원 차례예요');
  });

  it('supports one legal configure action and legacy mode actions without fabricating other setup choices', () => {
    const config = { type: 'configure', payload: { mode: '1v1', difficulty: 'normal', targetScore: 0, capicuaBonus: 0, pasoCorridoBonus: 0, tranqueRule: 'team' } };
    const configured = render(fixture({ board: { ...fixture().board, tiles: [], ends: null }, actions: [{ action: config }] }));
    expect(configured).toContain('봇 난이도');
    expect(configured).toContain('카피쿠아 보너스');
    expect(configured).toContain('막힌 판 규칙');
    expect(configured).toContain('설정 적용');
    const legacy = render(fixture({ board: { ...fixture().board, tiles: [], ends: null }, actions: [{ action: { type: 'set-mode', payload: { mode: 'partners' } } }] }));
    expect(legacy).toContain('사람-봇 팀전');
    expect(legacy).not.toContain('매치 목표 점수');
  });

  it('shows pending paso bonuses as unsettled and keeps live pip scores private', () => {
    const html = render(fixture({ board: { ...fixture().board, roundBonuses: { p1: 25, p2: 0 }, scores: null } }));
    expect(html).toContain('라운드 종료 때 정산');
    expect(html).toContain('내 팀 +25');
    expect(html).toContain('라운드 종료 후 공개');
    expect(html).not.toContain('이번 점수');
  });

  it('reveals opposing faces and round scoring only when the server marks the round over', () => {
    const revealedHands = { p1: [{ a: 1, b: 2 }], p2: [{ a: 6, b: 6 }] };
    const ended = fixture({ phase: 'round-over', status: 'round-over', turn: 'p1', actions: [{ action: { type: 'next-round' } }], board: {
      ...fixture().board, counts: { p1: 1, p2: 1 }, scores: { p1: 3, p2: 12 }, revealedHands,
      roundResult: { winner: 'p1', pips: { p1: 3, p2: 12 }, award: 12, scoreDelta: { p1: 12, p2: 0 }, bonuses: { p1: 0, p2: 0 }, round: 1, reason: 'blocked' }, matchScores: { p1: 12, p2: 0 },
    } });
    const html = render(ended);
    expect(html).toContain('내 팀 승리');
    expect(html).toContain('다음 라운드');
    expect(html).toContain('12');
    expect(html).toContain('정산 점수: 내 팀 +12');
    expect(html).toContain('6 | 6');
    const activeHtml = render(fixture());
    expect(activeHtml).not.toContain('6 | 6');
    expect(activeHtml).not.toContain('이번 점수');
  });

  it('localizes legacy blocked-hand results and resolves human-team wins for either human seat', () => {
    const blocked = render(fixture({
      mode: 'humans-vs-bots', phase: 'finished', status: 'finished',
      board: { ...fixture().board, teams: { p1: ['p1', 'p2'], p2: ['b1', 'b2'] }, scores: { p1: 8, p2: 11 } },
      result: { winner: 'p1', reason: 'Blocked game; lower team pip total wins', scores: { p1: 8, p2: 11 } }, actions: [],
    }), 'es');
    expect(blocked).toContain('¡Ganó tu equipo!');
    expect(blocked).toContain('El juego quedó bloqueado. Gana el equipo con menos puntos restantes.');
    expect(blocked).toContain('Puntos restantes 8 a 11');
  });

  it('explains lowest-player tranque and distinguishes capicúa from its optional bonus', () => {
    const html = render(fixture({
      mode: 'partners', phase: 'round-over', status: 'round-over',
      settings: { ...fixture().settings, tranqueRule: 'lowest-player', capicuaBonus: 0 },
      board: { ...fixture().board, revealedHands: { p1: [], b1: [], p2: [], b2: [] }, roundResult: {
        winner: 'p1', reason: 'Blocked game; lower pip total wins', pips: { p1: 14, p2: 19 }, award: 19, capicua: true,
        bonuses: { p1: 25, p2: 0 }, scoreDelta: { p1: 25, p2: 0 }, pasoCorrido: 25, round: 1,
      } },
    }));
    expect(html).toContain('각 팀에서 손패 점수가 가장 낮은 사람을 비교했어요.');
    expect(html).toContain('카피쿠아 성립 · 추가 점수 없음');
    expect(html).toContain('정산 점수: 내 팀 +25 · 상대 팀 +0');
  });
});

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameAction } from '../core/types';
import { davinciEngine } from '../games/davinci';
import DaVinciTable, { daVinciGuessButtonLabel, davinciSnapshotKey, deriveDaVinciVisualEvent, findDaVinciGuess, findDaVinciJokerPlacement } from './DaVinciTable';

const guessActions = (index: number): { label: { ko: string; es: string }; action: GameAction }[] =>
  [...Array.from({ length: 12 }, (_, value) => ({ label: { ko: '추측', es: 'Adivinar' }, action: { type: 'guess', payload: { index, value } } as GameAction })), { label: { ko: '조커', es: 'Comodín' }, action: { type: 'guess', payload: { index, value: 'joker' } } }];

const privatePortraits = { black: '/private-game-art/black-joker.webp', white: '/private-game-art/white-joker.webp' };
function render(view: any, playerId: 'p1' | 'p2' = 'p1', language: 'ko' | 'es' = 'ko', jokerPortraits = privatePortraits) {
  return renderToStaticMarkup(createElement(DaVinciTable, { view, playerId, language, runAction: vi.fn(), jokerPortraits }));
}

describe('DaVinciTable', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('keeps rival hidden numbers out of content and attributes while showing public color and order', () => {
    const state = davinciEngine.createInitialState(23);
    const view = davinciEngine.getPlayerView(state, 'p1') as any;
    // A hostile/malformed view must still not print a value while revealed is false.
    view.board.opponentTiles[0].value = 987654;
    const html = render(view);
    expect(html).not.toContain('987654');
    expect(html).toContain('숫자 숨김');
    expect(html).toContain('흰색');
    expect(html).toContain('dv-tile-order');
    expect(html.match(/is-initial-deal/g)).toHaveLength(2);
    expect(html).not.toContain('987654');
  });

  it('renders interactive opponent targets and the 12-number selector in Korean and Spanish', () => {
    const view = {
      game: 'davinci', turn: 'p1', phase: 'guess', hand: [{ color: 'black', value: 6, revealed: false }],
      board: { opponentTiles: [{ color: 'white', value: null, revealed: false }, { color: 'black', value: null, revealed: false }], deckCount: 4, turnNumber: 3, tileCount: 26, actionLog: [], lastEvent: null },
      opponentCount: 2, actions: [...guessActions(0), ...guessActions(1), { label: { ko: '차례 마치기', es: 'Terminar turno' }, action: { type: 'stop' } }],
    };
    const ko = render(view);
    expect(ko.match(/class="dv-tile dv-tile-(?:white|black)[^"]*" aria-pressed=/g)).toHaveLength(2);
    expect(ko.match(/class="(?:is-selected)?"?[^>]*disabled=""/g) ?? []).toHaveLength(0);
    expect(ko.match(/<button[^>]*>(?:\d+|－)<\/button>/g)).toHaveLength(13);
    expect(ko).toContain('>－</button>');
    expect(ko).toContain('이 숫자로 추측하기');
    expect(ko).not.toContain('class="dv-guess-submit" disabled=""');
    expect(ko).toContain('남은 더미 4개');
    expect(ko).toContain('3번째 차례');
    const es = render(view, 'p1', 'es');
    expect(es).toContain('Adivina el número oculto');
    expect(es).toContain('Ficha rival 1 Blanca, número oculto');
    expect(es).toContain('Adivinar este número');
  });

  it('keeps both larger racks, the selected target, and public reveals explicit', () => {
    const view = {
      game: 'davinci', turn: 'p1', phase: 'guess',
      hand: [0, 2, 4, 6, 8, 10].map(value => ({ color: value % 2 ? 'black' : 'white', value, revealed: false })),
      board: { opponentTiles: Array.from({ length: 9 }, (_, index) => ({ color: index % 2 ? 'black' : 'white', value: index === 8 ? 11 : null, revealed: index === 8 })), deckCount: 2, turnNumber: 8, tileCount: 26, actionLog: [], lastEvent: null },
      opponentCount: 8, actions: [...guessActions(0), { label: { ko: '차례 마치기', es: 'Terminar turno' }, action: { type: 'stop' } }],
    };
    const html = render(view);
    expect(html.match(/class="dv-tile dv-own-tile/g)).toHaveLength(6);
    expect(html.match(/class="dv-tile dv-tile-(?:white|black)[^"]*" aria-pressed=/g)).toHaveLength(8);
    expect(html).toContain('>목표</em>');
    expect(html).toContain('state-icons.svg#revealed');
    expect(html).toContain('>11</b>');
    expect(html).toContain('숫자 숨김');
  });

  it('matches a joker guess by its explicit engine value instead of coercing it to NaN', () => {
    const choices = guessActions(2);
    expect(findDaVinciGuess(choices, 2, 'joker')?.action).toEqual({ type: 'guess', payload: { index: 2, value: 'joker' } });
    expect(findDaVinciGuess(choices, 2, 11)?.action).toEqual({ type: 'guess', payload: { index: 2, value: 11 } });
    expect(findDaVinciGuess(choices, 1, 'joker')).toBeUndefined();
  });

  it('localizes the joker guess CTA while preserving the numeric CTA', () => {
    expect(daVinciGuessButtonLabel('ko', 'joker')).toBe('조커로 추측하기');
    expect(daVinciGuessButtonLabel('es', 'joker')).toBe('Adivinar el comodín');
    expect(daVinciGuessButtonLabel('ko', 8)).toBe('이 숫자로 추측하기');
    expect(daVinciGuessButtonLabel('es', 8)).toBe('Adivinar este número');
  });

  it('clarifies that a failed guess reveals no new tile once the deck is empty', () => {
    const view = {
      game: 'davinci', turn: 'p1', phase: 'guess', hand: [{ color: 'black', value: 3, revealed: false }],
      board: { opponentTiles: [{ color: 'white', value: null, revealed: false }], deckCount: 0, turnNumber: 6, tileCount: 26, actionLog: [], lastEvent: null },
      opponentCount: 1, actions: [...guessActions(0), { label: { ko: '차례 마치기', es: 'Terminar turno' }, action: { type: 'stop' } }],
    };
    const ko = render(view);
    expect(ko).toContain('더미가 비었어요. 틀려도 새로 공개될 내 타일은 없고 차례가 끝나요.');
    expect(ko).not.toContain('방금 뽑은 타일이 공개되고 차례가 끝나요.');
    expect(ko).toContain('추측할 숫자 또는 조커');
    expect(render(view, 'p1', 'es')).toContain('Número o comodín que quieres adivinar');
  });

  it('shows only revealed values and public attempted guesses in the history', () => {
    const view = {
      game: 'davinci', turn: 'p2', phase: 'draw', hand: [{ color: 'white', value: 2, revealed: false }, { color: 'black', value: 9, revealed: true }],
      board: { opponentTiles: [{ color: 'black', value: null, revealed: false }, { color: 'white', value: 7, revealed: true }], deckCount: 3, turnNumber: 4,
        actionLog: [{ sequence: 3, type: 'correct-guess', actor: 'p1', targetIndex: 1, guess: 7 }], lastEvent: { sequence: 3, type: 'correct-guess', actor: 'p1', targetIndex: 1, guess: 7 } },
      opponentCount: 1, actions: [{ label: { ko: '뽑기', es: 'Robar' }, action: { type: 'draw' } }],
    };
    const html = render(view, 'p2', 'es');
    expect(html).toContain('>7</b>');
    expect(html).toContain('Ficha 2:');
    expect(html).toContain('<strong>7</strong>');
    expect(html).toContain('Tú puedes ver tus números');
    expect(html).not.toContain('value="null"');
  });

  it('animates the actor tile on a wrong guess, not the separately guessed rival target', () => {
    const previous = {
      viewer: 'p1' as const,
      view: { turn: 'p1', phase: 'guess', hand: [{ color: 'white', value: 1, revealed: false }, { color: 'black', value: 4, revealed: false }], board: { opponentTiles: [{ color: 'black', value: null, revealed: false }, { color: 'white', value: null, revealed: false }], actionLog: [], lastEvent: null } },
    };
    const next = {
      turn: 'p2', phase: 'draw', hand: [{ color: 'white', value: 1, revealed: false }, { color: 'black', value: 4, revealed: true }],
      board: { opponentTiles: [{ color: 'black', value: null, revealed: false }, { color: 'white', value: null, revealed: false }], actionLog: [{ sequence: 1, type: 'wrong-guess', actor: 'p1', targetIndex: 0, guess: 10, revealedOwnIndex: 1 }], lastEvent: { sequence: 1, type: 'wrong-guess', actor: 'p1', targetIndex: 0, guess: 10, revealedOwnIndex: 1 } },
    };
    const visualEvent = deriveDaVinciVisualEvent(previous, next, 'p1');
    expect(visualEvent).toMatchObject({ type: 'wrong', index: 1, guess: 10, actor: 'p1', value: 4 });
    expect(deriveDaVinciVisualEvent(null, next, 'p1')).toBeNull();
    expect(deriveDaVinciVisualEvent(previous, next, 'p2')).toBeNull();
    expect(davinciSnapshotKey(next)).not.toContain('10');
  });

  it('animates authoritative insertion and the final correct reveal, but ignores repeated event sequences', () => {
    const base = { turn: 'p1', phase: 'draw', hand: [{ color: 'white', value: 2, revealed: false }], board: { opponentTiles: [{ color: 'black', value: null, revealed: false }], actionLog: [], lastEvent: null } };
    const drawn = { ...base, phase: 'guess', hand: [base.hand[0], { color: 'white', value: 5, revealed: false }], board: { ...base.board, actionLog: [{ sequence: 1, type: 'draw', actor: 'p1', insertedIndex: 1 }], lastEvent: { sequence: 1, type: 'draw', actor: 'p1', insertedIndex: 1 } } };
    expect(deriveDaVinciVisualEvent({ viewer: 'p1', view: base }, drawn, 'p1')).toMatchObject({ type: 'draw', index: 1 });

    const winning = { ...drawn, result: { winner: 'p1' }, board: { ...drawn.board, opponentTiles: [{ color: 'black', value: 11, revealed: true }], actionLog: [{ sequence: 2, type: 'correct-guess', actor: 'p1', targetIndex: 0, guess: 11 }], lastEvent: { sequence: 2, type: 'correct-guess', actor: 'p1', targetIndex: 0, guess: 11 } } };
    expect(deriveDaVinciVisualEvent({ viewer: 'p1', view: drawn }, winning, 'p1')).toMatchObject({ type: 'correct', index: 0, value: 11 });
    expect(deriveDaVinciVisualEvent({ viewer: 'p1', view: winning }, { ...winning, board: { ...winning.board, lastEvent: { ...winning.board.lastEvent, sequence: 2 } } }, 'p1')).toBeNull();
  });

  it('uses an outcome-specific localized result banner', () => {
    const base = { game: 'davinci', turn: 'p1', phase: 'guess', hand: [{ color: 'white', value: 3, revealed: false }], board: { opponentTiles: [{ color: 'black', value: 8, revealed: true }], deckCount: 0, turnNumber: 9, actionLog: [], lastEvent: null }, opponentCount: 0, actions: [] };
    expect(render({ ...base, result: { winner: 'p1', reason: 'All opposing tiles were revealed' } }, 'p1', 'es')).toContain('data-game="davinci" data-outcome="win"');
    const loss = render({ ...base, result: { winner: 'p2', reason: 'All opposing tiles were revealed' } }, 'p1');
    expect(loss).toContain('내 타일이 모두 공개됐어요.');
    expect(loss).not.toContain('모든 상대 타일을 공개했어요.');
  });

  it('uses an injected private portrait on an own joker and falls back to the rule symbol without it', () => {
    const view = { game: 'davinci', turn: 'p1', phase: 'draw', hand: [{ color: 'black', value: 'joker', revealed: false }], board: { opponentTiles: [{ color: 'white', value: null, revealed: false }], deckCount: 12, turnNumber: 1, tileCount: 26, actionLog: [], lastEvent: null }, actions: [] };
    const html = render(view);
    expect(html).toContain('class="dv-joker-portrait"');
    expect(html).toContain(privatePortraits.black);
    expect(html).not.toContain('yeonseok-lisbeth-cutout');
    const fallback = render(view, 'p1', 'ko', {} as typeof privatePortraits);
    expect(fallback).not.toContain('dv-joker-portrait');
    expect(fallback).toContain('>－</b>');
    expect(html).toContain('숫자 －');
    expect(html).not.toContain('NaN');
  });

  it('uses separate injected couple portraits only on revealed rival jokers', () => {
    vi.stubEnv('VITE_DAVINCI_BLACK_JOKER_IMAGE', '/private-assets/davinci/black-joker.webp');
    vi.stubEnv('VITE_DAVINCI_WHITE_JOKER_IMAGE', '/private-assets/davinci/white-joker.png');
    const view = { game: 'davinci', turn: 'p1', phase: 'waiting', hand: [], board: { opponentTiles: [{ color: 'black', value: 'joker', revealed: false }, { color: 'white', value: 'joker', revealed: false }], deckCount: 12, tileCount: 26 }, actions: [] };
    for (const language of ['ko', 'es'] as const) {
      const hidden = render(view, 'p1', language);
      expect(hidden).not.toContain('dv-joker-portrait');
      expect(hidden).not.toContain('yeonseok-lisbeth-cutout');
      expect(hidden).not.toContain('private-game-art');
      expect(hidden).not.toContain('635 70');
      const visible = render({ ...view, board: { ...view.board, opponentTiles: view.board.opponentTiles.map(tile => ({ ...tile, revealed: true })) } }, 'p1', language);
      expect(visible.match(/class="dv-joker-portrait"/g)).toHaveLength(2);
      expect(visible).toContain(privatePortraits.black);
      expect(visible).toContain(privatePortraits.white);
    }
  });

  it('offers only server-provided gaps for the private joker and a finish-ready action after placement', () => {
    const setup = {
      game: 'davinci', turn: 'p1', phase: 'setup', hand: [{ color: 'white', value: 2, revealed: false }, { color: 'black', value: 'joker', revealed: false }, { color: 'black', value: 8, revealed: false }],
      ownJokerToPlace: { color: 'black', index: 1 }, board: { opponentTiles: [{ color: 'white', value: null, revealed: false }], deckCount: 18, turnNumber: 1, tileCount: 26, setupReady: { p1: false, p2: false }, actionLog: [], lastEvent: null }, opponentCount: 1,
      actions: [0, 1, 2].map(index => ({ label: { ko: '자리', es: 'Espacio' }, action: { type: 'place-joker', payload: { index } } })),
    };
    const html = render(setup, 'p1', 'es');
    expect(html).toContain('Colocar el comodín');
    expect(html).toContain('Comodín por colocar');
    expect(html.match(/class="dv-gap-button"/g)).toHaveLength(3);
    expect(html).not.toContain('초기 패 준비 완료');
    expect(findDaVinciJokerPlacement(setup.actions, 2)?.action).toEqual({ type: 'place-joker', payload: { index: 2 } });

    const ready = { ...setup, hand: [{ color: 'white', value: 2, revealed: false }, { color: 'black', value: 'joker', revealed: false }, { color: 'black', value: 8, revealed: false }], ownJokerToPlace: undefined, actions: [{ label: { ko: '완료', es: 'Listo' }, action: { type: 'finish-setup' } }] };
    expect(render(ready)).toContain('초기 패 준비 완료');
    expect(render(ready)).not.toContain('dv-gap-button');
  });

  it('shows setup waiting only until both players are ready, then shows ordinary turn waiting', () => {
    const base = {
      game: 'davinci', turn: 'p2', phase: 'waiting', hand: [{ color: 'white', value: 4, revealed: false }],
      board: { opponentTiles: [{ color: 'black', value: null, revealed: false }], deckCount: 18, turnNumber: 1, tileCount: 26, setupReady: { p1: true, p2: false }, actionLog: [], lastEvent: null },
      opponentCount: 1, actions: [],
    };
    const setupWait = render(base, 'p1');
    expect(setupWait).toContain('준비가 끝났어요. 상대가 준비를 마치면 대국이 시작돼요.');
    expect(setupWait).not.toContain('상대가 행동하고 있어요.');

    const inGameWait = render({ ...base, board: { ...base.board, setupReady: { p1: true, p2: true }, turnNumber: 2 } }, 'p1');
    expect(inGameWait).not.toContain('준비가 끝났어요. 상대가 준비를 마치면 대국이 시작돼요.');
    expect(inGameWait).toContain('상대가 행동하고 있어요.');

    const liveTurn = { ...base, turn: 'p1', phase: 'draw', board: { ...base.board, setupReady: { p1: true, p2: true }, turnNumber: 2 }, actions: [{ label: { ko: '뽑기', es: 'Robar' }, action: { type: 'draw' } }] };
    expect(render(liveTurn, 'p1')).toContain('내 차례');
    expect(render({ ...liveTurn, phase: 'waiting' }, 'p2')).toContain('상대 차례');
    expect(render(liveTurn, 'p1')).not.toContain('준비 완료');
  });

  it('classifies legacy own penalties by actor and does not replay unchanged modern events', () => {
    const before = { turn: 'p1', phase: 'guess', hand: [{ color: 'black', value: 4, revealed: false }], board: { opponentTiles: [{ color: 'white', value: null, revealed: false }] } };
    const after = { ...before, turn: 'p2', hand: [{ color: 'black', value: 4, revealed: true }] };
    expect(deriveDaVinciVisualEvent({ viewer: 'p1', view: before }, after, 'p1')).toMatchObject({ type: 'wrong', actor: 'p1', index: 0 });
    const event = { sequence: 1, type: 'draw', actor: 'p1', insertedIndex: 0 };
    expect(deriveDaVinciVisualEvent({ viewer: 'p1', view: { ...before, board: { ...before.board, lastEvent: event } } }, { ...after, board: { ...after.board, lastEvent: event } }, 'p1')).toBeNull();
  });
});


describe('approved public joker artwork', () => {
  it('uses the two exact generated drawings by color and omits both from hidden rival tiles', () => {
    const base = { game: 'davinci', turn: 'p1', phase: 'waiting', hand: [], board: { opponentTiles: [], deckCount: 12, tileCount: 26, turnNumber: 1, actionLog: [], lastEvent: null }, actions: [] };
    for (const [color, name] of [['black', 'waterfront'], ['white', 'indoor']] as const) {
      const html = renderToStaticMarkup(createElement(DaVinciTable, { view: { ...base, hand: [{ color, value: 'joker', revealed: false }] }, playerId: 'p1', language: 'ko', runAction: vi.fn() }));
      expect(html).toContain(`/images/davinci/joker-couple-${name}.webp`);
      expect(html).not.toContain('yeonseok-lisbeth-cutout');
    }
    for (const playerId of ['p1', 'p2'] as const) for (const language of ['ko', 'es'] as const) {
      const view = { ...base, board: { ...base.board, opponentTiles: [{ color: 'black', value: 'joker', revealed: false }, { color: 'white', value: 'joker', revealed: false }] } };
      const html = renderToStaticMarkup(createElement(DaVinciTable, { view, playerId, language, runAction: vi.fn() }));
      expect(html).not.toContain('joker-couple');
      expect(html).not.toContain('dv-joker-portrait');
      expect(html).not.toContain('<img');
    }
  });
});

import { describe, expect, it } from 'vitest';
import { davinciEngine } from './davinci';

type Seat = 'p1' | 'p2';

function finishSetup(start: any) {
  let state = start;
  for (const player of ['p1', 'p2'] as const) {
    let view = davinciEngine.getPlayerView(state, player);
    while (view.ownJokerToPlace) {
      const placement = view.actions.find((item: any) => item.action.type === 'place-joker');
      expect(placement).toBeDefined();
      state = davinciEngine.applyAction(state, player, { type: 'place-joker', payload: { index: state.hands[player].length - 1 } });
      view = davinciEngine.getPlayerView(state, player);
    }
    if (view.actions.some((item: any) => item.action.type === 'finish-setup')) {
      state = davinciEngine.applyAction(state, player, { type: 'finish-setup' });
    }
  }
  return state;
}

function wrongGuess(value: number | 'joker') {
  return value === 'joker' ? 0 : (value + 1) % 12;
}

describe('davinciEngine', () => {
  it('deals 26 tiles, hides rival values, and privately exposes only the caller’s setup joker', () => {
    const state: any = davinciEngine.createInitialState(31);
    expect(davinciEngine.createInitialState(31)).toEqual(state);
    expect(state.deck).toHaveLength(18);
    expect(state.hands.p1).toHaveLength(4);
    expect(state.hands.p2).toHaveLength(4);
    expect([...state.hands.p1, ...state.hands.p2, ...state.deck]).toHaveLength(26);
    for (const player of ['p1', 'p2'] as const) {
      const view: any = davinciEngine.getPlayerView(state, player);
      const opponent = player === 'p1' ? 'p2' : 'p1';
      expect(view.phase).toBe('setup');
      expect(view.board).toMatchObject({ deckCount: 18, tileCount: 26, turnNumber: 1, actionLog: [], lastEvent: null });
      expect(view.board.opponentTiles).toHaveLength(4);
      expect(view.board.opponentTiles.every((tile: any, i: number) => tile.value === null && tile.revealed === false && tile.color === state.hands[opponent][i].color && Object.keys(tile).sort().join(',') === 'color,revealed,value')).toBe(true);
      expect(view.ownJokerToPlace?.color).toBe(state.hands[player].find((tile: any) => tile.value === 'joker')?.color);
    }
    const p1: any = davinciEngine.getPlayerView(state, 'p1');
    const p2: any = davinciEngine.getPlayerView(state, 'p2');
    expect(p1).not.toHaveProperty('seed');
    expect(p1).not.toHaveProperty('deck');
    if (p1.ownJokerToPlace) expect(p2).not.toHaveProperty('ownJokerToPlace');

    const ready = finishSetup(state);
    expect(ready.phase).toBe('draw');
    const drawn = davinciEngine.applyAction(ready, 'p1', { type: 'draw' });
    const guesses = davinciEngine.getPlayerView(drawn, 'p1').actions.filter((item: any) => item.action.type === 'guess');
    expect(guesses).toHaveLength(52);
    expect(guesses.filter((item: any) => item.action.payload.index === 0).map((item: any) => item.action.payload.value)).toEqual([...Array.from({ length: 12 }, (_, n) => n), 'joker']);
    expect(guesses[0].action.payload).toEqual({ index: 0, value: 0 });
    expect(guesses[0].label.ko).toContain(ready.hands.p2[0].color === 'black' ? '검정' : '흰색');
    expect(davinciEngine.getPlayerView(drawn, 'p1').board.opponentTiles.every((tile: any) => tile.value === null)).toBe(true);
    expect(drawn).not.toBe(ready);
    expect(ready.phase).toBe('draw');
    expect(drawn.phase).toBe(drawn.hands.p1[drawn.drawnIndex!].value === 'joker' ? 'place-joker' : 'guess');
  });

  it('lets both seats place every initial joker, keeps the other rack private, and records only public readiness', () => {
    let initial: any;
    for (let seed = 1; seed < 500; seed++) {
      const candidate: any = davinciEngine.createInitialState(seed);
      if (candidate.hands.p1.filter((tile: any) => tile.value === 'joker').length === 2) { initial = candidate; break; }
    }
    expect(initial).toBeDefined();
    let state = initial;
    const beforeCount = state.hands.p1.length;
    for (let n = 0; n < 2; n++) {
      const view: any = davinciEngine.getPlayerView(state, 'p1');
      expect(view.ownJokerToPlace?.color).toBeDefined();
      const action = view.actions.find((item: any) => item.action.type === 'place-joker');
      state = davinciEngine.applyAction(state, 'p1', { ...action.action, payload: { index: n } });
      expect(state.hands.p1).toHaveLength(beforeCount);
      expect(state.setupPending.p1).toHaveLength(1 - n);
      expect(state.actionLog.at(-1)).toMatchObject({ type: 'arrange', actor: 'p1', insertedIndex: n });
      const ownerView: any = davinciEngine.getPlayerView(state, 'p1');
      expect(ownerView.board.lastEvent).toMatchObject({ type: 'arrange', actor: 'p1', insertedIndex: n });
      const rivalView: any = davinciEngine.getPlayerView(state, 'p2');
      expect(rivalView).not.toHaveProperty('ownJokerToPlace');
      expect(rivalView.actions.some((item: any) => item.action.type === 'place-joker')).toBe(false);
      expect(rivalView.board.actionLog.some((event: any) => event.type === 'arrange')).toBe(false);
      expect(rivalView.board.lastEvent?.type).not.toBe('arrange');
    }
    expect(davinciEngine.validateAction(initial, 'p1', { type: 'finish-setup' })).toBe('Place your joker first');
    expect(davinciEngine.validateAction(state, 'p1', { type: 'finish-setup' })).toBeNull();
    state = davinciEngine.applyAction(state, 'p1', { type: 'finish-setup' });
    expect(state.phase).toBe('setup');
    expect(davinciEngine.getPlayerView(state, 'p1').phase).toBe('waiting');
    expect(davinciEngine.getPlayerView(state, 'p2').phase).toBe('setup');
    expect(state.actionLog.at(-1)).toMatchObject({ type: 'ready', actor: 'p1' });
    expect(davinciEngine.validateAction(state, 'p1', { type: 'place-joker', payload: { index: 0 } })).toBe('Rack is already ready');
    state = finishSetup(state);
    expect(state.phase).toBe('draw');
    expect(state.setupReady).toEqual({ p1: true, p2: true });
    expect(state.turnNumber).toBe(1);
    expect(state.hands.p1.filter((tile: any) => tile.value === 'joker')).toHaveLength(2);
  });

  it('reveals a correct answer and ends when all rival tiles are exposed', () => {
    let state: any = finishSetup(davinciEngine.createInitialState(8));
    state = davinciEngine.applyAction(state, 'p1', { type: 'draw' });
    while (!state.result) {
      const index = state.hands.p2.findIndex((tile: any) => !tile.revealed);
      state = davinciEngine.applyAction(state, 'p1', { type: 'guess', payload: { index, value: state.hands.p2[index].value } });
    }
    expect(state.hands.p2.every((tile: any) => tile.revealed)).toBe(true);
    expect(state.result.winner).toBe('p1');
    const target = state.hands.p2[0];
    expect(davinciEngine.getPlayerView(state, 'p1').board.opponentTiles[0]).toMatchObject({ color: target.color, value: target.value });
  });

  it('allows correct guesses to continue or stop while keeping hidden values private', () => {
    let state: any = finishSetup(davinciEngine.createInitialState(18));
    state = davinciEngine.applyAction(state, 'p1', { type: 'draw' });
    if (state.phase === 'place-joker') state = davinciEngine.applyAction(state, 'p1', { type: 'place-joker', payload: { index: state.hands.p1.length - 1 } });
    const first = state.hands.p2.findIndex((tile: any) => !tile.revealed);
    state = davinciEngine.applyAction(state, 'p1', { type: 'guess', payload: { index: first, value: state.hands.p2[first].value } });
    const afterCorrect = davinciEngine.getPlayerView(state, 'p1');
    expect(afterCorrect.board.opponentTiles[first]).toMatchObject({ value: state.hands.p2[first].value, revealed: true });
    expect(afterCorrect.actions.filter((item: any) => item.action.type === 'guess')).toHaveLength(39);
    expect(afterCorrect.actions.some((item: any) => item.action.type === 'stop')).toBe(true);
    const second = state.hands.p2.findIndex((tile: any) => !tile.revealed);
    state = davinciEngine.applyAction(state, 'p1', { type: 'guess', payload: { index: second, value: state.hands.p2[second].value } });
    state = davinciEngine.applyAction(state, 'p1', { type: 'stop' });
    expect(state.turn).toBe('p2');
    expect(state.phase).toBe('draw');
    expect(state.mayStop).toBe(false);
    expect(davinciEngine.validateAction(state, 'p1', { type: 'guess', payload: { index: 2, value: 0 } })).toBe('Not your guessing turn');
    const rival: any = davinciEngine.getPlayerView(state, 'p2');
    expect(rival.hand.some((tile: any) => tile.revealed)).toBe(true);
    expect(rival.board.opponentTiles.filter((tile: any) => !tile.revealed).every((tile: any) => tile.value === null)).toBe(true);
  });

  it('reveals only the newly drawn tile after a wrong guess and records no answer', () => {
    let state: any = finishSetup(davinciEngine.createInitialState(91));
    state = davinciEngine.applyAction(state, 'p1', { type: 'draw' });
    if (state.phase === 'place-joker') state = davinciEngine.applyAction(state, 'p1', { type: 'place-joker', payload: { index: state.hands.p1.length - 1 } });
    const drawn = state.hands.p1[state.drawnIndex];
    const index = state.hands.p2.findIndex((tile: any) => !tile.revealed);
    const targetValue = state.hands.p2[index].value;
    const guess = wrongGuess(targetValue);
    state = davinciEngine.applyAction(state, 'p1', { type: 'guess', payload: { index, value: guess } });
    expect(state.turn).toBe('p2');
    expect(state.hands.p1.some((tile: any) => tile.value === drawn.value && tile.color === drawn.color && tile.revealed)).toBe(true);
    expect(state.hands.p2[index]).toMatchObject({ value: targetValue, revealed: false });
    const p1: any = davinciEngine.getPlayerView(state, 'p1');
    expect(p1.board.opponentTiles[index]).toEqual({ value: null, color: state.hands.p2[index].color, revealed: false });
    expect(p1.board.lastEvent).toMatchObject({ type: 'wrong-guess', actor: 'p1', targetIndex: index, guess, revealedOwnIndex: expect.any(Number) });
    expect(p1.board.lastEvent).not.toHaveProperty('answer');
    expect(p1.board.turnNumber).toBe(2);
    expect(p1.board.actionLog.at(-1)).not.toHaveProperty('answer');
    const p2: any = davinciEngine.getPlayerView(state, 'p2');
    expect(p2.board.opponentTiles.some((tile: any) => tile.revealed && tile.value === drawn.value && tile.color === drawn.color)).toBe(true);
  });

  it('forces a drawn joker to be placed before guessing and does not disclose its location to the rival', () => {
    let state: any = finishSetup(davinciEngine.createInitialState(1));
    state.deck = [...state.deck.filter((tile: any) => tile.value !== 'joker'), { color: 'black', value: 'joker', revealed: false }];
    state = davinciEngine.applyAction(state, 'p1', { type: 'draw' });
    expect(state.phase).toBe('place-joker');
    expect(davinciEngine.getPlayerView(state, 'p1').ownJokerToPlace).toMatchObject({ color: 'black', index: expect.any(Number) });
    expect(davinciEngine.getPlayerView(state, 'p2')).not.toHaveProperty('ownJokerToPlace');
    expect(davinciEngine.getPlayerView(state, 'p2').actions.some((item: any) => item.action.type === 'place-joker')).toBe(false);
    expect(davinciEngine.validateAction(state, 'p1', { type: 'guess', payload: { index: 0, value: 0 } })).toBe('Not your guessing turn');
    const oldIndex = state.drawnIndex;
    state = davinciEngine.applyAction(state, 'p1', { type: 'place-joker', payload: { index: 0 } });
    expect(state.phase).toBe('guess');
    expect(state.hands.p1[0].value).toBe('joker');
    expect(state.hands.p1[0].color).toBe('black');
    expect(state.actionLog.at(-1)).toMatchObject({ type: 'arrange', actor: 'p1', insertedIndex: 0 });
    expect(state.actionLog.at(-1)).not.toHaveProperty('color');
    expect(davinciEngine.validateAction(state, 'p1', { type: 'place-joker', payload: { index: oldIndex } })).toBe('Cannot place a joker now');
    expect(davinciEngine.getPlayerView(state, 'p1').actions.filter((item: any) => item.action.type === 'guess' && item.action.payload.value === 'joker')).toHaveLength(4);
    const targetIndex = state.hands.p2.findIndex((tile: any) => !tile.revealed);
    const wrong = wrongGuess(state.hands.p2[targetIndex].value);
    state = davinciEngine.applyAction(state, 'p1', { type: 'guess', payload: { index: targetIndex, value: wrong } });
    expect(state.hands.p1[0]).toMatchObject({ color: 'black', value: 'joker', revealed: true });
    expect(state.actionLog.at(-1)).toMatchObject({ type: 'wrong-guess', actor: 'p1', revealedOwnIndex: 0, guess: wrong });
    expect(davinciEngine.getPlayerView(state, 'p2').board.opponentTiles[0]).toMatchObject({ color: 'black', value: 'joker', revealed: true });
  });

  it('accepts the joker as a guess for any hidden target and reveals it only after a correct guess', () => {
    let state: any;
    for (let seed = 1; seed < 500; seed++) {
      const candidate: any = davinciEngine.createInitialState(seed);
      if (candidate.hands.p2.some((tile: any) => tile.value === 'joker')) { state = finishSetup(candidate); break; }
    }
    expect(state).toBeDefined();
    const index = state.hands.p2.findIndex((tile: any) => tile.value === 'joker');
    const before: any = davinciEngine.getPlayerView(state, 'p1');
    expect(before.board.opponentTiles[index]).toMatchObject({ value: null, revealed: false });
    expect(before.board.opponentTiles[index]).not.toHaveProperty('joker');
    state = davinciEngine.applyAction(state, 'p1', { type: 'draw' });
    if (state.phase === 'place-joker') state = davinciEngine.applyAction(state, 'p1', { type: 'place-joker', payload: { index: state.hands.p1.length - 1 } });
    expect(davinciEngine.validateAction(state, 'p1', { type: 'guess', payload: { index, value: 'joker' } })).toBeNull();
    state = davinciEngine.applyAction(state, 'p1', { type: 'guess', payload: { index, value: 'joker' } });
    expect(state.hands.p2[index]).toMatchObject({ value: 'joker', revealed: true });
    expect(davinciEngine.getPlayerView(state, 'p1').board.lastEvent).toMatchObject({ type: 'correct-guess', targetIndex: index, guess: 'joker' });
  });

  it('continues guessing after the stock is exhausted without exposing a new tile', () => {
    let state: any = finishSetup(davinciEngine.createInitialState(4));
    state.deck = [];
    expect(davinciEngine.getPlayerView(state, 'p1').actions[0].action.type).toBe('skip-draw');
    state = davinciEngine.applyAction(state, 'p1', { type: 'skip-draw' });
    const count = state.hands.p1.length;
    const target = state.hands.p2[0];
    state = davinciEngine.applyAction(state, 'p1', { type: 'guess', payload: { index: 0, value: wrongGuess(target.value) } });
    expect(state.turn).toBe('p2');
    expect(state.phase).toBe('guess');
    expect(state.hands.p1).toHaveLength(count);
    expect(state.hands.p1.every((tile: any) => !tile.revealed)).toBe(true);
    expect(davinciEngine.getPlayerView(state, 'p1').board.opponentTiles[0]).toMatchObject({ value: null, revealed: false });
  });

  it('inserts equal numbered values with black before white while preserving existing numbers around jokers', () => {
    let state: any = finishSetup(davinciEngine.createInitialState(7));
    const hand = [{ color: 'black', value: 2, revealed: false }, { color: 'white', value: 5, revealed: false }, { color: 'black', value: 9, revealed: false }];
    state = { ...state, phase: 'draw', turn: 'p1', hands: { ...state.hands, p1: hand }, deck: [{ color: 'black', value: 5, revealed: false }] };
    state = davinciEngine.applyAction(state, 'p1', { type: 'draw' });
    expect(state.hands.p1.map((tile: any) => [tile.value, tile.color])).toEqual([[2, 'black'], [5, 'black'], [5, 'white'], [9, 'black']]);
    state.phase = 'draw';
    state.deck = [{ color: 'white', value: 'joker', revealed: false }];
    state = davinciEngine.applyAction(state, 'p1', { type: 'draw' });
    expect(state.hands.p1.map((tile: any) => tile.value)).toEqual([2, 5, 5, 9, 'joker']);
    state = davinciEngine.applyAction(state, 'p1', { type: 'place-joker', payload: { index: 2 } });
    expect(state.hands.p1.map((tile: any) => tile.value)).toEqual([2, 5, 'joker', 5, 9]);
  });

  it('records correct-guess and stop metadata without changing the hidden-value boundary', () => {
    let state: any = finishSetup(davinciEngine.createInitialState(22));
    const index = 1;
    const value = state.hands.p2[index].value;
    state = davinciEngine.applyAction(state, 'p1', { type: 'draw' });
    if (state.phase === 'place-joker') state = davinciEngine.applyAction(state, 'p1', { type: 'place-joker', payload: { index: state.hands.p1.length - 1 } });
    state = davinciEngine.applyAction(state, 'p1', { type: 'guess', payload: { index, value } });
    const view: any = davinciEngine.getPlayerView(state, 'p1');
    expect(view.board.lastEvent).toMatchObject({ type: 'correct-guess', actor: 'p1', targetIndex: index, guess: value });
    expect(view.board.lastEvent).not.toHaveProperty('revealedValue');
    expect(view.board.opponentTiles[index]).toMatchObject({ value, revealed: true });
    state = davinciEngine.applyAction(state, 'p1', { type: 'stop' });
    const afterStop: any = davinciEngine.getPlayerView(state, 'p2');
    expect(afterStop.board.lastEvent).toMatchObject({ type: 'stop', actor: 'p1' });
    expect(afterStop.board.turnNumber).toBe(2);
    expect(afterStop.board.actionLog.at(-1)).not.toHaveProperty('guess');
  });

  it('keeps legacy states without rulesVersion on the 24-number, 12-guess contract', () => {
    const prepared: any = finishSetup(davinciEngine.createInitialState(5));
    const numbered = [...prepared.hands.p1, ...prepared.hands.p2, ...prepared.deck].filter((tile: any) => tile.value !== 'joker');
    const sortHand = (hand: any[]) => hand.sort((a, b) => a.value - b.value || (a.color === 'black' ? -1 : 1));
    const legacy = {
      ...prepared,
      rulesVersion: undefined,
      phase: 'draw',
      hands: { p1: sortHand(numbered.splice(0, 4)), p2: sortHand(numbered.splice(0, 4)) },
      deck: numbered,
    };
    delete legacy.setupReady;
    delete legacy.setupPending;
    delete legacy.actionLog;
    delete legacy.turnNumber;
    const next = davinciEngine.applyAction(legacy, 'p1', { type: 'draw' });
    expect(legacy.hands.p1).toHaveLength(4);
    expect(legacy.hands.p2).toHaveLength(4);
    expect(legacy.deck).toHaveLength(16);
    expect(davinciEngine.getPlayerView(next, 'p1').board).toMatchObject({ deckCount: 15, tileCount: 24, turnNumber: 1, actionLog: [{ sequence: 1, type: 'draw', actor: 'p1', insertedIndex: expect.any(Number) }] });
    expect(davinciEngine.getPlayerView(next, 'p1').actions.filter((item: any) => item.action.type === 'guess')).toHaveLength(48);
  });

  it('keeps only the latest twelve public events with increasing sequence numbers', () => {
    let state: any = finishSetup(davinciEngine.createInitialState(50));
    for (let turn = 0; turn < 7; turn++) {
      const actor: Seat = state.turn;
      state = davinciEngine.applyAction(state, actor, { type: 'draw' });
      if (state.phase === 'place-joker') state = davinciEngine.applyAction(state, actor, { type: 'place-joker', payload: { index: state.hands[actor].length - 1 } });
      const opponent = actor === 'p1' ? 'p2' : 'p1';
      const index = state.hands[opponent].findIndex((tile: any) => !tile.revealed);
      state = davinciEngine.applyAction(state, actor, { type: 'guess', payload: { index, value: wrongGuess(state.hands[opponent][index].value) } });
    }
    const board = davinciEngine.getPlayerView(state, 'p1').board;
    expect(board.actionLog).toHaveLength(12);
    expect(board.actionLog[0].sequence).toBeGreaterThan(1);
    expect(board.actionLog.at(-1)).toMatchObject({ type: 'wrong-guess' });
    expect(board.lastEvent).toEqual(board.actionLog.at(-1));
  });
});

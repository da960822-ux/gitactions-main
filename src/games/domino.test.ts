import { describe, expect, it } from 'vitest';
import { chooseDominoBotAction, dominoEngine } from './domino';

describe('dominoEngine', () => {
  it('deals a deterministic double-six set and exposes only the current hand', () => {
    const s = dominoEngine.createInitialState(42);
    expect(dominoEngine.createInitialState(42)).toEqual(s);
    expect(s.hands.p1).toHaveLength(7);
    expect(s.hands.p2).toHaveLength(7);
    expect(s.stock).toHaveLength(14);
    expect(new Set([...s.hands.p1, ...s.hands.p2, ...s.stock].map((t: any) => `${t.a}-${t.b}`)).size).toBe(28);
    const view = dominoEngine.getPlayerView(s, s.turn as 'p1'|'p2');
    const player = view.turn as 'p1'|'p2';
    expect(view.hand).toHaveLength(7);
    expect(view.opponentCount).toBe(7);
    expect(JSON.stringify(view)).not.toContain('stock');
    expect(JSON.stringify(view)).not.toContain('seed');
    expect(view.hand).toEqual(s.hands[player]);
    expect(JSON.stringify(view)).not.toContain('hands');
    expect(JSON.stringify(view)).not.toContain(JSON.stringify(s.hands[player === 'p1' ? 'p2' : 'p1']));
  });

  it('requires the opening tile, enforces matching ends, alternates turns, and keeps state immutable', () => {
    const s: any = dominoEngine.createInitialState(11), p = s.turn;
    const bad = dominoEngine.validateAction(s, p, { type: 'play', payload: { index: 0, side: 'center' } });
    expect(bad).toBeTruthy();
    const next = dominoEngine.applyAction(s, p, { type: 'play', payload: { index: s.hands[p].findIndex((t: any) => t === s.opening.tile), side: 'left' } });
    expect(s.board).toHaveLength(0);
    expect(next.board).toHaveLength(1);
    expect(next.turn).not.toBe(p);
    expect(next.ends).toEqual({ left: s.opening.tile.a, right: s.opening.tile.b });
  });

  it('awards a 1v1 hand-out win to player 2', () => {
    const s: any = dominoEngine.createInitialState(9);
    s.turn = 'p2';
    s.board = [{ a: 0, b: 1, by: 'p1' }];
    s.ends = { left: 0, right: 1 };
    s.hands.p2 = [{ a: 1, b: 1 }];
    const next = dominoEngine.applyAction(s, 'p2', { type: 'play', payload: { index: 0, side: 'right' } });
    expect(next.result?.winner).toBe('p2');
  });

  it('ends a blocked 1v1 after two legal passes and compares remaining pips', () => {
    let s: any = dominoEngine.createInitialState(3);
    s.board = [{ a: 0, b: 0, by: 'p1' }];
    s.ends = { left: 0, right: 0 };
    s.hands.p1 = [{ a: 6, b: 6 }, { a: 5, b: 5 }, { a: 4, b: 4 }, { a: 3, b: 3 }, { a: 2, b: 6 }, { a: 3, b: 6 }, { a: 4, b: 6 }];
    s.hands.p2 = [{ a: 1, b: 1 }, { a: 1, b: 2 }, { a: 1, b: 3 }, { a: 1, b: 4 }, { a: 1, b: 5 }, { a: 1, b: 6 }, { a: 2, b: 2 }];
    s.turn = 'p1';
    s = dominoEngine.applyAction(s, 'p1', { type: 'pass' });
    expect(s.result).toBeNull();
    s = dominoEngine.applyAction(s, 'p2', { type: 'pass' });
    expect(s.result?.winner).toBe('p2');
  });

  it('does not allow passing when any tile fits an exposed end', () => {
    const s: any = dominoEngine.createInitialState(10);
    const p = s.turn;
    const tile = s.hands[p].find((t: any) => t.a === 0 || t.b === 0) ?? { a: 0, b: 1 };
    s.hands[p] = [tile]; s.board = [{ a: 0, b: 2, by: p === 'p1' ? 'p2' : 'p1' }];
    s.ends = { left: 0, right: 2 };
    expect(dominoEngine.validateAction(s, p, { type: 'pass' })).toBe('A playable tile is available');
  });

  it.each(['humans-vs-bots', 'partners'] as const)('runs deterministic bots in %s mode while hiding their hands', mode => {
    let s: any = dominoEngine.createInitialState(23);
    s = dominoEngine.applyAction(s, 'p1', { type: 'set-mode', payload: { mode } });
    expect(s.mode).toBe(mode);
    expect(s.hands.b1).toHaveLength(7);
    expect(s.hands.b2).toHaveLength(7);
    expect(s.stock).toHaveLength(0);
    expect(['p1', 'p2']).toContain(s.turn);
    const view = dominoEngine.getPlayerView(s, 'p1');
    expect(view.board.seats).toHaveLength(4);
    expect(view.board.counts.b1).toBe(s.hands.b1.length);
    expect(view.hand).toEqual(s.hands.p1);
    expect(view).not.toHaveProperty('hands');
    const priorCount = s.board.length;
    const human = s.turn as 'p1'|'p2';
    const action = dominoEngine.getPlayerView(s, human).actions.find((item: any) => item.action.type === 'play')?.action;
    expect(action).toBeTruthy();
    s = dominoEngine.applyAction(s, human, action);
    expect(['p1', 'p2']).toContain(s.turn);
    expect(s.result).toBeNull();
    expect(s.board.length).toBeGreaterThan(priorCount);
  });

  it('locks configuration to p1 before the first play and rejects invalid values', () => {
    const initial: any = dominoEngine.createInitialState(51);
    expect(dominoEngine.validateAction(initial, 'p2', { type: 'configure', payload: { difficulty: 'hard' } })).toBeTruthy();
    expect(dominoEngine.validateAction(initial, 'p1', { type: 'configure', payload: { mode: 'not-a-mode' } })).toBeTruthy();
    expect(dominoEngine.validateAction(initial, 'p1', { type: 'configure', payload: { difficulty: 'expert' } })).toBeTruthy();
    expect(dominoEngine.validateAction(initial, 'p1', { type: 'configure', payload: { targetScore: 150 } })).toBeTruthy();
    const configured = dominoEngine.applyAction(initial, 'p1', { type: 'configure', payload: { difficulty: 'hard', targetScore: 200, capicuaBonus: 25, pasoCorridoBonus: 25, tranqueRule: 'lowest-player' } });
    expect(configured.settings).toMatchObject({ difficulty: 'hard', targetScore: 200, capicuaBonus: 25, pasoCorridoBonus: 25, tranqueRule: 'lowest-player' });
    const openingPlayer = configured.opening.player;
    const opened = dominoEngine.applyAction(configured, openingPlayer as 'p1'|'p2', { type: 'play', payload: { index: configured.hands[openingPlayer].findIndex((t: any) => t.a === configured.opening.tile.a && t.b === configured.opening.tile.b), side: 'left' } });
    expect(dominoEngine.validateAction(opened, 'p1', { type: 'configure', payload: { difficulty: 'easy' } })).toBeTruthy();
    expect(dominoEngine.validateAction(opened, 'p1', { type: 'set-mode', payload: { mode: 'partners' } })).toBeTruthy();
  });

  it('does not offer new settings or match progression for a legacy saved state', () => {
    const legacy: any = dominoEngine.createInitialState(57);
    delete legacy.rulesVersion; delete legacy.settings; delete legacy.matchScores; delete legacy.roundBonuses;
    expect(dominoEngine.validateAction(legacy, 'p1', { type: 'configure', payload: { targetScore: 100 } })).toBeTruthy();
    expect(dominoEngine.validateAction(legacy, 'p1', { type: 'next-round' })).toBeTruthy();
    const view = dominoEngine.getPlayerView(legacy, 'p1');
    expect(view.actions.some((item: any) => item.action.type === 'configure')).toBe(false);
    expect(view.board.rulesVersion).toBe(0);
  });

  it('keeps live pip totals and every opposing hand private until the round ends', () => {
    const s: any = dominoEngine.createInitialState(61);
    const foreign = s.turn === 'p1' ? 'p2' : 'p1';
    const live = dominoEngine.getPlayerView(s, s.turn);
    expect(live.board.scores).toBeNull();
    expect(live.board.revealedHands).toBeUndefined();
    expect(live.board.counts[foreign]).toBe(7);
    expect(JSON.stringify(live)).not.toContain(JSON.stringify(s.hands[foreign]));

    s.board = [{ a: 0, b: 0, by: 'p1' }]; s.ends = { left: 0, right: 0 }; s.turn = 'p1';
    s.hands.p1 = [{ a: 6, b: 6 }];
    s.hands.p2 = [{ a: 1, b: 1 }, { a: 1, b: 2 }, { a: 1, b: 3 }, { a: 1, b: 4 }, { a: 1, b: 5 }, { a: 1, b: 6 }, { a: 2, b: 2 }];
    const afterP1 = dominoEngine.applyAction(s, 'p1', { type: 'pass' });
    const blocked = dominoEngine.applyAction(afterP1, 'p2', { type: 'pass' });
    for (const seat of ['p1', 'p2'] as const) {
      const view = dominoEngine.getPlayerView(blocked, seat);
      expect(view.board.scores).not.toBeNull();
      expect(view.board.revealedHands).toBeDefined();
      expect(view.board.roundResult?.pips).toEqual({ p1: 12, p2: 31 });
    }
  });

  it('deals 28 distinct tiles, leaves 14 unused in 1v1, and deals both four-seat teams', () => {
    const one: any = dominoEngine.createInitialState(72);
    expect(one.stock).toHaveLength(14);
    expect(new Set([...one.hands.p1, ...one.hands.p2, ...one.stock].map((t: any) => [t.a, t.b].join('-'))).size).toBe(28);
    for (const mode of ['humans-vs-bots', 'partners'] as const) {
      const four: any = dominoEngine.applyAction(dominoEngine.createInitialState(72), 'p1', { type: 'configure', payload: { mode } });
      expect(four.stock).toHaveLength(0);
      expect(four.hands.p1).toHaveLength(7); expect(four.hands.p2).toHaveLength(7);
      expect(four.hands.b1.length).toBeLessThanOrEqual(7); expect(four.hands.b2.length).toBeLessThanOrEqual(7);
      const dealt = [...Object.values(four.hands).flat(), ...four.board].map((t: any) => [t.a, t.b].sort().join('-'));
      expect(dealt).toHaveLength(28);
      expect(new Set(dealt).size).toBe(28);
      const view = dominoEngine.getPlayerView(four, 'p1');
      expect(view.board.teams.p1).toEqual(mode === 'partners' ? ['p1', 'b1'] : ['p1', 'p2']);
      expect(view.board.teams.p2).toEqual(mode === 'partners' ? ['p2', 'b2'] : ['b1', 'b2']);
    }
  });

  it('chooses a bot move from only its hand and the supplied public board', () => {
    const hand = [{ a: 1, b: 6 }, { a: 1, b: 2 }, { a: 2, b: 3 }, { a: 2, b: 4 }];
    const board = [{ a: 1, b: 5, by: 'p1' }];
    const ends = { left: 1, right: 5 }, context = { actor: 'p1' as const, mode: '1v1' as const, passes: 0, counts: { p1: 6, p2: 7 }, log: [] };
    const before = JSON.stringify({ hand, board });
    const normal = chooseDominoBotAction(hand, board as any, ends, 'normal', context);
    const hard = chooseDominoBotAction(hand, board as any, ends, 'hard', context);
    expect([normal, hard].every(action => action.type === 'play' && hand[action.payload!.index as number] && (action.payload!.side === 'left' || action.payload!.side === 'right'))).toBe(true);
    expect(chooseDominoBotAction(hand, board as any, ends, 'hard', context)).toEqual(hard);
    expect(JSON.stringify({ hand, board })).toBe(before);
  });

  it('takes an immediate hand-out in every difficulty and passes only when no end matches', () => {
    for (const difficulty of ['easy', 'normal', 'hard'] as const) {
      expect(chooseDominoBotAction([{ a: 2, b: 6 }], [], { left: 2, right: 4 }, difficulty, { actor: 'p1', mode: '1v1', counts: { p1: 1, p2: 1 } })).toMatchObject({ type: 'play', payload: { index: 0 } });
      expect(chooseDominoBotAction([{ a: 2, b: 6 }], [], { left: 1, right: 4 }, difficulty, { actor: 'p1', mode: '1v1', counts: { p1: 1, p2: 1 } })).toEqual({ type: 'pass' });
    }
  });

  it('predicts left and right exposed pips with the same orientation as the engine', () => {
    for (const [tile, side, expected] of [
      [{ a: 1, b: 6 }, 'left', { left: 6, right: 5 }],
      [{ a: 6, b: 1 }, 'left', { left: 6, right: 5 }],
      [{ a: 5, b: 2 }, 'right', { left: 1, right: 2 }],
      [{ a: 2, b: 5 }, 'right', { left: 1, right: 2 }],
    ] as const) {
      const state: any = dominoEngine.createInitialState(54);
      state.turn = 'p1'; state.hands.p1 = [tile]; state.hands.p2 = [{ a: 0, b: 0 }];
      state.board = [{ a: 1, b: 5, by: 'p2', sequence: 1 }]; state.ends = { left: 1, right: 5 };
      const action = chooseDominoBotAction([tile], state.board, state.ends, 'normal');
      expect(action).toMatchObject({ type: 'play', payload: { index: 0, side } });
      const next = dominoEngine.applyAction(state, 'p1', action);
      expect(next.ends).toEqual(expected);
    }
  });

  it('scores orientation from the exposed face when comparing supported ends', () => {
    const hand = [{ a: 1, b: 1 }, { a: 2, b: 2 }, { a: 1, b: 3 }, { a: 0, b: 6 }];
    const board: any[] = [{ a: 1, b: 5, by: 'p2', sequence: 1 }];
    expect(chooseDominoBotAction(hand, board, { left: 1, right: 5 }, 'normal')).toMatchObject({ type: 'play', payload: { index: 0, side: 'left' } });
  });

  it('uses only public chooser context fields and supports both public team maps', () => {
    const forbidden = () => { throw new Error('private game state must not be read by the chooser'); };
    const context: any = { actor: 'b1', mode: 'partners', passes: 0, counts: { p1: 7, b1: 5, p2: 6, b2: 7 }, log: [] };
    for (const key of ['seed', 'stock', 'hands', 'rng', 'random']) Object.defineProperty(context, key, { get: forbidden });
    const hand = [{ a: 1, b: 4 }, { a: 4, b: 6 }, { a: 2, b: 6 }];
    const board: any[] = [{ a: 1, b: 5, by: 'p2', sequence: 1 }];
    const partners = chooseDominoBotAction(hand, board, { left: 1, right: 5 }, 'hard', context);
    context.mode = 'humans-vs-bots';
    const versus = chooseDominoBotAction(hand, board, { left: 1, right: 5 }, 'hard', context);
    for (const action of [partners, versus]) expect(action.type).toBe('play');
  });

  it('uses current-round public passes for hard defense and ignores retained passes from an older round', () => {
    const hand = [{ a: 1, b: 2 }, { a: 3, b: 3 }, { a: 0, b: 3 }, { a: 1, b: 1 }, { a: 0, b: 0 }, { a: 2, b: 3 }];
    const board: any[] = [{ a: 1, b: 4, by: 'p2', sequence: 1 }, { a: 4, b: 5, by: 'b2', sequence: 3 }];
    const ends = { left: 1, right: 5 }, common = { actor: 'p1' as const, mode: '1v1' as const, counts: { p1: 6, p2: 1 } };
    const withoutPass = chooseDominoBotAction(hand, board, ends, 'hard', { ...common, log: [] });
    const withPass = chooseDominoBotAction(hand, board, ends, 'hard', { ...common, log: [{ sequence: 4, type: 'pass', actor: 'p2', ends, title: { ko: '패스', es: 'Paso' } } as any] });
    expect(withPass).not.toEqual(withoutPass);

    const currentBoard: any[] = [{ a: 1, b: 4, by: 'p1', sequence: 9 }];
    const currentEnds = { left: 1, right: 4 };
    const noRetainedLog = chooseDominoBotAction(hand, currentBoard, currentEnds, 'hard', { ...common, log: [] });
    const oldPassOnly = chooseDominoBotAction(hand, currentBoard, currentEnds, 'hard', { ...common, log: [{ sequence: 7, type: 'pass', actor: 'p2', ends: { left: 2, right: 3 }, title: { ko: '패스', es: 'Paso' } }, { sequence: 8, type: 'round-start', title: { ko: '시작', es: 'Inicio' }, round: 2 }] as any });
    expect(oldPassOnly).toEqual(noRetainedLog);
  });

  it('awards capicua only for a non-double matching both prior ends', () => {
    let s: any = dominoEngine.createInitialState(81);
    s.settings.capicuaBonus = 25;
    s.board = [{ a: 1, b: 2, by: 'p2' }]; s.ends = { left: 1, right: 2 };
    s.turn = 'p1'; s.hands.p1 = [{ a: 1, b: 2 }]; s.hands.p2 = [{ a: 3, b: 3 }, { a: 4, b: 4 }];
    const next = dominoEngine.applyAction(s, 'p1', { type: 'play', payload: { index: 0, side: 'left' } });
    expect(next.roundResult).toMatchObject({ winner: 'p1', capicua: true, award: 39, pips: { p1: 0, p2: 14 } });
    expect((next.log ?? []).filter((row: any) => row.type === 'capicua')).toHaveLength(1);
  });

  it('keeps optional bonuses off by default', () => {
    const s: any = dominoEngine.createInitialState(82);
    expect(s.settings.capicuaBonus).toBe(0);
    expect(s.settings.pasoCorridoBonus).toBe(0);
    s.board = [{ a: 1, b: 2, by: 'p2' }]; s.ends = { left: 1, right: 2 };
    s.turn = 'p1'; s.hands.p1 = [{ a: 1, b: 2 }]; s.hands.p2 = [{ a: 3, b: 3 }];
    const next = dominoEngine.applyAction(s, 'p1', { type: 'play', payload: { index: 0, side: 'left' } });
    expect(next.roundResult).toMatchObject({ capicua: true, award: 6 });
    expect(next.roundResult!.award).toBe(next.roundResult!.pips.p2);
  });

  it('awards paso corrido once per last-placed tile and settles it only when the hand ends', () => {
    const s: any = dominoEngine.createInitialState(88);
    s.settings.pasoCorridoBonus = 25;
    s.board = [{ a: 0, b: 3, by: 'p1' }]; s.ends = { left: 0, right: 3 };
    s.turn = 'p2'; s.lastPlacer = 'p1'; s.passes = 0;
    s.hands.p1 = [{ a: 3, b: 3 }, { a: 4, b: 4 }]; s.hands.p2 = [{ a: 6, b: 6 }];
    const afterFirstCycle = dominoEngine.applyAction(s, 'p2', { type: 'pass' });
    expect(afterFirstCycle.roundResult).toBeNull();
    expect(afterFirstCycle.roundBonuses).toEqual({ p1: 25, p2: 0 });
    expect((afterFirstCycle.log ?? []).filter((row: any) => row.type === 'paso-corrido')).toHaveLength(1);
    const afterNewTile = dominoEngine.applyAction(afterFirstCycle, 'p1', { type: 'play', payload: { index: 0, side: 'right' } });
    expect(afterNewTile.roundBonuses).toEqual({ p1: 25, p2: 0 });
    const afterSecondCycle = dominoEngine.applyAction(afterNewTile, 'p2', { type: 'pass' });
    expect(afterSecondCycle.roundResult).toBeNull();
    expect(afterSecondCycle.roundBonuses).toEqual({ p1: 50, p2: 0 });
    expect((afterSecondCycle.log ?? []).filter((row: any) => row.type === 'paso-corrido')).toHaveLength(2);
    const blocked = dominoEngine.applyAction(afterSecondCycle, 'p1', { type: 'pass' });
    expect(blocked.roundResult).toMatchObject({ winner: 'p1', pasoCorrido: 50, bonuses: { p1: 50, p2: 0 }, scoreDelta: { p1: 62, p2: 0 } });
  });

  it('does not award paso corrido without a last placer or when the option is off', () => {
    const s: any = dominoEngine.createInitialState(89);
    s.settings.pasoCorridoBonus = 25;
    s.board = [{ a: 0, b: 0, by: 'p1' }]; s.ends = { left: 0, right: 0 };
    s.turn = 'p2'; s.lastPlacer = null; s.hands.p1 = [{ a: 3, b: 3 }]; s.hands.p2 = [{ a: 4, b: 4 }];
    const noLastPlacer = dominoEngine.applyAction(s, 'p2', { type: 'pass' });
    expect(noLastPlacer.roundBonuses).toEqual({ p1: 0, p2: 0 });
    expect((noLastPlacer.log ?? []).some((row: any) => row.type === 'paso-corrido')).toBe(false);

    const disabled: any = { ...s, settings: { ...s.settings, pasoCorridoBonus: 0 }, lastPlacer: 'p1' };
    const noBonus = dominoEngine.applyAction(disabled, 'p2', { type: 'pass' });
    expect(noBonus.roundBonuses).toEqual({ p1: 0, p2: 0 });
    expect((noBonus.log ?? []).find((row: any) => row.type === 'paso-corrido')?.points).toBe(0);
  });

  it.each([
    ['team', 'p1'],
    ['lowest-player', 'p2'],
  ] as const)('resolves a four-seat tranque by the %s rule', (tranqueRule, winner) => {
    let s: any = dominoEngine.applyAction(dominoEngine.createInitialState(99), 'p1', { type: 'configure', payload: { mode: 'partners', tranqueRule } });
    s.turn = 'p1'; s.board = [{ a: 0, b: 0, by: 'p2' }]; s.ends = { left: 0, right: 0 };
    s.hands = { p1: [{ a: 3, b: 3 }], b1: [{ a: 3, b: 3 }], p2: [{ a: 1, b: 1 }], b2: [{ a: 6, b: 6 }] };
    const afterP1 = dominoEngine.applyAction(s, 'p1', { type: 'pass' });
    const blocked = dominoEngine.applyAction(afterP1, 'p2', { type: 'pass' });
    expect(blocked.roundResult?.winner).toBe(winner);
    expect(blocked.roundResult?.reason).toContain('Blocked');
    expect(blocked.roundResult?.pips).toEqual({ p1: 12, p2: 14 });
  });

  it('returns a draw when lowest-player tranque scores tie', () => {
    let s: any = dominoEngine.applyAction(dominoEngine.createInitialState(100), 'p1', { type: 'configure', payload: { mode: 'partners', tranqueRule: 'lowest-player' } });
    s.turn = 'p1'; s.board = [{ a: 0, b: 0, by: 'p2' }]; s.ends = { left: 0, right: 0 };
    s.hands = { p1: [{ a: 3, b: 3 }], b1: [{ a: 6, b: 6 }], p2: [{ a: 2, b: 4 }], b2: [{ a: 6, b: 6 }] };
    const afterP1 = dominoEngine.applyAction(s, 'p1', { type: 'pass' });
    const blocked = dominoEngine.applyAction(afterP1, 'p2', { type: 'pass' });
    expect(blocked.roundResult?.winner).toBe('draw');
    expect(blocked.roundResult?.award).toBe(0);
    expect(blocked.roundResult?.scoreDelta).toEqual({ p1: 0, p2: 0 });
  });

  it.each([100, 200] as const)('accumulates round awards until the %i match target', target => {
    let s: any = dominoEngine.applyAction(dominoEngine.createInitialState(target), 'p1', { type: 'configure', payload: { targetScore: target } });
    const winHand = (state: any) => {
      state.board = [{ a: 0, b: 0, by: 'p2' }]; state.ends = { left: 0, right: 1 }; state.turn = 'p1';
      state.hands.p1 = [{ a: 1, b: 2 }];
      state.hands.p2 = Array.from({ length: 7 }, () => ({ a: 6, b: 6 }));
      return dominoEngine.applyAction(state, 'p1', { type: 'play', payload: { index: 0, side: 'right' } });
    };
    s = winHand(s);
    expect(s.roundResult.award).toBe(84);
    expect(s.matchScores.p1).toBe(84);
    expect(dominoEngine.validateAction(s, 'p2', { type: 'next-round' })).toBeTruthy();
    const p1View = dominoEngine.getPlayerView(s, 'p1');
    const p2View = dominoEngine.getPlayerView(s, 'p2');
    expect(p1View.actions.some((x: any) => x.action.type === 'next-round')).toBe(true);
    expect(p2View.actions.some((x: any) => x.action.type === 'next-round')).toBe(false);
    const nextRound = dominoEngine.applyAction(s, 'p1', { type: 'next-round' });
    let repeat: any = dominoEngine.applyAction(dominoEngine.createInitialState(target), 'p1', { type: 'configure', payload: { targetScore: target } });
    repeat = winHand(repeat);
    repeat = dominoEngine.applyAction(repeat, 'p1', { type: 'next-round' });
    expect(nextRound.round).toBe(2);
    expect(nextRound.hands).toEqual(repeat.hands);
    expect(nextRound.opening).toEqual(repeat.opening);
    if (target === 100) {
      const final = winHand(nextRound);
      expect(final.result?.winner).toBe('p1');
      expect(final.matchScores!.p1).toBe(168);
    } else {
      const second = winHand(nextRound);
      expect(second.result).toBeNull();
      expect(second.matchScores!.p1).toBe(168);
      const third = dominoEngine.applyAction(second, 'p1', { type: 'next-round' });
      const final = winHand(third);
      expect(final.result?.winner).toBe('p1');
      expect(final.matchScores!.p1).toBe(252);
    }
  });

  it('keeps the public event log bounded and exposes only played tiles, never hidden hands or stock', () => {
    const s: any = dominoEngine.createInitialState(108);
    s.log = Array.from({ length: 50 }, (_, i) => ({ sequence: i + 1, type: 'pass', title: { ko: '패스', es: 'Pasar' } }));
    s.board = [{ a: 0, b: 1, by: 'p2' }]; s.ends = { left: 0, right: 1 }; s.turn = 'p1';
    s.hands.p1 = [{ a: 1, b: 1 }]; s.hands.p2 = [{ a: 2, b: 2 }];
    const next = dominoEngine.applyAction(s, 'p1', { type: 'play', payload: { index: 0, side: 'right' } });
    expect((next.log ?? []).length).toBeLessThanOrEqual(40);
    expect((next.log ?? []).some((row: any) => row.type === 'round-end')).toBe(true);
    expect((next.log ?? []).filter((row: any) => row.tile).every((row: any) => row.type === 'play')).toBe(true);
    const json = JSON.stringify(dominoEngine.getPlayerView(next, 'p2'));
    expect(json).not.toContain('stock');
    expect(json).not.toContain('seed');
    expect(json).not.toContain('hands');
  });
});

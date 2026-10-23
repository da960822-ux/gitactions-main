import { describe, expect, it } from 'vitest';
import { dominoEngine as engine } from './domino';

const play = { type: 'play', payload: { index: 0, side: 'right' } };
function opened(mode = '1v1', round = 1, double = true): any {
  const s = engine.createInitialState(12);
  return { ...s, mode, round, board: [{ a: double ? 6 : 1, b: 6, by: mode === '1v1' ? 'p1' : 'b1' }], ends: { left: double ? 6 : 1, right: 6 }, turn: 'p2', lastPlacer: mode === '1v1' ? 'p1' : 'b1', hands: { p1: [{ a: 6, b: 6 }, { a: 2, b: 2 }], p2: [{ a: 3, b: 3 }, { a: 4, b: 4 }], b1: [{ a: 5, b: 5 }], b2: [{ a: 2, b: 6 }, { a: 0, b: 0 }] } };
}

describe('Lisbeth domino rules v2', () => {
  it('always deals 6|6 to a human for the first 1v1 hand without duplicating tiles', () => {
    for (let seed = 1; seed <= 28; seed++) {
      const s = engine.createInitialState(seed);
      expect(s).toEqual(engine.createInitialState(seed));
      expect(s.rulesVersion).toBe(2);
      expect(s.opening.tile).toEqual({ a: 6, b: 6 });
      expect(s.settings).toMatchObject({ targetScore: 200, capicuaBonus: 30, pasoCorridoBonus: 0, tranqueRule: 'trancador' });
      expect(new Set([...s.hands.p1, ...s.hands.p2, ...s.stock].map(t => `${t.a}-${t.b}`)).size).toBe(28);
      const other = s.hands[s.turn].findIndex(t => t.a !== 6 || t.b !== 6);
      expect(engine.validateAction(s, s.turn as 'p1' | 'p2', { ...play, payload: { index: other, side: 'left' } })).toBeTruthy();
    }
  });

  it('accepts only 100/200 and fixed bonuses, and alternates opposing teams', () => {
    const s = engine.createInitialState(14);
    for (const payload of [{ targetScore: 0 }, { capicuaBonus: 25 }, { pasoCorridoBonus: 25 }, { tranqueRule: 'team' }]) expect(engine.validateAction(s, 'p1', { type: 'configure', payload })).toBeTruthy();
    for (const targetScore of [100, 200]) expect(engine.validateAction(s, 'p1', { type: 'configure', payload: { targetScore } })).toBeNull();
    const teams = engine.applyAction(s, 'p1', { type: 'configure', payload: { mode: 'partners' } });
    expect(engine.getPlayerView(teams, 'p1').board.seats).toEqual(['p1', 'p2', 'b1', 'b2']);
    expect(engine.getPlayerView(teams, 'p1').board.teams).toEqual({ p1: ['p1', 'b1'], p2: ['p2', 'b2'] });
    expect(teams.board.length ? teams.board[0] : teams.opening.tile).toMatchObject({ a: 6, b: 6 });
  });

  it.each([[1, true, 30], [2, true, 30], [2, false, 60]] as const)('awards a 1v1 opening pass once in hand %i (double %s)', (round, double, points) => {
    const s = opened('1v1', round, double), before = structuredClone(s);
    const next = engine.applyAction(s, 'p2', { type: 'pass' });
    expect(s).toEqual(before);
    expect(next.roundBonuses).toEqual({ p1: points, p2: 0 });
    expect(next.matchScores).toEqual({ p1: 0, p2: 0 });
    expect(next.log?.filter(e => e.type === 'opening-pass')).toHaveLength(1);
    const continued = engine.applyAction(next, 'p1', play);
    expect(continued.roundBonuses).toEqual(next.roundBonuses);
  });

  it.each([[true, 30], [false, 60]] as const)('requires the third seat to play for the four-seat opening bonus (double %s)', (double, points) => {
    const s = opened('humans-vs-bots', 2, double);
    const next = engine.applyAction(s, 'p2', { type: 'pass' });
    expect(next.roundBonuses).toEqual({ p1: 0, p2: points });
    expect(next.board).toHaveLength(2);
    expect(next.board[1].by).toBe('b2');
    const log = next.log!;
    expect(log.find(e => e.type === 'play')?.sequence).toBe(next.board[1].sequence);
    expect(engine.getPlayerView(next, 'p1').board.revealedHands).toBeUndefined();
    const canceled = structuredClone(s);
    canceled.hands.b2 = [{ a: 0, b: 0 }, { a: 2, b: 2 }];
    const noBonus = engine.applyAction(canceled, 'p2', { type: 'pass' });
    expect(noBonus.roundBonuses).toEqual({ p1: 0, p2: 0 });
    expect(noBonus.log?.some(e => e.type === 'opening-pass')).toBe(false);
  });

  it('adds capicua 30 to all remaining hands, including the winning partner', () => {
    const s = opened('humans-vs-bots');
    s.board = [{ a: 1, b: 3, by: 'b1' }]; s.ends = { left: 1, right: 2 }; s.turn = 'p1';
    s.hands = { p1: [{ a: 1, b: 2 }], p2: [{ a: 4, b: 4 }], b1: [{ a: 3, b: 3 }], b2: [{ a: 5, b: 5 }] };
    const next = engine.applyAction(s, 'p1', play);
    expect(next.roundResult).toMatchObject({ winner: 'p1', capicua: true, award: 54 });
    expect(next.roundWinnerSeat).toBe('p1');
    const again = engine.applyAction(next, 'p1', { type: 'next-round' });
    expect(again.turn).toBe('p1');
    expect(engine.getPlayerView(again, 'p1').actions.filter((a: any) => a.action.type === 'play')).toHaveLength(14);
    expect(again.roundBonuses).toEqual({ p1: 0, p2: 0 });
  });

  it.each([[2, 'b1'], [5, 'p1'], [8, 'p1']] as const)('locks immediately after all seven endpoint tiles, comparing next-seat pips %i', (nextPips, winnerSeat) => {
    const s = opened('humans-vs-bots', 2);
    s.board = Array.from({ length: 6 }, (_, b) => ({ a: 0, b, by: 'p2' }));
    s.ends = { left: 0, right: 6 }; s.turn = 'p1';
    s.hands = { p1: [{ a: 0, b: 6 }, { a: 2, b: 3 }], b1: [{ a: nextPips === 2 ? 1 : nextPips === 5 ? 1 : 2, b: nextPips === 2 ? 1 : nextPips === 5 ? 4 : 6 }], p2: [{ a: 3, b: 3 }], b2: [{ a: 4, b: 4 }] };
    const next = engine.applyAction(s, 'p1', play);
    expect(next.passes).toBe(0);
    expect(next.roundResult?.winner).toBe(winnerSeat === 'p1' ? 'p1' : 'p2');
    expect(next.roundResult?.award).toBe(5 + nextPips + 6 + 8);
    expect(next.roundWinnerSeat).toBe(winnerSeat);
    const again = engine.applyAction(next, 'p1', { type: 'next-round' });
    expect(again.board.length ? again.board[0].by : again.turn).toBe(winnerSeat);
  });

  it('compares only the two players in 1v1 and gives equal blocked pips to the trancador', () => {
    const s = opened(); s.board.push({ a: 0, b: 0, by: 'p1' }); s.ends = { left: 0, right: 0 };
    s.hands.p1 = [{ a: 2, b: 3 }]; s.hands.p2 = [{ a: 1, b: 4 }];
    const passed = engine.applyAction(s, 'p2', { type: 'pass' });
    const ended = engine.applyAction(passed, 'p1', { type: 'pass' });
    expect(ended.roundResult).toMatchObject({ winner: 'p1', award: 10 });
    expect(ended.roundWinnerSeat).toBe('p1');
  });
});

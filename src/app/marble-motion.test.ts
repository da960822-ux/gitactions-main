import { describe, expect, it } from 'vitest';
import { marbleCueForEvent, marbleEventSequence, marbleEventWindow, marbleEventsAfter, marbleMoneyDelta, marbleGridPosition, marbleJourneyDisplay, marbleMovementPath, marblePresentationFrames } from './marble-motion';

const moveEvent = (effect: string, from: number, to: number, steps: number | null, playerId = 'p1') => ({ sequence: 1, playerId, effect, from, to, steps });

describe('Marble board movement path', () => {
  it('keeps destination, transit, arrival and explicit inspection labels in sync with visible presentation', () => {
    const base = { selectedTile: 9, actionTile: 9, displayedTile: 0, traveler: null, playerId: 'p1' as const, diceRolling: false };
    expect(marbleJourneyDisplay(base)).toBe('moving'); // authority has advanced; the pawn has not.
    expect(marbleJourneyDisplay({ ...base, displayedTile: 4, traveler: { seat: 'p1' as const } })).toBe('moving');
    expect(marbleJourneyDisplay({ ...base, displayedTile: 9 })).toBe('arrived');
    expect(marbleJourneyDisplay({ ...base, selectedTile: 31, displayedTile: 9, traveler: { seat: 'p1' as const }, diceRolling: true })).toBe('inspect');
  });

  it('completes a partial event path from a stable origin without skipping or overshooting cells', () => {
    const frames = marblePresentationFrames([{ sequence: 3, type: 'move', actor: 'p1', from: 0, to: 2, steps: 2 }], { p1: 0, p2: 9 }, { p1: 5, p2: 9 }, 40);
    expect(frames.filter(frame => frame.traveler).map(frame => frame.traveler!.tile)).toEqual([1, 2, 3, 4, 5]);
    expect(frames.at(-1)?.positions).toEqual({ p1: 5, p2: 9 });
  });

  it('finishes the dice before moving and each displacement before its arrival, including a retreat', () => {
    const events = [{ sequence: 1, type: 'roll', actor: 'p1' }, { sequence: 2, type: 'move', actor: 'p1', from: 38, to: 2, steps: 4 }, { sequence: 3, type: 'arrival', actor: 'p1' }, { sequence: 4, type: 'event-card', actor: 'p1' }, { sequence: 5, type: 'move', actor: 'p1', from: 2, to: 39, steps: -3 }, { sequence: 6, type: 'arrival', actor: 'p1' }];
    const frames = marblePresentationFrames(events, { p1: 38, p2: 6 }, { p1: 39, p2: 6 }, 40);
    const moves = frames.filter(frame => frame.traveler);
    expect(moves.map(frame => frame.traveler!.tile)).toEqual([39, 0, 1, 2, 1, 0, 39]);
    expect(moves[0].at).toBeGreaterThanOrEqual(620);
    expect(frames.find(frame => frame.event.sequence === 3)!.at).toBeGreaterThan(moves[3].at);
    expect(frames.find(frame => frame.event.sequence === 6)!.at).toBeGreaterThan(moves.at(-1)!.at);
    expect(frames.at(-1)?.traveler).toBeNull();
  });
  it('holds the dice for 620ms and the confirmed arrival for 640ms without adding skipped tiles', () => {
    for (const steps of [3, 5, 8]) {
      const events = [{ sequence: 1, type: 'roll', actor: 'p1' }, { sequence: 2, type: 'move', actor: 'p1', from: 0, to: steps, steps }, { sequence: 3, type: 'arrival', actor: 'p1' }, { sequence: 4, type: 'turn', actor: 'p2' }];
      const frames = marblePresentationFrames(events, { p1: 0, p2: 9 }, { p1: steps, p2: 9 }, 40);
      expect(frames.filter(frame => frame.traveler).map(frame => frame.traveler!.tile)).toEqual(Array.from({ length: steps }, (_, index) => index + 1));
      expect(frames.find(frame => frame.traveler)?.at).toBe(620);
      expect(frames.find(frame => frame.event.sequence === 4)!.at - frames.find(frame => frame.event.sequence === 3)!.at).toBe(640);
    }
  });

  it('lists each tile in a normal roll and repeats deterministically for equal rolls', () => {
    const first = marbleMovementPath(2, 6, 4, null, false, 'p1');
    expect(first).toEqual([3, 4, 5, 6]);
    expect(marbleMovementPath(2, 6, 4, null, false, 'p1')).toEqual(first);
  });

  it('wraps a forward roll across the final legacy tile', () => {
    expect(marbleMovementPath(16, 1, 3, null, false, 'p1')).toEqual([17, 0, 1]);
  });

  it('uses a zero-length path when a zero-step roll keeps the pawn in place', () => {
    expect(marbleMovementPath(7, 7, 0, null, false, 'p1')).toEqual([]);
  });

  it('caps oversized rolls at one full lap without appending another lap', () => {
    const path = marbleMovementPath(4, 4, 54, null, false, 'p1');
    expect(path).toEqual(Array.from({ length: 18 }, (_, index) => (5 + index) % 18));
    expect(path).toHaveLength(18);
  });

  it('ignores an event until the event sequence has actually changed', () => {
    expect(marbleMovementPath(0, 3, 3, moveEvent('train', 0, 12, 12), false, 'p1')).toEqual([1, 2, 3]);
  });

  it('does not follow another player’s event instead of the local roll', () => {
    expect(marbleMovementPath(0, 3, 3, moveEvent('train', 0, 12, 12, 'p2'), true, 'p1')).toEqual([1, 2, 3]);
  });

  it('applies a card’s displacement after the dice path', () => {
    expect(marbleMovementPath(0, 5, 2, moveEvent('card', 2, 5, 3), true, 'p1')).toEqual([1, 2, 3, 4, 5]);
  });

  it('reaches a card source that differs from the dice landing before following its move', () => {
    expect(marbleMovementPath(0, 7, 2, moveEvent('move', 4, 7, 3), true, 'p1')).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('supports a card retreat without adding a forward lap', () => {
    expect(marbleMovementPath(6, 3, 0, moveEvent('card', 6, 3, -3), true, 'p1')).toEqual([5, 4, 3]);
  });

  it('follows a multi-step island move', () => {
    expect(marbleMovementPath(8, 13, 0, moveEvent('island', 8, 13, 5), true, 'p1')).toEqual([9, 10, 11, 12, 13]);
  });

  it('uses a direct train destination or the train’s explicit step count', () => {
    expect(marbleMovementPath(2, 11, 0, moveEvent('train', 2, 11, null), true, 'p1')).toEqual([11]);
    expect(marbleMovementPath(2, 6, 0, moveEvent('train', 2, 6, 4), true, 'p1')).toEqual([3, 4, 5, 6]);
  });

  it('keeps the legacy 18-space grid complete, unique, and in its original perimeter order', () => {
    const positions = Array.from({ length: 18 }, (_, index) => marbleGridPosition(index, 18)!);
    expect(positions).toHaveLength(18);
    expect(new Set(positions.map(position => position.join(','))).size).toBe(18);
    expect(positions[0]).toEqual([1, 5]);
    expect(positions[5]).toEqual([6, 5]);
    expect(positions[9]).toEqual([6, 1]);
    expect(positions[14]).toEqual([1, 1]);
    expect(positions[17]).toEqual([1, 4]);
  });

  it('maps all 32- and 40-space boards to unique perimeter cells and rejects invalid cells', () => {
    for (const size of [32, 40]) {
      const positions = Array.from({ length: size }, (_, index) => marbleGridPosition(index, size)!);
      expect(positions.every(([x, y]) => x >= 1 && x <= (size === 32 ? 9 : 12) && y >= 1 && y <= (size === 32 ? 9 : 10))).toBe(true);
      expect(new Set(positions.map(position => position.join(','))).size).toBe(size);
      expect(marbleGridPosition(-1, size)).toBeUndefined();
      expect(marbleGridPosition(size, size)).toBeUndefined();
    }
    expect([0, 12, 20, 32, 39].map(index => marbleGridPosition(index, 40))).toEqual([[12, 10], [1, 9], [1, 1], [12, 2], [12, 9]]);
    expect(marbleGridPosition(0, 24)).toBeUndefined();
  });
});

describe('Marble committed-event motion/audio mapping', () => {
  it('orders only events newer than the initial high-water mark', () => {
    const events = [{ sequence: 4, type: 'buy' }, { sequence: 2, type: 'roll' }, { sequence: 3, type: 'move' }];
    expect(marbleEventSequence({ sequence: 2 })).toBe(2);
    expect(marbleEventsAfter(events, 2).map(event => event.sequence)).toEqual([3, 4]);
    expect(marbleEventsAfter(events, 4)).toEqual([]);
    expect(marbleEventSequence({ sequence: Number.MAX_SAFE_INTEGER + 1 })).toBe(0);
  });

  it('treats a lower sequence as a new round and resolves only signed financial deltas', () => {
    expect(marbleEventWindow([{ sequence: 1, type: 'roll' }, { sequence: 2, type: 'move' }], 18)).toEqual({ reset: true, latestSequence: 2, fresh: [{ sequence: 1, type: 'roll' }, { sequence: 2, type: 'move' }] });
    expect(marbleEventWindow([{ sequence: 19, type: 'turn' }], 18).reset).toBe(false);
    expect(marbleEventWindow([], 18)).toEqual({ reset: true, latestSequence: 0, fresh: [] });
    expect(marbleMoneyDelta({ type: 'rent', actor: 'p1', amount: 120, moneyDelta: { p1: -120, p2: 120 } }, 'p1')).toBe(-120);
    expect(marbleMoneyDelta({ type: 'rent', actor: 'p1', amount: 120, moneyDelta: { p1: -120, p2: 120 } }, 'p2')).toBe(120);
    expect(marbleMoneyDelta({ type: 'roll', amount: 7 }, 'p1')).toBeNull();
    expect(marbleMoneyDelta({ type: 'buy', amount: 100 }, 'p1')).toBeNull();
    expect(marbleMoneyDelta({ type: 'crisis', amount: 200 }, 'p1')).toBeNull();
    expect(marbleMoneyDelta({ type: 'monopoly-warning', amount: 100 }, 'p1')).toBeNull();
    expect(marbleMoneyDelta({ sequence: 1, id: 'travel-cost', cashDelta: -100 }, 'p1')).toBe(-100);
  });

  it('maps public game outcomes to distinct Marble cues and leaves informational events silent', () => {
    const cases = [
      ['roll', 'dice'], ['move', 'move'], ['pawn', 'move'], ['arrival', 'event'], ['event-card', 'event'],
      ['buy', 'buy'], ['build', 'build'], ['rent', 'toll'], ['tax', 'toll'], ['loan', 'loan'],
      ['repay', 'loan'], ['crisis', 'crisis'], ['bankruptcy', 'crisis'], ['monopoly-warning', 'warning'],
      ['island', 'event'], ['escape', 'event'], ['train', 'move'], ['bonus', 'event'], ['turn', 'turn'], ['win', 'win'],
    ] as const;
    for (const [type, cue] of cases) expect(marbleCueForEvent({ type })).toBe(cue);
    expect(marbleCueForEvent({ sequence: 5, id: 'festival', effect: 'cash' })).toBe('event');
    expect(marbleCueForEvent({ type: 'rest' })).toBeNull();
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { marblePresentation, MARBLE_EVENT_INTERVAL } from './marble-presentation';
import type { MarbleActionEvent } from './marble-motion';

const events = (...sequences: number[]): MarbleActionEvent[] => sequences.map(sequence => ({ sequence, type: sequence % 2 ? 'roll' : 'event-card' }));
function setup() {
  vi.useFakeTimers();
  const present = vi.fn();
  const timeline = marblePresentation(present);
  timeline.update(events(1), 'p1', false, false);
  present.mockClear();
  return { present, timeline };
}
afterEach(() => vi.useRealTimers());

describe('Marble display and sound timeline', () => {
  it('keeps short sequences at 640ms with each visual and cue together, without replaying snapshots', () => {
    const { timeline, present } = setup();
    timeline.update(events(1, 2, 3, 4), 'p1', false, false);
    expect(present).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ sequence: 2 }), true, true);
    vi.advanceTimersByTime(230);
    timeline.update(events(1, 2, 3, 4), 'p1', false, false);
    expect(present).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(MARBLE_EVENT_INTERVAL - 230);
    expect(present).toHaveBeenLastCalledWith(expect.objectContaining({ sequence: 3 }), true, true);
    vi.advanceTimersByTime(MARBLE_EVENT_INTERVAL);
    expect(present).toHaveBeenLastCalledWith(expect.objectContaining({ sequence: 4 }), true, true);
    vi.advanceTimersByTime(MARBLE_EVENT_INTERVAL);
    expect(present).toHaveBeenLastCalledWith(expect.objectContaining({ sequence: 4 }), false, false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('supersedes older queued actions and compacts catch-up while retaining ordered current-turn money receipts', () => {
    const { timeline, present } = setup();
    timeline.update(events(1, 2, 3, 4), 'p1', false, false);
    vi.advanceTimersByTime(100);
    const catchup: MarbleActionEvent[] = [
      ...events(1, 2, 3, 4),
      { sequence: 5, type: 'rent', moneyDelta: { p1: -100 } },
      { sequence: 6, type: 'turn' },
      { sequence: 7, type: 'roll' },
      { sequence: 8, type: 'move' },
      { sequence: 9, type: 'bonus', moneyDelta: { p1: 200 } },
      { sequence: 10, type: 'tax', moneyDelta: { p1: -100 } },
      { sequence: 11, type: 'arrival' },
    ];
    timeline.update(catchup, 'p1', false, false);
    expect(present).toHaveBeenLastCalledWith(expect.objectContaining({ sequence: 9 }), true, true);
    timeline.update(catchup, 'p1', false, false);
    vi.runAllTimers();
    expect(present.mock.calls.filter(call => call[2]).map(call => call[0]?.sequence)).toEqual([2, 9, 10, 11]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('never cues an initial snapshot, viewer change or sequence reset', () => {
    const { timeline, present } = setup();
    timeline.update(events(1, 2, 3), 'p1', false, false);
    present.mockClear();
    timeline.update(events(1, 2, 3), 'p2', false, false);
    vi.runAllTimers();
    expect(present).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ sequence: 3 }), false, false);
    present.mockClear();
    timeline.update(events(1), 'p2', false, false);
    expect(present).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ sequence: 1 }), false, false);
    const reloaded = vi.fn();
    marblePresentation(reloaded).update(events(1, 2, 3), 'p1', false, false);
    expect(reloaded).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ sequence: 3 }), false, false);
  });

  it('collapses reduced motion to the newest event and cancels the pending queue', () => {
    const { timeline, present } = setup();
    timeline.update(events(1, 2, 3, 4), 'p1', false, false);
    timeline.update(events(1, 2, 3, 4), 'p1', true, false);
    expect(present).toHaveBeenLastCalledWith(expect.objectContaining({ sequence: 4 }), false, true);
    expect(vi.getTimerCount()).toBe(0);
    present.mockClear();
    timeline.update(events(1, 2, 3, 4), 'p1', true, false);
    expect(present).not.toHaveBeenCalled();
    timeline.update(events(1, 2, 3, 4, 5, 6), 'p1', true, false);
    expect(present).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ sequence: 6 }), false, true);
  });

  it('stops current motion without a second cue when reduced motion changes with no queued events', () => {
    const { timeline, present } = setup();
    timeline.update(events(1, 2), 'p1', false, false);
    timeline.update(events(1, 2), 'p1', true, false);
    expect(present).toHaveBeenLastCalledWith(expect.objectContaining({ sequence: 2 }), false, false);
    expect(present.mock.calls.filter(call => call[2])).toHaveLength(1);
    timeline.update(events(1, 2), 'p1', false, false);
    vi.runAllTimers();
    expect(present.mock.calls.filter(call => call[2])).toHaveLength(1);
  });

  it('gives the result priority over pending event cues and cleans up on unmount', () => {
    const { timeline, present } = setup();
    timeline.update(events(1, 2, 3), 'p1', false, false);
    timeline.update(events(1, 2, 3, 4), 'p1', false, true);
    expect(present).toHaveBeenLastCalledWith(expect.objectContaining({ sequence: 4 }), false, false);
    expect(vi.getTimerCount()).toBe(0);
    timeline.update(events(1, 2, 3, 4, 5), 'p1', false, false);
    present.mockClear();
    timeline.dispose();
    vi.runAllTimers();
    expect(present).not.toHaveBeenCalled();
  });
});

import { describe, expect, it } from 'vitest';
import { dominoCueForEvent, dominoSequence, dominoWindow } from './domino-motion';

describe('Domino committed-event window', () => {
  it('sorts fresh bot and player events and stays silent for the initial or already-seen log', () => {
    const events = [{ sequence: 9, type: 'pass' }, { sequence: 7, type: 'play' }, { sequence: 8, type: 'turn' }];
    expect(dominoWindow(events, 6).fresh.map(event => event.sequence)).toEqual([7, 8, 9]);
    expect(dominoWindow(events, 9).fresh).toEqual([]);
    expect(dominoSequence({ seq: 4 })).toBe(4);
  });

  it('clears on empty logs and plays the new sequence after a regression', () => {
    expect(dominoWindow([], 22)).toMatchObject({ reset: true, latest: 0, fresh: [] });
    expect(dominoWindow([{ sequence: 1, type: 'round-start' }, { sequence: 2, type: 'play' }], 22)).toMatchObject({ reset: true, latest: 2 });
    expect(dominoWindow([{ sequence: 1, type: 'round-start' }, { sequence: 2, type: 'play' }], 22).fresh.map(event => event.sequence)).toEqual([1, 2]);
    expect(dominoWindow([{ sequence: 23, type: 'turn' }], 22).reset).toBe(false);
  });

  it('maps each public Domino event to a game-specific cue and leaves configuration quiet', () => {
    const pairs = [
      ['play', 'place'], ['pass', 'pass'], ['turn', 'turn'], ['tranque', 'tranque'], ['capicua', 'capicua'],
      ['paso-corrido', 'paso'], ['round-end', 'score'], ['score', 'score'], ['win', 'win'], ['round-start', 'event'],
    ] as const;
    for (const [type, cue] of pairs) expect(dominoCueForEvent({ type })).toBe(cue);
    expect(dominoCueForEvent({ type: 'configure' })).toBeNull();
  });
});

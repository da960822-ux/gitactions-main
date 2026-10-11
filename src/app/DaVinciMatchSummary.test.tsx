import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { GameResult } from '../core/types';
import { advanceDaVinciRecord, DaVinciMatchSummary } from './DaVinciMatchSummary';

const empty = (roomId = 'room-a') => ({ record: { roomId, p1: 0, p2: 0, draws: 0 }, tracker: { roomId, complete: false } });
const win = (winner: 'p1' | 'p2' | 'draw'): GameResult => ({ winner, reason: 'finished' });

describe('DaVinciMatchSummary', () => {
  it('counts a completed round once, regardless of repeated updates or viewer seat', () => {
    const start = empty();
    const first = advanceDaVinciRecord(start.record, start.tracker, 'room-a', win('p2'));
    const repeated = advanceDaVinciRecord(first.record, first.tracker, 'room-a', win('p2'));

    expect(first.record).toEqual({ roomId: 'room-a', p1: 0, p2: 1, draws: 0 });
    // Viewer identity is not part of the completion key; both seats see the same result.
    expect(repeated.record).toEqual(first.record);
  });

  it('counts another result only after the game view returns to an unfinished round', () => {
    const start = empty();
    const first = advanceDaVinciRecord(start.record, start.tracker, 'room-a', win('p1'));
    const replay = advanceDaVinciRecord(first.record, first.tracker, 'room-a', null);
    const second = advanceDaVinciRecord(replay.record, replay.tracker, 'room-a', win('draw'));

    expect(second.record).toEqual({ roomId: 'room-a', p1: 1, p2: 0, draws: 1 });
  });

  it('resets the session record by room and counts an already-finished view once', () => {
    const start = empty();
    const previous = advanceDaVinciRecord(start.record, start.tracker, 'room-a', win('p1'));
    const nextRoom = advanceDaVinciRecord(previous.record, previous.tracker, 'room-b', win('p2'));

    expect(nextRoom.record).toEqual({ roomId: 'room-b', p1: 0, p2: 1, draws: 0 });
    expect(advanceDaVinciRecord(nextRoom.record, nextRoom.tracker, 'room-b', win('p2')).record).toEqual(nextRoom.record);
  });

  it('renders bilingual replay consent and the initial finished result count', () => {
    const html = renderToStaticMarkup(createElement(DaVinciMatchSummary, {
      roomId: 'room-a', playerId: 'p1', language: 'es', view: { result: win('p1') }, pendingGame: 'davinci', onReplay: vi.fn(),
    }));

    expect(html).toContain('Récord de esta sesión');
    expect(html).toContain('Jugador 1');
    expect(html).toContain('Da Vinci está pendiente');
    expect(html).toContain('ambas personas lo elijan');
    expect(html).toContain('<strong>1</strong>');
  });
});

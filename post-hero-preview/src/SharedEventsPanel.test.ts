import assert from 'node:assert/strict';
import test from 'node:test';
import { appendDrawingPoint, canChooseNewRound, gridPoint, matchesPattern, sharedStartMode } from './SharedEventsPanel.logic.ts';

function observation(overrides: Record<string, unknown> = {}) {
  return {
    sessionId: 'session', seat: 'p1', syncEpoch: 1, connection: 'connected', serverNow: 1_000,
    round: { roundId: 'round', eventId: 'R01', status: 'scheduled', startAt: 1_000, confirmBy: { p1: true, p2: true } },
    ...overrides,
  } as Parameters<typeof sharedStartMode>[1];
}

test('R03 grid buttons map to bounded normalized coordinates', () => {
  assert.deepEqual(gridPoint(0), { x: 0, y: 0 });
  assert.deepEqual(gridPoint(12), { x: 0.5, y: 0.5 });
  assert.deepEqual(gridPoint(24), { x: 1, y: 1 });
});

test('R03 drawing points clamp to bounds, reject invalid values, and stop at 200', () => {
  const first = appendDrawingPoint([], { x: -2, y: 2 });
  assert.deepEqual(first, [{ x: 0, y: 1 }]);
  assert.equal(appendDrawingPoint(first, { x: Number.NaN, y: 0.5 }), first);
  const bounded = Array.from({ length: 200 }, (_, i) => ({ x: i / 200, y: 0.5 }));
  assert.equal(appendDrawingPoint(bounded, { x: 1, y: 1 }), bounded);
});

test('R04 acknowledgement requires the full opponent sequence in order', () => {
  assert.equal(matchesPattern([2, 0, 5], [2, 0, 5]), true);
  assert.equal(matchesPattern([2, 5, 0], [2, 0, 5]), false);
  assert.equal(matchesPattern([2, 0], [2, 0, 5]), false);
});

test('R01 only animates a newly confirmed live transition and settles late delivery', () => {
  const prior = observation();
  const started = observation({ round: { ...prior.round, status: 'started' } });
  assert.equal(sharedStartMode(prior, started), 'animate');
  assert.equal(sharedStartMode(prior, observation({ round: { ...started.round, status: 'started' }, deliveryDelayMs: 400 })), 'settle');
  assert.equal(sharedStartMode(prior, observation({ serverNow: 1_400, round: { ...started.round, status: 'started' } })), 'settle');
  assert.equal(sharedStartMode(null, started), null);
  assert.equal(sharedStartMode(prior, observation({ syncEpoch: 2, round: { ...started.round, status: 'started' } })), null);
  assert.equal(sharedStartMode(observation({ round: { ...prior.round, status: 'proposed', confirmBy: {} } }), started), null);
});

test('a started outcome stays visible while the next event choices return', () => {
  assert.equal(canChooseNewRound('started'), true);
  assert.equal(canChooseNewRound('cancelled'), true);
  assert.equal(canChooseNewRound('expired'), true);
  assert.equal(canChooseNewRound('proposed'), false);
  assert.equal(canChooseNewRound('scheduled'), false);
});


test('R02 and R03 animate once on fresh consent and render recovery as a static outcome', () => {
  for (const eventId of ['R02', 'R03']) {
    const prior = observation({ round: { ...observation().round, eventId } });
    const started = observation({ round: { ...prior.round, status: 'started' } });
    assert.equal(sharedStartMode(prior, started), 'animate');
    assert.equal(sharedStartMode(started, started), null, 'duplicate started snapshots do not replay');
    assert.equal(sharedStartMode(null, started), null, 'initial started snapshot has no motion token');
    assert.equal(sharedStartMode(prior, { ...started, serverNow: 1_251 }), 'settle');
    assert.equal(sharedStartMode(prior, { ...started, deliveryDelayMs: 251 }), 'settle');
    assert.equal(sharedStartMode(prior, { ...started, syncEpoch: 2 }), null);
    assert.equal(sharedStartMode({ ...prior, connection: 'reconnecting' }, started), null);
    assert.equal(sharedStartMode(prior, { ...started, connection: 'reconnecting' }), null);
    assert.equal(sharedStartMode({ ...prior, round: { ...prior.round, status: 'cancelled' } }, started), null);
    assert.equal(sharedStartMode(prior, { ...started, round: { ...started.round, roundId: 'different' } }), null);
  }
});

test('R04 keeps its explicit manual playback instead of receiving an automatic motion token', () => {
  const prior = observation({ round: { ...observation().round, eventId: 'R04' } });
  assert.equal(sharedStartMode(prior, { ...prior, round: { ...prior.round, status: 'started' } }), null);
});

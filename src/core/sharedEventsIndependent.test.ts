import { describe, expect, it } from 'vitest';
import { advanceSharedEventRound, applySharedEventAction, createSharedEventRound, type SharedEventAction, type SharedEventActor, type SharedEventRound } from './sharedEventsState';

const uuid = (value: number) => `90000000-0000-4000-8000-${String(value).padStart(12, '0')}`;
let request = 1;
function act(state: SharedEventRound, actor: SharedEventActor, type: SharedEventAction['type'], extra: Record<string, unknown> = {}, now = 1_000) {
  return applySharedEventAction(state, actor, { type, requestId: uuid(request++), revision: state.revision, roundId: state.roundId || uuid(900), ...extra } as SharedEventAction, now);
}
function proposal(eventId: 'R01' | 'R02' | 'R03' | 'R04', intent: unknown) {
  return act(createSharedEventRound(), 'p1', 'propose', { eventId, intent });
}

describe('independent shared event trust and consent review', () => {
  it.each([
    ['R02', { decorId: 'cat', recipient: 'p2' }],
    ['R02', { decorId: 'https://external.invalid/asset.svg' }],
    ['R03', { points: [{ x: 0.2, y: 0.3, pressure: 0.5 }] }],
    ['R03', { points: [{ x: NaN, y: 0.3 }] }],
    ['R03', { points: [{ x: Infinity, y: 0.3 }] }],
    ['R03', { points: [{ x: -0.001, y: 0 }] }],
    ['R03', { points: [{ x: 0, y: 1.001 }] }],
    ['R03', { points: Array.from({ length: 201 }, () => ({ x: 0, y: 0 })) }],
    ['R04', { pattern: [0, 1, 2, 3, 4, 5, 0] }],
    ['R04', { pattern: [0.5] }],
    ['R04', { pattern: ['1'] }],
    ['R04', { pattern: [1], microphone: true }],
  ] as const)('rejects unbounded or unexpected %s content %#', (eventId, intent) => {
    expect(() => proposal(eventId, intent)).toThrow('invalid_event_intent');
  });

  it('does not let one authenticated seat supply the second seat or confirm alone', () => {
    let state = proposal('R01', null);
    const forged = { type: 'ready', requestId: uuid(request++), revision: state.revision, roundId: state.roundId, seat: 'p2' };
    expect(() => applySharedEventAction(state, 'p1', forged as SharedEventAction, 1_001)).toThrow('invalid_event_action');
    state = act(state, 'p1', 'ready');
    state = act(state, 'p1', 'ready');
    expect(state.readyBy).toEqual({ p1: true });
    expect(() => act(state, 'p1', 'confirm')).toThrow('event_both_ready_required');
    expect(state.status).toBe('proposed');
  });

  it('requires each R04 member to reproduce the other pattern and resets consent after an edit', () => {
    let state = proposal('R04', { pattern: [0, 1] });
    state = act(state, 'p2', 'contribute', { intent: { pattern: [4, 5] } });
    expect(() => act(state, 'p1', 'ready')).toThrow('event_both_acknowledged_required');
    expect(() => act(state, 'p1', 'acknowledge', { pattern: [0, 1] })).toThrow('event_pattern_mismatch');
    state = act(state, 'p1', 'acknowledge', { pattern: [4, 5] });
    expect(() => act(state, 'p2', 'ready')).toThrow('event_both_acknowledged_required');
    state = act(state, 'p2', 'acknowledge', { pattern: [0, 1] });
    state = act(state, 'p1', 'ready');
    state = act(state, 'p2', 'ready');
    state = act(state, 'p1', 'confirm');
    state = act(state, 'p2', 'contribute', { intent: { pattern: [3] } });
    expect(state).toMatchObject({ ackBy: {}, readyBy: {}, confirmBy: {}, status: 'proposed' });
    expect(() => act(state, 'p1', 'confirm')).toThrow('event_both_ready_required');
  });

  it.each(['hidden', 'disconnect', 'timeout'] as const)('clears pending two-member consent on system %s before start', reason => {
    let state = proposal('R01', null);
    state = act(state, 'p1', 'ready');
    state = act(state, 'p2', 'ready');
    state = act(state, 'p1', 'confirm');
    state = act(state, 'p2', 'confirm');
    const stopped = act(state, 'system', 'cancel', { reason }, state.startAt! - 1);
    expect(stopped).toMatchObject({ status: reason === 'timeout' ? 'expired' : 'cancelled', startAt: null, readyBy: {}, confirmBy: {} });
    expect(advanceSharedEventRound(stopped, state.startAt! + 10_000).status).toBe(stopped.status);
    expect(() => act(stopped, 'p2', 'confirm')).toThrow(/event_round_(expired|unavailable)/);
  });

  it('keeps duplicates from changing a cancelled round or authorizing the other member', () => {
    const initial = createSharedEventRound();
    const action: SharedEventAction = { type: 'propose', requestId: uuid(request++), roundId: uuid(901), revision: 0, eventId: 'R03', intent: { points: [{ x: 0, y: 1 }] } };
    const state = applySharedEventAction(initial, 'p1', action, 1_000);
    const cancelled = act(state, 'p2', 'cancel');
    expect(applySharedEventAction(cancelled, 'p1', action, 1_001)).toBe(cancelled);
    expect(() => applySharedEventAction(cancelled, 'p2', action, 1_001)).toThrow('event_request_conflict');
    expect(cancelled).toMatchObject({ status: 'cancelled', startAt: null });
  });
});

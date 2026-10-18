import { describe, expect, it } from 'vitest';
import { advanceSharedEventRound, applySharedEventAction, createSharedEventRound, SHARED_EVENT_COOLDOWN_MS, SHARED_EVENT_START_DELAY_MS, type SharedEventAction, type SharedEventActor, type SharedEventRound } from './sharedEventsState';

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
function apply(state: SharedEventRound, actor: SharedEventActor, type: SharedEventAction['type'], now: number, extra: Record<string, unknown> = {}) {
  return applySharedEventAction(state, actor, { type, requestId: id(now + (actor === 'p1' ? 100 : actor === 'p2' ? 200 : 300)), revision: state.revision, roundId: type === 'propose' ? id(900) : state.roundId, ...extra } as SharedEventAction, now);
}
function scheduledRound(now = 1_000): SharedEventRound {
  let state = apply(createSharedEventRound(), 'p1', 'propose', now, { eventId: 'R01', intent: null });
  state = apply(state, 'p1', 'ready', now + 1);
  state = apply(state, 'p2', 'ready', now + 2);
  state = apply(state, 'p1', 'confirm', now + 3);
  return apply(state, 'p2', 'confirm', now + 4);
}

describe('shared event round state', () => {
  it('requires two member ready and confirm actions, then schedules from server time', () => {
    const state = scheduledRound();
    expect(state).toMatchObject({ status: 'scheduled', startAt: 1_704, revision: 5, readyBy: { p1: true, p2: true }, confirmBy: { p1: true, p2: true } });
    expect(advanceSharedEventRound(state, 1_703)).toBe(state);
    expect(advanceSharedEventRound(state, state.startAt!)).toMatchObject({ status: 'started', lastStartedAt: state.startAt, readyBy: {}, confirmBy: {} });
  });

  it('returns the original result for an idempotent request and rejects stale or conflicting reuse', () => {
    const initial = createSharedEventRound();
    const proposal = { type: 'propose', requestId: id(1), revision: 0, roundId: id(9), eventId: 'R02', intent: { decorId: 'robot' } } as const;
    const state = applySharedEventAction(initial, 'p1', proposal, 10_000);
    expect(applySharedEventAction(state, 'p1', proposal, 10_001)).toBe(state);
    expect(() => applySharedEventAction(state, 'p2', { ...proposal, requestId: id(2) }, 10_001)).toThrow('stale_event_state');
    expect(() => applySharedEventAction(state, 'p1', { ...proposal, intent: { decorId: 'cat' } }, 10_001)).toThrow('event_request_conflict');
  });

  it('expires an unconfirmed proposal and clears pending consent', () => {
    let state = apply(createSharedEventRound(), 'p1', 'propose', 100, { eventId: 'R01', intent: null });
    state = apply(state, 'p1', 'ready', 101);
    const expired = advanceSharedEventRound(state, 20_100);
    expect(expired).toMatchObject({ status: 'expired', startAt: null, readyBy: {}, confirmBy: {}, revision: state.revision + 1 });
    expect(() => apply(expired, 'p2', 'confirm', 20_101)).toThrow('event_round_expired');
  });

  it('lets either member cancel and prevents a scheduled round from surviving cancellation', () => {
    let state = apply(createSharedEventRound(), 'p1', 'propose', 100, { eventId: 'R01', intent: null });
    state = apply(state, 'p1', 'ready', 101);
    state = apply(state, 'p2', 'ready', 102);
    state = apply(state, 'p1', 'confirm', 103);
    state = apply(state, 'p2', 'confirm', 104);
    const cancelled = apply(state, 'p1', 'cancel', 105);
    expect(cancelled).toMatchObject({ status: 'cancelled', startAt: null, readyBy: {}, confirmBy: {} });
    expect(() => apply(cancelled, 'p2', 'ready', 106)).toThrow('event_round_unavailable');
  });

  it('requires distinct R03 contributions before consent and clears both consents when content changes', () => {
    let state = apply(createSharedEventRound(), 'p1', 'propose', 100, { eventId: 'R03', intent: { points: [{ x: 0.1, y: 0.2 }] } });
    expect(() => apply(state, 'p1', 'ready', 101)).toThrow('event_both_contributions_required');
    state = apply(state, 'p2', 'contribute', 102, { intent: { points: [{ x: 0.8, y: 0.7 }] } });
    state = apply(state, 'p1', 'ready', 103);
    state = apply(state, 'p2', 'ready', 104);
    state = apply(state, 'p1', 'contribute', 105, { intent: { points: [{ x: 0.2, y: 0.3 }] } });
    expect(state).toMatchObject({ readyBy: {}, confirmBy: {}, intentBy: { p1: { points: [{ x: 0.2, y: 0.3 }] }, p2: { points: [{ x: 0.8, y: 0.7 }] } } });
    expect(() => apply(state, 'p1', 'confirm', 106)).toThrow('event_both_ready_required');
  });

  it('requires both R04 patterns, rejects empty contributions, and does not reschedule after confirmation', () => {
    const empty = createSharedEventRound();
    expect(() => apply(empty, 'p1', 'propose', 1, { eventId: 'R04', intent: { pattern: [] } })).toThrow('invalid_event_intent');
    let state = apply(empty, 'p1', 'propose', 10, { eventId: 'R04', intent: { pattern: [1, 2] } });
    state = apply(state, 'p2', 'contribute', 11, { intent: { pattern: [4, 5] } });
    state = apply(state, 'p1', 'ready', 12);
    state = apply(state, 'p2', 'ready', 13);
    state = apply(state, 'p1', 'confirm', 14);
    state = apply(state, 'p2', 'confirm', 15);
    expect(state.status).toBe('scheduled');
    expect(() => apply(state, 'p2', 'confirm', 16)).toThrow('event_round_unavailable');
    expect(() => apply(state, 'p2', 'contribute', 16, { intent: { pattern: [0] } })).toThrow('event_round_unavailable');
  });

  it('uses a server-resolved actor argument and rejects forged actor fields or nonmember actors', () => {
    const proposal = { type: 'propose', requestId: id(1), revision: 0, roundId: id(9), eventId: 'R01', intent: null } as const;
    expect(() => applySharedEventAction(createSharedEventRound(), 'system', proposal, 1)).toThrow('invalid_event_intent');
    expect(() => applySharedEventAction(createSharedEventRound(), 'p1', { ...proposal, actor: 'p2' } as unknown as SharedEventAction, 1)).toThrow('invalid_event_action');
    expect(() => applySharedEventAction(createSharedEventRound(), 'outsider' as SharedEventActor, proposal, 1)).toThrow('not_event_member');
  });

  it('accepts only allowlisted approved decor IDs and bounded structured drawing or pattern intent', () => {
    const initial = createSharedEventRound();
    const proposal = (eventId: 'R02' | 'R03' | 'R04', intent: unknown, request: number) => ({ type: 'propose', requestId: id(request), revision: 0, roundId: id(900), eventId, intent }) as SharedEventAction;
    expect(() => applySharedEventAction(initial, 'p1', proposal('R02', { decorId: '../../private.png' }, 1), 0)).toThrow('invalid_event_intent');
    expect(applySharedEventAction(initial, 'p1', proposal('R02', { decorId: 'sali-suli' }, 0), 0).intentBy.p1).toEqual({ decorId: 'sali-suli' });
    expect(applySharedEventAction(initial, 'p1', proposal('R03', { points: Array.from({ length: 200 }, (_, i) => ({ x: i / 199, y: 0.5 })) }, 2), 0).eventId).toBe('R03');
    expect(() => applySharedEventAction(initial, 'p1', proposal('R03', { points: [{ x: 1.01, y: 0.5 }] }, 3), 0)).toThrow('invalid_event_intent');
    expect(() => applySharedEventAction(initial, 'p1', proposal('R03', { points: Array.from({ length: 201 }, () => ({ x: 0, y: 0 })) }, 4), 0)).toThrow('invalid_event_intent');
    expect(() => applySharedEventAction(initial, 'p1', proposal('R03', { points: [] }, 7), 0)).toThrow('invalid_event_intent');
    expect(applySharedEventAction(initial, 'p1', proposal('R04', { pattern: [0, 1, 2, 3, 4, 5] }, 5), 0).eventId).toBe('R04');
    expect(() => applySharedEventAction(initial, 'p1', proposal('R04', { pattern: [6] }, 6), 0)).toThrow('invalid_event_intent');
    expect(() => applySharedEventAction(initial, 'p1', proposal('R04', { pattern: [] }, 8), 0)).toThrow('invalid_event_intent');
    expect(SHARED_EVENT_START_DELAY_MS).toBe(700);
  });

  it('enforces a 30 second gap between scheduled starts', () => {
    let state = scheduledRound(1_000);
    state = advanceSharedEventRound(state, state.startAt!);
    expect(() => apply(state, 'p1', 'propose', state.lastStartedAt! + SHARED_EVENT_COOLDOWN_MS - 1, { eventId: 'R04', intent: { pattern: [1] } })).toThrow('event_round_unavailable');
    const next = apply(state, 'p1', 'propose', state.lastStartedAt! + SHARED_EVENT_COOLDOWN_MS, { eventId: 'R04', intent: { pattern: [1] } });
    expect(next.status).toBe('proposed');
  });
});

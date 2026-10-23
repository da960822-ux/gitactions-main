import { describe, expect, it, vi } from 'vitest';
import { executeSharedEventRequest, type EventSessionRecord, type SharedEventStore } from './sharedEventsServer';
import { createSharedEventRound } from './sharedEventsState';

const sessionId = '80000000-0000-4000-8000-000000000001';
const actorId = '80000000-0000-4000-8000-000000000002';
const requestId = '80000000-0000-4000-8000-000000000003';
const roundId = '80000000-0000-4000-8000-000000000004';
const action = { type: 'propose', requestId, roundId, revision: 0, eventId: 'R03', intent: { points: [{ x: 0.2, y: 0.8 }] } } as const;
function store(overrides: Partial<EventSessionRecord> = {}): SharedEventStore {
  return {
    read: vi.fn(async () => ({ sessionId, seat: 'p2' as const, memberCount: 2, revision: 0, eventState: null, expiresAt: new Date(60_000).toISOString(), ...overrides })),
    receipt: vi.fn(async () => null),
    commit: vi.fn(async (_session, _actor, _action, next) => ({ sessionId, seat: 'p2' as const, revision: next.revision, eventState: next, expiresAt: new Date(60_000).toISOString() })),
  };
}

describe('independent shared event server boundary', () => {
  it('derives p2 contribution from verified membership and keeps durable drawing signatures out of public state', async () => {
    const db = store();
    const result = await executeSharedEventRequest(db, actorId, { sessionId, action }, 1_000);
    expect(db.read).toHaveBeenCalledWith(sessionId, actorId);
    expect(db.commit).toHaveBeenCalledWith(sessionId, actorId, action, expect.objectContaining({ intentBy: { p2: action.intent }, receipts: [] }));
    expect(result.eventState?.intentBy.p1).toBeUndefined();
  });

  it.each(['actor', 'seat', 'p_verified_actor', 'roomId'])('rejects a body %s override before reading private state', async key => {
    const db = store();
    await expect(executeSharedEventRequest(db, actorId, { sessionId, action, [key]: actorId }, 1_000)).rejects.toThrow('invalid_event_request');
    expect(db.read).not.toHaveBeenCalled(); expect(db.commit).not.toHaveBeenCalled();
  });

  it('rejects absent membership, expired sessions and divergent persisted state before committing', async () => {
    for (const [db, message] of [
      [store({ memberCount: 1 }), 'event_session_not_ready'],
      [store({ expiresAt: new Date(999).toISOString() }), 'event_session_unavailable'],
      [store({ revision: 1, eventState: createSharedEventRound() }), 'event_state_invalid'],
    ] as const) {
      await expect(executeSharedEventRequest(db, actorId, { sessionId, action }, 1_000)).rejects.toThrow(message);
      expect(db.commit).not.toHaveBeenCalled();
    }
  });

  it('never reapplies old drawing requests after the live session has already cancelled', async () => {
    const state = { ...createSharedEventRound(), revision: 2, roundId };
    const db = store({ revision: 2, eventState: state });
    db.receipt = vi.fn(async () => ({ user_id: actorId, signature: JSON.parse(JSON.stringify(action)) }));
    const result = await executeSharedEventRequest(db, actorId, { sessionId, action }, 1_000);
    expect(result.eventState).toBe(state); expect(db.commit).not.toHaveBeenCalled();
    db.receipt = vi.fn(async () => ({ user_id: 'another-real-identity', signature: action }));
    await expect(executeSharedEventRequest(db, actorId, { sessionId, action }, 1_000)).rejects.toThrow('event_request_conflict');
  });
});

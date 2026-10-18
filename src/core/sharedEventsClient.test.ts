import type { SupabaseClient } from '@supabase/supabase-js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SharedEventsClient } from './sharedEventsClient';
import { applySharedEventAction, createSharedEventRound, type SharedEventAction } from './sharedEventsState';

const id = '10000000-0000-4000-8000-000000000001';
function setup() {
  let record = { sessionId: id, seat: 'p1', memberCount: 2, revision: 0, eventState: createSharedEventRound(), serverNow: 10_000, expiresAt: new Date(3_610_000).toISOString() };
  const callbacks: Array<(payload?: { old?: { id: string }; status?: string; extension?: string }) => void> = [];
  let status: (value: string) => void = () => {};
  const channel = { on: vi.fn((_event, _options, callback) => { callbacks.push(callback); return channel; }), subscribe: vi.fn(callback => { status = callback; return channel; }) };
  const db = { auth: { getSession: vi.fn(async () => ({ data: { session: { access_token: 'test-token' } } })), signInAnonymously: vi.fn() },
    rpc: vi.fn(async (name: string) => ({ data: name === 'create_event_session' ? id : name === 'pause_event_session' || name === 'close_event_session' ? null : structuredClone(record), error: null })),
    channel: vi.fn(() => channel), removeChannel: vi.fn(), functions: { invoke: vi.fn(async (_name: string, _options: { body: { sessionId: string; action: SharedEventAction } }) => ({ data: structuredClone(record), error: null })) } };
  const client = new SharedEventsClient(db as unknown as SupabaseClient);
  return { client, db, callbacks, status: (value: string) => status(value), setRecord: (next: typeof record) => { record = next; }, record };
}
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('shared event authenticated transport', () => {
  it('does not simulate a remote partner without configured Supabase', async () => {
    const client = new SharedEventsClient(null);
    await expect(client.createSession()).rejects.toThrow('online_unavailable');
    expect(client.getSnapshot()).toBeNull();
  });
  it('requires an explicit valid invite and does not auto-join remembered game rooms', async () => {
    const { client, db } = setup();
    expect(client.getSnapshot()).toBeNull();
    await expect(client.joinSession('dos-last-room')).rejects.toThrow('invalid_event_invite');
    expect(db.rpc).not.toHaveBeenCalled();
    await client.joinSession(id);
    expect(db.rpc).toHaveBeenCalledWith('join_event_session', { p_session: id });
    await client.closeSession();
    expect(client.getSnapshot()).toBeNull();
  });
  it('retries the exact request identity on transport loss without adding an actor', async () => {
    const { client, db } = setup();
    await client.createSession();
    db.functions.invoke.mockResolvedValueOnce({ data: null, error: { name: 'FunctionsFetchError', message: 'fetch failed' } } as never);
    await client.send({ type: 'propose', eventId: 'R02', intent: { decorId: 'robot' } });
    const calls = db.functions.invoke.mock.calls as unknown as Array<[string, { body: Record<string, unknown> }]>;
    expect(calls).toHaveLength(2);
    expect(calls[0]).toEqual(calls[1]);
    expect(calls[0][1].body).not.toHaveProperty('actor');
    expect(calls[0][1].body.action).toMatchObject({ revision: 0, eventId: 'R02', intent: { decorId: 'robot' } });
  });
  it('does not rebase old consent after a stale response', async () => {
    const { client, db } = setup(); await client.createSession();
    db.functions.invoke.mockResolvedValueOnce({ data: null, error: { name: 'FunctionsHttpError', message: '409', context: { json: async () => ({ error: 'stale_event_state' }) } } } as never);
    await expect(client.send({ type: 'ready' })).rejects.toThrow('stale_event_state');
    expect(db.functions.invoke).toHaveBeenCalledTimes(1);
  });
  it('revokes the same round when peer ready commits before the cancellation reaches the server', async () => {
    const { client, db, record, setRecord } = setup();
    const roundId = '20000000-0000-4000-8000-000000000001';
    let authority = applySharedEventAction(createSharedEventRound(), 'p1', { type: 'propose', requestId: crypto.randomUUID(), roundId, revision: 0, eventId: 'R01', intent: null }, 10_000);
    setRecord({ ...record, revision: authority.revision, eventState: authority });
    await client.createSession();
    // The peer's ready is committed, while this client's realtime snapshot is still revision 1.
    authority = applySharedEventAction(authority, 'p2', { type: 'ready', requestId: crypto.randomUUID(), roundId, revision: authority.revision }, 10_001);
    setRecord({ ...record, revision: authority.revision, eventState: authority });
    db.functions.invoke.mockImplementation(async (_name, options) => {
      try {
        authority = applySharedEventAction(authority, 'p1', options.body.action, 10_002);
        const next = { ...record, revision: authority.revision, eventState: authority };
        setRecord(next); return { data: next, error: null };
      } catch (error) {
        return { data: null, error: { name: 'FunctionsHttpError', message: '409', context: { json: async () => ({ error: (error as Error).message }) } } } as never;
      }
    });
    const cancelled = await client.send({ type: 'cancel' });
    expect(cancelled.round).toMatchObject({ roundId, status: 'cancelled', readyBy: {}, confirmBy: {} });
    const [first, second] = db.functions.invoke.mock.calls.map(call => call[1].body.action);
    expect(first).toMatchObject({ type: 'cancel', roundId, revision: 1 });
    expect(second).toMatchObject({ type: 'cancel', roundId, revision: 2 });
    expect(second.requestId).not.toBe(first.requestId);
    expect(db.functions.invoke).toHaveBeenCalledTimes(2);
  });
  it('never rebases cancellation onto a different round', async () => {
    const { client, db, record, setRecord } = setup();
    const roundId = '20000000-0000-4000-8000-000000000001';
    setRecord({ ...record, revision: 1, eventState: { ...record.eventState, roundId, status: 'proposed', revision: 1 } });
    await client.createSession();
    setRecord({ ...record, revision: 3, eventState: { ...record.eventState, roundId: '20000000-0000-4000-8000-000000000002', status: 'proposed', revision: 3 } });
    db.functions.invoke.mockResolvedValueOnce({ data: null, error: { name: 'FunctionsHttpError', message: '409', context: { json: async () => ({ error: 'stale_event_state' }) } } } as never);
    await expect(client.send({ type: 'cancel' })).rejects.toThrow('stale_event_state');
    expect(db.functions.invoke).toHaveBeenCalledTimes(1);
  });
  it('reports slow live delivery so callers settle without confusing it with reconnect', async () => {
    const { client, record, setRecord } = setup();
    await client.createSession();
    const epoch = client.getSnapshot()!.syncEpoch;
    setRecord({ ...record, eventState: { ...record.eventState, status: 'started', startAt: 9000, revision: 1 }, revision: 1 });
    vi.spyOn(performance, 'now').mockReturnValueOnce(0).mockReturnValueOnce(400);
    const next = await client.snapshot();
    expect(next.syncEpoch).toBe(epoch);
    expect(next.deliveryDelayMs).toBe(400);
    expect(next.round.status).toBe('started');
  });
  it('clears local drawing content when the other member deletes the session', async () => {
    const { client, callbacks } = setup();
    const unsubscribe = client.subscribe(() => {});
    await client.createSession();
    callbacks[1]({ old: { id } });
    expect(client.getSnapshot()).toBeNull();
    unsubscribe();
  });
  it('explicitly resumes a collapsed panel from a fresh snapshot without restoring old consent', async () => {
    const { client, db, record, setRecord, status } = setup();
    const unsubscribe = client.subscribe(() => {});
    await client.createSession();
    setRecord({ ...record, revision: 1, eventState: { ...record.eventState, revision: 1, status: 'proposed', readyBy: { p1: true }, confirmBy: { p1: true } } });
    await client.snapshot();
    const epoch = client.getSnapshot()!.syncEpoch;
    await client.pause();
    status('SUBSCRIBED');
    await expect(client.send({ type: 'ready' })).rejects.toThrow('event_session_unavailable');
    setRecord({ ...record, revision: 2, eventState: { ...record.eventState, revision: 2, status: 'cancelled', readyBy: {}, confirmBy: {} } });
    const resumed = await client.resume();
    expect(resumed.syncEpoch).toBeGreaterThan(epoch);
    expect(resumed.round).toMatchObject({ status: 'cancelled', readyBy: {}, confirmBy: {} });
    await client.send({ type: 'propose', eventId: 'R01', intent: null });
    expect(db.functions.invoke).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
  it('refuses explicit resume while the page is hidden or offline', async () => {
    const { client, db } = setup(); await client.createSession(); await client.pause();
    vi.stubGlobal('document', { visibilityState: 'hidden' });
    await expect(client.resume()).rejects.toThrow('event_session_unavailable');
    vi.stubGlobal('document', { visibilityState: 'visible' }); vi.stubGlobal('navigator', { onLine: false });
    await expect(client.resume()).rejects.toThrow('event_session_unavailable');
    expect(db.functions.invoke).not.toHaveBeenCalled();
  });
  it('resnapshots when actual Postgres subscription readiness follows the channel handshake', async () => {
    const { client, callbacks, record, setRecord } = setup();
    const unsubscribe = client.subscribe(() => {}); await client.createSession();
    setRecord({ ...record, revision: 1, eventState: { ...record.eventState, revision: 1, status: 'proposed', expiresAt: 30_000 } });
    callbacks[3]({ status: 'ok', extension: 'postgres_changes' });
    await vi.waitFor(() => expect(client.getSnapshot()!.round.status).toBe('proposed'));
    unsubscribe();
  });
  it('keeps heartbeat traffic bounded to active rounds and uses no room/chat subscriptions', async () => {
    vi.useFakeTimers();
    const { client, db, record, setRecord } = setup();
    const unsubscribe = client.subscribe(() => {}); await client.createSession();
    const idleCalls = db.rpc.mock.calls.length;
    await vi.advanceTimersByTimeAsync(30_000);
    expect(db.rpc).toHaveBeenCalledTimes(idleCalls);
    setRecord({ ...record, eventState: { ...record.eventState, status: 'proposed', expiresAt: 30_000, revision: 1 }, revision: 1 });
    await client.snapshot(); const activeCalls = db.rpc.mock.calls.length;
    await vi.advanceTimersByTimeAsync(5_000);
    expect(db.rpc).toHaveBeenCalledTimes(activeCalls + 1);
    expect(db.channel).toHaveBeenCalledWith(`shared-event:${id}`);
    unsubscribe();
    await Promise.resolve();
    expect(db.rpc).toHaveBeenCalledWith('pause_event_session', { p_session: id });
  });
});

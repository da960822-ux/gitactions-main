import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabase = vi.hoisted(() => {
  let rpcHandler: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
  const handlers: Array<(status: string) => void> = [];
  const rpc = vi.fn((name: string, args: Record<string, unknown>) => rpcHandler(name, args));
  const channel = {
    on: vi.fn(() => channel),
    subscribe: vi.fn((handler: (status: string) => void) => {
      handlers.push(handler);
      return channel;
    }),
  };
  const db = {
    auth: { getSession: vi.fn(async () => ({ data: { session: { access_token: 'test' } } })), signInAnonymously: vi.fn() },
    rpc,
    channel: vi.fn(() => channel),
    removeChannel: vi.fn(async () => 'ok'),
    functions: { invoke: vi.fn() },
  };
  return {
    db,
    handlers,
    rpc,
    channel,
    createClient: vi.fn(() => db),
    setRpcHandler: (handler: typeof rpcHandler) => { rpcHandler = handler; },
  };
});

vi.mock('@supabase/supabase-js', () => ({ createClient: supabase.createClient }));

const room = (id: string, view: unknown) => ({
  room: { version: 1, game_id: 'davinci', pending_game: null },
  seat: 'p1',
  view,
  members: [{ seat: 'p1', nickname: id, language: 'ko' }, { seat: 'p2', nickname: 'B', language: 'es' }],
  messages: [],
});

async function loadClient() {
  vi.resetModules();
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-test-key');
  const module = await import('./client');
  expect(module.isOnlineConfigured).toBe(true);
  return module.client;
}

async function flush() {
  for (let i = 0; i < 8; i++) await Promise.resolve();
}

beforeEach(() => {
  vi.clearAllMocks();
  supabase.handlers.length = 0;
  supabase.setRpcHandler(async () => ({ data: null, error: null }));
});

describe('online room client refreshes', () => {
  it('keeps committed Minhwatu events when a reconnect snapshot has an older room version', async () => {
    const committed = { ...room('hwatu-room', { log: [{ sequence: 7, type: 'capture' }] }), room: { version: 3, game_id: 'minhwatu', pending_game: null } };
    supabase.setRpcHandler(async () => ({ data: committed, error: null }));
    const client = await loadClient();
    const stop = client.subscribeRoom('hwatu-room', () => {});
    await vi.waitFor(() => expect(client.getSnapshot().version).toBe(3));

    supabase.setRpcHandler(async () => ({ data: { ...committed, room: { ...committed.room, version: 2 }, view: { log: [{ sequence: 1, type: 'deal' }] } }, error: null }));
    supabase.handlers.at(-1)!('SUBSCRIBED');
    await flush();
    expect(client.getSnapshot()).toMatchObject({ version: 3, view: { log: [{ sequence: 7, type: 'capture' }] } });
    stop();
  });

  it('reuses the action receipt ID after a stale version refresh', async () => {
    let version = 3;
    supabase.setRpcHandler(async () => ({ data: { ...room('hwatu-room', {}), room: { version, game_id: 'minhwatu', pending_game: null } }, error: null }));
    const client = await loadClient();
    const stop = client.subscribeRoom('hwatu-room', () => {});
    await vi.waitFor(() => expect(client.getSnapshot().version).toBe(3));
    supabase.db.functions.invoke.mockImplementationOnce(async () => {
      version = 4;
      return { error: { message: 'stale_state' } };
    }).mockResolvedValueOnce({ error: null });

    await client.sendAction({ type: 'play', payload: { index: 0 } });
    const bodies = supabase.db.functions.invoke.mock.calls.map(call => call[1].body);
    expect(bodies).toHaveLength(2);
    expect(bodies[0].version).toBe(3);
    expect(bodies[1].version).toBe(4);
    expect(bodies[1].requestId).toBe(bodies[0].requestId);
    expect(bodies[1].action).toEqual(bodies[0].action);
    stop();
  });

  it('does not send a queued old-room action to a newly opened invite', async () => {
    supabase.setRpcHandler(async (_name, args) => ({ data: room(String(args.p_room), {}), error: null }));
    const client = await loadClient();
    const stopOld = client.subscribeRoom('old-room', () => {});
    await vi.waitFor(() => expect(client.getSnapshot().version).toBe(1));
    let finish!: (value: { error: null }) => void;
    supabase.db.functions.invoke.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const first = client.sendAction({ type: 'draw', payload: { color: 'black' } });
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
    const queued = client.sendAction({ type: 'guess', payload: { number: 1 } });
    const rejected = expect(queued).rejects.toThrow('room_expired');
    const stopNew = client.subscribeRoom('new-room', () => {});
    await vi.waitFor(() => expect(client.getSnapshot().roomId).toBe('new-room'));
    finish({ error: null });
    await first;
    await rejected;
    expect(supabase.db.functions.invoke).toHaveBeenCalledTimes(1);
    expect(supabase.db.functions.invoke.mock.calls[0][1].body.roomId).toBe('old-room');
    supabase.db.functions.invoke.mockResolvedValueOnce({ error: null });
    await client.sendReaction('applause');
    expect(supabase.db.functions.invoke.mock.calls[1][1].body.roomId).toBe('new-room');
    stopOld();
    stopNew();
  });

  it('clears the previous private hand immediately when subscribing to a new invite', async () => {
    supabase.setRpcHandler(async (_name, args) => ({ data: room(String(args.p_room), { hand: ['private card'] }), error: null }));
    const client = await loadClient();
    const stopFirst = client.subscribeRoom('old-room', () => {});
    await vi.waitFor(() => expect(client.getSnapshot().view).toEqual({ hand: ['private card'] }));

    const nextStates: Array<{ roomId: string | null; view: unknown; messages: unknown[] }> = [];
    client.subscribeRoom('new-invite', snapshot => nextStates.push(snapshot));
    expect(client.getSnapshot()).toMatchObject({ roomId: 'new-invite', view: null, messages: [], players: [], version: 0 });
    expect(nextStates.at(-1)).toMatchObject({ roomId: 'new-invite', view: null, messages: [], players: [], version: 0 });
    stopFirst();
  });

  it('ignores an old room response that arrives after a newer invite', async () => {
    let resolveOld!: (value: { data: unknown; error: unknown }) => void;
    supabase.setRpcHandler((_name, args) => args.p_room === 'old-room'
      ? new Promise(resolve => { resolveOld = resolve; })
      : Promise.resolve({ data: room('new-invite', { hand: ['new card'] }), error: null }));
    const client = await loadClient();
    client.subscribeRoom('old-room', () => {});
    await vi.waitFor(() => expect(resolveOld).toBeTypeOf('function'));
    client.subscribeRoom('new-invite', () => {});
    await vi.waitFor(() => expect(client.getSnapshot().view).toEqual({ hand: ['new card'] }));

    resolveOld({ data: room('old-room', { hand: ['old private card'] }), error: null });
    await flush();
    expect(client.getSnapshot()).toMatchObject({ roomId: 'new-invite', view: { hand: ['new card'] } });
  });

  it('refreshes when Realtime reconnects and clears the snapshot if the room is no longer available', async () => {
    supabase.setRpcHandler(async () => ({ data: room('active-room', { hand: ['private card'] }), error: null }));
    const client = await loadClient();
    client.subscribeRoom('active-room', () => {});
    await vi.waitFor(() => expect(client.getSnapshot().view).toEqual({ hand: ['private card'] }));

    supabase.setRpcHandler(async () => ({ data: null, error: null }));
    const subscriptions = supabase.handlers.length;
    supabase.handlers[subscriptions - 1]('SUBSCRIBED');
    await vi.waitFor(() => expect(client.getSnapshot()).toMatchObject({ roomId: 'active-room', view: null, messages: [], players: [], error: 'room_expired' }));
  });

  it('sends canonical reaction IDs online and blocks free text in non-Catchmind before invoking Edge', async () => {
    supabase.setRpcHandler(async () => ({ data: room('reaction-room', { hand: [] }), error: null }));
    const client = await loadClient();
    client.subscribeRoom('reaction-room', () => {});
    await vi.waitFor(() => expect(client.getSnapshot().gameId).toBe('davinci'));
    supabase.db.functions.invoke.mockResolvedValue({ error: null });

    await expect(client.sendChat('private free text')).rejects.toThrow('chat_not_allowed');
    expect(supabase.db.functions.invoke).not.toHaveBeenCalled();
    await client.sendReaction('applause');
    expect(supabase.db.functions.invoke).toHaveBeenCalledTimes(1);
    expect(supabase.db.functions.invoke.mock.calls[0][1].body).toMatchObject({ reaction: 'applause' });
    expect(supabase.db.functions.invoke.mock.calls[0][1].body).not.toHaveProperty('chat');
  });
});

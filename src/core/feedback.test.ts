import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => {
  let result: { data: unknown; error: unknown } = { data: [], error: null };
  let rpcHandler: (name: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const builder: Record<string, any> = {};
  for (const method of ['select', 'eq', 'gt', 'order', 'insert', 'update']) {
    builder[method] = vi.fn((...args: unknown[]) => { calls.push({ method, args }); return builder; });
  }
  builder.single = vi.fn(async () => result);
  builder.maybeSingle = vi.fn(async () => result);
  builder.then = (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) => Promise.resolve(result).then(resolve, reject);
  const db = {
    auth: { getSession: vi.fn(async () => ({ data: { session: { access_token: 'test', user: { id: 'user-1' } } }, error: null })), signInAnonymously: vi.fn(async () => ({ error: null })) },
    rpc: vi.fn((name: string, args?: Record<string, unknown>) => rpcHandler(name, args)),
    from: vi.fn(() => builder),
  };
  return {
    db, calls,
    createClient: vi.fn(() => db),
    setResult(value: { data: unknown; error: unknown }) { result = value; },
    setRpcHandler(handler: typeof rpcHandler) { rpcHandler = handler; },
  };
});

vi.mock('@supabase/supabase-js', () => ({ createClient: mock.createClient }));

let storage = new Map<string, string>();
function localStorageMock() {
  return {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
    removeItem: (key: string) => { storage.delete(key); },
    clear: () => { storage.clear(); },
  };
}

async function load(online: boolean) {
  vi.resetModules();
  vi.stubEnv('VITE_SUPABASE_URL', online ? 'https://example.supabase.co' : '');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', online ? 'anon-test-key' : '');
  return import('./feedback');
}

beforeEach(() => {
  vi.clearAllMocks();
  mock.calls.length = 0;
  mock.setResult({ data: [], error: null });
  mock.setRpcHandler(async () => ({ data: null, error: null }));
  storage = new Map();
  vi.stubGlobal('localStorage', localStorageMock());
});

describe('feedback service', () => {
  it('creates and joins a standalone same-browser demo pair and keeps its entries for seven days', async () => {
    const first = await load(false);
    expect(first.isFeedbackOnline).toBe(false);
    expect(mock.createClient).not.toHaveBeenCalled();
    const space = await first.feedback.createSpace();
    expect(await first.feedback.getRole(space)).toBe('p1');
    expect(await first.feedback.joinSpace(space)).toBe('p2');
    expect(await first.feedback.getRole(space)).toBe('p2');
    expect(await first.feedback.memberCount(space)).toBe(2);
    const entry = await first.feedback.create(space, { category: 'game', title: 'Jaipur', body: 'Play again soon' });
    const otherSpace = await first.feedback.createSpace();
    expect(await first.feedback.list(otherSpace)).toEqual([]);

    const next = await load(false);
    expect(await next.feedback.list(space)).toEqual([entry]);
    await next.feedback.updateStatus(space, entry.id, 'planned');
    expect((await next.feedback.list(space))[0].status).toBe('planned');

    storage.set(`couple-feedback:${space}`, JSON.stringify([{ ...entry, id: 'old', createdAt: new Date(Date.now() - 8 * 86400000).toISOString() }]));
    expect(await next.feedback.list(space)).toEqual([]);
    expect(JSON.parse(storage.get(`couple-feedback:${space}`)!).length).toBe(0);
  });

  it('reuses the shared online client without creating another auth instance', async () => {
    const api = await load(true);
    const { onlineDb } = await import('./supabase');
    expect(onlineDb).toBe(mock.db);
    expect(mock.createClient).toHaveBeenCalledTimes(1);
    expect(mock.createClient).toHaveBeenCalledWith('https://example.supabase.co', 'anon-test-key');
    await api.feedback.list('space-1');
    expect(mock.db.auth.getSession).toHaveBeenCalledOnce();
    expect(mock.db.from).toHaveBeenCalledWith('feedback_entries');
  });

  it('uses authenticated standalone space RPCs and filters online posts by space and age', async () => {
    const api = await load(true);
    mock.setRpcHandler(async name => name === 'create_feedback_space'
      ? { data: 'space-1', error: null }
      : { data: 'p2', error: null });
    expect(api.isFeedbackOnline).toBe(true);
    expect(await api.feedback.createSpace()).toBe('space-1');
    expect(await api.feedback.joinSpace('space-1')).toBe('p2');
    expect(mock.db.auth.getSession).toHaveBeenCalled();
    expect(mock.db.rpc).toHaveBeenCalledWith('create_feedback_space');
    expect(mock.db.rpc).toHaveBeenCalledWith('join_feedback_space', { p_space: 'space-1' });

    const row = { id: 'entry-1', category: 'feature', title: 'A note', body: 'Body', status: 'new', created_at: new Date().toISOString() };
    mock.setResult({ data: { seat: 'p2' }, error: null });
    expect(await api.feedback.getRole('space-1')).toBe('p2');
    expect(mock.db.from).toHaveBeenCalledWith('feedback_space_members');
    expect(mock.calls).toContainEqual({ method: 'eq', args: ['space_id', 'space-1'] });
    expect(mock.calls).toContainEqual({ method: 'eq', args: ['user_id', 'user-1'] });

    mock.setResult({ data: [{ seat: 'p1' }, { seat: 'p2' }], error: null });
    expect(await api.feedback.memberCount('space-1')).toBe(2);

    mock.setResult({ data: [row], error: null });
    expect(await api.feedback.list('space-1')).toEqual([{ id: row.id, category: row.category, title: row.title, body: row.body, status: row.status, createdAt: row.created_at }]);
    expect(mock.calls).toContainEqual({ method: 'gt', args: ['created_at', expect.any(String)] });
    expect(mock.calls).toContainEqual({ method: 'eq', args: ['space_id', 'space-1'] });
  });

  it('stores online posts and returns an explicit error for an update filtered by RLS', async () => {
    const api = await load(true);
    const row = { id: 'entry-1', category: 'message', title: 'A note', body: 'Body', status: 'new', created_at: new Date().toISOString() };
    mock.setRpcHandler(async () => ({ data: row, error: null }));
    expect(await api.feedback.create('space-1', { category: 'message', title: ' A note ', body: ' Body ' }, 'request-1')).toEqual({ id: row.id, category: row.category, title: row.title, body: row.body, status: row.status, createdAt: row.created_at });
    expect(mock.db.rpc).toHaveBeenCalledWith('submit_feedback', { p_space: 'space-1', p_request: 'request-1', p_category: 'message', p_title: 'A note', p_body: 'Body' });
    mock.setResult({ data: null, error: null });
    await expect(api.feedback.updateStatus('space-1', 'entry-1', 'read')).rejects.toThrow('feedback_update_denied');
  });

  it('reuses a request ID after an uncertain online response and never falls back to local storage', async () => {
    const api = await load(true);
    const input = { category: 'complaint' as const, title: 'Slow', body: 'Please fix the button' };
    mock.setRpcHandler(async () => ({ data: null, error: new Error('response_lost') }));
    await expect(api.feedback.create('space-1', input, 'retry-1')).rejects.toThrow('response_lost');
    expect(storage.size).toBe(0);
    const row = { id: 'retry-1', ...input, status: 'new', created_at: new Date().toISOString() };
    mock.setRpcHandler(async () => ({ data: row, error: null }));
    expect((await api.feedback.create('space-1', input, 'retry-1')).id).toBe('retry-1');
    expect(mock.db.rpc.mock.calls.map(call => call[1]?.p_request)).toEqual(['retry-1', 'retry-1']);
  });

  it('deduplicates demo retries and rejects changed content with the same ID', async () => {
    const api = await load(false);
    const space = await api.feedback.createSpace();
    const input = { category: 'other' as const, title: 'Note', body: 'A small idea' };
    const first = await api.feedback.create(space, input, 'same-id');
    expect(await api.feedback.create(space, input, 'same-id')).toEqual(first);
    expect(await api.feedback.list(space)).toHaveLength(1);
    await expect(api.feedback.create(space, { ...input, body: 'Different' }, 'same-id')).rejects.toThrow('feedback_request_conflict');
  });

  it('rejects corrupt demo storage and invalid input instead of replacing it', async () => {
    const api = await load(false);
    const space = await api.feedback.createSpace();
    await expect(api.feedback.create(space, { category: 'message', title: ' ', body: 'hello' })).rejects.toThrow('feedback_invalid');
    storage.set(`couple-feedback:${space}`, '{broken');
    await expect(api.feedback.list(space)).rejects.toThrow('feedback_storage_invalid');
    expect(storage.get(`couple-feedback:${space}`)).toBe('{broken');
  });
});

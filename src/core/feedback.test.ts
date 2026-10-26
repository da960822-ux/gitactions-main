import { afterEach, describe, expect, it, vi } from 'vitest';
import { feedback } from './feedback';

afterEach(() => vi.unstubAllGlobals());

describe('shared feedback client', () => {
  it('uses the same-origin API without a browser space or Supabase identity', async () => {
    const fetchMock = vi.fn(async (path: string, init?: RequestInit) => new Response(JSON.stringify(path === '/api/feedback' && !init?.method
      ? { entries: [], canAcknowledge: false, siteUserId: 'user-1' }
      : { id: 'request-id', category: 'game', title: 'Note', body: 'Body', status: 'new', createdAt: '2026-10-26T00:00:00Z' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await feedback.list()).toEqual({ entries: [], canAcknowledge: false, siteUserId: 'user-1' });
    await feedback.create({ category: 'game', title: 'Note', body: 'Body' }, 'request-id');
    await feedback.updateStatus('request-id', 'done');
    expect(fetchMock.mock.calls.map(call => call[0])).toEqual(['/api/feedback', '/api/feedback', '/api/feedback/request-id/status']);
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'POST', credentials: 'same-origin', cache: 'no-store' });
    expect(JSON.parse(fetchMock.mock.calls[1][1]?.body as string)).toEqual({ id: 'request-id', category: 'game', title: 'Note', body: 'Body' });
  });

  it('rejects an API failure and never reports a saved post', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'authentication_required' }), { status: 401 })));
    await expect(feedback.list()).rejects.toThrow('feedback_http_401');
    await expect(feedback.create({ category: 'game', title: 'Note', body: 'Body' }, 'request-id')).rejects.toThrow('feedback_http_401');
  });
});

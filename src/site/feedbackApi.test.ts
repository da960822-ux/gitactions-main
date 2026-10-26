import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { handleFeedbackRequest, type FeedbackDb, type FeedbackEnv } from './feedbackApi';

const owner = 'owner-site-user';
const partner = 'partner-site-user';
const id = '11111111-1111-4111-8111-111111111111';
const sourceId = '22222222-2222-4222-8222-222222222222';
const origin = 'https://example.chatgpt.site';
const generic = { category: 'game', title: 'A suggestion', body: 'A private idea' };
let sqlite: DatabaseSync;
let env: FeedbackEnv;

function adapter(db: DatabaseSync): FeedbackDb {
  return {
    prepare(sql: string) {
      let values: unknown[] = [];
      return {
        bind(...args: unknown[]) { values = args; return this; },
        async first<T>() { return (db.prepare(sql).get(...values as []) ?? null) as T | null; },
        async all<T>() { return { results: db.prepare(sql).all(...values as []) as T[] }; },
        async run() { return { meta: { changes: Number(db.prepare(sql).run(...values as []).changes) } }; },
      };
    },
  };
}
function api(path: string, method = 'GET', user = partner, body?: unknown, headers: Record<string, string> = {}) {
  const request = new Request(`${origin}${path}`, { method, headers: {
    ...(user ? { 'oai-authenticated-user-id': user } : {}),
    ...(method !== 'GET' ? { Origin: origin, 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin' } : {}),
    ...headers,
  }, body: body === undefined ? undefined : JSON.stringify(body) });
  return handleFeedbackRequest(request, env);
}

beforeEach(() => {
  sqlite = new DatabaseSync(':memory:');
  const migration = readFileSync(resolve(process.cwd(), 'drizzle/0000_kind_deadpool.sql'), 'utf8');
  for (const part of migration.split('--> statement-breakpoint')) sqlite.exec(part);
  env = { DB: adapter(sqlite), FEEDBACK_OWNER_USER_ID: owner };
});
afterEach(() => sqlite.close());

describe('private shared feedback API', () => {
  it('requires Site identity and D1; same-origin writes cannot be cross-site', async () => {
    expect((await api('/api/feedback', 'GET', '')).status).toBe(401);
    const db = env.DB; env.DB = undefined;
    expect((await api('/api/feedback')).status).toBe(503);
    env.DB = db;
    expect((await api('/api/feedback', 'POST', partner, { id, ...generic }, { Origin: 'https://unrelated.example' })).status).toBe(403);
    expect((await api('/api/feedback', 'POST', partner, { id, ...generic }, { 'Sec-Fetch-Site': 'cross-site' })).status).toBe(403);
    expect((await api('/api/feedback')).headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(sqlite.prepare('SELECT count(*) AS count FROM feedback_entries').get()).toMatchObject({ count: 0 });
  });

  it('shares a new post across both identities, deduplicates retries, and limits status changes to the configured owner', async () => {
    const post = await api('/api/feedback', 'POST', partner, { id, ...generic });
    expect(post.status).toBe(201);
    expect((await post.json()).body).toBe(generic.body);
    expect((await api('/api/feedback', 'POST', partner, { id, ...generic })).status).toBe(201);
    expect((await api('/api/feedback', 'POST', partner, { id, ...generic, body: 'Changed' })).status).toBe(409);
    expect((await api('/api/feedback', 'POST', owner, { id, ...generic })).status).toBe(409);
    const readByOwner = await (await api('/api/feedback', 'GET', owner)).json();
    const readByPartner = await (await api('/api/feedback', 'GET', partner)).json();
    expect(readByOwner.entries).toEqual(readByPartner.entries);
    expect(readByOwner.canAcknowledge).toBe(true);
    expect(readByPartner.canAcknowledge).toBe(false);
    expect(readByOwner.siteUserId).toBe(owner);
    expect(readByPartner.siteUserId).toBe(partner);
    expect((await api(`/api/feedback/${id}/status`, 'PATCH', partner, { status: 'done' })).status).toBe(403);
    expect((await api(`/api/feedback/${id}/status`, 'PATCH', owner, { status: 'done' })).status).toBe(200);
    expect((await (await api('/api/feedback')).json()).entries[0].status).toBe('done');
    expect(sqlite.prepare('SELECT count(*) AS count FROM feedback_entries').get()).toMatchObject({ count: 1 });
  });

  it('validates every write and hides posts after seven days', async () => {
    expect((await api('/api/feedback', 'POST', partner, { id: 'bad', ...generic })).status).toBe(400);
    expect((await api('/api/feedback', 'POST', partner, { id, ...generic, body: ' ' })).status).toBe(400);
    expect((await api('/api/feedback', 'POST', partner, { id, ...generic, body: 'x'.repeat(4001) })).status).toBe(400);
    expect((await api('/api/feedback', 'POST', partner, { id, ...generic })).status).toBe(201);
    sqlite.prepare('UPDATE feedback_entries SET created_at = ?').run(new Date(Date.now() - 8 * 86400000).toISOString());
    expect((await (await api('/api/feedback')).json()).entries).toEqual([]);
    expect(sqlite.prepare('SELECT count(*) AS count FROM feedback_entries').get()).toMatchObject({ count: 1 });
  });

  it('accepts a full 4000-character Korean post and import', async () => {
    const body = '한'.repeat(4000);
    expect(new TextEncoder().encode(JSON.stringify({ id, ...generic, body })).length).toBeGreaterThan(8192);
    expect((await api('/api/feedback', 'POST', partner, { id, ...generic, body })).status).toBe(201);
    const originalTime = new Date(Date.now() - 60000).toISOString();
    expect((await api('/api/feedback/import', 'POST', owner, { legacySourceId: sourceId, ...generic, body, status: 'new', createdAt: originalTime })).status).toBe(200);
    expect(sqlite.prepare('SELECT body FROM feedback_entries WHERE legacy_source_id = ?').get(sourceId)).toMatchObject({ body });
    expect((await (await api('/api/feedback', 'GET', partner)).json()).entries).toHaveLength(2);
  });

  it('accepts the largest escaped JSON fields within the character limits and rejects oversized padding', async () => {
    const escaped = { legacySourceId: sourceId, category: 'other', title: '\u0002'.repeat(120), body: '\u0001'.repeat(4000), status: 'new', createdAt: new Date().toISOString() };
    const byteLength = new TextEncoder().encode(JSON.stringify(escaped)).length;
    expect(byteLength).toBeGreaterThan(24_000);
    expect(byteLength).toBeLessThan(32 * 1024);
    expect((await api('/api/feedback/import', 'POST', owner, escaped)).status).toBe(200);
    expect((await api('/api/feedback/import', 'POST', owner, { ...escaped, padding: 'x'.repeat(33_000) })).status).toBe(400);
  });

  it('imports only through the owner endpoint, preserves source time and unknown author, and skips duplicate source IDs', async () => {
    const createdAt = new Date(Date.now() - 60000).toISOString();
    const legacy = { legacySourceId: sourceId, ...generic, status: 'new', createdAt };
    expect((await api('/api/feedback/import', 'POST', partner, legacy)).status).toBe(403);
    expect(await (await api('/api/feedback/import', 'POST', owner, legacy)).json()).toMatchObject({ legacySourceId: sourceId, imported: true });
    const first = sqlite.prepare('SELECT * FROM feedback_entries').get() as Record<string, unknown>;
    expect(first).toMatchObject({ legacy_source_id: sourceId, author_site_user_id: null, created_at: createdAt, body: generic.body });
    expect(await (await api('/api/feedback/import', 'POST', owner, legacy)).json()).toMatchObject({ legacySourceId: sourceId, imported: false });
    expect((await api(`/api/feedback/${first.id}/status`, 'PATCH', owner, { status: 'done' })).status).toBe(200);
    expect(await (await api('/api/feedback/import', 'POST', owner, legacy)).json()).toMatchObject({ legacySourceId: sourceId, imported: false });
    expect((await api('/api/feedback/import', 'POST', owner, { ...legacy, body: 'Wrong copy' })).status).toBe(409);
    expect(sqlite.prepare('SELECT count(*) AS count FROM feedback_entries').get()).toMatchObject({ count: 1 });
    expect((await (await api('/api/feedback', 'GET', partner)).json()).entries[0].body).toBe(generic.body);
  });

  it('keeps imported originals in D1 after their seven-day display window', async () => {
    const legacy = { legacySourceId: sourceId, ...generic, status: 'new', createdAt: new Date(Date.now() - 8 * 86400000).toISOString() };
    expect(await (await api('/api/feedback/import', 'POST', owner, legacy)).json()).toMatchObject({ legacySourceId: sourceId, imported: true });
    expect((await (await api('/api/feedback', 'GET', partner)).json()).entries).toEqual([]);
    expect(sqlite.prepare('SELECT legacy_source_id, body FROM feedback_entries').get()).toMatchObject({ legacy_source_id: sourceId, body: generic.body });
    expect(await (await api('/api/feedback/import', 'POST', owner, legacy)).json()).toMatchObject({ legacySourceId: sourceId, imported: false });
  });
});

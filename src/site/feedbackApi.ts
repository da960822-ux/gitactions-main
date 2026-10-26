import type { FeedbackCategory, FeedbackEntry, FeedbackStatus } from '../core/feedback';

type Row = { id: string; category: FeedbackCategory; title: string; body: string; status: FeedbackStatus; created_at: string; author_site_user_id: string | null; legacy_source_id: string | null };
type Statement = { bind(...values: unknown[]): Statement; first<T>(): Promise<T | null>; all<T>(): Promise<{ results: T[] }>; run(): Promise<{ meta: { changes: number } }> };
export type FeedbackDb = { prepare(sql: string): Statement };
export type FeedbackEnv = { DB?: FeedbackDb; FEEDBACK_OWNER_USER_ID?: string; ASSETS?: { fetch(request: Request): Promise<Response> } };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const categories = ['message', 'game', 'feature', 'complaint', 'other'];
const statuses = ['new', 'read', 'planned', 'done'];
const sevenDays = 7 * 24 * 60 * 60 * 1000;
// JSON escapes can use six bytes per character before title and import metadata.
const maxJsonBytes = 32 * 1024;

function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
function entry(row: Row): FeedbackEntry {
  return { id: row.id, category: row.category, title: row.title, body: row.body, status: row.status, createdAt: row.created_at };
}
function input(body: unknown, preserve = false): { category: FeedbackCategory; title: string; body: string } | null {
  if (!body || typeof body !== 'object') return null;
  const value = body as Record<string, unknown>;
  if (typeof value.category !== 'string' || !categories.includes(value.category) || typeof value.title !== 'string' || typeof value.body !== 'string') return null;
  const title = value.title.trim();
  const text = value.body.trim();
  if (!title || title.length > 120 || !text || text.length > 4000) return null;
  return { category: value.category as FeedbackCategory, title: preserve ? value.title : title, body: preserve ? value.body : text };
}
async function parseBody(request: Request): Promise<Record<string, unknown> | null> {
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return null;
  if (Number(request.headers.get('Content-Length') || 0) > maxJsonBytes) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let text = '';
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxJsonBytes) { await reader.cancel(); return null; }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  try {
    const value: unknown = JSON.parse(text);
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch { return null; }
}
function sameOrigin(request: Request) {
  const origin = request.headers.get('Origin');
  const fetchSite = request.headers.get('Sec-Fetch-Site');
  return origin === new URL(request.url).origin && (!fetchSite || fetchSite === 'same-origin');
}

export async function handleFeedbackRequest(request: Request, env: FeedbackEnv): Promise<Response> {
  const url = new URL(request.url);
  const userId = request.headers.get('oai-authenticated-user-id');
  if (!userId) return json({ error: 'authentication_required' }, 401);
  if (!env.DB) return json({ error: 'database_unavailable' }, 503);
  const owner = Boolean(env.FEEDBACK_OWNER_USER_ID && userId === env.FEEDBACK_OWNER_USER_ID);
  if (request.method !== 'GET' && !sameOrigin(request)) return json({ error: 'same_origin_required' }, 403);
  if (request.method !== 'GET' && request.method !== 'POST' && request.method !== 'PATCH') return json({ error: 'method_not_allowed' }, 405);
  const db = env.DB;
  try {
    if (url.pathname === '/api/feedback' && request.method === 'GET') {
      const cutoff = new Date(Date.now() - sevenDays).toISOString();
      const rows = await db.prepare('SELECT * FROM feedback_entries WHERE created_at > ? ORDER BY created_at DESC, id DESC').bind(cutoff).all<Row>();
      return json({ entries: rows.results.map(entry), canAcknowledge: owner, siteUserId: userId });
    }
    if (url.pathname === '/api/feedback' && request.method === 'POST') {
      const body = await parseBody(request);
      const values = input(body);
      if (!values || typeof body?.id !== 'string' || !uuid.test(body.id)) return json({ error: 'feedback_invalid' }, 400);
      await db.prepare('INSERT INTO feedback_entries (id, category, title, body, status, created_at, author_site_user_id) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING')
        .bind(body.id, values.category, values.title, values.body, 'new', new Date().toISOString(), userId).run();
      const saved = await db.prepare('SELECT * FROM feedback_entries WHERE id = ?').bind(body.id).first<Row>();
      if (!saved || saved.author_site_user_id !== userId || saved.category !== values.category || saved.title !== values.title || saved.body !== values.body || saved.legacy_source_id) return json({ error: 'feedback_request_conflict' }, 409);
      return json(entry(saved), 201);
    }
    const statusMatch = /^\/api\/feedback\/([0-9a-f-]+)\/status$/i.exec(url.pathname);
    if (statusMatch && request.method === 'PATCH') {
      if (!owner) return json({ error: 'owner_required' }, 403);
      const body = await parseBody(request);
      if (!uuid.test(statusMatch[1]) || !body || typeof body.status !== 'string' || !statuses.includes(body.status)) return json({ error: 'feedback_invalid' }, 400);
      const changed = await db.prepare('UPDATE feedback_entries SET status = ? WHERE id = ? AND created_at > ?')
        .bind(body.status, statusMatch[1], new Date(Date.now() - sevenDays).toISOString()).run();
      return changed.meta.changes ? json({ ok: true }) : json({ error: 'feedback_not_found' }, 404);
    }
    if (url.pathname === '/api/feedback/import' && request.method === 'POST') {
      if (!owner) return json({ error: 'owner_required' }, 403);
      const body = await parseBody(request);
      const values = input(body, true);
      const sourceId = body?.legacySourceId;
      const createdAt = body?.createdAt;
      const status = body?.status;
      if (!values || typeof sourceId !== 'string' || !uuid.test(sourceId) || typeof createdAt !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(createdAt) || !Number.isFinite(Date.parse(createdAt)) || Date.parse(createdAt) > Date.now() || typeof status !== 'string' || !statuses.includes(status)) return json({ error: 'feedback_invalid' }, 400);
      const originalTime = new Date(createdAt).toISOString();
      await db.prepare('INSERT INTO feedback_entries (id, category, title, body, status, created_at, author_site_user_id, legacy_source_id) VALUES (?, ?, ?, ?, ?, ?, NULL, ?) ON CONFLICT(legacy_source_id) DO NOTHING')
        .bind(crypto.randomUUID(), values.category, values.title, values.body, status, originalTime, sourceId).run();
      const saved = await db.prepare('SELECT * FROM feedback_entries WHERE legacy_source_id = ?').bind(sourceId).first<Row>();
      if (!saved || saved.category !== values.category || saved.title !== values.title || saved.body !== values.body || saved.created_at !== originalTime || saved.author_site_user_id) return json({ error: 'feedback_import_conflict' }, 409);
      return json({ id: saved.id, legacySourceId: sourceId, imported: true });
    }
    return json({ error: 'not_found' }, 404);
  } catch {
    return json({ error: 'feedback_unavailable' }, 500);
  }
}

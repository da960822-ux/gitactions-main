import { createClient } from '@supabase/supabase-js';

export type FeedbackCategory = 'message' | 'game' | 'feature' | 'complaint' | 'other';
export type FeedbackStatus = 'new' | 'read' | 'planned' | 'done';
export type FeedbackInput = { category: FeedbackCategory; title: string; body: string };
export type FeedbackEntry = FeedbackInput & { id: string; status: FeedbackStatus; createdAt: string };

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const isFeedbackOnline = Boolean(url && anonKey);
const db = isFeedbackOnline ? createClient(url, anonKey) : null;
const selected = 'id,category,title,body,status,created_at';
const retentionMs = 7 * 24 * 60 * 60 * 1000;
const entriesKey = (spaceId: string) => `couple-feedback:${spaceId}`;
const spaceKey = (spaceId: string) => `couple-feedback-space:${spaceId}`;
type DemoSpace = { role: 'p1' | 'p2'; members: ('p1' | 'p2')[] };

function inputValues(input: FeedbackInput): FeedbackInput {
  const title = input.title.trim();
  const body = input.body.trim();
  if (!['message', 'game', 'feature', 'complaint', 'other'].includes(input.category) || !title || title.length > 120 || !body || body.length > 4000) throw new Error('feedback_invalid');
  return { category: input.category, title, body };
}

function fromRow(row: { id: string; category: FeedbackCategory; title: string; body: string; status: FeedbackStatus; created_at: string }): FeedbackEntry {
  return { id: row.id, category: row.category, title: row.title, body: row.body, status: row.status, createdAt: row.created_at };
}

function parseLocal<T>(key: string, valid: (value: unknown) => value is T): T {
  let value: unknown;
  try { value = JSON.parse(localStorage.getItem(key) ?? 'null'); }
  catch { throw new Error('feedback_storage_invalid'); }
  if (!valid(value)) throw new Error('feedback_storage_invalid');
  return value;
}

function readSpace(spaceId: string): DemoSpace {
  return parseLocal(spaceKey(spaceId), (value): value is DemoSpace => Boolean(value && typeof value === 'object' && ['p1', 'p2'].includes((value as DemoSpace).role) && Array.isArray((value as DemoSpace).members) && (value as DemoSpace).members.every(seat => seat === 'p1' || seat === 'p2')));
}

function readEntries(spaceId: string): FeedbackEntry[] {
  return parseLocal(entriesKey(spaceId), (value): value is FeedbackEntry[] => Array.isArray(value) && !value.some(entry => !entry || typeof entry.id !== 'string' || !['message', 'game', 'feature', 'complaint', 'other'].includes(entry.category) || typeof entry.title !== 'string' || typeof entry.body !== 'string' || !['new', 'read', 'planned', 'done'].includes(entry.status) || !Number.isFinite(Date.parse(entry.createdAt))));
}

function writeEntries(spaceId: string, entries: FeedbackEntry[]) {
  localStorage.setItem(entriesKey(spaceId), JSON.stringify(entries));
}

async function session(): Promise<string> {
  if (!db) throw new Error('feedback_not_online');
  let { data, error } = await db.auth.getSession();
  if (error) throw error;
  if (!data.session) {
    const { error: signInError } = await db.auth.signInAnonymously();
    if (signInError) throw signInError;
    ({ data, error } = await db.auth.getSession());
  }
  if (error) throw error;
  if (!data.session) throw new Error('feedback_auth_required');
  return data.session.user.id;
}

export const feedback = {
  async createSpace(): Promise<string> {
    if (!db) {
      const id = crypto.randomUUID();
      localStorage.setItem(spaceKey(id), JSON.stringify({ role: 'p1', members: ['p1'] } satisfies DemoSpace));
      writeEntries(id, []);
      return id;
    }
    await session();
    const { data, error } = await db.rpc('create_feedback_space');
    if (error) throw error;
    return data as string;
  },

  async joinSpace(spaceId: string): Promise<'p1' | 'p2'> {
    if (!spaceId) throw new Error('feedback_space_required');
    if (!db) {
      let space: DemoSpace;
      try { space = readSpace(spaceId); } catch { throw new Error('feedback_demo_same_browser_only'); }
      const seat = space.members.includes('p1') ? 'p2' : 'p1';
      if (!space.members.includes(seat)) space.members.push(seat);
      space.role = seat;
      localStorage.setItem(spaceKey(spaceId), JSON.stringify(space));
      return seat;
    }
    await session();
    const { data, error } = await db.rpc('join_feedback_space', { p_space: spaceId });
    if (error) throw error;
    if (data !== 'p1' && data !== 'p2') throw new Error('feedback_role_invalid');
    return data;
  },

  async getRole(spaceId: string): Promise<'p1' | 'p2' | null> {
    if (!spaceId) return null;
    if (!db) {
      try { return readSpace(spaceId).role; } catch { return null; }
    }
    const userId = await session();
    const { data, error } = await db.from('feedback_space_members').select('seat').eq('space_id', spaceId).eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data?.seat === 'p1' || data?.seat === 'p2' ? data.seat : null;
  },

  async list(spaceId: string): Promise<FeedbackEntry[]> {
    if (!spaceId) throw new Error('feedback_space_required');
    if (!db) {
      const entries = readEntries(spaceId);
      const retained = entries.filter(entry => Date.now() - Date.parse(entry.createdAt) < retentionMs);
      if (retained.length !== entries.length) writeEntries(spaceId, retained);
      return retained;
    }
    await session();
    const { data, error } = await db.from('feedback_entries').select(selected).eq('space_id', spaceId).gt('created_at', new Date(Date.now() - retentionMs).toISOString()).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(row => fromRow(row as unknown as Parameters<typeof fromRow>[0]));
  },

  async create(spaceId: string, input: FeedbackInput, requestId: string = crypto.randomUUID()): Promise<FeedbackEntry> {
    if (!spaceId) throw new Error('feedback_space_required');
    const values = inputValues(input);
    if (!db) {
      readSpace(spaceId);
      const entries = await this.list(spaceId);
      const prior = entries.find(entry => entry.id === requestId);
      if (prior) {
        if (prior.category !== values.category || prior.title !== values.title || prior.body !== values.body) throw new Error('feedback_request_conflict');
        return prior;
      }
      const entry: FeedbackEntry = { ...values, id: requestId, status: 'new', createdAt: new Date().toISOString() };
      writeEntries(spaceId, [entry, ...entries]);
      return entry;
    }
    await session();
    const { data, error } = await db.rpc('submit_feedback', { p_space: spaceId, p_request: requestId, p_category: values.category, p_title: values.title, p_body: values.body });
    if (error) throw error;
    return fromRow(data as unknown as Parameters<typeof fromRow>[0]);
  },

  async updateStatus(spaceId: string, id: string, status: FeedbackStatus): Promise<void> {
    if (!spaceId || !id) throw new Error('feedback_entry_required');
    if (!['new', 'read', 'planned', 'done'].includes(status)) throw new Error('feedback_status_invalid');
    if (!db) {
      const entries = await this.list(spaceId);
      const index = entries.findIndex(entry => entry.id === id);
      if (index < 0) throw new Error('feedback_not_found');
      entries[index] = { ...entries[index], status };
      writeEntries(spaceId, entries);
      return;
    }
    await session();
    const { data, error } = await db.from('feedback_entries').update({ status }).eq('space_id', spaceId).eq('id', id).select('id').maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('feedback_update_denied');
  },
};

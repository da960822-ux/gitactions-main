import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const p1 = '00000000-0000-4000-8000-000000000001';
const p2 = '00000000-0000-4000-8000-000000000002';
const outsider = '00000000-0000-4000-8000-000000000003';
let db: PGlite;
let requestIndex = 100;
const uuid = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

async function user(id: string, role = 'authenticated') {
  await db.exec(`reset role; reset request.jwt.claim.sub; set role ${role}; set request.jwt.claim.sub='${id}';`);
}
async function service() { await db.exec('reset role; reset request.jwt.claim.sub; set role service_role;'); }
async function joinedSession() {
  await user(p1);
  const session = (await db.query<{ id: string }>('select public.create_event_session() as id')).rows[0].id;
  await user(p2);
  await db.query('select public.join_event_session($1)', [session]);
  await service();
  return session;
}
async function read(session: string, actor: string) {
  return (await db.query<{ snapshot: Record<string, unknown> }>('select public.read_event_session_for_action($1,$2) as snapshot', [session, actor])).rows[0].snapshot;
}
async function commit(session: string, actor: string, revision: number, request: string, signature: unknown, next: unknown) {
  return db.query<{ snapshot: Record<string, unknown> }>(
    'select public.commit_event_session_action($1,$2,$3,$4,$5::jsonb,$6::jsonb) as snapshot',
    [session, actor, revision, request, JSON.stringify(signature), JSON.stringify(next)],
  );
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    insert into auth.users values ('${p1}'),('${p2}'),('${outsider}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  `);
  for (const file of ['202610180006_shared_event_sessions.sql', '202610180007_shared_event_round_commit.sql']) {
    const migration = readFileSync(`supabase/migrations/${file}`, 'utf8')
      .replace('create extension if not exists pgcrypto;', '')
      .replace(/select cron\.schedule\([\s\S]*$/, '');
    await db.exec(migration);
  }
});
beforeEach(async () => {
  await db.exec('reset role; reset request.jwt.claim.sub; truncate public.event_sessions cascade;');
  requestIndex = 100;
});
afterAll(async () => db.close());

describe('service-role shared event state commit RPCs', () => {
  it('returns only a live member snapshot with the seat derived from membership', async () => {
    const session = await joinedSession();
    expect(await read(session, p1)).toMatchObject({ sessionId: session, seat: 'p1', revision: 0, eventState: null });
    expect(await read(session, p2)).toMatchObject({ sessionId: session, seat: 'p2', revision: 0, eventState: null });
    await expect(read(session, outsider)).rejects.toThrow(/event_session_unavailable/);
  });

  it('commits one revision atomically, replays identical requests, and rejects reuse conflicts', async () => {
    const session = await joinedSession();
    const request = uuid(requestIndex++), signature = { type: 'propose', eventId: 'R01', intent: null };
    const first = (await commit(session, p1, 0, request, signature, { revision: 1, status: 'proposed' })).rows[0].snapshot;
    expect(first).toMatchObject({ revision: 1, eventState: { revision: 1, status: 'proposed' }, replayed: false });
    expect((await commit(session, p1, 0, request, signature, { revision: 1, status: 'proposed' })).rows[0].snapshot).toMatchObject({ revision: 1, replayed: true });
    await expect(commit(session, p1, 0, request, { ...signature, eventId: 'R02' }, { revision: 1 })).rejects.toThrow(/event_request_conflict/);
    await expect(commit(session, p2, 0, request, signature, { revision: 1 })).rejects.toThrow(/event_request_conflict/);
    expect(await read(session, p1)).toMatchObject({ revision: 1, eventState: { revision: 1, status: 'proposed' } });
  });

  it('rejects stale or mismatched next revisions without changing state', async () => {
    const session = await joinedSession();
    const firstRequest = uuid(requestIndex++);
    await commit(session, p1, 0, firstRequest, { op: 1 }, { revision: 1, value: 'committed' });
    await expect(commit(session, p2, 0, uuid(requestIndex++), { op: 2 }, { revision: 1, value: 'stale' })).rejects.toThrow(/stale_event_state/);
    await expect(commit(session, p2, 1, uuid(requestIndex++), { op: 3 }, { revision: 3, value: 'wrong revision' })).rejects.toThrow(/event_revision_invalid/);
    expect(await read(session, p2)).toMatchObject({ revision: 1, eventState: { revision: 1, value: 'committed' } });
  });

  it('keeps both RPCs inaccessible to browser roles even for a valid member', async () => {
    const session = await joinedSession();
    await user(p1);
    await expect(db.query('select public.read_event_session_for_action($1,$2)', [session, p1])).rejects.toThrow(/permission denied/);
    await expect(commit(session, p1, 0, uuid(requestIndex++), { op: 1 }, { revision: 1 })).rejects.toThrow(/permission denied/);
    await user(p1, 'anon');
    await expect(db.query('select public.read_event_session_for_action($1,$2)', [session, p1])).rejects.toThrow(/permission denied/);
    await expect(db.query('select public.commit_event_session_action($1,$2,0,$3,$4::jsonb,$5::jsonb)', [session, p1, uuid(requestIndex++), '{}', '{"revision":1}'])).rejects.toThrow(/permission denied/);
  });

  it('rejects expired sessions before read or commit', async () => {
    const session = await joinedSession();
    await db.query("update public.event_sessions set expires_at=now()-interval '1 second' where id=$1", [session]);
    await expect(read(session, p1)).rejects.toThrow(/event_session_unavailable/);
    await expect(commit(session, p1, 0, uuid(requestIndex++), { op: 1 }, { revision: 1 })).rejects.toThrow(/event_session_expired/);
    expect((await db.query<{ revision: number }>('select revision from public.event_sessions where id=$1', [session])).rows[0].revision).toBe(0);
  });

  it('bounds action signatures and resulting JSON state', async () => {
    const session = await joinedSession();
    await expect(commit(session, p1, 0, uuid(requestIndex++), { text: 'x'.repeat(17_000) }, { revision: 1 })).rejects.toThrow(/event_signature_invalid/);
    await expect(commit(session, p1, 0, uuid(requestIndex++), { op: 1 }, { revision: 1, text: 'x'.repeat(66_000) })).rejects.toThrow(/event_state_invalid/);
    expect(await read(session, p1)).toMatchObject({ revision: 0, eventState: null });
  });

  it('stops at 128 durable receipts without dropping prior idempotency records', async () => {
    const session = await joinedSession();
    for (let revision = 0; revision < 128; revision++) {
      await commit(session, p1, revision, uuid(requestIndex++), { op: revision }, { revision: revision + 1 });
    }
    await expect(commit(session, p2, 128, uuid(requestIndex++), { op: 128 }, { revision: 129 })).rejects.toThrow(/event_receipt_limit/);
    expect(await read(session, p2)).toMatchObject({ revision: 128, eventState: { revision: 128 } });
    expect((await db.query<{ count: number }>('select count(*)::int as count from public.event_session_receipts where session_id=$1', [session])).rows[0].count).toBe(128);
  });
});

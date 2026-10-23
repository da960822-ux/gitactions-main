import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const p1 = '00000000-0000-4000-8000-000000000001';
const p2 = '00000000-0000-4000-8000-000000000002';
const p3 = '00000000-0000-4000-8000-000000000003';
const p4 = '00000000-0000-4000-8000-000000000004';
let db: PGlite;

async function user(id: string, role = 'authenticated') {
  await db.exec(`reset role; reset request.jwt.claim.sub; set role ${role}; set request.jwt.claim.sub='${id}';`);
}
async function createSession() {
  return (await db.query<{ id: string }>('select public.create_event_session() as id')).rows[0].id;
}
async function joinSession(session: string) {
  return (await db.query<{ seat: string }>('select public.join_event_session($1) as seat', [session])).rows[0].seat;
}
async function service() { await db.exec('reset role; reset request.jwt.claim.sub; set role service_role;'); }

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    insert into auth.users values ('${p1}'),('${p2}'),('${p3}'),('${p4}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  `);
  const migration = readFileSync('supabase/migrations/202610180006_shared_event_sessions.sql', 'utf8')
    .replace('create extension if not exists pgcrypto;', '')
    .replace(/select cron\.schedule\([\s\S]*$/, '');
  await db.exec(migration);
});
beforeEach(async () => {
  await db.exec('reset role; reset request.jwt.claim.sub; truncate public.event_sessions cascade;');
  await user(p1);
});
afterAll(async () => db.close());

describe('isolated shared event session schema', () => {
  it('creates an expiring member-only snapshot with no game or chat state', async () => {
    const session = await createSession();
    const snapshot = (await db.query<{ snapshot: Record<string, unknown> }>('select public.event_session_snapshot($1) as snapshot', [session])).rows[0].snapshot;
    expect(snapshot).toMatchObject({ sessionId: session, seat: 'p1', revision: 0, eventState: null });
    expect(Date.parse(String(snapshot.expiresAt)) - Date.now()).toBeGreaterThan(3_590_000);
    expect(snapshot).not.toHaveProperty('view');
    expect(snapshot).not.toHaveProperty('messages');
    expect(snapshot).not.toHaveProperty('gameState');
  });

  it('assigns one second identity, keeps repeat join idempotent, and closes the invite', async () => {
    const session = await createSession();
    expect(await joinSession(session)).toBe('p1');
    await user(p2);
    expect(await joinSession(session)).toBe('p2');
    expect(await joinSession(session)).toBe('p2');
    await user(p1);
    expect(await joinSession(session)).toBe('p1');
    await user(p3);
    await expect(joinSession(session)).rejects.toThrow(/event_invite_closed/);
    await service();
    expect((await db.query('select seat from public.event_session_members where session_id=$1 order by seat', [session])).rows).toEqual([{ seat: 'p1' }, { seat: 'p2' }]);
  });

  it('hides sessions from nonmembers and rejects anonymous or direct table access', async () => {
    const session = await createSession();
    await user(p2);
    expect((await db.query('select id from public.event_sessions')).rows).toHaveLength(0);
    expect((await db.query('select session_id from public.event_session_members')).rows).toHaveLength(0);
    await expect(db.query('select public.event_session_snapshot($1)', [session])).rejects.toThrow(/event_session_unavailable/);
    await expect(db.query('update public.event_sessions set revision=9 where id=$1', [session])).rejects.toThrow(/permission denied/);
    await expect(db.query("insert into public.event_session_members(session_id,user_id,seat) values($1,auth.uid(),'p2')", [session])).rejects.toThrow(/permission denied/);
    await expect(db.query('select * from public.event_session_receipts')).rejects.toThrow(/permission denied/);
    await user(p3, 'anon');
    await expect(db.query('select public.create_event_session()')).rejects.toThrow(/permission denied/);
    await expect(db.query('select public.join_event_session($1)', [session])).rejects.toThrow(/permission denied/);
    await expect(db.query('select * from public.event_sessions')).rejects.toThrow(/permission denied/);
  });

  it('does not let one identity occupy both seats and rejects simultaneous third-member attempts', async () => {
    const session = await createSession();
    expect(await joinSession(session)).toBe('p1');
    await user(p2);
    expect(await joinSession(session)).toBe('p2');
    await user(p3);
    const attempts = await Promise.allSettled([joinSession(session), joinSession(session)]);
    expect(attempts.every(result => result.status === 'rejected')).toBe(true);
    await service();
    expect((await db.query<{ count: number }>('select count(*)::int as count from public.event_session_members where session_id=$1', [session])).rows[0].count).toBe(2);
    await user(p4);
    await expect(joinSession(session)).rejects.toThrow(/event_invite_closed/);
  });

  it('expires access at one hour even before cleanup removes the rows', async () => {
    const session = await createSession();
    await db.exec('reset role; reset request.jwt.claim.sub;');
    await db.query("update public.event_sessions set expires_at=now()-interval '1 second' where id=$1", [session]);
    await user(p1);
    expect((await db.query('select id from public.event_sessions')).rows).toHaveLength(0);
    await expect(db.query('select public.event_session_snapshot($1)', [session])).rejects.toThrow(/event_session_unavailable/);
    await user(p2);
    await expect(joinSession(session)).rejects.toThrow(/event_session_expired/);
  });

  it('limits each identity to three live sessions it created and ignores expired sessions', async () => {
    await createSession(); await createSession(); await createSession();
    await expect(createSession()).rejects.toThrow(/event_session_limit/);
    await service();
    await db.query("update public.event_sessions set expires_at=now()-interval '1 second' where id=(select id from public.event_sessions limit 1)");
    await user(p1);
    expect(await createSession()).toBeTruthy();
  });
});

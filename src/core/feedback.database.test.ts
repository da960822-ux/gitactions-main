import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const p1 = '00000000-0000-4000-8000-000000000001';
const p2 = '00000000-0000-4000-8000-000000000002';
const outsider = '00000000-0000-4000-8000-000000000003';
const request = '10000000-0000-4000-8000-000000000001';
let db: PGlite;
let space: string;
async function user(id: string, role = 'authenticated') {
  await db.exec(`reset role; reset request.jwt.claim.sub; set role ${role}; set request.jwt.claim.sub='${id}';`);
}
async function submit(id = request, category = 'complaint', body = 'The button is slow', target = space) {
  return db.query<{ entry: { id: string; status: string } }>('select to_jsonb(public.submit_feedback($1,$2,$3,$4,$5)) as entry', [target, id, category, 'Note', body]);
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    insert into auth.users values ('${p1}'),('${p2}'),('${outsider}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create publication supabase_realtime;
  `);
  for (const file of ['202610100001_rooms.sql', '202610100002_feedback.sql', '202610100003_feedback_spaces.sql', '202610100004_catchmind_translation.sql', '202610110005_feedback_submission.sql']) {
    const sql = readFileSync(`supabase/migrations/${file}`, 'utf8')
      .replace('create extension if not exists pgcrypto;', '')
      .replace(/create extension if not exists pg_cron;[\s\S]*$/, '')
      .replace(/select cron\.schedule\('feedback-seven-day-cleanup'[\s\S]*$/, '');
    await db.exec(sql);
  }
});
beforeEach(async () => {
  await db.exec('reset role; reset request.jwt.claim.sub; truncate feedback_spaces cascade;');
  await user(p1);
  space = (await db.query<{ id: string }>('select public.create_feedback_space() as id')).rows[0].id;
  await user(p2);
  await db.query('select public.join_feedback_space($1)', [space]);
});
afterAll(async () => db.close());

describe('suggestions migration with real SQL roles and RLS', () => {
  it('rejects missing, malformed, closed, and full invite spaces without changing membership', async () => {
    await user(outsider);
    await expect(db.query('select public.join_feedback_space($1)', ['99999999-9999-4999-8999-999999999999'])).rejects.toThrow(/feedback_space_not_found/);
    await expect(db.query('select public.join_feedback_space($1)', ['not-a-uuid'])).rejects.toThrow(/invalid input syntax for type uuid/);
    await db.exec('reset role; reset request.jwt.claim.sub;');
    await db.query('update public.feedback_spaces set invite_open=true where id=$1', [space]);
    await user(outsider);
    await expect(db.query('select public.join_feedback_space($1)', [space])).rejects.toThrow(/feedback_space_full/);
    await user(p1);
    const closed = (await db.query<{ id: string }>('select public.create_feedback_space() as id')).rows[0].id;
    await db.exec('reset role; reset request.jwt.claim.sub;');
    await db.query('update public.feedback_spaces set invite_open=false where id=$1', [closed]);
    await user(outsider);
    await expect(db.query('select public.join_feedback_space($1)', [closed])).rejects.toThrow(/feedback_invite_closed/);
    await db.exec('reset role; reset request.jwt.claim.sub;');
    expect((await db.query('select space_id,user_id from public.feedback_space_members')).rows).toHaveLength(3);
  });

  it('admits exactly two identities and prevents outsiders and unauthenticated callers reading or writing', async () => {
    await submit();
    await user(outsider);
    await expect(db.query('select public.join_feedback_space($1)', [space])).rejects.toThrow(/feedback_invite_closed/);
    for (const table of ['feedback_spaces', 'feedback_space_members', 'feedback_entries']) {
      expect((await db.query(`select * from public.${table}`)).rows).toHaveLength(0);
    }
    await expect(submit()).rejects.toThrow(/feedback_create_denied/);
    await user(p2, 'anon');
    await expect(submit()).rejects.toThrow(/permission denied/);
    await expect(db.query('select * from feedback_entries')).rejects.toThrow(/permission denied/);
    await user('');
    await expect(submit()).rejects.toThrow(/authentication_required/);
  });

  it('keeps p2 creation and p1 status-only updates; direct inserts and metadata tampering are denied', async () => {
    const entry = (await submit()).rows[0].entry;
    expect(entry.status).toBe('new');
    expect((await db.query("update feedback_entries set status='done' where id=$1", [request])).rowCount).toBe(0);
    await expect(db.query("insert into feedback_entries(space_id,category,title,body) values($1,'game','x','x')", [space])).rejects.toThrow(/permission denied/);
    await user(p1);
    await expect(submit()).rejects.toThrow(/feedback_create_denied/);
    for (const status of ['planned', 'done', 'new']) {
      expect((await db.query('update feedback_entries set status=$1 where id=$2', [status, request])).rowCount).toBe(1);
    }
    await expect(db.query("update feedback_entries set body='tampered' where id=$1", [request])).rejects.toThrow(/permission denied/);
    await expect(db.query("update feedback_entries set status='invalid' where id=$1", [request])).rejects.toThrow(/check constraint/);
    await expect(db.query('delete from feedback_entries where id=$1', [request])).rejects.toThrow(/permission denied/);
  });

  it('returns the same persisted row after retry and rejects request-ID reuse for a different space or body', async () => {
    const first = (await submit()).rows[0].entry;
    await user(p1);
    await db.query("update feedback_entries set status='planned' where id=$1", [request]);
    await user(p2);
    expect((await submit()).rows[0].entry).toEqual({ ...first, status: 'planned' });
    expect((await db.query('select id from feedback_entries')).rows).toHaveLength(1);
    await expect(submit(request, 'complaint', 'Changed')).rejects.toThrow(/feedback_request_conflict/);
    await user(outsider);
    const other = (await db.query<{ id: string }>('select public.create_feedback_space() as id')).rows[0].id;
    await user(p2);
    await db.query('select public.join_feedback_space($1)', [other]);
    await expect(submit(request, 'complaint', 'The button is slow', other)).rejects.toThrow(/feedback_request_conflict/);
    expect((await db.query('select id from feedback_entries where space_id=$1', [other])).rows).toHaveLength(0);
  });

  it('validates category/content at the database boundary and preserves seven-day visibility', async () => {
    await expect(submit(request, 'invalid')).rejects.toThrow(/feedback_invalid/);
    await expect(submit(request, 'other', ' ')).rejects.toThrow(/feedback_invalid/);
    await expect(submit(request, 'game', 'x'.repeat(4001))).rejects.toThrow(/feedback_invalid/);
    await submit();
    await user(p1);
    expect((await db.query('select id from feedback_entries')).rows).toHaveLength(1);
    await db.exec('reset role; reset request.jwt.claim.sub;');
    await db.query("update feedback_entries set created_at=now()-interval '7 days 1 second' where id=$1", [request]);
    await user(p2);
    expect((await db.query('select id from feedback_entries')).rows).toHaveLength(0);
    await expect(submit()).rejects.toThrow(/feedback_request_conflict/);
  });
});

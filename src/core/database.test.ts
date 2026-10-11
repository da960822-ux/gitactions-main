import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

const alice = '00000000-0000-4000-8000-000000000001';
const bob = '00000000-0000-4000-8000-000000000002';
const eve = '00000000-0000-4000-8000-000000000003';
const migrationPath = resolve(process.cwd(), 'supabase/migrations/202610100001_rooms.sql');
const migration = readFileSync(migrationPath, 'utf8')
  // PGlite has gen_random_uuid built in but does not implement these server extensions.
  .replace('create extension if not exists pgcrypto;', '')
  .replace(/create extension if not exists pg_cron;\s*select cron\.schedule\([\s\S]*?\);\s*$/, '');
const feedbackMigration = readFileSync(resolve(process.cwd(), 'supabase/migrations/202610100002_feedback.sql'), 'utf8');
const feedbackSpacesMigration = readFileSync(resolve(process.cwd(), 'supabase/migrations/202610100003_feedback_spaces.sql'), 'utf8')
  .replace(/select cron\.schedule\('feedback-seven-day-cleanup'[\s\S]*?\);\s*$/, '');
const catchmindTranslationMigration = readFileSync(resolve(process.cwd(), 'supabase/migrations/202610100004_catchmind_translation.sql'), 'utf8');

let db: PGlite;

async function asUser(userId: string, role = 'authenticated', target = db) {
  await target.exec(`reset role; reset request.jwt.claim.sub; set role ${role}; set request.jwt.claim.sub = '${userId}';`);
}

async function roomFor(userId = alice) {
  await asUser(userId);
  return (await db.query<{ id: string }>("select public.create_room('A', 'ko') as id")).rows[0].id;
}

async function feedbackSpaceFor(userId = alice) {
  await asUser(userId);
  return (await db.query<{ id: string }>('select public.create_feedback_space() as id')).rows[0].id;
}

async function service() {
  await db.exec('reset role; reset request.jwt.claim.sub; set role service_role;');
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    insert into auth.users values ('${alice}'), ('${bob}'), ('${eve}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    create publication supabase_realtime;
  `);
  await db.exec(migration);
  await db.exec(feedbackMigration);
  await db.exec(feedbackSpacesMigration);
  await db.exec(catchmindTranslationMigration);
});

beforeEach(async () => {
  await db.exec('reset role; reset request.jwt.claim.sub; truncate public.feedback_entries; truncate public.feedback_spaces cascade; truncate public.rooms cascade; truncate public.translation_usage;');
});

afterAll(async () => db.close());

describe('room database security and concurrency', () => {
  it('creates private rooms, admits one second player, and hides them from outsiders', async () => {
    const room = await roomFor();
    await asUser(alice);
    expect((await db.query('select id from rooms')).rows).toHaveLength(1);
    expect((await db.query('select room_id from room_views')).rows).toHaveLength(1);

    await asUser(bob);
    await db.query("select public.join_room($1, 'B', 'es')", [room]);
    await asUser(eve);
    await expect(db.query("select public.join_room($1, 'C', 'ko')", [room])).rejects.toThrow(/room_full/);
    expect((await db.query('select id from rooms')).rows).toHaveLength(0);
    expect((await db.query('select room_id from room_members')).rows).toHaveLength(0);
    expect((await db.query('select room_id from room_views')).rows).toHaveLength(0);
    expect((await db.query('select id from chat_messages')).rows).toHaveLength(0);
    await expect(db.query('select * from room_states')).rejects.toThrow(/permission denied/);
  });

  it('allows each player to read only their own view and blocks direct writes', async () => {
    const room = await roomFor();
    await asUser(bob);
    await db.query("select public.join_room($1, 'B', 'es')", [room]);
    await service();
    await db.query(`select public.commit_action($1,$2,0,$3,'{"secret":"state"}'::jsonb,'{"p1":{"private":1},"p2":{"private":2}}'::jsonb,'test',null,null)`, [room, alice, '10000000-0000-4000-8000-000000000001']);
    await service();
    expect((await db.query('select user_id,view from room_views order by user_id')).rows).toEqual([{ user_id: alice, view: { private: 1 } }, { user_id: bob, view: { private: 2 } }]);
    await asUser(alice);
    expect((await db.query<{ view: unknown }>('select view from room_views')).rows[0].view).toEqual({ private: 1 });
    await asUser(bob);
    expect((await db.query<{ view: unknown }>('select view from room_views')).rows[0].view).toEqual({ private: 2 });
    await expect(db.query("insert into room_views values(gen_random_uuid(),auth.uid(),0,null)")).rejects.toThrow(/permission denied/);
  });


  it('returns only the caller’s room view and no snapshot to an outsider', async () => {
    const room = await roomFor();
    await asUser(bob);
    await db.query("select public.join_room($1, 'B', 'es')", [room]);
    await service();
    await db.query(`select public.commit_action($1,$2,0,$3,'{"privateState":true}'::jsonb,'{"p1":{"private":1},"p2":{"private":2}}'::jsonb,'test',null,null)`, [room, alice, '10000000-0000-4000-8000-000000000004']);

    await asUser(alice);
    const aliceSnapshot = await db.query<{ snapshot: { seat: string; view: unknown; room: Record<string, unknown> } }>('select public.room_snapshot($1) as snapshot', [room]);
    expect(aliceSnapshot.rows[0].snapshot.seat).toBe('p1');
    expect(aliceSnapshot.rows[0].snapshot.view).toEqual({ private: 1 });
    expect(aliceSnapshot.rows[0].snapshot.room).not.toHaveProperty('pending_by');
    await asUser(bob);
    const bobSnapshot = await db.query<{ snapshot: { seat: string; view: unknown } }>('select public.room_snapshot($1) as snapshot', [room]);
    expect(bobSnapshot.rows[0].snapshot.seat).toBe('p2');
    expect(bobSnapshot.rows[0].snapshot.view).toEqual({ private: 2 });
    await asUser(eve);
    expect((await db.query<{ snapshot: unknown }>('select public.room_snapshot($1) as snapshot', [room])).rows[0].snapshot).toBeNull();
  });

  it('keeps pair-inbox entries when an unrelated game room closes', async () => {
    const room = await roomFor();
    await asUser(bob);
    await db.query("select public.join_room($1, 'B', 'es')", [room]);
    const space = await feedbackSpaceFor(alice);
    await asUser(bob);
    await db.query('select public.join_feedback_space($1)', [space]);
    await db.query("insert into feedback_entries(space_id,category,title,body) values ($1,'message','Note','Keep this')", [space]);
    await service();
    await db.query("insert into chat_messages(id,room_id,seat,text,status) values ('40000000-0000-4000-8000-000000000001',$1,'p1','hi','original')", [room]);
    await db.query("insert into action_receipts values ($1,'40000000-0000-4000-8000-000000000002',$2,1)", [room, alice]);

    await asUser(eve);
    await expect(db.query('select public.close_room($1)', [room])).rejects.toThrow(/not_room_member/);
    await service();
    expect((await db.query('select id from rooms')).rows).toEqual([{ id: room }]);
    await asUser(bob);
    await db.query('select public.close_room($1)', [room]);
    await service();
    for (const table of ['rooms', 'room_members', 'room_states', 'room_views', 'chat_messages', 'action_receipts']) {
      expect((await db.query(`select * from public.${table}`)).rows).toHaveLength(0);
    }
    await asUser(alice);
    expect((await db.query('select id from feedback_entries where space_id=$1', [space])).rows).toHaveLength(1);
  });

  it('shares feedback only with pair-space members; p2 writes and only p1 changes status', async () => {
    const space = await feedbackSpaceFor();
    await asUser(bob);
    await db.query('select public.join_feedback_space($1)', [space]);
    await asUser(alice);
    expect((await db.query('select id from feedback_entries where space_id=$1', [space])).rows).toHaveLength(0);
    await expect(db.query("insert into feedback_entries(space_id,category,title,body) values ($1,'message','Note','Hi')", [space])).rejects.toThrow(/row-level security/);

    await asUser(bob);
    const created = await db.query<{ id: string }>("insert into feedback_entries(space_id,category,title,body) values ($1,'game','Jaipur','Let us play again') returning id", [space]);
    const entryId = created.rows[0].id;
    expect((await db.query("update feedback_entries set status='done' where id=$1", [entryId])).rowCount).toBe(0);
    expect((await db.query<{ status: string }>('select status from feedback_entries where id=$1', [entryId])).rows[0].status).toBe('new');

    await asUser(alice);
    await db.query("update feedback_entries set status='planned' where id=$1 and space_id=$2", [entryId, space]);
    expect((await db.query<{ status: string }>('select status from feedback_entries where id=$1', [entryId])).rows[0].status).toBe('planned');
    await expect(db.query("update feedback_entries set title='tampered' where id=$1", [entryId])).rejects.toThrow(/permission denied/);

    await asUser(eve);
    expect((await db.query('select id from feedback_entries')).rows).toHaveLength(0);
    await expect(db.query("insert into feedback_entries(space_id,category,title,body) values ($1,'feature','Other','No')", [space])).rejects.toThrow(/row-level security/);
  });

  it('validates feedback and expires each post seven days after creation', async () => {
    const space = await feedbackSpaceFor();
    await asUser(bob);
    await db.query('select public.join_feedback_space($1)', [space]);
    await expect(db.query("insert into feedback_entries(space_id,category,title,body) values ($1,'other','Title','Body')", [space])).rejects.toThrow(/feedback_entries_category_check/);
    await db.query("insert into feedback_entries(space_id,category,title,body) values ($1,'feature','A useful idea','A brief note')", [space]);
    await service();
    await db.query("update feedback_entries set created_at=now()-interval '7 days 1 second' where space_id=$1", [space]);
    await asUser(alice);
    expect((await db.query('select id from feedback_entries where space_id=$1', [space])).rows).toHaveLength(0);
    await service();
    await db.query("delete from feedback_entries where created_at<=now()-interval '7 days'");
    expect((await db.query('select id from feedback_entries where space_id=$1', [space])).rows).toHaveLength(0);
    expect((await db.query('select id from feedback_spaces where id=$1', [space])).rows).toHaveLength(1);
  });

  it('migrates legacy room-linked posts into the same private pair space without retaining a room dependency', async () => {
    const legacy = new PGlite();
    try {
      await legacy.exec(`
        create role anon;
        create role authenticated;
        create role service_role bypassrls;
        create schema auth;
        create table auth.users (id uuid primary key);
        insert into auth.users values ('${alice}'), ('${bob}'), ('${eve}');
        create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
        create publication supabase_realtime;
      `);
      await legacy.exec(migration);
      await legacy.exec(feedbackMigration);
      await asUser(alice, 'authenticated', legacy);
      const room = (await legacy.query<{ id: string }>("select public.create_room('A','ko') as id")).rows[0].id;
      await asUser(bob, 'authenticated', legacy);
      await legacy.query("select public.join_room($1,'B','es')", [room]);
      await legacy.query("insert into feedback_entries(room_id,category,title,body) values ($1,'message','Old note','Keep it')", [room]);

      await legacy.exec('reset role; reset request.jwt.claim.sub;');
      await legacy.exec(feedbackSpacesMigration);
      const columns = await legacy.query<{ column_name: string }>("select column_name from information_schema.columns where table_schema='public' and table_name='feedback_entries'");
      expect(columns.rows.map(row => row.column_name)).not.toContain('room_id');
      await asUser(bob, 'authenticated', legacy);
      const migrated = await legacy.query<{ id: string; space_id: string; title: string }>('select id,space_id,title from feedback_entries');
      expect(migrated.rows).toHaveLength(1);
      expect(migrated.rows[0].title).toBe('Old note');
      await asUser(alice, 'authenticated', legacy);
      await legacy.query('select public.close_room($1)', [room]);
      expect((await legacy.query('select id from feedback_entries where space_id=$1', [migrated.rows[0].space_id])).rows).toHaveLength(1);
    } finally {
      await legacy.close();
    }
  });

  it('rejects a stale concurrent commit and keeps retries idempotent and owned by the caller', async () => {
    const room = await roomFor();
    await asUser(bob);
    await db.query("select public.join_room($1, 'B', 'es')", [room]);
    const requestId = '10000000-0000-4000-8000-000000000002';
    await service();
    const args = [room, alice, 0, requestId, '{}', '{"p1":null,"p2":null}', 'test', null, null];
    const first = await db.query<{ commit_action: string }>("select public.commit_action($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8,$9,null)", args);
    expect(first.rows[0].commit_action).toBe(1);
    const retry = await db.query<{ commit_action: string }>("select public.commit_action($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8,$9,null)", args);
    expect(retry.rows[0].commit_action).toBe(1);
    await expect(db.query("select public.commit_action($1,$2,1,$3,'{}','{}','test',null,null,null)", [room, bob, requestId])).rejects.toThrow(/invalid_request/);
    await expect(db.query("select public.commit_action($1,$2,0,$3,'{}','{}','test',null,null,null)", [room, bob, '10000000-0000-4000-8000-000000000003'])).rejects.toThrow(/stale_state/);
  });

  it('expires rooms after seven days', async () => {
    const room = await roomFor();
    await service();
    await db.query("update rooms set expires_at=now()-interval '1 second' where id=$1", [room]);
    await asUser(bob);
    await expect(db.query("select public.join_room($1, 'B', 'es')", [room])).rejects.toThrow(/room_expired/);
    expect((await db.query('select id from rooms')).rows).toHaveLength(0);
  });

  it('reserves the shared 400,000 character budget once and denies reservations over the cap', async () => {
    const room = await roomFor();
    await service();
    await db.query("update rooms set game_id='davinci' where id=$1", [room]);
    const forbiddenId = '10000000-0000-4000-8000-000000000099';
    await db.query("insert into chat_messages(id,room_id,seat,text,status) values ($1,$2,'p1','Must not translate','pending')", [forbiddenId, room]);
    expect((await db.query<{ reserve_translation: boolean }>('select public.reserve_translation($1,$2)', [forbiddenId, 'es'])).rows[0].reserve_translation).toBe(false);
    expect((await db.query<{ status: string }>('select status from chat_messages where id=$1', [forbiddenId])).rows[0].status).toBe('pending');
    expect((await db.query('select * from translation_usage')).rows).toHaveLength(0);
    await db.query("update rooms set game_id='catchmind' where id=$1", [room]);
    const reactionId = '10000000-0000-4000-8000-000000000098';
    await db.query("insert into chat_messages(id,room_id,seat,text,status) values ($1,$2,'p1','❤️','original')", [reactionId, room]);
    expect((await db.query<{ reserve_translation: boolean }>('select public.reserve_translation($1,$2)', [reactionId, 'es'])).rows[0].reserve_translation).toBe(false);
    expect((await db.query('select * from translation_usage')).rows).toHaveLength(0);
    await db.query(`insert into chat_messages(id,room_id,seat,text,status) select ('20000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,$1,'p1',repeat('a',500),'pending' from generate_series(1,800) n`, [room]);
    const pending = await db.query<{ id: string }>("select id from chat_messages where id::text like '20000000-%' order by id");
    for (const { id } of pending.rows) expect((await db.query<{ reserve_translation: boolean }>('select public.reserve_translation($1,$2)', [id, 'es'])).rows[0].reserve_translation).toBe(true);
    expect((await db.query<{ reserve_translation: boolean }>('select public.reserve_translation($1,$2)', [pending.rows[0].id, 'es'])).rows[0].reserve_translation).toBe(false);
    const overCapId = '30000000-0000-4000-8000-000000000001';
    await db.query("insert into chat_messages(id,room_id,seat,text,status) values ($1,$2,'p1','x','pending')", [overCapId, room]);
    expect((await db.query<{ reserve_translation: boolean }>('select public.reserve_translation($1,$2)', [overCapId, 'ko'])).rows[0].reserve_translation).toBe(false);
    expect((await db.query<{ status: string }>('select status from chat_messages where id=$1', [overCapId])).rows[0].status).toBe('limit');
    expect((await db.query<{ reserved_chars: number }>('select reserved_chars from translation_usage')).rows[0].reserved_chars).toBe(400000);
  });
});

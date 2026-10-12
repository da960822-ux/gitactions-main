// Local protocol fixture only. It uses real migrations/RLS and the built game authority,
// but does not implement Supabase Auth, PostgREST, or Realtime.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const host = '127.0.0.1';
const port = Number(process.env.PORT ?? 54321);
const anonKey = 'local-fixture-public-key';
const usersByToken = new Map();
const userIds = new Set();
const db = new PGlite();
const engineBundle = resolve('supabase/functions/_shared/engines.js');
let cachedAuthority;
async function authority() {
  const modified = (await stat(engineBundle)).mtimeMs;
  if (!cachedAuthority || cachedAuthority.modified !== modified) cachedAuthority = { modified, module: await import(`${pathToFileURL(engineBundle).href}?mtime=${modified}`) };
  return cachedAuthority.module;
}
let queue = Promise.resolve();
const asSerial = work => {
  const result = queue.then(work);
  queue = result.catch(() => {});
  return result;
};
const json = (res, data, status = 200, headers = {}) => {
  res.writeHead(status, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, apikey, content-type, prefer, accept, accept-profile, content-profile, x-client-info, x-supabase-api-version', 'access-control-allow-methods': 'GET, POST, PATCH, OPTIONS', ...headers });
  res.end(JSON.stringify(data));
};
const migration = async name => {
  let sql = await readFile(resolve('supabase/migrations', name), 'utf8');
  sql = sql.replace(/^create extension if not exists pgcrypto;\s*/m, '').replace(/^create extension if not exists pg_cron;\s*/m, '').replace(/select cron\.schedule\([\s\S]*?\);\s*$/m, '');
  return sql;
};
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; create publication supabase_realtime;`);
await db.exec(await migration('202610100001_rooms.sql'));
await db.exec(await migration('202610100002_feedback.sql'));
await db.exec(await migration('202610100003_feedback_spaces.sql'));
await db.exec(await migration('202610100004_catchmind_translation.sql'));
await db.exec(await migration('202610110005_feedback_submission.sql'));

async function transaction(role, userId, work) {
  await db.exec('begin');
  try {
    await db.exec(`set local role ${role}`);
    if (userId) await db.query("select set_config('request.jwt.claim.sub',$1,true)", [userId]);
    const value = await work();
    await db.exec('commit');
    return value;
  } catch (error) {
    try { await db.exec('rollback'); } catch {}
    throw error;
  }
}
function bearer(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  return token ? usersByToken.get(token) ?? null : null;
}
async function body(req) {
  let text = '';
  for await (const part of req) { text += part; if (text.length > 30000) throw Object.assign(new Error('payload_too_large'), { status: 413 }); }
  return text ? JSON.parse(text) : {};
}
function error(res, cause, actionResponse = false) {
  const message = cause instanceof Error ? cause.message : 'fixture_error';
  const status = cause?.status ?? (actionResponse && message === 'stale_state' ? 409 : /permission denied|row-level security/i.test(message) ? 403 : 400);
  // Edge Functions use {error}; RPCs retain the PostgREST-shaped error body.
  json(res, actionResponse ? { error: message } : { code: message, message, details: null, hint: null }, status);
}
function uuid(value) { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value); }

async function rpc(name, args, userId) {
  const roomCalls = {
    create_room: ['select public.create_room($1,$2) as value', [args.p_nickname, args.p_language]],
    join_room: ['select public.join_room($1,$2,$3) as value', [args.p_room, args.p_nickname, args.p_language]],
    room_snapshot: ['select public.room_snapshot($1) as value', [args.p_room]],
    close_room: ['select public.close_room($1) as value', [args.p_room]],
    set_language: ['select public.set_language($1,$2) as value', [args.p_room, args.p_language]],
    create_feedback_space: ['select public.create_feedback_space() as value', []],
    join_feedback_space: ['select public.join_feedback_space($1) as value', [args.p_space]],
    submit_feedback: ['select public.submit_feedback($1,$2,$3,$4,$5) as value', [args.p_space, args.p_request, args.p_category, args.p_title, args.p_body]],
  };
  const call = roomCalls[name];
  if (!call) throw new Error('unknown_function');
  return transaction('authenticated', userId, async () => (await db.query(call[0], call[1])).rows[0].value);
}

const tableColumns = {
  feedback_spaces: ['id', 'created_at', 'invite_open'],
  feedback_space_members: ['space_id', 'user_id', 'seat'],
  feedback_entries: ['id', 'space_id', 'category', 'title', 'body', 'status', 'created_at'],
};
function parsedFilters(url, columns) {
  const filters = [];
  for (const [key, value] of url.searchParams) {
    if (['select', 'order', 'limit', 'offset'].includes(key)) continue;
    if (!columns.includes(key)) throw new Error('invalid_column');
    const [op, ...valueParts] = value.split('.');
    const sqlOp = { eq: '=', gt: '>' }[op];
    if (!sqlOp || !valueParts.length) throw new Error('invalid_filter');
    filters.push({ column: key, op: sqlOp, value: valueParts.join('.') });
  }
  return filters;
}
async function tableRequest(req, res, url, userId) {
  const table = url.pathname.split('/').at(-1);
  const columns = tableColumns[table];
  if (!columns) return json(res, { message: 'not found' }, 404);
  const method = req.method;
  const select = (url.searchParams.get('select') ?? '*').split(',').map(x => x.trim());
  if (select.some(x => !columns.includes(x))) throw new Error('invalid_select');
  const filters = parsedFilters(url, columns);
  const where = filters.length ? ` where ${filters.map((f, i) => `"${f.column}" ${f.op} $${i + 1}`).join(' and ')}` : '';
  const values = filters.map(f => f.value);
  let result;
  if (method === 'GET') {
    let order = '';
    const orderValue = url.searchParams.get('order');
    if (orderValue) {
      const [column, direction = 'asc'] = orderValue.split('.');
      if (!columns.includes(column) || !['asc', 'desc'].includes(direction)) throw new Error('invalid_order');
      order = ` order by "${column}" ${direction}`;
    }
    const limit = Number(url.searchParams.get('limit') ?? 1000);
    if (!Number.isInteger(limit) || limit < 0 || limit > 1000) throw new Error('invalid_limit');
    const offset = Number(url.searchParams.get('offset') ?? 0);
    if (!Number.isInteger(offset) || offset < 0) throw new Error('invalid_offset');
    result = await transaction('authenticated', userId, () => db.query(`select ${select.join(',')} from public."${table}"${where}${order} limit ${limit} offset ${offset}`, values));
    return json(res, result.rows);
  }
  const payload = await body(req);
  if (method === 'POST' && table === 'feedback_entries') {
    const inserted = await transaction('authenticated', userId, () => db.query('insert into public.feedback_entries(space_id,category,title,body) values($1,$2,$3,$4) returning *', [payload.space_id, payload.category, payload.title, payload.body]));
    result = inserted.rows;
  } else if (method === 'PATCH' && table === 'feedback_entries') {
    const patch = Object.keys(payload);
    if (patch.length !== 1 || patch[0] !== 'status') throw new Error('invalid_update');
    const setFilters = parsedFilters(url, columns);
    const set = 'status=$1::text';
    const whereSql = setFilters.length ? ` where ${setFilters.map((f, i) => `"${f.column}" ${f.op} $${i + 2}`).join(' and ')}` : '';
    const updated = await transaction('authenticated', userId, () => db.query(`update public.feedback_entries set ${set}${whereSql} returning *`, [payload.status, ...setFilters.map(f => f.value)]));
    result = updated.rows;
  } else throw new Error('method_not_allowed');
  const chosen = result.map(row => Object.fromEntries(select.map(column => [column, row[column]])));
  const single = req.headers.accept?.includes('vnd.pgrst.object+json');
  const responseStatus = single && !chosen.length ? 406 : method === 'PATCH' ? 200 : 201;
  return json(res, single ? chosen[0] ?? { code: 'PGRST116', details: '0 rows', message: 'JSON object requested, no rows returned' } : chosen, responseStatus);
}

async function action(req, userId) {
  if (!userId) throw Object.assign(new Error('authentication_required'), { status: 401 });
  const { engines, executeAction, chatMessageForGame, reactionMessageForId, isCorrectGuess, getCatchmindDrawDurationMs } = await authority();
  const input = await body(req);
  if (!uuid(input.roomId) || !uuid(input.requestId) || !Number.isSafeInteger(input.version) || input.version < 0) throw new Error('invalid_request');
  return transaction('service_role', null, async () => {
    const room = (await db.query('select * from public.rooms where id=$1', [input.roomId])).rows[0];
    const members = (await db.query('select * from public.room_members where room_id=$1', [input.roomId])).rows;
    const member = members.find(row => row.user_id === userId);
    if (!room || !member || Date.parse(room.expires_at) <= Date.now()) throw new Error('room_unavailable');
    const receipt = (await db.query('select version,user_id from public.action_receipts where room_id=$1 and request_id=$2', [input.roomId, input.requestId])).rows[0];
    if (receipt) {
      if (receipt.user_id !== userId) throw new Error('invalid_request');
      return { version: receipt.version };
    }
    if (Number(room.version) !== input.version) throw new Error('stale_state');
    let state = (await db.query('select state from public.room_states where room_id=$1', [input.roomId])).rows[0].state;
    let gameId = room.game_id, pending = room.pending_game, pendingBy = room.pending_by, chat = null;
    const opCount = [input.selectGame !== undefined, input.chat !== undefined, input.reaction !== undefined, input.action !== undefined, input.tick === true].filter(Boolean).length;
    if (opCount !== 1) throw new Error('invalid_operation');
    const now = Date.now(); let timedOut = false;
    if (gameId === 'catchmind' && state?.phase === 'drawing' && state.deadlineAt && Date.parse(state.deadlineAt) <= now) {
      state = executeAction(engines.catchmind, state, state.drawer, { type: 'timeout' }).state;
      state.deadlineAt = null;
      timedOut = true;
    }
    if (input.selectGame !== undefined) {
      if (!['davinci', 'catchmind', 'domino', 'jaipur', 'splendor', 'minhwatu', 'marble', 'rhythm'].includes(input.selectGame)) throw new Error('invalid_game');
      if (members.length !== 2 || !(pending === input.selectGame && pendingBy !== userId)) { pending = input.selectGame; pendingBy = userId; }
      else { gameId = input.selectGame; pending = null; pendingBy = null; state = engines[gameId]?.createInitialState(crypto.getRandomValues(new Uint32Array(1))[0]) ?? null; }
    } else if (input.reaction !== undefined) {
      chat = reactionMessageForId(input.reaction);
    } else if (input.chat !== undefined) {
      const message = chatMessageForGame(gameId, input.chat), text = message.text; let correct = false;
      if (message.status === 'pending' && gameId === 'catchmind' && state?.phase === 'drawing' && state.drawer !== member.seat && text.length <= 60) {
        correct = isCorrectGuess(state, text);
        state = executeAction(engines.catchmind, state, member.seat, { type: 'guess', payload: { text } }).state;
        if (state.phase !== 'drawing') state.deadlineAt = null;
      }
      const recipient = members.find(row => row.seat !== member.seat);
      chat = { text: correct ? '' : text, status: correct ? 'correct' : message.status === 'pending' ? recipient?.language === member.language ? 'original' : 'unavailable' : message.status };
    } else if (input.action !== undefined) {
      const engine = engines[gameId];
      if (!engine) throw new Error('no_game');
      if (input.action?.type === 'timeout' || gameId === 'catchmind' && (input.action?.type === 'guess' || input.action?.type === 'reveal-hint')) throw new Error('use_chat_or_server_clock');
      state = executeAction(engine, state, member.seat, input.action).state;
      if (gameId === 'catchmind') {
        if (input.action.type === 'choose') state.deadlineAt = new Date(Date.now() + getCatchmindDrawDurationMs(state)).toISOString();
        else if (state.phase !== 'drawing') state.deadlineAt = null;
      }
    } else if (input.tick === true && gameId === 'catchmind' && !timedOut) return { version: room.version };
    const views = !gameId || !state ? { p1: null, p2: null } : Object.fromEntries(['p1', 'p2'].map(seat => [seat, { ...engines[gameId].getPlayerView(state, seat), deadlineAt: state.deadlineAt ?? null }]));
    const committed = await db.query('select public.commit_action($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8,$9,$10::jsonb) as version', [room.id, userId, input.version, input.requestId, JSON.stringify(state), JSON.stringify(views), gameId, pending, pendingBy, chat ? JSON.stringify(chat) : null]);
    return { version: committed.rows[0].version };
  });
}

const server = createServer((req, res) => {
  if (req.method === 'OPTIONS') return json(res, {});
  let url;
  try { url = new URL(req.url ?? '/', `http://${host}:${port}`); }
  catch { return json(res, { message: 'bad_url' }, 400); }
  void asSerial(async () => {
    if (url.pathname === '/auth/v1/signup' && req.method === 'POST') {
      const userId = randomUUID(), token = `local-fixture.${randomUUID()}`;
      await db.query('insert into auth.users(id) values($1)', [userId]);
      usersByToken.set(token, userId); userIds.add(userId);
      const now = Math.floor(Date.now() / 1000);
      return json(res, { access_token: token, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: randomUUID(), user: { id: userId, aud: 'authenticated', role: 'authenticated', is_anonymous: true, app_metadata: { provider: 'anonymous', providers: ['anonymous'] }, user_metadata: {}, identities: [], created_at: new Date().toISOString() } }, 200);
    }
    if (url.pathname === '/auth/v1/user') {
      const userId = bearer(req);
      return userId ? json(res, { id: userId, aud: 'authenticated', role: 'authenticated', is_anonymous: true, app_metadata: { provider: 'anonymous' }, user_metadata: {} }) : json(res, { message: 'invalid token' }, 401);
    }
    if (url.pathname === '/functions/v1/action' && req.method === 'POST') {
      const result = await action(req, bearer(req));
      return json(res, result);
    }
    if (url.pathname.startsWith('/rest/v1/rpc/')) {
      const userId = bearer(req);
      if (!userId) return json(res, { message: 'unauthorized' }, 401);
      const name = url.pathname.split('/').at(-1), args = await body(req);
      return json(res, await rpc(name, args, userId));
    }
    if (url.pathname.startsWith('/rest/v1/')) {
      const userId = bearer(req);
      if (!userId) return json(res, { message: 'unauthorized' }, 401);
      return tableRequest(req, res, url, userId);
    }
    return json(res, { message: 'not_found' }, 404);
  }).catch(cause => error(res, cause, url.pathname === '/functions/v1/action'));
});
server.listen(port, host, () => console.log(`PGlite SQL/RLS fixture listening at http://${host}:${port} (not Supabase Auth/PostgREST/Realtime)`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { server.close(); await asSerial(() => db.close()); process.exit(0); });

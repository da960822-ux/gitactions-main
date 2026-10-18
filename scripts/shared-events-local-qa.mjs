import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const config = JSON.parse(await readFile('/tmp/shared-events-local-qa/config.json', 'utf8'));
const report = { environment: 'genuine local Supabase Auth, PostgreSQL, PostgREST, Realtime and Edge Runtime; no production deployment', checks: [] };
const check = (name, details) => { report.checks.push({ name, passed: true, ...(details ? { details } : {}) }); console.log(`PASS ${name}`); };
const wait = ms => new Promise(done => setTimeout(done, ms));
const clients = [];
function database(key = config.anon) {
  const client = createClient(config.url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  clients.push(client); return client;
}
async function rpc(db, name, args = {}) { const { data, error } = await db.rpc(name, args); if (error) throw new Error(error.message); return data; }
async function reject(promise, pattern) { await assert.rejects(promise, pattern); }
async function edge(token, input, raw = false) {
  const response = await fetch(`${config.url}/functions/v1/shared-event`, { method: 'POST', headers: { authorization: `Bearer ${token}`, apikey: config.anon, 'content-type': 'application/json' }, body: raw ? input : JSON.stringify(input) });
  return { status: response.status, body: await response.json() };
}
try {
  const members = [database(), database(), database()];
  const sessions = await Promise.all(members.map(async db => {
    const { data, error } = await db.auth.signInAnonymously(); if (error) throw error;
    assert.ok(data.session?.access_token); return data;
  }));
  assert.equal(new Set(sessions.map(data => data.user.id)).size, 3);
  assert.ok(sessions.every(data => data.session.access_token.split('.').length === 3));
  check('Three independent identities received genuine Auth-signed JWTs');
  const [p1, p2, outsider] = members;
  const [token1, token2, token3] = sessions.map(data => data.session.access_token);
  const service = database(config.service);
  const session = await rpc(p1, 'create_event_session');
  await reject(rpc(outsider, 'refresh_event_session', { p_session: session }), /event_session_unavailable/);
  let revision = 0, roundId;
  function action(type, extra = {}) { return { type, requestId: crypto.randomUUID(), roundId: roundId || crypto.randomUUID(), revision, ...extra }; }
  let premature = await edge(token1, { sessionId: session, action: action('propose', { eventId: 'R01', intent: null }) });
  assert.equal(premature.body.error, 'event_session_not_ready');
  assert.equal(await rpc(p2, 'join_event_session', { p_session: session }), 'p2');
  await reject(rpc(outsider, 'join_event_session', { p_session: session }), /event_invite_closed/);
  const snap = async db => { const record = await rpc(db, 'refresh_event_session', { p_session: session }); revision = record.revision; return record; };
  async function send(token, type, extra = {}) {
    const payload = action(type, extra); const response = await edge(token, { sessionId: session, action: payload });
    assert.equal(response.status, 200, JSON.stringify(response.body)); revision = response.body.revision; roundId = response.body.eventState.roundId;
    return { payload, record: response.body };
  }
  check('Explicit invite required; one member cannot propose; a third member cannot join');

  assert.equal((await edge('forged.invalid.token', { sessionId: session, action: action('ready') })).status, 401);
  const impersonation = await edge(token1, { sessionId: session, actor: 'p2', action: action('propose', { eventId: 'R01', intent: null }) });
  assert.equal(impersonation.body.error, 'invalid_event_request');
  assert.equal((await edge(token3, { sessionId: session, action: action('ready') })).body.error, 'event_session_unavailable');
  const direct = await p1.rpc('commit_event_session_action', { p_session: session, p_verified_actor: sessions[1].user.id, p_expected_revision: 0, p_request: crypto.randomUUID(), p_signature: {}, p_next_state: { revision: 1 } });
  assert.ok(direct.error);
  for (const next of [{}, { revision: null }, { revision: '1' }, { revision: 2 }]) {
    const { error } = await service.rpc('commit_event_session_action', { p_session: session, p_verified_actor: sessions[0].user.id, p_expected_revision: 0, p_request: crypto.randomUUID(), p_signature: {}, p_next_state: next });
    assert.match(error?.message ?? '', /event_revision_invalid/);
  }
  assert.equal((await edge(token1, 'x'.repeat(16_385), true)).status, 413);
  check('Real Edge rejects invalid JWT, forged actor, outsider, direct service RPC and oversized body');

  // A real database change must traverse the Realtime websocket to the other authenticated client.
  await p2.realtime.setAuth(token2);
  let invalidation;
  const arrived = new Promise(done => { invalidation = done; });
  const realtimeStatus = [];
  const channel = p2.channel(`independent-qa:${session}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'event_sessions', filter: `id=eq.${session}` }, payload => invalidation(payload)).on('system', {}, payload => console.log('Realtime system:', JSON.stringify(payload)));
  await new Promise((done, fail) => {
    const timeout = setTimeout(() => fail(new Error(`Realtime subscribe timeout: ${realtimeStatus.join(',')}`)), 20_000);
    channel.subscribe(status => { realtimeStatus.push(status); if (status === 'SUBSCRIBED') { clearTimeout(timeout); done(); } });
  });
  const proposal = await send(token1, 'propose', { eventId: 'R02', intent: { decorId: 'sali-suli' } });
  const change = await Promise.race([arrived, wait(10_000).then(() => { throw new Error('No real Realtime update reached p2'); })]);
  assert.equal(change.new.id, session);
  check('Authenticated p2 receives actual PostgreSQL UPDATE over Realtime websocket');
  await p2.removeChannel(channel);
  const replay = await edge(token1, { sessionId: session, action: proposal.payload });
  assert.equal(replay.status, 200); assert.equal(replay.body.revision, revision);
  const conflict = await edge(token2, { sessionId: session, action: proposal.payload });
  assert.equal(conflict.body.error, 'event_request_conflict');
  const sameRevision = action('ready');
  const race = await Promise.all([edge(token1, { sessionId: session, action: sameRevision }), edge(token2, { sessionId: session, action: { ...sameRevision, requestId: crypto.randomUUID() } })]);
  assert.deepEqual(race.map(result => result.status).sort(), [200, 409]);
  await snap(p1);
  check('Idempotent retry preserves revision; cross-member reuse rejected; same-revision race has one winner');
  await rpc(p2, 'pause_event_session', { p_session: session });
  assert.equal((await snap(p1)).eventState.status, 'cancelled');
  check('Either member pause immediately cancels pending consent');

  for (const [eventId, intent, secondIntent] of [
    ['R01', null, null],
    ['R02', { decorId: 'robot' }, null],
    ['R03', { points: [{ x: 0, y: 1 }, { x: 1, y: 0 }] }, { points: [{ x: 0.2, y: 0.7 }, { x: 0.8, y: 0.3 }] }],
    ['R04', { pattern: [0, 2, 1] }, { pattern: [5, 4, 3, 1] }],
  ]) {
    if (eventId !== 'R01') {
      const previous = (await snap(p1)).eventState;
      assert.equal((await edge(token1, { sessionId: session, action: action('propose', { eventId, intent }) })).body.error, 'event_cooldown');
      await wait(Math.max(0, previous.lastStartedAt + 30_030 - Date.now()));
      await snap(p1);
    }
    await snap(p2); await snap(p1);
    roundId = crypto.randomUUID();
    await send(token1, 'propose', { eventId, intent });
    if (secondIntent) {
      assert.equal((await edge(token1, { sessionId: session, action: action('ready') })).body.error, eventId === 'R04' ? 'event_both_acknowledged_required' : 'event_both_contributions_required');
      await send(token2, 'contribute', { intent: secondIntent });
    }
    if (eventId === 'R04') {
      assert.equal((await edge(token1, { sessionId: session, action: action('acknowledge', { pattern: [0] }) })).body.error, 'event_pattern_mismatch');
      await send(token1, 'acknowledge', { pattern: secondIntent.pattern });
      await send(token2, 'acknowledge', { pattern: intent.pattern });
    }
    await send(token1, 'ready');
    assert.equal((await edge(token1, { sessionId: session, action: action('confirm') })).body.error, 'event_both_ready_required');
    await send(token2, 'ready'); await send(token1, 'confirm');
    const scheduled = (await send(token2, 'confirm')).record;
    assert.equal(scheduled.eventState.status, 'scheduled');
    assert.ok(scheduled.eventState.startAt >= Date.now() + 400);
    await wait(Math.max(0, scheduled.eventState.startAt - Date.now() + 30));
    const [a, b] = await Promise.all([snap(p1), snap(p2)]);
    assert.equal(a.eventState.status, 'started'); assert.deepEqual(a.eventState, b.eventState);
    assert.equal(a.eventState.startAt, scheduled.eventState.startAt);
    check(`${eventId} needs both members' explicit ready/confirm and converges at authoritative server start`);
  }

  const bodyState = (await snap(p1)).eventState;
  assert.ok(!('view' in bodyState) && !('messages' in bodyState) && !('q' in bodyState) && !('camera' in bodyState));
  await rpc(p2, 'close_event_session', { p_session: session });
  for (const table of ['event_sessions', 'event_session_members', 'event_session_receipts']) {
    const { data, error } = await service.from(table).select('*').eq(table === 'event_sessions' ? 'id' : 'session_id', session);
    if (error) throw error; assert.equal(data.length, 0);
  }
  check('Either member session close deletes drawings, patterns and durable receipts by cascade');

  const abandoned = await rpc(p1, 'create_event_session');
  await rpc(p2, 'join_event_session', { p_session: abandoned });
  const abandonedProposal = { type: 'propose', requestId: crypto.randomUUID(), roundId: crypto.randomUUID(), revision: 0, eventId: 'R03', intent: { points: [{ x: 0.1, y: 0.9 }] } };
  assert.equal((await edge(token1, { sessionId: abandoned, action: abandonedProposal })).status, 200);
  for (let tick = 0; tick < 3; tick++) { await wait(4_300); await rpc(p1, 'refresh_event_session', { p_session: abandoned }); }
  assert.equal((await rpc(p1, 'refresh_event_session', { p_session: abandoned })).eventState.status, 'cancelled');
  check('A genuinely silent member loses its pending round after the 12-second lease');
  await rpc(p1, 'close_event_session', { p_session: abandoned });

  const expiring = await rpc(p1, 'create_event_session');
  await rpc(p2, 'join_event_session', { p_session: expiring });
  const expiryProposal = { ...abandonedProposal, requestId: crypto.randomUUID(), roundId: crypto.randomUUID() };
  assert.equal((await edge(token1, { sessionId: expiring, action: expiryProposal })).status, 200);
  for (let tick = 0; tick < 4; tick++) { await wait(5_100); await rpc(p2, 'refresh_event_session', { p_session: expiring }); await rpc(p1, 'refresh_event_session', { p_session: expiring }); }
  const expiredRound = await rpc(p1, 'refresh_event_session', { p_session: expiring });
  assert.equal(expiredRound.eventState.status, 'expired');
  assert.deepEqual(expiredRound.eventState.readyBy, {});
  check('A real 20-second round expiry clears consent while both members remain live');
  const expiredUpdate = await service.from('event_sessions').update({ expires_at: new Date(Date.now() - 1000).toISOString() }).eq('id', expiring);
  if (expiredUpdate.error) throw expiredUpdate.error;
  await reject(rpc(p1, 'refresh_event_session', { p_session: expiring }), /event_session_unavailable/);
  const beforeCleanup = await service.from('event_sessions').select('id').eq('id', expiring);
  assert.equal(beforeCleanup.data.length, 1);
  const cleanup = await service.from('event_sessions').delete().eq('id', expiring);
  if (cleanup.error) throw cleanup.error;
  const afterCleanup = await service.from('event_session_receipts').select('request_id').eq('session_id', expiring);
  assert.equal(afterCleanup.data.length, 0);
  check('Session expiry blocks access immediately; physical deletion requires cleanup (cron scheduler not installed in this local PostgreSQL)');
  report.passed = true;
} catch (error) {
  report.passed = false; report.failure = error instanceof Error ? error.message : String(error);
  console.error(`FAIL ${report.failure}`); process.exitCode = 1;
} finally {
  await Promise.all(clients.map(client => client.removeAllChannels()));
  await writeFile('/tmp/shared-events-local-qa/report.json', JSON.stringify(report, null, 2));
}

import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { build } from 'esbuild';

const directory = '/tmp/shared-events-local-qa';
const config = JSON.parse(await readFile(`${directory}/config.json`, 'utf8'));
await build({ entryPoints: ['src/core/sharedEventsClient.ts'], outfile: `${directory}/client.mjs`, bundle: true, format: 'esm', platform: 'node', define: { 'import.meta.env': '{}' } });
const { SharedEventsClient } = await import(`${directory}/client.mjs?${Date.now()}`);
const report = { environment: 'actual product SharedEventsClient against genuine local Supabase services', checks: [] };
let inject = null; const attempts = [];
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const db1 = createClient(config.url, config.anon, options);
const db2 = createClient(config.url, config.anon, { ...options, global: { fetch: async (url, init) => {
  if (String(url).includes('/functions/v1/shared-event') && typeof init?.body === 'string') {
    const input = JSON.parse(init.body);
    if (input.action?.type === 'cancel') {
      attempts.push({ revision: input.action.revision, requestId: input.action.requestId, roundId: input.action.roundId });
      const pending = inject; inject = null; if (pending) await pending();
    }
  }
  return fetch(url, init);
} } });
const p1 = new SharedEventsClient(db1), p2 = new SharedEventsClient(db2);
const off1 = p1.subscribe(() => {}), off2 = p2.subscribe(() => {});
try {
  const created = await p1.createSession(); await p2.joinSession(created.sessionId); await p1.snapshot();
  await p1.send({ type: 'propose', eventId: 'R01', intent: null }); await p2.snapshot();
  const revision = p2.getSnapshot().round.revision;
  inject = () => p1.send({ type: 'ready' });
  const cancelled = await p2.send({ type: 'cancel' });
  assert.equal(cancelled.round.status, 'cancelled'); assert.deepEqual(cancelled.round.readyBy, {});
  assert.equal(attempts.length, 2); assert.equal(attempts[0].revision, revision); assert.equal(attempts[1].revision, revision + 1);
  assert.notEqual(attempts[0].requestId, attempts[1].requestId); assert.equal(attempts[0].roundId, attempts[1].roundId);
  report.checks.push({ name: 'Real peer-ready mutation between cancellation construction and HTTP send yields one fresh cancellation retry and clears consent', passed: true, attempts });
  console.log('PASS real same-round cancellation race retries exactly once');
  await p1.snapshot(); await p1.send({ type: 'propose', eventId: 'R01', intent: null }); await p2.snapshot();
  const oldRound = p2.getSnapshot().round.roundId; attempts.length = 0;
  inject = async () => { await p1.send({ type: 'cancel' }); await p1.send({ type: 'propose', eventId: 'R02', intent: { decorId: 'robot' } }); };
  await assert.rejects(p2.send({ type: 'cancel' }), /stale_event_state/);
  assert.equal(attempts.length, 1); assert.notEqual(p2.getSnapshot().round.roundId, oldRound); assert.equal(p2.getSnapshot().round.status, 'proposed');
  report.checks.push({ name: 'Cancellation of an old round does not silently cancel a different new round', passed: true });
  console.log('PASS cancellation never rebases to another round');
  report.passed = true;
} catch (error) { report.passed = false; report.failure = error.stack; console.error(error.stack); process.exitCode = 1; }
finally { inject = null; await p1.closeSession().catch(() => {}); off1(); off2(); await db1.removeAllChannels(); await db2.removeAllChannels(); await writeFile(`${directory}/client-report.json`, JSON.stringify(report, null, 2)); }

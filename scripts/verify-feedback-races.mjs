// Browser regression for switching spaces while create and submit RPCs are still pending.
import { spawn } from 'node:child_process';
import { launchChromium } from './playwright-browser.mjs';

const base = 'http://127.0.0.1:5199';
const api = 'https://qa-feedback.supabase.co';
const created = '11111111-1111-4111-8111-111111111111';
const oldSpace = '22222222-2222-4222-8222-222222222222';
const joined = '33333333-3333-4333-8333-333333333333';
const user = '44444444-4444-4444-8444-444444444444';
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
const createStarted = deferred();
const releaseCreate = deferred();
const submitStarted = deferred();
const releaseSubmit = deferred();
let joinGate = null;
const posts = new Map([[oldSpace, []], [joined, []]]);
const calls = { create: 0, join: 0, submit: [] };
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5199', '--strictPort'], {
  cwd: process.cwd(), env: { ...process.env, VITE_SUPABASE_URL: api, VITE_SUPABASE_ANON_KEY: 'qa-key' }, stdio: 'ignore',
});
let browser;
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(`${base}/feedback`)).ok) { ready = true; break; } } catch { /* Vite is starting. */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error('Local Vite server did not start');
  browser = await launchChromium();
  const context = async (initialSpace = '') => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await ctx.addInitScript(({ userId, initial }) => {
      localStorage.setItem('sb-qa-feedback-auth-token', JSON.stringify({
        access_token: 'test-token', refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: userId, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
      }));
      if (initial && !localStorage.getItem('dos-feedback-space')) localStorage.setItem('dos-feedback-space', initial);
    }, { userId: user, initial: initialSpace });
    await ctx.route(`${api}/**`, async route => {
      const request = route.request();
      const url = new URL(request.url());
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'content-type': 'application/json' };
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      let body;
      if (url.pathname.endsWith('/rpc/create_feedback_space')) {
        calls.create++;
        createStarted.resolve();
        await releaseCreate.promise;
        body = created;
      } else if (url.pathname.endsWith('/rpc/join_feedback_space')) {
        if (request.postDataJSON().p_space !== joined) throw new Error('Unexpected join target');
        calls.join++;
        if (joinGate) { joinGate.started.resolve(); await joinGate.release.promise; }
        body = 'p2';
      } else if (url.pathname.endsWith('/rpc/submit_feedback')) {
        const input = request.postDataJSON();
        calls.submit.push(input);
        if (input.p_space === oldSpace) { submitStarted.resolve(); await releaseSubmit.promise; }
        const row = { id: input.p_request, category: input.p_category, title: input.p_title, body: input.p_body, status: 'new', created_at: new Date().toISOString() };
        posts.get(input.p_space).unshift(row);
        body = row;
      } else if (url.pathname.endsWith('/feedback_space_members')) {
        const space = url.searchParams.get('space_id')?.slice(3);
        const seat = space === joined ? 'p2' : 'p1';
        body = url.searchParams.has('user_id') ? { seat } : space === joined ? [{ seat: 'p1' }, { seat: 'p2' }] : [{ seat: 'p1' }];
      } else if (url.pathname.endsWith('/feedback_entries')) {
        body = posts.get(url.searchParams.get('space_id')?.slice(3)) ?? [];
      } else throw new Error(`Unexpected API request: ${url.pathname}`);
      await route.fulfill({ status: 200, headers, body: JSON.stringify(body) });
    });
    const page = await ctx.newPage();
    page.on('pageerror', error => { throw error; });
    return { ctx, page };
  };

  const first = await context();
  await first.page.goto(`${base}/feedback`);
  await createStarted.promise;
  await first.page.locator('#feedback-invite-code').fill(joined);
  await first.page.getByRole('button', { name: '참여하기' }).click();
  await first.page.getByText('현재 이 공간에 참여한 계정은 2개예요.').waitFor();
  releaseCreate.resolve();
  await first.page.waitForTimeout(150);
  let saved = await first.page.evaluate(() => localStorage.getItem('dos-feedback-space'));
  if (saved !== joined || calls.create !== 1 || calls.join !== 1) throw new Error('Late create replaced the joined space');
  await first.page.reload();
  await first.page.getByText('현재 이 공간에 참여한 계정은 2개예요.').waitFor();
  saved = await first.page.evaluate(() => localStorage.getItem('dos-feedback-space'));
  if (saved !== joined) throw new Error('Reload opened the late-created space');
  await first.ctx.close();

  const second = await context(oldSpace);
  await second.page.goto(`${base}/feedback`);
  await second.page.locator('#feedback-body').waitFor();
  await second.page.locator('#feedback-body').fill('Old space idea');
  await second.page.getByRole('button', { name: '아이디어 저장하기' }).click();
  await submitStarted.promise;
  await second.page.locator('#feedback-invite-code').fill(joined);
  second.page.once('dialog', dialog => dialog.dismiss());
  await second.page.getByRole('button', { name: '참여하기' }).click();
  if (calls.join !== 1 || await second.page.locator('#feedback-body').inputValue() !== 'Old space idea') throw new Error('Cancelled draft warning switched spaces');
  second.page.once('dialog', dialog => dialog.accept());
  await second.page.getByRole('button', { name: '참여하기' }).click();
  await second.page.getByText('현재 이 공간에 참여한 계정은 2개예요.').waitFor();
  releaseSubmit.resolve();
  await second.page.waitForTimeout(150);
  if (await second.page.getByText('Old space idea').count() || await second.page.locator('.feedback-saved').count()) throw new Error('Late old-space submit appeared in the joined space');
  saved = await second.page.evaluate(() => localStorage.getItem('dos-feedback-space'));
  if (saved !== joined || posts.get(oldSpace).length !== 1 || posts.get(joined).length !== 0) throw new Error('Late submit changed storage or persisted to the wrong space');
  await second.page.locator('#feedback-body').fill('New space idea');
  await second.page.getByRole('button', { name: '아이디어 저장하기' }).click();
  await second.page.getByText('New space idea').waitFor();
  if (calls.submit[0].p_request === calls.submit[1].p_request || calls.submit[1].p_space !== joined) throw new Error('New space reused the old submission request');
  await second.page.reload();
  await second.page.getByText('New space idea').waitFor();
  if (await second.page.getByText('Old space idea').count()) throw new Error('Reload mixed entries from separate spaces');
  await second.ctx.close();

  joinGate = { started: deferred(), release: deferred() };
  const third = await context(oldSpace);
  await third.page.goto(`${base}/feedback?space=${joined}`);
  await third.page.getByRole('button', { name: '참여하기' }).click();
  await joinGate.started.promise;
  if (!await third.page.getByRole('button', { name: '초대 닫기' }).isDisabled()
    || !await third.page.locator('#feedback-invite-code').isDisabled()) throw new Error('Invitation can be dismissed or edited during join');
  joinGate.release.resolve();
  await third.page.getByText('현재 이 공간에 참여한 계정은 2개예요.').waitFor();
  saved = await third.page.evaluate(() => localStorage.getItem('dos-feedback-space'));
  if (saved !== joined) throw new Error('Completed join was not reflected in storage');
  await third.ctx.close();

  joinGate = { started: deferred(), release: deferred() };
  const fourth = await context(oldSpace);
  await fourth.page.goto(`${base}/feedback?space=${joined}`);
  await fourth.page.getByRole('button', { name: '참여하기' }).click();
  await joinGate.started.promise;
  await fourth.page.locator('.couple-brand').click();
  await fourth.page.waitForURL(`${base}/`);
  await fourth.page.evaluate(() => { history.pushState({}, '', '/feedback'); dispatchEvent(new PopStateEvent('popstate')); });
  await fourth.page.getByText('현재 이 공간에 참여한 계정은 1개예요.').waitFor();
  joinGate.release.resolve();
  await fourth.page.waitForTimeout(150);
  saved = await fourth.page.evaluate(() => localStorage.getItem('dos-feedback-space'));
  if (saved !== oldSpace || fourth.page.url() !== `${base}/feedback`
    || await fourth.page.getByText('현재 이 공간에 참여한 계정은 2개예요.').count()) throw new Error('Late join from a prior route changed the active page');
  await fourth.page.reload();
  await fourth.page.getByText('현재 이 공간에 참여한 계정은 1개예요.').waitFor();
  await fourth.ctx.close();
  console.log(JSON.stringify({ passed: true, lateCreate: true, lateSubmit: true, requestIdsDistinct: true, pendingJoinLocked: true, staleRouteJoinIgnored: true }));
} finally {
  releaseCreate.resolve(); releaseSubmit.resolve(); joinGate?.release.resolve();
  await browser?.close();
  server.kill('SIGTERM');
}

// Desktop browser check of the shared Idea Box client with a same-origin API mock.
import { spawn } from 'node:child_process';
import { launchChromium } from './playwright-browser.mjs';

const base = 'http://127.0.0.1:5199';
const posts = [];
const imported = new Set();
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5199', '--strictPort'], { cwd: process.cwd(), stdio: 'ignore' });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(`${base}/feedback`)).ok) { ready = true; break; } } catch { /* starting */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error('Vite did not start');
  browser = await launchChromium();
  async function visit(canAcknowledge, unauthorized = false) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.route(`${base}/api/feedback**`, async route => {
      const request = route.request();
      const url = new URL(request.url());
      const headers = { 'content-type': 'application/json', 'cache-control': 'no-store' };
      if (unauthorized) return route.fulfill({ status: 401, headers, body: JSON.stringify({ error: 'authentication_required' }) });
      if (request.method() === 'GET') return route.fulfill({ status: 200, headers, body: JSON.stringify({ entries: posts, canAcknowledge }) });
      if (request.method() === 'POST' && url.pathname === '/api/feedback/import' && canAcknowledge) {
        const data = JSON.parse(request.postData());
        if (!data.legacySourceId || !data.body) return route.fulfill({ status: 400, headers, body: '{}' });
        const isNew = !imported.has(data.legacySourceId);
        imported.add(data.legacySourceId);
        if (isNew) posts.unshift({ ...data, id: data.legacySourceId });
        return route.fulfill({ status: 200, headers, body: JSON.stringify({ id: data.legacySourceId, legacySourceId: data.legacySourceId, imported: isNew }) });
      }
      if (request.method() === 'POST' && url.pathname === '/api/feedback') {
        const data = JSON.parse(request.postData());
        const entry = { ...data, status: 'new', createdAt: new Date().toISOString() };
        if (!posts.some(post => post.id === entry.id)) posts.unshift(entry);
        return route.fulfill({ status: 201, headers, body: JSON.stringify(entry) });
      }
      if (request.method() === 'PATCH' && canAcknowledge) {
        const id = url.pathname.split('/')[3];
        const post = posts.find(value => value.id === id);
        if (post) post.status = JSON.parse(request.postData()).status;
        return route.fulfill({ status: 200, headers, body: JSON.stringify({ ok: true }) });
      }
      return route.fulfill({ status: 403, headers, body: '{}' });
    });
    const page = await context.newPage();
    await page.goto(`${base}/feedback`);
    return { page, context };
  }
  const partner = await visit(false);
  const owner = await visit(true);
  await partner.page.locator('#feedback-body').waitFor();
  if (await owner.page.getByTestId('feedback-import').count()) throw new Error('Import UI appears on ordinary route');
  if (await partner.page.locator('#feedback-invite-code').count() || await partner.page.getByText('참여하기', { exact: true }).count()) throw new Error('Invite UI remains');
  if (await partner.page.evaluate(() => localStorage.getItem('dos-feedback-space'))) throw new Error('Browser space was created');
  await partner.page.locator('#feedback-body').fill('A shared idea');
  await partner.page.getByRole('button', { name: '아이디어 저장하기' }).click();
  await partner.page.getByText('A shared idea', { exact: true }).waitFor();
  await owner.page.getByRole('button', { name: '새로고침' }).click();
  await owner.page.getByText('A shared idea', { exact: true }).waitFor();
  if (await partner.page.locator('.feedback-status-control select').count()) throw new Error('Partner can change status');
  await owner.page.locator('.feedback-status-control select').selectOption('done');
  await partner.page.getByRole('button', { name: '새로고침' }).click();
  await partner.page.locator('.feedback-entry .status-done').waitFor();
  await partner.page.reload();
  await partner.page.getByText('A shared idea', { exact: true }).waitFor();
  await partner.page.goto(`${base}/feedback?import=legacy`);
  await partner.page.waitForFunction(() => document.querySelector('#feedback-body')?.disabled === false);
  if (await partner.page.getByTestId('feedback-import').count()) throw new Error('Import UI appears for partner');
  await owner.page.goto(`${base}/feedback?import=legacy`);
  const importPanel = owner.page.getByTestId('feedback-import');
  await importPanel.waitFor();
  await importPanel.locator('summary').click();
  const sample = { legacySourceId: '11111111-1111-4111-8111-111111111111', category: 'other', title: 'Sample', body: 'Generic test content', status: 'new', createdAt: new Date().toISOString() };
  await owner.page.locator('#feedback-import-file').setInputFiles({ name: 'sample.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify([sample, { ...sample, legacySourceId: '22222222-2222-4222-8222-222222222222', body: '' }])) });
  await owner.page.getByRole('button', { name: '가져오기', exact: true }).click();
  await owner.page.getByTestId('feedback-import-counts').getByText('전체 2건 · 새로 저장 1건 · 이미 있음 0건 · 실패 1건').waitFor();
  await owner.page.getByText('Generic test content', { exact: true }).waitFor();
  await owner.page.getByRole('button', { name: '가져오기', exact: true }).click();
  await owner.page.getByTestId('feedback-import-counts').getByText('전체 2건 · 새로 저장 0건 · 이미 있음 1건 · 실패 1건').waitFor();
  if (imported.size !== 1) throw new Error('Retry made duplicate imported rows');
  const guest = await visit(false, true);
  await guest.page.getByText('공용 아이디어 보관함을 불러오지 못했어요.').waitFor();
  if (await guest.page.locator('.feedback-saved').count() || await guest.page.locator('#feedback-body').isEnabled()) throw new Error('Unauthenticated page appears writable');
  await Promise.all([partner.context.close(), owner.context.close(), guest.context.close()]);
  console.log(JSON.stringify({ passed: true, sharedReadWrite: true, ownerStatusOnly: true, ownerImportOnly: true, retryDeduplicated: true, noInvite: true, unauthenticatedDenied: true }));
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}

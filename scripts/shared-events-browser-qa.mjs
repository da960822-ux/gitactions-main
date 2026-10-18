import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const out = resolve(process.env.SHARED_QA_OUTPUT || `output/playwright/shared-events-${Date.now()}`);
const focus = process.env.SHARED_QA_FOCUS || 'full';
await mkdir(out, { recursive: true });
const report = { url: process.env.SHARED_QA_URL || 'http://localhost:5285/', checks: [], pageErrors: [], consoleErrors: [], networkFailures: [], httpErrors: [], screenshots: [] };
const startedAt = Date.now();
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
const contexts = [];
const wait = ms => new Promise(done => setTimeout(done, ms));
const check = (name, detail) => { report.checks.push({ name, passed: true, elapsedMs: Date.now() - startedAt, detail }); console.log(`PASS ${name}`); };
async function eventually(fn, label, timeout = 20_000) {
  const deadline = Date.now() + timeout; let last;
  while (Date.now() < deadline) { try { const result = await fn(); if (result) return result; } catch (error) { last = error.message; } await wait(120); }
  throw new Error(`${label}${last ? `: ${last}` : ''}`);
}
async function snapshot(page) {
  return page.evaluate(async () => {
    const url = performance.getEntriesByType('resource').find(entry => /\/src\/core\/sharedEventsClient\.ts(?:\?|$)/.test(entry.name))?.name;
    if (!url) return null;
    return (await import(url)).sharedEventsClient.getSnapshot();
  });
}
const panel = page => page.locator('.shared-events');
async function click(locator) {
  await locator.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await eventually(async () => await locator.isVisible() && await locator.isEnabled(), 'Control is not enabled');
  await wait(180);
  const box = await locator.boundingBox(); assert.ok(box, 'Control has no visible bounds');
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const hit = await locator.evaluate((element, point) => element.contains(document.elementFromPoint(point.x, point.y)), point);
  assert.ok(hit, 'Another element covers the requested UI control');
  await locator.page().mouse.click(point.x, point.y);
}
async function capture(pages, label) {
  for (let i = 0; i < pages.length; i++) { const file = resolve(out, `${label}-p${i + 1}.png`); await pages[i].screenshot({ path: file }); report.screenshots.push(file); }
}
try {
  for (const [index, width] of [1920, 1440].entries()) contexts.push(await browser.newContext({ viewport: { width, height: 1080 }, reducedMotion: index ? 'reduce' : 'no-preference', ...(index === 0 ? { recordVideo: { dir: out, size: { width: 1920, height: 1080 } } } : {}) }));
  const pages = await Promise.all(contexts.map(context => context.newPage()));
  for (const [index, page] of pages.entries()) {
    page.on('pageerror', error => report.pageErrors.push({ page: index + 1, message: error.message }));
    page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push({ page: index + 1, message: message.text() }); });
    page.on('requestfailed', request => report.networkFailures.push({ page: index + 1, url: request.url(), error: request.failure()?.errorText }));
    page.on('response', response => { if (response.status() >= 400) report.httpErrors.push({ page: index + 1, url: response.url(), status: response.status() }); });
  }
  await Promise.all(pages.map((page, index) => page.goto(index ? (process.env.SHARED_QA_PEER_URL || report.url) : report.url, { waitUntil: 'domcontentloaded', timeout: 90_000 })));
  console.log('Both actual main pages loaded');
  for (const page of pages) {
    await panel(page).waitFor({ state: 'attached', timeout: 60_000 });
    const skip = page.locator('.folded-skip'); if (await skip.isVisible()) await click(skip);
    await click(panel(page).locator('summary'));
  }
  const languageButton = pages[1].getByRole('button', { name: 'ES · RD', exact: true });
  await click(await languageButton.count() ? languageButton : pages[1].locator('.language-toggle'));
  const [p1, p2] = pages;
  async function joined() {
    if (await panel(p1).locator('.shared-events-leave').count()) {
      await click(panel(p1).locator('.shared-events-leave'));
      await eventually(async () => !(await snapshot(p2)), 'Other member did not clear deleted session');
    }
    await click(panel(p1).getByRole('button', { name: '초대 만들기', exact: true }));
    const invite = await eventually(async () => (await snapshot(p1))?.sessionId, 'No actual invite created');
    await panel(p2).locator('.shared-events-lobby input').fill(invite);
    await click(panel(p2).getByRole('button', { name: 'Entrar', exact: true }));
    await eventually(async () => (await snapshot(p1))?.memberCount === 2 && (await snapshot(p2))?.memberCount === 2, 'Member snapshots failed to converge via Realtime');
    const seats = await Promise.all(pages.map(async page => (await snapshot(page)).seat)); assert.deepEqual(seats, ['p1', 'p2']);
    return invite;
  }
  const invite = await joined();
  const identities = await Promise.all(pages.map(page => page.evaluate(async () => { const url = performance.getEntriesByType('resource').find(entry => /\/src\/core\/supabase\.ts(?:\?|$)/.test(entry.name))?.name; const { data } = await (await import(url)).onlineDb.auth.getSession(); return data.session.user.id; })));
  assert.notEqual(identities[0], identities[1]);
  check('Two isolated desktop browsers joined explicitly through the UI with distinct genuine authenticated identities', { invite, identities, viewports: [1920, 1440], reducedMotion: [false, true] });
  const eventNames = { R01: '봉투 같이 열기', R02: '장식 말 보내기', R03: '그림 반쪽 합치기', R04: '패턴 번갈아 맞추기' };
  async function choose(id) { await click(panel(p1).locator('.shared-event-choices').getByRole('button', { name: eventNames[id], exact: true })); }
  async function proposed(id) {
    await choose(id);
    await click(panel(p1).locator('.shared-draft-event > button'));
    await eventually(async () => (await snapshot(p2))?.round.eventId === id && (await snapshot(p2))?.round.status === 'proposed', `${id} proposal did not reach recipient`);
  }
  async function nextRound() {
    const value = await snapshot(p1);
    assert.equal(value.round.status, 'started');
    assert.equal(await panel(p1).locator('.shared-event-choices').count(), 1, 'A completed round must retain the next-round UI');
    await wait(Math.max(0, value.round.lastStartedAt + 30_050 - Date.now()));
  }
  async function consent() {
    await click(panel(p1).locator('.shared-round-actions').getByRole('button', { name: '동의하기', exact: true }));
    await eventually(async () => (await snapshot(p2))?.round.readyBy.p1, 'p1 ready not delivered');
    assert.equal((await snapshot(p2)).round.status, 'proposed');
    await click(panel(p2).locator('.shared-round-actions').getByRole('button', { name: 'Aceptar', exact: true }));
    await eventually(async () => (await snapshot(p1))?.round.readyBy.p2, 'p2 ready not delivered');
    await click(panel(p1).getByRole('button', { name: '한 번 더 확인하기', exact: true }));
    await eventually(async () => (await snapshot(p2))?.round.confirmBy.p1, 'p1 confirmation not delivered');
    const before = await Promise.all(pages.map(page => page.evaluate(() => ({ scroll: scrollY, opening: Number(document.querySelector('.post-hero-preview').dataset.opening) }))));
    await click(panel(p2).getByRole('button', { name: 'Confirmar una vez más', exact: true }));
    await eventually(async () => (await snapshot(p1))?.round.status === 'started' && (await snapshot(p2))?.round.status === 'started', 'Both confirmed browsers did not start');
    return before;
  }

  if (focus !== 'lifecycle') {
  for (const page of pages) {
    const control = page.locator('.letter-section-label button');
    await control.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await eventually(async () => Number(await page.locator('.post-hero-preview').getAttribute('data-opening')) > 0.99, 'Local letter did not open from ordinary scroll');
    await click(control);
    await eventually(async () => Number(await page.locator('.post-hero-preview').getAttribute('data-opening')) < 0.01, 'Actual local close button did not close letter');
  }
  await proposed('R01');
  const beforeOpen = await consent();
  assert.ok(beforeOpen.every(value => value.opening < 0.01), 'Both local letters must be visibly closed before joint confirmation');
  await eventually(async () => (await Promise.all(pages.map(page => page.locator('.post-hero-preview').getAttribute('data-opening')))).every(value => Number(value) > 0.99), 'R01 did not open the existing letter controller', 20_000);
  const afterOpen = await Promise.all(pages.map(page => page.evaluate(() => ({ scroll: scrollY, opening: Number(document.querySelector('.post-hero-preview').dataset.opening) }))));
  assert.equal(afterOpen[0].scroll, beforeOpen[0].scroll);
  check('R01 opens the actual existing letter on both browsers; p1 scroll stays local and p2 reduced motion settles', { beforeOpen, afterOpen });
  await capture(pages, 'r01-complete');
  }

  if (focus === 'full') {
  await nextRound();
  await choose('R02');
  await click(panel(p1).locator('.shared-prop-picker button').first());
  await proposed('R02');
  await capture(pages, 'r02-departure');
  await consent();
  await capture(pages, 'r02-mid-traverse');
  await eventually(async () => await panel(p1).locator('.shared-delivery.is-complete').count(), 'R02 prop never arrived');
  await wait(1_300); await capture(pages, 'r02-arrived');
  check('R02 recipient explicitly accepts and the approved pawn reaches its arrival pose');

  await nextRound();
  await choose('R03');
  await click(panel(p1).locator('.shared-drawing-fallback > summary'));
  for (const index of [1, 7, 13, 19, 25]) await click(panel(p1).getByRole('button', { name: `점 추가 ${index}`, exact: true }));
  await proposed('R03');
  const board = await panel(p2).locator('svg.shared-drawing').boundingBox(); assert.ok(board);
  await panel(p2).locator('svg.shared-drawing').evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  for (const [x, y] of [[0.95, 0.05], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.05, 0.95]]) {
    const current = await panel(p2).locator('svg.shared-drawing').boundingBox(); await p2.mouse.click(current.x + current.width * x, current.y + current.height * y);
  }
  await click(panel(p2).getByRole('button', { name: 'Enviar mi mitad', exact: true }));
  await eventually(async () => Boolean((await snapshot(p1))?.round.intentBy.p2), 'Recipient drawing not delivered');
  const drawing = (await snapshot(p1)).round.intentBy;
  assert.equal(drawing.p1.points.length, 5); assert.equal(drawing.p2.points.length, 5); assert.notDeepEqual(drawing.p1, drawing.p2);
  await consent(); await capture(pages, 'r03-mid-fold'); await wait(1_300); await capture(pages, 'r03-card');
  const halves = await Promise.all(pages.map(page => panel(page).locator('.shared-card-outcome svg polyline').evaluateAll(nodes => nodes.map(node => node.getAttribute('points')))));
  assert.deepEqual(halves[0], halves[1]); assert.notEqual(halves[0][0], halves[0][1]);
  check('R03 uses two genuinely different user-drawn halves and produces the same p1-left/p2-right card in both browsers');

  await nextRound();
  await choose('R04');
  for (const step of [1, 3, 2]) await click(panel(p1).locator('.shared-pattern-tools .shared-pattern-builder button').filter({ hasText: new RegExp(`^${step}$`) }));
  await proposed('R04');
  for (const step of [6, 5, 4]) await click(panel(p2).locator('.shared-pattern-tools .shared-pattern-builder button').filter({ hasText: new RegExp(`^${step}$`) }));
  await click(panel(p2).getByRole('button', { name: 'Enviar patrón', exact: true }));
  await eventually(async () => Boolean((await snapshot(p1))?.round.intentBy.p2), 'Recipient pattern not delivered');
  for (const step of [1, 1, 1]) await click(panel(p1).locator('.shared-pattern-turns > .shared-pattern-builder button').filter({ hasText: new RegExp(`^${step}$`) }));
  assert.equal((await snapshot(p1)).round.ackBy.p1, undefined);
  assert.ok(await panel(p1).locator('[role="alert"]').isVisible());
  for (const [index, sequence] of [[0, [6, 5, 4]], [1, [1, 3, 2]]]) {
    for (const step of sequence) await click(panel(pages[index]).locator('.shared-pattern-turns > .shared-pattern-builder button').filter({ hasText: new RegExp(`^${step}$`) }));
    await eventually(async () => (await snapshot(pages[index])).round.ackBy[index ? 'p2' : 'p1'], 'User-entered exact repeat was not acknowledged');
  }
  await consent();
  await click(panel(p1).locator('.shared-pattern-turn button').first());
  await eventually(async () => await panel(p1).locator('.shared-pattern-machine .is-active').count(), 'No real pattern playback light');
  await capture(pages, 'r04-pattern-light');
  check('R04 rejects a wrong user repeat, accepts both exact user repeats and plays the actual contributed pattern lights');
  }

  if (focus !== 'r01') {
  await joined(); await proposed('R01');
  await click(panel(p1).locator('.shared-round-actions').getByRole('button', { name: '동의하기', exact: true }));
  await click(panel(p2).getByRole('button', { name: 'Cancelar', exact: true }));
  await eventually(async () => (await snapshot(p1)).round.status === 'cancelled', 'Recipient cancel not delivered');
  await wait(900); assert.equal((await snapshot(p1)).round.startAt, null);
  check('Recipient cancellation clears pending shared start on both browsers');
  await proposed('R01');
  await click(panel(p1).locator('summary'));
  await eventually(async () => (await snapshot(p2)).round.status === 'cancelled', 'Collapsing panel left pending shared consent');
  await click(panel(p1).locator('summary'));
  await eventually(async () => (await snapshot(p1)).connection === 'connected', 'Reopening did not explicitly resume');
  check('Collapsing the disclosure cancels pending sharing; reopening resumes from current snapshot');
  await proposed('R01');
  await contexts[1].setOffline(true);
  await eventually(async () => (await snapshot(p1)).round.status === 'cancelled', 'Offline member lease did not cancel', 18_000);
  await contexts[1].setOffline(false);
  await click(panel(p2).getByRole('button', { name: 'Revisar estado actual', exact: true }));
  await eventually(async () => (await snapshot(p2)).round.status === 'cancelled', 'Reconnect did not snapshot current cancelled state');
  check('Actual offline/reconnect snapshots the cancelled round and does not replay it');

  await click(panel(p1).locator('.shared-events-leave'));
  await eventually(async () => !(await snapshot(p2)), 'Peer session deletion not delivered');
  assert.equal(await panel(p2).locator('.shared-combined-card').count(), 0);
  check('Other member closing the session removes shared drawing/pattern content from the recipient UI');
  } else {
    await click(panel(p1).locator('.shared-events-leave'));
    await contexts[1].close();
    await p1.locator('#papi-letter').evaluate(element => { const y = scrollY + element.getBoundingClientRect().top + element.clientHeight / 2 - innerHeight / 2; scrollTo({ top: y, behavior: 'instant' }); });
    await wait(2_500);
    report.reading = await p1.evaluate(() => ({ opening: Number(document.querySelector('.post-hero-preview').dataset.opening), progress: Number(document.querySelector('.post-hero-preview').dataset.progress), paragraphs: document.querySelectorAll('.letter-paper > p:not(.letter-address):not(.letter-signature)').length, roses: [...document.querySelectorAll('.reading-roses')].map(element => { const r = element.getBoundingClientRect(); const style = getComputedStyle(element); return { x: r.x, y: r.y, width: r.width, height: r.height, display: style.display, background: style.backgroundImage, zIndex: style.zIndex, hit: element.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)) }; }) }));
    await capture([p1], 'actual-main-reading');
    const rose = p1.locator('.reading-roses-left');
    if (await rose.count()) { await click(rose); await wait(2_000); await capture([p1], 'actual-main-rose-hint'); }
    await click(p1.locator('.letter-section-label button'));
    await eventually(async () => Number(await p1.locator('.post-hero-preview').getAttribute('data-opening')) < 0.01, 'Actual main letter close failed');
    await wait(1_000); await capture([p1], 'actual-main-letter-closed');
    await p1.locator('.ending').evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await wait(3_000); await capture([p1], 'actual-main-ending');
    check('Actual main letter read, rose control, close and ending inspected', report.reading);
  }
  report.passed = true;
} catch (error) {
  report.passed = false; report.failure = error.stack || String(error); console.error(report.failure);
  for (const context of contexts) for (const page of context.pages()) { try { const file = resolve(out, `failure-${contexts.indexOf(context) + 1}.png`); await page.screenshot({ path: file }); report.screenshots.push(file); } catch {} }
  process.exitCode = 1;
} finally {
  await Promise.all(contexts.map(context => context.close())); await browser.close();
  await writeFile(resolve(out, 'report.json'), JSON.stringify(report, null, 2)); console.log(`QA report: ${out}/report.json`);
}

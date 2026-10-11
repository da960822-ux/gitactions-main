import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChromium } from './playwright-browser.mjs';

// Component fixtures verify notice lifecycle/layout; they are not gameplay or
// deployed multiplayer evidence, and never write to a room or game client.
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = process.env.JAIPUR_QA_URL || 'http://127.0.0.1:5191';
const output = process.env.JAIPUR_QA_OUTPUT || path.join(repo, 'output/playwright/jaipur-notice-final');
await fs.mkdir(output, { recursive: true });
const browser = await launchChromium();
const reports = [];

async function inspect(language, reduced, width) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  const report = { language, reduced, width, kind: 'component fixture — not gameplay', pageErrors };
  const captureName = `${language}-${width}-${reduced ? 'reduced' : 'normal'}`;
  try {
    await page.goto(url);
    await page.evaluate(async language => {
      const reactModule = await import('/node_modules/.vite/deps/react.js');
      const React = reactModule.default ?? reactModule;
      const domModule = await import('/node_modules/.vite/deps/react-dom_client.js');
      const { createRoot } = domModule.default ?? domModule;
      const { JaipurBoard } = await import('/src/app/JaipurBoard.tsx');
      document.getElementById('root').style.display = 'none';
      const node = document.createElement('div');
      node.id = 'qa-notice-root';
      node.style.cssText = 'padding:12px;max-width:1440px;margin:auto';
      document.body.append(node);
      const root = createRoot(node);
      const event = (sequence, type, round = 1, winner = 'p1') => ({ sequence, round, type, actor: 'p1', title: {
        ko: type === 'bonus' ? '3장 판매 보너스 공개' : type === 'win' ? '두 라운드 승리' : '최근 거래',
        es: type === 'bonus' ? 'Bono por vender 3 cartas' : type === 'win' ? 'Ganaste dos rondas' : 'Actividad reciente',
      }, ...(type === 'bonus' ? { bonus: { size: 3, value: 2 } } : {}), ...(type === 'win' ? { winner } : {}) });
      const old = [event(1, 'round-start'), event(2, 'bonus'), event(3, 'take-single')];
      const state = { key: 0, playerId: 'p1', events: old, round: 1 };
      const render = () => root.render(React.createElement(JaipurBoard, {
        key: state.key, playerId: state.playerId, language, runAction: () => { throw Error('Fixtures must not submit gameplay actions'); },
        view: { turn: 'p1', phase: 'choose', ownHand: ['silver', 'silver', 'cloth'], opponentCount: 2, actions: [], log: [...state.events], board: {
          round: state.round, market: ['diamond', 'leather', 'leather', 'gold', 'cloth'], deckCount: 22,
          tokens: { p1: 40, p2: 35 }, herdCounts: { p1: 5, p2: 3 }, roundsWon: { p1: 0, p2: 0 }, camelBadges: { p1: 0, p2: 0 },
          piles: { diamond: [5, null], gold: [5, null], silver: [5], cloth: [2], spice: [3], leather: [1] }, bonusTileCounts: { 3: 5, 4: 5, 5: 5 },
        } },
      }));
      const timings = {};
      let active = null;
      const sample = () => {
        const note = node.querySelector('.jaipur-event-note');
        const next = note?.getAttribute('data-jaipur-notice-sequence') ?? null;
        if (next !== active) {
          if (active) timings[active].end = performance.now();
          if (next) timings[next] = { start: performance.now() };
          active = next;
        }
      };
      new MutationObserver(sample).observe(node, { childList: true, subtree: true, attributes: true });
      window.jaipurNoticeQA = { state, event, old, render, timings };
      render();
    }, language);
    await page.locator('.jaipur-board').waitFor();
    await page.waitForTimeout(80);
    assert.equal(await page.locator('.jaipur-event-note').count(), 0, 'snapshot bonus must be silent');
    await page.evaluate(() => { const q = window.jaipurNoticeQA; q.state.key++; q.render(); });
    await page.waitForTimeout(80);
    assert.equal(await page.locator('.jaipur-event-note').count(), 0, 'same-snapshot reconnect must be silent');
    await page.evaluate(() => { const q = window.jaipurNoticeQA; q.state.playerId = 'p2'; q.render(); });
    await page.waitForTimeout(80);
    assert.equal(await page.locator('.jaipur-event-note').count(), 0, 'viewer switch must be silent');
    await page.evaluate(() => { const q = window.jaipurNoticeQA; q.state.playerId = 'p1'; q.render(); });
    await page.waitForTimeout(80);
    await page.evaluate(() => { const q = window.jaipurNoticeQA; q.state.events.push(q.event(4, 'bonus')); q.render(); });
    await page.locator('[data-jaipur-notice-sequence="4"]').waitFor();
    report.layout = await page.evaluate(() => {
      const rect = el => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
      const note = rect(document.querySelector('.jaipur-event-note'));
      const targets = ['.jp-round-pill', '.jp-player-hand', '.jp-action-tray', '.jp-market-footer', '.jp-scorebar'].map(selector => {
        const el = document.querySelector(selector); if (!el) return { selector, missing: true };
        const box = rect(el);
        return { selector, box, overlap: Math.max(0, Math.min(note.right, box.right) - Math.max(note.left, box.left)) * Math.max(0, Math.min(note.bottom, box.bottom) - Math.max(note.top, box.top)) };
      });
      const board = document.querySelector('.jaipur-board');
      const style = getComputedStyle(board);
      return { note, targets, board: rect(board), scrollWidth: document.documentElement.scrollWidth, gridColumns: style.gridTemplateColumns, gridAreas: style.gridTemplateAreas,
        round: document.querySelector('.jp-round-pill').textContent, railGridArea: getComputedStyle(document.querySelector('.jaipur-notice-rail')).gridArea };
    });
    report.layout.targets.forEach(target => assert.equal(target.overlap, 0, `${target.selector} must remain uncovered`));
    if (width === 390) {
      assert.ok(report.layout.scrollWidth <= width, 'mobile board must stay within 390 px');
      assert.equal(report.layout.gridColumns.split(/\s+/).length, 1, 'mobile notice must not create implicit columns');
      assert.equal(report.layout.gridAreas, 'none');
      assert.ok(!report.layout.railGridArea.includes('notice'), 'named notice area is desktop only');
    }
    await page.screenshot({ path: path.join(output, `${captureName}-bonus.png`), fullPage: width === 390 });
    // A later action must not renew the bonus notice's sequence deadline.
    await page.evaluate(() => { const q = window.jaipurNoticeQA; q.state.events.push(q.event(5, 'take-single')); q.render(); });
    await page.locator('[data-jaipur-notice-sequence="4"]').waitFor({ state: 'detached', timeout: 4000 });
    report.bonusMs = await page.evaluate(() => { const t = window.jaipurNoticeQA.timings[4]; return t.end - t.start; });
    assert.ok(report.bonusMs >= 2500 && report.bonusMs < 3200, `bonus expiry ${report.bonusMs} ms`);
    await page.evaluate(() => { const q = window.jaipurNoticeQA; q.state.events.push(q.event(6, 'win')); q.render(); });
    await page.locator('[data-jaipur-notice-sequence="6"]').waitFor();
    const outcome = () => page.locator('.jaipur-event-note').evaluate(note => ({ title: note.querySelector('strong').textContent, winning: note.classList.contains('is-win'), confetti: note.querySelectorAll('.jaipur-win-confetti').length }));
    report.winner = await outcome();
    assert.equal(report.winner.title, language === 'ko' ? '경기에서 이겼어요!' : '¡Ganaste la partida!');
    assert.equal(report.winner.winning, true);
    assert.equal(report.winner.confetti, reduced ? 0 : 1);
    await page.locator('[data-jaipur-notice-sequence="6"]').waitFor({ state: 'detached', timeout: 5500 });
    report.winMs = await page.evaluate(() => { const t = window.jaipurNoticeQA.timings[6]; return t.end - t.start; });
    assert.ok(report.winMs >= 4400 && report.winMs < 5100, `win expiry ${report.winMs} ms`);
    await page.evaluate(() => { const q = window.jaipurNoticeQA; q.state.events.push(q.event(7, 'win', 1, 'p2')); q.render(); });
    await page.locator('[data-jaipur-notice-sequence="7"]').waitFor();
    report.loser = await outcome();
    assert.equal(report.loser.title, language === 'ko' ? '상대가 이겼어요.' : 'Ganó tu pareja.');
    assert.equal(report.loser.winning, false);
    assert.equal(report.loser.confetti, 0);
    await page.screenshot({ path: path.join(output, `${captureName}-loss.png`), fullPage: width === 390 });
    await page.evaluate(() => { const q = window.jaipurNoticeQA; q.state.events.push(q.event(8, 'win', 1, 'draw')); q.render(); });
    await page.locator('[data-jaipur-notice-sequence="8"]').waitFor();
    report.draw = await outcome();
    assert.equal(report.draw.title, language === 'ko' ? '경기 무승부' : 'Partida empatada');
    assert.equal(report.draw.winning, false);
    assert.equal(report.draw.confetti, 0);
    await page.evaluate(() => { const q = window.jaipurNoticeQA; q.state.events = [q.event(1, 'bonus')]; q.render(); });
    await page.waitForTimeout(80);
    assert.equal(await page.locator('.jaipur-event-note').count(), 0, 'sequence reset is a silent historical baseline');
    await page.evaluate(() => { const q = window.jaipurNoticeQA; q.state.round = 2; q.state.events.push(q.event(2, 'round-end', 1), q.event(3, 'round-start', 2)); q.render(); });
    await page.waitForTimeout(350);
    assert.equal(await page.locator('.jaipur-event-note').count(), 0, 'previous-round settlement stays in history');
    assert.deepEqual(pageErrors, []);
    report.ok = true;
  } catch (error) {
    report.ok = false; report.error = error.stack;
    await page.screenshot({ path: path.join(output, `${captureName}-failure.png`) });
  } finally { await context.close(); reports.push(report); }
}

try { await Promise.all(['ko', 'es'].flatMap(language => [false, true].flatMap(reduced => [1440, 390].map(width => inspect(language, reduced, width))))); }
finally { await fs.writeFile(path.join(output, 'notice.json'), JSON.stringify(reports, null, 2)); await browser.close(); }
console.log(JSON.stringify(reports, null, 2));
assert.ok(reports.every(report => report.ok), 'Jaipur notice component checks failed; inspect notice.json');

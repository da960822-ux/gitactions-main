import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { launchChromium } from './playwright-browser.mjs';

const base = process.env.QUALITY_PREVIEW_URL || 'http://127.0.0.1:5194';
const output = 'output/playwright/game-quality/performance';
await fs.mkdir(output, { recursive: true });
const browser = await launchChromium();
const reports = [], errors = [];
try {
  for (const game of ['domino', 'jaipur', 'splendor']) {
    for (const language of ['ko', 'es']) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await context.addInitScript(value => localStorage.setItem('dos-language', value), language);
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(new URL(`/play?game=${game}`, base).href);
      await page.locator('#nickname').fill('Performance review');
      await page.locator('.lobby-actions > button').click();
      await page.waitForURL('**/room/**');
      await page.locator('.demo-banner select').selectOption('p2');
      await page.locator('.room-game-card').filter({ hasText: ({ domino: /도미노|Dominó/, jaipur: /자이푸르|Jaipur/, splendor: /스플렌더|Splendor/ })[game] }).click();
      await page.locator('.demo-banner select').selectOption('p1');
      await page.locator('#game-board').waitFor();
      const selector = ({ domino: '.dp-hand-tile:not([disabled])', jaipur: '.jp-market-card:not([disabled])', splendor: '.sp-card[data-source-zone="market"]' })[game];
      if (game === 'domino' && await page.locator(selector).count() === 0) {
        await page.locator('.demo-banner select').selectOption('p2');
      }
      await page.locator(selector).first().waitFor();
      await page.waitForFunction(() => [...document.querySelectorAll('#game-board img')].every(image => image.complete && image.naturalWidth > 0));
      await page.evaluate(selector => {
        window.qualityPerformance = { samples: [], longTasks: [], frameIntervals: [] };
        const records = window.qualityPerformance;
        const observer = new PerformanceObserver(list => records.longTasks.push(...list.getEntries().map(entry => entry.duration)));
        observer.observe({ type: 'longtask' });
        let lastFrame;
        const frame = now => {
          if (lastFrame !== undefined) records.frameIntervals.push(now - lastFrame);
          lastFrame = now;
          requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
        document.addEventListener('click', event => {
          const target = event.target.closest(selector);
          if (!target || target.getAttribute('aria-pressed') === 'true') return;
          const start = performance.now();
          const changes = new MutationObserver(() => {
            if (target.getAttribute('aria-pressed') !== 'true') return;
            changes.disconnect();
            const domMs = performance.now() - start;
            requestAnimationFrame(() => records.samples.push({ domMs, nextFrameMs: performance.now() - start }));
          });
          changes.observe(document.getElementById('game-board'), { attributes: true, subtree: true });
        }, true);
      }, selector);
      const session = await context.newCDPSession(page);
      await session.send('Performance.enable');
      const before = await session.send('Performance.getMetrics');
      for (let index = 0; index < 8; index++) {
        await page.locator(selector).first().click();
        await page.waitForFunction(count => window.qualityPerformance.samples.length === count, index + 1);
        await page.keyboard.press('Escape');
        await page.waitForFunction(selector => document.querySelector(selector)?.getAttribute('aria-pressed') !== 'true', selector);
      }
      const after = await session.send('Performance.getMetrics');
      const evidence = await page.evaluate(() => window.qualityPerformance);
      assert.equal(evidence.samples.length, 8);
      assert(evidence.samples.every(sample => Number.isFinite(sample.domMs) && sample.domMs >= 0 && Number.isFinite(sample.nextFrameMs)));
      const durations = evidence.samples.map(sample => sample.domMs).sort((a, b) => a - b);
      const metrics = Object.fromEntries(['ScriptDuration', 'LayoutDuration', 'RecalcStyleDuration', 'TaskDuration'].map(name => [name, (after.metrics.find(metric => metric.name === name)?.value ?? 0) - (before.metrics.find(metric => metric.name === name)?.value ?? 0)]));
      reports.push({ game, language, ...evidence, domP50Ms: durations[3], domMaxMs: durations[7], metrics });
      await context.close();
    }
  }
  assert.deepEqual(errors, []);
  const report = { environment: 'Local production preview, headless Chromium, same-browser demo, shared cloud host', measurement: 'Click capture to selected DOM mutation; nextFrameMs is the next requestAnimationFrame callback, not a physical display or paint-completion measurement. Repeated selection/cancel only; not a complete match or internet latency benchmark.', reports, errors };
  await fs.writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }

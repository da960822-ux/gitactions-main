import fs from 'node:fs/promises';
import { launchChromium } from './playwright-browser.mjs';

const browser = await launchChromium();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const checks = [];
try {
  await page.goto(process.env.LANDING_URL || 'http://127.0.0.1:5191/');
  await page.evaluate(async () => {
    const { GameValue } = await import('/src/app/GameValue.tsx');
    const { createElement } = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const host = document.createElement('div');
    host.id = 'value-proof';
    document.body.append(host);
    const root = createRoot(host);
    window.renderValueProof = (value, resetKey) => root.render(createElement(GameValue, { value, resetKey }));
    window.unmountValueProof = () => root.unmount();
    window.renderValueProof(10,'p1:round1');
  });
  await page.waitForFunction(() => document.querySelector('#value-proof .game-value-number')?.textContent === '10');
  const delta = page.locator('#value-proof .game-value-delta');
  checks.push({ name: 'initial value has no invented delta', pass: await delta.count() === 0 });
  await page.evaluate(() => window.renderValueProof(15,'p1:round1'));
  await page.waitForFunction(() => document.querySelector('#value-proof .game-value-delta')?.textContent === '+5');
  checks.push({ name: 'confirmed increase displays signed +5', pass: await delta.textContent() === '+5' });
  await page.evaluate(() => window.renderValueProof(40,'p2:round1'));
  await page.waitForFunction(() => document.querySelector('#value-proof .game-value-number')?.textContent === '40');
  const resetSnapshot = await delta.count() ? await delta.textContent() : null;
  checks.push({ name: 'seat reset immediately suppresses previous delta', pass: resetSnapshot === null });
  await page.evaluate(() => window.renderValueProof(37,'p2:round1'));
  await page.waitForFunction(() => document.querySelector('#value-proof .game-value-delta')?.textContent === '−3');
  checks.push({ name: 'decrease displays signed minus and state class', pass: await delta.textContent() === '−3' && await delta.getAttribute('class') === 'game-value-delta is-negative' });
  await page.waitForFunction(() => !document.querySelector('#value-proof .game-value-delta'));
  checks.push({ name: 'transient delta expires without persistent animation', pass: await delta.count() === 0 });
  await page.evaluate(() => window.renderValueProof(0,'p2:round2'));
  await page.waitForFunction(() => document.querySelector('#value-proof .game-value-number')?.textContent === '0');
  checks.push({ name: 'round reset has no fake penalty', pass: await delta.count() === 0 });
  await page.evaluate(() => window.unmountValueProof());
  checks.push({ name: 'unmount releases value component', pass: await page.locator('#value-proof .game-value').count() === 0 });
} catch (error) { errors.push(String(error)); }
finally { await browser.close(); }
const report = { checks, errors, summary: { total: checks.length, passed: checks.filter(item => item.pass).length, failed: checks.filter(item => !item.pass).length } };
await fs.mkdir('output/playwright/game-polish', { recursive: true });
await fs.writeFile('output/playwright/game-polish/game-value.json', JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
if (errors.length || report.summary.failed) process.exitCode = 1;

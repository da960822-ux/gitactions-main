import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.PREVIEW_URL || 'http://127.0.0.1:4179/';
const output = path.resolve('output/playwright/stage-review');
const viewport = { width: 1600, height: 1000 };
await fs.mkdir(output, { recursive: true });

const source = await fs.readFile('../src/copy/home.ts', 'utf8');
const bodyBlocks = [...source.matchAll(/letterBody:\s*\[([\s\S]*?)\]/g)];
assert.equal(bodyBlocks.length, 2, 'Expected Korean and Spanish letter sources');
const letterBodies = bodyBlocks.map(([, body]) => [...body.matchAll(/'((?:\\.|[^'\\])*)'/g)].map(([, value]) => value.replace(/\\'/g, "'").replace(/\\n/g, '\n')));
assert.equal(letterBodies[0].length, 5);
assert.equal(letterBodies[1].length, 5);

const report = {
  baseURL,
  viewport,
  captures: [],
  checks: [],
  pageErrors: [],
  limitations: ['Screenshots need a human visual review; bounding boxes cannot assess faces or art direction.', 'This preview does not include the pending approved pawn, joker, or noble assets.'],
};
const check = (name, pass, details = '') => {
  report.checks.push({ name, pass: Boolean(pass), details });
  assert.ok(pass, `${name}${details ? `: ${details}` : ''}`);
};
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

try {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('pageerror', error => report.pageErrors.push(error.message));
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('main')?.dataset.sceneReady === 'true', undefined, { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);

  async function positionAtPose(selector, expectedP) {
    await page.evaluate(({ selector }) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`Missing stage selector: ${selector}`);
      window.scrollTo({ top: element.getBoundingClientRect().top + scrollY - innerHeight * 0.18, behavior: 'instant' });
    }, { selector });
    await page.waitForFunction((expected) => Math.abs(Number(document.querySelector('main')?.dataset.progress) - expected) < 0.015, expectedP, { timeout: 15000 });
    await page.waitForTimeout(120);
  }

  async function capture(name, stage, expectedP, stageSelector) {
    const details = await page.evaluate(({ stage, expectedP, stageSelector }) => {
      const main = document.querySelector('main');
      const scene = document.querySelector('.post-hero-scene');
      const storyElement = document.querySelector(stageSelector);
      const copy = storyElement?.querySelector('.chapter-copy, .ending-copy');
      const bounds = copy?.getBoundingClientRect();
      const dataset = scene?.dataset;
      return {
        stage,
        expectedP,
        actualP: Number(main?.dataset.progress),
        q: Number(main?.dataset.opening),
        scrollY,
        overflowX: document.documentElement.scrollWidth > innerWidth,
        copyBounds: bounds ? { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, top: bounds.top, right: bounds.right, bottom: bounds.bottom } : null,
        copyInViewport: Boolean(bounds && bounds.left >= 0 && bounds.right <= innerWidth && bounds.top >= 0 && bounds.bottom <= innerHeight),
        scene: {
          ready: main?.dataset.sceneReady === 'true',
          stage: dataset?.stage ?? null,
          lightSignature: dataset?.lightSignature ?? null,
          floorColor: dataset?.floorColor ?? null,
          cameraZ: dataset?.cameraZ ?? null,
          flapAngle: dataset?.flapAngle ?? null,
          insertY: dataset?.insertY ?? null,
          topFoldAngle: dataset?.topFoldAngle ?? null,
          bottomFoldAngle: dataset?.bottomFoldAngle ?? null,
          paperVisible: dataset?.paperVisible ?? null,
        },
        anchorPose: storyElement?.getAttribute('data-pose') ?? null,
      };
    }, { stage, expectedP, stageSelector });
    check(`${stage}: progress reached expected anchor`, Math.abs(details.actualP - expectedP) < 0.015, `actual=${details.actualP}`);
    check(`${stage}: no horizontal overflow`, !details.overflowX);
    check(`${stage}: chapter copy fits viewport`, details.copyInViewport, JSON.stringify(details.copyBounds));
    check(`${stage}: WebGL scene ready`, details.scene.ready);
    const screenshot = `${name}.png`;
    await page.screenshot({ path: path.join(output, screenshot), fullPage: false, animations: 'disabled' });
    report.captures.push({ screenshot, ...details });
  }

  await positionAtPose('#distance', 0.22);
  await capture('01-distance-ko', 'distance', 0.22, '#distance');

  await positionAtPose('.play-table', 0.45);
  await capture('02-play-ko', 'play-table', 0.45, '.play-table');

  await positionAtPose('#letter-scene', 0.62);
  await page.locator('#letter-scene').getByRole('button', { name: '편지 열기', exact: true }).click();
  await page.waitForFunction(() => Number(document.querySelector('main')?.dataset.opening) > 0.98, undefined, { timeout: 60000 });
  await positionAtPose('#letter-scene', 0.62);
  await page.waitForTimeout(120);
  await capture('03-opened-letter-ko', 'opened-3d-letter', 0.62, '#letter-scene');

  await page.getByRole('link', { name: '편지 읽기', exact: true }).first().click();
  await page.waitForFunction(() => !document.querySelector('#moment-letter-copy')?.hidden);
  await page.waitForFunction(() => Number(document.querySelector('main')?.dataset.progress) > 0.8);
  check('KO original letter has one DOM copy', await page.locator('#moment-letter-copy').count() === 1);
  for (const paragraph of letterBodies[0]) {
    check('KO original paragraph preserved', await page.locator('#moment-letter-copy').getByText(paragraph, { exact: true }).count() === 1, paragraph);
  }
  const koLetter = await page.evaluate(() => {
    const main = document.querySelector('main');
    const scene = document.querySelector('.post-hero-scene');
    const dataset = scene?.dataset;
    return {
      stage: 'read-dom-ko', actualP: Number(main?.dataset.progress), q: Number(main?.dataset.opening), scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth,
      visible: Boolean(document.querySelector('#moment-letter-copy') && !document.querySelector('#moment-letter-copy')?.hidden),
      scene: { ready: main?.dataset.sceneReady === 'true', stage: dataset?.stage ?? null, lightSignature: dataset?.lightSignature ?? null, floorColor: dataset?.floorColor ?? null, cameraZ: dataset?.cameraZ ?? null, paperVisible: dataset?.paperVisible ?? null },
    };
  });
  check('KO read DOM: no horizontal overflow', !koLetter.overflowX);
  check('KO read DOM: source is visible', koLetter.visible);
  check('KO read DOM: WebGL scene ready', koLetter.scene.ready);
  await page.screenshot({ path: path.join(output, '04-read-dom-ko.png'), fullPage: false, animations: 'disabled' });
  report.captures.push({ screenshot: '04-read-dom-ko.png', ...koLetter });

  await page.getByRole('button', { name: 'Cambiar a español' }).click();
  await page.getByRole('link', { name: 'Leer la carta', exact: true }).first().click();
  await page.waitForFunction(() => !document.querySelector('#moment-letter-copy')?.hidden);
  check('ES original letter has one DOM copy', await page.locator('#moment-letter-copy').count() === 1);
  for (const paragraph of letterBodies[1]) {
    check('ES original paragraph preserved', await page.locator('#moment-letter-copy').getByText(paragraph, { exact: true }).count() === 1, paragraph);
  }
  const esLetter = await page.evaluate(() => {
    const main = document.querySelector('main');
    const scene = document.querySelector('.post-hero-scene');
    const dataset = scene?.dataset;
    return {
      stage: 'read-dom-es', actualP: Number(main?.dataset.progress), q: Number(main?.dataset.opening), scrollY,
      overflowX: document.documentElement.scrollWidth > innerWidth,
      visible: Boolean(document.querySelector('#moment-letter-copy') && !document.querySelector('#moment-letter-copy')?.hidden),
      scene: { ready: main?.dataset.sceneReady === 'true', stage: dataset?.stage ?? null, lightSignature: dataset?.lightSignature ?? null, floorColor: dataset?.floorColor ?? null, cameraZ: dataset?.cameraZ ?? null, paperVisible: dataset?.paperVisible ?? null },
    };
  });
  check('ES read DOM: no horizontal overflow', !esLetter.overflowX);
  check('ES read DOM: source is visible', esLetter.visible);
  check('ES read DOM: WebGL scene ready', esLetter.scene.ready);
  await page.screenshot({ path: path.join(output, '05-read-dom-es.png'), fullPage: false, animations: 'disabled' });
  report.captures.push({ screenshot: '05-read-dom-es.png', ...esLetter });

  await positionAtPose('.ending', 1);
  await page.locator('.ending').evaluate(el => window.scrollTo({top: el.getBoundingClientRect().top + scrollY, behavior: 'instant'}));
  await page.waitForTimeout(150);
  await capture('06-ending-es', 'ending', 1, '.ending');
  check('No page errors', report.pageErrors.length === 0, report.pageErrors.join('; '));
  await context.close();
} finally {
  await browser.close();
  await fs.writeFile(path.join(output, 'stage-review.json'), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify({ output, captures: report.captures.length, checks: report.checks.length, failed: report.checks.filter(item => !item.pass).length, pageErrors: report.pageErrors }, null, 2));

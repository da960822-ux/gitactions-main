import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { launchChromium } from './playwright-browser.mjs';

const base = process.env.HOME_UI_URL || 'http://127.0.0.1:5233';
const out = process.env.HOME_VIDEO_OUTPUT || 'output/home-motion';
const run = promisify(execFile), browser = await launchChromium();
await fs.mkdir(out, { recursive: true });
for (const mode of ['software', 'webgl-diagnostic']) {
  const dir = path.join(out, mode), frames = [], marks = [], errors = [], observations = [];
  await fs.mkdir(dir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => errors.push(error.message));
  if (mode === 'webgl-diagnostic') await page.addInitScript(() => {
    const parameter = WebGL2RenderingContext.prototype.getParameter;
    WebGL2RenderingContext.prototype.getParameter = function(value) { return value === 37446 ? 'Diagnostic hardware selector' : parameter.call(this, value); };
  });
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  await page.locator(mode === 'software' ? '.rd-raster-scene[data-ready="true"]' : '.rd-hero canvas[data-ready="true"]').waitFor({ timeout: 90000 });
  await page.waitForFunction(() => [...document.querySelectorAll('.rd-hero img')].every(image => image.complete && image.naturalWidth));
  await page.mouse.move(500, 35);
  await page.waitForTimeout(2200);
  const cdp = await page.context().newCDPSession(page), start = Date.now();
  let writes = Promise.resolve(), accept = true;
  cdp.on('Page.screencastFrame', event => {
    if (accept) {
      const file = `frame-${String(frames.length).padStart(6, '0')}.jpg`;
      frames.push({ file, timestamp: event.metadata.timestamp, received: (Date.now() - start) / 1000 });
      writes = writes.then(() => fs.writeFile(path.join(dir, file), Buffer.from(event.data, 'base64')));
    }
    cdp.send('Page.screencastFrameAck', { sessionId: event.sessionId }).catch(() => {});
  });
  const mark = phase => { marks.push({ phase, seconds: (Date.now() - start) / 1000 }); console.log(mode, phase); };
  const observe = async phase => observations.push(await page.locator('.rd-hero').evaluate((hero, phase) => ({ phase, motion: JSON.parse(hero.dataset.sceneMotion), hearts: hero.querySelector('canvas')?.dataset.heartTransforms || hero.querySelector('.rd-raster-scene')?.dataset.heartTransforms, light: hero.querySelector('canvas')?.dataset.fixedKeyLight, pngPoses: [...hero.querySelectorAll('.rd-raster-heart')].map(heart => ['left', 'right'].map(pose => Number(heart.querySelector(`[data-light=${pose}]`).style.opacity))), repulsions: hero.querySelector('canvas')?.dataset.repulsions || hero.querySelector('.rd-raster-scene')?.dataset.repulsions }), phase));
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 1440, maxHeight: 900, everyNthFrame: 1 });
  mark('stable-original-couple'); await page.waitForTimeout(1600); await observe('stable');
  let pointer = [500, 35];
  const move = async (x, y) => {
    const [startX, startY] = pointer;
    for (let step = 1; step <= 24; step++) {
      await page.mouse.move(startX + (x - startX) * step / 24, startY + (y - startY) * step / 24);
      await page.waitForTimeout(18);
    }
    pointer = [x, y];
  };
  const centers = await page.evaluate(() => {
    const hero = document.querySelector('.rd-hero'), box = hero.getBoundingClientRect(), canvas = hero.querySelector('canvas');
    return canvas ? JSON.parse(canvas.dataset.heartCenters).map(point => ({ x: box.left + point.x, y: box.top + point.y })) : [...hero.querySelectorAll('.rd-raster-heart')].map(node => { const r = node.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  });
  for (let i = 0; i < centers.length; i++) {
    const center = centers[i];
    mark(`heart-${i}-approach`); await move(center.x, center.y); await page.waitForTimeout(1600); await observe(`heart-${i}-approach`);
    mark(`heart-${i}-leave`); await move(500, 35); await page.waitForTimeout(950); await observe(`heart-${i}-leave`);
  }
  for (const [phase, x, y] of [['left-depth', 160, 350], ['right-depth', 1290, 560]]) {
    mark(phase); await move(x, y); await page.waitForTimeout(1400); await observe(phase);
  }
  mark('leave-and-return'); await move(500, 35); await page.waitForTimeout(1100); await observe('return');
  assert.ok(Math.abs(observations.at(-1).motion.x) < .02);
  assert.ok(observations.some(item => item.phase.includes('approach') && JSON.parse(item.repulsions).some(point => Math.hypot(...point) > 5)));
  if (mode === 'software') {
    mark('continuous-first-scroll'); await page.mouse.wheel(0, 450); await page.waitForTimeout(1200); await observe('portrait-retreat');
    assert.ok(observations.at(-1).motion.retreat > .01);
    mark('curve-arrives-at-games'); await page.locator('#gift-games').scrollIntoViewIfNeeded(); await page.waitForTimeout(1600);
    mark('rose-and-curved-paper'); await page.locator('.rd-nav nav>button').nth(1).click(); await page.waitForTimeout(2200);
    await page.screenshot({ path: path.join(out, 'recorded-letter-ko.png') });
    mark('switch-to-spanish'); await page.getByRole('button', { name: 'ES', exact: true }).click(); await page.locator('.rd-nav nav>button').nth(1).click(); mark('spanish-letter-final'); await page.waitForTimeout(2300);
    await page.screenshot({ path: path.join(out, 'recorded-letter-es.png') });
    mark('confirmed-date-footer'); await page.mouse.wheel(0, 650); await page.waitForTimeout(1400);
  } else {
    assert.ok(observations.every(item => item.light === '[-4,6,8]'));
    assert.notEqual(observations[0].hearts, observations.at(-1).hearts);
    mark('independent-axes-fixed-light'); await page.waitForTimeout(1800);
  }
  mark('end'); accept = false; await cdp.send('Page.stopScreencast'); await writes;
  assert.deepEqual(errors, []); assert.ok(frames.length > 25);
  const duration = (Date.now() - start) / 1000 - frames[0].received, origin = frames[0].timestamp;
  let concat = 'ffconcat version 1.0\n';
  frames.forEach((frame, index) => { const interval = index < frames.length - 1 ? frames[index + 1].timestamp - frame.timestamp : Math.max(.001, duration - (frame.timestamp - origin) - .12); concat += `file '${frame.file}'\nduration ${Math.max(.001, interval).toFixed(6)}\n`; });
  concat += `file '${frames.at(-1).file}'\nduration 0.12\n`;
  await fs.writeFile(path.join(dir, 'frames.ffconcat'), concat);
  await fs.writeFile(path.join(out, `${mode}-capture.json`), JSON.stringify({ mode, width: 1440, height: 900, duration, frameCount: frames.length, marks, observations, errors, frames, note: 'Actual production-root CDP JPEG events; original compositor intervals preserved. CFR30 repeats frames, no interpolation or gap removal. WebGL diagnostic selects the hardware code path on the same underlying software GPU; it does not represent hardware performance. Software mode uses bounded front-pose PNG blending, no simulated back face.' }, null, 2));
  await page.close();
  await run(process.env.FFMPEG_EXECUTABLE || 'ffmpeg', ['-y', '-loglevel', 'error', '-safe', '0', '-i', path.join(dir, 'frames.ffconcat'), '-t', String(duration), '-r', '30', '-fps_mode', 'cfr', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(out, `home-${mode}-actual.mp4`)]);
  const probe = await run(process.env.FFPROBE_EXECUTABLE || 'ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', path.join(out, `home-${mode}-actual.mp4`)]);
  assert.ok(Math.abs(Number(JSON.parse(probe.stdout).format.duration) - duration) < .08, 'Encoded video must retain the full capture interval, including its final static hold');
  console.log('RECORDED', mode, duration.toFixed(2), frames.length);
}
await browser.close();

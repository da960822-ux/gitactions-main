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
  const observe = async phase => observations.push(await page.locator('.rd-hero').evaluate((hero, phase) => ({ phase, motion: JSON.parse(hero.dataset.sceneMotion), hearts: hero.querySelector('canvas')?.dataset.heartTransforms || hero.querySelector('.rd-raster-scene')?.dataset.heartTransforms, light: hero.querySelector('canvas')?.dataset.fixedKeyLight, repulsions: hero.querySelector('canvas')?.dataset.repulsions || hero.querySelector('.rd-raster-scene')?.dataset.repulsions }), phase));
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 1440, maxHeight: 900, everyNthFrame: 1 });
  mark('stable-original-couple'); await page.waitForTimeout(1600); await observe('stable');
  for (const [phase, x, y] of [['approach', 720, 550], ['left-depth', 250, 330], ['right-depth', 1180, 610]]) {
    mark(phase); await page.mouse.move(x, y, { steps: 16 }); await page.waitForTimeout(1300); await observe(phase);
  }
  if (mode === 'software') {
    const heart = await page.locator('.rd-raster-heart').first().boundingBox();
    mark('near-heart-repulsion'); await page.mouse.move(heart.x + heart.width / 2, heart.y + heart.height / 2, { steps: 12 }); await page.waitForTimeout(900); await observe('repulsion');
  }
  mark('leave-and-return'); await page.mouse.move(500, 35, { steps: 16 }); await page.waitForTimeout(1100); await observe('return');
  assert.ok(Math.abs(observations.at(-1).motion.x) < .02);
  if (mode === 'software') {
    mark('continuous-first-scroll'); await page.mouse.wheel(0, 450); await page.waitForTimeout(1200); await observe('portrait-retreat');
    assert.ok(observations.at(-1).motion.retreat > .01);
    mark('curve-arrives-at-games'); await page.locator('#gift-games').scrollIntoViewIfNeeded(); await page.waitForTimeout(1600);
    mark('rose-and-curved-paper'); await page.locator('.rd-nav nav>button').nth(1).click(); await page.waitForTimeout(2200);
    await page.screenshot({ path: path.join(out, 'recorded-letter-ko.png') });
    mark('spanish-letter'); await page.getByRole('button', { name: 'ES', exact: true }).click(); await page.waitForTimeout(1700);
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
  frames.forEach((frame, index) => { const interval = index < frames.length - 1 ? frames[index + 1].timestamp - frame.timestamp : Math.max(.04, duration - (frame.timestamp - origin)); concat += `file '${frame.file}'\nduration ${Math.max(.001, interval).toFixed(6)}\n`; });
  concat += `file '${frames.at(-1).file}'\n`;
  await fs.writeFile(path.join(dir, 'frames.ffconcat'), concat);
  await fs.writeFile(path.join(out, `${mode}-capture.json`), JSON.stringify({ mode, width: 1440, height: 900, duration, frameCount: frames.length, marks, observations, errors, frames, note: 'Actual production-root CDP JPEG events; original compositor intervals preserved. CFR30 repeats frames, no interpolation or gap removal. WebGL diagnostic selects the hardware code path on the same underlying software GPU; it does not represent hardware performance. Software mode uses bounded front-pose PNG blending, no simulated back face.' }, null, 2));
  await page.close();
  await run(process.env.FFMPEG_EXECUTABLE || 'ffmpeg', ['-y', '-loglevel', 'error', '-safe', '0', '-i', path.join(dir, 'frames.ffconcat'), '-t', String(duration), '-r', '30', '-fps_mode', 'cfr', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(out, `home-${mode}-actual.mp4`)]);
  console.log('RECORDED', mode, duration.toFixed(2), frames.length);
}
await browser.close();

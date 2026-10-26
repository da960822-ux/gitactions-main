import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import { launchChromium } from './playwright-browser.mjs';

const base = process.env.MINHWATU_AUDIT_URL || 'http://127.0.0.1:5197';
const output = process.env.MINHWATU_BROWSER_REPORT || 'docs/audits/minhwatu-browser-qa.json';
const browser = await launchChromium();
const checks = [];
try {
  for (const mode of ['solo', 'team']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript(() => localStorage.setItem('dos-language', 'ko'));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/play?game=minhwatu`);
    await page.locator('.lobby-ai-actions').waitFor();
    const firstSeed = mode === 'solo' ? 0x80000000 : 0xc0000000;
    await page.evaluate(seeds => {
      const original = crypto.getRandomValues.bind(crypto);
      window.__auditSeeds = [...seeds];
      Object.defineProperty(crypto, 'getRandomValues', { configurable: true, value(array) {
        if (array instanceof Uint32Array && array.length === 1 && window.__auditSeeds.length) {
          array[0] = window.__auditSeeds.shift(); return array;
        }
        return original(array);
      } });
      window.__auditMotion = [];
      new MutationObserver(() => {
        if (document.querySelector('.hwatu-motion-stage.is-animating')) window.__auditMotion.push('step');
        if (document.querySelector('.hwatu-flight')) window.__auditMotion.push('flight');
      }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    }, [firstSeed, 0]);
    await page.locator('.lobby-ai-actions button').nth(mode === 'solo' ? 0 : 1).click();
    await page.waitForURL('**/play?room=*');
    await page.locator('.minhwatu-table').waitFor();
    const snapshot = async () => page.evaluate(async team => {
      const mod = await import(team ? '/src/core/fourPlayerClient.ts' : '/src/core/client.ts');
      const s = (team ? mod.fourPlayerClient : mod.soloClient).getSnapshot();
      return { turn: s.view?.turn, phase: s.view?.phase, version: s.version, matchId: s.matchId ?? null, error: s.error,
        stock: team ? s.view?.minhwatu?.deckCount : s.view?.board?.deckCount };
    }, mode === 'team');
    const initial = await snapshot();
    assert.equal(initial.turn, mode === 'solo' ? 'p2' : 'p4');
    assert.equal(initial.stock, 20);
    assert.equal(await page.locator(mode === 'solo' ? '.hwatu-hand-choice:enabled' : '.mh4-hand-card:enabled').count(), 0);
    assert.equal(await page.locator('.hwatu-motion-note--deal').count(), 1);
    await page.waitForTimeout(3400);
    const afterAi = await snapshot();
    assert(afterAi.version > initial.version, 'first AI action did not run');
    assert.equal(afterAi.error, null);
    await page.waitForTimeout(500);
    const motion = await page.evaluate(() => ({ step: window.__auditMotion.includes('step'), flight: window.__auditMotion.includes('flight') }));
    assert(motion.step, 'first AI action did not enter the presentation sequence');
    let afterCapture = null;
    if (afterAi.phase === 'capture-draw') {
      await page.waitForTimeout(3400);
      afterCapture = await snapshot();
      assert(afterCapture.version > afterAi.version && afterCapture.phase === 'play', 'AI did not resolve its revealed-card choice');
    }
    // Complete the synthetic engine state quickly, then exercise the visible replay button.
    await page.evaluate(async team => {
      if (team) {
        const [{ fourPlayerClient: client }, { fourMinhwatuEngine: engine }] = await Promise.all([
          import('/src/core/fourPlayerClient.ts'), import('/src/games/fourMinhwatu.ts')]);
        client.cancel();
        let state = client.state;
        for (let i = 0; i < 45 && !state.result; i++) {
          const action = engine.chooseAiAction(engine.getPlayerView(state, state.turn), state.turn, () => .3);
          state = engine.applyAction(state, state.turn, action);
        }
        if (!state.result) throw Error('four-player synthetic completion failed');
        client.state = state; client.update();
      } else {
        const [{ soloClient: client }, { minhwatuEngine: engine }, { chooseSimpleAiAction }] = await Promise.all([
          import('/src/core/client.ts'), import('/src/games/minhwatu.ts'), import('/src/games/simpleAi.ts')]);
        client.cancelBot();
        let state = client.state;
        for (let i = 0; i < 45 && !state.result; i++) {
          const action = chooseSimpleAiAction('minhwatu', engine.getPlayerView(state, state.turn), state.turn, () => .3);
          state = engine.applyAction(state, state.turn, action);
        }
        if (!state.result) throw Error('two-player synthetic completion failed');
        client.state = state; client.snapshot.version++; client.localView(); client.emit();
      }
    }, mode === 'team');
    const replayButton = page.locator(mode === 'solo' ? '.hwatu-replay button' : '.mh4-hand-actions button.mh4-confirm');
    await replayButton.waitFor();
    await replayButton.click();
    let replay;
    for (let attempt = 0; attempt < 30; attempt++) {
      replay = await snapshot();
      if (replay.turn === 'p1' && replay.stock === 20 && replay.version > afterAi.version) break;
      await page.waitForTimeout(100);
    }
    assert(replay.version > afterAi.version && replay.turn === 'p1' && replay.stock === 20, 'replay did not start a fresh deal');
    assert.equal(replay.error, null);
    assert.equal(await page.locator('.hwatu-motion-note--deal').count(), 1);
    assert.equal(await page.locator(mode === 'solo' ? '.hwatu-hand-choice:enabled' : '.mh4-hand-card:enabled').count(), mode === 'solo' ? 10 : 5);
    assert.deepEqual(errors, []);
    checks.push({ mode, firstSeed, initial, afterAi, afterCapture, motion, replay, errors });
    await context.close();
  }
  await mkdir(output.slice(0, output.lastIndexOf('/')), { recursive: true });
  await writeFile(output, JSON.stringify({ checks }, null, 2));
  console.log(JSON.stringify({ checks }, null, 2));
} finally { await browser.close(); }

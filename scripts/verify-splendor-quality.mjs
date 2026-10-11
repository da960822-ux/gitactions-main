import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { launchChromium } from './playwright-browser.mjs';

// Local demo fixtures use the Vite source module; never modify an online room.
const base = process.env.SPLENDOR_URL || 'http://127.0.0.1:5191';
const output = path.resolve(process.env.PLAYWRIGHT_ARTIFACT_DIR || 'output/playwright/splendor-sol');
const targetedReadiness = process.env.SPLENDOR_TARGETED_READINESS === '1';
await fs.mkdir(output, { recursive: true });
const browser = await launchChromium();
const report = [];
try {
  for (const language of ['ko', 'es']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.addInitScript(value => {
      localStorage.setItem('dos-language', value);
      localStorage.setItem('dos-sfx-v1', JSON.stringify({ splendor: { sfxEnabled: true, sfxVolume: 0.38 } }));
      window.splendorAudioNotes = [];
      const NativeContext = window.AudioContext;
      window.AudioContext = class extends NativeContext {
        createOscillator() {
          const node = super.createOscillator(), start = node.start.bind(node);
          node.start = (...args) => { window.splendorAudioNotes.push({ at: performance.now(), frequency: node.frequency.value }); return start(...args); };
          return node;
        }
      };
    }, language);
    await page.goto(new URL('/play?game=splendor', base).href);
    await page.locator('#nickname').fill('Sol');
    await page.locator('.lobby-actions > button').click();
    await page.waitForURL('**/room/**');
    await page.locator('.demo-banner select').selectOption('p2');
    await page.locator('.room-game-card').filter({ hasText: /스플렌더|Splendor/ }).click();
    await page.locator('.demo-banner select').selectOption('p1');
    await page.locator('.sp-splendor').waitFor();

    const capture = async state => {
      await page.locator('.sp-splendor').waitFor();
      const details = await page.evaluate(() => {
        const box = selector => {
          const rect = document.querySelector(selector)?.getBoundingClientRect();
          return rect ? { top: rect.top, bottom: rect.bottom, height: rect.height, width: rect.width } : null;
        };
        return {
          viewport: [innerWidth, innerHeight], board: box('.sp-splendor'),
          zones: Object.fromEntries(['.sp-market', '.sp-nobles', '.sp-bank', '.sp-treasury', '.sp-reserved', '.sp-action-panel'].map(selector => [selector, box(selector)])),
          cards: document.querySelectorAll('.sp-card').length,
          nobles: document.querySelectorAll('.sp-noble').length,
          returnSteppers: document.querySelectorAll('.sp-return-stepper').length,
          actionArtDisplay: getComputedStyle(document.querySelector('.sp-action-art') || document.body).display,
          reservedCardName: document.querySelector('.sp-reserved-card')?.getAttribute('aria-label') ?? null,
          reservedArtHidden: document.querySelector('.sp-reserved-card .sp-reserved-art')?.getAttribute('aria-hidden') === 'true',
          tokenEquation: document.querySelector('.sp-token-confirm > p')?.textContent,
          pressedBank: document.querySelectorAll('.sp-gem-pile[aria-pressed="true"]').length,
          paymentFonts: [...document.querySelectorAll('.sp-pay-cell')].map(node => Number.parseFloat(getComputedStyle(node).fontSize)),
          returnTargets: [...document.querySelectorAll('.sp-return-stepper button')].map(node => ({ width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height })),
          gemsLoaded: [...document.querySelectorAll('.sp-gem-icon img')].every(node => node.complete && node.naturalWidth > 0),
          artContains: [...document.querySelectorAll('.sp-card-face,.sp-noble-art img,.sp-reserved-art img')].every(node => getComputedStyle(node).objectFit === 'contain'),
          domNodes: document.querySelector('.sp-splendor').querySelectorAll('*').length,
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      const file = path.join(output, `${language}-${state}.png`);
      // Native viewport, normal animations: fast-forwarding animations changes transient state.
      await page.screenshot({ path: file });
      report.push({ language, state, ...details, file });
      assert.equal(details.cards, 12);
      assert.equal(details.horizontalOverflow, false);
      assert.ok(details.board.bottom <= 900, `${language} ${state}: board bottom ${details.board.bottom}`);
      assert.ok(details.gemsLoaded && details.artContains);
      if (state === 'selected') assert.ok(details.paymentFonts.every(size => size >= 11));
      if (state === 'cap10-reserved3') {
        assert.equal(details.returnSteppers, 6);
        assert.equal(details.pressedBank, 3);
        assert.ok(details.tokenEquation.includes('10/10'));
        assert.ok(details.returnTargets.every(target => target.width >= 44 && target.height >= 44));
        assert.equal(await page.locator('.sp-return-stepper').count(), 6);
      }
      return details;
    };

    if (targetedReadiness) {
      const card = page.locator('.sp-card').first();
      await card.focus(); await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.activeElement?.classList.contains('sp-action-panel'));
      const keyboardEnteredPanel = true;
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.activeElement?.matches('.sp-card'));
      const keyboardReturnedToCard = await card.evaluate(node => node === document.activeElement);
      assert.ok(keyboardReturnedToCard);

      await page.evaluate(async () => {
        const resources = performance.getEntriesByType('resource').filter(resource => resource.name.includes('/src/core/client.ts'));
        const { client } = await import(resources.at(-1).name);
        window.splendorQualityClient = client;
        const state = client.getSnapshot().mode === 'demo' ? client.state : null;
        if (!state) throw new Error('Fixtures require a local demo');
        state.hands.p1 = { white: 2, blue: 2, green: 2, red: 2, black: 1, gold: 1 };
        state.bank = { white: 2, blue: 2, green: 2, red: 2, black: 3, gold: 4 };
        state.active = 'p1'; client.snapshot.version++; client.snapshot.syncEpoch = (client.snapshot.syncEpoch || 0) + 1;
        client.localView(); client.emit();
      });
      await page.waitForTimeout(120);
      const richestCostIndex = await page.locator('.sp-card').evaluateAll(cards => cards.reduce((best, card, index) => { const count = node => node.querySelectorAll('.sp-card-cost > .sp-cost').length; return count(card) > count(cards[best]) ? index : best; }, 0));
      await page.locator('.sp-card').nth(richestCostIndex).click();
      const returnPlan = page.locator('.sp-return-select select');
      const returnOptionCount = await returnPlan.locator('option').count();
      assert.ok(returnOptionCount > 0, `${language}: reserve should expose a legal gold return plan`);
      await returnPlan.selectOption({ index: 0 });
      const preview = await capture('reserve-gold-return');
      assert.ok(preview.board.bottom <= 900, `${language}: reserve preview bottom ${preview.board.bottom}`);
      assert.equal(preview.actionArtDisplay, 'grid');
      assert.ok(preview.paymentFonts.every(size => size >= 11));

      const beforeGold = (await page.evaluate(() => window.splendorQualityClient.getSnapshot().view.ownHand.tokens.gold));
      await page.locator('.sp-action-buttons .sp-button-quiet').focus(); await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('.sp-confirmed-gain[data-motion-kind="gain"]'));
      await page.waitForFunction(() => document.querySelector('.sp-confirmed-payment[data-motion-kind="payment"]'));
      const event = await page.evaluate(() => ({
        gainFlights: [...document.querySelectorAll('.sp-confirmed-gain')].map(node => node.textContent),
        payments: [...document.querySelectorAll('.sp-confirmed-payment')].map(node => node.textContent),
        hand: window.splendorQualityClient.getSnapshot().view.ownHand,
      }));
      assert.equal(event.hand.tokens.gold, beforeGold, 'reserve gain and return should preserve net gold');
      assert.equal(event.hand.reserved.length, 1);
      assert.ok(event.gainFlights.some(text => /×1/.test(text)));
      assert.ok(event.payments.some(text => /×1/.test(text)));
      await page.locator('.sp-reserved-card').click();
      const reservedCardName = await page.locator('.sp-reserved-card').getAttribute('aria-label');
      assert.match(reservedCardName || '', language === 'ko' ? /예약 \d단계 카드/ : /Carta reservada de nivel \d/);
      assert.equal(await page.locator('.sp-reserved-card .sp-reserved-art').getAttribute('aria-hidden'), 'true');
      report.push({ language, state: 'targeted-readiness', keyboardEnteredPanel, keyboardReturnedToCard, preview, returnOptionCount, beforeGold, event: { gainFlights: event.gainFlights, payments: event.payments }, reservedCardName, reservedArtHidden: true });
      await page.close();
      continue;
    }

    await capture('initial');
    const richestCostIndex = await page.locator('.sp-card').evaluateAll(cards => cards.reduce((best, card, index) => { const count = node => node.querySelectorAll('.sp-card-cost > .sp-cost').length; return count(card) > count(cards[best]) ? index : best; }, 0));
    await page.locator('.sp-card').nth(richestCostIndex).click();
    await page.locator('.sp-action-panel').waitFor();
    await capture('selected');
    await page.keyboard.press('Escape');
    await page.locator('.sp-gem-pile').first().click();
    await capture('take');
    await page.evaluate(async () => {
      const resources = performance.getEntriesByType('resource').filter(resource => resource.name.includes('/src/core/client.ts'));
      const { client } = await import(resources.at(-1).name);
      if (client.getSnapshot().mode !== 'demo') throw new Error('Fixtures require a local demo');
      window.splendorQualityClient = client;
      client.state.hands.p1 = { white: 2, blue: 2, green: 2, red: 2, black: 2, gold: 0 };
      client.state.bank = { white: 2, blue: 2, green: 2, red: 2, black: 2, gold: 5 };
      client.state.reserved.p1 = client.state.decks[1].splice(0, 3);
      client.state.active = 'p1';
      client.snapshot.version++;
      client.localView();
      client.emit();
    });
    await page.waitForTimeout(1700);
    for (const gem of ['white', 'blue', 'green']) await page.locator(`.sp-gem-pile.sp-color-${gem}`).click();
    await page.locator('.sp-return-stepper').first().waitFor();
    await capture('cap10-reserved3');
    await page.locator('.sp-token-confirm .sp-button-primary').click();
    await page.waitForFunction(() => document.querySelector('.sp-confirmed-payment'));
    const motion = await page.evaluate(() => ({
      outgoing: [...document.querySelectorAll('.sp-confirmed-payment')].map(node => node.textContent),
      incoming: document.querySelectorAll('.sp-token-flight').length,
      total: Object.values(window.splendorQualityClient.getSnapshot().view.ownHand.tokens).reduce((sum, count) => sum + count, 0),
    }));
    assert.equal(motion.total, 10);
    assert.ok(motion.outgoing.length > 0 && motion.outgoing.every(count => /×[1-9]/.test(count)));
    await page.waitForTimeout(1750);
    const transient = await page.locator('.sp-confirmed-flight,.sp-token-flight').count();
    assert.equal(transient, 0);
    report.push({ language, state: 'confirmed-return-motion', ...motion, overlaysAfter1750ms: transient });
    await page.evaluate(() => {
      const client = window.splendorQualityClient, state = client.state;
      const lists = [...Object.values(state.market), ...Object.values(state.decks), ...Object.values(state.reserved)];
      const source = lists.find(cards => cards.some(card => card.id === 't1-01'));
      const index = source.findIndex(card => card.id === 't1-01');
      const selected = source[index], replaced = state.market[1][0];
      source[index] = replaced; state.market[1][0] = selected;
      state.hands.p1 = { white: 1, blue: 1, green: 1, red: 1, black: 1, gold: 0 };
      state.bank = { white: 3, blue: 3, green: 3, red: 3, black: 3, gold: 5 };
      state.bonuses.p1 = { white: 3, blue: 4, green: 3, red: 3, black: 3 };
      state.availableNobles = { n0: { points: 3, requirement: { white: 4, blue: 4 } } };
      state.cardPoints.p1 = 11; state.nobles.p1 = 0; state.active = 'p1';
      state.turns = { p1: 0, p2: 0 }; state.pendingNobles = []; state.pendingEnd = false; state.result = null;
      client.snapshot.version++; client.snapshot.syncEpoch = (client.snapshot.syncEpoch || 0) + 1;
      client.localView(); client.emit();
    });
    await page.locator('.sp-card[data-card-id="t1-01"]').waitFor();
    // Unlock WebAudio through the same explicit gesture used by players.
    await page.locator('.game-sound-trigger').click();
    await page.locator('.game-sound-trigger').click();
    await page.waitForTimeout(50);
    const sourceCenters = await page.evaluate(() => {
      const center = selector => { const rect = document.querySelector(selector).getBoundingClientRect(); return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; };
      return { card: center('.sp-card[data-card-id="t1-01"] .sp-card-face'), noble: center('[data-sp-noble-id="n0"] .sp-noble-art img') };
    });
    await page.locator('.sp-card[data-card-id="t1-01"]').click();
    await page.evaluate(() => { window.splendorAudioNotes = []; window.splendorAudioStartedAt = performance.now(); });
    await page.locator('.sp-action-buttons .sp-button-buy').click();
    await page.waitForFunction(() => document.querySelector('.sp-confirmed-card') && document.querySelector('.sp-confirmed-noble'));
    const bundle = await page.evaluate(() => {
      const center = selector => { const rect = document.querySelector(selector).getBoundingClientRect(); return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; };
      return {
        flights: [...document.querySelectorAll('.sp-confirmed-flight')].map(node => ({ kind: node.dataset.motionKind, from: { x: parseFloat(node.style.left) + parseFloat(node.style.width) / 2, y: parseFloat(node.style.top) + parseFloat(node.style.height) / 2 }, dx: parseFloat(node.style.getPropertyValue('--sp-dx')), dy: parseFloat(node.style.getPropertyValue('--sp-dy')), delay: node.style.getPropertyValue('--sp-delay') })),
        targetCard: center('.sp-bonus.sp-color-white'), targetNoble: center('[data-sp-score-seat="p1"] > b'),
        score: window.splendorQualityClient.getSnapshot().view.board.score.p1,
        turn: window.splendorQualityClient.getSnapshot().view.turn,
      };
    });
    for (const kind of ['card', 'noble']) {
      const flight = bundle.flights.find(item => item.kind === kind);
      const destination = kind === 'card' ? bundle.targetCard : bundle.targetNoble;
      assert.ok(Math.abs(flight.from.x - sourceCenters[kind].x) < 1 && Math.abs(flight.from.y - sourceCenters[kind].y) < 1);
      assert.ok(Math.abs(flight.from.x + flight.dx - destination.x) < 1 && Math.abs(flight.from.y + flight.dy - destination.y) < 1);
    }
    assert.ok(bundle.flights.some(flight => flight.kind === 'payment'));
    assert.equal(await page.evaluate(() => window.splendorAudioNotes.length), 0, 'Purchase/noble audio must wait for landing');
    assert.equal(bundle.score, 15); assert.equal(bundle.turn, 'p2');
    await page.screenshot({ path: path.join(output, `${language}-purchase-noble-motion.png`) });
    await page.waitForTimeout(1800);
    assert.equal(await page.locator('.sp-confirmed-flight,.sp-token-flight').count(), 0);
    const audio = await page.evaluate(() => window.splendorAudioNotes.map(note => ({ frequency: note.frequency, elapsedMs: note.at - window.splendorAudioStartedAt })));
    assert.equal(audio.length, 6, 'Exactly one three-note purchase cue and one three-note noble cue');
    assert.ok(audio.slice(0, 3).every(note => note.elapsedMs >= 850 && note.elapsedMs < 1300));
    assert.ok(audio.slice(3).every(note => note.elapsedMs >= 1300 && note.elapsedMs < 1800));
    report.push({ language, state: 'purchase-payment-bonus-noble-final-turn', sourceCenters, ...bundle, audio, overlaysAfter1800ms: 0 });
    await page.close();
  }
} finally {
  await fs.writeFile(path.join(output, 'native.json'), JSON.stringify(report, null, 2) + '\n');
  await browser.close();
}
console.log(JSON.stringify(report.map(({ language, state, board, returnSteppers, total, overlaysAfter1750ms }) => ({ language, state, bottom: board?.bottom, returnSteppers, total, overlaysAfter1750ms })), null, 2));

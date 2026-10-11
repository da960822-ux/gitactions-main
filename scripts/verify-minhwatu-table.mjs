import fs from 'node:fs/promises';
import path from 'node:path';
import { launchChromium } from './playwright-browser.mjs';

const baseUrl = process.env.LANDING_URL || 'http://127.0.0.1:5192/';
const outputDir = path.resolve(process.env.PLAYWRIGHT_ARTIFACT_DIR || 'output/playwright/game-polish/minhwatu-native');
await fs.mkdir(outputDir, { recursive: true });

const browser = await launchChromium();
const report = {
  baseUrl,
  fixture: 'Vite-served real Minhwatu engine + MinhwatuTable component; deterministic local state, no Supabase/Realtime or translation API',
  checks: [],
  screenshots: [],
  errors: [],
};
const check = (name, pass, detail = '') => report.checks.push({ name, pass: Boolean(pass), detail });

async function openHarness(language, width, height, reducedMotion = false) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: reducedMotion ? 'reduce' : 'no-preference' });
  await context.addInitScript(value => localStorage.setItem('dos-language', value), language);
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(`${language}-${width}:page:${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error' && !/realtime\/v1\/websocket/.test(message.text())) report.errors.push(`${language}-${width}:console:${message.text()}`);
  });
  await page.goto(new URL('__minhwatu_native_check__', baseUrl).href, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    const [{ minhwatuEngine }, { MinhwatuTable }, reactModule, domModule] = await Promise.all([
      import('/src/games/minhwatu.ts'),
      import('/src/app/MinhwatuTable.tsx'),
      import('/node_modules/.vite/deps/react.js'),
      import('/node_modules/.vite/deps/react-dom_client.js'),
    ]);
    const React = reactModule.default;
    const { createRoot } = domModule.default ?? domModule;
    document.querySelector('#root')?.setAttribute('hidden', '');
    const host = document.createElement('main');
    host.id = 'minhwatu-native-proof';
    host.style.cssText = 'width:100%;padding:12px 18px 24px;box-sizing:border-box;background:#ded2b7;min-height:100vh';
    document.body.append(host);
    let root = createRoot(host), state, viewer = 'p1', language = 'ko';
    const render = () => root.render(React.createElement(MinhwatuTable, {
      view: minhwatuEngine.getPlayerView(state, viewer), language, playerId: viewer,
      runAction: async action => { state = minhwatuEngine.applyAction(state, viewer, action); render(); return true; },
    }));
    const arrange = (seed, { p1Hand, p2Hand, table, deck, p1Captures = [], p2Captures = [] }) => {
      const initial = minhwatuEngine.createInitialState(seed);
      const all = [...initial.hands.p1, ...initial.hands.p2, ...initial.table, ...initial.deck];
      const cards = new Map(all.map(card => [card.id, card]));
      const used = new Set();
      const take = ids => ids.map(id => {
        if (used.has(id) || !cards.has(id)) throw new Error(`invalid_fixture_card:${id}`);
        used.add(id);
        return structuredClone(cards.get(id));
      });
      const hands = { p1: take(p1Hand), p2: take(p2Hand) };
      const board = take(table);
      const stock = take(deck);
      const captures = { p1: take(p1Captures), p2: take(p2Captures) };
      const allIds = [...hands.p1, ...hands.p2, ...board, ...stock, ...captures.p1, ...captures.p2].map(card => card.id);
      if (allIds.length !== 48 || new Set(allIds).size !== 48) throw new Error(`fixture_card_conservation:${allIds.length}`);
      return {
        ...initial, turn: 'p1', hands, table: board, deck: stock, captures, pending: null, phase: 'play', result: null,
        events: [{ sequence: 1, type: 'deal', title: { ko: '화투패를 나눴어요', es: 'Las cartas están repartidas' }, cards: board.map(card => structuredClone(card)) }],
      };
    };
    const rest = (excluding, count) => {
      const initial = minhwatuEngine.createInitialState(20261011);
      const all = [...initial.hands.p1, ...initial.hands.p2, ...initial.table, ...initial.deck];
      const skip = new Set(excluding);
      const ids = all.map(card => card.id).filter(id => !skip.has(id));
      if (ids.length !== count) throw new Error(`expected_${count}_remaining_cards_got_${ids.length}`);
      return ids;
    };
    const normalState = () => {
      const p1Hand = ['1-1', '2-1', '2-2', '2-3', '2-4', '3-1', '3-2', '3-3', '3-4', '4-1'];
      const p2Hand = ['4-2', '4-3', '4-4', '5-2', '5-3', '5-4', '6-2', '6-3', '6-4', '7-2'];
      const table = ['1-2', '1-3', '5-1', '6-1', '7-1', '8-1', '9-1', '10-1'];
      const deck = ['11-1', ...rest([...p1Hand, ...p2Hand, ...table, '11-1'], 19)];
      return arrange(20261011, { p1Hand, p2Hand, table, deck });
    };
    const godoriState = () => {
      const p1Hand = ['8-1'], p2Hand = ['12-4'];
      const table = ['8-2', '1-1', '3-1', '5-1', '6-1', '7-1', '9-1', '10-1'];
      const deck = ['12-3'];
      const p1Captures = ['2-1', '4-1', ...rest([...p1Hand, ...p2Hand, ...table, ...deck, '2-1', '4-1'], 35)];
      return arrange(20261012, { p1Hand, p2Hand, table, deck, p1Captures });
    };
    window.minhwatuProof = {
      engine: minhwatuEngine,
      normalState,
      godoriState,
      mount(nextState, nextLanguage, nextViewer = 'p1') { state = structuredClone(nextState); language = nextLanguage; viewer = nextViewer; render(); },
      setViewer(nextViewer) { viewer = nextViewer; render(); },
      view(seat = viewer) { return minhwatuEngine.getPlayerView(state, seat); },
      state() { return structuredClone(state); },
      renderAgain() { render(); },
      remount() { root.unmount(); root = createRoot(host); render(); },
      async act(action, seat = viewer) { state = minhwatuEngine.applyAction(state, seat, action); render(); return minhwatuEngine.getPlayerView(state, seat); },
      hiddenIds(seat) { return state.hands[seat].map(card => card.id); },
    };
  });
  return { context, page };
}

async function waitForImages(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.querySelectorAll('.gb-hwatu-face')].every(image => image.complete && image.naturalWidth > 0), null, { timeout: 8000 });
}

async function measure(page) {
  return page.evaluate(() => {
    const rect = selector => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { x: Math.round(box.x), y: Math.round(box.y), right: Math.round(box.right), bottom: Math.round(box.bottom), width: Math.round(box.width), height: Math.round(box.height) };
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      handCount: document.querySelectorAll('.hwatu-hand-choice').length,
      tableCount: document.querySelectorAll('.hwatu-table-card').length,
      captureRailCount: document.querySelectorAll('.hwatu-capture-rack').length,
      brokenImages: [...document.querySelectorAll('.gb-hwatu-face')].filter(image => !image.complete || !image.naturalWidth).map(image => image.currentSrc),
      board: rect('.minhwatu-table'), hand: rect('[data-hwatu-zone="hand"]'), table: rect('[data-hwatu-zone="table"]'),
      captures: [...document.querySelectorAll('.hwatu-capture-rack')].map(element => {
        const box = element.getBoundingClientRect();
        return { x: Math.round(box.x), y: Math.round(box.y), right: Math.round(box.right), bottom: Math.round(box.bottom), width: Math.round(box.width), height: Math.round(box.height) };
      }),
    };
  });
}

async function capture(page, name) {
  const file = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  report.screenshots.push(file);
  return file;
}

async function testLocale(language, width, height) {
  const reducedMotion = language === 'es';
  const { context, page } = await openHarness(language, width, height, reducedMotion);
  try {
    await page.evaluate(({ language }) => window.minhwatuProof.mount(window.minhwatuProof.normalState(), language), { language });
    await waitForImages(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(350);
    await page.waitForFunction(() => !document.querySelector('.hwatu-motion-stage.is-animating') && !document.querySelector('.hwatu-flight'), null, { timeout: 6000 });
    const initial = await measure(page);
    const initialView = await page.evaluate(() => ({
      p1: window.minhwatuProof.view('p1'), p2: window.minhwatuProof.view('p2'),
      p1Hidden: window.minhwatuProof.hiddenIds('p1'), p2Hidden: window.minhwatuProof.hiddenIds('p2'),
    }));
    const visibleIds = await page.locator('[data-hwatu-card-id]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-hwatu-card-id')));
    const p1LeaksP2 = initialView.p2Hidden.some(id => visibleIds.includes(id));
    const p1Serialized = JSON.stringify(initialView.p1), p2Serialized = JSON.stringify(initialView.p2);
    const viewPrivateSafe = initialView.p1.ownHand.map(card => card.id).join(',') === initialView.p1Hidden.join(',') && initialView.p2.ownHand.map(card => card.id).join(',') === initialView.p2Hidden.join(',')
      && initialView.p1.opponentCount === 10 && initialView.p2.opponentCount === 10
      && !p1LeaksP2
      && !/("hands"|"deck"|"seed")/.test(p1Serialized + p2Serialized);
    check(`${language} ${width}: initial deal shows 10 own cards, 8 table cards, two capture rails and loaded art`, initial.handCount === 10 && initial.tableCount === 8 && initial.captureRailCount === 2 && initial.brokenImages.length === 0, JSON.stringify(initial));
    check(`${language} ${width}: caller views expose only that seat's own hand and no stock`, viewPrivateSafe, JSON.stringify({ p1Own: initialView.p1.ownHand.length, p2Own: initialView.p2.ownHand.length, p1Opponent: initialView.p1.opponentCount, p2Opponent: initialView.p2.opponentCount, visibleCards: visibleIds.length, p1LeaksP2, hasPrivateKeys: /("hands"|"deck"|"seed")/.test(p1Serialized + p2Serialized) }));
    check(`${language} ${width}: page has no horizontal overflow`, initial.documentWidth <= width, JSON.stringify({ documentWidth: initial.documentWidth, width }));
    check(`${language} ${width}: hand, table and both capture rails fit in the viewport`, [initial.hand, initial.table, ...initial.captures].every(box => box && box.y >= 0 && box.bottom <= height), JSON.stringify({ hand: initial.hand, table: initial.table, captures: initial.captures, height }));
    await capture(page, `${language}-${width}-initial-play`);

    await page.locator('.hwatu-hand-choice[data-hwatu-card-id="2-1"]').click();
    await page.locator('.hwatu-confirm').waitFor({ state: 'visible', timeout: 4000 });
    const confirmVisible = await page.locator('.hwatu-confirm').isVisible();
    const confirmBox = await page.locator('.hwatu-confirm').boundingBox();
    const confirmLayout = await measure(page);
    check(`${language} ${width}: a no-match hand card offers a visible confirmed play`, confirmVisible && Boolean(confirmBox && confirmBox.y >= 0 && confirmBox.y + confirmBox.height <= height), JSON.stringify(confirmBox));
    check(`${language} ${width}: confirmation retains both capture rails in view`, confirmLayout.captures.length === 2 && confirmLayout.captures.every(box => box.y >= 0 && box.bottom <= height), JSON.stringify(confirmLayout.captures));
    await capture(page, `${language}-${width}-confirmed-play`);
    await page.locator('.hwatu-cancel').click();

    const playSource = await page.locator('.hwatu-hand-choice[data-hwatu-card-id="1-1"]').boundingBox();
    const playDestination = await page.locator('[data-hwatu-zone="table"]').boundingBox();
    const captureSource = await page.locator('.hwatu-table-card[data-hwatu-card-id="1-2"]').boundingBox();
    await page.locator('.hwatu-hand-choice[data-hwatu-card-id="1-1"]').click();
    const targets = page.locator('.hwatu-table-card.is-target');
    await targets.first().waitFor({ state: 'visible', timeout: 4000 });
    const targetCount = await targets.count();
    const targetBoxes = await targets.evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), right: Math.round(r.right), bottom: Math.round(r.bottom) }; }));
    check(`${language} ${width}: selecting a duplicated month presents both legal targets`, targetCount === 2 && targetBoxes.every(box => box.y >= 0 && box.bottom <= height), JSON.stringify({ targetCount, targetBoxes, height }));
    const targetLayout = await measure(page);
    check(`${language} ${width}: two-target choice keeps both capture rails in view`, targetLayout.captures.length === 2 && targetLayout.captures.every(box => box.y >= 0 && box.bottom <= height), JSON.stringify(targetLayout.captures));
    await capture(page, `${language}-${width}-two-targets`);
    await targets.first().click();
    await page.waitForFunction(() => window.minhwatuProof.view('p1').log.some(event => event.type === 'turn'), null, { timeout: 6000 });
    const transition = await page.evaluate(() => {
      const view = window.minhwatuProof.view('p1');
      return { events: view.log.map(event => event.type), ownHand: view.ownHand.length, table: view.board.table.length, captures: view.board.captures.p1.length, turn: view.turn, drawCount: view.log.filter(event => event.type === 'draw').length };
    });
    check(`${language} ${width}: real legal play resolves capture, draw and turn exactly once`, ['play', 'capture', 'draw', 'turn'].every(type => transition.events.includes(type)) && transition.ownHand === 9 && transition.drawCount === 1 && transition.turn === 'p2', JSON.stringify(transition));
    if (!reducedMotion) await page.waitForFunction(() => document.querySelector('.hwatu-flight'), null, { timeout: 4000 });
    const flight = await page.evaluate(({ source, destination }) => {
      const element = document.querySelector('.hwatu-flight');
      const animation = element?.getAnimations()[0];
      const keyframes = animation?.effect?.getKeyframes?.() ?? [];
      const left = Number.parseFloat(element?.style.left || 'NaN');
      const top = Number.parseFloat(element?.style.top || 'NaN');
      const width = Number.parseFloat(element?.style.width || 'NaN');
      const height = Number.parseFloat(element?.style.height || 'NaN');
      const delta = keyframes.at(-1)?.transform?.match(/translate3d\(([-\d.]+)px,\s*([-\d.]+)px/)?.slice(1).map(Number);
      const center = (box, dx = 0, dy = 0) => box ? { x: left + dx + width / 2, y: top + dy + height / 2 } : null;
      const sourceCenter = source ? { x: source.x + source.width / 2, y: source.y + source.height / 2 } : null;
      const targetCenter = delta?.length === 2 ? center(destination, delta[0], delta[1]) : null;
      const expectedCenter = destination ? { x: destination.x + destination.width / 2, y: destination.y + destination.height / 2 } : null;
      return { present: Boolean(element), source, destination, left, top, width, height, duration: animation?.effect?.getTiming().duration ?? null, finalTransform: keyframes.at(-1)?.transform ?? null, sourceCenter: center(source), expectedSourceCenter: sourceCenter, targetCenter, expectedTargetCenter: expectedCenter };
    }, { source: playSource, destination: playDestination });
    const close = (a, b, tolerance = 12) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance;
    const flightGeometry = close(flight.sourceCenter?.x, flight.expectedSourceCenter?.x, 4) && close(flight.sourceCenter?.y, flight.expectedSourceCenter?.y, 12)
      && close(flight.targetCenter?.x, flight.expectedTargetCenter?.x, 16) && close(flight.targetCenter?.y, flight.expectedTargetCenter?.y, 16);
    check(`${language} ${width}: ${reducedMotion ? 'reduced motion suppresses' : 'a committed play animates'} the card clone`, reducedMotion ? !flight.present : flight.present && Boolean(playSource) && Number(flight.duration) === 255 && Boolean(flight.finalTransform), JSON.stringify(flight));
    if (!reducedMotion) check(`${language} ${width}: the played card clone travels from the selected hand card to the table`, flightGeometry, JSON.stringify(flight));
    if (!reducedMotion) {
      await page.waitForFunction(() => document.querySelector('.hwatu-motion-note--capture.is-fresh'), null, { timeout: 4000 });
      const capturedCard = page.locator('[data-hwatu-zone^="captures-p1-"] [data-hwatu-card-id="1-2"]');
      await capturedCard.waitFor({ state: 'visible', timeout: 4000 });
      const captureDestination = await capturedCard.boundingBox();
      await page.waitForFunction(() => document.querySelector('.hwatu-flight'), null, { timeout: 3000 });
      const captureFlight = await page.evaluate(({ source, destination }) => {
        const element = document.querySelector('.hwatu-flight');
        const animation = element?.getAnimations()[0];
        const frames = animation?.effect?.getKeyframes?.() ?? [];
        const left = Number.parseFloat(element?.style.left || 'NaN'), top = Number.parseFloat(element?.style.top || 'NaN');
        const cardWidth = Number.parseFloat(element?.style.width || 'NaN'), cardHeight = Number.parseFloat(element?.style.height || 'NaN');
        const offset = frames.at(-1)?.transform?.match(/translate3d\(([-\d.]+)px,\s*([-\d.]+)px/)?.slice(1).map(Number);
        return {
          source, destination, duration: animation?.effect?.getTiming().duration ?? null,
          start: { x: left + cardWidth / 2, y: top + cardHeight / 2 },
          expectedStart: source ? { x: source.x + source.width / 2, y: source.y + source.height / 2 } : null,
          end: offset?.length === 2 ? { x: left + offset[0] + cardWidth / 2, y: top + offset[1] + cardHeight / 2 } : null,
          expectedEnd: destination ? { x: destination.x + destination.width / 2, y: destination.y + destination.height / 2 } : null,
        };
      }, { source: captureSource, destination: captureDestination });
      const captureGeometry = close(captureFlight.start?.x, captureFlight.expectedStart?.x, 4) && close(captureFlight.start?.y, captureFlight.expectedStart?.y, 12)
        && close(captureFlight.end?.x, captureFlight.expectedEnd?.x, 12) && close(captureFlight.end?.y, captureFlight.expectedEnd?.y, 12);
      check(`${language} ${width}: a captured table card flies into its matching capture pile`, captureGeometry && captureFlight.duration === 255, JSON.stringify(captureFlight));
      await page.evaluate(() => window.minhwatuProof.remount());
      await page.waitForTimeout(40);
      check(`${language} ${width}: unmounting during a card flight cancels its clone`, !(await page.locator('.hwatu-flight').count()) && !(await page.locator('.hwatu-score-flight').count()) && !(await page.locator('.hwatu-combination-reveal').count()), 'unmounted while the committed capture flight was active');
    }
    await page.waitForFunction(() => !document.querySelector('.hwatu-motion-stage.is-animating') && !document.querySelector('.hwatu-flight'), null, { timeout: 6000 });
    await page.evaluate(() => window.minhwatuProof.renderAgain());
    await page.waitForTimeout(360);
    check(`${language} ${width}: replaying an unchanged public log does not repeat card flights`, !(await page.locator('.hwatu-flight').count()) && !(await page.locator('.hwatu-motion-stage.is-animating').count()), 'same committed event sequence rendered twice');
    await page.evaluate(() => window.minhwatuProof.remount());
    await page.waitForTimeout(360);
    check(`${language} ${width}: remounting an existing event log stays quiet`, !(await page.locator('.hwatu-flight').count()) && !(await page.locator('.hwatu-motion-stage.is-animating').count()), 'remounted with the same state and event sequences');

    const godoriState = await page.evaluate(() => window.minhwatuProof.godoriState());
    await page.evaluate(({ state, language }) => window.minhwatuProof.mount(state, language, 'p1'), { state: godoriState, language });
    await page.waitForTimeout(350);
    await page.waitForFunction(() => !document.querySelector('.hwatu-motion-stage.is-animating') && !document.querySelector('.hwatu-flight'), null, { timeout: 6000 });
    await page.locator('.hwatu-hand-choice[data-hwatu-card-id="8-1"]').click();
    await page.locator('.hwatu-confirm').click();
    if (reducedMotion) await page.waitForFunction(() => window.minhwatuProof.view('p1').log.some(event => event.type === 'special' && event.yaku?.id === 'godori'), null, { timeout: 5000 });
    else await page.waitForFunction(() => document.querySelector('.hwatu-motion-note--special.is-fresh'), null, { timeout: 5000 });
    if (!reducedMotion) await page.waitForTimeout(180);
    const special = await page.evaluate(() => {
      const view = window.minhwatuProof.view('p1');
      const yaku = view.board.breakdown.p1.yakus.find(item => item.id === 'godori');
      const event = view.log.find(item => item.type === 'special' && item.yaku?.id === 'godori');
      const capture = view.log.find(item => item.type === 'capture' && item.scoreChanges?.p1);
      const stage = document.querySelector('.hwatu-motion-note--special');
      const reveal = document.querySelector('.hwatu-combination-reveal[data-hwatu-celebration="godori"]');
      const faces = reveal ? [...reveal.querySelectorAll('img')].map(image => ({ src: new URL(image.src).pathname, loaded: image.complete && image.naturalWidth > 0 })) : [];
      const scoreFlights = [...document.querySelectorAll('.hwatu-score-flight')].map(element => ({ text: element.textContent, negative: element.classList.contains('is-negative') }));
      return { bonus: yaku?.bonus, complete: yaku?.complete, eventBonus: event?.yaku?.bonus, title: event?.title, fresh: stage?.classList.contains('is-fresh'), ringAnimations: stage?.querySelector('i')?.getAnimations().length ?? 0, log: view.log.map(item => item.type), score: view.board.scores.p1, seat: view.turn, captureScoreChanges: capture?.scoreChanges, captureSequence: capture?.sequence, faces, revealTitle: reveal?.textContent?.trim(), scoreFlights };
    });
    check(`${language} ${width}: real Godori capture publishes its 50-point event and transfers turn`, special.complete && special.bonus === 50 && special.eventBonus === 50 && special.log.includes('turn') && special.seat === 'p2', JSON.stringify(special));
    if (language === 'ko') {
      check(`${language} ${width}: score events show exact positive and negative deltas`, special.captureScoreChanges?.p1 === 130 && special.captureScoreChanges?.p2 === -50 && special.scoreFlights.some(item => item.text === '+130') && special.scoreFlights.some(item => item.text === '−50' && item.negative), JSON.stringify({ scoreChanges: special.captureScoreChanges, flights: special.scoreFlights }));
      check(`${language} ${width}: Godori reveal uses all three canonical loaded faces`, JSON.stringify(special.faces.map(item => item.src)) === JSON.stringify(['/images/hwatu/02-01.svg', '/images/hwatu/04-01.svg', '/images/hwatu/08-02.svg']) && special.faces.every(item => item.loaded) && special.revealTitle?.includes('+50'), JSON.stringify({ faces: special.faces, revealTitle: special.revealTitle }));
      check(`${language} ${width}: fresh Godori event runs its special motion once`, special.fresh && special.ringAnimations > 0, JSON.stringify({ fresh: special.fresh, ringAnimations: special.ringAnimations }));
    } else {
      check(`${language} ${width}: reduced motion preserves score events and suppresses transient clones`, special.captureScoreChanges?.p1 === 130 && special.captureScoreChanges?.p2 === -50 && !special.scoreFlights.length && !special.faces.length && !(await page.locator('.hwatu-flight').count()) && !(await page.locator('.hwatu-combination-reveal').count()), JSON.stringify({ scoreChanges: special.captureScoreChanges, scoreFlights: special.scoreFlights, faces: special.faces }));
    }
    await capture(page, `${language}-${width}-godori-special`);
    if (!reducedMotion) {
      const activeEffects = await page.evaluate(() => ({ flights: document.querySelectorAll('.hwatu-flight').length, scoreFlights: document.querySelectorAll('.hwatu-score-flight').length, reveals: document.querySelectorAll('.hwatu-combination-reveal').length }));
      await page.evaluate(({ state, language }) => window.minhwatuProof.mount(state, language, 'p1'), { state: await page.evaluate(() => window.minhwatuProof.normalState()), language });
      await page.waitForTimeout(60);
      const resetState = await page.evaluate(() => ({ view: window.minhwatuProof.view('p1'), effects: { flights: document.querySelectorAll('.hwatu-flight').length, scoreFlights: document.querySelectorAll('.hwatu-score-flight').length, reveals: document.querySelectorAll('.hwatu-combination-reveal').length }, freshDeal: Boolean(document.querySelector('.hwatu-motion-note--deal.is-fresh')), deltas: document.querySelectorAll('.game-value-delta').length, flightFaces: [...document.querySelectorAll('.hwatu-flight img')].map(image => new URL(image.src).pathname) }));
      const freshDealFaces = resetState.view.board.table.map(card => { const [month, index] = card.id.split('-').map(Number); return `/images/hwatu/${String(month).padStart(2, '0')}-${String(index).padStart(2, '0')}.svg`; });
      const freshDealOnly = resetState.effects.flights === 0 ? !resetState.freshDeal : resetState.effects.flights === 8 && resetState.freshDeal && resetState.flightFaces.every(src => freshDealFaces.includes(src));
      check(`${language} ${width}: new-game reset clears old effects/deltas and only permits a fresh deal animation`, activeEffects.reveals > 0 && activeEffects.scoreFlights > 0 && resetState.view.log.length === 1 && resetState.view.log[0].type === 'deal' && resetState.view.board.scores.p1 === 0 && freshDealOnly && resetState.effects.scoreFlights === 0 && resetState.effects.reveals === 0 && resetState.deltas === 0, JSON.stringify({ activeEffects, log: resetState.view.log.map(event => event.type), scores: resetState.view.board.scores, effects: resetState.effects, freshDeal: resetState.freshDeal, flightFaces: resetState.flightFaces, deltas: resetState.deltas }));
      await page.waitForFunction(() => !document.querySelector('.hwatu-motion-stage.is-animating') && !document.querySelector('.hwatu-flight'), null, { timeout: 4000 });

      const resetGodori = await page.evaluate(() => window.minhwatuProof.godoriState());
      await page.evaluate(({ state, language }) => window.minhwatuProof.mount(state, language, 'p1'), { state: resetGodori, language });
      await page.waitForTimeout(40);
      await page.locator('.hwatu-hand-choice[data-hwatu-card-id="8-1"]').click();
      await page.locator('.hwatu-confirm').click();
      await page.waitForFunction(() => document.querySelector('.hwatu-combination-reveal[data-hwatu-celebration="godori"]'), null, { timeout: 5000 });
      const effectsBeforeReduced = await page.evaluate(() => ({ flights: document.querySelectorAll('.hwatu-flight').length, scoreFlights: document.querySelectorAll('.hwatu-score-flight').length, reveals: document.querySelectorAll('.hwatu-combination-reveal').length }));
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(() => !document.querySelector('.hwatu-flight') && !document.querySelector('.hwatu-score-flight') && !document.querySelector('.hwatu-combination-reveal'), null, { timeout: 3000 });
      const reducedCleanup = await page.evaluate(() => ({ effects: { flights: document.querySelectorAll('.hwatu-flight').length, scoreFlights: document.querySelectorAll('.hwatu-score-flight').length, reveals: document.querySelectorAll('.hwatu-combination-reveal').length }, godori: window.minhwatuProof.view('p1').log.some(event => event.type === 'special' && event.yaku?.id === 'godori') }));
      check(`${language} ${width}: enabling reduced motion clears active effects but keeps the committed Godori event`, effectsBeforeReduced.reveals > 0 && reducedCleanup.effects.flights === 0 && reducedCleanup.effects.scoreFlights === 0 && reducedCleanup.effects.reveals === 0 && reducedCleanup.godori, JSON.stringify({ effectsBeforeReduced, ...reducedCleanup }));
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    }
    await page.waitForFunction(() => !document.querySelector('.hwatu-motion-stage.is-animating'), null, { timeout: 6000 });

    const opponentView = await page.evaluate(() => window.minhwatuProof.view('p2'));
    const ownerView = await page.evaluate(() => window.minhwatuProof.view('p1'));
    const p1Hand = await page.evaluate(() => window.minhwatuProof.hiddenIds('p1'));
    const p2Hand = await page.evaluate(() => window.minhwatuProof.hiddenIds('p2'));
    const postGodoriVisibleIds = await page.locator('[data-hwatu-card-id]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-hwatu-card-id')));
    const p1LeaksP2AfterGodori = p2Hand.some(id => postGodoriVisibleIds.includes(id));
    const p2LeaksP1AfterGodori = p1Hand.some(id => postGodoriVisibleIds.includes(id));
    check(`${language} ${width}: both seat views show only their own hand after Godori`, ownerView.ownHand.map(card => card.id).join(',') === p1Hand.join(',') && opponentView.ownHand.map(card => card.id).join(',') === p2Hand.join(',') && !p1LeaksP2AfterGodori && !p2LeaksP1AfterGodori, JSON.stringify({ p1OwnIds: ownerView.ownHand.map(card => card.id), p2OwnIds: opponentView.ownHand.map(card => card.id), p1Opponent: ownerView.opponentCount, p2Opponent: opponentView.opponentCount, p1LeaksP2AfterGodori, p2LeaksP1AfterGodori }));
    await page.evaluate(() => window.minhwatuProof.setViewer('p2'));
    await page.locator('.hwatu-hand-choice[data-hwatu-card-id="12-4"]').click();
    await page.locator('.hwatu-confirm').click();
    await page.waitForFunction(() => Boolean(window.minhwatuProof.view('p2').result?.winner), null, { timeout: 5000 });
    const finished = await page.evaluate(() => {
      const view = window.minhwatuProof.view('p2');
      return { result: view.result, status: view.status, events: view.log.map(event => event.type), godoriVisible: view.log.some(event => event.type === 'special' && event.yaku?.id === 'godori' && event.yaku.bonus === 50), p1Godori: view.board.breakdown.p1.yakus.find(item => item.id === 'godori')?.complete };
    });
    check(`${language} ${width}: engine actions reach a caller-visible completed result`, Boolean(finished.result) && finished.status === 'finished' && finished.events.at(-1) === 'win' && finished.godoriVisible && finished.p1Godori, JSON.stringify(finished));
    await page.locator('.hwatu-scoring > summary').click();
    await page.waitForFunction(() => document.querySelector('.hwatu-scoring')?.open === true);
    await page.waitForFunction(() => [...document.querySelectorAll('.hwatu-yaku-list li')].some(item => item.textContent?.includes('Godori') || item.textContent?.includes('고도리')));
    await capture(page, `${language}-${width}-finished-godori`);
    await page.evaluate(() => window.minhwatuProof.setViewer('p1'));
    const finalP1 = await page.evaluate(() => window.minhwatuProof.view('p1'));
    check(`${language} ${width}: the other caller receives the same final result without private hand fields`, finalP1.result?.winner === finished.result.winner && finalP1.status === 'finished' && !('hands' in finalP1) && !('deck' in finalP1), JSON.stringify({ result: finalP1.result, status: finalP1.status, hasHands: 'hands' in finalP1, hasDeck: 'deck' in finalP1 }));
  } finally {
    await context.close();
  }
}

try {
  await testLocale('ko', 1440, 900);
  await testLocale('es', 1920, 1080);
} catch (error) {
  report.errors.push(error instanceof Error ? error.stack || error.message : String(error));
} finally {
  await browser.close();
}

report.summary = { total: report.checks.length, passed: report.checks.filter(item => item.pass).length, failed: report.checks.filter(item => !item.pass).length };
await fs.writeFile(path.join(outputDir, 'minhwatu-native.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (report.summary.failed || report.errors.length) process.exitCode = 1;

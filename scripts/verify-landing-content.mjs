import fs from 'node:fs/promises';
import path from 'node:path';
import { launchChromium } from './playwright-browser.mjs';

const baseUrl = process.env.LANDING_URL;
if (!baseUrl) throw new Error('Set LANDING_URL to the stable landing URL before running this audit.');
const mobile = process.argv.includes('--mobile');
const targetedFailures = process.argv.includes('--targeted-failures');
const output = path.resolve(process.env.PLAYWRIGHT_ARTIFACT_DIR || 'output/current-review/implementation-20261021/content-audit-v2');
await fs.mkdir(output, { recursive: true });

const games = ['davinci', 'catchmind', 'domino', 'jaipur', 'splendor', 'minhwatu', 'marble', 'rhythm'];
// Protected literal snapshot from src/copy/home.ts at ff034ac.
const letter = {
  ko: ['이거 만들면서 네가 보고 어떤 반응을 할까 계속 생각했어.', '네가 가족들이랑 자주 하는 도미노도 같이 해보고 싶었고, 다른 게임도 우리 둘이 하면 재밌을 것 같았어.', '직접 옆에 있으면 더 좋겠지만, 떨어져 있는 동안에도 이렇게 같이 놀 수 있으면 좋겠어.', '아직 부족한 게 있으면 같이 하면서 고쳐갈게.', '사랑해, mami.'],
  es: ['Mientras hacía esto, no dejaba de pensar en qué cara pondrías al verlo.', 'Quería jugar contigo al dominó, que juegas tanto con tu familia, y pensé que los otros juegos también serían divertidos para nosotros dos.', 'Me encantaría estar a tu lado, pero ojalá podamos divertirnos así mientras estamos lejos.', 'Si algo todavía necesita mejorar, lo iremos arreglando mientras jugamos.', 'Te amo, mami.'],
};
const report = { baseUrl, startedAt: new Date().toISOString(), audit: 'browser behavior and accessibility paths; no visual score or GPU performance claim', mobileRun: mobile, targetedFailuresRun: targetedFailures, priorReportCorrection: targetedFailures ? 'content-audit-v2/report.json L06 timeouts were caused by an incorrect harness selector; the hotspot, dialog, drawing, and flip action had already occurred.' : undefined, environments: {}, checks: [], errors: [], failedRequests: [], badResponses: [], requests: [], states: [] };
const check = (name, pass, detail = {}) => report.checks.push({ name, pass: Boolean(pass), detail });
const state = async (page, label) => report.states.push(await page.evaluate(label => ({ label, url: location.href, scrollY, viewport: { width: innerWidth, height: innerHeight }, lang: document.documentElement.lang, storedLanguage: localStorage.getItem('dos-language') }), label));
const wait = (locator, timeout = 5000) => locator.waitFor({ state: 'visible', timeout });
const listen = (page, label) => {
  page.on('pageerror', error => report.errors.push({ label, type: 'pageerror', message: error.message }));
  page.on('console', message => { if (message.type() === 'error') report.errors.push({ label, type: 'console', message: message.text() }); });
  page.on('request', request => report.requests.push({ label, method: request.method(), url: request.url() }));
  page.on('requestfailed', request => report.failedRequests.push({ label, url: request.url(), failure: request.failure()?.errorText || 'requestfailed' }));
  page.on('response', response => { if (response.status() >= 400) report.badResponses.push({ label, status: response.status(), url: response.url() }); });
};
const setInitialLanguage = language => localStorage.setItem('dos-language', language);
const diagnostics = async page => page.evaluate(() => {
  let renderer = 'unavailable';
  try { const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl'); const ext = gl?.getExtension('WEBGL_debug_renderer_info'); renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl ? 'renderer unavailable' : 'WebGL unavailable'; } catch (error) { renderer = String(error); }
  return { userAgent: navigator.userAgent, viewport: { width: innerWidth, height: innerHeight }, dpr: devicePixelRatio, webglRenderer: renderer, claim: 'environment only; no physical GPU performance inference' };
});
const record = async (name, fn) => { try { const result = await fn(); check(name, result.pass, result.detail); } catch (error) { check(name, false, { error: error?.message || String(error), url: error?.url, stack: error?.stack }); } };
const worldReady = page => Promise.all([
  page.locator('.landing-world-host.is-world-ready').waitFor({ state: 'attached', timeout: 90000 }),
  page.locator('.post-hero-preview[data-scene-ready="true"]').waitFor({ state: 'attached', timeout: 90000 }),
]);
const explicitLocale = (page, name) => page.getByRole('button', { name, exact: true });

async function testLandingContext(browser, { language, viewport }) {
  const label = `${viewport.width}-${language}`;
  const context = await browser.newContext({ viewport });
  await context.addInitScript(setInitialLanguage, language);
  const page = await context.newPage(); page.setDefaultTimeout(5000); listen(page, label);
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await wait(page.locator('.landing'), 15000);
  await worldReady(page); // one bounded world-ready wait for this context
  report.environments[label] = await diagnostics(page);
  await state(page, `${label}:landing-ready`);

  if (!targetedFailures) await record(`${label}: locale controls have explicit KO and ES · RD names`, async () => {
    const ko = explicitLocale(page, 'KO'), es = explicitLocale(page, 'ES · RD');
    return { pass: await ko.count() === 1 && await es.count() === 1 && await ko.isVisible() && await es.isVisible(), detail: { ko: await ko.count(), es: await es.count(), lang: await page.locator('html').getAttribute('lang') } };
  });
  if (!targetedFailures) await record(`${label}: default flow excludes toy catalog, standalone table, shared panel, and auth`, async () => {
    const detail = await page.evaluate(() => {
      const ordered = ['#distance', '#games', '#letter-scene', '#papi-letter', '.ending'].map((selector, index) => {
        const node = document.querySelector(selector); return node ? index === 4 ? 'ending' : node.id : null;
      });
      const gallery = document.querySelector('#games'), anchor = document.querySelector('#toy-table');
      return {
        ordered, toyTableIsInternalAnchor: anchor?.tagName === 'SPAN' && anchor.closest('#distance') === document.querySelector('#distance'),
        independentToySections: document.querySelectorAll('section#toy-table, .other-objects, .toy-affordance, .toy-affordances, [data-toy-catalog], [data-local-event], [data-local-related]').length,
        extraChaptersAfterGallery: gallery && document.querySelector('#letter-scene') ? [...document.querySelectorAll('.chapter')].filter(node => gallery.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING && (document.querySelector('#letter-scene').compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING)).length : -1,
        sharedPanels: document.querySelectorAll('.shared-events,[data-shared-event-panel]').length,
        activeRoomDetails: document.querySelectorAll('.room-discovery-dialog[open], [data-active-local-event]').length,
        visibleAuth: [...document.querySelectorAll('button,a,input,[role="dialog"]')].some(el => { const r = el.getBoundingClientRect(); return r.width && r.height && /auth|sign in|login|로그인/i.test(`${el.textContent} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('placeholder') || ''}`); }),
        roomObjects: [...document.querySelectorAll('[data-room-object]')].map(el => el.getAttribute('data-room-object')),
        galleryBeforeLetter: Boolean(gallery && gallery.compareDocumentPosition(document.querySelector('#letter-scene')) & Node.DOCUMENT_POSITION_FOLLOWING),
      };
    });
    const expected = ['distance', 'games', 'letter-scene', 'papi-letter', 'ending'];
    return { pass: JSON.stringify(detail.ordered) === JSON.stringify(expected) && detail.toyTableIsInternalAnchor && detail.independentToySections === 0 && detail.extraChaptersAfterGallery === 0 && detail.sharedPanels === 0 && detail.activeRoomDetails === 0 && !detail.visibleAuth && JSON.stringify(detail.roomObjects.sort()) === JSON.stringify(['L04', 'L06', 'L09']) && detail.galleryBeforeLetter, detail };
  });
  const authPattern = /\/(?:auth\/v1|realtime\/v1)(?:\/|\?|$)/i;
  const defaultAuthRequests = () => report.requests.filter(item => item.label === label && authPattern.test(item.url));
  if (!targetedFailures) await record(`${label}: default landing makes no shared-auth/realtime request`, async () => ({ pass: defaultAuthRequests().length === 0, detail: { requests: defaultAuthRequests() } }));

  // Exercise the stable B arrival and all three real projected discovery targets with pointer input.
  let bReady = false;
  const prepareB = async () => {
    const targetY = Math.round(viewport.height * 2.6);
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), targetY);
    await page.locator('.room-discoveries:not([hidden])').waitFor({ state: 'attached', timeout: 5000 });
    await page.waitForFunction(() => Number(document.querySelector('.landing-world-canvas')?.dataset.progress || 0) > .99, null, { timeout: 5000 });
    const arrival = await page.evaluate(() => ({ y: scrollY, height: innerHeight, progress: Number(document.querySelector('.landing-world-canvas')?.dataset.progress || 0), objects: [...document.querySelectorAll('[data-room-object]')].map(el => ({ id: el.getAttribute('data-room-object'), rect: (() => { const r = el.getBoundingClientRect(); return { x:r.x,y:r.y,w:r.width,h:r.height }; })() })) }));
    bReady = arrival.progress > .99 && arrival.objects.length === 3;
    await state(page, `${label}:approved-B-arrival`);
    return { pass: bReady, detail: { requestedY: targetY, ...arrival } };
  };
  if (targetedFailures) {
    const arrival = await prepareB();
    if (!arrival.pass) throw new Error(`Could not reach approved-B arrival for targeted L06 check: ${JSON.stringify(arrival.detail)}`);
  } else await record(`${label}: actual scroll reaches stable approved-B arrival before hotspots`, prepareB);
  const clickProjected = async id => {
    const target = page.locator(`[data-room-object="${id}"]`);
    const point = await target.evaluate(el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, width: r.width, height: r.height, hidden: el.closest('.room-discoveries')?.hasAttribute('hidden'), hit: document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('[data-room-object]')?.getAttribute('data-room-object') }; });
    if (point.hidden || point.width < 1 || point.height < 1 || point.hit !== id) throw new Error(`Projected hotspot not pointer-hit-testable: ${JSON.stringify(point)}`);
    await page.mouse.move(point.x, point.y); await page.mouse.click(point.x, point.y); return point;
  };
  for (const id of bReady ? (targetedFailures ? ['L09', 'L06'] : ['L04', 'L09', 'L06']) : []) {
    await record(`${label}: B hotspot ${id} opens its real native room dialog and Escape restores focus/scroll`, async () => {
      const dialog = page.locator('dialog.room-discovery-dialog');
      if (await dialog.evaluate(el => el.open)) { await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('dialog.room-discovery-dialog')?.open, null, { timeout: 5000 }); }
      const before = await page.evaluate(() => ({ y: scrollY, x: scrollX }));
      const point = await clickProjected(id);
      await page.waitForFunction(expected => { const d = document.querySelector('dialog.room-discovery-dialog'); return d?.open && d.querySelector('[data-active-local-event]')?.getAttribute('data-active-local-event') === expected; }, id, { timeout: 5000 });
      const modal = await dialog.evaluate(el => el.matches(':modal'));
      const current = await page.locator('[data-active-local-event]').getAttribute('data-active-local-event');
      let extra = {};
      if (id === 'L09') {
        extra.photos = await dialog.locator('.joker-pair img').evaluateAll(imgs => imgs.map(img => ({ alt: img.alt, loaded: img.complete && img.naturalWidth > 0, src: img.getAttribute('src') })));
        await dialog.locator('[data-local-related="L01"]').click();
        await page.waitForFunction(() => document.querySelector('.room-discovery-dialog [data-active-local-event="L01"]'), null, { timeout: 5000 });
        await dialog.locator('[data-active-local-event="L01"] [data-local-related="L15"]').click();
        await page.waitForFunction(() => document.querySelector('.room-discovery-dialog [data-active-local-event="L15"]'), null, { timeout: 5000 });
        const decorLabel = language === 'ko' ? '보석' : 'Gema';
        const decorChoice = dialog.getByRole('button', { name: decorLabel, exact: true });
        await decorChoice.click();
        extra.savedDecor = { kind: decorLabel, selected: await decorChoice.getAttribute('aria-pressed') === 'true' };
      }
      if (id === 'L06') {
        const paper = dialog.locator('.drawing-paper'), box = await paper.boundingBox();
        if (!box) throw new Error('L06 drawing surface has no rendered box.');
        const start = { x: box.x + box.width * .2, y: box.y + box.height * .65 }, end = { x: box.x + box.width * .78, y: box.y + box.height * .3 };
        await page.mouse.move(start.x, start.y); await page.mouse.down();
        for (let step = 1; step <= 8; step++) await page.mouse.move(start.x + (end.x - start.x) * step / 8, start.y + (end.y - start.y) * step / 8);
        await page.mouse.up();
        const flipLabel = language === 'ko' ? '카드로 뒤집기' : 'Voltear a tarjeta';
        const beforeView = await dialog.locator('.drawing-surface').getAttribute('data-drawing-view');
        const beforeStrokes = await paper.locator('polyline').evaluateAll(paths => paths.map(path => ({ points: path.getAttribute('points'), stroke: path.getAttribute('stroke'), width: path.getAttribute('stroke-width') })));
        const flip = dialog.getByRole('button', { name: flipLabel, exact: true }); await flip.click();
        const backLabel = language === 'ko' ? '그림으로 돌아가기' : 'Volver al dibujo';
        const backFlip = dialog.getByRole('button', { name: backLabel, exact: true });
        await page.waitForFunction(expectedLabel => {
          const dialog = document.querySelector('.room-discovery-dialog');
          const cardSurface = dialog?.querySelector('.drawing-surface[data-drawing-view="card"]');
          const flip = dialog?.querySelector('#local-event-controls[data-active-local-event="L06"] .egg-actions button.egg-primary[aria-pressed="true"]');
          return Boolean(cardSurface && flip && flip.textContent.trim() === expectedLabel);
        }, backLabel, { timeout: 5000 });
        const afterStrokes = await paper.locator('polyline').evaluateAll(paths => paths.map(path => ({ points: path.getAttribute('points'), stroke: path.getAttribute('stroke'), width: path.getAttribute('stroke-width') })));
        const cardSurface = dialog.locator('.drawing-surface[data-drawing-view="card"]');
        const cardNote = dialog.locator('.drawing-card-note');
        const noteText = (await cardNote.innerText()).trim();
        const expectedNote = language === 'ko' ? '네 그림으로 만든 카드야 haha' : 'Tu dibujo, hecho tarjeta. haha';
        const signature = dialog.locator('.drawing-card-signature');
        const signatureText = (await signature.innerText()).trim();
        const expectedSignature = language === 'ko' ? 'Baby에게' : 'Para ti, Baby.';
        const svgLabel = await paper.getAttribute('aria-label');
        const expectedSvgLabel = language === 'ko' ? '네 그림이 담긴 카드' : 'Tu tarjeta con el mismo dibujo';
        extra.drawing = { beforeView, polylines: beforeStrokes.length, afterPolylines: afterStrokes.length, strokesPreserved: JSON.stringify(beforeStrokes) === JSON.stringify(afterStrokes), flipped: await cardSurface.count() === 1 && await backFlip.getAttribute('aria-pressed') === 'true', cardNote: await cardNote.isVisible() && noteText === expectedNote, signature: await signature.isVisible() && signatureText === expectedSignature, signatureText, svgVisible: await paper.isVisible(), svgLabel, expectedSvgLabel, noteText };
      }
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('dialog.room-discovery-dialog')?.open, null, { timeout: 5000 });
      await page.waitForFunction(expected => document.activeElement?.getAttribute('data-room-object') === expected, id, { timeout: 5000 });
      const after = await page.evaluate(() => ({ y: scrollY, x: scrollX }));
      if (id === 'L06') {
        const ending = page.locator('#together-again');
        await ending.scrollIntoViewIfNeeded();
        const recall = ending.locator('.action-recall');
        await recall.waitFor({ state: 'visible', timeout: 5000 });
        const endingDrawing = ending.locator('.ending-drawing');
        const endingStrokes = await endingDrawing.locator('polyline').evaluateAll(paths => paths.map(path => ({ points: path.getAttribute('points'), stroke: path.getAttribute('stroke'), width: path.getAttribute('stroke-width') })));
        const decorLabel = language === 'ko' ? '네가 고른 보석' : 'La gema que elegiste';
        const endingDecor = ending.locator('.ending-decor');
        const endingLinks = {
          play: ending.locator('.ending-actions .primary-button'),
          feedback: ending.locator('.ending-actions .text-button'),
          back: ending.locator('footer a'),
        };
        const playHref = await endingLinks.play.getAttribute('href');
        const playUrl = new URL(playHref, page.url());
        const feedbackText = (await endingLinks.feedback.innerText()).trim();
        const backText = (await endingLinks.back.innerText()).trim();
        const expectedPlay = language === 'ko' ? '같이 놀자 ♡' : 'Vamos a jugar ♡';
        const expectedFeedback = language === 'ko' ? 'Mami의 아이디어' : 'Ideas de Mami';
        const expectedBack = language === 'ko' ? '처음으로' : 'Volver arriba';
        extra.ending = {
          drawingVisible: await endingDrawing.isVisible(),
          drawingMatchesSession: JSON.stringify(endingStrokes) === JSON.stringify(afterStrokes),
          sessionStrokes: afterStrokes.length,
          endingStrokes: endingStrokes.length,
          decorVisible: await endingDecor.isVisible(),
          decorLabel: await endingDecor.getAttribute('aria-label') || await endingDecor.getAttribute('alt'),
          expectedDecorLabel: decorLabel,
          play: { href: playHref, path: playUrl.pathname, game: playUrl.searchParams.get('game'), label: (await endingLinks.play.innerText()).trim() },
          feedback: { href: await endingLinks.feedback.getAttribute('href'), label: feedbackText },
          back: { href: await endingLinks.back.getAttribute('href'), label: backText },
          localizedLinks: (await endingLinks.play.innerText()).trim().startsWith(expectedPlay) && feedbackText.startsWith(expectedFeedback) && backText.startsWith(expectedBack),
        };
        extra.endingRecall = (await recall.innerText()).trim() === (language === 'ko' ? '네가 그린 카드도 여기 두었어.' : 'Tu tarjeta también se queda aquí.');
      }
      return { pass: modal && current === id && Math.abs(after.y - before.y) < 3 && Math.abs(after.x - before.x) < 3 && (id !== 'L09' || extra.photos?.length === 2 && extra.photos.every(photo => photo.loaded) && extra.savedDecor?.selected) && (id !== 'L06' || extra.drawing.beforeView === 'paper' && extra.drawing.polylines > 0 && extra.drawing.afterPolylines === extra.drawing.polylines && extra.drawing.strokesPreserved && extra.drawing.flipped && extra.drawing.cardNote && extra.drawing.signature && extra.drawing.svgVisible && extra.drawing.svgLabel === extra.drawing.expectedSvgLabel && extra.endingRecall && extra.ending.drawingVisible && extra.ending.drawingMatchesSession && extra.ending.sessionStrokes > 0 && extra.ending.endingStrokes === extra.ending.sessionStrokes && extra.ending.decorVisible && extra.ending.decorLabel === extra.ending.expectedDecorLabel && extra.ending.play.path === '/play' && games.includes(extra.ending.play.game) && extra.ending.feedback.href === '/feedback' && extra.ending.back.href === '#home' && extra.ending.localizedLinks), detail: { point, before, after, modal, current, ...extra } };
    });
  }

  await record(`${label}: named locale buttons switch both ways and persist through feedback navigation/reload`, async () => {
    const other = language === 'ko' ? 'es' : 'ko';
    await explicitLocale(page, other === 'ko' ? 'KO' : 'ES · RD').click();
    await page.waitForFunction(expected => localStorage.getItem('dos-language') === expected && document.documentElement.lang.startsWith(expected), other, { timeout: 5000 });
    await explicitLocale(page, language === 'ko' ? 'KO' : 'ES · RD').click();
    await page.waitForFunction(expected => localStorage.getItem('dos-language') === expected && (expected === 'es' ? document.documentElement.lang === 'es-DO' : document.documentElement.lang === 'ko'), language, { timeout: 5000 });
    await page.locator('.landing-nav nav').getByRole('link', { name: language === 'ko' ? 'Mami의 아이디어' : 'Ideas de Mami', exact: true }).click();
    await wait(page.locator('.feedback-setup'));
    const feedback = { path: new URL(page.url()).pathname, lang: await page.locator('html').getAttribute('lang'), stored: await page.evaluate(() => localStorage.getItem('dos-language')) };
    await page.reload({ waitUntil: 'domcontentloaded' }); await wait(page.locator('.feedback-setup'));
    const reload = { lang: await page.locator('html').getAttribute('lang'), stored: await page.evaluate(() => localStorage.getItem('dos-language')) };
    await page.locator('.landing-nav nav').getByRole('link', { name: language === 'ko' ? '게임' : 'Juegos', exact: true }).click(); await wait(page.locator('.lobby-main'), 10000);
    const playNav = { path: new URL(page.url()).pathname, lang: await page.locator('html').getAttribute('lang'), stored: await page.evaluate(() => localStorage.getItem('dos-language')) };
    return { pass: feedback.path === '/feedback' && feedback.lang === (language === 'es' ? 'es-DO' : 'ko') && feedback.stored === language && reload.lang === feedback.lang && reload.stored === language && playNav.path === '/play' && playNav.lang === reload.lang && playNav.stored === language, detail: { feedback, reload, playNav } };
  });

  // Verify actual gallery-to-lobby initialization, including query selection and language persistence.
  if (!targetedFailures) for (const game of games) {
    await record(`${label}: gallery selection ${game} updates caption/link and enters matching play setup`, async () => {
      if (new URL(page.url()).pathname !== '/') { await page.goto(baseUrl, { waitUntil: 'domcontentloaded' }); await wait(page.locator('.landing'), 15000); }
      const button = page.locator(`#games [data-game="${game}"]`); await button.scrollIntoViewIfNeeded(); await button.click();
      await page.waitForFunction(id => document.querySelector(`#games [data-game="${id}"]`)?.getAttribute('aria-pressed') === 'true', game, { timeout: 5000 });
      const caption = (await page.locator('#games .rd-game-caption h3').innerText()).trim();
      const start = page.locator('#games .rd-game-start'); const href = await start.getAttribute('href');
      if (href !== `/play?game=${game}` || !caption) return { pass: false, detail: { selected: game, caption, href } };
      await start.click(); await page.waitForURL(url => url.pathname === '/play' && url.searchParams.get('game') === game, { timeout: 5000 });
      await wait(page.locator('.lobby-main'), 10000);
      await page.waitForFunction(expected => document.documentElement.lang === (expected === 'es' ? 'es-DO' : 'ko'), language, { timeout: 5000 });
      const selected = page.locator('.lobby-picks .pick-item[aria-pressed="true"]'); await wait(selected, 5000);
      const setup = { path: new URL(page.url()).pathname, query: new URL(page.url()).searchParams.get('game'), pickedTitle: (await selected.locator('.pick-name b').innerText()).trim(), galleryTitle: caption, lang: await page.locator('html').getAttribute('lang'), stored: await page.evaluate(() => localStorage.getItem('dos-language')) };
      await page.reload({ waitUntil: 'domcontentloaded' }); await wait(page.locator('.lobby-main'), 10000);
      const reloadPick = await page.locator('.lobby-picks .pick-item[aria-pressed="true"] .pick-name b').innerText();
      const reload = { lang: await page.locator('html').getAttribute('lang'), stored: await page.evaluate(() => localStorage.getItem('dos-language')), selectedTitle: reloadPick.trim() };
      return { pass: setup.path === '/play' && setup.query === game && setup.pickedTitle === setup.galleryTitle && setup.lang === (language === 'es' ? 'es-DO' : 'ko') && setup.stored === language && reload.lang === setup.lang && reload.stored === language && reload.selectedTitle === setup.pickedTitle, detail: { setup, reload } };
    });
  }

  if (!targetedFailures) await record(`${label}: direct letter hash reads, folds, and reopens the exact five-paragraph source copy`, async () => {
    await page.goto(`${new URL(baseUrl).origin}/#papi-letter`, { waitUntil: 'domcontentloaded' });
    await wait(page.locator('#moment-letter-copy')); await page.waitForFunction(() => location.hash === '#papi-letter' && Number(document.querySelector('.post-hero-preview')?.getAttribute('data-opening') || 0) > .9, null, { timeout: 5000 });
    const paragraphs = page.locator('#moment-letter-copy > p:not(.letter-address):not(.letter-signature)');
    await page.waitForFunction(() => document.querySelectorAll('#moment-letter-copy > p:not(.letter-address):not(.letter-signature)').length === 5, null, { timeout: 5000 });
    const actual = async () => (await paragraphs.allTextContents()).map(value => value.trim());
    const initial = await actual();
    const toggle = page.locator('.letter-section-label button[aria-controls="moment-letter-copy"]');
    await toggle.click(); await page.locator('#moment-letter-copy').waitFor({ state: 'hidden', timeout: 5000 });
    const closed = await toggle.getAttribute('aria-expanded');
    await page.locator('.closed-note button').click(); await page.waitForFunction(() => Number(document.querySelector('.post-hero-preview')?.getAttribute('data-opening') || 0) > .9, null, { timeout: 5000 });
    const reopened = await actual();
    return { pass: JSON.stringify(initial) === JSON.stringify(letter[language]) && closed === 'false' && JSON.stringify(reopened) === JSON.stringify(letter[language]) && new URL(page.url()).hash === '#papi-letter', detail: { hash: new URL(page.url()).hash, initial, closed, reopened, expanded: await toggle.getAttribute('aria-expanded') } };
  });
  await state(page, `${label}:complete`);
  await context.close();
}

const browser = await launchChromium();
try {
  report.browser = browser.version();
  for (const config of [{ language: 'ko', viewport: { width: 1920, height: 1080 } }, { language: 'es', viewport: { width: 1440, height: 900 } }]) await testLandingContext(browser, config);
  if (mobile) {
    for (const language of ['ko', 'es']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      await context.addInitScript(setInitialLanguage, language); const page = await context.newPage(); listen(page, `${language}-mobile`);
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' }); await wait(page.locator('.landing'), 15000); await worldReady(page);
      const size = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
      check(`${language}-mobile: page has no horizontal overflow`, size.scrollWidth <= size.clientWidth + 1, size); await context.close();
    }
  }
} catch (error) {
  report.errors.push({ type: 'audit', message: error?.stack || String(error) });
} finally { await browser.close(); }
report.finishedAt = new Date().toISOString();
report.summary = { checks: report.checks.length, failedChecks: report.checks.filter(item => !item.pass).length, errors: report.errors.length, failedRequests: report.failedRequests.length, badResponses: report.badResponses.length, gpuPerformanceClaim: false };
await fs.writeFile(path.join(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ summary: report.summary, failed: report.checks.filter(item => !item.pass), errors: report.errors, failedRequests: report.failedRequests, badResponses: report.badResponses, report: path.join(output, 'report.json') }, null, 2));
if (report.summary.failedChecks || report.summary.errors || report.failedRequests.length || report.badResponses.length) process.exitCode = 1;

import fs from 'node:fs/promises';
import path from 'node:path';
import { launchChromium } from './playwright-browser.mjs';

const baseUrl = process.env.LANDING_URL;
if (!baseUrl) throw new Error('Set LANDING_URL to the stable landing URL before running this audit.');
const mobile = process.argv.includes('--mobile');
const output = path.resolve(process.env.PLAYWRIGHT_ARTIFACT_DIR || 'output/playwright/landing-content');
await fs.mkdir(output, { recursive: true });

const games = ['davinci', 'catchmind', 'domino', 'jaipur', 'splendor', 'minhwatu', 'marble', 'rhythm'];
const letters = {
  ko: [
    '이거 만들면서 네가 보고 어떤 반응을 할까 계속 생각했어.',
    '네가 가족들이랑 자주 하는 도미노도 같이 해보고 싶었고, 다른 게임도 우리 둘이 하면 재밌을 것 같았어.',
    '직접 옆에 있으면 더 좋겠지만, 떨어져 있는 동안에도 이렇게 같이 놀 수 있으면 좋겠어.',
    '아직 부족한 게 있으면 같이 하면서 고쳐갈게.',
    '사랑해, mami.',
  ],
  es: [
    'Mientras hacía esto, no dejaba de pensar en qué cara pondrías al verlo.',
    'Quería jugar contigo al dominó, que juegas tanto con tu familia, y pensé que los otros juegos también serían divertidos para nosotros dos.',
    'Me encantaría estar a tu lado, pero ojalá podamos divertirnos así mientras estamos lejos.',
    'Si algo todavía necesita mejorar, lo iremos arreglando mientras jugamos.',
    'Te amo, mami.',
  ],
};
const report = {
  baseUrl,
  startedAt: new Date().toISOString(),
  audit: 'landing content and interaction behavior; no GPU performance claim',
  mobileRun: mobile,
  environment: {}, checks: [], errors: [], failedRequests: [], badResponses: [], requests: [], states: [],
};
const check = (name, pass, detail = {}) => report.checks.push({ name, pass: Boolean(pass), detail });
const note = (page, label) => {
  page.on('pageerror', error => report.errors.push({ label, type: 'pageerror', message: error.message }));
  page.on('console', message => {
    if (message.type() === 'error') report.errors.push({ label, type: 'console', message: message.text() });
  });
  page.on('request', request => {
    const url = request.url();
    report.requests.push({ label, method: request.method(), url });
    if (request.failure()) report.failedRequests.push({ label, url, failure: request.failure().errorText });
  });
  page.on('requestfailed', request => report.failedRequests.push({ label, url: request.url(), failure: request.failure()?.errorText || 'requestfailed' }));
  page.on('response', response => {
    if (response.status() >= 400) report.badResponses.push({ label, status: response.status(), url: response.url() });
  });
};
const visible = locator => locator.evaluate(el => {
  const r = el.getBoundingClientRect(), s = getComputedStyle(el);
  return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0;
});
const snapshot = async (page, label) => report.states.push(await page.evaluate(label => ({
  label, url: location.href, scroll: { x: scrollX, y: scrollY }, viewport: { width: innerWidth, height: innerHeight },
  language: document.documentElement.lang, storedLanguage: localStorage.getItem('dos-language'),
}), label));
const waitForHost = page => page.locator('.post-hero-preview').waitFor({ state: 'visible', timeout: 20000 });

const browser = await launchChromium();
try {
  report.environment.browser = browser.version();
  for (const language of ['ko', 'es']) {
    for (const viewport of [{ width: 1920, height: 1080 }, { width: 1440, height: 900 }]) {
      const context = await browser.newContext({ viewport });
      await context.addInitScript(value => localStorage.setItem('dos-language', value), language);
      const page = await context.newPage();
      const label = `${language}-${viewport.width}x${viewport.height}`;
      note(page, label);
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      await page.locator('.landing').waitFor({ state: 'visible', timeout: 15000 });
      await waitForHost(page);
      report.environment[label] = await page.evaluate(() => {
        let renderer = 'unavailable';
        try {
          const canvas = document.createElement('canvas'), gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
          const extension = gl?.getExtension('WEBGL_debug_renderer_info');
          renderer = extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : (gl ? 'renderer information unavailable' : 'WebGL unavailable');
        } catch (error) { renderer = String(error); }
        return { userAgent: navigator.userAgent, viewport: { width: innerWidth, height: innerHeight }, devicePixelRatio, webglRenderer: renderer, performanceClaim: 'none; environment only' };
      });
      await snapshot(page, `${label}:initial`);

      const nav = page.locator('.landing-nav nav');
      check(`${label}: nav includes play, letter, feedback and both locales`,
        await nav.locator('a[href="/play"]').count() === 1 && await nav.locator('a[href="#papi-letter"]').count() === 1 && await nav.locator('a[href="/feedback"]').count() === 1 && await nav.locator('button[aria-pressed]').count() === 2,
        { links: await nav.locator('a').evaluateAll(links => links.map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') }))) });

      const defaultFlow = await page.evaluate(() => {
        const gallery = document.querySelector('#games');
        const after = gallery ? [...gallery.parentElement.querySelectorAll(':scope > section')].filter(section => section.compareDocumentPosition(gallery) & Node.DOCUMENT_POSITION_PRECEDING).map(section => section.id || section.className) : [];
        const flow = [...document.querySelectorAll('#games, #letter-scene, #papi-letter, .ending')].map(el => el.id || 'ending');
        return {
          flow, oldChapters: [...document.querySelectorAll('.moment-notes, .moment-translation-limit, .moment-catchmind-link, #ideas, .story-translation, .story-invitation')].length,
          sharedPanels: document.querySelectorAll('.shared-events').length,
          visibleAuth: [...document.querySelectorAll('input,button,a,[role="dialog"]')].some(el => /login|log in|sign in|인증|로그인/i.test(`${el.textContent} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('placeholder') || ''}`) && (() => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; })()),
          after,
        };
      });
      check(`${label}: default post-gallery flow has no independent legacy chapters or shared/auth UI`,
        JSON.stringify(defaultFlow.flow) === JSON.stringify(['games', 'letter-scene', 'papi-letter', 'ending']) && defaultFlow.oldChapters === 0 && defaultFlow.sharedPanels === 0 && !defaultFlow.visibleAuth,
        defaultFlow);

      const languageToggle = nav.locator(`button[aria-pressed="${language === 'ko' ? 'false' : 'true'}"]`).first();
      await languageToggle.click();
      const changedLanguage = language === 'ko' ? 'es' : 'ko';
      await page.waitForFunction(expected => localStorage.getItem('dos-language') === expected, changedLanguage);
      check(`${label}: locale switch updates DOM language and persists`,
        (await page.locator('html').getAttribute('lang'))?.startsWith(changedLanguage) && await page.evaluate(() => localStorage.getItem('dos-language')) === changedLanguage,
        { lang: await page.locator('html').getAttribute('lang'), stored: await page.evaluate(() => localStorage.getItem('dos-language')) });
      await page.goto(new URL('/feedback', baseUrl).href, { waitUntil: 'domcontentloaded' });
      await page.locator('.feedback-setup').waitFor({ state: 'visible', timeout: 10000 });
      await snapshot(page, `${label}:feedback`);
      check(`${label}: feedback navigation resolves`, new URL(page.url()).pathname === '/feedback');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('.feedback-setup').waitFor({ state: 'visible', timeout: 10000 });
      check(`${label}: selected locale survives navigation and reload`, await page.evaluate(() => localStorage.getItem('dos-language')) === changedLanguage && (await page.locator('html').getAttribute('lang'))?.startsWith(changedLanguage), { url: page.url(), lang: await page.locator('html').getAttribute('lang'), stored: await page.evaluate(() => localStorage.getItem('dos-language')) });
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      await waitForHost(page);
      check(`${label}: play navigation resolves`, await nav.locator('a[href="/play"]').count() === 1);
      await nav.locator('a[href="/play"]').click();
      await page.waitForURL(url => url.pathname === '/play', { timeout: 10000 });
      await snapshot(page, `${label}:play`);
      check(`${label}: /play navigation reaches the game route`, new URL(page.url()).pathname === '/play', { url: page.url() });
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      await waitForHost(page);
      const restoreLocale = page.locator(`.landing-nav nav button[aria-pressed="${language === 'ko' ? 'false' : 'true'}"]`).first();
      await restoreLocale.click();
      await page.waitForFunction(expected => localStorage.getItem('dos-language') === expected, language);

      const buttons = page.locator('#games [data-game]');
      await buttons.first().waitFor({ state: 'visible', timeout: 10000 });
      for (const game of games) {
        const button = page.locator(`#games [data-game="${game}"]`);
        await button.scrollIntoViewIfNeeded();
        await button.click();
        await page.waitForFunction(id => document.querySelector(`#games [data-game="${id}"]`)?.getAttribute('aria-pressed') === 'true', game);
        const caption = page.locator('#games .rd-game-caption h3');
        const href = await page.locator('#games .rd-game-start').getAttribute('href');
        const title = (await caption.innerText()).trim();
        check(`${label}: ${game} choice updates live caption and play href`, Boolean(title) && href === `/play?game=${game}`, { game, title, href });
        await snapshot(page, `${label}:gallery:${game}`);
      }

      await page.goto(`${new URL(baseUrl).origin}/#papi-letter`, { waitUntil: 'domcontentloaded' });
      await waitForHost(page);
      await page.waitForFunction(() => location.hash === '#papi-letter' && document.querySelector('#moment-letter-copy p:not(.letter-address):not(.letter-signature)'));
      await snapshot(page, `${label}:direct-letter-hash`);
      const letterCopy = page.locator('#moment-letter-copy > p:not(.letter-address):not(.letter-signature)');
      await page.waitForFunction(() => [...document.querySelectorAll('#moment-letter-copy > p:not(.letter-address):not(.letter-signature)')].length === 5, null, { timeout: 8000 });
      const actualLetter = await letterCopy.allTextContents();
      const letterState = { visible: await visible(page.locator('#moment-letter-copy')), expanded: await page.locator('.letter-section-label button[aria-controls="moment-letter-copy"]').getAttribute('aria-expanded'), opening: Number(await page.locator('.post-hero-preview').getAttribute('data-opening')) };
      check(`${label}: direct #papi-letter hash opens the exact five-paragraph baseline`, JSON.stringify(actualLetter.map(text => text.trim())) === JSON.stringify(letters[language]) && letterState.visible && letterState.expanded === 'true' && letterState.opening > 0.9, { url: page.url(), scrollY: await page.evaluate(() => scrollY), paragraphs: actualLetter.map(text => text.trim()), letterState });
      const letterToggle = page.locator('.letter-section-label button[aria-controls="moment-letter-copy"]');
      await letterToggle.click();
      await page.waitForFunction(() => document.querySelector('#moment-letter-copy')?.hidden === true || document.querySelector('.letter-section-label button')?.getAttribute('aria-expanded') === 'false');
      const closed = await letterToggle.getAttribute('aria-expanded') === 'false' || !(await visible(page.locator('#moment-letter-copy')));
      await letterToggle.click();
      await page.waitForFunction(() => document.querySelector('.letter-section-label button')?.getAttribute('aria-expanded') === 'true');
      check(`${label}: letter recloses and reopens with original copy intact`, closed && JSON.stringify((await letterCopy.allTextContents()).map(text => text.trim())) === JSON.stringify(letters[language]), { closed, expanded: await letterToggle.getAttribute('aria-expanded'), paragraphs: await letterCopy.allTextContents() });

      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      await waitForHost(page);
      const sharedPattern = /(?:auth\/v1|realtime\/v1|shared-events)/i;
      const noSharedAtStart = report.requests.filter(request => request.label === label && sharedPattern.test(request.url)).length;
      const regionById = { L01: 'table', L02: 'table', L03: 'distance', L04: 'table', L05: 'table', L06: 'table', L07: 'table', L08: 'table', L09: 'table', L10: 'table', L11: 'envelope', L12: 'table', L13: 'distance', L14: 'table', L15: 'table', L16: 'distance' };
      await page.locator('.other-objects').evaluate(el => { el.open = true; });
      for (let number = 1; number <= 16; number++) {
        const id = `L${String(number).padStart(2, '0')}`;
        const candidates = page.locator(`[data-local-event="${id}"]`);
        let trigger = null;
        for (let i = 0; i < await candidates.count(); i++) {
          const candidate = candidates.nth(i);
          if (!await visible(candidate)) await candidate.evaluate(el => {
            for (let details = el.closest('details'); details; details = details.parentElement?.closest('details')) details.open = true;
          });
          if (await visible(candidate)) { trigger = candidate; break; }
        }
        if (!trigger) { check(`${label}: ${id} contextual detail has an accessible opener`, false, { count: await candidates.count() }); continue; }
        await trigger.scrollIntoViewIfNeeded();
        const beforeScroll = await page.evaluate(() => scrollY);
        await trigger.click();
        const active = page.locator('[data-active-local-event]');
        await page.waitForFunction(expected => document.querySelector('[data-active-local-event]')?.getAttribute('data-active-local-event') === expected, id);
        const focusTarget = await trigger.elementHandle();
        const region = await page.locator('.context-workbench[data-detail-region]').getAttribute('data-detail-region');
        const sameRegion = region === regionById[id];
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.querySelector('[data-active-local-event]'));
        await page.waitForFunction(() => document.activeElement?.matches('[data-local-event]'));
        const restored = await page.evaluate(el => document.activeElement === el, focusTarget);
        const scrollAfter = await page.evaluate(() => scrollY);
        check(`${label}: ${id} opens in its context, Escape closes and restores focus without scrolling`, sameRegion && restored && Math.abs(scrollAfter - beforeScroll) < 4, { id, expectedRegion: regionById[id], actualRegion: region, restored, beforeScroll, scrollAfter, activeAfter: await active.count() });
        await snapshot(page, `${label}:local-context:${id}`);
      }

      const sharedCases = [
        { id: 'R01', opener: page.locator('[data-shared-event="R01"]') },
        { id: 'R02', local: 'L15' }, { id: 'R03', local: 'L06' }, { id: 'R04', local: 'L07' },
      ];
      for (const item of sharedCases) {
        let opener;
        if (item.local) {
          opener = page.locator(`[data-local-event="${item.local}"]`).filter({ visible: true }).first();
          await opener.scrollIntoViewIfNeeded();
          await opener.click();
          await page.locator(`[data-active-local-event="${item.local}"]`).waitFor({ state: 'visible' });
          opener = page.locator('.shared-context-choice');
        }
        await opener.scrollIntoViewIfNeeded();
        await opener.click();
        await page.locator('.shared-events').waitFor({ state: 'visible', timeout: 7000 });
        const eventAttribute = await page.locator('.shared-events').getAttribute('data-initial-event-id');
        const visibleAuth = await page.locator('.shared-events').evaluate(el => [...el.querySelectorAll('input,button,[role="dialog"]')].some(node => /login|sign in|인증|로그인/i.test(`${node.textContent} ${node.getAttribute('aria-label') || ''} ${node.getAttribute('placeholder') || ''}`)));
        const requestsAtPanelOpen = report.requests.filter(request => request.label === label && sharedPattern.test(request.url)).length;
        check(`${label}: ${item.id} shared-event context seeds correctly without forced auth`, eventAttribute === item.id && !visibleAuth && noSharedAtStart === 0 && requestsAtPanelOpen === noSharedAtStart, { expectedEvent: item.id, eventAttribute, visibleAuth, sharedRequestsBefore: noSharedAtStart, sharedRequestsAtPanelOpen: requestsAtPanelOpen });
        await snapshot(page, `${label}:shared-context:${item.id}`);
        await page.locator('.shared-context-close').click();
        await page.waitForFunction(() => !document.querySelector('.shared-events'));
      }
      await snapshot(page, `${label}:end`);
      await context.close();
    }
  }

  if (mobile) {
    for (const language of ['ko', 'es']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
      await context.addInitScript(value => localStorage.setItem('dos-language', value), language);
      const page = await context.newPage();
      note(page, `${language}-mobile`);
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      await page.locator('.landing').waitFor({ state: 'visible', timeout: 15000 });
      await waitForHost(page);
      const metrics = await page.evaluate(() => ({ viewport: { width: innerWidth, height: innerHeight }, scrollWidth: document.documentElement.scrollWidth, documentWidth: document.documentElement.clientWidth, scrollY }));
      check(`${language} mobile: landing has no horizontal page overflow`, metrics.scrollWidth <= metrics.documentWidth + 1, metrics);
      await snapshot(page, `${language}-mobile`);
      await context.close();
    }
  }
} catch (error) {
  report.errors.push({ type: 'audit', message: error?.stack || String(error) });
} finally {
  await browser.close();
}

report.finishedAt = new Date().toISOString();
report.summary = { checks: report.checks.length, failedChecks: report.checks.filter(item => !item.pass).length, errors: report.errors.length, failedRequests: report.failedRequests.length, badResponses: report.badResponses.length, gpuPerformanceClaim: false };
await fs.writeFile(path.join(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ summary: report.summary, failed: report.checks.filter(item => !item.pass), errors: report.errors, failedRequests: report.failedRequests, badResponses: report.badResponses, report: path.join(output, 'report.json') }, null, 2));
if (report.summary.failedChecks || report.summary.errors || report.failedRequests.length || report.badResponses.length) process.exitCode = 1;

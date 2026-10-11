import { chromium } from 'file:///opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';

const baseUrl = process.env.LANDING_URL || 'http://127.0.0.1:5191/';
const output = 'output/playwright/landing-responsive';
const artifacts = '/mnt/data';
await fs.mkdir(output, { recursive: true });
await fs.mkdir(artifacts, { recursive: true });

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const report = { baseUrl, browser: 'Chromium', realSafariTested: false, protocolLimitations: [], checks: [], screenshots: [], errors: [] };
const check = (name, pass, detail = '') => report.checks.push({ name, pass: Boolean(pass), detail });
const captureErrors = (page, label) => {
  page.on('pageerror', error => report.errors.push(`${label}:page:${error.message}`));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/\/realtime\/v1\/websocket/.test(text)) {
      const limitation = 'The PGlite HTTP fixture does not implement Supabase Realtime; expected local WebSocket 404 while desktop lobby mounts.';
      if (!report.protocolLimitations.includes(limitation)) report.protocolLimitations.push(limitation);
      return;
    }
    report.errors.push(`${label}:console:${text}`);
  });
};

async function newPage(language, width, height, touch = false, reducedMotion = false) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: touch ? 1 : 1,
    isMobile: touch,
    hasTouch: touch,
    reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
  });
  await context.addInitScript(value => localStorage.setItem('dos-language', value), language);
  const page = await context.newPage();
  captureErrors(page, `${language}-${width}x${height}${touch ? '-touch' : '-fine'}`);
  return { context, page };
}

async function inspectLanding(page) {
  return page.evaluate(() => {
    const rect = element => {
      const b = element?.getBoundingClientRect();
      return b && { x: Math.round(b.x), y: Math.round(b.y), right: Math.round(b.right), bottom: Math.round(b.bottom), width: Math.round(b.width), height: Math.round(b.height) };
    };
    const visible = element => Boolean(element && element.getBoundingClientRect().width && element.getBoundingClientRect().height && getComputedStyle(element).display !== 'none' && getComputedStyle(element).visibility !== 'hidden');
    const nav = document.querySelector('.landing-nav nav');
    const links = [...(nav?.querySelectorAll(':scope > a') ?? [])];
    const linkRects = links.map(rect);
    const lang = document.querySelector('.landing-language');
    const langRect = rect(lang);
    const cards = [...document.querySelectorAll('.game-rail-card')];
    const track = document.querySelector('.game-rail-track');
    const copy = document.querySelector('.hero-scene-copy');
    const art = document.querySelector('.hero-scene-art');
    const heroTitle = document.querySelector('.hero-copy h1');
    const heroBody = document.querySelector('.hero-copy > p:not(.hero-dedication)');
    const notes = [...document.querySelectorAll('.moment-note')];
    const letter = document.querySelector('#papi-letter');
    const badImages = [...document.images].filter(image => image.complete && !image.naturalWidth).map(image => image.currentSrc || image.src);
    return {
      lang: document.documentElement.lang,
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      nav: { links: links.map(link => ({ text: link.textContent.trim(), href: link.getAttribute('href') })), rects: linkRects, languageRect: langRect },
      hero: {
        rect: rect(document.querySelector('.hero-scene')),
        copy: rect(copy), art: rect(art),
        copyHeadingWidthFits: !heroTitle || heroTitle.scrollWidth <= heroTitle.clientWidth + 1,
        copyBodyWidthFits: !heroBody || heroBody.scrollWidth <= heroBody.clientWidth + 1,
        imagesVisible: [...document.querySelectorAll('.hero-scene img')].map(image => ({ alt: image.alt, loaded: image.complete && image.naturalWidth > 0, rect: rect(image) })),
      },
      rail: {
        cards: cards.map(card => ({ title: card.querySelector('.game-rail-label')?.textContent.trim(), rect: rect(card), descriptionVisible: visible(card.querySelector('.game-rail-description')), ctaVisible: visible(card.querySelector('.game-rail-cta')) })),
        trackClientWidth: track?.clientWidth ?? 0,
        trackScrollWidth: track?.scrollWidth ?? 0,
        trackScrollLeft: track?.scrollLeft ?? 0,
        scrollSnap: track ? getComputedStyle(track).scrollSnapType : '',
        deviceNoteVisible: visible(document.querySelector('.game-rail-device-note')),
      },
      notesCount: notes.length,
      letter: { rect: rect(letter), foldExpanded: letter?.querySelector('.moment-fold-button')?.getAttribute('aria-expanded'), paragraphs: letter?.querySelectorAll('#moment-letter-copy p').length ?? 0 },
      brokenImages: badImages,
    };
  });
}

async function touchSwipe(page, fromX, fromY, toX, toY) {
  const session = await page.context().newCDPSession(page);
  const touch = (x, y) => ({ x, y, id: 1, force: 1 });
  try {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touch(fromX, fromY)] });
    for (let step = 1; step <= 7; step++) {
      const progress = step / 7;
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [touch(fromX + (toX - fromX) * progress, fromY + (toY - fromY) * progress)] });
      await page.waitForTimeout(22);
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally {
    await session.detach();
  }
  await page.waitForTimeout(250);
}

try {
  const viewportMatrix = [
    { width: 320, height: 844, language: 'ko' },
    { width: 360, height: 800, language: 'es' },
    { width: 390, height: 844, language: 'ko' },
    { width: 390, height: 844, language: 'es' },
    { width: 430, height: 932, language: 'es' },
    { width: 768, height: 1024, language: 'ko', touch: true },
    { width: 844, height: 390, language: 'es', touch: true },
  ];

  for (const { width, height, language, touch = true } of viewportMatrix) {
    const { context, page } = await newPage(language, width, height, touch);
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.locator('.landing').waitFor({ state: 'visible', timeout: 10000 });
    await page.evaluate(() => document.fonts.ready);
    const state = await inspectLanding(page);
    const label = `${language} ${width}×${height}${touch ? ' touch' : ''}`;
    const expectedNav = ['#games', '#papi-letter', '/feedback'];
    check(`${label}: no page-width overflow`, !state.horizontalOverflow, JSON.stringify({ width: state.viewport.width, scrollWidth: state.documentWidth }));
    check(`${label}: all nav links and language control stay within viewport`, state.nav.links.length === 3 && state.nav.rects.every(r => r.x >= 0 && r.right <= width) && state.nav.languageRect?.x >= 0 && state.nav.languageRect?.right <= width, JSON.stringify(state.nav));
    check(`${label}: localized navigation targets are intact`, JSON.stringify(state.nav.links.map(link => link.href)) === JSON.stringify(expectedNav) && state.lang.startsWith(language), JSON.stringify({ lang: state.lang, nav: state.nav.links }));
    check(`${label}: hero title/body fit and portrait assets load`, state.hero.copyHeadingWidthFits && state.hero.copyBodyWidthFits && state.hero.imagesVisible.length >= 3 && state.hero.imagesVisible.every(image => image.loaded), JSON.stringify(state.hero));
    check(`${label}: hero copy and art are laid out in order`, state.hero.copy && state.hero.art && (state.hero.copy.bottom <= state.hero.art.y + 36 || state.hero.copy.x + state.hero.copy.width <= state.hero.art.x + 28), JSON.stringify({ copy: state.hero.copy, art: state.hero.art }));
    check(`${label}: all eight game cards render with visible text and CTA`, state.rail.cards.length === 8 && state.rail.cards.every(card => card.title && card.descriptionVisible && card.ctaVisible), JSON.stringify(state.rail.cards.map(card => ({ title: card.title, descriptionVisible: card.descriptionVisible, ctaVisible: card.ctaVisible }))));
    check(`${label}: card rail has horizontal overflow and scroll snapping`, state.rail.trackScrollWidth > state.rail.trackClientWidth && state.rail.scrollSnap.includes('x'), JSON.stringify({ client: state.rail.trackClientWidth, scroll: state.rail.trackScrollWidth, snap: state.rail.scrollSnap }));
    if (touch) check(`${label}: localized desktop-play note is visible`, state.rail.deviceNoteVisible, JSON.stringify({ visible: state.rail.deviceNoteVisible }));
    check(`${label}: how-to and foldable letter remain present`, state.notesCount === 3 && state.letter.paragraphs >= 4 && state.letter.foldExpanded === 'true', JSON.stringify({ notes: state.notesCount, letter: state.letter }));
    check(`${label}: no broken image resources`, state.brokenImages.length === 0, JSON.stringify(state.brokenImages));

    if (width === 390) {
      const track = page.locator('.game-rail-track');
      await track.scrollIntoViewIfNeeded();
      const bounds = await track.boundingBox();
      if (!bounds) throw new Error('game rail not measurable');
      const before = await track.evaluate(el => ({ left: el.scrollLeft, pageY: window.scrollY }));
      await touchSwipe(page, Math.round(bounds.x + bounds.width * .82), Math.round(bounds.y + bounds.height / 2), Math.round(bounds.x + bounds.width * .18), Math.round(bounds.y + bounds.height / 2));
      const afterHorizontal = await track.evaluate(el => ({ left: el.scrollLeft, pageY: window.scrollY }));
      check(`${label}: touch swipe moves cards horizontally`, afterHorizontal.left > before.left + 30, JSON.stringify({ before, after: afterHorizontal }));
      await page.evaluate(() => window.scrollTo(0, 0));
      await touchSwipe(page, Math.round(width * .5), Math.round(height * .78), Math.round(width * .5), Math.round(height * .28));
      const afterVertical = await page.evaluate(() => window.scrollY);
      check(`${label}: vertical touch gesture still scrolls the page`, afterVertical > 100, JSON.stringify({ afterVertical }));
      const fold = page.locator('#papi-letter .moment-fold-button');
      await fold.scrollIntoViewIfNeeded();
      await fold.tap();
      const folded = await fold.getAttribute('aria-expanded') === 'false';
      await fold.tap();
      const reopened = await fold.getAttribute('aria-expanded') === 'true' && await page.locator('#moment-letter-copy p').count() >= 4;
      check(`${label}: touch can fold and reopen Papi letter`, folded && reopened, JSON.stringify({ folded, reopened }));
      await page.evaluate(() => window.scrollTo(0, 0));
      const screenshot = `${artifacts}/landing-responsive-mobile-${language}.png`;
      await page.screenshot({ path: screenshot, fullPage: true, animations: 'disabled' });
      report.screenshots.push({ language, viewport: `${width}x${height}`, file: screenshot });
    }
    await context.close();
  }

  for (const language of ['ko', 'es']) {
    for (const { width, height } of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
      const { context, page } = await newPage(language, width, height, false);
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      await page.locator('.landing').waitFor({ state: 'visible', timeout: 10000 });
      await page.evaluate(() => document.fonts.ready);
      const state = await inspectLanding(page);
      check(`${language} desktop ${width}×${height}: no overflow and all cards fit`, !state.horizontalOverflow && state.rail.cards.length === 8 && state.rail.cards.every(card => card.rect.x >= 0 && card.rect.right <= width && card.descriptionVisible && card.ctaVisible), JSON.stringify({ cards: state.rail.cards.map(card => ({ title: card.title, rect: card.rect })) }));
      check(`${language} desktop ${width}×${height}: images load`, state.brokenImages.length === 0 && state.hero.imagesVisible.every(image => image.loaded), JSON.stringify({ brokenImages: state.brokenImages, heroImages: state.hero.imagesVisible }));
      if (width === 1440) {
        const screenshot = `${artifacts}/landing-responsive-desktop-${language}.png`;
        await page.screenshot({ path: screenshot, fullPage: true, animations: 'disabled' });
        report.screenshots.push({ language, viewport: '1440x900', file: screenshot });
      }
      await context.close();
    }
  }

  for (const language of ['ko', 'es']) {
    const { context, page } = await newPage(language, 390, 844, true);
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.locator('.landing').waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('.landing-nav a[href="#games"]').tap();
    await page.waitForFunction(() => location.hash === '#games');
    const gamesTop = await page.locator('#games').evaluate(el => el.getBoundingClientRect().top);
    await page.locator('.hero-actions a[href="#papi-letter"]').scrollIntoViewIfNeeded();
    await page.locator('.hero-actions a[href="#papi-letter"]').tap();
    await page.waitForFunction(() => location.hash === '#papi-letter');
    await page.waitForFunction(() => {
      const bounds = document.querySelector('#papi-letter')?.getBoundingClientRect();
      return Boolean(bounds && bounds.top < innerHeight && bounds.bottom > 0);
    }, null, { timeout: 5000 });
    const letterTop = await page.locator('#papi-letter').evaluate(el => el.getBoundingClientRect().top);
    check(`${language} mobile: nav and hero anchors scroll to their targets`, gamesTop < 844 && letterTop < 844, JSON.stringify({ gamesTop, letterTop }));
    await context.close();
  }

  const validRoomId = '52b4b829-242f-422e-88c0-c15ca63d3415';
  const routeCases = [
    { width: 320, height: 844, touch: true, expected: 'blocked phone' },
    { width: 768, height: 1024, touch: true, expected: 'blocked tablet' },
    { width: 844, height: 390, touch: true, expected: 'blocked landscape phone' },
    { width: 1080, height: 810, touch: true, expected: 'blocked coarse wide screen' },
    { width: 1024, height: 768, touch: false, expected: 'allowed narrow fine pointer' },
  ];
  for (const route of routeCases) {
    for (const language of ['ko', 'es']) {
      const { context, page } = await newPage(language, route.width, route.height, route.touch);
      for (const path of ['/play?game=jaipur', `/room/${validRoomId}`]) {
        await page.goto(`${new URL(baseUrl).origin}${path}`, { waitUntil: 'domcontentloaded' });
        if (route.expected.startsWith('blocked')) {
          await page.locator('.desktop-game-notice').waitFor({ state: 'visible', timeout: 8000 });
          const heading = await page.locator('#desktop-game-title').innerText();
          const resources = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name));
          const playModules = resources.filter(name => /PlayApp(?:\.tsx|-)|Room(?:\.tsx|-)/.test(name));
          check(`${language} ${route.expected}: ${path} shows localized desktop guidance before game modules`, await page.locator('.desktop-game-notice').isVisible() && !await page.locator('.lobby-shell,.room-main,#game-board').count() && playModules.length === 0 && heading.length > 10, JSON.stringify({ heading, playModules, lang: await page.locator('html').getAttribute('lang') }));
          if (route.width === 320 && path.startsWith('/play')) {
            const screenshot = `${artifacts}/landing-responsive-mobile-game-notice-${language}.png`;
            await page.screenshot({ path: screenshot, fullPage: true, animations: 'disabled' });
            report.screenshots.push({ language, viewport: `${route.width}x${route.height}`, screen: 'mobile game notice', file: screenshot });
          }
        } else {
          const allowedSurface = path.startsWith('/play') ? '.lobby-shell' : '.room-main,.join-page';
          await page.locator(allowedSurface).first().waitFor({ state: 'visible', timeout: 10000 });
          check(`${language} ${route.expected}: ${path} is playable`, await page.locator('.desktop-game-notice').count() === 0 && await page.locator(allowedSurface).first().isVisible(), path);
        }
      }
      await context.close();
    }
  }

  for (const language of ['ko', 'es']) {
    const { context, page } = await newPage(language, 1440, 900, false, true);
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.locator('.landing').waitFor({ state: 'visible', timeout: 10000 });
    const reduced = await page.evaluate(() => ({
      orbitAnimation: getComputedStyle(document.querySelector('.hero-orbit-path')).animationName,
      ctaAnimation: getComputedStyle(document.querySelector('.hero-actions .primary-action')).animationName,
      sceneAnimation: getComputedStyle(document.querySelector('.hero-scene-sparkles i')).animationName,
      cardTransition: getComputedStyle(document.querySelector('.game-rail-card')).transitionDuration,
    }));
    check(`${language} reduced motion: hero and game-card effects are static`, reduced.orbitAnimation === 'none' && reduced.ctaAnimation === 'none' && reduced.sceneAnimation === 'none' && reduced.cardTransition.split(',').every(duration => Number.parseFloat(duration) <= .001), JSON.stringify(reduced));
    await context.close();
  }

  {
    const { context, page } = await newPage('ko', 1440, 900, false);
    await page.goto(`${new URL(baseUrl).origin}/play?game=jaipur`, { waitUntil: 'domcontentloaded' });
    await page.locator('.lobby-shell').waitFor({ state: 'visible', timeout: 10000 });
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.locator('.desktop-game-notice').waitFor({ state: 'visible', timeout: 5000 });
    const blockedAtTablet = await page.locator('.lobby-shell').count() === 0;
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.locator('.lobby-shell').waitFor({ state: 'visible', timeout: 5000 });
    check('fine-pointer resize changes game gate at 768px and 1024px', blockedAtTablet && await page.locator('.desktop-game-notice').count() === 0, JSON.stringify({ blockedAtTablet, lobbyAt1024: await page.locator('.lobby-shell').isVisible() }));
    await context.close();
  }
} catch (error) {
  report.errors.push(`runner:${error instanceof Error ? error.stack : String(error)}`);
} finally {
  await browser.close();
  const failed = report.checks.filter(item => !item.pass);
  report.summary = { total: report.checks.length, passed: report.checks.length - failed.length, failed: failed.length, errors: report.errors.length };
  await fs.writeFile(`${output}/responsive-audit.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ summary: report.summary, failed, errors: report.errors, screenshots: report.screenshots }, null, 2));
  if (failed.length || report.errors.length) process.exitCode = 1;
}

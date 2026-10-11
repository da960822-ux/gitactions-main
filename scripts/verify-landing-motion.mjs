import { chromium } from 'file:///opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';

const url = process.env.LANDING_URL || 'http://127.0.0.1:5191/';
const out = path.resolve('output/playwright/landing-motion-upgrade');
const externalOut = '/mnt/data';
await fs.mkdir(out, { recursive: true });
await fs.mkdir(externalOut, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const report = { url, task: 'Mami/Papi landing copy and navigation audit', captures: [], checks: [], errors: [] };
const check = (name, pass, detail = '') => {
  report.checks.push({ name, pass: Boolean(pass), detail });
  if (!pass) console.error(`FAIL ${name}: ${detail}`);
};
const listenForErrors = (page, language, route = 'home') => {
  page.on('pageerror', error => report.errors.push({ language, route, type: 'pageerror', message: error.message }));
  page.on('console', message => { if (message.type() === 'error') report.errors.push({ language, route, type: 'console', message: message.text() }); });
};
const readHome = page => page.evaluate(() => {
  const visible = el => {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0;
  };
  const interactive = 'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])';
  const cards = [...document.querySelectorAll('.game-rail-card')].map(card => {
    const description = card.querySelector('.game-rail-description');
    const cta = card.querySelector('.game-rail-cta');
    const rect = card.getBoundingClientRect();
    return {
      label: card.querySelector('.game-rail-label')?.textContent?.trim(),
      top: Math.round(rect.top), bottom: Math.round(rect.bottom),
      description: description?.textContent?.trim(), descriptionVisible: visible(description),
      cta: cta?.textContent?.trim(), ctaVisible: visible(cta),
      nestedInteractive: card.querySelectorAll(interactive).length,
    };
  });
  const letter = document.querySelector('#papi-letter');
  const letterRect = letter?.getBoundingClientRect();
  const notes = [...document.querySelectorAll('.moment-note')].map(note => ({ title: note.querySelector('h3')?.textContent?.trim(), body: note.querySelector('p')?.textContent?.trim() }));
  return {
    lang: document.documentElement.lang,
    viewport: { width: innerWidth, height: innerHeight },
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    brokenImages: [...document.images].filter(image => !image.complete || !image.naturalWidth).map(image => image.currentSrc || image.src),
    navLinks: [...document.querySelectorAll('.landing-nav nav a')].map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') })),
    heroTitle: document.querySelector('.hero-copy h1')?.innerText.replace(/\s+/g, ' ').trim(),
    heroKicker: document.querySelector('.hero-dedication')?.textContent.trim(),
    heroActions: [...document.querySelectorAll('.hero-actions > a')].map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') })),
    cards,
    notes,
    translationWarning: document.querySelector('.moment-translation-limit')?.textContent.trim(),
    catchmindAction: document.querySelector('.moment-catchmind-link')?.textContent.trim(),
    letter: letter && {
      title: letter.querySelector('#moment-letter-title')?.textContent.trim(),
      address: letter.querySelector('.moment-letter-address')?.textContent.trim(),
      paragraphs: [...letter.querySelectorAll('#moment-letter-copy p')].map(p => p.textContent.trim()),
      copyText: letter.querySelector('#moment-letter-copy')?.innerText.trim(),
      copyVisible: visible(letter.querySelector('#moment-letter-copy')),
      paperFitsCopy: (letter.querySelector('.moment-paper')?.scrollHeight || 0) <= (letter.querySelector('.moment-paper')?.clientHeight || 0) + 1,
      paragraphFontSize: Number.parseFloat(getComputedStyle(letter.querySelector('#moment-letter-copy p')).fontSize || '0'),
      initialExpanded: letter.querySelector('.moment-fold-button')?.getAttribute('aria-expanded'),
      foldLabel: letter.querySelector('.moment-fold-button')?.innerText.trim(),
      rect: letterRect && { x: Math.round(letterRect.x), y: Math.round(letterRect.y), width: Math.round(letterRect.width), height: Math.round(letterRect.height) },
      notesRect: document.querySelector('.moment-notes')?.getBoundingClientRect().toJSON(),
    },
    homepageAnchorTargets: ['#home', '#games', '#papi-letter'].map(id => ({ id, exists: Boolean(document.querySelector(id)) })),
  };
});

const assertAnchorScroll = async (page, selector, targetId, language, label) => {
  await page.locator(selector).click();
  await page.waitForFunction(target => location.hash === target, targetId, { timeout: 5000 });
  await page.waitForTimeout(180);
  const position = await page.locator(targetId).evaluate(el => ({ top: Math.round(el.getBoundingClientRect().top), bottom: Math.round(el.getBoundingClientRect().bottom), height: Math.round(el.getBoundingClientRect().height) }));
  const viewportHeight = await page.evaluate(() => innerHeight);
  check(`${language}: ${label} updates URL and scrolls to target`, position.top < viewportHeight && position.bottom > 0 && position.height > 0, JSON.stringify({ url: page.url(), position, viewportHeight }));
};

try {
  for (const language of ['ko', 'es']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript(value => localStorage.setItem('dos-language', value), language);
    const page = await context.newPage();
    listenForErrors(page, language);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.locator('.landing').waitFor({ state: 'visible', timeout: 10000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);

    let home = await readHome(page);
    check(`${language}: new personalized copy is localized`, home.lang === language && home.heroKicker?.includes('Mami') && home.heroTitle?.includes('Mami'), JSON.stringify({ lang: home.lang, kicker: home.heroKicker, title: home.heroTitle }));
    check(`${language}: exact three landing navigation links`, JSON.stringify(home.navLinks.map(link => link.href)) === JSON.stringify(['#games', '#papi-letter', '/feedback']), JSON.stringify(home.navLinks));
    const expectedLandingNav = language === 'ko' ? ['게임', 'Papi의 편지', 'Mami의 아이디어'] : ['Juegos', 'La carta de Papi', 'Ideas de Mami'];
    check(`${language}: navigation labels match Mami/Papi copy`, JSON.stringify(home.navLinks.map(link => link.text)) === JSON.stringify(expectedLandingNav), JSON.stringify(home.navLinks));
    check(`${language}: hero CTA targets Papi letter and games`, home.heroActions.length === 2 && home.heroActions[0].href === '#games' && home.heroActions[1].href === '#papi-letter', JSON.stringify(home.heroActions));
    check(`${language}: eight game cards fit initial 1440×900 viewport`, home.cards.length === 8 && home.cards.every(card => card.bottom <= 900), JSON.stringify(home.cards.map(card => [card.label, card.top, card.bottom])));
    check(`${language}: every card shows description and CTA without hover`, home.cards.length === 8 && home.cards.every(card => card.description && card.descriptionVisible && card.cta && card.ctaVisible), JSON.stringify(home.cards.map(card => ({ label: card.label, descriptionVisible: card.descriptionVisible, ctaVisible: card.ctaVisible }))));
    check(`${language}: game cards contain no nested interactive controls`, home.cards.length === 8 && home.cards.every(card => card.nestedInteractive === 0), JSON.stringify(home.cards.map(card => ({ label: card.label, nestedInteractive: card.nestedInteractive }))));
    check(`${language}: how-to section has exactly three blocks`, home.notes.length === 3 && home.notes.every(note => note.title && note.body), JSON.stringify(home.notes));
    const warning = home.translationWarning || '';
    check(`${language}: translation fallback is limited to Catchmind and states the fallback`, Boolean(home.catchmindAction) && (language === 'ko' ? warning.includes('원문') && warning.includes('한도') : warning.includes('original') && warning.includes('límite')), JSON.stringify({ catchmindAction: home.catchmindAction, warning }));
    const translatedNotes = home.notes.map((note, index) => ({ ...note, index })).filter(note => language === 'ko' ? /번역/.test(`${note.title} ${note.body}`) : /traduc|traduce/.test(`${note.title} ${note.body}`));
    check(`${language}: only the Catchmind how-to mentions translation`, translatedNotes.length === 1 && translatedNotes[0].index === 1, JSON.stringify(translatedNotes));
    check(`${language}: full Papi letter is readable on the right`, Boolean(home.letter) && home.letter.paragraphs.length >= 4 && home.letter.copyText.length > 180 && home.letter.initialExpanded === 'true' && home.letter.copyVisible && home.letter.paperFitsCopy && home.letter.paragraphFontSize >= 13 && home.letter.rect.x > home.letter.notesRect.x, JSON.stringify(home.letter && { title: home.letter.title, paragraphCount: home.letter.paragraphs.length, textLength: home.letter.copyText.length, expanded: home.letter.initialExpanded, copyVisible: home.letter.copyVisible, paperFitsCopy: home.letter.paperFitsCopy, paragraphFontSize: home.letter.paragraphFontSize, rect: home.letter.rect, notesRect: home.letter.notesRect }));
    check(`${language}: no horizontal overflow and images loaded at 1440×900`, !home.horizontalOverflow && home.brokenImages.length === 0, JSON.stringify({ overflow: home.horizontalOverflow, brokenImages: home.brokenImages }));

    await assertAnchorScroll(page, '.hero-actions a[href="#games"]', '#games', language, 'first hero CTA');
    await assertAnchorScroll(page, '.hero-actions a[href="#papi-letter"]', '#papi-letter', language, 'second hero CTA');
    const fold = page.locator('#papi-letter .moment-fold-button');
    await fold.click();
    const folded = await fold.getAttribute('aria-expanded') === 'false' && await page.locator('#moment-letter-copy').getAttribute('aria-hidden') === 'true';
    await fold.click();
    const reopened = await fold.getAttribute('aria-expanded') === 'true' && await page.locator('#moment-letter-copy').getAttribute('aria-hidden') === 'false' && await page.locator('#moment-letter-copy p').count() >= 4;
    check(`${language}: full letter folds and reopens without losing text`, folded && reopened, JSON.stringify({ folded, reopened, paragraphs: await page.locator('#moment-letter-copy p').count() }));

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
    home = await readHome(page);
    const homeCapture = path.join(externalOut, `mami-papi-home-${language}.png`);
    await page.screenshot({ path: homeCapture, fullPage: true, animations: 'disabled' });
    report.captures.push({ language, screen: 'home', file: homeCapture, dimensions: await page.evaluate(() => ({ width: innerWidth, height: innerHeight, fullPageHeight: document.documentElement.scrollHeight })) });

    await page.locator('.landing-nav nav a[href="/feedback"]').click();
    await page.locator('.feedback-setup').waitFor({ state: 'visible', timeout: 7000 });
    const feedback = await page.evaluate(() => ({
      heading: document.querySelector('.feedback-setup h1')?.textContent.trim(),
      placeholder: document.querySelector('#feedback-invite-code')?.getAttribute('placeholder'),
      primary: document.querySelector('.feedback-setup > .primary-action')?.textContent.trim(),
      join: document.querySelector('.feedback-join-form button')?.textContent.trim(),
      navLinks: [...document.querySelectorAll('.feedback-route .landing-nav nav a')].map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') })),
    }));
    const expectedFeedback = language === 'ko'
      ? { heading: 'Mami, 다음엔 뭐 만들까?', placeholder: '초대 코드 붙여넣기', primary: '우리 공간 만들기', join: '참여하기' }
      : { heading: 'Mami, ¿qué hacemos después?', placeholder: 'Pega el código', primary: 'Crear nuestro espacio', join: 'Entrar' };
    check(`${language}: feedback Mami heading, invite placeholder and buttons match copy`, feedback.heading === expectedFeedback.heading && feedback.placeholder === expectedFeedback.placeholder && (feedback.primary || '').startsWith(expectedFeedback.primary) && feedback.join === expectedFeedback.join, JSON.stringify({ feedback, expectedFeedback }));
    check(`${language}: feedback header has exact SPA home anchors`, JSON.stringify(feedback.navLinks.map(link => link.href)) === JSON.stringify(['/#games', '/#papi-letter', '/feedback']), JSON.stringify(feedback.navLinks));
    const expectedFeedbackNav = expectedLandingNav;
    check(`${language}: feedback header nav labels stay localized`, JSON.stringify(feedback.navLinks.map(link => link.text)) === JSON.stringify(expectedFeedbackNav), JSON.stringify(feedback.navLinks));
    const feedbackCapture = path.join(externalOut, `mami-papi-feedback-${language}.png`);
    await page.screenshot({ path: feedbackCapture, fullPage: true, animations: 'disabled' });
    report.captures.push({ language, screen: 'feedback setup', file: feedbackCapture, details: feedback });

    await page.locator('.feedback-route .landing-nav nav a[href="/#games"]').click();
    await page.waitForFunction(() => location.pathname === '/' && location.hash === '#games', null, { timeout: 7000 });
    await page.locator('#games').waitFor({ state: 'attached' });
    await page.waitForTimeout(240);
    const routedGames = await page.locator('#games').evaluate(el => ({ top: Math.round(el.getBoundingClientRect().top), bottom: Math.round(el.getBoundingClientRect().bottom) }));
    check(`${language}: feedback header SPA Games link returns and scrolls`, routedGames.top < 900 && routedGames.bottom > 0, JSON.stringify({ url: page.url(), routedGames }));
    await page.goto(`${new URL(url).origin}/feedback`, { waitUntil: 'domcontentloaded' });
    await page.locator('.feedback-setup').waitFor({ state: 'visible', timeout: 7000 });
    await page.locator('.feedback-route .landing-nav nav a[href="/#papi-letter"]').click();
    await page.waitForFunction(() => location.pathname === '/' && location.hash === '#papi-letter', null, { timeout: 7000 });
    await page.waitForTimeout(240);
    const routedLetter = await page.locator('#papi-letter').evaluate(el => ({ top: Math.round(el.getBoundingClientRect().top), bottom: Math.round(el.getBoundingClientRect().bottom) }));
    check(`${language}: feedback header SPA Papi link returns and scrolls`, routedLetter.top < 900 && routedLetter.bottom > 0, JSON.stringify({ url: page.url(), routedLetter }));

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.locator('.landing').waitFor({ state: 'visible', timeout: 10000 });
    await page.evaluate(() => document.fonts.ready);
    const wide = await readHome(page);
    check(`${language}: eight cards and full copy fit with no overflow at 1920×1080`, wide.cards.length === 8 && !wide.horizontalOverflow && wide.cards.every(card => card.ctaVisible && card.descriptionVisible), JSON.stringify({ viewport: wide.viewport, overflow: wide.horizontalOverflow, cardCount: wide.cards.length, ctas: wide.cards.filter(card => card.ctaVisible).length }));
    await context.close();
  }
} finally {
  await browser.close();
}

await fs.writeFile(path.join(out, 'copy-audit.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ checks: report.checks.length, failed: report.checks.filter(item => !item.pass), errors: report.errors, captures: report.captures }, null, 2));
if (report.checks.some(item => !item.pass) || report.errors.length) process.exitCode = 1;

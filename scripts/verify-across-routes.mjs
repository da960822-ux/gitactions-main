import { launchChromium } from './playwright-browser.mjs';

process.env.PLAYWRIGHT_EXECUTABLE_PATH ||= '/usr/bin/chromium';
const baseUrl = process.env.LANDING_URL || 'http://127.0.0.1:5191/';
const origin = new URL(baseUrl).origin;
const games = ['davinci', 'catchmind', 'domino', 'jaipur', 'splendor', 'minhwatu', 'marble', 'rhythm'];
const checks = [];
const errors = [];
const check = (name, pass, detail = '') => checks.push({ name, pass: Boolean(pass), detail });
const browser = await launchChromium();

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
    hasTouch: false,
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.locator('.landing').waitFor({ state: 'visible', timeout: 10000 });

  const cards = await page.locator('.game-rail-card').evaluateAll(els => els.map(el => ({
    game: new URL(el.getAttribute('href'), location.href).searchParams.get('game'),
    title: el.querySelector('.game-rail-label')?.textContent.trim(),
  })));
  const hrefGames = cards.map(card => card.game);
  check('landing gallery links to all eight games', games.every(game => hrefGames.includes(game)) && hrefGames.length === 8, JSON.stringify(cards));

  await page.locator('.landing-language button').filter({ hasText: 'ES' }).click();
  check('Spanish landing selection persists in localStorage', await page.evaluate(() => localStorage.getItem('dos-language')) === 'es');
  await page.locator('.game-rail-card[href="/play?game=catchmind"]').click();
  await page.locator('.lobby-picks').waitFor({ state: 'visible', timeout: 10000 });
  check('gallery enters Spanish /play with Catchmind selected', new URL(page.url()).pathname === '/play'
    && await page.evaluate(() => localStorage.getItem('dos-language')) === 'es'
    && await page.locator('.language-switch button[aria-pressed="true"]').innerText().then(text => text.includes('Español'))
    && await page.locator('.pick-item[aria-pressed="true"] .game-thumbnail').getAttribute('class').then(value => value.includes('art-catchmind')), page.url());

  for (const game of games) {
    await page.goto(`${origin}/play?game=${game}`, { waitUntil: 'domcontentloaded' });
    await page.locator('.lobby-picks').waitFor({ state: 'visible', timeout: 10000 });
    const selectedClass = await page.locator('.pick-item[aria-pressed="true"] .game-thumbnail').getAttribute('class');
    const spanish = await page.locator('.language-switch button[aria-pressed="true"]').innerText().then(text => text.includes('Español'));
    check(`/play?game=${game} selects ${game} and keeps Spanish`, selectedClass?.includes(`art-${game}`) && spanish, JSON.stringify({ selectedClass, spanish }));
  }

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.locator('.landing').waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('.landing-nav a[href="/feedback"]').click();
  await page.locator('.feedback-route').waitFor({ state: 'visible', timeout: 10000 });
  check('landing feedback navigation opens /feedback in Spanish', new URL(page.url()).pathname === '/feedback'
    && await page.evaluate(() => localStorage.getItem('dos-language')) === 'es'
    && await page.locator('.feedback-route h1').innerText().then(text => text.includes('Mami')),
  JSON.stringify({ url: page.url(), heading: await page.locator('.feedback-route h1').innerText() }));
  await context.close();
} catch (error) {
  errors.push(String(error));
} finally {
  await browser.close();
}

const report = { checks, errors, summary: { total: checks.length, passed: checks.filter(item => item.pass).length, failed: checks.filter(item => !item.pass).length } };
console.log(JSON.stringify(report, null, 2));
if (errors.length || report.summary.failed) process.exitCode = 1;

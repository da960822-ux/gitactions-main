import fs from 'node:fs/promises';
import path from 'node:path';
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
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', hasTouch: false });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`page: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });

  for (const language of ['ko', 'es']) {
    await page.goto(`${baseUrl}#games`, { waitUntil: 'domcontentloaded' });
    await page.locator('.cs-game-gallery').waitFor({ state: 'visible', timeout: 10000 });
    if (language === 'es') await page.locator('.landing-language button').filter({ hasText: 'ES' }).click();
    else await page.locator('.landing-language button').filter({ hasText: 'KO' }).click();

    const catalog = await page.evaluate(async () => {
      const module = await import('/src/games/catalog.ts');
      return module.gameCatalog.map(({ id, title, subtitle }) => ({ id, title, subtitle }));
    });
    const gallery = page.locator('.cs-game-gallery');
    const selectedButton = gallery.locator('.rd-game-choices [data-game][aria-pressed="true"]');
    const initialId = await selectedButton.getAttribute('data-game');
    const initialEntry = catalog.find(game => game.id === initialId);
    check(`${language}: initial caption matches selected catalog game`, Boolean(initialEntry)
      && await gallery.locator('.rd-game-caption h3').innerText() === initialEntry.title[language]
      && await gallery.locator('.rd-game-caption p').innerText() === initialEntry.subtitle[language], JSON.stringify({ initialId, entry: initialEntry }));

    for (const gameId of games) {
      const entry = catalog.find(game => game.id === gameId);
      const choice = gallery.locator(`.rd-game-choices [data-game="${gameId}"]`);
      await choice.click();
      const selected = await choice.getAttribute('aria-pressed') === 'true';
      const captionTitle = await gallery.locator('.rd-game-caption h3').innerText();
      const captionSubtitle = await gallery.locator('.rd-game-caption p').innerText();
      const startHref = await gallery.locator('.rd-game-start').getAttribute('href');
      check(`${language}: ${gameId} selection updates matching catalog caption`, selected
        && captionTitle === entry.title[language] && captionSubtitle === entry.subtitle[language]
        && startHref === `/play?game=${gameId}`, JSON.stringify({ selected, captionTitle, captionSubtitle, startHref }));

      await gallery.locator('.rd-game-start').click();
      await page.locator('.lobby-picks').waitFor({ state: 'visible', timeout: 10000 });
      const selectedArt = await page.locator('.pick-item[aria-pressed="true"] .game-thumbnail').getAttribute('class');
      const activeLanguage = await page.locator('.language-switch button[aria-pressed="true"]').innerText();
      check(`${language}: ${gameId} start opens matching lobby with locale`, new URL(page.url()).pathname === '/play'
        && new URL(page.url()).searchParams.get('game') === gameId
        && selectedArt?.includes(`art-${gameId}`)
        && activeLanguage.includes(language === 'ko' ? '한국어' : 'Español'), JSON.stringify({ url: page.url(), selectedArt, activeLanguage }));
      await page.goBack();
      await gallery.waitFor({ state: 'visible', timeout: 10000 });
    }

    const columns = await gallery.locator('.rd-game-choices').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    check(`${language}: gallery renders in four desktop columns`, columns === 4, JSON.stringify({ columns }));
    check(`${language}: existing letter and footer remain present`, await page.locator('#papi-letter').count() === 1
      && await page.locator('.home-footer').count() === 1);
  }

  await context.close();
} catch (error) {
  errors.push(String(error));
} finally {
  await browser.close();
}

const report = { baseUrl, checks, errors, summary: { total: checks.length, passed: checks.filter(item => item.pass).length, failed: checks.filter(item => !item.pass).length } };
console.log(JSON.stringify(report, null, 2));
const output = path.resolve('output/playwright/gallery-transplant/routes.json');
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
if (errors.length || report.summary.failed) process.exitCode = 1;

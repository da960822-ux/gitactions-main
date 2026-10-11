// Browser + real SQL/RLS fixture checks; this does not certify production Supabase.
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { launchChromium } from './playwright-browser.mjs';

const base = process.env.FEEDBACK_URL || 'http://127.0.0.1:5194';
const out = resolve('output/playwright/feedback');
await mkdir(out, { recursive: true });
const browser = await launchChromium();
const report = { environment: 'Local HTTP/PGlite fixture; no production Auth/PostgREST/Realtime', checks: [], errors: [] };
function check(name, pass, detail = '') {
  report.checks.push({ name, pass: Boolean(pass), detail });
  if (!pass) throw new Error(`${name}: ${detail}`);
}
async function context(language, viewport = { width: 1440, height: 900 }, options = {}) {
  const ctx = await browser.newContext({ viewport, ...options });
  await ctx.addInitScript(lang => localStorage.setItem('dos-language', lang), language);
  const page = await ctx.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  return { ctx, page };
}
async function refresh(page) {
  await page.locator('.feedback-space-actions button').first().click();
  await page.waitForTimeout(150);
}
async function fits(page) {
  return page.evaluate(() => {
    const form = document.querySelector('.feedback-compose');
    const rect = form?.getBoundingClientRect();
    return { overflow: document.documentElement.scrollWidth > innerWidth, formBottom: rect?.bottom, viewportHeight: innerHeight };
  });
}
try {
  for (const language of ['ko', 'es']) {
    const owner = await context(language);
    await owner.page.goto(`${base}/feedback`);
    await owner.page.locator('.feedback-setup .primary-action').click();
    await owner.page.locator('.feedback-empty b').waitFor();
    const invite = owner.page.url();
    check(`${language}: owner can view an empty private space but cannot submit`, await owner.page.locator('.feedback-compose').count() === 0);
    const partner = await context(language);
    const page = partner.page;
    await page.goto(invite);
    await page.locator('.feedback-compose').waitFor();
    check(`${language}: three categories, content-only form, whitespace disabled`, await page.locator('.feedback-categories button').count() === 3 && await page.locator('#feedback-title').count() === 0 && await page.locator('.feedback-submit').isDisabled());
    const layout = await fits(page);
    check(`${language}: complete form fits desktop 1440x900`, !layout.overflow && layout.formBottom <= layout.viewportHeight, JSON.stringify(layout));
    const paperMotion = await page.locator('.feedback-compose').evaluate(el => ({ name: getComputedStyle(el).animationName, duration: getComputedStyle(el).animationDuration }));
    check(`${language}: original paper unfold animation remains`, paperMotion.name === 'feedback-paper-unfold' && paperMotion.duration === '0.68s', JSON.stringify(paperMotion));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    check(`${language}: original reduced-motion support remains`, await page.locator('.feedback-compose').evaluate(el => getComputedStyle(el).animationName) === 'none');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('#feedback-body').fill('   ');
    check(`${language}: whitespace cannot be submitted`, await page.locator('.feedback-submit').isDisabled());
    await page.locator('.feedback-categories button').nth(1).click();
    await page.locator('#feedback-body').fill(language === 'ko' ? '게임 버튼이 느려요. <script>test</script>' : 'El botón tarda mucho. <script>test</script>');
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    let calls = 0;
    await page.route('**/rest/v1/rpc/submit_feedback', async route => { calls++; await gate; await route.continue(); });
    await page.locator('.feedback-compose form').evaluate(form => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await page.waitForTimeout(100);
    check(`${language}: synchronous duplicate submit sends one request and locks fields`, calls === 1 && await page.locator('#feedback-body').isDisabled() && await page.locator('.feedback-submit').isDisabled());
    release();
    await page.locator('.feedback-entry').waitFor();
    await page.unroute('**/rest/v1/rpc/submit_feedback');
    check(`${language}: saved confirmation and escaped text`, await page.locator('.feedback-saved').count() === 1 && await page.locator('.feedback-entry-body').innerText().then(text => text.includes('<script>test</script>')) && await page.locator('.feedback-entry script').count() === 0);
    await page.reload();
    await page.locator('.feedback-entry').waitFor();
    check(`${language}: SQL-backed entry survives reload and partner cannot change status`, await page.locator('.feedback-entry').count() === 1 && await page.locator('.feedback-status-control').count() === 0);
    await refresh(owner.page);
    await owner.page.locator('.feedback-status-control select').waitFor();
    check(`${language}: exactly received/in-progress/done statuses`, await owner.page.locator('.feedback-status-control option').count() === 3);
    await owner.page.locator('.feedback-status-control select').selectOption('planned');
    await owner.page.waitForFunction(() => document.querySelector('.feedback-status-control select')?.value === 'planned' && !document.querySelector('.feedback-status-control select')?.disabled);
    await refresh(page);
    await page.locator('.feedback-status.status-planned').waitFor();
    check(`${language}: partner reads owner status update`, await page.locator('.feedback-status.status-planned').count() === 1);
    check(`${language}: original affectionate progress phrase is visible`, (await page.locator('.feedback-status.status-planned').innerText()).includes(language === 'ko' ? '해볼게요' : 'Lo anoto'));

    await page.locator('#feedback-body').fill(language === 'ko' ? '응답이 끊겨도 한 번만 저장해 주세요.' : 'Guarda una sola vez si se pierde la respuesta.');
    const ids = [];
    await page.route('**/rest/v1/rpc/submit_feedback', async route => {
      ids.push(route.request().postDataJSON().p_request);
      await route.fetch(); // Commit to SQL, then lose the response at the browser boundary.
      await route.abort('failed');
    });
    await page.locator('.feedback-submit').click();
    await page.locator('.feedback-error').waitFor();
    check(`${language}: uncertain failure preserves the draft and allows retry`, Boolean(await page.locator('#feedback-body').inputValue()) && !await page.locator('.feedback-submit').isDisabled());
    await page.unroute('**/rest/v1/rpc/submit_feedback');
    await page.route('**/rest/v1/rpc/submit_feedback', async route => { ids.push(route.request().postDataJSON().p_request); await route.continue(); });
    await page.locator('.feedback-submit').click();
    await page.locator('.feedback-saved').waitFor();
    await page.unroute('**/rest/v1/rpc/submit_feedback');
    await page.reload();
    await page.locator('.feedback-entry').nth(1).waitFor();
    check(`${language}: response-loss retry reuses ID and creates exactly one additional row`, ids.length === 2 && ids[0] === ids[1] && await page.locator('.feedback-entry').count() === 2, JSON.stringify(ids));
    await page.locator(`.landing-language button`).nth(language === 'ko' ? 1 : 0).click();
    check(`${language}: language toggle updates document locale`, await page.locator('html').getAttribute('lang') === (language === 'ko' ? 'es-DO' : 'ko'));
    await page.locator(`.landing-language button`).nth(language === 'ko' ? 0 : 1).click();
    await page.screenshot({ path: resolve(out, `${language}-suggestions.png`), fullPage: true });
    const third = await context(language);
    await third.page.goto(invite);
    await third.page.locator('.feedback-error').waitFor();
    check(`${language}: third browser cannot join, read posts, or submit`, await third.page.locator('.feedback-entry').count() === 0 && await third.page.locator('.feedback-compose').count() === 0 && await third.page.locator('.feedback-empty b').count() === 0);
    await third.ctx.close();
    for (const width of [800, 390]) {
      const narrow = await context(language, { width, height: 900 }, { hasTouch: true, isMobile: true, storageState: await partner.ctx.storageState() });
      await narrow.page.goto(invite);
      await narrow.page.locator('.feedback-compose').waitFor();
      const narrowLayout = await fits(narrow.page);
      check(`${language}: existing touch-screen access at ${width}px remains usable`, !narrowLayout.overflow && await narrow.page.locator('.desktop-game-notice').count() === 0 && await narrow.page.locator('.feedback-entry').count() === 2, JSON.stringify(narrowLayout));
      if (width === 390) {
        await narrow.page.locator('#feedback-body').fill(language === 'ko' ? '작은 화면 회귀 확인입니다.' : 'Prueba de acceso en pantalla pequeña.');
        await narrow.page.locator('.feedback-submit').click();
        await narrow.page.locator('.feedback-saved').waitFor();
        await narrow.page.reload();
        await narrow.page.locator('.feedback-entry').nth(2).waitFor();
        check(`${language}: touch-screen submit is SQL-backed and survives reload`, await narrow.page.locator('.feedback-entry').count() === 3);
        await narrow.page.screenshot({ path: resolve(out, `${language}-small-screen.png`), fullPage: true });
      }
      await narrow.ctx.close();
    }
    await partner.ctx.close(); await owner.ctx.close();
  }
  check('No uncaught browser errors', report.errors.length === 0, JSON.stringify(report.errors));
} catch (error) {
  report.failure = error.message;
  process.exitCode = 1;
} finally {
  await writeFile(resolve(out, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ passed: report.checks.filter(check => check.pass).length, total: report.checks.length, failure: report.failure || null, report: resolve(out, 'report.json') }));

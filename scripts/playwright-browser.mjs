export async function launchChromium() {
  let chromium;
  try {
    ({ chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright'));
  } catch (error) {
    throw new Error('Browser checks require Playwright. Install it locally (`npm install --no-save --no-package-lock playwright` and `npx playwright install chromium`) or set PLAYWRIGHT_MODULE to an installed Playwright module.', { cause: error });
  }

  const options = { headless: true };
  if (process.env.PLAYWRIGHT_EXECUTABLE_PATH) options.executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
  if (process.env.PLAYWRIGHT_NO_SANDBOX === '1' || process.getuid?.() === 0) options.args = ['--no-sandbox'];
  return chromium.launch(options);
}

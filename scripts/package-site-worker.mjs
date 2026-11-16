import { build } from 'esbuild';
import { cp, mkdir, rename, rm, writeFile } from 'node:fs/promises';

const artifact = 'dist-site-artifact';
await rm(artifact, { recursive: true, force: true });
try {
  await cp('dist', `${artifact}/client`, { recursive: true });
  await mkdir(`${artifact}/server`, { recursive: true });
  await mkdir(`${artifact}/.openai`, { recursive: true });
  await cp('.openai/hosting.json', `${artifact}/.openai/hosting.json`);
  await cp('drizzle', `${artifact}/.openai/drizzle`, { recursive: true });
  await build({ entryPoints: ['site-worker/index.ts'], bundle: true, format: 'esm', platform: 'neutral', target: 'es2022', outfile: `${artifact}/server/index.js` });
  await writeFile(`${artifact}/server/wrangler.json`, JSON.stringify({
    main: 'index.js', compatibility_date: '2026-10-26',
    assets: { directory: '../client', binding: 'ASSETS', not_found_handling: 'single-page-application', run_worker_first: ['/api/*', '/feedback', '/play'] },
  }, null, 2) + '\n');
  await rm('dist', { recursive: true, force: true });
  await rename(artifact, 'dist');
} catch (error) {
  await rm(artifact, { recursive: true, force: true });
  throw error;
}

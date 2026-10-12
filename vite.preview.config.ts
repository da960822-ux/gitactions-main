import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));
const previewAssets = ['images/yeonseok-lisbeth-cutout.webp', 'images/landing/spiral-galaxy-far-v1.webp', 'images/lisbeth-letter-envelope.webp', 'fonts/gowun-batang-display.woff2', 'fonts/GOWUN-BATANG-OFL.txt', 'fonts/dm-sans-regular.ttf', 'fonts/dm-sans-700.ttf', 'fonts/DM-SANS-OFL.txt', 'images/landing-preview/organic-rose-generated.png', ...['hearts-neutral','light-key','light-fill','light-shadow','light-floor','curve-neutral','portrait-shadow','nebula-fringe',...Array.from({length:3},(_,i)=>['neutral','left','right'].map(light=>`heart-${i}-${light}`)).flat()].map(name=>`images/landing-preview/hero/${name}.png`), ...['davinci','catchmind','domino','jaipur','splendor','minhwatu','marble','rhythm'].map(game=>`images/landing-preview/games/${game}.png`), 'images/hwatu/01-01.svg', 'images/hwatu/03-01.svg', 'images/hwatu/08-01.svg'];

export default defineConfig({
  server: { host: '127.0.0.1', port: 5204 },
  build: { outDir: 'dist-preview', copyPublicDir: false, rollupOptions: { input: 'landing-preview.html' } },
  plugins: [{
    name: 'independent-preview-assets',
    apply: 'build',
    async closeBundle() {
      for (const asset of previewAssets) {
        const destination = resolve(root, 'dist-preview', asset);
        await mkdir(dirname(destination), { recursive: true });
        await copyFile(resolve(root, 'public', asset), destination);
      }
    },
  }],
});

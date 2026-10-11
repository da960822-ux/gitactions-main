import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));
const previewAssets = ['fonts/dm-sans-regular.ttf', 'fonts/dm-sans-700.ttf', 'fonts/DM-SANS-OFL.txt', 'images/landing-preview/organic-rose-generated.png', 'images/hwatu/01-01.svg', 'images/hwatu/03-01.svg', 'images/hwatu/08-01.svg'];

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

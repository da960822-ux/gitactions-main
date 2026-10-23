import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({ publicDir: fileURLToPath(new URL('../public', import.meta.url)), server: { fs: { allow: [fileURLToPath(new URL('..', import.meta.url))] } } });

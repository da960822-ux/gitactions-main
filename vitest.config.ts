import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// Validate the application, including the integrated landing story.
export default mergeConfig(viteConfig, defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
    maxWorkers: 4,
    server: { deps: { inline: ['motion', 'framer-motion'] } },
  },
}));

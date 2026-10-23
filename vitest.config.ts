import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// Archived source snapshots and installed skills have independent test runners.
// This command validates the application; post-hero-preview uses its Node runner.
export default mergeConfig(viteConfig, defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
    maxWorkers: 4,
    server: { deps: { inline: ['motion', 'framer-motion'] } },
  },
}));

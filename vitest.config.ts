import { defineConfig } from 'vitest/config';

// Archived source snapshots and installed skills have independent test runners.
// This command validates the application; post-hero-preview uses its Node runner.
export default defineConfig({
  test: { include: ['src/**/*.test.{ts,tsx}'] },
});

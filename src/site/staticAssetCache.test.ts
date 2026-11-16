import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('content-hashed game image caching', () => {
  it('only grants long private caching to hash-versioned derivative folders', () => {
    const headers = readFileSync('public/_headers', 'utf8');
    expect(headers.match(/^\/.*$/gm)).toEqual(['/images/splendor/board/*', '/images/marble/runtime/*']);
    expect(headers.match(/Cache-Control: private, max-age=31536000, immutable/g)).toHaveLength(2);
    expect(headers).not.toMatch(/Cache-Control: public|\/api|private-game-art|\.html/);
    for (const folder of ['public/images/splendor/board', 'public/images/marble/runtime']) {
      const files = readdirSync(folder);
      expect(files.length).toBeGreaterThan(0);
      for (const file of files) expect(file).toMatch(/-[a-f0-9]{12}\.webp$/);
    }
  });
});

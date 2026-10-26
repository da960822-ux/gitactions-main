import { describe, expect, it, vi } from 'vitest';
import worker from '../../site-worker/index';

const origin = 'https://example.chatgpt.site';

describe('Site Worker routing', () => {
  it('keeps the built game and feedback HTML routes while isolating the API', async () => {
    const fetch = vi.fn(async (request: Request) => {
      const pathname = new URL(request.url).pathname;
      // Cloudflare's default HTML handling redirects explicit .html paths to extensionless URLs.
      if (pathname.endsWith('.html')) return Response.redirect(`${origin}${pathname.slice(0, -5)}`, 307);
      return new Response(pathname);
    });
    const env = { ASSETS: { fetch } };
    expect(await (await worker.fetch(new Request(`${origin}/feedback`), env)).text()).toBe('/feedback');
    expect(await (await worker.fetch(new Request(`${origin}/play`), env)).text()).toBe('/play');
    expect(await (await worker.fetch(new Request(`${origin}/assets/game.js`), env)).text()).toBe('/assets/game.js');
    expect((await worker.fetch(new Request(`${origin}/api/feedback`), env)).status).toBe(401);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});

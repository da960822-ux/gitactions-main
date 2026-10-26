import { describe, expect, it, vi } from 'vitest';
import worker from '../../site-worker/index';

const origin = 'https://example.chatgpt.site';

describe('Site Worker routing', () => {
  it('keeps the built game and feedback HTML routes while isolating the API', async () => {
    const fetch = vi.fn(async (request: Request) => new Response(new URL(request.url).pathname));
    const env = { ASSETS: { fetch } };
    expect(await (await worker.fetch(new Request(`${origin}/feedback`), env)).text()).toBe('/feedback.html');
    expect(await (await worker.fetch(new Request(`${origin}/play`), env)).text()).toBe('/play.html');
    expect(await (await worker.fetch(new Request(`${origin}/assets/game.js`), env)).text()).toBe('/assets/game.js');
    expect((await worker.fetch(new Request(`${origin}/api/feedback`), env)).status).toBe(401);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});

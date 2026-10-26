import { handleFeedbackRequest, type FeedbackEnv } from '../src/site/feedbackApi';

export default {
  fetch(request: Request, env: FeedbackEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/feedback')) return handleFeedbackRequest(request, env);
    if (!env.ASSETS) return Promise.resolve(new Response('Assets unavailable', { status: 503 }));
    if (url.pathname === '/feedback' || url.pathname === '/play') {
      url.pathname += '.html';
      return env.ASSETS.fetch(new Request(url, request));
    }
    return env.ASSETS.fetch(request);
  },
};

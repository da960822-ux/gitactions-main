import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../core/feedback', () => ({ isFeedbackOnline: true, feedback: {} }));

import { FeedbackRoute } from './FeedbackRoute';

afterEach(() => vi.unstubAllGlobals());

describe('feedback invitation', () => {
  it('keeps an incoming space link available for an explicit join before creating a space', () => {
    const space = '11111111-1111-4111-8111-111111111111';
    vi.stubGlobal('window', { location: { search: `?space=${space}` } });
    vi.stubGlobal('localStorage', { getItem: () => null });
    const html = renderToStaticMarkup(createElement(FeedbackRoute));
    expect(html).toContain(`value="${space}"`);
    expect(html).toContain('참여 링크가 열렸어요');
    expect(html).toContain('참여하기');
    expect(html).not.toContain('Papi한테 보내기');
  });
});
